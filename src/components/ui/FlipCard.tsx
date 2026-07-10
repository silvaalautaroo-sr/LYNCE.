"use client";

import { motion } from "framer-motion";

interface FlipCardProps {
  front: string;
  items: string[];
  index?: number;
}

/**
 * Minimal glass card that flips on the Y axis to reveal a list on hover
 * (and on focus, for keyboard users). Pure CSS 3D transforms — no library
 * beyond Framer for the scroll-in reveal, so it stays light and matches the
 * site's existing glass language.
 */
export function FlipCard({ front, items, index = 0 }: FlipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      tabIndex={0}
      className="flip-card group relative h-44 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative h-full w-full transition-transform duration-[650ms] ease-premium group-hover:[transform:rotateY(180deg)] group-focus-visible:[transform:rotateY(180deg)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="glass absolute inset-0 flex flex-col items-start justify-end rounded-2xl p-5"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <span className="mb-3 h-1.5 w-1.5 rounded-full bg-accent-primary/70" />
          <span className="text-lg font-medium leading-tight tracking-tight text-ink">
            {front}
          </span>
        </div>

        {/* Back */}
        <div
          className="glass-strong absolute inset-0 flex flex-col justify-center gap-1.5 rounded-2xl p-5"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="mb-1 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-accent-primary">
            {front}
          </span>
          {items.map((it) => (
            <span
              key={it}
              className="flex items-center gap-2 text-sm text-ink-muted"
            >
              <span className="h-px w-3 bg-accent-primary/50" />
              {it}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
