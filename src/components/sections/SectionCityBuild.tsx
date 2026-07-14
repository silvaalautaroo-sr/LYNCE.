"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Activity, Cloudy, Lightbulb, Users } from "lucide-react";
import { CityBuildCanvas } from "@/components/ui/CityBuildCanvas";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION 4 — the city comes to life.
 * A near-full-height isometric canvas builds a city layer by layer (land →
 * streets → buildings → trees → vehicles → pedestrians → lights → indicators),
 * then a live "digital twin" HUD fades in over the finished scene.
 */
export function SectionCityBuild() {
  const t = useTranslations("cityBuild");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [twinReady, setTwinReady] = useState(false);

  // Live-ish values that keep ticking once the twin is active
  const [live, setLive] = useState({ traffic: 62, emissions: 34, lighting: 88, pedestrians: 214 });

  useEffect(() => setMounted(true), []);

  const handleTwinReady = useCallback(() => setTwinReady(true), []);

  useEffect(() => {
    if (!twinReady) return;
    const id = setInterval(() => {
      setLive((v) => ({
        traffic: clampN(v.traffic + ri(-4, 4), 40, 92),
        emissions: clampN(v.emissions + ri(-3, 3), 18, 60),
        lighting: clampN(v.lighting + ri(-2, 2), 70, 99),
        pedestrians: clampN(v.pedestrians + ri(-12, 12), 120, 340),
      }));
    }, 2200);
    return () => clearInterval(id);
  }, [twinReady]);

  const theme = mounted && resolvedTheme === "light" ? "light" : "dark";

  const chips = [
    { icon: Activity, label: t("twin.traffic"), value: `${live.traffic}%` },
    { icon: Cloudy, label: t("twin.emissions"), value: `${live.emissions} µg` },
    { icon: Lightbulb, label: t("twin.lighting"), value: `${live.lighting}%` },
    { icon: Users, label: t("twin.pedestrians"), value: `${live.pedestrians}` },
  ];

  return (
    <section id="vision" className="relative overflow-hidden py-28 lg:py-36">
      <div className="container mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-4 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.22em]"
          >
            <span className="h-px w-6 bg-accent-primary/60" />
            <span className="keyword-gradient">{t("eyebrow")}</span>
            <span className="h-px w-6 bg-accent-primary/60" />
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05, ease }}
            className="text-balance text-3xl font-medium leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease }}
            className="mt-4 text-balance text-base leading-relaxed text-ink-muted sm:text-lg"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        {/* Canvas stage */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease }}
          className="glass relative aspect-[16/11] w-full overflow-hidden rounded-3xl sm:aspect-[16/9]"
        >
          {mounted && (
            <CityBuildCanvas theme={theme} onTwinReady={handleTwinReady} />
          )}

          {/* Live "digital twin" HUD label */}
          <AnimatePresence>
            {twinReady && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease }}
                className="glass-strong absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-medium text-ink sm:left-4 sm:top-4 sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-primary opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-primary" />
                </span>
                {t("twin.liveLabel")}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Metric chips */}
          <AnimatePresence>
            {twinReady && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease }}
                className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-1.5 sm:inset-x-6 sm:bottom-6 sm:flex sm:flex-wrap sm:gap-2.5"
              >
                {chips.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.label}
                      className="glass-strong flex items-center gap-1.5 rounded-lg px-2 py-1.5 sm:gap-2.5 sm:rounded-xl sm:px-3.5 sm:py-2.5"
                    >
                      <Icon className="h-3 w-3 shrink-0 text-accent-primary sm:h-4 sm:w-4" strokeWidth={1.5} />
                      <div className="leading-tight">
                        <div className="text-[0.5rem] uppercase tracking-[0.12em] text-ink-faint sm:text-[0.62rem] sm:tracking-[0.14em]">
                          {c.label}
                        </div>
                        <div className="font-feature-tabular text-[0.7rem] font-medium text-ink sm:text-sm">
                          {c.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

const clampN = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const ri = (lo: number, hi: number) =>
  Math.floor(Math.random() * (hi - lo + 1)) + lo;
