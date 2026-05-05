"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import useSWRMutation from "swr/mutation";

const CORRECT_ANSWER: "A" | "B" = "A";

type Screen = 1 | 2 | 3 | 4;

const aiPreviews = [
  "/assets/ai-preview-5.png",
  "/assets/ai-preview-6.png",
  "/assets/ai-preview-1.png",
  "/assets/ai-preview-2.png",
  "/assets/ai-preview-3.png",
  "/assets/ai-preview-4.png",
];

type Question = {
  id: string;
  title: string;
  multi: boolean;
  options: { value: string; label: string }[];
};

const questions: Question[] = [
  {
    id: "q1",
    title: "How familiar are you with AI tools like ChatGPT or Google Gemini?",
    multi: false,
    options: [
      { value: "never", label: "I've never used any AI tool" },
      { value: "heard", label: "I've heard of them but never tried" },
      { value: "curious", label: "I've tried them once or twice out of curiosity" },
      { value: "occasional", label: "I use them occasionally for simple tasks" },
      { value: "regular", label: "I use them regularly and confidently" },
    ],
  },
  {
    id: "q2",
    title: "Have you ever written a prompt to get a specific result from an AI tool?",
    multi: false,
    options: [
      { value: "no-know", label: "No, I don't know what a prompt is" },
      { value: "know-no-try", label: "I know what it is but haven't tried" },
      { value: "tried-bad", label: "I've tried but didn't get the results I wanted" },
      { value: "decent", label: "Yes, and I got decent results" },
      { value: "experiment", label: "Yes, and I actively experiment with how I phrase prompts" },
    ],
  },
  {
    id: "q3",
    title: "Which of the following have you used AI for? Select all that apply.",
    multi: true,
    options: [
      { value: "email", label: "Writing or editing an email" },
      { value: "summarise", label: "Summarising a document or article" },
      { value: "image", label: "Generating an image" },
      { value: "brainstorm", label: "Planning or brainstorming" },
      { value: "none", label: "I haven't used AI for any of these" },
    ],
  },
  {
    id: "q4",
    title: "Which AI tools have you heard of or used?",
    multi: true,
    options: [
      { value: "chatgpt", label: "ChatGPT" },
      { value: "gemini", label: "Google Gemini" },
      { value: "siri", label: "Siri" },
      { value: "alexa", label: "Alexa" },
      { value: "gassistant", label: "Google Assistant" },
      { value: "canva", label: "Canva AI" },
      { value: "none", label: "None of these" },
    ],
  },
  {
    id: "q5",
    title: "What would you like to use AI for?",
    multi: true,
    options: [
      { value: "answers", label: "Quick answers & information" },
      { value: "writing", label: "Help writing messages or letters" },
      { value: "recipes", label: "Recipes & cooking" },
      { value: "travel", label: "Travel planning" },
      { value: "learning", label: "Learning new things" },
      { value: "other", label: "Something else" },
    ],
  },
];

const ageOptions = [
  "Less than 35",
  "35 - 45",
  "45 - 55",
  "55 - 65",
  "Above 65",
];

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => { open: () => void };
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (resp: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

async function postJson<T>(url: string, { arg }: { arg: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function QuizApp() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(1);
  const [lastResult, setLastResult] = useState<2 | 3>(2);
  const [enteredViaDeepLink, setEnteredViaDeepLink] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("step") === "register") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScreen(4);
      setEnteredViaDeepLink(true);
    }
  }, []);

  const goTo = (n: Screen) => {
    setScreen(n);
    if (n === 2 || n === 3) setLastResult(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const handleBackFromForm = () => {
    if (enteredViaDeepLink) {
      window.location.href = "/details";
    } else {
      goTo(lastResult);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[480px] bg-[#faf7f2] shadow-[0_0_0_1px_rgba(0,0,0,0.03)] md:max-w-none md:shadow-none">
      {screen !== 4 && <QuizNav />}
      <main className="relative">
        {screen === 1 && <ScreenChoose onAnswer={(c) => goTo(c === CORRECT_ANSWER ? 2 : 3)} />}
        {(screen === 2 || screen === 3) && (
          <ScreenResult variant={screen} onJoin={() => goTo(4)} />
        )}
        {screen === 4 && (
          <ScreenRegister
            onBack={handleBackFromForm}
            onSuccess={() => router.push("/confirmed")}
          />
        )}
      </main>
    </div>
  );
}

/* ───────── Nav ───────── */

function QuizNav() {
  return (
    <header
      className="flex items-center justify-between bg-navy px-4 py-3 text-white md:px-8 md:py-4 lg:px-12"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
    >
      <Image
        src="/assets/mnd-logo-white.png"
        alt="MyNextDeveloper"
        width={180}
        height={30}
        priority
        className="block h-[22px] w-auto object-contain md:h-[28px]"
      />
      <div className="inline-flex items-center gap-1.5 md:gap-2">
        <span className="quiz-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-amber md:h-2 md:w-2" />
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/55 md:text-[11px]">
          Test yourself
        </span>
      </div>
    </header>
  );
}

/* ───────── Screen 1 ───────── */

function ScreenChoose({ onAnswer }: { onAnswer: (c: "A" | "B") => void }) {
  const [selected, setSelected] = useState<"A" | "B" | null>(null);
  const lockRef = useRef(false);

  const choose = (c: "A" | "B") => {
    if (lockRef.current) return;
    lockRef.current = true;
    setSelected(c);
    setTimeout(() => onAnswer(c), 400);
  };

  return (
    <section className="px-5 pb-6 pt-5 sm:px-6 md:px-12 md:pt-12 md:pb-16 lg:px-20 lg:pt-16 xl:px-28 2xl:px-40">
      <div className="mb-4 md:mx-auto md:mb-10 md:max-w-[760px] md:text-center lg:max-w-[860px] lg:mb-12">
        <p className="m-0 mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#444443]/70 md:text-[12px] lg:text-[13px]">
          A quick visual test
        </p>
        <h1 className="m-0 mb-3 font-serif font-medium leading-[1.08] tracking-[-0.01em] text-balance text-navy text-[clamp(30px,8.2vw,40px)] md:mb-4 md:text-[56px] lg:text-[68px] xl:text-[76px]">
          So… which one do you think is{" "}
          <em className="font-medium italic text-teal">AI?</em>
        </h1>
        <p className="m-0 mb-5 text-[15px] leading-[1.55] text-[#444443] md:mb-0 md:text-[18px] lg:text-[20px]">
          Trust your instincts. Look at the skin, the eyes, the light.
        </p>
      </div>

      <div
        className="mb-4 grid grid-cols-2 gap-3 md:mx-auto md:max-w-[1000px] md:gap-8 lg:max-w-[1200px] lg:gap-10 xl:max-w-[1320px]"
        role="radiogroup"
        aria-label="Choose which image you think is AI"
      >
        {(["A", "B"] as const).map((choice) => {
          const isSelected = selected === choice;
          return (
            <button
              key={choice}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => choose(choice)}
              className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-[14px] border-2 bg-white text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-14px_rgba(2,48,71,0.28)] ${
                isSelected
                  ? "border-amber shadow-[0_14px_36px_-14px_rgba(255,185,21,0.5),0_0_0_2px_#ffb915_inset]"
                  : "border-transparent shadow-[0_10px_30px_-12px_rgba(2,48,71,0.22),0_2px_6px_rgba(2,48,71,0.06)]"
              }`}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-[#e8eef2] via-[#cfd9df] to-[#a9b8c1]">
                <Image
                  src={`/assets/option-${choice.toLowerCase()}.png`}
                  alt={`Option ${choice}`}
                  fill
                  sizes="(max-width: 480px) 50vw, (max-width: 1024px) 45vw, (max-width: 1320px) 560px, 640px"
                  quality={100}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-center justify-between bg-white px-3.5 py-3 md:px-5 md:py-4">
                <span className="font-serif text-[22px] font-medium leading-[1.2] tracking-[0.01em] text-navy md:text-[26px]">
                  Option {choice}
                </span>
                <span
                  className={`relative h-[22px] w-[22px] flex-shrink-0 rounded-full border-2 transition md:h-[26px] md:w-[26px] ${
                    isSelected
                      ? "border-amber bg-amber shadow-[0_0_0_4px_rgba(255,185,21,0.18)]"
                      : "border-navy/25 bg-transparent"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute inset-1 rounded-full bg-white" />
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ───────── Screens 2 & 3: Result ───────── */

function ScreenResult({
  variant,
  onJoin,
}: {
  variant: 2 | 3;
  onJoin: () => void;
}) {
  return (
    <section
      className="px-4 pt-5 md:px-12 md:pt-12 lg:px-20 lg:pt-16 xl:px-28 2xl:px-40"
      style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="md:mx-auto md:grid md:max-w-[1200px] md:grid-cols-2 md:gap-12 lg:max-w-[1400px] lg:gap-20 xl:max-w-[1500px]">
        <div className="md:flex md:flex-col md:justify-center">
          {variant === 2 ? (
            <Badge tone="green" label="You got it right" />
          ) : (
            <Badge tone="amber" label="Almost — but not quite" />
          )}

          <h1 className="m-0 mb-2.5 font-serif font-medium leading-[1.08] tracking-[-0.01em] text-balance text-navy text-[clamp(26px,6vw,42px)] md:mb-4 md:text-[48px] lg:text-[60px] xl:text-[68px]">
            {variant === 2 ? (
              <>
                Most people miss it.{" "}
                <em className="font-medium italic text-teal">
                  You didn&apos;t.
                </em>
              </>
            ) : (
              <>
                The other image was AI.{" "}
                <em className="font-medium italic text-teal">
                  Hard to believe, right?
                </em>
              </>
            )}
          </h1>

          <p className="m-0 mt-2.5 mb-2 px-1 font-serif text-[13px] italic leading-[1.35] tracking-[0.005em] text-balance text-teal sm:text-[17px] md:mb-6 md:px-0 md:text-[19px] md:leading-[1.45] lg:text-[21px]">
            &ldquo;AI is already creating images this real. Come learn how
            it&apos;s done.&rdquo;
          </p>

          <div className="hidden md:block">
            <ResultCta onJoin={onJoin} />
          </div>
        </div>

        <div className="md:flex md:flex-col md:justify-center">
          <AiGallery />
          <InfoGrid />
        </div>
      </div>

      <div className="md:hidden">
        <ResultCta onJoin={onJoin} />
      </div>
    </section>
  );
}

function ResultCta({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="mt-2 w-full text-center md:mt-0">
      <div className="mb-2.5 inline-flex items-center gap-2 text-xs leading-[1.3] text-[#444443]/85">
        <span className="quiz-pulse-dot h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber" />
        <span>Limited spots left</span>
      </div>
      <button
        type="button"
        onClick={onJoin}
        className="group flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-5 py-4 text-center text-[14px] font-semibold leading-[1.3] tracking-[0.01em] text-navy shadow-[0_10px_24px_-10px_rgba(255,185,21,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_rgba(255,185,21,0.65)] sm:whitespace-nowrap md:text-[16px] md:py-[18px]"
      >
        <span>Claim My Spot — Register for Free, Pay Later</span>
        <span className="inline-block transition group-hover:translate-x-1">
          →
        </span>
      </button>
      <Link
        href="/details"
        className="mt-2.5 block text-center text-xs font-medium text-teal underline underline-offset-[3px] transition hover:text-[#1d8aa4] md:mt-3 md:text-[13px]"
      >
        See full details →
      </Link>
    </div>
  );
}

function Badge({
  tone,
  label,
}: {
  tone: "green" | "amber";
  label: string;
}) {
  const palette =
    tone === "green"
      ? "bg-[#e8f6ec] text-[#1f7a3a]"
      : "bg-[#fff3d1] text-[#8a5a00]";
  const dot = tone === "green" ? "bg-[#2aab52]" : "bg-amber";
  return (
    <span
      className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-[0.02em] ${palette}`}
    >
      <span
        className={`quiz-pulse-dot inline-block h-[7px] w-[7px] rounded-full ${dot}`}
      />
      {label}
    </span>
  );
}

function AiGallery() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const reachedEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      setAtEnd(reachedEnd);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollNext = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const reachedEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (reachedEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
    }
  };

  return (
    <div className="relative -mx-4 my-3 md:mx-0 md:my-0 md:mb-4">
      <div
        ref={scrollerRef}
        className="ai-gallery flex snap-x snap-mandatory flex-row flex-nowrap gap-2.5 overflow-x-auto overflow-y-visible px-4 pb-3.5 pt-1.5 md:gap-3 md:px-1 md:pb-2"
        role="list"
        aria-label="AI image preview gallery"
      >
        {aiPreviews.map((src) => (
          <div
            key={src}
            role="listitem"
            className="relative h-[120px] w-[120px] flex-none snap-start overflow-hidden rounded-[10px] bg-gradient-to-br from-[#e2e8ec] via-[#c7d0d6] to-[#a9b8c1] shadow-[0_6px_16px_-10px_rgba(2,48,71,0.25),0_1px_3px_rgba(2,48,71,0.06)] md:h-[160px] md:w-[160px] md:rounded-xl lg:h-[180px] lg:w-[180px]"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(min-width: 1024px) 180px, (min-width: 768px) 160px, 120px"
              quality={100}
              loading="lazy"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-navy/65 px-0 py-1.5 text-center text-[10px] uppercase tracking-[1.5px] text-teal">
              AI Generated
            </div>
          </div>
        ))}
      </div>
      <div
        className={`pointer-events-none absolute right-0 top-0 h-full w-9 bg-gradient-to-r from-[#faf7f2]/0 to-[#faf7f2] transition-opacity duration-200 md:hidden ${
          atEnd ? "opacity-0" : "opacity-100"
        }`}
      />
      <button
        type="button"
        onClick={scrollNext}
        aria-label={atEnd ? "Back to start" : "Show more AI images"}
        className="quiz-nudge absolute right-1.5 top-1/2 z-[2] flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-navy/85 text-white shadow-[0_4px_10px_rgba(2,48,71,0.25)] transition hover:bg-navy hover:scale-105 md:h-8 md:w-8"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            atEnd ? "rotate-180" : ""
          }`}
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function InfoGrid() {
  return (
    <div className="my-4 grid grid-cols-2 gap-2.5 md:my-0 md:gap-3">
      <InfoCard
        title="75 Minutes"
        sub="Live Session"
        icon={
          <>
            <circle cx={12} cy={12} r={9} />
            <path d="M12 7v5l3 2" />
          </>
        }
      />
      <InfoCard
        title="17 July 2026"
        sub="4:00 PM – 5:15 PM"
        icon={
          <>
            <rect x={3} y={5} width={18} height={16} rx={2} />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </>
        }
      />
      <InfoCard
        title="Online"
        sub="Phone or Laptop"
        icon={
          <>
            <rect x={3} y={4} width={18} height={12} rx={2} />
            <path d="M8 20h8M12 16v4" />
          </>
        }
      />
      <InfoCard
        title="ChatGPT + Gemini"
        sub="Hands-on with real tools"
        icon={
          <>
            <rect x={4} y={7} width={16} height={12} rx={3} />
            <circle cx={9} cy={13} r={1.2} fill="currentColor" />
            <circle cx={15} cy={13} r={1.2} fill="currentColor" />
            <path d="M12 4v3M8 19v2M16 19v2" />
          </>
        }
      />
      <InfoCard
        full
        title="Built for Women"
        sub="Zero tech background needed"
        icon={
          <>
            <circle cx={12} cy={8} r={3.5} />
            <path d="M5 21c1.5-4 4-6 7-6s5.5 2 7 6" />
          </>
        }
      />
    </div>
  );
}

function InfoCard({
  title,
  sub,
  icon,
  full,
}: {
  title: string;
  sub: string;
  icon: ReactNode;
  full?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-center gap-1 rounded-xl border-l-[3px] border-teal bg-white px-2.5 py-3 shadow-[0_6px_18px_-10px_rgba(2,48,71,0.22),0_1px_3px_rgba(2,48,71,0.05)] md:gap-1.5 md:px-4 md:py-4 ${
        full ? "col-span-2" : ""
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-1 h-[18px] w-[18px] text-teal md:h-5 md:w-5"
      >
        {icon}
      </svg>
      <div className="text-[13px] font-bold leading-[1.25] tracking-[0.005em] text-navy md:text-[15px]">
        {title}
      </div>
      <div className="text-[11px] leading-[1.3] text-[#444443]/85 md:text-[12.5px]">
        {sub}
      </div>
    </div>
  );
}

/* ───────── Screen 4: Registration ───────── */

type SelectedMap = Record<string, Set<string>>;

function ScreenRegister({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [showError, setShowError] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pillSelections, setPillSelections] = useState<SelectedMap>(() =>
    Object.fromEntries(questions.map((q) => [q.id, new Set<string>()]))
  );

  const { trigger: triggerRegister } = useSWRMutation<
    { registrationId: string; paymentStatus: string },
    Error,
    "/api/register",
    unknown
  >("/api/register", postJson);

  const { trigger: triggerCreateOrder } = useSWRMutation<
    { orderId: string; amount: number; currency: string; keyId: string },
    Error,
    "/api/create-order",
    unknown
  >("/api/create-order", postJson);

  const { trigger: triggerVerify } = useSWRMutation<
    { status: "success" | "failed" },
    Error,
    "/api/verify-payment",
    unknown
  >("/api/verify-payment", postJson);

  const togglePill = (q: Question, value: string) => {
    setPillSelections((prev) => {
      const next: SelectedMap = { ...prev };
      const current = new Set(prev[q.id]);
      if (q.multi) {
        if (current.has(value)) current.delete(value);
        else current.add(value);
      } else {
        current.clear();
        current.add(value);
      }
      next[q.id] = current;
      return next;
    });
    setErrors((prev) => ({ ...prev, [q.id]: false }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const newErrors: Record<string, boolean> = {};

    const name = (data.get("name") as string)?.trim() ?? "";
    const wa = (data.get("whatsapp") as string)?.trim() ?? "";
    const age = (data.get("age") as string)?.trim() ?? "";
    const email = (data.get("email") as string)?.trim() ?? "";

    if (!name) newErrors.name = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = true;
    if (!wa || !/^(?:\+91|91)?[6-9]\d{9}$/.test(wa.replace(/\s/g, "")))
      newErrors.whatsapp = true;
    if (!age) newErrors.age = true;

    for (const q of questions) {
      if (pillSelections[q.id].size === 0) newErrors[q.id] = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowError(true);
      return;
    }

    setShowError(false);
    setSubmitError(null);
    setSubmitting(true);

    try {
      const surveyAnswers = Object.fromEntries(
        questions.map((q) => [q.id, Array.from(pillSelections[q.id])])
      );

      const reg = await triggerRegister({
        name,
        email,
        phone: wa,
        age,
        surveyAnswers,
      });

      if (reg.paymentStatus === "success") {
        onSuccess();
        return;
      }

      const order = await triggerCreateOrder({
        registrationId: reg.registrationId,
      });

      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Payment provider not loaded. Please retry in a moment.");
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "MyNextDeveloper",
          description: "Webinar Registration",
          order_id: order.orderId,
          prefill: { name, email, contact: wa },
          theme: { color: "#229fbd" },
          handler: async (resp) => {
            try {
              const verified = await triggerVerify(resp);
              if (verified.status === "success") {
                resolve();
                onSuccess();
              } else {
                reject(new Error("Payment verification failed."));
              }
            } catch (err) {
              reject(err instanceof Error ? err : new Error(String(err)));
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled.")),
          },
        });
        rzp.open();
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto bg-[#faf7f2] px-5 pb-7 pt-6 text-ink sm:px-6 md:max-w-[860px] md:px-12 md:pt-12 md:pb-16 lg:max-w-[1000px] lg:px-16 xl:max-w-[1100px]">
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="-ml-1.5 mb-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-transparent px-2.5 py-1.5 text-[13px] text-[#444443] transition hover:bg-navy/5 hover:text-navy md:text-sm"
      >
        ← Back
      </button>

      <div className="mb-5 md:mb-7">
        <h1 className="m-0 mb-3 font-serif font-medium leading-[1.08] tracking-[-0.01em] text-navy text-[clamp(32px,9vw,40px)] md:text-[48px] lg:text-[56px]">
          Event{" "}
          <em className="font-medium italic text-teal">Registration</em>
        </h1>
        <p className="m-0 mb-2.5 text-sm leading-[1.55] text-[#444443] md:text-[15px] md:leading-[1.6]">
          This is a live online session by MyNextDeveloper on 17th July, 2026
          from 4:00 PM to 5:15 PM. Join from your phone or laptop, no
          downloads needed. We will teach you how to use AI tools like ChatGPT
          and Google Gemini — no tech background needed at all. Fill in your
          details and we will send the session link to your WhatsApp or Email
          before the event.
        </p>
        <div className="mt-2.5 rounded-[10px] border-l-[3px] border-amber bg-[#fff4d4] px-3 py-2.5 text-[13.5px] leading-[1.5] text-navy">
          This session is priced at <strong className="font-bold">₹499</strong>.
          Register before <strong className="font-bold">4th July</strong> to
          lock in your spot at this price.
        </div>
      </div>

      {showError && (
        <div className="mb-3 rounded-lg border-l-[3px] border-amber bg-[#fff4e0] px-3 py-2.5 text-[13px] text-[#8a5a00]">
          Please complete the highlighted fields.
        </div>
      )}
      {submitError && (
        <div className="mb-3 rounded-lg border-l-[3px] border-[#e07b00] bg-[#fde8d8] px-3 py-2.5 text-[13px] text-[#8a3a00]">
          {submitError}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="md:grid md:grid-cols-2 md:gap-x-4">
          <FloatingInput
            id="rf-name"
            name="name"
            label="Name"
            required
            autoComplete="name"
            hasError={!!errors.name}
          />
          <FloatingInput
            id="rf-email"
            name="email"
            type="email"
            label="Email"
            required
            autoComplete="email"
            hasError={!!errors.email}
          />
          <FloatingInput
            id="rf-wa"
            name="whatsapp"
            type="tel"
            label="WhatsApp Number"
            required
            autoComplete="tel"
            inputMode="tel"
            hasError={!!errors.whatsapp}
          />
          <FloatingSelect
            id="rf-age"
            name="age"
            label="Age"
            required
            options={ageOptions}
            hasError={!!errors.age}
          />
        </div>

        {questions.map((q) => (
          <div
            key={q.id}
            className={`mb-3.5 rounded-[14px] bg-white p-4 transition ${
              errors[q.id]
                ? "shadow-[0_0_0_2px_#ffb915,0_6px_18px_-12px_rgba(2,48,71,0.18)]"
                : "shadow-[0_6px_18px_-12px_rgba(2,48,71,0.18),0_1px_3px_rgba(2,48,71,0.05)]"
            }`}
          >
            <p className="m-0 mb-3 text-[14.5px] font-medium leading-[1.4] text-navy">
              {q.title}{" "}
              <span className="font-bold text-amber">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt) => {
                const selected = pillSelections[q.id].has(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => togglePill(q, opt.value)}
                    className={`inline-flex cursor-pointer select-none items-center rounded-full border-[1.5px] px-3.5 py-2 text-[13.5px] font-medium leading-[1.2] transition ${
                      selected
                        ? "border-amber bg-amber text-navy shadow-[0_6px_14px_-6px_rgba(255,185,21,0.55)] hover:-translate-y-px"
                        : "border-navy/15 bg-white text-navy hover:border-teal"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <p className="m-0 mt-1.5 mb-3 text-center text-xs text-muted">
          Fields marked * are mandatory.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-amber px-5 py-4 text-base font-semibold tracking-[0.01em] text-navy shadow-[0_10px_24px_-10px_rgba(255,185,21,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_rgba(255,185,21,0.65)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          <span>
            {submitting ? "Processing…" : "Pay ₹499 & Complete Registration"}
          </span>
          {!submitting && (
            <span className="inline-block transition group-hover:translate-x-1">
              →
            </span>
          )}
        </button>
      </form>
    </section>
  );
}

function FloatingInput({
  id,
  name,
  label,
  required,
  hasError,
  type = "text",
  autoComplete,
  inputMode,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  hasError?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "tel" | "text" | "email";
}) {
  return (
    <div className="ff-field relative mb-3.5">
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        placeholder=" "
        className={`peer w-full rounded-xl border-[1.5px] bg-white px-3.5 pt-[22px] pb-2.5 font-sans text-base text-ink outline-none transition focus:border-teal focus:shadow-[0_0_0_3px_rgba(34,159,189,0.18)] ${
          hasError ? "border-[#e07b00]" : "border-navy/15"
        }`}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3.5 top-[18px] origin-top-left text-[15px] text-[#8a9199] transition peer-focus:-translate-y-3 peer-focus:text-[11px] peer-focus:tracking-[0.04em] peer-focus:text-teal peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:tracking-[0.04em] peer-[:not(:placeholder-shown)]:text-teal"
      >
        {label}
        {required && <span className="text-amber"> *</span>}
      </label>
    </div>
  );
}

function FloatingSelect({
  id,
  name,
  label,
  required,
  options,
  hasError,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  options: string[];
  hasError?: boolean;
}) {
  const [hasValue, setHasValue] = useState(false);
  return (
    <div className="ff-field relative mb-3.5">
      <select
        id={id}
        name={name}
        required={required}
        defaultValue=""
        onChange={(e) => setHasValue(!!e.target.value)}
        className={`peer w-full appearance-none rounded-xl border-[1.5px] bg-white px-3.5 pt-[22px] pb-2.5 pr-10 font-sans text-base text-ink outline-none transition focus:border-teal focus:shadow-[0_0_0_3px_rgba(34,159,189,0.18)] ${
          hasError ? "border-[#e07b00]" : "border-navy/15"
        }`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='8' viewBox='0 0 14 8'><path d='M1 1l6 6 6-6' fill='none' stroke='%23229fbd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
        }}
      >
        <option value="" disabled hidden></option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-3.5 top-[18px] origin-top-left text-[15px] text-[#8a9199] transition peer-focus:-translate-y-3 peer-focus:text-[11px] peer-focus:tracking-[0.04em] peer-focus:text-teal ${
          hasValue
            ? "-translate-y-3 text-[11px] tracking-[0.04em] text-teal"
            : ""
        }`}
      >
        {label}
        {required && <span className="text-amber"> *</span>}
      </label>
    </div>
  );
}

