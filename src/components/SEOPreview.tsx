import React, { useState } from "react";
import { Search, Globe, Smartphone, Monitor, Share2, CheckCircle2, AlertTriangle, Info, Sparkles, Copy, Check } from "lucide-react";

interface SEOPreviewProps {
  metaTitle: string;
  metaDescription: string;
  brandName?: string;
  faviconUrl?: string;
  seoKeywords?: string;
  baseUrl?: string;
  ogImage?: string;
}

export default function SEOPreview({
  metaTitle,
  metaDescription,
  brandName = "B2bfiy",
  faviconUrl,
  seoKeywords = "",
  baseUrl = "https://b2bfiy.com",
  ogImage,
}: SEOPreviewProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile" | "social">("desktop");
  const [copied, setCopied] = useState(false);

  // Fallback defaults
  const displayBrand = brandName.trim() || "B2bfiy";
  const displayTitle = metaTitle.trim() || `${displayBrand} - Digital Agency & Creative Solutions`;
  const displayDescription =
    metaDescription.trim() ||
    "B2bfiy helps businesses build a powerful digital presence through high-converting websites, professional graphic design, engaging video content, and complete social media management.";

  // Character limit metrics
  const titleCharCount = displayTitle.length;
  const descCharCount = displayDescription.length;

  const isTitleOptimal = titleCharCount >= 40 && titleCharCount <= 60;
  const isTitleTooLong = titleCharCount > 60;
  const isTitleTooShort = titleCharCount < 40;

  const isDescOptimal = descCharCount >= 140 && descCharCount <= 160;
  const isDescTooLong = descCharCount > 160;
  const isDescTooShort = descCharCount < 140;

  // Truncated preview simulations
  const truncatedDesktopTitle =
    titleCharCount > 60 ? displayTitle.slice(0, 57) + "..." : displayTitle;
  const truncatedMobileTitle =
    titleCharCount > 65 ? displayTitle.slice(0, 62) + "..." : displayTitle;

  const truncatedDesktopDesc =
    descCharCount > 160 ? displayDescription.slice(0, 157) + "..." : displayDescription;
  const truncatedMobileDesc =
    descCharCount > 120 ? displayDescription.slice(0, 117) + "..." : displayDescription;

  // Keyword check
  const keywordsList = seoKeywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const matchedKeywordsInTitle = keywordsList.filter((k) =>
    displayTitle.toLowerCase().includes(k.toLowerCase())
  );
  const matchedKeywordsInDesc = keywordsList.filter((k) =>
    displayDescription.toLowerCase().includes(k.toLowerCase())
  );

  const handleCopyMetaTags = () => {
    const tags = `<!-- Primary Meta Tags -->\n<title>${displayTitle}</title>\n<meta name="title" content="${displayTitle}">\n<meta name="description" content="${displayDescription}">\n<meta name="keywords" content="${seoKeywords}">\n\n<!-- Open Graph / Facebook -->\n<meta property="og:type" content="website">\n<meta property="og:url" content="${baseUrl}/">\n<meta property="og:title" content="${displayTitle}">\n<meta property="og:description" content="${displayDescription}">\n\n<!-- Twitter -->\n<meta property="twitter:card" content="summary_large_image">\n<meta property="twitter:url" content="${baseUrl}/">\n<meta property="twitter:title" content="${displayTitle}">\n<meta property="twitter:description" content="${displayDescription}">`;

    navigator.clipboard.writeText(tags);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#F2E4E2] rounded-2xl p-5 shadow-2xs text-left space-y-4">
      {/* Header bar with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2E4E2]/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFF7F5] border border-[#F2E4E2] flex items-center justify-center text-[#FF2D2D]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#101828] uppercase font-mono tracking-wider">
                Live Google Search & Social SEO Preview
              </h4>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Interactive
              </span>
            </div>
            <p className="text-[10px] text-[#475467]">
              Simulates how search engine crawlers and social platforms format your site
            </p>
          </div>
        </div>

        {/* View mode buttons & copy button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex p-0.5 bg-[#FFF7F5] border border-[#F2E4E2] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                deviceMode === "desktop"
                  ? "bg-white text-[#FF2D2D] shadow-2xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop SERP</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                deviceMode === "mobile"
                  ? "bg-white text-[#FF2D2D] shadow-2xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>Mobile SERP</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("social")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                deviceMode === "social"
                  ? "bg-white text-[#FF2D2D] shadow-2xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Share2 className="w-3 h-3" />
              <span>Social Card</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyMetaTags}
            className="p-1.5 text-gray-500 hover:text-[#FF2D2D] hover:bg-[#FFF7F5] border border-[#F2E4E2] rounded-xl text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="Copy Raw HTML Meta Tags"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[10px] hidden sm:inline">{copied ? "Copied HTML!" : "Copy Tags"}</span>
          </button>
        </div>
      </div>

      {/* Main SERP View Area */}
      <div className="bg-[#f8f9fa] border border-gray-200/90 rounded-xl p-4 sm:p-5 transition-all">
        {deviceMode === "desktop" && (
          <div className="max-w-2xl space-y-2 font-sans">
            {/* Desktop URL Breadcrumb */}
            <div className="flex items-center gap-2 text-xs">
              {faviconUrl && faviconUrl.trim() ? (
                <img
                  src={faviconUrl}
                  alt="Favicon"
                  className="w-4 h-4 rounded-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-[#FF2D2D]/10 text-[#FF2D2D] flex items-center justify-center text-[9px] font-bold">
                  {displayBrand[0]}
                </div>
              )}
              <div className="flex flex-col leading-none">
                <span className="text-[12px] font-medium text-[#202124]">{displayBrand}</span>
                <span className="text-[11px] text-[#4d5156] mt-0.5">{baseUrl}</span>
              </div>
            </div>

            {/* Desktop Blue Title */}
            <h3 className="text-lg sm:text-[20px] font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug break-words">
              {truncatedDesktopTitle}
            </h3>

            {/* Desktop Snippet Description */}
            <p className="text-sm text-[#4d5156] leading-relaxed break-words">
              {truncatedDesktopDesc}
            </p>
          </div>
        )}

        {deviceMode === "mobile" && (
          <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2.5 font-sans">
            {/* Mobile Header Breadcrumb */}
            <div className="flex items-center gap-2.5">
              {faviconUrl && faviconUrl.trim() ? (
                <img
                  src={faviconUrl}
                  alt="Favicon"
                  className="w-5 h-5 rounded-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#FF2D2D]/10 text-[#FF2D2D] flex items-center justify-center text-[10px] font-bold">
                  {displayBrand[0]}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-[#202124]">{displayBrand}</span>
                <span className="text-[10px] text-[#5f6368]">{baseUrl.replace(/^https?:\/\//, "")}</span>
              </div>
            </div>

            {/* Mobile Title */}
            <h3 className="text-[16px] font-medium text-[#1a0dab] leading-snug break-words">
              {truncatedMobileTitle}
            </h3>

            {/* Mobile Snippet */}
            <p className="text-[13px] text-[#4d5156] leading-relaxed break-words">
              {truncatedMobileDesc}
            </p>
          </div>
        )}

        {deviceMode === "social" && (
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs font-sans">
            {/* Social Share Image Banner */}
            <div className="h-40 bg-gradient-to-tr from-[#101828] via-[#1f2937] to-[#FF2D2D]/80 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden text-center">
              {ogImage && ogImage.trim() ? (
                <img
                  src={ogImage}
                  alt="Social preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="relative z-10 space-y-1">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-lg text-white">
                    {displayBrand[0]}
                  </div>
                  <h5 className="font-bold text-sm tracking-wide">{displayBrand}</h5>
                  <p className="text-[11px] text-white/80 max-w-xs line-clamp-1">{displayTitle}</p>
                </div>
              )}
            </div>

            {/* Social Card Body */}
            <div className="p-3.5 space-y-1 bg-[#f8f9fa] border-t border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                {baseUrl.replace(/^https?:\/\//, "").toUpperCase()}
              </span>
              <h4 className="text-sm font-bold text-[#101828] leading-tight line-clamp-2">
                {displayTitle}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {displayDescription}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SEO Health Audit & Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Title Metric */}
        <div
          className={`p-3 rounded-xl border text-xs space-y-1 ${
            isTitleOptimal
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              : isTitleTooLong
              ? "bg-amber-50/70 border-amber-200 text-amber-900"
              : "bg-blue-50/70 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1">
              {isTitleOptimal ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>Title Length</span>
            </span>
            <span className="font-mono text-[11px]">{titleCharCount}/60</span>
          </div>
          <p className="text-[10px] opacity-85 leading-tight">
            {isTitleOptimal
              ? "Optimal length for Google SERP display (no truncation)."
              : isTitleTooLong
              ? "Exceeds 60 characters and will be clipped on SERP."
              : "A bit short. Add your key service or city for better CTR."}
          </p>
        </div>

        {/* Description Metric */}
        <div
          className={`p-3 rounded-xl border text-xs space-y-1 ${
            isDescOptimal
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              : isDescTooLong
              ? "bg-amber-50/70 border-amber-200 text-amber-900"
              : "bg-blue-50/70 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1">
              {isDescOptimal ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>Description Length</span>
            </span>
            <span className="font-mono text-[11px]">{descCharCount}/160</span>
          </div>
          <p className="text-[10px] opacity-85 leading-tight">
            {isDescOptimal
              ? "Perfect length (140-160 chars) for maximum snippet real-estate."
              : isDescTooLong
              ? "Exceeds 160 characters and will be truncated with '...'."
              : "Under 140 chars. Elaborate on your unique value."}
          </p>
        </div>

        {/* Keyword Presence Metric */}
        <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 text-xs space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FF2D2D]" />
              <span>Keyword Density</span>
            </span>
            <span className="font-mono text-[11px]">
              {matchedKeywordsInTitle.length + matchedKeywordsInDesc.length} matched
            </span>
          </div>
          <p className="text-[10px] text-gray-600 leading-tight">
            {keywordsList.length === 0
              ? "Add keywords below to track relevance in title & description."
              : `${matchedKeywordsInTitle.length} in title, ${matchedKeywordsInDesc.length} in description.`}
          </p>
        </div>
      </div>

      {/* Dynamic XML Sitemap Status & Tool Bar */}
      <div className="p-3.5 bg-[#FFF7F5] border border-[#F2E4E2] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#F2E4E2] flex items-center justify-center text-[#FF2D2D] shrink-0 mt-0.5 sm:mt-0">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#101828]">Dynamic XML Sitemap Active</span>
              <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md font-bold">
                /sitemap.xml
              </span>
            </div>
            <p className="text-[10px] text-[#475467] mt-0.5">
              Automatically generated XML feed indexing all site pages, portfolio projects, and project artwork for Google Search Console.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-[#F2E4E2] text-[#101828] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>View sitemap.xml</span>
            <Share2 className="w-3 h-3 text-[#FF2D2D]" />
          </a>
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/sitemap.xml`;
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-[#FF2D2D] hover:bg-[#E02424] text-white"
            }`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied to Clipboard!" : "Copy Sitemap URL"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
