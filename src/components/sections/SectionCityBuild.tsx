"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useInView } from "framer-motion";

import { Activity, Cloudy, Lightbulb, Users, Layers, Cpu } from "lucide-react";
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

  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, {
    amount: 0.15,
    margin: "-30px 0px -30px 0px",
  });

  const [mounted, setMounted] = useState(false);
  const [twinReady, setTwinReady] = useState(false);
  const [animCycle, setAnimCycle] = useState(0);

  // Live-ish values that keep ticking once the twin is active
  const [live, setLive] = useState({ traffic: 62, emissions: 34, lighting: 88, pedestrians: 214 });

  useEffect(() => setMounted(true), []);

  const handleTwinReady = useCallback(() => setTwinReady(true), []);

  // When section enters the viewport, restart the animation from 0
  useEffect(() => {
    if (isInView) {
      setTwinReady(false);
      setAnimCycle((c) => c + 1);
    } else {
      setTwinReady(false);
    }
  }, [isInView]);

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

  const theme = "dark";

  const chips = [
    { icon: Activity, label: t("twin.traffic"), value: `${live.traffic}%` },
    { icon: Cloudy, label: t("twin.emissions"), value: `${live.emissions} µg` },
    { icon: Lightbulb, label: t("twin.lighting"), value: `${live.lighting}%` },
    { icon: Users, label: t("twin.pedestrians"), value: `${live.pedestrians}` },
  ];

  return (
    <section
      ref={sectionRef}
      id="digital-twin"
      className="relative overflow-hidden py-12 sm:py-16 lg:py-20"
    >
      <div className="container mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mx-auto mb-7 max-w-4xl text-center sm:mb-9 lg:max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08, ease }}
            className="text-balance text-3xl font-medium leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-[2.5rem]"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.14, ease }}
            className="mt-2.5 text-base leading-relaxed text-ink-muted sm:mt-3 sm:text-lg md:whitespace-nowrap"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        {/* Canvas stage */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease }}
          className="glass relative mx-auto aspect-[16/11] w-full max-w-4xl overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.55)] sm:aspect-[16/9] lg:aspect-[1.95/1] sm:rounded-3xl"
        >
          {mounted && isInView && (
            <CityBuildCanvas
              key={animCycle}
              theme={theme}
              onTwinReady={handleTwinReady}
            />
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

        {/* Concept Definition: Gemelo Digital (Integrated into background) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="mx-auto mt-14 max-w-4xl"
        >
          {/* Header Meta */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-primary/30 bg-accent-primary/10 text-accent-primary shadow-[0_0_15px_rgba(43,255,156,0.15)]">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-accent-primary">
                  {t("keyConcept")}
                </span>
                <h3 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
                  <span className="keyword-gradient">{t("eyebrow")}</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-ink-muted">
              <Cpu className="h-3 w-3 text-accent-secondary" />
              <span>DIGITAL TWIN ARCHITECTURE</span>
            </div>
          </div>

          {/* Definition Text */}
          <div>
            <p className="text-pretty text-base font-light leading-relaxed text-ink-muted sm:text-lg lg:text-[1.15rem] lg:leading-[1.75]">
              {t("description")}
              <strong className="font-semibold text-ink">
                {t("descriptionBold")}
              </strong>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const clampN = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const ri = (lo: number, hi: number) =>
  Math.floor(Math.random() * (hi - lo + 1)) + lo;
