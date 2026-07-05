"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme !== "light";
  const isLight = mounted && resolvedTheme === "light";

  // ── "Absorbed behind the icon" animation ────────────────────────────────
  // Driven entirely by transform + clip-path (never opacity/blur alone),
  // over a short, snappy 0–130px scroll window so it reads as an instant,
  // electric reaction the moment the user starts scrolling (~450ms of
  // scroll-equivalent motion at typical wheel/trackpad speed).
  const START = 0;
  const END = 130;

  // Wordmark is "sucked" leftward into the icon: it slides left, compresses
  // horizontally, and is clipped away from the right edge inward — a wipe,
  // not a fade.
  const textX = useTransform(scrollY, [START, END], [0, -22]);
  const textScaleX = useTransform(scrollY, [START, END], [1, 0.4]);
  const clipInset = useTransform(scrollY, [START, END], [0, 100]);
  const clipPath = useTransform(clipInset, (v) => `inset(0 ${v}% 0 0)`);

  // Icon "sparks" at the exact moment of absorption — a brief glow pulse
  // (drop-shadow / filter, not opacity on the artwork itself) then settles
  // into a very slightly larger, permanent state once scrolled.
  const iconGlow = useTransform(scrollY, [START, END * 0.55, END], [0, 1, 0.35]);
  const iconGlowFilter = useTransform(
    iconGlow,
    (v) => `drop-shadow(0 0 ${4 + v * 10}px rgba(24,194,156,${0.25 + v * 0.45}))`
  );
  const iconScale = useTransform(scrollY, [START, END], [1, 1.08]);

  const iconSrc = isDark
    ? "/logo/lynx-icon-light.png"
    : "/logo/lynx-icon-dark.png";

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Lynx icon — the wordmark visually collapses into this */}
      <motion.div
        className="relative h-[40px] w-[40px] flex-shrink-0"
        style={{ scale: iconScale, filter: iconGlowFilter }}
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

      {/* LYNCE wordmark — absorbed behind the icon via clip-path + transform */}
      <motion.span
        style={{
          x: textX,
          scaleX: textScaleX,
          clipPath,
          transformOrigin: "left center",
        }}
        className={[
          "text-[1.18rem] font-semibold whitespace-nowrap",
          isLight ? "navbar-wordmark-rainbow" : "text-ink",
        ].join(" ")}
      >
        LYNCE
      </motion.span>
    </div>
  );
}
