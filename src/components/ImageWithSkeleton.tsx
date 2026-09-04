import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { optimizeImageUrl } from "../lib/imageUtils";

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  imageFit?: "cover" | "contain";
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  priority?: boolean;
}

export default function ImageWithSkeleton({
  src,
  alt,
  className = "",
  containerClassName = "",
  imageFit = "cover",
  referrerPolicy = "no-referrer",
  priority = true, // Default to true for snappy rendering
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimizedSrc = optimizeImageUrl(src);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    // If image is already cached by browser or complete
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    }

    // Fallback safety timeout (max 1.5s skeleton) so images are NEVER stuck hidden
    const safetyTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);

    return () => clearTimeout(safetyTimer);
  }, [src, optimizedSrc]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
      {/* Skeleton Shimmer Overlay */}
      <AnimatePresence mode="popLayout">
        {!isLoaded && !hasError && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#FFE8E5] dark:bg-neutral-800 flex items-center justify-center z-10"
          >
            {/* Shimmer wave effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"
              style={{ animationDuration: "1.2s" }}
            />
            <div className="w-6 h-6 rounded-full border-2 border-t-[#FF2D2D] border-r-transparent border-b-[#FF2D2D] border-l-transparent animate-spin opacity-40" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-speed Native Async Image */}
      {optimizedSrc && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
          referrerPolicy={referrerPolicy}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${
            imageFit === "contain"
              ? "object-contain bg-white/50 dark:bg-black/20 p-2"
              : "object-cover"
          }`}
        />
      )}
    </div>
  );
}
