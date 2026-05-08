"use client";

import Link from "next/link";
import { LockIcon } from "./icons";
import { Reveal } from "./Reveal";
import { trackEvent } from "@/lib/analytics";

const REGISTER_HREF = "/?step=register";

export function Register() {
  return (
    <section id="register" className="pt-8 pb-16 md:pb-24">
      <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-6">
        <Reveal className="flex justify-center">
          <div className="register-glow relative w-full max-w-[720px] overflow-hidden rounded-[28px] bg-navy p-8 text-center text-white shadow-brand-lg sm:p-10 md:px-14 md:py-14">
            <h2 className="m-0 mb-3.5 font-serif font-semibold leading-[1.08] text-white text-[clamp(28px,3.6vw,42px)]">
              Reserve your seat — before early bird closes
            </h2>
            <p className="mx-auto mb-8 max-w-[460px] text-base leading-[1.6] text-white/70">
              Registration takes under a minute. Your seat and live session link
              arrive on WhatsApp/Email right after — and your free ebook is sent
              across once the session ends.
            </p>

            <Link
              href={REGISTER_HREF}
              onClick={() =>
                trackEvent("cta_clicked", {
                  cta: "reserve_seat",
                  location: "details_register_section",
                })
              }
              className="group block w-full rounded-[14px] bg-amber px-7 py-4 text-[17px] font-bold tracking-[0.005em] text-navy shadow-[0_14px_32px_-12px_rgba(255,185,21,0.6)] transition hover:-translate-y-0.5 hover:bg-amber-hover hover:shadow-[0_20px_40px_-14px_rgba(255,185,21,0.7)]"
            >
              Reserve My Spot for ₹499{" "}
              <span className="ml-1.5 inline-block transition group-hover:translate-x-1">
                →
              </span>
            </Link>

            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-[12.5px] text-white/50">
              <LockIcon className="h-3 w-3 opacity-70" />
              Secure registration · Confirmation sent to WhatsApp & Email
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
