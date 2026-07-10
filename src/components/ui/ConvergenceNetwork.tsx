"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Car, Boxes, BrainCircuit, Leaf, Zap, Shield,
  Map, Radio, Landmark, Bike, HardHat, Sprout,
  type LucideIcon,
} from "lucide-react";

/** Icons are fixed by position; the labels come in localized via props. */
const ICONS: LucideIcon[] = [
  Car, Boxes, BrainCircuit, Leaf, Zap, Shield,
  Map, Radio, Landmark, Bike, HardHat, Sprout,
];

const BLOBS = 12; // metaballs per arm — fused into one liquid by the gooey filter
const GRAB_SPEED = 2.1; // arms grabbed per second (sequential)
const RISE = 1; // prog span over which a single arm extends

interface ConvergenceNetworkProps {
  /** 12 localized labels, in the same order as ICONS. */
  labels: string[];
}

const rand = (seed: number, salt: number) => {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Symbiote layer.
 *
 * The Lynce mark is a living pool of liquid. Viscous arms — chains of metaballs
 * fused by an SVG gooey filter, so they read as one fluid with rounded tips —
 * reach out and grab each smart-city concept ONE BY ONE, each tip landing in
 * the centre of its icon. Once grabbed, energy flows outward as an animated
 * radial gradient (theme-aware, no particles). Leaving the viewport retracts
 * the arms; scrolling back in — up or down — replays the sequential grab.
 */
export function ConvergenceNetwork({ labels }: ConvergenceNetworkProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { amount: 0.25 }); // no `once` → re-fires
  const [dims, setDims] = useState({ w: 460, h: 460 });
  const [grabbed, setGrabbed] = useState<boolean[]>(() => ICONS.map(() => false));

  // Imperative refs — animated by mutating SVG attributes in one rAF loop.
  const blobRefs = useRef<(SVGCircleElement | null)[][]>([]);
  const coreRef = useRef<SVGCircleElement | null>(null);
  const bandRefs = useRef<(SVGStopElement | null)[]>([]); // [low, mid, high]
  const progRef = useRef(0);
  const lastRef = useRef(0);
  const inViewRef = useRef(false);
  const grabbedRef = useRef<boolean[]>(ICONS.map(() => false));

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setDims({ w: el.clientWidth, h: el.clientWidth });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cx = dims.w / 2;
  const cy = dims.h / 2;
  const orbitR = Math.min(dims.w, dims.h) * 0.4;

  const arms = useMemo(() => {
    return ICONS.map((_, i) => {
      const a = (-90 + i * 30) * (Math.PI / 180);
      return {
        ox: cx + orbitR * Math.cos(a),
        oy: cy + orbitR * Math.sin(a),
        dirx: Math.cos(a),
        diry: Math.sin(a),
        phase: rand(i, 1) * Math.PI * 2,
        speed: 0.6 + rand(i, 2) * 0.7,
      };
    });
  }, [cx, cy, orbitR]);

  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    const baseR = orbitR * 0.14;
    const tipR = orbitR * 0.075;
    lastRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      const time = now / 1000;

      // Sequential timeline: prog rises in view, retracts out of view.
      const dir = inViewRef.current ? 1 : -1;
      progRef.current = clamp(
        progRef.current + dir * dt * GRAB_SPEED,
        0,
        ICONS.length + 0.5
      );
      const prog = progRef.current;

      const nextGrabbed: boolean[] = [];
      arms.forEach((arm, i) => {
        const reach = smooth(clamp((prog - i) / RISE, 0, 1));
        const wob = Math.sin(time * arm.speed + arm.phase) * orbitR * 0.05;
        // Control point → gentle organic curl (tip still ends on the icon).
        const qx = (cx + arm.ox) / 2 - arm.diry * wob;
        const qy = (cy + arm.oy) / 2 + arm.dirx * wob;

        const row = blobRefs.current[i];
        if (!row) return;
        for (let j = 0; j < BLOBS; j++) {
          const blob = row[j];
          if (!blob) continue;
          const f = j / (BLOBS - 1);
          const tt = f * reach;
          const mt = 1 - tt;
          const x = mt * mt * cx + 2 * mt * tt * qx + tt * tt * arm.ox;
          const y = mt * mt * cy + 2 * mt * tt * qy + tt * tt * arm.oy;
          const r = (baseR + (tipR - baseR) * f) * (0.35 + 0.65 * reach);
          blob.setAttribute("cx", x.toFixed(1));
          blob.setAttribute("cy", y.toFixed(1));
          blob.setAttribute("r", Math.max(0, r).toFixed(1));
        }
        nextGrabbed[i] = reach > 0.6;
      });

      if (coreRef.current) {
        const cr = orbitR * 0.2 * (1 + 0.05 * Math.sin(time * 2.2));
        coreRef.current.setAttribute("r", cr.toFixed(1));
      }

      // Energy flow: a bright band travels outward through the gradient.
      const band = 0.08 + 0.9 * ((time * 0.22) % 1);
      const [lo, mid, hi] = bandRefs.current;
      if (lo) lo.setAttribute("offset", clamp(band - 0.16).toString());
      if (mid) mid.setAttribute("offset", clamp(band).toString());
      if (hi) hi.setAttribute("offset", clamp(band + 0.16).toString());

      let changed = false;
      for (let i = 0; i < nextGrabbed.length; i++) {
        if (nextGrabbed[i] !== grabbedRef.current[i]) changed = true;
      }
      if (changed) {
        grabbedRef.current = nextGrabbed;
        setGrabbed(nextGrabbed);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mounted, arms, cx, cy, orbitR]);

  const iconSrc =
    !mounted || resolvedTheme !== "light"
      ? "/logo/lynx-icon-light.png"
      : "/logo/lynx-icon-dark.png";

  const goo = Math.max(3, orbitR * 0.032);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto aspect-square w-full max-w-[460px]"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${dims.w} ${dims.h}`}
      >
        <defs>
          {/* Gooey / metaball filter — fuses the blobs into flowing liquid with
              naturally rounded tips (no visible individual balls) */}
          <filter id="cn-goo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={goo} result="b" />
            <feColorMatrix
              in="b"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
            />
          </filter>

          {/* Energy gradient — theme colours, bright band animated outward */}
          <radialGradient
            id="cn-flow"
            gradientUnits="userSpaceOnUse"
            cx={cx}
            cy={cy}
            r={orbitR}
          >
            <stop offset="0" stopColor="var(--accent-primary)" />
            <stop ref={(el) => { bandRefs.current[0] = el; }} offset="0.1" stopColor="var(--accent-primary)" />
            <stop ref={(el) => { bandRefs.current[1] = el; }} offset="0.3" stopColor="var(--accent-secondary)" />
            <stop ref={(el) => { bandRefs.current[2] = el; }} offset="0.5" stopColor="var(--accent-primary)" />
            <stop offset="1" stopColor="var(--accent-tertiary)" />
          </radialGradient>

          <radialGradient id="cn-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient glow under the core */}
        <circle cx={cx} cy={cy} r={orbitR * 0.5} fill="url(#cn-core-glow)" />

        {/* Liquid body: blob arms + core, one gooey fill with flowing energy */}
        <g filter="url(#cn-goo)" fill="url(#cn-flow)">
          {ICONS.map((_, i) => (
            <g key={i}>
              {Array.from({ length: BLOBS }).map((__, j) => (
                <circle
                  key={j}
                  ref={(el) => {
                    if (!blobRefs.current[i]) blobRefs.current[i] = [];
                    blobRefs.current[i][j] = el;
                  }}
                  cx={cx}
                  cy={cy}
                  r={0}
                />
              ))}
            </g>
          ))}
          <circle ref={coreRef} cx={cx} cy={cy} r={orbitR * 0.2} />
        </g>
      </svg>

      {/* Center — Lynce mark */}
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
        style={{ width: orbitR * 0.34, height: orbitR * 0.34 }}
      >
        {mounted && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={iconSrc}
            alt=""
            className="h-3/5 w-3/5 object-contain drop-shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.6)]"
            draggable={false}
          />
        )}
      </div>

      {/* Concept nodes — icon centred exactly on the circle point; label hangs
          below out of flow so the arm tip lands in the icon's centre */}
      {mounted &&
        arms.map((arm, i) => {
          const Icon = ICONS[i];
          const left = (arm.ox / dims.w) * 100;
          const top = (arm.oy / dims.h) * 100;
          const on = grabbed[i];
          return (
            <motion.div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%` }}
              animate={{ scale: on ? [1, 1.06, 1] : 1 }}
              transition={{ duration: 2.4, repeat: on ? Infinity : 0, ease: "easeInOut" }}
            >
              <div className="relative flex h-10 w-10 items-center justify-center">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-500"
                  style={{
                    borderColor: on
                      ? "rgba(var(--accent-primary-rgb),0.6)"
                      : "var(--border-soft)",
                    background: "var(--glass-bg)",
                    color: on ? "var(--accent-primary)" : "var(--ink-faint)",
                    boxShadow: on
                      ? "0 0 24px rgba(var(--accent-primary-rgb),0.3)"
                      : "none",
                  }}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </div>
                <span
                  className="absolute left-1/2 top-full mt-1.5 w-24 -translate-x-1/2 text-center text-[0.62rem] font-medium leading-tight transition-colors duration-500"
                  style={{ color: on ? "var(--ink)" : "var(--ink-faint)" }}
                >
                  {labels[i]}
                </span>
              </div>
            </motion.div>
          );
        })}
    </div>
  );
}
