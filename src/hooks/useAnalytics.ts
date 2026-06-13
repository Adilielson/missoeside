import { useEffect, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ide_analytics_session";

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (crypto.randomUUID && crypto.randomUUID()) ||
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

type TrackPayload = {
  event_type: "page_view" | "button_click";
  event_name: string;
  path?: string | null;
  project_slug?: string | null;
  metadata?: Record<string, unknown> | null;
};

async function send(payload: TrackPayload) {
  try {
    await supabase.from("page_events").insert({
      event_type: payload.event_type,
      event_name: payload.event_name,
      path: payload.path ?? (typeof window !== "undefined" ? window.location.pathname : null),
      project_slug: payload.project_slug ?? null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      session_id: getSessionId(),
      metadata: (payload.metadata ?? null) as any,
    });
  } catch (e) {
    console.warn("[analytics] failed", e);
  }
}

export function trackEvent(
  event_name: string,
  opts: { project_slug?: string | null; metadata?: Record<string, unknown> } = {}
) {
  void send({
    event_type: "button_click",
    event_name,
    project_slug: opts.project_slug ?? null,
    metadata: opts.metadata ?? null,
  });
}

export function trackPageView(path?: string) {
  void send({
    event_type: "page_view",
    event_name: "page_view",
    path: path ?? (typeof window !== "undefined" ? window.location.pathname : null),
  });
}

/** Mount once at the app root to track every route change as a page_view. */
export function usePageViewTracker() {
  const location = useLocation();
  const last = useRef<string | null>(null);
  useEffect(() => {
    const path = location.pathname;
    // Skip admin area
    if (path.startsWith("/admin") || path.startsWith("/superadmin")) {
      last.current = path;
      return;
    }
    if (last.current === path) return;
    last.current = path;
    trackPageView(path);
  }, [location.pathname]);
}
