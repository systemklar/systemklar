/** Returnerer embed-URL til iframe, eller null hvis URL ikke genkendes. */
export function toVideoEmbedUrl(url: string): string | null {
  const u = url.trim();
  const yt = u.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  if (yt?.[1]) {
    return `https://www.youtube.com/embed/${yt[1]}`;
  }
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm?.[1]) {
    return `https://player.vimeo.com/video/${vm[1]}`;
  }
  return null;
}
