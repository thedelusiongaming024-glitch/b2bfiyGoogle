import React, { useState, useEffect, Suspense, lazy } from "react";
import { Phone, Mail, Facebook, Instagram, Linkedin, MessageSquare, ShieldAlert, MessageCircle, Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
import { Lead, PortfolioProject, ServicePackage, SiteContent, MediaItem } from "./types";
import {
  INITIAL_SITE_CONTENT,
  INITIAL_PORTFOLIOS,
  INITIAL_PACKAGES,
  INITIAL_MEDIA_ITEMS,
} from "./data/initialData";

// Neon database integration
import {
  fetchAllDataFromDb,
  fetchLeadsFromDb,
  saveSiteContentToDb,
  syncPortfoliosToDb,
  syncPackagesToDb,
  syncMediaItemsToDb,
  saveLeadToDb,
  deleteLeadFromDb,
  getDbStatus,
  onAdminAuthStateChange
} from "./lib/db";

// Tracking
import { trackPageView, trackLead } from "./lib/serverTracking";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import IntroSplash from "./components/IntroSplash";
import SiteBackground from "./components/SiteBackground";

// Pages
// Home is kept as an eager import since it's the most common landing page —
// no extra network round trip / loading flash for the majority of visitors.
import Home from "./pages/Home";
// Everything else is code-split: each page (and whatever it alone pulls in,
// e.g. Admin's recharts-based analytics chart) ships as its own chunk that
// only loads when a visitor actually navigates there.
const Services = lazy(() => import("./pages/Services"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Packages = lazy(() => import("./pages/Packages"));
const About = lazy(() => import("./pages/About"));
const FreeAudit = lazy(() => import("./pages/FreeAudit"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Admin = lazy(() => import("./pages/Admin"));
const FAQ = lazy(() => import("./pages/FAQ"));

// Helper: Safe LocalStorage set to prevent QuotaExceededError
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`LocalStorage write failed for key "${key}" (likely quota exceeded):`, e);
    return false;
  }
}

// Helper: Custom stable sort for portfolios
// - Custom portfolios (with ID starting with "project-") appear at the top, sorted by timestamp descending
// - Standard initial portfolios appear at the bottom in their original numerical order (p1, p2, p3...)
export function sortPortfolios(items: PortfolioProject[]): PortfolioProject[] {
  return [...items].sort((a, b) => {
    const isCustomA = a.id.startsWith("project-");
    const isCustomB = b.id.startsWith("project-");
    
    if (isCustomA && !isCustomB) return -1;
    if (!isCustomA && isCustomB) return 1;
    
    if (isCustomA && isCustomB) {
      return b.id.localeCompare(a.id);
    }
    
    const numA = parseInt(a.id.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.id.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });
}

// Helper: Route Path Mapping
export function parseRouteFromLocation(): { route: string; slug: string } {
  try {
    const rawPath = window.location.pathname.replace(/\/+$/, "").toLowerCase();
    if (rawPath === "/faq") return { route: "faq", slug: "" };
    if (rawPath === "/admin" || rawPath === "/admin/ai") return { route: "admin", slug: rawPath === "/admin/ai" ? "ai" : "" };
    if (rawPath === "/services") return { route: "services", slug: "" };
    if (rawPath === "/portfolio") return { route: "portfolio", slug: "" };
    if (rawPath.startsWith("/portfolio/")) {
      const slug = window.location.pathname.replace(/^\/portfolio\//, "").replace(/\/+$/, "");
      return { route: "portfolio-detail", slug };
    }
    if (rawPath === "/packages") return { route: "packages", slug: "" };
    if (rawPath === "/about") return { route: "about", slug: "" };
    if (rawPath === "/free-audit") return { route: "free-audit", slug: "" };
    if (rawPath === "/contact") return { route: "contact", slug: "" };
    if (rawPath === "/privacy-policy") return { route: "privacy-policy", slug: "" };
    if (rawPath === "/terms") return { route: "terms", slug: "" };
  } catch {
    // fallback
  }
  return { route: "home", slug: "" };
}

export function getPathForRoute(route: string, slug?: string): string {
  switch (route) {
    case "faq": return "/faq";
    case "services": return "/services";
    case "portfolio": return "/portfolio";
    case "portfolio-detail": return slug ? `/portfolio/${slug}` : "/portfolio";
    case "packages": return "/packages";
    case "about": return "/about";
    case "free-audit": return "/free-audit";
    case "contact": return "/contact";
    case "privacy-policy": return "/privacy-policy";
    case "terms": return "/terms";
    case "admin": return "/admin";
    default: return "/";
  }
}

export default function App() {
  const initialNav = parseRouteFromLocation();
  const [currentRoute, setCurrentRouteState] = useState<string>(initialNav.route);
  const [selectedProjectSlug, setSelectedProjectSlugState] = useState<string>(initialNav.slug);
  const [selectedPackageCategory, setSelectedPackageCategory] = useState<"monthly" | "website" | "graphic" | "video">("monthly");
  const [selectedPackageForContact, setSelectedPackageForContact] = useState<string>("");

  const setRoute = (newRoute: string, extraParam?: string) => {
    setCurrentRouteState(newRoute);

    if (newRoute === "packages" && extraParam && ["monthly", "website", "graphic", "video"].includes(extraParam)) {
      setSelectedPackageCategory(extraParam as "monthly" | "website" | "graphic" | "video");
    }

    if (newRoute === "contact") {
      if (extraParam) {
        setSelectedPackageForContact(extraParam);
      }
    }

    // For "portfolio-detail" the slug is passed in via extraParam (see
    // setSelectedProjectSlug below) rather than read from the
    // selectedProjectSlug state, since React state updates are async and
    // this function would otherwise compute the URL from a stale slug
    // whenever it's called right after setSelectedProjectSlug.
    const slugForPath = newRoute === "portfolio-detail" ? (extraParam || selectedProjectSlug) : undefined;

    try {
      const targetPath = getPathForRoute(newRoute, slugForPath);
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ route: newRoute, slug: slugForPath }, "", targetPath);
      }
    } catch {
      // safe fallback
    }
  };

  const setSelectedProjectSlug = (slug: string) => {
    setSelectedProjectSlugState(slug);
    try {
      if (slug) {
        const targetPath = `/portfolio/${slug}`;
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ route: "portfolio-detail", slug }, "", targetPath);
        }
      }
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRouteFromLocation();
      setCurrentRouteState(parsed.route);
      setSelectedProjectSlugState(parsed.slug);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Ensure every page load, route change, and page refresh starts cleanly at the top
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      try {
        window.history.scrollRestoration = "manual";
      } catch {}
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [currentRoute, selectedProjectSlug]);

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      const hasSeen = sessionStorage.getItem("b2bfiy_seen_intro");
      return hasSeen !== "true";
    } catch {
      return true;
    }
  });

  const handleIntroComplete = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem("b2bfiy_seen_intro", "true");
    } catch (e) {
      console.warn("sessionStorage write failed:", e);
    }
  };

  // Central Dynamic State holding all entities directly from live Neon Database
  const [siteContent, setSiteContent] = useState<SiteContent>(() => {
    try {
      const storedContent = localStorage.getItem("b2bfiy_site_content");
      if (storedContent) return JSON.parse(storedContent);
    } catch {}
    return INITIAL_SITE_CONTENT;
  });
  const [portfolios, setPortfolios] = useState<PortfolioProject[]>(() => {
    try {
      const storedPortfolios = localStorage.getItem("b2bfiy_portfolios");
      if (storedPortfolios) return sortPortfolios(JSON.parse(storedPortfolios));
    } catch {}
    return INITIAL_PORTFOLIOS;
  });
  const [packages, setPackages] = useState<ServicePackage[]>(() => {
    try {
      const storedPackages = localStorage.getItem("b2bfiy_packages");
      if (storedPackages) return JSON.parse(storedPackages);
    } catch {}
    return INITIAL_PACKAGES;
  });
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    try {
      const storedMedia = localStorage.getItem("b2bfiy_media_items");
      if (storedMedia) return JSON.parse(storedMedia);
    } catch {}
    return INITIAL_MEDIA_ITEMS;
  });
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const storedLeads = localStorage.getItem("b2bfiy_leads");
      if (storedLeads) return JSON.parse(storedLeads);
    } catch {}
    return [];
  });
  const [isDbSynced, setIsDbSynced] = useState<boolean>(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("b2bfiy_dark_mode");
      return saved === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("b2bfiy_dark_mode", String(darkMode));
    } catch (e) {
      console.warn("Storage write failed:", e);
    }
  }, [darkMode]);

  // 1. Fetch live data from Neon database immediately on mount
  useEffect(() => {
    // Read from cached localStorage for instant first paint
    try {
      const storedContent = localStorage.getItem("b2bfiy_site_content");
      if (storedContent) setSiteContent(JSON.parse(storedContent));

      const storedPortfolios = localStorage.getItem("b2bfiy_portfolios");
      if (storedPortfolios) {
        setPortfolios(sortPortfolios(JSON.parse(storedPortfolios)));
      }

      const storedPackages = localStorage.getItem("b2bfiy_packages");
      if (storedPackages) setPackages(JSON.parse(storedPackages));

      const storedMedia = localStorage.getItem("b2bfiy_media_items");
      if (storedMedia) setMediaItems(JSON.parse(storedMedia));

      const storedLeads = localStorage.getItem("b2bfiy_leads");
      if (storedLeads) {
        setLeads(JSON.parse(storedLeads));
      }
    } catch (err) {
      console.error("Failed to read from localStorage:", err);
    }

    // B. Query Neon in background to load updated values
    const syncWithDb = async () => {
      try {
        console.log("[Neon Sync] Syncing latest data from Neon PostgreSQL database...");
        const dbData = await fetchAllDataFromDb();
        if (dbData) {
          if (dbData.siteContent) {
            setSiteContent(dbData.siteContent);
            safeSetLocalStorage("b2bfiy_site_content", JSON.stringify(dbData.siteContent));
          }
          if (dbData.portfolios && dbData.portfolios.length > 0) {
            const sorted = sortPortfolios(dbData.portfolios);
            setPortfolios(sorted);
            safeSetLocalStorage("b2bfiy_portfolios", JSON.stringify(sorted));
          }
          if (dbData.packages && dbData.packages.length > 0) {
            setPackages(dbData.packages);
            safeSetLocalStorage("b2bfiy_packages", JSON.stringify(dbData.packages));
          }
          if (dbData.mediaItems && dbData.mediaItems.length > 0) {
            setMediaItems(dbData.mediaItems);
            safeSetLocalStorage("b2bfiy_media_items", JSON.stringify(dbData.mediaItems));
          }
          if (dbData.leads !== null) {
            setLeads(dbData.leads);
            safeSetLocalStorage("b2bfiy_leads", JSON.stringify(dbData.leads));
          }
          setIsDbSynced(true);
          console.log("[Neon Sync] Successfully synchronized all states with database tables.");
        }
      } catch (err) {
        console.warn("[Neon Sync] Background sync warning:", err);
      }
    };

    syncWithDb();

    // Auto-refresh leads whenever admin auth state changes
    const unsubAuth = onAdminAuthStateChange(async (isAuth) => {
      if (isAuth) {
        try {
          const freshLeads = await fetchLeadsFromDb();
          if (freshLeads && freshLeads.length > 0) {
            setLeads(freshLeads);
            safeSetLocalStorage("b2bfiy_leads", JSON.stringify(freshLeads));
          }
        } catch (e) {
          console.warn("Failed to auto-fetch leads on admin login:", e);
        }
      }
    });

    return () => {
      unsubAuth();
    };
  }, []);

  // Update page title, favicon, SEO meta tags, Google Verification, Schema.org JSON-LD, and Meta Pixel dynamically when route or content changes
  useEffect(() => {
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://b2bfiy.me";
    const brand = siteContent.brandName?.trim() || "B2bfiy";
    
    let activeTitle = "";
    let activeDesc = "";
    let activeKeywords = siteContent.seoKeywords?.trim() || "best web design company in Bangladesh, top web development agency in Dhaka, digital marketing agency Dhaka, creative digital agency Bangladesh, corporate branding agency Dhaka, professional logo design service Bangladesh, video editing agency Bangladesh, short-form video editing reels Dhaka, monthly social media management packages Bangladesh, ecommerce website development with bKash Nagad gateway, custom Next.js React website developer Dhaka, high converting landing page design service Bangladesh, affordable business website design packages Bangladesh, offshore web design and development agency, hire dedicated React web designers Bangladesh, short form video editing service for creators, B2B digital growth retainers, UI UX design Bangladesh, ওয়েব ডিজাইন কোম্পানি বাংলাদেশ, ডিজিটাল মার্কেটিং এজেন্সি ঢাকা, ই-কমার্স ওয়েবসাইট তৈরি, প্রফেশনাল ভিডিও এডিটিং সার্ভিস";
    let activeImage = siteContent.hero?.imageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80";
    let activePath = "/";
    let breadcrumbItems: Array<{ name: string; url: string }> = [{ name: "Home", url: currentOrigin }];

    if (currentRoute === "services") {
      activeTitle = `Our Services & Creative Solutions | ${brand} - Digital Agency Dhaka`;
      activeDesc = `Explore ${brand}'s premium services: custom high-converting web development, UI/UX design, corporate brand identity, cinematic video editing & reels, and dedicated monthly growth retainers in Bangladesh.`;
      activePath = "/services";
      breadcrumbItems.push({ name: "Services", url: `${currentOrigin}/services` });
    } else if (currentRoute === "portfolio") {
      activeTitle = `Client Portfolio & Case Studies | ${brand} - Digital Agency Dhaka`;
      activeDesc = `Browse recent client success stories, e-commerce storefronts, corporate brand identities, viral reels, and marketing funnels engineered by ${brand} in Dhaka.`;
      activePath = "/portfolio";
      breadcrumbItems.push({ name: "Portfolio", url: `${currentOrigin}/portfolio` });
    } else if (currentRoute === "portfolio-detail") {
      const activeProject = portfolios.find(p => p.slug === selectedProjectSlug || p.id === selectedProjectSlug);
      if (activeProject) {
        activeTitle = activeProject.seoTitle || `${activeProject.title} | Case Study - ${brand} Dhaka`;
        activeDesc = activeProject.seoDescription || activeProject.shortDescription || `Discover how ${brand} engineered measurable business growth for ${activeProject.clientName || activeProject.title}.`;
        if (activeProject.thumbnail) activeImage = activeProject.thumbnail;
      } else {
        activeTitle = `Case Study & Client Work | ${brand} - Digital Agency Dhaka`;
        activeDesc = `Explore detailed case studies and measurable digital outcomes from ${brand}.`;
      }
      activePath = `/portfolio/${selectedProjectSlug}`;
      breadcrumbItems.push({ name: "Portfolio", url: `${currentOrigin}/portfolio` });
      if (activeProject) {
        breadcrumbItems.push({ name: activeProject.title, url: `${currentOrigin}/portfolio/${selectedProjectSlug}` });
      }
    } else if (currentRoute === "packages") {
      activeTitle = `Pricing & Monthly Retainers | ${brand} - Transparent Agency Packages`;
      activeDesc = `Explore transparent pricing for custom business websites, graphic design subscriptions, viral video reels retainers, and full-service digital agency growth packages in Bangladesh.`;
      activePath = "/packages";
      breadcrumbItems.push({ name: "Pricing & Retainers", url: `${currentOrigin}/packages` });
    } else if (currentRoute === "about") {
      activeTitle = `About ${brand} | Elite Digital Growth & Creative Team in Dhaka`;
      activeDesc = `Meet the multidisciplinary team of engineers, brand designers, and video strategists powering ${brand}. Based in Dhaka, scaling businesses globally.`;
      activePath = "/about";
      breadcrumbItems.push({ name: "About Us", url: `${currentOrigin}/about` });
    } else if (currentRoute === "faq") {
      activeTitle = `Frequently Asked Questions (FAQ) | ${brand} - Process, Pricing & Turnaround`;
      activeDesc = `Get instant answers regarding our web design delivery times, revision policies, monthly retainer scopes, security protocols, and client onboarding process.`;
      activePath = "/faq";
      breadcrumbItems.push({ name: "FAQ", url: `${currentOrigin}/faq` });
    } else if (currentRoute === "free-audit") {
      activeTitle = `Claim Free 15-Point Digital Audit | ${brand} - Growth & Website Review`;
      activeDesc = `Request a free, high-impact review of your website speed, conversion leaks, branding, and social media reach by ${brand}'s senior digital growth strategists in Dhaka.`;
      activePath = "/free-audit";
      breadcrumbItems.push({ name: "Free Audit", url: `${currentOrigin}/free-audit` });
    } else if (currentRoute === "contact") {
      activeTitle = `Contact ${brand} | Hire Our Creative Agency in Dhaka, Bangladesh`;
      activeDesc = `Connect with ${brand} to discuss your next web design, branding, or video editing project. Direct WhatsApp, phone consultation, and office support in Dhaka.`;
      activePath = "/contact";
      breadcrumbItems.push({ name: "Contact", url: `${currentOrigin}/contact` });
    } else if (currentRoute === "privacy-policy") {
      activeTitle = `Privacy Policy | ${brand} Digital Agency`;
      activeDesc = `Read ${brand}'s privacy policy outlining data collection, security safeguards, and cookie handling for our website visitors and clients.`;
      activePath = "/privacy-policy";
      breadcrumbItems.push({ name: "Privacy Policy", url: `${currentOrigin}/privacy-policy` });
    } else if (currentRoute === "terms") {
      activeTitle = `Terms & Conditions of Service | ${brand}`;
      activeDesc = `Review the terms and conditions governing project deliverables, service milestones, intellectual property ownership, and monthly retainers with ${brand}.`;
      activePath = "/terms";
      breadcrumbItems.push({ name: "Terms", url: `${currentOrigin}/terms` });
    } else if (currentRoute === "admin") {
      activeTitle = `Admin Management Console | ${brand} Control`;
      activeDesc = `Secure administrative dashboard for ${brand}.`;
      activePath = "/admin";
    } else {
      // Default / Home
      activeTitle = siteContent.metaTitle?.trim() || `${brand} | Best Web Design & Creative Digital Agency in Bangladesh - Dhaka`;
      activeDesc = siteContent.metaDescription?.trim() || `${brand} is Dhaka's premier creative and digital growth agency. We build high-converting websites, corporate brand identities, viral video reels, and monthly marketing retainers to scale your business.`;
      activePath = "/";
    }

    // 1. Dynamic Title
    document.title = activeTitle;

    let metaTitleEl = document.querySelector("meta[name='title']") as HTMLMetaElement | null;
    if (!metaTitleEl) {
      metaTitleEl = document.createElement("meta");
      metaTitleEl.name = "title";
      document.getElementsByTagName("head")[0].appendChild(metaTitleEl);
    }
    metaTitleEl.content = activeTitle;

    // OpenGraph Title & Twitter Title
    let ogTitle = document.querySelector("meta[property='og:title']") as HTMLMetaElement | null;
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.getElementsByTagName("head")[0].appendChild(ogTitle);
    }
    ogTitle.content = activeTitle;

    let twitterTitle = document.querySelector("meta[name='twitter:title']") as HTMLMetaElement | null;
    if (!twitterTitle) {
      twitterTitle = document.createElement("meta");
      twitterTitle.name = "twitter:title";
      document.getElementsByTagName("head")[0].appendChild(twitterTitle);
    }
    twitterTitle.content = activeTitle;

    // OpenGraph / Twitter URLs & Images
    const fullCanonicalUrl = activePath === "/" ? `${currentOrigin}/` : `${currentOrigin}${activePath}`;

    let ogUrl = document.querySelector("meta[property='og:url']") as HTMLMetaElement | null;
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.getElementsByTagName("head")[0].appendChild(ogUrl);
    }
    ogUrl.content = fullCanonicalUrl;

    let twitterUrl = document.querySelector("meta[name='twitter:url']") as HTMLMetaElement | null;
    if (!twitterUrl) {
      twitterUrl = document.createElement("meta");
      twitterUrl.name = "twitter:url";
      document.getElementsByTagName("head")[0].appendChild(twitterUrl);
    }
    twitterUrl.content = fullCanonicalUrl;

    let ogImg = document.querySelector("meta[property='og:image']") as HTMLMetaElement | null;
    if (!ogImg) {
      ogImg = document.createElement("meta");
      ogImg.setAttribute("property", "og:image");
      document.getElementsByTagName("head")[0].appendChild(ogImg);
    }
    ogImg.content = activeImage;

    let twitterImg = document.querySelector("meta[name='twitter:image']") as HTMLMetaElement | null;
    if (!twitterImg) {
      twitterImg = document.createElement("meta");
      twitterImg.name = "twitter:image";
      document.getElementsByTagName("head")[0].appendChild(twitterImg);
    }
    twitterImg.content = activeImage;

    // OpenGraph Site Name & Type
    let ogSiteName = document.querySelector("meta[property='og:site_name']") as HTMLMetaElement | null;
    if (!ogSiteName) {
      ogSiteName = document.createElement("meta");
      ogSiteName.setAttribute("property", "og:site_name");
      document.getElementsByTagName("head")[0].appendChild(ogSiteName);
    }
    ogSiteName.content = brand;

    let ogType = document.querySelector("meta[property='og:type']") as HTMLMetaElement | null;
    if (!ogType) {
      ogType = document.createElement("meta");
      ogType.setAttribute("property", "og:type");
      document.getElementsByTagName("head")[0].appendChild(ogType);
    }
    ogType.content = "website";

    // Canonical & International Hreflang link tags
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.getElementsByTagName("head")[0].appendChild(canonical);
    }
    canonical.href = fullCanonicalUrl;

    const hreflangLocales = [
      { lang: "x-default", href: fullCanonicalUrl },
      { lang: "en", href: fullCanonicalUrl },
      { lang: "en-US", href: fullCanonicalUrl },
      { lang: "en-GB", href: fullCanonicalUrl },
      { lang: "en-CA", href: fullCanonicalUrl },
      { lang: "en-AU", href: fullCanonicalUrl },
      { lang: "bn", href: fullCanonicalUrl }
    ];

    hreflangLocales.forEach(({ lang, href }) => {
      let altLink = document.querySelector(`link[rel='alternate'][hreflang='${lang}']`) as HTMLLinkElement | null;
      if (!altLink) {
        altLink = document.createElement("link");
        altLink.rel = "alternate";
        altLink.hreflang = lang;
        document.getElementsByTagName("head")[0].appendChild(altLink);
      }
      altLink.href = href;
    });

    // Robots meta tag: noindex for Admin, index/follow for public pages
    let robotsMeta = document.querySelector("meta[name='robots']") as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.name = "robots";
      document.getElementsByTagName("head")[0].appendChild(robotsMeta);
    }
    robotsMeta.content = currentRoute === "admin"
      ? "noindex, nofollow, noarchive"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    // 2. Dynamic Favicon
    if (siteContent.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = siteContent.faviconUrl;
    }

    // 3. Dynamic Meta Description
    let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.getElementsByTagName("head")[0].appendChild(metaDesc);
    }
    metaDesc.content = activeDesc;

    let ogDesc = document.querySelector("meta[property='og:description']") as HTMLMetaElement | null;
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.getElementsByTagName("head")[0].appendChild(ogDesc);
    }
    ogDesc.content = activeDesc;

    let twDesc = document.querySelector("meta[name='twitter:description']") as HTMLMetaElement | null;
    if (!twDesc) {
      twDesc = document.createElement("meta");
      twDesc.name = "twitter:description";
      document.getElementsByTagName("head")[0].appendChild(twDesc);
    }
    twDesc.content = activeDesc;

    // 4. Dynamic Meta Keywords
    let metaKey = document.querySelector("meta[name='keywords']") as HTMLMetaElement | null;
    if (!metaKey) {
      metaKey = document.createElement("meta");
      metaKey.name = "keywords";
      document.getElementsByTagName("head")[0].appendChild(metaKey);
    }
    metaKey.content = activeKeywords;

    // 5. Dynamic Google Site Verification
    if (siteContent.googleSiteVerification) {
      let metaGsv = document.querySelector("meta[name='google-site-verification']") as HTMLMetaElement | null;
      if (!metaGsv) {
        metaGsv = document.createElement("meta");
        metaGsv.name = "google-site-verification";
        document.getElementsByTagName("head")[0].appendChild(metaGsv);
      }
      metaGsv.content = siteContent.googleSiteVerification;
    }

    // 6. Dynamic Schema.org JSON-LD Structured Data
    if (typeof window !== "undefined") {
      const schemaScriptId = "schema-org-jsonld";
      let schemaScript = document.getElementById(schemaScriptId) as HTMLScriptElement | null;
      if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.id = schemaScriptId;
        schemaScript.type = "application/ld+json";
        document.head.appendChild(schemaScript);
      }

      // BreadcrumbList schema
      const breadcrumbSchema = {
        "@type": "BreadcrumbList",
        "@id": `${fullCanonicalUrl}#breadcrumb`,
        "itemListElement": breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        }))
      };

      // Organization / LocalBusiness schema
      const businessSchema = {
        "@type": ["ProfessionalService", "LocalBusiness", "Organization"],
        "@id": `${currentOrigin}/#agency`,
        "name": brand,
        "alternateName": "B2bfiy Creative Agency Dhaka",
        "url": currentOrigin,
        "logo": siteContent.logoUrl || `${currentOrigin}/logo.png`,
        "image": activeImage,
        "description": siteContent.metaDescription || "Top-rated creative digital growth agency in Dhaka offering high-converting web design, corporate branding, video editing, and social media retainers.",
        "telephone": siteContent.floatingCall || siteContent.phone || "+8801712345678",
        "email": siteContent.email || "hello@b2bfiy.me",
        "priceRange": "$$",
        "currenciesAccepted": "USD, EUR, GBP, CAD, AUD, AED, SGD, BDT",
        "paymentAccepted": "Credit Card, Stripe, PayPal, Wire Transfer, Wise, Bank Transfer, bKash, Nagad",
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "09:00",
            "closes": "22:00"
          }
        ],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Gulshan / Banani",
          "addressLocality": "Dhaka",
          "addressRegion": "Dhaka Division",
          "postalCode": "1212",
          "addressCountry": "BD"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "23.8103",
          "longitude": "90.4125"
        },
        "areaServed": [
          { "@type": "Place", "name": "Worldwide" },
          { "@type": "Country", "name": "United States" },
          { "@type": "Country", "name": "United Kingdom" },
          { "@type": "Country", "name": "Canada" },
          { "@type": "Country", "name": "Australia" },
          { "@type": "Country", "name": "United Arab Emirates" },
          { "@type": "Country", "name": "Singapore" },
          { "@type": "Country", "name": "Germany" },
          { "@type": "Country", "name": "Bangladesh" },
          { "@type": "City", "name": "Dhaka" }
        ],
        "sameAs": [
          siteContent.socials?.facebook || "https://facebook.com/b2bfiy",
          siteContent.socials?.instagram || "https://instagram.com/b2bfiy",
          siteContent.socials?.linkedin || "https://linkedin.com/company/b2bfiy"
        ].filter(Boolean),
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "bestRating": "5",
          "worstRating": "1",
          "ratingCount": "48",
          "reviewCount": "48"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Creative & Digital Growth Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "High-Converting Web Development & UI/UX Design",
                "description": "Custom Next.js/React business websites, SaaS platforms, and e-commerce stores engineered for sub-second speeds and maximum conversion rates."
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Corporate Brand Identity & Graphic Design",
                "description": "Comprehensive brand guidelines, vector logo design, product packaging, and high-impact digital social graphics."
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Cinematic & Viral Video Editing for Reels & TikTok",
                "description": "Short-form video editing with retention hooks, kinetic typography, dynamic zooms, and sound design."
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Full-Service Monthly Social Media Retainers",
                "description": "Dedicated monthly digital growth retainers covering content creation, daily posting, copywriting, and ad management."
              }
            }
          ]
        }
      };

      // WebSite schema with search action
      const websiteSchema = {
        "@type": "WebSite",
        "@id": `${currentOrigin}/#website`,
        "url": currentOrigin,
        "name": brand,
        "description": siteContent.metaDescription || activeDesc,
        "publisher": {
          "@id": `${currentOrigin}/#agency`
        }
      };

      const graphElements: any[] = [businessSchema, websiteSchema, breadcrumbSchema];

      // FAQPage schema on /faq or on Home
      if (currentRoute === "faq" || currentRoute === "home") {
        graphElements.push({
          "@type": "FAQPage",
          "@id": `${fullCanonicalUrl}#faq`,
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What core digital services does B2bfiy offer?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "B2bfiy provides four core premium services: 1. Full-Stack Web Development & E-Commerce Stores; 2. Graphic Design & Corporate Visual Identity; 3. Viral Video Editing for TikTok, Reels & YouTube; 4. Monthly Social Media Management & Growth Retainers."
              }
            },
            {
              "@type": "Question",
              "name": "How fast are project turnarounds at B2bfiy?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Standard business websites are delivered live within 7 to 10 days. Social media graphics and short-form video reels have a rapid turnaround of 24 to 48 hours."
              }
            },
            {
              "@type": "Question",
              "name": "How do monthly growth retainers work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Monthly retainers provide dedicated agency capacity with fixed pricing and zero surprise fees. You receive scheduled batches of high-retention graphics, video reels, content calendars, and priority engineering support."
              }
            },
            {
              "@type": "Question",
              "name": "Do I own 100% of the deliverables and source code?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Upon completion of milestone clearance, you retain 100% full intellectual property ownership of all custom website code, raw design files, vector logos, and video footage."
              }
            },
            {
              "@type": "Question",
              "name": "Can I claim a free digital growth audit for my business?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! We offer a complimentary 15-point digital audit covering your website conversion rate, mobile speed, brand consistency, and social media reach with zero obligation."
              }
            }
          ]
        });
      }

      const structuredData = {
        "@context": "https://schema.org",
        "@graph": graphElements
      };

      schemaScript.textContent = JSON.stringify(structuredData);
    }

    // 7. Dynamic Meta Pixel (Facebook Pixel) Setup
    if (siteContent.metaPixelId) {
      const pixelId = siteContent.metaPixelId.trim();
      if (pixelId && typeof window !== "undefined") {
        const scriptId = "meta-pixel-script";
        let existingScript = document.getElementById(scriptId);
        
        if (!existingScript) {
          (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
            if (f.fbq) return;
            n = f.fbq = function() {
              n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) f._fbq = n;
            n.push = n;
            n.loaded = !0;
            n.version = '2.0';
            n.queue = [];
            t = b.createElement(e);
            t.async = !0;
            t.src = v;
            t.id = scriptId;
            s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s);
          })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

          try {
            (window as any).fbq('init', pixelId);
            console.log(`[SEO & Analytics] Meta Pixel ${pixelId} successfully initialized.`);
          } catch (e) {
            console.error("Meta Pixel execution error: ", e);
          }
        }
      }
    }

    // 8. Dynamic Google Analytics 4 (gtag.js) Setup
    if (siteContent.ga4MeasurementId) {
      const ga4Id = siteContent.ga4MeasurementId.trim();
      if (ga4Id && typeof window !== "undefined") {
        const scriptId = "google-tag-script";
        let existingScript = document.getElementById(scriptId);

        if (!existingScript) {
          (window as any).dataLayer = (window as any).dataLayer || [];
          function gtag(...args: any[]) {
            (window as any).dataLayer.push(args);
          }
          (window as any).gtag = (window as any).gtag || gtag;
          (window as any).gtag('js', new Date());
          (window as any).gtag('config', ga4Id);

          const script = document.createElement("script");
          script.id = scriptId;
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
          document.head.appendChild(script);

          console.log(`[SEO & Analytics] Google Tag ${ga4Id} successfully initialized.`);
        }
      }
    }
  }, [
    currentRoute,
    selectedProjectSlug,
    siteContent.brandName,
    siteContent.metaTitle,
    siteContent.faviconUrl,
    siteContent.metaDescription,
    siteContent.seoKeywords,
    siteContent.googleSiteVerification,
    siteContent.metaPixelId,
    siteContent.ga4MeasurementId,
    siteContent.hero?.imageUrl,
    portfolios
  ]);

  // 6b. Server-side PageView tracking (Meta CAPI + GA4), fired on every route
  // change. Runs independently of whether the client-side Pixel script has
  // loaded, and is deduplicated against the client Pixel PageView via a
  // shared event_id (see src/lib/serverTracking.ts).
  useEffect(() => {
    if (currentRoute === "admin") return;
    trackPageView(siteContent.metaPixelId);
  }, [currentRoute, siteContent.metaPixelId]);

  // 2. LocalStorage & Neon Database Persistence Sync helpers
  const handleUpdateSiteContent = async (nextContent: SiteContent) => {
    setSiteContent(nextContent);
    safeSetLocalStorage("b2bfiy_site_content", JSON.stringify(nextContent));
    
    // Background sync to database
    try {
      const ok = await saveSiteContentToDb(nextContent);
      if (!ok) {
        console.warn("Neon site content sync returned false. LocalStorage updated.");
      }
    } catch (e) {
      console.warn("Neon background site content sync failed:", e);
    }
  };

  const handleUpdatePortfolios = async (nextPortfolios: PortfolioProject[]) => {
    const sorted = sortPortfolios(nextPortfolios);
    setPortfolios(sorted);
    safeSetLocalStorage("b2bfiy_portfolios", JSON.stringify(sorted));
    
    // Background sync to database
    try {
      const ok = await syncPortfoliosToDb(sorted);
      if (!ok) {
        console.warn("Neon portfolio sync returned false. LocalStorage updated.");
      }
    } catch (e) {
      console.warn("Neon background portfolio sync failed:", e);
    }
  };

  const handleUpdatePackages = async (nextPackages: ServicePackage[]) => {
    setPackages(nextPackages);
    safeSetLocalStorage("b2bfiy_packages", JSON.stringify(nextPackages));
    
    // Background sync to database
    try {
      const ok = await syncPackagesToDb(nextPackages);
      if (!ok) {
        console.warn("Neon packages sync returned false. LocalStorage updated.");
      }
    } catch (e) {
      console.warn("Neon background packages sync failed:", e);
    }
  };

  const handleUpdateMedia = async (nextMedia: MediaItem[]) => {
    setMediaItems(nextMedia);
    safeSetLocalStorage("b2bfiy_media_items", JSON.stringify(nextMedia));
    
    // Background sync to database
    try {
      const ok = await syncMediaItemsToDb(nextMedia);
      if (!ok) {
        console.warn("Neon media sync returned false. LocalStorage updated.");
      }
    } catch (e) {
      console.warn("Neon background media sync failed:", e);
    }
  };

  const handleLeadSubmit = async (newLead: Lead) => {
    const nextLeads = [newLead, ...leads];
    setLeads(nextLeads);
    safeSetLocalStorage("b2bfiy_leads", JSON.stringify(nextLeads));

    // Fire a Lead conversion event via client Pixel + server-side (Meta CAPI / GA4).
    try {
      trackLead(siteContent.metaPixelId, {
        email: (newLead as any).email,
        phone: (newLead as any).whatsappNumber,
      });
    } catch (e) {
      console.warn("Lead tracking dispatch failed:", e);
    }

    // Background sync to database
    try {
      await saveLeadToDb(newLead);
    } catch (e) {
      console.warn("Neon background lead submission failed:", e);
    }
  };

  const handleUpdateLead = async (leadId: string, updatedLead: Partial<Lead>) => {
    const nextLeads = leads.map((lead) => (lead.id === leadId ? { ...lead, ...updatedLead } : lead));
    setLeads(nextLeads);
    safeSetLocalStorage("b2bfiy_leads", JSON.stringify(nextLeads));
    
    // Background sync to database
    const fullLead = nextLeads.find(l => l.id === leadId);
    if (fullLead) {
      try {
        await saveLeadToDb(fullLead);
      } catch (e) {
        console.warn("Neon background lead update failed:", e);
      }
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const nextLeads = leads.filter((lead) => lead.id !== leadId);
    setLeads(nextLeads);
    safeSetLocalStorage("b2bfiy_leads", JSON.stringify(nextLeads));
    
    // Background sync to database
    try {
      await deleteLeadFromDb(leadId);
    } catch (e) {
      console.warn("Neon background lead deletion failed:", e);
    }
  };

  const handleRefreshLeads = async () => {
    try {
      const freshLeads = await fetchLeadsFromDb();
      if (freshLeads) {
        setLeads(freshLeads);
        safeSetLocalStorage("b2bfiy_leads", JSON.stringify(freshLeads));
      }
    } catch (e) {
      console.warn("Failed to manually refresh leads from database:", e);
      throw e;
    }
  };

  // 3. Dynamic Page Selector Renderer
  const renderPage = () => {
    switch (currentRoute) {
      case "home":
        return (
          <Home
            setRoute={setRoute}
            setSelectedProjectSlug={setSelectedProjectSlug}
            siteContent={siteContent}
            portfolios={portfolios}
            packages={packages}
            onLeadSubmit={handleLeadSubmit}
          />
        );
      case "services":
        return (
          <Services
            setRoute={setRoute}
            siteContent={siteContent}
            packages={packages}
            onLeadSubmit={handleLeadSubmit}
          />
        );
      case "portfolio":
        return (
          <Portfolio
            setRoute={setRoute}
            setSelectedProjectSlug={setSelectedProjectSlug}
            portfolios={portfolios}
            siteContent={siteContent}
          />
        );
      case "portfolio-detail":
        return (
          <ProjectDetail
            setRoute={setRoute}
            slug={selectedProjectSlug}
            portfolios={portfolios}
          />
        );
      case "packages":
        return (
          <Packages
            setRoute={setRoute}
            siteContent={siteContent}
            packages={packages}
            selectedCategory={selectedPackageCategory}
            onSelectCategory={setSelectedPackageCategory}
          />
        );
      case "about":
        return <About setRoute={setRoute} siteContent={siteContent} />;
      case "free-audit":
        return (
          <FreeAudit
            setRoute={setRoute}
            siteContent={siteContent}
            onLeadSubmit={handleLeadSubmit}
          />
        );
      case "contact":
        return (
          <Contact
            setRoute={setRoute}
            siteContent={siteContent}
            onLeadSubmit={handleLeadSubmit}
            prefilledService={selectedPackageForContact}
          />
        );
      case "privacy-policy":
        return <PrivacyPolicy siteContent={siteContent} />;
      case "terms":
        return <Terms siteContent={siteContent} />;
      case "faq":
        return <FAQ setRoute={setRoute} siteContent={siteContent} />;
      case "admin":
        return (
          <Admin
            leads={leads}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            onRefreshLeads={handleRefreshLeads}
            portfolios={portfolios}
            onUpdatePortfolios={handleUpdatePortfolios}
            packages={packages}
            onUpdatePackages={handleUpdatePackages}
            siteContent={siteContent}
            onUpdateSiteContent={handleUpdateSiteContent}
            mediaItems={mediaItems}
            onUpdateMedia={handleUpdateMedia}
          />
        );
      default:
        return (
          <Home
            setRoute={setRoute}
            setSelectedProjectSlug={setSelectedProjectSlug}
            siteContent={siteContent}
            portfolios={portfolios}
            packages={packages}
          />
        );
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroSplash onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      {/* FIXED PREMIUM BACKGROUND (stays put while the page scrolls over it) */}
      <SiteBackground />

      <div className="flex flex-col min-h-screen text-[#101828] dark:text-gray-100 font-sans transition-colors duration-300 relative selection:bg-[#FF2D2D] selection:text-white">
        {/* 1. FLOATING STICKY HEADER */}
      <Header 
        currentRoute={currentRoute} 
        setRoute={setRoute} 
        siteContent={siteContent} 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* 2. ACTIVE MAIN PAGE VIEW */}
      <main className="flex-grow">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-10 h-10 border-4 border-[#FF2D2D] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          {renderPage()}
        </Suspense>
      </main>

      {/* 4. MULTI-COLUMN PROFESSIONAL FOOTER */}
      <Footer setRoute={setRoute} siteContent={siteContent} />

      {/* FLOATING SUPPORT WIDGETS (AI ASSISTANT, WHATSAPP & CALL) */}
      {siteContent.showFloatingButtons !== false && currentRoute !== "admin" && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3.5">
          {/* AI Assistant & FAQ Chatbot Widget */}
          {siteContent.showAiFloatingButton !== false && (
            <motion.button
              id="floating-ai-faq-button"
              type="button"
              onClick={() => {
                setRoute("faq");
                window.scrollTo({ top: 0, behavior: "smooth" });
                setTimeout(() => {
                  const chatInput = document.getElementById("chat-input-textarea");
                  if (chatInput) {
                    chatInput.focus();
                  }
                }, 120);
              }}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#1E40AF] via-[#2563EB] to-[#4F46E5] text-white shadow-xl group relative cursor-pointer border border-white/20 transition-all ${
                currentRoute === "faq" ? "ring-4 ring-blue-400/40 shadow-blue-500/50" : "shadow-indigo-900/30"
              }`}
              aria-label="AI Assistant and FAQ"
            >
              <div className="relative flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
                <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
              </div>

              {/* Live AI Online Pulse Dot */}
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5" title="AI Live 24/7">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#101828]"></span>
              </span>

              <span className="absolute right-16 bg-[#101828] text-white text-[11px] font-bold px-3 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-xl transform translate-x-2 group-hover:translate-x-0 flex items-center gap-1.5 border border-white/10">
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                <span>AI Assistant & FAQ</span>
              </span>
            </motion.button>
          )}

          {/* Call Widget */}
          {siteContent.showCallFloatingButton !== false && ((siteContent.floatingCall || siteContent.phone || "").trim().length > 0) && (
            <motion.a
              href={`tel:${(siteContent.floatingCall || siteContent.phone || "").replace(/[^0-9+]/g, "")}`}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.08 }}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-[#FF2D2D] text-white shadow-xl group relative cursor-pointer"
              aria-label="Call Support"
            >
              <div>
                <Phone className="w-6 h-6" />
              </div>

              <span className="absolute right-16 bg-[#101828] text-white text-[11px] font-bold px-3 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-xl transform translate-x-2 group-hover:translate-x-0">
                Call: {siteContent.floatingCall || siteContent.phone}
              </span>
            </motion.a>
          )}

          {/* WhatsApp Widget */}
          {siteContent.showWhatsAppFloatingButton !== false && ((siteContent.floatingWhatsApp || siteContent.socials?.whatsapp || "").trim().length > 0) && (
            <motion.a
              href={`https://wa.me/${(siteContent.floatingWhatsApp || siteContent.socials?.whatsapp || "").replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.16 }}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl group relative cursor-pointer"
              aria-label="WhatsApp Support"
            >
              <div>
                <MessageCircle className="w-6.5 h-6.5 fill-white text-[#25D366]" />
              </div>

              <span className="absolute right-16 bg-[#101828] text-white text-[11px] font-bold px-3 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-xl transform translate-x-2 group-hover:translate-x-0">
                WhatsApp Chat
              </span>
            </motion.a>
          )}
        </div>
      )}

    </div>
    </>
  );
}
