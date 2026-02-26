"use client";

import { useState } from "react";
import Header from "@/components/Header";
import BottomBar from "@/components/BottomBar";
import DualLanes from "@/components/DualLanes";
import StatsPanel from "@/components/StatsPanel";

export default function Home() {
  const [bubbleActive, setBubbleActive] = useState(false);
  const [activePartners, setActivePartners] = useState<Set<string>>(new Set());

  const togglePartner = (key: string) => {
    setActivePartners((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-zkeleton-dark overflow-hidden">
      <Header />
      <BottomBar />

      <div className="flex-1 flex min-h-0">
        {/* Main visualization area */}
        <div className="flex-1 relative grid-bg overflow-hidden">
          <DualLanes active={bubbleActive} activePartners={activePartners} />
        </div>

        {/* Stats panel */}
        <StatsPanel
          active={bubbleActive}
          onActivate={() => {
            const next = !bubbleActive;
            setBubbleActive(next);
            if (!next) setActivePartners(new Set());
          }}
          activePartners={activePartners}
          onTogglePartner={togglePartner}
        />
      </div>
    </div>
  );
}
