"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ConvergenceNetwork } from "@/components/ui/ConvergenceNetwork";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION 2 — Problem + Vision.
 * Left: the argument, revealed line by line on scroll.
 * Right: the ConvergenceNetwork — isolated cards drawn into one connected
 * constellation around the Lynce mark ("before they were apart; now they work
 * as one platform").
 */
export function SectionProblemVision() {
  const t = useTranslations("problemVision");
  const paragraphs = t.raw("paragraphs") as string[];
  const nodes = t.raw("nodes") as string[];

  return (
    <section id="ecosystem" className="relative overflow-hidden py-32 lg:py-40">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Left — copy */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em]"
            >
              <span className="h-px w-6 bg-accent-primary/60" />
              <span className="keyword-gradient">{t("eyebrow")}</span>
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05, ease }}
              className="text-balance text-3xl font-medium leading-[1.12] tracking-tight text-ink sm:text-4xl lg:text-[2.9rem]"
            >
              {t("title")}
            </motion.h2>

            <div className="mt-7 space-y-4">
              {paragraphs.map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.65, delay: 0.1 + i * 0.08, ease }}
                  className="text-base leading-relaxed text-ink-muted"
                >
                  {p}
                </motion.p>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5, ease }}
              className="mt-8 text-lg font-medium leading-snug text-ink"
            >
              {t("closingA")}{" "}
              <span className="keyword-gradient">{t("closingB")}</span>
            </motion.p>
          </div>

          {/* Right — signature animation */}
          <div className="relative">
            <ConvergenceNetwork labels={nodes} />
          </div>
        </div>
      </div>
    </section>
  );
}
