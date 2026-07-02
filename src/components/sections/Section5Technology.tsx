"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Radio, Link2, Satellite, Cloud, Server } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

type TechKey = "ai" | "iot" | "blockchain" | "satellites" | "cloud" | "edge";

const TECH: Array<{
  key: TechKey;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  activeClass: string;
  glowColor: string;
  bgActive: string;
}> = [
  { key: "ai",         icon: Cpu,       activeClass: "text-accent-primary", glowColor: "rgba(24,194,156,0.25)",  bgActive: "rgba(24,194,156,0.1)" },
  { key: "iot",        icon: Radio,     activeClass: "text-accent-secondary", glowColor: "rgba(83,228,225,0.22)", bgActive: "rgba(83,228,225,0.1)" },
  { key: "blockchain", icon: Link2,     activeClass: "text-accent-primary", glowColor: "rgba(24,194,156,0.25)",  bgActive: "rgba(24,194,156,0.1)" },
  { key: "satellites", icon: Satellite, activeClass: "text-accent-secondary", glowColor: "rgba(83,228,225,0.22)", bgActive: "rgba(83,228,225,0.1)" },
  { key: "cloud",      icon: Cloud,     activeClass: "text-accent-primary", glowColor: "rgba(24,194,156,0.25)",  bgActive: "rgba(24,194,156,0.1)" },
  { key: "edge",       icon: Server,    activeClass: "text-accent-secondary", glowColor: "rgba(83,228,225,0.22)", bgActive: "rgba(83,228,225,0.1)" },
];

export function Section5Technology() {
  const t = useTranslations("technology");
  const ti = useTranslations("technology.items");
  const [hovered, setHovered] = useState<TechKey | null>(null);

  return (
    <section
      id="vision"
      className="relative overflow-hidden py-32 lg:py-40"
    >
      <div className="container mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          align="center"
          className="mb-16"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TECH.map((tech, i) => {
            const Icon = tech.icon;
            const active = hovered === tech.key;

            return (
              <motion.div
                key={tech.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onMouseEnter={() => setHovered(tech.key)}
                onMouseLeave={() => setHovered(null)}
                className="glass group relative cursor-default overflow-hidden rounded-2xl p-7 transition-all duration-500"
                style={{
                  boxShadow: active ? `0 0 50px ${tech.glowColor}` : "none",
                  borderColor: active ? `${tech.glowColor}` : "var(--border-soft)",
                }}
              >
                {/* Background glow blob */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl transition-opacity duration-500"
                  style={{
                    background: tech.glowColor,
                    opacity: active ? 1 : 0,
                  }}
                />

                <div className="relative">
                  {/* Icon */}
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300"
                    style={{
                      background: active ? tech.bgActive : "rgba(244,247,246,0.06)",
                    }}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors duration-300 ${
                        active ? tech.activeClass : "text-ink-muted"
                      }`}
                      strokeWidth={1.6}
                    />
                  </div>

                  <h3 className="mb-2 text-base font-semibold text-ink">
                    {ti(`${tech.key}.name`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    {ti(`${tech.key}.description`)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
