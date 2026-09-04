import { SiteContent, PortfolioProject, ServicePackage, MediaItem, Lead } from "../types";

// -----------------------------------------------------------------
// Neon Postgres has no client-safe SDK (unlike Supabase's anon-key + RLS
// model) — a raw Postgres connection string is a full credential, so it can
// only ever live on the server. Every function below talks to our own
// /api/* routes instead, which are the only code that imports `pg` /
// api/db.ts. See api/db.ts, api/content.ts, api/portfolios.ts,
// api/packages.ts, api/media.ts, api/leads.ts, and api/admin/*.ts.
// -----------------------------------------------------------------

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem("b2bfiy_admin_token");
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem("b2bfiy_admin_token", token);
    } else {
      localStorage.removeItem("b2bfiy_admin_token");
    }
  } catch {}
}

export async function jsonFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["X-Admin-Token"] = token;
  }

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `Request to ${url} failed (${res.status})`);
  }
  return body as T;
}

// -----------------------------------------------------------------
// DATABASE CONNECTION STATUS
// -----------------------------------------------------------------
// The database connection itself is configured entirely server-side (the
// DATABASE_URL env var in Vercel) — there's no browser-side URL/key to save,
// unlike the old Supabase setup. This just checks whether the server can
// currently reach Neon.

export async function getDbStatus(): Promise<{ configured: boolean; connected: boolean }> {
  try {
    const res = await jsonFetch<{ dbConfigured: boolean; dbConnected: boolean }>("/api/health");
    return { configured: res.dbConfigured, connected: res.dbConnected };
  } catch {
    return { configured: false, connected: false };
  }
}

export function getNeonSQLScript(): string {
  return `-- B2BFIY - DATABASE SCHEMA FOR NEON POSTGRES
-- Paste this into the Neon SQL Editor (Neon Console -> your project -> SQL Editor)
-- and click "Run" to create all tables.
--
-- SECURITY MODEL:
--   Neon is plain Postgres with no built-in RLS-backed public API, so all
--   access control now lives in the API routes under /api (see
--   api/adminAuth.ts), not in SQL policies. Only the server (holding
--   DATABASE_URL) ever talks to this database directly.
--
--   Admin login is a real email + bcrypt-hashed password stored in
--   admin_users, issued as an HttpOnly JWT cookie. The very first successful
--   login bootstraps that row from the ADMIN_EMAIL / ADMIN_PASSWORD server
--   env vars, so set those once in Vercel before your first sign-in.

CREATE TABLE IF NOT EXISTS site_content (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_items (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    full_name TEXT NOT NULL,
    business_name TEXT,
    email TEXT,
    whatsapp_number TEXT,
    website_url TEXT,
    service_needed TEXT,
    message TEXT,
    submitted_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    event_name TEXT NOT NULL,
    ts TIMESTAMPTZ NOT NULL,
    url TEXT,
    client_id TEXT,
    client_ip TEXT,
    user_agent TEXT,
    params JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS analytics_events_ts_idx ON analytics_events (ts);

CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;
}

// -----------------------------------------------------------------
// ADMIN AUTHENTICATION (custom JWT cookie session, replaces Supabase Auth)
// -----------------------------------------------------------------
// Create the first admin account by setting ADMIN_EMAIL + ADMIN_PASSWORD as
// server env vars, then signing in once at /admin — that first login
// bootstraps the admin_users row. See api/adminAuth.ts.

export interface AdminSession {
  userId: string;
  email: string | null;
}

export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  const data = await jsonFetch<{ userId: string; email: string; token?: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    setAdminToken(data.token);
  }
  return { userId: data.userId, email: data.email };
}

export async function signOutAdmin(): Promise<void> {
  setAdminToken(null);
  try {
    await jsonFetch("/api/admin/logout", { method: "POST" });
  } catch (e) {
    console.warn("Sign out request failed:", e);
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const data = await jsonFetch<{ session: AdminSession | null; token?: string }>("/api/admin/session");
    if (data.token) {
      setAdminToken(data.token);
    }
    return data.session;
  } catch {
    return null;
  }
}

// There's no cross-tab push channel without a third-party auth SDK, so we
// use a localStorage "ping" that other tabs pick up via the `storage` event
// and re-check their session from the server.
const SESSION_PING_KEY = "b2bfiy_admin_session_ping";

export function notifyAdminAuthChanged(): void {
  try {
    localStorage.setItem(SESSION_PING_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function onAdminAuthStateChange(callback: (session: AdminSession | null) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === SESSION_PING_KEY) {
      getAdminSession().then(callback);
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  await jsonFetch("/api/admin/password", {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

// -----------------------------------------------------------------
// SYNC ACTIONS WITH NEON (via /api routes)
// -----------------------------------------------------------------

export async function fetchAllDataFromDb() {
  try {
    const [siteRes, portfolioRes, packageRes, mediaRes, leadRes] = await Promise.all([
      jsonFetch<{ data: SiteContent | null }>("/api/content").catch(() => ({ data: null })),
      jsonFetch<{ data: PortfolioProject[] }>("/api/portfolios").catch(() => ({ data: null })),
      jsonFetch<{ data: ServicePackage[] }>("/api/packages").catch(() => ({ data: null })),
      jsonFetch<{ data: MediaItem[] }>("/api/media").catch(() => ({ data: null })),
      jsonFetch<{ data: Lead[] }>("/api/leads").catch(() => ({ data: null })), // 401s silently for non-admins
    ]);

    return {
      siteContent: siteRes.data ?? null,
      portfolios: (portfolioRes as any).data ?? null,
      packages: (packageRes as any).data ?? null,
      mediaItems: (mediaRes as any).data ?? null,
      leads: (leadRes as any).data ?? null,
    };
  } catch (error) {
    console.error("Error fetching data from Neon:", error);
    return null;
  }
}

export async function saveSiteContentToDb(content: SiteContent): Promise<boolean> {
  try {
    await jsonFetch("/api/content", { method: "PUT", body: JSON.stringify(content) });
    return true;
  } catch (e: any) {
    if (e?.message?.includes("Not signed in")) {
      // Normal when guest/anonymous visits or updates local state without admin session
      return false;
    }
    console.warn("Could not sync site_content to Neon:", e?.message || e);
    return false;
  }
}

export async function syncPortfoliosToDb(items: PortfolioProject[]): Promise<boolean> {
  try {
    await jsonFetch("/api/portfolios", { method: "PUT", body: JSON.stringify(items) });
    return true;
  } catch (e: any) {
    if (e?.message?.includes("Not signed in")) {
      return false;
    }
    console.warn("Could not sync portfolios to Neon:", e?.message || e);
    return false;
  }
}

export async function syncPackagesToDb(items: ServicePackage[]): Promise<boolean> {
  try {
    await jsonFetch("/api/packages", { method: "PUT", body: JSON.stringify(items) });
    return true;
  } catch (e: any) {
    if (e?.message?.includes("Not signed in")) {
      return false;
    }
    console.warn("Could not sync packages to Neon:", e?.message || e);
    return false;
  }
}

export async function syncMediaItemsToDb(items: MediaItem[]): Promise<boolean> {
  try {
    await jsonFetch("/api/media", { method: "PUT", body: JSON.stringify(items) });
    return true;
  } catch (e: any) {
    if (e?.message?.includes("Not signed in")) {
      return false;
    }
    console.warn("Could not sync media items to Neon:", e?.message || e);
    return false;
  }
}

export async function saveLeadToDb(lead: Lead): Promise<boolean> {
  try {
    await jsonFetch("/api/leads", { method: "POST", body: JSON.stringify(lead) });
    return true;
  } catch (e) {
    console.error("Error saving lead to Neon:", e);
    return false;
  }
}

export async function fetchLeadsFromDb(): Promise<Lead[]> {
  try {
    const res = await jsonFetch<{ data: Lead[] }>("/api/leads");
    return Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.warn("Could not fetch leads from database:", e);
    return [];
  }
}

export async function deleteLeadFromDb(leadId: string): Promise<boolean> {
  try {
    await jsonFetch(`/api/leads?id=${encodeURIComponent(leadId)}`, { method: "DELETE" });
    return true;
  } catch (e) {
    console.error("Error deleting lead from Neon:", e);
    return false;
  }
}

export async function pushAllLocalDataToDb(
  siteContent: SiteContent,
  portfolios: PortfolioProject[],
  packages: ServicePackage[],
  mediaItems: MediaItem[]
): Promise<{ success: boolean; message: string }> {
  try {
    const [siteOk, portfolioOk, packageOk, mediaOk] = await Promise.all([
      saveSiteContentToDb(siteContent),
      syncPortfoliosToDb(portfolios),
      syncPackagesToDb(packages),
      syncMediaItemsToDb(mediaItems),
    ]);

    if (siteOk && portfolioOk && packageOk && mediaOk) {
      return { success: true, message: "Successfully synced all active settings, portfolios, packages, and media to Neon!" };
    }
    return { success: false, message: "Partial sync completed. One or more tables rejected the write. Verify your DATABASE_URL and that the schema has been run." };
  } catch (err: any) {
    console.error("Error pushing local state to Neon:", err);
    return { success: false, message: `Push failed: ${err.message || err}` };
  }
}
