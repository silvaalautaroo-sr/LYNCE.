"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

// ─── Building palettes (cold, non-dominant green) ────────────────────────────
const PALETTES = [
  { dl: "#060e1a", dr: "#040911", dt: "#09152a", ll: "#1e3d66", lr: "#122640", lt: "#274f80", ac: [59, 130, 246] as [number, number, number] },
  { dl: "#08091e", dr: "#050612", dt: "#0c0e2e", ll: "#1e2068", lr: "#131542", lt: "#282a88", ac: [99, 102, 241] as [number, number, number] },
  { dl: "#0d0820", dr: "#080512", dt: "#120a30", ll: "#30106c", lr: "#1c0a44", lt: "#3e1488", ac: [168, 85, 247] as [number, number, number] },
  { dl: "#031018", dr: "#01080e", dt: "#051822", ll: "#0a3848", lr: "#062430", lt: "#0e4a5c", ac: [6, 182, 212] as [number, number, number] },
  { dl: "#031414", dr: "#010e0e", dt: "#051e1e", ll: "#083e38", lr: "#052820", lt: "#0a4e48", ac: [20, 184, 166] as [number, number, number] },
  { dl: "#080c18", dr: "#050910", dt: "#0c1222", ll: "#142e52", lr: "#0c1e38", lt: "#1a3a68", ac: [14, 165, 233] as [number, number, number] },
] as const;

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function blend(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
}

function getRainbowRgb(index: number, time: number): [number, number, number] {
  const hue = ((index * 36 + time * 15) % 360) / 360;
  const s = 0.8, l = 0.58;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(hue + 1 / 3) * 255), Math.round(f(hue) * 255), Math.round(f(hue - 1 / 3) * 255)];
}

interface Building {
  col: number; row: number;
  baseH: number; currentH: number; targetH: number;
  pi: number; pOff: number; winLit: boolean[];
}

export function HeroCity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const bRef      = useRef<Building[]>([]);
  const rafRef    = useRef(0);
  const { resolvedTheme } = useTheme();
  const themeRef  = useRef(resolvedTheme);
  const t         = useTranslations("hero");

  useEffect(() => { themeRef.current = resolvedTheme; }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr  = window.devicePixelRatio || 1;
    const GRID = 11;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const buildings: Building[] = [];
    for (let col = 0; col < GRID; col++) {
      for (let row = 0; row < GRID; row++) {
        if (col % 5 === 2 || row % 5 === 2) continue;
        const baseH = 8 + Math.random() * 60;
        buildings.push({
          col, row, baseH,
          currentH: 0, targetH: baseH,
          pi: Math.floor(Math.random() * PALETTES.length),
          pOff: Math.random() * Math.PI * 2,
          winLit: Array.from({ length: 10 }, () => Math.random() > 0.3),
        });
      }
    }
    buildings.sort((a, b) => (a.col + a.row) - (b.col + b.row));
    bRef.current = buildings;

    let t0 = 0;

    const draw = (ts: number) => {
      if (!t0) t0 = ts;
      const time   = (ts - t0) / 1000;
      const W      = canvas.offsetWidth;
      const H      = canvas.offsetHeight;
      const isDark = themeRef.current !== "light";

      const TW = Math.max(46, Math.min(86, W / 12));
      const TH = TW * 0.5;
      const OX = W * 0.64;
      const OY = H * 0.56;
      const MR = Math.min(W, H) * 0.26;

      ctx.clearRect(0, 0, W, H);

      if (isDark) {
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, "#030814"); bg.addColorStop(0.5, "#02060f"); bg.addColorStop(1, "#010408");
        ctx.fillStyle = bg;
      } else {
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, "#eaf1fb"); bg.addColorStop(1, "#dce8f8");
        ctx.fillStyle = bg;
      }
      ctx.fillRect(0, 0, W, H);

      if (isDark) {
        const topGlow = ctx.createLinearGradient(0, 0, 0, H * 0.38);
        topGlow.addColorStop(0, "rgba(15,10,60,0.92)");
        topGlow.addColorStop(0.3, "rgba(10,12,45,0.65)");
        topGlow.addColorStop(0.7, "rgba(5,8,30,0.28)");
        topGlow.addColorStop(1, "rgba(2,6,20,0)");
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, W, H * 0.38);

        const topShimmer = ctx.createLinearGradient(0, 0, W, 0);
        topShimmer.addColorStop(0,   "rgba(99,102,241,0.18)");
        topShimmer.addColorStop(0.4, "rgba(59,130,246,0.10)");
        topShimmer.addColorStop(0.7, "rgba(6,182,212,0.07)");
        topShimmer.addColorStop(1,   "rgba(168,85,247,0.15)");
        ctx.fillStyle = topShimmer;
        ctx.fillRect(0, 0, W, 3);

        const atm = ctx.createRadialGradient(W * 0.22, H * 0.5, 0, W * 0.22, H * 0.5, W * 0.44);
        atm.addColorStop(0, "rgba(99,102,241,0.055)");
        atm.addColorStop(0.5, "rgba(59,130,246,0.025)");
        atm.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = atm;
        ctx.fillRect(0, 0, W, H);
      } else {
        const topGlow = ctx.createLinearGradient(0, 0, 0, H * 0.4);
        topGlow.addColorStop(0,   "rgba(220,230,255,0.96)");
        topGlow.addColorStop(0.25,"rgba(210,225,255,0.75)");
        topGlow.addColorStop(0.6, "rgba(220,235,255,0.32)");
        topGlow.addColorStop(1,   "rgba(220,232,248,0)");
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, W, H * 0.4);

        const rainbowBand = ctx.createLinearGradient(0, 0, W, 0);
        rainbowBand.addColorStop(0,    "rgba(232,121,249,0.35)");
        rainbowBand.addColorStop(0.18, "rgba(129,140,248,0.3)");
        rainbowBand.addColorStop(0.36, "rgba(56,189,248,0.28)");
        rainbowBand.addColorStop(0.54, "rgba(52,211,153,0.25)");
        rainbowBand.addColorStop(0.72, "rgba(251,191,36,0.28)");
        rainbowBand.addColorStop(0.88, "rgba(249,115,22,0.3)");
        rainbowBand.addColorStop(1,    "rgba(239,68,68,0.32)");
        ctx.fillStyle = rainbowBand;
        ctx.fillRect(0, 0, W, 4);
      }

      ctx.strokeStyle = isDark ? "rgba(30,60,120,0.09)" : "rgba(100,150,220,0.12)";
      ctx.lineWidth   = 0.5;
      for (let c = 0; c < GRID; c++) {
        for (let r = 0; r < GRID; r++) {
          const sx = OX + (c - r) * TW / 2;
          const sy = OY + (c + r) * TH / 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy - TH / 2); ctx.lineTo(sx + TW / 2, sy);
          ctx.lineTo(sx, sy + TH / 2); ctx.lineTo(sx - TW / 2, sy);
          ctx.closePath(); ctx.stroke();
        }
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      bRef.current.forEach(b => {
        const cx = OX + (b.col - b.row) * TW / 2;
        const cy = OY + (b.col + b.row) * TH / 2;
        const hw = TW / 2, hh = TH / 2;

        const dx  = mx - cx, dy = my - cy;
        const inf = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / MR);
        b.targetH = b.baseH + inf * 160;

        const intro = Math.min(1, Math.max(0, (time - (b.col + b.row) * 0.04) * 1.4));
        const eased = 1 - (1 - intro) ** 2.8;
        b.currentH += (b.targetH * eased - b.currentH) * 0.1;
        const h = b.currentH;
        if (h < 1) return;

        const pal = PALETTES[b.pi];
        const ac  = isDark ? pal.ac : getRainbowRgb(b.pi, time);
        const t2  = inf * inf;

        ctx.beginPath();
        ctx.moveTo(cx - hw, cy); ctx.lineTo(cx, cy + hh);
        ctx.lineTo(cx, cy + hh - h); ctx.lineTo(cx - hw, cy - h);
        ctx.closePath();
        ctx.fillStyle = isDark ? blend(pal.dl, pal.ll, t2) : `rgba(${ac[0]},${ac[1]},${ac[2]},${0.08 + inf * 0.34})`;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy + hh); ctx.lineTo(cx + hw, cy);
        ctx.lineTo(cx + hw, cy - h); ctx.lineTo(cx, cy + hh - h);
        ctx.closePath();
        ctx.fillStyle = isDark ? blend(pal.dr, pal.lr, t2) : `rgba(${ac[0]},${ac[1]},${ac[2]},${0.05 + inf * 0.22})`;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx - hw, cy - h); ctx.lineTo(cx, cy - hh - h);
        ctx.lineTo(cx + hw, cy - h); ctx.lineTo(cx, cy + hh - h);
        ctx.closePath();
        ctx.fillStyle = isDark ? blend(pal.dt, pal.lt, t2) : `rgba(${ac[0]},${ac[1]},${ac[2]},${0.12 + inf * 0.48})`;
        ctx.fill();

        ctx.strokeStyle = `rgba(${ac[0]},${ac[1]},${ac[2]},${0.06 + inf * 0.24})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(cx - hw, cy); ctx.lineTo(cx - hw, cy - h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + hw, cy); ctx.lineTo(cx + hw, cy - h); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - hw, cy - h); ctx.lineTo(cx, cy - hh - h); ctx.lineTo(cx + hw, cy - h);
        ctx.stroke();

        if (inf > 0.18 && h > 20) {
          const wc = Math.min(4, Math.floor(h / 17));
          for (let wi = 0; wi < wc; wi++) {
            for (let wj = 0; wj < 2; wj++) {
              const idx = wi * 2 + wj;
              if (idx >= b.winLit.length || !b.winLit[idx]) continue;
              const wp  = (Math.sin(time * 1.6 + b.pOff + wi * 0.9 + wj * 1.2) * 0.45 + 0.55) * inf;
              const wF  = (wi + 1) / (wc + 1);
              const wjF = (wj + 0.5) / 2;
              const wx  = cx - hw * (1 - wjF * 0.42) + wjF * hw * 0.1;
              const wy  = cy + hh - h * wF + hh * (wjF - 0.5) * 0.36;
              const wr  = 1 + wp * 1.8;

              ctx.beginPath();
              ctx.arc(wx, wy, wr, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${ac[0]},${ac[1]},${ac[2]},${wp * 0.95})`;
              ctx.fill();

              if (wp > 0.48) {
                const g = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr * 5);
                g.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},${wp * 0.36})`);
                g.addColorStop(1, `rgba(${ac[0]},${ac[1]},${ac[2]},0)`);
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(wx, wy, wr * 5, 0, Math.PI * 2); ctx.fill();
              }
            }
          }
        }

        if (inf > 0.35 && h > 30) {
          const pf  = ((time * 0.55 + b.pOff / (Math.PI * 2)) % 1);
          const po  = Math.sin(pf * Math.PI) * inf * 0.85;
          if (po > 0.06) {
            const pr = 12 + Math.sin(pf * Math.PI) * 18;
            const px = cx + hw * 0.3;
            const py = cy + hh - pf * h;

            const sphereGrd = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
            sphereGrd.addColorStop(0,   `rgba(255,255,255,${po * 0.9})`);
            sphereGrd.addColorStop(0.35, `rgba(${ac[0]},${ac[1]},${ac[2]},${po * 0.85})`);
            sphereGrd.addColorStop(0.7,  `rgba(${ac[0]},${ac[1]},${ac[2]},${po * 0.5})`);
            sphereGrd.addColorStop(1,    `rgba(${ac[0]},${ac[1]},${ac[2]},0.05)`);
            ctx.fillStyle = sphereGrd;
            ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();

            const halo = ctx.createRadialGradient(px, py, pr * 0.5, px, py, pr * 3.5);
            halo.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},${po * 0.35})`);
            halo.addColorStop(1, `rgba(${ac[0]},${ac[1]},${ac[2]},0)`);
            ctx.fillStyle = halo;
            ctx.beginPath(); ctx.arc(px, py, pr * 3.5, 0, Math.PI * 2); ctx.fill();
          }
        }

        if (inf > 0.6 && h > 45) {
          const rg  = (0.6 + Math.sin(time * 1.5 + b.pOff) * 0.4) * inf;
          const rpX = cx, rpY = cy - hh - h;
          const gr  = ctx.createRadialGradient(rpX, rpY, 0, rpX, rpY, 20 + rg * 16);
          gr.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},${rg * 0.7})`);
          gr.addColorStop(1, `rgba(${ac[0]},${ac[1]},${ac[2]},0)`);
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.arc(rpX, rpY, 20 + rg * 16, 0, Math.PI * 2); ctx.fill();
        }
      });

      for (let i = 0; i < 22; i++) {
        const px  = W * 0.1 + (Math.sin(time * 0.16 + i * 2.3) * 0.5 + 0.5) * W * 0.82;
        const py  = H * 0.04 + (Math.cos(time * 0.11 + i * 1.8) * 0.35 + 0.35) * H * 0.5;
        const pr  = 0.4 + (Math.sin(time + i * 0.75) * 0.5 + 0.5) * 1.2;
        const pac = isDark ? PALETTES[i % PALETTES.length].ac : getRainbowRgb(i, time * 0.5);
        const op  = isDark ? (0.12 + Math.sin(time + i) * 0.07) : (0.22 + Math.sin(time + i) * 0.1);
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pac[0]},${pac[1]},${pac[2]},${op})`; ctx.fill();
      }

      const bfg = ctx.createLinearGradient(0, H * 0.68, 0, H);
      bfg.addColorStop(0, isDark ? "rgba(3,8,20,0)"    : "rgba(234,241,251,0)");
      bfg.addColorStop(1, isDark ? "rgba(3,8,20,0.97)" : "rgba(220,232,248,0.97)");
      ctx.fillStyle = bfg; ctx.fillRect(0, H * 0.68, W, H * 0.32);

      const lfg = ctx.createLinearGradient(0, 0, W * 0.4, 0);
      lfg.addColorStop(0, isDark ? "rgba(3,8,20,0.88)"    : "rgba(234,241,251,0.9)");
      lfg.addColorStop(1, isDark ? "rgba(3,8,20,0)"       : "rgba(234,241,251,0)");
      ctx.fillStyle = lfg; ctx.fillRect(0, 0, W * 0.4, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    const onMove  = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onTouch = (e: TouchEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    };
    const onLeave  = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    const onResize = () => resize();

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
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="w-full md:w-[62%]">

            <h1
              aria-label={`${t("line1")} ${t("line2")} ${t("line3")} ${t("line4")}`}
              className="tracking-tight select-none"
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2.75rem, 8vw, 6.8rem)",
                lineHeight: 1.15,
                paddingBottom: "0.08em",
              }}
            >
              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{
                  color: "var(--ink)",
                  fontStyle: "italic",
                  fontWeight: 900,
                }}
              >
                {t("line1")}
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="block hero-word-gradient"
                style={{ fontWeight: 900 }}
              >
                {t("line2")}
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{
                  fontSize: "0.76em",
                  color: "var(--ink-muted)",
                  fontWeight: 900,
                }}
              >
                {t("line3")}
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className="block hero-word-gradient"
                style={{ fontSize: "0.76em", fontWeight: 900 }}
              >
                <span style={{ fontStyle: "italic" }}>Smart</span>
                {" "}
                <span style={{ fontStyle: "normal" }}>Cities</span>
              </motion.span>
            </h1>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.3, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 h-px w-14 bg-gradient-to-r from-accent-primary/60 to-transparent"
              style={{ transformOrigin: "left" }}
            />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-px bg-gradient-to-b from-white/20 to-transparent"
        />
      </motion.div>
    </section>
  );
}
