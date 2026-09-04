import React from "react";
import { ShieldCheck } from "lucide-react";
import { SiteContent } from "../types";
import { useLanguage } from "../lib/LanguageContext";

interface PrivacyPolicyProps {
  siteContent: SiteContent;
}

export default function PrivacyPolicy({ siteContent }: PrivacyPolicyProps) {
  const { t } = useLanguage();
  
  const privacyData = siteContent.privacyPolicy || {
    lastUpdated: t("July 19, 2026", "১৯ জুলাই, ২০২৬"),
    introduction: t(
      "B2bfiy (“we,” “our,” or “us”) respects your privacy. This document outlines how we collect, process, and safeguard the information you provide when using our digital agency website, requesting free audits, or ordering monthly creative services.",
      "B2bfiy (“আমরা,” “আমাদের,” বা “আমাদেরকে”) আপনার গোপনীয়তাকে সম্মান করে। আপনি যখন আমাদের ডিজিটাল এজেন্সি ওয়েবসাইট ব্যবহার করেন, ফ্রি অডিট অনুরোধ করেন, বা আমাদের মাসিক সৃজনশীল সেবার অর্ডার দেন, তখন কীভাবে আমরা আপনার তথ্য সংগ্রহ, প্রক্রিয়াকরণ এবং সুরক্ষিত রাখি তা এই নথিতে আলোচনা করা হয়েছে।"
    ),
    informationCollect: t(
      "When you interact with our forms, we collect the following:\n\n• Contact Parameters: Full Name, email address, WhatsApp contact number.\n• Business Information: Company Name, existing website or Facebook page URL.\n• Project Guidelines: Desired service models, message texts, or audit contexts.",
      "আপনি যখন আমাদের ফর্মগুলোর সাথে ইন্টারঅ্যাক্ট করেন, আমরা নিম্নলিখিত তথ্যগুলো সংগ্রহ করি:\n\n• যোগাযোগের তথ্য: সম্পূর্ণ নাম, ইমেল ঠিকানা, হোয়াটসঅ্যাপ নম্বর।\n• ব্যবসায়িক তথ্য: কোম্পানির নাম, বিদ্যমান ওয়েবসাইট বা ফেসবুক পেজের লিংক।\n• প্রজেক্টের বিবরণ: প্রয়োজনীয় সেবা, বার্তার বিবরণ বা অডিটের বিষয়বস্তু।"
    ),
    howWeProcess: t(
      "We process your submitted leads to:\n\n• Analyze your online representation and deliver the Free Digital Audit document.\n• Coordinate project deliverables and pricing quotes via email/WhatsApp.\n• Dispatch periodic performance updates and billing statements to monthly partners.",
      "আমরা আপনার জমা দেওয়া তথ্যাদি নিম্নলিখিত কাজে ব্যবহার করি:\n\n• আপনার অনলাইন উপস্থিতি বিশ্লেষণ করতে এবং ফ্রি ডিজিটাল অডিট রিপোর্ট প্রদান করতে।\n• ইমেল/হোয়াটসঅ্যাপের মাধ্যমে প্রজেক্টের ডেলিভারি এবং প্রাইসিং কোটেশন নির্ধারণ করতে।\n• মাসিক পার্টনারদের কাজের পারফরম্যান্স আপডেট এবং বিলিং স্টেটমেন্ট পাঠাতে।"
    ),
    security: t(
      "We apply server-side encryption protocols and database protection firewalls to prevent unauthorized access, alteration, or data leaks. We do not sell or lease your business handles, email directories, or WhatsApp numbers to third-party marketing brokers.",
      "আমরা অননুমোদিত অ্যাক্সেস, পরিবর্তন বা তথ্য ফাঁস রোধ করতে সার্ভার-সাইড এনক্রিপশন প্রোটোকল এবং ডেটাবেস সুরক্ষা ফায়ারওয়াল প্রয়োগ করি। আমরা কোনো তৃতীয় পক্ষের মার্কেটিং ব্রোকারের কাছে আপনার ব্যবসায়িক তথ্য, ইমেল বা হোয়াটসঅ্যাপ নম্বর বিক্রি বা লিজ দিই না।"
    ),
    contact: t(
      "If you have any questions or require your lead history removed from our administrative console database, please contact us directly at hello@b2bfiy.com.",
      "আপনার যদি কোনো প্রশ্ন থাকে বা আমাদের ডাটাবেস থেকে আপনার লিড হিস্ট্রি মুছে ফেলার প্রয়োজন হয়, তবে দয়া করে সরাসরি hello@b2bfiy.com এ আমাদের সাথে যোগাযোগ করুন।"
    )
  };

  return (
    <div className="bg-transparent min-h-screen py-16 text-left">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border border-[#F2E4E2] p-8 md:p-12 rounded-3xl shadow-xs space-y-8">
        
        <div className="flex items-center space-x-3 border-b border-[#F2E4E2] pb-6">
          <ShieldCheck className="w-8 h-8 text-[#FF2D2D]" />
          <div>
            <h1 className="text-3xl font-extrabold text-[#101828] font-display">{t("Privacy Policy", "গোপনীয়তা নীতি")}</h1>
            <p className="text-xs text-[#475467] mt-1">{t("Last Updated:", "সর্বশেষ আপডেট:")} {privacyData.lastUpdated || t("July 19, 2026", "১৯ জুলাই, ২০২৬")}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-[#475467] leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#101828]">{t("1. Introduction", "১. ভূমিকা")}</h2>
            <p className="whitespace-pre-wrap">
              {privacyData.introduction}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#101828]">{t("2. Information We Collect", "২. সংগৃহীত তথ্যাদি")}</h2>
            <p className="whitespace-pre-wrap">
              {privacyData.informationCollect}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#101828]">{t("3. How We Process Information", "৩. প্রক্রিয়াকরণ পদ্ধতি")}</h2>
            <p className="whitespace-pre-wrap">
              {privacyData.howWeProcess}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#101828]">{t("4. Information Security", "৪. তথ্য নিরাপত্তা")}</h2>
            <p className="whitespace-pre-wrap">
              {privacyData.security}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#101828]">{t("5. Contact and Queries", "৫. যোগাযোগ এবং জিজ্ঞাসা")}</h2>
            <p className="whitespace-pre-wrap font-medium text-[#101828]">
              {privacyData.contact}
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
