"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

/**
 * Optional POST endpoint (e.g. a Formspree form URL like
 * "https://formspree.io/f/xxxx"). If left empty, the form falls back to opening
 * the visitor's mail client with the message pre-filled — so it works on a
 * purely static Vercel deploy with no backend.
 */
const FORM_ENDPOINT = "";
const CONTACT_EMAIL = "hola@lynce.tech";

type Field = "name" | "email" | "company" | "message";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const t = useTranslations("ctaSection.form");
  const [values, setValues] = useState<Values>({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [f]: e.target.value }));
    if (errors[f]) setErrors((prev) => ({ ...prev, [f]: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (!values.name.trim()) next.name = t("errorRequired");
    if (!values.email.trim()) next.email = t("errorRequired");
    else if (!emailRe.test(values.email)) next.email = t("errorEmail");
    if (!values.message.trim()) next.message = t("errorRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");

    try {
      if (FORM_ENDPOINT) {
        await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(values),
        });
      } else {
        // Static fallback — compose an email
        const body = encodeURIComponent(
          `${values.message}\n\n— ${values.name}` +
            (values.company ? ` · ${values.company}` : "") +
            `\n${values.email}`
        );
        const subject = encodeURIComponent(`Lynce · ${values.name}`);
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      }
      setStatus("sent");
    } catch {
      // Even on failure, guide the visitor to email directly
      window.location.href = `mailto:${CONTACT_EMAIL}`;
      setStatus("sent");
    }
  };

  const inputBase =
    "glass w-full rounded-xl bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-faint transition-all duration-300 focus:border-accent-primary/50 focus:outline-none focus:shadow-[0_0_24px_rgba(var(--accent-primary-rgb),0.14)]";

  return (
    <AnimatePresence mode="wait">
      {status === "sent" ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl p-8 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary/15 text-accent-primary">
            <Check className="h-6 w-6" />
          </span>
          <p className="max-w-xs text-base text-ink">{t("success")}</p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit}
          noValidate
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label={t("name")} error={errors.name}>
              <input
                type="text"
                value={values.name}
                onChange={set("name")}
                placeholder={t("namePlaceholder")}
                className={inputBase}
                aria-invalid={!!errors.name}
              />
            </Labeled>
            <Labeled label={t("email")} error={errors.email}>
              <input
                type="email"
                value={values.email}
                onChange={set("email")}
                placeholder={t("emailPlaceholder")}
                className={inputBase}
                aria-invalid={!!errors.email}
              />
            </Labeled>
          </div>

          <Labeled label={t("company")}>
            <input
              type="text"
              value={values.company}
              onChange={set("company")}
              placeholder={t("companyPlaceholder")}
              className={inputBase}
            />
          </Labeled>

          <Labeled label={t("message")} error={errors.message}>
            <textarea
              value={values.message}
              onChange={set("message")}
              placeholder={t("messagePlaceholder")}
              rows={5}
              className={`${inputBase} resize-none`}
              aria-invalid={!!errors.message}
            />
          </Labeled>

          <motion.button
            type="submit"
            disabled={status === "sending"}
            whileTap={{ scale: 0.98 }}
            className="animated-border glass mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-ink transition-all duration-300 hover:shadow-[var(--shadow-glow)] disabled:opacity-70"
          >
            <span className="relative z-[2] inline-flex items-center gap-2">
              {status === "sending" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {status === "sending" ? t("sending") : t("submit")}
            </span>
          </motion.button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

function Labeled({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-accent-secondary"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}
