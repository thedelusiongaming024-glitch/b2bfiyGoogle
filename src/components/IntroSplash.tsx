import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isAccentVisible, setIsAccentVisible] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);

  const handleFinish = useCallback(() => {
    setIsDestroyed(true);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // 1. Show the unified b2bfiy. logo with staggered letters
    const textTimer = setTimeout(() => {
      setIsTextVisible(true);
    }, 120);

    // 2. Reveal sleek red accent pulse beneath the logo (never cutting through text)
    const accentTimer = setTimeout(() => {
      setIsAccentVisible(true);
    }, 1100);

    // 3. Smooth curtain reveal - background panels glide open, logo fades out intact
    const openTimer = setTimeout(() => {
      setIsOpening(true);
    }, 1750);

    // 4. Complete intro transition
    const completeTimer = setTimeout(() => {
      handleFinish();
    }, 2450);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(accentTimer);
      clearTimeout(openTimer);
      clearTimeout(completeTimer);
    };
  }, [handleFinish]);

  if (isDestroyed) return null;

  const textLetters = "b2bfiy".split("");

  // Staggered letters variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const letterVariants = {
    hidden: { y: 24, opacity: 0, scale: 0.92 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 14,
        stiffness: 120,
      },
    },
  };

  // Background Curtain Panels (cleanly slide apart without slicing the logo)
  const topPanelVariants = {
    initial: { y: 0 },
    open: {
      y: "-100%",
      transition: {
        duration: 0.7,
        ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
      },
    },
  };

  const bottomPanelVariants = {
    initial: { y: 0 },
    open: {
      y: "100%",
      transition: {
        duration: 0.7,
        ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
      },
    },
  };

  // Intact Logo Fade & Scale on exit
  const logoContainerVariants = {
    initial: { opacity: 1, scale: 1 },
    open: {
      opacity: 0,
      scale: 1.05,
      transition: {
        duration: 0.45,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <div 
      onClick={handleFinish}
      className="fixed inset-0 z-[99999] overflow-hidden select-none cursor-pointer"
      title="Click or tap to skip"
    >
      {/* 1. TOP CURTAIN PANEL (Pure background dark canvas) */}
      <motion.div
        variants={topPanelVariants}
        initial="initial"
        animate={isOpening ? "open" : "initial"}
        className="absolute top-0 left-0 w-full h-[50.5vh] bg-[#0b0f19] pointer-events-auto border-none z-10"
      />

      {/* 2. BOTTOM CURTAIN PANEL (Pure background dark canvas) */}
      <motion.div
        variants={bottomPanelVariants}
        initial="initial"
        animate={isOpening ? "open" : "initial"}
        className="absolute bottom-0 left-0 w-full h-[50.5vh] bg-[#0b0f19] pointer-events-auto border-none z-10"
      />

      {/* 3. UNIFIED, INTACT LOGO (Positioned in foreground, NEVER cut in half or clipped) */}
      <motion.div
        variants={logoContainerVariants}
        initial="initial"
        animate={isOpening ? "open" : "initial"}
        className="fixed inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-4"
      >
        <div className="flex flex-col items-center justify-center max-w-full">
          {/* Logo Brand Name - Single continuous text block */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isTextVisible ? "visible" : "hidden"}
            className="inline-flex items-center text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight sm:tracking-normal text-white leading-none select-none font-sans"
          >
            {textLetters.map((letter, idx) => (
              <motion.span key={idx} variants={letterVariants}>
                {letter}
              </motion.span>
            ))}
            <motion.span
              variants={letterVariants}
              className="text-[#FF2D2D] drop-shadow-[0_0_24px_rgba(255,45,45,0.9)] ml-0.5"
            >
              .
            </motion.span>
          </motion.div>

          {/* Sleek Red Ambient Accent Underneath (positioned below text, never through the letters) */}
          <div className="h-6 flex items-center justify-center mt-3 sm:mt-4 w-full">
            <AnimatePresence>
              {isAccentVisible && !isOpening && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-[2px] sm:h-[3px] bg-gradient-to-r from-transparent via-[#FF2D2D] to-transparent w-36 sm:w-56 rounded-full shadow-[0_0_15px_#FF2D2D,0_0_30px_#FF2D2D]"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
