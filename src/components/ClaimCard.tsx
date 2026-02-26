"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface ClaimScenario {
  id: string;
  billing: { label: string; value: string; sub: string }[];
  clinical: { label: string; value: string }[];
  outcome: "verified" | "improper";
  finding: string;
  amount: string;
}

const SCENARIOS: ClaimScenario[] = [
  {
    id: "#4,291,038",
    outcome: "verified",
    finding: "Diagnosis, severity, and treatment confirmed against clinical documentation.",
    amount: "$4,200.00",
    billing: [
      { label: "CPT Code", value: "99215", sub: "Office visit, Level 5" },
      { label: "ICD-10", value: "I50.9", sub: "Heart failure, unspecified" },
      { label: "Amount", value: "$4,200.00", sub: "Billed amount" },
      { label: "Provider", value: "NPI 1376609297", sub: "Dr. A. Smith, Cardiology" },
      { label: "Date", value: "2024-07-14", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"Patient presents with acute' },
      { label: "", value: "dyspnea, orthopnea x3 days," },
      { label: "", value: 'bilateral LE edema."' },
      { label: "BNP", value: "1,840 pg/mL ↑↑" },
      { label: "Echo", value: "EF 25%, severe LV dysfunction" },
      { label: "CXR", value: "Bilateral pulmonary edema" },
      { label: "SpO2", value: "88% on room air" },
    ],
  },
  {
    id: "#4,291,039",
    outcome: "improper",
    finding: "Upcoded — billed Level 5, clinical supports Level 2 at most. Overpayment: $3,680.",
    amount: "$4,500.00",
    billing: [
      { label: "CPT Code", value: "99215", sub: "Office visit, Level 5" },
      { label: "ICD-10", value: "J06.9", sub: "Acute upper respiratory infection" },
      { label: "Amount", value: "$4,500.00", sub: "Billed amount" },
      { label: "Provider", value: "NPI 1922467554", sub: "Dr. R. Patel, Internal Med" },
      { label: "Date", value: "2024-08-02", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"Patient presents with 3-day' },
      { label: "", value: "history of sore throat and" },
      { label: "", value: 'nasal congestion. No fever."' },
      { label: "Vitals", value: "BP 122/78, HR 72, T 98.4°F" },
      { label: "Exam", value: "Mild pharyngeal erythema" },
      { label: "Plan", value: "Supportive care, OTC meds" },
      { label: "Time", value: "8 min encounter documented" },
    ],
  },
  {
    id: "#4,291,040",
    outcome: "verified",
    finding: "Emergency presentation confirmed. Clinical documentation supports Level 4 ER visit.",
    amount: "$8,940.00",
    billing: [
      { label: "CPT Code", value: "99284", sub: "ER visit, Level 4" },
      { label: "ICD-10", value: "I21.0", sub: "ST elevation MI, anterior wall" },
      { label: "Amount", value: "$8,940.00", sub: "Billed amount" },
      { label: "Provider", value: "NPI 1548392017", sub: "Dr. L. Chen, Emergency Med" },
      { label: "Date", value: "2024-06-22", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"62 y/o male, crushing chest' },
      { label: "", value: "pain radiating to left arm," },
      { label: "", value: 'diaphoretic, onset 45 min ago"' },
      { label: "ECG", value: "ST elevation V1-V4" },
      { label: "Trop", value: "Troponin I: 4.2 ng/mL ↑↑↑" },
      { label: "Cath", value: "95% LAD occlusion → PCI w/ stent" },
      { label: "Outcome", value: "Transferred to CCU, stable" },
    ],
  },
  {
    id: "#4,291,041",
    outcome: "improper",
    finding: "Phantom billing — no patient encounter found in clinical record for this date of service.",
    amount: "$12,400.00",
    billing: [
      { label: "CPT Code", value: "27447", sub: "Total knee replacement" },
      { label: "ICD-10", value: "M17.11", sub: "Primary osteoarthritis, right knee" },
      { label: "Amount", value: "$12,400.00", sub: "Billed amount" },
      { label: "Provider", value: "NPI 1689204538", sub: "Dr. J. Morrison, Orthopedic" },
      { label: "Date", value: "2024-09-11", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: "" },
      { label: "", value: "" },
      { label: "", value: "— NO ENCOUNTER FOUND —" },
      { label: "", value: "" },
      { label: "EHR", value: "No record for this patient on 9/11" },
      { label: "Sched", value: "No surgery scheduled this date" },
      { label: "OR Log", value: "Patient not in OR log" },
    ],
  },
  {
    id: "#4,291,042",
    outcome: "verified",
    finding: "Lab panel medically necessary. Results confirm metabolic monitoring for chronic condition.",
    amount: "$890.00",
    billing: [
      { label: "CPT Code", value: "80053", sub: "Comprehensive metabolic panel" },
      { label: "ICD-10", value: "E11.65", sub: "Type 2 diabetes w/ hyperglycemia" },
      { label: "Amount", value: "$890.00", sub: "Billed amount" },
      { label: "Provider", value: "NPI 1234567890", sub: "Quest Diagnostics" },
      { label: "Date", value: "2024-07-30", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"Quarterly metabolic panel for' },
      { label: "", value: "diabetes management, patient on" },
      { label: "", value: 'metformin + glipizide."' },
      { label: "HbA1c", value: "8.2% (target <7%)" },
      { label: "Gluc", value: "186 mg/dL fasting ↑" },
      { label: "Cr", value: "1.1 mg/dL (stable)" },
      { label: "eGFR", value: "72 mL/min (stage 2 CKD)" },
    ],
  },
  {
    id: "#4,291,043",
    outcome: "improper",
    finding: "Duplicate billing — same procedure billed twice. Second claim is duplicate. Overpayment: $2,100.",
    amount: "$2,100.00",
    billing: [
      { label: "CPT Code", value: "43239", sub: "Upper GI endoscopy with biopsy" },
      { label: "ICD-10", value: "K21.0", sub: "GERD with esophagitis" },
      { label: "Amount", value: "$2,100.00", sub: "Billed amount" },
      { label: "Provider", value: "NPI 1456789012", sub: "Dr. M. Wong, Gastroenterology" },
      { label: "Date", value: "2024-08-15", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"EGD performed for persistent' },
      { label: "", value: "GERD symptoms. Biopsy taken" },
      { label: "", value: 'from distal esophagus."' },
      { label: "Note", value: "Single procedure documented" },
      { label: "Time", value: "Procedure: 10:42 - 11:08 AM" },
      { label: "Flag", value: "⚠ Identical claim paid on 8/14" },
      { label: "Match", value: "Same NPI, same patient, same CPT" },
    ],
  },
  {
    id: "#4,291,044",
    outcome: "improper",
    finding: "Service not rendered — billed for 60-min psychotherapy, clinical shows 15-min med check only.",
    amount: "$3,600.00",
    billing: [
      { label: "CPT Code", value: "90837", sub: "Psychotherapy, 60 minutes" },
      { label: "ICD-10", value: "F33.1", sub: "Major depressive disorder, recurrent" },
      { label: "Amount", value: "$3,600.00", sub: "Billed amount" },
      { label: "Provider", value: "NPI 1567890123", sub: "Dr. K. Reeves, Psychiatry" },
      { label: "Date", value: "2024-09-03", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"Brief medication management' },
      { label: "", value: "visit. Patient stable on current" },
      { label: "", value: 'regimen. No therapy provided."' },
      { label: "Time", value: "15 min face-to-face documented" },
      { label: "Plan", value: "Continue sertraline 100mg" },
      { label: "Next", value: "Follow-up in 3 months" },
      { label: "Flag", value: "⚠ Billed 60 min, documented 15 min" },
    ],
  },
  {
    id: "#4,291,045",
    outcome: "verified",
    finding: "High-complexity surgical claim fully supported by operative report and post-op documentation.",
    amount: "$15,200.00",
    billing: [
      { label: "CPT Code", value: "33533", sub: "CABG, single arterial graft" },
      { label: "ICD-10", value: "I25.10", sub: "Atherosclerotic heart disease" },
      { label: "Amount", value: "$15,200.00", sub: "Billed amount" },
      { label: "Provider", value: "NPI 1678901234", sub: "Dr. S. Gupta, Cardiothoracic" },
      { label: "Date", value: "2024-05-18", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"CABG x1 (LIMA to LAD).' },
      { label: "", value: "Cardiopulmonary bypass 82 min." },
      { label: "", value: 'Cross-clamp 54 min."' },
      { label: "Cath", value: "90% LAD stenosis, 70% RCA" },
      { label: "EF", value: "Pre-op EF 40%, post-op 48%" },
      { label: "LOS", value: "5 days, discharged stable" },
      { label: "Path", value: "Graft patency confirmed on echo" },
    ],
  },
];

interface Props {
  active: boolean;
  onActivate: () => void;
}

const REVEAL_DELAY = 1100;
const PAUSE_AFTER_REVEAL = 3000;
const TRANSITION_TIME = 2000;

export default function ClaimCard({ active, onActivate }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedLines, setRevealedLines] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [improperCount, setImproperCount] = useState(0);
  const [recoveredAmount, setRecoveredAmount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const revealRef = useRef<NodeJS.Timeout | null>(null);

  const scenario = SCENARIOS[currentIndex % SCENARIOS.length];

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (revealRef.current) clearInterval(revealRef.current);
  };

  const revealClinical = useCallback((scenarioIdx: number) => {
    const sc = SCENARIOS[scenarioIdx % SCENARIOS.length];
    setRevealedLines(0);
    setShowResult(false);

    let i = 0;
    revealRef.current = setInterval(() => {
      i++;
      setRevealedLines(i);
      if (i >= sc.clinical.length) {
        if (revealRef.current) clearInterval(revealRef.current);
        setTimeout(() => {
          setShowResult(true);
          setProcessedCount((c) => c + 1);
          if (sc.outcome === "improper") {
            setImproperCount((c) => c + 1);
            const amt = parseFloat(sc.amount.replace(/[$,]/g, ""));
            setRecoveredAmount((c) => c + amt);
          }

          timerRef.current = setTimeout(() => {
            setTransitioning(true);
            setTimeout(() => {
              const nextIdx = (scenarioIdx + 1) % SCENARIOS.length;
              setCurrentIndex(nextIdx);
              setRevealedLines(0);
              setShowResult(false);
              setTransitioning(false);
              setTimeout(() => revealClinical(nextIdx), 700);
            }, TRANSITION_TIME);
          }, PAUSE_AFTER_REVEAL);
        }, 800);
      }
    }, REVEAL_DELAY);
  }, []);

  const handleActivate = () => {
    if (!active) {
      onActivate();
      setProcessedCount(0);
      setImproperCount(0);
      setRecoveredAmount(0);
      revealClinical(currentIndex);
    } else {
      clearTimers();
      onActivate();
      setRevealedLines(0);
      setShowResult(false);
      setTransitioning(false);
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (active) {
      setProcessedCount(0);
      setImproperCount(0);
      setRecoveredAmount(0);
      revealClinical(currentIndex);
    } else {
      clearTimers();
      setRevealedLines(0);
      setShowResult(false);
      setTransitioning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const isImproper = scenario.outcome === "improper";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Live counter bar */}
      {active && (
        <div className="flex items-center gap-6 text-[10px] tracking-wider uppercase animate-fadeIn">
          <span className="text-gray-500">
            Processed:{" "}
            <span className="text-white font-semibold tabular-nums">{processedCount}</span>
          </span>
          <span className="text-gray-500">
            Improper:{" "}
            <span className="text-red-400 font-semibold tabular-nums">{improperCount}</span>
          </span>
          <span className="text-gray-500">
            Recovered:{" "}
            <span className="text-zkeleton-teal font-semibold tabular-nums">
              ${recoveredAmount.toLocaleString()}
            </span>
          </span>
        </div>
      )}

      {/* Main card */}
      <div
        className={`relative transition-all duration-700 ${
          active ? "scale-[1.01]" : ""
        } ${transitioning ? "opacity-0 scale-[0.97]" : "opacity-100 scale-100"}`}
        style={{ transition: "opacity 0.4s, transform 0.5s" }}
      >
        {/* Outer glow */}
        {showResult && (
          <div
            className={`absolute -inset-4 rounded-2xl blur-xl transition-opacity duration-500 ${
              isImproper
                ? "bg-red-500/8 animate-pulse"
                : "bg-green-500/5 animate-pulse"
            }`}
          />
        )}

        <div
          className={`relative w-[720px] rounded-lg border transition-all duration-500 overflow-hidden ${
            showResult && isImproper
              ? "border-red-500/40 shadow-[0_0_60px_rgba(239,68,68,0.12)]"
              : showResult
              ? "border-green-500/40 shadow-[0_0_60px_rgba(34,197,94,0.12)]"
              : active
              ? "border-zkeleton-teal/20 shadow-[0_0_40px_rgba(45,212,170,0.06)]"
              : "border-zkeleton-border shadow-[0_0_60px_rgba(0,0,0,0.5)]"
          }`}
        >
          {/* Header */}
          <div
            className={`px-6 py-4 border-b flex items-center justify-between transition-all duration-500 ${
              showResult && isImproper
                ? "border-red-500/20 bg-red-500/5"
                : showResult
                ? "border-green-500/20 bg-green-500/5"
                : "border-zkeleton-border bg-zkeleton-panel"
            }`}
          >
            <div className="flex items-center gap-3">
              {showResult && (
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    isImproper ? "bg-red-400" : "bg-green-400"
                  }`}
                />
              )}
              {active && !showResult && (
                <span className="w-2.5 h-2.5 rounded-full bg-zkeleton-teal animate-pulse" />
              )}
              <span className="text-xs text-zkeleton-muted tracking-[0.15em] uppercase">
                Claim
              </span>
              <span className="text-sm text-white font-mono font-medium tabular-nums">
                {scenario.id}
              </span>
            </div>
            <div>
              {showResult ? (
                <span
                  className={`text-[10px] tracking-wider uppercase font-medium px-2 py-0.5 rounded border ${
                    isImproper
                      ? "text-red-400 border-red-500/30 bg-red-500/10"
                      : "text-green-400 border-green-500/30 bg-green-500/10"
                  }`}
                >
                  {isImproper ? "Improper Payment" : "Full Fidelity"}
                </span>
              ) : active ? (
                <span className="text-[10px] tracking-wider uppercase text-zkeleton-teal font-medium px-2 py-0.5 rounded border border-zkeleton-teal/30 bg-zkeleton-teal/10">
                  Analyzing...
                </span>
              ) : (
                <span className="text-[10px] tracking-wider uppercase text-gray-500 font-medium px-2 py-0.5 rounded border border-zkeleton-border">
                  Unverified
                </span>
              )}
            </div>
          </div>

          {/* Two columns */}
          <div className="flex">
            {/* LEFT: Billing */}
            <div className="w-1/2 p-6 bg-zkeleton-dark/80">
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-5">
                What the Insurer Sees
              </h3>
              <div className="space-y-4">
                {scenario.billing.map((row, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                        {row.label}
                      </span>
                      <span
                        className={`text-sm font-mono font-medium ${
                          row.label === "Amount" ? "text-white" : "text-gray-300"
                        }`}
                      >
                        {row.value}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-700 mt-0.5">{row.sub}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-zkeleton-border">
                <span
                  className={`text-xs font-medium tracking-wide uppercase transition-colors duration-500 ${
                    showResult && isImproper
                      ? "text-red-400"
                      : showResult
                      ? "text-green-400"
                      : "text-yellow-500"
                  }`}
                >
                  {showResult && isImproper
                    ? "✗ Improper — Flagged"
                    : showResult
                    ? "✓ Verified & Paid"
                    : "← Paid"}
                </span>
                <p className="text-[10px] text-gray-600 mt-1">
                  {showResult && isImproper
                    ? "Clinical evidence does not support this claim"
                    : showResult
                    ? "Payment confirmed against clinical evidence"
                    : "Approved on billing codes alone"}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div
              className={`w-px transition-colors duration-500 ${
                showResult && isImproper
                  ? "bg-red-500/30"
                  : showResult
                  ? "bg-green-500/30"
                  : active
                  ? "bg-zkeleton-teal/20"
                  : "bg-zkeleton-border"
              }`}
            />

            {/* RIGHT: Clinical */}
            <div className="w-1/2 p-6 bg-zkeleton-dark/60 relative overflow-hidden">
              <h3
                className={`text-[10px] tracking-[0.2em] uppercase mb-5 transition-colors duration-500 ${
                  showResult && isImproper
                    ? "text-red-400"
                    : showResult
                    ? "text-green-400"
                    : active
                    ? "text-zkeleton-teal"
                    : "text-gray-500"
                }`}
              >
                What Actually Happened
              </h3>

              {!active ? (
                <RedactedState />
              ) : (
                <div className="space-y-2.5">
                  {scenario.clinical.map((line, i) => (
                    <div
                      key={i}
                      className={`transition-all duration-300 ${
                        i < revealedLines
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2"
                      }`}
                    >
                      {line.label ? (
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`text-[10px] w-10 shrink-0 uppercase ${
                              showResult && isImproper
                                ? "text-red-400/60"
                                : "text-green-400/60"
                            }`}
                          >
                            {line.label}
                          </span>
                          <span
                            className={`text-xs font-mono ${
                              line.value.includes("⚠") || line.value.includes("NO")
                                ? "text-red-300"
                                : "text-gray-300"
                            }`}
                          >
                            {line.value}
                          </span>
                        </div>
                      ) : line.value ? (
                        <p
                          className={`text-xs font-mono leading-relaxed ${
                            line.value.includes("NO ENCOUNTER")
                              ? "text-red-400 font-medium text-center py-2"
                              : "text-gray-300 italic"
                          }`}
                        >
                          {line.value}
                        </p>
                      ) : (
                        <div className="h-3" />
                      )}
                    </div>
                  ))}

                  {showResult && (
                    <div
                      className={`mt-5 pt-3 border-t animate-fadeIn ${
                        isImproper ? "border-red-500/20" : "border-green-500/20"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 ${
                          isImproper ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {isImproper ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                        <span className="text-[10px] tracking-wider uppercase font-medium">
                          {isImproper ? "Improper Payment Detected" : "Clinical Match Confirmed"}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] mt-1 leading-relaxed ${
                          isImproper ? "text-red-400/50" : "text-green-400/50"
                        }`}
                      >
                        {scenario.finding}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className={`px-6 py-4 border-t transition-all duration-500 ${
              showResult && isImproper
                ? "border-red-500/20 bg-red-500/5"
                : showResult
                ? "border-green-500/20 bg-green-500/5"
                : "border-zkeleton-border bg-zkeleton-panel/50"
            }`}
          >
            <button
              onClick={handleActivate}
              className={`w-full py-3 rounded font-medium text-sm tracking-wider uppercase transition-all duration-500 cursor-pointer ${
                active
                  ? "bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                  : "bg-zkeleton-teal/10 text-zkeleton-teal border border-zkeleton-teal/25 hover:bg-zkeleton-teal/20 pulse-teal"
              }`}
            >
              {active ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Bubble Active — Analyzing Claims
                </span>
              ) : (
                "↗ Activate Bubble"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RedactedState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="h-3.5 rounded bg-gray-800/80 shimmer"
            style={{
              width: `${45 + ((i * 17) % 40)}%`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        </div>
      ))}
      <div className="mt-6 flex items-center gap-2 text-gray-600">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span className="text-[10px] tracking-wider uppercase">
          No Clinical Data Available
        </span>
      </div>
      <p className="text-[10px] text-gray-700 leading-relaxed">
        This claim was paid without any clinical validation.
      </p>
    </div>
  );
}
