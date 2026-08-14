"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * SECTION USP — Unique Value Proposition directly beneath the Hero.
 * Wide headline spanning the width of the page.
 */
export function SectionUSP() {
  const t = useTranslations("usp");

  return (
    <section id="usp" className="relative overflow-hidden py-12 md:py-20 lg:py-20">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[360px] w-[720px] rounded-full bg-accent-primary/[0.07] blur-[140px]" />
      </div>

      <div className="container relative mx-auto max-w-7xl px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease }}
          className="mx-auto max-w-6xl text-center"
        >
          <h2
            className="text-balance text-3xl font-bold tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.14]"
            style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
          >
            {t("pre")}
            <span className="keyword-gradient font-extrabold">{t("highlight")}</span>
            {t("post")}
          </h2>
        </motion.div>

        {/* Subtle accent divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3, ease }}
          className="mx-auto mt-16 md:mt-20 h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent"
        />
      </div>
    </section>
  );
}
