"use client";

import { useState, useEffect } from "react";

interface InsightLine {
  text: string;
  highlight: string;
}

const LINES: InsightLine[] = [
  {
    text: "Claims data = what was billed. Clinical data = what actually happened.",
    highlight: "The gap is where the money hides.",
  },
  {
    text: "190M Americans exposed through shared infrastructure.",
    highlight: "Zkeleton: no shared infrastructure. No breach contagion.",
  },
  {
    text: "CMS-0057 mandates clinical data exchange by January 2027.",
    highlight: "Insurers must receive clinical data. They have no idea what to do with it.",
  },
  {
    text: "Every other vendor asks the insurer to be a tenant on their platform.",
    highlight: "We make the insurer the landlord.",
  },
  {
    text: "AI trained on billing codes is just faster guessing.",
    highlight: "Full fidelity changes what AI can see.",
  },
  {
    text: "Everyone else grades book reports.",
    highlight: "Zkeleton gives you the book.",
  },
];

const HOLD = 6500;
const FADE = 500;

export default function BottomBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % LINES.length);
        setVisible(true);
      }, FADE);
    }, HOLD);

    return () => clearInterval(interval);
  }, []);

  const line = LINES[index];

  return (
    <footer className="px-6 py-3 border-t border-zkeleton-border bg-zkeleton-panel/80 backdrop-blur-sm">
      <p
        className="text-center text-[11px] tracking-wide transition-all ease-in-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(4px)",
          transitionDuration: `${FADE}ms`,
        }}
      >
        <span className="text-gray-500">{line.text}</span>
        {"  "}
        <span className="text-zkeleton-teal font-medium">{line.highlight}</span>
      </p>
    </footer>
  );
}
