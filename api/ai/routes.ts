import { Express, Request, Response } from "express";
import { query, getSessionFromRequest, hasDatabaseUrl, signSessionToken } from "../index.js";
import { processUserMessage } from "./orchestrator.js";
import { indexDocument, reindexAllKnowledge, retrieveRelevantChunks } from "./ragEngine.js";
import { matchFaq } from "./faqMatcher.js";
import { getAIConfig, getAIService } from "./provider.js";

export function registerAiRoutes(app: Express) {
  // Helper for admin auth verification
  const requireAdmin = (req: Request, res: Response): boolean => {
    const session = getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: "Unauthorized. Admin session required." });
      return false;
    }
    return true;
  };

  // =========================================================================
  // USER APIS
  // =========================================================================

  // 0. User passwordless instant login & auto account creation (Email + WhatsApp)
  app.post(["/api/ai/user-auth", "/ai/user-auth", "/user-auth"], async (req: Request, res: Response) => {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const email = (body?.email || "").trim().toLowerCase();
      const whatsapp = (body?.whatsapp || "").trim();
      const name = (body?.name || "").trim();
      const sessionId = ((req.headers["x-session-id"] as string) || (body?.sessionId as string) || "").trim();

      if (!email || !email.includes("@")) {
        res.status(400).json({ error: "A valid email address is required." });
        return;
      }

      let targetUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let isNewUser = false;
      let userRole = "user";
      let resolvedName = name;
      let resolvedWhatsapp = whatsapp;

      if (hasDatabaseUrl()) {
        try {
          // Check if user already exists
          const existing = await query<{
            id: string;
            email: string;
            name: string | null;
            whatsapp: string | null;
            role: string;
          }>(
            "SELECT id, email, name, whatsapp, role FROM users WHERE LOWER(email) = LOWER($1)",
            [email]
          );

          if (existing.length > 0) {
            const user = existing[0];
            targetUserId = user.id;
            userRole = user.role || "user";
            resolvedName = name || user.name || "";
            resolvedWhatsapp = whatsapp || user.whatsapp || "";

            try {
              await query(
                `UPDATE users
                 SET whatsapp = COALESCE(NULLIF($1, ''), whatsapp),
                     name = COALESCE(NULLIF($2, ''), name),
                     last_login_at = NOW(),
                     updated_at = NOW()
                 WHERE id = $3`,
                [whatsapp || null, name || null, user.id]
              );
            } catch (updateErr) {
              console.warn("User update notice:", updateErr);
            }
          } else {
            isNewUser = true;
            await query(
              `INSERT INTO users (id, name, email, whatsapp, role, created_at, updated_at, last_login_at)
               VALUES ($1, $2, $3, $4, 'user', NOW(), NOW(), NOW())`,
              [targetUserId, name || null, email, whatsapp || null]
            );
          }

          // Automatically link any previous anonymous session conversations and tickets to this authenticated user
          if (sessionId) {
            try {
              await query(
                `UPDATE conversations
                 SET user_id = $1, user_email = $2, user_whatsapp = COALESCE(user_whatsapp, $3)
                 WHERE session_id = $4 AND (user_email IS NULL OR user_email = '')`,
                [targetUserId, email, whatsapp || null, sessionId]
              );
              await query(
                `UPDATE support_tickets
                 SET user_id = $1, user_email = $2, user_whatsapp = COALESCE(user_whatsapp, $3)
                 WHERE session_id = $4 AND (user_email IS NULL OR user_email = '')`,
                [targetUserId, email, whatsapp || null, sessionId]
              );
            } catch (linkErr) {
              console.warn("Session auto-linking warning:", linkErr);
            }
          }
        } catch (dbErr) {
          console.warn("User Auth database operation notice:", dbErr);
        }
      }

      const token = signSessionToken({ userId: targetUserId, email });
      res.status(isNewUser ? 201 : 200).json({
        ok: true,
        isNew: isNewUser,
        user: {
          id: targetUserId,
          email,
          name: resolvedName,
          whatsapp: resolvedWhatsapp,
          role: userRole,
        },
        token,
      });
    } catch (err: any) {
      console.error("User Auth error:", err);
      res.status(500).json({ error: err?.message || "Failed to process user authentication." });
    }
  });

  // 1. Chat with AI assistant
  app.post(["/api/ai/chat", "/ai/chat", "/api/chat"], async (req: Request, res: Response) => {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const message = (body?.message || "").trim();
      const conversationId = body?.conversationId;
      const sessionId = (body?.sessionId || (req.headers["x-session-id"] as string) || "").trim();
      const userEmail = (body?.userEmail || "").trim().toLowerCase();
      const userWhatsapp = (body?.userWhatsapp || "").trim();
      const userName = (body?.userName || "").trim();
      const userId = (body?.userId || "").trim();

      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      if (message.length > 1000) {
        res.status(400).json({ error: "Message exceeds maximum length of 1000 characters." });
        return;
      }

      if (!sessionId) {
        res.status(400).json({ error: "Session ID is required" });
        return;
      }

      const result = await processUserMessage({
        message,
        conversationId,
        sessionId,
        userId: userId || undefined,
        userEmail: userEmail || undefined,
        userWhatsapp: userWhatsapp || undefined,
        userName: userName || undefined,
      });

      res.status(200).json(result);
    } catch (err: any) {
      console.error("AI Chat API error:", err);
      res.status(500).json({ error: err?.message || "Internal server error processing chat." });
    }
  });

  // 2. Get specific conversation history with access check for user account
  app.get(["/api/ai/conversations/:id", "/ai/conversations/:id"], async (req: Request, res: Response) => {
    try {
      const convId = req.params.id;
      const sessionId = (req.headers["x-session-id"] as string) || "";
      const userEmail = ((req.query?.email as string) || "").trim().toLowerCase();
      const userId = ((req.query?.userId as string) || "").trim();

      const convRows = await query<{
        id: string;
        session_id: string;
        user_id: string | null;
        user_email: string | null;
      }>(
        "SELECT id, session_id, user_id, user_email FROM conversations WHERE id = $1",
        [convId]
      );

      if (convRows.length === 0) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      const conv = convRows[0];
      const adminSession = getSessionFromRequest(req);
      const isOwner =
        (userEmail && conv.user_email && userEmail.toLowerCase() === conv.user_email.toLowerCase()) ||
        (userId && conv.user_id === userId) ||
        (sessionId && conv.session_id === sessionId);

      if (!adminSession && !isOwner) {
        res.status(403).json({ error: "Forbidden: You do not have access to this conversation." });
        return;
      }

      const messages = await query(
        "SELECT id, role, content, source, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [convId]
      );

      res.status(200).json({
        conversation: conv,
        messages,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load conversation." });
    }
  });

  // 2.5 Get full active history (conversation + all messages) for a user account
  app.get(["/api/ai/user/history", "/ai/user/history"], async (req: Request, res: Response) => {
    try {
      const userEmail = ((req.query.email as string) || "").trim().toLowerCase();
      const userId = ((req.query.userId as string) || "").trim();
      const sessionId = ((req.headers["x-session-id"] as string) || (req.query.sessionId as string) || "").trim();

      if (!userEmail && !userId && !sessionId) {
        res.status(200).json({ conversation: null, messages: [] });
        return;
      }

      let convRows;
      if (userEmail || userId) {
        convRows = await query<{
          id: string;
          user_id: string | null;
          user_email: string | null;
          user_whatsapp: string | null;
          created_at: string;
          updated_at: string;
        }>(
          `SELECT id, user_id, user_email, user_whatsapp, created_at, updated_at
           FROM conversations
           WHERE (LOWER(user_email) = LOWER($1) AND $1 <> '')
              OR (user_id = $2 AND $2 <> '')
           ORDER BY updated_at DESC
           LIMIT 1`,
          [userEmail, userId]
        );
      } else {
        convRows = await query<{
          id: string;
          user_id: string | null;
          user_email: string | null;
          user_whatsapp: string | null;
          created_at: string;
          updated_at: string;
        }>(
          `SELECT id, user_id, user_email, user_whatsapp, created_at, updated_at
           FROM conversations
           WHERE session_id = $1 AND (user_email IS NULL OR user_email = '')
           ORDER BY updated_at DESC
           LIMIT 1`,
          [sessionId]
        );
      }

      if (convRows.length === 0) {
        res.status(200).json({ conversation: null, messages: [] });
        return;
      }

      const conv = convRows[0];
      const msgs = await query<{
        id: string;
        role: string;
        content: string;
        source: string;
        created_at: string;
      }>(
        `SELECT id, role, content, source, created_at
         FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC`,
        [conv.id]
      );

      res.status(200).json({
        conversation: conv,
        messages: msgs || [],
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load user history." });
    }
  });

  // 2.5 Get all past conversations for a user account
  app.get(["/api/ai/user/conversations", "/ai/user/conversations"], async (req: Request, res: Response) => {
    try {
      const userEmail = ((req.query.email as string) || "").trim().toLowerCase();
      const userId = ((req.query.userId as string) || "").trim();
      const sessionId = ((req.headers["x-session-id"] as string) || (req.query.sessionId as string) || "").trim();

      if (!userEmail && !userId && !sessionId) {
        res.status(400).json({ error: "Email, User ID, or Session ID required." });
        return;
      }

      const convs = await query<{
        id: string;
        user_id: string | null;
        user_email: string | null;
        created_at: string;
        updated_at: string;
      }>(
        `SELECT id, user_id, user_email, created_at, updated_at
         FROM conversations
         WHERE (LOWER(user_email) = LOWER($1) AND $1 <> '')
            OR (user_id = $2 AND $2 <> '')
            OR (session_id = $3 AND $3 <> '')
         ORDER BY updated_at DESC
         LIMIT 20`,
        [userEmail, userId, sessionId]
      );

      res.status(200).json({ conversations: convs || [] });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load user conversations." });
    }
  });

  // 3. User support tickets list (queries by user_id, user_email, or session_id)
  app.get(["/api/support/my-tickets", "/support/my-tickets", "/api/ai/tickets"], async (req: Request, res: Response) => {
    try {
      const sessionId = (req.headers["x-session-id"] as string) || (req.query?.sessionId as string) || "";
      const userEmail = ((req.query?.email as string) || "").trim().toLowerCase();
      const userId = ((req.query?.userId as string) || "").trim();
      const scope = (req.query?.scope as string) || (req.query?.all === "true" ? "all" : "");
      const adminSession = getSessionFromRequest(req);

      let tickets;
      if (scope === "all" && adminSession) {
        tickets = await query(
          `SELECT id, ticket_number, question, status, admin_answer, session_id, user_email, user_whatsapp, created_at, answered_at
           FROM support_tickets
           ORDER BY created_at DESC
           LIMIT 100`
        );
      } else if (userEmail || userId) {
        // Strictly filter by the specified user's email or user ID
        tickets = await query(
          `SELECT id, ticket_number, question, status, admin_answer, session_id, user_email, user_whatsapp, created_at, answered_at
           FROM support_tickets
           WHERE (LOWER(user_email) = LOWER($1) AND $1 <> '')
              OR (user_id = $2 AND $2 <> '')
           ORDER BY created_at DESC
           LIMIT 50`,
          [userEmail, userId]
        );
      } else if (sessionId) {
        // Anonymous visitor without an account, filter strictly by browser session
        tickets = await query(
          `SELECT id, ticket_number, question, status, admin_answer, session_id, user_email, user_whatsapp, created_at, answered_at
           FROM support_tickets
           WHERE (session_id = $1 AND $1 <> '')
           ORDER BY created_at DESC
           LIMIT 50`,
          [sessionId]
        );
      } else {
        tickets = [];
      }

      res.status(200).json({ tickets: tickets || [] });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load tickets." });
    }
  });

  // 4. Get specific support ticket by ID
  app.get(["/api/support/tickets/:id", "/support/tickets/:id"], async (req: Request, res: Response) => {
    try {
      const ticketId = req.params.id;
      const sessionId = req.headers["x-session-id"] as string;

      const rows = await query(
        `SELECT id, ticket_number, question, status, admin_answer, session_id, created_at, answered_at
         FROM support_tickets WHERE id = $1 OR ticket_number::text = $1`,
        [ticketId]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: "Ticket not found" });
        return;
      }

      const ticket = rows[0];
      const adminSession = getSessionFromRequest(req);
      if (!adminSession && sessionId && ticket.session_id && ticket.session_id !== sessionId) {
        res.status(403).json({ error: "Forbidden: You do not own this support ticket." });
        return;
      }

      res.status(200).json({ ticket });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load ticket." });
    }
  });

  // 5. Public FAQs list
  app.get(["/api/ai/faqs/public", "/ai/faqs/public"], async (_req: Request, res: Response) => {
    try {
      const rows = await query(
        `SELECT f.id, f.question, f.answer, f.category_id, COALESCE(f.show_in_browse, true) as show_in_browse,
                COALESCE(f.display_order, 0) as display_order, c.name as category_name
         FROM faqs f
         LEFT JOIN faq_categories c ON f.category_id = c.id
         WHERE f.status = 'published' AND COALESCE(f.show_in_browse, true) = true
         ORDER BY COALESCE(f.display_order, 0) ASC, f.created_at ASC`
      );
      res.status(200).json({ faqs: rows });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load FAQs." });
    }
  });

  // =========================================================================
  // ADMIN APIS: FAQ MANAGEMENT
  // =========================================================================

  app.get("/api/admin/ai/faqs", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const rows = await query(
        `SELECT f.id, f.category_id, f.question, f.answer, f.status,
                COALESCE(f.show_in_browse, true) as show_in_browse,
                COALESCE(f.display_order, 0) as display_order,
                f.created_by, f.created_at, f.updated_at,
                c.name as category_name
         FROM faqs f
         LEFT JOIN faq_categories c ON f.category_id = c.id
         ORDER BY COALESCE(f.display_order, 0) ASC, f.created_at DESC`
      );
      res.status(200).json({ faqs: rows });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch FAQs." });
    }
  });

  app.post("/api/admin/ai/faqs", async (req: Request, res: Response) => {
    const session = getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { question, answer, category_id, status = "published", show_in_browse = true, display_order = 0 } = body;

      if (!question || !answer) {
        res.status(400).json({ error: "Question and answer are required." });
        return;
      }

      const id = `faq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await query(
        `INSERT INTO faqs (id, category_id, question, answer, status, show_in_browse, display_order, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [id, category_id || null, question.trim(), answer.trim(), status, show_in_browse !== false, Number(display_order) || 0, session.email]
      );

      res.status(201).json({ ok: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create FAQ." });
    }
  });

  app.put("/api/admin/ai/faqs/:id", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { question, answer, category_id, status, show_in_browse, display_order } = body;

      await query(
        `UPDATE faqs
         SET question = COALESCE($1, question),
             answer = COALESCE($2, answer),
             category_id = CASE WHEN $3::text IS NOT NULL THEN $3 ELSE category_id END,
             status = COALESCE($4, status),
             show_in_browse = CASE WHEN $5::boolean IS NOT NULL THEN $5 ELSE show_in_browse END,
             display_order = CASE WHEN $6::int IS NOT NULL THEN $6 ELSE display_order END,
             updated_at = NOW()
         WHERE id = $7`,
        [
          question?.trim() || null,
          answer?.trim() || null,
          category_id !== undefined ? (category_id || null) : null,
          status || null,
          typeof show_in_browse === "boolean" ? show_in_browse : null,
          typeof display_order === "number" ? display_order : null,
          id
        ]
      );

      res.status(200).json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update FAQ." });
    }
  });

  app.post("/api/admin/ai/faqs/bulk-selection", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { selectedIds, show_in_browse } = body;
      if (!Array.isArray(selectedIds)) {
        res.status(400).json({ error: "selectedIds must be an array of string IDs." });
        return;
      }
      if (typeof show_in_browse === "boolean") {
        if (selectedIds.length > 0) {
          await query(
            "UPDATE faqs SET show_in_browse = $1, updated_at = NOW() WHERE id = ANY($2::text[])",
            [show_in_browse, selectedIds]
          );
        }
      } else {
        await query("UPDATE faqs SET show_in_browse = false, updated_at = NOW()");
        if (selectedIds.length > 0) {
          await query(
            "UPDATE faqs SET show_in_browse = true, updated_at = NOW() WHERE id = ANY($1::text[])",
            [selectedIds]
          );
        }
      }
      res.status(200).json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update bulk FAQ selection." });
    }
  });

  app.delete("/api/admin/ai/faqs/:id", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { id } = req.params;
      await query("DELETE FROM faqs WHERE id = $1", [id]);
      res.status(200).json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete FAQ." });
    }
  });

  // FAQ Categories
  app.get("/api/admin/ai/categories", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const rows = await query("SELECT * FROM faq_categories ORDER BY name ASC");
      res.status(200).json({ categories: rows });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch categories." });
    }
  });

  app.post("/api/admin/ai/categories", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const name = (body?.name || "").trim();
      if (!name) {
        res.status(400).json({ error: "Category name is required." });
        return;
      }
      const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await query(
        `INSERT INTO faq_categories (id, name, description, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, updated_at = NOW()`,
        [id, name, body?.description || null]
      );
      res.status(201).json({ ok: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create category." });
    }
  });

  app.delete("/api/admin/ai/categories/:id", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { id } = req.params;
      await query("DELETE FROM faq_categories WHERE id = $1", [id]);
      res.status(200).json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete category." });
    }
  });

  // Alias REST endpoints for /api/faqs and /api/faq-categories
  app.get("/api/faqs", async (req: Request, res: Response) => {
    try {
      const rows = await query(
        `SELECT f.id, f.category_id, f.question, f.answer, f.status,
                COALESCE(f.show_in_browse, true) as show_in_browse,
                COALESCE(f.display_order, 0) as display_order,
                f.created_by, f.created_at, f.updated_at,
                c.name as category_name
         FROM faqs f
         LEFT JOIN faq_categories c ON f.category_id = c.id
         ORDER BY COALESCE(f.display_order, 0) ASC, f.created_at DESC`
      );
      res.status(200).json({ faqs: rows, data: rows });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch FAQs." });
    }
  });

  app.get("/api/faq-categories", async (req: Request, res: Response) => {
    try {
      const rows = await query("SELECT * FROM faq_categories ORDER BY name ASC");
      res.status(200).json({ categories: rows, data: rows });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch categories." });
    }
  });

  // =========================================================================
  // ADMIN APIS: KNOWLEDGE MANAGEMENT & RAG
  // =========================================================================

  app.get("/api/admin/ai/knowledge", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const docs = await query(
        `SELECT d.id, d.title, d.content, d.status, d.created_by, d.created_at, d.updated_at,
                COUNT(c.id)::int as chunk_count
         FROM knowledge_documents d
         LEFT JOIN knowledge_chunks c ON d.id = c.document_id
         GROUP BY d.id
         ORDER BY d.created_at DESC`
      );
      res.status(200).json({ documents: docs });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch knowledge documents." });
    }
  });

  app.post("/api/admin/ai/knowledge", async (req: Request, res: Response) => {
    const session = getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const title = (body?.title || "").trim();
      const content = (body?.content || "").trim();
      const status = body?.status || "published";

      if (!title || !content) {
        res.status(400).json({ error: "Title and content are required." });
        return;
      }

      const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await query(
        `INSERT INTO knowledge_documents (id, title, content, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [id, title, content, status, session.email]
      );

      // Automatically index the document into vector chunks
      let chunkCount = 0;
      if (status === "published") {
        try {
          chunkCount = await indexDocument(id);
        } catch (indexErr) {
          console.error("Auto indexing error on create:", indexErr);
        }
      }

      res.status(201).json({ ok: true, id, chunkCount });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create knowledge document." });
    }
  });

  app.put("/api/admin/ai/knowledge/:id", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { title, content, status } = body;

      await query(
        `UPDATE knowledge_documents
         SET title = COALESCE($1, title),
             content = COALESCE($2, content),
             status = COALESCE($3, status),
             updated_at = NOW()
         WHERE id = $4`,
        [title?.trim(), content?.trim(), status, id]
      );

      // Re-index document chunks
      const chunkCount = await indexDocument(id);

      res.status(200).json({ ok: true, chunkCount });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update knowledge document." });
    }
  });

  app.delete("/api/admin/ai/knowledge/:id", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { id } = req.params;
      await query("DELETE FROM knowledge_documents WHERE id = $1", [id]);
      res.status(200).json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete knowledge document." });
    }
  });

  app.post("/api/admin/ai/knowledge/:id/reindex", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const chunkCount = await indexDocument(id);
      res.status(200).json({ ok: true, chunkCount });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to reindex document." });
    }
  });

  app.post("/api/admin/ai/knowledge/reindex-all", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const result = await reindexAllKnowledge();
      res.status(200).json({ ok: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to reindex all documents." });
    }
  });

  // =========================================================================
  // ADMIN APIS: SUPPORT TICKETS & LEARNING LOOP
  // =========================================================================

  app.get("/api/admin/ai/tickets", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const statusFilter = req.query.status as string;
      let sql = `SELECT id, ticket_number, session_id, conversation_id, question, status,
                        admin_answer, assigned_to, created_at, answered_at
                 FROM support_tickets`;
      const params: any[] = [];
      if (statusFilter && statusFilter !== "ALL") {
        sql += " WHERE status = $1";
        params.push(statusFilter);
      }
      sql += " ORDER BY created_at DESC";

      const rows = await query(sql, params);
      res.status(200).json({ tickets: rows });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch tickets." });
    }
  });

  app.get("/api/admin/ai/tickets/:id", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const rows = await query(
        `SELECT id, ticket_number, session_id, conversation_id, question, status,
                admin_answer, assigned_to, created_at, answered_at
         FROM support_tickets WHERE id = $1`,
        [id]
      );
      if (rows.length === 0) {
        res.status(404).json({ error: "Ticket not found" });
        return;
      }
      res.status(200).json({ ticket: rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load ticket." });
    }
  });

  // Admin answers ticket
  app.post("/api/admin/ai/tickets/:id/answer", async (req: Request, res: Response) => {
    const session = getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    try {
      const { id } = req.params;
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const answer = (body?.answer || "").trim();

      if (!answer) {
        res.status(400).json({ error: "Answer is required." });
        return;
      }

      await query(
        `UPDATE support_tickets
         SET admin_answer = $1,
             status = 'ANSWERED',
             assigned_to = $2,
             answered_at = NOW()
         WHERE id = $3`,
        [answer, session.email, id]
      );

      // Also append the answer as a message in the conversation if conversation_id exists
      const ticketRows = await query<{ conversation_id: string }>(
        "SELECT conversation_id FROM support_tickets WHERE id = $1",
        [id]
      );
      if (ticketRows[0]?.conversation_id) {
        const msgId = `msg_h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await query(
          `INSERT INTO messages (id, conversation_id, role, content, source, created_at)
           VALUES ($1, $2, 'assistant', $3, 'HUMAN', NOW())`,
          [msgId, ticketRows[0].conversation_id, answer]
        );
      }

      res.status(200).json({ ok: true, status: "ANSWERED" });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to answer ticket." });
    }
  });

  // Update ticket status
  app.post("/api/admin/ai/tickets/:id/status", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { status } = body;

      if (!["OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"].includes(status)) {
        res.status(400).json({ error: "Invalid status." });
        return;
      }

      await query("UPDATE support_tickets SET status = $1 WHERE id = $2", [status, id]);
      res.status(200).json({ ok: true, status });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update ticket status." });
    }
  });

  // Add ticket answer to AI Knowledge (The Learning Loop)
  app.post("/api/admin/ai/tickets/:id/add-to-knowledge", async (req: Request, res: Response) => {
    const session = getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    try {
      const { id } = req.params;
      const ticketRows = await query<{ question: string; admin_answer: string }>(
        "SELECT question, admin_answer FROM support_tickets WHERE id = $1",
        [id]
      );

      if (ticketRows.length === 0) {
        res.status(404).json({ error: "Ticket not found." });
        return;
      }

      const { question, admin_answer } = ticketRows[0];
      if (!admin_answer) {
        res.status(400).json({ error: "Cannot add to knowledge: Ticket has no admin answer yet." });
        return;
      }

      const docId = `doc_learn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const docTitle = `Support Q&A: ${question.length > 60 ? question.substring(0, 57) + "..." : question}`;
      const docContent = `Question: ${question}\n\nOfficial Answer: ${admin_answer}`;

      await query(
        `INSERT INTO knowledge_documents (id, title, content, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, 'published', $4, NOW(), NOW())`,
        [docId, docTitle, docContent, session.email]
      );

      // Index and embed into pgvector
      const chunkCount = await indexDocument(docId);

      // Also create a direct FAQ for exact keyword matching
      const faqId = `faq_learn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await query(
        `INSERT INTO faqs (id, question, answer, status, show_in_browse, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, 'published', true, $4, NOW(), NOW())`,
        [faqId, question, admin_answer, session.email]
      );

      res.status(200).json({
        ok: true,
        documentId: docId,
        faqId,
        chunkCount,
        message: "Answer successfully integrated into Neon pgvector knowledge base and FAQ!",
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to add answer to knowledge base." });
    }
  });

  // =========================================================================
  // ADMIN APIS: CONVERSATIONS
  // =========================================================================

  app.get("/api/admin/ai/conversations", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const rows = await query(
        `SELECT c.id, c.session_id, c.created_at, c.updated_at,
                COUNT(m.id)::int as message_count,
                (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at ASC LIMIT 1) as first_message
         FROM conversations c
         LEFT JOIN messages m ON c.id = m.conversation_id
         GROUP BY c.id
         ORDER BY c.updated_at DESC
         LIMIT 50`
      );
      res.status(200).json({ conversations: rows });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch conversations." });
    }
  });

  app.get("/api/admin/ai/conversations/:id", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const { id } = req.params;
      const conv = await query("SELECT * FROM conversations WHERE id = $1", [id]);
      if (conv.length === 0) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }
      const messages = await query(
        "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [id]
      );
      res.status(200).json({ conversation: conv[0], messages });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load conversation." });
    }
  });

  // =========================================================================
  // ADMIN APIS: SETTINGS & TESTING
  // =========================================================================

  app.get("/api/admin/ai/settings", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const config = getAIConfig();
      const hasDb = hasDatabaseUrl();

      // Check pgvector count
      let chunkCount = 0;
      let faqCount = 0;
      let docCount = 0;
      let ticketCount = 0;

      if (hasDb) {
        const cRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM knowledge_chunks");
        const fRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM faqs");
        const dRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM knowledge_documents");
        const tRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM support_tickets");

        chunkCount = parseInt(cRes[0]?.count || "0", 10);
        faqCount = parseInt(fRes[0]?.count || "0", 10);
        docCount = parseInt(dRes[0]?.count || "0", 10);
        ticketCount = parseInt(tRes[0]?.count || "0", 10);
      }

      res.status(200).json({
        provider: config.provider,
        model: config.model,
        embeddingModel: config.embeddingModel,
        hasApiKey: Boolean(config.apiKey),
        topK: parseInt(process.env.RAG_TOP_K || "4", 10),
        similarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || "0.60"),
        maxContextSize: parseInt(process.env.RAG_MAX_CONTEXT_SIZE || "4000", 10),
        dbConnected: hasDb,
        stats: {
          faqCount,
          docCount,
          chunkCount,
          ticketCount,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch settings." });
    }
  });

  // Sandbox testing endpoint for admin
  app.post("/api/admin/ai/test", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const queryText = (body?.query || "").trim();

      if (!queryText) {
        res.status(400).json({ error: "Query is required" });
        return;
      }

      // 1. FAQ test
      const faqMatch = await matchFaq(queryText);

      // 2. RAG test
      const chunks = await retrieveRelevantChunks(queryText);

      // 3. AI response test
      let aiResponse = "N/A";
      if (chunks.length > 0) {
        try {
          const aiService = getAIService();
          aiResponse = await aiService.generateAnswer({
            prompt: queryText,
            systemPrompt: "You are the official support assistant. Answer using only the approved knowledge base.",
            contextChunks: chunks.map((c) => c.content),
          });
        } catch (e: any) {
          aiResponse = `Error: ${e.message}`;
        }
      }

      res.status(200).json({
        query: queryText,
        faqMatch,
        retrievedChunks: chunks,
        aiResponse,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Test failed" });
    }
  });
}
