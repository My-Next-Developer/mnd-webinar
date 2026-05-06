import type { Metadata } from "next";
import { Footer } from "./components/Footer";
import { QuizApp } from "./components/quiz/QuizApp";

export const metadata: Metadata = {
  title: "Can you spot the AI? — MyNextDeveloper",
  description:
    "A quick visual test — can you tell which image is AI? Take the test, then learn how it's done in our 75-minute live session.",
};

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f2]">
      <div className="flex flex-1 items-stretch justify-center">
        <QuizApp />
      </div>
      <Footer />
    </div>
  );
}
