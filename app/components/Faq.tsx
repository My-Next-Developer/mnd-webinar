"use client";

import { useState, type ReactNode } from "react";
import { ChevronDownIcon } from "./icons";
import { Reveal } from "./Reveal";
import { trackEvent } from "@/lib/analytics";

const WHATSAPP_URL = "https://chat.whatsapp.com/placeholder";

type FaqItem = { q: string; a: ReactNode };

const faqs: FaqItem[] = [
  {
    q: "Do I need any technical knowledge to join?",
    a: "Not at all. This session is built for complete beginners. If you can send a WhatsApp message, you can follow along — everything is walked through step by step in plain language.",
  },
  {
    q: "What device do I need?",
    a: "A laptop is ideal so you can try things alongside the session, but a phone or tablet works perfectly too. All the tools we cover run directly in the browser — nothing to install.",
  },
  {
    q: "How long is the session?",
    a: "The live session runs for about 75 minutes, with time at the end for Q&A so you can ask anything that came up along the way.",
  },
  {
    q: "Will I get any bonuses with my seat?",
    a: (
      <>
        Yes — every attendee gets <strong>free access to our internal ebook</strong>,{" "}
        <em>
          &ldquo;How We Use AI to Run Our Business — Without the BS and Within
          Our Budget,&rdquo;
        </em>{" "}
        sent to your WhatsApp{" "}
        <strong>right after the live session ends</strong>. It&apos;s the same
        playbook our team uses, and it&apos;s yours to keep forever. Please
        note that <strong>this session is live-only</strong> — there is no
        recording, so be sure to join us on the day.
      </>
    ),
  },
  {
    q: "Is this session only for women?",
    a: "The session is designed with women in mind — the examples, pace, and community are built around that experience — but registration is open to anyone who feels this would be valuable for them.",
  },
  {
    q: "How will I receive the session link?",
    a: "Right after you register, you'll get a confirmation on WhatsApp with your seat details. The live session link arrives on WhatsApp the day before and again an hour before the session starts, so you never miss it.",
  },
  {
    q: "What if I have more questions before registering?",
    a: (
      <>
        Jump into our{" "}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener"
          className="font-semibold text-teal underline decoration-teal/30 decoration-[1.5px] underline-offset-2 transition hover:decoration-teal"
        >
          WhatsApp community
        </a>{" "}
        using the button at the top of this page — ask anything there and one
        of our community admins shall respond promptly.
      </>
    ),
  },
];

export function Faq() {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      const willOpen = !next.has(idx);
      if (willOpen) next.add(idx);
      else next.delete(idx);
      trackEvent("faq_toggled", {
        question: faqs[idx].q,
        action: willOpen ? "open" : "close",
        index: idx,
      });
      return next;
    });
  };

  return (
    <section
      id="faq"
      className="border-t border-hairline bg-white py-18 md:py-24"
    >
      <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-6">
        <Reveal className="mx-auto mb-10 max-w-[720px] text-center md:mb-12">
          <span className="mb-4 inline-block text-[12.5px] font-bold uppercase tracking-[0.14em] text-teal">
            Questions
          </span>
          <h2 className="m-0 font-serif font-semibold leading-[1.08] tracking-[-0.005em] text-balance text-navy text-[clamp(32px,4.5vw,52px)]">
            Frequently asked
          </h2>
        </Reveal>

        <Reveal className="mx-auto max-w-[780px]">
          <div>
            {faqs.map((item, idx) => {
              const isOpen = openIndices.has(idx);
              return (
                <div
                  key={item.q}
                  className={`border-b border-hairline ${
                    idx === 0 ? "border-t" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${idx}`}
                    onClick={() => toggle(idx)}
                    className="group flex w-full items-center justify-between gap-5 px-1 py-6 text-left text-[17px] font-medium text-navy transition hover:text-teal"
                  >
                    <span>{item.q}</span>
                    <span
                      className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition duration-300 ${
                        isOpen
                          ? "rotate-180 bg-teal text-white"
                          : "bg-teal/10 text-teal"
                      }`}
                    >
                      <ChevronDownIcon className="h-3 w-3" />
                    </span>
                  </button>
                  <div
                    id={`faq-a-${idx}`}
                    role="region"
                    className={`faq-answer ${isOpen ? "open" : ""}`}
                  >
                    <div>
                      <p className="m-0 px-1 pb-6 text-[15.5px] leading-[1.65] text-body">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
