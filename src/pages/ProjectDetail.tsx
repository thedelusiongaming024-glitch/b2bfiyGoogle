import React, { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, Calendar, User, Tag, ShieldCheck, Trophy, Sparkles, Youtube, Film, Play, DollarSign } from "lucide-react";
import { PortfolioProject } from "../types";
import { useLanguage } from "../lib/LanguageContext";
import ImageWithSkeleton from "../components/ImageWithSkeleton";
import { parseVideoUrl } from "../lib/videoUtils";

interface ProjectDetailProps {
  setRoute: (route: string, extraParam?: string) => void;
  slug: string;
  portfolios: PortfolioProject[];
}

// Maps a portfolio project's display category to the matching Packages page
// pricing tab/category key, so the "View Pricing" CTA below always lands on
// the correct set of packages for that project's type of work.
const CATEGORY_TO_PACKAGE_TYPE: Record<PortfolioProject["category"], "website" | "graphic" | "video" | "monthly"> = {
  "Website Development": "website",
  "Graphic Design": "graphic",
  "Video Editing": "video",
  "Social Media Management": "monthly",
};

export default function ProjectDetail({ setRoute, slug, portfolios }: ProjectDetailProps) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const normalizedSlug = (slug || "").trim().toLowerCase();
  const project = portfolios.find(
    (p) =>
      p.slug === slug ||
      p.id === slug ||
      p.slug.toLowerCase() === normalizedSlug ||
      p.id.toLowerCase() === normalizedSlug
  );
  const parsedVideo = project ? parseVideoUrl(project.videoUrl, project.videoEmbed) : null;
  const packageCategoryKey = project ? CATEGORY_TO_PACKAGE_TYPE[project.category] : undefined;

  useEffect(() => {
    if (!project) return;

    const pageTitle = project.seoTitle || `${project.title} | Case Study - B2bfiy Dhaka`;
    const pageDesc = project.seoDescription || project.shortDescription || `Case study: ${project.title} by B2bfiy - premier digital agency in Dhaka.`;
    const pageKeywords = (project.tags && project.tags.length > 0)
      ? `${project.tags.join(", ")}, ${project.category}, digital marketing agency Dhaka`
      : `case study, ${project.category}, digital marketing Dhaka, B2bfiy`;

    document.title = pageTitle;

    const updateMeta = (selector: string, attr: string, value: string) => {
      let tag = document.querySelector(selector);
      if (tag) {
        tag.setAttribute(attr, value);
      }
    };

    updateMeta('meta[name="description"]', "content", pageDesc);
    updateMeta('meta[name="keywords"]', "content", pageKeywords);
    updateMeta('meta[property="og:title"]', "content", pageTitle);
    updateMeta('meta[property="og:description"]', "content", pageDesc);
    updateMeta('meta[name="twitter:title"]', "content", pageTitle);
    updateMeta('meta[name="twitter:description"]', "content", pageDesc);

    if (project.thumbnail) {
      updateMeta('meta[property="og:image"]', "content", project.thumbnail);
    }

    // Inject CreativeWork schema
    const scriptId = "project-structured-data";
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = scriptId;
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": project.title,
      "headline": project.seoTitle || project.title,
      "description": pageDesc,
      "creator": {
        "@type": "Organization",
        "name": "B2bfiy",
        "url": "https://b2bfiy.com"
      },
      "image": project.thumbnail || "",
      "dateCreated": project.projectDate || "2026-01-01",
      "keywords": pageKeywords,
      "about": project.category
    });

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [project]);

  const handleViewPricingClick = () => {
    if (!packageCategoryKey) return;
    setRoute("packages", packageCategoryKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackClick = () => {
    setRoute("portfolio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!project) {
    return (
      <div className="bg-transparent min-h-screen py-20 flex items-center justify-center">
        <div className="bg-white border border-[#F2E4E2] p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <span className="text-3xl block font-extrabold text-[#FF2D2D]">404</span>
          <h2 className="text-xl font-bold text-[#101828]">{t("Project Not Located")}</h2>
          <p className="text-xs text-[#475467]">
            {t("We apologize, but the requested project case study could not be located in our dynamic registry.")}
          </p>
          <button
            onClick={handleBackClick}
            className="px-6 py-2.5 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            {t("Return to Portfolio")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent min-h-screen py-12 md:py-20 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Back navigation button link */}
        <button
          onClick={handleBackClick}
          className="inline-flex items-center space-x-2 text-sm font-bold text-[#FF2D2D] hover:text-[#FF5757] group cursor-pointer focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t("Back to Portfolio Collection")}</span>
        </button>

        {/* Hero split section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left: Heading details and parameters list */}
          <div className="space-y-6">
            
            <div className="space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFE8E5] text-xs font-bold text-[#FF2D2D]">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {t(project.category)}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#101828] leading-tight font-display">
                {t(project.title)}
              </h1>
              <p className="text-[#475467] text-base leading-relaxed">
                {t(project.shortDescription)}
              </p>
            </div>

            {/* Quick stats grid metadata panel */}
            <div className="bg-white border border-[#F2E4E2] p-5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#475467] flex items-center space-x-1">
                  <User className="w-3 h-3 text-[#FF2D2D]" />
                  <span>{t("Client Name")}</span>
                </span>
                <p className="text-xs font-extrabold text-[#101828]">{t(project.clientName)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#475467] flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-[#FF2D2D]" />
                  <span>{t("Completion Date")}</span>
                </span>
                <p className="text-xs font-extrabold text-[#101828]">{project.projectDate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#475467] flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-[#FF2D2D]" />
                  <span>{t("Niche Tag")}</span>
                </span>
                <p className="text-xs font-extrabold text-[#101828]">{t(project.tags?.[0] || "Marketing")}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#475467] flex items-center space-x-1">
                  <Trophy className="w-3 h-3 text-[#FF2D2D]" />
                  <span>{t("Status State")}</span>
                </span>
                <p className="text-xs font-extrabold text-[#101828]">{t("Delivered")}</p>
              </div>

            </div>

            {/* Live CTA button */}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-sm font-bold rounded-xl shadow-md transition-colors"
              >
                <span>{t("Launch Live Website / View Demo")}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* View pricing for this project's service category */}
            {packageCategoryKey && (
              <button
                type="button"
                onClick={handleViewPricingClick}
                className={`inline-flex items-center space-x-2 px-6 py-3.5 text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer ${
                  project.liveUrl
                    ? "bg-white border border-[#FF2D2D] text-[#FF2D2D] hover:bg-[#FFE8E5] ml-3"
                    : "bg-[#FF2D2D] hover:bg-[#FF5757] text-white"
                }`}
              >
                <span>{t(`View ${project.category} Pricing`, `${t(project.category)} প্যাকেজ ও মূল্য দেখুন`)}</span>
                <DollarSign className="w-4 h-4" />
              </button>
            )}

            {/* Video preview / Embed block if present */}
            {project.videoEmbed ? (
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-bold text-[#101828] uppercase flex items-center space-x-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <span>{t("Dynamic Video Case Embed")}</span>
                </h3>
                <div className={`${
                  project.category === "Video Editing"
                    ? project.subCategory === "Reels"
                      ? "aspect-[9/16] max-w-[300px]"
                      : project.subCategory === "Motion Video"
                      ? "aspect-square max-w-[450px]"
                      : "aspect-video w-full"
                    : "aspect-video w-full"
                } rounded-2xl overflow-hidden border border-[#F2E4E2] bg-black mx-auto shadow-sm`}>
                  <iframe
                    src={project.videoEmbed}
                    title={`${project.title} Video Preview`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            ) : project.category === "Video Editing" ? (
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-bold text-[#101828] uppercase flex items-center space-x-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <span>{t("Video Case Embed")}</span>
                </h3>
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[#F2E4E2] bg-[#FFF7F5] mx-auto shadow-sm flex flex-col items-center justify-center text-center px-6 py-10 gap-2">
                  <Youtube className="w-8 h-8 text-[#FF2D2D]/50" />
                  <p className="text-sm font-bold text-[#101828]">{t("Video Coming Soon")}</p>
                  <p className="text-xs text-[#667085]">{t("The video for this project hasn't been added yet.")}</p>
                </div>
              </div>
            ) : null}

          </div>

          {/* Right: Primary image / video showcase */}
          <div className="space-y-4">
            <div className="bg-white border border-[#F2E4E2] p-3 rounded-3xl shadow-md">
              <div className={`relative w-full rounded-2xl overflow-hidden bg-[#FFF7F5] dark:bg-neutral-900/40 flex items-center justify-center mx-auto ${
                project.category === "Video Editing"
                  ? project.subCategory === "Reels"
                    ? "aspect-[9/16] max-w-[340px]"
                    : project.subCategory === "Motion Video"
                    ? "aspect-square"
                    : "aspect-video"
                  : "aspect-square"
              }`}>
                {parsedVideo && isPlaying ? (
                  parsedVideo.isDirectFile ? (
                    <video
                      src={parsedVideo.embedUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <iframe
                      src={parsedVideo.embedUrl}
                      title={`${project.title} Video Player`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0 bg-black"
                    />
                  )
                ) : (
                  <>
                    <ImageWithSkeleton
                      src={project.thumbnail}
                      alt={project.title}
                      imageFit={project.imageFit}
                      className="w-full h-full"
                    />
                    
                    {parsedVideo && (
                      <button
                        type="button"
                        onClick={() => setIsPlaying(true)}
                        className="absolute inset-0 bg-black/30 hover:bg-black/45 flex items-center justify-center transition-colors cursor-pointer group/play z-10"
                        aria-label="Play video"
                      >
                        <div className="relative flex items-center justify-center">
                          <span className="absolute w-20 h-20 rounded-full bg-[#FF2D2D]/40 animate-ping pointer-events-none" />
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF2D2D] text-white flex items-center justify-center shadow-[0_0_35px_rgba(255,45,45,0.9)] border-2 border-white group-hover/play:scale-110 transition-transform duration-300">
                            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-1" />
                          </div>
                        </div>
                        <span className="absolute bottom-4 bg-black/80 text-white text-xs font-extrabold px-4 py-1.5 rounded-full border border-white/20 flex items-center space-x-1.5 shadow-lg backdrop-blur-xs">
                          <Play className="w-3.5 h-3.5 fill-[#FF2D2D] text-[#FF2D2D]" />
                          <span>{t("Click to Play Video", "ভিডিওটি প্লে করুন")}</span>
                        </span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Multiple gallery screenshots if present */}
            {project.gallery && project.gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {project.gallery.map((imgUrl, gIdx) => (
                  <a
                    key={gIdx}
                    href={imgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-[#F2E4E2] p-1.5 rounded-xl bg-white block overflow-hidden hover:border-[#FF2D2D]/40 transition-colors"
                  >
                    <ImageWithSkeleton
                      src={imgUrl}
                      alt={`Gallery Asset ${gIdx}`}
                      imageFit={project.imageFit}
                      className="w-full aspect-video rounded-lg"
                    />
                  </a>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Detailed Written Deep-Dive sections */}
        <hr className="border-[#F2E4E2]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Main narrative story */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Context Story */}
            <div className="bg-white border border-[#F2E4E2] p-8 rounded-3xl space-y-4">
              <h2 className="text-xl font-extrabold text-[#101828] font-display flex items-center space-x-2">
                <span className="w-1.5 h-6 rounded bg-[#FF2D2D]" />
                <span>{t("Executive Case Summary")}</span>
              </h2>
              <p className="text-sm text-[#475467] leading-relaxed whitespace-pre-wrap">
                {t(project.fullDescription)}
              </p>
            </div>

            {/* Challenge & Solution Double Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="bg-white border border-[#FFE8E5] p-6 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block">{t("The Client's Obstacle")}</span>
                <p className="text-xs text-[#475467] leading-relaxed">
                  {t(project.clientChallenge)}
                </p>
              </div>

              <div className="bg-white border border-emerald-100 p-6 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">{t("B2bfiy's Architectural Solution")}</span>
                <p className="text-xs text-[#475467] leading-relaxed">
                  {t(project.ourSolution)}
                </p>
              </div>

            </div>

            {/* Work process step-by-step timeline */}
            {project.workProcess && project.workProcess.length > 0 && (
              <div className="bg-white border border-[#F2E4E2] p-8 rounded-3xl space-y-4">
                <h3 className="text-base font-bold text-[#101828] uppercase tracking-wide">
                  {t("Strategic Deployment Stages:")}
                </h3>
                <div className="space-y-4">
                  {project.workProcess.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-start space-x-3 text-sm text-[#475467]">
                      <span className="w-6 h-6 rounded-full bg-[#FFE8E5] text-[#FF2D2D] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {sIdx + 1}
                      </span>
                      <p className="pt-0.5">{t(step)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right sidebar: Results and technologies */}
          <div className="space-y-6">
            
            {/* The Results Box */}
            <div className="bg-[#101828] text-white p-8 rounded-3xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#FF2D2D] rounded-full blur-3xl opacity-40 pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-[#FF2D2D] text-white flex items-center justify-center font-bold text-lg">
                🏆
              </div>
              <h3 className="text-lg font-bold">{t("Measurable Results")}</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {t(project.projectResult)}
              </p>
            </div>

            {/* Technologies Tag clouds */}
            <div className="bg-white border border-[#F2E4E2] p-6 rounded-2xl space-y-4 text-left">
              <h4 className="text-xs font-bold text-[#101828] uppercase tracking-wider block">{t("Tools & Technologies:")}</h4>
              <div className="flex flex-wrap gap-1.5">
                {project.technologies && project.technologies.map((tech, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-xs font-semibold text-[#101828] bg-[#FFF7F5] border border-[#F2E4E2] px-3 py-1 rounded-full"
                  >
                    {t(tech)}
                  </span>
                ))}
              </div>
            </div>

            {/* Support Guarantee box */}
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-start space-x-3 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-800 block">{t("Verified Success Case")}</span>
                <p className="text-[11px] text-emerald-600">{t("This work is fully verified by the respective corporate entity.")}</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
