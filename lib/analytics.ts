/**
 * Google Analytics helper.
 *
 * The GA tag itself is loaded by `<GoogleAnalytics />` (from
 * `@next/third-parties/google`) in `app/layout.tsx`. That component injects
 * gtag.js, sets up the `dataLayer`, and — important for the App Router —
 * automatically fires a `page_view` on every history change, so client-side
 * navigation between `/`, `/details`, and `/confirmed` is tracked without any
 * additional wiring here.
 *
 * Use `trackEvent` for everything else (button clicks, form submissions,
 * conversion steps, etc.). Calling it before the GA script has loaded is safe:
 * the `@next/third-parties` wrapper guarantees a `window.dataLayer` exists, and
 * `sendGAEvent` queues calls until gtag.js is ready, so events are never
 * dropped.
 *
 * Adding a new event:
 *   1. Add a string literal to `AnalyticsEvent` below (keeps reporting clean).
 *   2. Call `trackEvent("<your_event>", { ...params })` from the relevant
 *      handler. Stick to snake_case for both names and params — that is what
 *      GA4's Reports / Explorations expect.
 *
 * Debugging locally:
 *   - Set `NEXT_PUBLIC_GA_ID` in `.env.local` to your GA4 measurement ID
 *     (`G-XXXXXXXXXX`). Without it, GA is not loaded and `trackEvent` is a
 *     no-op — so dev traffic from a missing-key environment never pollutes
 *     production analytics.
 *   - Open Chrome DevTools → Network → filter `collect` to see each event hit
 *     `https://www.google-analytics.com/g/collect`.
 *   - In GA4 → Admin → DebugView, install the "Google Analytics Debugger"
 *     extension (or append `?_dbg=1` via gtag) and you will see events stream
 *     in within a few seconds. The `debug_mode: true` parameter we attach
 *     below in development means DebugView picks up local events automatically
 *     when the extension is on.
 */

import { sendGAEvent } from "@next/third-parties/google";

// Centralised list of event names. Keep this in sync with the events surfaced
// in GA4 reporting — using a union prevents typos that fragment reports.
export type AnalyticsEvent =
  // Quiz funnel
  | "quiz_answer_selected"
  | "quiz_result_viewed"
  | "quiz_cta_clicked"
  // Registration / payment
  | "register_form_submitted"
  | "register_form_validation_failed"
  | "payment_initiated"
  | "payment_succeeded"
  | "payment_failed"
  | "payment_cancelled"
  | "registration_completed"
  | "registration_duplicate_blocked"
  // Marketing page interactions
  | "nav_link_clicked"
  | "cta_clicked"
  | "faq_toggled"
  | "external_link_clicked";

type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Fire a custom GA4 event. Safe to call before gtag.js has loaded and safe to
 * call when no measurement ID is configured (becomes a no-op).
 */
export function trackEvent(name: AnalyticsEvent, params: EventParams = {}) {
  // No measurement ID → GA was never injected → nothing to do.
  if (!process.env.NEXT_PUBLIC_GA_ID) return;

  // `debug_mode: true` lights up GA4 DebugView for local development without
  // requiring the browser extension. Stripped out in production builds.
  const enriched: EventParams =
    process.env.NODE_ENV === "development"
      ? { ...params, debug_mode: true }
      : params;

  // Prune undefined values — gtag treats them as the literal string
  // "undefined" otherwise.
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(enriched)) {
    if (v !== undefined) cleaned[k] = v;
  }

  sendGAEvent("event", name, cleaned);
}
