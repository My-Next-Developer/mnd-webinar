import type { Metadata } from "next";
import { Footer } from "../components/Footer";

const WHATSAPP_COMMUNITY_URL =
  "https://chat.whatsapp.com/LLrVLgeEjFYFZxzygp7tyA";

export const metadata: Metadata = {
  title: "You're in — MyNextDevelopers",
  description:
    "Your registration for the AI for Every Woman session is confirmed.",
};

export default function ConfirmedPage() {
  return (
    <>
    <section className="flex-1 bg-navy px-6 pb-7 pt-10 text-white md:px-10 md:py-16">
      <div
        className="mx-auto flex max-w-[520px] flex-col items-start gap-[18px] md:max-w-[640px] md:gap-6"
        style={{ paddingTop: "12vh" }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber shadow-[0_12px_28px_-10px_rgba(255,185,21,0.5)] md:h-16 md:w-16">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-navy md:h-8 md:w-8"
          >
            <path d="M4 12l5 5L20 6" />
          </svg>
        </div>
        <h1 className="m-0 whitespace-nowrap font-serif font-medium leading-[1.2] text-white text-[clamp(36px,10vw,48px)] md:text-[64px]">
          You&apos;re <em className="font-medium italic text-amber">in.</em>
        </h1>
        <p className="m-0 text-[15.5px] leading-[1.6] text-white/80 md:text-[17px]">
          Your payment was successful and your spot is confirmed. We&apos;ll
          send the session link to your WhatsApp and email 48 hours before it
          starts. See you there.
        </p>
        <p className="m-0 text-[15.5px] leading-[1.6] text-white/80 md:text-[17px]">
          Join our WhatsApp community for more updates —<br />
          <a
            href={WHATSAPP_COMMUNITY_URL}
            target="_blank"
            rel="noopener"
            className="break-all text-teal underline underline-offset-[3px] transition hover:text-[#4cb8d3]"
          >
            chat.whatsapp.com/LLrVLgeEjFYFZxzygp7tyA
          </a>
        </p>
      </div>
    </section>
    <Footer />
    </>
  );
}
