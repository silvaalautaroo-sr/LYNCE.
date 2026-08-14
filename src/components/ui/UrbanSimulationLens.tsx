"use client";

import { useEffect, useRef } from "react";

interface Building {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  type: "office" | "residential" | "park" | "hub";
  label?: string;
  metric?: string;
}

export function UrbanSimulationLens() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let t = 0;

    // Building definitions on an isometric grid
    const buildings: Building[] = [
      { x: -3, y: -2, w: 1.4, d: 1.2, h: 4.2, type: "office", label: "TORRE NORTE", metric: "CO₂: -32%" },
      { x: -1, y: -2, w: 1.2, d: 1.0, h: 2.8, type: "residential", label: "HABITAT 01", metric: "SOLAR: 92%" },
      { x: 1, y: -2, w: 1.6, d: 1.4, h: 5.5, type: "hub", label: "NÚCLEO COMERCIAL", metric: "ROI: +24%" },
      { x: -2, y: 0, w: 1.2, d: 1.2, h: 3.4, type: "office", label: "CENTRO FINANCIERO", metric: "ENERGÍA: A+" },
      { x: 0, y: 0, w: 1.5, d: 1.5, h: 6.2, type: "hub", label: "LYNCE SIM_TARGET", metric: "IMPACTO: ÓPTIMO" },
      { x: 2, y: 0, w: 1.3, d: 1.1, h: 3.1, type: "residential", label: "DESARROLLO SUR", metric: "FLUJO: +40%" },
      { x: -3, y: 2, w: 1.5, d: 1.2, h: 2.5, type: "park", label: "CORREDOR VERDE", metric: "TEMPERATURA: -2.4°C" },
      { x: -1, y: 2, w: 1.2, d: 1.4, h: 4.8, type: "office", label: "INNOVACIÓN", metric: "ACCESIBILIDAD: 98%" },
      { x: 1, y: 2, w: 1.4, d: 1.2, h: 3.6, type: "residential", label: "VIVIENDA", metric: "CAPEX: -18%" },
      { x: 3, y: 1, w: 1.2, d: 1.0, h: 2.2, type: "residential" },
      { x: -2, y: -4, w: 1.2, d: 1.2, h: 3.0, type: "office" },
      { x: 0, y: -4, w: 1.5, d: 1.1, h: 4.0, type: "hub" },
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        mouseRef.current.targetX = (e.clientX - rect.left) / rect.width;
        mouseRef.current.targetY = (e.clientY - rect.top) / rect.height;
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Project isometric point
    const project = (gx: number, gy: number, gz: number, cx: number, cy: number, scale: number, tilt: number) => {
      // 30 degree isometric angle + subtle mouse tilt
      const isoX = (gx - gy) * Math.cos(Math.PI / 6) * scale;
      const isoY = (gx + gy) * Math.sin(Math.PI / 6) * scale * tilt - gz * scale;
      return { x: cx + isoX, y: cy + isoY };
    };

    const draw = () => {
      t += 0.016;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      // Mouse smooth interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const mx = (mouseRef.current.x - 0.5) * 2;
      const my = (mouseRef.current.y - 0.5) * 2;

      ctx.clearRect(0, 0, W, H);

      const cx = W * (0.5 + mx * 0.04);
      const cy = H * (0.55 + my * 0.04);
      const scale = Math.min(W, H) / 10;
      const tilt = 0.9 + my * 0.08;

      // Radar scan wave angle
      const scanPhase = (t * 0.5) % (Math.PI * 2);
      const scanRadius = (t * 30) % (scale * 8);

      // Draw background ground grid
      ctx.save();
      ctx.lineWidth = 1;

      const gridSize = 6;
      for (let x = -gridSize; x <= gridSize; x++) {
        const p1 = project(x, -gridSize, 0, cx, cy, scale, tilt);
        const p2 = project(x, gridSize, 0, cx, cy, scale, tilt);
        ctx.strokeStyle = "rgba(24, 194, 156, 0.05)";
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      for (let y = -gridSize; y <= gridSize; y++) {
        const p1 = project(-gridSize, y, 0, cx, cy, scale, tilt);
        const p2 = project(gridSize, y, 0, cx, cy, scale, tilt);
        ctx.strokeStyle = "rgba(24, 194, 156, 0.05)";
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw expanding pulse radar rings
      ctx.strokeStyle = "rgba(43, 255, 156, 0.12)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, scanRadius, scanRadius * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      const scanRadius2 = ((t * 30 + 100) % (scale * 8));
      ctx.strokeStyle = "rgba(83, 228, 225, 0.08)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, scanRadius2, scanRadius2 * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Sort buildings from back to front for proper occlusion in isometric view
      const sorted = [...buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y));

      sorted.forEach((b, idx) => {
        const { x, y, w, d, h } = b;
        // Height animated breathing
        const heightMultiplier = 1 + Math.sin(t * 1.5 + idx * 0.6) * 0.03;
        const curH = h * heightMultiplier;

        // Base 4 points
        const p0 = project(x, y, 0, cx, cy, scale, tilt);
        const p1 = project(x + w, y, 0, cx, cy, scale, tilt);
        const p2 = project(x + w, y + d, 0, cx, cy, scale, tilt);
        const p3 = project(x, y + d, 0, cx, cy, scale, tilt);

        // Top 4 points
        const t0 = project(x, y, curH, cx, cy, scale, tilt);
        const t1 = project(x + w, y, curH, cx, cy, scale, tilt);
        const t2 = project(x + w, y + d, curH, cx, cy, scale, tilt);
        const t3 = project(x, y + d, curH, cx, cy, scale, tilt);

        // Calculate distance to scan wave for illumination
        const bCenterDist = Math.hypot(p2.x - cx, (p2.y - cy) * 2);
        const isScanned = Math.abs(bCenterDist - scanRadius) < 30 || Math.abs(bCenterDist - scanRadius2) < 30;

        // Left Face
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.closePath();
        ctx.fillStyle = isScanned
          ? "rgba(43, 255, 156, 0.18)"
          : b.type === "hub"
          ? "rgba(24, 194, 156, 0.14)"
          : "rgba(16, 32, 48, 0.45)";
        ctx.fill();
        ctx.strokeStyle = isScanned ? "rgba(83, 228, 225, 0.8)" : "rgba(24, 194, 156, 0.3)";
        ctx.lineWidth = isScanned ? 1.5 : 0.8;
        ctx.stroke();

        // Right Face
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.closePath();
        ctx.fillStyle = isScanned
          ? "rgba(43, 255, 156, 0.12)"
          : b.type === "hub"
          ? "rgba(24, 194, 156, 0.08)"
          : "rgba(10, 22, 34, 0.45)";
        ctx.fill();
        ctx.strokeStyle = isScanned ? "rgba(83, 228, 225, 0.8)" : "rgba(24, 194, 156, 0.25)";
        ctx.stroke();

        // Top Roof Face
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.closePath();
        ctx.fillStyle = isScanned
          ? "rgba(83, 228, 225, 0.35)"
          : b.type === "hub"
          ? "rgba(24, 194, 156, 0.25)"
          : "rgba(20, 42, 60, 0.6)";
        ctx.fill();
        ctx.strokeStyle = isScanned ? "rgba(255, 255, 255, 0.9)" : "rgba(43, 255, 156, 0.45)";
        ctx.stroke();

        // Wireframe window lines on large buildings
        if (curH > 3) {
          ctx.strokeStyle = "rgba(43, 255, 156, 0.15)";
          ctx.lineWidth = 0.5;
          const levels = Math.floor(curH);
          for (let l = 1; l < levels; l++) {
            const hFrac = l / levels;
            const w1 = project(x + w, y + d, curH * hFrac, cx, cy, scale, tilt);
            const w2 = project(x, y + d, curH * hFrac, cx, cy, scale, tilt);
            ctx.beginPath();
            ctx.moveTo(w1.x, w1.y);
            ctx.lineTo(w2.x, w2.y);
            ctx.stroke();
          }
        }

        // Floating telemetry tags on specific key buildings
        if (b.metric && (isScanned || b.type === "hub")) {
          const tagPos = t2;
          const tagOffset = Math.sin(t * 2 + idx) * 4;

          ctx.save();
          ctx.font = "10px Inter, sans-serif";
          const textWidth = ctx.measureText(b.metric).width;
          const padX = 6;
          const padY = 3;

          // Tag background
          ctx.fillStyle = "rgba(5, 12, 18, 0.85)";
          ctx.strokeStyle = isScanned ? "rgba(43, 255, 156, 0.8)" : "rgba(24, 194, 156, 0.4)";
          ctx.lineWidth = 1;
          
          const boxX = tagPos.x - textWidth / 2 - padX;
          const boxY = tagPos.y - 24 + tagOffset;
          const boxW = textWidth + padX * 2;
          const boxH = 16;

          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxW, boxH, 4);
          ctx.fill();
          ctx.stroke();

          // Little connector line
          ctx.beginPath();
          ctx.moveTo(tagPos.x, boxY + boxH);
          ctx.lineTo(tagPos.x, tagPos.y);
          ctx.strokeStyle = "rgba(24, 194, 156, 0.4)";
          ctx.stroke();

          // Tag text
          ctx.fillStyle = isScanned ? "#2bff9c" : "#eaf4ff";
          ctx.fillText(b.metric, boxX + padX, boxY + 11);
          ctx.restore();
        }
      });

      // Ambient simulation data streams (particles moving on roads)
      const particleCount = 12;
      for (let p = 0; p < particleCount; p++) {
        const prog = ((t * 0.4 + p / particleCount) % 1);
        const gx = -3 + prog * 6;
        const gy = (p % 2 === 0 ? 0 : 2);
        const pt = project(gx, gy, 0.1, cx, cy, scale, tilt);

        ctx.fillStyle = p % 2 === 0 ? "rgba(43, 255, 156, 0.8)" : "rgba(83, 228, 225, 0.8)";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(43, 255, 156, 0.3)";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none opacity-85 select-none"
      style={{ filter: "drop-shadow(0 0 24px rgba(24,194,156,0.15))" }}
    />
  );
}
