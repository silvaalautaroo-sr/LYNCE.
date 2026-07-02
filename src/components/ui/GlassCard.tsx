"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  active?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  active,
  onMouseEnter,
  onMouseLeave,
  delay = 0,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "glass group relative rounded-2xl p-5 transition-all duration-500 ease-premium",
        active
          ? "border-accent-primary/50 shadow-[0_0_36px_rgba(24,194,156,0.22)]"
          : "hover:border-ink/20",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
