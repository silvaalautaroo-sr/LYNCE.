"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  BrainCircuit, Boxes, Map, LineChart, Car, Cloud, Leaf,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatTextWithBold } from "@/lib/format";

const ease = [0.16, 1, 0.3, 1] as const;

const TILES: { key: string; icon: LucideIcon }[] = [
  { key: "ai", icon: BrainCircuit },
  { key: "digitalTwins", icon: Boxes },
  { key: "gis", icon: Map },
  { key: "predictive", icon: LineChart },
  { key: "traffic", icon: Car },
  { key: "cloud", icon: Cloud },
  { key: "environment", icon: Leaf },
];

/**
 * SECTION 5 — Built on urban intelligence.
 * Copy plus a row of minimal icon tiles that lift, glow, and animate their
 * icon on hover.
 */
export function SectionUrbanIntelligence() {
  const t = useTranslations("urbanIntelligence");
  const paragraphs = t.raw("paragraphs") as string[];

  return (
    <section id="difference" className="relative overflow-hidden py-20 lg:py-28">
      <div className="container mx-auto max-w-6xl px-6">
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

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {TILES.map((tile, i) => {
            const Icon = tile.icon;
            return (
              <motion.div
                key={tile.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.05, ease }}
                className="glass flex flex-col items-center justify-center gap-4 rounded-2xl p-5 text-center cursor-default select-none border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary shadow-[0_0_25px_rgba(var(--accent-primary-rgb),0.12)]">
                  <Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.6} />
                </div>
                <span className="text-xs sm:text-sm font-medium tracking-tight text-ink/90 leading-snug">
                  {t(`tiles.${tile.key}`)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
