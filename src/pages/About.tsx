import React from "react";
import { Users, Code, Award, CheckCircle2, Star, Target, Compass, Zap } from "lucide-react";
import { SiteContent } from "../types";
import { useLanguage } from "../lib/LanguageContext";

interface AboutProps {
  setRoute: (route: string) => void;
  siteContent: SiteContent;
}

export default function About({ setRoute, siteContent }: AboutProps) {
  const { t } = useLanguage();
  const aboutData = siteContent.about || {};
  const badgeText = aboutData.badge || "About B2bfiy";
  const titleText = aboutData.title || "The Dedicated Creative & Growth Engine For Your Business";
  const descriptionText = aboutData.description || "We are a team of expert creators, engineers, and marketers aligned to construct professional corporate web platforms, designs, and reels to help brands scale up.";
  const missionTitleText = aboutData.missionTitle || "Bridging High-Fidelity Creative Quality and Affordable Predictability";
  const missionDesc1Text = aboutData.missionDesc1 || "Managing five separate freelance contracts is chaotic. One delivers slow code, another misses graphic styles, and a third stops replying during launch. B2bfiy was founded in Dhaka to establish a single reliable, professional creative team that business owners can delegate to.";
  const missionDesc2Text = aboutData.missionDesc2 || "We leverage modern technology, custom design systems, and cinematic short-form frameworks to elevate small brands, medical clinics, restaurants, and startups globally into trustworthy digital icons.";

  const dynamicCoreValues = aboutData.coreValues || [
    {
      title: "Results-First Execution",
      desc: "We don't prioritize vanity likes or useless visits. We build high-performance pipelines engineered to attract paying customers."
    },
    {
      title: "Absolute Transparency",
      desc: "No hidden setup costs, unexpected fees, or secret markups. Everything is communicated and priced upfront clearly."
    },
    {
      title: "Speed & Communication",
      desc: "Our teams coordinate via modern communication panels to answer questions within minutes and deliver designs on time."
    }
  ];

  const valueIcons = [
    <Target className="w-5 h-5 text-[#FF2D2D]" />,
    <Award className="w-5 h-5 text-[#FF2D2D]" />,
    <Zap className="w-5 h-5 text-[#FF2D2D]" />
  ];

  const coreValues = dynamicCoreValues.map((val, idx) => ({
    ...val,
    icon: valueIcons[idx] || <CheckCircle2 className="w-5 h-5 text-[#FF2D2D]" />
  }));

  const foundersList = aboutData.founders || [
    {
      emoji: "👨‍💻",
      role: "Founder",
      name: "B2bfiy Founder",
      description: "Leads development, design direction, and client strategy across every project."
    }
  ];

  return (
    <div className="bg-transparent min-h-screen py-16 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Banner header title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-sm font-bold text-[#FF2D2D] uppercase tracking-widest bg-[#FFE8E5] px-4 py-1.5 rounded-full inline-block">
            {t(badgeText)}
          </span>
          <h1 className="text-4xl font-extrabold text-[#101828] tracking-tight sm:text-5xl font-display">
            {t(titleText)}
          </h1>
          <p className="text-[#475467] text-base sm:text-lg">
            {t(descriptionText)}
          </p>
        </div>

        {/* Narrative Split Block */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white p-8 md:p-12 rounded-3xl border border-[#F2E4E2] shadow-sm">
          
          <div className="space-y-6">
            <span className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">
              {t("Our Founding Mission", "আমাদের প্রতিষ্ঠাতা মিশন")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] font-display">
              {t(missionTitleText)}
            </h2>
            <p className="text-sm text-[#475467] leading-relaxed">
              {t(missionDesc1Text)}
            </p>
            <p className="text-sm text-[#475467] leading-relaxed">
              {t(missionDesc2Text)}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-[#FFF7F5] border border-[#F2E4E2] p-4 rounded-xl text-left">
                <Users className="w-5 h-5 text-[#FF2D2D] mb-1" />
                <span className="text-xs font-bold text-[#101828] block">{t("Expert Staff", "দক্ষ কর্মী")}</span>
                <p className="text-[10px] text-[#475467]">{t("Specialized in Web, Design & Video.", "ওয়েবসাইট, ডিজাইন ও ভিডিও বিশেষজ্ঞ।")}</p>
              </div>
              <div className="bg-[#FFF7F5] border border-[#F2E4E2] p-4 rounded-xl text-left">
                <Code className="w-5 h-5 text-[#FF2D2D] mb-1" />
                <span className="text-xs font-bold text-[#101828] block">{t("Modern Codebases", "আধুনিক কোডবেস")}</span>
                <p className="text-[10px] text-[#475467]">{t("No sluggish templates or bugs.", "ধীরগতির টেমপ্লেট বা বাগ ছাড়া।")}</p>
              </div>
            </div>
          </div>

          {/* Right section: visual credentials stack */}
          <div className="space-y-6 bg-[#FFF7F5] border border-[#F2E4E2] p-8 rounded-3xl text-left">
            <h3 className="text-base font-extrabold text-[#101828] uppercase tracking-wider block font-mono">
              {t("Our Operational Core Values:", "আমাদের পরিচালনাগত মূল মূল্যবোধ:")}
            </h3>
            <div className="space-y-4">
              {coreValues.map((val, idx) => (
                <div key={idx} className="flex items-start space-x-3 bg-white p-4 rounded-2xl border border-[#F2E4E2]">
                  <div className="p-2 bg-[#FFE8E5] rounded-xl shrink-0">
                    {val.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#101828]">{t(val.title)}</h4>
                    <p className="text-xs text-[#475467] leading-relaxed">{t(val.desc)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Statistics highlights grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {siteContent.stats.map((st) => (
            <div key={st.id} className="bg-white border border-[#F2E4E2] p-8 rounded-2xl text-center shadow-xs">
              <span className="text-4xl font-extrabold text-[#FF2D2D] block font-display">{st.value}</span>
              <span className="text-xs font-semibold text-[#475467] block mt-1">{t(st.label)}</span>
            </div>
          ))}
        </div>

        {/* Meet the founders segment */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] font-display">
              {t("Our Executive Direction", "আমাদের নির্বাহী নেতৃত্ব")}
            </h2>
            <p className="text-xs sm:text-sm text-[#475467]">
              {t("Guided by senior software engineers, UI specialists, and video directors with years of active experience.", "সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার, ইউআই স্পেশালিস্ট এবং দীর্ঘদিনের অভিজ্ঞতাসম্পন্ন ভিডিও পরিচালকদের দিকনির্দেশনায় পরিচালিত।")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {foundersList.map((founder, idx) => (
              <div key={idx} className="bg-white border border-[#F2E4E2] p-6 rounded-3xl flex items-center space-x-5 text-left">
                <div className="w-16 h-16 rounded-full bg-[#FFE8E5] text-2xl flex items-center justify-center font-bold shrink-0 overflow-hidden">
                  {founder.imageUrl ? (
                    <img
                      src={founder.imageUrl}
                      alt={founder.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    founder.emoji || "👨‍💻"
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#FF2D2D] block font-mono">{t(founder.role)}</span>
                  <h3 className="text-base font-extrabold text-[#101828]">{t(founder.name)}</h3>
                  <p className="text-xs text-[#475467] leading-relaxed">{t(founder.description)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global CTA Box */}
        <div className="bg-[#FF2D2D] text-white rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(255,255,255,0.05)_50%,_transparent_75%)] bg-[length:250px_250px] animate-[pulse_6s_infinite]" />
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
            {t("Want to Partner with B2bfiy?", "B2bfiy এর সাথে পার্টনার হতে চান?")}
          </h2>
          <p className="text-xs sm:text-sm text-white/90 max-w-xl mx-auto">
            {t("Request our completely free digital audit. We will inspect your current website, design assets, and social channels, highlighting easy avenues to upgrade conversions.", "আমাদের সম্পূর্ণ ফ্রি ডিজিটাল অডিটের অনুরোধ করুন। আমরা আপনার বর্তমান ওয়েবসাইট, ডিজাইন এসেট এবং সোশ্যাল চ্যানেলগুলো পরীক্ষা করব এবং কনভার্সন বৃদ্ধির সহজ পথগুলো চিহ্নিত করব।")}
          </p>
          <button
            onClick={() => {
              setRoute("free-audit");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="px-6 py-3 bg-white hover:bg-[#FFE8E5] text-[#FF2D2D] font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            {t("Get My Free Audit", "ফ্রি অডিট নিন")}
          </button>
        </div>

      </div>
    </div>
  );
}
