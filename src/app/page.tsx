"use client";

import { useState } from "react";
import Header from "@/components/Header";

import DualLanes from "@/components/DualLanes";
import StatsPanel from "@/components/StatsPanel";

export default function Home() {
  const [bubbleActive, setBubbleActive] = useState(false);
  const [paused, setPaused] = useState(false);
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
      <div className="flex-1 flex min-h-0">
        {/* Main visualization area */}
        <div className="flex-1 relative grid-bg overflow-hidden">
          <DualLanes
            active={bubbleActive}
            paused={paused}
            activePartners={activePartners}
          />
        </div>

        {/* Stats panel */}
        <StatsPanel
          active={bubbleActive}
          paused={paused}
          onActivate={() => { setBubbleActive(true); setPaused(false); }}
          onDeactivate={() => { setBubbleActive(false); setPaused(false); }}
          onTogglePause={() => setPaused(!paused)}
          activePartners={activePartners}
          onTogglePartner={togglePartner}
        />
      </div>
    </div>
  );
}
