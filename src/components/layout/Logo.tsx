"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const iconSrc = isDark ? "/logo/lynx-icon-light.png" : "/logo/lynx-icon-dark.png";

  const { scrollY } = useScroll();
  const [heroHeight, setHeroHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const hero = document.getElementById("hero");
      setHeroHeight(hero ? hero.offsetHeight : window.innerHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The morph is driven purely by scroll position, not a discrete
  // on/off flag: it starts once the hero has begun leaving the
  // viewport (~35% of its height scrolled) and completes shortly
  // after (~75%), so the icon-only state stays intact while the
  // hero is still the focal point of the screen.
  const morphStart = heroHeight > 0 ? heroHeight * 0.35 : 200;
  const morphEnd = heroHeight > 0 ? heroHeight * 0.75 : 420;

  // Icon shrinks + slides slightly left as it morphs (transform, not opacity).
  const iconWidth = useTransform(scrollY, [morphStart, morphEnd], [36, 26]);
  const iconHeight = useTransform(scrollY, [morphStart, morphEnd], [52, 38]);
  const iconX = useTransform(scrollY, [morphStart, morphEnd], [0, -2]);

  // Wordmark reveals via a clipping width transform (a wipe), never opacity.
  const textWidth = useTransform(scrollY, [morphStart, morphEnd], [0, 104]);

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Lynx icon */}
      <motion.div
        style={{ width: iconWidth, height: iconHeight, x: iconX }}
        className="relative flex-shrink-0 overflow-hidden"
      >
        <Image
          src={iconSrc}
          alt="Lynce lynx icon"
          fill
          sizes="52px"
          className="object-contain object-center"
          priority
        />
      </motion.div>

      {/* LYNCE wordmark — clipped by an animated width, revealed by a
          transform wipe rather than a fade */}
      <motion.div style={{ width: textWidth }} className="overflow-hidden">
        <span className="inline-block whitespace-nowrap text-[1.25rem] font-semibold tracking-[0.16em] text-ink">
          LYNCE
        </span>
      </motion.div>
    </div>
  );
}
