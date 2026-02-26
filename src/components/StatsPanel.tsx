"use client";

import { useState, useEffect } from "react";
import {
  stateDataMap,
  TOTAL_SPENDING,
  BLIND_RATE,
  TOTAL_IMPROPER,
  MIDDESK_PROOF,
} from "@/data/stateData";

interface Props {
  activatedState: string | null;
  hoveredState: string | null;
  onActivate: () => void;
}

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  duration = 1200,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatted =
    display >= 1e9
      ? `${(display / 1e9).toFixed(1)}B`
      : display >= 1e6
      ? `${(display / 1e6).toFixed(1)}M`
      : display.toLocaleString();

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export default function StatsPanel({
  activatedState,
  hoveredState,
  onActivate,
}: Props) {
  const hoveredData = hoveredState ? stateDataMap[hoveredState] : null;
  const activatedData = activatedState ? stateDataMap[activatedState] : null;

  return (
    <aside className="w-[380px] border-l border-zkeleton-border bg-zkeleton-panel flex flex-col overflow-y-auto">
      {/* Title section */}
      <div className="p-6 border-b border-zkeleton-border">
        <h2 className="text-xs text-zkeleton-muted tracking-widest uppercase mb-3">
          National Overview
        </h2>
        <div className="text-3xl font-bold text-white mb-1 stat-animate">
          <AnimatedNumber value={TOTAL_SPENDING} prefix="$" />
        </div>
        <p className="text-xs text-zkeleton-muted">
          Total Medicaid Claims — FY 2024
        </p>
      </div>

      {/* Key metrics */}
      <div className="p-6 border-b border-zkeleton-border space-y-5">
        <StatBlock
          label="Blind Claims"
          sublabel="No clinical record attached"
          value={`${(BLIND_RATE * 100).toFixed(0)}%+`}
          color="text-gray-400"
          barPercent={BLIND_RATE * 100}
          barColor="bg-gray-600"
        />
        <StatBlock
          label="Flagged Improper"
          sublabel="HHS OIG estimated improper payments"
          value={
            <AnimatedNumber value={TOTAL_IMPROPER} prefix="$" />
          }
          color="text-red-400"
          barPercent={(TOTAL_IMPROPER / TOTAL_SPENDING) * 100 * 8}
          barColor="bg-red-500/60"
        />
        <StatBlock
          label="Middesk Proof Point"
          sublabel="Fraud identified in single state pilot"
          value={
            <AnimatedNumber value={MIDDESK_PROOF} prefix="$" />
          }
          color="text-zkeleton-teal"
          barPercent={(MIDDESK_PROOF / TOTAL_IMPROPER) * 100}
          barColor="bg-zkeleton-teal/40"
        />
      </div>

      {/* Activate Bubble CTA */}
      <div className="p-6 border-b border-zkeleton-border">
        <button
          onClick={onActivate}
          className={`w-full py-3 px-4 rounded-md font-medium text-sm tracking-wide uppercase transition-all duration-300 ${
            activatedState
              ? "bg-green-500/20 text-green-400 border border-green-500/40 glow-green"
              : "bg-zkeleton-teal/10 text-zkeleton-teal border border-zkeleton-teal/30 hover:bg-zkeleton-teal/20 pulse-teal"
          }`}
        >
          {activatedState ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Bubble Active — {activatedData?.name || "State"}
            </span>
          ) : (
            "Activate Bubble"
          )}
        </button>
        <p className="text-[10px] text-zkeleton-muted mt-2 leading-relaxed">
          {activatedState
            ? "Clinical records matched to claims inside an isolated zero-knowledge environment. Green = verified, auditable, defensible."
            : "Match clinical records to claims inside an isolated ZK environment. Click a state or press this button."}
        </p>
      </div>

      {/* Hovered state detail */}
      {hoveredData && (
        <div className="p-6 border-b border-zkeleton-border animate-in fade-in duration-200">
          <h3 className="text-xs text-zkeleton-muted tracking-widest uppercase mb-3">
            {hoveredData.name}
          </h3>
          <div className="space-y-2">
            <DetailRow
              label="Medicaid Spending"
              value={formatCurrency(hoveredData.spending)}
            />
            <DetailRow
              label="Providers"
              value={hoveredData.providers.toLocaleString()}
            />
            <DetailRow
              label="Est. Improper"
              value={formatCurrency(hoveredData.improperAmount)}
              valueColor="text-red-400"
            />
            <DetailRow
              label="Improper Rate"
              value={`${(hoveredData.improperRate * 100).toFixed(1)}%`}
              valueColor="text-red-400"
            />
          </div>
        </div>
      )}

      {/* The Insight */}
      <div className="p-6 mt-auto">
        <div className="rounded-md border border-zkeleton-border bg-zkeleton-dark/50 p-4">
          <h4 className="text-[10px] text-zkeleton-teal tracking-widest uppercase mb-2">
            The Insight
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Today, payers process{" "}
            <span className="text-white font-medium">$908.8 billion</span> in
            Medicaid claims with{" "}
            <span className="text-gray-300">
              virtually no clinical validation
            </span>
            . Every gray particle on this map is a claim flying blind — no
            diagnosis confirmed, no treatment verified, no outcome measured.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed mt-2">
            Zkeleton bridges the gap —{" "}
            <span className="text-zkeleton-teal font-medium">
              matching clinical records to claims
            </span>{" "}
            inside a privacy-preserving environment, without exposing PHI.
          </p>
        </div>
      </div>
    </aside>
  );
}

function StatBlock({
  label,
  sublabel,
  value,
  color,
  barPercent,
  barColor,
}: {
  label: string;
  sublabel: string;
  value: React.ReactNode;
  color: string;
  barPercent: number;
  barColor: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-zkeleton-muted">{label}</span>
        <span className={`text-lg font-semibold ${color}`}>{value}</span>
      </div>
      <p className="text-[10px] text-zkeleton-muted/60 mb-1.5">{sublabel}</p>
      <div className="h-1 bg-zkeleton-dark rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-1000`}
          style={{ width: `${Math.min(barPercent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueColor = "text-white",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-zkeleton-muted">{label}</span>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}

function formatCurrency(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}
