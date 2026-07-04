"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

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

type n = number;

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

interface Building {
  col: number; row: number;
  baseH: number; currentH: number; targetH: number;
  pi: number; pOff: number;
  winLit: boolean[];
}

export function HeroCity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const bRef = useRef<Building[]>([]);
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
      ctx.scale(dpr, dpr);
    };
    resize();

    // Generate city grid
    const buildings: Building[] = [];
    for (let col = 0; col < GRID; col++) {
      for (let row = 0; row < GRID; row++) {
        if (col % 5 === 2 || row % 5 === 2) continue; // streets
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
    buildings.sort((a, b) => (a.col + a.row) - (b.col + b.row));
    bRef.current = buildings;

    let startTime = 0;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const time = (ts - startTime) / 1000;

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const isDark = themeRef.current !== "light";

      const TW = Math.max(46, Math.min(86, W / 12));
      const TH = TW * 0.5;
      // City sits in the right-center area of the viewport
      const OX = W * 0.65;
      const OY = H * 0.56;
      const MR = Math.min(W, H) * 0.26;

      ctx.clearRect(0, 0, W, H);

      // ── Background ──────────────────────────────────────────────────────────
      if (isDark) {
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, "#030814");
        bg.addColorStop(0.5, "#02060f");
        bg.addColorStop(1, "#010408");
        ctx.fillStyle = bg;
      } else {
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, "#eaf1fb");
        bg.addColorStop(1, "#dce8f8");
        ctx.fillStyle = bg;
      }
      ctx.fillRect(0, 0, W, H);

      // Atmospheric glow behind text (left side)
      if (isDark) {
        const atmG = ctx.createRadialGradient(W * 0.25, H * 0.5, 0, W * 0.25, H * 0.5, W * 0.45);
        atmG.addColorStop(0, "rgba(99,102,241,0.055)");
        atmG.addColorStop(0.5, "rgba(59,130,246,0.025)");
        atmG.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = atmG;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Ground grid lines ───────────────────────────────────────────────────
      ctx.strokeStyle = isDark ? "rgba(30,60,120,0.09)" : "rgba(100,150,220,0.12)";
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

      // ── Buildings ────────────────────────────────────────────────────────────
      bRef.current.forEach(b => {
        const cx = OX + (b.col - b.row) * TW / 2;
        const cy = OY + (b.col + b.row) * TH / 2;
        const hw = TW / 2, hh = TH / 2;

        // Mouse influence (0 → 1)
        const dx = mx - cx, dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / MR);
        b.targetH = b.baseH + influence * 160;

        // Intro animation (buildings rise from ground on page load)
        const introFactor = Math.min(1, Math.max(0, (time - (b.col + b.row) * 0.04) * 1.4));
        const introEased = 1 - (1 - introFactor) ** 2.8;
        b.currentH += (b.targetH * introEased - b.currentH) * 0.1;
        const h = b.currentH;
        if (h < 1) return;

        const pal = PALETTES[b.pi];
        const ac = isDark ? pal.ac : getRainbowRgb(b.pi, time);

        // ── Faces: blend between dark base and lit version based on influence ──
        // LEFT FACE
        ctx.beginPath();
        ctx.moveTo(cx - hw, cy);
        ctx.lineTo(cx, cy + hh);
        ctx.lineTo(cx, cy + hh - h);
        ctx.lineTo(cx - hw, cy - h);
        ctx.closePath();
        ctx.fillStyle = isDark
          ? blendHex(pal.dl, pal.ll, influence * influence)
          : `rgba(${ac[0]},${ac[1]},${ac[2]},${0.08 + influence * 0.35})`;
        ctx.fill();

        // RIGHT FACE
        ctx.beginPath();
        ctx.moveTo(cx, cy + hh);
        ctx.lineTo(cx + hw, cy);
        ctx.lineTo(cx + hw, cy - h);
        ctx.lineTo(cx, cy + hh - h);
        ctx.closePath();
        ctx.fillStyle = isDark
          ? blendHex(pal.dr, pal.lr, influence * influence)
          : `rgba(${ac[0]},${ac[1]},${ac[2]},${0.05 + influence * 0.22})`;
        ctx.fill();

        // TOP FACE
        ctx.beginPath();
        ctx.moveTo(cx - hw, cy - h);
        ctx.lineTo(cx, cy - hh - h);
        ctx.lineTo(cx + hw, cy - h);
        ctx.lineTo(cx, cy + hh - h);
        ctx.closePath();
        ctx.fillStyle = isDark
          ? blendHex(pal.dt, pal.lt, influence * influence)
          : `rgba(${ac[0]},${ac[1]},${ac[2]},${0.12 + influence * 0.5})`;
        ctx.fill();

        // Outline edges (always visible but subtle)
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

        // ── Windows: only visible with mouse proximity ──────────────────────
        if (influence > 0.18 && h > 20) {
          const winCount = Math.min(4, Math.floor(h / 17));
          for (let wi = 0; wi < winCount; wi++) {
            for (let wj = 0; wj < 2; wj++) {
              const idx = wi * 2 + wj;
              if (idx >= b.winLit.length || !b.winLit[idx]) continue;
              const wpulse = (Math.sin(time * 1.6 + b.pOff + wi * 0.9 + wj * 1.2) * 0.45 + 0.55)
                * influence;
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

        // ── Vertical energy pulse: only when mouse is close ─────────────────
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

        // ── Rooftop beacon: only when strongly illuminated ───────────────────
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

      // ── Floating micro-particles ─────────────────────────────────────────────
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

      // ── Bottom + left fog ────────────────────────────────────────────────────
      const bfg = ctx.createLinearGradient(0, H * 0.68, 0, H);
      bfg.addColorStop(0, isDark ? "rgba(3,8,20,0)" : "rgba(234,241,251,0)");
      bfg.addColorStop(1, isDark ? "rgba(3,8,20,0.96)" : "rgba(220,232,248,0.97)");
      ctx.fillStyle = bfg;
      ctx.fillRect(0, H * 0.68, W, H * 0.32);

      // Left fade (text area stays clean)
      const lfg = ctx.createLinearGradient(0, 0, W * 0.38, 0);
      lfg.addColorStop(0, isDark ? "rgba(3,8,20,0.85)" : "rgba(234,241,251,0.88)");
      lfg.addColorStop(1, isDark ? "rgba(3,8,20,0)" : "rgba(234,241,251,0)");
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
      const t = e.touches[0];
      mouseRef.current = { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("resize", () => {
      resize();
      // rebuild buildings on resize
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <section id="hero" aria-label="Hero" className="relative h-screen w-full overflow-hidden">
      {/* Canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Text overlay — left 60% */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-8 md:px-14 lg:px-20">
          <div className="w-full md:w-[60%]">

            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-7 text-[0.7rem] font-medium uppercase tracking-[0.32em] text-white/40 dark:text-white/38 light:text-slate-400"
            >
              Urban Intelligence Layer
            </motion.p>

            {/* Main headline */}
            <h1
              aria-label="Cosas inteligentes para ciudades inteligentes"
              className="font-semibold leading-[1.0] tracking-tight select-none"
              style={{ fontSize: "clamp(2.4rem, 7vw, 5.8rem)" }}
            >
              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="block text-white dark:text-white light-hero-text"
              >
                Cosas
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.78, ease: [0.16, 1, 0.3, 1] }}
                className="block hero-word-gradient"
              >
                inteligentes
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.91, ease: [0.16, 1, 0.3, 1] }}
                className="block text-white/75 dark:text-white/72 light-hero-subtext"
                style={{ fontSize: "0.78em" }}
              >
                para ciudades
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.04, ease: [0.16, 1, 0.3, 1] }}
                className="block hero-word-gradient"
                style={{ fontSize: "0.78em" }}
              >
                inteligentes.
              </motion.span>
            </h1>

            {/* Subtle divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 h-px w-16 bg-gradient-to-r from-hero-line to-transparent"
              style={{ transformOrigin: "left" }}
            />
          </div>
        </div>
      </div>

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
  const toRgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [
    Math.round(toRgb(h + 1/3) * 255),
    Math.round(toRgb(h) * 255),
    Math.round(toRgb(h - 1/3) * 255),
  ];
}
