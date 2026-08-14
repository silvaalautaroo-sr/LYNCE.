"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { INDUSTRIES } from "@/lib/industries";
import HeatField, { type IconColorMap } from "@/components/ui/HeatField";
import { HeatmapIcons } from "@/components/ui/HeatmapIcons";

// Timing constants from AnimationController
const ICONS_START_DELAY_MS = 150;
const ICON_GAP_MS = 165;
const ICON_COUNT = INDUSTRIES.length;
const ICONS_TOTAL_MS = ICONS_START_DELAY_MS + (ICON_COUNT - 1) * ICON_GAP_MS + 200;
const HEAT_START_DELAY_MS = ICONS_TOTAL_MS + 300;
const HEAT_SETTLE_MS = 3000;

function shuffledIds(): string[] {
  const ids = INDUSTRIES.map((i) => i.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

// CenterLogo SVG paths
const OUTER_PATH = "M 66 190 L 63.3 185.6 L 57.1 170.3 L 52.9 157 L 50 143.3 L 48.8 132.1 L 48.8 121.4 L 50.4 108.5 L 52.1 101.9 L 56.7 89.8 L 66.2 73.7 L 77.8 59.6 L 108.5 28 L 114.3 19.7 L 118.2 10 L 114.7 58.3 L 114.9 63.1 L 124.5 56 L 134.2 46.7 L 141.7 36.8 L 144.6 30.9 L 142.1 48.4 L 137.5 64.1 L 133 74.5 L 125.1 86.1 L 142.9 106.4 L 142.9 131.3 L 151.2 148.3 L 129 170.5 L 126.1 168.4 L 120.7 166.4 L 114.1 165.5 L 109.1 165.9 L 104.6 167.2 L 99.6 169.7 L 93.4 176.3 L 92.7 174.4 L 93.2 166.6 L 95.6 160.8 L 98.1 157.4 L 90 158.9 L 82.2 163.9 L 75.7 170.7 L 69.9 179.8 L 66 190 Z";
const EYE_PATH = "M 136.9 129 L 128.6 128.6 L 124.5 127.4 L 120.3 124.9 L 116 119.7 L 113.5 113.5 L 110.6 108.9 L 122.4 111.2 L 127.4 112.9 L 131.9 115.8 L 134.6 118.9 L 135.9 121.4 L 137.1 126.8 L 136.9 129 Z";

export interface LynceHeatmapProps {
  labels: string[];
}

export function LynceHeatmap({ labels }: LynceHeatmapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { amount: 0.25 });
  
  // Animation states (from AnimationController)
  const [logoVisible, setLogoVisible] = useState(false);
  const [iconsActive, setIconsActive] = useState(false);
  const [heatStartedAt, setHeatStartedAt] = useState<number | null>(null);
  const [revealOrder, setRevealOrder] = useState<string[]>(() => INDUSTRIES.map((i) => i.id));
  const [iconColors, setIconColors] = useState<IconColorMap>({});
  const [heatSettled, setHeatSettled] = useState(false);
  
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasPlayed = useRef(false);
  
  // Trigger animation when in view
  useEffect(() => {
    if (inView && !hasPlayed.current) {
      hasPlayed.current = true;
      setRevealOrder(shuffledIds());
      
      const schedule = (fn: () => void, ms: number) => {
        timers.current.push(setTimeout(fn, ms));
      };
      
      schedule(() => setLogoVisible(true), 0);
      schedule(() => setIconsActive(true), ICONS_START_DELAY_MS);
      schedule(() => setHeatStartedAt(performance.now()), HEAT_START_DELAY_MS);
    }
    
    if (!inView && hasPlayed.current) {
      // Reset on leave so it replays
      timers.current.forEach(clearTimeout);
      timers.current = [];
      hasPlayed.current = false;
      setLogoVisible(false);
      setIconsActive(false);
      setHeatStartedAt(null);
      setHeatSettled(false);
      setIconColors({});
    }
    
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [inView]);
  
  // Heat settle timer
  useEffect(() => {
    if (heatStartedAt === null) { setHeatSettled(false); return; }
    const id = setTimeout(() => setHeatSettled(true), HEAT_SETTLE_MS);
    return () => clearTimeout(id);
  }, [heatStartedAt]);
  
  const handleIconColors = useCallback((colors: IconColorMap) => {
    setIconColors(colors);
  }, []);
  
  return (
    <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-[-15%] rounded-full transition-opacity duration-[1500ms]"
        style={{
          opacity: heatStartedAt !== null ? 1 : 0,
          background: "radial-gradient(circle, rgba(245,150,78,0.10) 0%, rgba(110,25,190,0.07) 45%, transparent 72%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />
      
      <HeatField startedAt={heatStartedAt} ringRadius={0.8} onIconColors={handleIconColors} />
      
      <HeatmapIcons
        active={iconsActive}
        revealOrder={revealOrder}
        iconColors={iconColors}
        heatSettled={heatSettled}
        labels={labels}
      />
      
      {/* Center Logo */}
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={logoVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="flex items-center justify-center"
            animate={
              heatStartedAt !== null
                ? {
                    filter: [
                      "drop-shadow(0 0 16px rgba(255,150,80,0.5))",
                      "drop-shadow(0 0 28px rgba(255,150,80,0.85))",
                      "drop-shadow(0 0 16px rgba(255,150,80,0.5))",
                    ],
                  }
                : { filter: "drop-shadow(0 0 10px rgba(255,255,255,0.25))" }
            }
            transition={
              heatStartedAt !== null
                ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.8 }
            }
          >
            <svg 
              className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-[var(--ink)]" 
              viewBox="0 0 200 200" 
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={`${OUTER_PATH} ${EYE_PATH}`} fill="currentColor" fillRule="evenodd" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
