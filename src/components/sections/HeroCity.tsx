"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Building palettes — dark at rest, illuminated only by mouse proximity
// ---------------------------------------------------------------------------
const PALETTES = [
  { dl: "#060e1a", dr: "#040911", dt: "#09152a", ll: "#1e3d66", lr: "#122640", lt: "#274f80", ac: [59, 130, 246] as [number,number,number] },
  { dl: "#08091e", dr: "#050612", dt: "#0c0e2e", ll: "#1e2068", lr: "#131542", lt: "#282a88", ac: [99, 102, 241] as [number,number,number] },
  { dl: "#0d0820", dr: "#080512", dt: "#120a30", ll: "#30106c", lr: "#1c0a44", lt: "#3e1488", ac: [168, 85, 247] as [number,number,number] },
  { dl: "#031018", dr: "#01080e", dt: "#051822", ll: "#0a3848", lr: "#062430", lt: "#0e4a5c", ac: [6, 182, 212] as [number,number,number] },
  { dl: "#031414", dr: "#010e0e", dt: "#051e1e", ll: "#083e38", lr: "#052820", lt: "#0a4e48", ac: [20, 184, 166] as [number,number,number] },
  { dl: "#080c18", dr: "#050910", dt: "#0c1222", ll: "#142e52", lr: "#0c1e38", lt: "#1a3a68", ac: [14, 165, 233] as [number,number,number] },
] as const;

// Street "vehicles" — small glowing spheres that circulate the lanes
// between buildings (they never leave those lanes, so collisions with
// buildings are structurally impossible).
const VEHICLE_COLORS_DARK: [number, number, number][] = [
  [24, 194, 156],  // neon green
  [83, 228, 225],  // cyan
  [120, 170, 255], // blue
  [180, 130, 255], // purple
];
const VEHICLE_COLORS_LIGHT: [number, number, number][] = [
  [14, 157, 128],
  [27, 185, 187],
  [60, 130, 220],
  [150, 110, 210],
];

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function blendHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
}

// Parses "rgb(r,g,b)" / "rgba(r,g,b,a)" and nudges brightness by `amt`
// (-255..255), used to fake a soft top-lit / bottom-shaded gradient on
// each building face instead of a flat fill.
function shade(color: string, amt: number): string {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return color;
  const parts = m[1].split(",").map(s => parseFloat(s.trim()));
  const [r, g, b, a] = parts;
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const nr = clamp(r + amt), ng = clamp(g + amt), nb = clamp(b + amt);
  return a === undefined ? `rgb(${nr},${ng},${nb})` : `rgba(${nr},${ng},${nb},${a})`;
}

interface Building {
  col: number; row: number;
  baseH: number; currentH: number; targetH: number;
  pi: number; pOff: number;
  winLit: boolean[];
}

interface StreetVehicle {
  fixedIsCol: boolean; // true: fixed column, moves along row / false: fixed row, moves along col
  fixed: number;
  t: number;
  dir: 1 | -1;
  colorIdx: number;
  speedIdle: number;
  speedBoost: number;
  wobblePhase: number;
  trail: { x: number; y: number }[];
}

export function HeroCity() {
  const t = useTranslations("hero");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const bRef = useRef<Building[]>([]);
  const vRef = useRef<StreetVehicle[]>([]);
  const rafRef = useRef(0);
  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);

  useEffect(() => { themeRef.current = resolvedTheme; }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const GRID = 11;

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();

    // Generate city grid
    const buildings: Building[] = [];
    const streetCols: number[] = [];
    const streetRows: number[] = [];
    for (let col = 0; col < GRID; col++) {
      for (let row = 0; row < GRID; row++) {
        if (col % 5 === 2 || row % 5 === 2) continue; // streets — kept empty
        const baseH = 8 + Math.random() * 60;
        buildings.push({
          col, row, baseH,
          currentH: 0,
          targetH: baseH,
          pi: Math.floor(Math.random() * PALETTES.length),
          pOff: Math.random() * Math.PI * 2,
          winLit: Array.from({ length: 10 }, () => Math.random() > 0.3),
        });
      }
    }
    for (let i = 0; i < GRID; i++) {
      if (i % 5 === 2) { streetCols.push(i); streetRows.push(i); }
    }
    buildings.sort((a, b) => (a.col + a.row) - (b.col + b.row));
    bRef.current = buildings;

    // Populate street vehicles — a few per lane, opposite directions,
    // idling gently until the cursor passes nearby.
    const vehicles: StreetVehicle[] = [];
    streetCols.forEach((c, i) => {
      for (let k = 0; k < 3; k++) {
        vehicles.push({
          fixedIsCol: true, fixed: c,
          t: (k / 3) * GRID + Math.random() * 1.5,
          dir: k % 2 === 0 ? 1 : -1,
          colorIdx: (i + k) % VEHICLE_COLORS_DARK.length,
          speedIdle: 0.12 + Math.random() * 0.08,
          speedBoost: 1.2 + Math.random() * 0.6,
          wobblePhase: Math.random() * Math.PI * 2,
          trail: [],
        });
      }
    });
    streetRows.forEach((r, i) => {
      for (let k = 0; k < 3; k++) {
        vehicles.push({
          fixedIsCol: false, fixed: r,
          t: (k / 3) * GRID + Math.random() * 1.5,
          dir: k % 2 === 0 ? 1 : -1,
          colorIdx: (i + k + 1) % VEHICLE_COLORS_DARK.length,
          speedIdle: 0.12 + Math.random() * 0.08,
          speedBoost: 1.2 + Math.random() * 0.6,
          wobblePhase: Math.random() * Math.PI * 2,
          trail: [],
        });
      }
    });
    vRef.current = vehicles;

    let startTime = 0;
    let lastTs = 0;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const time = (ts - startTime) / 1000;
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0;
      lastTs = ts;

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const isDark = themeRef.current !== "light";

      const TW = Math.max(52, Math.min(100, W / 10));
      const TH = TW * 0.5;
      const OX = W * 0.62;
      const OY = H * 0.57;
      const MR = Math.min(W, H) * 0.28;

      ctx.clearRect(0, 0, W, H);

      // ── Background ────────────────────────────────────────────────────
      if (isDark) {
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, "#050505");
        bg.addColorStop(0.5, "#030307");
        bg.addColorStop(1, "#090909");
        ctx.fillStyle = bg;
      } else {
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, "#faf8f4");
        bg.addColorStop(1, "#f2ede5");
        ctx.fillStyle = bg;
      }
      ctx.fillRect(0, 0, W, H);

      if (isDark) {
        const atmG = ctx.createRadialGradient(W * 0.25, H * 0.5, 0, W * 0.25, H * 0.5, W * 0.45);
        atmG.addColorStop(0, "rgba(99,102,241,0.055)");
        atmG.addColorStop(0.5, "rgba(59,130,246,0.025)");
        atmG.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = atmG;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Ground grid lines ───────────────────────────────────────────────
      ctx.strokeStyle = isDark ? "rgba(30,60,120,0.09)" : "rgba(100,150,220,0.14)";
      ctx.lineWidth = 0.5;
      for (let c = 0; c < GRID; c++) {
        for (let r = 0; r < GRID; r++) {
          const sx = OX + (c - r) * TW / 2;
          const sy = OY + (c + r) * TH / 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy - TH / 2);
          ctx.lineTo(sx + TW / 2, sy);
          ctx.lineTo(sx, sy + TH / 2);
          ctx.lineTo(sx - TW / 2, sy);
          ctx.closePath();
          ctx.stroke();
        }
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // ── Buildings ─────────────────────────────────────────────────────
      bRef.current.forEach(b => {
        const cx = OX + (b.col - b.row) * TW / 2;
        const cyBase = OY + (b.col + b.row) * TH / 2;

        const dx = mx - cx, dy = my - cyBase;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / MR);
        b.targetH = b.baseH + influence * 160;

        const introFactor = Math.min(1, Math.max(0, (time - (b.col + b.row) * 0.04) * 1.4));
        const introEased = 1 - (1 - introFactor) ** 2.8;
        // 300–500ms smoothing for the rise/scale/glow micro-interaction
        b.currentH += (b.targetH * introEased - b.currentH) * 0.1;
        const h = b.currentH;
        if (h < 1) return;

        const scale = 1 + influence * 0.06;
        const hw = (TW / 2) * scale, hh = (TH / 2) * scale;
        const cy = cyBase - influence * 5;

        const pal = PALETTES[b.pi];
        const ac = isDark ? pal.ac : getRainbowRgb(b.pi, time);

        // ── Faces: gradient fill (depth) instead of flat color ───────────
        const leftBase = isDark
          ? blendHex(pal.dl, pal.ll, influence * influence)
          : `rgba(${ac[0]},${ac[1]},${ac[2]},${0.08 + influence * 0.35})`;
        const leftGrad = ctx.createLinearGradient(cx - hw, cy - h, cx, cy + hh - h);
        leftGrad.addColorStop(0, shade(leftBase, isDark ? 14 : 10));
        leftGrad.addColorStop(1, shade(leftBase, isDark ? -16 : -6));

        ctx.beginPath();
        ctx.moveTo(cx - hw, cy);
        ctx.lineTo(cx, cy + hh);
        ctx.lineTo(cx, cy + hh - h);
        ctx.lineTo(cx - hw, cy - h);
        ctx.closePath();
        ctx.fillStyle = leftGrad;
        ctx.fill();

        const rightBase = isDark
          ? blendHex(pal.dr, pal.lr, influence * influence)
          : `rgba(${ac[0]},${ac[1]},${ac[2]},${0.05 + influence * 0.22})`;
        const rightGrad = ctx.createLinearGradient(cx, cy - h, cx + hw, cy);
        rightGrad.addColorStop(0, shade(rightBase, isDark ? 6 : 6));
        rightGrad.addColorStop(1, shade(rightBase, isDark ? -20 : -10));

        ctx.beginPath();
        ctx.moveTo(cx, cy + hh);
        ctx.lineTo(cx + hw, cy);
        ctx.lineTo(cx + hw, cy - h);
        ctx.lineTo(cx, cy + hh - h);
        ctx.closePath();
        ctx.fillStyle = rightGrad;
        ctx.fill();

        const topBase = isDark
          ? blendHex(pal.dt, pal.lt, influence * influence)
          : `rgba(${ac[0]},${ac[1]},${ac[2]},${0.12 + influence * 0.5})`;
        const topGrad = ctx.createLinearGradient(cx - hw, cy - h, cx + hw, cy - h - hh);
        topGrad.addColorStop(0, shade(topBase, isDark ? -6 : -4));
        topGrad.addColorStop(0.5, shade(topBase, isDark ? 26 : 16));
        topGrad.addColorStop(1, shade(topBase, isDark ? -6 : -4));

        ctx.beginPath();
        ctx.moveTo(cx - hw, cy - h);
        ctx.lineTo(cx, cy - hh - h);
        ctx.lineTo(cx + hw, cy - h);
        ctx.lineTo(cx, cy + hh - h);
        ctx.closePath();
        ctx.fillStyle = topGrad;
        ctx.fill();

        // Outline edges
        ctx.strokeStyle = isDark
          ? `rgba(${ac[0]},${ac[1]},${ac[2]},${0.06 + influence * 0.25})`
          : `rgba(${ac[0]},${ac[1]},${ac[2]},${0.2 + influence * 0.6})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx - hw, cy); ctx.lineTo(cx - hw, cy - h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + hw, cy); ctx.lineTo(cx + hw, cy - h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - hw, cy - h);
        ctx.lineTo(cx, cy - hh - h);
        ctx.lineTo(cx + hw, cy - h);
        ctx.stroke();

        // ── Windows: only visible with mouse proximity ──────────────────
        if (influence > 0.18 && h > 20) {
          const winCount = Math.min(4, Math.floor(h / 17));
          for (let wi = 0; wi < winCount; wi++) {
            for (let wj = 0; wj < 2; wj++) {
              const idx = wi * 2 + wj;
              if (idx >= b.winLit.length || !b.winLit[idx]) continue;
              const wpulse = (Math.sin(time * 1.6 + b.pOff + wi * 0.9 + wj * 1.2) * 0.45 + 0.55) * influence;
              const wFrac = (wi + 1) / (winCount + 1);
              const wjFrac = (wj + 0.5) / 2;
              const wx = cx - hw * (1 - wjFrac * 0.42) + wjFrac * hw * 0.1;
              const wy = cy + hh - h * wFrac + hh * (wjFrac - 0.5) * 0.36;
              const wr = 1 + wpulse * 1.8;

              ctx.beginPath();
              ctx.arc(wx, wy, wr, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${ac[0]},${ac[1]},${ac[2]},${wpulse * 0.95})`;
              ctx.fill();

              if (wpulse > 0.5) {
                const wgr = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr * 5);
                wgr.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},${wpulse * 0.38})`);
                wgr.addColorStop(1, `rgba(${ac[0]},${ac[1]},${ac[2]},0)`);
                ctx.fillStyle = wgr;
                ctx.beginPath();
                ctx.arc(wx, wy, wr * 5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        // ── Vertical energy pulse: only when mouse is close ──────────────
        if (influence > 0.35 && h > 30) {
          const pFrac = ((time * 0.55 + b.pOff / (Math.PI * 2)) % 1.0);
          const pOpacity = Math.sin(pFrac * Math.PI) * influence * 0.85;
          if (pOpacity > 0.06) {
            const pR = 2 + Math.sin(pFrac * Math.PI) * 3;
            const pX = cx + hw * 0.3;
            const pY = cy + hh - pFrac * h;

            ctx.beginPath();
            ctx.arc(pX, pY, pR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${ac[0]},${ac[1]},${ac[2]},${pOpacity})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            const pgr = ctx.createRadialGradient(pX, pY, 0, pX, pY, pR * 4);
            pgr.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},${pOpacity * 0.45})`);
            pgr.addColorStop(1, `rgba(${ac[0]},${ac[1]},${ac[2]},0)`);
            ctx.fillStyle = pgr;
            ctx.beginPath();
            ctx.arc(pX, pY, pR * 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // ── Rooftop beacon: only when strongly illuminated ───────────────
        if (influence > 0.6 && h > 45) {
          const rg = (0.6 + Math.sin(time * 1.5 + b.pOff) * 0.4) * influence;
          const rpX = cx, rpY = cy - hh - h;
          const rgr = ctx.createRadialGradient(rpX, rpY, 0, rpX, rpY, 20 + rg * 16);
          rgr.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},${rg * 0.7})`);
          rgr.addColorStop(1, `rgba(${ac[0]},${ac[1]},${ac[2]},0)`);
          ctx.fillStyle = rgr;
          ctx.beginPath();
          ctx.arc(rpX, rpY, 20 + rg * 16, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ── Street vehicles: glowing spheres circulating the lanes ─────────
      // They're mathematically confined to the empty street lanes, so
      // they never overlap a building. A small sine "wobble" perpendicular
      // to the lane gives them a soft curved, believable path instead of
      // a rigid straight line.
      const vehicleColors = isDark ? VEHICLE_COLORS_DARK : VEHICLE_COLORS_LIGHT;
      vRef.current.forEach(v => {
        const wobble = Math.sin(time * 0.9 + v.wobblePhase) * 0.16;
        const col = v.fixedIsCol ? v.fixed + wobble : v.t;
        const row = v.fixedIsCol ? v.t : v.fixed + wobble;
        const vx = OX + (col - row) * TW / 2;
        const vy = OY + (col + row) * TH / 2;

        const dx = mx - vx, dy = my - vy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vInfluence = Math.max(0, 1 - dist / (TW * 2.6));

        const speed = v.speedIdle + vInfluence * v.speedBoost;
        if (dt > 0) {
          v.t += speed * dt * v.dir;
          if (v.t > GRID) v.t -= GRID;
          if (v.t < 0) v.t += GRID;
        }

        // Trail: keep the last few positions for a soft motion streak.
        v.trail.unshift({ x: vx, y: vy });
        if (v.trail.length > 6) v.trail.pop();

        const [cr, cg, cb] = vehicleColors[v.colorIdx];
        const baseOpacity = isDark ? 0.35 : 0.45;
        const opacity = baseOpacity + vInfluence * 0.5;
        const radius = 1.6 + vInfluence * 2.4;

        // Trail (rendered oldest → newest, fading out)
        for (let ti = v.trail.length - 1; ti >= 1; ti--) {
          const p = v.trail[ti];
          const trailT = 1 - ti / v.trail.length;
          const tr = radius * (0.35 + trailT * 0.5);
          ctx.beginPath();
          ctx.arc(p.x, p.y, tr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${opacity * trailT * 0.35})`;
          ctx.fill();
        }

        // Soft glow halo
        const gr = ctx.createRadialGradient(vx, vy, 0, vx, vy, radius * (3 + vInfluence * 3.5));
        gr.addColorStop(0, `rgba(${cr},${cg},${cb},${opacity * 0.5})`);
        gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(vx, vy, radius * (3 + vInfluence * 3.5), 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(vx, vy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${opacity})`;
        ctx.fill();
      });

      // ── Floating micro-particles ────────────────────────────────────────
      for (let i = 0; i < 22; i++) {
        const px = W * 0.1 + (Math.sin(time * 0.16 + i * 2.3) * 0.5 + 0.5) * W * 0.82;
        const py = H * 0.04 + (Math.cos(time * 0.11 + i * 1.8) * 0.35 + 0.35) * H * 0.5;
        const pr = 0.4 + (Math.sin(time + i * 0.75) * 0.5 + 0.5) * 1.2;
        const pac = isDark ? PALETTES[i % PALETTES.length].ac : getRainbowRgb(i, time * 0.5);
        const op = isDark ? (0.12 + Math.sin(time + i) * 0.08) : (0.25 + Math.sin(time + i) * 0.12);
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pac[0]},${pac[1]},${pac[2]},${op})`;
        ctx.fill();
      }

      // ── Bottom + left fog ────────────────────────────────────────────────
      const bfg = ctx.createLinearGradient(0, H * 0.68, 0, H);
      bfg.addColorStop(0, isDark ? "rgba(5,5,5,0)" : "rgba(250,248,244,0)");
      bfg.addColorStop(1, isDark ? "rgba(5,5,5,0.96)" : "rgba(242,237,229,0.97)");
      ctx.fillStyle = bfg;
      ctx.fillRect(0, H * 0.68, W, H * 0.32);

      // Left fade (text area stays clean)
      const lfg = ctx.createLinearGradient(0, 0, W * 0.38, 0);
      lfg.addColorStop(0, isDark ? "rgba(5,5,5,0.85)" : "rgba(250,248,244,0.88)");
      lfg.addColorStop(1, isDark ? "rgba(5,5,5,0)" : "rgba(250,248,244,0)");
      ctx.fillStyle = lfg;
      ctx.fillRect(0, 0, W * 0.38, H);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onTouch = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const tt = e.touches[0];
      mouseRef.current = { x: tt.clientX - rect.left, y: tt.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    const onResize = () => { resize(); };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section id="hero" aria-label="Hero" className="relative h-screen w-full overflow-hidden">
      {/* Canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Text overlay — left side, pointer-events-none so the canvas
          underneath (including the city on the right) keeps receiving
          mouse/touch input. */}
      <div className="pointer-events-none absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-8 md:px-14 lg:px-20">
          <div className="w-full md:w-[64%]">

            {/* Headline — Inter Black, large enough to anchor the whole
                first screen. Only the word "Smart" / "inteligente(s)"
                gets the animated gradient + italic treatment; the rest
                stays a solid, plain color. */}
            <h1
              aria-label={t("ariaLabel")}
              className="font-hero font-black leading-[1.02] tracking-tight select-none"
              style={{ fontSize: "clamp(3rem, 9vw, 7.5rem)" }}
            >
              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="block text-white dark:text-white light-hero-text"
              >
                {t("line1Pre")}
                <span className="hero-word-gradient italic">{t("line1Highlight")}</span>
                {t("line1Post")}
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.72, ease: [0.16, 1, 0.3, 1] }}
                className="block text-white dark:text-white light-hero-text"
              >
                {t("line2Pre")}
                <span className="hero-word-gradient italic">{t("line2Highlight")}</span>
                {t("line2Post")}
              </motion.span>
            </h1>

            {/* Subtle divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 h-px w-16 bg-gradient-to-r from-hero-line to-transparent"
              style={{ transformOrigin: "left" }}
            />
          </div>
        </div>
      </div>

      {/* Bottom glow — large, blurred, theme-adaptive semicircle that
          blends the Hero into the section below. */}
      <div aria-hidden className="hero-bottom-glow pointer-events-none absolute inset-x-0 bottom-0 h-[38vh]" />

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-px bg-gradient-to-b from-white/22 to-transparent"
        />
      </motion.div>
    </section>
  );
}

// Rainbow color cycling for light mode
function getRainbowRgb(index: number, time: number): [number, number, number] {
  const hue = ((index * 36 + time * 18) % 360);
  const h = hue / 360;
  const s = 0.75, l = 0.6;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toRgb = (tt: number) => {
    if (tt < 0) tt += 1; if (tt > 1) tt -= 1;
    if (tt < 1/6) return p + (q - p) * 6 * tt;
    if (tt < 1/2) return q;
    if (tt < 2/3) return p + (q - p) * (2/3 - tt) * 6;
    return p;
  };
  return [
    Math.round(toRgb(h + 1/3) * 255),
    Math.round(toRgb(h) * 255),
    Math.round(toRgb(h - 1/3) * 255),
  ];
}
