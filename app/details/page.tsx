import type { Metadata } from "next";
import { About } from "../components/About";
import { BonusEbook } from "../components/BonusEbook";
import { Faq } from "../components/Faq";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { Nav } from "../components/Nav";
import { Pricing } from "../components/Pricing";
import { Register } from "../components/Register";

export const metadata: Metadata = {
  title: "AI for Every Woman — MyNextDevelopers",
  description:
    "A focused 75-minute live session where you'll learn to use today's most useful AI tools — confidently, practically, and on your own terms.",
};

export default function DetailsPage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <About />
        <Register />
        <BonusEbook />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
