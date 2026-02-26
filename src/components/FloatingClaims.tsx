"use client";

import { useEffect, useRef, useCallback } from "react";

interface MiniClaim {
  x: number;
  y: number;
  vx: number;
  vy: number;
  code: string;
  amount: string;
  width: number;
  opacity: number;
  type: "blind" | "flagged" | "matched";
  matchDelay: number; // frames after activation before turning green
  matchTimer: number;
}

const CODES = [
  "99215", "99214", "99213", "99232", "99223", "99291", "81003",
  "71046", "93000", "85025", "80053", "36415", "90837", "27447",
  "43239", "99283", "99284", "G0438", "G0439", "T1019", "97110",
  "90834", "99395", "99385", "11042", "97140", "90847", "99203",
  "92014", "90832", "99243", "43235", "70553", "74177", "93306",
];

const AMOUNTS = [
  "$180", "$320", "$890", "$1,200", "$4,200", "$2,800", "$450",
  "$12,400", "$560", "$95", "$210", "$1,750", "$3,600", "$8,900",
  "$145", "$2,100", "$670", "$15,200", "$980", "$340", "$7,400",
  "$420", "$1,890", "$5,600", "$260", "$3,200", "$11,800", "$720",
];

const COUNT = 80;

interface Props {
  active: boolean;
}

export default function FloatingClaims({ active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const claimsRef = useRef<MiniClaim[]>([]);
  const frameRef = useRef(0);
  const activeRef = useRef(false);
  const activatedAtRef = useRef(0);
  activeRef.current = active;

  const spawn = (w: number, h: number, fromEdge = false): MiniClaim => {
    const code = CODES[Math.floor(Math.random() * CODES.length)];
    const amount = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
    const isFlagged = Math.random() < 0.05;
    const width = 80 + Math.random() * 50;

    let x: number, y: number;
    if (fromEdge) {
      // Spawn from edges
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: x = -width; y = Math.random() * h; break;
        case 1: x = w + 10; y = Math.random() * h; break;
        case 2: x = Math.random() * w; y = -30; break;
        default: x = Math.random() * w; y = h + 30; break;
      }
    } else {
      x = Math.random() * w;
      y = Math.random() * h;
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.15 + Math.random() * 0.3;

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      code,
      amount,
      width,
      opacity: 0.08 + Math.random() * 0.12,
      type: isFlagged ? "flagged" : "blind",
      matchDelay: Math.floor(Math.random() * 180), // 0-3 seconds stagger
      matchTimer: 0,
    };
  };

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = 2;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const isActive = activeRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const claims = claimsRef.current;

    for (let i = 0; i < claims.length; i++) {
      const c = claims[i];
      c.x += c.vx;
      c.y += c.vy;

      // Update match state
      if (isActive && c.type === "blind") {
        c.matchTimer++;
        if (c.matchTimer > c.matchDelay) {
          c.type = "matched";
        }
      } else if (!isActive && c.type === "matched") {
        c.type = "blind";
        c.matchTimer = 0;
        c.matchDelay = Math.floor(Math.random() * 180);
      }

      // Respawn if off-screen
      if (
        c.x < -c.width - 20 || c.x > w + c.width + 20 ||
        c.y < -50 || c.y > h + 50
      ) {
        const fresh = spawn(w, h, true);
        claims[i] = fresh;
        continue;
      }

      // Draw mini-claim card
      let borderColor: string, textColor: string, bgColor: string;
      const alpha = c.opacity;

      switch (c.type) {
        case "flagged":
          borderColor = `rgba(239, 68, 68, ${alpha * 1.5})`;
          textColor = `rgba(239, 68, 68, ${alpha * 2.5})`;
          bgColor = `rgba(239, 68, 68, ${alpha * 0.3})`;
          break;
        case "matched":
          borderColor = `rgba(34, 197, 94, ${alpha * 1.5})`;
          textColor = `rgba(34, 197, 94, ${alpha * 2.5})`;
          bgColor = `rgba(34, 197, 94, ${alpha * 0.3})`;
          break;
        default:
          borderColor = `rgba(75, 85, 99, ${alpha})`;
          textColor = `rgba(156, 163, 175, ${alpha * 2})`;
          bgColor = `rgba(30, 30, 42, ${alpha * 0.5})`;
          break;
      }

      const cardH = 28;
      const r = 3;

      // Background
      ctx.beginPath();
      ctx.roundRect(c.x, c.y, c.width, cardH, r);
      ctx.fillStyle = bgColor;
      ctx.fill();

      // Border
      ctx.beginPath();
      ctx.roundRect(c.x, c.y, c.width, cardH, r);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Text
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillStyle = textColor;
      ctx.fillText(c.code, c.x + 6, c.y + 12);

      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = textColor;
      ctx.fillText(c.amount, c.x + 6, c.y + 22);

      // Matched check or flagged dot
      if (c.type === "matched") {
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 3})`;
        ctx.font = "10px sans-serif";
        ctx.fillText("✓", c.x + c.width - 14, c.y + 14);
      } else if (c.type === "flagged") {
        ctx.beginPath();
        ctx.arc(c.x + c.width - 10, c.y + 14, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 3})`;
        ctx.fill();
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    frameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement!;
      const dpr = 2;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;

      // Init claims
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      claimsRef.current = [];
      for (let i = 0; i < COUNT; i++) {
        claimsRef.current.push(spawn(w, h, false));
      }
    };

    resize();
    frameRef.current = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
}
