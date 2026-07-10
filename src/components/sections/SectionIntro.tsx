"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

/**
 * SECTION 1 — a single quiet statement directly beneath the Hero.
 * The Hero itself is untouched; this only adds the introductory line, which
 * fades and lifts softly into place on scroll.
 */
export function SectionIntro() {
  const t = useTranslations("intro");

  return (
    <section id="intro" className="relative overflow-hidden py-24 lg:py-32">
      <div className="container mx-auto max-w-4xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 26, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-balance text-center text-xl font-light leading-relaxed tracking-tight text-ink-muted sm:text-2xl lg:text-[1.75rem] lg:leading-[1.5]"
        >
          {t("pre")}
          <span className="keyword-gradient font-medium">{t("highlight")}</span>
          {t("post")}
        </motion.p>
      </div>
    </section>
  );
}
