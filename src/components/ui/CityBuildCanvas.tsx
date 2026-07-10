"use client";

import { useEffect, useRef } from "react";

interface CityBuildCanvasProps {
  theme: "dark" | "light";
  /** Fired once when the build reaches the digital-twin stage (progress > 0.9). */
  onTwinReady?: () => void;
}

interface Palette {
  ground: string;
  groundLine: string;
  faceL: string;
  faceR: string;
  top: string;
  road: string;
  tree: string;
  accent: string;
  accent2: string;
  window: string;
  ped: string;
}

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    ground: "#070b12",
    groundLine: "rgba(255,255,255,0.05)",
    faceL: "#0e1826",
    faceR: "#132234",
    top: "#1b3348",
    road: "#0a121c",
    tree: "#1f7a5c",
    accent: "#18c29c",
    accent2: "#53e4e1",
    window: "#7ff0dc",
    ped: "#9fb4c9",
  },
  light: {
    ground: "#e7eef7",
    groundLine: "rgba(0,0,0,0.05)",
    faceL: "#c9d6e6",
    faceR: "#d9e3ef",
    top: "#eef3fa",
    road: "#cdd8e6",
    tree: "#7bb89a",
    accent: "#e8834f",
    accent2: "#f2739c",
    window: "#f7b98e",
    ped: "#8a6f66",
  },
};

const N = 8; // grid is N x N cells

// Deterministic pseudo-random
const rnd = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
// smooth reveal of a stage between [s,e]
const seg = (p: number, s: number, e: number) => clamp((p - s) / (e - s));

interface Cell {
  gx: number;
  gy: number;
  road: boolean;
  tree: boolean;
  h: number; // building height in "units"
  order: number; // reveal order 0..1
  hue: number; // 0..1 tint mix toward accent
}

export function CityBuildCanvas({ theme, onTwinReady }: CityBuildCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const twinFired = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pal = PALETTES[theme];

    // ── build the grid once ────────────────────────────────────────────────
    const cells: Cell[] = [];
    for (let gy = 0; gy < N; gy++) {
      for (let gx = 0; gx < N; gx++) {
        const road = gx % 3 === 0 || gy % 3 === 0;
        const r = rnd(gx, gy);
        cells.push({
          gx,
          gy,
          road,
          tree: !road && r > 0.82,
          h: road ? 0 : 0.5 + rnd(gx + 3, gy + 7) * 1.9,
          order: (gx + gy) / (2 * N) + rnd(gx, gy) * 0.15,
          hue: rnd(gx + 1, gy + 5) > 0.72 ? 0.9 : 0.12,
        });
      }
    }

    // vehicles ride along road columns/rows; pedestrians drift near them
    const vehicles = Array.from({ length: 10 }, (_, i) => ({
      axis: i % 2 === 0 ? "x" : "y",
      lane: (Math.floor(rnd(i, 1) * (N / 3)) * 3) % N,
      t: rnd(i, 2),
      spd: 0.05 + rnd(i, 3) * 0.05,
      dir: rnd(i, 4) > 0.5 ? 1 : -1,
    }));
    const peds = Array.from({ length: 16 }, (_, i) => ({
      axis: i % 2 === 0 ? "x" : "y",
      lane: (Math.floor(rnd(i, 5) * (N / 3)) * 3) % N,
      off: (rnd(i, 6) - 0.5) * 0.6,
      t: rnd(i, 7),
      spd: 0.018 + rnd(i, 8) * 0.02,
      dir: rnd(i, 9) > 0.5 ? 1 : -1,
    }));

    let W = 0,
      H = 0,
      dpr = 1,
      tw = 40,
      th = 20,
      ox = 0,
      oy = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tw = Math.min(W / (N + 1.5), 74);
      th = tw / 2;
      ox = W / 2;
      oy = H / 2 - (N * th) / 2 + th;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const hw = () => tw / 2;
    const hh = () => th / 2;

    // grid → screen (ground point)
    const proj = (gx: number, gy: number) => ({
      x: ox + (gx - gy) * hw(),
      y: oy + (gx + gy) * hh(),
    });

    const mix = (c1: string, c2: string, t: number) => {
      const p = (c: string) => [
        parseInt(c.slice(1, 3), 16),
        parseInt(c.slice(3, 5), 16),
        parseInt(c.slice(5, 7), 16),
      ];
      const a = p(c1),
        b = p(c2);
      const r = a.map((v, i) => Math.round(v + (b[i] - v) * t));
      return `rgb(${r[0]},${r[1]},${r[2]})`;
    };

    const start = performance.now();
    const DURATION = 9000;
    let raf = 0;

    const diamond = (x: number, y: number, fill: string, stroke?: string) => {
      ctx.beginPath();
      ctx.moveTo(x, y - hh());
      ctx.lineTo(x + hw(), y);
      ctx.lineTo(x, y + hh());
      ctx.lineTo(x - hw(), y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const draw = (now: number) => {
      const elapsed = now - start;
      const p = clamp(elapsed / DURATION);
      const time = now / 1000;

      if (!twinFired.current && p > 0.9) {
        twinFired.current = true;
        onTwinReady?.();
      }

      ctx.clearRect(0, 0, W, H);

      // dusk shift for lighting stage
      const dusk = seg(p, 0.8, 0.94);
      const groundCol =
        theme === "dark"
          ? mix(pal.ground, "#03060a", dusk)
          : mix(pal.ground, "#dfe8f4", dusk);

      // ── ground tiles ──────────────────────────────────────────────────────
      for (let gy = 0; gy < N; gy++) {
        for (let gx = 0; gx < N; gx++) {
          const c = cells[gy * N + gx];
          const rev = seg(p, 0, 0.12) * (1 - c.order * 0.3);
          if (rev <= 0) continue;
          const s = proj(gx, gy);
          ctx.globalAlpha = clamp(rev);
          diamond(
            s.x,
            s.y,
            c.road && seg(p, 0.12, 0.24) > 0 ? pal.road : groundCol,
            pal.groundLine
          );
          ctx.globalAlpha = 1;
        }
      }

      // ── buildings (painter's order: y then x ascending) ───────────────────
      for (let gy = 0; gy < N; gy++) {
        for (let gx = 0; gx < N; gx++) {
          const c = cells[gy * N + gx];
          if (c.road || c.h <= 0) continue;
          const grow = seg(p, 0.24 + c.order * 0.22, 0.52 + c.order * 0.22);
          if (grow <= 0) continue;
          const s = proj(gx, gy);
          const bh = c.h * tw * 0.5 * grow;

          const topY = s.y - bh;
          const faceL = mix(pal.faceL, pal.accent, c.hue * 0.25);
          const faceR = mix(pal.faceR, pal.accent, c.hue * 0.25);

          // left face
          ctx.beginPath();
          ctx.moveTo(s.x - hw(), s.y);
          ctx.lineTo(s.x, s.y + hh());
          ctx.lineTo(s.x, topY + hh());
          ctx.lineTo(s.x - hw(), topY);
          ctx.closePath();
          ctx.fillStyle = faceL;
          ctx.fill();

          // right face
          ctx.beginPath();
          ctx.moveTo(s.x + hw(), s.y);
          ctx.lineTo(s.x, s.y + hh());
          ctx.lineTo(s.x, topY + hh());
          ctx.lineTo(s.x + hw(), topY);
          ctx.closePath();
          ctx.fillStyle = faceR;
          ctx.fill();

          // top
          diamond(s.x, topY, mix(pal.top, pal.accent, c.hue * 0.3));

          // windows / lights at dusk
          if (dusk > 0) {
            const rows = Math.max(1, Math.floor(c.h * 2));
            for (let r = 0; r < rows; r++) {
              const wy = topY + hh() + (r + 0.5) * ((bh - hh()) / rows);
              const lit = rnd(gx * 7 + r, gy * 3) > 0.4;
              if (!lit) continue;
              const tw2 =
                0.5 + 0.5 * Math.sin(time * 2 + gx + gy + r);
              ctx.globalAlpha = dusk * (0.4 + 0.6 * tw2);
              ctx.fillStyle = pal.window;
              ctx.fillRect(s.x - hw() * 0.55, wy, hw() * 0.28, th * 0.14);
              ctx.fillRect(s.x + hw() * 0.28, wy, hw() * 0.28, th * 0.14);
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      // ── trees ─────────────────────────────────────────────────────────────
      const treeR = seg(p, 0.52, 0.62);
      if (treeR > 0) {
        for (let gy = 0; gy < N; gy++) {
          for (let gx = 0; gx < N; gx++) {
            const c = cells[gy * N + gx];
            if (!c.tree) continue;
            const s = proj(gx, gy);
            ctx.globalAlpha = treeR;
            ctx.fillStyle = pal.tree;
            ctx.beginPath();
            ctx.arc(s.x, s.y - th * 0.5 * treeR, th * 0.34 * treeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }

      // ── vehicles ──────────────────────────────────────────────────────────
      const vehR = seg(p, 0.62, 0.72);
      if (vehR > 0) {
        vehicles.forEach((v) => {
          v.t = (v.t + v.spd * 0.016 * v.dir + 1) % 1;
          const pos = v.t * (N - 1);
          const gx = v.axis === "x" ? pos : v.lane;
          const gy = v.axis === "x" ? v.lane : pos;
          const s = proj(gx, gy);
          ctx.globalAlpha = vehR;
          ctx.fillStyle = v.axis === "x" ? pal.accent2 : pal.accent;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, tw * 0.12, th * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      }

      // ── pedestrians ───────────────────────────────────────────────────────
      const pedR = seg(p, 0.72, 0.8);
      if (pedR > 0) {
        peds.forEach((pd) => {
          pd.t = (pd.t + pd.spd * 0.016 * pd.dir + 1) % 1;
          const pos = pd.t * (N - 1);
          const gx = pd.axis === "x" ? pos : pd.lane + pd.off;
          const gy = pd.axis === "x" ? pd.lane + pd.off : pos;
          const s = proj(gx, gy);
          ctx.globalAlpha = pedR * 0.8;
          ctx.fillStyle = pal.ped;
          ctx.fillRect(s.x - 1.1, s.y - 1.1, 2.2, 2.2);
          ctx.globalAlpha = 1;
        });
      }

      // ── digital-twin indicators (pulsing nodes on tall buildings) ─────────
      const twinR = seg(p, 0.9, 1);
      if (twinR > 0) {
        const picks = [
          [2, 5],
          [5, 2],
          [4, 7],
          [7, 4],
        ];
        picks.forEach(([gx, gy], i) => {
          const c = cells[gy * N + gx];
          const bh = c.h * tw * 0.5;
          const s = proj(gx, gy);
          const y = s.y - bh - th * 0.5;
          const pulse = 0.5 + 0.5 * Math.sin(time * 2.4 + i);
          ctx.globalAlpha = twinR;
          ctx.strokeStyle = pal.accent2;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(s.x, y, 4 + pulse * 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = pal.accent2;
          ctx.beginPath();
          ctx.arc(s.x, y, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [theme, onTwinReady]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
