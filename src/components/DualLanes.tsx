"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

interface PartnerLine { label: string; value: string }

interface ClaimScenario {
  id: string;
  billing: { label: string; value: string; sub: string }[];
  clinical: { label: string; value: string }[];
  partnerData: Record<string, PartnerLine[]>;
  outcome: "verified" | "improper";
  finding: string;
  amount: string;
  partnerFlip?: {
    requires: PartnerKey;
    finding: string;
  };
}

type PartnerKey = "cgm" | "pharmacy" | "rpm" | "sdoh";

const PARTNERS: { key: PartnerKey; name: string; short: string }[] = [
  { key: "cgm", name: "Continuous Glucose Monitor", short: "CGM" },
  { key: "pharmacy", name: "Pharmacy Benefits", short: "Rx" },
  { key: "rpm", name: "Remote Patient Monitoring", short: "RPM" },
  { key: "sdoh", name: "Social Determinants", short: "SDoH" },
];

const PARTNER_ICONS: Record<string, React.ReactNode> = {
  cgm: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  ),
  pharmacy: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 8v8M8 12h8" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  rpm: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M7 10h2l2-3 2 6 2-3h2" />
    </svg>
  ),
  sdoh: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 12l9-9 9 9" />
      <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
};

const SCENARIOS: ClaimScenario[] = [
  {
    id: "#4,291,038",
    outcome: "verified",
    finding:
      "Diagnosis, severity, and treatment confirmed against clinical documentation.",
    amount: "$4,200.00",
    billing: [
      { label: "CPT Code", value: "99215", sub: "Office visit, Level 5" },
      { label: "ICD-10", value: "I50.9", sub: "Heart failure, unspecified" },
      { label: "Amount", value: "$4,200.00", sub: "Billed amount" },
      {
        label: "Provider",
        value: "NPI 1376609297",
        sub: "Dr. A. Smith, Cardiology",
      },
      { label: "Date", value: "2024-07-14", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"Patient presents with acute' },
      { label: "", value: "dyspnea, orthopnea x3 days," },
      { label: "", value: 'bilateral LE edema."' },
      { label: "BNP", value: "1,840 pg/mL \u2191\u2191" },
      { label: "Echo", value: "EF 25%, severe LV dysfunction" },
      { label: "CXR", value: "Bilateral pulmonary edema" },
      { label: "SpO2", value: "88% on room air" },
    ],
    partnerData: {
      cgm: [
        { label: "HR", value: "Resting HR 104 bpm avg (7-day)" },
        { label: "SpO2", value: "Wearable SpO2: 89\u201391% overnight" },
      ],
      pharmacy: [
        { label: "Rx", value: "Furosemide refill on time" },
        { label: "Adh", value: "ACE inhibitor compliance: 94%" },
      ],
      rpm: [
        { label: "BP", value: "Home BP: 168/102, trending up" },
        { label: "Wt", value: "Weight +4.2 lbs in 3 days" },
      ],
      sdoh: [
        { label: "Home", value: "Lives alone, limited mobility" },
        { label: "Area", value: "Rural zip — limited specialist access" },
      ],
    },
  },
  {
    id: "#4,291,039",
    outcome: "improper",
    finding:
      "Upcoded \u2014 billed Level 5, clinical supports Level 2 at most. Overpayment: $3,680.",
    amount: "$4,500.00",
    billing: [
      { label: "CPT Code", value: "99215", sub: "Office visit, Level 5" },
      {
        label: "ICD-10",
        value: "J06.9",
        sub: "Acute upper respiratory infection",
      },
      { label: "Amount", value: "$4,500.00", sub: "Billed amount" },
      {
        label: "Provider",
        value: "NPI 1922467554",
        sub: "Dr. R. Patel, Internal Med",
      },
      { label: "Date", value: "2024-08-02", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"Patient presents with 3-day' },
      { label: "", value: "history of sore throat and" },
      { label: "", value: 'nasal congestion. No fever."' },
      { label: "Vitals", value: "BP 122/78, HR 72, T 98.4\u00b0F" },
      { label: "Exam", value: "Mild pharyngeal erythema" },
      { label: "Plan", value: "Supportive care, OTC meds" },
      { label: "Time", value: "8 min encounter documented" },
    ],
    partnerData: {
      cgm: [
        { label: "Temp", value: "Wearable temp: 98.3\u00b0F steady (72h)" },
        { label: "Sleep", value: "Sleep score 82/100, no disruption" },
      ],
      pharmacy: [
        { label: "Rx", value: "No prescription filled" },
        { label: "Flag", value: "No Rx filled for this encounter" },
      ],
      rpm: [
        { label: "Mon", value: "No active monitoring enrolled" },
        { label: "Flag", value: "Patient not in RPM program" },
      ],
      sdoh: [
        { label: "Area", value: "Urban — high provider density" },
        { label: "Ins", value: "Low acuity area — urgent care in network" },
      ],
    },
  },
  {
    id: "#4,291,040",
    outcome: "verified",
    finding:
      "Emergency presentation confirmed. Clinical documentation supports Level 4 ER visit.",
    amount: "$8,940.00",
    billing: [
      { label: "CPT Code", value: "99284", sub: "ER visit, Level 4" },
      {
        label: "ICD-10",
        value: "I21.0",
        sub: "ST elevation MI, anterior wall",
      },
      { label: "Amount", value: "$8,940.00", sub: "Billed amount" },
      {
        label: "Provider",
        value: "NPI 1548392017",
        sub: "Dr. L. Chen, Emergency Med",
      },
      { label: "Date", value: "2024-06-22", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"62 y/o male, crushing chest' },
      { label: "", value: "pain radiating to left arm," },
      { label: "", value: 'diaphoretic, onset 45 min ago"' },
      { label: "ECG", value: "ST elevation V1-V4" },
      { label: "Trop", value: "Troponin I: 4.2 ng/mL \u2191\u2191\u2191" },
      {
        label: "Cath",
        value: "95% LAD occlusion \u2192 PCI w/ stent",
      },
      { label: "Outcome", value: "Transferred to CCU, stable" },
    ],
    partnerData: {
      cgm: [
        { label: "HR", value: "HR spike to 142 bpm at 14:08" },
        { label: "ECG", value: "Wearable AFib alert triggered 14:12" },
      ],
      pharmacy: [
        { label: "Rx", value: "Aspirin + clopidogrel filled same day" },
        { label: "Stat", value: "High-intensity statin added" },
      ],
      rpm: [
        { label: "Post", value: "Post-discharge monitoring activated" },
        { label: "Vital", value: "HR/BP transmitting every 4 hours" },
      ],
      sdoh: [
        { label: "Care", value: "Spouse present as caregiver" },
        { label: "Rehab", value: "Cardiac rehab facility in network" },
      ],
    },
  },
  {
    id: "#4,291,041",
    outcome: "improper",
    finding:
      "Phantom billing \u2014 no patient encounter found in clinical record for this date of service.",
    amount: "$12,400.00",
    billing: [
      { label: "CPT Code", value: "27447", sub: "Total knee replacement" },
      {
        label: "ICD-10",
        value: "M17.11",
        sub: "Primary osteoarthritis, right knee",
      },
      { label: "Amount", value: "$12,400.00", sub: "Billed amount" },
      {
        label: "Provider",
        value: "NPI 1689204538",
        sub: "Dr. J. Morrison, Orthopedic",
      },
      { label: "Date", value: "2024-09-11", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: "" },
      { label: "", value: "" },
      { label: "", value: "\u2014 NO ENCOUNTER FOUND \u2014" },
      { label: "", value: "" },
      { label: "EHR", value: "No record for this patient on 9/11" },
      { label: "Sched", value: "No surgery scheduled this date" },
      { label: "OR Log", value: "Patient not in OR log" },
    ],
    partnerData: {
      cgm: [
        { label: "CGM", value: "No glucose readings from facility on DOS" },
        { label: "Steps", value: "4,200 steps logged on 9/11" },
      ],
      pharmacy: [
        { label: "Rx", value: "No surgical prep Rx filled" },
        { label: "Flag", value: "\u26a0 No post-op pain meds dispensed" },
      ],
      rpm: [
        { label: "Dev", value: "No device check-in from facility" },
        { label: "Flag", value: "\u26a0 Zero clinical telemetry on DOS" },
      ],
      sdoh: [
        { label: "Act", value: "Patient active in community" },
        { label: "Mob", value: "No mobility limitations on file" },
      ],
    },
  },
  {
    id: "#4,291,042",
    outcome: "verified",
    finding:
      "Lab panel medically necessary. Results confirm metabolic monitoring for chronic condition.",
    amount: "$890.00",
    billing: [
      {
        label: "CPT Code",
        value: "80053",
        sub: "Comprehensive metabolic panel",
      },
      {
        label: "ICD-10",
        value: "E11.65",
        sub: "Type 2 diabetes w/ hyperglycemia",
      },
      { label: "Amount", value: "$890.00", sub: "Billed amount" },
      {
        label: "Provider",
        value: "NPI 1234567890",
        sub: "Quest Diagnostics",
      },
      { label: "Date", value: "2024-07-30", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"Quarterly metabolic panel for' },
      { label: "", value: "diabetes management, patient on" },
      { label: "", value: 'metformin + glipizide."' },
      { label: "HbA1c", value: "8.2% (target <7%)" },
      { label: "Gluc", value: "186 mg/dL fasting \u2191" },
      { label: "Cr", value: "1.1 mg/dL (stable)" },
      { label: "eGFR", value: "72 mL/min (stage 2 CKD)" },
    ],
    partnerData: {
      cgm: [
        { label: "CGM", value: "\u26a0 CGM active 14 months continuously" },
        { label: "Flag", value: "\u26a0 Lab panel duplicates CGM monitoring" },
      ],
      pharmacy: [
        { label: "Rx", value: "Metformin refill: 3 days late" },
        { label: "Adh", value: "Glipizide: on schedule" },
      ],
      rpm: [
        { label: "Gluc", value: "4 alerts >250 mg/dL this week" },
        { label: "Trend", value: "Fasting glucose trending up 14d" },
      ],
      sdoh: [
        { label: "Food", value: "SDOH screening: food insecurity flagged" },
        { label: "Rx", value: "Pharmacy access: limited options in zip" },
      ],
    },
    partnerFlip: {
      requires: "cgm",
      finding: "Unnecessary service \u2014 patient\u2019s CGM provides continuous glucose data. Quarterly lab panel duplicates existing real-time monitoring. Overpayment: $890.",
    },
  },
  {
    id: "#4,291,043",
    outcome: "improper",
    finding:
      "Duplicate billing \u2014 same procedure billed twice. Second claim is duplicate. Overpayment: $2,100.",
    amount: "$2,100.00",
    billing: [
      {
        label: "CPT Code",
        value: "43239",
        sub: "Upper GI endoscopy with biopsy",
      },
      { label: "ICD-10", value: "K21.0", sub: "GERD with esophagitis" },
      { label: "Amount", value: "$2,100.00", sub: "Billed amount" },
      {
        label: "Provider",
        value: "NPI 1456789012",
        sub: "Dr. M. Wong, Gastroenterology",
      },
      { label: "Date", value: "2024-08-15", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"EGD performed for persistent' },
      { label: "", value: "GERD symptoms. Biopsy taken" },
      { label: "", value: 'from distal esophagus."' },
      { label: "Note", value: "Single procedure documented" },
      { label: "Time", value: "Procedure: 10:42 - 11:08 AM" },
      {
        label: "Flag",
        value: "\u26a0 Identical claim paid on 8/14",
      },
      {
        label: "Match",
        value: "Same NPI, same patient, same CPT",
      },
    ],
    partnerData: {
      cgm: [
        { label: "CGM", value: "Single biometric event logged" },
        { label: "Flag", value: "\u26a0 No second procedure detected" },
      ],
      pharmacy: [
        { label: "Rx", value: "Single sedation dose dispensed" },
        { label: "Flag", value: "\u26a0 One procedure, billed twice" },
      ],
      rpm: [
        { label: "Mon", value: "One recovery window monitored" },
        { label: "Flag", value: "\u26a0 No second recovery event" },
      ],
      sdoh: [
        { label: "Area", value: "Standard outpatient access" },
        { label: "Note", value: "No barriers to care noted" },
      ],
    },
  },
  {
    id: "#4,291,044",
    outcome: "improper",
    finding:
      "Service not rendered \u2014 billed for 60-min psychotherapy, clinical shows 15-min med check only.",
    amount: "$3,600.00",
    billing: [
      {
        label: "CPT Code",
        value: "90837",
        sub: "Psychotherapy, 60 minutes",
      },
      {
        label: "ICD-10",
        value: "F33.1",
        sub: "Major depressive disorder, recurrent",
      },
      { label: "Amount", value: "$3,600.00", sub: "Billed amount" },
      {
        label: "Provider",
        value: "NPI 1567890123",
        sub: "Dr. K. Reeves, Psychiatry",
      },
      { label: "Date", value: "2024-09-03", sub: "Date of service" },
    ],
    clinical: [
      { label: "", value: '"Brief medication management' },
      { label: "", value: "visit. Patient stable on current" },
      { label: "", value: 'regimen. No therapy provided."' },
      { label: "Time", value: "15 min face-to-face documented" },
      { label: "Plan", value: "Continue sertraline 100mg" },
      { label: "Next", value: "Follow-up in 3 months" },
      {
        label: "Flag",
        value: "\u26a0 Billed 60 min, documented 15 min",
      },
    ],
    partnerData: {
      cgm: [
        { label: "HR", value: "Resting HR steady, no spike during visit window" },
        { label: "HRV", value: "HRV normal — no stress response detected" },
      ],
      pharmacy: [
        { label: "Rx", value: "Sertraline 90-day auto-refill" },
        { label: "Adh", value: "No medication change ordered" },
      ],
      rpm: [
        { label: "Mood", value: "Mood tracker: stable entries" },
        { label: "Flag", value: "No crisis flags in 90 days" },
      ],
      sdoh: [
        { label: "Tech", value: "Telehealth capable, broadband OK" },
        { label: "Flag", value: "\u26a0 Could have been virtual visit" },
      ],
    },
  },
  {
    id: "#4,291,045",
    outcome: "verified",
    finding:
      "High-complexity surgical claim fully supported by operative report and post-op documentation.",
    amount: "$15,200.00",
    billing: [
      {
        label: "CPT Code",
        value: "33533",
        sub: "CABG, single arterial graft",
      },
      {
        label: "ICD-10",
        value: "I25.10",
        sub: "Atherosclerotic heart disease",
      },
      { label: "Amount", value: "$15,200.00", sub: "Billed amount" },
      {
        label: "Provider",
        value: "NPI 1678901234",
        sub: "Dr. S. Gupta, Cardiothoracic",
      },
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
    partnerData: {
      cgm: [
        { label: "HR", value: "Pre-op HR 88 \u2192 post-op 72 bpm" },
        { label: "BP", value: "Continuous BP: stabilized day 3" },
      ],
      pharmacy: [
        { label: "Rx", value: "Warfarin + metoprolol filled" },
        { label: "Adh", value: "Compliance tracked daily" },
      ],
      rpm: [
        { label: "Flag", value: "\u26a0 8,200 steps logged 48h post-op" },
        { label: "Flag", value: "\u26a0 Recovery pattern inconsistent w/ CABG" },
      ],
      sdoh: [
        { label: "Care", value: "Spouse as primary caregiver" },
        { label: "Home", value: "Home modifications completed" },
      ],
    },
    partnerFlip: {
      requires: "rpm",
      finding: "Suspected fabricated documentation \u2014 RPM shows normal activity 48h post-CABG, inconsistent with surgical recovery. Overpayment: $15,200.",
    },
  },
];

// Projections for time-skip
const PROJECTIONS = {
  "6mo": {
    topProcessed: 2_400_000,
    topPaid: 18_200_000_000,
    topFlagged: 18_400,
    topRecovered: 43_000_000,
    processed: 2_400_000,
    flagged: 312_000,
    recovered: 847_000_000,
    partnerContribution: 235_000_000,
  },
  "12mo": {
    topProcessed: 4_800_000,
    topPaid: 36_400_000_000,
    topFlagged: 37_200,
    topRecovered: 89_000_000,
    processed: 4_800_000,
    flagged: 624_000,
    recovered: 1_700_000_000,
    partnerContribution: 478_000_000,
  },
};

function fmtCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

function fmtMoney(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${Math.round(n / 1e6)}M`;
  return `$${n.toLocaleString()}`;
}

// Timing
const REVEAL_DELAY = 1100;
const STAMP_DELAY = 1500;
const VERDICT_DELAY = 800;
const HOLD_TIME = 3000;
const FADE_TIME = 1200;
const GAP_TIME = 400;

interface Props {
  active: boolean;
  paused: boolean;
  activePartners: Set<string>;
  onActivate: () => void;
  fastForwarding: boolean;
  timeProjection: null | "6mo" | "12mo";
}

// Top-only timing (when bubble is off)
const TOP_STAMP = 1200;
const TOP_HOLD = 2200;
const TOP_FADE = 1000;
const TOP_GAP = 400;

export default function DualLanes({ active, paused, activePartners, onActivate, fastForwarding, timeProjection }: Props) {
  // === SHARED STATE ===
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topStamped, setTopStamped] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [topTotalPaid, setTopTotalPaid] = useState(0);
  const [topProcessed, setTopProcessed] = useState(0);
  const [topFlagged, setTopFlagged] = useState(0);
  const [topRecovered, setTopRecovered] = useState(0);

  // === BOTTOM LANE STATE ===
  const [revealedLines, setRevealedLines] = useState(0);
  const [revealedPartnerLines, setRevealedPartnerLines] = useState(0);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdictFlipped, setVerdictFlipped] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [bottomFlagged, setBottomFlagged] = useState(0);
  const [bottomRecovered, setBottomRecovered] = useState(0);

  // Refs
  const masterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stampRef = useRef<NodeJS.Timeout | null>(null);
  const revealRef = useRef<NodeJS.Timeout | null>(null);
  const partnerRevealRef = useRef<NodeJS.Timeout | null>(null);
  const pauseWaitRef = useRef<NodeJS.Timeout | null>(null);
  const activePartnersRef = useRef(activePartners);
  activePartnersRef.current = activePartners;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const activeRef = useRef(active);
  activeRef.current = active;
  const projectionRef = useRef(timeProjection);
  projectionRef.current = timeProjection;
  const ffIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ffRafRef = useRef<number | null>(null);

  const topScenario = SCENARIOS[currentIndex % SCENARIOS.length];
  const scenario = topScenario;
  const isImproper = verdictFlipped || scenario.outcome === "improper";
  const activeFinding = verdictFlipped && scenario.partnerFlip ? scenario.partnerFlip.finding : scenario.finding;

  const clearAllTimers = () => {
    if (masterTimerRef.current) clearTimeout(masterTimerRef.current);
    if (stampRef.current) clearTimeout(stampRef.current);
    if (revealRef.current) clearInterval(revealRef.current);
    if (partnerRevealRef.current) clearInterval(partnerRevealRef.current);
    if (pauseWaitRef.current) clearInterval(pauseWaitRef.current);
  };

  // Timeout that waits if paused, then executes
  const safeTimeout = useCallback((fn: () => void, delay: number) => {
    return setTimeout(() => {
      if (!pausedRef.current) { fn(); return; }
      pauseWaitRef.current = setInterval(() => {
        if (!pausedRef.current) {
          if (pauseWaitRef.current) clearInterval(pauseWaitRef.current);
          fn();
        }
      }, 100);
    }, delay);
  }, []);

  // Advance to next claim — both lanes together
  const advanceToNext = useCallback((idx: number) => {
    setTransitioning(true);
    const fadeDur = activeRef.current ? FADE_TIME : TOP_FADE;
    const gapDur = activeRef.current ? GAP_TIME : TOP_GAP;
    masterTimerRef.current = setTimeout(() => {
      const next = (idx + 1) % SCENARIOS.length;
      setTransitioning(false);
      setTimeout(() => processClaim(next), gapDur);
    }, fadeDur);
  }, []);

  // Bottom lane verdict, then hold, then advance
  const showVerdictThenAdvance = useCallback((sc: ClaimScenario, idx: number) => {
    setShowVerdict(true);

    const hasFlip = sc.partnerFlip && activePartnersRef.current.has(sc.partnerFlip.requires);
    const finalOutcome = hasFlip ? "improper" : sc.outcome;

    if (!projectionRef.current) {
      setProcessedCount((prev) => prev + 1);
      if (finalOutcome === "improper") {
        setBottomFlagged((prev) => prev + 1);
        const amt = parseFloat(sc.amount.replace(/[$,]/g, ""));
        setBottomRecovered((prev) => prev + amt);
      }
    }

    if (hasFlip) {
      // Show "verified" first, then dramatic flip to "improper"
      masterTimerRef.current = safeTimeout(() => {
        setVerdictFlipped(true);
        masterTimerRef.current = safeTimeout(() => {
          advanceToNext(idx);
        }, HOLD_TIME);
      }, 1200);
    } else {
      masterTimerRef.current = safeTimeout(() => {
        advanceToNext(idx);
      }, HOLD_TIME);
    }
  }, [safeTimeout, advanceToNext]);

  // Process a claim — handles both lanes
  const processClaim = useCallback((idx: number) => {
    const sc = SCENARIOS[idx % SCENARIOS.length];
    setCurrentIndex(idx % SCENARIOS.length);
    setTopStamped(false);
    setTransitioning(false);
    setRevealedLines(0);
    setRevealedPartnerLines(0);
    setShowVerdict(false);
    setVerdictFlipped(false);

    // Top lane: stamp after delay
    stampRef.current = setTimeout(() => {
      setTopStamped(true);
      if (!projectionRef.current) {
        const amt = parseFloat(sc.amount.replace(/[$,]/g, ""));
        setTopTotalPaid((prev) => prev + amt);
        setTopProcessed((prev) => prev + 1);
      }
    }, activeRef.current ? STAMP_DELAY : TOP_STAMP);

    if (activeRef.current) {
      // === BUBBLE ACTIVE: bottom lane reveals clinical, then advance ===
      let i = 0;
      revealRef.current = setInterval(() => {
        if (pausedRef.current) return;
        i++;
        setRevealedLines(i);
        if (i >= sc.clinical.length) {
          if (revealRef.current) clearInterval(revealRef.current);

          const ap = activePartnersRef.current;
          const totalPartnerLines = PARTNERS.reduce(
            (sum, p) => sum + (ap.has(p.key) && sc.partnerData[p.key] ? sc.partnerData[p.key].length : 0),
            0
          );

          if (totalPartnerLines > 0) {
            let p = 0;
            partnerRevealRef.current = setInterval(() => {
              if (pausedRef.current) return;
              p++;
              setRevealedPartnerLines(p);
              if (p >= totalPartnerLines) {
                if (partnerRevealRef.current) clearInterval(partnerRevealRef.current);
                safeTimeout(() => showVerdictThenAdvance(sc, idx), VERDICT_DELAY);
              }
            }, REVEAL_DELAY);
          } else {
            safeTimeout(() => showVerdictThenAdvance(sc, idx), VERDICT_DELAY);
          }
        }
      }, REVEAL_DELAY);
    } else {
      // === BUBBLE OFF: top lane only, stamp then hold then advance ===
      masterTimerRef.current = setTimeout(() => {
        advanceToNext(idx);
      }, TOP_STAMP + TOP_HOLD);
    }
  }, [showVerdictThenAdvance, safeTimeout, advanceToNext]);

  // Start on mount
  useEffect(() => {
    processClaim(0);
    return () => clearAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When bubble activates/deactivates, restart from current claim
  const prevActiveRef = useRef(active);
  useEffect(() => {
    if (prevActiveRef.current !== active) {
      clearAllTimers();
      if (active) {
        setProcessedCount(0);
        setBottomFlagged(0);
        setBottomRecovered(0);
      } else {
        setShowVerdict(false);
        setRevealedLines(0);
        setRevealedPartnerLines(0);
      }
      // Restart current claim with new mode
      processClaim(currentIndex);
      prevActiveRef.current = active;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Fast-forward burst effect
  const prevFfRef = useRef(fastForwarding);
  useEffect(() => {
    if (fastForwarding && active && timeProjection) {
      const target = PROJECTIONS[timeProjection];
      const startVals = {
        processed: processedCount,
        flagged: bottomFlagged,
        recovered: bottomRecovered,
        topProcessed: topProcessed,
        topPaid: topTotalPaid,
        topFlagged: topFlagged,
        topRecovered: topRecovered,
      };
      const startTime = Date.now();
      const duration = 3000;

      // Clear normal timers
      clearAllTimers();

      // Rapid claim flip loop
      let flipIndex = currentIndex;
      ffIntervalRef.current = setInterval(() => {
        setTransitioning(true);
        setTimeout(() => {
          flipIndex = (flipIndex + 1) % SCENARIOS.length;
          setCurrentIndex(flipIndex);
          setRevealedLines(SCENARIOS[flipIndex].clinical.length);
          setRevealedPartnerLines(20);
          setShowVerdict(true);
          setTopStamped(true);
          setTransitioning(false);
        }, 80);
      }, 250);

      // Counter animation
      const animateCounters = () => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);

        setProcessedCount(Math.round(startVals.processed + (target.processed - startVals.processed) * eased));
        setBottomFlagged(Math.round(startVals.flagged + (target.flagged - startVals.flagged) * eased));
        setBottomRecovered(Math.round(startVals.recovered + (target.recovered - startVals.recovered) * eased));
        setTopProcessed(Math.round(startVals.topProcessed + (target.topProcessed - startVals.topProcessed) * eased));
        setTopTotalPaid(Math.round(startVals.topPaid + (target.topPaid - startVals.topPaid) * eased));
        setTopFlagged(Math.round(startVals.topFlagged + (target.topFlagged - startVals.topFlagged) * eased));
        setTopRecovered(Math.round(startVals.topRecovered + (target.topRecovered - startVals.topRecovered) * eased));

        if (p < 1) ffRafRef.current = requestAnimationFrame(animateCounters);
      };
      ffRafRef.current = requestAnimationFrame(animateCounters);
    }

    // When burst ends, resume normal cycling
    if (prevFfRef.current && !fastForwarding && active) {
      if (ffIntervalRef.current) clearInterval(ffIntervalRef.current);
      if (ffRafRef.current) cancelAnimationFrame(ffRafRef.current);
      processClaim(currentIndex);
    }

    prevFfRef.current = fastForwarding;

    return () => {
      if (ffIntervalRef.current) clearInterval(ffIntervalRef.current);
      if (ffRafRef.current) cancelAnimationFrame(ffRafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fastForwarding]);

  // When projection resets to live, restart counters
  const prevProjectionRef = useRef(timeProjection);
  useEffect(() => {
    if (prevProjectionRef.current && !timeProjection && active) {
      setProcessedCount(0);
      setBottomFlagged(0);
      setBottomRecovered(0);
      setTopProcessed(0);
      setTopTotalPaid(0);
      setTopFlagged(0);
      setTopRecovered(0);
      clearAllTimers();
      processClaim(currentIndex);
    }
    prevProjectionRef.current = timeProjection;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeProjection]);

  const bottomTotalPaid = active
    ? topTotalPaid - bottomRecovered
    : 0;
  const bottomTransitioning = transitioning && active;
  const projected = !!timeProjection && !fastForwarding;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
      {/* Sampling indicator */}
      <div className={`flex items-center gap-3 text-[10px] transition-opacity duration-500 ${paused ? "opacity-50" : "opacity-100"}`}>
        <span className="text-gray-600">
          Sampling from{" "}
          <span className="text-gray-400 font-medium tabular-nums">47.2M</span>{" "}
          Medicaid claims
        </span>
        {active && paused && (
          <span className="text-yellow-500/70 tracking-wider uppercase font-medium text-[9px] animate-fadeIn">
            Paused
          </span>
        )}
      </div>

      {/* ============ TOP LANE: CURRENT SYSTEM ============ */}
      <div
        className={`w-full max-w-[800px] rounded-lg overflow-hidden bg-zkeleton-panel/20 transition-all duration-700 ${
          transitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
        }`}
      >
        {/* Lane label */}
        <div className="px-5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-[10px] text-gray-400 tracking-[0.2em] uppercase font-medium">
              Current System
            </span>
            <span className="text-[10px] text-gray-600">|</span>
            <span className="text-[10px] text-gray-500 tracking-wider">
              Claim
            </span>
            <span className="text-xs text-gray-300 font-mono tabular-nums">
              {topScenario.id}
            </span>
          </div>
          {topStamped ? (
            <span className="text-[10px] tracking-wider uppercase font-medium text-yellow-500/80 animate-fadeIn">
              Paid — No Verification
            </span>
          ) : (
            <span className="text-[10px] tracking-wider uppercase text-gray-600 font-medium">
              Processing...
            </span>
          )}
        </div>

        {/* Lane body */}
        <div className="flex">
          {/* Billing column */}
          <div className="w-1/2 p-5 bg-zkeleton-dark/80">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[9px] tracking-[0.2em] uppercase text-gray-600">
                What the Insurer Sees
              </h4>
              <span className="text-[7px] tracking-wider uppercase text-gray-700 border border-gray-800 rounded px-1.5 py-0.5">Claims / EDI</span>
            </div>
            <div className="space-y-3">
              {topScenario.billing.map((row, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[9px] text-gray-600 uppercase tracking-wider">
                      {row.label}
                    </span>
                    <span
                      className={`text-xs font-mono font-medium ${
                        row.label === "Amount" ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {row.value}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-700 mt-0.5">{row.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-zkeleton-border" />

          {/* Clinical column — always locked */}
          <div className="w-1/2 p-5 bg-zkeleton-dark/60">
            <h4 className="text-[9px] tracking-[0.2em] uppercase text-gray-600 mb-4">
              What Actually Happened
            </h4>
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="h-3 rounded bg-gray-800/40 shimmer"
                    style={{
                      width: `${42 + ((i * 17) % 40)}%`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                </div>
              ))}
              <div className="mt-5 py-3 flex flex-col items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-red-500/40"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span className="text-[9px] tracking-[0.15em] uppercase text-red-500/40 font-medium">
                  No Data Pipeline
                </span>
                <span className="text-[8px] text-gray-700">
                  Clinical records inaccessible
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lane footer tally */}
        <div className={`px-5 flex items-center gap-6 transition-all duration-500 ${projected ? "py-3" : "py-2"} text-[10px]`}>
          <span className="text-gray-600">
            Processed:{" "}
            <span className="text-gray-400 font-medium tabular-nums">
              {fmtCount(topProcessed)}
            </span>
          </span>
          <span className="text-gray-600">
            Total Paid:{" "}
            <span className="text-gray-300 font-medium tabular-nums">
              {fmtMoney(topTotalPaid)}
            </span>
          </span>
          <span className="text-gray-600">
            Flagged:{" "}
            <span className="text-red-500/60 font-medium tabular-nums">
              {fmtCount(topFlagged)}
            </span>
          </span>
          <span className="text-gray-600">
            Recovered:{" "}
            <span className={`font-medium tabular-nums transition-all duration-500 ${projected ? "text-sm text-yellow-500" : "text-red-500/60"}`}>
              {fmtMoney(topRecovered)}
            </span>
          </span>
        </div>
      </div>

      {/* Between lanes: delta callout when projected, claim strip when live, CTA when inactive */}
      {active && projected ? (
        <div className="w-full max-w-[800px] flex flex-col items-center gap-1 -my-1 animate-fadeIn">
          <div className="flex items-center gap-4 w-full">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zkeleton-teal/30 to-transparent" />
            <div className="flex items-center gap-3 text-[10px] tracking-wider">
              <span className="text-gray-500">
                Current System:{" "}
                <span className="text-yellow-500 font-medium">{fmtMoney(topRecovered)}</span>
              </span>
              <span className="text-gray-700">vs</span>
              <span className="text-gray-500">
                Zkeleton:{" "}
                <span className="text-zkeleton-teal font-medium">{fmtMoney(bottomRecovered)}</span>
              </span>
              <span className="text-gray-700">|</span>
              <span className="text-zkeleton-teal font-semibold">
                {topRecovered > 0 ? `${Math.round(bottomRecovered / topRecovered)}x` : "\u2014"} more exposed
              </span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zkeleton-teal/30 to-transparent" />
          </div>
          {activePartners.size > 0 && timeProjection && (
            <span className="text-[9px] text-gray-600 tracking-wider">
              incl. <span className="text-zkeleton-teal/70 font-medium">{fmtMoney(PROJECTIONS[timeProjection].partnerContribution)}</span> from partner data
            </span>
          )}
        </div>
      ) : active ? (
        <div className={`w-full max-w-[800px] flex items-center justify-center gap-3 -my-2 transition-all duration-700 ${
          transitioning ? "opacity-0" : "opacity-100"
        }`}>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent" />
          <span className="text-[9px] text-gray-500 tracking-wider font-mono tabular-nums shrink-0">
            Same Claim {scenario.id} · {scenario.amount}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent" />
        </div>
      ) : (
        <div className="w-full max-w-[800px] flex items-center justify-center -my-1">
          <button
            onClick={onActivate}
            className="px-8 py-2.5 rounded-full font-medium text-xs tracking-wider uppercase transition-all duration-500 cursor-pointer bg-zkeleton-teal/10 text-zkeleton-teal hover:bg-zkeleton-teal/20 pulse-teal"
          >
            {"\u2197 Activate Bubble — See What\u2019s Hidden"}
          </button>
        </div>
      )}

      {/* ============ BOTTOM LANE: ZKELETON PRIVATE BUBBLE ============ */}
      <div className="w-full max-w-[800px] relative">
        {/* Floating partner icons — docked outside right edge */}
        {activePartners.size > 0 && (
          <div className={`absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-10 transition-all duration-700 ${
            active && !bottomTransitioning ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}>
            {PARTNERS.filter((p) => activePartners.has(p.key)).map((p) => (
              <div
                key={p.key}
                className="w-7 h-7 rounded-full bg-zkeleton-teal/10 flex items-center justify-center"
                title={p.name}
              >
                <span className="text-zkeleton-teal">{PARTNER_ICONS[p.key]}</span>
              </div>
            ))}
          </div>
        )}

      <div
        className={`w-full rounded-lg overflow-hidden transition-all duration-700 ${
          bottomTransitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
        } ${
          !active
            ? "border border-dashed border-zkeleton-border/40"
            : showVerdict && isImproper
            ? "border border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.08)]"
            : showVerdict
            ? "border border-green-500/40 shadow-[0_0_40px_rgba(34,197,94,0.08)]"
            : "border border-zkeleton-teal/25 shadow-[0_0_30px_rgba(45,212,170,0.05)]"
        }`}
      >
        {/* Lane header */}
        <div
          className={`px-5 py-3 border-b flex items-center justify-between transition-all duration-500 ${
            !active
              ? "border-zkeleton-border/40 bg-zkeleton-panel/40"
              : showVerdict && isImproper
              ? "border-red-500/20 bg-red-500/5"
              : showVerdict
              ? "border-green-500/20 bg-green-500/5"
              : "border-zkeleton-border bg-zkeleton-panel"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                active ? "bg-zkeleton-teal animate-pulse" : "bg-gray-700"
              }`}
            />
            <span
              className={`text-[10px] tracking-[0.2em] uppercase font-medium ${
                active ? "text-zkeleton-teal" : "text-gray-600"
              }`}
            >
              Zkeleton Private Bubble
            </span>
            {active && (
              <>
                <span className="text-[10px] text-gray-600">|</span>
                <span className="text-[10px] text-gray-500 tracking-wider">
                  Claim
                </span>
                <span className="text-xs text-gray-300 font-mono tabular-nums">
                  {scenario.id}
                </span>
              </>
            )}
          </div>
          {active && showVerdict ? (
            <span
              className={`text-[10px] tracking-wider uppercase font-medium px-2 py-0.5 rounded border animate-fadeIn ${
                isImproper
                  ? "text-red-400 border-red-500/30 bg-red-500/10"
                  : "text-green-400 border-green-500/30 bg-green-500/10"
              }`}
            >
              {isImproper ? "Improper Payment" : "Full Fidelity \u2713"}
            </span>
          ) : active ? (
            <span className="text-[10px] tracking-wider uppercase text-zkeleton-teal/70 font-medium px-2 py-0.5 rounded border border-zkeleton-teal/20 bg-zkeleton-teal/5">
              Analyzing...
            </span>
          ) : (
            <span className="text-[10px] tracking-wider uppercase text-gray-700 font-medium px-2 py-0.5 rounded border border-dashed border-gray-700">
              Inactive
            </span>
          )}
        </div>

        {!active ? (
          /* Inactive state — ghosted preview */
          <div className="flex">
            <div className="w-1/2 p-5 bg-zkeleton-dark/40 opacity-30">
              <h4 className="text-[9px] tracking-[0.2em] uppercase text-gray-700 mb-4">
                Billing Codes
              </h4>
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-3 rounded bg-gray-800/60" style={{ width: `${30 + ((i * 13) % 25)}%` }} />
                    <div className="h-3 rounded bg-gray-800/40" style={{ width: `${25 + ((i * 11) % 20)}%` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-px bg-zkeleton-border/30" />
            <div className="w-1/2 p-5 bg-zkeleton-dark/40 relative">
              <h4 className="text-[9px] tracking-[0.2em] uppercase text-gray-700 mb-4">
                Clinical Records
              </h4>
              <div className="space-y-2.5 opacity-20">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-3 rounded bg-zkeleton-teal/20" style={{ width: `${35 + ((i * 19) % 45)}%` }} />
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zkeleton-dark/60">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zkeleton-teal/30 mb-2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <p className="text-[10px] text-zkeleton-teal/40 tracking-wide font-medium">
                  Activate to unlock
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Lane body */}
            <div className="flex">
              {/* Billing column — identical to top */}
              <div className="w-1/2 p-5 bg-zkeleton-dark/80">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[9px] tracking-[0.2em] uppercase text-gray-600">
                    What the Insurer Sees
                  </h4>
                  <span className="text-[7px] tracking-wider uppercase text-zkeleton-teal/40 border border-zkeleton-teal/20 rounded px-1.5 py-0.5">FHIR R4</span>
                </div>
                <div className="space-y-3">
                  {scenario.billing.map((row, i) => (
                    <div key={i}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] text-gray-600 uppercase tracking-wider">
                          {row.label}
                        </span>
                        <span
                          className={`text-xs font-mono font-medium ${
                            row.label === "Amount"
                              ? "text-white"
                              : "text-gray-400"
                          }`}
                        >
                          {row.value}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-700 mt-0.5">
                        {row.sub}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Billing verdict */}
                <div className="mt-5 pt-3">
                  <span
                    className={`text-[10px] font-medium tracking-wide uppercase transition-colors duration-500 ${
                      showVerdict && isImproper
                        ? "text-red-400"
                        : showVerdict
                        ? "text-green-400"
                        : "text-zkeleton-teal/50"
                    }`}
                  >
                    {showVerdict && isImproper
                      ? "\u2717 Improper \u2014 Flagged"
                      : showVerdict
                      ? "\u2713 Verified & Paid"
                      : "Matching..."}
                  </span>
                  <p className="text-[9px] text-gray-700 mt-0.5">
                    {showVerdict && isImproper
                      ? "Clinical evidence does not support this claim"
                      : showVerdict
                      ? "Payment confirmed against clinical evidence"
                      : "Comparing billing to medical record"}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div
                className={`w-px transition-colors duration-500 ${
                  showVerdict && isImproper
                    ? "bg-red-500/30"
                    : showVerdict
                    ? "bg-green-500/30"
                    : "bg-zkeleton-teal/15"
                }`}
              />

              {/* Clinical column — reveals */}
              <div className="w-1/2 p-5 bg-zkeleton-dark/60">
                <div className="flex items-center justify-between mb-4">
                  <h4
                    className={`text-[9px] tracking-[0.2em] uppercase transition-colors duration-500 ${
                      showVerdict && isImproper
                        ? "text-red-400"
                        : showVerdict
                        ? "text-green-400"
                        : "text-zkeleton-teal"
                    }`}
                  >
                    What Actually Happened
                  </h4>
                  <span className={`text-[7px] tracking-wider uppercase rounded px-1.5 py-0.5 transition-colors duration-500 ${
                    showVerdict && isImproper
                      ? "text-red-400/40 border border-red-500/20"
                      : showVerdict
                      ? "text-green-400/40 border border-green-500/20"
                      : "text-zkeleton-teal/40 border border-zkeleton-teal/20"
                  }`}>FHIR R4</span>
                </div>
                <div className="space-y-2">
                  {scenario.clinical.map((line, i) => (
                    <div
                      key={i}
                      className={`transition-all duration-500 ${
                        i < revealedLines
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2"
                      }`}
                    >
                      {line.label ? (
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`text-[9px] w-9 shrink-0 uppercase ${
                              showVerdict && isImproper
                                ? "text-red-400/60"
                                : "text-green-400/60"
                            }`}
                          >
                            {line.label}
                          </span>
                          <span
                            className={`text-[11px] font-mono ${
                              line.value.includes("\u26a0") ||
                              line.value.includes("NO")
                                ? "text-red-300"
                                : "text-gray-300"
                            }`}
                          >
                            {line.value}
                          </span>
                        </div>
                      ) : line.value ? (
                        <p
                          className={`text-[11px] font-mono leading-relaxed ${
                            line.value.includes("NO ENCOUNTER")
                              ? "text-red-400 font-medium text-center py-1"
                              : "text-gray-300 italic"
                          }`}
                        >
                          {line.value}
                        </p>
                      ) : (
                        <div className="h-2.5" />
                      )}
                    </div>
                  ))}

                  {/* Partner data reveal — multi-partner */}
                  {activePartners.size > 0 && revealedLines >= scenario.clinical.length && (() => {
                    let offset = 0;
                    return PARTNERS.filter(
                      (p) => activePartners.has(p.key) && scenario.partnerData[p.key]
                    ).map((partner) => {
                      const lines = scenario.partnerData[partner.key];
                      const myOffset = offset;
                      offset += lines.length;
                      return (
                        <div key={partner.key} className="mt-3 pt-2.5">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-zkeleton-teal animate-pulse" />
                            <span className="text-[8px] tracking-[0.2em] uppercase text-zkeleton-teal/70 font-medium">
                              {partner.short}: {partner.name}
                            </span>
                            <span className="text-[6px] tracking-wider uppercase text-orange-400/50 border border-orange-400/20 rounded px-1 py-px ml-1">Partner API</span>
                          </div>
                          {lines.map((line, i) => (
                            <div
                              key={`${partner.key}-${i}`}
                              className={`transition-all duration-500 mb-1.5 ${
                                myOffset + i < revealedPartnerLines
                                  ? "opacity-100 translate-y-0"
                                  : "opacity-0 translate-y-2"
                              }`}
                            >
                              <div className="flex items-baseline gap-2">
                                <span className="text-[9px] w-9 shrink-0 uppercase text-zkeleton-teal/50">
                                  {line.label}
                                </span>
                                <span
                                  className={`text-[11px] font-mono ${
                                    line.value.includes("\u26a0")
                                      ? "text-red-300"
                                      : "text-zkeleton-teal/80"
                                  }`}
                                >
                                  {line.value}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    });
                  })()}

                  {showVerdict && (
                    <div
                      className="mt-4 pt-2.5 animate-fadeIn"
                    >
                      <div
                        className={`flex items-center gap-2 ${
                          isImproper ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {isImproper ? (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        ) : (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                        <span className="text-[9px] tracking-wider uppercase font-medium">
                          {isImproper
                            ? "Improper Payment Detected"
                            : "Clinical Match Confirmed"}
                        </span>
                      </div>
                      <p
                        className={`text-[9px] mt-1 leading-relaxed ${
                          isImproper ? "text-red-400/50" : "text-green-400/50"
                        }`}
                      >
                        {activeFinding}
                      </p>
                      {verdictFlipped && (
                        <p className="text-[9px] text-orange-400 mt-1.5 font-medium tracking-wider uppercase animate-fadeIn">
                          {"\u26a0"} Partner data changed verdict
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lane footer tally */}
            <div
              className={`px-5 border-t flex items-center gap-6 text-[10px] transition-all duration-500 ${
                projected ? "py-3" : "py-2.5"
              } ${
                showVerdict && isImproper
                  ? "border-red-500/15 bg-red-500/3"
                  : showVerdict
                  ? "border-green-500/15 bg-green-500/3"
                  : "border-zkeleton-border bg-zkeleton-panel/30"
              }`}
            >
              <span className="text-gray-600">
                Processed:{" "}
                <span className="text-gray-400 font-medium tabular-nums">
                  {fmtCount(processedCount)}
                </span>
              </span>
              <span className="text-gray-600">
                Verified:{" "}
                <span className="text-green-400/80 font-medium tabular-nums">
                  {fmtMoney(bottomTotalPaid)}
                </span>
              </span>
              <span className="text-gray-600">
                Flagged:{" "}
                <span className="text-red-400 font-medium tabular-nums">
                  {fmtCount(bottomFlagged)}
                </span>
              </span>
              <span className="text-gray-600 relative group">
                Exposed:{" "}
                <span className={`font-medium tabular-nums transition-all duration-500 ${projected ? "text-sm text-zkeleton-teal" : "text-zkeleton-teal"}`}>
                  {fmtMoney(bottomRecovered)}
                </span>
                <span className="tooltip absolute bottom-full left-0 mb-2 px-3 py-2 rounded bg-zkeleton-panel text-[9px] text-gray-400 leading-relaxed w-56 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg">
                  Surfaced from single-dataset identity matching (Middesk, 2026). Clinical layer untouched.
                </span>
              </span>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
