import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Monitor, 
  PenTool, 
  PlayCircle, 
  Share2, 
  ChevronRight, 
  UserCheck, 
  Zap, 
  Shield, 
  MessageSquare, 
  Star,
  Check,
  X,
  Play
} from "lucide-react";
import { SiteContent, PortfolioProject, ServicePackage, Lead } from "../types";
import { useLanguage } from "../lib/LanguageContext";
import ImageWithSkeleton from "../components/ImageWithSkeleton";
import VideoModal from "../components/VideoModal";
import { preloadImages } from "../lib/imageUtils";

interface HomeProps {
  setRoute: (route: string, extraParam?: string) => void;
  setSelectedProjectSlug: (slug: string) => void;
  siteContent: SiteContent;
  portfolios: PortfolioProject[];
  packages: ServicePackage[];
  onLeadSubmit?: (newLead: Lead) => void;
}

export default function Home({ 
  setRoute, 
  setSelectedProjectSlug, 
  siteContent, 
  portfolios, 
  packages,
  onLeadSubmit 
}: HomeProps) {
  const { language, t } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Graphic Design");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("All Videos");
  const [activeVideoProject, setActiveVideoProject] = useState<PortfolioProject | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [serviceNeeded, setServiceNeeded] = useState("Website Development");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const featuredPortfolios = portfolios.filter(p => p.featured && p.published).slice(0, 4);
  const monthlyPackages = packages.filter(p => p.type === "monthly" && p.published);

  useEffect(() => {
    if (portfolios && portfolios.length > 0) {
      preloadImages(portfolios.map((p) => p.thumbnail));
    }
  }, [portfolios]);

  // Clients logos list
  const partnerLogos = (siteContent.partners && siteContent.partners.length > 0)
    ? siteContent.partners.map(p => ({ name: p.name, logoText: p.name }))
    : [
        { name: "E-Commerce Brand", logoText: "E-Commerce Brand" },
        { name: "Restaurant Group", logoText: "Restaurant Group" },
        { name: "Local Retailer", logoText: "Local Retailer" },
        { name: "Dental Clinic", logoText: "Dental Clinic" },
        { name: "Tech Startup", logoText: "Tech Startup" }
      ];

  const [dbFaqs, setDbFaqs] = useState<{ q: string; a: string }[]>([]);

  useEffect(() => {
    fetch("/api/ai/faqs/public")
      .then((res) => res.json())
      .then((data) => {
        if (data?.faqs && Array.isArray(data.faqs) && data.faqs.length > 0) {
          setDbFaqs(data.faqs.map((f: any) => ({ q: f.question, a: f.answer })));
        }
      })
      .catch((err) => console.warn("Failed to load DB faqs for Home:", err));
  }, []);

  const defaultFaqs = [
    {
      q: "How much does a project cost?",
      a: "Our monthly growth retainers start from ৳12,000/month, and custom web development starts from ৳15,000. All prices are completely transparent with zero hidden costs."
    },
    {
      q: "How long does website development take?",
      a: "For a standard Starter Website (up to 5 pages), it takes 7–10 business days. Larger customized corporate or e-commerce websites take between 15 to 30 days depending on features."
    },
    {
      q: "Do you work with international clients?",
      a: "Yes! We work with local small businesses, restaurants, clinics, and e-commerce companies in Bangladesh, as well as startups and service brands in the US, Europe, and UAE."
    },
    {
      q: "Can I request a custom package?",
      a: "Absolutely. If none of our standard packages fit your exact requirements, contact us and we will craft a bespoke monthly or project-based agreement for your business."
    },
    {
      q: "Do you provide ongoing support?",
      a: "Yes, we provide ongoing maintenance, security updates, and performance tuning for all the websites we deliver, plus active strategizing for monthly partners."
    },
    {
      q: "How do I get started?",
      a: "The absolute best way is to submit a Request for a Free Digital Audit or chat directly with us on WhatsApp. We will analyze your online presence and recommend the best plan."
    }
  ];

  const displayFaqs = dbFaqs.length > 0 ? dbFaqs : defaultFaqs;

  const handleProjectClick = (slug: string) => {
    setSelectedProjectSlug(slug);
    setRoute("portfolio-detail", slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRouteClick = (route: string, extraParam?: string) => {
    setRoute(route, extraParam);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !whatsappNumber) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newLead: Lead = {
        id: "lead-" + Date.now(),
        type: "free-audit",
        fullName,
        businessName,
        email,
        whatsappNumber,
        websiteUrl,
        serviceNeeded,
        message: message || "Requested a Free Digital Presence Audit via Home Page form.",
        submittedAt: new Date().toISOString(),
        status: "New"
      };

      if (onLeadSubmit) {
        onLeadSubmit(newLead);
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset
      setFullName("");
      setBusinessName("");
      setEmail("");
      setWhatsappNumber("");
      setWebsiteUrl("");
      setMessage("");
    }, 1000);
  };

  // Dynamic projects for the works grid linked directly with the admin panel portfolio list:
  const recentWorks = portfolios
    .filter(p => p.published)
    .map(p => ({
      id: p.id,
      title: p.title,
      clientName: p.clientName,
      category: p.category,
      isFeatured: p.featured,
      tag: p.featured ? "FEATURED" : (p.tags && p.tags[0] ? p.tags[0].toUpperCase() : "PARTNER"),
      thumbnail: p.thumbnail,
      description: p.shortDescription,
      slug: p.slug,
      imageAspectRatio: p.imageAspectRatio,
      imageFit: p.imageFit,
      subCategory: p.subCategory,
      videoUrl: p.videoUrl,
      videoEmbed: p.videoEmbed,
      rawProject: p
    }));

  const filteredWorks = recentWorks.filter(w => {
    const matchesCategory = w.category === selectedCategory;
    if (selectedCategory === "Video Editing") {
      if (selectedSubCategory && selectedSubCategory !== "All Videos" && selectedSubCategory !== "All") {
        return matchesCategory && w.subCategory === selectedSubCategory;
      }
      return matchesCategory;
    }
    return matchesCategory;
  });

  return (
    <div className="bg-transparent transition-colors duration-300 overflow-hidden font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24 bg-[#FFF8F6]/40 dark:bg-[#0b0f19]/40 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300">
        {/* Background decorative dots & grid */}
        <div className="absolute inset-0 opacity-30 dark:opacity-10 pointer-events-none bg-[radial-gradient(#FF2D2D_0.75px,transparent_0.75px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Col: Headings & copy (Compact text column) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="space-y-4 md:space-y-5 text-left lg:col-span-5"
            >
              {/* Eyebrow Badge */}
              <motion.div 
                whileHover={{ scale: 1.04 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-[#FFD2CC] dark:border-gray-700 shadow-sm text-xs font-extrabold text-[#101828] dark:text-gray-100"
              >
                <span className="w-4 h-4 rounded-full bg-[#FF2D2D] text-white flex items-center justify-center shrink-0 font-black text-[10px] shadow-xs">
                  ✓
                </span>
                <span>{t(siteContent.hero?.badge || "Unleash Your Potential", "আপনার সম্ভাবনাকে বিকশিত করুন")}</span>
              </motion.div>

              {/* Headline (Smaller, refined typography) */}
              <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black tracking-tight text-[#101828] dark:text-white leading-[1.18]">
                {(() => {
                  const titleText = t(siteContent.hero?.title || "Build a Powerful Digital Presence That Helps Your Business Grow.");
                  const highlightText = t(siteContent.hero?.highlight || "Digital Presence");
                  const parts = titleText.split(highlightText);
                  return parts.map((part, index, arr) => (
                    <React.Fragment key={index}>
                      {part}
                      {index < arr.length - 1 && <span className="text-[#FF2D2D] font-black">{highlightText}</span>}
                    </React.Fragment>
                  ));
                })()}
              </h1>

              {/* Sub-description (Compact paragraph) */}
              <p className="text-[#475467] dark:text-gray-300 text-xs sm:text-sm leading-relaxed max-w-lg font-normal">
                {t(siteContent.hero?.description || "With a vision to turn your business into a digital powerhouse, B2bfiy is ready to enhance your brand presence with skilled experts and updated strategies. Pick your desired service from our top growth solutions.")}
              </p>

              {/* Two Red CTA Buttons (Smaller padding) */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <motion.button
                  onClick={() => handleRouteClick("free-audit")}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2.5 bg-[#FF2D2D] hover:bg-[#E02424] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#FF2D2D]/25 cursor-pointer flex items-center justify-center space-x-2 transition-shadow hover:shadow-lg hover:shadow-[#FF2D2D]/30"
                  id="hero-primary-cta"
                >
                  <Monitor className="w-4 h-4 shrink-0" />
                  <span>{t("Get a Free Consultation", "ফ্রি কনসাল্টেশন নিন")}</span>
                </motion.button>

                <motion.button
                  onClick={() => handleRouteClick("portfolio")}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-[#101828] dark:text-white border border-[#F2E4E2] dark:border-gray-700 text-xs sm:text-sm font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center space-x-2 transition-all hover:border-[#FF2D2D]/30"
                  id="hero-secondary-cta"
                >
                  <PenTool className="w-4 h-4 shrink-0 text-[#FF2D2D]" />
                  <span>{t("Browse Work & Portfolio", "আমাদের পোর্টফোলিও দেখুন")}</span>
                </motion.button>
              </div>

              {/* Bottom ISO / Trust Badge */}
              <div className="pt-2 flex items-center gap-3 border-t border-[#F2E4E2]/80 dark:border-gray-800 max-w-md">
                <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800 border border-[#FFD2CC] dark:border-gray-700 flex items-center justify-center shrink-0 shadow-xs">
                  <Shield className="w-5 h-5 text-[#FF2D2D]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#101828] dark:text-gray-200 leading-tight">
                    {t(siteContent.hero?.trustText || "One of the best ISO certified IT & Digital Service Agencies in Bangladesh", "বাংলাদেশের অন্যতম সেরা সার্টিফাইড আইটি ও ডিজিটাল এজেন্সি")}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Col: Prominent Large Hero Image Banner Frame with Floating Badges */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              className="relative lg:col-span-7 flex justify-center w-full"
            >
              <div className="relative w-full">
                {/* Outer Rounded White Container Frame */}
                <div className="relative bg-white/85 dark:bg-gray-800/85 backdrop-blur-md p-3 sm:p-4 rounded-[30px] sm:rounded-[40px] border-2 border-[#F2E4E2] dark:border-gray-700 shadow-[0_20px_60px_rgba(255,45,45,0.08)] dark:shadow-none overflow-hidden group">
                  <div className="relative rounded-[22px] sm:rounded-[32px] overflow-hidden aspect-video bg-[#FFE8E5] dark:bg-gray-900 w-full">
                    <img 
                      src={siteContent.hero.imageUrl || "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80"} 
                      alt="B2Bfiy Digital Agency"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. SERVICE CATEGORY FLOATING ROW */}
      <section className="relative px-4 sm:px-6 lg:px-8 bg-[#FFF7F5]/50 dark:bg-[#0b0f19]/50 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {[
              { 
                title: t("Website Development", "ওয়েবসাইট ডেভেলপমেন্ট"), 
                icon: <Monitor className="w-5 h-5" />, 
                categoryKey: "website" as const,
                desc: t("We build modern, fast, mobile friendly websites designed to turn visitors into potential customers.", "আমরা তৈরি করি আধুনিক, দ্রুত ও মোবাইল-বান্ধব ওয়েবসাইট যা আপনার ভিজিটরদের কাস্টমারে রূপান্তর করবে।") 
              },
              { 
                title: t("Graphic Design", "গ্রাফিক্স ডিজাইন"), 
                icon: <PenTool className="w-5 h-5" />, 
                categoryKey: "graphic" as const,
                desc: t("Professional visual content that makes your brand look consistent, trustworthy, and memorable.", "পেশাদার ভিজ্যুয়াল কনটেন্ট যা আপনার ব্র্যান্ডকে সবার কাছে বিশ্বস্ত, সামঞ্জস্যপূর্ণ এবং স্মরণীয় করে তোলে।") 
              },
              { 
                title: t("Video Editing", "ভিডিও এডিটিং"), 
                icon: <PlayCircle className="w-5 h-5" />, 
                categoryKey: "video" as const,
                desc: t("Engaging video content designed to capture attention and communicate your message effectively.", "আকর্ষণীয় ভিডিও কনটেন্ট যা সবার মনোযোগ কেড়ে নেবে এবং আপনার বার্তা সঠিকভাবে পৌঁছে দেবে।") 
              },
              { 
                title: t("Social Media Management", "সোশ্যাল মিডিয়া ম্যানেজমেন্ট"), 
                icon: <Share2 className="w-5 h-5" />, 
                categoryKey: "monthly" as const,
                desc: t("We manage your social media presence so you can focus on running your business.", "আমরা আপনার সোশ্যাল মিডিয়া পেজগুলো পরিচালনা করি যাতে আপনি আপনার ব্যবসায়ে মনোনিবেশ করতে পারেন।") 
              }
            ].map((serv, idx) => {
              const categoryPackages = packages.filter(p => p.type === serv.categoryKey && p.published);
              const starterPlan = categoryPackages.find(p => p.title.toLowerCase().includes("starter")) || categoryPackages[0];
              const starterLabel = starterPlan 
                ? `${t("Starter Plan", "স্টার্টার প্ল্যান")} • ${starterPlan.price}${starterPlan.period === "Month" ? "/mo" : ""}`
                : t("Explore Starter Plan", "স্টার্টার প্ল্যান দেখুন");

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  onClick={() => handleRouteClick("packages", serv.categoryKey)}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-[#F2E4E2] dark:border-gray-700/80 p-6 rounded-2xl shadow-[0_4px_20px_rgba(255,45,45,0.02)] hover:shadow-xl hover:shadow-[#FF2D2D]/10 hover:border-[#FF2D2D]/30 transition-all cursor-pointer text-left flex flex-col justify-between h-full group"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFE8E5] dark:bg-red-950/40 text-[#FF2D2D] flex items-center justify-center transition-colors group-hover:bg-[#FF2D2D] group-hover:text-white">
                      {serv.icon}
                    </div>
                    <h3 className="text-base font-extrabold text-[#101828] dark:text-white group-hover:text-[#FF2D2D] transition-colors">
                      {serv.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed">
                      {serv.desc}
                    </p>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-[#FFF1EF] dark:border-gray-700/50 flex items-center justify-between gap-1 text-xs font-bold text-[#FF2D2D]">
                    <span>{starterLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                </motion.div>
              );
            })}

          </div>
        </div>
      </section>

      {/* 3. TRUST & LOGO ROW */}
      <section className="py-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t border-b border-[#F2E4E2]/60 dark:border-gray-800/60 overflow-hidden relative">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-slow {
            display: flex;
            width: max-content;
            animation: marquee 30s linear infinite;
          }
          .animate-marquee-slow:hover {
            animation-play-state: paused;
          }
        `}} />
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <span className="text-[11px] font-extrabold text-[#475467]/90 dark:text-gray-400 uppercase tracking-[0.15em] block px-4">
            {t("TRUSTED BY BUSINESSES WE'VE WORKED WITH", "আমাদের সাথে কাজ করা নির্ভরযোগ্য প্রতিষ্ঠানসমূহ")}
          </span>
          
          {/* Slider Container with Fading Edges */}
          <div className="relative w-full overflow-hidden py-1">
            {/* Left and Right ambient smooth gradients */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white/90 dark:from-[#0b0f19]/90 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white/90 dark:from-[#0b0f19]/90 to-transparent z-10 pointer-events-none" />
            
            {/* The infinite ticker row */}
            <div className="animate-marquee-slow flex items-center gap-12 sm:gap-16">
              {[...partnerLogos, ...partnerLogos, ...partnerLogos, ...partnerLogos].map((logo, idx) => (
                <span 
                  key={idx} 
                  className="text-sm sm:text-base font-extrabold text-[#475467] dark:text-gray-300 tracking-tight font-mono select-none opacity-60 hover:opacity-100 hover:text-[#FF2D2D] hover:scale-105 transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap cursor-pointer"
                >
                  <span className="text-[#FF2D2D] text-xs">■</span> {logo.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. STATISTICS ROW SECTION */}
      <section className="py-12 bg-white/60 dark:bg-gray-800/40 backdrop-blur-md px-4 sm:px-6 lg:px-8 border-b border-[#F2E4E2]/40 dark:border-gray-800/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* NOTE: Placeholder until real numbers are added via Admin -- do not
                display unverified stats as fact. */}
            {(siteContent.stats && siteContent.stats.length > 0 ? siteContent.stats : [
              { id: "stat-1", value: "—", label: "Projects Completed" },
              { id: "stat-2", value: "—", label: "Happy Clients" },
              { id: "stat-3", value: "—", label: "Years of Experience" },
              { id: "stat-4", value: "—", label: "Client Satisfaction" }
            ]).map((st, idx) => (
              <motion.div 
                key={st.id || idx} 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="text-center space-y-1.5 border-r border-[#F2E4E2] dark:border-gray-800 odd:border-r even:border-r-0 lg:border-r lg:last:border-r-0 px-2"
              >
                <span className="text-3xl sm:text-4.5xl font-extrabold text-[#FF2D2D] block tracking-tight">
                  {st.value}
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#475467] dark:text-gray-300 block">
                  {t(st.label)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PROBLEM & SOLUTION SECTION */}
      <section className="py-16 md:py-24 bg-transparent px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            
            {/* Left side: The struggle */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6 text-left"
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFE8E5] dark:bg-red-950/50 text-[11px] font-bold text-[#FF2D2D] uppercase tracking-wider">
                {t("THE DIGITAL PROBLEM", "ডিজিটাল সমস্যা")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight">
                {t("Is Your Business Struggling to Stand Out Online?", "আপনার ব্যবসা কি অনলাইনে নিজস্ব পরিচয় তৈরি করতে সমস্যার সম্মুখীন হচ্ছে?")}
              </h2>
              <p className="text-[#475467] dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {t("Managing a modern business is stressful enough without also having to write social copy, render daily vector graphics, optimize search parameters, and cut marketing clips. Here are the symptoms of outdated presence:", "সোশ্যাল কপি লেখা, ছবি ডিজাইন করা বা ভিডিও কাটছাঁট করা ছাড়াই একটি আধুনিক ব্যবসা পরিচালনা করা বেশ কঠিন। আপনার অনলাইন উপস্থিতি পিছিয়ে পড়ার কিছু লক্ষণ:")}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  { title: t("Outdated, Slow Website", "পুরনো ও ধীরগতির ওয়েবসাইট"), desc: t("No mobile responsiveness or modern appointment funnels", "মোবাইল রেসপনসিভ নয় বা আধুনিক বুকিং সুবিধা নেই") },
                  { title: t("Inconsistent Post Feeds", "অনিয়মিত সোশ্যাল মিডিয়া পোস্ট"), desc: t("Empty social channels that fail to activate prospects", "খালি সোশ্যাল পেজ যা কাস্টমার আকর্ষণে ব্যর্থ") },
                  { title: t("Unprofessional Graphics", "অপেশাদার গ্রাফিক্স"), desc: t("Sloppy brand visuals ruining your corporate authority", "নিম্নমানের ছবি যা আপনার ব্র্যান্ডের মান নষ্ট করছে") },
                  { title: t("Low-engagement Videos", "কম এনগেজমেন্টের ভিডিও"), desc: t("Missing the dynamic touch needed to attract target clients", "কাস্টমারদের আকৃষ্ট করার মতো ডায়নামিক কনটেন্টের অভাব") }
                ].map((prob, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-[#FFE8E5] dark:border-gray-700 p-5 rounded-2xl flex items-start gap-3 shadow-xs hover:shadow-md transition-all"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#FFE8E5] dark:bg-red-950/60 text-[#FF2D2D] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">✕</span>
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-[#101828] dark:text-white">{prob.title}</h4>
                      <p className="text-[11px] sm:text-xs text-[#475467] dark:text-gray-300 leading-normal">{prob.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right side: The B2bfiy Cure dark box */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#101828]/95 dark:bg-[#0e1424]/95 backdrop-blur-xl rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden text-left shadow-2xl space-y-6 border border-gray-800/80"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#FF2D2D]/20 rounded-full blur-3xl pointer-events-none" />
              
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF2D2D]/10 border border-[#FF2D2D]/20 text-[10px] font-bold text-[#FF5757] uppercase tracking-widest">
                {t("THE B2BFIY CURE", "B2BFIY-এর কার্যকর সমাধান")}
              </span>
              
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {t("You Focus on Your Business. We Handle Your Complete Digital Presence.", "আপনি আপনার ব্যবসায় মনোযোগ দিন। আপনার সম্পূর্ণ ডিজিটাল উপস্থিতি আমরা সামলাবো।")}
              </h3>
              
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                {t("B2bfiy serves as your personal creative, technology, and marketing department. We deploy skilled designers, responsive developers, and video editors directly onto your brand.", "B2bfiy আপনার নিজস্ব ক্রিয়েটিভ, প্রযুক্তি এবং মার্কেটিং ডিপার্টমেন্ট হিসেবে কাজ করে। আমরা আপনার ব্র্যান্ডের জন্য অভিজ্ঞ ডিজাইনার, ডেভেলপার এবং ভিডিও এডিটর নিয়োজিত করি।")}
              </p>
              
              <ul className="space-y-3.5 pt-2">
                {[
                  t("100% original, premium designs made from scratch", "১০০% অরিজিনাল ও প্রিমিয়াম কাস্টম ডিজাইন"),
                  t("Ultra-fast website development loaded with features", "প্রয়োজনীয় ফিচার সমৃদ্ধ দ্রুতগতির ওয়েবসাইট ডেভেলপমেন্ট"),
                  t("Complete content strategy planning and monthly calendar", "সম্পূর্ণ কনটেন্ট স্ট্র্যাটেজি প্ল্যানিং ও মাসিক ক্যালেন্ডার"),
                  t("No overheads of managing multiple unreliable freelancers", "একাধিক ফ্রিল্যান্সার সামলানোর মানসিক চাপ নেই")
                ].map((sol, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{sol}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRouteClick("contact")}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#FF2D2D] hover:bg-[#FF5757] text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#FF2D2D]/20"
                >
                  <span>{t("Let's Grow Your Business", "চলুন আপনার ব্যবসা বড় করি")}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 6. EVERYTHING YOUR BUSINESS NEEDS TO GROW ONLINE */}
      <section className="py-16 md:py-24 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border-t border-b border-[#F2E4E2]/40 dark:border-gray-800/40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-[11px] font-bold text-[#FF2D2D] bg-[#FFE8E5] px-3 py-1 rounded-full uppercase tracking-wider">
              {t("PROFESSIONAL CAPABILITIES", "আমাদের পেশাদার সেবাসমূহ")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101828] tracking-tight">
              {t("Everything Your Business Needs to Grow Online", "অনলাইনে আপনার ব্যবসা বৃদ্ধির জন্য প্রয়োজনীয় সবকিছু")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            
            {/* Capability Card 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-md border border-[#F2E4E2] dark:border-gray-700/80 p-8 rounded-3xl flex flex-col justify-between h-full space-y-6 shadow-sm hover:shadow-xl hover:shadow-[#FF2D2D]/10 hover:border-[#FF2D2D]/30 transition-all"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFE8E5] dark:bg-red-950/40 text-[#FF2D2D] flex items-center justify-center">
                  <Monitor className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-[#101828] dark:text-white">{t("Website Development", "ওয়েবসাইট ডেভেলপমেন্ট")}</h3>
                <p className="text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed">
                  {t("We build modern, fast, mobile friendly websites designed to turn visitors into potential customers.", "আমরা তৈরি করি আধুনিক, দ্রুত ও মোবাইল-বান্ধব ওয়েবসাইট যা আপনার ভিজিটরদের কাস্টমারে রূপান্তর করবে।")}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-[#101828] dark:text-gray-200 pt-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Business Websites", "বিজনেস ওয়েবসাইট")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Landing Pages", "ল্যান্ডিং পেজ")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("E-commerce Solutions", "ই-কমার্স সলিউশন")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Custom Web-Apps", "কাস্টম ওয়েব-অ্যাপ")}</span>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRouteClick("packages", "website")}
                className="w-full py-3.5 bg-[#FFF1EF] dark:bg-gray-700/60 hover:bg-[#FF2D2D] dark:hover:bg-[#FF2D2D] hover:text-white dark:hover:text-white text-[#FF2D2D] dark:text-red-300 text-xs font-bold rounded-xl transition-all duration-300 uppercase tracking-wider shadow-xs hover:shadow-lg hover:shadow-red-500/20 cursor-pointer"
              >
                {t("View Packages & Pricing", "প্যাকেজ এবং প্রাইসিং দেখুন")}
              </motion.button>
            </motion.div>

            {/* Capability Card 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-md border border-[#F2E4E2] dark:border-gray-700/80 p-8 rounded-3xl flex flex-col justify-between h-full space-y-6 shadow-sm hover:shadow-xl hover:shadow-[#FF2D2D]/10 hover:border-[#FF2D2D]/30 transition-all"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFE8E5] dark:bg-red-950/40 text-[#FF2D2D] flex items-center justify-center">
                  <PenTool className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-[#101828] dark:text-white">{t("Graphic Design", "গ্রাফিক্স ডিজাইন")}</h3>
                <p className="text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed">
                  {t("Professional visual content that makes your brand look consistent, trustworthy, and memorable.", "পেশাদার ভিজ্যুয়াল কনটেন্ট যা আপনার ব্র্যান্ডকে সবার কাছে বিশ্বস্ত, সামঞ্জস্যপূর্ণ এবং স্মরণীয় করে তোলে।")}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-[#101828] dark:text-gray-200 pt-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Social Media Designs", "সোশ্যাল মিডিয়া ডিজাইন")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Branding & Identity", "ব্র্যান্ডিং ও আইডেন্টিটি")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Marketing Creatives", "মার্কেটিং ক্রিয়েটিভস")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Promotional Materials", "প্রোমোশনাল মেটেরিয়ালস")}</span>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRouteClick("packages", "graphic")}
                className="w-full py-3.5 bg-[#FFF1EF] dark:bg-gray-700/60 hover:bg-[#FF2D2D] dark:hover:bg-[#FF2D2D] hover:text-white dark:hover:text-white text-[#FF2D2D] dark:text-red-300 text-xs font-bold rounded-xl transition-all duration-300 uppercase tracking-wider shadow-xs hover:shadow-lg hover:shadow-red-500/20 cursor-pointer"
              >
                {t("View Packages & Pricing", "প্যাকেজ এবং প্রাইসিং দেখুন")}
              </motion.button>
            </motion.div>

            {/* Capability Card 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-md border border-[#F2E4E2] dark:border-gray-700/80 p-8 rounded-3xl flex flex-col justify-between h-full space-y-6 shadow-sm hover:shadow-xl hover:shadow-[#FF2D2D]/10 hover:border-[#FF2D2D]/30 transition-all"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFE8E5] dark:bg-red-950/40 text-[#FF2D2D] flex items-center justify-center">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-[#101828] dark:text-white">{t("Video Editing", "ভিডিও এডিটিং")}</h3>
                <p className="text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed">
                  {t("Engaging video content designed to capture attention and communicate your message effectively.", "আকর্ষণীয় ভিডিও কনটেন্ট যা সবার মনোযোগ কেড়ে নেবে এবং আপনার বার্তা সঠিকভাবে পৌঁছে দেবে।")}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-[#101828] dark:text-gray-200 pt-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Shorts & Vertical Reels", "শর্টস ও ভার্টিক্যাল রিলস")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Promotional Videos", "প্রোমোশনাল ভিডিও")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Social Content Editing", "সোশ্যাল কনটেন্ট এডিটিং")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Custom Motion Graphics", "কাস্টম মোশন গ্রাফিক্স")}</span>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRouteClick("packages", "video")}
                className="w-full py-3.5 bg-[#FFF1EF] dark:bg-gray-700/60 hover:bg-[#FF2D2D] dark:hover:bg-[#FF2D2D] hover:text-white dark:hover:text-white text-[#FF2D2D] dark:text-red-300 text-xs font-bold rounded-xl transition-all duration-300 uppercase tracking-wider shadow-xs hover:shadow-lg hover:shadow-red-500/20 cursor-pointer"
              >
                {t("View Packages & Pricing", "প্যাকেজ এবং প্রাইসিং দেখুন")}
              </motion.button>
            </motion.div>

            {/* Capability Card 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-md border border-[#F2E4E2] dark:border-gray-700/80 p-8 rounded-3xl flex flex-col justify-between h-full space-y-6 shadow-sm hover:shadow-xl hover:shadow-[#FF2D2D]/10 hover:border-[#FF2D2D]/30 transition-all"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFE8E5] dark:bg-red-950/40 text-[#FF2D2D] flex items-center justify-center">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-[#101828] dark:text-white">{t("Social Media Management", "সোশ্যাল মিডিয়া ম্যানেজমেন্ট")}</h3>
                <p className="text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed">
                  {t("We manage your social media presence so you can focus on running your business.", "আমরা আপনার সোশ্যাল মিডিয়া পেজগুলো পরিচালনা করি যাতে আপনি আপনার ব্যবসায়ে মনোনিবেশ করতে পারেন।")}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-[#101828] dark:text-gray-200 pt-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Strategy & Calendar", "স্ট্র্যাটেজি ও ক্যালেন্ডার")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Post Design & Styling", "পোস্ট ডিজাইন ও স্টাইলিং")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Captions & Tags", "ক্যাপশন ও ট্যাগের সুবিধা")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                    <span>{t("Reporting & Analytics", "রিপোর্টিং ও অ্যানালিটিক্স")}</span>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRouteClick("packages", "monthly")}
                className="w-full py-3.5 bg-[#FFF1EF] dark:bg-gray-700/60 hover:bg-[#FF2D2D] dark:hover:bg-[#FF2D2D] hover:text-white dark:hover:text-white text-[#FF2D2D] dark:text-red-300 text-xs font-bold rounded-xl transition-all duration-300 uppercase tracking-wider shadow-xs hover:shadow-lg hover:shadow-red-500/20 cursor-pointer"
              >
                {t("View Packages & Pricing", "প্যাকেজ এবং প্রাইসিং দেখুন")}
              </motion.button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 7. WHY BUSINESSES PARTNER WITH US */}
      <section className="py-16 md:py-24 bg-transparent px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-[11px] font-bold text-[#FF2D2D] bg-[#FFE8E5] dark:bg-red-950/50 px-3 py-1 rounded-full uppercase tracking-wider">
              {t("The B2bfiy Difference", "B2bfiy-এর বিশেষত্ব")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight">
              {t("Why Businesses Partner With Us", "কেন ব্যবসায়ীরা আমাদের বেছে নেন")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                title: t("One Team for Everything", "সবকিছুর জন্য একটি টিম"), 
                desc: t("No more separate freelancers. We handle your audience, graphics, videos, and social media under one roof.", "একাধিক ফ্রিল্যান্সার সামলানোর ঝামেলা আর নয়। আমরা একই ছাদের নিচে ওয়েবসাইট, গ্রাফিক্স, ভিডিও এবং সোশ্যাল মিডিয়া ম্যানেজ করি।"),
                icon: <UserCheck className="w-5 h-5" />
              },
              { 
                title: t("Custom Solutions", "কাস্টমাইজড সমাধান"), 
                desc: t("We do not believe in templates. Every design and campaign is custom tailored to your specific business goals.", "আমরা সাধারণ টেমপ্লেটে বিশ্বাসী নই। প্রতিটি ডিজাইন এবং ক্যাম্পেইন আপনার ব্যবসার লক্ষ্য অনুযায়ী তৈরি করা হয়।"),
                icon: <Zap className="w-5 h-5" />
              },
              { 
                title: t("Professional Quality", "পেশাদার মান"), 
                desc: t("Deliver premium standards with beautiful layouts, clean typography, engaging cuts, and solid responsive scripts.", "সুন্দর লেআউট, আকর্ষণীয় টাইপোগ্রাফি এবং মানসম্মত কন্টেন্ট সহ প্রিমিয়াম কোয়ালিটি নিশ্চিত করি।"),
                icon: <Shield className="w-5 h-5" />
              },
              { 
                title: t("Fast Communication", "দ্রুত যোগাযোগ"), 
                desc: t("Dedicated account coordinators ensure you are always in the loop via WhatsApp and email, responding in minutes.", "হোয়াটসঅ্যাপ এবং ইমেইলে আমাদের অ্যাকাউন্ট কোঅর্ডিনেটর দ্রুত সময়ের মধ্যে আপনার সাথে যোগাযোগ রাখবে।"),
                icon: <MessageSquare className="w-5 h-5" />
              },
              { 
                title: t("Affordable Packages", "সাশ্রয়ী প্যাকেজ"), 
                desc: t("Flexible and transparent monthly packages completely customized for growing startups and local businesses.", "ছোট-বড় ব্যবসা এবং স্টার্টআপের জন্য সম্পূর্ণ স্বচ্ছ ও নমনীয় মাসিক প্যাকেজ।"),
                icon: <CheckCircle2 className="w-5 h-5" />
              },
              { 
                title: t("Ongoing Growth Support", "ক্রমাগত সাপোর্ট"), 
                desc: t("We do not just hand over the assets. We continuously monitor performance, optimizing to scale your leads and views.", "আমরা শুধু কাজ হস্তান্তর করে চলে যাই না। প্রতিনিয়ত পারফরম্যান্স মনিটর করে আপনার কাস্টমার বাড়াতে সহায়তা করি।"),
                icon: <ArrowRight className="w-5 h-5" />
              }
            ].map((diff, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-md border border-[#F2E4E2] dark:border-gray-700/80 p-8 rounded-2xl text-left space-y-4 hover:border-[#FF2D2D]/30 transition-all flex flex-col justify-between shadow-xs hover:shadow-lg"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFE8E5] dark:bg-red-950/40 text-[#FF2D2D] flex items-center justify-center">
                    {diff.icon}
                  </div>
                  <h3 className="text-base font-extrabold text-[#101828] dark:text-white">{diff.title}</h3>
                  <p className="text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed">
                    {diff.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. EXPLORE OUR RECENT CREATIVE WORKS */}
      <section className="py-16 md:py-24 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-t border-b border-[#F2E4E2]/40 dark:border-gray-800/40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-[#FF2D2D] bg-[#FFE8E5] dark:bg-red-950/50 px-3 py-1 rounded-full uppercase tracking-wider">
                {t("VISIT OUR WORKS", "আমাদের প্রজেক্টসমূহ")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight">
                {t("Explore Our Recent Creative Works", "আমাদের সাম্প্রতিক কাস্টম কাজগুলো দেখুন")}
              </h2>
            </div>
            <button
              onClick={() => handleRouteClick("portfolio")}
              className="text-sm font-bold text-[#FF2D2D] hover:text-[#FF5757] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>{t("See complete portfolio", "সম্পূর্ণ পোর্টফোলিও দেখুন")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-start border-b border-[#F2E4E2] dark:border-gray-700 pb-4">
            {["Graphic Design", "Website Development", "Video Editing", "Social Media Management"].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedSubCategory("All Videos");
                }}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#FF2D2D] text-white shadow-sm"
                    : "bg-white/80 dark:bg-gray-800/80 border border-[#F2E4E2] dark:border-gray-700 text-[#475467] dark:text-gray-300 hover:text-[#FF2D2D]"
                }`}
              >
                {t(cat)}
              </button>
            ))}
          </div>

          {/* Video Editing Sub-Categories */}
          {selectedCategory === "Video Editing" && (
            <div className="flex flex-wrap gap-2 justify-start bg-white/90 dark:bg-gray-800/90 border border-[#F2E4E2] dark:border-gray-700 p-4 rounded-2xl shadow-sm max-w-lg items-center">
              <span className="text-[10px] font-bold text-[#475467] dark:text-gray-400 uppercase tracking-wider mr-2">{t("Video Types:", "ভিডিওর ধরন:")}</span>
              {["All Videos", "Motion Video", "Reels", "Long Video"].map((sub) => {
                const isActive = selectedSubCategory === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubCategory(sub)}
                    className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#FF2D2D] text-white shadow-xs"
                        : "bg-[#FFF7F5] dark:bg-gray-700 text-[#475467] dark:text-gray-200 border border-[#F2E4E2] dark:border-gray-600 hover:bg-[#FFE8E5] hover:text-[#FF2D2D]"
                    }`}
                  >
                    {t(sub)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid Layout of Works */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-left">
            {filteredWorks.map((work) => {
              const isVideo = work.category === "Video Editing" || !!work.videoUrl || !!work.videoEmbed;

              return (
                <motion.div
                  key={work.id}
                  whileHover={{ y: -6 }}
                  onClick={() => handleProjectClick(work.slug || work.id)}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-[#F2E4E2] dark:border-gray-700 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-[#FF2D2D]/30 transition-all cursor-pointer flex flex-col h-full group"
                >
                  <div className={`relative bg-[#FFF7F5] dark:bg-neutral-900/40 overflow-hidden flex items-center justify-center ${
                    work.category === "Video Editing"
                      ? work.subCategory === "Reels"
                        ? "aspect-[9/16]"
                        : work.subCategory === "Motion Video"
                        ? "aspect-square"
                        : "aspect-video"
                      : "aspect-square"
                  }`}>
                    <ImageWithSkeleton
                      src={work.thumbnail}
                      alt={work.title}
                      imageFit={work.imageFit}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    {work.tag && (
                      <span className="absolute top-3 left-3 bg-[#FF2D2D] text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider z-20 shadow-xs">
                        {t(work.tag)}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 bg-[#101828]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm z-20">
                      {t(work.category)}
                    </span>

                    {/* Play button overlay for video projects */}
                    {isVideo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideoProject(work.rawProject);
                        }}
                        className="absolute inset-0 bg-black/30 hover:bg-black/45 flex items-center justify-center transition-colors cursor-pointer group/play z-10"
                        aria-label="Play video"
                      >
                        <div className="relative flex items-center justify-center">
                          <span className="absolute w-14 h-14 rounded-full bg-[#FF2D2D]/40 animate-ping pointer-events-none" />
                          <div className="w-12 h-12 rounded-full bg-[#FF2D2D] text-white flex items-center justify-center shadow-[0_0_25px_rgba(255,45,45,0.85)] border-2 border-white/90 group-hover/play:scale-110 transition-transform duration-300">
                            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#475467] dark:text-gray-400 uppercase tracking-wider font-bold">
                        {t(work.clientName)}
                      </span>
                      <h3 className="text-base font-extrabold text-[#101828] dark:text-white line-clamp-1 group-hover:text-[#FF2D2D] transition-colors">
                        {t(work.title)}
                      </h3>
                      <p className="text-xs text-[#475467] dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {t(work.description)}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-[#FFF1EF] dark:border-gray-700 text-xs text-[#FF2D2D] font-bold flex items-center justify-between">
                      {isVideo ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveVideoProject(work.rawProject);
                          }}
                          className="px-3 py-1 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-[11px] font-bold rounded-lg flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-white text-white" />
                          <span>{t("Play Video", "ভিডিও চালান")}</span>
                        </button>
                      ) : (
                        <span>{t("View Project Case Study", "কেস স্টাডি দেখুন")}</span>
                      )}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {selectedCategory === "Graphic Design" && (
            <div className="flex justify-center mt-12">
              <motion.a
                href={siteContent.viewAllGraphicsLink || "https://www.behance.net"}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0px 10px 30px rgba(255, 45, 45, 0.15)"
                }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  y: [0, -3, 0]
                }}
                transition={{
                  y: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                className="px-8 py-4 bg-white border-2 border-[#FF2D2D] text-[#FF2D2D] hover:bg-[#FFE8E5] text-sm font-extrabold rounded-full transition-all inline-flex items-center gap-2.5 cursor-pointer shadow-md"
              >
                <span>{t("View All Graphics Design", "সকল গ্রাফিক্স ডিজাইন দেখুন")}</span>
                <motion.span
                  animate={{
                    x: [0, 4, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-block"
                >
                  <ArrowRight className="w-4 h-4 text-[#FF2D2D]" />
                </motion.span>
              </motion.a>
            </div>
          )}

        </div>
      </section>

      {/* 9. WORKING PIPELINE */}
      <section className="py-20 md:py-28 bg-transparent px-4 sm:px-6 lg:px-8 border-b border-[#F2E4E2]/40 dark:border-gray-800/40">
        <div className="max-w-7xl mx-auto space-y-16 text-center">
          
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#FFE8E5] dark:bg-red-950/50 text-xs font-extrabold text-[#FF2D2D] border border-[#FFD2CC]/40 tracking-wider">
              {t("Working Pipeline", "কাজের ধাপসমূহ")}
            </span>
            <h2 className="text-3.5xl sm:text-4.5xl lg:text-[48px] font-black text-[#101828] dark:text-white tracking-tight leading-[1.15]">
              {t("Our Proven Content & Dev Pipeline", "আমাদের সুনির্দিষ্ট কর্মপদ্ধতি")}
            </h2>
          </div>

          {/* 5 Column Grid precisely matching the image layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 lg:gap-10 text-left max-w-7xl mx-auto">
            {[
              { 
                num: "01", 
                title: t("Discovery", "মূল্যায়ণ"), 
                desc: t("We start by deeply analyzing your business model, target market, competitor positioning, and specific digital challenges.", "আমরা আপনার ব্যবসার ধরণ, টার্গেট কাস্টমার এবং প্রতিযোগীদের বাজার গভীরভাবে পর্যালোচনা করে শুরু করি।") 
              },
              { 
                num: "02", 
                title: t("Strategy", "কৌশল নির্ধারণ"), 
                desc: t("Our team crafts a precise, tailored growth plan outlining your content calendar, website blueprints, and video guidelines.", "আমাদের টিম আপনার জন্য সুনির্দিষ্ট কনটেন্ট ক্যালেন্ডার, ওয়েবসাইট ব্লুপ্রিন্ট ও ভিডিও গাইডলাইন তৈরি করে।") 
              },
              { 
                num: "03", 
                title: t("Create", "ডিজাইন ও ডেভেলপমেন্ট"), 
                desc: t("Our professional designers, editors, and web developers design high-converting assets customized to make you look premium.", "আমাদের পেশাদার ডিজাইনার ও ডেভেলপাররা আপনার ব্র্যান্ডকে আকর্ষণীয় করতে মানসম্মত ডিজাইন তৈরি করেন।") 
              },
              { 
                num: "04", 
                title: t("Launch", "প্রচার শুরু"), 
                desc: t("With full optimization in place, we launch your web platforms and push high-engaging visual campaigns to your target audience.", "সম্পূর্ণ অপ্টিমাইজেশনের পর আপনার ওয়েবসাইট লাইভ করি এবং আকর্ষণীয় ক্যাম্পেইন পরিচালনা করি।") 
              },
              { 
                num: "05", 
                title: t("Support & Growth", "সাপোর্ট ও বৃদ্ধি"), 
                desc: t("We track monthly views and leads, continually refining layouts and plans to scale your online customer base.", "আমরা প্রতি মাসের ভিউ ও কাস্টমার রেসপন্স ট্র্যাক করে নিয়মিত আপডেট ও সার্বিক সাপোর্ট দিয়ে থাকি।") 
              }
            ].map((step, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-5 rounded-2xl border border-[#F2E4E2] dark:border-gray-700/80 shadow-xs hover:shadow-md transition-all duration-300 space-y-4 group cursor-default"
              >
                <div className="w-7 h-7 rounded-full bg-[#FF2D2D] text-white flex items-center justify-center font-black text-xs shadow-sm transform group-hover:scale-110 transition-transform duration-300">
                  {step.num}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#101828] dark:text-white tracking-tight group-hover:text-[#FF2D2D] transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 10. MONTHLY PLANS PRICING Retainers */}
      <section className="py-16 md:py-24 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-t border-[#F2E4E2]/40 dark:border-gray-800/40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-[11px] font-bold text-[#FF2D2D] bg-[#FFE8E5] dark:bg-red-950/50 px-3 py-1 rounded-full uppercase tracking-wider">
              {t("Flexible Subscriptions")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight">
              {t("Choose the Right Monthly Growth Plan")}
            </h2>
            <p className="text-[#475467] dark:text-gray-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
              {t("Streamlined professional graphics and dynamic reels tailored to build authority and drive leads daily.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-stretch max-w-6xl mx-auto">
            {monthlyPackages.map((pkg) => {
              const isPopular = pkg.isPopular || pkg.title.toLowerCase().includes("growth");
              return (
                <motion.div
                  key={pkg.id}
                  whileHover={{ y: -6 }}
                  className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden h-full ${
                    isPopular 
                      ? "border-2 border-[#FF2D2D] shadow-[0_12px_40px_rgba(255,45,45,0.12)] scale-[1.02]" 
                      : "border-[#F2E4E2] dark:border-gray-700 shadow-xs"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute top-4 right-4 bg-[#FF2D2D] text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-xs">
                      {t("Most Popular")}
                    </span>
                  )}
                  
                  <div className="space-y-6">
                    <div>
                      <span className="text-xs font-extrabold text-[#475467] dark:text-gray-400 uppercase block">{t(pkg.title)} {language === "bn" ? "প্ল্যান" : "PLAN"}</span>
                      <span className="text-2xl sm:text-3xl font-black text-[#101828] dark:text-white block mt-2">
                        {pkg.price} <span className="text-xs sm:text-sm font-medium text-[#475467] dark:text-gray-400">/ {t(pkg.period || "Month")}</span>
                      </span>
                    </div>
                    
                    <hr className="border-[#F2E4E2] dark:border-gray-700" />
                    
                    <ul className="space-y-3 text-xs sm:text-sm text-[#475467] dark:text-gray-300">
                      {pkg.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{t(feat)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[#F2E4E2]/40 dark:border-gray-700">
                    <motion.button
                      onClick={() => handleRouteClick("contact")}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className={`w-full py-3.5 px-4 font-extrabold rounded-xl transition-all uppercase tracking-wider text-xs cursor-pointer ${
                        isPopular
                          ? "bg-[#FF2D2D] hover:bg-[#FF5757] text-white shadow-md shadow-[#FF2D2D]/20"
                          : "bg-[#FFF1EF] dark:bg-gray-700 hover:bg-[#FFE8E5] text-[#FF2D2D] dark:text-red-300"
                      }`}
                    >
                      {t(pkg.ctaText || (isPopular ? "Grow Your Business" : "Get Started"))}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="pt-6">
            <motion.button
              onClick={() => handleRouteClick("packages")}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0px 10px 25px rgba(255, 45, 45, 0.15)"
              }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white text-[#FF2D2D] dark:text-red-400 text-xs sm:text-sm font-extrabold rounded-full transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm relative overflow-hidden group border border-[#FF2D2D]/20"
            >
              <span>{t("Browse Website, Graphic & Video packages")}</span>
              <motion.span
                animate={{
                  x: [0, 4, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-block"
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </motion.button>
          </div>

        </div>
      </section>

      {/* 11. WHAT GROWING BUSINESSES SAY ABOUT US */}
      <section className="py-16 md:py-24 bg-transparent px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-[11px] font-bold text-[#FF2D2D] bg-[#FFE8E5] dark:bg-red-950/50 px-3 py-1 rounded-full uppercase tracking-wider">
              {t("Client Reviews", "ক্লায়েন্ট মতামত")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight">
              {t("What Growing Businesses Say About Us", "আমাদের সম্পর্কে ক্লায়েন্টদের মন্তব্য")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
            {(siteContent.testimonials || []).map((rev, idx) => (
              <motion.div 
                key={rev.id || idx} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-md border border-[#F2E4E2] dark:border-gray-700/80 p-8 rounded-2xl space-y-4 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed italic">
                    "{t(rev.text, rev.textBn)}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  {rev.avatar ? (
                    <img 
                      src={rev.avatar} 
                      alt={rev.name} 
                      loading="lazy"
                      className="w-10 h-10 rounded-full object-cover border border-[#F2E4E2] dark:border-gray-700" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-[#F2E4E2] dark:border-gray-700 bg-[#FFE8E5] dark:bg-gray-700 flex items-center justify-center text-xs font-extrabold text-[#FF2D2D]">
                      {(rev.name || "?").trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#101828] dark:text-white">{rev.name}</h4>
                    <span className="text-[10px] sm:text-xs text-[#475467] dark:text-gray-400 font-medium block">{rev.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. AUDIT OPPORTUNITY - FREE DIGITAL AUDIT */}
      <section className="py-16 md:py-24 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-t border-b border-[#F2E4E2]/40 dark:border-gray-800/40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-[11px] font-bold text-[#FF2D2D] bg-[#FFE8E5] dark:bg-red-950/50 px-3 py-1 rounded-full uppercase tracking-wider">
              {t("Audit Opportunity", "অডিট করার সুযোগ")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight">
              {t("Get a Free Digital Presence Audit", "ফ্রি ডিজিটাল অডিট রিপোর্ট নিন")}
            </h2>
            <p className="text-[#475467] dark:text-gray-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
              {t("We will personally audit your business website, graphics consistency, page speed, and social reels to identify exactly where you are losing customers.", "আমরা ব্যক্তিগতভাবে আপনার ওয়েবসাইট, গ্রাফিক্সের মান, স্পিড এবং ভিডিও রিলস বিশ্লেষণ করে দেখিয়ে দেব কোথায় কাস্টমার ড্রপ করছে।")}
            </p>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-2 border-[#FFE8E5] dark:border-gray-700 rounded-[32px] p-6 sm:p-10 text-left max-w-2xl mx-auto shadow-xl">
            {isSubmitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-extrabold animate-bounce">
                  ✓
                </div>
                <h3 className="text-xl font-extrabold text-[#101828] dark:text-white">{t("Audit Request Received!", "অডিট রিকোয়েস্ট জমা নেওয়া হয়েছে!")}</h3>
                <p className="text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed max-w-md mx-auto">
                  {t("Thank you! We will personally study your digital channels and send a comprehensive, easy-to-follow audit report directly to your WhatsApp in 24–48 hours.", "ধন্যবাদ! আমরা আপনার ডিজিটাল চ্যানেলগুলো পর্যালোচনা করে ২৪-৪৮ ঘণ্টার মধ্যে একটি বিস্তারিত রিপোর্ট সরাসরি আপনার হোয়াটসঅ্যাপে পাঠিয়ে দেব।")}
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-2 border border-[#FF2D2D] text-[#FF2D2D] rounded-xl font-bold hover:bg-[#FFE8E5] dark:hover:bg-red-950/40 transition-colors text-xs cursor-pointer"
                >
                  {t("Request another audit", "আরেকটি অডিটের অনুরোধ করুন")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitAudit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#101828] dark:text-gray-200">{t("Full Name *", "পূর্ণ নাম *")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("e.g. Tanvir Ahmed", "যেমনঃ তানভীর আহমেদ")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-[#101828] dark:text-white focus:outline-none focus:border-[#FF2D2D] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#101828] dark:text-gray-200">{t("Business Name", "ব্যবসার নাম")}</label>
                    <input
                      type="text"
                      placeholder={t("e.g. Your Business Name", "যেমনঃ আপনার ব্যবসার নাম")}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-[#101828] dark:text-white focus:outline-none focus:border-[#FF2D2D] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#101828] dark:text-gray-200">{t("Email Address *", "ইমেইল এড্রেস *")}</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. tanvir@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-[#101828] dark:text-white focus:outline-none focus:border-[#FF2D2D] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#101828] dark:text-gray-200">{t("WhatsApp Number *", "হোয়াটসঅ্যাপ নম্বর *")}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 01712-345678"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-[#101828] dark:text-white focus:outline-none focus:border-[#FF2D2D] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#101828] dark:text-gray-200">{t("Website URL or Facebook Page", "ওয়েবসাইট ইউআরএল বা ফেসবুক পেজ")}</label>
                    <input
                      type="text"
                      placeholder="e.g. facebook.com/aurafoods"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-[#101828] dark:text-white focus:outline-none focus:border-[#FF2D2D] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#101828] dark:text-gray-200">{t("Service You Need Most", "আপনার প্রধান প্রয়োজনীয় সেবা")}</label>
                    <select
                      value={serviceNeeded}
                      onChange={(e) => setServiceNeeded(e.target.value)}
                      className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-[#101828] dark:text-white focus:outline-none focus:border-[#FF2D2D] transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Website Development">{t("Website Development")}</option>
                      <option value="Graphic Design">{t("Graphic Design")}</option>
                      <option value="Video Editing">{t("Video Editing")}</option>
                      <option value="Social Media Management">{t("Social Media Management")}</option>
                      <option value="Complete Digital Solution">{t("Complete Digital Solution", "সম্পূর্ণ ডিজিটাল সমাধান")}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101828] dark:text-gray-200">{t("Your Business Message / Goals", "আপনার ব্যবসার বার্তা বা লক্ষ্য")}</label>
                  <textarea
                    rows={3}
                    placeholder={t("Let us study about your business goals or main pain points...", "আপনার ব্যবসার মূল লক্ষ্য বা সমস্যাগুলো লিখুন...")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-gray-600 rounded-xl text-xs sm:text-sm bg-white dark:bg-gray-900 text-[#101828] dark:text-white focus:outline-none focus:border-[#FF2D2D] transition-colors resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all uppercase tracking-wider shadow-md shadow-[#FF2D2D]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? t("Submitting...", "জমা দেওয়া হচ্ছে...") : t("Get My Free Audit", "ফ্রি অডিট রিপোর্ট নিন")}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 13. FAQ SECTION */}
      <section className="py-16 md:py-24 bg-transparent px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[11px] font-bold text-[#FF2D2D] bg-[#FFE8E5] dark:bg-red-950/50 px-3 py-1 rounded-full uppercase tracking-wider">
              {t("Answers", "প্রশ্নোত্তর")}
            </span>
            <h2 className="text-3xl font-extrabold text-[#101828] dark:text-white tracking-tight">{t("Frequently Asked Questions")}</h2>
            <p className="text-[#475467] dark:text-gray-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
              {t("Got questions? We've compiled direct answers to our clients' most common inquiries.", "কোনো প্রশ্ন আছে? আমাদের ক্লায়েন্টদের সবচেয়ে সাধারণ জিজ্ঞাসাগুলোর উত্তর নিচে দেওয়া হলো।")}
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto text-left">
            {displayFaqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-[#F2E4E2] dark:border-gray-700/80 rounded-2xl bg-white/85 dark:bg-gray-800/85 backdrop-blur-md overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-extrabold text-[#101828] dark:text-white hover:text-[#FF2D2D] focus:outline-none cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm md:text-base pr-4">
                      {t(faq.q)}
                    </span>
                    <span className={`text-xl font-bold transition-transform duration-300 shrink-0 select-none ${isOpen ? "rotate-45 text-[#FF2D2D]" : ""}`}>
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed border-t border-[#F2E4E2] dark:border-gray-700/80 bg-white/50 dark:bg-gray-900/50">
                      {t(faq.a)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 14. FINAL CALL TO ACTION (RED BLOCK) */}
      <section className="relative py-16 md:py-20 bg-[#FF2D2D] overflow-hidden text-center text-white px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-[#FF5757] via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto space-y-6 z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {t("Ready to Build a Stronger Digital Presence?", "একটি শক্তিশালী ডিজিটাল উপস্থিতি তৈরি করতে প্রস্তুত?")}
          </h2>
          <p className="text-white/90 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
            {t("Tell us about your business today and let's create professional websites, layouts, and reels that help your brand stand out and scale up.", "আজই আপনার ব্যবসা সম্পর্কে আমাদের জানান। চলুন তৈরি করি পেশাদার ওয়েবসাইট, ডিজাইন ও রিলস যা আপনার ব্র্যান্ডকে অনন্য করে তুলবে।")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleRouteClick("free-audit")}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#FFE8E5] text-[#FF2D2D] text-sm font-bold rounded-full shadow-lg transition-all cursor-pointer"
            >
              {t("Book a Free Consultation", "ফ্রি কনসাল্টেশন বুক করুন")}
            </motion.button>
            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href={siteContent.socials.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-[#101828] hover:bg-black text-white text-sm font-bold rounded-full shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{t("Chat on WhatsApp", "হোয়াটসঅ্যাপে চ্যাট করুন")}</span>
            </motion.a>
          </div>
        </div>
      </section>

      {/* Video Modal Popup */}
      {activeVideoProject && (
        <VideoModal
          isOpen={!!activeVideoProject}
          onClose={() => setActiveVideoProject(null)}
          videoUrl={activeVideoProject.videoUrl}
          videoEmbed={activeVideoProject.videoEmbed}
          title={activeVideoProject.title}
          clientName={activeVideoProject.clientName}
          category={activeVideoProject.category}
          subCategory={activeVideoProject.subCategory}
          onViewDetails={() => handleProjectClick(activeVideoProject.slug || activeVideoProject.id)}
        />
      )}

    </div>
  );
}
