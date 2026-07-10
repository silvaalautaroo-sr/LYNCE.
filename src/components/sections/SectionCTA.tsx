"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Mail } from "lucide-react";
import { CalendlyEmbed } from "@/components/ui/CalendlyEmbed";
import { ContactForm } from "@/components/ui/ContactForm";

const ease = [0.16, 1, 0.3, 1] as const;

type Tab = "schedule" | "contact";

/**
 * SECTION 6 — closing CTA.
 * A segmented control switches between an embedded Calendly scheduler and a
 * validated contact form. Doubles as the site's #contact anchor (used by the
 * header CTA and footer).
 */
export function SectionCTA() {
  const t = useTranslations("ctaSection");
  const [tab, setTab] = useState<Tab>("schedule");

  return (
    <section id="contact" className="relative overflow-hidden py-32 lg:py-40">
      {/* Soft glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-start justify-center"
      >
        <div className="mt-24 h-[420px] w-[680px] rounded-full bg-accent-primary/[0.07] blur-[130px]" />
      </div>

      <div className="container relative mx-auto max-w-5xl px-6">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-5 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.22em]"
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
            className="text-balance text-3xl font-medium leading-[1.12] tracking-tight text-ink sm:text-4xl lg:text-[3rem]"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease }}
            className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-ink-muted sm:text-lg"
          >
            {t("body")}
          </motion.p>
        </div>

        {/* Segmented control */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="glass mx-auto mt-12 flex w-fit gap-1 rounded-full p-1"
        >
          {(["schedule", "contact"] as Tab[]).map((key) => {
            const active = tab === key;
            const Icon = key === "schedule" ? CalendarDays : Mail;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300"
              >
                {active && (
                  <motion.span
                    layoutId="cta-tab"
                    className="absolute inset-0 rounded-full bg-accent-primary/15 shadow-[inset_0_0_0_1px_rgba(var(--accent-primary-rgb),0.4)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-2 ${
                    active ? "text-ink" : "text-ink-faint"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                  {key === "schedule" ? t("tabSchedule") : t("tabContact")}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Panels */}
        <div className="mx-auto mt-10 max-w-2xl">
          <AnimatePresence mode="wait">
            {tab === "schedule" ? (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease }}
              >
                <p className="mb-4 text-center text-sm text-ink-faint">
                  {t("scheduleHint")}
                </p>
                <CalendlyEmbed />
              </motion.div>
            ) : (
              <motion.div
                key="contact"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease }}
              >
                <ContactForm />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
