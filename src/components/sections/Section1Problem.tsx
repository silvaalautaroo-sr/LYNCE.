"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const TAGS = [
  "Tráfico", "Residuos", "Iluminación", "Energía",
  "Agua", "Movilidad", "IoT", "IA", "GIS",
  "Satélites", "Blockchain", "Monitoreo",
];

export function Section1Problem() {
  const t = useTranslations("section1");

  return (
    <section
      id="ecosystem"
      className="relative overflow-hidden py-32 lg:py-40"
    >
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Left — headline + body */}
          <div>
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("headlineLine1")}
              className="mb-0"
            />
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-balance text-3xl font-medium leading-[1.15] tracking-tight text-accent-primary sm:text-4xl lg:text-[2.75rem]"
            >
              {t("headlineLine2")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-base leading-relaxed text-ink-muted sm:text-lg"
            >
              {t("body")}
            </motion.p>
          </div>

          {/* Right — scattered floating tags */}
          <div className="relative flex min-h-[340px] items-center justify-center lg:min-h-0">
            {TAGS.map((tag, i) => {
              const angle = (i / TAGS.length) * 360;
              const rx = 38 + (i % 3) * 6;
              const ry = 28 + (i % 2) * 8;
              const x = 50 + rx * Math.cos((angle * Math.PI) / 180);
              const y = 50 + ry * Math.sin((angle * Math.PI) / 180);

              return (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: 0.05 * i,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  animate={{
                    y: [0, (i % 2 === 0 ? -6 : 6), 0],
                  }}
                  // @ts-expect-error framer-motion transition typing
                  transition={{
                    y: {
                      duration: 3 + i * 0.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    opacity: { duration: 0.6, delay: 0.05 * i },
                    scale: { duration: 0.6, delay: 0.05 * i },
                  }}
                  className="glass absolute rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-muted"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {tag}
                </motion.div>
              );
            })}

            {/* Disconnected visual */}
            <div className="glass absolute inset-8 rounded-3xl opacity-30" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              className="absolute h-64 w-64 rounded-full border border-dashed border-ink-faint opacity-20"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
