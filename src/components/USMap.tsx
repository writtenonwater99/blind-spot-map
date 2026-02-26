"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import { stateDataMap, type StateData } from "@/data/stateData";

const TOPO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: "blind" | "flagged" | "matched";
  stateId: string;
  size: number;
}

interface TooltipInfo {
  x: number;
  y: number;
  data: StateData;
  isActive: boolean;
}

interface Props {
  bubbleActive: boolean;
  selectedState: string;
  onSelectState: (fips: string) => void;
}

export default function USMap({
  bubbleActive,
  selectedState,
  onSelectState,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topologyRef = useRef<any>(null);
  const particlesRef = useRef<Particle[]>([]);
  const centroidsRef = useRef<Map<string, [number, number]>>(new Map());
  const frameRef = useRef(0);
  const bubbleRadiusRef = useRef(0);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const hoveredRef = useRef<string | null>(null);

  const bubbleActiveRef = useRef(bubbleActive);
  const selectedStateRef = useRef(selectedState);
  useEffect(() => {
    bubbleActiveRef.current = bubbleActive;
  }, [bubbleActive]);
  useEffect(() => {
    selectedStateRef.current = selectedState;
  }, [selectedState]);

  const getStateFill = useCallback((id: string) => {
    const data = stateDataMap[id];
    if (!data) return "#0c0c14";
    const intensity = Math.pow(data.spending / 150e9, 0.35);
    return d3.interpolateRgb("#0c0c14", "#1a1a2e")(Math.min(intensity, 1));
  }, []);

  const updateVisuals = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const hovered = hoveredRef.current;
    const selected = selectedStateRef.current;
    const isActive = bubbleActiveRef.current;

    svg.selectAll<SVGPathElement, unknown>(".state-path").each(function () {
      const el = d3.select(this);
      const id = el.attr("data-id");

      if (isActive && id === selected) {
        el.attr("fill", "rgba(34, 197, 94, 0.10)")
          .attr("stroke", "#22c55e")
          .attr("stroke-width", 1.8)
          .attr("filter", "url(#bubble-glow)");
      } else if (!isActive && id === selected) {
        el.attr("fill", "rgba(45, 212, 170, 0.04)")
          .attr("stroke", "#2dd4aa")
          .attr("stroke-width", 1.2)
          .attr("filter", null);
      } else if (id === hovered) {
        el.attr("fill", getStateFill(id))
          .attr("stroke", "#2dd4aa")
          .attr("stroke-width", 1)
          .attr("filter", "url(#hover-glow)");
      } else {
        el.attr("fill", getStateFill(id))
          .attr("stroke", "#1e1e2a")
          .attr("stroke-width", 0.5)
          .attr("filter", null);
      }
    });
  }, [getStateFill]);

  const renderMap = useCallback(() => {
    const topology = topologyRef.current;
    if (!topology || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    dimensionsRef.current = { width, height };

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statesGeo = feature(topology, topology.objects.states) as any;

    const projection = d3
      .geoAlbersUsa()
      .fitSize([width * 0.9, height * 0.84], statesGeo);

    const [tx, ty] = projection.translate()!;
    projection.translate([tx, ty + 12]);

    const pathGen = d3.geoPath().projection(projection);

    centroidsRef.current.clear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    statesGeo.features.forEach((f: any) => {
      const id = String(f.id).padStart(2, "0");
      const c = pathGen.centroid(f);
      if (c[0] && c[1] && !isNaN(c[0]) && !isNaN(c[1])) {
        centroidsRef.current.set(id, [c[0], c[1]]);
      }
    });

    // SVG defs
    const defs = svg.append("defs");

    // Green bubble glow
    const greenGlow = defs
      .append("filter")
      .attr("id", "bubble-glow")
      .attr("x", "-80%")
      .attr("y", "-80%")
      .attr("width", "260%")
      .attr("height", "260%");
    greenGlow
      .append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "5")
      .attr("result", "blur");
    greenGlow
      .append("feColorMatrix")
      .attr("in", "blur")
      .attr("type", "matrix")
      .attr(
        "values",
        "0 0 0 0 0.133  0 0 0 0 0.773  0 0 0 0 0.369  0 0 0 0.4 0"
      );
    const gMerge = greenGlow.append("feMerge");
    gMerge.append("feMergeNode");
    gMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Teal hover glow
    const tealGlow = defs
      .append("filter")
      .attr("id", "hover-glow")
      .attr("x", "-40%")
      .attr("y", "-40%")
      .attr("width", "180%")
      .attr("height", "180%");
    tealGlow
      .append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
    tealGlow
      .append("feColorMatrix")
      .attr("in", "blur")
      .attr("type", "matrix")
      .attr(
        "values",
        "0 0 0 0 0.176  0 0 0 0 0.831  0 0 0 0 0.667  0 0 0 0.25 0"
      );
    const tMerge = tealGlow.append("feMerge");
    tMerge.append("feMergeNode");
    tMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // State paths
    const stateGroup = svg.append("g").attr("class", "states");

    stateGroup
      .selectAll("path")
      .data(statesGeo.features)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .join("path")
      .attr("d", pathGen as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("data-id", (d: any) => String(d.id).padStart(2, "0"))
      .attr("class", "state-path")
      .attr("cursor", "pointer")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr("fill", (d: any) => getStateFill(String(d.id).padStart(2, "0")))
      .attr("stroke", "#1e1e2a")
      .attr("stroke-width", 0.5)
      .attr("stroke-linejoin", "round")
      .style("transition", "fill 0.4s ease, stroke 0.2s ease")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("mouseenter", function (event: MouseEvent, d: any) {
        const id = String(d.id).padStart(2, "0");
        const data = stateDataMap[id];
        if (!data) return;

        hoveredRef.current = id;
        updateVisuals();

        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            data,
            isActive: bubbleActiveRef.current && selectedStateRef.current === id,
          });
        }
      })
      .on("mousemove", function (event: MouseEvent) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip((prev) =>
            prev
              ? {
                  ...prev,
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                }
              : null
          );
        }
      })
      .on("mouseleave", function () {
        hoveredRef.current = null;
        updateVisuals();
        setTooltip(null);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("click", function (_event: MouseEvent, d: any) {
        const id = String(d.id).padStart(2, "0");
        onSelectState(id);
      });

    // Internal borders
    svg
      .append("path")
      .datum(
        mesh(
          topology,
          topology.objects.states,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (a: any, b: any) => a !== b
        )
      )
      .attr("fill", "none")
      .attr("stroke", "#1e1e2a")
      .attr("stroke-width", 0.4)
      .attr("d", pathGen as any)
      .attr("pointer-events", "none");

    setLoaded(true);
    updateVisuals();
  }, [getStateFill, updateVisuals, onSelectState]);

  // Fetch topology
  useEffect(() => {
    fetch(TOPO_URL)
      .then((r) => r.json())
      .then((t) => {
        topologyRef.current = t;
        renderMap();
      });
  }, [renderMap]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      if (topologyRef.current) renderMap();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [renderMap]);

  // Update visuals when bubble/selected state changes
  useEffect(() => {
    updateVisuals();
  }, [bubbleActive, selectedState, updateVisuals]);

  // Canvas particle + bubble dome animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 2;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      dimensionsRef.current = { width: w, height: h };
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 2;
      const { width, height } = dimensionsRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const centroids = centroidsRef.current;
      const isActive = bubbleActiveRef.current;
      const activeId = selectedStateRef.current;
      const now = Date.now();

      // Animate bubble radius
      const targetRadius = isActive ? 85 : 0;
      bubbleRadiusRef.current +=
        (targetRadius - bubbleRadiusRef.current) * 0.05;

      // Draw bubble dome
      if (bubbleRadiusRef.current > 1.5 && activeId) {
        const centroid = centroids.get(activeId);
        if (centroid) {
          const r = bubbleRadiusRef.current;
          const pulse = 0.7 + 0.3 * Math.sin(now * 0.0025);

          // Radial gradient dome
          const grad = ctx.createRadialGradient(
            centroid[0],
            centroid[1],
            0,
            centroid[0],
            centroid[1],
            r
          );
          grad.addColorStop(0, `rgba(34, 197, 94, ${0.07 * pulse})`);
          grad.addColorStop(0.5, `rgba(34, 197, 94, ${0.03 * pulse})`);
          grad.addColorStop(1, "rgba(34, 197, 94, 0)");
          ctx.beginPath();
          ctx.arc(centroid[0], centroid[1], r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Rotating dashed ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(centroid[0], centroid[1], r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 197, 94, ${0.18 * pulse})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.lineDashOffset = -now * 0.015;
          ctx.stroke();
          ctx.restore();

          // Inner ring
          ctx.beginPath();
          ctx.arc(centroid[0], centroid[1], r * 0.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 197, 94, ${0.08 * pulse})`;
          ctx.lineWidth = 0.5;
          ctx.setLineDash([2, 8]);
          ctx.lineDashOffset = now * 0.01;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Spawn particles
      centroids.forEach((centroid, stateId) => {
        const spawnRate = isActive && stateId === activeId ? 0.08 : 0.03;
        if (Math.random() < spawnRate) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.15 + Math.random() * 0.45;
          const jitter = 5 + Math.random() * 12;

          let type: Particle["type"] = "blind";
          if (isActive && stateId === activeId) {
            type = "matched";
          } else if (Math.random() < 0.05) {
            type = "flagged";
          }

          particlesRef.current.push({
            x: centroid[0] + (Math.random() - 0.5) * jitter,
            y: centroid[1] + (Math.random() - 0.5) * jitter,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.05,
            life: 0,
            maxLife: 100 + Math.random() * 180,
            type,
            stateId,
            size: 1 + Math.random() * 1.5,
          });
        }
      });

      // Update and draw particles
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life >= p.maxLife) continue;
        if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20)
          continue;

        // Transition matched/unmatched
        if (isActive && p.stateId === activeId && p.type === "blind") {
          p.type = "matched";
        } else if (!isActive && p.type === "matched") {
          p.type = "blind";
        }

        alive.push(p);

        const fadeIn = Math.min(p.life / 12, 1);
        const fadeStart = p.maxLife * 0.55;
        const fadeOut =
          p.life > fadeStart
            ? Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart))
            : 1;
        const alpha = fadeIn * fadeOut;

        if (alpha < 0.01) continue;

        let r: number, g: number, b: number, baseAlpha: number;
        switch (p.type) {
          case "flagged":
            r = 239;
            g = 68;
            b = 68;
            baseAlpha = 0.75;
            break;
          case "matched":
            r = 34;
            g = 197;
            b = 94;
            baseAlpha = 0.8;
            break;
          default:
            r = 100;
            g = 110;
            b = 125;
            baseAlpha = 0.45;
            break;
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * baseAlpha})`;
        ctx.fill();

        // Glow for flagged/matched
        if (p.type !== "blind" && alpha > 0.15) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.08})`;
          ctx.fill();
        }
      }

      particlesRef.current = alive;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const { width: cw } = dimensionsRef.current;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-zkeleton-teal/30 border-t-zkeleton-teal rounded-full animate-spin" />
            <span className="text-zkeleton-muted text-[10px] tracking-[0.2em] uppercase">
              Loading map data
            </span>
          </div>
        </div>
      )}

      <svg ref={svgRef} className="absolute inset-0 w-full h-full" />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {tooltip && (
        <div
          className="tooltip"
          style={{
            left:
              tooltip.x > cw * 0.6
                ? tooltip.x - 240
                : tooltip.x + 18,
            top: Math.min(
              tooltip.y - 10,
              dimensionsRef.current.height - 180
            ),
          }}
        >
          <div className="state-name">{tooltip.data.name}</div>
          <div className="stat-row">
            <span className="stat-label">Medicaid Spending</span>
            <span className="stat-value">
              ${(tooltip.data.spending / 1e9).toFixed(1)}B
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Providers</span>
            <span className="stat-value">
              {tooltip.data.providers.toLocaleString()}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Est. Improper</span>
            <span className="stat-value red">
              ${(tooltip.data.improperAmount / 1e9).toFixed(1)}B
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Improper Rate</span>
            <span className="stat-value red">
              {(tooltip.data.improperRate * 100).toFixed(1)}%
            </span>
          </div>
          {tooltip.isActive && (
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              <span
                style={{
                  color: "#22c55e",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Bubble Active — Full Fidelity
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
