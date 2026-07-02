"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  strength?: number;
  as?: "button" | "div";
  ariaLabel?: string;
}

export function MagneticButton({
  children,
  onClick,
  className,
  strength = 0.35,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setOffset({ x: x * strength, y: y * strength });
  };

  const handleMouseLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 150, damping: 12, mass: 0.3 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "animated-border glass relative inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-2.5 text-sm font-medium text-ink shadow-[0_0_0_rgba(24,194,156,0)] transition-shadow duration-500 hover:shadow-[var(--shadow-glow)]",
        className
      )}
    >
      <span className="relative z-[2]">{children}</span>
      <span className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-accent-primary/0 via-accent-secondary/10 to-accent-primary/0 opacity-0 transition-opacity duration-500 hover:opacity-100" />
    </motion.button>
  );
}
