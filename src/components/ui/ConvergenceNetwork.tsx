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

const K = 8; // metaball blobs per arm — more blobs = smoother liquid

interface ConvergenceNetworkProps {
  /** 12 localized labels, in the same order as ICONS. */
  labels: string[];
}

// Deterministic pseudo-random so SSR and client agree.
const rand = (seed: number, salt: number) => {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Symbiote layer.
 *
 * The Lynce mark sits at the centre as a living pool of liquid. Instead of
 * rigid lines, viscous "arms" (metaballs fused by an SVG gooey filter) reach
 * out, wobble like water and grab each smart-city concept. When the section
 * leaves the viewport the arms retract into the core; every time it scrolls
 * back into view — up or down — they reach out and grab again. The wobble
 * never stops, so the organism always feels alive.
 */
export function ConvergenceNetwork({ labels }: ConvergenceNetworkProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { amount: 0.25 }); // no `once` → re-fires
  const [dims, setDims] = useState({ w: 460, h: 460 });
  const [grabbed, setGrabbed] = useState(false);

  // Imperative refs — the arms are animated by mutating SVG attributes inside a
  // single rAF loop, never through React state, so 90+ blobs stay smooth.
  const blobRefs = useRef<(SVGCircleElement | null)[][]>([]);
  const coreRef = useRef<SVGCircleElement | null>(null);
  const reachRef = useRef(0);
  const inViewRef = useRef(false);
  const grabbedRef = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);

  // Responsive square.
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

  // Per-arm geometry (orbit target + wobble character).
  const arms = useMemo(() => {
    return ICONS.map((_, i) => {
      const a = (-90 + i * 30) * (Math.PI / 180);
      return {
        ox: cx + orbitR * Math.cos(a),
        oy: cy + orbitR * Math.sin(a),
        nx: Math.cos(a),
        ny: Math.sin(a),
        phase: rand(i, 1) * Math.PI * 2,
        speed: 0.7 + rand(i, 2) * 0.9,
        swing: (rand(i, 3) - 0.5) * 2, // curl direction/strength
        delay: i * 0.05,
      };
    });
  }, [cx, cy, orbitR]);

  // The liquid animation loop.
  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    const baseR = orbitR * 0.14;
    const tipR = orbitR * 0.055;

    const loop = (t: number) => {
      const time = t / 1000;
      // Ease reach toward 1 when in view, toward a small idle when not.
      const target = inViewRef.current ? 1 : 0.14;
      reachRef.current += (target - reachRef.current) * 0.055;
      const reach = reachRef.current;

      arms.forEach((arm, i) => {
        // Perpendicular so the arm curls sideways like a tentacle.
        const px = -arm.ny;
        const py = arm.nx;
        const wob =
          Math.sin(time * arm.speed + arm.phase) * orbitR * 0.22 * arm.swing;
        const breathe = 0.85 + 0.15 * Math.sin(time * 1.6 + arm.phase);

        // Quadratic control point (curved, wobbling) between core and node.
        const qx = (cx + arm.ox) / 2 + px * wob;
        const qy = (cy + arm.oy) / 2 + py * wob;

        const row = blobRefs.current[i];
        if (!row) return;
        for (let j = 0; j < K; j++) {
          const blob = row[j];
          if (!blob) continue;
          const tt = (j / (K - 1)) * reach;
          const mt = 1 - tt;
          const x = mt * mt * cx + 2 * mt * tt * qx + tt * tt * arm.ox;
          const y = mt * mt * cy + 2 * mt * tt * qy + tt * tt * arm.oy;
          const r =
            (baseR + (tipR - baseR) * (j / (K - 1))) *
            (0.45 + 0.55 * reach) *
            breathe;
          blob.setAttribute("cx", x.toFixed(1));
          blob.setAttribute("cy", y.toFixed(1));
          blob.setAttribute("r", Math.max(0, r).toFixed(1));
        }
      });

      // Core pulse.
      if (coreRef.current) {
        const cr = orbitR * 0.19 * (1 + 0.05 * Math.sin(time * 2.2));
        coreRef.current.setAttribute("r", cr.toFixed(1));
      }

      // Toggle node highlight only when it actually changes (cheap).
      const nowGrabbed = reach > 0.55;
      if (nowGrabbed !== grabbedRef.current) {
        grabbedRef.current = nowGrabbed;
        setGrabbed(nowGrabbed);
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

  const blurAmount = Math.max(5, dims.w / 46);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto aspect-square w-full max-w-[460px]"
      aria-hidden="true"
    >
      {/* Liquid organism */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${dims.w} ${dims.h}`}
      >
        <defs>
          {/* Gooey / metaball filter — fuses the blobs into flowing liquid */}
          <filter id="cn-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blurAmount} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
          <radialGradient id="cn-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft ambient glow under the core */}
        <circle cx={cx} cy={cy} r={orbitR * 0.5} fill="url(#cn-core-glow)" />

        {/* The gooey body: arms + core share one fill so they read as one fluid */}
        <g filter="url(#cn-goo)" fill="var(--accent-primary)" opacity={0.92}>
          {ICONS.map((_, i) => (
            <g key={i}>
              {Array.from({ length: K }).map((__, j) => (
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
          <circle ref={coreRef} cx={cx} cy={cy} r={orbitR * 0.19} />
        </g>
      </svg>

      {/* Center — Lynce mark, above the liquid */}
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

      {/* Concept nodes — gently breathing, lit up while grabbed */}
      {mounted &&
        arms.map((arm, i) => {
          const Icon = ICONS[i];
          const left = (arm.ox / dims.w) * 100;
          const top = (arm.oy / dims.h) * 100;
          return (
            <motion.div
              key={i}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
              style={{ left: `${left}%`, top: `${top}%`, width: 92 }}
              animate={{ scale: [1, 1.05, 1], y: [0, -3, 0] }}
              transition={{
                duration: 3 + rand(i, 4) * 2,
                delay: arm.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-500"
                style={{
                  borderColor: grabbed
                    ? "rgba(var(--accent-primary-rgb),0.55)"
                    : "var(--border-soft)",
                  background: "var(--glass-bg)",
                  color: grabbed ? "var(--accent-primary)" : "var(--ink-faint)",
                  boxShadow: grabbed
                    ? "0 0 22px rgba(var(--accent-primary-rgb),0.28)"
                    : "none",
                }}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </div>
              <span
                className="text-center text-[0.62rem] font-medium leading-tight transition-colors duration-500"
                style={{ color: grabbed ? "var(--ink)" : "var(--ink-faint)" }}
              >
                {labels[i]}
              </span>
            </motion.div>
          );
        })}
    </div>
  );
}
