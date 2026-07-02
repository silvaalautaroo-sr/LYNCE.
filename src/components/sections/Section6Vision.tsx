"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export function Section6Vision() {
  const t = useTranslations("vision");

  // Split the statement into words for staggered reveal
  const words = t("statement").split(" ");

  return (
    <section id="contact" className="relative overflow-hidden py-40 lg:py-56">
      {/* Soft radial glow behind text */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[500px] w-[700px] rounded-full bg-accent-primary/6 blur-[120px]" />
      </div>

      <div className="container relative mx-auto max-w-5xl px-6 text-center">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-accent-primary"
        >
          <span className="h-px w-6 bg-accent-primary/60" />
          {t("eyebrow")}
          <span className="h-px w-6 bg-accent-primary/60" />
        </motion.p>

        {/* Large statement — word by word reveal */}
        <p
          aria-label={t("statement")}
          className="text-balance text-3xl font-medium leading-[1.25] tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-[3.25rem]"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.55,
                delay: i * 0.028,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="inline-block mr-[0.3em]"
            >
              {word}
            </motion.span>
          ))}
        </p>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 text-lg font-medium text-accent-primary"
        >
          {t("subtext")}
        </motion.p>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-16 h-px max-w-xs bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent"
          style={{ transformOrigin: "center" }}
        />

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14"
        >
          <a
            href="mailto:hola@lynce.tech"
            className="animated-border glass inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium text-ink shadow-[0_0_0_rgba(24,194,156,0)] transition-all duration-500 hover:shadow-[var(--shadow-glow)]"
          >
            <span className="relative z-[2]">hola@lynce.tech</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
