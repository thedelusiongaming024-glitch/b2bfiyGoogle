/**
 * Utility to normalize, optimize, and speed up image URLs
 * Especially converts slow Google Drive page links into high-speed Google thumbnail CDN links.
 */
export function optimizeImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();

  if (!trimmed) return "";

  // 1. Base64 Data URLs - return as is
  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  // 2. Google Drive Links Transformation
  // Handles:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?export=view&id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  // - https://lh3.googleusercontent.com/d/FILE_ID
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]{25,})/;
  const driveMatch = trimmed.match(driveRegex);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    // Return high-speed Google Drive thumbnail CDN URL (sz=w1600 provides crisp high-resolution)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }

  // 3. Dropbox Direct Download Link
  if (trimmed.includes("dropbox.com")) {
    return trimmed.replace(/\?dl=0$/, "?raw=1").replace("&dl=0", "&raw=1");
  }

  // 4. Imgur Direct Link Fix
  if (trimmed.includes("imgur.com") && !trimmed.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    const parts = trimmed.split("/");
    const id = parts[parts.length - 1]?.split(".")[0];
    if (id && id.length >= 5) {
      return `https://i.imgur.com/${id}.jpg`;
    }
  }

  return trimmed;
}

/**
 * Preloads a list of image URLs in the background for snappy user transitions
 */
export function preloadImages(urls: string[]) {
  if (typeof window === "undefined") return;
  urls.forEach((rawUrl) => {
    const url = optimizeImageUrl(rawUrl);
    if (!url) return;
    const img = new Image();
    img.src = url;
  });
}
