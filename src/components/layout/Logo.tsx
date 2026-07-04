"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted]   = useState(false);
  const [heroH,   setHeroH]     = useState(800);
  const { scrollY } = useScroll();

  useEffect(() => {
    setMounted(true);
    const update = () => setHeroH(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isDark = !mounted || resolvedTheme !== "light";
  const isLight = mounted && resolvedTheme === "light";

  // ── Animation range ─────────────────────────────────────────────────────
  // Starts fading the wordmark at 35% of hero height, fully hidden at 75%
  const s = heroH * 0.35;
  const e = heroH * 0.75;

  // Icon: starts at 40×60, stays at 40×60 while hero is visible,
  // then grows ever so slightly (44×66) once text is gone — subtle weight shift
  const iconW = useTransform(scrollY, [s, e], [40, 44]);
  const iconH = useTransform(scrollY, [s, e], [60, 66]);

  // Wordmark: visible in hero, hides on scroll
  // Uses opacity + x shift + blur filter — NOT a simple fade
  const textOpacity = useTransform(scrollY, [s, e * 0.7], [1, 0]);
  const textX       = useTransform(scrollY, [s, e],       [0, -8]);
  const textScale   = useTransform(scrollY, [s, e * 0.8], [1, 0.88]);
  const textBlur    = useTransform(scrollY, [s, e * 0.75], [0, 6]);
  // letter-spacing opens slightly as it dissolves (premium feel)
  const textLS      = useTransform(scrollY, [s, e], ["0.18em", "0.36em"]);

  const iconSrc = isDark
    ? "/logo/lynx-icon-light.png"
    : "/logo/lynx-icon-dark.png";

  return (
    <div className="flex items-center gap-2.5 select-none overflow-hidden">
      {/* Lynx icon — always visible, size driven by scroll */}
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: iconW, height: iconH }}
      >
        {mounted && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={iconSrc}
            alt="Lynce"
            className="h-full w-full object-contain"
          />
        )}
      </motion.div>

      {/* LYNCE wordmark — visible by default, dissolves into icon on scroll */}
      <motion.span
        style={{
          opacity:       textOpacity,
          x:             textX,
          scale:         textScale,
          letterSpacing: textLS,
          filter:        useTransform(textBlur, (v) => `blur(${v}px)`),
        }}
        className={[
          "text-[1.18rem] font-semibold whitespace-nowrap",
          // Light mode: rainbow gradient on the wordmark
          isLight
            ? "navbar-wordmark-rainbow"
            : "text-ink",
        ].join(" ")}
      >
        LYNCE
      </motion.span>
    </div>
  );
}
