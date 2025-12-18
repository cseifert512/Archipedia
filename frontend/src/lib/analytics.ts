import posthog from "posthog-js";

// Initialize PostHog (call once on app startup)
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics() {
  if (initialized || !POSTHOG_KEY) {
    if (!POSTHOG_KEY) {
      console.debug("[analytics] PostHog key not configured, skipping init");
    }
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Automatically capture page views
    capture_pageview: true,
    // Capture page leaves for session duration
    capture_pageleave: true,
    // Enable session recordings (optional - can disable if not needed)
    disable_session_recording: false,
    // Respect Do Not Track
    respect_dnt: true,
    // Persistence
    persistence: "localStorage",
  });

  initialized = true;
}

export type EnterpriseEventName =
  | "book_demo"
  | "request_access"
  | "download_one_pager";

export type LandingEventName =
  | "try_demo_click"
  | "book_pilot_click"
  | "calendly_click"
  | "contact_form_submit"
  | "demo_page_view"
  | "demo_video_play"
  | "try_live_demo_click";

export type EventPayload = Record<string, unknown>;

/**
 * Track enterprise events
 */
export function trackEnterpriseEvent(
  name: EnterpriseEventName,
  payload: EventPayload = {},
) {
  const detail = { name, payload, ts: Date.now() };

  // Send to PostHog
  if (POSTHOG_KEY) {
    posthog.capture(name, payload);
  }

  // Legacy event dispatch (for any local listeners)
  try {
    window.dispatchEvent(new CustomEvent("archipedia:analytics", { detail }));
  } catch {
    // ignore
  }

  // Dev logging
  try {
    const isDev = Boolean((import.meta as any).env?.DEV);
    if (isDev) {
      console.debug("[analytics]", detail);
    }
  } catch {
    // ignore
  }
}

/**
 * Track landing page events
 */
export function trackLandingEvent(
  name: LandingEventName,
  payload: EventPayload = {},
) {
  const detail = { name, payload, ts: Date.now() };

  // Send to PostHog
  if (POSTHOG_KEY) {
    posthog.capture(`landing_${name}`, payload);
  }

  // Legacy event dispatch
  try {
    window.dispatchEvent(new CustomEvent("archipedia:analytics", { detail }));
  } catch {
    // ignore
  }

  // Dev logging
  try {
    const isDev = Boolean((import.meta as any).env?.DEV);
    if (isDev) {
      console.debug("[analytics:landing]", detail);
    }
  } catch {
    // ignore
  }
}

/**
 * Identify a user (optional - for logged-in users)
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (POSTHOG_KEY) {
    posthog.identify(userId, properties);
  }
}

/**
 * Reset user identity (on logout)
 */
export function resetAnalytics() {
  if (POSTHOG_KEY) {
    posthog.reset();
  }
}
