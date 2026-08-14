"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { INDUSTRIES, angleToUnitVector } from "@/lib/industries";
import type { IconColorMap } from "@/components/ui/HeatField";

export interface HeatmapIconsProps {
  /** Stage 2 has started: icons begin appearing one by one. */
  active: boolean;
  /** Shuffled industry ids — the order in which icons reveal. */
  revealOrder: string[];
  /** Radius of the icon ring, as a percentage of the square container. */
  radiusPercent?: number;
  /** Live heat color under each icon (rgba 0-255 + 0-1 alpha), from HeatField. */
  iconColors: IconColorMap;
  /**
   * True once the heat map has finished expanding. Only then do the priority
   * industry names cross-fade from plain white into their diffused gradient.
   */
  heatSettled: boolean;
  /**
   * Translated labels for each industry, corresponding to the order in INDUSTRIES array.
   */
  labels: string[];
}

const GAP_SECONDS = 0.165; // 120-180ms cadence between successive reveals
const START_DELAY = 0.15; // small pause after the logo settles

/**
 * Real glassmorphism, not a glowing ring:
 *  - a frosted pane that blurs and saturates whatever heat is behind it
 *  - a diagonal sheen so the pane reads as a physical piece of glass
 *  - a 1px specular highlight on the top edge and a dark drop shadow for depth
 *  - NO coloured border and NO outer glow
 */
const GLASS_SHEEN =
  "linear-gradient(150deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.035) 45%, rgba(255,255,255,0.012) 100%)";

const GLASS_SHADOW = [
  "inset 0 1px 1px rgba(255,255,255,0.22)", // top specular edge
  "inset 0 -1px 1px rgba(255,255,255,0.05)", // bottom bounce light
  "0 6px 22px rgba(0,0,0,0.45)", // depth — dark, never glowing
].join(", ");

/**
 * Priority sectors (AI, Sustainability, Digital Twins) get a diffused label:
 * a soft gradient fill drawn from the heat palette plus a gentle bloom, so the
 * name reads as lit from within rather than plain white.
 */
const PRIORITY_LABEL_STYLE: CSSProperties = {
  backgroundImage:
    "linear-gradient(100deg, #f5a35e 0%, #e0648f 48%, #8b5cf6 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  filter: "drop-shadow(0 0 7px rgba(245,150,120,0.35))",
};

export function HeatmapIcons({
  active,
  revealOrder,
  radiusPercent = 40,
  iconColors,
  heatSettled,
  labels,
}: HeatmapIconsProps) {
  return (
    <div className="absolute inset-0 z-20">
      {INDUSTRIES.map((industry, index) => {
        const { x, y } = angleToUnitVector(industry.angleDeg);
        const left = 50 + x * radiusPercent;
        const top = 50 + y * radiusPercent;

        const orderIndex = revealOrder.indexOf(industry.id);
        const delay = START_DELAY + orderIndex * GAP_SECONDS;
        const duration = 0.13 + ((orderIndex * 37) % 5) / 100; // 130-170ms jitter

        // Colour of the heat map currently under this icon.
        const c = iconColors[industry.id];
        const hasHeat = c !== undefined && c[3] > 0.02;
        const tintStrength = hasHeat ? Math.min(0.9, c[3]) : 0;
        const tint = hasHeat
          ? `rgba(${c[0].toFixed(0)}, ${c[1].toFixed(0)}, ${c[2].toFixed(0)}, ${(
              tintStrength * 0.3
            ).toFixed(3)})`
          : "rgba(0,0,0,0)";

        const Icon = industry.Icon;

        return (
          <motion.div
            key={industry.id}
            className="absolute flex items-center justify-center"
            style={{ left: `${left}%`, top: `${top}%` }}
            initial={{ opacity: 0, scale: 0.4, x: -x * 22, y: -y * 22 }}
            animate={
              active
                ? { opacity: 1, scale: 1, x: 0, y: 0 }
                : { opacity: 0, scale: 0.4, x: -x * 22, y: -y * 22 }
            }
            transition={{ duration, delay, ease: "easeOut" }}
          >
            {/*
              The wrapper is exactly the size of the circle, so the -50%
              offsets keep the circle itself perfectly on the ring. The label
              hangs below it absolutely and therefore doesn't shift the ring.
            */}
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              <div
                className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full sm:h-14 sm:w-14"
                style={{
                  background: GLASS_SHEEN,
                  boxShadow: GLASS_SHADOW,
                  backdropFilter: "blur(14px) saturate(1.6)",
                  WebkitBackdropFilter: "blur(14px) saturate(1.6)",
                }}
              >
                {/* Heat tint: the glass adopts the colour of the map beneath. */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background: tint,
                    transition: "background 220ms linear",
                  }}
                  aria-hidden="true"
                />
                <Icon
                  className="relative h-5 w-5 text-white/95 sm:h-6 sm:w-6"
                  aria-hidden="true"
                />
              </div>

              {/*
                Industry name, Inter, centred under the glass circle.
                Priority names start plain white like every other label and
                only cross-fade into the diffused gradient once the map has
                fully expanded. Two stacked copies are used because a gradient
                fill cannot be interpolated from a flat colour.
              */}
              <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium tracking-wide sm:text-[11px]">
                <span className="relative inline-block">
                  <span
                    className="text-white/55 transition-opacity duration-700 ease-out"
                    style={{
                      opacity: industry.priority && heatSettled ? 0 : 1,
                    }}
                  >
                    {labels[index]}
                  </span>

                  {industry.priority && (
                    <span
                      className="absolute inset-0 transition-opacity duration-700 ease-out"
                      style={{
                        ...PRIORITY_LABEL_STYLE,
                        opacity: heatSettled ? 1 : 0,
                      }}
                      aria-hidden="true"
                    >
                      {labels[index]}
                    </span>
                  )}
                </span>
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
