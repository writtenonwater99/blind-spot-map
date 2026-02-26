"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { stateDataMap } from "@/data/stateData";

const US_ATLAS_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: "blind" | "flagged";
  originX: number;
  originY: number;
}

interface Props {
  activatedState: string | null;
  onActivate: (fips: string | null) => void;
  onHover: (fips: string | null) => void;
}

export default function BlindSpotMap({
  activatedState,
  onActivate,
  onHover,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const topoRef = useRef<any>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const statePathsRef = useRef<Map<string, [number, number]>>(new Map());

  const formatCurrency = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };

  const formatNumber = (n: number) => n.toLocaleString();

  const initMap = useCallback(async () => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentElement!;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr("width", width).attr("height", height);

    // Also size the canvas
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }

    // Load US topology
    const us: any = await d3.json(US_ATLAS_URL);
    topoRef.current = us;

    const states = topojson.feature(us, us.objects.states) as any;
    const stateBorders = topojson.mesh(
      us,
      us.objects.states,
      (a: any, b: any) => a !== b
    );

    const projection = d3
      .geoAlbersUsa()
      .fitSize([width - 80, height - 40], states)
      .translate([width / 2, height / 2]);
    projectionRef.current = projection;

    const path = d3.geoPath().projection(projection);

    // Compute centroids for particles
    states.features.forEach((f: any) => {
      const centroid = path.centroid(f);
      if (centroid && !isNaN(centroid[0])) {
        statePathsRef.current.set(f.id, centroid);
      }
    });

    // Clear and redraw
    svg.selectAll("*").remove();

    // Defs for glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // State fills
    const statesGroup = svg.append("g").attr("class", "states");

    statesGroup
      .selectAll("path")
      .data(states.features)
      .join("path")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        if (activatedState === d.id) return "rgba(34, 197, 94, 0.25)";
        return "rgba(30, 30, 42, 0.6)";
      })
      .attr("stroke", (d: any) => {
        if (activatedState === d.id) return "#22c55e";
        return "#1e1e2a";
      })
      .attr("stroke-width", (d: any) =>
        activatedState === d.id ? 2 : 0.5
      )
      .attr("cursor", "pointer")
      .style("transition", "fill 0.3s, stroke 0.3s")
      .on("mouseenter", function (event: MouseEvent, d: any) {
        if (activatedState !== d.id) {
          d3.select(this)
            .attr("fill", "rgba(45, 212, 170, 0.12)")
            .attr("stroke", "rgba(45, 212, 170, 0.4)")
            .attr("stroke-width", 1);
        }
        onHover(d.id);
        showTooltip(event, d.id);
      })
      .on("mousemove", function (event: MouseEvent, d: any) {
        showTooltip(event, d.id);
      })
      .on("mouseleave", function (_event: MouseEvent, d: any) {
        if (activatedState !== d.id) {
          d3.select(this)
            .attr("fill", "rgba(30, 30, 42, 0.6)")
            .attr("stroke", "#1e1e2a")
            .attr("stroke-width", 0.5);
        }
        onHover(null);
        hideTooltip();
      })
      .on("click", function (_event: MouseEvent, d: any) {
        onActivate(activatedState === d.id ? null : d.id);
      });

    // State borders mesh
    svg
      .append("path")
      .datum(stateBorders)
      .attr("d", path as any)
      .attr("fill", "none")
      .attr("stroke", "#1e1e2a")
      .attr("stroke-width", 0.5)
      .attr("pointer-events", "none");

    // Activated state glow
    if (activatedState) {
      const activeFeature = states.features.find(
        (f: any) => f.id === activatedState
      );
      if (activeFeature) {
        svg
          .append("path")
          .datum(activeFeature)
          .attr("d", path as any)
          .attr("fill", "none")
          .attr("stroke", "#22c55e")
          .attr("stroke-width", 3)
          .attr("filter", "url(#glow)")
          .attr("pointer-events", "none");
      }
    }

    // Initialize particles
    initParticles(width, height);
  }, [activatedState, onActivate, onHover]);

  const showTooltip = (event: MouseEvent, fips: string) => {
    const tip = tooltipRef.current;
    if (!tip) return;
    const data = stateDataMap[fips];
    if (!data) return;

    tip.style.display = "block";
    tip.style.left = `${event.clientX + 16}px`;
    tip.style.top = `${event.clientY - 10}px`;

    // Keep tooltip in viewport
    const rect = tip.getBoundingClientRect();
    if (rect.right > window.innerWidth - 20) {
      tip.style.left = `${event.clientX - rect.width - 16}px`;
    }
    if (rect.bottom > window.innerHeight - 20) {
      tip.style.top = `${event.clientY - rect.height - 10}px`;
    }

    tip.innerHTML = `
      <div class="state-name">${data.name}</div>
      <div class="stat-row">
        <span class="stat-label">Spending</span>
        <span class="stat-value">${formatCurrency(data.spending)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Providers</span>
        <span class="stat-value">${formatNumber(data.providers)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Est. Improper</span>
        <span class="stat-value red">${formatCurrency(data.improperAmount)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Improper Rate</span>
        <span class="stat-value red">${(data.improperRate * 100).toFixed(1)}%</span>
      </div>
    `;
  };

  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = "none";
    }
  };

  const initParticles = (width: number, height: number) => {
    const particles: Particle[] = [];
    const centroids = Array.from(statePathsRef.current.entries());

    for (let i = 0; i < 300; i++) {
      const [fips, centroid] = centroids[Math.floor(Math.random() * centroids.length)];
      const data = stateDataMap[fips];
      // Weight particle count by spending
      const isFlagged = Math.random() < 0.05; // ~5% red
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.8;
      const maxLife = 120 + Math.random() * 200;

      particles.push({
        x: centroid[0] + (Math.random() - 0.5) * 20,
        y: centroid[1] + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: Math.random() * maxLife,
        maxLife,
        type: isFlagged ? "flagged" : "blind",
        originX: centroid[0],
        originY: centroid[1],
      });
    }

    particlesRef.current = particles;
  };

  const animateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centroids = Array.from(statePathsRef.current.entries());

    ctx.clearRect(0, 0, width, height);

    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      // Fade lifecycle
      const lifeRatio = p.life / p.maxLife;
      let alpha = 1;
      if (lifeRatio < 0.1) alpha = lifeRatio / 0.1;
      else if (lifeRatio > 0.8) alpha = (1 - lifeRatio) / 0.2;

      if (alpha <= 0) alpha = 0;

      // Check if particle is in activated state zone (show green)
      let color: string;
      if (p.type === "flagged") {
        color = `rgba(239, 68, 68, ${alpha * 0.7})`;
      } else {
        color = `rgba(75, 85, 99, ${alpha * 0.5})`;
      }

      const radius = p.type === "flagged" ? 2.5 : 1.8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Glow for flagged
      if (p.type === "flagged" && alpha > 0.3) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.1})`;
        ctx.fill();
      }

      // Respawn if dead or out of bounds
      if (
        p.life >= p.maxLife ||
        p.x < -20 ||
        p.x > width + 20 ||
        p.y < -20 ||
        p.y > height + 20
      ) {
        if (centroids.length === 0) continue;
        const [, centroid] =
          centroids[Math.floor(Math.random() * centroids.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.8;
        p.x = centroid[0] + (Math.random() - 0.5) * 20;
        p.y = centroid[1] + (Math.random() - 0.5) * 20;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = 0;
        p.maxLife = 120 + Math.random() * 200;
        p.type = Math.random() < 0.05 ? "flagged" : "blind";
        p.originX = centroid[0];
        p.originY = centroid[1];
      }
    }

    animFrameRef.current = requestAnimationFrame(animateParticles);
  }, []);

  useEffect(() => {
    initMap();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [initMap]);

  // Start particle animation after map loads
  useEffect(() => {
    const timer = setTimeout(() => {
      animateParticles();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [animateParticles]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      initMap();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initMap]);

  return (
    <div className="absolute inset-0">
      <svg ref={svgRef} className="absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div ref={tooltipRef} className="tooltip" style={{ display: "none" }} />
    </div>
  );
}
