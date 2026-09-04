import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isLineVisible, setIsLineVisible] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);

  useEffect(() => {
    // 1. Show b2bfiy. name first with staggered letter animation (NO LINE AT ALL)
    const textTimer = setTimeout(() => {
      setIsTextVisible(true);
    }, 150);

    // 2. ONLY AFTER name is fully shown and displayed cleanly, draw the red laser line across center
    const lineTimer = setTimeout(() => {
      setIsLineVisible(true);
    }, 2000);

    // 3. Immediately after the line strikes across, split top and bottom
    const splitTimer = setTimeout(() => {
      setIsSplitting(true);
    }, 2550);

    // 4. Complete intro and reveal website
    const completeTimer = setTimeout(() => {
      setIsDestroyed(true);
      onComplete();
    }, 3600);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(lineTimer);
      clearTimeout(splitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (isDestroyed) return null;

  const textLetters = "b2bfiy".split("");

  // Animation variants for staggered letters
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const letterVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 14,
        stiffness: 110,
      },
    },
  };

  // Split Panel slide variants
  const topPanelVariants = {
    initial: { y: 0 },
    split: {
      y: "-100%",
      transition: {
        duration: 0.85,
        ease: [0.76, 0, 0.24, 1], // Smooth cubic-bezier split curve
      },
    },
  };

  const bottomPanelVariants = {
    initial: { y: 0 },
    split: {
      y: "100%",
      transition: {
        duration: 0.85,
        ease: [0.76, 0, 0.24, 1],
      },
    },
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden select-none pointer-events-none">
      {/* 1. TOP PANEL (Top 50vh - Clean dark canvas with NO initial borders) */}
      <motion.div
        variants={topPanelVariants}
        initial="initial"
        animate={isSplitting ? "split" : "initial"}
        className="absolute top-0 left-0 w-full h-[50vh] bg-[#0b0f19] flex items-end justify-center overflow-hidden pointer-events-auto border-none"
      >
        <div className="w-full text-center pb-0 translate-y-1/2">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isTextVisible ? "visible" : "hidden"}
            className="inline-flex items-center text-7xl sm:text-8xl md:text-[11rem] font-black tracking-wider text-white leading-none select-none font-sans"
          >
            {textLetters.map((letter, idx) => (
              <motion.span key={idx} variants={letterVariants}>
                {letter}
              </motion.span>
            ))}
            <motion.span
              variants={letterVariants}
              className="text-[#FF2D2D] drop-shadow-[0_0_20px_rgba(255,45,45,0.8)]"
            >
              .
            </motion.span>
          </motion.div>
        </div>
      </motion.div>

      {/* 2. BOTTOM PANEL (Bottom 50vh - Clean dark canvas with NO initial borders) */}
      <motion.div
        variants={bottomPanelVariants}
        initial="initial"
        animate={isSplitting ? "split" : "initial"}
        className="absolute bottom-0 left-0 w-full h-[50vh] bg-[#0b0f19] flex items-start justify-center overflow-hidden pointer-events-auto border-none"
      >
        <div className="w-full text-center pt-0 -translate-y-1/2">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isTextVisible ? "visible" : "hidden"}
            className="inline-flex items-center text-7xl sm:text-8xl md:text-[11rem] font-black tracking-wider text-white leading-none select-none font-sans"
          >
            {textLetters.map((letter, idx) => (
              <motion.span key={idx} variants={letterVariants}>
                {letter}
              </motion.span>
            ))}
            <motion.span
              variants={letterVariants}
              className="text-[#FF2D2D] drop-shadow-[0_0_20px_rgba(255,45,45,0.8)]"
            >
              .
            </motion.span>
          </motion.div>
        </div>
      </motion.div>

      {/* 3. CENTER RED LASER CUT LINE (Appears ONLY AFTER name is shown, shoots across from center) */}
      <AnimatePresence>
        {isLineVisible && !isSplitting && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-[50vh] -translate-y-1/2 left-0 right-0 h-[3px] bg-[#FF2D2D] shadow-[0_0_15px_#FF2D2D,0_0_30px_#FF2D2D] z-[100000] origin-center"
          />
        )}
      </AnimatePresence>

      {/* Glow pulse when the cut line strikes */}
      <AnimatePresence>
        {isLineVisible && !isSplitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-gradient-to-r from-[#FF2D2D]/10 via-[#FF2D2D]/30 to-[#FF2D2D]/10 pointer-events-none z-[99998]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
