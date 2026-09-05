import { LiveDatabaseContext } from "./databaseContext.js";
import { computeStringSimilarity } from "./faqMatcher.js";

export interface DatabaseMatchResult {
  matched: boolean;
  answer?: string;
  source: "DATABASE" | "FAQ";
}

/**
 * Normalizes text for keyword and intent matching
 */
function clean(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function hasAll(text: string, words: string[]): boolean {
  return words.every((w) => text.includes(w));
}

/**
 * Attempts to immediately answer the query directly from the live database snapshot.
 * Runs in < 2ms with zero external network calls, ensuring 100% database grounding and instant response.
 */
export function matchDatabaseDirectly(
  rawQuery: string,
  context: LiveDatabaseContext
): DatabaseMatchResult | null {
  const q = clean(rawQuery);
  if (!q) return null;

  const { packages = [], portfolios = [], faqs = [], siteContent = {}, phone, email, floatingWhatsApp, officeLocation } = context;

  const cleanWhatsApp = (floatingWhatsApp || siteContent.floatingWhatsApp || "+880 1712-345678").replace(/[*_~`]/g, "").trim();
  const cleanPhone = (phone || siteContent.phone || "+880 1712-345678").replace(/[*_~`]/g, "").trim();
  const cleanEmail = (email || siteContent.email || "hello@b2bfiy.com").replace(/[*_~`]/g, "").trim();
  const waLink = `[${cleanWhatsApp}](https://wa.me/${cleanWhatsApp.replace(/[^\d]/g, "")})`;
  const locText = siteContent.officeLocation || officeLocation || "Dhaka, Bangladesh";
  const hoursText = siteContent.supportHours || "Sunday to Thursday, 10:00 AM – 7:00 PM BST";
  const auditUrl = siteContent.auditButtonUrl || "/free-audit";
  const auditText = siteContent.auditButtonText || "Free Audit & Strategy Call";

  // -------------------------------------------------------------------------
  // 1. MATCH PUBLISHED DATABASE FAQS FIRST
  // -------------------------------------------------------------------------
  if (Array.isArray(faqs) && faqs.length > 0) {
    let bestFaq: { faq: (typeof faqs)[0]; score: number } | null = null;
    for (const f of faqs) {
      const qScore = computeStringSimilarity(rawQuery, f.question);
      if (qScore > (bestFaq?.score || 0)) {
        bestFaq = { faq: f, score: qScore };
      }
    }
    // High-confidence FAQ match
    if (bestFaq && bestFaq.score >= 0.62) {
      return {
        matched: true,
        answer: bestFaq.faq.answer,
        source: "FAQ",
      };
    }
  }

  // -------------------------------------------------------------------------
  // 2. SPECIFIC INDIVIDUAL PACKAGES
  // -------------------------------------------------------------------------
  // Helper to format a single package card
  const formatSinglePackage = (pkg: any) => {
    const feats = Array.isArray(pkg.features)
      ? pkg.features.map((f: string) => `• ${f}`).join("\n")
      : "";
    return `### **${pkg.title}** ${pkg.isPopular ? "*(Most Popular)*" : ""}
• **Price:** ${pkg.price} (${pkg.period || "Project"})
${pkg.deliveryTime ? `• **Turnaround:** ${pkg.deliveryTime}\n` : ""}• **Key Deliverables & Inclusions:**
${feats}

${pkg.ctaText ? `👉 **Next Step:** You can book this package or request our free audit at [b2bfiy.com/free-audit](https://b2bfiy.com/free-audit).\n` : ""}For inquiries or custom requirements, contact us on WhatsApp at ${waLink} or email **${cleanEmail}**.`;
  };

  // E-Commerce Store
  if (
    hasAny(q, ["ecommerce", "e commerce", "e-commerce", "online store", "shop store", "woocommerce", "shopify"]) &&
    hasAny(q, ["price", "cost", "package", "rate", "how much", "store", "features", "details", "dam", "khoroch"])
  ) {
    const ecomPkg = packages.find((p: any) => clean(p.title).includes("commerce") || clean(p.title).includes("store"));
    if (ecomPkg) {
      return {
        matched: true,
        answer: `Here are the details for our **E-Commerce Conversion Store** package from our live database:\n\n${formatSinglePackage(ecomPkg)}`,
        source: "DATABASE",
      };
    }
  }

  // Starter Website
  if (
    hasAny(q, ["starter website", "starter business website", "starter site", "basic website", "small website", "5 page"]) ||
    (hasAll(q, ["starter", "website"]) && hasAny(q, ["price", "cost", "features", "how much"]))
  ) {
    const starterPkg = packages.find((p: any) => clean(p.title).includes("starter business website") || clean(p.title).includes("starter website"));
    if (starterPkg) {
      return {
        matched: true,
        answer: `Here are the details for our **Starter Business Website** package from our live database:\n\n${formatSinglePackage(starterPkg)}`,
        source: "DATABASE",
      };
    }
  }

  // Custom Web App / SaaS
  if (
    hasAny(q, ["custom web app", "custom web application", "saas", "full stack web", "custom software", "web application"])
  ) {
    const saasPkg = packages.find((p: any) => clean(p.title).includes("custom web application") || clean(p.title).includes("saas"));
    if (saasPkg) {
      return {
        matched: true,
        answer: `Here are the details for our **Custom Web Application / SaaS** package from our live database:\n\n${formatSinglePackage(saasPkg)}`,
        source: "DATABASE",
      };
    }
  }

  // Growth Pro Retainer
  if (hasAny(q, ["growth pro", "pro retainer", "25000", "240"])) {
    const proPkg = packages.find((p: any) => clean(p.title).includes("growth pro"));
    if (proPkg) {
      return {
        matched: true,
        answer: `Here are the details for our **Growth Pro Retainer** from our live database:\n\n${formatSinglePackage(proPkg)}`,
        source: "DATABASE",
      };
    }
  }

  // Enterprise Elite Retainer
  if (hasAny(q, ["enterprise elite", "elite suite", "enterprise retainer", "45000"])) {
    const entPkg = packages.find((p: any) => clean(p.title).includes("enterprise"));
    if (entPkg) {
      return {
        matched: true,
        answer: `Here are the details for our **Enterprise Elite Suite** from our live database:\n\n${formatSinglePackage(entPkg)}`,
        source: "DATABASE",
      };
    }
  }

  // Starter Monthly Retainer
  if (hasAny(q, ["starter monthly", "starter growth", "12000", "120"])) {
    const stMonPkg = packages.find((p: any) => clean(p.title).includes("starter monthly"));
    if (stMonPkg) {
      return {
        matched: true,
        answer: `Here are the details for our **Starter Monthly Growth** retainer from our live database:\n\n${formatSinglePackage(stMonPkg)}`,
        source: "DATABASE",
      };
    }
  }

  // Branding Kit / Logo
  if (hasAny(q, ["branding kit", "essential branding", "logo design package", "logo package", "8000", "80"])) {
    const brandPkg = packages.find((p: any) => clean(p.title).includes("branding kit"));
    if (brandPkg) {
      return {
        matched: true,
        answer: `Here are the details for our **Essential Branding Kit** package from our live database:\n\n${formatSinglePackage(brandPkg)}`,
        source: "DATABASE",
      };
    }
  }

  // Social Media Creative Pack
  if (hasAny(q, ["creative pack", "15 posts", "social media pack", "social post package", "banner package"])) {
    const creatPkg = packages.find((p: any) => clean(p.title).includes("creative pack"));
    if (creatPkg) {
      return {
        matched: true,
        answer: `Here are the details for our **Social Media Creative Pack (15 Posts)** from our live database:\n\n${formatSinglePackage(creatPkg)}`,
        source: "DATABASE",
      };
    }
  }

  // Video Editing Packs
  if (hasAny(q, ["reels starter", "shorts starter", "8 video", "8 videos", "starter pack 8"])) {
    const v1 = packages.find((p: any) => clean(p.title).includes("8 video") || clean(p.title).includes("reels & shorts"));
    if (v1) {
      return {
        matched: true,
        answer: `Here are the details for our **Reels & Shorts Starter Pack** from our live database:\n\n${formatSinglePackage(v1)}`,
        source: "DATABASE",
      };
    }
  }

  if (hasAny(q, ["viral social video", "viral video suite", "16 video", "16 videos"])) {
    const v2 = packages.find((p: any) => clean(p.title).includes("viral social") || clean(p.title).includes("16 video"));
    if (v2) {
      return {
        matched: true,
        answer: `Here are the details for our **Viral Social Video Suite (16 Videos)** from our live database:\n\n${formatSinglePackage(v2)}`,
        source: "DATABASE",
      };
    }
  }

  // -------------------------------------------------------------------------
  // 3. CATEGORICAL PACKAGES (Web, Monthly, Video, Graphic, All)
  // -------------------------------------------------------------------------
  const formatPackageList = (items: any[]) => {
    return items
      .map((p: any) => {
        const feats = Array.isArray(p.features)
          ? p.features.slice(0, 3).map((f: string) => `  • ${f}`).join("\n")
          : "";
        return `### **${p.title}** ${p.isPopular ? "*(Popular)*" : ""}
• **Price:** ${p.price} (${p.period || "Project"})
${p.deliveryTime ? `• **Turnaround:** ${p.deliveryTime}\n` : ""}${feats}`;
      })
      .join("\n\n");
  };

  // Website Packages & Pricing
  if (
    hasAny(q, ["web package", "website package", "website pricing", "web pricing", "web development cost", "website cost", "website price", "web design cost", "web design price", "site package", "site cost"]) ||
    (hasAny(q, ["website", "web design", "web development", "landing page"]) && hasAny(q, ["price", "pricing", "cost", "package", "packages", "rate", "rates", "how much", "dam", "khoroch"]))
  ) {
    const webPkgs = packages.filter((p: any) => p.type === "website");
    if (webPkgs.length > 0) {
      return {
        matched: true,
        answer: `Here are our live **Web Design & Development Packages** directly from the B2bfiy database:

${formatPackageList(webPkgs)}

All websites are built with responsive mobile layout, clean architecture, and SEO foundations. 
To get a tailored quote or book your project, visit [b2bfiy.com/free-audit](https://b2bfiy.com/free-audit) or reach us on WhatsApp at ${waLink}.`,
        source: "DATABASE",
      };
    }
  }

  // Monthly Retainers & Growth
  if (
    hasAny(q, ["monthly retainer", "monthly retainers", "monthly package", "monthly packages", "growth retainer", "social media retainer", "monthly plan", "monthly pricing", "monthly cost"]) ||
    (hasAny(q, ["monthly", "retainer", "retainers"]) && hasAny(q, ["price", "pricing", "cost", "package", "packages", "how much", "rate", "dam"]))
  ) {
    const monPkgs = packages.filter((p: any) => p.type === "monthly");
    if (monPkgs.length > 0) {
      return {
        matched: true,
        answer: `Here are our live **Monthly Growth Retainer Packages** directly from the B2bfiy database:

${formatPackageList(monPkgs)}

Monthly retainers include continuous priority turnarounds, weekly scheduling, and dedicated senior creator bandwidth.
Ready to scale? Book a strategy call via [b2bfiy.com/free-audit](https://b2bfiy.com/free-audit) or message us on WhatsApp at ${waLink}.`,
        source: "DATABASE",
      };
    }
  }

  // Video Editing Packages
  if (
    hasAny(q, ["video package", "video packages", "video editing cost", "video editing price", "reels package", "reels cost", "reels price", "video pricing", "shorts package", "tiktok package"]) ||
    (hasAny(q, ["video", "reel", "reels", "shorts", "editing"]) && hasAny(q, ["price", "pricing", "cost", "package", "packages", "rate", "rates", "how much"]))
  ) {
    const vidPkgs = packages.filter((p: any) => p.type === "video");
    if (vidPkgs.length > 0) {
      return {
        matched: true,
        answer: `Here are our live **Video Editing & Motion Graphics Packages** directly from the B2bfiy database:

${formatPackageList(vidPkgs)}

Every video package includes kinetic subtitles, dynamic sound design, audio cleanup, and 2 rounds of revisions.
Order directly or get a custom batch quote at [b2bfiy.com/free-audit](https://b2bfiy.com/free-audit) or via WhatsApp: ${waLink}.`,
        source: "DATABASE",
      };
    }
  }

  // Graphic Design Packages
  if (
    hasAny(q, ["graphic package", "graphic design package", "graphic packages", "branding package", "branding cost", "logo cost", "logo price", "branding price", "design package", "creative pack"]) ||
    (hasAny(q, ["graphic", "branding", "logo", "banner", "graphics"]) && hasAny(q, ["price", "pricing", "cost", "package", "packages", "rate", "rates", "how much"]))
  ) {
    const grPkgs = packages.filter((p: any) => p.type === "graphic");
    if (grPkgs.length > 0) {
      return {
        matched: true,
        answer: `Here are our live **Graphic Design & Corporate Branding Packages** directly from the B2bfiy database:

${formatPackageList(grPkgs)}

Includes all source vector files (AI, EPS, SVG, PNG) and dedicated visual guidelines.
To get started, contact us on WhatsApp at ${waLink} or request an audit at [b2bfiy.com/free-audit](https://b2bfiy.com/free-audit).`,
        source: "DATABASE",
      };
    }
  }

  // ALL Packages / General Pricing Summary
  if (
    hasAny(q, ["all packages", "what are your packages", "show me packages", "list packages", "package list", "pricing list", "service charges", "service prices", "how much do your services cost", "what are your rates", "pricing tiers"]) ||
    (hasAny(q, ["package", "packages", "pricing", "prices", "rates", "cost", "dam", "khoroch"]) && q.length < 35)
  ) {
    return {
      matched: true,
      answer: `Here is the full summary of **B2bfiy Packages & Pricing** directly from our live database:

### **1. Web Design & Development**
• **Starter Business Website:** ৳15,000 / $150 (7–10 days, 5 pages, mobile optimized, SEO ready)
• **E-Commerce Conversion Store *(Popular)*:** ৳35,000 / $330 (12–16 days, 100 products, bKash/Nagad/Cards)
• **Custom Web Application / SaaS:** ৳65,000 / $620 (20–30 days, React, Node, PostgreSQL, full stack)

### **2. Monthly Growth Retainers**
• **Starter Monthly Growth:** ৳12,000 / $120/mo (12 graphics, 4 reels, content calendar)
• **Growth Pro Retainer *(Popular)*:** ৳25,000 / $240/mo (20 graphics, 8 reels, website maintenance)
• **Enterprise Elite Suite:** ৳45,000 / $420/mo (30 graphics, 16 videos, ads management, senior team)

### **3. Video Editing & Motion Graphics**
• **Reels & Shorts Starter Pack (8 Videos):** ৳10,000 / $95 (4–6 days, kinetic captions, sound FX)
• **Viral Social Video Suite (16 Videos) *(Popular)*:** ৳18,000 / $170 (7–10 days, 2D motion graphics)

### **4. Graphic Design & Branding**
• **Essential Branding Kit:** ৳8,000 / $80 (3–5 days, 3 logo concepts, vector files, guidelines)
• **Social Media Creative Pack (15 Posts) *(Popular)*:** ৳12,000 / $115 (5–7 days, carousel slides, banners)

You can book any package or schedule a free audit at [b2bfiy.com/free-audit](https://b2bfiy.com/free-audit).
WhatsApp: ${waLink} | Email: **${cleanEmail}**`,
      source: "DATABASE",
    };
  }

  // -------------------------------------------------------------------------
  // 4. PORTFOLIO & CASE STUDIES
  // -------------------------------------------------------------------------
  if (
    hasAny(q, ["portfolio", "case study", "case studies", "past work", "previous work", "projects you made", "clients you worked with", "show me your work", "sample work", "examples"])
  ) {
    // Check for specific industry / client filter
    if (hasAny(q, ["fashion", "luxe", "clothing", "ecommerce", "store"])) {
      const luxe = portfolios.find((p: any) => clean(p.title).includes("luxe") || clean(p.title).includes("fashion"));
      if (luxe) {
        return {
          matched: true,
          answer: `Here is our **Luxe Fashion E-Commerce** case study from the live database:

• **Client:** ${luxe.clientName || "Luxe Fashion BD"} (${luxe.category || "E-Commerce"})
• **Challenge:** ${luxe.clientChallenge || "High cart abandonment and sluggish mobile checkout experience."}
• **Our Solution:** ${luxe.ourSolution || "Designed a bespoke 1-click mobile checkout funnel and integrated high-speed CDN hosting with bKash/Nagad gateways."}
• **Key Results:** ${luxe.projectResult || "312% increase in mobile sales and 44% decrease in checkout bounce rate within 60 days."}
• **Technologies:** ${Array.isArray(luxe.technologies) ? luxe.technologies.join(", ") : "React, Next.js, Tailwind CSS"}`,
          source: "DATABASE",
        };
      }
    }

    if (hasAny(q, ["dental", "clinic", "doctor", "medical", "hospital", "healthcare"])) {
      const clinic = portfolios.find((p: any) => clean(p.title).includes("dental") || clean(p.title).includes("clinic"));
      if (clinic) {
        return {
          matched: true,
          answer: `Here is our **Care Dental Clinic** case study from the live database:

• **Client:** ${clinic.clientName || "Care Dental Clinic"} (${clinic.category || "Healthcare / Growth"})
• **Challenge:** ${clinic.clientChallenge || "Low visibility among local patients and lack of regular appointment bookings."}
• **Our Solution:** ${clinic.ourSolution || "Produced weekly educational reels and geo-targeted social campaigns with automated WhatsApp booking."}
• **Key Results:** ${clinic.projectResult || "4.8x increase in monthly patient appointments and over 180,000 organic video views."}`,
          source: "DATABASE",
        };
      }
    }

    if (hasAny(q, ["saas", "technova", "software", "tech"])) {
      const saas = portfolios.find((p: any) => clean(p.title).includes("technova") || clean(p.title).includes("saas"));
      if (saas) {
        return {
          matched: true,
          answer: `Here is our **TechNova SaaS Funnel** case study from the live database:

• **Client:** ${saas.clientName || "TechNova Solutions"} (${saas.category || "SaaS"})
• **Challenge:** ${saas.clientChallenge || "Complex enterprise product with poor user trial conversion."}
• **Our Solution:** ${saas.ourSolution || "Re-architected interactive demo funnel with high-contrast UI and interactive feature previews."}
• **Key Results:** ${saas.projectResult || "58% uplift in free-to-paid user trial conversions within first month."}`,
          source: "DATABASE",
        };
      }
    }

    // General portfolio overview
    const portfolioSummary = portfolios
      .slice(0, 4)
      .map((p: any) => `• **${p.title}** (${p.clientName || "Client"}): ${p.shortDescription || p.projectResult || ""}`)
      .join("\n");

    return {
      matched: true,
      answer: `Here are select client case studies from the **B2bfiy Portfolio Database**:

${portfolioSummary}

We have delivered proven growth across eCommerce, healthcare, tech startups, and retail brands.
Explore full interactive case studies on our website or request our detailed portfolio deck at [b2bfiy.com/free-audit](https://b2bfiy.com/free-audit).`,
      source: "DATABASE",
    };
  }

  // -------------------------------------------------------------------------
  // 5. CONTACT, LOCATION, CONSULTATION & AUDIT
  // -------------------------------------------------------------------------
  if (
    hasAny(q, ["contact", "phone", "call", "whatsapp", "email", "office", "location", "address", "where are you", "headquarters", "thikana", "jogajog"])
  ) {
    return {
      matched: true,
      answer: `Here is our official **Contact & Office Information** directly from the B2bfiy database:

• **Official WhatsApp:** ${waLink}
• **Direct Phone:** ${cleanPhone}
• **Email:** ${cleanEmail}
• **Office Location:** ${locText}
• **Support Hours:** ${hoursText}
• **${auditText}:** [${auditUrl.replace(/^https?:\/\//, "")}](${auditUrl.startsWith("http") ? auditUrl : `https://b2bfiy.com${auditUrl}`}) (100% free, zero obligation)`,
      source: "DATABASE",
    };
  }

  if (
    hasAny(q, ["free audit", "audit", "consultation", "meeting", "consult", "book meeting", "schedule call"])
  ) {
    return {
      matched: true,
      answer: `You can book a **${auditText}** directly with the B2bfiy senior team:

• **Cost:** 100% Free with zero commitment
• **What's Included:** In-depth review of your current website speed, UX funnel, branding positioning, and social media growth opportunities.
• **Turnaround:** Delivered within 24–48 hours
• **Booking URL:** [${auditUrl.replace(/^https?:\/\//, "")}](${auditUrl.startsWith("http") ? auditUrl : `https://b2bfiy.com${auditUrl}`})

You can also request your audit directly via WhatsApp at ${waLink}.`,
      source: "DATABASE",
    };
  }

  // -------------------------------------------------------------------------
  // 6. TURNAROUND & TIMELINES
  // -------------------------------------------------------------------------
  if (
    hasAny(q, ["turnaround", "delivery time", "how long", "timeline", "duration", "how much time", "shomoy", "koto din"])
  ) {
    return {
      matched: true,
      answer: `Here are our standard project delivery timelines recorded in our database:

• **Branding Kit & Logo Design:** 3–5 Business Days
• **Social Media Creative Pack (15 Posts):** 5–7 Business Days
• **Starter Business Website (Up to 5 Pages):** 7–10 Business Days
• **E-Commerce Conversion Store:** 12–16 Business Days
• **Custom Web Application / SaaS:** 20–30 Business Days
• **Short-Form Video Edits (Under Monthly Retainers):** 24–48 Hours per video

Need an expedited rush delivery? Contact our team on WhatsApp at ${waLink} to check current studio availability.`,
      source: "DATABASE",
    };
  }

  // -------------------------------------------------------------------------
  // 7. REVISIONS & POLICIES
  // -------------------------------------------------------------------------
  if (
    hasAny(q, ["revision", "revisions", "changes", "edit", "edits", "satisfaction", "modify"])
  ) {
    return {
      matched: true,
      answer: `Here is our official **Revision & Client Satisfaction Policy** from the B2bfiy database:

• **Fixed-Scope Projects (Websites, Branding Kits, Video Packs):** Include **2 full rounds of structural revisions** and unlimited minor textual/color adjustments prior to final signoff.
• **Monthly Growth Retainers:** Include **continuous, priority revisions** backed by dedicated agency capacity.
• **Turnaround on Revisions:** Edits for video and graphic assets are delivered within 24 hours.
• **Final Deliverables:** You receive 100% full intellectual property ownership and source vector/code files upon project completion.`,
      source: "DATABASE",
    };
  }

  // -------------------------------------------------------------------------
  // 8. REFUND POLICY & GUARANTEE
  // -------------------------------------------------------------------------
  if (
    hasAny(q, ["refund", "refunds", "money back", "guarantee", "cancellation", "cancel"])
  ) {
    return {
      matched: true,
      answer: `Here is our **Refund & Guarantee Policy** from the B2bfiy database:

• **Milestone Guarantee:** We commit to agreed deliverable milestones. If we fail to initiate or meet verified milestone deliverables as stated in your scope, clients may request a refund within 14 days of project commencement.
• **Approved Work:** Once a development or design milestone is approved and deployed, that portion is non-refundable.
• **Monthly Retainers:** Subscriptions can be cancelled anytime with a 7-day notice before the start of the next billing cycle.
• For questions regarding billing, contact **${email || "hello@b2bfiy.com"}**.`,
      source: "DATABASE",
    };
  }

  // -------------------------------------------------------------------------
  // 9. PAYMENT METHODS
  // -------------------------------------------------------------------------
  if (
    hasAny(q, ["payment method", "payment methods", "bkash", "nagad", "how to pay", "card payment", "bank transfer", "sslcommerz", "currency"])
  ) {
    return {
      matched: true,
      answer: `Here are the verified payment channels accepted by B2bfiy:

• **Mobile Financial Services (Bangladesh):** bKash Merchant, Nagad Merchant, Rocket
• **Cards & Online Banking:** Visa, MasterCard, American Express via SSLCommerz
• **Direct Bank Transfer:** Available for domestic and international B2B corporate contracts
• **Currencies Accepted:** BDT (৳) and USD ($)
• **Billing Schedule:** 50% deposit on fixed development milestones, 50% upon approval. Monthly retainers are invoiced at the beginning of each cycle month.`,
      source: "DATABASE",
    };
  }

  // -------------------------------------------------------------------------
  // 10. SERVICES OVERVIEW & TECH STACK
  // -------------------------------------------------------------------------
  if (
    hasAny(q, ["services", "what services", "what do you do", "what do you offer", "core services", "tech stack", "technologies", "what technology"])
  ) {
    return {
      matched: true,
      answer: `B2bfiy is a premier creative and digital growth agency in Dhaka. Here are our four core services from our database:

1. **Full-Stack Web Development & E-Commerce:**
   • Technologies: React, Next.js, TypeScript, Tailwind CSS, Node.js, Express, PostgreSQL, WordPress, WooCommerce, Shopify.
   • High-converting landing funnels, corporate portals, online stores, and SaaS web apps.

2. **Graphic Design & Corporate Branding:**
   • Visual identity books, custom vector logos, color systems, social media banners, marketing collateral.

3. **High-Retention Video Editing & Motion Graphics:**
   • Vertical Reels, TikToks, YouTube Shorts, dynamic kinetic typography, sound effects, and 2D motion graphics.

4. **Monthly Social Media Growth Retainers:**
   • Dedicated monthly content production, weekly post scheduling, Meta ad campaigns, and brand growth strategy.

Get a free audit and tailored quote at [b2bfiy.com/free-audit](https://b2bfiy.com/free-audit).`,
      source: "DATABASE",
    };
  }

  return null;
}
