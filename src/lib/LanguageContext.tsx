import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "bn";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, bnText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Centralized dictionary for common visual labels
const dictionary: Record<string, { en: string; bn: string }> = {
  // Navigation
  "Home": { en: "Home", bn: "হোম" },
  "About Us": { en: "About Us", bn: "আমাদের সম্পর্কে" },
  "Services": { en: "Services", bn: "সেবাসমূহ" },
  "Portfolio": { en: "Portfolio", bn: "পোর্টফোলিও" },
  "Packages": { en: "Packages", bn: "প্যাকেজসমূহ" },
  "Contact": { en: "Contact", bn: "যোগাযোগ" },
  "Admin": { en: "Admin", bn: "অ্যাডমিন" },
  
  // CTAs & General Buttons
  "Get a Free Audit": { en: "Get a Free Audit", bn: "ফ্রি অডিট নিন" },
  "WhatsApp": { en: "WhatsApp", bn: "হোয়াটসঅ্যাপ" },
  "WhatsApp Chat": { en: "WhatsApp Chat", bn: "হোয়াটসঅ্যাপ চ্যাট" },
  "Get a Free Consultation": { en: "Get a Free Consultation", bn: "ফ্রি কনসাল্টেশন নিন" },
  "View Our Work": { en: "View Our Work", bn: "আমাদের কাজগুলো দেখুন" },
  "Choose Plan": { en: "Choose Plan", bn: "প্ল্যানটি বেছে নিন" },
  "Grow Your Business": { en: "Grow Your Business", bn: "আপনার ব্যবসা বড় করুন" },
  "Get Started": { en: "Get Started", bn: "শুরু করুন" },
  "Order Package": { en: "Order Package", bn: "প্যাকেজটি অর্ডার করুন" },
  "Submit Audit Request": { en: "Submit Audit Request", bn: "অডিট রিকোয়েস্ট সাবমিট করুন" },
  "Submitting Request...": { en: "Submitting Request...", bn: "জমা দেওয়া হচ্ছে..." },
  "Request Another Audit": { en: "Request Another Audit", bn: "আরেকটি অডিটের অনুরোধ করুন" },
  "Submit Lead": { en: "Submit Lead", bn: "জমা দিন" },
  "Sending...": { en: "Sending...", bn: "পাঠানো হচ্ছে..." },
  "Explore plans": { en: "Explore plans", bn: "প্ল্যানসমূহ দেখুন" },
  "View Packages & Pricing": { en: "View Packages & Pricing", bn: "প্যাকেজ এবং প্রাইসিং দেখুন" },
  "Reset Filters": { en: "Reset Filters", bn: "ফিল্টার রিসেট করুন" },
  "Browse Website, Graphic & Video packages": { en: "Browse Website, Graphic & Video packages", bn: "সকল ওয়েবসাইট, গ্রাফিক্স ও ভিডিও প্যাকেজ ব্রাউজ করুন" },
  "View Full Portfolio Gallery": { en: "View Full Portfolio Gallery", bn: "সম্পূর্ণ পোর্টফোলিও গ্যালারি দেখুন" },
  "Analyze Case Study Result": { en: "Analyze Case Study Result", bn: "কেস স্টাডি ফলাফল বিশ্লেষণ করুন" },
  "Read Study": { en: "Read Study", bn: "কেস স্টাডি পড়ুন" },
  "View All Graphics Design": { en: "View All Graphics Design", bn: "সকল গ্রাফিক্স ডিজাইন দেখুন" },
  "Search by project, tool, tag...": { en: "Search by project, tool, tag...", bn: "প্রজেক্ট, টুলস বা ট্যাগ দিয়ে খুঁজুন..." },
  "No Projects Located": { en: "No Projects Located", bn: "কোনো প্রজেক্ট পাওয়া যায়নি" },
  "Featured Case Study": { en: "Featured Case Study", bn: "ফিচার্ড কেস স্টাডি" },

  // Categories
  "Graphic Design": { en: "Graphic Design", bn: "গ্রাফিক্স ডিজাইন" },
  "Video Editing": { en: "Video Editing", bn: "ভিডিও এডিটিং" },
  "Website Development": { en: "Website Development", bn: "ওয়েবসাইট ডেভেলপমেন্ট" },
  "Social Media Management": { en: "Social Media Management", bn: "সোশ্যাল মিডিয়া ম্যানেজমেন্ট" },
  "Our Works": { en: "Our Works", bn: "আমাদের কাজসমূহ" },
  "Video Types:": { en: "Video Types:", bn: "ভিডিওর ধরন:" },
  "All Videos": { en: "All Videos", bn: "সকল ভিডিও" },
  "Motion Video": { en: "Motion Video", bn: "মোশন ভিডিও" },
  "Reels": { en: "Reels", bn: "রিলস" },
  "Long Video": { en: "Long Video", bn: "লং ভিডিও" },

  // Home Hero & Badges
  "Your Digital Growth Partner": { en: "Your Digital Growth Partner", bn: "আপনার ডিজিটাল গ্রোথ পার্টনার" },
  "Build a Powerful Digital Presence That Helps Your Business Grow.": { en: "Build a Powerful Digital Presence That Helps Your Business Grow.", bn: "একটি শক্তিশালী ডিজিটাল উপস্থিতি তৈরি করুন যা আপনার ব্যবসাকে বড় করতে সাহায্য করবে।" },
  "Digital Presence": { en: "Digital Presence", bn: "ডিজিটাল উপস্থিতি" },
  "From high-converting websites and professional graphic design to engaging video content and complete social media management — B2bfiy gives your business the digital support it needs to stand out and grow.": { en: "From high-converting websites and professional graphic design to engaging video content and complete social media management — B2bfiy gives your business the digital support it needs to stand out and grow.", bn: "হাই-কনভার্টিং ওয়েবসাইট ও প্রফেশনাল গ্রাফিক্স ডিজাইন থেকে শুরু করে আকর্ষণীয় ভিডিও কনটেন্ট এবং সম্পূর্ণ সোশ্যাল মিডিয়া ম্যানেজমেন্ট — B2bfiy আপনার ব্যবসাকে দিচ্ছে এমন ডিজিটাল সাপোর্ট যা আপনাকে অনন্য করবে এবং এগিয়ে নিয়ে যাবে।" },
  "One creative team for your complete digital presence.": { en: "One creative team for your complete digital presence.", bn: "আপনার সম্পূর্ণ ডিজিটাল উপস্থিতির জন্য একটি নিবেদিত ক্রিয়েটিভ টিম।" },

  // Home Floating Tags
  "Web design": { en: "Web design", bn: "ওয়েব ডিজাইন" },
  "Graphics design": { en: "Graphics design", bn: "গ্রাফিক্স ডিজাইন" },
  
  // Footer
  "Our Services": { en: "Our Services", bn: "আমাদের সেবাসমূহ" },
  "Quick Links": { en: "Quick Links", bn: "কুইক লিংকসমূহ" },
  "Contact Information": { en: "Contact Information", bn: "যোগাযোগের তথ্য" },
  "Response Time:": { en: "Response Time:", bn: "রেসপন্স টাইম:" },
  "Usually under 2 hours via WhatsApp.": { en: "Usually under 2 hours via WhatsApp.", bn: "হোয়াটসঅ্যাপের মাধ্যমে সাধারণত ২ ঘণ্টার মধ্যে।" },
  "Privacy": { en: "Privacy", bn: "গোপনীয়তা" },
  "Terms": { en: "Terms", bn: "শর্তাবলী" },
  "Scroll to Top": { en: "Scroll to Top", bn: "উপরে যান" },
  "Dhaka, Bangladesh (Serving clients globally)": { en: "Dhaka, Bangladesh (Serving clients globally)", bn: "ঢাকা, বাংলাদেশ (বিশ্বব্যাপী সেবা প্রদান করা হচ্ছে)" },
  "Dhaka Office:": { en: "Dhaka Office:", bn: "ঢাকা অফিস:" },
  "Email Us:": { en: "Email Us:", bn: "ইমেইল করুন:" },
  "WhatsApp Us:": { en: "WhatsApp Us:", bn: "হোয়াটসঅ্যাপ করুন:" },
  "Follow Our Growth": { en: "Follow Our Growth", bn: "আমাদের ফলো করুন" },
  "Terms & Conditions": { en: "Terms & Conditions", bn: "শর্তাবলী" },
  "Privacy Policy": { en: "Privacy Policy", bn: "গোপনীয়তা নীতি" },

  // Stats
  "Projects Completed": { en: "Projects Completed", bn: "প্রজেক্ট সম্পন্ন হয়েছে" },
  "Happy Clients": { en: "Happy Clients", bn: "সন্তুষ্ট ক্লায়েন্ট" },
  "Years of Experience": { en: "Years of Experience", bn: "বছরের অভিজ্ঞতা" },
  "Client Satisfaction": { en: "Client Satisfaction", bn: "ক্লায়েন্ট সন্তুষ্টি" },

  // Why Choose Us
  "Why Business Owners Choose B2bfiy": { en: "Why Business Owners Choose B2bfiy", bn: "কেন ব্যবসায়ীরা B2bfiy বেছে নেন" },
  "We don't just deliver files. We deliver the complete design and tech ecosystem to make your business look like an industry leader.": { en: "We don't just deliver files. We deliver the complete design and tech ecosystem to make your business look like an industry leader.", bn: "আমরা কেবল ফাইল ডেলিভারি করি না। আপনার ব্যবসাকে ইন্ডাস্ট্রির লিডার হিসেবে উপস্থাপন করতে আমরা সম্পূর্ণ ডিজাইন এবং টেক ইকোসিস্টেম প্রদান করি।" },
  "One Team for Everything": { en: "One Team for Everything", bn: "সবকিছুর জন্য একটি টিম" },
  "No more juggling multiple freelancers. We handle development, design, editing, and management under one roof.": { en: "No more juggling multiple freelancers. We handle development, design, editing, and management under one roof.", bn: "একাধিক ফ্রিল্যান্সার সামলানোর ঝামেলা আর নয়। আমরা একই ছাদের নিচে ওয়েবসাইট ডেভেলপমেন্ট, গ্রাফিক্স ডিজাইন, ভিডিও এডিটিং এবং সোশ্যাল মিডিয়া ম্যানেজমেন্ট করে থাকি।" },
  "Custom Solutions": { en: "Custom Solutions", bn: "কাস্টমাইজড সমাধান" },
  "We don't use generic templates. Every strategy, design, and website is custom-crafted for your specific target audience.": { en: "We don't use generic templates. Every strategy, design, and website is custom-crafted for your specific target audience.", bn: "আমরা কোনো সাধারণ টেমপ্লেট ব্যবহার করি না। প্রতিটি কৌশল, ডিজাইন এবং ওয়েবসাইট আপনার নির্দিষ্ট টার্গেট অডিয়েন্সের কথা মাথায় রেখে কাস্টম-মেড করা হয়।" },
  "Professional Quality": { en: "Professional Quality", bn: "পেশাদার মান" },
  "Our team consists of expert designers, skilled developers, and creative video editors dedicated to premium output.": { en: "Our team consists of expert designers, skilled developers, and creative video editors dedicated to premium output.", bn: "আমাদের টিম গঠিত হয়েছে অভিজ্ঞ ডিজাইনার, দক্ষ ডেভেলপার এবং সৃজনশীল ভিডিও এডিটরদের নিয়ে যারা প্রিমিয়াম আউটপুট দিতে প্রতিশ্রুতিবদ্ধ।" },
  "Fast Communication": { en: "Fast Communication", bn: "দ্রুত যোগাযোগ" },
  "Stay updated always. We offer daily communications, clear deadlines, and quick turnaround times.": { en: "Stay updated always. We offer daily communications, clear deadlines, and quick turnaround times.", bn: "সবসময় আপডেটেড থাকুন। আমরা প্রতিদিনের যোগাযোগ, সুনির্দিষ্ট ডেডলাইন এবং দ্রুত ডেলিভারি নিশ্চিত করি।" },
  "Affordable Packages": { en: "Affordable Packages", bn: "সাশ্রয়ী মূল্যের প্যাকেজ" },
  "Get agency-grade results at transparent, predictable, and fair pricing structured to scale with your business.": { en: "Get agency-grade results at transparent, predictable, and fair pricing structured to scale with your business.", bn: "আপনার ব্যবসার সাথে সামঞ্জস্যপূর্ণ স্বচ্ছ, সাশ্রয়ী এবং ন্যায্য মূল্যে এজেন্সি-গ্রেড ফলাফল পান।" },
  "Ongoing Support": { en: "Ongoing Support", bn: "ক্রমাগত সাপোর্ট" },
  "We don't just launch and leave. B2bfiy provides continuous support, maintenance, and growth consulting.": { en: "We don't just launch and leave. B2bfiy provides continuous support, maintenance, and growth consulting.", bn: "আমরা কেবল প্রজেক্ট লঞ্চ করেই চলে যাই না। B2bfiy প্রতিনিয়ত সাপোর্ট, রক্ষণাবেক্ষণ এবং ব্যবসা বৃদ্ধির পরামর্শ দিয়ে থাকে।" },

  // Services Page / Section
  "Services We Provide": { en: "Services We Provide", bn: "আমাদের সেবাসমূহ" },
  "We provide end-to-end digital services tailored for your business.": { en: "We provide end-to-end digital services tailored for your business.", bn: "আমরা আপনার ব্যবসার জন্য উপযুক্ত সম্পূর্ণ ডিজিটাল সেবাসমূহ প্রদান করি।" },
  "We build modern, fast, mobile friendly websites designed to turn visitors into potential customers.": { en: "We build modern, fast, mobile friendly websites designed to turn visitors into potential customers.", bn: "আমরা তৈরি করি আধুনিক, দ্রুত ও মোবাইল-বান্ধব ওয়েবসাইট যা আপনার ভিজিটরদের কাস্টমারে রূপান্তর করবে।" },
  "Professional visual content that makes your brand look consistent, trustworthy, and memorable.": { en: "Professional visual content that makes your brand look consistent, trustworthy, and memorable.", bn: "পেশাদার ভিজ্যুয়াল কনটেন্ট যা আপনার ব্র্যান্ডকে সবার কাছে বিশ্বস্ত, সামঞ্জস্যপূর্ণ এবং স্মরণীয় করে তোলে।" },
  "Engaging video content designed to capture attention and communicate your message effectively.": { en: "Engaging video content designed to capture attention and communicate your message effectively.", bn: "আকর্ষণীয় ভিডিও কনটেন্ট যা সবার মনোযোগ কেড়ে নেবে এবং আপনার বার্তা সঠিকভাবে পৌঁছে দেবে।" },
  "We manage your social media presence so you can focus on running your business.": { en: "We manage your social media presence so you can focus on running your business.", bn: "আমরা আপনার সোশ্যাল মিডিয়া পেজগুলো পরিচালনা করি যাতে আপনি আপনার ব্যবসায়ে মনোনিবেশ করতে পারেন।" },

  // Packages page / Section
  "Pricing Plans & Monthly Packages": { en: "Pricing Plans & Monthly Packages", bn: "প্রাইসিং প্ল্যান এবং মাসিক প্যাকেজসমূহ" },
  "Get professional support with completely transparent pricing. Choose the model that matches your business scale.": { en: "Get professional support with completely transparent pricing. Choose the model that matches your business scale.", bn: "সম্পূর্ণ স্বচ্ছ মূল্যে পেশাদার সাপোর্ট পান। আপনার ব্যবসার পরিধির সাথে মানানসই সেরা প্ল্যানটি বেছে নিন।" },
  "Choose the Right Monthly Growth Plan": { en: "Choose the Right Monthly Growth Plan", bn: "সঠিক মাসিক গ্রোথ প্ল্যান বেছে নিন" },
  "Streamlined professional graphics and dynamic reels tailored to build authority and drive leads daily.": { en: "Streamlined professional graphics and dynamic reels tailored to build authority and drive leads daily.", bn: "আপনার ব্র্যান্ডের গ্রহণযোগ্যতা বৃদ্ধি এবং প্রতিদিন নতুন কাস্টমার আকর্ষণের জন্য আধুনিক প্রফেশনাল গ্রাফিক্স এবং ডায়নামিক রিলস।" },
  "Most Popular": { en: "Most Popular", bn: "সবচেয়ে জনপ্রিয়" },
  "Month": { en: "Month", bn: "মাস" },
  "Project": { en: "Project", bn: "প্রজেক্ট" },
  "Package": { en: "Package", bn: "প্যাকেজ" },

  // Package Names / Details
  "STARTER": { en: "STARTER", bn: "স্টার্টার" },
  "GROWTH": { en: "GROWTH", bn: "গ্রোথ" },
  "PREMIUM GROWTH": { en: "PREMIUM GROWTH", bn: "প্রিমিয়াম গ্রোথ" },
  "STARTER WEBSITE": { en: "STARTER WEBSITE", bn: "স্টার্টার ওয়েবসাইট" },
  "BUSINESS WEBSITE": { en: "BUSINESS WEBSITE", bn: "বিজনেস ওয়েবসাইট" },
  "CUSTOM / E-COMMERCE WEBSITE": { en: "CUSTOM / E-COMMERCE WEBSITE", bn: "কাস্টম / ই-কমার্স ওয়েবসাইট" },
  "SOCIAL STARTER": { en: "SOCIAL STARTER", bn: "সোশ্যাল স্টার্টার" },
  "BUSINESS CONTENT": { en: "BUSINESS CONTENT", bn: "বিজনেস কনটেন্ট" },
  "MONTHLY DESIGN PARTNER": { en: "MONTHLY DESIGN PARTNER", bn: "মান্থলি ডিজাইন পার্টনার" },
  "REELS STARTER": { en: "REELS STARTER", bn: "রিলস স্টার্টার" },
  "CONTENT GROWTH": { en: "CONTENT GROWTH", bn: "কনটেন্ট গ্রোথ" },
  "VIDEO PARTNER": { en: "VIDEO PARTNER", bn: "ভিডিও পার্টনার" },
  "COMPLETE BUSINESS LAUNCH PACKAGE": { en: "COMPLETE BUSINESS LAUNCH PACKAGE", bn: "কমপ্লিট বিজনেস লঞ্চ প্যাকেজ" },

  "Book a Free Consultation": { en: "Book a Free Consultation", bn: "ফ্রি কনসাল্টেশন বুক করুন" },
  "Choose Starter Web": { en: "Choose Starter Web", bn: "স্টার্টার ওয়েব বেছে নিন" },
  "Choose Business Web": { en: "Choose Business Web", bn: "বিজনেস ওয়েব বেছে নিন" },
  "Request a Custom Quote": { en: "Request a Custom Quote", bn: "কাস্টম কোটের অনুরোধ করুন" },
  "Get Social Starter": { en: "Get Social Starter", bn: "সোশ্যাল স্টার্টার নিন" },
  "Get Business Content": { en: "Get Business Content", bn: "বিজনেস কনটেন্ট নিন" },
  "Become Design Partner": { en: "Become Design Partner", bn: "ডিজাইন পার্টনার হোন" },
  "Get Reels Starter": { en: "Get Reels Starter", bn: "রিলস স্টার্টার নিন" },
  "Get Content Growth": { en: "Get Content Growth", bn: "কনটেন্ট গ্রোথ নিন" },
  "Become Video Partner": { en: "Become Video Partner", bn: "ভিডিও পার্টনার হোন" },
  "Launch Your Business with B2bfiy": { en: "Launch Your Business with B2bfiy", bn: "B2bfiy এর সাথে আপনার ব্যবসা চালু করুন" },

  // Package Features
  "12 Professional Social Media Designs": { en: "12 Professional Social Media Designs", bn: "১২টি প্রফেশনাল সোশ্যাল মিডিয়া ডিজাইন" },
  "4 Short-Form Videos / Reels": { en: "4 Short-Form Videos / Reels", bn: "৪টি শর্ট-ফর্ম ভিডিও / রিলস" },
  "Facebook Page Management": { en: "Facebook Page Management", bn: "ফেসবুক পেজ ম্যানেজমেন্ট" },
  "Content Planning": { en: "Content Planning", bn: "কনটেন্ট প্ল্যানিং" },
  "Captions & Hashtags": { en: "Captions & Hashtags", bn: "ক্যাপশন ও হ্যাশট্যাগ" },
  "Monthly Content Calendar": { en: "Monthly Content Calendar", bn: "মাসিক কনটেন্ট ক্যালেন্ডার" },
  "Basic Page Optimization": { en: "Basic Page Optimization", bn: "প্রাথমিক পেজ অপ্টিমাইজেশন" },
  "Monthly Performance Report": { en: "Monthly Performance Report", bn: "মাসিক পারফরম্যান্স রিপোর্ট" },
  "20 Professional Social Media Designs": { en: "20 Professional Social Media Designs", bn: "২০টি প্রফেশনাল সোশ্যাল মিডিয়া ডিজাইন" },
  "8 Short-Form Videos / Reels": { en: "8 Short-Form Videos / Reels", bn: "৮টি শর্ট-ফর্ম ভিডিও / রিলস" },
  "Content Strategy": { en: "Content Strategy", bn: "কনটেন্ট স্ট্র্যাটেজি" },
  "Professional Captions & Hashtags": { en: "Professional Captions & Hashtags", bn: "প্রফেশনাল ক্যাপশন ও হ্যাশট্যাগ" },
  "Facebook Page Optimization": { en: "Facebook Page Optimization", bn: "ফেসবুক পেজ অপ্টিমাইজেশন" },
  "Basic Ad Campaign Setup": { en: "Basic Ad Campaign Setup", bn: "প্রাথমিক বিজ্ঞাপন ক্যাম্পেইন সেটআপ" },
  "Priority Support": { en: "Priority Support", bn: "অগ্রাধিকার সাপোর্ট" },
  "30 Premium Social Media Designs": { en: "30 Premium Social Media Designs", bn: "৩০টি প্রিমিয়াম সোশ্যাল মিডিয়া ডিজাইন" },
  "12 Short-Form Videos / Reels": { en: "12 Short-Form Videos / Reels", bn: "১২টি শর্ট-ফর্ম ভিডিও / রিলস" },
  "Complete Facebook Management": { en: "Complete Facebook Management", bn: "সম্পূর্ণ ফেসবুক ম্যানেজমেন্ট" },
  "Content Strategy & Planning": { en: "Content Strategy & Planning", bn: "কনটেন্ট স্ট্র্যাটেজি ও প্ল্যানিং" },
  "Ad Campaign Management": { en: "Ad Campaign Management", bn: "বিজ্ঞাপন ক্যাম্পেইন ম্যানেজমেন্ট" },
  "Monthly Strategy Consultation": { en: "Monthly Strategy Consultation", bn: "মাসিক স্ট্র্যাটেজি কনসাল্টেশন" },
  "Detailed Performance Report": { en: "Detailed Performance Report", bn: "বিস্তারিত পারফরম্যান্স রিপোর্ট" },
  "BONUS: Professional Business Landing Page": { en: "BONUS: Professional Business Landing Page", bn: "বোনাস: প্রফেশনাল বিজনেস ল্যান্ডিং পেজ" },

  "Up to 5 Pages": { en: "Up to 5 Pages", bn: "৫টি পেজ পর্যন্ত" },
  "Modern Professional Design": { en: "Modern Professional Design", bn: "আধুনিক প্রফেশনাল ডিজাইন" },
  "Mobile Responsive": { en: "Mobile Responsive", bn: "মোাইল রেসপনসিভ" },
  "Contact Form": { en: "Contact Form", bn: "যোগাযোগ ফরম" },
  "WhatsApp Integration": { en: "WhatsApp Integration", bn: "হোয়াটসঅ্যাপ ইন্টিগ্রেশন" },
  "Basic SEO Setup": { en: "Basic SEO Setup", bn: "প্রাথমিক এসইও সেটআপ" },
  "Social Media Integration": { en: "Social Media Integration", bn: "সোশ্যাল মিডিয়া ইন্টিগ্রেশন" },
  "SSL Setup Assistance": { en: "SSL Setup Assistance", bn: "এসএসএল সেটআপ সহায়তা" },

  "Up to 10 Pages": { en: "Up to 10 Pages", bn: "১০টি পেজ পর্যন্ত" },
  "Premium Custom Design": { en: "Premium Custom Design", bn: "প্রিমিয়াম কাস্টম ডিজাইন" },
  "Modern Animations": { en: "Modern Animations", bn: "আধুনিক অ্যানিমেশন" },
  "Mobile & Tablet Responsive": { en: "Mobile & Tablet Responsive", bn: "মোবাইল ও ট্যাবলেট রেসপনসিভ" },
  "Lead Generation Forms": { en: "Lead Generation Forms", bn: "লিড জেনারেশন ফরম" },
  "Basic SEO": { en: "Basic SEO", bn: "প্রাথমিক এসইও" },
  "Speed Optimization": { en: "Speed Optimization", bn: "স্পিড অপ্টিমাইজেশন" },
  "Google Analytics Setup": { en: "Google Analytics Setup", bn: "গুগল অ্যানালিটিক্স সেটআপ" },
  "Admin Dashboard / CMS": { en: "Admin Dashboard / CMS", bn: "অ্যাডমিন ড্যাশবোর্ড / সিএমএস" },
  "30 Days Support": { en: "30 Days Support", bn: "৩০ দিনের সাপোর্ট" },

  "Custom UI/UX Design": { en: "Custom UI/UX Design", bn: "কাস্টম ইউআই/ইউএক্স ডিজাইন" },
  "Product Management": { en: "Product Management", bn: "প্রোডাক্ট ম্যানেজমেন্ট" },
  "Shopping Cart & Checkout": { en: "Shopping Cart & Checkout", bn: "শপিং কার্ট ও চেকআউট" },
  "Payment Gateway Integration": { en: "Payment Gateway Integration", bn: "পেমেন্ট গেটওয়ে ইন্টিগ্রেশন" },
  "Customer Account System": { en: "Customer Account System", bn: "কাস্টমার অ্যাকাউন্ট সিস্টেম" },
  "Order Management": { en: "Order Management", bn: "অর্ডার ম্যানেজমেন্ট" },
  "Admin Dashboard": { en: "Admin Dashboard", bn: "অ্যাডমিন ড্যাশবোর্ড" },
  "SEO Setup": { en: "SEO Setup", bn: "এসইও সেটআপ" },
  "Performance Optimization": { en: "Performance Optimization", bn: "পারফরম্যান্স অপ্টিমাইজেশন" },
  "Security Configuration": { en: "Security Configuration", bn: "সিকিউরিটি কনফিগারেশন" },
  "60 Days Support": { en: "60 Days Support", bn: "৬০ দিনের সাপোর্ট" },

  "10 Social Media Designs": { en: "10 Social Media Designs", bn: "১০টি সোশ্যাল মিডিয়া ডিজাইন" },
  "Custom Brand Style": { en: "Custom Brand Style", bn: "কাস্টম ব্র্যান্ড স্টাইল" },
  "2 Revisions Per Design": { en: "2 Revisions Per Design", bn: "ডিজাইন প্রতি ২টি রিভিশন" },
  "High-Resolution Formats": { en: "High-Resolution Formats", bn: "হাই-রেজোলিউশন ফরম্যাট" },
  "Source Files Included": { en: "Source Files Included", bn: "সোর্স ফাইল অন্তর্ভুক্ত" },

  "Promotional Creatives": { en: "Promotional Creatives", bn: "প্রোমোশনাল ক্রিয়েটিভ ডিজাইন" },
  "Cover / Banner Design": { en: "Cover / Banner Design", bn: "কভার / ব্যানার ডিজাইন" },
  "Priority Delivery": { en: "Priority Delivery", bn: "অগ্রাধিকার ডেলিভারি" },
  "Source Files & Revisions": { en: "Source Files & Revisions", bn: "সোর্স ফাইল ও রিভিশন" },

  "Up to 30 Social Media Designs": { en: "Up to 30 Social Media Designs", bn: "৩০টি সোশ্যাল মিডিয়া ডিজাইন পর্যন্ত" },
  "Marketing Creatives": { en: "Marketing Creatives", bn: "মার্কেটিং ক্রিয়েটিভ ডিজাইন" },
  "Promotional Campaign Designs": { en: "Promotional Campaign Designs", bn: "প্রোমোশনাল ক্যাম্পেইন ডিজাইন" },
  "Consistent Brand Style": { en: "Consistent Brand Style", bn: "সামঞ্জস্যপূর্ণ ব্র্যান্ড স্টাইল" },
  "Dedicated Designer Channel": { en: "Dedicated Designer Channel", bn: "ডেডিকেটেড ডিজাইনার চ্যানেল" },

  "4 Short Videos / Reels": { en: "4 Short Videos / Reels", bn: "৪টি শর্ট ভিডিও / রিলস" },
  "Professional Editing": { en: "Professional Editing", bn: "পেশাদার ভিডিও এডিটিং" },
  "Captions": { en: "Captions", bn: "ক্যাপশন" },
  "Transitions & Effects": { en: "Transitions & Effects", bn: "ট্রানজিশন ও ইফেক্ট" },
  "Background Music": { en: "Background Music", bn: "ব্যাকগ্রাউন্ড মিউজিক" },
  "Full HD Delivery": { en: "Full HD Delivery", bn: "ফুল এইচডি ডেলিভারি" },

  "8 Short Videos / Reels": { en: "8 Short Videos / Reels", bn: "৮টি শর্ট ভিডিও / রিলস" },
  "Animated Captions": { en: "Animated Captions", bn: "অ্যানিমেটেড ক্যাপশন" },
  "Sound Design": { en: "Sound Design", bn: "সাউন্ড ডিজাইন" },
  "Motion Graphics": { en: "Motion Graphics", bn: "মোশন গ্রাফিক্স" },
  "Revision Support": { en: "Revision Support", bn: "রিভিশন সাপোর্ট" },

  "15 Short Videos / Reels": { en: "15 Short Videos / Reels", bn: "১৫টি শর্ট ভিডিও / রিলস" },
  "Premium Editing": { en: "Premium Editing", bn: "প্রিমিয়াম ভিডিও এডিটিং" },
  "Advanced Motion Graphics": { en: "Advanced Motion Graphics", bn: "অ্যাডভান্সড মোশন গ্রাফিক্স" },
  "Hook Formulation": { en: "Hook Formulation", bn: "হুক ফর্মুলেশন" },

  "Professional Business Website": { en: "Professional Business Website", bn: "পেশাদার ব্যবসায়িক ওয়েবসাইট" },
  "Logo & Brand Identity": { en: "Logo & Brand Identity", bn: "লোগো ও ব্র্যান্ড আইডেন্টিটি" },
  "Facebook Page Setup & Optimization": { en: "Facebook Page Setup & Optimization", bn: "ফেসবুক পেজ সেটআপ ও অপ্টিমাইজেশন" },
  "8 Promotional Reels": { en: "8 Promotional Reels", bn: "৮টি প্রোমোশনাল রিলস" },
  "1 Month Social Media Management": { en: "1 Month Social Media Management", bn: "১ মাসের সোশ্যাল মিডিয়া ম্যানেজমেন্ট" },

  // FAQs
  "Frequently Asked Questions": { en: "Frequently Asked Questions", bn: "সচরাচর জিজ্ঞাস্য প্রশ্নাবলী (FAQ)" },
  "Have questions? We have compiled responses to our most common inquiries here.": { en: "Have questions? We have compiled responses to our most common inquiries here.", bn: "কোনো প্রশ্ন আছে? আমাদের সবচেয়ে সাধারণ জিজ্ঞাসাগুলোর উত্তর এখানে দেওয়া হলো।" },
  "How much does a project cost?": { en: "How much does a project cost?", bn: "একটি প্রজেক্টের খরচ কত?" },
  "Our monthly growth retainers start from ৳12,000/month, and custom web development starts from ৳15,000. All prices are completely transparent with zero hidden costs.": { en: "Our monthly growth retainers start from ৳12,000/month, and custom web development starts from ৳15,000. All prices are completely transparent with zero hidden costs.", bn: "আমাদের মাসিক গ্রোথ রিটেইনার শুরু হয় ১২,০০০ টাকা/মাস থেকে এবং কাস্টম ওয়েব ডেভেলপমেন্ট শুরু হয় ১৫,০০০ টাকা থেকে। সব খরচ সম্পূর্ণ স্বচ্ছ, কোনো গোপন ফি নেই।" },
  "How long does website development take?": { en: "How long does website development take?", bn: "ওয়েবসাইট তৈরি করতে কত সময় লাগে?" },
  "For a standard Starter Website (up to 5 pages), it takes 7–10 business days. Larger customized corporate or e-commerce websites take between 15 to 30 days depending on features.": { en: "For a standard Starter Website (up to 5 pages), it takes 7–10 business days. Larger customized corporate or e-commerce websites take between 15 to 30 days depending on features.", bn: "একটি স্ট্যান্ডার্ড স্টার্টার ওয়েবসাইটের (৫ পেজ পর্যন্ত) জন্য ৭–১০ কর্মদিবস সময় লাগে। বড় কাস্টমাইজড করপোরেট বা ই-কমার্স ওয়েবসাইটের জন্য ফিচার অনুযায়ী ১৫ থেকে ৩০ দিন সময় লাগতে পারে।" },
  "Do you work with international clients?": { en: "Do you work with international clients?", bn: "আপনারা কি আন্তর্জাতিক ক্লায়েন্টদের সাথে কাজ করেন?" },
  "Yes! We work with local small businesses, restaurants, clinics, and e-commerce companies in Bangladesh, as well as startups and service brands in the US, Europe, and UAE.": { en: "Yes! We work with local small businesses, restaurants, clinics, and e-commerce companies in Bangladesh, as well as startups and service brands in the US, Europe, and UAE.", bn: "হ্যাঁ! আমরা বাংলাদেশের স্থানীয় ছোট ব্যবসা, রেস্টুরেন্ট, ক্লিনিক এবং ই-কমার্স কোম্পানিগুলোর পাশাপাশি ইউএসএ, ইউরোপ এবং ইউএই-র স্টার্টআপ ও সার্ভিস ব্র্যান্ডগুলোর সাথে কাজ করি।" },
  "Can I request a custom package?": { en: "Can I request a custom package?", bn: "আমি কি একটি কাস্টম প্যাকেজের জন্য অনুরোধ করতে পারি?" },
  "Absolutely. If none of our standard packages fit your exact requirements, contact us and we will craft a bespoke monthly or project-based agreement for your business.": { en: "Absolutely. If none of our standard packages fit your exact requirements, contact us and we will craft a bespoke monthly or project-based agreement for your business.", bn: "অবশ্যই। আমাদের স্ট্যান্ডার্ড প্যাকেজগুলো যদি আপনার প্রয়োজন পূরণ না করে, তবে আমাদের সাথে যোগাযোগ করুন এবং আমরা আপনার ব্যবসার জন্য কাস্টমাইজড মাসিক বা প্রজেক্ট-ভিত্তিক চুক্তি তৈরি করব।" },
  "Do you provide ongoing support?": { en: "Do you provide ongoing support?", bn: "আপনারা কি প্রতিনিয়ত সাপোর্ট প্রদান করেন?" },
  "Yes, we provide ongoing maintenance, security updates, and performance tuning for all the websites we deliver, plus active strategizing for monthly partners.": { en: "Yes, we provide ongoing maintenance, security updates, and performance tuning for all the websites we deliver, plus active strategizing for monthly partners.", bn: "হ্যাঁ, আমাদের তৈরি করা প্রতিটি ওয়েবসাইটের জন্য আমরা নিয়মিত রক্ষণাবেক্ষণ, সিকিউরিটি আপডেট এবং কার্যক্ষমতা বৃদ্ধি করি, সেই সাথে মাসিক পার্টনারদের জন্য অ্যাক্টিভ কৌশল নির্ধারণ করি।" },
  "How do I get started?": { en: "How do I get started?", bn: "আমি কীভাবে শুরু করতে পারি?" },
  "The absolute best way is to submit a Request for a Free Digital Audit or chat directly with us on WhatsApp. We will analyze your online presence and recommend the best plan.": { en: "The absolute best way is to submit a Request for a Free Digital Audit or chat directly with us on WhatsApp. We will analyze your online presence and recommend the best plan.", bn: "সবচেয়ে ভালো উপায় হলো একটি ফ্রি ডিজিটাল অডিটের অনুরোধ সাবমিট করা অথবা সরাসরি হোয়াটসঅ্যাপে আমাদের সাথে চ্যাট করা। আমরা আপনার ডিজিটাল উপস্থিতি বিশ্লেষণ করে সেরা প্ল্যানের পরামর্শ দেব।" },

  // Free Audit Form Details
  "Request Your Free Digital Presence Audit Today!": { en: "Request Your Free Digital Presence Audit Today!", bn: "আজই আপনার ফ্রি ডিজিটাল অডিট বুক করুন!" },
  "We will manually review your social media pages, branding, and website to provide a detailed PDF report containing 5 actionable improvements — 100% free.": { en: "We will manually review your social media pages, branding, and website to provide a detailed PDF report containing 5 actionable improvements — 100% free.", bn: "আমরা আপনার সোশ্যাল মিডিয়া পেজ, ব্র্যান্ডিং এবং ওয়েবসাইট ম্যানুয়ালি পর্যালোচনা করব এবং ৫টি কার্যকরী পরামর্শ সহ একটি বিস্তারিত পিডিএফ রিপোর্ট প্রদান করব — ১০০% ফ্রি।" },
  "Our team will analyze your links and email your Free PDF Report within 24 hours. Hang tight!": { en: "Our team will analyze your links and email your Free PDF Report within 24 hours. Hang tight!", bn: "আমাদের টিম আপনার লিংকগুলো বিশ্লেষণ করবে এবং ২৪ ঘণ্টার মধ্যে আপনার ফ্রি পিডিএফ রিপোর্ট ইমেইল করবে। সাথেই থাকুন!" },
  "Audit Request Successfully Logged!": { en: "Audit Request Successfully Logged!", bn: "অডিট রিকোয়েস্ট সফলভাবে জমা হয়েছে!" },
  "Why Choose Us": { en: "Why Choose Us", bn: "কেন আমাদের বেছে নেবেন" },
  "Our Clients": { en: "Our Clients", bn: "আমাদের ক্লায়েন্টরা" },
  "Ready to Scale Your Brand?": { en: "Ready to Scale Your Brand?", bn: "আপনার ব্র্যান্ডকে বড় করতে প্রস্তুত?" },
  "Get Agency-Grade Creative Work Built & Managed For You. Cancel Anytime.": { en: "Get Agency-Grade Creative Work Built & Managed For You. Cancel Anytime.", bn: "এজেন্সি-গ্রেড ক্রিয়েটিভ কাজ করিয়ে নিন এবং পরিচালনা করুন। যেকোনো সময় বাতিল করতে পারবেন।" },

  // About Page
  "About B2bfiy": { en: "About B2bfiy", bn: "B2bfiy সম্পর্কে" },
  "The Dedicated Creative & Growth Engine For Your Business": { en: "The Dedicated Creative & Growth Engine For Your Business", bn: "আপনার ব্যবসার জন্য নিবেদিত ক্রিয়েটিভ এবং গ্রোথ ইঞ্জিন" },
  "We are a team of expert creators, engineers, and marketers aligned to construct professional corporate web platforms, designs, and reels to help brands scale up.": { en: "We are a team of expert creators, engineers, and marketers aligned to construct professional corporate web platforms, designs, and reels to help brands scale up.", bn: "আমরা অভিজ্ঞ ক্রিয়েটর, ইঞ্জিনিয়ার ও মার্কেটারদের একটি দল, যারা ব্র্যান্ডের উন্নয়নে পেশাদার করপোরেট ওয়েব প্ল্যাটফর্ম, আকর্ষণীয় ডিজাইন ও রিলস তৈরিতে কাজ করে যাচ্ছি।" },
  "Bridging High-Fidelity Creative Quality and Affordable Predictability": { en: "Bridging High-Fidelity Creative Quality and Affordable Predictability", bn: "উচ্চমানের ক্রিয়েটিভ কোয়ালিটি এবং সাশ্রয়ী মূল্যের সঠিক সমন্বয়" },
  "Managing five separate freelance contracts is chaotic. One delivers slow code, another misses graphic styles, and a third stops replying during launch. B2bfiy was founded in Dhaka to establish a single reliable, professional creative team that business owners can delegate to.": { en: "Managing five separate freelance contracts is chaotic. One delivers slow code, another misses graphic styles, and a third stops replying during launch. B2bfiy was founded in Dhaka to establish a single reliable, professional creative team that business owners can delegate to.", bn: "পাঁচটি ভিন্ন ভিন্ন ফ্রিল্যান্সার কন্ট্রাক্ট সামলানো অত্যন্ত ঝামেলার। একজন ধীরগতির কোড দেয়, আরেকজন গ্রাফিক্সের স্টাইল বোঝে না, এবং তৃতীয়জন লঞ্চের সময় রিপ্লাই দেওয়া বন্ধ করে দেয়। ব্যবসায়ীদের এই জটিলতা থেকে মুক্তি দিতে ঢাকায় B2bfiy প্রতিষ্ঠিত হয়েছে।" },
  "We leverage modern technology, custom design systems, and cinematic short-form frameworks to elevate small brands, medical clinics, restaurants, and startups globally into trustworthy digital icons.": { en: "We leverage modern technology, custom design systems, and cinematic short-form frameworks to elevate small brands, medical clinics, restaurants, and startups globally into trustworthy digital icons.", bn: "আমরা আধুনিক প্রযুক্তি, কাস্টম ডিজাইন সিস্টেম এবং সিনেমাটিক শর্ট-ফর্ম ফ্রেমওয়ার্ক ব্যবহার করে স্থানীয় ছোট ব্র্যান্ড, মেডিকেল ক্লিনিক, রেস্টুরেন্ট এবং স্টার্টআপগুলোকে বিশ্বমানের বিশ্বস্ত ডিজিটাল আইকনে রূপান্তর করি।" },
  "Our Core Values": { en: "Our Core Values", bn: "আমাদের মূল মূল্যবোধসমূহ" },
  "Meet Our Co-Founders": { en: "Meet Our Co-Founders", bn: "আমাদের কো-ফাউন্ডারদের সাথে পরিচিত হোন" },
  "Results-First Execution": { en: "Results-First Execution", bn: "ফলাফল-নির্ভর কাজ" },
  "We don't prioritize vanity likes or useless visits. We build high-performance pipelines engineered to attract paying customers.": { en: "We don't prioritize vanity likes or useless visits. We build high-performance pipelines engineered to attract paying customers.", bn: "আমরা কেবল অপ্রয়োজনীয় লাইক বা ভিজিটের পেছনে ছুটি না। আমরা এমন হাই-পারফরম্যান্স ফানেল তৈরি করি যা প্রকৃত কাস্টমার আকর্ষণ করে।" },
  "Absolute Transparency": { en: "Absolute Transparency", bn: "সম্পূর্ণ স্বচ্ছতা" },
  "No hidden setup costs, unexpected fees, or secret markups. Everything is communicated and priced upfront clearly.": { en: "No hidden setup costs, unexpected fees, or secret markups. Everything is communicated and priced upfront clearly.", bn: "কোনো গোপন সেটআপ ফি, অপ্রত্যাশিত চার্জ বা অতিরিক্ত ফি নেই। সবকিছু শুরুতেই পরিষ্কারভাবে জানানো ও নির্ধারণ করা হয়।" },
  "Speed & Communication": { en: "Speed & Communication", bn: "গতি ও নিখুঁত যোগাযোগ" },
  "Our teams coordinate via modern communication panels to answer questions within minutes and deliver designs on time.": { en: "Our teams coordinate via modern communication panels to answer questions within minutes and deliver designs on time.", bn: "আমাদের টিম আধুনিক যোগাযোগ প্যানেলের মাধ্যমে সমন্বয় করে কয়েক মিনিটের মধ্যে প্রশ্নের উত্তর দেয় এবং সময়মতো ডিজাইন ডেলিভারি নিশ্চিত করে।" },
  "Co-Founder & CTO": { en: "Co-Founder & CTO", bn: "কো-ফাউন্ডার এবং সিটিও" },
  "Senior Fullstack Engineer": { en: "Senior Fullstack Engineer", bn: "সিনিয়র ফুলস্ট্যাক ইঞ্জিনিয়ার" },
  "Engineers modern, responsive layouts, web portals, and commerce funnels.": { en: "Engineers modern, responsive layouts, web portals, and commerce funnels.", bn: "তিনি আধুনিক ও রেসপনসিভ ওয়েবসাইট, ওয়েব পোর্টাল এবং কমার্স ফানেল তৈরি করেন।" },
  "Co-Founder & Creative Director": { en: "Co-Founder & Creative Director", bn: "কো-ফাউন্ডার এবং ক্রিয়েটিভ ডিরেক্টর" },
  "Visual Identity Director": { en: "Visual Identity Director", bn: "ভিজুয়াল আইডেন্টিটি ডিরেক্টর" },
  "Directs social post styling guidelines, packaging, and cinematic reel templates.": { en: "Directs social post styling guidelines, packaging, and cinematic reel templates.", bn: "তিনি সোশ্যাল মিডিয়া পোস্টের স্টাইল গাইডলাইন, প্যাকেজিং ডিজাইন এবং সিনেমাটিক রিলস টেমপ্লেট পরিচালনা করেন।" },

  // Contact Page
  "Let's Connect & Grow": { en: "Let's Connect & Grow", bn: "আসুন যুক্ত হই এবং বৃদ্ধি করি" },
  "Get in Touch": { en: "Get in Touch", bn: "যোগাযোগ করুন" },
  "Have a custom web project, dynamic branding layout, or monthly reels requirements? Drop us a line or chat directly on WhatsApp. We respond within minutes.": { en: "Have a custom web project, dynamic branding layout, or monthly reels requirements? Drop us a line or chat directly on WhatsApp. We respond within minutes.", bn: "একটি কাস্টম ওয়েব প্রজেক্ট, ব্র্যান্ডিং ডিজাইন বা মাসিক রিলস প্রয়োজন? আমাদের বার্তা পাঠান বা সরাসরি হোয়াটসঅ্যাপে চ্যাট করুন।" },
  "Send Us a Message": { en: "Send Us a Message", bn: "আমাদের বার্তা পাঠান" },
  "Message Sent Successfully!": { en: "Message Sent Successfully!", bn: "বার্তা সফলভাবে পাঠানো হয়েছে!" },
  "Thank you for contacting B2bfiy. We have received your query and our team will get back to you within 2 business hours.": { en: "Thank you for contacting B2bfiy. We have received your query and our team will get back to you within 2 business hours.", bn: "B2bfiy এর সাথে যোগাযোগ করার জন্য ধন্যবাদ। আমরা আপনার বার্তা পেয়েছি এবং আমাদের টিম ২ ঘণ্টার মধ্যে আপনার সাথে যোগাযোগ করবে।" },
  "SendMessage": { en: "Send Message", bn: "বার্তা পাঠান" },
  "SendingMessage...": { en: "Sending Message...", bn: "পাঠানো হচ্ছে..." },
  "Message Text": { en: "Message Text", bn: "বার্তার বিবরণ" },
  "Type your project requirements here...": { en: "Type your project requirements here...", bn: "আপনার প্রজেক্টের প্রয়োজনীয়তা এখানে লিখুন..." },
  "Selected Service": { en: "Selected Service", bn: "নির্বাচিত সেবা" },
  "Your Email Address": { en: "Your Email Address", bn: "আপনার ইমেইল এড্রেস" },
  "Your Contact Number": { en: "Your Contact Number", bn: "আপনার যোগাযোগ নম্বর" },
  "Company / Brand (Optional)": { en: "Company / Brand (Optional)", bn: "কোম্পানি / ব্র্যান্ড (ঐচ্ছিক)" },
  "Choose a service...": { en: "Choose a service...", bn: "সেবা নির্বাচন করুন..." },

  "Client Name": { en: "Client Name", bn: "ক্লায়েন্টের নাম" },
  "Completion Date": { en: "Completion Date", bn: "সম্পন্ন করার তারিখ" },
  "Niche Tag": { en: "Niche Tag", bn: "ট্যাগ" },
  "Status State": { en: "Status State", bn: "অবস্থা" },
  "Delivered": { en: "Delivered", bn: "ডেলিভারড" },
  "Launch Live Website / View Demo": { en: "Launch Live Website / View Demo", bn: "লাইভ ওয়েবসাইট দেখুন / ডেমো দেখুন" },
  "Dynamic Video Case Embed": { en: "Dynamic Video Case Embed", bn: "ভিডিও ডেমো" },
  "Executive Case Summary": { en: "Executive Case Summary", bn: "কেস স্টাডি সারসংক্ষেপ" },
  "The Client's Obstacle": { en: "The Client's Obstacle", bn: "ক্লায়েন্টের সমস্যা" },
  "B2bfiy's Architectural Solution": { en: "B2bfiy's Architectural Solution", bn: "B2bfiy-এর সমাধান" },
  "Strategic Deployment Stages:": { en: "Strategic Deployment Stages:", bn: "কাজের ধাপসমূহ:" },
  "Measurable Results": { en: "Measurable Results", bn: "পরিমাপযোগ্য ফলাফল" },
  "Tools & Technologies:": { en: "Tools & Technologies:", bn: "ব্যবহৃত প্রযুক্তি ও টুলস:" },
  "Verified Success Case": { en: "Verified Success Case", bn: "যাচাইকৃত সফল কেস" },
  "This work is fully verified by the respective corporate entity.": { en: "This work is fully verified by the respective corporate entity.", bn: "এই কাজটি সংশ্লিষ্ট প্রতিষ্ঠান দ্বারা সম্পূর্ণরূপে যাচাইকৃত।" },
  "Back to Portfolio Collection": { en: "Back to Portfolio Collection", bn: "পোর্টফোলিওতে ফিরে যান" },
  "Project Not Located": { en: "Project Not Located", bn: "প্রজেক্ট পাওয়া যায়নি" },
  "We apologize, but the requested project case study could not be located in our dynamic registry.": { en: "We apologize, but the requested project case study could not be located in our dynamic registry.", bn: "আমরা দুঃখিত, অনুরোধকৃত প্রজেক্ট কেস স্টাডিটি আমাদের ডাটাবেজে খুঁজে পাওয়া যায়নি।" },
  "Return to Portfolio": { en: "Return to Portfolio", bn: "পোর্টফোলিওতে ফিরে যান" },

  "Client:": { en: "Client:", bn: "ক্লায়েন্ট:" },
  "Category:": { en: "Category:", bn: "ক্যাটাগরি:" },
  "Date:": { en: "Date:", bn: "তারিখ:" },
  "Live Demo:": { en: "Live Demo:", bn: "লাইভ ডেমো:" },
  "Technologies:": { en: "Technologies:", bn: "ব্যবহৃত প্রযুক্তি:" },
  "Visit Live Project": { en: "Visit Live Project", bn: "লাইভ প্রজেক্ট ভিজিট করুন" },
  "Project Overview": { en: "Project Overview", bn: "প্রজেক্ট ওভারভিউ" },
  "The Challenge": { en: "The Challenge", bn: "চ্যালেঞ্জসমূহ" },
  "Our Approach & Solution": { en: "Our Approach & Solution", bn: "আমাদের সমাধান ও কর্মপদ্ধতি" },
  "Our Work Process": { en: "Our Work Process", bn: "আমাদের কাজের ধাপসমূহ" },
  "Results & Business Impact": { en: "Results & Business Impact", bn: "ফলাফল ও ব্যবসায়িক প্রভাব" },
  "Related Projects": { en: "Related Projects", bn: "সম্পর্কিত প্রজেক্টসমূহ" },
  "View Project Details": { en: "View Project Details", bn: "প্রজেক্টের বিবরণ দেখুন" },
  "Go Back to Portfolio": { en: "Go Back to Portfolio", bn: "পোর্টফোলিওতে ফিরে যান" },

  // Privacy Policy & Terms page headings
  "Last Updated:": { en: "Last Updated:", bn: "সর্বশেষ আপডেট:" },
  "1. Introduction": { en: "1. Introduction", bn: "১. ভূমিকা" },
  "2. Information We Collect": { en: "2. Information We Collect", bn: "২. সংগৃহীত তথ্যাদি" },
  "3. How We Process Information": { en: "3. How We Process Information", bn: "৩. প্রক্রিয়াকরণ পদ্ধতি" },
  "4. Data Security & Integrity": { en: "4. Data Security & Integrity", bn: "৪. ডাটা নিরাপত্তা ও অখণ্ডতা" },
  "5. Contacting Us": { en: "5. Contacting Us", bn: "৫. যোগাযোগ" },
  "1. Scope of Service": { en: "1. Scope of Service", bn: "১. সেবার পরিধি" },
  "2. Billing, Retainers & Milestones": { en: "2. Billing, Retainers & Milestones", bn: "২. বিলিং ও মাইলস্টোন" },
  "3. Intellectual Property Ownership": { en: "3. Intellectual Property Ownership", bn: "৩. মেধা সম্পত্তি স্বত্ব" },
  "4. Cancellation & Terminations": { en: "4. Cancellation & Terminations", bn: "৪. বাতিলকরণ ও সমাপ্তি" },
  "5. Governing Law": { en: "5. Governing Law", bn: "৫. প্রযোজ্য আইন" },
  "Terms of Service": { en: "Terms of Service", bn: "সেবার শর্তাবলী" },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("b2bfiy_language");
      return (saved === "bn" ? "bn" : "en") as Language;
    } catch {
      return "en";
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("b2bfiy_language", lang);
    } catch (e) {
      console.warn("Storage write failed for language:", e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "bn" : "en");
  };

  const t = (key: string, bnText?: string): string => {
    if (language === "en") {
      return key;
    }

    // Try central dictionary first
    if (dictionary[key]) {
      return dictionary[key].bn;
    }

    // Fallback to inline translation if provided
    if (bnText) {
      return bnText;
    }

    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
