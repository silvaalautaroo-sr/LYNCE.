"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ShieldAlert, Coins, Leaf, TrendingUp } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CountUp } from "@/components/ui/CountUp";
import { formatTextWithBold } from "@/lib/format";

const ease = [0.16, 1, 0.3, 1] as const;

interface Metric {
  value: number;
  suffix?: string;
  label: string;
}
interface Benefit {
  title: string;
  description: string;
}

const BENEFIT_ICONS = [ShieldAlert, Coins, Leaf, TrendingUp];

/**
 * SECTION 3 — Where we start.
 * Copy + product benefits + four oversized animated metrics.
 */
export function SectionWhereWeStart() {
  const t = useTranslations("whereWeStart");
  const paragraphs = t.raw("paragraphs") as string[];
  const benefits = t.raw("product.benefits") as Benefit[];
  const metrics = t.raw("metrics") as Metric[];
  const prefix = t("metricPrefix");

  return (
    <section id="product" className="relative overflow-hidden py-20 lg:py-28">
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
                {formatTextWithBold(p)}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Product Benefits */}
        <div className="mt-20">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em]"
            >
              <span className="h-px w-6 bg-accent-primary/60" />
              <span className="keyword-gradient">{t("product.eyebrow")}</span>
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05, ease }}
              className="text-balance text-2xl font-medium leading-[1.2] tracking-tight text-ink sm:text-3xl lg:text-[2.25rem]"
            >
              {t("product.title")}
            </motion.h3>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => {
              const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease }}
                  whileHover={{ y: -5 }}
                  className="glass group relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-500 hover:border-accent-primary/40 hover:shadow-[0_0_30px_rgba(24,194,156,0.14)]"
                >
                  <div>
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-accent-primary/20">
                      <Icon className="h-5 w-5" strokeWidth={1.6} />
                    </div>
                    <h4 className="text-base font-semibold text-ink transition-colors duration-300 group-hover:text-accent-primary">
                      {b.title}
                    </h4>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                      {b.description}
                    </p>
                  </div>
                  <div className="mt-5 h-px w-8 bg-accent-primary/30 transition-all duration-500 group-hover:w-full group-hover:bg-accent-primary/60" />
                </motion.div>
              );
            })}
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
      </div>
    </section>
  );
}
