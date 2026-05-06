# MND Webinar — AI for Every Woman

Marketing site for MyNextDeveloper's "AI for Every Woman" live session. Three routes:

- **`/`** — an interactive AI-spotting quiz that funnels visitors into the webinar.
- **`/details`** — the full webinar landing page (hero, pricing, bonus ebook, registration, FAQ).
- **`/confirmed`** — post-payment success page the quiz redirects to after Razorpay verification succeeds.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) with `@theme` design tokens
- TypeScript (strict)
- Google Fonts: Cormorant Garamond (serif headings) + DM Sans (body)
- MongoDB (native driver) for registrations + payments
- Razorpay Checkout for payments (test/live), with HMAC-verified server-side webhook
- Google Sheets API (service account) for fire-and-forget registration row appends

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in Mongo / Razorpay / Google Sheets values
npm run dev                        # http://localhost:3000
```

Razorpay's webhook target must be a public HTTPS URL — for local dev, run `ngrok http 3000` and paste the tunnel URL into Razorpay Dashboard → Settings → Webhooks. See [`CLAUDE.md`](CLAUDE.md) for the full env-var table.

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run lint         # eslint
```

## Project layout

```
app/
├─ layout.tsx              # root layout, fonts, metadata, Razorpay checkout script
├─ globals.css             # @theme tokens + small CSS utilities (animations, gradients)
├─ page.tsx                # /          — AI-spotting quiz (entry point)
├─ details/page.tsx        # /details   — full webinar landing
├─ confirmed/page.tsx      # /confirmed — post-payment success screen
├─ api/
│  ├─ register/route.ts        # insert registration (paymentStatus: pending)
│  ├─ create-order/route.ts    # create Razorpay order + payments doc
│  ├─ verify-payment/route.ts  # HMAC-verify success callback
│  └─ webhook/route.ts         # Razorpay server-to-server events
└─ components/
   ├─ Nav.tsx, Hero.tsx, About.tsx, Pricing.tsx, BonusEbook.tsx,
   ├─ Register.tsx, Faq.tsx, Footer.tsx, Reveal.tsx, icons.tsx
   └─ quiz/QuizApp.tsx     # 4-screen quiz state machine + Razorpay flow

lib/
├─ mongo.ts                # cached client + DBCollection enum + getDb()
├─ razorpay.ts             # SDK singleton + signature verification
├─ sheets.ts               # appendRegistrationRow with retry/backoff
├─ validation.ts           # hand-rolled payload validators
├─ errors.ts               # ApiError + jsonError helper
└─ types.ts                # EventRegistration, Payment, etc.

public/assets/             # logos, ebook cover, AI preview gallery, quiz images
```

## Design tokens

All brand colors, fonts, radii, and shadows live in a single `@theme` block in [`app/globals.css`](app/globals.css). Tailwind v4 auto-exposes them as utilities (`bg-navy`, `text-teal`, `text-amber`, `shadow-brand-md`, `font-serif`, etc.). Edit one place to retheme the whole site.

| Token | Value |
| --- | --- |
| `--color-navy` | `#023047` |
| `--color-teal` | `#229fbd` |
| `--color-amber` | `#ffb915` |
| `--color-whatsapp` | `#25d366` |
| `--font-serif` | Cormorant Garamond |
| `--font-sans` | DM Sans |

## The quiz flow (`/`)

[`QuizApp.tsx`](app/components/quiz/QuizApp.tsx) is a single client component with an internal `screen` state machine:

1. **Choose** — pick which of two images is AI-generated
2. **Correct** / 3. **Wrong** — result + webinar info card grid + AI preview gallery + amber "Claim My Spot" CTA + "See full details →" link to `/details`
4. **Register** — floating-label form with multi/single-pill questions + client validation; on submit, runs `/api/register` → `/api/create-order` → Razorpay Checkout → `/api/verify-payment`, then `router.push("/confirmed")`

The confirmation screen is its own route at [`/confirmed`](app/confirmed/page.tsx), not an in-app screen.

The correct answer is configured at the top of `QuizApp.tsx`:

```ts
const CORRECT_ANSWER: "A" | "B" = "A";
```

## Editing common things

| Want to change… | Edit |
| --- | --- |
| Webinar pricing / dates | [`app/components/Pricing.tsx`](app/components/Pricing.tsx), [`Register.tsx`](app/components/Register.tsx), info grid in [`QuizApp.tsx`](app/components/quiz/QuizApp.tsx) |
| FAQ entries | `faqs` array in [`app/components/Faq.tsx`](app/components/Faq.tsx) |
| Quiz questions | `questions` array in [`QuizApp.tsx`](app/components/quiz/QuizApp.tsx) |
| Brand colors / fonts | `@theme` block in [`app/globals.css`](app/globals.css) |
| WhatsApp / Google Form URLs | search for `chat.whatsapp.com/placeholder` and `forms.gle/8kxfdsmMwXg9qBkK8` |
| Quiz images | `public/assets/option-a.jpg`, `option-b.jpg`, `ai-preview-{1..6}.jpg` |

## Responsiveness

- The webinar landing (`/details`) is fluid from ~360 px upward — tool grid `1 → 2 → 4 cols`, checklist `1 → 2 cols`, hero typography on `clamp()`.
- The quiz (`/`) is mobile-first with a 480-px max-width app shell, intentionally rendered as a centered phone-shaped column on desktop (matches the source design).

## Notes

- Fonts are loaded via a `<link>` tag in the root layout (Tailwind v4 + sandboxed CI builds can fail to fetch Google Fonts at build time via `next/font`).
- The full register → pay → verify pipeline runs through the Route Handlers under [`app/api/`](app/api/); see [`CLAUDE.md`](CLAUDE.md) for endpoint contracts and the MongoDB schema.
- Pending registrations and `created`-status payments accumulate from abandoned checkouts — there's no TTL cleanup yet.
- The `/.design-source/` folder (gitignored) contains the original Claude Design HTML prototypes for reference.
