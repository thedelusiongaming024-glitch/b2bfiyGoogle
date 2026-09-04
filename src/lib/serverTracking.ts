// Dispatches a tracking event both client-side (Meta Pixel, if loaded) and
// server-side (via /api/track -> Meta Conversions API + GA4 Measurement
// Protocol). Using the same event_id on both the client fbq() call and the
// server-side CAPI call lets Meta deduplicate the two, which is required
// when running Pixel + Conversions API together.
//
// Google Ads is not called directly here - see api/track.ts for why.

const GA4_CLIENT_ID_KEY = "b2bfiy_ga4_client_id";

function getOrCreateGa4ClientId(): string {
  if (typeof window === "undefined") return "";
  try {
    let clientId = window.localStorage.getItem(GA4_CLIENT_ID_KEY);
    if (!clientId) {
      clientId = `${Date.now()}.${Math.round(Math.random() * 1e9)}`;
      window.localStorage.setItem(GA4_CLIENT_ID_KEY, clientId);
    }
    return clientId;
  } catch {
    return `${Date.now()}.${Math.round(Math.random() * 1e9)}`;
  }
}

function generateEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export interface TrackEventOptions {
  pixelId?: string;
  userData?: { email?: string; phone?: string };
  params?: Record<string, unknown>;
}

/**
 * Fire a tracking event through both the client-side Meta Pixel and the
 * server-side tracking endpoint (Meta CAPI + GA4). Safe to call even if
 * no Pixel ID / server env vars are configured yet - each side just skips
 * itself.
 */
export function trackEvent(eventName: string, options: TrackEventOptions = {}): void {
  if (typeof window === "undefined") return;

  const eventId = generateEventId();

  // 1. Client-side Meta Pixel (if the snippet has been initialized).
  const fbq = (window as any).fbq;
  if (typeof fbq === "function") {
    try {
      fbq("track", eventName, {}, { eventID: eventId });
    } catch (e) {
      console.warn("Meta Pixel client-side track failed:", e);
    }
  }

  // 1b. Client-side Google Tag (gtag.js) if loaded
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") {
    try {
      if (eventName === "PageView") {
        gtag("event", "page_view", {
          page_location: window.location.href,
          page_title: document.title,
        });
      } else if (eventName === "Lead") {
        gtag("event", "generate_lead", {
          event_category: "engagement",
          value: 1,
          currency: "BDT",
          ...(options.params || {}),
        });
      } else {
        gtag("event", eventName.toLowerCase(), options.params || {});
      }
    } catch (e) {
      console.warn("Google Tag client-side track failed:", e);
    }
  }

  // 2. Server-side forward (Meta CAPI + GA4 Measurement Protocol).
  try {
    const payload = {
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      pixelId: options.pixelId,
      clientId: getOrCreateGa4ClientId(),
      userData: options.userData,
      params: options.params,
    };

    // Use sendBeacon when available so the request survives page
    // navigations (important for events fired on form submit / route
    // change), falling back to fetch with keepalive.
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch((e) => console.warn("Server-side track request failed:", e));
    }
  } catch (e) {
    console.warn("Server-side track dispatch failed:", e);
  }
}

export function trackPageView(pixelId?: string): void {
  trackEvent("PageView", { pixelId });
}

export function trackLead(pixelId: string | undefined, userData?: { email?: string; phone?: string }): void {
  trackEvent("Lead", { pixelId, userData, params: { event_category: "engagement" } });
}
