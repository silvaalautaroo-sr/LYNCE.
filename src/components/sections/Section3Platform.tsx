"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowDown, GitMerge } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const STEP_ICONS = [
  <svg key="disconnected" viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
    <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.4" />
    <circle cx="36" cy="12" r="5" fill="currentColor" opacity="0.3" />
    <circle cx="12" cy="36" r="5" fill="currentColor" opacity="0.35" />
    <circle cx="36" cy="36" r="5" fill="currentColor" opacity="0.25" />
    <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.5" />
  </svg>,
  <GitMerge key="lynce" className="h-8 w-8" strokeWidth={1.4} />,
  <svg key="unified" viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
    <circle cx="24" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="24" cy="8"  r="4" fill="currentColor" opacity="0.8" />
    <circle cx="38" cy="18" r="4" fill="currentColor" opacity="0.7" />
    <circle cx="38" cy="30" r="4" fill="currentColor" opacity="0.7" />
    <circle cx="24" cy="40" r="4" fill="currentColor" opacity="0.8" />
    <circle cx="10" cy="30" r="4" fill="currentColor" opacity="0.7" />
    <circle cx="10" cy="18" r="4" fill="currentColor" opacity="0.7" />
    <line x1="24" y1="8"  x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" />
    <line x1="38" y1="18" x2="33" y2="20" stroke="currentColor" strokeWidth="1.5" />
    <line x1="38" y1="30" x2="33" y2="28" stroke="currentColor" strokeWidth="1.5" />
    <line x1="24" y1="40" x2="24" y2="34" stroke="currentColor" strokeWidth="1.5" />
    <line x1="10" y1="30" x2="15" y2="28" stroke="currentColor" strokeWidth="1.5" />
    <line x1="10" y1="18" x2="15" y2="20" stroke="currentColor" strokeWidth="1.5" />
  </svg>,
];

export function Section3Platform() {
  const t = useTranslations("platform");

  const steps = [
    {
      icon: STEP_ICONS[0],
      label: t("stepDisconnected"),
      note: t("stepDisconnectedNote"),
      accent: false,
    },
    {
      icon: STEP_ICONS[1],
      label: t("stepLynce"),
      note: t("stepLynceNote"),
      accent: true,
    },
    {
      icon: STEP_ICONS[2],
      label: t("stepUnified"),
      note: t("stepUnifiedNote"),
      accent: false,
    },
  ];

  return (
    <section
      id="technology"
      className="relative overflow-hidden py-32 lg:py-40"
    >
      <div className="container mx-auto max-w-4xl px-6">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          align="center"
          className="mb-20"
        />

        <div className="relative flex flex-col items-center gap-0">
          {steps.map((step, i) => (
            <div key={i} className="flex w-full flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`glass relative flex w-full max-w-sm flex-col items-center rounded-3xl p-8 text-center transition-all duration-500 ${
                  step.accent
                    ? "border-accent-primary/50 shadow-[0_0_60px_rgba(24,194,156,0.2)] bg-accent-primary/5"
                    : ""
                }`}
              >
                {/* Icon */}
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                    step.accent
                      ? "bg-accent-primary/20 text-accent-primary"
                      : "bg-ink/5 text-ink-muted"
                  }`}
                >
                  {step.icon}
                </div>

                <h3
                  className={`mb-2 text-xl font-semibold ${
                    step.accent ? "text-accent-primary" : "text-ink"
                  }`}
                >
                  {step.label}
                </h3>
                <p className="text-sm leading-relaxed text-ink-muted">
                  {step.note}
                </p>

                {/* Step pulse for Lynce */}
                {step.accent && (
                  <>
                    <span className="pointer-events-none absolute inset-0 rounded-3xl border border-accent-primary/30 animate-[pulse-glow_3s_ease-in-out_infinite]" />
                    <span className="pointer-events-none absolute inset-[-6px] rounded-[1.75rem] border border-accent-secondary/10 animate-[pulse-glow_3s_ease-in-out_infinite_500ms]" />
                  </>
                )}
              </motion.div>

              {/* Arrow connector */}
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  whileInView={{ opacity: 1, scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.15 + 0.3,
                    ease: "easeOut",
                  }}
                  className="flex h-14 flex-col items-center justify-center"
                >
                  <div
                    className={`h-8 w-px ${
                      i === 0
                        ? "bg-gradient-to-b from-ink-faint to-accent-primary"
                        : "bg-gradient-to-b from-accent-primary to-ink-faint"
                    }`}
                  />
                  <ArrowDown
                    className={`h-4 w-4 ${
                      i === 0 ? "text-accent-primary" : "text-ink-faint"
                    }`}
                    strokeWidth={1.5}
                  />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
