import React, { useState, useEffect, useMemo } from "react";
import {
  Bot, Sparkles, HelpCircle, FileText, LifeBuoy, Plus, Edit2, Trash2,
  Check, RefreshCw, AlertCircle, Search, ExternalLink, Database, Send,
  ArrowRight, ShieldCheck, Layers, BookOpen, Clock, CheckCircle2,
  Eye, EyeOff, CheckSquare, Square, Filter, SlidersHorizontal
} from "lucide-react";
import { FaqItem, FaqCategory, KnowledgeDocument, SupportTicket } from "../types";
import { jsonFetch } from "../lib/db";

interface AdminAiDashboardProps {
  initialSubTab?: "tickets" | "faqs" | "knowledge" | "sandbox" | "settings";
}

export default function AdminAiDashboard({ initialSubTab = "tickets" }: AdminAiDashboardProps = {}) {
  const [activeSubTab, setActiveSubTab] = useState<"tickets" | "faqs" | "knowledge" | "sandbox" | "settings">(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg("");
    setTimeout(() => setErrorMsg(""), 5000);
  };

  // 1. Settings & Stats State
  const [settings, setSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // 2. FAQs State
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null);
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category_id: "",
    status: "published" as "published" | "draft",
    show_in_browse: true,
    display_order: 0,
  });

  // FAQ Search, Filtering, and Multi-Selection
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [faqVisibilityFilter, setFaqVisibilityFilter] = useState<"all" | "selected" | "hidden">("all");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>("all");
  const [selectedFaqIds, setSelectedFaqIds] = useState<string[]>([]);
  const [togglingFaqId, setTogglingFaqId] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // 3. Knowledge Documents State
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Partial<KnowledgeDocument> | null>(null);
  const [docForm, setDocForm] = useState({
    title: "",
    content: "",
    status: "published" as "published" | "draft",
  });
  const [reindexingDocId, setReindexingDocId] = useState<string | null>(null);
  const [reindexingAll, setReindexingAll] = useState(false);

  // 4. Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState("ALL");
  const [answeringTicketId, setAnsweringTicketId] = useState<string | null>(null);
  const [ticketAnswerInput, setTicketAnswerInput] = useState("");
  const [addingToKnowledgeId, setAddingToKnowledgeId] = useState<string | null>(null);

  // 5. Sandbox Test State
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testingAi, setTestingAi] = useState(false);

  // Fetch Settings & Stats
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const data = await jsonFetch("/api/admin/ai/settings");
      setSettings(data);
    } catch (err: any) {
      console.warn("Failed to load AI settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Fetch FAQs & Categories
  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const [faqData, catData] = await Promise.all([
        jsonFetch("/api/admin/ai/faqs"),
        jsonFetch("/api/admin/ai/categories"),
      ]);
      setFaqs(faqData.faqs || []);
      setCategories(catData.categories || []);
    } catch (err: any) {
      triggerError("Failed to load FAQs.");
    } finally {
      setLoadingFaqs(false);
    }
  };

  // Fetch Knowledge Documents
  const fetchKnowledge = async () => {
    setLoadingDocs(true);
    try {
      const data = await jsonFetch("/api/admin/ai/knowledge");
      setKnowledgeDocs(data.documents || []);
    } catch (err: any) {
      triggerError("Failed to load knowledge documents.");
    } finally {
      setLoadingDocs(false);
    }
  };

  // Fetch Support Tickets
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const data = await jsonFetch(`/api/admin/ai/tickets?status=${ticketFilter}`);
      setTickets(data.tickets || []);
    } catch (err: any) {
      triggerError("Failed to load support tickets.");
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchFaqs();
    fetchKnowledge();
    fetchTickets();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [ticketFilter]);

  // Handle Toggle Browse Visibility for a single FAQ
  const handleToggleBrowseVisibility = async (faq: FaqItem) => {
    const newVisibility = faq.show_in_browse === false ? true : false;
    setTogglingFaqId(faq.id);

    // Optimistic UI update
    setFaqs((prev) =>
      prev.map((item) => (item.id === faq.id ? { ...item, show_in_browse: newVisibility } : item))
    );

    try {
      await jsonFetch(`/api/admin/ai/faqs/${faq.id}`, {
        method: "PUT",
        body: JSON.stringify({ show_in_browse: newVisibility }),
      });
      triggerSuccess(
        newVisibility
          ? "✓ Question selected & visible in public Browse FAQs!"
          : "Question hidden from public Browse FAQs (still indexed for AI)."
      );
      fetchSettings();
    } catch (err: any) {
      // Revert on failure
      setFaqs((prev) =>
        prev.map((item) => (item.id === faq.id ? { ...item, show_in_browse: !newVisibility } : item))
      );
      triggerError("Failed to update FAQ visibility.");
    } finally {
      setTogglingFaqId(null);
    }
  };

  // Handle Bulk Visibility update for selected FAQs
  const handleBulkVisibility = async (show: boolean) => {
    if (selectedFaqIds.length === 0) return;
    setBulkActionLoading(true);

    // Optimistic UI update
    setFaqs((prev) =>
      prev.map((item) =>
        selectedFaqIds.includes(item.id) ? { ...item, show_in_browse: show } : item
      )
    );

    try {
      await jsonFetch("/api/admin/ai/faqs/bulk-selection", {
        method: "POST",
        body: JSON.stringify({ selectedIds: selectedFaqIds, show_in_browse: show }),
      });
      triggerSuccess(
        show
          ? `✓ ${selectedFaqIds.length} FAQ(s) are now showing in public Browse FAQs!`
          : `${selectedFaqIds.length} FAQ(s) are now hidden from public Browse FAQs.`
      );
      setSelectedFaqIds([]);
      fetchFaqs();
      fetchSettings();
    } catch (err: any) {
      triggerError("Failed to update bulk selection.");
      fetchFaqs();
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Toggle selection checkbox for an FAQ
  const handleToggleSelectFaq = (id: string) => {
    setSelectedFaqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle Save New or Edited FAQ
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      triggerError("Question and answer are required.");
      return;
    }

    try {
      if (editingFaq?.id) {
        await jsonFetch(`/api/admin/ai/faqs/${editingFaq.id}`, {
          method: "PUT",
          body: JSON.stringify(faqForm),
        });
        triggerSuccess("FAQ updated successfully!");
      } else {
        await jsonFetch("/api/admin/ai/faqs", {
          method: "POST",
          body: JSON.stringify(faqForm),
        });
        triggerSuccess("New FAQ added successfully!");
      }

      setIsAddingFaq(false);
      setEditingFaq(null);
      setFaqForm({
        question: "",
        answer: "",
        category_id: "",
        status: "published",
        show_in_browse: true,
        display_order: 0,
      });
      fetchFaqs();
      fetchSettings();
    } catch (err: any) {
      triggerError(err.message || "Failed to save FAQ.");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await jsonFetch(`/api/admin/ai/faqs/${id}`, { method: "DELETE" });
      triggerSuccess("FAQ deleted.");
      fetchFaqs();
      fetchSettings();
    } catch (err: any) {
      triggerError(err.message || "Failed to delete FAQ.");
    }
  };

  // Handle Save New or Edited Knowledge Doc
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title.trim() || !docForm.content.trim()) {
      triggerError("Title and content are required.");
      return;
    }

    try {
      if (editingDoc?.id) {
        const data = await jsonFetch(`/api/admin/ai/knowledge/${editingDoc.id}`, {
          method: "PUT",
          body: JSON.stringify(docForm),
        });
        triggerSuccess(`Document updated and re-indexed into ${data.chunkCount || 0} vector chunks!`);
      } else {
        const data = await jsonFetch("/api/admin/ai/knowledge", {
          method: "POST",
          body: JSON.stringify(docForm),
        });
        triggerSuccess(`Document created and indexed into ${data.chunkCount || 0} vector chunks!`);
      }

      setIsAddingDoc(false);
      setEditingDoc(null);
      setDocForm({ title: "", content: "", status: "published" });
      fetchKnowledge();
      fetchSettings();
    } catch (err: any) {
      triggerError(err.message || "Failed to save knowledge document.");
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Delete this document and all its indexed vector chunks?")) return;
    try {
      await jsonFetch(`/api/admin/ai/knowledge/${id}`, { method: "DELETE" });
      triggerSuccess("Document and vector chunks deleted.");
      fetchKnowledge();
      fetchSettings();
    } catch (err: any) {
      triggerError(err.message || "Failed to delete document.");
    }
  };

  const handleReindexDoc = async (id: string) => {
    setReindexingDocId(id);
    try {
      const data = await jsonFetch(`/api/admin/ai/knowledge/${id}/reindex`, { method: "POST" });
      triggerSuccess(`Successfully generated ${data.chunkCount} vector embeddings in Neon!`);
      fetchKnowledge();
      fetchSettings();
    } catch (err: any) {
      triggerError(err.message || "Reindexing failed.");
    } finally {
      setReindexingDocId(null);
    }
  };

  const handleReindexAll = async () => {
    if (!confirm("Re-index all published knowledge documents into pgvector embeddings?")) return;
    setReindexingAll(true);
    try {
      const data = await jsonFetch("/api/admin/ai/knowledge/reindex-all", { method: "POST" });
      triggerSuccess(`Re-indexed ${data.totalDocs} documents into ${data.totalChunks} vector chunks!`);
      fetchKnowledge();
      fetchSettings();
    } catch (err: any) {
      triggerError(err.message || "Batch reindexing failed.");
    } finally {
      setReindexingAll(false);
    }
  };

  // Answer Support Ticket
  const handleAnswerTicket = async (ticketId: string) => {
    if (!ticketAnswerInput.trim()) {
      triggerError("Please type an answer for the user.");
      return;
    }
    try {
      await jsonFetch(`/api/admin/ai/tickets/${ticketId}/answer`, {
        method: "POST",
        body: JSON.stringify({ answer: ticketAnswerInput.trim() }),
      });
      triggerSuccess("Answer submitted! The user can now view it in their ticket view.");
      setAnsweringTicketId(null);
      setTicketAnswerInput("");
      fetchTickets();
      fetchSettings();
    } catch (err: any) {
      triggerError(err.message || "Failed to submit answer.");
    }
  };

  // The Learning Loop: Add Ticket Answer to AI Knowledge
  const handleAddToKnowledge = async (ticketId: string) => {
    setAddingToKnowledgeId(ticketId);
    try {
      const data = await jsonFetch(`/api/admin/ai/tickets/${ticketId}/add-to-knowledge`, {
        method: "POST",
      });
      triggerSuccess(
        `✓ Learning loop complete! Created knowledge document & published FAQ (${data.chunkCount} vector chunks). Future questions will be answered by AI!`
      );
      fetchKnowledge();
      fetchFaqs();
      fetchSettings();
    } catch (err: any) {
      triggerError(err.message || "Failed to add to knowledge.");
    } finally {
      setAddingToKnowledgeId(null);
    }
  };

  // Run Sandbox AI Test
  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim() || testingAi) return;
    setTestingAi(true);
    setTestResult(null);
    try {
      const data = await jsonFetch("/api/admin/ai/test", {
        method: "POST",
        body: JSON.stringify({ query: testQuery.trim() }),
      });
      setTestResult(data);
    } catch (err: any) {
      triggerError(err.message || "Sandbox test failed.");
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <div className="space-y-6 text-left" id="admin-ai-dashboard">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-[#101828] font-display">
              AI FAQ, RAG & Human Support Engine
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
              pgvector 3072D
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Grounded AI support system powered by Neon PostgreSQL vector search and automatic human fallback learning loop.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchSettings();
              fetchFaqs();
              fetchKnowledge();
              fetchTickets();
              triggerSuccess("Synced latest data from database.");
            }}
            className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl text-xs font-bold text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#F2E4E2] p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Open Tickets</span>
            <LifeBuoy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#101828]">
            {tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length}
          </div>
          <span className="text-[10px] text-gray-400">Awaiting human reply</span>
        </div>

        <div className="bg-white border border-[#F2E4E2] p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Published FAQs</span>
            <HelpCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-[#101828]">
            {faqs.filter((f) => f.status === "published").length}
          </div>
          <span className="text-[10px] text-gray-400">Direct answer matches</span>
        </div>

        <div className="bg-white border border-[#F2E4E2] p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">RAG Vector Chunks</span>
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-[#101828]">
            {settings?.stats?.chunkCount ?? 0}
          </div>
          <span className="text-[10px] text-gray-400">In Neon pgvector table</span>
        </div>

        <div className="bg-white border border-[#F2E4E2] p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Model</span>
            <Bot className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-black text-emerald-700 truncate">
            {settings?.model || "gemini-3.6-flash"}
          </div>
          <span className="text-[10px] text-gray-400">3072D Embeddings</span>
        </div>
      </div>

      {/* Sub-tab Pill Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("tickets")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "tickets"
              ? "bg-[#FF2D2D] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Support Tickets</span>
          {tickets.filter((t) => t.status === "OPEN").length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-white text-[#FF2D2D] rounded-full font-mono">
              {tickets.filter((t) => t.status === "OPEN").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("faqs")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "faqs"
              ? "bg-[#FF2D2D] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>FAQ Manager</span>
          <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-gray-200 text-gray-700 rounded-full font-mono">
            {faqs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("knowledge")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "knowledge"
              ? "bg-[#FF2D2D] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>RAG Knowledge Base</span>
          <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-gray-200 text-gray-700 rounded-full font-mono">
            {knowledgeDocs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("sandbox")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "sandbox"
              ? "bg-[#FF2D2D] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI & Vector Sandbox</span>
        </button>

        <button
          onClick={() => setActiveSubTab("settings")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "settings"
              ? "bg-[#FF2D2D] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Engine Config</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: SUPPORT TICKETS & LEARNING LOOP */}
      {/* ========================================================================= */}
      {activeSubTab === "tickets" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F2E4E2]">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Human Support Queue & AI Learning Loop
              </h3>
              <p className="text-[11px] text-gray-500">
                Tickets created automatically when user questions cannot be reliably answered. Answers can be turned into permanent AI knowledge with one click.
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              {["ALL", "OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setTicketFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    ticketFilter === st
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loadingTickets ? (
            <div className="text-center py-12 text-sm text-gray-400">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-gray-900">No Tickets in this Filter</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                All inquiries have been addressed, or no unanswerable questions have been submitted yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => {
                const isOpen = t.status === "OPEN" || t.status === "IN_PROGRESS";
                const isAnswering = answeringTicketId === t.id;

                return (
                  <div
                    key={t.id}
                    className="bg-white border border-[#F2E4E2] p-5 rounded-2xl shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">
                          Ticket #{t.ticket_number || t.ticketNumber || t.id}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(t.created_at).toLocaleString()}
                        </span>
                        {t.session_id && (
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            Session: {t.session_id.substring(0, 14)}...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            t.status === "ANSWERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "CLOSED"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        User Question
                      </span>
                      <p className="text-sm font-bold text-gray-900 leading-snug">
                        {t.question}
                      </p>
                    </div>

                    {/* Existing Admin Answer if any */}
                    {t.admin_answer && (
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Official Support Answer:
                          </span>
                          {t.answered_at && (
                            <span className="text-[10px] text-emerald-600">
                              {new Date(t.answered_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-900 whitespace-pre-wrap">
                          {t.admin_answer}
                        </p>
                      </div>
                    )}

                    {/* Answering Form if toggled */}
                    {isAnswering && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                        <label className="block text-xs font-bold text-gray-700">
                          Type Your Official Answer for this User:
                        </label>
                        <textarea
                          rows={3}
                          value={ticketAnswerInput}
                          onChange={(e) => setTicketAnswerInput(e.target.value)}
                          placeholder="Provide the verified, accurate answer that will be shown to the user on their ticket view..."
                          className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#FF2D2D] bg-white text-gray-900 resize-y"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAnsweringTicketId(null);
                              setTicketAnswerInput("");
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAnswerTicket(t.id)}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Answer</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <div>
                        {!isAnswering && (
                          <button
                            onClick={() => {
                              setAnsweringTicketId(t.id);
                              setTicketAnswerInput(t.admin_answer || "");
                            }}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{t.admin_answer ? "Edit Answer" : "Respond to Ticket"}</span>
                          </button>
                        )}
                      </div>

                      {/* THE LEARNING LOOP BUTTON */}
                      {t.admin_answer && (
                        <button
                          onClick={() => handleAddToKnowledge(t.id)}
                          disabled={addingToKnowledgeId === t.id}
                          className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {addingToKnowledgeId === t.id
                              ? "Indexing into pgvector..."
                              : "[Add Answer to AI Knowledge]"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: FAQ MANAGER & BROWSE SELECTION */}
      {/* ========================================================================= */}
      {activeSubTab === "faqs" && (() => {
        // Compute filtered FAQs and counts
        const inBrowseCount = faqs.filter((f) => f.show_in_browse !== false).length;
        const hiddenBrowseCount = faqs.filter((f) => f.show_in_browse === false).length;

        const filteredFaqs = faqs.filter((faq) => {
          // Search query matching
          if (faqSearchQuery.trim()) {
            const q = faqSearchQuery.toLowerCase();
            const matchesQ = faq.question.toLowerCase().includes(q);
            const matchesA = faq.answer.toLowerCase().includes(q);
            const matchesC = faq.category_name?.toLowerCase().includes(q);
            if (!matchesQ && !matchesA && !matchesC) return false;
          }

          // Visibility filter
          const isVisibleInBrowse = faq.show_in_browse !== false;
          if (faqVisibilityFilter === "selected" && !isVisibleInBrowse) return false;
          if (faqVisibilityFilter === "hidden" && isVisibleInBrowse) return false;

          // Category filter
          if (faqCategoryFilter !== "all" && faq.category_id !== faqCategoryFilter) {
            return false;
          }

          return true;
        });

        const isAllFilteredSelected =
          filteredFaqs.length > 0 &&
          filteredFaqs.every((f) => selectedFaqIds.includes(f.id));

        const handleSelectAllToggle = () => {
          if (isAllFilteredSelected) {
            const filteredIds = new Set(filteredFaqs.map((f) => f.id));
            setSelectedFaqIds((prev) => prev.filter((id) => !filteredIds.has(id)));
          } else {
            const allIds = new Set([...selectedFaqIds, ...filteredFaqs.map((f) => f.id)]);
            setSelectedFaqIds(Array.from(allIds));
          }
        };

        return (
          <div className="space-y-4">
            {/* Header & Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#F2E4E2] shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">FAQ Manager & Public Browse Selector</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select and curate the exact questions visible to customers in <strong>Browse FAQs</strong> and on the Homepage.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingFaq(null);
                    setFaqForm({
                      question: "",
                      answer: "",
                      category_id: categories[0]?.id || "",
                      status: "published",
                      show_in_browse: true,
                      display_order: 0,
                    });
                    setIsAddingFaq(true);
                  }}
                  id="btn-add-new-faq"
                  className="px-4 py-2 bg-[#FF2D2D] hover:bg-[#FF5757] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New FAQ</span>
                </button>
              </div>
            </div>

            {/* Public Visibility Info Banner */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50/90 to-blue-50/90 border border-emerald-200/80 rounded-2xl flex items-start gap-3 text-xs text-emerald-950">
              <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Eye className="w-4 h-4" />
              </div>
              <div className="flex-1 leading-relaxed">
                <span className="font-bold text-emerald-900">How Browse FAQs Selection Works:</span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Questions with the green <span className="font-semibold px-1.5 py-0.2 rounded bg-emerald-200/70 text-emerald-900">In Browse FAQs</span> status appear publicly under the <strong>Browse FAQs</strong> tab and homepage accordion. Clicking any item's visibility toggle instantly includes or hides it from the public view, while preserving it for the AI Assistant.
                </p>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#F2E4E2] space-y-3 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={faqSearchQuery}
                    onChange={(e) => setFaqSearchQuery(e.target.value)}
                    placeholder="Search FAQs by question, answer, or category..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FF2D2D] transition-colors"
                  />
                  {faqSearchQuery && (
                    <button
                      onClick={() => setFaqSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={faqCategoryFilter}
                      onChange={(e) => setFaqCategoryFilter(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-white outline-none focus:border-[#FF2D2D] cursor-pointer"
                    >
                      <option value="all">All Categories ({faqs.length})</option>
                      {categories.map((c) => {
                        const count = faqs.filter((f) => f.category_id === c.id).length;
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Visibility Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setFaqVisibilityFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      faqVisibilityFilter === "all"
                        ? "bg-gray-900 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span>All FAQs</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      faqVisibilityFilter === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                    }`}>
                      {faqs.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setFaqVisibilityFilter("selected")}
                    id="filter-faqs-selected"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      faqVisibilityFilter === "selected"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Selected for Browse FAQs</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      faqVisibilityFilter === "selected" ? "bg-white/20 text-white" : "bg-emerald-200 text-emerald-900"
                    }`}>
                      {inBrowseCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setFaqVisibilityFilter("hidden")}
                    id="filter-faqs-hidden"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      faqVisibilityFilter === "hidden"
                        ? "bg-gray-700 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                    <span>Hidden from Browse</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      faqVisibilityFilter === "hidden" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                    }`}>
                      {hiddenBrowseCount}
                    </span>
                  </button>
                </div>

                {/* Select / Deselect All for Filtered Results */}
                {filteredFaqs.length > 0 && (
                  <button
                    onClick={handleSelectAllToggle}
                    className="text-xs text-gray-500 hover:text-gray-900 font-semibold flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-gray-100"
                  >
                    {isAllFilteredSelected ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Deselect All ({filteredFaqs.length})</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-gray-400" />
                        <span>Select All ({filteredFaqs.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Selection Action Bar (Displays when items are checked) */}
            {selectedFaqIds.length > 0 && (
              <div className="bg-gray-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#FF2D2D] text-white text-xs font-bold flex items-center justify-center">
                    {selectedFaqIds.length}
                  </span>
                  <span className="text-xs font-bold">
                    {selectedFaqIds.length} question{selectedFaqIds.length > 1 ? "s" : ""} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkVisibility(true)}
                    disabled={bulkActionLoading}
                    id="btn-bulk-show-browse"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show in Browse FAQs</span>
                  </button>

                  <button
                    onClick={() => handleBulkVisibility(false)}
                    disabled={bulkActionLoading}
                    id="btn-bulk-hide-browse"
                    className="px-3 py-1.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide from Browse FAQs</span>
                  </button>

                  <button
                    onClick={() => setSelectedFaqIds([])}
                    className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-white cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Add / Edit FAQ Modal or Form */}
            {isAddingFaq && (
              <form onSubmit={handleSaveFaq} className="bg-white border border-[#F2E4E2] p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                    {editingFaq ? "Edit FAQ" : "Create New FAQ"}
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    {editingFaq ? "Editing ID: " + editingFaq.id : "New Entry"}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Question
                    </label>
                    <input
                      type="text"
                      required
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      placeholder="e.g., What is your refund policy?"
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#FF2D2D]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Category
                      </label>
                      <select
                        value={faqForm.category_id}
                        onChange={(e) => setFaqForm({ ...faqForm, category_id: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#FF2D2D] bg-white"
                      >
                        <option value="">General</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </label>
                      <select
                        value={faqForm.status}
                        onChange={(e) => setFaqForm({ ...faqForm, status: e.target.value as any })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#FF2D2D] bg-white"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Display Order / Priority
                      </label>
                      <input
                        type="number"
                        value={faqForm.display_order}
                        onChange={(e) => setFaqForm({ ...faqForm, display_order: parseInt(e.target.value, 10) || 0 })}
                        placeholder="0"
                        className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#FF2D2D]"
                      />
                    </div>
                  </div>

                  {/* Public Browse FAQs Toggle Switch */}
                  <div className="flex items-center justify-between p-3 bg-[#F0FDF4] border border-emerald-200 rounded-xl">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-950">Show in Public Browse FAQs</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        When enabled, customers can find and expand this question on the public Browse FAQs tab and Homepage.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={faqForm.show_in_browse}
                        onChange={(e) => setFaqForm({ ...faqForm, show_in_browse: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Answer (Approved Text)
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      placeholder="Provide the exact, complete, approved answer that the AI and users will see..."
                      className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#FF2D2D] resize-y"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFaq(false);
                      setEditingFaq(null);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#FF2D2D] hover:bg-[#FF5757] rounded-lg cursor-pointer shadow-xs"
                  >
                    {editingFaq ? "Update FAQ" : "Save FAQ"}
                  </button>
                </div>
              </form>
            )}

            {/* FAQs List Table */}
            <div className="bg-white border border-[#F2E4E2] rounded-2xl overflow-hidden shadow-xs">
              {loadingFaqs ? (
                <div className="text-center py-12 text-sm text-gray-400">Loading FAQs...</div>
              ) : filteredFaqs.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">
                  {faqSearchQuery || faqVisibilityFilter !== "all" || faqCategoryFilter !== "all"
                    ? "No FAQs match the selected filters."
                    : "No FAQs created yet. Click 'Add New FAQ' to create one."}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredFaqs.map((faq) => {
                    const isSelected = selectedFaqIds.includes(faq.id);
                    const isVisibleInBrowse = faq.show_in_browse !== false;
                    const isToggling = togglingFaqId === faq.id;

                    return (
                      <div
                        key={faq.id}
                        className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                          isSelected ? "bg-red-50/30" : "hover:bg-gray-50/50"
                        }`}
                      >
                        {/* Checkbox and Content */}
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectFaq(faq.id)}
                            className="mt-1 rounded text-[#FF2D2D] focus:ring-[#FF2D2D] w-4 h-4 cursor-pointer"
                          />

                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">{faq.question}</span>

                              {/* Status Badge */}
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                                  faq.status === "published"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                {faq.status}
                              </span>

                              {/* Category Badge */}
                              {faq.category_name && (
                                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                                  {faq.category_name}
                                </span>
                              )}

                              {/* Display Order if set */}
                              {typeof faq.display_order === "number" && faq.display_order !== 0 && (
                                <span className="text-[9px] text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.2 rounded font-mono">
                                  Order #{faq.display_order}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Toggle Button & Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                          {/* Visibility Switch Button */}
                          <button
                            onClick={() => handleToggleBrowseVisibility(faq)}
                            disabled={isToggling}
                            id={`btn-toggle-browse-${faq.id}`}
                            title={
                              isVisibleInBrowse
                                ? "Currently visible in Browse FAQs. Click to hide."
                                : "Currently hidden from Browse FAQs. Click to show."
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                              isVisibleInBrowse
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            {isToggling ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : isVisibleInBrowse ? (
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                            )}
                            <span>{isVisibleInBrowse ? "In Browse FAQs" : "Hidden"}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setEditingFaq(faq);
                              setFaqForm({
                                question: faq.question,
                                answer: faq.answer,
                                category_id: faq.category_id || "",
                                status: faq.status as any,
                                show_in_browse: faq.show_in_browse !== false,
                                display_order: faq.display_order || 0,
                              });
                              setIsAddingFaq(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            title="Edit FAQ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete FAQ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* SUBTAB 3: RAG KNOWLEDGE BASE */}
      {/* ========================================================================= */}
      {activeSubTab === "knowledge" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F2E4E2]">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                pgvector RAG Knowledge Documents
              </h3>
              <p className="text-[11px] text-gray-500">
                Documents are automatically chunked and transformed into 3072-dimensional vector embeddings in Neon.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReindexAll}
                disabled={reindexingAll}
                className="px-3 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reindexingAll ? "animate-spin" : ""}`} />
                <span>{reindexingAll ? "Reindexing All..." : "Reindex All Vectors"}</span>
              </button>
              <button
                onClick={() => {
                  setEditingDoc(null);
                  setDocForm({ title: "", content: "", status: "published" });
                  setIsAddingDoc(true);
                }}
                className="px-4 py-2 bg-[#FF2D2D] hover:bg-[#FF5757] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Knowledge Document</span>
              </button>
            </div>
          </div>

          {/* Add / Edit Doc Modal or Form */}
          {isAddingDoc && (
            <form onSubmit={handleSaveDoc} className="bg-white border border-[#F2E4E2] p-5 rounded-2xl shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                {editingDoc ? "Edit Knowledge Document" : "Create Knowledge Document"}
              </h4>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Document Title
                    </label>
                    <input
                      type="text"
                      required
                      value={docForm.title}
                      onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                      placeholder="e.g., Deliverables, Timelines, and Agency Guarantees"
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#FF2D2D]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={docForm.status}
                      onChange={(e) => setDocForm({ ...docForm, status: e.target.value as any })}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#FF2D2D] bg-white"
                    >
                      <option value="published">Published (Indexed for AI)</option>
                      <option value="draft">Draft (Not Indexed)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Content (Source Text for Chunking & Vectors)
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={docForm.content}
                    onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                    placeholder="Enter detailed agency knowledge, policy descriptions, workflow steps, pricing breakdowns..."
                    className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#FF2D2D] resize-y font-mono"
                  />
                  <span className="text-[10px] text-gray-400">
                    Text will be split into overlapping chunks and converted to vector embeddings via Gemini Embedding API.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingDoc(false);
                    setEditingDoc(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#FF2D2D] hover:bg-[#FF5757] rounded-lg cursor-pointer shadow-xs"
                >
                  Save & Index
                </button>
              </div>
            </form>
          )}

          {/* Knowledge Documents List */}
          <div className="space-y-3">
            {loadingDocs ? (
              <div className="text-center py-12 text-sm text-gray-400">Loading documents...</div>
            ) : knowledgeDocs.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">No knowledge documents yet.</div>
            ) : (
              knowledgeDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-[#F2E4E2] p-5 rounded-2xl shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{doc.title}</h4>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                          doc.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {doc.status}
                      </span>
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                        {doc.chunk_count || 0} chunks in pgvector
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReindexDoc(doc.id)}
                        disabled={reindexingDocId === doc.id}
                        className="px-2.5 py-1 text-[11px] font-bold border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${reindexingDocId === doc.id ? "animate-spin" : ""}`} />
                        <span>Re-index</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingDoc(doc);
                          setDocForm({
                            title: doc.title,
                            content: doc.content,
                            status: doc.status as any,
                          });
                          setIsAddingDoc(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                        title="Edit Document"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap font-sans">
                    {doc.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: AI & VECTOR SANDBOX */}
      {/* ========================================================================= */}
      {activeSubTab === "sandbox" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#F2E4E2] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Live AI & pgvector Cosine Distance Simulator
              </h3>
              <p className="text-[11px] text-gray-500">
                Test any question to see how the FAQ Matcher, Neon vector distance operator (<code className="bg-gray-100 px-1 py-0.5 rounded text-purple-700">&lt;=&gt;</code>), and Gemini generate the answer.
              </p>
            </div>

            <form onSubmit={handleRunTest} className="flex items-center gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Type a test query (e.g., 'What is your refund policy?' or 'Do you do TikTok video editing?')..."
                className="flex-1 p-3 border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:border-[#FF2D2D] bg-gray-50 text-gray-900"
              />
              <button
                type="submit"
                disabled={!testQuery.trim() || testingAi}
                className="px-5 py-3 bg-[#FF2D2D] hover:bg-[#FF5757] disabled:bg-gray-300 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>{testingAi ? "Querying..." : "Simulate Search"}</span>
              </button>
            </form>
          </div>

          {testResult && (
            <div className="space-y-4">
              {/* Step 1: FAQ Match */}
              <div className="bg-white p-4 rounded-2xl border border-[#F2E4E2] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    1. Direct FAQ Match Evaluation
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      testResult.faqMatch?.matched
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {testResult.faqMatch?.matched ? `MATCHED (${(testResult.faqMatch.score * 100).toFixed(0)}%)` : "NO DIRECT MATCH"}
                  </span>
                </div>
                {testResult.faqMatch?.matched ? (
                  <div className="p-3 bg-blue-50/60 rounded-xl text-xs text-blue-900 space-y-1">
                    <span className="font-bold">Matched: {testResult.faqMatch.question}</span>
                    <p>{testResult.faqMatch.answer}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Proceeding to RAG vector similarity search...</p>
                )}
              </div>

              {/* Step 2: pgvector Retrieved Chunks */}
              <div className="bg-white p-4 rounded-2xl border border-[#F2E4E2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-purple-500" />
                    2. Neon pgvector Cosine Search Results (Top Chunks)
                  </span>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    Found {testResult.retrievedChunks?.length || 0} chunks
                  </span>
                </div>

                {testResult.retrievedChunks?.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
                    No chunks exceeded the similarity threshold ({settings?.similarityThreshold || 0.60}). A human support ticket would be automatically triggered.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {testResult.retrievedChunks.map((chunk: any, i: number) => (
                      <div key={chunk.id || i} className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                          <span>Chunk #{i + 1}</span>
                          <span className="font-mono">Similarity: {(chunk.similarity * 100).toFixed(1)}%</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{chunk.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Final AI Generation */}
              <div className="bg-white p-4 rounded-2xl border border-[#F2E4E2] space-y-2">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-emerald-500" />
                  3. Final Answer Synthesized by {settings?.model || "Gemini"}
                </span>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {testResult.aiResponse}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: ENGINE CONFIGURATION */}
      {/* ========================================================================= */}
      {activeSubTab === "settings" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-[#F2E4E2] space-y-5">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Backend Architecture & Configuration
              </h3>
              <p className="text-[11px] text-gray-500">
                Configured securely on server environment variables to prevent API keys from leaking to client bundles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  AI Provider
                </span>
                <div className="text-sm font-bold text-gray-900">
                  {settings?.provider?.toUpperCase() || "GEMINI"}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  API Key Configured: {settings?.hasApiKey ? "Yes (Protected)" : "Default System Key"}
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Generation Model
                </span>
                <div className="text-sm font-bold text-gray-900">
                  {settings?.model || "gemini-3.6-flash"}
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  Env: AI_MODEL
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Embedding Model
                </span>
                <div className="text-sm font-bold text-gray-900">
                  {settings?.embeddingModel || "gemini-embedding-001"}
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  Vector Dimensions: 3072
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Neon PostgreSQL Vector Search
                </span>
                <div className="text-sm font-bold text-gray-900">
                  Top-K: {settings?.topK || 4} | Threshold: {settings?.similarityThreshold || 0.60}
                </div>
                <span className="text-[10px] text-purple-700 font-mono">
                  Extension: pgvector enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
