# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Next.js dev server (Turbopack) at http://localhost:3000
npm run build    # production build — runs Turbopack compile + tsc type check
npm run start    # serve the production build
npm run lint     # eslint (eslint-config-next)
```

There is no test runner configured.

## Architecture

Three routes share one component library:

- **`/`** ([app/page.tsx](app/page.tsx)) — an interactive AI-spotting quiz that funnels visitors into the webinar.
- **`/details`** ([app/details/page.tsx](app/details/page.tsx)) — the full marketing landing (Hero / About / Pricing / BonusEbook / Register / FAQ / Footer).
- **`/confirmed`** ([app/confirmed/page.tsx](app/confirmed/page.tsx)) — post-payment success page that the quiz pushes to via `router.push` after `/api/verify-payment` returns success. Server-rendered, publicly reachable by URL (not gated).

The quiz at `/` is the entry point. Its result screens link to `/details` via a "See full details →" anchor.

### Quiz state machine

[app/components/quiz/QuizApp.tsx](app/components/quiz/QuizApp.tsx) is a single `"use client"` component holding 4 in-app screens (Choose → Correct/Wrong → Register). Screen transitions are local `useState`, not routes — there is no per-screen URL. After a successful payment the component navigates to the `/confirmed` route (Next router push), not an inline screen. The correct quiz answer is a module constant at the top of the file (`CORRECT_ANSWER`).

`ScreenRegister.onSubmit` runs the full register → pay → verify flow via SWR mutations: `POST /api/register` → `POST /api/create-order` → open Razorpay Checkout (with `prefill: { name, email, contact }`) → `POST /api/verify-payment` in the checkout `handler` callback → `router.push("/confirmed")`. The Razorpay key id is returned by `/api/create-order` (no `NEXT_PUBLIC_*` mirror needed). Email is required because the unique index and payment receipts depend on it.

If `/api/register` reports the email/phone already paid (`paymentStatus === "success"`), `onSubmit` short-circuits **before** payment — it fires `registration_duplicate_blocked` and shows an "already registered" toast instead of routing to `/confirmed`. All user-facing errors in this flow (validation, already-registered, payment failed/cancelled, generic) surface as **sonner toasts**, not inline banners — see the Toasts section below.

### Backend API

Route Handlers under [app/api/](app/api/) — all `runtime = "nodejs"` (Razorpay SDK + mongodb native driver are not edge-compatible).

- `POST /api/register` — validates input. First it blocks re-registration when this **email OR phone** already has a `paymentStatus: "success"` row for the event (phone matched on its last 10 digits, so `+91`/`91` prefixes don't cause false misses) — returns the existing registration with `alreadyRegistered: true`. Only *paid* rows block; pending/failed fall through so abandoned-checkout users can still pay. Otherwise it inserts a new `event_registrations` doc with `paymentStatus: "pending"`. On a duplicate-email E11000 it returns the existing `registrationId` rather than 409 (idempotent for back-button users). Note: phone uniqueness is best-effort — an app-level check against paid rows only, not a DB index, so it's racy. Only `{email, eventId}` is enforced unique by Mongo.
- `POST /api/create-order` — creates a Razorpay order (with `notes` carrying `registrationId`, `eventId`, `email`, `contact`, `name`), inserts a `payments` doc with `status: "created"`, returns `{ orderId, amount, currency, keyId }` to the client.
- `POST /api/verify-payment` — HMAC-SHA256 verifies `orderId|paymentId` against `razorpay_signature` using `crypto.timingSafeEqual`. On success: marks both collections `success`, fires `appendRegistrationRow` (fire-and-forget, never awaited). The signature itself is *not* persisted — once verified it has no further use.
- `POST /api/webhook` — reads the raw body via `await request.text()` *before* JSON.parse so the HMAC matches Razorpay's signed bytes; handles `payment.captured` and `payment.failed` idempotently (filtered updates with `$ne: "success"` so re-deliveries are no-ops).

Shared logic lives in [lib/](lib/):

- [lib/mongo.ts](lib/mongo.ts) — cached `MongoClient` on `globalThis` (survives Next dev HMR), exported as the default `clientPromise`. `getDb()` lazily creates the unique index on `{ email, eventId }` and the indexes on `payments` once per process. Collection names live in the exported `DBCollection` enum (`EVENT_REGISTRATIONS`, `PAYMENTS`) — call sites use `db.collection<T>(DBCollection.X)` directly; there are no per-collection helper functions.
- [lib/razorpay.ts](lib/razorpay.ts) — singleton SDK + `verifyPaymentSignature` / `verifyWebhookSignature`.
- [lib/sheets.ts](lib/sheets.ts) — `appendRegistrationRow` with 3-attempt exponential backoff (500/1500/4500ms); on final failure logs and returns — never throws to the API caller.
- [lib/validation.ts](lib/validation.ts), [lib/errors.ts](lib/errors.ts), [lib/types.ts](lib/types.ts) — hand-rolled validators (no `zod`), `ApiError` + `jsonError` helper, shared types.

MongoDB collections (names referenced via `DBCollection` enum in [lib/mongo.ts](lib/mongo.ts)):

- `event_registrations`: unique index on `{ email: 1, eventId: 1 }`. Stores name, email, phone, eventId, age, surveyAnswers, paymentStatus.
- `payments`: unique index on `orderId`, index on `registrationId`. References registration via ObjectId.

Pending registrations and `created`-status payments accumulate from abandoned checkouts — there is no TTL cleanup yet.

### Environment variables

Copy [.env.local.example](.env.local.example) → `.env.local` (gitignored). Required:

| Var | Purpose |
| --- | --- |
| `MONGODB_URI`, `DB_NAME` | Mongo connection. Both are required — [lib/mongo.ts](lib/mongo.ts) throws at import if either is missing. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay test/live API key pair (Dashboard → Settings → API Keys). |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook secret (Dashboard → Settings → Webhooks). |
| `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB` | Target spreadsheet (share with the service account email as Editor). |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Service-account JWT credentials. The private key must be wrapped in double quotes; literal `\n` sequences are unescaped at runtime in [lib/sheets.ts](lib/sheets.ts). |
| `DEFAULT_AMOUNT_PAISE`, `DEFAULT_CURRENCY`, `EVENT_ID` | Pricing + event id used when the client doesn't override them. `49900` paise = ₹499. |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID (`G-XXXXXXXXXX`). Optional — when unset, [app/layout.tsx](app/layout.tsx) skips mounting `<GoogleAnalytics />` and `trackEvent` is a no-op, so dev/CI traffic without a key never hits GA. |

Razorpay's webhook target must be a public HTTPS URL — use `ngrok http 3000` (or similar) in dev and paste the tunnel URL into the Dashboard webhook config.

### Component split for the marketing page

Each section under [app/components/](app/components/) is one file. [Nav.tsx](app/components/Nav.tsx) (scroll-listener), [Faq.tsx](app/components/Faq.tsx) (accordion state), and [Register.tsx](app/components/Register.tsx) (analytics onClick) are client components — everything else is server-rendered. [Reveal.tsx](app/components/Reveal.tsx) is a thin client wrapper that adds a `.in` class via `IntersectionObserver` to drive the `.reveal` CSS transition; reuse it instead of re-implementing scroll-fade-in.

### Analytics (Google Analytics 4)

GA4 is wired up via `@next/third-parties/google`. The `<GoogleAnalytics />` component is mounted in [app/layout.tsx](app/layout.tsx) and gated on `NEXT_PUBLIC_GA_ID` — pageviews on App Router client-side navigation are emitted automatically by the component (it listens to history changes), so there is no manual `usePathname` route-change tracker.

Custom events go through the typed helper in [lib/analytics.ts](lib/analytics.ts):

```ts
import { trackEvent } from "@/lib/analytics";
trackEvent("cta_clicked", { cta: "reserve_seat", location: "details" });
```

- Event names live in the `AnalyticsEvent` union in [lib/analytics.ts](lib/analytics.ts) — **add the name to the union before calling `trackEvent` with it**, otherwise TypeScript will reject the call. This intentionally prevents typo-fragmented reports in GA4.
- In development, `trackEvent` auto-attaches `debug_mode: true` so events surface in GA4 → Admin → DebugView without needing the browser extension.
- When `NEXT_PUBLIC_GA_ID` is unset, `trackEvent` short-circuits to a no-op — safe to call from any code path.

Existing instrumentation: quiz answer / result / CTA, register form submit + validation failures, payment initiated/succeeded/failed/cancelled, registration_completed (paid path), registration_duplicate_blocked (email/phone already paid), nav clicks, FAQ open/close, and the Register section CTA. Search for `trackEvent(` to see all call sites.

Debug locally: DevTools → Network → filter `collect` shows each hit to `google-analytics.com/g/collect`; GA4 DebugView shows the same events server-side within a few seconds.

### Toasts (user-facing errors)

Client-side errors are surfaced as toasts via [`sonner`](https://sonner.emilkowal.ski/), not inline banners. The `<Toaster position="top-center" richColors closeButton />` is mounted once in [app/layout.tsx](app/layout.tsx) (a client component inside the server layout — that boundary is fine), so `toast.error(...)` works from any client component on any route. The quiz register flow ([QuizApp.tsx](app/components/quiz/QuizApp.tsx)) routes all of its errors through `toast.error` — there is no longer a top-of-form error banner or `submitError`/`showError` state; invalid fields still get red highlighting via the `errors` state. `richColors` uses sonner's default red palette (not the brand tokens) — if brand-matching is needed, override via `toastOptions`/CSS vars on the `<Toaster>`.

### Design tokens (single source of truth)

All brand colors, fonts, radii, and shadows are declared once in the `@theme` block of [app/globals.css](app/globals.css). Tailwind v4 auto-generates utilities from them (`bg-navy`, `text-teal`, `text-amber`, `shadow-brand-md`, `font-serif`, etc.). **Do not hardcode brand hex values in components** — extend the `@theme` block and use the utility. The same file holds the small CSS that doesn't fit cleanly in Tailwind: keyframes (`fadeUp`, `pulse`, `quizPulse`, `quizNudge`), the `.reveal` transition, the hero radial-gradient `::before`, the masked-SVG `.bonus-bullet::before` checkmark, and the `.faq-answer` grid-rows accordion trick.

### Fonts

Cormorant Garamond + DM Sans are loaded via a `<link>` tag in [app/layout.tsx](app/layout.tsx) — **not** via `next/font/google`. This is intentional: sandboxed CI builds can fail to fetch Google Fonts at build time via `next/font`. The font-family values referenced from `@theme` (`--font-serif`, `--font-sans`) match the loaded family names, so changing the loader requires updating both.

### Tailwind v4 specifics

- Config lives in CSS (`@theme` in `globals.css`), not `tailwind.config.js`.
- PostCSS plugin is `@tailwindcss/postcss` (see [postcss.config.mjs](postcss.config.mjs)).
- Custom utilities derived from `@theme` follow the token name: `--color-navy` → `bg-navy`/`text-navy`, `--shadow-brand-md` → `shadow-brand-md`, `--radius-brand-xl` → `rounded-brand-xl`.

### Design handoff source

[`/.design-source/`](.design-source/) (gitignored) contains the original Claude Design HTML prototypes that were translated into the React components. Treat it as a visual reference, not source — the components are the truth.

## Editing common things

| Want to change… | Edit |
| --- | --- |
| Webinar pricing / dates | [Pricing.tsx](app/components/Pricing.tsx), [Register.tsx](app/components/Register.tsx), `InfoGrid` in [QuizApp.tsx](app/components/quiz/QuizApp.tsx); change `DEFAULT_AMOUNT_PAISE` in `.env.local` for the actual charge |
| FAQ entries | `faqs` array in [Faq.tsx](app/components/Faq.tsx) |
| Quiz questions / correct answer | `questions` array and `CORRECT_ANSWER` in [QuizApp.tsx](app/components/quiz/QuizApp.tsx) |
| Brand colors / fonts | `@theme` block in [globals.css](app/globals.css) |
| WhatsApp / Google Form URLs | search for `chat.whatsapp.com/placeholder` and `forms.gle/8kxfdsmMwXg9qBkK8` |
