"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [heroH, setHeroH] = useState(800);
  const { scrollY } = useScroll();

  useEffect(() => {
    setMounted(true);
    const update = () => setHeroH(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isDark = !mounted || resolvedTheme !== "light";

  // ── Scroll range: animation starts at 32% of hero, finishes at 72% ─────────
  const s = heroH * 0.32;
  const e = heroH * 0.72;

  // ── Icon: stays at initial size, grows very slightly once wordmark is hidden ─
  const iconW = useTransform(scrollY, [s, e], [40, 44]);
  const iconH = useTransform(scrollY, [s, e], [56, 62]);

  // ── Wordmark clip — grows FROM THE RIGHT (E→L), text appears absorbed by icon
  // "inset(top right bottom left)" — right inset grows → text erased right-to-left
  const clipProgress = useTransform(scrollY, [s, e * 0.92], [0, 100]);
  const wordmarkClip = useTransform(clipProgress, (v: number) =>
    `inset(0 ${v.toFixed(2)}% 0 0 round 0px)`
  );

  // ── Wordmark translates left (toward icon) as it disappears ─────────────────
  const wordmarkX = useTransform(scrollY, [s, e], [0, -10]);

  // ── Wordmark vertical scale: subtle vertical compression at the end ───────────
  const wordmarkScaleY = useTransform(scrollY, [s * 1.3, e], [1, 0.82]);

  const iconSrc     = isDark ? "/logo/lynx-icon-light.png"      : "/logo/lynx-icon-dark.png";
  const wordmarkSrc = isDark ? "/logo/lynce-wordmark-light.png" : "/logo/lynce-wordmark-dark.png";

  // Wordmark natural height to match icon
  const wmDisplayH = 36;
  // 691×208 → keep ratio
  const wmDisplayW = Math.round(wmDisplayH * (691 / 208));

  return (
    <div className="flex items-center gap-3 select-none">
      {/* ── Lynx icon — always visible ──────────────────────────────────────── */}
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: iconW, height: iconH }}
      >
        {mounted && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={iconSrc}
            alt="Lynce icon"
            className="h-full w-full object-contain"
          />
        )}
      </motion.div>

      {/* ── Official LYNCE wordmark — clips away on scroll ──────────────────── */}
      {mounted && (
        <motion.div
          style={{
            x: wordmarkX,
            scaleY: wordmarkScaleY,
            clipPath: wordmarkClip,
            transformOrigin: "left center",
            // Ensure crisp rendering
            willChange: "clip-path, transform",
          }}
          className="flex-shrink-0 overflow-visible"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wordmarkSrc}
            alt="LYNCE"
            width={wmDisplayW}
            height={wmDisplayH}
            className="object-contain"
            style={{
              height: wmDisplayH,
              width: wmDisplayW,
              display: "block",
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
