"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRight } from "lucide-react";

const SOLUTION_ITEMS = [
  { icon: "🔥", label: "Wildfire detection" },
  { icon: "💧", label: "Water management" },
  { icon: "⚡", label: "Energy grid monitoring" },
  { icon: "🚦", label: "Smart traffic" },
  { icon: "🏙️", label: "Urban intelligence" },
  { icon: "🛰️", label: "Satellite analytics" },
];

export function Section4OwnSolutions() {
  const t = useTranslations("ownSolutions");

  return (
    <section className="relative overflow-hidden py-32 lg:py-40">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {/* Left — text */}
          <div>
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("title")}
              subtitle={t("body")}
            />
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 inline-flex items-center gap-2 text-sm text-accent-primary"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              {t("note")}
            </motion.p>
          </div>

          {/* Right — solution tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {SOLUTION_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.88 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                className="glass flex flex-col items-center gap-2.5 rounded-2xl p-5 text-center transition-colors duration-300 hover:border-accent-primary/25"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-medium text-ink-muted">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
