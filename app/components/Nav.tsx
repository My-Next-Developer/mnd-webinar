"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { WhatsAppIcon } from "./icons";
import { trackEvent } from "@/lib/analytics";

const WHATSAPP_URL = "https://chat.whatsapp.com/placeholder";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-white/5 transition-[box-shadow,background] duration-200 ${
        scrolled
          ? "bg-navy-2 shadow-[0_6px_24px_-8px_rgba(0,0,0,0.4)]"
          : "bg-navy"
      }`}
    >
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-3.5">
        <Link
          href="https://mynextdevelopers.com"
          target="_blank"
          rel="noopener"
          aria-label="MyNextDevelopers"
          onClick={() =>
            trackEvent("nav_link_clicked", {
              link: "logo",
              destination: "mynextdevelopers.com",
            })
          }
          className="inline-flex h-7 items-center sm:h-9"
        >
          <Image
            src="/assets/mnd-logo-white.png"
            alt="MyNextDevelopers"
            width={180}
            height={36}
            priority
            className="h-full w-auto"
          />
        </Link>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener"
          onClick={() =>
            trackEvent("external_link_clicked", {
              link: "whatsapp_community",
              location: "nav",
            })
          }
          className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-whatsapp px-3 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_16px_-6px_rgba(37,211,102,0.5)] transition hover:-translate-y-px hover:bg-whatsapp-dark hover:shadow-[0_10px_22px_-6px_rgba(37,211,102,0.55)] sm:px-4 sm:text-sm"
        >
          <WhatsAppIcon className="h-[18px] w-[18px] flex-shrink-0" />
          <span className="hidden sm:inline">Join our community</span>
          <span className="sm:hidden">Community</span>
        </a>
      </div>
    </nav>
  );
}
