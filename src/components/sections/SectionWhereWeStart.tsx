"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CountUp } from "@/components/ui/CountUp";
import { FlipCard } from "@/components/ui/FlipCard";

const ease = [0.16, 1, 0.3, 1] as const;

interface Metric {
  value: number;
  suffix?: string;
  label: string;
}
interface Card {
  front: string;
  items: string[];
}

/**
 * SECTION 3 — Where we start.
 * Copy + four oversized animated metrics + four minimal glass cards that flip
 * in 3D on hover to reveal their sub-categories.
 */
export function SectionWhereWeStart() {
  const t = useTranslations("whereWeStart");
  const paragraphs = t.raw("paragraphs") as string[];
  const metrics = t.raw("metrics") as Metric[];
  const cards = t.raw("cards") as Card[];
  const prefix = t("metricPrefix");

  return (
    <section id="platform" className="relative overflow-hidden py-32 lg:py-40">
      <div className="container mx-auto max-w-6xl px-6">
        {/* Intro */}
        <div className="max-w-3xl">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
          <div className="mt-6 space-y-4">
            {paragraphs.map((p, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.1 + i * 0.08, ease }}
                className="text-base leading-relaxed text-ink-muted sm:text-lg"
              >
                {p}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-20 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease }}
              whileHover={{ y: -6 }}
              className="group cursor-default"
            >
              <div className="keyword-gradient text-6xl font-semibold leading-none tracking-tighter transition-transform duration-500 group-hover:scale-[1.04] sm:text-7xl">
                <CountUp value={m.value} prefix={prefix} suffix={m.suffix} />
              </div>
              <div className="mt-4 h-px w-10 bg-accent-primary/40 transition-all duration-500 group-hover:w-16" />
              <p className="mt-4 max-w-[15rem] text-sm leading-relaxed text-ink-muted">
                {m.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Application cards */}
        <div className="mt-24">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em]"
          >
            <span className="h-px w-6 bg-accent-primary/60" />
            <span className="keyword-gradient">{t("cardsEyebrow")}</span>
          </motion.p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => (
              <FlipCard key={c.front} front={c.front} items={c.items} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
