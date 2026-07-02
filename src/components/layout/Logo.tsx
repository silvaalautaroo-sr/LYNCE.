"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

const SCROLL_THRESHOLD = 120;

export function Logo() {
  const [scrolled, setScrolled] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const iconSrc = isDark ? "/logo/lynx-icon-light.png" : "/logo/lynx-icon-dark.png";

  return (
    <motion.div
      className="flex items-center gap-2 select-none"
      layout
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
    >
      {/* Lynx icon — shrinks when scrolled */}
      <motion.div
        animate={{ width: scrolled ? 26 : 36, height: scrolled ? 38 : 52 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="relative flex-shrink-0 overflow-hidden"
      >
        <Image
          src={iconSrc}
          alt="Lynce lynx icon"
          fill
          sizes="52px"
          className="object-contain object-center transition-opacity duration-500"
          priority
        />
      </motion.div>

      {/* LYNCE wordmark — appears on scroll */}
      <AnimatePresence>
        {scrolled && (
          <motion.span
            key="wordmark"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-[1.25rem] font-semibold tracking-[0.16em] text-ink"
          >
            LYNCE
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
