import Image from "next/image";
import { CheckIcon } from "./icons";
import { Reveal } from "./Reveal";

type Tool = {
  title: string;
  description: string;
  emoji?: string;
  image?: { src: string; alt: string };
};

const tools: Tool[] = [
  {
    title: "ChatGPT",
    description:
      "Writing, planning, brainstorming — your everyday thinking partner.",
    image: { src: "/assets/chatgpt.png", alt: "ChatGPT logo" },
  },
  {
    title: "Google Gemini",
    description:
      "Research, summaries, and quick answers inside tools you already use.",
    image: { src: "/assets/gemini.png", alt: "Google Gemini logo" },
  },
  {
    title: "Claude",
    description:
      "Smarter conversations, document decoding and knowing how to get the most out of it — without hitting your free limit.",
    image: { src: "/assets/claude.png", alt: "Claude logo" },
  },
  {
    title: "AI Image Tools",
    description:
      "Turn ideas into visuals — posters, posts, moodboards, and more.",
    emoji: "🎨",
  },
  {
    title: "Everyday AI",
    description:
      "Small automations and tricks that quietly save hours every week.",
    emoji: "🪄",
  },
];

const learnings = [
  "A clear understanding of what AI can (and can't) do for you",
  "Hands-on prompts you can use the same evening",
  "Ways to apply AI to work, studies, side projects, and home",
  "A shortlist of trustworthy tools worth your time",
  "A supportive community to keep learning after the session ends",
];

export function About() {
  return (
    <section id="about" className="py-18 md:py-24">
      <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-6">
        <Reveal className="mb-10 max-w-[720px] md:mb-14">
          <span className="mb-4 inline-block text-[12.5px] font-bold uppercase tracking-[0.14em] text-teal">
            About the session
          </span>
          <h2 className="m-0 font-serif font-semibold leading-[1.08] tracking-[-0.005em] text-balance text-navy text-[clamp(32px,4.5vw,52px)]">
            What is this webinar about?
          </h2>
        </Reveal>

        <Reveal>
          <div className="max-w-[720px] space-y-4 text-[17px] leading-[1.7] text-body">
            <p>
              AI isn&apos;t just for engineers or people who grew up tinkering
              with computers. It&apos;s for anyone who writes, plans, creates,
              manages a household, runs a business, or just wants an hour of
              their day back. This session is built specifically for women
              who&apos;ve wanted to get started but weren&apos;t sure where to
              begin.
            </p>
            <p>
              We&apos;ll walk through ChatGPT, Google Gemini and Claude in a way
              that&apos;s practical and immediately useful — from writing better
              prompts, changing tone and style, brainstorming ideas, summarising
              long content, generating images, and using AI directly inside
              tools like Gmail and Google Docs. We&apos;ll also show you how to{" "}
              <strong>
                spot the difference between AI-generated content and real images
              </strong>{" "}
              — the small giveaways, patterns, and tells to look for so
              you&apos;re never fooled. No jargon, no coding, no intimidating
              demos. Just real examples, live walkthroughs, and skills you can
              put to work the very next day.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 mb-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <Reveal
              key={tool.title}
              className="group rounded-[14px] border border-hairline bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-hairline-strong hover:shadow-brand-md"
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl text-[22px] ${
                  tool.image
                    ? "border border-hairline bg-white"
                    : "bg-gradient-to-br from-teal/10 to-teal/15"
                }`}
              >
                {tool.image ? (
                  <Image
                    src={tool.image.src}
                    alt={tool.image.alt}
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                ) : (
                  <span aria-hidden="true">{tool.emoji}</span>
                )}
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-navy">
                {tool.title}
              </h3>
              <p className="m-0 text-sm leading-[1.5] text-muted">
                {tool.description}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal className="rounded-[20px] border border-hairline bg-white p-7 sm:p-9 md:px-10 md:py-9">
          <h3 className="mb-5 font-serif text-2xl font-semibold text-navy">
            What you&apos;ll walk away with
          </h3>
          <ul className="m-0 grid list-none grid-cols-1 gap-3.5 p-0 md:grid-cols-2 md:gap-x-8">
            {learnings.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3.5 text-[15.5px] leading-[1.5] text-body"
              >
                <span className="mt-px inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal">
                  <CheckIcon className="h-[13px] w-[13px] text-white" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
