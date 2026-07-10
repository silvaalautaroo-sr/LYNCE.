"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  BrainCircuit, Boxes, Map, LineChart, Car, Cloud, Leaf,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

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
    <section id="technology" className="relative overflow-hidden py-32 lg:py-40">
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
                {p}
              </motion.p>
            ))}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          {TILES.map((tile, i) => {
            const Icon = tile.icon;
            return (
              <motion.div
                key={tile.key}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.06, ease }}
                whileHover={{ y: -6 }}
                className="glass group flex flex-col items-center gap-3 rounded-2xl px-3 py-6 text-center transition-colors duration-500 hover:border-accent-primary/40 hover:shadow-[0_0_30px_rgba(var(--accent-primary-rgb),0.16)]"
              >
                <motion.span
                  whileHover={{ rotate: [0, -8, 8, 0], scale: 1.12 }}
                  transition={{ duration: 0.6, ease }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-ink-faint transition-colors duration-300 group-hover:text-accent-primary"
                >
                  <Icon className="h-6 w-6" strokeWidth={1.4} />
                </motion.span>
                <span className="text-xs font-medium leading-tight text-ink-muted transition-colors duration-300 group-hover:text-ink">
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
