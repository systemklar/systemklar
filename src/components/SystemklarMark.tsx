import type { CSSProperties } from "react";

const LOGO_SRC_WIDTH = 256;
const LOGO_SRC_HEIGHT = 256;

type SystemklarMarkProps = {
  size?: number;
  /** Circle avatar with navy background and white mark */
  variant?: "plain" | "avatar";
  className?: string;
};

export function SystemklarMark({ size = 24, variant = "plain", className = "" }: SystemklarMarkProps) {
  const imgWidthAttr = Math.max(1, Math.round((size * LOGO_SRC_WIDTH) / LOGO_SRC_HEIGHT));
  const isAvatar = variant === "avatar";

  const imgStyle: CSSProperties = {
    display: "block",
    height: isAvatar ? Math.round(size * 0.55) : size,
    width: "auto",
    filter: isAvatar
      ? "brightness(0) invert(1)"
      : "sepia(1) saturate(1.5) hue-rotate(180deg) brightness(0.7)",
    WebkitFilter: isAvatar
      ? "brightness(0) invert(1)"
      : "sepia(1) saturate(1.5) hue-rotate(180deg) brightness(0.7)",
  };

  const inner = (
    // eslint-disable-next-line @next/next/no-img-element -- brand PNG
    <img src="/logo.png" alt="" width={imgWidthAttr} height={size} style={imgStyle} />
  );

  if (isAvatar) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#0A1628] ${className}`.trim()}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {inner}
      </span>
    );
  }

  return <span className={`inline-flex shrink-0 items-center ${className}`.trim()}>{inner}</span>;
}
