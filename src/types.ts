export interface PortfolioProject {
  id: string;
  title: string;
  slug: string;
  clientName: string;
  category: "Graphic Design" | "Video Editing" | "Website Development" | "Social Media Management";
  thumbnail: string;
  gallery: string[];
  videoUrl?: string;
  videoEmbed?: string;
  liveUrl?: string;
  projectDate: string;
  shortDescription: string;
  fullDescription: string;
  clientChallenge: string;
  ourSolution: string;
  workProcess: string[];
  projectResult: string;
  technologies: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  featured: boolean;
  published: boolean;
  imageAspectRatio?: "video" | "square" | "auto" | "four-three";
  imageFit?: "cover" | "contain";
  subCategory?: string;
}

export interface ServicePackage {
  id: string;
  type: "monthly" | "website" | "graphic" | "video";
  title: string;
  price: string;
  period?: string; // e.g., "Month", "Project"
  isPopular?: boolean;
  features: string[];
  deliveryTime?: string;
  ctaText: string;
  published: boolean;
}

export interface Lead {
  id: string;
  type: "contact" | "free-audit";
  fullName: string;
  businessName: string;
  email: string;
  whatsappNumber: string;
  websiteUrl?: string;
  serviceNeeded: string;
  message: string;
  submittedAt: string;
  status: "New" | "In Progress" | "Contacted" | "Completed" | "Spam";
  notes?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  text: string;
  textBn?: string;
  rating?: number;
}

export interface SiteContent {
  brandName?: string;
  logoUrl?: string;
  logoType?: "image" | "text";
  faviconUrl?: string;
  phone: string;
  email: string;
  socials: {
    facebook: string;
    instagram: string;
    linkedin: string;
    whatsapp: string;
  };
  hero: {
    badge: string;
    title: string;
    highlight: string;
    description: string;
    trustText: string;
    imageUrl?: string;
  };
  stats: {
    id: string;
    value: string;
    label: string;
  }[];
  whyChooseUs: {
    title: string;
    description: string;
  }[];
  partners?: { id: string; name: string }[];
  testimonials?: Testimonial[];
  about?: {
    badge?: string;
    title?: string;
    description?: string;
    missionTitle?: string;
    missionDesc1?: string;
    missionDesc2?: string;
    coreValues?: { title: string; desc: string }[];
    founders?: {
      emoji: string;
      role: string;
      name: string;
      description: string;
      imageUrl?: string;
    }[];
  };
  footerDesc?: string;
  copyright?: string;
  metaTitle?: string;
  seoKeywords?: string;
  metaDescription?: string;
  googleSiteVerification?: string;
  metaPixelId?: string;
  ga4MeasurementId?: string;
  floatingWhatsApp?: string;
  floatingCall?: string;
  showFloatingButtons?: boolean;
  viewAllGraphicsLink?: string;
  privacyPolicy?: {
    lastUpdated?: string;
    introduction?: string;
    informationCollect?: string;
    howWeProcess?: string;
    security?: string;
    contact?: string;
  };
  terms?: {
    lastUpdated?: string;
    scope?: string;
    billing?: string;
    ipOwnership?: string;
    cancellation?: string;
    contact?: string;
  };
  serviceImages?: {
    webDev?: string;
    graphic?: string;
    video?: string;
    social?: string;
  };
}

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  category: "mockup" | "graphic" | "video" | "photo";
}

// AI FAQ, RAG & Support System Types
export interface FaqItem {
  id: string;
  category_id?: string;
  category?: string;
  category_name?: string;
  question: string;
  answer: string;
  status: "published" | "draft" | "archived";
  show_in_browse?: boolean;
  display_order?: number;
  sortOrder?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FaqCategory {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  status: "published" | "draft";
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  chunk_count?: number;
}

export interface SupportTicket {
  id: string;
  ticket_number?: number;
  ticketNumber?: number;
  session_id?: string;
  conversation_id?: string;
  question: string;
  status: "OPEN" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";
  admin_answer?: string;
  assigned_to?: string;
  created_at: string;
  answered_at?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  source: "USER" | "AI" | "FAQ" | "RAG" | "HUMAN" | "SYSTEM";
  created_at: string;
  ticket?: {
    id: string;
    ticketNumber: number;
    status: string;
    question: string;
    createdAt: string;
  };
}

export interface ConversationItem {
  id: string;
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  first_message?: string;
}

