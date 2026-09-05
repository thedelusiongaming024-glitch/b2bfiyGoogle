import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Clock,
  Check,
  Copy,
  Sparkles,
  MessageCircle,
  ExternalLink,
  Globe,
  ShoppingBag,
  Palette,
  Video,
  Code2,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  FileText
} from "lucide-react";
import { SiteContent } from "../types";

interface FormattedChatMessageProps {
  content: string;
  isUser: boolean;
  onNavigate?: (route: string) => void;
  siteContent?: SiteContent;
}

// Helper to choose an icon based on item title
function getServiceIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("web") || lower.includes("site") || lower.includes("landing")) {
    return <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />;
  }
  if (lower.includes("commerce") || lower.includes("store") || lower.includes("shop")) {
    return <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  }
  if (lower.includes("brand") || lower.includes("logo") || lower.includes("graphic") || lower.includes("post") || lower.includes("creative")) {
    return <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />;
  }
  if (lower.includes("video") || lower.includes("reel") || lower.includes("short") || lower.includes("motion")) {
    return <Video className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />;
  }
  if (lower.includes("app") || lower.includes("saas") || lower.includes("custom") || lower.includes("full-stack")) {
    return <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
  }
  return <CheckCircle2 className="w-3.5 h-3.5 text-[#FF2D2D] dark:text-[#ff6b6b] shrink-0 mt-0.5" />;
}

// Clean markdown text of rare artifacts like extra asterisks before parsing
function cleanMarkdown(text: string): string {
  if (!text) return "";
  return text
    // Replace triple asterisks ***text** with **text**
    .replace(/\*{3,}([^*]+)\*{2,}/g, "**$1**")
    .replace(/\*{3,}/g, "**")
    // Ensure bullet points are consistently parsed by remark-gfm
    .replace(/^[•]\s*/gm, "- ");
}

export const FormattedChatMessage: React.FC<FormattedChatMessageProps> = ({
  content,
  isUser,
  onNavigate,
  siteContent,
}) => {
  const [copied, setCopied] = useState(false);

  // If message is from user, render cleanly
  if (isUser) {
    return <div className="leading-relaxed font-medium">{content}</div>;
  }

  const cleanedContent = cleanMarkdown(content);

  // Dynamic Contact & CTA values from Admin Site Content
  const adminWhatsAppRaw = siteContent?.floatingWhatsApp || siteContent?.socials?.whatsapp || "+8801712345678";
  const cleanAdminWaDigits = adminWhatsAppRaw.replace(/[^0-9]/g, "");
  const defaultWaUrl = adminWhatsAppRaw.startsWith("http") 
    ? adminWhatsAppRaw 
    : `https://wa.me/${cleanAdminWaDigits || "8801712345678"}`;

  const whatsAppBtnText = siteContent?.aiChatWhatsAppButtonText || "WhatsApp Chat";
  const auditBtnText = siteContent?.aiChatCtaButtonText || siteContent?.auditButtonText || "Free Audit";
  const auditBtnUrl = siteContent?.aiChatCtaButtonUrl || siteContent?.auditButtonUrl || "/free-audit";

  const showWhatsAppBtn = siteContent?.showAiChatWhatsAppBtn !== false;
  const showCtaBtn = siteContent?.showAiChatCtaBtn !== false;
  const showCopyBtn = siteContent?.showAiChatCopyBtn !== false;

  // Extract quick action links if present in text
  const hasWhatsApp = /wa\.me|\+880\s*1\d|whatsapp/i.test(content);
  const hasAudit = /free-audit|audit|consultation|strategy call|booking/i.test(content);
  const waMatch = content.match(/https:\/\/wa\.me\/(\d+)/i) || content.match(/\+880\s*1[3-9]\d{2}[-\s]?\d{6}/);
  const waUrl = waMatch 
    ? (waMatch[0].startsWith("http") ? waMatch[0] : `https://wa.me/${waMatch[0].replace(/[^\d]/g, "")}`)
    : defaultWaUrl;

  const handleAuditClick = () => {
    if (auditBtnUrl.startsWith("http")) {
      window.open(auditBtnUrl, "_blank", "noopener,noreferrer");
    } else {
      const cleanRoute = auditBtnUrl.replace(/^\//, "");
      if (onNavigate) {
        onNavigate(cleanRoute);
      } else {
        window.location.href = auditBtnUrl;
      }
    }
  };

  const handleCopy = () => {
    // Strip markdown formatting for clean clipboard copy
    const plainText = content
      .replace(/[*#_~`]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
      <div className="markdown-content space-y-2 leading-relaxed">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p className="my-1.5 first:mt-0 last:mb-0 leading-relaxed text-gray-800 dark:text-gray-200">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-950 dark:text-white">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-600 dark:text-gray-400">
                {children}
              </em>
            ),
            h1: ({ children }) => (
              <h1 className="text-sm sm:text-base font-bold text-gray-950 dark:text-white mt-3 mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#FF2D2D] rounded-full inline-block" />
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xs sm:text-sm font-bold text-gray-950 dark:text-white mt-3 mb-1.5 flex items-center gap-2">
                <span className="w-1 h-3.5 bg-[#FF2D2D] rounded-full inline-block" />
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <div className="mt-3.5 mb-2 pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[#FF2D2D] rounded-full inline-block shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm text-gray-950 dark:text-white tracking-tight">
                  {children}
                </h3>
              </div>
            ),
            ul: ({ children }) => (
              <ul className="my-2.5 space-y-1.5 pl-0 list-none">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="my-2.5 space-y-1.5 pl-4 list-decimal text-gray-800 dark:text-gray-200">
                {children}
              </ol>
            ),
            li: ({ children }) => {
              // Analyze child elements to detect structured "Key: Value" lines
              let childArray = React.Children.toArray(children);
              // Unwrap if wrapped in <p> tag
              if (childArray.length === 1 && React.isValidElement(childArray[0]) && (childArray[0] as any).type === "p") {
                childArray = React.Children.toArray((childArray[0] as any).props.children);
              }

              let labelText = "";
              let valueText = "";
              let isKeyValue = false;

              if (childArray.length >= 1) {
                const firstChild: any = childArray[0];
                // Check if first child is strong
                if (React.isValidElement(firstChild) && (firstChild.type === "strong" || (firstChild.props as any)?.children)) {
                  const rawLabel = String((firstChild.props as any).children || "").trim();
                  if (rawLabel.endsWith(":") || rawLabel.endsWith(":-")) {
                    labelText = rawLabel.replace(/[:\-]+$/, "").trim();
                    valueText = childArray.slice(1).map(c => {
                      if (typeof c === "string") return c;
                      if (React.isValidElement(c)) return String((c.props as any)?.children || "");
                      return "";
                    }).join("").trim();
                    isKeyValue = true;
                  }
                }
              }

              // Fallback: check if single string contains ":"
              if (!isKeyValue && childArray.length === 1 && typeof childArray[0] === "string") {
                const parts = (childArray[0] as string).split(/:\s*(.*)/);
                if (parts.length >= 2 && parts[0].length < 50) {
                  labelText = parts[0].replace(/^\*+|\*+$/g, "").trim();
                  valueText = parts[1].trim();
                  isKeyValue = true;
                }
              }

              // If this is a structured Key-Value item
              if (isKeyValue && labelText && valueText) {
                const isTimeline = /business days|days|hours|weeks|month/i.test(valueText);
                const isPrice = /[৳$€£]|taka|bdt|usd/i.test(valueText);

                return (
                  <li className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 transition-colors my-1 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {getServiceIcon(labelText)}
                      <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {labelText}
                      </span>
                    </div>

                    {isTimeline ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[11px] sm:text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
                        <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                        {valueText}
                      </span>
                    ) : isPrice ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
                        {valueText}
                      </span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium">
                        {valueText}
                      </span>
                    )}
                  </li>
                );
              }

              // Standard bullet item
              return (
                <li className="flex items-start gap-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D2D] dark:bg-[#ff5a5a] mt-2 shrink-0" />
                  <div className="flex-1 leading-relaxed">
                    {children}
                  </div>
                </li>
              );
            },
            a: ({ href, children }) => {
              const isWa = href?.includes("wa.me") || href?.includes("whatsapp");
              const isAudit = href?.includes("free-audit") || href?.includes("audit") || href === auditBtnUrl;

              if (isWa) {
                const targetWaHref = href || defaultWaUrl;
                return (
                  <a
                    href={targetWaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366] font-semibold hover:bg-[#25D366]/20 transition-all text-xs border border-[#25D366]/30 my-0.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>{children || whatsAppBtnText}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                );
              }

              if (isAudit) {
                return (
                  <button
                    type="button"
                    onClick={handleAuditClick}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF2D2D]/10 text-[#FF2D2D] dark:text-[#ff6b6b] font-semibold hover:bg-[#FF2D2D]/20 transition-all text-xs border border-[#FF2D2D]/30 cursor-pointer my-0.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF2D2D]" />
                    <span>{children || auditBtnText}</span>
                    <ArrowRight className="w-3 h-3 opacity-70" />
                  </button>
                );
              }

              return (
                <a
                  href={href}
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-blue-600 dark:text-blue-400 font-medium underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {children}
                </a>
              );
            },
            table: ({ children }) => (
              <div className="overflow-x-auto my-3 rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left border-collapse text-xs">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold border-b border-gray-200 dark:border-gray-700">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="px-3 py-2 text-gray-700 dark:text-gray-300 font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                {children}
              </td>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-[#FF2D2D] pl-3 my-2 text-gray-600 dark:text-gray-400 italic bg-red-50/40 dark:bg-red-950/20 py-1.5 rounded-r-lg">
                {children}
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 font-mono text-[11px]">
                {children}
              </code>
            ),
          }}
        >
          {cleanedContent}
        </Markdown>
      </div>

      {/* Action Footer for AI assistant answers: Quick actions & Copy button */}
      <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {showWhatsAppBtn && (hasWhatsApp || content.toLowerCase().includes("contact") || content.toLowerCase().includes("support") || content.toLowerCase().includes("reach")) && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/30 transition-all shadow-2xs"
            >
              <MessageCircle className="w-3 h-3" />
              <span>{whatsAppBtnText}</span>
            </a>
          )}
          {showCtaBtn && (hasAudit || content.toLowerCase().includes("package") || content.toLowerCase().includes("deliverable") || content.toLowerCase().includes("timeline") || content.toLowerCase().includes("cost")) && (
            <button
              type="button"
              onClick={handleAuditClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#FF2D2D]/10 hover:bg-[#FF2D2D]/20 text-[#FF2D2D] dark:text-[#ff6b6b] border border-[#FF2D2D]/30 transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3 h-3" />
              <span>{auditBtnText}</span>
            </button>
          )}
        </div>

        {showCopyBtn && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-1.5 py-0.5 rounded cursor-pointer ml-auto"
            title="Copy response to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
