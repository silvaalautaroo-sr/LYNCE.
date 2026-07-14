"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface FlipCardProps {
  front: string;
  items: string[];
  index?: number;
}

/**
 * Minimal glass card that flips on the Y axis on hover (and on focus, for
 * keyboard users). The back is painted with the theme accent, and its items
 * cascade in one by one once the flip lands — everything driven by CSS
 * transitions on the `group-hover` state, so it reverses cleanly on leave.
 */
export function FlipCard({ front, items, index = 0 }: FlipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      tabIndex={0}
      className="group relative h-48 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative h-full w-full transition-transform duration-[700ms] ease-premium group-hover:[transform:rotateY(180deg)] group-focus-visible:[transform:rotateY(180deg)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* ── Front ── */}
        <div
          className="glass absolute inset-0 flex flex-col justify-between rounded-2xl p-5"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <div className="flex items-start justify-between">
            <span className="font-feature-tabular text-xs font-medium tracking-[0.18em] text-ink-faint">
              {String(index + 1).padStart(2, "0")}
            </span>
            {/* hint: rotates and lights up as you hover, inviting the flip */}
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-soft)] text-ink-faint transition-all duration-500 group-hover:rotate-45 group-hover:border-accent-primary/50 group-hover:text-accent-primary">
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.6} />
            </span>
          </div>
          <div>
            <span className="mb-3 block h-1.5 w-1.5 rounded-full bg-accent-primary/70 transition-all duration-500 group-hover:w-8 group-hover:rounded-full group-hover:bg-accent-primary" />
            <span className="text-lg font-medium leading-tight tracking-tight text-ink">
              {front}
            </span>
          </div>
        </div>

        {/* ── Back — painted with the theme accent ── */}
        <div
          className="absolute inset-0 flex flex-col justify-center gap-2 overflow-hidden rounded-2xl border border-[rgba(var(--accent-primary-rgb),0.45)] p-5 shadow-[0_0_34px_rgba(var(--accent-primary-rgb),0.22)]"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background:
              "linear-gradient(135deg, rgba(var(--accent-primary-rgb),0.28) 0%, rgba(var(--accent-primary-rgb),0.1) 45%, var(--glass-bg-strong) 100%)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          {/* soft moving glow behind the content */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 animate-pulse-glow rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(var(--accent-primary-rgb),0.35) 0%, transparent 70%)",
            }}
          />

          <span className="relative mb-1 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-accent-primary">
            {front}
          </span>

          {items.map((it, i) => (
            <span
              key={it}
              className="relative flex translate-x-3 items-center gap-2 text-sm text-ink opacity-0 transition-all duration-500 ease-premium group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
              style={{ transitionDelay: `${260 + i * 90}ms` }}
            >
              <span className="h-px w-3 shrink-0 bg-accent-primary" />
              {it}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
