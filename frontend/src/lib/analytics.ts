export type EnterpriseEventName =
  | "book_demo"
  | "request_access"
  | "download_one_pager";

export type EnterpriseEventPayload = Record<string, unknown>;

/**
 * Lightweight event dispatcher.
 * - Safe to call anywhere (no-op on SSR, but this repo is client-only)
 * - Easy to swap later for PostHog/Plausible/etc.
 */
export function trackEnterpriseEvent(
  name: EnterpriseEventName,
  payload: EnterpriseEventPayload = {},
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


