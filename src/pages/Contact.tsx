import React, { useState } from "react";
import { Phone, Mail, MapPin, MessageSquare, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { SiteContent } from "../types";
import { useLanguage } from "../lib/LanguageContext";

interface ContactProps {
  setRoute: (route: string) => void;
  siteContent: SiteContent;
  onLeadSubmit: (leadData: any) => void;
  prefilledService?: string;
}

export default function Contact({ setRoute, siteContent, onLeadSubmit, prefilledService }: ContactProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    whatsapp: "",
    message: prefilledService ? `I am interested in getting started with the ${prefilledService} package.` : "",
  });
  const [selectedService, setSelectedService] = useState<string>(prefilledService || "General Inquiry");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
    if (prefilledService) {
      setSelectedService(prefilledService);
      setFormData(prev => ({
        ...prev,
        message: prev.message || `I am interested in getting started with the ${prefilledService} package.`
      }));
    }
  }, [prefilledService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.whatsapp.trim()) {
      setErrorMsg(t("Please fill in all required fields (Name, Email, and WhatsApp).", "দয়া করে নাম, ইমেল এবং হোয়াটসঅ্যাপ ফিল্ড পূরণ করুন।"));
      return;
    }
    setLoading(true);

    const newLead = {
      id: "contact-" + Date.now(),
      type: "contact",
      fullName: formData.name.trim(),
      businessName: formData.businessName.trim() || undefined,
      email: formData.email.trim(),
      whatsappNumber: formData.whatsapp.trim(),
      serviceNeeded: selectedService,
      message: formData.message.trim() || `Inquiry regarding ${selectedService}`,
      submittedAt: new Date().toISOString(),
      status: "New",
    };

    try {
      await onLeadSubmit(newLead);
      setSubmitted(true);
      setFormData({
        name: "",
        businessName: "",
        email: "",
        whatsapp: "",
        message: "",
      });
    } catch (err: any) {
      console.error("Failed to submit contact lead:", err);
      setErrorMsg(t("Failed to save your inquiry. Please try again or reach out directly on WhatsApp.", "বার্তা সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন বা হোয়াটসঅ্যাপে যোগাযোগ করুন।"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-transparent min-h-screen py-16 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title head banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-sm font-bold text-[#FF2D2D] uppercase tracking-widest bg-[#FFE8E5] dark:bg-red-950/50 px-4 py-1.5 rounded-full inline-block">
            {t("Contact Us")}
          </span>
          <h1 className="text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight sm:text-5xl font-display">
            {t("Let’s Build Something Amazing Together")}
          </h1>
          <p className="text-[#475467] dark:text-gray-300 text-base sm:text-lg">
            {t("Whether you want to launch a responsive e-commerce platform, upgrade graphic assets, edit reels, or completely outsource social management, our directors are ready.")}
          </p>
        </div>

        {/* Contact Split layout grids */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch max-w-6xl mx-auto">
          
          {/* Info Side column */}
          <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
            
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-[#101828] dark:text-white">{t("Direct Communications")}</h2>
              <p className="text-xs text-[#475467] dark:text-gray-300 leading-relaxed">
                {t("We respond within hours. Select your preferred communication pipeline to speak with an account manager directly.")}
              </p>

              <div className="space-y-4">
                
                <a
                  href={`tel:${siteContent.phone}`}
                  className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 p-5 rounded-2xl flex items-center space-x-4 hover:border-[#FF2D2D] transition-all block group"
                >
                  <div className="p-3 bg-[#FFE8E5] dark:bg-red-950/50 rounded-xl text-[#FF2D2D] group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-[#475467] dark:text-gray-400 block">{t("Direct Phone Support")}</span>
                    <span className="text-sm font-extrabold text-[#101828] dark:text-white block mt-0.5">{siteContent.phone}</span>
                  </div>
                </a>

                <a
                  href={`mailto:${siteContent.email}`}
                  className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 p-5 rounded-2xl flex items-center space-x-4 hover:border-[#FF2D2D] transition-all block group"
                >
                  <div className="p-3 bg-[#FFE8E5] dark:bg-red-950/50 rounded-xl text-[#FF2D2D] group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs text-[#475467] dark:text-gray-400 block">{t("Official Email Address")}</span>
                    <span className="text-sm font-extrabold text-[#101828] dark:text-white block mt-0.5 break-all">{siteContent.email}</span>
                  </div>
                </a>

                <a
                  href={siteContent.socials.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 p-5 rounded-2xl flex items-center space-x-4 hover:border-emerald-500 transition-all block group"
                >
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-[#475467] dark:text-gray-400 block">{t("Chat on WhatsApp (Fastest response)")}</span>
                    <span className="text-sm font-extrabold text-[#101828] dark:text-white block mt-0.5">{t("Send Instant Text")}</span>
                  </div>
                </a>

              </div>
            </div>

            {/* SLA Response card */}
            <div className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 p-6 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">{t("Response SLAs:")}</h3>
              <ul className="space-y-2 text-xs text-[#475467] dark:text-gray-300">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                  <span>{t("WhatsApp: Under 2 Hours (9 AM - 10 PM)")}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                  <span>{t("Email: Under 12 Hours (Mon - Sat)")}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                  <span>{t("Custom Proposals: Within 24 Hours")}</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Form Card column */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 p-8 md:p-10 rounded-3xl shadow-sm">
            
            {submitted ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-8 rounded-2xl text-center space-y-4 h-full flex flex-col justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{t("Inquiry Received Successfully!")}</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 max-w-md mx-auto">
                  {t("Thank you for your message. An account strategist will review your requirements and reach out via Email/WhatsApp shortly.")}
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer mx-auto"
                >
                  {t("Send Another Message")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="border-b border-[#F2E4E2] dark:border-gray-700 pb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-[#101828] dark:text-white">{t("Submit a Contact Ticket")}</h3>
                    <p className="text-xs text-[#475467] dark:text-gray-300">{t("Fill in the secure form below. We do not sell or share contact list data.")}</p>
                  </div>
                  {prefilledService && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFE8E5] dark:bg-red-950/60 border border-[#FF2D2D]/30 text-[#FF2D2D] text-xs font-bold">
                      <span>🎯 {t("Plan:")}</span>
                      <span>{prefilledService}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase">{t("Full Name *", "সম্পূর্ণ নাম *")}</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t("e.g. Rakib Hossain", "যেমন: রাকিব হোসাইন")}
                      className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-white dark:bg-gray-900 text-xs text-[#101828] dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase">{t("Business Name", "প্রতিষ্ঠানের নাম")}</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder={t("e.g. B2b Food Retail", "যেমন: বি২বি ফুড রিটেইল")}
                      className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-white dark:bg-gray-900 text-xs text-[#101828] dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase">{t("Email Address *", "ইমেইল এড্রেস *")}</label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. name@company.com"
                      className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-white dark:bg-gray-900 text-xs text-[#101828] dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase">{t("WhatsApp Number *", "হোয়াটসঅ্যাপ নম্বর *")}</label>
                    <input
                      type="tel"
                      required
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder="e.g. +880 1700-000000"
                      className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-white dark:bg-gray-900 text-xs text-[#101828] dark:text-white"
                    />
                  </div>

                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase">{t("Service Needed", "প্রয়োজনীয় সেবা")}</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-white dark:bg-gray-900 text-xs text-[#101828] dark:text-white font-medium"
                  >
                    <option value="General Inquiry">{t("General Inquiry / Consultation", "সাধারণ অনুসন্ধান / পরামর্শ")}</option>
                    <option value="Website Development">{t("High-Converting Web Development & UI/UX", "ওয়েবসাইট ডেভেলপমেন্ট ও ইউআই/ইউএক্স")}</option>
                    <option value="Brand Identity & Graphic Design">{t("Brand Identity & Graphic Design", "ব্র্যান্ড আইডেন্টিটি ও গ্রাফিক ডিজাইন")}</option>
                    <option value="Cinematic & Viral Video Editing">{t("Cinematic & Viral Video Editing", "সিনেমেটিক ভিডিও এডিটিং ও রিলস")}</option>
                    <option value="Social Media Management & Growth">{t("Social Media Management Retainer", "সোশ্যাল মিডিয়া ম্যানেজমেন্ট ও গ্রোথ")}</option>
                    <option value="eCommerce Solution">{t("Full eCommerce Solution", "সম্পূর্ণ ই-কমার্স সল্যুশন")}</option>
                    {prefilledService && !["General Inquiry", "Website Development", "Brand Identity & Graphic Design", "Cinematic & Viral Video Editing", "Social Media Management & Growth", "eCommerce Solution"].includes(prefilledService) && (
                      <option value={prefilledService}>{prefilledService}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#101828] dark:text-gray-200 uppercase">{t("Describe what your brand needs", "আপনার কি ধরণের সার্ভিস প্রয়োজন বিস্তারিত লিখুন")}</label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={t("Describe your design specifications, web page count, or social targets...", "আপনার ডিজাইন স্পেসিফিকেশন, ওয়েবসাইটের পেজ সংখ্যা বা সোশ্যাল মিডিয়া লক্ষ্যগুলো লিখুন...")}
                    className="w-full px-4 py-3 border border-[#F2E4E2] dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-white dark:bg-gray-900 text-xs text-[#101828] dark:text-white resize-none"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#FF2D2D] hover:bg-[#FF5757] disabled:bg-red-400 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{loading ? t("Sending Parameters...", "পাঠানো হচ্ছে...") : t("Send Message", "বার্তা পাঠান")}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
