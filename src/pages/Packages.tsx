import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Phone, Star, ShieldCheck, Zap, Mail, MessageSquare, Rocket } from "lucide-react";
import { ServicePackage, SiteContent } from "../types";
import { useLanguage } from "../lib/LanguageContext";

interface PackagesProps {
  setRoute: (route: string, extraParam?: string) => void;
  siteContent: SiteContent;
  packages: ServicePackage[];
  selectedCategory?: TabType;
  onSelectCategory?: (tab: TabType) => void;
}

type TabType = "monthly" | "website" | "graphic" | "video";

export default function Packages({ 
  setRoute, 
  siteContent, 
  packages, 
  selectedCategory = "monthly", 
  onSelectCategory 
}: PackagesProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>(selectedCategory);

  React.useEffect(() => {
    if (selectedCategory) {
      setActiveTab(selectedCategory);
    }
  }, [selectedCategory]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (onSelectCategory) {
      onSelectCategory(tab);
    }
  };

  const tabLabels = [
    { 
      id: "website", 
      label: t("Website Development", "ওয়েবসাইট ডেভেলপমেন্ট"),
      desc: t("Custom business websites, landing funnels, and e-commerce setups tailored for maximum conversions.", "বিজনেস ওয়েবসাইট, ল্যান্ডিং পেজ এবং ই-কমার্স সলিউশন")
    },
    { 
      id: "graphic", 
      label: t("Graphic Design Packages", "গ্রাফিক্স ডিজাইন প্যাকেজ"),
      desc: t("High-resolution marketing banners, social media designs, and consistent corporate branding.", "সোশ্যাল মিডিয়া ডিজাইন, ব্যানার এবং ব্র্যান্ডিং ক্রিয়েটিভস")
    },
    { 
      id: "video", 
      label: t("Video Editing Packages", "ভিডিও এডিটিং প্যাকেজ"),
      desc: t("High-retention vertical reels, TikTok clips, promo videos, and animated captions.", "শর্টস, রিলস, প্রোমো ভিডিও ও অ্যানিমেটেড ক্যাপশন এডিটিং")
    },
    { 
      id: "monthly", 
      label: t("Monthly Growth Retainers", "মাসিক গ্রোথ প্যাকেজসমূহ"),
      desc: t("Hands-off, end-to-end social media, graphics, and video production managed monthly for your brand.", "মাসিক সোশ্যাল মিডিয়া ম্যানেজমেন্ট, ডিজাইন এবং ভিডিও এডিটিং")
    }
  ];

  const currentTabInfo = tabLabels.find((t) => t.id === activeTab);

  const filteredPackages = packages.filter(
    (p) => p.type === activeTab && p.published && p.title !== "COMPLETE BUSINESS LAUNCH PACKAGE"
  );

  const launchPackage = packages.find((p) => p.title === "COMPLETE BUSINESS LAUNCH PACKAGE");

  const handleCtaClick = (pkgTitle: string, pkgPrice: string) => {
    setRoute("contact", `${pkgTitle} (${pkgPrice})`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-transparent min-h-screen py-16 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-sm font-bold text-[#FF2D2D] uppercase tracking-widest bg-[#FFE8E5] dark:bg-red-950/50 px-4 py-1.5 rounded-full inline-block">
            {t("Pricing Plans")}
          </span>
          <h1 className="text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight sm:text-5xl font-display">
            {t("Transparent Pricing Structured to Help You Scale")}
          </h1>
          <p className="text-[#475467] dark:text-gray-300 text-base sm:text-lg">
            {t("No dynamic hidden fees, no complex markup, and no long-term restrictive locks. Choose an affordable plan backed by professional quality or customized terms.")}
          </p>
        </div>

        {/* Tab Selectors */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="flex flex-wrap gap-2.5 justify-center bg-white dark:bg-gray-800 p-2 rounded-2xl border border-[#F2E4E2] dark:border-gray-700 shadow-xs">
            {tabLabels.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`flex-1 min-w-[140px] py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#FF2D2D] text-white shadow-xs"
                    : "text-[#475467] dark:text-gray-300 hover:bg-[#FFE8E5] dark:hover:bg-red-950/40 hover:text-[#FF2D2D]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {currentTabInfo && (
            <div className="text-center bg-[#FFE8E5]/50 dark:bg-red-950/20 border border-[#FFE8E5] dark:border-red-900/40 py-2.5 px-4 rounded-xl">
              <p className="text-xs sm:text-sm text-[#FF2D2D] dark:text-red-300 font-medium">
                {currentTabInfo.desc}
              </p>
            </div>
          )}
        </div>

        {/* Main Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-md flex flex-col justify-between relative overflow-hidden h-full ${
                pkg.isPopular ? "border-2 border-[#FF2D2D]" : "border border-[#F2E4E2] dark:border-gray-700"
              }`}
            >
              {pkg.isPopular && (
                <span className="absolute top-4 right-4 bg-[#FF2D2D] text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-white" />
                  <span>{t("Popular")}</span>
                </span>
              )}

              <div className="space-y-6">
                
                <div>
                  <span className="text-xs font-bold text-[#475467] dark:text-gray-400 uppercase tracking-wider block font-mono">
                    {t(pkg.type.toUpperCase() + " PLAN")}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#101828] dark:text-white mt-1 font-display">
                    {t(pkg.title)}
                  </h3>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-[#101828] dark:text-white tracking-tight font-display">
                      {pkg.price}
                    </span>
                    {pkg.period && (
                      <span className="text-xs font-semibold text-[#475467] dark:text-gray-400 ml-1">
                        / {t(pkg.period)}
                      </span>
                    )}
                  </div>
                  {pkg.deliveryTime && (
                    <span className="inline-block mt-2 px-2.5 py-1 text-[11px] font-bold text-[#FF2D2D] bg-[#FFE8E5] dark:bg-red-950/50 rounded-md font-mono">
                      ⏳ {t("Est. Delivery:")} {t(pkg.deliveryTime)}
                    </span>
                  )}
                </div>

                <hr className="border-[#F2E4E2] dark:border-gray-700" />

                <ul className="space-y-3">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{t(feat)}</span>
                    </li>
                  ))}
                </ul>

              </div>

              <div className="mt-8 pt-6 border-t border-[#F2E4E2] dark:border-gray-700">
                <button
                  onClick={() => handleCtaClick(pkg.title, pkg.price)}
                  className={`w-full py-3 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    pkg.isPopular
                      ? "bg-[#FF2D2D] hover:bg-[#FF5757] text-white shadow-md"
                      : "bg-white dark:bg-gray-800 border border-[#FF2D2D] text-[#FF2D2D] hover:bg-[#FFE8E5] dark:hover:bg-red-950/40"
                  }`}
                >
                  {t(pkg.ctaText)}
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Ultimate Premium Launch Package Card */}
        {launchPackage && launchPackage.published && (
          <div className="bg-gradient-to-r from-[#101828] via-[#1F2937] to-[#101828] text-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF2D2D] rounded-full blur-3xl opacity-20" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              <div className="lg:col-span-7 space-y-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF2D2D] text-xs font-extrabold uppercase tracking-widest text-white">
                  <Rocket className="w-3.5 h-3.5 mr-1.5" />
                  {t("Complete Business Launch Package")}
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight">
                  {t("Everything Your Business Needs to Launch Online")}
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {t("Avoid paying multiple split agencies. B2bfiy provides everything required to build, design, publish, and market your corporate brand structure within exactly 30 days.")}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {launchPackage.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start space-x-2.5 text-xs text-gray-300 leading-relaxed">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">✓</div>
                      <span>{t(feat)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white/5 border border-white/10 p-8 rounded-2xl text-center space-y-6">
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">{t("Est. Delivery: 30 Business Days")}</span>
                  <span className="text-4xl font-extrabold text-white block mt-2 font-display">
                    {launchPackage.price}
                  </span>
                </div>
                <button
                  onClick={() => handleCtaClick(launchPackage.title, launchPackage.price)}
                  className="w-full py-4 bg-[#FF2D2D] hover:bg-[#FF5757] text-white font-extrabold rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  {t(launchPackage.ctaText)}
                </button>
                <div className="flex justify-center items-center space-x-2 text-xs text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{t("SSL, Domain & Ad setups included")}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Global SLA Details block */}
        <div className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 p-8 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2 text-left">
            <span className="text-sm font-bold text-[#101828] dark:text-white">{t("Daily Clear Updates")}</span>
            <p className="text-xs text-[#475467] dark:text-gray-300 leading-relaxed">{t("We use coordinated workspace panels to keep clients updated daily on active layouts and video edits.")}</p>
          </div>
          <div className="space-y-2 text-left">
            <span className="text-sm font-bold text-[#101828] dark:text-white">{t("No Restrictive Locks")}</span>
            <p className="text-xs text-[#475467] dark:text-gray-300 leading-relaxed">{t("Cancel, scale up, or downgrade your monthly retainers with a simple 7-day notification period.")}</p>
          </div>
          <div className="space-y-2 text-left">
            <span className="text-sm font-bold text-[#101828] dark:text-white">{t("Fully Owned Source Files")}</span>
            <p className="text-xs text-[#475467] dark:text-gray-300 leading-relaxed">{t("You retain 100% full ownership rights of all graphic source codes, design files, website backups, and video assets.")}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
