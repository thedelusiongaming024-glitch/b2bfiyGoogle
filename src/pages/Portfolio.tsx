import React, { useState, useMemo, useEffect } from "react";
import { Search, ChevronRight, CheckCircle2, SlidersHorizontal, ImageOff, ArrowRight, Play } from "lucide-react";
import { motion } from "motion/react";
import { PortfolioProject, SiteContent } from "../types";
import { useLanguage } from "../lib/LanguageContext";
import ImageWithSkeleton from "../components/ImageWithSkeleton";
import VideoModal from "../components/VideoModal";
import { preloadImages } from "../lib/imageUtils";

interface PortfolioProps {
  setRoute: (route: string, extraParam?: string) => void;
  setSelectedProjectSlug: (slug: string) => void;
  portfolios: PortfolioProject[];
  siteContent: SiteContent;
}

export default function Portfolio({ setRoute, setSelectedProjectSlug, portfolios, siteContent }: PortfolioProps) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Graphic Design");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("All Videos");
  const [activeVideoProject, setActiveVideoProject] = useState<PortfolioProject | null>(null);

  const categories = ["Graphic Design", "Video Editing", "Website Development", "Social Media Management"];

  const filteredPortfolios = useMemo(() => {
    return portfolios.filter((project) => {
      if (!project.published) return false;
      const matchesCategory = project.category === selectedCategory;
      
      // Filter by subCategory if category is Video Editing
      let matchesSubCategory = true;
      if (selectedCategory === "Video Editing") {
        if (selectedSubCategory && selectedSubCategory !== "All Videos" && selectedSubCategory !== "All") {
          matchesSubCategory = project.subCategory === selectedSubCategory;
        }
      }

      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesCategory && matchesSubCategory && matchesSearch;
    });
  }, [portfolios, selectedCategory, selectedSubCategory, searchQuery]);

  const handleProjectClick = (slug: string) => {
    setSelectedProjectSlug(slug);
    setRoute("portfolio-detail", slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Preload portfolio images in background for instant display
  useEffect(() => {
    if (portfolios && portfolios.length > 0) {
      const urls = portfolios.map((p) => p.thumbnail);
      preloadImages(urls);
    }
  }, [portfolios]);

  return (
    <div className="bg-transparent min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-sm font-bold text-[#FF2D2D] uppercase tracking-widest bg-[#FFE8E5] dark:bg-red-950/50 px-4 py-1.5 rounded-full inline-block">
            {t("Our Works", "আমাদের কাজসমূহ")}
          </span>
          <h1 className="text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight sm:text-5xl">
            {t("Real Projects. Proven Business Results.", "বাস্তব প্রজেক্ট। নিশ্চিত ব্যবসায়িক ফলাফল।")}
          </h1>
          <p className="text-[#475467] dark:text-gray-300 text-base sm:text-lg">
            {t("We don't deal in empty promises. Explore the high-converting web experiences, visual identities, and social media campaigns we have designed and successfully deployed.", "আমরা ফাঁকা প্রতিশ্রুতিতে বিশ্বাসী নই। আমাদের ডিজাইন করা এবং সফলভাবে চালু করা হাই-কনভার্টিং ওয়েবসাইট, ভিজ্যুয়াল ডিজাইন এবং সোশ্যাল মিডিয়া ক্যাম্পেইনগুলো দেখুন।")}
          </p>
        </div>
 
        {/* Filters and Search Bar Container */}
        <div className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center">
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubCategory("All Videos");
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#FF2D2D] text-white shadow-xs"
                      : "bg-white dark:bg-gray-700 text-[#475467] dark:text-gray-300 border border-[#F2E4E2] dark:border-gray-600 hover:bg-[#FFE8E5] dark:hover:bg-red-950/40 hover:text-[#FF2D2D]"
                  }`}
                >
                  {t(cat)}
                </button>
              );
            })}
          </div>
 
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#475467] dark:text-gray-400" />
            <input
              type="text"
              placeholder={t("Search by project, tool, tag...", "প্রজেক্ট, টুলস বা ট্যাগ দিয়ে খুঁজুন...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-full focus:ring-2 focus:ring-[#FF2D2D] focus:border-transparent outline-none bg-white dark:bg-gray-900 text-xs text-[#101828] dark:text-white"
            />
          </div>
 
        </div>
 
        {/* Video Editing Sub-Categories */}
        {selectedCategory === "Video Editing" && (
          <div className="flex flex-wrap gap-2 justify-center bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 p-4 rounded-2xl shadow-sm max-w-lg mx-auto items-center">
            <span className="text-[10px] font-bold text-[#475467] dark:text-gray-300 uppercase tracking-wider mr-2">{t("Video Types:", "ভিডিওর ধরন:")}</span>
            {["All Videos", "Motion Video", "Reels", "Long Video"].map((sub) => {
              const isActive = selectedSubCategory === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#FF2D2D] text-white shadow-xs"
                      : "bg-white dark:bg-gray-700 text-[#475467] dark:text-gray-300 border border-[#F2E4E2] dark:border-gray-600 hover:bg-[#FFE8E5] dark:hover:bg-red-950/40 hover:text-[#FF2D2D]"
                  }`}
                >
                  {t(sub)}
                </button>
              );
            })}
          </div>
        )}
 
        {/* Portfolio Dynamic Grid List */}
        {filteredPortfolios.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 rounded-3xl p-16 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FFE8E5] dark:bg-red-950/50 text-[#FF2D2D] flex items-center justify-center mx-auto">
              <ImageOff className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#101828] dark:text-white">{t("No Projects Located", "কোনো প্রজেক্ট পাওয়া যায়নি")}</h3>
            <p className="text-xs text-[#475467] dark:text-gray-300">
              {language === "en" 
                ? `We couldn't locate any published projects matching category "${selectedCategory}" with search term "${searchQuery}". Try modifying your filters.`
                : `ক্যাটাগরি "${t(selectedCategory)}" এবং অনুসন্ধান শব্দ "${searchQuery}" এর সাথে মিলে এমন কোনো প্রজেক্ট পাওয়া যায়নি। অন্য ফিল্টার চেষ্টা করুন।`}
            </p>
            <button
              onClick={() => {
                setSelectedCategory("Graphic Design");
                setSelectedSubCategory("All Videos");
                setSearchQuery("");
              }}
              className="px-5 py-2.5 bg-[#FF2D2D] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {t("Reset Filters", "ফিল্টার রিসেট করুন")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPortfolios.map((project) => {
              const isVideo = project.category === "Video Editing" || !!project.videoUrl || !!project.videoEmbed;

              return (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project.slug || project.id)}
                  className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer text-left flex flex-col h-full group"
                >
                  
                  {/* Image Wrap */}
                  <div className={`relative bg-[#FFF7F5] dark:bg-neutral-900/40 overflow-hidden border-b border-[#F2E4E2] dark:border-gray-700 flex items-center justify-center ${
                    project.category === "Video Editing"
                      ? project.subCategory === "Reels"
                        ? "aspect-[9/16]"
                        : project.subCategory === "Motion Video"
                        ? "aspect-square"
                        : "aspect-video"
                      : "aspect-square"
                  }`}>
                    <ImageWithSkeleton
                      src={project.thumbnail}
                      alt={project.title}
                      imageFit={project.imageFit}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-20">
                      <span className="bg-[#101828]/95 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md">
                        {t(project.category)}
                      </span>
                      {project.featured && (
                        <span className="bg-[#FF2D2D] text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md">
                          {t("Featured Case Study", "ফিচার্ড কেস স্টাডি")}
                        </span>
                      )}
                    </div>

                    {/* Play button overlay for video projects */}
                    {isVideo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideoProject(project);
                        }}
                        className="absolute inset-0 bg-black/30 hover:bg-black/45 flex items-center justify-center transition-colors cursor-pointer group/play z-10"
                        aria-label="Play video"
                      >
                        <div className="relative flex items-center justify-center">
                          <span className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF2D2D]/40 animate-ping pointer-events-none" />
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF2D2D] text-white flex items-center justify-center shadow-[0_0_30px_rgba(255,45,45,0.85)] border-2 border-white/90 group-hover/play:scale-110 transition-transform duration-300">
                            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white ml-1" />
                          </div>
                        </div>
                        <span className="absolute bottom-3 bg-black/80 text-white text-[10px] font-extrabold px-3 py-1 rounded-full border border-white/20 flex items-center space-x-1 shadow-md backdrop-blur-xs">
                          <Play className="w-3 h-3 fill-[#FF2D2D] text-[#FF2D2D]" />
                          <span>{t("Click to Play Video", "ভিডিও দেখুন")}</span>
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Info Block */}
                  <div className="p-6 flex flex-col flex-grow justify-between space-y-6">
                    
                    <div className="space-y-3">
                      <span className="text-[10px] text-[#475467] dark:text-gray-400 font-bold uppercase tracking-wider font-mono block">
                        {t("Client:", "ক্লায়েন্ট:")} {project.clientName}
                      </span>
                      <h3 className="text-lg font-extrabold text-[#101828] dark:text-white group-hover:text-[#FF2D2D] transition-colors line-clamp-1">
                        {project.title}
                      </h3>
                      <p className="text-xs text-[#475467] dark:text-gray-300 leading-relaxed line-clamp-2">
                        {project.shortDescription}
                      </p>
                      
                      {/* Tags List */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.tags && project.tags.slice(0, 3).map((tag, tIdx) => (
                          <span key={tIdx} className="text-[10px] font-semibold text-[#475467] dark:text-gray-300 bg-white/70 dark:bg-gray-700/70 px-2.5 py-1 rounded border border-[#F2E4E2] dark:border-gray-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#F2E4E2] dark:border-gray-700 flex items-center justify-between text-xs text-[#FF2D2D] font-bold">
                      {isVideo ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveVideoProject(project);
                          }}
                          className="px-3.5 py-1.5 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                          <span>{t("Play Video", "ভিডিও দেখুন")}</span>
                        </button>
                      ) : (
                        <span>{t("Analyze Case Study Result", "কেস স্টাডি ফলাফল বিশ্লেষণ করুন")}</span>
                      )}
                      <div className="flex items-center space-x-1">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">{t("Read Study", "কেস স্টাডি পড়ুন")}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

        {selectedCategory === "Graphic Design" && (
          <div className="flex justify-center pt-8">
            <motion.a
              href={siteContent.viewAllGraphicsLink || "https://www.behance.net"}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0px 10px 30px rgba(255, 45, 45, 0.2)"
              }}
              whileTap={{ scale: 0.95 }}
              animate={{
                y: [0, -3, 0]
              }}
              transition={{
                y: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-[#FF2D2D] text-[#FF2D2D] hover:bg-[#FFE8E5] dark:hover:bg-red-950/40 text-sm font-extrabold rounded-full transition-all inline-flex items-center gap-2.5 cursor-pointer shadow-md"
            >
              <span>{t("View All Graphics Design", "সকল গ্রাফিক্স ডিজাইন দেখুন")}</span>
              <motion.span
                animate={{
                  x: [0, 4, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-block"
              >
                <ArrowRight className="w-4 h-4 text-[#FF2D2D]" />
              </motion.span>
            </motion.a>
          </div>
        )}

        {/* Video Modal Popup */}
        {activeVideoProject && (
          <VideoModal
            isOpen={!!activeVideoProject}
            onClose={() => setActiveVideoProject(null)}
            videoUrl={activeVideoProject.videoUrl}
            videoEmbed={activeVideoProject.videoEmbed}
            title={activeVideoProject.title}
            clientName={activeVideoProject.clientName}
            category={activeVideoProject.category}
            subCategory={activeVideoProject.subCategory}
            onViewDetails={() => handleProjectClick(activeVideoProject.slug || activeVideoProject.id)}
          />
        )}

      </div>
    </div>
  );
}
