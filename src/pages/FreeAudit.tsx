import React, { useState } from "react";
import { Sparkles, CheckCircle2, ShieldAlert, ArrowRight, Monitor, PlayCircle, HelpCircle } from "lucide-react";
import { SiteContent } from "../types";
import { useLanguage } from "../lib/LanguageContext";

interface FreeAuditProps {
  setRoute: (route: string) => void;
  siteContent: SiteContent;
  onLeadSubmit: (leadData: any) => void;
}

export default function FreeAudit({ setRoute, siteContent, onLeadSubmit }: FreeAuditProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    whatsapp: "",
    websiteUrl: "",
    service: "Complete Digital Solution",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Simple robust validation matching parameters
    if (!formData.name.trim()) {
      setErrorMsg(t("Full Name is a required field.", "সম্পূর্ণ নাম অবশ্যই পূরণ করতে হবে।"));
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMsg(t("Please provide a valid email address.", "দয়া করে একটি সঠিক ইমেল ঠিকানা প্রদান করুন।"));
      return;
    }
    if (!formData.whatsapp.trim() || formData.whatsapp.length < 8) {
      setErrorMsg(t("Please provide a valid WhatsApp contact number.", "দয়া করে একটি সঠিক হোয়াটসঅ্যাপ নম্বর প্রদান করুন।"));
      return;
    }

    setLoading(true);

    const newLead = {
      id: "audit-" + Date.now(),
      type: "free-audit",
      fullName: formData.name.trim(),
      businessName: formData.businessName.trim() || undefined,
      email: formData.email.trim(),
      whatsappNumber: formData.whatsapp.trim(),
      websiteUrl: formData.websiteUrl.trim() || undefined,
      serviceNeeded: formData.service,
      message: formData.message.trim() || "Requested Free Digital Audit & Consultation",
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
        websiteUrl: "",
        service: "Complete Digital Solution",
        message: "",
      });
    } catch (err: any) {
      console.error("Failed to submit audit lead:", err);
      setErrorMsg(t("Failed to save your audit request. Please try again or reach out on WhatsApp.", "অডিট রিকুয়েস্ট সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন বা হোয়াটসঅ্যাপে যোগাযোগ করুন।"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-transparent min-h-screen py-16 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Descriptive Perks */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#FFE8E5] text-xs font-bold text-[#FF2D2D]">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {t("Value Pack Addition", "ভ্যালু প্যাক সংযোজন")}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101828] leading-tight font-display">
                {t("Not Sure What Your Business Needs?", "আপনার ব্যবসার কী প্রয়োজন বুঝতে পারছেন না?")}
              </h1>
              <p className="text-sm text-[#475467] leading-relaxed">
                {t(
                  "Get a completely customized, high-fidelity Free Digital Audit compiled by our senior director. We will physically inspect your present layout assets and give you a detailed growth checklist.",
                  "আমাদের সিনিয়র ডিরেক্টরের তৈরি সম্পূর্ণ কাস্টমাইজড, হাই-ফিডেলিটি ফ্রি ডিজিটাল অডিট রিপোর্ট পান। আমরা আপনার বর্তমান ডিজিটাল প্ল্যাটফর্মগুলো যাচাই করে আপনাকে একটি বিস্তারিত গ্রোথ চেকলিস্ট দেব।"
                )}
              </p>
            </div>

            <div className="space-y-5">
              
              <div className="bg-white border border-[#F2E4E2] p-5 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
                  ✓
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-[#101828]">
                    {t("Website Performance Review", "ওয়েবসাইট পারফরম্যান্স পর্যালোচনা")}
                  </span>
                  <p className="text-[11px] sm:text-xs text-[#475467] mt-0.5">
                    {t("We check your site's mobile responsiveness, load speeds, and call-to-action effectiveness.", "আমরা আপনার সাইটের মোবাইল রেসপন্সিভনেস, লোড স্পিড এবং সিটিএ কার্যকারিতা যাচাই করি।")}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#F2E4E2] p-5 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
                  ✓
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-[#101828]">
                    {t("Social & Branding Inspection", "সোশ্যাল এবং ব্র্যান্ডিং নিরীক্ষা")}
                  </span>
                  <p className="text-[11px] sm:text-xs text-[#475467] mt-0.5">
                    {t("We analyze your page consistency, visual layouts, and content calendars highlighting easy wins.", "আমরা আপনার পেজের ধারাবাহিকতা, ভিজ্যুয়াল লেআউট এবং কন্টেন্ট ক্যালেন্ডার বিশ্লেষণ করি।")}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#F2E4E2] p-5 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
                  ✓
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-[#101828]">
                    {t("Competitor Gap Analysis", "প্রতিদ্বন্দ্বী গ্যাপ বিশ্লেষণ")}
                  </span>
                  <p className="text-[11px] sm:text-xs text-[#475467] mt-0.5">
                    {t("Understand where your regional competitors are outranking you and how to counter.", "আপনার আঞ্চলিক প্রতিযোগীরা কীভাবে আপনাকে ছাড়িয়ে যাচ্ছে এবং কীভাবে তা মোকাবেলা করতে হবে তা বুঝুন।")}
                  </p>
                </div>
              </div>

            </div>

            <div className="bg-[#FFE8E5] border border-[#FF2D2D]/20 p-4 rounded-2xl flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 text-[#FF2D2D] shrink-0" />
              <p className="text-[11px] text-[#FF2D2D] font-medium leading-normal">
                {t(
                  "Note: No obligations. This is 100% free with zero future lock-in requirements. We just want to demonstrate our capabilities.",
                  "দ্রষ্টব্য: কোনো বাধ্যবাধকতা নেই। এটি শতভাগ ফ্রি এবং এর সাথে ভবিষ্যৎ কোনো বাধ্যবাধকতা জড়িত নেই। আমরা শুধু আমাদের দক্ষতা প্রমাণ করতে চাই।"
                )}
              </p>
            </div>
          </div>

          {/* Right Column: Intake Form Card */}
          <div className="lg:col-span-7 bg-white border border-[#F2E4E2] p-8 md:p-12 rounded-3xl shadow-md relative">
            
            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
                <h2 className="text-xl font-bold text-emerald-800">
                  {t("Your Audit Request is Registered!", "আপনার অডিট অনুরোধটি নিবন্ধিত হয়েছে!")}
                </h2>
                <p className="text-sm text-emerald-600 max-w-md mx-auto">
                  {t(
                    "Excellent job. A creative director will compile your audit file and get in touch with you via WhatsApp/Email within 24 hours.",
                    "চমৎকার! একজন ক্রিয়েটিভ ডিরেক্টর আপনার অডিট ফাইলটি প্রস্তুত করবেন এবং ২৪ ঘণ্টার মধ্যে হোয়াটসঅ্যাপ বা ইমেলের মাধ্যমে যোগাযোগ করবেন।"
                  )}
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {t("Submit Another Audit Request", "অন্য আরেকটি অডিট অনুরোধ পাঠান")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="border-b border-[#F2E4E2] pb-4 mb-4">
                  <h2 className="text-xl font-bold text-[#101828]">
                    {t("Get My Free Audit", "আমার ফ্রি অডিটটি নিন")}
                  </h2>
                  <p className="text-xs text-[#475467]">
                    {t("Fill in the secure parameters below. Fields marked * are required.", "নিচের ফর্মটি পূরণ করুন। চিহ্নিত (*) ঘরগুলো অবশ্যই পূরণ করতে হবে।")}
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#101828] uppercase">{t("Full Name *", "সম্পূর্ণ নাম *")}</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t("e.g. Rakib Hossain", "যেমন: রাকিব হোসাইন")}
                      className="w-full px-4 py-3 border border-[#F2E4E2] rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-[#FFF7F5] text-xs text-[#101828]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#101828] uppercase">{t("Business Name", "ব্যবসার নাম")}</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder={t("e.g. Rakib Dental Care", "যেমন: রাকিব ডেন্টাল কেয়ার")}
                      className="w-full px-4 py-3 border border-[#F2E4E2] rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-[#FFF7F5] text-xs text-[#101828]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#101828] uppercase">{t("Email Address *", "ইমেল ঠিকানা *")}</label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={t("e.g. rakib@dental.com", "যেমন: rakib@dental.com")}
                      className="w-full px-4 py-3 border border-[#F2E4E2] rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-[#FFF7F5] text-xs text-[#101828]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#101828] uppercase">{t("WhatsApp Number *", "হোয়াটসঅ্যাপ নম্বর *")}</label>
                    <input
                      type="tel"
                      required
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder={t("e.g. +880 1712-345678", "যেমন: +৮৮০ ১৭১২-৩৪৫৬৭৮")}
                      className="w-full px-4 py-3 border border-[#F2E4E2] rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-[#FFF7F5] text-xs text-[#101828]"
                    />
                  </div>

                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#101828] uppercase">
                    {t("Website or Facebook Page URL", "ওয়েবসাইট বা ফেসবুক পেজের লিংক")}
                  </label>
                  <input
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                    placeholder={t("e.g. https://facebook.com/mybusiness", "যেমন: https://facebook.com/mybusiness")}
                    className="w-full px-4 py-3 border border-[#F2E4E2] rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-[#FFF7F5] text-xs text-[#101828]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#101828] uppercase">
                    {t("Service You Want Us To Audit", "যে সেবার ওপর অডিট চান")}
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#F2E4E2] rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-[#FFF7F5] text-xs text-[#101828]"
                  >
                    <option value="Website Development">{t("Website Development", "ওয়েবসাইট ডেভেলপমেন্ট")}</option>
                    <option value="Graphic Design">{t("Graphic Design", "গ্রাফিক ডিজাইন")}</option>
                    <option value="Video Editing">{t("Video Editing", "ভিডিও এডিটিং")}</option>
                    <option value="Social Media Management">{t("Social Media Management", "সোশ্যাল মিডিয়া ম্যানেজমেন্ট")}</option>
                    <option value="Complete Digital Solution">{t("Complete Digital Solution", "সম্পূর্ণ ডিজিটাল সমাধান")}</option>
                    <option value="Not Sure">{t("Not Sure", "নিশ্চিত নই")}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#101828] uppercase">
                    {t("Additional Context / message (Optional)", "অতিরিক্ত তথ্য / বার্তা (ঐচ্ছিক)")}
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={t("Tell us briefly about any conversion problems or target goals...", "আপনার লক্ষ্য বা রূপান্তর সমস্যাগুলো সংক্ষেপে আমাদের বলুন...")}
                    className="w-full px-4 py-3 border border-[#F2E4E2] rounded-xl focus:ring-2 focus:ring-[#FF2D2D] outline-none bg-[#FFF7F5] text-xs text-[#101828] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#FF2D2D] hover:bg-[#FF5757] disabled:bg-red-400 text-white font-extrabold rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{loading ? t("Registering parameters...", "নিবন্ধন করা হচ্ছে...") : t("Get My Free Audit", "আমার ফ্রি অডিটটি নিন")}</span>
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
