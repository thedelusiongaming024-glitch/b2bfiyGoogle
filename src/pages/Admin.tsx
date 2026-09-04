import React, { useState, useEffect } from "react";
import {
  Users, Briefcase, Settings, Image as ImageIcon, DollarSign,
  Plus, Edit2, Trash2, Check, AlertCircle, Save, Info, Link, FileText, Search, Eye,
  Lock, Unlock, LogOut, Key, Upload, Library, Phone, MessageCircle, Database, Copy, Type, Star,
  Globe, Tag, Sparkles, RefreshCw, ExternalLink, Bot, HelpCircle
} from "lucide-react";
import { Lead, PortfolioProject, ServicePackage, SiteContent, MediaItem } from "../types";
import { optimizeImageUrl } from "../lib/imageUtils";
import SEOPreview from "../components/SEOPreview";
import AnalyticsPageViewsChart from "../components/AnalyticsPageViewsChart";
import AdminAiDashboard from "../components/AdminAiDashboard";
import {
  getDbStatus,
  getNeonSQLScript,
  pushAllLocalDataToDb,
  signInAdmin,
  signOutAdmin,
  getAdminSession,
  onAdminAuthStateChange,
  notifyAdminAuthChanged,
  updateAdminPassword,
  AdminSession
} from "../lib/db";

interface AdminProps {
  leads: Lead[];
  onUpdateLead: (leadId: string, updatedLead: Partial<Lead>) => void;
  onDeleteLead: (leadId: string) => void;
  onRefreshLeads?: () => Promise<void> | void;
  portfolios: PortfolioProject[];
  onUpdatePortfolios: (projects: PortfolioProject[]) => Promise<any> | any;
  packages: ServicePackage[];
  onUpdatePackages: (pkgs: ServicePackage[]) => Promise<any> | any;
  siteContent: SiteContent;
  onUpdateSiteContent: (content: SiteContent) => Promise<any> | any;
  mediaItems: MediaItem[];
  onUpdateMedia: (items: MediaItem[]) => Promise<any> | any;
}

type AdminTab = "leads" | "portfolios" | "packages" | "faqs" | "content" | "media" | "security" | "database" | "ai";

const compressImage = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/") || file.type.includes("svg")) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Fill with white background to handle transparent PNGs gracefully when converting to JPEG
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);
        
        // Force JPEG format for superb lossy compression, which respects quality
        const format = "image/jpeg";
        const compressedBase64 = canvas.toDataURL(format, quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function Admin({
  leads, onUpdateLead, onDeleteLead, onRefreshLeads,
  portfolios, onUpdatePortfolios,
  packages, onUpdatePackages,
  siteContent, onUpdateSiteContent,
  mediaItems, onUpdateMedia
}: AdminProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("leads");
  const [isRefreshingLeads, setIsRefreshingLeads] = useState(false);
  
  // Notification States
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Search/Filter states inside admin
  const [leadFilter, setLeadFilter] = useState<string>("All");
  const [leadSearch, setLeadSearch] = useState("");

  // Authentication State — backed by a real admin_users row in Neon (email +
  // bcrypt password hash) and an HttpOnly JWT cookie, not a password baked
  // into the client bundle. The first account is bootstrapped from the
  // ADMIN_EMAIL / ADMIN_PASSWORD server env vars on first sign-in.
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isLoggedIn = !!adminSession;

  useEffect(() => {
    let active = true;
    getAdminSession()
      .then((session) => {
        if (active) setAdminSession(session);
      })
      .finally(() => {
        if (active) setIsCheckingSession(false);
      });

    const unsubscribe = onAdminAuthStateChange((session) => {
      if (active) setAdminSession(session);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const session = await signInAdmin(loginEmail.trim(), loginPass);
      setAdminSession(session);
      setLoginEmail("");
      setLoginPass("");
      notifyAdminAuthChanged();
      triggerSuccess("Signed in successfully.");
    } catch (err: any) {
      setLoginError(err?.message || "Invalid email or password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setAdminSession(null);
    notifyAdminAuthChanged();
  };

  // Security tab: change the logged-in admin's own password
  const [newAdminPass, setNewAdminPass] = useState("");
  const [confirmAdminPass, setConfirmAdminPass] = useState("");

  // Neon Database Connection State
  // Unlike Supabase's browser-configurable URL + anon key, the Neon
  // connection string (DATABASE_URL) is a full credential and lives only as
  // a server env var — there's nothing to paste in here, just a live status
  // check against /api/health.
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [dbStatus, setDbStatus] = useState<"not_connected" | "connected" | "configured_unreachable">("not_connected");
  const [isSqlCopied, setIsSqlCopied] = useState(false);

  const refreshDbStatus = async () => {
    setIsTestingConn(true);
    try {
      const { configured, connected } = await getDbStatus();
      if (connected) setDbStatus("connected");
      else if (configured) setDbStatus("configured_unreachable");
      else setDbStatus("not_connected");
    } finally {
      setIsTestingConn(false);
    }
  };

  useEffect(() => {
    refreshDbStatus();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(getNeonSQLScript());
    setIsSqlCopied(true);
    triggerSuccess("Neon SQL setup script copied to clipboard!");
    setTimeout(() => setIsSqlCopied(false), 3000);
  };

  const [isPushingData, setIsPushingData] = useState(false);

  const handlePushAllLocalData = async () => {
    setIsPushingData(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await pushAllLocalDataToDb(siteContent, portfolios, packages, mediaItems);
      if (res.success) {
        triggerSuccess(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to synchronize local state to your Neon tables. Please check your network and connection.");
    } finally {
      setIsPushingData(false);
    }
  };

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!newAdminPass.trim()) {
      setErrorMsg("Password cannot be blank.");
      return;
    }
    if (newAdminPass.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (newAdminPass !== confirmAdminPass) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await updateAdminPassword(newAdminPass);
      setNewAdminPass("");
      setConfirmAdminPass("");
      triggerSuccess("Password updated successfully!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Custom Local File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file.");
      return;
    }

    try {
      // Compress and resize image to prevent massive base64 uploads and slow loading on devices
      const compressedBase64 = await compressImage(file, 900, 900, 0.70);
      const newItem: MediaItem = {
        id: "uploaded-" + Date.now(),
        url: compressedBase64,
        name: file.name.split(".")[0] || "Custom Uploaded Image",
        category: "photo"
      };
      await onUpdateMedia([newItem, ...mediaItems]);
      triggerSuccess("Custom image optimized & uploaded to Media Library!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to read and optimize image file.");
    }
  };

  // Modal / Editing states for Portfolio
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState<Partial<PortfolioProject>>({
    title: "",
    slug: "",
    clientName: "",
    category: "Website Development",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    gallery: [],
    shortDescription: "",
    fullDescription: "",
    clientChallenge: "",
    ourSolution: "",
    workProcess: ["Discovery & planning of guidelines.", "UI/UX prototypes creation.", "Frontend development."],
    projectResult: "",
    technologies: ["React", "Tailwind CSS"],
    tags: ["Web", "Growth"],
    featured: false,
    published: true
  });

  // Partners state
  const [newPartnerName, setNewPartnerName] = useState("");

  // Adding Package State
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [newPackage, setNewPackage] = useState<Partial<ServicePackage>>({
    type: "monthly",
    title: "",
    price: "৳15,000",
    period: "Month",
    isPopular: false,
    features: [
      "Custom original graphics & design layout",
      "Dynamic responsive pages built from scratch",
      "Full SEO optimization structure",
      "High contrast visual highlights"
    ],
    deliveryTime: "7–10 days",
    ctaText: "Choose starter package",
    published: true
  });
  const [newPackageFeature, setNewPackageFeature] = useState("");

  // Editing state for Content
  const [editedContent, setEditedContent] = useState<SiteContent>(() => {
    return {
      ...siteContent,
      partners: siteContent.partners || [
        { id: "partner-1", name: "E-Commerce Brand" },
        { id: "partner-2", name: "Restaurant Group" },
        { id: "partner-3", name: "Local Retailer" },
        { id: "partner-4", name: "Dental Clinic" },
        { id: "partner-5", name: "Tech Startup" }
      ],
      about: {
        badge: siteContent.about?.badge || "About B2bfiy",
        title: siteContent.about?.title || "The Dedicated Creative & Growth Engine For Your Business",
        description: siteContent.about?.description || "We are a team of expert creators, engineers, and marketers aligned to construct professional corporate web platforms, designs, and reels to help brands scale up.",
        missionTitle: siteContent.about?.missionTitle || "Bridging High-Fidelity Creative Quality and Affordable Predictability",
        missionDesc1: siteContent.about?.missionDesc1 || "Managing five separate freelance contracts is chaotic. One delivers slow code, another misses graphic styles, and a third stops replying during launch. B2bfiy was founded in Dhaka to establish a single reliable, professional creative team that business owners can delegate to.",
        missionDesc2: siteContent.about?.missionDesc2 || "We leverage modern technology, custom design systems, and cinematic short-form frameworks to elevate small brands, medical clinics, restaurants, and startups globally into trustworthy digital icons.",
        coreValues: siteContent.about?.coreValues || [
          { title: "Results-First Execution", desc: "We don't prioritize vanity likes or useless visits. We build high-performance pipelines engineered to attract paying customers." },
          { title: "Absolute Transparency", desc: "No hidden setup costs, unexpected fees, or secret markups. Everything is communicated and priced upfront clearly." },
          { title: "Speed & Communication", desc: "Our teams coordinate via modern communication panels to answer questions within minutes and deliver designs on time." }
        ],
        founders: siteContent.about?.founders || [
          {
            emoji: "👨‍💻",
            role: "Co-Founder & CTO",
            name: "Senior Fullstack Engineer",
            description: "Engineers modern, responsive layouts, web portals, and commerce funnels."
          },
          {
            emoji: "🎨",
            role: "Co-Founder & Creative Director",
            name: "Visual Identity Director",
            description: "Directs social post styling guidelines, packaging, and cinematic reel templates."
          }
        ]
      },
      footerDesc: siteContent.footerDesc || "We help businesses build a powerful digital presence through high-converting websites, professional graphic design, engaging video content, and complete social media management.",
      copyright: siteContent.copyright || "© 2026 B2bfiy. All rights reserved.",
      privacyPolicy: siteContent.privacyPolicy || {
        lastUpdated: "July 19, 2026",
        introduction: "B2bfiy (“we,” “our,” or “us”) respects your privacy. This document outlines how we collect, process, and safeguard the information you provide when using our digital agency website, requesting free audits, or ordering monthly creative services.",
        informationCollect: "When you interact with our forms, we collect the following:\n\n• Contact Parameters: Full Name, email address, WhatsApp contact number.\n• Business Information: Company Name, existing website or Facebook page URL.\n• Project Guidelines: Desired service models, message texts, or audit contexts.",
        howWeProcess: "We process your submitted leads to:\n\n• Analyze your online representation and deliver the Free Digital Audit document.\n• Coordinate project deliverables and pricing quotes via email/WhatsApp.\n• Dispatch periodic performance updates and billing statements to monthly partners.",
        security: "We apply server-side encryption protocols and database protection firewalls to prevent unauthorized access, alteration, or data leaks. We do not sell or lease your business handles, email directories, or WhatsApp numbers to third-party marketing brokers.",
        contact: "If you have any questions or require your lead history removed from our administrative console database, please contact us directly at hello@b2bfiy.com."
      },
      terms: siteContent.terms || {
        lastUpdated: "July 19, 2026",
        scope: "By subscribing to B2bfiy monthly retainers or ordering custom website developments, you agree to coordinate with our project directors on layout requirements, content copy, or video edits on a regular basis.",
        billing: "Monthly growth retainers (Starter, Growth, Premium) require upfront payment at the start of each billing cycle month. Project-based custom web developments are split into milestone payments (typically 50% deposit and 50% upon final production approval).",
        ipOwnership: "Upon complete clearance of billing invoices, the client receives 100% full intellectual property ownership of all finalized custom websites, graphics, logos, layouts, and cinematic reel files. B2bfiy retains the right to display the finalized items in our public portfolio collection unless explicitly requested otherwise in writing.",
        cancellation: "Monthly subscription retainers can be cancelled or modified by providing a 7-day written notice before the next billing cycle. We do not provide prorated refunds for active design cycles once assets are delivered.",
        contact: "These terms shall be governed by applicable commercial laws. For official legal service notices, please email hello@b2bfiy.com."
      },
      serviceImages: siteContent.serviceImages || {
        webDev: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
        graphic: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80",
        video: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        social: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80"
      }
    };
  });
  const [editingStats, setEditingStats] = useState<{ id: string; value: string; label: string }[]>([...siteContent.stats]);

  // Media state
  const [pickingFor, setPickingFor] = useState<string | null>(null);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaName, setNewMediaName] = useState("");
  const [newMediaCat, setNewMediaCat] = useState<"mockup" | "graphic" | "video" | "photo">("mockup");

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Lead updates
  const handleStatusChange = (leadId: string, status: Lead["status"]) => {
    onUpdateLead(leadId, { status });
    triggerSuccess("Lead status updated successfully.");
  };

  const handleNotesSave = (leadId: string, notes: string) => {
    onUpdateLead(leadId, { notes });
    triggerSuccess("Lead administrative notes saved.");
  };

  const handleRefreshLeads = async () => {
    if (!onRefreshLeads) return;
    setIsRefreshingLeads(true);
    try {
      await onRefreshLeads();
      triggerSuccess("Lead registry refreshed from database.");
    } catch (e) {
      console.warn("Failed to refresh leads:", e);
    } finally {
      setIsRefreshingLeads(false);
    }
  };

  // Filtered Leads
  const filteredLeads = (leads || []).filter((lead) => {
    if (!lead) return false;
    const matchesType = leadFilter === "All" || lead.type === leadFilter;
    const searchLower = (leadSearch || "").toLowerCase().trim();
    if (!searchLower) return matchesType;

    const fullName = (lead.fullName || "").toLowerCase();
    const businessName = (lead.businessName || "").toLowerCase();
    const serviceNeeded = (lead.serviceNeeded || "").toLowerCase();
    const email = (lead.email || "").toLowerCase();
    const whatsapp = (lead.whatsappNumber || "").toLowerCase();
    const message = (lead.message || "").toLowerCase();

    const matchesSearch =
      fullName.includes(searchLower) ||
      businessName.includes(searchLower) ||
      serviceNeeded.includes(searchLower) ||
      email.includes(searchLower) ||
      whatsapp.includes(searchLower) ||
      message.includes(searchLower);

    return matchesType && matchesSearch;
  });

  // Portfolio actions
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleSaveNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !newProject.clientName || !newProject.shortDescription) {
      setErrorMsg("Please fill in the required fields (Title, Client, Short Description).");
      return;
    }

    const slug = newProject.slug || generateSlug(newProject.title);
    const slugExists = portfolios.some((p) => p.slug === slug);
    if (slugExists) {
      setErrorMsg("A project with this URL slug already exists. Please modify the title or slug.");
      return;
    }

    const created: PortfolioProject = {
      id: "project-" + Date.now(),
      title: newProject.title,
      slug,
      clientName: newProject.clientName,
      category: newProject.category as PortfolioProject["category"],
      subCategory: (newProject.category === "Video Editing" ? (newProject.subCategory || "Motion Video") : newProject.subCategory) as PortfolioProject["subCategory"],
      thumbnail: optimizeImageUrl(newProject.thumbnail) || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      gallery: (newProject.gallery || []).map((imgUrl) => optimizeImageUrl(imgUrl)),
      videoUrl: newProject.videoUrl || "",
      videoEmbed: newProject.videoEmbed || "",
      liveUrl: newProject.liveUrl || "",
      projectDate: newProject.projectDate || new Date().toISOString().split("T")[0],
      shortDescription: newProject.shortDescription,
      fullDescription: newProject.fullDescription || newProject.shortDescription,
      clientChallenge: newProject.clientChallenge || "No challenge defined.",
      ourSolution: newProject.ourSolution || "No custom solution defined.",
      workProcess: newProject.workProcess || ["Discovery", "Strategy", "Launch"],
      projectResult: newProject.projectResult || "Delivered successfully.",
      technologies: newProject.technologies || ["React"],
      tags: newProject.tags || ["Creative"],
      featured: !!newProject.featured,
      published: !!newProject.published,
      imageAspectRatio: newProject.imageAspectRatio || "video",
      imageFit: newProject.imageFit || "cover",
    };

    try {
      await onUpdatePortfolios([...portfolios, created]);
      setIsAddingProject(false);
      setNewProject({
        title: "",
        slug: "",
        clientName: "",
        category: "Website Development",
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        gallery: [],
        shortDescription: "",
        fullDescription: "",
        clientChallenge: "",
        ourSolution: "",
        workProcess: ["Discovery & planning of guidelines.", "UI/UX prototypes creation.", "Frontend development."],
        projectResult: "",
        technologies: ["React", "Tailwind CSS"],
        tags: ["Web", "Growth"],
        featured: false,
        published: true,
        imageAspectRatio: "video",
        imageFit: "cover",
      });
      triggerSuccess("New project case study created successfully!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Saved locally, but failed to sync with Neon. Verify your DATABASE_URL on the 'Database' tab.");
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const updatedList = portfolios.map((p) => {
      if (p.id === editingProject.id) {
        return {
          ...editingProject,
          thumbnail: optimizeImageUrl(editingProject.thumbnail),
          gallery: (editingProject.gallery || []).map((imgUrl) => optimizeImageUrl(imgUrl)),
          slug: editingProject.slug || generateSlug(editingProject.title)
        };
      }
      return p;
    });

    try {
      await onUpdatePortfolios(updatedList);
      setEditingProject(null);
      triggerSuccess("Project case study updated successfully.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Saved locally, but failed to sync with Neon. Verify your DATABASE_URL on the 'Database' tab.");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("Are you sure you want to permanently delete this portfolio project?")) {
      try {
        await onUpdatePortfolios(portfolios.filter((p) => p.id !== projectId));
        triggerSuccess("Project deleted.");
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Failed to sync project deletion to Neon. Check DB settings.");
      }
    }
  };

  // Content Saving
  const handleSaveContent = async () => {
    const nextContent = {
      ...editedContent,
      stats: editingStats
    };
    try {
      await onUpdateSiteContent(nextContent);
      triggerSuccess("Global website content updated successfully.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Saved locally, but failed to sync with Neon. Check DB settings.");
    }
  };

  // Package Updates
  const handlePackageValueChange = async (id: string, field: keyof ServicePackage, value: any) => {
    const updatedList = packages.map((pkg) => {
      if (pkg.id === id) {
        return { ...pkg, [field]: value };
      }
      return pkg;
    });
    try {
      await onUpdatePackages(updatedList);
      triggerSuccess("Package updated successfully.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Saved locally, but failed to sync with Neon.");
    }
  };

  const handleSaveNewPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackage.title || !newPackage.price) {
      setErrorMsg("Please fill in the package Title and Price.");
      return;
    }

    const created: ServicePackage = {
      id: "pkg-" + Date.now(),
      type: newPackage.type as ServicePackage["type"],
      title: newPackage.title,
      price: newPackage.price,
      period: newPackage.period || "Month",
      isPopular: !!newPackage.isPopular,
      features: newPackage.features || [],
      deliveryTime: newPackage.deliveryTime || "7–10 days",
      ctaText: newPackage.ctaText || "Get started",
      published: !!newPackage.published
    };

    try {
      await onUpdatePackages([...packages, created]);
      setIsAddingPackage(false);
      setNewPackage({
        type: "monthly",
        title: "",
        price: "৳15,000",
        period: "Month",
        isPopular: false,
        features: [
          "Custom original graphics & design layout",
          "Dynamic responsive pages built from scratch",
          "Full SEO optimization structure",
          "High contrast visual highlights"
        ],
        deliveryTime: "7–10 days",
        ctaText: "Choose starter package",
        published: true
      });
      triggerSuccess("New service package created successfully.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Saved locally, but failed to sync with Neon.");
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this package tier?")) {
      try {
        await onUpdatePackages(packages.filter((p) => p.id !== id));
        triggerSuccess("Service package tier deleted.");
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Failed to delete package tier from Neon.");
      }
    }
  };

  // Media Library Upload
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl || !newMediaName) return;

    const newItem: MediaItem = {
      id: "media-" + Date.now(),
      url: newMediaUrl,
      name: newMediaName,
      category: newMediaCat
    };

    try {
      await onUpdateMedia([...mediaItems, newItem]);
      setNewMediaUrl("");
      setNewMediaName("");
      triggerSuccess("Custom media asset registered successfully.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Saved locally, but failed to sync with Neon.");
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      await onUpdateMedia(mediaItems.filter((item) => item.id !== id));
      triggerSuccess("Media item removed.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to remove media item from Neon.");
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7F5]">
        <span className="text-xs font-semibold text-[#475467]">Checking session…</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    const dbConfigured = dbStatus !== "not_connected";
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7F5] py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-md w-full space-y-8 bg-white border border-[#F2E4E2] p-8 md:p-10 rounded-3xl shadow-lg">
          <div className="text-center">
            <span className="text-3xl font-extrabold tracking-tight text-[#101828]">
              B2b<span className="text-[#FF2D2D]">fiy</span> Admin
            </span>
            <h2 className="mt-4 text-xl font-bold text-[#101828] font-display">
              Access Administrative Console
            </h2>
            <p className="mt-1 text-xs text-[#475467]">
              Sign in with your admin account.
            </p>
          </div>

          {!dbConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No database connected yet. Set DATABASE_URL, ADMIN_JWT_SECRET, ADMIN_EMAIL, and ADMIN_PASSWORD as server environment variables, run the Neon schema, then sign in once to create your admin account.</span>
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleLoginSubmit}>
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-[#101828] uppercase tracking-wider block">Admin Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@b2bfiy.com"
                  className="w-full px-3.5 py-2.5 border border-[#F2E4E2] rounded-xl text-xs bg-[#FFF7F5] text-[#101828] font-semibold outline-none focus:border-[#FF2D2D] transition-colors"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-[#101828] uppercase tracking-wider block">Password</label>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 border border-[#F2E4E2] rounded-xl text-xs bg-[#FFF7F5] text-[#101828] outline-none focus:border-[#FF2D2D] transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-xs font-bold rounded-xl text-white bg-[#FF2D2D] hover:bg-[#FF5757] disabled:bg-[#FF9C9C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF2D2D] transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                {isLoggingIn ? "Signing In…" : "Sign In to Console"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF7F5] min-h-screen py-10 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Title row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#F2E4E2] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#101828] font-display">Administrative Console</h1>
            <p className="text-xs text-[#475467] mt-1">Manage leads, update packages, publish case studies, and rewrite copy dynamically.</p>
          </div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <span className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-md text-xs font-bold font-mono">
              Database: Online
            </span>
            <span className="px-3 py-1 bg-[#FFE8E5] border border-[#FF2D2D]/30 text-[#FF2D2D] rounded-md text-xs font-bold font-mono">
              Role: System Administrator
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 rounded-md text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Action feedback banners */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-2">
            <Check className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-800 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dashboard Grid Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Side navigation rail bar */}
          <div className="lg:col-span-3 bg-white border border-[#F2E4E2] p-4 rounded-3xl space-y-2">
            {[
              { id: "leads", label: "Lead Submissions", icon: <Users className="w-4 h-4" />, count: leads.length },
              { id: "portfolios", label: "Portfolio CRUD", icon: <Briefcase className="w-4 h-4" />, count: portfolios.length },
              { id: "packages", label: "Package Manager", icon: <DollarSign className="w-4 h-4" />, count: packages.length },
              { id: "faqs", label: "FAQ Manager", icon: <HelpCircle className="w-4 h-4" /> },
              { id: "content", label: "Website Content", icon: <Settings className="w-4 h-4" /> },
              { id: "media", label: "Media Library", icon: <ImageIcon className="w-4 h-4" />, count: mediaItems.length },
              { id: "ai", label: "AI FAQ & Support", icon: <Bot className="w-4 h-4" /> },
              { id: "security", label: "Security Credentials", icon: <Lock className="w-4 h-4" /> },
              { id: "database", label: "Neon Database", icon: <Database className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as AdminTab);
                  setErrorMsg("");
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#FF2D2D] text-white shadow-xs"
                    : "text-[#475467] hover:bg-[#FFF7F5] hover:text-[#FF2D2D]"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id ? "bg-white text-[#FF2D2D]" : "bg-[#FFF7F5] text-[#475467] border border-[#F2E4E2]"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Main content deck panel */}
          <div className="lg:col-span-9 bg-white border border-[#F2E4E2] p-6 md:p-8 rounded-3xl shadow-xs">
            
            {/* SUB-PANEL 1: LEADS MANAGER */}
            {activeTab === "leads" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F2E4E2] pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#101828]">Lead Submissions</h2>
                    <p className="text-xs text-[#475467]">Review client inquiries and free digital audit requests from the live database.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {onRefreshLeads && (
                      <button
                        onClick={handleRefreshLeads}
                        disabled={isRefreshingLeads}
                        className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-[#F2E4E2] bg-white text-[#101828] hover:bg-[#FFF7F5] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Fetch latest leads from Neon PostgreSQL"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingLeads ? "animate-spin text-[#FF2D2D]" : "text-[#475467]"}`} />
                        <span>{isRefreshingLeads ? "Syncing..." : "Refresh Leads"}</span>
                      </button>
                    )}
                    {["All", "contact", "free-audit"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setLeadFilter(t)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border cursor-pointer ${
                          leadFilter === t
                            ? "bg-[#FFE8E5] border-[#FF2D2D] text-[#FF2D2D]"
                            : "bg-[#FFF7F5] border-[#F2E4E2] text-[#475467]"
                        }`}
                      >
                        {t === "All" ? "All Leads" : t === "contact" ? "Contact Tickets" : "Free Audits"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar for Leads */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475467]" />
                  <input
                    type="text"
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Search leads by name, company, email, WhatsApp, or message content..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFF7F5] border border-[#F2E4E2] rounded-xl text-xs text-[#101828] placeholder-gray-400 outline-none focus:border-[#FF2D2D]"
                  />
                </div>

                {filteredLeads.length === 0 ? (
                  <p className="text-gray-400 text-xs italic py-12 text-center bg-[#FFF7F5] rounded-2xl border border-dashed border-[#F2E4E2]">
                    No matching leads located in the dynamic registry.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {filteredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className={`p-6 border rounded-2xl bg-white space-y-4 shadow-xs hover:border-[#FF2D2D]/30 transition-all ${
                          lead.status === "New" ? "border-l-4 border-l-[#FF2D2D]" : "border-[#F2E4E2]"
                        }`}
                      >
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="text-sm font-extrabold text-[#101828]">{lead.fullName || "Anonymous Lead"}</span>
                              {lead.businessName && (
                                <span className="text-xs font-semibold text-[#475467]">({lead.businessName})</span>
                              )}
                              {lead.serviceNeeded && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFE8E5] text-[#FF2D2D] border border-[#FF2D2D]/20">
                                  {lead.serviceNeeded}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-[#475467]">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase font-mono text-[10px] font-bold">
                                {lead.type === "contact" ? "Contact Ticket" : "Free Audit"}
                              </span>
                              {lead.email && (
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="hover:text-[#FF2D2D] underline flex items-center gap-1"
                                >
                                  ✉️ {lead.email}
                                </a>
                              )}
                              {lead.whatsappNumber && (
                                <a
                                  href={`https://wa.me/${lead.whatsappNumber.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-1"
                                >
                                  💬 {lead.whatsappNumber}
                                </a>
                              )}
                              {lead.websiteUrl && (
                                <a
                                  href={lead.websiteUrl.startsWith("http") ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#FF2D2D] underline flex items-center gap-1"
                                >
                                  🌐 {lead.websiteUrl}
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-right sm:text-right">
                            <span className="text-[10px] text-[#475467] font-mono block">
                              {(() => {
                                try {
                                  return new Date(lead.submittedAt).toLocaleString();
                                } catch {
                                  return lead.submittedAt || "Recent";
                                }
                              })()}
                            </span>
                            
                            {/* Status Change selectors */}
                            <select
                              value={lead.status || "New"}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead["status"])}
                              className="text-[10px] font-bold border border-[#F2E4E2] bg-white rounded p-1"
                            >
                              <option>New</option>
                              <option>In Progress</option>
                              <option>Contacted</option>
                              <option>Completed</option>
                              <option>Spam</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-[#FFF7F5] border border-[#F2E4E2] p-4 rounded-xl">
                          <span className="text-[10px] font-bold text-[#101828] block mb-1">Message Detail / Requirements:</span>
                          <p className="text-xs text-[#475467] whitespace-pre-wrap">{lead.message}</p>
                        </div>

                        {/* Note update block */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add administrative notes here..."
                            defaultValue={lead.notes || ""}
                            onBlur={(e) => handleNotesSave(lead.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-[#F2E4E2] rounded-lg text-xs outline-none bg-[#FFF7F5]"
                          />
                          <button
                            onClick={() => onDeleteLead(lead.id)}
                            className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-PANEL 2: PORTFOLIO CRUD */}
            {activeTab === "portfolios" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-[#F2E4E2] pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#101828]">Portfolio CRUD Manager</h2>
                    <p className="text-xs text-[#475467]">Manage your public works, draft options, and featured status badges.</p>
                  </div>
                  {!isAddingProject && !editingProject && (
                    <button
                      onClick={() => setIsAddingProject(true)}
                      className="flex items-center space-x-1 px-4 py-2 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Project</span>
                    </button>
                  )}
                </div>

                {/* ADD NEW PROJECT FORM */}
                {isAddingProject && (
                  <form onSubmit={handleSaveNewProject} className="bg-[#FFF7F5] border border-[#F2E4E2] p-6 rounded-2xl space-y-6 text-left">
                    <h3 className="text-sm font-bold text-[#101828] uppercase">New Case Study Specifications</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Project Title *</label>
                        <input
                          type="text"
                          required
                          value={newProject.title}
                          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                          placeholder="e.g. Sample Client Project"
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Client Name *</label>
                        <input
                          type="text"
                          required
                          value={newProject.clientName}
                          onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                          placeholder="e.g. Sample Client Ltd."
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">URL Slug (Leave blank for auto-generate)</label>
                        <input
                          type="text"
                          value={newProject.slug}
                          onChange={(e) => setNewProject({ ...newProject, slug: e.target.value })}
                          placeholder="e.g. sample-ecommerce-platform"
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Category</label>
                        <select
                          value={newProject.category}
                          onChange={(e) => {
                            const cat = e.target.value as PortfolioProject["category"];
                            setNewProject({ 
                              ...newProject, 
                              category: cat,
                              subCategory: cat === "Video Editing" ? "Motion Video" : undefined 
                            });
                          }}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        >
                          <option>Website Development</option>
                          <option>Graphic Design</option>
                          <option>Video Editing</option>
                          <option>Social Media Management</option>
                        </select>
                      </div>

                      {newProject.category === "Video Editing" && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#101828] uppercase">Video Sub-Category</label>
                          <select
                            value={newProject.subCategory || "Motion Video"}
                            onChange={(e) => setNewProject({ ...newProject, subCategory: e.target.value })}
                            className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                          >
                            <option value="Motion Video">Motion Video</option>
                            <option value="Reels">Reels</option>
                            <option value="Long Video">Long Video</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Thumbnail / Featured Image URL *</label>
                        <input
                          type="url"
                          value={newProject.thumbnail}
                          onChange={(e) => setNewProject({ ...newProject, thumbnail: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828] mb-1"
                        />
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const base64Url = await compressImage(file, 720, 720, 0.65);
                                  setNewProject({ ...newProject, thumbnail: base64Url });
                                  triggerSuccess("Project thumbnail uploaded & optimized!");
                                } catch (err) {
                                  setErrorMsg("Failed to upload and optimize thumbnail.");
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button
                              type="button"
                              className="w-full py-1 px-2 border border-dashed border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-gray-700 text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3 h-3 text-[#FF2D2D]" />
                              Upload
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPickingFor("new-project-thumbnail")}
                            className="py-1 px-2 border border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-[#FF2D2D] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Library className="w-3 h-3" />
                            Library
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Image Aspect Ratio</label>
                        <select
                          value={newProject.imageAspectRatio || "video"}
                          onChange={(e) => setNewProject({ ...newProject, imageAspectRatio: e.target.value as any })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        >
                          <option value="video">Widescreen 16:9 (Default)</option>
                          <option value="square">Square 1:1</option>
                          <option value="four-three">Standard 4:3</option>
                          <option value="auto">Auto (Full Height / Uncropped)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Image Fit</label>
                        <select
                          value={newProject.imageFit || "cover"}
                          onChange={(e) => setNewProject({ ...newProject, imageFit: e.target.value as any })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        >
                          <option value="cover">Cover (Fill Crop)</option>
                          <option value="contain">Contain (Fit Whole Image)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#101828] uppercase">Short Description *</label>
                      <input
                        type="text"
                        required
                        value={newProject.shortDescription}
                        onChange={(e) => setNewProject({ ...newProject, shortDescription: e.target.value })}
                        placeholder="A modern, highly optimized headless e-commerce experience."
                        className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">The Challenge</label>
                        <textarea
                          rows={3}
                          value={newProject.clientChallenge}
                          onChange={(e) => setNewProject({ ...newProject, clientChallenge: e.target.value })}
                          placeholder="What bottleneck was the client facing?"
                          className="w-full p-3 border border-[#F2E4E2] rounded-xl text-xs bg-white resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Our Solution</label>
                        <textarea
                          rows={3}
                          value={newProject.ourSolution}
                          onChange={(e) => setNewProject({ ...newProject, ourSolution: e.target.value })}
                          placeholder="How did B2bfiy help solve the bottleneck?"
                          className="w-full p-3 border border-[#F2E4E2] rounded-xl text-xs bg-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Project Date</label>
                        <input
                          type="date"
                          value={newProject.projectDate}
                          onChange={(e) => setNewProject({ ...newProject, projectDate: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Measurable Result</label>
                        <input
                          type="text"
                          value={newProject.projectResult}
                          onChange={(e) => setNewProject({ ...newProject, projectResult: e.target.value })}
                          placeholder="e.g. Page loads decreased from 5s to 1s."
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Embed Video URL</label>
                        <input
                          type="url"
                          value={newProject.videoEmbed}
                          onChange={(e) => setNewProject({ ...newProject, videoEmbed: e.target.value })}
                          placeholder="YouTube Embed URL"
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Live Website URL</label>
                        <input
                          type="url"
                          value={newProject.liveUrl}
                          onChange={(e) => setNewProject({ ...newProject, liveUrl: e.target.value })}
                          placeholder="External live website link"
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div className="flex space-x-4 pt-6">
                        <label className="flex items-center space-x-2 text-xs font-bold text-[#101828]">
                          <input
                            type="checkbox"
                            checked={newProject.featured}
                            onChange={(e) => setNewProject({ ...newProject, featured: e.target.checked })}
                          />
                          <span>Featured?</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs font-bold text-[#101828]">
                          <input
                            type="checkbox"
                            checked={newProject.published}
                            onChange={(e) => setNewProject({ ...newProject, published: e.target.checked })}
                          />
                          <span>Published?</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t border-[#F2E4E2]">
                      <button
                        type="button"
                        onClick={() => setIsAddingProject(false)}
                        className="px-4 py-2 border border-[#F2E4E2] rounded-xl text-xs font-bold hover:bg-white text-[#475467]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                      >
                        Publish Case Study
                      </button>
                    </div>
                  </form>
                )}

                {/* EDITING PROJECT FORM */}
                {editingProject && (
                  <form onSubmit={handleUpdateProject} className="bg-[#FFF7F5] border border-[#F2E4E2] p-6 rounded-2xl space-y-6 text-left">
                    <h3 className="text-sm font-bold text-[#101828] uppercase">Edit: {editingProject.title}</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Project Title</label>
                        <input
                          type="text"
                          required
                          value={editingProject.title}
                          onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Client Name</label>
                        <input
                          type="text"
                          required
                          value={editingProject.clientName}
                          onChange={(e) => setEditingProject({ ...editingProject, clientName: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Category</label>
                        <select
                          value={editingProject.category}
                          onChange={(e) => {
                            const cat = e.target.value as PortfolioProject["category"];
                            setEditingProject({ 
                              ...editingProject, 
                              category: cat,
                              subCategory: cat === "Video Editing" ? (editingProject.subCategory || "Motion Video") : undefined
                            });
                          }}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        >
                          <option>Website Development</option>
                          <option>Graphic Design</option>
                          <option>Video Editing</option>
                          <option>Social Media Management</option>
                        </select>
                      </div>

                      {editingProject.category === "Video Editing" && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#101828] uppercase">Video Sub-Category</label>
                          <select
                            value={editingProject.subCategory || "Motion Video"}
                            onChange={(e) => setEditingProject({ ...editingProject, subCategory: e.target.value })}
                            className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                          >
                            <option value="Motion Video">Motion Video</option>
                            <option value="Reels">Reels</option>
                            <option value="Long Video">Long Video</option>
                          </select>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">URL Slug</label>
                        <input
                          type="text"
                          required
                          value={editingProject.slug || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1 sm:col-span-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Thumbnail / Featured Image URL</label>
                        <input
                          type="url"
                          required
                          value={editingProject.thumbnail || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, thumbnail: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828] mb-1"
                        />
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const base64Url = await compressImage(file, 720, 720, 0.65);
                                  setEditingProject({ ...editingProject, thumbnail: base64Url });
                                  triggerSuccess("Project thumbnail uploaded & optimized!");
                                } catch (err) {
                                  setErrorMsg("Failed to upload and optimize thumbnail.");
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button
                              type="button"
                              className="w-full py-1 px-2 border border-dashed border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-gray-700 text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3 h-3 text-[#FF2D2D]" />
                              Upload
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPickingFor("edit-project-thumbnail")}
                            className="py-1 px-2 border border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-[#FF2D2D] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Library className="w-3 h-3" />
                            Library
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Image Aspect Ratio</label>
                        <select
                          value={editingProject.imageAspectRatio || "video"}
                          onChange={(e) => setEditingProject({ ...editingProject, imageAspectRatio: e.target.value as any })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        >
                          <option value="video">Widescreen 16:9 (Default)</option>
                          <option value="square">Square 1:1</option>
                          <option value="four-three">Standard 4:3</option>
                          <option value="auto">Auto (Full Height / Uncropped)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Image Fit</label>
                        <select
                          value={editingProject.imageFit || "cover"}
                          onChange={(e) => setEditingProject({ ...editingProject, imageFit: e.target.value as any })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        >
                          <option value="cover">Cover (Fill Crop)</option>
                          <option value="contain">Contain (Fit Whole Image)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Project Date</label>
                        <input
                          type="date"
                          value={editingProject.projectDate || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, projectDate: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Measurable Result</label>
                        <input
                          type="text"
                          value={editingProject.projectResult || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, projectResult: e.target.value })}
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Embed Video URL</label>
                        <input
                          type="url"
                          value={editingProject.videoEmbed || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, videoEmbed: e.target.value })}
                          placeholder="YouTube Embed URL"
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Live Website URL</label>
                        <input
                          type="url"
                          value={editingProject.liveUrl || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, liveUrl: e.target.value })}
                          placeholder="External live website link"
                          className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#101828] uppercase">Short Description</label>
                      <input
                        type="text"
                        required
                        value={editingProject.shortDescription}
                        onChange={(e) => setEditingProject({ ...editingProject, shortDescription: e.target.value })}
                        className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white text-[#101828]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">The Challenge</label>
                        <textarea
                          rows={3}
                          value={editingProject.clientChallenge}
                          onChange={(e) => setEditingProject({ ...editingProject, clientChallenge: e.target.value })}
                          className="w-full p-3 border border-[#F2E4E2] rounded-xl text-xs bg-white resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Our Solution</label>
                        <textarea
                          rows={3}
                          value={editingProject.ourSolution}
                          onChange={(e) => setEditingProject({ ...editingProject, ourSolution: e.target.value })}
                          className="w-full p-3 border border-[#F2E4E2] rounded-xl text-xs bg-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 text-xs font-bold text-[#101828]">
                        <input
                          type="checkbox"
                          checked={editingProject.featured}
                          onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                        />
                        <span>Featured?</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-bold text-[#101828]">
                        <input
                          type="checkbox"
                          checked={editingProject.published}
                          onChange={(e) => setEditingProject({ ...editingProject, published: e.target.checked })}
                        />
                        <span>Published?</span>
                      </label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t border-[#F2E4E2]">
                      <button
                        type="button"
                        onClick={() => setEditingProject(null)}
                        className="px-4 py-2 border border-[#F2E4E2] rounded-xl text-xs font-bold hover:bg-white text-[#475467]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}

                {/* CURRENT PROJECTS GRID */}
                {!isAddingProject && !editingProject && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {portfolios.map((p) => (
                      <div key={p.id} className="border border-[#F2E4E2] p-4 rounded-xl flex items-center justify-between space-x-4 bg-[#FFF7F5]">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt="" className="w-12 h-12 rounded object-cover border border-[#F2E4E2] shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-200 border border-[#F2E4E2] shrink-0 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                              No Img
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <span className="text-xs font-extrabold text-[#101828] block truncate">{p.title}</span>
                            <span className="text-[10px] text-[#475467] block font-mono">/{p.slug}</span>
                          </div>
                        </div>
                        <div className="flex space-x-1.5 shrink-0">
                          <button
                            onClick={() => setEditingProject(p)}
                            className="p-1.5 border border-[#F2E4E2] bg-white text-gray-700 hover:text-[#FF2D2D] rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-1.5 border border-red-200 bg-white text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-PANEL 3: PACKAGE MANAGER */}
            {activeTab === "packages" && (
              <div className="space-y-6">
                <div className="border-b border-[#F2E4E2] pb-4 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-[#101828]">Package Pricing & Tiers</h2>
                    <p className="text-xs text-[#475467]">Manage price configurations, popular highlights, and active parameters.</p>
                  </div>
                  {!isAddingPackage && (
                    <button
                      onClick={() => setIsAddingPackage(true)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Package</span>
                    </button>
                  )}
                </div>

                {/* ADD NEW PACKAGE FORM */}
                {isAddingPackage && (
                  <form onSubmit={handleSaveNewPackage} className="p-6 border border-[#FFD2CC] rounded-3xl bg-white space-y-4 shadow-sm text-left">
                    <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Create New Service Package</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Package Title</label>
                        <input
                          type="text"
                          required
                          value={newPackage.title || ""}
                          onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })}
                          placeholder="Starter Package"
                          className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Pricing Value</label>
                        <input
                          type="text"
                          required
                          value={newPackage.price || ""}
                          onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                          placeholder="৳15,000"
                          className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Billing Period</label>
                        <input
                          type="text"
                          value={newPackage.period || "Month"}
                          onChange={(e) => setNewPackage({ ...newPackage, period: e.target.value })}
                          placeholder="Month / Project"
                          className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Package Category</label>
                        <select
                          value={newPackage.type || "monthly"}
                          onChange={(e) => setNewPackage({ ...newPackage, type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white"
                        >
                          <option value="monthly">Monthly Retainer</option>
                          <option value="website">Website Development</option>
                          <option value="graphic">Graphic Design</option>
                          <option value="video">Video Editing</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Est. Delivery Time</label>
                        <input
                          type="text"
                          value={newPackage.deliveryTime || ""}
                          onChange={(e) => setNewPackage({ ...newPackage, deliveryTime: e.target.value })}
                          placeholder="7–10 business days"
                          className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">CTA Button Text</label>
                        <input
                          type="text"
                          value={newPackage.ctaText || "Get started"}
                          onChange={(e) => setNewPackage({ ...newPackage, ctaText: e.target.value })}
                          placeholder="Get started / Order now"
                          className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Features block builder */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#101828] uppercase block">Package Features List</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPackageFeature}
                          onChange={(e) => setNewPackageFeature(e.target.value)}
                          placeholder="Type feature bullet (e.g. 5 Dynamic Pages)"
                          className="flex-1 px-3 py-1.5 border border-[#F2E4E2] rounded-lg text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newPackageFeature.trim()) return;
                            const currentFeatures = newPackage.features || [];
                            setNewPackage({
                              ...newPackage,
                              features: [...currentFeatures, newPackageFeature.trim()]
                            });
                            setNewPackageFeature("");
                          }}
                          className="px-4 py-1.5 bg-[#101828] hover:bg-gray-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Add Bullet
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {(newPackage.features || []).map((feat, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF7F5] border border-[#F2E4E2] text-xs font-medium text-gray-700">
                            <span>{feat}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentFeatures = (newPackage.features || []).filter((_, i) => i !== idx);
                                setNewPackage({ ...newPackage, features: currentFeatures });
                              }}
                              className="text-red-500 hover:text-red-700 font-extrabold text-[10px]"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 text-xs font-bold text-[#101828]">
                        <input
                          type="checkbox"
                          checked={!!newPackage.isPopular}
                          onChange={(e) => setNewPackage({ ...newPackage, isPopular: e.target.checked })}
                        />
                        <span>Popular Flag?</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-bold text-[#101828]">
                        <input
                          type="checkbox"
                          checked={!!newPackage.published}
                          onChange={(e) => setNewPackage({ ...newPackage, published: e.target.checked })}
                        />
                        <span>Published?</span>
                      </label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t border-[#F2E4E2]">
                      <button
                        type="button"
                        onClick={() => setIsAddingPackage(false)}
                        className="px-4 py-2 border border-[#F2E4E2] rounded-xl text-xs font-bold hover:bg-[#FFF7F5] text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Create Package
                      </button>
                    </div>
                  </form>
                )}

                {/* CURRENT PACKAGES LIST */}
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="p-5 border border-[#F2E4E2] rounded-2xl bg-[#FFF7F5] space-y-4">
                      
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="text-left space-y-1">
                          <input
                            type="text"
                            value={pkg.title}
                            onChange={(e) => handlePackageValueChange(pkg.id, "title", e.target.value)}
                            className="text-xs font-bold text-[#101828] bg-transparent outline-none focus:border-[#FF2D2D] border-b border-transparent font-display w-44"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase font-mono">Category:</span>
                            <select
                              value={pkg.type}
                              onChange={(e) => handlePackageValueChange(pkg.id, "type", e.target.value)}
                              className="text-[10px] font-mono text-[#475467] bg-white border border-[#F2E4E2] rounded px-1"
                            >
                              <option value="monthly">monthly</option>
                              <option value="website">website</option>
                              <option value="graphic">graphic</option>
                              <option value="video">video</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#475467] block">Pricing *</span>
                            <input
                              type="text"
                              value={pkg.price}
                              onChange={(e) => handlePackageValueChange(pkg.id, "price", e.target.value)}
                              className="px-2.5 py-1.5 border border-[#F2E4E2] bg-white rounded-lg text-xs font-bold text-[#101828] w-28"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#475467] block">Billing Period</span>
                            <input
                              type="text"
                              value={pkg.period || "Month"}
                              onChange={(e) => handlePackageValueChange(pkg.id, "period", e.target.value)}
                              className="px-2.5 py-1.5 border border-[#F2E4E2] bg-white rounded-lg text-xs font-bold text-[#101828] w-20"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#475467] block font-mono">Est Delivery</span>
                            <input
                              type="text"
                              value={pkg.deliveryTime || ""}
                              onChange={(e) => handlePackageValueChange(pkg.id, "deliveryTime", e.target.value)}
                              className="px-2.5 py-1.5 border border-[#F2E4E2] bg-white rounded-lg text-xs w-36 text-center text-[#101828]"
                            />
                          </div>

                          <div className="flex items-center space-x-3 pt-4">
                            <label className="flex items-center space-x-1 text-xs text-[#101828]">
                              <input
                                type="checkbox"
                                checked={!!pkg.isPopular}
                                onChange={(e) => handlePackageValueChange(pkg.id, "isPopular", e.target.checked)}
                              />
                              <span>Popular?</span>
                            </label>
                            <label className="flex items-center space-x-1 text-xs text-[#101828]">
                              <input
                                type="checkbox"
                                checked={!!pkg.published}
                                onChange={(e) => handlePackageValueChange(pkg.id, "published", e.target.checked)}
                              />
                              <span>Published?</span>
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="p-1.5 border border-red-200 bg-white text-red-600 hover:bg-red-50 rounded-lg shrink-0 cursor-pointer self-end"
                            title="Delete Package Tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Package Features Bullets Editor */}
                      <div className="pt-2 border-t border-[#F2E4E2]/60 space-y-2 text-left">
                        <span className="text-[10px] font-bold text-[#101828] uppercase block">Edit Bullets:</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pkg.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-[#F2E4E2] rounded-lg px-2 py-1">
                              <input
                                type="text"
                                value={feat}
                                onChange={(e) => {
                                  const nextFeatures = [...pkg.features];
                                  nextFeatures[idx] = e.target.value;
                                  handlePackageValueChange(pkg.id, "features", nextFeatures);
                                }}
                                className="flex-1 text-[11px] font-medium text-[#475467] bg-transparent outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nextFeatures = pkg.features.filter((_, i) => i !== idx);
                                  handlePackageValueChange(pkg.id, "features", nextFeatures);
                                }}
                                className="text-red-500 hover:text-red-700 font-bold text-xs px-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add bullet directly to active package */}
                        <div className="flex gap-2 max-w-md">
                          <input
                            type="text"
                            placeholder="Add feature bullet..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const target = e.target as HTMLInputElement;
                                if (!target.value.trim()) return;
                                const nextFeatures = [...pkg.features, target.value.trim()];
                                handlePackageValueChange(pkg.id, "features", nextFeatures);
                                target.value = "";
                              }
                            }}
                            className="flex-1 px-3 py-1 border border-[#F2E4E2] bg-white rounded-lg text-xs"
                          />
                          <span className="text-[10px] text-gray-400 self-center font-mono">Press Enter to add</span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-PANEL 4: CONTENT MANAGER */}
            {activeTab === "content" && (
              <div className="space-y-8">
                <div className="border-b border-[#F2E4E2] pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-[#101828]">Complete Website Content Management</h2>
                    <p className="text-xs text-[#475467]">Manage global brand parameters, direct handles, and landing stats.</p>
                  </div>
                  <button
                    onClick={handleSaveContent}
                    className="flex items-center space-x-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save All Copy</span>
                  </button>
                </div>

                {/* Section A: Contact Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Contact Details & Socials</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Website Client / Brand Name</span>
                      <input
                        type="text"
                        value={editedContent.brandName || ""}
                        onChange={(e) => setEditedContent({ ...editedContent, brandName: e.target.value })}
                        placeholder="B2bfiy"
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Phone Number</span>
                      <input
                        type="text"
                        value={editedContent.phone}
                        onChange={(e) => setEditedContent({ ...editedContent, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Email Address</span>
                      <input
                        type="email"
                        value={editedContent.email}
                        onChange={(e) => setEditedContent({ ...editedContent, email: e.target.value })}
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">WhatsApp Chat URL</span>
                      <input
                        type="text"
                        value={editedContent.socials.whatsapp}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          socials: { ...editedContent.socials, whatsapp: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Facebook Page Link</span>
                      <input
                        type="text"
                        value={editedContent.socials.facebook}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          socials: { ...editedContent.socials, facebook: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-[10px] font-bold text-[#FF2D2D] uppercase block">"View All Graphics Design" Button URL / Link</span>
                      <span className="text-[9px] text-[#475467] block">Specify the link (e.g. Behance portfolio, Facebook page album) where users go when they click "View All Graphics Design".</span>
                      <input
                        type="url"
                        value={editedContent.viewAllGraphicsLink || ""}
                        onChange={(e) => setEditedContent({ ...editedContent, viewAllGraphicsLink: e.target.value })}
                        placeholder="https://www.behance.net/your-brand"
                        className="w-full px-3 py-2 border border-[#F2E4E2] bg-[#FFF7F5] rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Brand Identity Logo & Favicon Settings */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Brand Logo & Favicon Settings</h3>
                  <p className="text-[11px] text-[#475467]">Customize the look and dynamic branding assets of your website. Provide secure image URLs, choose system files to upload, or link directly to items in your media asset library.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FFF7F5] border border-[#F2E4E2] p-5 rounded-2xl text-left">
                    {/* Website Logo Section */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-[#101828] uppercase block">Website Custom Logo</span>
                        <span className="text-[9px] text-[#475467] block">Appears in header and footer. Suggested size: 200x50px transparent PNG.</span>
                      </div>
                      
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={editedContent.logoUrl || ""}
                          onChange={(e) => setEditedContent({ ...editedContent, logoUrl: e.target.value })}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-3 py-2 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                        />
                        
                        <div className="flex gap-2">
                          {/* File input helper */}
                          <div className="relative flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const base64Url = await compressImage(file, 800, 800, 0.8);
                                  setEditedContent({ ...editedContent, logoUrl: base64Url });
                                  triggerSuccess("Custom logo image loaded & optimized!");
                                } catch (err) {
                                  setErrorMsg("Failed to read and optimize logo image.");
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button
                              type="button"
                              className="w-full py-1.5 px-3 border border-dashed border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-gray-700 text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3 h-3 text-[#FF2D2D]" />
                              Upload File
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPickingFor("logo")}
                            className="py-1.5 px-3 border border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-[#FF2D2D] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Library className="w-3 h-3" />
                            Pick from Library
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const bName = editedContent.brandName || "b2bfiy";
                              const slug = bName.toLowerCase().replace(/[^a-z0-9]+/g, "");
                              setEditedContent({ ...editedContent, logoUrl: `https://${slug}.com/logo.png` });
                              triggerSuccess("Suggested name-based URL set!");
                            }}
                            className="py-1.5 px-2 border border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[9px] font-medium text-gray-500 cursor-pointer"
                            title="Generate default URL based on website/brand name"
                          >
                            Suggest URL
                          </button>
                        </div>
                      </div>

                      {/* Logo Preview */}
                      <div className="p-3 border border-[#F2E4E2]/50 bg-white rounded-xl flex items-center justify-center h-20 relative group">
                        {editedContent.logoUrl ? (
                          <>
                            <img
                              src={editedContent.logoUrl}
                              alt="Logo Preview"
                              className="max-h-12 max-w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setEditedContent({ ...editedContent, logoUrl: "" })}
                              className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 cursor-pointer"
                              title="Clear logo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No custom logo (falls back to styled brand text)</span>
                        )}
                      </div>

                      {/* Logo Display Selection Option */}
                      <div className="pt-2 border-t border-[#F2E4E2]/50">
                        <span className="text-[10px] font-bold text-[#101828] uppercase block">Logo Display Mode</span>
                        <span className="text-[9px] text-[#475467] block mb-2">Select whether to display your uploaded logo image or stylized brand text in the website headers/footers.</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditedContent({ ...editedContent, logoType: "image" })}
                            className={`py-1.5 px-3 border text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              editedContent.logoType !== "text"
                                ? "bg-[#FF2D2D] text-white border-[#FF2D2D] shadow-xs"
                                : "bg-white text-gray-700 border-[#F2E4E2] hover:bg-gray-50"
                            }`}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Logo Image</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditedContent({ ...editedContent, logoType: "text" })}
                            className={`py-1.5 px-3 border text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              editedContent.logoType === "text"
                                ? "bg-[#FF2D2D] text-white border-[#FF2D2D] shadow-xs"
                                : "bg-white text-gray-700 border-[#F2E4E2] hover:bg-gray-50"
                            }`}
                          >
                            <Type className="w-3.5 h-3.5" />
                            <span>Logo Text</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Website Favicon Section */}
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-[#F2E4E2] pt-4 md:pt-0 md:pl-6">
                      <div>
                        <span className="text-[10px] font-bold text-[#101828] uppercase block">Website Custom Favicon</span>
                        <span className="text-[9px] text-[#475467] block">Appears on the browser tab title bar. Suggested format: .ico or 32x32px PNG.</span>
                      </div>
                      
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={editedContent.faviconUrl || ""}
                          onChange={(e) => setEditedContent({ ...editedContent, faviconUrl: e.target.value })}
                          placeholder="https://example.com/favicon.ico"
                          className="w-full px-3 py-2 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                        />
                        
                        <div className="flex gap-2">
                          {/* File input helper */}
                          <div className="relative flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const base64Url = await compressImage(file, 128, 128, 0.8);
                                  setEditedContent({ ...editedContent, faviconUrl: base64Url });
                                  triggerSuccess("Custom favicon image loaded & optimized!");
                                } catch (err) {
                                  setErrorMsg("Failed to read and optimize favicon image.");
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button
                              type="button"
                              className="w-full py-1.5 px-3 border border-dashed border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-gray-700 text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3 h-3 text-[#FF2D2D]" />
                              Upload File
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPickingFor("favicon")}
                            className="py-1.5 px-3 border border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-[#FF2D2D] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Library className="w-3 h-3" />
                            Pick from Library
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const bName = editedContent.brandName || "b2bfiy";
                              const slug = bName.toLowerCase().replace(/[^a-z0-9]+/g, "");
                              setEditedContent({ ...editedContent, faviconUrl: `https://${slug}.com/favicon.ico` });
                              triggerSuccess("Suggested name-based URL set!");
                            }}
                            className="py-1.5 px-2 border border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[9px] font-medium text-gray-500 cursor-pointer"
                            title="Generate default URL based on website/brand name"
                          >
                            Suggest URL
                          </button>
                        </div>
                      </div>

                      {/* Favicon Preview */}
                      <div className="p-3 border border-[#F2E4E2]/50 bg-white rounded-xl flex items-center justify-center h-20 relative group">
                        {editedContent.faviconUrl ? (
                          <>
                            <div className="flex items-center gap-2 border border-gray-100 px-3 py-1.5 rounded-md bg-gray-50 shadow-2xs">
                              <img
                                src={editedContent.faviconUrl}
                                alt="Favicon Preview"
                                className="h-6 w-6 object-contain"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[10px] font-bold text-[#101828] max-w-[100px] truncate">{editedContent.brandName || "B2bfiy"}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditedContent({ ...editedContent, faviconUrl: "" })}
                              className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 cursor-pointer"
                              title="Clear favicon"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No custom favicon (browser default applies)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced SEO, Meta Title, Description, Keywords, Pixel & Google Analytics Setup */}
                <div className="space-y-6 pt-6 border-t border-[#F2E4E2]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#FF2D2D]" />
                        <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider font-mono">
                          Default SEO Metadata & Search Visibility
                        </h3>
                      </div>
                      <p className="text-[11px] text-[#475467] mt-0.5">
                        Manage your site's default meta title, description, and keywords directly in the UI. These configure how Google, Bing, social media previews, and browser tabs display your brand.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const brand = editedContent.brandName || "B2bfiy";
                          setEditedContent({
                            ...editedContent,
                            metaTitle: `${brand} | Premier Digital Agency in Dhaka - Web Design, Branding & Video`,
                            metaDescription: `Scale your business with ${brand}. Dhaka's top creative agency specializing in high-converting web design, corporate branding, viral video editing, and social media retainers.`,
                            seoKeywords: "digital marketing agency Dhaka, best web design company in Bangladesh, professional video editing Dhaka, creative agency Bangladesh, corporate branding and logo design Dhaka, social media marketing agency Dhaka, UI UX design Bangladesh, short-form video editing Reels TikTok, high converting landing page development, B2B growth retainers Bangladesh"
                          });
                          triggerSuccess("🏆 Applied Top-10 Ranking Master Formula!");
                        }}
                        className="self-start sm:self-auto px-3.5 py-1.5 bg-[#FF2D2D] hover:bg-[#E02424] text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>🏆 Apply Top-10 Ranking Preset</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const brand = editedContent.brandName || "B2bfiy";
                          setEditedContent({
                            ...editedContent,
                            metaTitle: `${brand} - Top Digital Presence Agency | Web, Video & Social Media`,
                            metaDescription: `Get a modern, high-converting digital presence with ${brand}. We build custom business websites, cinematic video reels, graphics, and full-service social growth.`,
                            seoKeywords: "digital presence agency, business website development, social media growth retainers, video production agency, graphic design services, B2B marketing, conversion rate optimization"
                          });
                          triggerSuccess("🚀 Applied High-Converting B2B Retainers Formula!");
                        }}
                        className="self-start sm:self-auto px-3 py-1.5 border border-[#F2E4E2] bg-white hover:bg-[#FFF7F5] text-gray-700 hover:text-[#FF2D2D] rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                      >
                        <span>🚀 B2B Retainers Preset</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Search Engine & Social SERP Preview Component */}
                  <SEOPreview
                    metaTitle={editedContent.metaTitle || ""}
                    metaDescription={editedContent.metaDescription || ""}
                    brandName={editedContent.brandName || "B2bfiy"}
                    faviconUrl={editedContent.faviconUrl}
                    seoKeywords={editedContent.seoKeywords || ""}
                    baseUrl="https://b2bfiy.com"
                    ogImage={editedContent.logoUrl}
                  />

                  {/* 30-Day Server-Side Page Views & Traffic Chart (Recharts) */}
                  <AnalyticsPageViewsChart />

                  {/* SEO Form Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-[#F2E4E2] p-5 rounded-2xl text-left">
                    {/* 1. Default Meta Title */}
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[#101828] uppercase flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-[#FF2D2D]" />
                          <span>Site Default Meta Title</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {((editedContent.metaTitle || "").length >= 40 && (editedContent.metaTitle || "").length <= 60) ? (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Optimal Length
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                              Recommended: 50-60 chars
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold text-gray-500">
                            {(editedContent.metaTitle || "").length}/60
                          </span>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={editedContent.metaTitle || ""}
                        onChange={(e) => setEditedContent({ ...editedContent, metaTitle: e.target.value })}
                        placeholder="e.g. B2bfiy - Digital Agency & Creative Solutions"
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-[#FFF7F5] focus:bg-white focus:outline-hidden font-medium transition-colors"
                      />

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Top 10 Title Templates:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const brand = editedContent.brandName || "B2bfiy";
                            setEditedContent({ ...editedContent, metaTitle: `${brand} | Premier Digital Agency in Dhaka - Web Design, Branding & Video` });
                            triggerSuccess("Applied Local SEO + Agency title formula.");
                          }}
                          className="px-2 py-0.5 text-[9px] font-medium bg-[#FFF7F5] hover:bg-[#FFEBE7] text-[#FF2D2D] rounded border border-[#F2E4E2] transition-colors cursor-pointer"
                        >
                          + {editedContent.brandName || "B2bfiy"} | Premier Digital Agency in Dhaka - Web Design, Branding &amp; Video
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const brand = editedContent.brandName || "B2bfiy";
                            setEditedContent({ ...editedContent, metaTitle: `${brand} - Top Digital Agency | High-Converting Websites & Video Production` });
                            triggerSuccess("Applied High-Converting Agency title formula.");
                          }}
                          className="px-2 py-0.5 text-[9px] font-medium bg-gray-100 hover:bg-[#FFF7F5] hover:text-[#FF2D2D] rounded border border-gray-200 transition-colors cursor-pointer"
                        >
                          + {editedContent.brandName || "B2bfiy"} - Top Digital Agency | High-Converting Websites &amp; Video Production
                        </button>
                      </div>
                    </div>

                    {/* 2. Default Meta Description */}
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[#101828] uppercase flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-[#FF2D2D]" />
                          <span>Site Default Meta Description</span>
                        </label>
                        <div className="flex items-center gap-2">
                          {((editedContent.metaDescription || "").length >= 140 && (editedContent.metaDescription || "").length <= 160) ? (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Optimal Length
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                              Recommended: 150-160 chars
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold text-gray-500">
                            {(editedContent.metaDescription || "").length}/160
                          </span>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={editedContent.metaDescription || ""}
                        onChange={(e) => setEditedContent({ ...editedContent, metaDescription: e.target.value })}
                        placeholder="B2bfiy is a complete digital presence agency in Dhaka helping businesses grow through high-converting websites, premium graphics, and engaging reels..."
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-[#FFF7F5] focus:bg-white focus:outline-hidden transition-colors leading-relaxed"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Top 10 Description Templates:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const brand = editedContent.brandName || "B2bfiy";
                            setEditedContent({
                              ...editedContent,
                              metaDescription: `Scale your business with ${brand}. Dhaka's top creative agency specializing in high-converting web design, premium branding, viral video editing, and marketing.`
                            });
                            triggerSuccess("Applied High-CTR Master Description.");
                          }}
                          className="px-2 py-0.5 text-[9px] font-medium bg-[#FFF7F5] hover:bg-[#FFEBE7] text-[#FF2D2D] rounded border border-[#F2E4E2] transition-colors cursor-pointer"
                        >
                          + Local Authority &amp; Agency Formula (158 chars)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const brand = editedContent.brandName || "B2bfiy";
                            setEditedContent({
                              ...editedContent,
                              metaDescription: `Get a modern, high-converting digital presence with ${brand}. We build custom business websites, cinematic video reels, graphics, and full-service social growth.`
                            });
                            triggerSuccess("Applied B2B Growth Description.");
                          }}
                          className="px-2 py-0.5 text-[9px] font-medium bg-gray-100 hover:bg-[#FFF7F5] hover:text-[#FF2D2D] rounded border border-gray-200 transition-colors cursor-pointer"
                        >
                          + B2B Growth &amp; Retainers Formula (155 chars)
                        </button>
                      </div>
                    </div>

                    {/* 3. Default SEO Keywords */}
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[#101828] uppercase flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-[#FF2D2D]" />
                          <span>Site Default Meta Keywords (Comma Separated)</span>
                        </label>
                        <span className="text-[9px] text-gray-400 font-mono">
                          {((editedContent.seoKeywords || "").split(",").map(k => k.trim()).filter(Boolean)).length} keywords
                        </span>
                      </div>

                      <input
                        type="text"
                        value={editedContent.seoKeywords || ""}
                        onChange={(e) => setEditedContent({ ...editedContent, seoKeywords: e.target.value })}
                        placeholder="digital presence, website development, video editing, graphic design, Dhaka agency"
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-[#FFF7F5] focus:bg-white focus:outline-hidden font-medium transition-colors"
                      />

                      {/* Keyword tags chips display */}
                      {Boolean(editedContent.seoKeywords?.trim()) && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(editedContent.seoKeywords || "")
                            .split(",")
                            .map((k) => k.trim())
                            .filter(Boolean)
                            .map((keyword, kidx) => (
                              <span
                                key={kidx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFF7F5] border border-[#F2E4E2] text-[#101828] text-[10px] font-semibold rounded-md"
                              >
                                {keyword}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentKeywords = (editedContent.seoKeywords || "")
                                      .split(",")
                                      .map((k) => k.trim())
                                      .filter(Boolean);
                                    const nextKeywords = currentKeywords.filter((_, i) => i !== kidx);
                                    setEditedContent({ ...editedContent, seoKeywords: nextKeywords.join(", ") });
                                  }}
                                  className="text-gray-400 hover:text-red-600 transition-colors ml-0.5 cursor-pointer"
                                  title="Remove keyword"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                        </div>
                      )}

                      {/* Suggested Popular Keywords */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Add Keyword:</span>
                        {[
                          "digital marketing agency Dhaka",
                          "best web design company in Bangladesh",
                          "professional video editing Dhaka",
                          "creative agency Bangladesh",
                          "corporate branding and logo design Dhaka",
                          "social media marketing agency Dhaka",
                          "UI UX design Bangladesh",
                          "short-form video editing Reels TikTok",
                          "high converting landing page development",
                          "B2B growth retainers Bangladesh",
                          "e-commerce web development Dhaka"
                        ].map((sugg) => {
                          const currentArr = (editedContent.seoKeywords || "")
                            .split(",")
                            .map((k) => k.trim().toLowerCase())
                            .filter(Boolean);
                          const isAlreadyAdded = currentArr.includes(sugg.toLowerCase());

                          return (
                            <button
                              key={sugg}
                              type="button"
                              disabled={isAlreadyAdded}
                              onClick={() => {
                                const currentKeywords = (editedContent.seoKeywords || "")
                                  .split(",")
                                  .map((k) => k.trim())
                                  .filter(Boolean);
                                if (!currentKeywords.some(k => k.toLowerCase() === sugg.toLowerCase())) {
                                  const updated = [...currentKeywords, sugg].join(", ");
                                  setEditedContent({ ...editedContent, seoKeywords: updated });
                                  triggerSuccess(`Added "${sugg}" to keywords!`);
                                }
                              }}
                              className={`px-2 py-0.5 text-[9px] font-medium rounded border transition-colors cursor-pointer ${
                                isAlreadyAdded
                                  ? "bg-gray-50 text-gray-400 border-gray-200 cursor-default"
                                  : "bg-white hover:bg-[#FFF7F5] text-gray-700 hover:text-[#FF2D2D] border-[#F2E4E2]"
                              }`}
                            >
                              {isAlreadyAdded ? `✓ ${sugg}` : `+ ${sugg}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Google Site Verification ID */}
                    <div className="space-y-1 md:col-span-2 pt-2 border-t border-[#F2E4E2]/60">
                      <label className="text-[10px] font-bold text-[#101828] uppercase flex items-center gap-1.5">
                        <span>Google Search Console / Site Verification ID</span>
                      </label>
                      <input
                        type="text"
                        value={editedContent.googleSiteVerification || ""}
                        onChange={(e) => setEditedContent({ ...editedContent, googleSiteVerification: e.target.value })}
                        placeholder="e.g. google1234567890abcdef"
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-[#FFF7F5] focus:bg-white focus:outline-hidden font-mono transition-colors"
                      />
                      <p className="text-[9px] text-[#475467]">
                        Pastes directly into the HTML &lt;meta name="google-site-verification"&gt; tag to verify domain ownership on Google Search Console.
                      </p>
                    </div>

                    {/* Facebook / Meta Pixel ID & GA4 */}
                    <div className="space-y-3 md:col-span-2 font-mono pt-2 border-t border-[#F2E4E2]/60">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase flex items-center gap-1.5 font-sans">
                          <span>Facebook/Meta Pixel ID</span>
                          {editedContent.metaPixelId && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-100 text-emerald-800">
                              ● Tracking Active
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={editedContent.metaPixelId || ""}
                          onChange={(e) => setEditedContent({ ...editedContent, metaPixelId: e.target.value })}
                          placeholder="e.g. 123456789012345"
                          className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-[#FFF7F5] focus:bg-white focus:outline-hidden font-mono text-[#FF2D2D] font-bold"
                        />
                        <p className="text-[9px] text-[#475467] font-sans">Enter your Meta Pixel ID to automatically initialize tracking PageViews for retargeting.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase flex items-center gap-1.5 font-sans">
                          <span>GA4 Measurement ID</span>
                          {editedContent.ga4MeasurementId && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-100 text-emerald-800">
                              ● Tracking Active
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={editedContent.ga4MeasurementId || ""}
                          onChange={(e) => setEditedContent({ ...editedContent, ga4MeasurementId: e.target.value })}
                          placeholder="e.g. G-XXXXXXXXXX"
                          className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-[#FFF7F5] focus:bg-white focus:outline-hidden font-mono text-[#FF2D2D] font-bold"
                        />
                        <p className="text-[9px] text-[#475467] font-sans">
                          Server-side PageView/Lead events are sent automatically once the GA4_MEASUREMENT_ID and GA4_API_SECRET
                          environment variables are set in Vercel (Events Manager credentials, not this field, control the server-side send).
                          Link this GA4 property to Google Ads (Admin → Product Links) to import these as Google Ads conversions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B.5: Floating Contact Buttons (WhatsApp & Call) */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Floating Support Widgets (WhatsApp & Call)</h3>
                  <p className="text-[11px] text-[#475467]">Enable high-converting sticky chat and click-to-call floating buttons to receive instant customer leads directly on your phone.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FFF7F5] border border-[#F2E4E2] p-5 rounded-2xl text-left">
                    <div className="space-y-2 md:col-span-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editedContent.showFloatingButtons !== false}
                          onChange={(e) => setEditedContent({ ...editedContent, showFloatingButtons: e.target.checked })}
                          className="h-4 w-4 rounded-sm border-gray-300 text-[#FF2D2D] focus:ring-[#FF2D2D]"
                        />
                        <span className="text-xs font-bold text-[#101828]">Enable Floating Contact Buttons on Website</span>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#101828] uppercase flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>WhatsApp Number</span>
                      </label>
                      <input
                        type="text"
                        value={editedContent.floatingWhatsApp || ""}
                        onChange={(e) => setEditedContent({ ...editedContent, floatingWhatsApp: e.target.value })}
                        placeholder="e.g. +8801712345678"
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white focus:outline-hidden"
                      />
                      <p className="text-[9px] text-[#475467]">Enter your mobile number with country code. Non-digit characters will be filtered automatically for the chat link.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#101828] uppercase flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#FF2D2D]" />
                        <span>Call Support Number</span>
                      </label>
                      <input
                        type="text"
                        value={editedContent.floatingCall || ""}
                        onChange={(e) => setEditedContent({ ...editedContent, floatingCall: e.target.value })}
                        placeholder="e.g. +8801712345678"
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white focus:outline-hidden"
                      />
                      <p className="text-[9px] text-[#475467]">Enter the direct phone number customers should dial when tapping the Call button.</p>
                    </div>
                  </div>
                </div>

                {/* Section C: Hero Copy */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Hero Layout Copy</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Main Title Headline</span>
                      <input
                        type="text"
                        value={editedContent.hero.title}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          hero: { ...editedContent.hero, title: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Highlight Word (Colorized in Red)</span>
                      <input
                        type="text"
                        value={editedContent.hero.highlight}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          hero: { ...editedContent.hero, highlight: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Sub-description Narrative</span>
                      <textarea
                        rows={3}
                        value={editedContent.hero.description}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          hero: { ...editedContent.hero, description: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] rounded-xl text-xs resize-none"
                      />
                    </div>
                    
                    <div className="space-y-1 pt-2">
                      <span className="text-[10px] font-bold text-[#101828] uppercase block">Hero Banner Image</span>
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={editedContent.hero.imageUrl || ""}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            hero: { ...editedContent.hero, imageUrl: e.target.value }
                          })}
                          placeholder="https://images.unsplash.com/... or base64"
                          className="w-full px-3 py-2 border border-[#F2E4E2] bg-white rounded-xl text-xs font-semibold"
                        />
                        
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const base64Url = await compressImage(file, 1200, 1200, 0.75);
                                  setEditedContent({
                                    ...editedContent,
                                    hero: { ...editedContent.hero, imageUrl: base64Url }
                                  });
                                  triggerSuccess("Custom hero image loaded & optimized!");
                                } catch (err) {
                                  setErrorMsg("Failed to read and optimize hero image.");
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button
                              type="button"
                              className="w-full py-1.5 px-3 border border-dashed border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-gray-700 text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3 h-3 text-[#FF2D2D]" />
                              Upload File
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPickingFor("hero-image")}
                            className="py-1.5 px-3 border border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-[#FF2D2D] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Library className="w-3 h-3" />
                            Pick from Library
                          </button>
                        </div>
                      </div>

                      {/* Hero Image Preview */}
                      <div className="p-3 mt-1 border border-[#F2E4E2]/50 bg-white rounded-xl flex items-center justify-center h-28 relative group">
                        {editedContent.hero.imageUrl ? (
                          <>
                            <img
                              src={editedContent.hero.imageUrl}
                              alt="Hero Banner Preview"
                              className="max-h-24 max-w-full object-contain rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setEditedContent({
                                ...editedContent,
                                hero: { ...editedContent.hero, imageUrl: "" }
                              })}
                              className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 cursor-pointer"
                              title="Clear hero image"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-semibold uppercase">No Image Selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Statistics cards */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Statistics Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {editingStats.map((st, idx) => (
                      <div key={st.id} className="bg-[#FFF7F5] border border-[#F2E4E2] p-4 rounded-xl space-y-2">
                        <input
                          type="text"
                          value={st.value}
                          onChange={(e) => {
                            const nextStats = [...editingStats];
                            nextStats[idx].value = e.target.value;
                            setEditingStats(nextStats);
                          }}
                          className="w-full text-center text-sm font-bold border border-gray-200 bg-white rounded py-1 text-[#FF2D2D]"
                        />
                        <input
                          type="text"
                          value={st.label}
                          onChange={(e) => {
                            const nextStats = [...editingStats];
                            nextStats[idx].label = e.target.value;
                            setEditingStats(nextStats);
                          }}
                          className="w-full text-center text-[10px] border border-gray-100 bg-white rounded py-1 text-[#475467]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section D: About Us Copy */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">About Us Content</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#101828] uppercase">About Section Badge</span>
                        <input
                          type="text"
                          value={editedContent.about?.badge || ""}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            about: { ...(editedContent.about || {}), badge: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#101828] uppercase">About Section Title</span>
                        <input
                          type="text"
                          value={editedContent.about?.title || ""}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            about: { ...(editedContent.about || {}), title: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">About Section Core Description</span>
                      <textarea
                        rows={2}
                        value={editedContent.about?.description || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          about: { ...(editedContent.about || {}), description: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] rounded-xl text-xs resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Mission Block Headline</span>
                      <input
                        type="text"
                        value={editedContent.about?.missionTitle || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          about: { ...(editedContent.about || {}), missionTitle: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#101828] uppercase">Mission Paragraph 1</span>
                        <textarea
                          rows={3}
                          value={editedContent.about?.missionDesc1 || ""}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            about: { ...(editedContent.about || {}), missionDesc1: e.target.value }
                          })}
                          className="w-full p-3 border border-[#F2E4E2] rounded-xl text-xs resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#101828] uppercase">Mission Paragraph 2</span>
                        <textarea
                          rows={3}
                          value={editedContent.about?.missionDesc2 || ""}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            about: { ...(editedContent.about || {}), missionDesc2: e.target.value }
                          })}
                          className="w-full p-3 border border-[#F2E4E2] rounded-xl text-xs resize-none"
                        />
                      </div>
                    </div>

                    {/* Core Values */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold text-[#101828] uppercase block">Our 3 Core Values & Proof-Points</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {((editedContent.about?.coreValues && editedContent.about.coreValues.length === 3)
                          ? editedContent.about.coreValues
                          : [
                              { title: "Results-First Execution", desc: "We don't prioritize vanity likes or useless visits. We build high-performance pipelines engineered to attract paying customers." },
                              { title: "Absolute Transparency", desc: "No hidden setup costs, unexpected fees, or secret markups. Everything is communicated and priced upfront clearly." },
                              { title: "Speed & Communication", desc: "Our teams coordinate via modern communication panels to answer questions within minutes and deliver designs on time." }
                            ]
                        ).map((val, idx) => (
                          <div key={idx} className="bg-[#FFF7F5] border border-[#F2E4E2] p-4 rounded-xl space-y-2">
                            <span className="text-[9px] font-mono font-bold text-gray-500 uppercase block">Value {idx + 1}</span>
                            <input
                              type="text"
                              value={val.title}
                              onChange={(e) => {
                                const nextValues = [...(editedContent.about?.coreValues || [])];
                                nextValues[idx] = { ...val, title: e.target.value };
                                setEditedContent({
                                  ...editedContent,
                                  about: { ...(editedContent.about || {}), coreValues: nextValues }
                                });
                              }}
                              className="w-full px-2 py-1 border border-[#F2E4E2] bg-white rounded text-xs font-bold"
                              placeholder="Title"
                            />
                            <textarea
                              rows={3}
                              value={val.desc}
                              onChange={(e) => {
                                const nextValues = [...(editedContent.about?.coreValues || [])];
                                nextValues[idx] = { ...val, desc: e.target.value };
                                setEditedContent({
                                  ...editedContent,
                                  about: { ...(editedContent.about || {}), coreValues: nextValues }
                                });
                              }}
                              className="w-full p-2 border border-[#F2E4E2] bg-white rounded text-[11px] leading-normal resize-none"
                              placeholder="Brief description..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Founders Executive Direction */}
                    <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                      <span className="text-[10px] font-bold text-[#101828] uppercase block">Our Executive Direction (Founders & Leaders)</span>
                      <p className="text-[11px] text-[#475467]">These profiles appear in the "Our Executive Direction" segment on your About Us page.</p>
                      
                      <div className="space-y-4 bg-[#FFF7F5] border border-[#F2E4E2] p-4 rounded-2xl">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const nextFounders = [
                                ...(editedContent.about?.founders || []),
                                { emoji: "👤", role: "Co-Founder", name: "New Leader Name", description: "Details about leadership responsibilities and active expertise." }
                              ];
                              setEditedContent({
                                ...editedContent,
                                about: { ...(editedContent.about || {}), founders: nextFounders }
                              });
                              triggerSuccess("New executive profile added.");
                            }}
                            className="px-4 py-1.5 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            + Add Executive Profile
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(editedContent.about?.founders || []).map((founder, idx) => (
                            <div key={idx} className="bg-white border border-[#F2E4E2] p-4 rounded-xl space-y-3 relative">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextFounders = (editedContent.about?.founders || []).filter((_, i) => i !== idx);
                                  setEditedContent({
                                    ...editedContent,
                                    about: { ...(editedContent.about || {}), founders: nextFounders }
                                  });
                                  triggerSuccess("Executive profile deleted.");
                                }}
                                className="absolute top-2 right-2 text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 cursor-pointer"
                                title="Delete Executive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <span className="text-[9px] font-mono font-bold text-gray-500 uppercase block">Leader Profile #{idx + 1}</span>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-bold uppercase text-gray-400">Emoji Fallback</span>
                                  <input
                                    type="text"
                                    value={founder.emoji}
                                    onChange={(e) => {
                                      const nextFounders = [...(editedContent.about?.founders || [])];
                                      nextFounders[idx] = { ...founder, emoji: e.target.value };
                                      setEditedContent({
                                        ...editedContent,
                                        about: { ...(editedContent.about || {}), founders: nextFounders }
                                      });
                                    }}
                                    className="w-full px-2 py-1 border border-[#F2E4E2] rounded text-xs text-center font-bold"
                                    placeholder="👤"
                                  />
                                </div>
                                <div className="col-span-2 space-y-0.5">
                                  <span className="text-[8px] font-bold uppercase text-gray-400">Name</span>
                                  <input
                                    type="text"
                                    value={founder.name}
                                    onChange={(e) => {
                                      const nextFounders = [...(editedContent.about?.founders || [])];
                                      nextFounders[idx] = { ...founder, name: e.target.value };
                                      setEditedContent({
                                        ...editedContent,
                                        about: { ...(editedContent.about || {}), founders: nextFounders }
                                      });
                                    }}
                                    className="w-full px-2 py-1 border border-[#F2E4E2] rounded text-xs font-bold"
                                  />
                                </div>
                              </div>

                              {/* Custom Profile Image Upload / Selection */}
                              <div className="space-y-1.5 p-2 bg-[#FFF7F5] border border-[#F2E4E2]/60 rounded-xl">
                                <span className="text-[8px] font-bold uppercase text-gray-400 block">Custom Profile Image</span>
                                <div className="flex gap-2 items-center">
                                  {/* Small dynamic preview */}
                                  <div className="w-9 h-9 rounded-full bg-white border border-[#F2E4E2] flex items-center justify-center font-bold shrink-0 overflow-hidden relative group">
                                    {founder.imageUrl ? (
                                      <img
                                        src={founder.imageUrl}
                                        alt={founder.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <span className="text-sm">{founder.emoji || "👤"}</span>
                                    )}
                                  </div>

                                  <div className="flex-1 space-y-1">
                                    <input
                                      type="url"
                                      value={founder.imageUrl || ""}
                                      onChange={(e) => {
                                        const nextFounders = [...(editedContent.about?.founders || [])];
                                        nextFounders[idx] = { ...founder, imageUrl: e.target.value };
                                        setEditedContent({
                                          ...editedContent,
                                          about: { ...(editedContent.about || {}), founders: nextFounders }
                                        });
                                      }}
                                      placeholder="https://example.com/photo.jpg"
                                      className="w-full px-2 py-0.5 border border-[#F2E4E2] bg-white rounded text-[10px]"
                                    />

                                    <div className="flex gap-1">
                                      {/* File upload */}
                                      <div className="relative flex-1">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                              const base64Url = await compressImage(file, 600, 600, 0.75);
                                              const nextFounders = [...(editedContent.about?.founders || [])];
                                              nextFounders[idx] = { ...founder, imageUrl: base64Url };
                                              setEditedContent({
                                                ...editedContent,
                                                about: { ...(editedContent.about || {}), founders: nextFounders }
                                              });
                                              triggerSuccess(`Profile image loaded & optimized for ${founder.name}!`);
                                            } catch (err) {
                                              setErrorMsg("Failed to read and optimize profile image.");
                                            }
                                          }}
                                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <button
                                          type="button"
                                          className="w-full py-0.5 px-1.5 border border-dashed border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded text-[8px] font-bold text-gray-700 text-center flex items-center justify-center gap-0.5 cursor-pointer"
                                        >
                                          <Upload className="w-2.5 h-2.5 text-[#FF2D2D]" />
                                          Upload
                                        </button>
                                      </div>

                                      {/* Pick from media library */}
                                      <button
                                        type="button"
                                        onClick={() => setPickingFor(`founder-${idx}`)}
                                        className="py-0.5 px-1.5 border border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded text-[8px] font-bold text-[#FF2D2D] flex items-center justify-center gap-0.5 cursor-pointer"
                                      >
                                        <Library className="w-2.5 h-2.5" />
                                        Library
                                      </button>

                                      {/* Clear custom image if set */}
                                      {founder.imageUrl && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextFounders = [...(editedContent.about?.founders || [])];
                                            nextFounders[idx] = { ...founder, imageUrl: "" };
                                            setEditedContent({
                                              ...editedContent,
                                              about: { ...(editedContent.about || {}), founders: nextFounders }
                                            });
                                            triggerSuccess("Reverted to emoji fallback.");
                                          }}
                                          className="py-0.5 px-1.5 border border-red-200 bg-white hover:bg-red-50 text-[8px] font-bold text-red-600 rounded flex items-center justify-center gap-0.5 cursor-pointer"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                          Clear
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-0.5">
                                <span className="text-[8px] font-bold uppercase text-gray-400">Role / Title</span>
                                <input
                                  type="text"
                                  value={founder.role}
                                  onChange={(e) => {
                                    const nextFounders = [...(editedContent.about?.founders || [])];
                                    nextFounders[idx] = { ...founder, role: e.target.value };
                                    setEditedContent({
                                      ...editedContent,
                                      about: { ...(editedContent.about || {}), founders: nextFounders }
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-[#F2E4E2] rounded text-xs font-semibold"
                                />
                              </div>

                              <div className="space-y-0.5">
                                <span className="text-[8px] font-bold uppercase text-gray-400">Short Biography</span>
                                <textarea
                                  rows={2}
                                  value={founder.description}
                                  onChange={(e) => {
                                    const nextFounders = [...(editedContent.about?.founders || [])];
                                    nextFounders[idx] = { ...founder, description: e.target.value };
                                    setEditedContent({
                                      ...editedContent,
                                      about: { ...(editedContent.about || {}), founders: nextFounders }
                                    });
                                  }}
                                  className="w-full p-2 border border-[#F2E4E2] rounded text-xs resize-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section E: Partners / Client names */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Trusted Clients & Partners</h3>
                  <p className="text-[11px] text-[#475467]">These client names auto-scroll inside the sliding marquee logo block on your homepage.</p>
                  
                  <div className="bg-[#FFF7F5] border border-[#F2E4E2] p-4 rounded-2xl space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPartnerName}
                        onChange={(e) => setNewPartnerName(e.target.value)}
                        placeholder="Add new partner (e.g. Acme Corp)"
                        className="flex-1 px-3 py-1.5 border border-[#F2E4E2] rounded-lg text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newPartnerName.trim()) return;
                          const nextPartners = [
                            ...(editedContent.partners || []),
                            { id: "partner-" + Date.now(), name: newPartnerName.trim() }
                          ];
                          setEditedContent({ ...editedContent, partners: nextPartners });
                          setNewPartnerName("");
                          triggerSuccess("Partner logo registered.");
                        }}
                        className="px-4 py-1.5 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Add Partner
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(editedContent.partners || []).map((partner) => (
                        <div key={partner.id} className="flex items-center justify-between p-2.5 border border-[#F2E4E2] bg-white rounded-xl">
                          <input
                            type="text"
                            value={partner.name}
                            onChange={(e) => {
                              const nextPartners = (editedContent.partners || []).map(p => {
                                if (p.id === partner.id) return { ...p, name: e.target.value };
                                return p;
                              });
                              setEditedContent({ ...editedContent, partners: nextPartners });
                            }}
                            className="text-xs font-bold text-[#101828] bg-transparent outline-none w-2/3"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextPartners = (editedContent.partners || []).filter(p => p.id !== partner.id);
                              setEditedContent({ ...editedContent, partners: nextPartners });
                              triggerSuccess("Partner logo deleted.");
                            }}
                            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section E.2: Client Reviews & Testimonials */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Client Reviews & Testimonials</h3>
                      <p className="text-[11px] text-[#475467]">Manage client reviews and feedback displayed on the homepage.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextTestimonials = [
                          ...(editedContent.testimonials || []),
                          {
                            id: "rev-" + Date.now(),
                            name: "New Client Name",
                            role: "Business Name, Role",
                            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                            text: "Great experience working with B2bfiy team!",
                            textBn: "B2bfiy টিমের সাথে কাজ করার অভিজ্ঞতা দারুণ ছিল!",
                            rating: 5
                          }
                        ];
                        setEditedContent({ ...editedContent, testimonials: nextTestimonials });
                        triggerSuccess("New review card added.");
                      }}
                      className="px-4 py-1.5 bg-[#FF2D2D] hover:bg-[#FF5757] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Review</span>
                    </button>
                  </div>

                  <div className="space-y-4 bg-[#FFF7F5] border border-[#F2E4E2] p-4 rounded-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(editedContent.testimonials || []).map((rev, idx) => (
                        <div key={rev.id || idx} className="bg-white border border-[#F2E4E2] p-4 rounded-xl space-y-3 relative text-left">
                          <button
                            type="button"
                            onClick={() => {
                              const currentList = editedContent.testimonials || [];
                              const nextTestimonials = currentList.filter((_, i) => i !== idx);
                              setEditedContent({ ...editedContent, testimonials: nextTestimonials });
                              triggerSuccess("Review deleted.");
                            }}
                            className="absolute top-2 right-2 text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-[9px] font-mono font-bold text-gray-500 uppercase block">Client Review #{idx + 1}</span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold uppercase text-gray-400">Client Name</span>
                              <input
                                type="text"
                                value={rev.name}
                                onChange={(e) => {
                                  const currentList = editedContent.testimonials || [];
                                  const nextTestimonials = [...currentList];
                                  nextTestimonials[idx] = { ...rev, name: e.target.value };
                                  setEditedContent({ ...editedContent, testimonials: nextTestimonials });
                                }}
                                className="w-full px-2 py-1 border border-[#F2E4E2] rounded text-xs font-semibold"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold uppercase text-gray-400">Role / Company Name</span>
                              <input
                                type="text"
                                value={rev.role}
                                onChange={(e) => {
                                  const currentList = editedContent.testimonials || [];
                                  const nextTestimonials = [...currentList];
                                  nextTestimonials[idx] = { ...rev, role: e.target.value };
                                  setEditedContent({ ...editedContent, testimonials: nextTestimonials });
                                }}
                                className="w-full px-2 py-1 border border-[#F2E4E2] rounded text-xs font-semibold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold uppercase text-gray-400">Star Rating (1-5)</span>
                              <select
                                value={rev.rating || 5}
                                onChange={(e) => {
                                  const currentList = editedContent.testimonials || [];
                                  const nextTestimonials = [...currentList];
                                  nextTestimonials[idx] = { ...rev, rating: parseInt(e.target.value, 10) };
                                  setEditedContent({ ...editedContent, testimonials: nextTestimonials });
                                }}
                                className="w-full px-2 py-1 border border-[#F2E4E2] bg-white rounded text-xs font-bold text-amber-500"
                              >
                                <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                                <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                                <option value={3}>3 Stars ⭐⭐⭐</option>
                                <option value={2}>2 Stars ⭐⭐</option>
                                <option value={1}>1 Star ⭐</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[8px] font-bold uppercase text-gray-400">Avatar Image</span>
                              <div className="flex items-center gap-2">
                                {rev.avatar ? (
                                  <img src={rev.avatar} alt={rev.name} className="w-7 h-7 rounded-full object-cover border border-[#F2E4E2]" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#FFE8E5] text-[#FF2D2D] font-bold text-[10px] flex items-center justify-center border border-[#F2E4E2]">
                                    {(rev.name || "?").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex gap-1 flex-1">
                                  <div className="relative flex-1">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          const base64Url = await compressImage(file, 200, 200, 0.8);
                                          const currentList = editedContent.testimonials || [];
                                          const nextTestimonials = [...currentList];
                                          nextTestimonials[idx] = { ...rev, avatar: base64Url };
                                          setEditedContent({ ...editedContent, testimonials: nextTestimonials });
                                          triggerSuccess("Client avatar uploaded!");
                                        } catch (err) {
                                          setErrorMsg("Failed to process avatar image.");
                                        }
                                      }}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <button type="button" className="w-full py-0.5 px-1 border border-dashed border-[#F2E4E2] bg-white rounded text-[8px] font-bold text-gray-700 flex items-center justify-center gap-0.5 cursor-pointer">
                                      <Upload className="w-2.5 h-2.5 text-[#FF2D2D]" />
                                      Upload
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPickingFor(`testimonial-${idx}`)}
                                    className="py-0.5 px-1 border border-[#F2E4E2] bg-white rounded text-[8px] font-bold text-[#FF2D2D] flex items-center justify-center gap-0.5 cursor-pointer"
                                  >
                                    <Library className="w-2.5 h-2.5" />
                                    Library
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold uppercase text-gray-400">Review Text (English)</span>
                            <textarea
                              rows={2}
                              value={rev.text}
                              onChange={(e) => {
                                const currentList = editedContent.testimonials || [];
                                const nextTestimonials = [...currentList];
                                nextTestimonials[idx] = { ...rev, text: e.target.value };
                                setEditedContent({ ...editedContent, testimonials: nextTestimonials });
                              }}
                              className="w-full p-2 border border-[#F2E4E2] rounded text-xs leading-relaxed resize-none"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold uppercase text-gray-400">Review Text (Bengali / বাংলা)</span>
                            <textarea
                              rows={2}
                              value={rev.textBn || ""}
                              onChange={(e) => {
                                const currentList = editedContent.testimonials || [];
                                const nextTestimonials = [...currentList];
                                nextTestimonials[idx] = { ...rev, textBn: e.target.value };
                                setEditedContent({ ...editedContent, testimonials: nextTestimonials });
                              }}
                              placeholder="বাংলা অনুবাদ (ঐচ্ছিক)"
                              className="w-full p-2 border border-[#F2E4E2] rounded text-xs leading-relaxed resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section F: Footer Copy */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Footer Copy & Copyright</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Footer Description Narrative</span>
                      <textarea
                        rows={2}
                        value={editedContent.footerDesc || ""}
                        onChange={(e) => setEditedContent({ ...editedContent, footerDesc: e.target.value })}
                        className="w-full p-3 border border-[#F2E4E2] rounded-xl text-xs resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Footer Copyright Text</span>
                      <input
                        type="text"
                        value={editedContent.copyright || ""}
                        onChange={(e) => setEditedContent({ ...editedContent, copyright: e.target.value })}
                        className="w-full px-3 py-2 border border-[#F2E4E2] rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section G: Privacy Policy Details */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Privacy Policy Page Content</h3>
                  <div className="grid grid-cols-1 gap-4 bg-[#FFF7F5] border border-[#F2E4E2] p-4 rounded-2xl">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Last Updated Date</span>
                      <input
                        type="text"
                        value={editedContent.privacyPolicy?.lastUpdated || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          privacyPolicy: { ...(editedContent.privacyPolicy || {}), lastUpdated: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">1. Introduction</span>
                      <textarea
                        rows={3}
                        value={editedContent.privacyPolicy?.introduction || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          privacyPolicy: { ...(editedContent.privacyPolicy || {}), introduction: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">2. Information We Collect</span>
                      <textarea
                        rows={3}
                        value={editedContent.privacyPolicy?.informationCollect || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          privacyPolicy: { ...(editedContent.privacyPolicy || {}), informationCollect: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">3. How We Process Information</span>
                      <textarea
                        rows={3}
                        value={editedContent.privacyPolicy?.howWeProcess || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          privacyPolicy: { ...(editedContent.privacyPolicy || {}), howWeProcess: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">4. Information Security</span>
                      <textarea
                        rows={3}
                        value={editedContent.privacyPolicy?.security || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          privacyPolicy: { ...(editedContent.privacyPolicy || {}), security: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">5. Contact and Queries</span>
                      <textarea
                        rows={2}
                        value={editedContent.privacyPolicy?.contact || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          privacyPolicy: { ...(editedContent.privacyPolicy || {}), contact: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section H: Terms & Conditions Details */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Terms & Conditions Page Content</h3>
                  <div className="grid grid-cols-1 gap-4 bg-[#FFF7F5] border border-[#F2E4E2] p-4 rounded-2xl">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">Last Updated Date</span>
                      <input
                        type="text"
                        value={editedContent.terms?.lastUpdated || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          terms: { ...(editedContent.terms || {}), lastUpdated: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">1. Service Scope and Agreements</span>
                      <textarea
                        rows={3}
                        value={editedContent.terms?.scope || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          terms: { ...(editedContent.terms || {}), scope: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">2. Billing and Payments</span>
                      <textarea
                        rows={3}
                        value={editedContent.terms?.billing || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          terms: { ...(editedContent.terms || {}), billing: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">3. Intellectual Property Ownership</span>
                      <textarea
                        rows={3}
                        value={editedContent.terms?.ipOwnership || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          terms: { ...(editedContent.terms || {}), ipOwnership: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">4. Cancellation and Refunds</span>
                      <textarea
                        rows={3}
                        value={editedContent.terms?.cancellation || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          terms: { ...(editedContent.terms || {}), cancellation: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#101828] uppercase">5. Contact and Governance</span>
                      <textarea
                        rows={2}
                        value={editedContent.terms?.contact || ""}
                        onChange={(e) => setEditedContent({
                          ...editedContent,
                          terms: { ...(editedContent.terms || {}), contact: e.target.value }
                        })}
                        className="w-full p-3 border border-[#F2E4E2] bg-white rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section I: Service Page Showcase Images */}
                <div className="space-y-4 pt-4 border-t border-[#F2E4E2]">
                  <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Service Page Showcase Images</h3>
                  <p className="text-[11px] text-[#475467]">Update the main landscape banner images showcased for each creative service division on your public Services page.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FFF7F5] border border-[#F2E4E2] p-5 rounded-2xl text-left">
                    {[
                      { key: "webDev", label: "Website Development Image", defaultVal: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80" },
                      { key: "graphic", label: "Graphic Design Image", defaultVal: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80" },
                      { key: "video", label: "Video Editing Image", defaultVal: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" },
                      { key: "social", label: "Social Media Management Image", defaultVal: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80" }
                    ].map((svc) => {
                      const currentUrl = editedContent.serviceImages?.[svc.key as keyof typeof editedContent.serviceImages] || svc.defaultVal;
                      return (
                        <div key={svc.key} className="space-y-3 bg-white border border-[#F2E4E2] p-4 rounded-xl">
                          <div>
                            <span className="text-[10px] font-bold text-[#101828] uppercase block">{svc.label}</span>
                            <span className="text-[9px] text-gray-400 block font-mono">Key: {svc.key}</span>
                          </div>

                          {/* Image preview */}
                          <div className="aspect-video w-full rounded-lg overflow-hidden border border-[#F2E4E2] bg-gray-50 flex items-center justify-center relative">
                            {currentUrl ? (
                              <img
                                src={currentUrl}
                                alt={svc.label}
                                className="w-full h-full object-cover animate-fade-in"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-[10px] text-gray-400">No Image</span>
                            )}
                            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] px-2 py-0.5 rounded font-mono">
                              Preview
                            </span>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="url"
                              value={editedContent.serviceImages?.[svc.key as keyof typeof editedContent.serviceImages] || ""}
                              onChange={(e) => {
                                setEditedContent({
                                  ...editedContent,
                                  serviceImages: {
                                    ...(editedContent.serviceImages || {}),
                                    [svc.key]: e.target.value
                                  }
                                });
                              }}
                              placeholder={svc.defaultVal}
                              className="w-full px-3 py-1.5 border border-[#F2E4E2] bg-white rounded-lg text-xs"
                            />

                            <div className="flex gap-2">
                              {/* File input upload */}
                              <div className="relative flex-1">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const base64Url = await compressImage(file, 1000, 1000, 0.75);
                                      setEditedContent({
                                        ...editedContent,
                                        serviceImages: {
                                          ...(editedContent.serviceImages || {}),
                                          [svc.key]: base64Url
                                        }
                                      });
                                      triggerSuccess(`Uploaded & optimized image for ${svc.label}!`);
                                    } catch (err) {
                                      setErrorMsg("Failed to read and optimize service image.");
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <button
                                  type="button"
                                  className="w-full py-1.5 px-2 border border-dashed border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-gray-700 text-center flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Upload className="w-3 h-3 text-[#FF2D2D]" />
                                  Upload
                                </button>
                              </div>

                              {/* Pick from library */}
                              <button
                                type="button"
                                onClick={() => setPickingFor(`service-${svc.key}`)}
                                className="py-1.5 px-3 border border-[#F2E4E2] hover:border-[#FF2D2D]/30 bg-white rounded-lg text-[10px] font-bold text-[#FF2D2D] flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Library className="w-3 h-3" />
                                Library
                              </button>

                              {/* Reset to default */}
                              {editedContent.serviceImages?.[svc.key as keyof typeof editedContent.serviceImages] && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditedContent({
                                      ...editedContent,
                                      serviceImages: {
                                        ...(editedContent.serviceImages || {}),
                                        [svc.key]: ""
                                      }
                                    });
                                    triggerSuccess(`Reverted ${svc.label} to default fallback.`);
                                  }}
                                  className="py-1.5 px-3 border border-red-200 bg-white hover:bg-red-50 text-[10px] font-bold text-red-600 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* SUB-PANEL 5: MEDIA LIBRARY */}
            {activeTab === "media" && (
              <div className="space-y-6">
                <div className="border-b border-[#F2E4E2] pb-4">
                  <h2 className="text-lg font-bold text-[#101828]">Media Asset Registry</h2>
                  <p className="text-xs text-[#475467]">Pre-seed and manage images to select as thumbnails or visual guides.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Option A: Direct File Upload */}
                  <div className="bg-[#FFF7F5] border border-[#F2E4E2] p-5 rounded-2xl space-y-4 text-left">
                    <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Custom Image File Upload</h3>
                    <p className="text-[11px] text-[#475467]">Choose a local image file from your system to store as local base64 URL.</p>
                    <div className="border-2 border-dashed border-[#F2E4E2] rounded-xl p-5 text-center hover:border-[#FF2D2D]/30 bg-white relative transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="space-y-2">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
                        <span className="text-xs font-bold text-[#101828] block">Drag & Drop or Click to Select</span>
                        <span className="text-[10px] text-gray-400 block font-mono">PNG, JPG, SVG, WEBP</span>
                      </div>
                    </div>
                  </div>

                  {/* Option B: Register URL asset */}
                  <form onSubmit={handleAddMedia} className="bg-[#FFF7F5] border border-[#F2E4E2] p-5 rounded-2xl flex flex-col justify-between space-y-4 text-left">
                    <div>
                      <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Register URL Asset</h3>
                      <p className="text-[11px] text-[#475467] mb-2">Register an existing web or Unsplash image link into your library.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Asset Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Creative Cover Banner"
                          value={newMediaName}
                          onChange={(e) => setNewMediaName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-[#F2E4E2] bg-white rounded-lg text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Secure Image URL *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://images.unsplash.com/photo-..."
                          value={newMediaUrl}
                          onChange={(e) => setNewMediaUrl(e.target.value)}
                          className="w-full px-3 py-1.5 border border-[#F2E4E2] bg-white rounded-lg text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#101828] uppercase">Category</label>
                        <select
                          value={newMediaCat}
                          onChange={(e) => setNewMediaCat(e.target.value as any)}
                          className="w-full px-3 py-1.5 border border-[#F2E4E2] bg-white rounded-lg text-xs"
                        >
                          <option value="mockup">Mockup</option>
                          <option value="graphic">Graphic</option>
                          <option value="video">Video</option>
                          <option value="photo">Photo</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#FF2D2D] text-white text-xs font-bold rounded-lg hover:bg-[#FF5757] cursor-pointer"
                    >
                      Register Asset
                    </button>
                  </form>
                </div>

                {/* Grid representation of existing registered assets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {mediaItems.map((item) => (
                    <div key={item.id} className="border border-[#F2E4E2] p-3 rounded-xl bg-white space-y-2 relative group text-left">
                      <div className="aspect-video w-full rounded overflow-hidden bg-[#FFF7F5] border border-[#F2E4E2] flex items-center justify-center">
                        {item.url ? (
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[10px] text-gray-400">No Asset</span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[11px] font-bold text-[#101828] block truncate">{item.name}</span>
                        <span className="text-[9px] text-[#475467] font-mono block uppercase">Cat: {item.category}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-[#F2E4E2]">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.url);
                            triggerSuccess("Asset URL copied to clipboard.");
                          }}
                          className="text-[10px] font-bold text-[#FF2D2D] hover:underline cursor-pointer"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(item.id)}
                          className="text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* SUB-PANEL 6: SECURITY CREDENTIALS */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="border-b border-[#F2E4E2] pb-4">
                  <h2 className="text-lg font-bold text-[#101828]">Security & Admin Access</h2>
                  <p className="text-xs text-[#475467]">
                    Signed in as <span className="font-semibold text-[#101828]">{adminSession?.email}</span>.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl max-w-lg text-left text-xs text-blue-800">
                  Admin accounts live in the <code className="font-mono">admin_users</code> table in your Neon database.
                  To add another admin, insert a row there with a bcrypt password hash (or temporarily set
                  ADMIN_EMAIL / ADMIN_PASSWORD to a new address and sign in once to bootstrap it, if the table is
                  still empty). You can only change your own password below.
                </div>

                <form onSubmit={handleUpdateSecurity} className="bg-[#FFF7F5] border border-[#F2E4E2] p-6 rounded-2xl space-y-4 max-w-lg text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#101828] uppercase tracking-wider block">New Password *</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white outline-none focus:border-[#FF2D2D]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#101828] uppercase tracking-wider block">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmAdminPass}
                      onChange={(e) => setConfirmAdminPass(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2 border border-[#F2E4E2] rounded-xl text-xs bg-white outline-none focus:border-[#FF2D2D]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isUpdatingPassword ? "Updating…" : "Update Password"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SUB-PANEL 7: NEON DATABASE INTEGRATION */}
            {activeTab === "database" && (
              <div className="space-y-6">
                <div className="border-b border-[#F2E4E2] pb-4 text-left">
                  <h2 className="text-lg font-bold text-[#101828]">Neon Database & Vercel Sync</h2>
                  <p className="text-xs text-[#475467]">Your website persists settings, portfolios, packages, and lead logs to a Neon Postgres database.</p>
                </div>

                {/* Connection Status Indicator */}
                <div className="text-left">
                  {dbStatus === "connected" ? (
                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-emerald-500 rounded-2xl text-white shrink-0 mt-0.5">
                          <Database className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide font-mono">NEON CONNECTED & SYNCHRONIZED</h4>
                          <p className="text-[11px] text-emerald-700 mt-1">Your website has successfully connected to the database. Ready to load and save in real-time.</p>
                          <p className="text-[10px] text-emerald-600 mt-1.5 font-medium bg-emerald-100/50 inline-block px-2 py-0.5 rounded-md">
                            💡 Tip: If your Neon tables are currently empty, click the sync button on the right to upload all website settings & projects.
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 w-full md:w-auto">
                        <button
                          type="button"
                          disabled={isPushingData}
                          onClick={handlePushAllLocalData}
                          className="w-full md:w-auto flex items-center justify-center space-x-1.5 px-4.5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{isPushingData ? "Syncing..." : "Push Local Data to Neon"}</span>
                        </button>
                      </div>
                    </div>
                  ) : dbStatus === "configured_unreachable" ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-red-500 rounded-xl text-white">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide font-mono">DATABASE_URL SET, BUT UNREACHABLE</h4>
                        <p className="text-[11px] text-red-700 mt-1">A connection string is configured but the server couldn't reach Neon. Double-check the connection string and that your Neon project isn't paused, then hit refresh.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-amber-500 rounded-xl text-white">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide font-mono">USING LOCAL FALLBACK DATABASE (LOCAL STORAGE)</h4>
                        <p className="text-[11px] text-amber-700 mt-1">Your changes are saved securely in your browser cache. Set DATABASE_URL as a server environment variable to enable permanent, real-time database sync.</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={isTestingConn}
                      onClick={refreshDbStatus}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF7F5] border border-[#F2E4E2] text-[#101828] text-[10px] font-bold rounded-lg hover:bg-[#FFE8E5] cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? "animate-spin" : ""}`} />
                      <span>{isTestingConn ? "Checking..." : "Refresh Connection Status"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start text-left">
                  {/* Server-side connection info */}
                  <div className="space-y-4 bg-[#FFF7F5] border border-[#F2E4E2] p-6 rounded-3xl">
                    <h3 className="text-xs font-bold text-[#FF2D2D] uppercase tracking-wider block font-mono">Connection Parameters</h3>
                    <p className="text-[11px] text-[#475467]">
                      Unlike the old Supabase setup, a Postgres connection string is a full database credential, so it can't
                      be pasted in here — it only ever lives as a server environment variable, never in the browser.
                    </p>
                    <div className="space-y-3 text-[11px]">
                      <div className="p-3 bg-white border border-[#F2E4E2] rounded-xl">
                        <p className="font-mono font-bold text-[#101828]">DATABASE_URL</p>
                        <p className="text-[#475467] mt-1">Your Neon pooled connection string (Neon Console → Connection Details).</p>
                      </div>
                      <div className="p-3 bg-white border border-[#F2E4E2] rounded-xl">
                        <p className="font-mono font-bold text-[#101828]">ADMIN_JWT_SECRET</p>
                        <p className="text-[#475467] mt-1">Any long random string, used to sign admin login sessions.</p>
                      </div>
                      <div className="p-3 bg-white border border-[#F2E4E2] rounded-xl">
                        <p className="font-mono font-bold text-[#101828]">ADMIN_EMAIL / ADMIN_PASSWORD</p>
                        <p className="text-[#475467] mt-1">Used once to create your first admin login — safe to remove after that first sign-in.</p>
                      </div>
                    </div>
                  </div>

                  {/* SQL setup guidelines */}
                  <div className="space-y-4 bg-gray-550 border border-gray-200 p-6 rounded-3xl">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-[#101828] uppercase tracking-wider block font-mono">1-Click SQL Initializer</h3>
                      <button
                        onClick={handleCopySql}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF7F5] border border-[#F2E4E2] text-[#FF2D2D] text-[10px] font-bold rounded-lg hover:bg-[#FFE8E5] cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isSqlCopied ? "Copied!" : "Copy SQL Script"}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-[#475467]">
                      Paste the following SQL script into the Neon SQL Editor. This automatically constructs your tables (<code className="font-mono bg-[#FFF7F5] px-1 text-[#FF2D2D]">site_content</code>, <code className="font-mono bg-[#FFF7F5] px-1 text-[#FF2D2D]">portfolios</code>, <code className="font-mono bg-[#FFF7F5] px-1 text-[#FF2D2D]">packages</code>, <code className="font-mono bg-[#FFF7F5] px-1 text-[#FF2D2D]">leads</code>, <code className="font-mono bg-[#FFF7F5] px-1 text-[#FF2D2D]">media_items</code>, <code className="font-mono bg-[#FFF7F5] px-1 text-[#FF2D2D]">admin_users</code>). Access control is enforced by the API routes, not by SQL policies.
                    </p>

                    <div className="relative">
                      <pre className="text-[9px] bg-gray-900 text-emerald-400 p-4 rounded-xl overflow-x-auto h-48 border border-gray-800 text-left font-mono select-all leading-relaxed">
                        {getNeonSQLScript()}
                      </pre>
                    </div>
                    
                    <div className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 p-3 rounded-xl flex items-start gap-2">
                      <Info className="w-4 h-4 text-[#FF2D2D] shrink-0 mt-0.5" />
                      <span>
                        <strong>Vercel Deployment Tip:</strong> Add <code className="font-mono text-[#FF2D2D]">DATABASE_URL</code>, <code className="font-mono text-[#FF2D2D]">ADMIN_JWT_SECRET</code>, <code className="font-mono text-[#FF2D2D]">ADMIN_EMAIL</code>, and <code className="font-mono text-[#FF2D2D]">ADMIN_PASSWORD</code> as Environment Variables under your project settings, then sign in once at <code className="font-mono text-[#FF2D2D]">/admin</code> to enable automatic database synchronization on your production domain.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-PANEL 4: FAQ MANAGER */}
            {activeTab === "faqs" && <AdminAiDashboard initialSubTab="faqs" />}

            {/* SUB-PANEL 8: AI FAQ, RAG & HUMAN SUPPORT */}
            {activeTab === "ai" && <AdminAiDashboard initialSubTab="tickets" />}

          </div>

        </div>

      </div>

      {/* Dynamic Selector Modal for choosing Logo/Favicon from Media Library */}
      {pickingFor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#F2E4E2] rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col space-y-4">
            <div className="flex justify-between items-start border-b border-[#F2E4E2] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#101828] uppercase font-display">
                  Select {
                    pickingFor === "logo" ? "Website Logo" : 
                    pickingFor === "favicon" ? "Website Favicon" : 
                    pickingFor === "hero-image" ? "Hero Banner Image" : 
                    pickingFor === "new-project-thumbnail" || pickingFor === "edit-project-thumbnail" ? "Project Thumbnail" :
                    pickingFor.startsWith("service-") ? "Service Page Image" : 
                    "Executive Profile Image"
                  } from Media Library
                </h3>
                <p className="text-[11px] text-[#475467]">Choose any previously registered or uploaded asset to use as your dynamic {
                  pickingFor === "new-project-thumbnail" || pickingFor === "edit-project-thumbnail" ? "portfolio project thumbnail" :
                  pickingFor.startsWith("founder-") ? "executive image" : 
                  pickingFor.startsWith("service-") ? "service image" : 
                  pickingFor
                }.</p>
              </div>
              <button
                type="button"
                onClick={() => setPickingFor(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold font-mono border border-gray-200 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {mediaItems.length === 0 ? (
                <div className="text-center py-12 bg-[#FFF7F5] rounded-2xl border border-dashed border-[#F2E4E2]">
                  <p className="text-xs text-[#475467] font-semibold">No assets found in your Media Library.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Upload files or register URLs under the "Media Library" tab first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
                  {mediaItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (pickingFor === "logo") {
                          setEditedContent({ ...editedContent, logoUrl: item.url });
                        } else if (pickingFor === "favicon") {
                          setEditedContent({ ...editedContent, faviconUrl: item.url });
                        } else if (pickingFor === "hero-image") {
                          setEditedContent({
                            ...editedContent,
                            hero: { ...editedContent.hero, imageUrl: item.url }
                          });
                        } else if (pickingFor === "new-project-thumbnail") {
                          setNewProject({ ...newProject, thumbnail: item.url });
                        } else if (pickingFor === "edit-project-thumbnail") {
                          if (editingProject) {
                            setEditingProject({ ...editingProject, thumbnail: item.url });
                          }
                        } else if (pickingFor.startsWith("service-")) {
                          const key = pickingFor.split("-")[1];
                          setEditedContent({
                            ...editedContent,
                            serviceImages: {
                              ...(editedContent.serviceImages || {}),
                              [key]: item.url
                            }
                          });
                        } else if (pickingFor.startsWith("founder-")) {
                          const idx = parseInt(pickingFor.split("-")[1], 10);
                          const nextFounders = [...(editedContent.about?.founders || [])];
                          if (nextFounders[idx]) {
                            nextFounders[idx] = { ...nextFounders[idx], imageUrl: item.url };
                            setEditedContent({
                              ...editedContent,
                              about: { ...(editedContent.about || {}), founders: nextFounders }
                            });
                          }
                        } else if (pickingFor.startsWith("testimonial-")) {
                          const idx = parseInt(pickingFor.split("-")[1], 10);
                          const currentList = editedContent.testimonials || [];
                          const nextTestimonials = [...currentList];
                          if (nextTestimonials[idx]) {
                            nextTestimonials[idx] = { ...nextTestimonials[idx], avatar: item.url };
                            setEditedContent({
                              ...editedContent,
                              testimonials: nextTestimonials
                            });
                          }
                        }
                        setPickingFor(null);
                        triggerSuccess(`Selected ${item.name} for ${pickingFor}!`);
                      }}
                      className="border border-[#F2E4E2] hover:border-[#FF2D2D] p-2 rounded-2xl cursor-pointer bg-[#FFF7F5] group transition-all text-center space-y-2 hover:shadow-xs"
                    >
                      <div className="bg-white border border-[#F2E4E2]/50 rounded-xl h-24 flex items-center justify-center overflow-hidden p-2 relative">
                        {item.url ? (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[9px] text-gray-400">No Asset</span>
                        )}
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-[#101828] block truncate leading-tight">{item.name}</span>
                        <span className="text-[8px] uppercase tracking-wider text-gray-400 font-mono block mt-0.5">{item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#F2E4E2] pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPickingFor(null)}
                className="px-4 py-2 bg-[#FFF7F5] border border-[#F2E4E2] text-gray-700 text-xs font-bold rounded-xl hover:bg-[#F2E4E2] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
