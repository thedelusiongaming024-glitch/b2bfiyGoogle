import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Play, Film, ExternalLink, Sparkles } from "lucide-react";
import { parseVideoUrl } from "../lib/videoUtils";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  videoEmbed?: string;
  title: string;
  clientName?: string;
  category?: string;
  subCategory?: string;
  onViewDetails?: () => void;
}

export default function VideoModal({
  isOpen,
  onClose,
  videoUrl,
  videoEmbed,
  title,
  clientName,
  category = "Video Editing",
  subCategory,
  onViewDetails,
}: VideoModalProps) {
  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const parsedVideo = parseVideoUrl(videoUrl, videoEmbed);

  // Aspect ratio styling based on subCategory
  const getContainerRatio = () => {
    if (subCategory === "Reels") {
      return "aspect-[9/16] max-w-[340px] sm:max-w-[380px] h-[75vh]";
    }
    if (subCategory === "Motion Video") {
      return "aspect-square max-w-[500px] max-h-[75vh]";
    }
    return "aspect-video w-full max-w-4xl";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Dark Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Content Box */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="relative bg-[#0F172A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl w-full max-w-5xl z-10 flex flex-col my-auto max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF2D2D]/20 border border-[#FF2D2D]/40 text-[#FF2D2D] flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF2D2D] bg-[#FF2D2D]/10 px-2 py-0.5 rounded">
                      {category} {subCategory ? `• ${subCategory}` : ""}
                    </span>
                    {clientName && (
                      <span className="text-[10px] text-gray-400 font-semibold hidden sm:inline-block">
                        Client: {clientName}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white line-clamp-1">
                    {title}
                  </h3>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#FF2D2D] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close video modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Body */}
            <div className="p-4 sm:p-6 flex-1 flex items-center justify-center bg-black/60 overflow-hidden min-h-[300px]">
              {parsedVideo ? (
                <div
                  className={`relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 mx-auto ${getContainerRatio()}`}
                >
                  {parsedVideo.isDirectFile ? (
                    <video
                      src={parsedVideo.embedUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <iframe
                      src={parsedVideo.embedUrl}
                      title={title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0 bg-black"
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-12 px-4 space-y-3 max-w-md">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
                    <Sparkles className="w-6 h-6 text-[#FF2D2D]" />
                  </div>
                  <h4 className="text-white font-bold text-base">Video Coming Soon</h4>
                  <p className="text-xs text-gray-400">
                    The video for this project hasn't been added yet.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-white/5 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-gray-400">
                Playing in HD quality • B2bfiy Creative Portfolio
              </span>

              <div className="flex items-center space-x-3">
                {onViewDetails && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewDetails();
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <span>View Case Study</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  Close Player
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
