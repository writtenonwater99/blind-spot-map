"use client";

import { useState } from "react";
import BlindSpotMap from "@/components/BlindSpotMap";
import StatsPanel from "@/components/StatsPanel";
import Header from "@/components/Header";
import BottomBar from "@/components/BottomBar";

export default function Home() {
  const [activatedState, setActivatedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  return (
    <div className="h-screen w-screen flex flex-col bg-zkeleton-dark overflow-hidden">
      <Header />

      <div className="flex-1 flex min-h-0">
        {/* Map area */}
        <div className="flex-1 relative grid-bg">
          <BlindSpotMap
            activatedState={activatedState}
            onActivate={setActivatedState}
            onHover={setHoveredState}
          />
        </div>

        {/* Stats panel */}
        <StatsPanel
          activatedState={activatedState}
          hoveredState={hoveredState}
          onActivate={() => setActivatedState(activatedState ? null : "36")}
        />
      </div>

      <BottomBar />
    </div>
  );
}
