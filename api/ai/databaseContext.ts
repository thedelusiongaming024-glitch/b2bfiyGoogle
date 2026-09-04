import { query } from "../index.js";

export interface LiveDatabaseContext {
  brandName: string;
  phone: string;
  email: string;
  floatingWhatsApp: string;
  officeLocation: string;
  summaryText: string;
  packagesText: string;
  portfoliosText: string;
  faqsText: string;
  knowledgeDocsText: string;
  compiledFullContext: string;
}

let cachedContext: LiveDatabaseContext | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache for high performance & live admin updates

export async function getLiveDatabaseContext(forceRefresh = false): Promise<LiveDatabaseContext> {
  const now = Date.now();
  if (!forceRefresh && cachedContext && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedContext;
  }

  try {
    // 1. Fetch Site Content directly from live Neon database
    const contentRows = await query<{ id: string; data: any }>(
      "SELECT id, data FROM site_content WHERE id = 'main_site_content' OR id = 'default_site_content' ORDER BY CASE WHEN id = 'main_site_content' THEN 0 ELSE 1 END LIMIT 1"
    );
    const siteContent = contentRows.length > 0 && contentRows[0].data ? contentRows[0].data : {};

    // 2. Fetch Packages directly from live Neon database
    const packageRows = await query<{ id: string; data: any }>("SELECT id, data FROM packages");
    const packagesData = packageRows.map((r) => r.data).filter(Boolean);

    // 3. Fetch Portfolios directly from live Neon database
    const portfolioRows = await query<{ id: string; data: any }>("SELECT id, data FROM portfolios");
    const portfoliosData = portfolioRows.map((r) => r.data).filter(Boolean);

    // 4. Fetch FAQs
    const faqRows = await query<{
      id: string;
      question: string;
      answer: string;
      category_name: string | null;
    }>(
      `SELECT f.id, f.question, f.answer, c.name as category_name
       FROM faqs f
       LEFT JOIN faq_categories c ON f.category_id = c.id
       WHERE f.status = 'published'
       ORDER BY f.created_at ASC`
    );

    // 5. Fetch Knowledge Documents
    const docRows = await query<{ id: string; title: string; content: string }>(
      "SELECT id, title, content FROM knowledge_documents WHERE status = 'published' ORDER BY updated_at DESC"
    );

    // Format Site Summary
    const brandName = siteContent.brandName || "B2bfiy";
    const phone = siteContent.phone || "+880 1712-345678";
    const email = siteContent.email || "hello@b2bfiy.com";
    const floatingWhatsApp = siteContent.floatingWhatsApp || "+8801712345678";
    const officeLocation = "Dhaka, Bangladesh (Support hours: Sunday to Thursday, 10:00 AM - 7:00 PM BST)";

    const whyChooseUsSummary = Array.isArray(siteContent.whyChooseUs)
      ? siteContent.whyChooseUs.map((w: any) => `• ${w.title}: ${w.description}`).join("\n")
      : "";

    const servicesSummary = `
1. Web Design and Development:
High-converting landing pages, multi-page business portals, custom e-commerce stores, and web apps.
Tech stack: React, Next.js, TypeScript, Tailwind CSS, Node.js, Express, PostgreSQL, WordPress, WooCommerce, Shopify.

2. Graphic Design & Corporate Branding:
Logo design, full brand guidelines books, color systems, social media banners, marketing collateral, business cards, vector illustrations.

3. Video Editing & Motion Graphics:
Viral short-form Reels, TikToks, YouTube Shorts, dynamic subtitles, motion graphics, corporate brand documentaries, 3D product animations.

4. Social Media Management & Retainers:
Monthly content strategy, custom graphics, video production, Facebook page management, ad campaign setup, weekly posting schedules.`;

    const summaryText = `
AGENCY IDENTITY & CONTACT (LIVE DATABASE):
- Brand Name: ${brandName} (Website: b2bfiy.com)
- Tagline/Badge: ${siteContent.hero?.badge || "Your Digital Growth Partner"}
- Headline: ${siteContent.hero?.title || "Build a Powerful Digital Presence That Helps Your Business Grow."}
- Description: ${siteContent.hero?.subtitle || siteContent.metaDescription || "Full-service digital agency in Dhaka, Bangladesh."}
- Official Phone / Call: ${phone}
- Official Email: ${email}
- WhatsApp Contact: ${floatingWhatsApp}
- Headquarters: ${officeLocation}
- Free Consultation & Audit: Available at /free-audit with zero commitment or fee.

CORE SERVICES:
${servicesSummary}

WHY CHOOSE B2BFIY:
${whyChooseUsSummary}
`;

    // Format Packages
    const packagesText = packagesData
      .map((pkg: any, idx: number) => {
        const feats = Array.isArray(pkg.features)
          ? pkg.features.map((f: string) => `  - ${f}`).join("\n")
          : "";
        return `[PACKAGE #${idx + 1}] ${pkg.title} (${pkg.type || "standard"})
- Price: ${pkg.price} / ${pkg.period || "Project"}
${pkg.deliveryTime ? `- Turnaround / Delivery: ${pkg.deliveryTime}` : ""}
${pkg.isPopular ? "- Popular Choice: YES" : ""}
- Features:
${feats}`;
      })
      .join("\n\n");

    // Format Portfolios
    const portfoliosText = portfoliosData
      .map((port: any, idx: number) => {
        const techs = Array.isArray(port.technologies) ? port.technologies.join(", ") : "";
        const tags = Array.isArray(port.tags) ? port.tags.join(", ") : "";
        return `[CASE STUDY #${idx + 1}] ${port.title}
- Client: ${port.clientName || "Confidential Client"} | Category: ${port.category || "General"}
- Summary: ${port.shortDescription || ""}
- Challenge: ${port.clientChallenge || ""}
- Solution: ${port.ourSolution || ""}
- Key Results / Metrics: ${port.projectResult || ""}
- Technologies: ${techs}
- Tags: ${tags}`;
      })
      .join("\n\n");

    // Format FAQs
    const faqsText = faqRows
      .map((f, idx) => `[FAQ #${idx + 1}] (${f.category_name || "General"})\nQ: ${f.question}\nA: ${f.answer}`)
      .join("\n\n");

    // Format Knowledge Docs
    const knowledgeDocsText = docRows
      .map((d, idx) => `[KNOWLEDGE DOCUMENT #${idx + 1}] ${d.title}\n${d.content}`)
      .join("\n\n");

    // Compile into single master context
    const compiledFullContext = `
=== B2BFIY LIVE DATABASE KNOWLEDGE SNAPSHOT ===

${summaryText}

=== LIVE SERVICE PACKAGES & PRICING ===
${packagesText}

=== LIVE PORTFOLIO & CASE STUDIES ===
${portfoliosText}

=== PUBLISHED FREQUENTLY ASKED QUESTIONS ===
${faqsText}

=== AGENCY POLICIES & DETAILED GUIDELINES ===
${knowledgeDocsText}
`.trim();

    cachedContext = {
      brandName,
      phone,
      email,
      floatingWhatsApp,
      officeLocation,
      summaryText,
      packagesText,
      portfoliosText,
      faqsText,
      knowledgeDocsText,
      compiledFullContext,
    };
    lastCacheTime = now;

    return cachedContext;
  } catch (err) {
    console.error("Failed to load live database context, falling back to static:", err);
    return {
      brandName: "B2bfiy",
      phone: "+880 1712-345678",
      email: "hello@b2bfiy.com",
      floatingWhatsApp: "+8801712345678",
      officeLocation: "Dhaka, Bangladesh",
      summaryText: "B2bfiy digital agency in Dhaka, Bangladesh.",
      packagesText: "Packages available for web design, graphic design, video editing, and social media retainers.",
      portfoliosText: "Various client projects in e-commerce, branding, and video.",
      faqsText: "",
      knowledgeDocsText: "",
      compiledFullContext: "B2bfiy digital agency.",
    };
  }
}

export function invalidateDatabaseContextCache(): void {
  cachedContext = null;
  lastCacheTime = 0;
}
