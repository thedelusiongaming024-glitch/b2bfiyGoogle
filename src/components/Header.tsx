import React, { useState } from "react";
import { Menu, X, ArrowRight, MessageSquare, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SiteContent } from "../types";
import { useLanguage } from "../lib/LanguageContext";

interface HeaderProps {
  currentRoute: string;
  setRoute: (route: string) => void;
  siteContent: SiteContent;
  darkMode?: boolean;
  setDarkMode?: (dark: boolean) => void;
}

export default function Header({ 
  currentRoute, 
  setRoute, 
  siteContent,
  darkMode = false,
  setDarkMode
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  const navItems = [
    { id: "home", label: t("Home", "হোম") },
    { id: "services", label: t("Services", "সার্ভিসেস") },
    { id: "portfolio", label: t("Projects", "প্রজেক্টস") },
    { id: "packages", label: t("Packages", "প্যাকেজ") },
    { id: "about", label: t("About", "সম্পর্কে") },
    { id: "faq", label: t("FAQ", "এআই সহায়তা") },
    { id: "contact", label: t("Contact", "যোগাযোগ") },
  ];

  const handleNavClick = (id: string) => {
    setRoute(id);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const brandName = siteContent.brandName || "B2bfiy";
  const brandInitial = brandName.charAt(0).toUpperCase() || "B";

  return (
    <header className="sticky top-2 sm:top-4 z-50 w-full px-3 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Floating Capsule Bar */}
        <div className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] px-3.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between pointer-events-auto transition-all duration-300">
          
          {/* Logo with Brand Badge */}
          <button
            onClick={() => handleNavClick("home")}
            className="flex items-center space-x-2.5 group cursor-pointer focus:outline-none shrink-0"
            id="header-logo-btn"
          >
            {siteContent.logoType !== "text" && siteContent.logoUrl ? (
              <img
                src={siteContent.logoUrl}
                alt={brandName}
                className="h-8 sm:h-9 w-auto object-contain max-w-[160px]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex items-center space-x-2.5">
                {/* Modern Square Initial Badge */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#101828] dark:bg-white text-white dark:text-[#101828] flex items-center justify-center font-black text-sm sm:text-base shadow-xs group-hover:bg-[#FF2D2D] dark:group-hover:bg-[#FF2D2D] dark:group-hover:text-white transition-colors duration-300">
                  {brandInitial}
                </div>
                
                {/* Brand Name & Subtitle */}
                <div className="flex flex-col text-left">
                  <span className="text-sm sm:text-base font-black tracking-tight text-[#101828] dark:text-white leading-none">
                    {brandName}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-extrabold tracking-widest text-[#FF2D2D] dark:text-red-400 uppercase mt-0.5 leading-none">
                    DIGITAL
                  </span>
                </div>
              </div>
            )}
          </button>

          {/* Desktop Navigation Links - Floating Capsule Menu with Red Active Pill */}
          <nav className="hidden lg:flex items-center bg-[#f2f4f7] dark:bg-slate-800/90 p-1.5 rounded-full border border-gray-200/70 dark:border-slate-700/70 shadow-inner">
            {navItems.map((item) => {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  id={`nav-item-${item.id}`}
                  className={`relative text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer focus:outline-none py-1.5 px-4 rounded-full select-none ${
                    isActive
                      ? "text-white shadow-sm"
                      : "text-[#344054] dark:text-gray-300 hover:text-[#101828] dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 bg-[#FF2D2D] rounded-full shadow-sm shadow-[#FF2D2D]/30 -z-0"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-2.5">
            {/* Language Switch */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="relative flex items-center p-0.5 bg-[#FF2D2D] rounded-full cursor-pointer shadow-xs select-none transition-all duration-300 border border-[#FF2D2D]"
              title={language === "en" ? "বাংলায় পরিবর্তন করুন" : "Switch to English"}
              id="desktop-language-switch"
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className={`absolute top-0.5 bottom-0.5 w-[30px] bg-white rounded-full shadow-xs ${
                  language === "bn" ? "left-0.5" : "left-[31px]"
                }`}
              />

              <span
                className={`relative z-10 w-[30px] text-center text-[10px] font-black tracking-tight transition-colors duration-200 ${
                  language === "bn" ? "text-[#FF2D2D]" : "text-white"
                }`}
              >
                BN
              </span>
              <span
                className={`relative z-10 w-[30px] text-center text-[10px] font-black tracking-tight transition-colors duration-200 ${
                  language === "en" ? "text-[#FF2D2D]" : "text-white"
                }`}
              >
                EN
              </span>
            </button>

            {/* Pill CTA Button (Matching Reference Image) */}
            <motion.button
              onClick={() => handleNavClick("free-audit")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center space-x-2 px-5 py-2.5 bg-[#101828] hover:bg-black text-white text-xs sm:text-sm font-bold rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none shrink-0"
              id="header-audit-btn"
            >
              <span>{t("BE OUR FAMILY", "শুরু করুন")}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Mobile Right Controls */}
          <div className="md:hidden flex items-center space-x-1.5">
            {setDarkMode && (
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 bg-gray-100 dark:bg-gray-800 text-[#475467] dark:text-gray-300 rounded-full border border-gray-200/60 dark:border-gray-700"
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                id="mobile-dark-mode-toggle"
              >
                {darkMode ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={toggleLanguage}
              className="relative flex items-center p-0.5 bg-[#FF2D2D] rounded-full shadow-xs border border-[#FF2D2D]"
              id="mobile-language-switch"
            >
              <span className="text-[9px] font-black text-white px-1.5 py-0.5">
                {language.toUpperCase()}
              </span>
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 text-[#101828] dark:text-gray-200 hover:text-[#FF2D2D] rounded-full focus:outline-none bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700"
              id="header-mobile-toggle"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Floating Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-2 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-3xl p-4 shadow-2xl space-y-3 pointer-events-auto transition-colors duration-300"
            >
              <div className="flex flex-col space-y-1.5">
                {navItems.map((item) => {
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      id={`nav-mobile-${item.id}`}
                      className={`text-left px-4 py-2 rounded-xl font-bold transition-all text-sm ${
                        isActive
                          ? "bg-[#FFE8E5] dark:bg-[#FF2D2D]/15 text-[#FF2D2D] dark:text-[#FF5757]"
                          : "text-[#475467] dark:text-gray-300 hover:bg-[#FFF7F5] dark:hover:bg-gray-800 hover:text-[#FF2D2D]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <hr className="border-gray-200/80 dark:border-gray-800" />

              <div className="flex flex-col space-y-2 pt-1">
                {siteContent.socials?.whatsapp && (
                  <a
                    href={siteContent.socials.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 py-2.5 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-[#475467] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    id="header-mobile-whatsapp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t("WhatsApp Chat", "হোয়াটসঅ্যাপ চ্যাট")}</span>
                  </a>
                )}
                <button
                  onClick={() => handleNavClick("free-audit")}
                  className="flex items-center justify-center space-x-2 py-2.5 bg-[#101828] dark:bg-[#FF2D2D] text-white rounded-full text-xs font-bold shadow-md"
                  id="header-mobile-audit"
                >
                  <span>{t("Get Started", "শুরু করুন")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

