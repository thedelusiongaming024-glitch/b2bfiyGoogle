import React, { useState, useEffect, useRef } from "react";
import {
  HelpCircle, Bot, Send, User, Sparkles, AlertCircle, CheckCircle2,
  Clock, RefreshCw, MessageSquare, ArrowRight, ChevronDown, LifeBuoy,
  Mail, Phone, ShieldCheck, UserCheck, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SiteContent, FaqItem, ChatMessage, SupportTicket } from "../types";
import { useLanguage } from "../lib/LanguageContext";
import { getAdminToken, setAdminToken } from "../lib/db";

interface FAQProps {
  setRoute: (route: string) => void;
  siteContent: SiteContent;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  whatsapp?: string;
  role?: string;
  token?: string;
}

export function getOrCreateSessionId(): string {
  try {
    let sid = localStorage.getItem("b2bfiy_support_session_id");
    if (!sid) {
      sid = `sess_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      localStorage.setItem("b2bfiy_support_session_id", sid);
    }
    return sid;
  } catch {
    return `sess_fallback_${Date.now()}`;
  }
}

export default function FAQ({ setRoute, siteContent }: FAQProps) {
  const { t } = useLanguage();
  const sessionId = useRef<string>(getOrCreateSessionId()).current;

  // Active Main View: "assistant" | "browse" | "tickets"
  const [activeView, setActiveView] = useState<"assistant" | "browse" | "tickets">("assistant");

  // User Identification & Account State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("b2bfiy_user_profile");
      if (saved) return JSON.parse(saved);
    } catch {
      // safe fallback
    }
    return null;
  });

  // First-Time User Onboarding Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authWhatsapp, setAuthWhatsapp] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [pendingTextToSend, setPendingTextToSend] = useState<string | null>(null);

  // Chat State
  const [conversationId, setConversationId] = useState<string>(() => {
    try {
      return localStorage.getItem("b2bfiy_active_conv_id") || "";
    } catch {
      return "";
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("b2bfiy_active_conv_msgs");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: "welcome_msg",
        role: "assistant",
        content: `Hello! I'm the ${siteContent.brandName || "B2bfiy"} AI Support Assistant. I can answer questions about our web development, graphic design, video editing, monthly packages, pricing, timelines, and policies.\n\nHow can I help you today?`,
        source: "AI",
        created_at: new Date().toISOString(),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Ensure FAQ page always opens at the top when navigated to or refreshed
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // Tickets State
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [tokenRefreshedNotice, setTokenRefreshedNotice] = useState(false);

  // Browse Curated FAQs State
  const [publicFaqs, setPublicFaqs] = useState<FaqItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");
  const [activeFaqCategory, setActiveFaqCategory] = useState("All");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Save messages to cache whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("b2bfiy_active_conv_msgs", JSON.stringify(messages));
      if (conversationId) {
        localStorage.setItem("b2bfiy_active_conv_id", conversationId);
      }
    } catch (e) {
      console.warn("Could not cache chat messages:", e);
    }
  }, [messages, conversationId]);

  // Auto scroll only the internal chat box when user interacts
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (activeView === "assistant" && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isSending, activeView]);

  // Fetch tickets for current user or session
  const fetchTickets = async (overrideUser?: UserProfile | null) => {
    setLoadingTickets(true);
    const targetUser = overrideUser !== undefined ? overrideUser : currentUser;
    try {
      const activeSessionId = getOrCreateSessionId();
      const headers: Record<string, string> = { "x-session-id": activeSessionId };

      const params = new URLSearchParams();
      params.set("_t", Date.now().toString());
      if (targetUser?.email) {
        params.set("email", targetUser.email.trim().toLowerCase());
      }
      if (targetUser?.id) {
        params.set("userId", targetUser.id);
      }

      const res = await fetch(`/api/support/my-tickets?${params.toString()}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setMyTickets(data.tickets || []);
        setLastRefreshedAt(new Date());
        setTokenRefreshedNotice(true);
        setTimeout(() => setTokenRefreshedNotice(false), 3000);
      } else {
        setMyTickets([]);
      }
    } catch (err) {
      console.warn("Failed to load user tickets:", err);
      setMyTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Fetch full conversation history held by this user account in the database
  const fetchUserConversationHistory = async (overrideUser?: UserProfile | null) => {
    const targetUser = overrideUser !== undefined ? overrideUser : currentUser;
    try {
      const activeSessionId = getOrCreateSessionId();
      const params = new URLSearchParams();
      params.set("_t", Date.now().toString());
      if (targetUser?.email) {
        params.set("email", targetUser.email.trim().toLowerCase());
      }
      if (targetUser?.id) {
        params.set("userId", targetUser.id);
      }
      if (!targetUser) {
        params.set("sessionId", activeSessionId);
      }

      const res = await fetch(`/api/ai/user/history?${params.toString()}`, {
        headers: { "x-session-id": activeSessionId },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.conversation?.id) {
          setConversationId(data.conversation.id);
        } else {
          setConversationId("");
        }

        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([
            {
              id: `welcome_${Date.now()}`,
              role: "assistant",
              content: `Hello${targetUser?.name ? ` ${targetUser.name}` : ""}! I'm the ${siteContent.brandName || "B2bfiy"} AI Support Assistant. I can answer questions about our web development, graphic design, video editing, monthly packages, pricing, timelines, and policies.\n\nHow can I help you today?`,
              source: "AI",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (err) {
      console.warn("Failed to load conversation history from database:", err);
    }
  };

  // Fetch public curated FAQs
  const fetchPublicFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const res = await fetch("/api/ai/faqs/public");
      if (res.ok) {
        const data = await res.json();
        setPublicFaqs(data.faqs || []);
      }
    } catch (err) {
      console.warn("Failed to load public faqs:", err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  useEffect(() => {
    fetchTickets(currentUser);
    fetchUserConversationHistory(currentUser);
    fetchPublicFaqs();
  }, [currentUser?.email, currentUser?.id]);

  // Execute sending the chat message to server
  const executeSendMessage = async (textToSend: string, userToUse: UserProfile) => {
    setErrorMessage("");
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: "user",
      content: textToSend,
      source: "USER",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({
          message: textToSend,
          conversationId: conversationId || undefined,
          sessionId,
          userId: userToUse.id,
          userEmail: userToUse.email,
          userWhatsapp: userToUse.whatsapp,
          userName: userToUse.name,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to reach AI support service.");
      }

      const data = await res.json();

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: "assistant",
        content: data.answer,
        source: data.source || "AI",
        created_at: new Date().toISOString(),
        ticket: data.ticket || undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If a ticket was created, refresh tickets list
      if (data.ticket) {
        fetchTickets(userToUse);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Please check your connection.");
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: "assistant",
          content: "I'm having trouble connecting to the knowledge base right now. Please try again or reach our team directly via WhatsApp.",
          source: "SYSTEM",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Chat submit handler: Intercepts first-time users to collect Email & WhatsApp
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputMessage.trim();
    if (!cleanText || isSending) return;

    if (cleanText.length > 1000) {
      setErrorMessage(t("Please keep your question under 1,000 characters.", "প্রশ্নটি ১,০০০ অক্ষরের মধ্যে রাখুন।"));
      return;
    }

    // If user is not yet identified, show popup to collect email and WhatsApp
    if (!currentUser) {
      setPendingTextToSend(cleanText);
      setShowAuthModal(true);
      return;
    }

    setInputMessage("");
    await executeSendMessage(cleanText, currentUser);
  };

  // Submit Passwordless Onboarding Form
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanWhatsapp = authWhatsapp.trim();
    const cleanName = authName.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setAuthError(t("Please provide a valid email address.", "একটি সঠিক ইমেইল ঠিকানা দিন।"));
      return;
    }

    if (!cleanWhatsapp) {
      setAuthError(t("Please provide your WhatsApp number for support follow-up.", "সাপোর্ট আপডেটের জন্য হোয়াটসঅ্যাপ নম্বর দিন।"));
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      let data: any = {};
      try {
        const res = await fetch("/api/ai/user-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({
            email: cleanEmail,
            whatsapp: cleanWhatsapp,
            name: cleanName,
            sessionId,
          }),
        });

        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (fetchErr) {
        console.warn("User auth endpoint note:", fetchErr);
      }

      const authedUser: UserProfile = {
        id: data.user?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: data.user?.email || cleanEmail,
        name: data.user?.name || cleanName,
        whatsapp: data.user?.whatsapp || cleanWhatsapp,
        role: data.user?.role || "user",
        token: data.token,
      };

      setCurrentUser(authedUser);
      localStorage.setItem("b2bfiy_user_profile", JSON.stringify(authedUser));
      setShowAuthModal(false);

      // Immediately refresh support tickets for the newly authenticated account
      fetchTickets(authedUser);

      // Auto-dispatch pending message or load existing conversation
      const textToDispatch = pendingTextToSend || inputMessage.trim();
      if (textToDispatch) {
        setInputMessage("");
        setPendingTextToSend(null);
        await executeSendMessage(textToDispatch, authedUser);
      } else {
        fetchUserConversationHistory(authedUser);
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to link your account. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMyTickets([]);
    localStorage.removeItem("b2bfiy_user_profile");
    // Generate a fresh session ID so old tickets aren't attached to anonymous session
    const newSid = `sess_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    try {
      localStorage.setItem("b2bfiy_support_session_id", newSid);
    } catch {}
    handleClearChat();
    fetchTickets(null);
  };

  const handleSwitchAccount = () => {
    handleLogout();
    setAuthEmail("");
    setAuthWhatsapp("");
    setAuthName("");
    setAuthError("");
    setShowAuthModal(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setConversationId("");
    const initialGreeting: ChatMessage = {
      id: `welcome_${Date.now()}`,
      role: "assistant",
      content: `Hello! I'm the ${siteContent.brandName || "B2bfiy"} AI Support Assistant. Ask me anything about our services, pricing, deliverables, or policies.`,
      source: "AI",
      created_at: new Date().toISOString(),
    };
    setMessages([initialGreeting]);
    try {
      localStorage.removeItem("b2bfiy_active_conv_msgs");
      localStorage.removeItem("b2bfiy_active_conv_id");
    } catch {
      // safe
    }
  };

  // Categories for browse tab
  const browseCategories = ["All", ...Array.from(new Set(publicFaqs.map((f) => f.category_name || "General")))];

  const filteredFaqs = publicFaqs.filter((f) => {
    const matchesCat = activeFaqCategory === "All" || (f.category_name || "General") === activeFaqCategory;
    const matchesSearch =
      !faqSearch.trim() ||
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-transparent min-h-screen py-10 sm:py-16 text-left relative" id="faq-page-container">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs sm:text-sm font-bold text-[#FF2D2D] uppercase tracking-widest bg-[#FFE8E5] dark:bg-red-950/50 px-4 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {t("AI Support & FAQs", "এআই সাপোর্ট ও প্রশ্নোত্তর")}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#101828] dark:text-white tracking-tight font-display">
            {t("Ask Anything, Get Instant Answers")}
          </h1>
          <p className="text-[#475467] dark:text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
            {t(
              "Our AI Support Assistant answers instantly from verified agency knowledge. Enter your email & WhatsApp to instantly have our human support system !",
              "আমাদের এআই অ্যাসিস্ট্যান্ট ভেরিফাইড তথ্য থেকে তাৎক্ষণিক উত্তর দেবে।"
            )}
          </p>

          {/* User Account Bar */}
          <div className="flex items-center justify-center pt-1">
            {currentUser ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {t("Connected as", "সংযুক্ত একাউন্ট")}: <strong className="font-bold">{currentUser.email}</strong>
                  {currentUser.whatsapp ? ` (${currentUser.whatsapp})` : ""}
                </span>
                <button
                  onClick={handleSwitchAccount}
                  title="Switch Account"
                  className="ml-2 text-[10px] uppercase font-bold text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  {t("Switch", "পরিবর্তন")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 hover:border-[#FF2D2D] transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF2D2D]" />
                <span>{t("Instant Passwordless Sign-In (Email & WhatsApp)", "পাসওয়ার্ডবিহীন তাৎক্ষণিক লগইন")}</span>
              </button>
            )}
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center justify-center pt-2">
            <div className="inline-flex bg-gray-100 dark:bg-gray-800/90 p-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-inner">
              <button
                onClick={() => setActiveView("assistant")}
                id="view-tab-assistant"
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeView === "assistant"
                    ? "bg-[#FF2D2D] text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>{t("AI Assistant", "এআই অ্যাসিস্ট্যান্ট")}</span>
              </button>

              <button
                onClick={() => setActiveView("browse")}
                id="view-tab-browse"
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeView === "browse"
                    ? "bg-[#FF2D2D] text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>{t("Our Custom FAQs", "অনুমোদিত প্রশ্নোত্তর")}</span>
              </button>

              <button
                onClick={() => {
                  setActiveView("tickets");
                  fetchTickets();
                }}
                id="view-tab-tickets"
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeView === "tickets"
                    ? "bg-[#FF2D2D] text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                }`}
              >
                <LifeBuoy className="w-4 h-4" />
                <span>{t("Human Support", "আমার টিকেটসমূহ")}</span>
                {myTickets.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      activeView === "tickets" ? "bg-white text-[#FF2D2D]" : "bg-red-500 text-white"
                    }`}
                  >
                    {myTickets.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: AI CHAT ASSISTANT */}
        {activeView === "assistant" && (
          <div className="bg-white dark:bg-[#111827] border border-[#F2E4E2] dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[650px] sm:h-[700px]">
            
            {/* Chat Top Banner */}
            <div className="bg-gray-50/90 dark:bg-gray-900/80 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#FF2D2D] text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-[#101828] dark:text-white leading-tight">
                      {siteContent.brandName || "B2bfiy"} AI Support
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active RAG & Auto-Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {currentUser
                      ? `${t("Synced to your account", "একাউন্টে সংরক্ষিত")}: ${currentUser.email}`
                      : t("Grounded by our official agency knowledge")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  title={t("Start New Conversation")}
                  id="btn-clear-chat"
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("New Chat", "নতুন চ্যাট")}</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/40 dark:bg-[#0b0f17]">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser
                          ? "bg-[#101828] text-white dark:bg-white dark:text-[#101828]"
                          : "bg-[#FFE8E5] dark:bg-red-950/60 text-[#FF2D2D]"
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble Container */}
                    <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${isUser ? "text-right" : "text-left"}`}>
                      
                      {/* Bubble */}
                      <div
                        className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? "bg-[#FF2D2D] text-white rounded-tr-xs shadow-sm font-medium"
                            : "bg-white dark:bg-gray-800 text-[#101828] dark:text-gray-100 border border-[#F2E4E2] dark:border-gray-700 rounded-tl-xs shadow-sm"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Source & Metadata Badge */}
                      {!isUser && (
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 pl-1">
                          {msg.source === "FAQ" && (
                            <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                              <CheckCircle2 className="w-3 h-3" />
                              {t("Direct FAQ Answer", "ভেরিফাইড প্রশ্নোত্তর")}
                            </span>
                          )}
                          {msg.source === "RAG" && (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                              <Sparkles className="w-3 h-3" />
                              {t("Grounded in Knowledge Base", "ভেরিফাইড নলেজ বেইস")}
                            </span>
                          )}
                          {msg.source === "HUMAN" && (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                              <Clock className="w-3 h-3" />
                              {t("Human Support Request Filed", "সাপোর্ট টিকেট গৃহীত")}
                            </span>
                          )}
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      )}

                      {/* Ticket Card preview if ticket was created */}
                      {msg.ticket && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-left space-y-1.5 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              Ticket #{msg.ticket.ticketNumber}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                              {msg.ticket.status}
                            </span>
                          </div>
                          <p className="text-xs text-amber-900/80 dark:text-amber-300">
                            {t("Our staff will review this inquiry. You can track answers under the 'My Tickets' tab.")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing Loader */}
              {isSending && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFE8E5] dark:bg-red-950/60 text-[#FF2D2D] flex items-center justify-center text-xs font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-xs bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 shadow-sm flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#FF2D2D] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-[#FF2D2D] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-[#FF2D2D] animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                      {t("Consulting agency knowledge base...")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Prompts Pills */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 overflow-x-auto flex items-center gap-2 text-xs no-scrollbar">
              <span className="text-gray-400 font-bold shrink-0 text-[11px]">{t("Quick Questions:", "জনপ্রিয় প্রশ্ন:")}</span>
              {[
                "What is your refund policy?",
                "How long does website delivery take?",
                "Do you provide monthly retainer packages?",
                "How do revisions work for video editing?",
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!currentUser) {
                      setPendingTextToSend(suggestion);
                      setShowAuthModal(true);
                    } else {
                      setInputMessage("");
                      executeSendMessage(suggestion, currentUser);
                    }
                  }}
                  className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#FF2D2D] dark:hover:border-[#FF2D2D] rounded-full text-gray-600 dark:text-gray-300 hover:text-[#FF2D2D] transition-colors shrink-0 cursor-pointer text-[11px]"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="px-6 py-2 bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-800 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Text-Only Chat Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-[#F2E4E2] dark:border-gray-800"
            >
              <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 focus-within:border-[#FF2D2D] focus-within:ring-2 focus-within:ring-[#FF2D2D]/20 transition-all">
                <textarea
                  id="chat-input-textarea"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t(
                    "Type your question here (e.g., 'What is your refund policy?' or 'How long does a website take?')...",
                    "আপনার প্রশ্ন লিখুন (যেমন: রিফান্ড পলিসি কী? অথবা একটি ওয়েবসাইট তৈরি করতে কতদিন লাগে?)..."
                  )}
                  rows={2}
                  maxLength={1000}
                  className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-[#101828] dark:text-white resize-none placeholder-gray-400 px-2 py-1 max-h-32"
                />

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[9px] text-gray-400 font-mono">
                    {inputMessage.length}/1000
                  </span>
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending}
                    id="btn-send-message"
                    aria-label="Send message"
                    className="w-10 h-10 rounded-xl bg-[#FF2D2D] hover:bg-[#E02626] active:scale-95 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:opacity-60 text-white flex items-center justify-center transition-all duration-150 cursor-pointer disabled:cursor-not-allowed shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF2D2D]/40"
                  >
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 px-1">
                <span>{t("Press Enter to send, Shift+Enter for new line")}</span>
                <span>
                  {currentUser ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ {t("Stored in your account", " আপনার একাউন্টে সংরক্ষিত")}
                    </span>
                  ) : (
                    <span>{t("First question prompts instant account setup")}</span>
                  )}
                </span>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: BROWSE CURATED FAQS */}
        {activeView === "browse" && (
          <div className="space-y-6">
            {/* Search & Category Filter */}
            <div className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder={t("Search approved questions by keyword...", "প্রশ্ন খুঁজুন...")}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#FF2D2D] text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 text-[#101828] dark:text-white"
              />

              {browseCategories.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {browseCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveFaqCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                        activeFaqCategory === cat
                          ? "bg-[#FF2D2D] border-[#FF2D2D] text-white"
                          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#FF2D2D]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion list */}
            <div className="space-y-3">
              {loadingFaqs ? (
                <div className="text-center py-12 text-sm text-gray-400">Loading approved FAQs...</div>
              ) : filteredFaqs.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 text-sm">
                  {t("No FAQs found matching your criteria. Try asking the AI Assistant directly!", "কোনো প্রশ্নোত্তর মেলেনি। এআই অ্যাসিস্ট্যান্টকে সরাসরি জিজ্ঞাসা করুন!")}
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer"
                      >
                        <span className="text-sm sm:text-base font-bold text-[#101828] dark:text-white">
                          {faq.question}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          className="shrink-0 w-7 h-7 rounded-full bg-[#FFF7F5] dark:bg-gray-900 border border-[#F2E4E2] dark:border-gray-700 flex items-center justify-center text-[#FF2D2D]"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-gray-100 dark:border-gray-700/60"
                          >
                            <div className="p-6 text-xs sm:text-sm text-[#475467] dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {faq.answer}
                            </div>
                            <div className="px-6 pb-4 flex items-center justify-end">
                              <button
                                onClick={() => {
                                  setActiveView("assistant");
                                  if (!currentUser) {
                                    setPendingTextToSend(faq.question);
                                    setShowAuthModal(true);
                                  } else {
                                    setInputMessage("");
                                    executeSendMessage(faq.question, currentUser);
                                  }
                                }}
                                className="text-xs font-bold text-[#FF2D2D] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>{t("Ask AI more about this", "এআই-এর কাছে আরও জানুন")}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MY TICKETS TRACKER */}
        {activeView === "tickets" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-[#F2E4E2] dark:border-gray-700 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#101828] dark:text-white">
                    {t("Your Support Requests", "আপনার সাপোর্ট টিকেটসমূহ")}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#FF2D2D]">
                    {myTickets.length}
                  </span>
                  {tokenRefreshedNotice && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 animate-in fade-in flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t("Support & Request refreshed", "টোকেন ও টিকেট আপডেট হয়েছে")}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {currentUser
                    ? `${t("Showing Request linked to", "সংযুক্ত একাউন্ট")}: ${currentUser.email}`
                    : t("When the AI cannot find verified knowledge, a Request is filed here for our human team.")}
                </p>
                {lastRefreshedAt && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {t("Last updated", "সর্বশেষ আপডেট")}: {lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => fetchTickets()}
                  id="btn-refresh-tickets"
                  disabled={loadingTickets}
                  title="Click to refresh all tickets"
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 flex items-center gap-2 cursor-pointer shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#FF2D2D] ${loadingTickets ? "animate-spin" : ""}`} />
                  <span>{loadingTickets ? t("Refreshing...", "আপডেট হচ্ছে...") : t("Refresh Request", "রিফ্রেশ করুন")}</span>
                </button>
              </div>
            </div>

            {loadingTickets ? (
              <div className="text-center py-12 text-sm text-gray-400">Checking Request status...</div>
            ) : myTickets.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {t("No Pending Support Tickets")}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {t("Whenever an unknown question requires human support, it will appear here with live answers.")}
                </p>
                <button
                  onClick={() => setActiveView("assistant")}
                  className="px-4 py-2 bg-[#FF2D2D] text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm hover:bg-[#FF5757]"
                >
                  {t("Ask AI Assistant", "এআই-এর কাছে প্রশ্ন করুন")}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myTickets.map((ticket) => {
                  const isAnswered = ticket.status === "ANSWERED";
                  return (
                    <div
                      key={ticket.id}
                      className={`p-6 bg-white dark:bg-gray-800 border rounded-2xl shadow-sm space-y-4 ${
                        isAnswered
                          ? "border-emerald-200 dark:border-emerald-800"
                          : "border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900 dark:text-white">
                            Ticket #{ticket.ticket_number || ticket.ticketNumber || ticket.id}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            ticket.status === "ANSWERED"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : ticket.status === "IN_PROGRESS"
                              ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {t("Your Question:")}
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {ticket.question}
                        </p>
                      </div>

                      {ticket.admin_answer ? (
                        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{t("Official Human Support Answer:")}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">
                            {ticket.admin_answer}
                          </p>
                          {ticket.answered_at && (
                            <span className="block text-[10px] text-emerald-600/70 pt-1">
                              Answered on {new Date(ticket.answered_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                          <Clock className="w-4 h-4 shrink-0 animate-spin" />
                          <span>
                            {t("Under review by our support team. We usually respond within 24 hours.")}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Direct Contact CTA */}
        <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {t("Need urgent help or direct project consultation?", "জরুরি সহায়তা বা সরাসরি প্রজেক্ট আলোচনার জন্য যোগাযোগ করুন:")}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setRoute("contact")}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#101828] hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-[#101828] text-xs sm:text-sm font-bold rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <span>{t("Contact Us", "যোগাযোগ করুন")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {siteContent.socials?.whatsapp && (
              <a
                href={siteContent.socials.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold rounded-full shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

      </div>

      {/* First-Time User Identification Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative text-left"
            >
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setPendingTextToSend(null);
                }}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FFE8E5] dark:bg-red-950/60 text-[#FF2D2D] flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#101828] dark:text-white tracking-tight">
                  {t("Welcome to AI Support", "এআই সাপোর্টে স্বাগতম")}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(
                    "Please enter your Email and WhatsApp number. For further Questions .",
                    "আপনার ইমেইল ও হোয়াটসঅ্যাপ নম্বর দিন। কোনো পাসওয়ার্ড ছাড়াই তাৎক্ষণিক একাউন্ট সংযুক্ত হবে এবং সব কথোপকথন ও টিকেট ডাটাবেজে সংরক্ষিত থাকবে।"
                  )}
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#FF2D2D]" />
                    <span>{t("Email Address", "ইমেইল এড্রেস")} <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF2D2D]/40 focus:border-[#FF2D2D]"
                  />
                  <span className="text-[10px] text-gray-400">
                    {t("Existing email logs in instantly; new email creates your account.")}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>{t("WhatsApp Number +880-", "হোয়াটসঅ্যাপ নম্বর +880-")} <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={authWhatsapp}
                    onChange={(e) => setAuthWhatsapp(e.target.value)}
                    placeholder="+8801XXXXXXXXX or +1XXXXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF2D2D]/40 focus:border-[#FF2D2D]"
                  />
                  <span className="text-[10px] text-gray-400">
                    {t("Used for human ticket follow-ups and direct support.")}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{t("Your Name (Optional)", "আপনার নাম (ঐচ্ছিক)")}</span>
                  </label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Arko"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF2D2D]/40 focus:border-[#FF2D2D]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authLoading || !authEmail.trim() || !authWhatsapp.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-[#FF2D2D] hover:bg-[#E02626] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {authLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{authLoading ? t("Linking Account...", "সংযুক্ত হচ্ছে...") : t("Continue to AI Assistant", "এআই অ্যাসিস্ট্যান্ট শুরু করুন")}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
