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
 * Lightweight event dispatcher.
 * - Safe to call anywhere (no-op on SSR, but this repo is client-only)
 * - Easy to swap later for PostHog/Plausible/etc.
 */
export function trackEnterpriseEvent(
  name: EnterpriseEventName,
  payload: EventPayload = {},
) {
  const detail = { name, payload, ts: Date.now() };

  try {
    window.dispatchEvent(new CustomEvent("archipedia:analytics", { detail }));
  } catch {
    // ignore
  }

  try {
    const isDev = Boolean((import.meta as any).env?.DEV);
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", detail);
    }
  } catch {
    // ignore
  }
}

/**
 * Track landing page events (V2 landing page)
 */
export function trackLandingEvent(
  name: LandingEventName,
  payload: EventPayload = {},
) {
  const detail = { name, payload, ts: Date.now() };

  try {
    window.dispatchEvent(new CustomEvent("archipedia:analytics", { detail }));
  } catch {
    // ignore
  }

  try {
    const isDev = Boolean((import.meta as any).env?.DEV);
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug("[analytics:landing]", detail);
    }
  } catch {
    // ignore
  }
}
