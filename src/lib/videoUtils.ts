/**
 * Utility for parsing, formatting, and embedding video URLs across YouTube, Drive, Vimeo, direct MP4, etc.
 */

export interface ParsedVideo {
  type: "direct" | "youtube" | "vimeo" | "drive" | "iframe";
  embedUrl: string;
  isDirectFile: boolean;
}

export function parseVideoUrl(rawUrl?: string, rawEmbed?: string): ParsedVideo | null {
  const url = (rawEmbed || rawUrl || "").trim();
  if (!url) return null;

  // 1. Direct video files or base64 video data URLs
  if (
    url.startsWith("data:video/") ||
    /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url)
  ) {
    return {
      type: "direct",
      embedUrl: url,
      isDirectFile: true,
    };
  }

  // 2. YouTube URLs (watch, shorts, share, embed)
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`,
      isDirectFile: false,
    };
  }

  // 3. Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      isDirectFile: false,
    };
  }

  // 4. Google Drive Video
  const driveMatch = url.match(
    /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]{25,})/i
  );
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      type: "drive",
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      isDirectFile: false,
    };
  }

  // 5. Fallback as embed iframe
  return {
    type: "iframe",
    embedUrl: url,
    isDirectFile: false,
  };
}
