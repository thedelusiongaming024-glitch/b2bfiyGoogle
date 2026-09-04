import React from "react";
import { Scale } from "lucide-react";
import { SiteContent } from "../types";
import { useLanguage } from "../lib/LanguageContext";

interface TermsProps {
  siteContent: SiteContent;
}

export default function Terms({ siteContent }: TermsProps) {
  const { t } = useLanguage();

  const termsData = siteContent.terms || {
    lastUpdated: t("July 19, 2026", "১৯ জুলাই, ২০২৬"),
    scope: t(
      "By subscribing to B2bfiy monthly retainers or ordering custom website developments, you agree to coordinate with our project directors on layout requirements, content copy, or video edits on a regular basis.",
      "B2bfiy-এর মাসিক রিটেইনার সাবস্ক্রাইব করার মাধ্যমে বা কাস্টম ওয়েবসাইট তৈরির অর্ডার দেওয়ার মাধ্যমে, আপনি আমাদের প্রজেক্ট পরিচালকদের সাথে নিয়মিতভাবে লেআউট প্রয়োজনীয়তা, কনটেন্ট কপি বা ভিডিও এডিটের বিষয়ে সমন্বয় করতে সম্মত হচ্ছেন।"
    ),
    billing: t(
      "Monthly growth retainers (Starter, Growth, Premium) require upfront payment at the start of each billing cycle month. Project-based custom web developments are split into milestone payments (typically 50% deposit and 50% upon final production approval).",
      "মাসিক বৃদ্ধির রিটেইনারগুলোর (স্টার্টার, গ্রোথ, প্রিমিয়াম) জন্য প্রতি বিলিং চক্রের মাসের শুরুতে অগ্রিম অর্থ প্রদান করতে হয়। প্রজেক্ট-ভিত্তিক কাস্টম ওয়েব ডেভেলপমেন্টের জন্য পেমেন্ট ধাপে ধাপে নেওয়া হয় (সাধারণত ৫০% ডিপোজিট এবং বাকি ৫০% কাজ সম্পন্ন হওয়ার পর)।"
    ),
    ipOwnership: t(
      "Upon complete clearance of billing invoices, the client receives 100% full intellectual property ownership of all finalized custom websites, graphics, logos, layouts, and cinematic reel files. B2bfiy retains the right to display the finalized items in our public portfolio collection unless explicitly requested otherwise in writing.",
      "বিলিং চালানের সম্পূর্ণ পরিশোধের পর, ক্লায়েন্ট সমস্ত চূড়ান্ত কাস্টম ওয়েবসাইট, গ্রাফিক্স, লোগো, লেআউট এবং সিনেমাটিক রিল ফাইলের ১০০% সম্পূর্ণ মেধা সম্পত্তি মালিকানা লাভ করেন। B2bfiy চূড়ান্ত কাজগুলো আমাদের পাবলিক পোর্টফোলিও সংগ্রহে প্রদর্শনের অধিকার সংরক্ষণ করে, যদি না লিখিতভাবে অন্য কোনো অনুরোধ করা হয়।"
    ),
    cancellation: t(
      "Monthly subscription retainers can be cancelled or modified by providing a 7-day written notice before the next billing cycle. We do not provide prorated refunds for active design cycles once assets are delivered.",
      "মাসিক সাবস্ক্রিপশন রিটেইনারগুলো পরবর্তী বিলিং চক্রের ৭ দিন আগে লিখিত নোটিশ দিয়ে বাতিল বা পরিবর্তন করা যেতে পারে। একবার কাজ বা ডিজাইন ডেলিভারি করা হয়ে গেলে আমরা আংশিক রিফান্ড প্রদান করি না।"
    ),
    contact: t(
      "These terms shall be governed by applicable commercial laws. For official legal service notices, please email hello@b2bfiy.com.",
      "এই শর্তাবলী প্রযোজ্য বাণিজ্যিক আইন দ্বারা পরিচালিত হবে। অফিসিয়াল আইনি নোটিশের জন্য, দয়া করে hello@b2bfiy.com এ ইমেল করুন।"
    )
  };

  return (
    <div className="bg-transparent min-h-screen py-16 text-left">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border border-[#F2E4E2] p-8 md:p-12 rounded-3xl shadow-xs space-y-8">
        
        <div className="flex items-center space-x-3 border-b border-[#F2E4E2] pb-6">
          <Scale className="w-8 h-8 text-[#FF2D2D]" />
          <div>
            <h1 className="text-3xl font-extrabold text-[#101828] font-display">{t("Terms & Conditions", "শর্তাবলী")}</h1>
            <p className="text-xs text-[#475467] mt-1">{t("Last Updated:", "সর্বশেষ আপডেট:")} {termsData.lastUpdated || t("July 19, 2026", "১৯ জুলাই, ২০২৬")}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-[#475467] leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#101828]">{t("1. Service Scope and Agreements", "১. সেবার পরিধি ও চুক্তি")}</h2>
            <p className="whitespace-pre-wrap">
              {termsData.scope}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#101828]">{t("2. Billing and Payments", "২. বিলিং এবং পেমেন্ট")}</h2>
            <p className="whitespace-pre-wrap">
              {termsData.billing}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#101828]">{t("3. Intellectual Property Ownership", "৩. মেধা সম্পত্তি স্বত্ব")}</h2>
            <p className="whitespace-pre-wrap">
              {termsData.ipOwnership}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#101828]">{t("4. Cancellation and Refunds", "৪. বাতিলকরণ এবং রিফান্ড")}</h2>
            <p className="whitespace-pre-wrap">
              {termsData.cancellation}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#101828]">{t("5. Contact and Governance", "৫. যোগাযোগ এবং পরিচালনা")}</h2>
            <p className="whitespace-pre-wrap font-medium text-[#101828]">
              {termsData.contact}
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
