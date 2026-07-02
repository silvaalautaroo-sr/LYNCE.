"use client";

import { useTranslations } from "next-intl";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  Cpu, Radio, Link2, Satellite, Zap, Building2,
  Users, Factory, Landmark, MapPin,
} from "lucide-react";

interface NodeDef {
  key: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  angle: number;
  radius: number;
}

const NODES: NodeDef[] = [
  { key: "ai",           icon: Cpu,       angle: -90,  radius: 1 },
  { key: "iot",          icon: Radio,     angle: -54,  radius: 1 },
  { key: "blockchain",   icon: Link2,     angle: -18,  radius: 1 },
  { key: "satellites",   icon: Satellite, angle:  18,  radius: 1 },
  { key: "utilities",    icon: Zap,       angle:  54,  radius: 1 },
  { key: "infrastructure", icon: Building2, angle: 90, radius: 1 },
  { key: "publicServices", icon: Users,   angle: 126,  radius: 1 },
  { key: "industries",   icon: Factory,   angle: 162,  radius: 1 },
  { key: "governments",  icon: Landmark,  angle: 198,  radius: 1 },
  { key: "municipalities", icon: MapPin,  angle: 234,  radius: 1 },
];

interface Particle {
  id: number;
  nodeIndex: number;
  t: number;
  speed: number;
  reverse: boolean;
}

export function Section2Ecosystem() {
  const t = useTranslations("ecosystem");
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dims, setDims] = useState({ cx: 350, cy: 300, r: 220 });
  const frameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  // Seed particles once
  useEffect(() => {
    const initial: Particle[] = [];
    NODES.forEach((_, i) => {
      for (let j = 0; j < 2; j++) {
        initial.push({
          id: i * 10 + j,
          nodeIndex: i,
          t: Math.random(),
          speed: 0.003 + Math.random() * 0.003,
          reverse: j % 2 === 0,
        });
      }
    });
    particlesRef.current = initial;
    setParticles([...initial]);

    const animate = () => {
      particlesRef.current = particlesRef.current.map((p) => {
        let next = p.reverse ? p.t - p.speed : p.t + p.speed;
        if (next > 1) next = 0;
        if (next < 0) next = 1;
        return { ...p, t: next };
      });
      setParticles([...particlesRef.current]);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const updateDims = useCallback(() => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const r = Math.min(cx, cy) * 0.76;
    setDims({ cx, cy, r });
  }, []);

  useEffect(() => {
    updateDims();
    const ro = new ResizeObserver(updateDims);
    if (svgRef.current) ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, [updateDims]);

  const nodePos = (node: NodeDef) => {
    const rad = (node.angle * Math.PI) / 180;
    return {
      x: dims.cx + dims.r * node.radius * Math.cos(rad),
      y: dims.cy + dims.r * node.radius * Math.sin(rad),
    };
  };

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  return (
    <section
      id="platform"
      className="relative overflow-hidden py-32 lg:py-40"
    >
      <div className="container mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
          align="center"
          className="mb-16"
        />

        <div className="relative mx-auto max-w-3xl">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${dims.cx * 2} ${dims.cy * 2}`}
            className="w-full"
            style={{ height: "min(600px, 90vw)" }}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#18c29c" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#18c29c" stopOpacity="0" />
              </radialGradient>
              <filter id="blur-soft">
                <feGaussianBlur stdDeviation="2.5" />
              </filter>
            </defs>

            {/* Center glow */}
            <ellipse
              cx={dims.cx}
              cy={dims.cy}
              rx={dims.r * 0.28}
              ry={dims.r * 0.28}
              fill="url(#glow-center)"
            />

            {/* Orbit ring */}
            <circle
              cx={dims.cx}
              cy={dims.cy}
              r={dims.r}
              fill="none"
              stroke="var(--border-soft)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />

            {/* Connection lines */}
            {NODES.map((node, i) => {
              const pos = nodePos(node);
              const active = hoveredNode === null || hoveredNode === i;
              return (
                <line
                  key={`line-${i}`}
                  x1={dims.cx}
                  y1={dims.cy}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={active ? "var(--accent-primary)" : "var(--border-soft)"}
                  strokeWidth={active ? 1.5 : 0.8}
                  strokeOpacity={active ? 0.5 : 0.2}
                  style={{ transition: "all 0.4s ease" }}
                />
              );
            })}

            {/* Glowing particles */}
            {particles.map((p) => {
              const pos = nodePos(NODES[p.nodeIndex]);
              const x = lerp(dims.cx, pos.x, p.t);
              const y = lerp(dims.cy, pos.y, p.t);
              const active =
                hoveredNode === null || hoveredNode === p.nodeIndex;
              return (
                <circle
                  key={p.id}
                  cx={x}
                  cy={y}
                  r={active ? 3 : 1.5}
                  fill={active ? "#53e4e1" : "#18c29c"}
                  opacity={active ? 0.85 : 0.3}
                  style={{ transition: "opacity 0.3s" }}
                  filter="url(#blur-soft)"
                />
              );
            })}

            {/* Center node */}
            <g>
              <circle
                cx={dims.cx}
                cy={dims.cy}
                r={dims.r * 0.11}
                fill="var(--bg-secondary)"
                stroke="var(--accent-primary)"
                strokeWidth="1.5"
              />
              <text
                x={dims.cx}
                y={dims.cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--accent-primary)"
                fontSize={dims.r * 0.08}
                fontWeight="600"
                letterSpacing="0.12em"
                fontFamily="var(--font-space-grotesk), sans-serif"
              >
                {t("center")}
              </text>
            </g>
          </svg>

          {/* Outer node cards — positioned absolutely around the SVG */}
          {NODES.map((node, i) => {
            const rad = (node.angle * Math.PI) / 180;
            const pct = 50 + 50 * node.radius * Math.cos(rad);
            const pctY = 50 + 50 * node.radius * Math.sin(rad);
            const Icon = node.icon;
            const active = hoveredNode === null || hoveredNode === i;

            return (
              <motion.button
                key={node.key}
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.55,
                  delay: 0.05 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onMouseEnter={() => setHoveredNode(i)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  top: `${pctY}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className="group flex w-24 flex-col items-center gap-1.5 sm:w-28"
              >
                <div
                  className={`glass flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-400 ${
                    active
                      ? "border-accent-primary/40 text-accent-primary shadow-[0_0_20px_rgba(24,194,156,0.18)]"
                      : "text-ink-faint"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <span
                  className={`text-center text-[0.65rem] font-medium leading-tight transition-colors duration-300 ${
                    active ? "text-ink" : "text-ink-faint"
                  }`}
                >
                  {t(`nodes.${node.key}`)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
