"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

interface ConvergenceNetworkProps {
  /** 12 localized labels, in the same order as ICONS. */
  labels: string[];
}

// Deterministic pseudo-random in [0,1) so SSR and client agree.
const rand = (seed: number, salt: number) => {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * The nodes start scattered and gently floating ("isolated"), then — once the
 * section enters view — are drawn one by one onto an orbit around the Lynce
 * mark, a light line reaching out to each. When every node has arrived they
 * settle into a single connected constellation with energy pulsing along the
 * links. Built with SVG + Framer Motion only (no new dependencies), echoing the
 * particle language already used elsewhere on the site.
 */
export function ConvergenceNetwork({ labels }: ConvergenceNetworkProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: "-120px" });

  const [dims, setDims] = useState({ w: 460, h: 460 });
  const [converged, setConverged] = useState(false);
  const [flow, setFlow] = useState(0); // 0..1 particle position along links

  useEffect(() => setMounted(true), []);

  // Measure the container (square-ish) and keep it responsive.
  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const w = el.clientWidth;
    setDims({ w, h: w });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Float for a beat, then converge.
  useEffect(() => {
    if (!inView) return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const t = setTimeout(() => setConverged(true), reduce ? 0 : 1100);
    return () => clearTimeout(t);
  }, [inView]);

  // Particle flow along the links (lightweight rAF, starts after convergence).
  useEffect(() => {
    if (!converged) return;
    let raf = 0;
    const loop = () => {
      setFlow((f) => (f + 0.006) % 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [converged]);

  const cx = dims.w / 2;
  const cy = dims.h / 2;
  const orbitR = Math.min(dims.w, dims.h) * 0.4;

  // Orbit + scatter geometry per node.
  const nodes = useMemo(() => {
    return ICONS.map((_, i) => {
      const a = (-90 + i * 30) * (Math.PI / 180);
      const ox = cx + orbitR * Math.cos(a);
      const oy = cy + orbitR * Math.sin(a);

      const sR = orbitR * (0.45 + rand(i, 1) * 0.8);
      const sA = a + (rand(i, 2) - 0.5) * 1.25;
      const sx = cx + sR * Math.cos(sA);
      const sy = cy + sR * Math.sin(sA);

      return { ox, oy, sx, sy, dx: sx - ox, dy: sy - oy };
    });
  }, [cx, cy, orbitR]);

  const iconSrc =
    !mounted || resolvedTheme !== "light"
      ? "/logo/lynx-icon-light.png"
      : "/logo/lynx-icon-dark.png";

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto aspect-square w-full max-w-[460px]"
      aria-hidden="true"
    >
      {/* Links + energy particles */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        fill="none"
      >
        <defs>
          <radialGradient id="cn-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Core glow */}
        <circle cx={cx} cy={cy} r={orbitR * 0.42} fill="url(#cn-core)" />

        {/* Orbit ring, revealed on convergence */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={orbitR}
          stroke="var(--border-soft)"
          strokeWidth={1}
          strokeDasharray="3 9"
          initial={{ opacity: 0 }}
          animate={{ opacity: converged ? 1 : 0 }}
          transition={{ duration: 1 }}
        />

        {/* Connecting lines + a travelling particle each */}
        {nodes.map((n, i) => {
          const px = cx + (n.ox - cx) * flow;
          const py = cy + (n.oy - cy) * flow;
          return (
            <g key={`link-${i}`}>
              <motion.line
                x1={cx}
                y1={cy}
                x2={n.ox}
                y2={n.oy}
                stroke="var(--accent-primary)"
                strokeWidth={1}
                strokeOpacity={0.45}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  converged
                    ? { pathLength: 1, opacity: 0.45 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={{
                  duration: 0.7,
                  delay: 0.12 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
              {converged && (
                <circle cx={px} cy={py} r={2.2} fill="var(--accent-secondary)" opacity={0.9} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Center — Lynce mark */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: orbitR * 0.34, height: orbitR * 0.34 }}
      >
        <div className="glass-strong relative flex h-full w-full items-center justify-center rounded-full">
          <span className="absolute inset-0 animate-pulse-glow rounded-full shadow-[var(--shadow-glow)]" />
          {mounted && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={iconSrc}
              alt=""
              className="h-1/2 w-1/2 object-contain"
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* Nodes */}
      {mounted &&
        nodes.map((n, i) => {
          const Icon = ICONS[i];
          return (
            <motion.div
              key={i}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
              style={{ left: n.ox, top: n.oy, width: 92 }}
              initial={{ x: n.dx, y: n.dy, opacity: 0 }}
              animate={
                converged
                  ? { x: 0, y: 0, opacity: 1 }
                  : {
                      x: n.dx,
                      y: [n.dy - 6, n.dy + 6, n.dy - 6],
                      opacity: inView ? 1 : 0,
                    }
              }
              transition={
                converged
                  ? { duration: 0.9, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] }
                  : {
                      x: { duration: 0.6 },
                      opacity: { duration: 0.6, delay: 0.04 * i },
                      y: {
                        duration: 4 + rand(i, 3) * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
              }
            >
              <motion.div
                className="glass flex h-10 w-10 items-center justify-center rounded-xl"
                initial={false}
                animate={{
                  borderColor: converged
                    ? "rgba(var(--accent-primary-rgb),0.5)"
                    : "var(--border-soft)",
                  color: converged
                    ? "var(--accent-primary)"
                    : "var(--ink-faint)",
                  boxShadow: converged
                    ? "0 0 22px rgba(var(--accent-primary-rgb),0.22)"
                    : "0 0 0 rgba(0,0,0,0)",
                }}
                transition={{ duration: 0.5, delay: 0.12 * i + 0.35 }}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </motion.div>
              <motion.span
                className="text-center text-[0.62rem] font-medium leading-tight"
                animate={{ color: converged ? "var(--ink)" : "var(--ink-faint)" }}
                transition={{ duration: 0.5, delay: 0.12 * i + 0.35 }}
              >
                {labels[i]}
              </motion.span>
            </motion.div>
          );
        })}
    </div>
  );
}
