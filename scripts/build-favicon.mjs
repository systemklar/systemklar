import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Source: original screenshot of the brand blue SK on a near-white background.
const SOURCE = fileURLToPath(
  new URL(
    "../../../.cursor/projects/Users-benjamin-Documents/assets/Sk_rmbillede_2026-05-09_kl._00.38.16-58ef4174-889a-4dfb-be54-1765a071d6c5.png",
    import.meta.url,
  ),
);

const FAVICON_SIZE = 256;
const PADDING = 12;
const ICO_SIZE = 64;

// Remove a near-white background by setting alpha proportional to how white a
// pixel is and pre-multiplying the RGB channels. This avoids the white halo
// that a hard threshold leaves on anti-aliased edges.
async function loadKeyedSk() {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const whiteness = Math.min(r, g, b);
    const alpha = 255 - whiteness;

    if (alpha <= 0) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      continue;
    }

    data[i] = Math.min(255, Math.round(((r - whiteness) * 255) / alpha));
    data[i + 1] = Math.min(255, Math.round(((g - whiteness) * 255) / alpha));
    data[i + 2] = Math.min(255, Math.round(((b - whiteness) * 255) / alpha));
    data[i + 3] = alpha;
  }

  return sharp(data, { raw: info })
    .trim({ threshold: 5 })
    .resize(FAVICON_SIZE - PADDING * 2, FAVICON_SIZE - PADDING * 2, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: PADDING,
      bottom: PADDING,
      left: PADDING,
      right: PADDING,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Monochrome glyph for SystemklarLogo CSS filters and email header invert. */
async function buildLogoGlyph(coloredPng) {
  const { data, info } = await sharp(coloredPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }

  return sharp(data, { raw: info }).png({ compressionLevel: 9 }).toBuffer();
}

function buildIco(pngForIco) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(ICO_SIZE >= 256 ? 0 : ICO_SIZE, 0);
  entry.writeUInt8(ICO_SIZE >= 256 ? 0 : ICO_SIZE, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngForIco.length, 8);
  entry.writeUInt32LE(dir.length + entry.length, 12);

  return Buffer.concat([dir, entry, pngForIco]);
}

async function main() {
  const png = await loadKeyedSk();
  const logoGlyph = await buildLogoGlyph(png);
  const icoPng = await sharp(png).resize(ICO_SIZE, ICO_SIZE).png().toBuffer();
  const ico = buildIco(icoPng);

  writeFileSync("public/logo.png", logoGlyph);

  for (const target of [
    "public/icon.png",
    "src/app/icon.png",
    "src/app/apple-icon.png",
  ]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, png);
  }

  for (const target of ["public/favicon.ico", "src/app/favicon.ico"]) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, ico);
  }
}

await main();
