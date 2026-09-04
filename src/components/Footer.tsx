import React from "react";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, MessageSquare, ArrowUp } from "lucide-react";
import { SiteContent } from "../types";
import { useLanguage } from "../lib/LanguageContext";

interface FooterProps {
  setRoute: (route: string) => void;
  siteContent: SiteContent;
}

export default function Footer({ setRoute, siteContent }: FooterProps) {
  const { t, language } = useLanguage();

  const handleNavClick = (id: string) => {
    setRoute(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Safe description translation fallback
  const defaultFooterDescEn = "We help businesses build a powerful digital presence through high-converting websites, professional graphic design, engaging video content, and complete social media management.";
  const defaultFooterDescBn = "হাই-কনভার্টিং ওয়েবসাইট ও প্রফেশনাল গ্রাফিক্স ডিজাইন থেকে শুরু করে আকর্ষণীয় ভিডিও কনটেন্ট এবং সম্পূর্ণ সোশ্যাল মিডিয়া ম্যানেজমেন্ট — B2bfiy আপনার ব্যবসাকে দিচ্ছে এমন ডিজিটাল সাপোর্ট যা আপনাকে অনন্য করবে এবং এগিয়ে নিয়ে যাবে।";
  
  const footerDescription = siteContent.footerDesc
    ? (language === "bn" && siteContent.footerDesc.includes("We help businesses build") ? defaultFooterDescBn : siteContent.footerDesc)
    : t(defaultFooterDescEn, defaultFooterDescBn);

  const getCopyrightText = () => {
    if (language === "bn") {
      return `© ${new Date().getFullYear()} B2bfiy। সর্বস্বত্ব সংরক্ষিত।`;
    }
    return siteContent.copyright || `© ${new Date().getFullYear()} B2bfiy. All rights reserved.`;
  };

  return (
    <footer className="bg-[#101828] text-white pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-gray-800">
          
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {siteContent.logoType !== "text" && siteContent.logoUrl ? (
                <img
                  src={siteContent.logoUrl}
                  alt={siteContent.brandName || "Logo"}
                  className="h-10 w-auto object-contain max-w-[200px]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                (() => {
                  const bName = siteContent.brandName || "B2bfiy";
                  if (bName.toLowerCase().startsWith("b2b") && bName.length > 3) {
                    return (
                      <>
                        {bName.substring(0, 3)}
                        <span className="text-[#FF2D2D]">{bName.substring(3)}</span>
                      </>
                    );
                  }
                  const mid = Math.ceil(bName.length / 2);
                  return (
                    <>
                      {bName.substring(0, mid)}
                      <span className="text-[#FF2D2D]">{bName.substring(mid)}</span>
                    </>
                  );
                })()
              )}
            </span>
            <p className="text-gray-400 text-sm leading-relaxed">
              {footerDescription}
            </p>
            <div className="flex space-x-3 pt-2">
              <a
                href={siteContent.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-[#FF2D2D] transition-colors flex items-center justify-center text-white"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={siteContent.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-[#FF2D2D] transition-colors flex items-center justify-center text-white"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={siteContent.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-[#FF2D2D] transition-colors flex items-center justify-center text-white"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={siteContent.socials.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-[#FF2D2D] transition-colors flex items-center justify-center text-white"
                aria-label="WhatsApp"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Services */}
          <div>
            <h4 className="text-base font-bold text-white tracking-wider uppercase mb-4">{t("Our Services")}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={() => handleNavClick("services")} className="hover:text-[#FF2D2D] transition-colors text-left">
                  {t("Website Development")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick("services")} className="hover:text-[#FF2D2D] transition-colors text-left">
                  {t("Graphic Design")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick("services")} className="hover:text-[#FF2D2D] transition-colors text-left">
                  {t("Video Editing")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick("services")} className="hover:text-[#FF2D2D] transition-colors text-left">
                  {t("Social Media Management")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick("packages")} className="hover:text-[#FF2D2D] transition-colors text-left font-semibold text-[#FF5757]">
                  {t("Pricing Plans & Monthly Packages", "মাসিক প্যাকেজসমূহ")}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="text-base font-bold text-white tracking-wider uppercase mb-4">{t("Quick Links")}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={() => handleNavClick("home")} className="hover:text-[#FF2D2D] transition-colors text-left">
                  {t("Home")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick("about")} className="hover:text-[#FF2D2D] transition-colors text-left">
                  {t("About Us")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick("faq")} className="hover:text-purple-400 transition-colors text-left font-semibold text-purple-300">
                  {t("AI FAQ & Support", "এআই প্রশ্নোত্তর ও সাপোর্ট")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick("portfolio")} className="hover:text-[#FF2D2D] transition-colors text-left">
                  {t("Portfolio")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick("free-audit")} className="hover:text-emerald-400 transition-colors text-left font-semibold text-emerald-500">
                  {t("Get a Free Audit")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick("privacy-policy")} className="hover:text-[#FF2D2D] transition-colors text-left">
                  {t("Privacy Policy")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick("terms")} className="hover:text-[#FF2D2D] transition-colors text-left">
                  {t("Terms & Conditions")}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white tracking-wider uppercase">{t("Contact Information")}</h4>
            <div className="space-y-3 text-sm text-gray-400">
              <a href={`tel:${siteContent.phone}`} className="flex items-center space-x-2.5 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-[#FF2D2D]" />
                <span>{siteContent.phone}</span>
              </a>
              <a href={`mailto:${siteContent.email}`} className="flex items-center space-x-2.5 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-[#FF2D2D]" />
                <span className="break-all">{siteContent.email}</span>
              </a>
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#FF2D2D] shrink-0 mt-0.5" />
                <span>{t("Dhaka, Bangladesh (Serving clients globally)")}</span>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl">
              <span className="text-xs font-semibold text-[#FF5757] block mb-1">{t("Response Time:")}</span>
              <p className="text-xs text-gray-400">{t("Usually under 2 hours via WhatsApp.")}</p>
            </div>
          </div>
        </div>

        {/* Bottom copyright and scrolling */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 text-sm text-gray-500">
          <p className="cursor-default select-none">
            {getCopyrightText()}
          </p>
          <div className="flex items-center space-x-6">
            <button onClick={() => handleNavClick("privacy-policy")} className="hover:text-white transition-colors">
              {t("Privacy")}
            </button>
            <button onClick={() => handleNavClick("terms")} className="hover:text-white transition-colors">
              {t("Terms")}
            </button>
            <button
              onClick={handleScrollToTop}
              className="p-2 bg-gray-800 hover:bg-[#FF2D2D] hover:text-white rounded-full transition-colors group"
              title={t("Scroll to Top")}
              id="footer-scroll-to-top"
            >
              <ArrowUp className="w-4 h-4 text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
