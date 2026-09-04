import React, { useState } from "react";
import { Monitor, PenTool, PlayCircle, Share2, ArrowRight, Tag, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { SiteContent, ServicePackage } from "../types";
import { useLanguage } from "../lib/LanguageContext";

interface ServicesProps {
  setRoute: (route: string, extraParam?: string) => void;
  siteContent: SiteContent;
  packages?: ServicePackage[];
  onLeadSubmit: (leadData: any) => void;
}

export default function Services({ setRoute, siteContent, packages = [], onLeadSubmit }: ServicesProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    whatsapp: "",
    service: "Website Development",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const servicesList = [
    {
      title: "Website Development",
      categoryKey: "website" as const,
      tag: "WEBSITE",
      startingPrice: "৳15,000",
      period: "Project",
      icon: <Monitor className="w-5 h-5" />,
      description: "We build modern, fast, mobile-friendly websites designed to turn visitors into potential customers.",
      bullets: [
        "Business Websites",
        "E-commerce Solutions",
        "Landing Pages",
        "Custom Web Applications"
      ],
      ctaText: "Explore Website Development Pricing",
      image: siteContent.serviceImages?.webDev || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Graphic Design",
      categoryKey: "graphic" as const,
      tag: "GRAPHIC",
      startingPrice: "৳5,000",
      period: "Package",
      icon: <PenTool className="w-5 h-5" />,
      description: "Professional visual content that makes your brand look consistent, trustworthy, and memorable.",
      bullets: [
        "Social Media Designs",
        "Marketing Creatives",
        "Branding & Logo Identity",
        "Promotional Materials"
      ],
      ctaText: "Explore Graphic Design Pricing",
      image: siteContent.serviceImages?.graphic || "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Video Editing",
      categoryKey: "video" as const,
      tag: "VIDEO",
      startingPrice: "৳6,000",
      period: "Package",
      icon: <PlayCircle className="w-5 h-5" />,
      description: "Engaging video content designed to capture attention and communicate your message effectively.",
      bullets: [
        "Reels & TikTok Shorts",
        "Social Content Editing",
        "Promotional Videos",
        "Custom Motion Graphics"
      ],
      ctaText: "Explore Video Editing Pricing",
      image: siteContent.serviceImages?.video || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Social Media Management",
      categoryKey: "monthly" as const,
      tag: "SOCIAL",
      startingPrice: "৳12,000",
      period: "Month",
      icon: <Share2 className="w-5 h-5" />,
      description: "We manage your social media presence so you can focus on running your business.",
      bullets: [
        "Content Strategy & Calendar",
        "Professional Captions & Tags",
        "Post Design & Styling",
        "Monthly Reporting & Analytics"
      ],
      ctaText: "Explore Monthly Retainers & Pricing",
      image: siteContent.serviceImages?.social || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80",
    }
  ];

  const handleSelectServiceForQuote = (serviceName: string) => {
    setFormData((prev) => ({ ...prev, service: serviceName }));
    const element = document.getElementById("quote-form-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.whatsapp) {
      alert(t("Please fill in all required fields (Name, Email, WhatsApp)."));
      return;
    }
    setLoading(true);

    const newLead = {
      id: "lead-" + Date.now(),
      type: "contact",
      fullName: formData.name,
      businessName: formData.businessName,
      email: formData.email,
      whatsappNumber: formData.whatsapp,
      serviceNeeded: formData.service,
      message: formData.message || `Service Inquiry: ${formData.service}`,
      submittedAt: new Date().toISOString(),
      status: "New",
    };

    setTimeout(() => {
      onLeadSubmit(newLead);
      setLoading(false);
      setSubmitted(true);
      setFormData({
        name: "",
        businessName: "",
        email: "",
        whatsapp: "",
        service: "Website Development",
        message: "",
      });
    }, 800);
  };

  return (
    <div className="bg-transparent min-h-screen py-16 md:py-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header Title Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold text-[#FF2D2D] bg-[#FFE8E5] dark:bg-red-950/50 px-3.5 py-1.5 rounded-full inline-block uppercase tracking-wider">
            {t("OUR EXPERTISE & PRICING", "আমাদের সেবাসমূহ ও প্যাকেজ")}
          </span>
          <h1 className="text-3xl sm:text-4.5xl font-black text-[#101828] dark:text-white tracking-tight leading-tight">
            {t("Everything Your Business Needs to Grow Online")}
          </h1>
          <p className="text-sm sm:text-base text-[#475467] dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            {t("Each service is backed by transparent, modular packages designed for every growth stage. Select any service to explore detailed pricing tiers or request a customized quote.")}
          </p>
        </div>

        {/* Alternate Detailed Service Cards with Linked Category Pricing */}
        <div className="space-y-10">
          {servicesList.map((service, index) => {
            const isEven = index % 2 === 0;
            // Get category-specific packages
            const categoryPackages = packages.filter(
              (pkg) => pkg.type === service.categoryKey && pkg.published !== false
            );

            return (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 rounded-[32px] p-6 sm:p-8 md:p-10 shadow-sm flex flex-col ${
                  isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                } gap-8 lg:gap-12 items-center`}
              >
                {/* Text Content Column */}
                <div className="w-full lg:w-[55%] text-left space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFE8E5] dark:bg-red-950/50 text-[#FF2D2D] flex items-center justify-center">
                      {service.icon}
                    </div>
                    {/* Category Pricing Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFE8E5] dark:bg-red-950/40 border border-[#FF2D2D]/20 text-[#FF2D2D] text-xs font-bold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{t(`Starting from ${service.startingPrice} / ${service.period}`, `শুরু ${service.startingPrice} / ${service.period}`)}</span>
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] dark:text-white tracking-tight">
                    {t(service.title)}
                  </h2>
                  <p className="text-sm text-[#475467] dark:text-gray-300 leading-relaxed max-w-xl">
                    {t(service.description)}
                  </p>
                  
                  {/* Two-Column Ticks list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-2">
                    {service.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#475467] dark:text-gray-300 font-semibold">
                        <span className="text-[#FF2D2D] text-sm shrink-0 font-bold">✓</span>
                        <span>{t(bullet)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Connected Category Packages Quick Preview */}
                  {categoryPackages.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-gray-400 block mb-2">
                        {t("Available Pricing Tiers:", "উপলব্ধ প্যাকেজসমূহ:")}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {categoryPackages.map((pkg) => (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => {
                              setRoute("packages", service.categoryKey);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F9FA] dark:bg-gray-700/60 hover:bg-[#FFE8E5] dark:hover:bg-red-950/50 border border-gray-200 dark:border-gray-600 hover:border-[#FF2D2D]/30 transition-all text-xs font-semibold text-[#344054] dark:text-gray-200 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-[#FF2D2D]" />
                            <span>{pkg.title}</span>
                            <span className="font-bold text-[#FF2D2D]">{pkg.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons: View Category Pricing + Quick Quote */}
                  <div className="pt-4 flex flex-wrap gap-3 items-center">
                    <button
                      onClick={() => {
                        setRoute("packages", service.categoryKey);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-6 py-3.5 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-xs sm:text-sm font-extrabold rounded-full transition-all flex items-center gap-2 shadow-md shadow-[#FF2D2D]/20 cursor-pointer"
                    >
                      <span>{t(service.ctaText)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectServiceForQuote(service.title)}
                      className="px-5 py-3.5 bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 text-[#101828] dark:text-white text-xs sm:text-sm font-bold rounded-full transition-all cursor-pointer"
                    >
                      {t("Get Custom Quote", "কাস্টম কোটেশন")}
                    </button>
                  </div>
                </div>

                {/* Styled Image Frame Column */}
                <div className="w-full lg:w-[45%] aspect-video lg:aspect-[4/3] rounded-[24px] overflow-hidden relative border border-[#F2E4E2] dark:border-gray-700 shadow-sm group">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-[#FF2D2D] text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-[6px] shadow-sm">
                      {t(service.tag)}
                    </span>
                    <span className="bg-[#101828]/80 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-[6px] shadow-sm">
                      {service.startingPrice}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Quote Builder / Contact Form */}
        <div 
          id="quote-form-section" 
          className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 rounded-[32px] p-8 md:p-12 shadow-sm max-w-4xl mx-auto relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFE8E5] dark:bg-red-950/40 rounded-full blur-3xl opacity-50 pointer-events-none" />
          
          <div className="text-center max-w-xl mx-auto space-y-4 mb-8">
            <h2 className="text-2xl font-extrabold text-[#101828] dark:text-white tracking-tight">
              {t("Request a Custom Quote")}
            </h2>
            <p className="text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed">
              {t("Specify your project guidelines below. Our senior strategists will analyze your goals and send a transparent breakdown within 24 hours.")}
            </p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-8 rounded-2xl text-center space-y-4">
              <span className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">✓</span>
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{t("Inquiry Received Successfully!")}</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 max-w-md mx-auto">
                {t("Thank you for reaching out to B2bfiy. A creative director has been assigned to your query and will contact you via Email/WhatsApp shortly.")}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {t("Submit Another Inquiry")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase tracking-wide">{t("Full Name *", "সম্পূর্ণ নাম *")}</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("e.g. Rakib Hossain", "যেমন: রাকিব হোসাইন")}
                    className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] focus:border-transparent outline-none bg-white dark:bg-gray-900 text-sm text-[#101828] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase tracking-wide">{t("Business Name", "প্রতিষ্ঠানের নাম")}</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder={t("e.g. Apex Retail", "যেমন: অ্যাপেক্স রিটেইল")}
                    className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] focus:border-transparent outline-none bg-white dark:bg-gray-900 text-sm text-[#101828] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase tracking-wide">{t("Email Address *", "ইমেইল এড্রেস *")}</label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. name@company.com"
                    className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] focus:border-transparent outline-none bg-white dark:bg-gray-900 text-sm text-[#101828] dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase tracking-wide">{t("WhatsApp Number *", "হোয়াটসঅ্যাপ নম্বর *")}</label>
                  <input
                    type="tel"
                    required
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="e.g. +880 1700-000000"
                    className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] focus:border-transparent outline-none bg-white dark:bg-gray-900 text-sm text-[#101828] dark:text-white"
                  />
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase tracking-wide">{t("Service You Are Interested In")}</label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] focus:border-transparent outline-none bg-white dark:bg-gray-900 text-sm text-[#101828] dark:text-white cursor-pointer"
                >
                  <option value="Website Development">{t("Website Development")}</option>
                  <option value="Graphic Design">{t("Graphic Design")}</option>
                  <option value="Video Editing">{t("Video Editing")}</option>
                  <option value="Social Media Management">{t("Social Media Management")}</option>
                  <option value="Complete Launch Bundle (৳75,000)">{t("Complete Launch Bundle (৳75,000)", "কমপ্লিট বিজনেস লঞ্চ প্যাকেজ")}</option>
                  <option value="Bespoke Custom Partnership">{t("Bespoke Custom Partnership", "কাস্টম পার্টনারশিপ")}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase tracking-wide">{t("Describe Your Business & Requirements")}</label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={t("Tell us about what you want to build, your current website, or social handles...", "আপনি কী তৈরি করতে চান, আপনার বর্তমান ওয়েবসাইট বা সোশ্যাল হ্যান্ডেল সম্পর্কে আমাদের বলুন...")}
                  className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] focus:border-transparent outline-none bg-white dark:bg-gray-900 text-sm text-[#101828] dark:text-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#FF2D2D] hover:bg-[#FF5757] disabled:bg-red-400 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{loading ? t("Sending Parameters...", "পাঠানো হচ্ছে...") : t("Request a Custom Quote")}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
