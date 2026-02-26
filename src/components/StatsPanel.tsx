"use client";

import { useState, useEffect } from "react";
import {
  TOTAL_SPENDING,
  BLIND_RATE,
  TOTAL_IMPROPER,
  MIDDESK_PROOF,
} from "@/data/stateData";

interface Props {
  active: boolean;
  onActivate: () => void;
  activePartners: Set<string>;
  onTogglePartner: (key: string) => void;
}

const PARTNER_TILES = [
  {
    key: "cgm",
    label: "Wearable / CGM",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 12h4l3-9 4 18 3-9h4" />
      </svg>
    ),
  },
  {
    key: "pharmacy",
    label: "Pharmacy / PBM",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M9 3h6v4H9z" />
        <path d="M6 7h12v14H6z" />
        <path d="M12 11v6M9 14h6" />
      </svg>
    ),
  },
  {
    key: "rpm",
    label: "Remote Monitoring",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M7 10h2l2-3 2 6 2-3h2" />
      </svg>
    ),
  },
  {
    key: "sdoh",
    label: "Social Determinants",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 12l9-9 9 9" />
        <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
];

function AnimNum({
  value,
  duration = 1400,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  if (display >= 1e9) return <>${(display / 1e9).toFixed(1)}B</>;
  if (display >= 1e6) return <>${(display / 1e6).toFixed(1)}M</>;
  return <>${display.toLocaleString()}</>;
}

export default function StatsPanel({ active, onActivate, activePartners, onTogglePartner }: Props) {
  const hasPartners = activePartners.size > 0;

  return (
    <aside className="w-[380px] border-l border-zkeleton-border bg-zkeleton-panel flex flex-col overflow-y-auto">
      {/* Hero stat */}
      <div className="p-6 border-b border-zkeleton-border">
        <h2 className="text-[10px] text-zkeleton-muted tracking-[0.2em] uppercase mb-3">
          Total Medicaid Claims · FY 2024
        </h2>
        <div className="text-4xl font-bold text-white mb-2 tracking-tight">
          <AnimNum value={TOTAL_SPENDING} />
        </div>
        <p className="text-[11px] text-zkeleton-muted leading-relaxed">
          Processed using billing codes alone.
          <br />
          No diagnosis confirmed. No treatment verified.
        </p>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-b border-zkeleton-border">
        <div className="flex items-center gap-5 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-2.5 rounded-sm bg-gray-700/60 border border-gray-600/30" />
            <span className="text-gray-500">Blind</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-2.5 rounded-sm bg-red-500/20 border border-red-500/40" />
            <span className="text-red-400">Flagged</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-2.5 rounded-sm bg-green-500/20 border border-green-500/40" />
            <span className="text-green-400">Matched</span>
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-6 border-b border-zkeleton-border space-y-5">
        <Metric
          label="Claims Flying Blind"
          value={`${(BLIND_RATE * 100).toFixed(0)}%+`}
          sub="Processed without checking the medical record"
          color="text-gray-300"
          bar="bg-gray-600"
          fill={95}
        />
        <Metric
          label="Estimated Improper Payments"
          value={<AnimNum value={TOTAL_IMPROPER} />}
          sub="Paid wrong, paid twice, or paid for nothing"
          color="text-red-400"
          bar="bg-red-500/70"
          fill={27}
        />
        <Metric
          label="Single-State Proof Point"
          value={<AnimNum value={MIDDESK_PROOF} />}
          sub="Surfaced when clinical records were finally matched"
          color="text-zkeleton-teal"
          bar="bg-zkeleton-teal/50"
          fill={5.5}
        />
      </div>

      {/* How it works */}
      <div className="p-6 border-b border-zkeleton-border">
        <h3 className="text-[10px] text-zkeleton-teal tracking-[0.2em] uppercase mb-4">
          {active ? "What Just Happened" : "How It Works"}
        </h3>

        <div className="space-y-3">
          <Step
            n="1"
            active={active}
            done={active}
            text="Claims data sits in the insurer's system — billing codes, amounts, provider IDs."
          />
          <Step
            n="2"
            active={active}
            done={active}
            text="Clinical data sits in hospital EHRs — doctor's notes, labs, imaging, vitals."
          />
          <Step
            n="3"
            active={active}
            done={active}
            text={
              active
                ? "Zkeleton's Private Bubble matched both datasets. Every claim linked to its medical record. Full Fidelity."
                : "Today these never meet. 95% of claims are paid without anyone checking the chart."
            }
          />
        </div>
      </div>

      {/* Activate CTA */}
      <div className="p-6 border-b border-zkeleton-border">
        <button
          onClick={onActivate}
          className={`w-full py-3 rounded font-medium text-xs tracking-wider uppercase transition-all duration-500 cursor-pointer ${
            active
              ? "bg-green-500/10 text-green-400 border border-green-500/25 hover:bg-green-500/15"
              : "bg-zkeleton-teal/8 text-zkeleton-teal border border-zkeleton-teal/20 hover:bg-zkeleton-teal/15 pulse-teal"
          }`}
        >
          {active ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Bubble Active — Analyzing Claims
            </span>
          ) : (
            "\u2197 Activate Bubble"
          )}
        </button>
      </div>

      {/* ============ PARTNER ECOSYSTEM GRID ============ */}
      {active && (
        <div className="p-6 border-b border-zkeleton-border animate-fadeIn">
          <h3 className="text-[10px] text-zkeleton-teal tracking-[0.2em] uppercase mb-1">
            Bubble Ecosystem
          </h3>
          <p className="text-[9px] text-gray-600 mb-4">
            The insurer is the landlord. Partners are tenants.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {PARTNER_TILES.map((p) => {
              const isActive = activePartners.has(p.key);
              return (
                <button
                  key={p.key}
                  onClick={() => onTogglePartner(p.key)}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded-lg text-center transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-zkeleton-teal/10 border border-zkeleton-teal/30 shadow-[0_0_12px_rgba(45,212,170,0.08)]"
                      : "bg-white/[0.01] border border-dashed border-gray-700/60 hover:border-gray-500 hover:bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`transition-colors ${
                      isActive ? "text-zkeleton-teal" : "text-gray-600"
                    }`}
                  >
                    {p.icon}
                  </span>
                  <span
                    className={`text-[9px] tracking-wider uppercase font-medium leading-tight ${
                      isActive ? "text-zkeleton-teal" : "text-gray-500"
                    }`}
                  >
                    {p.label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-zkeleton-teal animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {!hasPartners && (
            <p className="text-[9px] text-gray-600 text-center mt-3">
              Invite partners to enrich every claim in the bubble
            </p>
          )}
        </div>
      )}

      {/* ============ VALUE EXCHANGE — appears when any partner is active ============ */}
      {active && hasPartners && (
        <div className="p-6 border-b border-zkeleton-border animate-fadeIn">
          <h3 className="text-[10px] text-zkeleton-teal tracking-[0.2em] uppercase mb-4">
            Value Exchange
          </h3>

          {/* What the insurer gets */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[9px] text-green-400 tracking-wider uppercase font-medium">
                Insurer Gets
              </span>
            </div>
            <div className="space-y-1.5 pl-3">
              <p className="text-[10px] text-gray-300 leading-relaxed">
                Device &amp; partner data enriching every claim
              </p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                Population health intelligence at scale
              </p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                Real-world evidence for risk adjustment
              </p>
            </div>
          </div>

          {/* What the partner gets */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zkeleton-teal" />
              <span className="text-[9px] text-zkeleton-teal tracking-wider uppercase font-medium">
                Partner Gets
              </span>
            </div>
            <div className="space-y-1.5 pl-3">
              <p className="text-[10px] text-gray-300 leading-relaxed">
                Clinical context they never had access to
              </p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                Outcome correlation — does their product work?
              </p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                Patient identification without buying data
              </p>
            </div>
          </div>

          {/* The rule */}
          <div className="rounded border border-zkeleton-teal/15 bg-zkeleton-teal/[0.03] px-3 py-2.5">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              No data leaves the bubble. No data is sold.
            </p>
            <p className="text-[11px] text-zkeleton-teal font-medium mt-1">
              The insurer doesn't sell data. They sell seats at the table.
            </p>
          </div>
        </div>
      )}

      {/* Inside the Bubble — appears when active */}
      {active && (
        <div className="px-6 py-4 border-b border-zkeleton-border animate-fadeIn">
          <h3 className="text-[10px] text-green-400 tracking-[0.2em] uppercase mb-3">
            Inside the Bubble
          </h3>
          <div className="space-y-2.5 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-gray-300">
                Clinical data flowing via FHIR/TEFCA
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-gray-300">
                Claims matched to medical records
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-gray-300">
                AI running on full-fidelity dataset
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-gray-300">
                Improper payments surfacing in real-time
              </span>
            </div>
            {hasPartners && (
              <div className="mt-1 pt-2 border-t border-zkeleton-border/50 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zkeleton-teal" />
                  <span className="text-gray-300">
                    {activePartners.size} partner{activePartners.size > 1 ? "s" : ""} inside the bubble
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zkeleton-teal" />
                  <span className="text-gray-300">
                    Partner data enriching clinical context
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom insight */}
      <div className="p-6 mt-auto">
        <div className="rounded border border-zkeleton-border bg-zkeleton-dark/60 p-5">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Every other company either analyzes{" "}
            <span className="text-gray-300">billing codes</span> or pulls{" "}
            <span className="text-gray-300">charts one at a time</span>.
            Nobody builds the infrastructure that puts both datasets together.
          </p>
          <p className="text-[11px] text-gray-400 leading-relaxed mt-3">
            Everyone else grades book reports.
          </p>
          <p className="text-[12px] text-zkeleton-teal font-medium mt-1">
            Zkeleton gives you the book.
          </p>
        </div>

        <div className="mt-3 text-[9px] text-gray-600 leading-relaxed">
          Source: CMS T-MSIS / KFF State Health Facts / HHS OIG.
          <br />
          Provider-level data: HHS-Official/medicaid-provider-spending (Hugging
          Face).
        </div>
      </div>
    </aside>
  );
}

function Metric({
  label,
  value,
  sub,
  color,
  bar,
  fill,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  color: string;
  bar: string;
  fill: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] text-zkeleton-muted">{label}</span>
        <span className={`text-lg font-semibold ${color}`}>{value}</span>
      </div>
      <p className="text-[10px] text-zkeleton-muted/50 mb-2">{sub}</p>
      <div className="h-[3px] bg-zkeleton-dark rounded-full overflow-hidden">
        <div
          className={`h-full ${bar} rounded-full transition-all duration-[1500ms] ease-out`}
          style={{ width: `${Math.min(fill, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Step({
  n,
  active,
  done,
  text,
}: {
  n: string;
  active: boolean;
  done: boolean;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 transition-all duration-500 ${
          done
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-zkeleton-dark text-gray-600 border border-zkeleton-border"
        }`}
      >
        {done ? "\u2713" : n}
      </div>
      <p
        className={`text-[11px] leading-relaxed transition-colors duration-500 ${
          done ? "text-gray-300" : "text-gray-500"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
