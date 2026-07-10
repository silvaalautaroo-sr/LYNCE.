"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CountUpProps {
  value: number;
  /** Text rendered before the number, e.g. "Up to". */
  prefix?: string;
  /** Text rendered right after the number, e.g. "%". */
  suffix?: string;
  /** Animation length in ms. */
  duration?: number;
  className?: string;
}

/**
 * Counts from 0 → `value` the first time it scrolls into view.
 * Respects `prefers-reduced-motion` (jumps straight to the final value).
 * Uses tabular figures so the width doesn't jitter while counting.
 */
export function CountUp({
  value,
  prefix,
  suffix,
  duration = 1800,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let raf = 0;
    const start = performance.now();
    // easeOutExpo — fast then settling, feels premium
    const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(ease(t) * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix && <span className="mr-1 align-top text-[0.4em] font-medium tracking-tight text-ink-faint">{prefix}</span>}
      <span className="font-feature-tabular">{display}</span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
