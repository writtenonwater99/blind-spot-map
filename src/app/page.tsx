"use client";

import { useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomBar from "@/components/BottomBar";
import DualLanes from "@/components/DualLanes";
import StatsPanel from "@/components/StatsPanel";

export default function Home() {
  const [bubbleActive, setBubbleActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activePartners, setActivePartners] = useState<Set<string>>(new Set());
  const [timeProjection, setTimeProjection] = useState<null | "6mo" | "12mo">(null);
  const [fastForwarding, setFastForwarding] = useState(false);
  const ffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePartner = (key: string) => {
    setActivePartners((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onTimeProject = useCallback((period: "6mo" | "12mo") => {
    setTimeProjection(period);
    setFastForwarding(true);
    setPaused(false);
    if (ffTimerRef.current) clearTimeout(ffTimerRef.current);
    ffTimerRef.current = setTimeout(() => {
      setFastForwarding(false);
    }, 3000);
  }, []);

  const onResetProjection = useCallback(() => {
    setTimeProjection(null);
    setFastForwarding(false);
    if (ffTimerRef.current) clearTimeout(ffTimerRef.current);
  }, []);

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
            onActivate={() => { setBubbleActive(true); setPaused(false); }}
            fastForwarding={fastForwarding}
            timeProjection={timeProjection}
          />
        </div>

        {/* Stats panel */}
        <StatsPanel
          active={bubbleActive}
          paused={paused}
          onActivate={() => { setBubbleActive(true); setPaused(false); }}
          onDeactivate={() => { setBubbleActive(false); setPaused(false); setTimeProjection(null); setFastForwarding(false); }}
          onTogglePause={() => setPaused(!paused)}
          activePartners={activePartners}
          onTogglePartner={togglePartner}
          fastForwarding={fastForwarding}
          timeProjection={timeProjection}
          onTimeProject={onTimeProject}
          onResetProjection={onResetProjection}
        />
      </div>
      <BottomBar />
    </div>
  );
}
