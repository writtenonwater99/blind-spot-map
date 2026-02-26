"use client";

import { useState } from "react";
import Header from "@/components/Header";
import DualLanes from "@/components/DualLanes";
import StatsPanel from "@/components/StatsPanel";
import BottomBar from "@/components/BottomBar";

export default function Home() {
  const [bubbleActive, setBubbleActive] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col bg-zkeleton-dark overflow-hidden">
      <Header />

      <div className="flex-1 flex min-h-0">
        {/* Main visualization area */}
        <div className="flex-1 relative grid-bg overflow-hidden">
          <DualLanes active={bubbleActive} />
        </div>

        {/* Stats panel */}
        <StatsPanel
          active={bubbleActive}
          onActivate={() => setBubbleActive(!bubbleActive)}
        />
      </div>

      <BottomBar />
    </div>
  );
}
