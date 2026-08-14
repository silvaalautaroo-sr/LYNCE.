"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Leaf, Users, TrendingUp, Cpu, Activity } from "lucide-react";
import { formatTextWithBold } from "@/lib/format";
import { UrbanSimulationLens } from "@/components/ui/UrbanSimulationLens";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION: ¿Qué es Lynce?
 * High-tech Architectural Simulation Console & Strategic Showcase.
 */
export function SectionIntro() {
  const t = useTranslations("intro");
  const paragraphs = t.raw("paragraphs") as string[];

  const pillarsTranslation = t.raw("console.pillars") as { label: string; subtext: string; metric: string }[];

  const impactPillars = [
    { icon: Leaf, accent: "#2bff9c", ...pillarsTranslation[0] },
    { icon: Users, accent: "#53e4e1", ...pillarsTranslation[1] },
    { icon: TrendingUp, accent: "#18c29c", ...pillarsTranslation[2] },
  ];

  return (
    <section id="intro" className="relative overflow-hidden pt-6 pb-10 sm:pt-8 sm:pb-12 lg:pt-10 lg:pb-14 scroll-mt-20 sm:scroll-mt-24 lg:scroll-mt-24">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[380px] w-[800px] rounded-full bg-accent-primary/[0.07] blur-[140px]" />
      </div>

      <div className="container relative mx-auto max-w-5xl px-6">
        {/* Section Main Title Header */}
        <div className="mx-auto mb-6 max-w-3xl text-center sm:mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            <span className="keyword-gradient">{t("eyebrow")}</span>
          </motion.h2>
        </div>

        {/* Main Architectural Simulation Console - Compact Height */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.75, ease }}
          className="glass-strong relative overflow-hidden rounded-3xl border border-white/10 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] sm:p-7 lg:p-9"
        >
          {/* Background Technical Grid */}
          <div
            className="pointer-events-none absolute inset-0 bg-app-grid opacity-20"
            aria-hidden="true"
          />

          {/* Interactive 3D Urban Simulation Wireframe in Background */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-30 transition-opacity duration-700 [mask-image:radial-gradient(ellipse_80%_60%_at_75%_50%,#000_15%,transparent_80%)]"
            aria-hidden="true"
          >
            <UrbanSimulationLens />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl">
            {/* Top Telemetry Indicator Strip */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5 text-xs text-ink-muted">
              <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs">
                <Cpu className="h-3.5 w-3.5 text-accent-primary" />
                <span className="font-semibold text-ink">{t("console.motor")}</span>
                <span className="text-ink-faint">|</span>
                <span className="text-accent-primary">{t("console.twinPlusAi")}</span>
              </div>
              <div className="hidden items-center gap-4 font-mono text-[11px] sm:flex text-ink-faint">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-accent-secondary" />
                  {t("console.evaluation")}
                </span>
                <span>{t("console.horizon")}</span>
              </div>
            </div>

            {/* Paragraph 1 - Full Text */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.08, ease }}
              className="relative"
            >
              <div className="absolute -left-3.5 top-1 hidden h-full w-1 rounded-full bg-gradient-to-b from-accent-primary via-accent-secondary to-transparent sm:block" />
              <p className="text-balance text-base font-light leading-relaxed tracking-tight text-ink/90 sm:text-lg lg:text-[1.22rem] lg:leading-[1.55]">
                {formatTextWithBold(paragraphs[0])}
              </p>
            </motion.div>

            {/* The 3 Core Impact Telemetry Ribbons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15, ease }}
              className="my-5 grid gap-2.5 sm:my-6 sm:grid-cols-3"
            >
              {impactPillars.map((v, i) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.label}
                    className="glass group relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-3 sm:p-3.5 transition-all duration-300 hover:border-accent-primary/40 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary transition-transform duration-300 group-hover:scale-110"
                          style={{ color: v.accent }}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold tracking-tight text-ink">
                          {v.label}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] sm:text-[10px] font-medium text-ink-faint group-hover:text-accent-primary transition-colors">
                        {v.metric}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
                      {v.subtext}
                    </p>
                    <div className="mt-2.5 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700 group-hover:w-full"
                        style={{
                          width: `${65 + i * 15}%`,
                          backgroundColor: v.accent,
                          opacity: 0.75,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Paragraph 2 - Full Text without box container */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.22, ease }}
              className="pt-1"
            >
              <p className="max-w-4xl text-pretty text-sm font-light leading-relaxed text-ink-muted sm:text-base lg:text-[1.05rem] lg:leading-[1.55]">
                {formatTextWithBold(paragraphs[1])}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
