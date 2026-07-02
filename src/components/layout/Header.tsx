"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  "platform",
  "ecosystem",
  "technology",
  "vision",
  "about",
  "contact",
] as const;

const SECTION_IDS: Record<string, string> = {
  platform: "platform",
  ecosystem: "ecosystem",
  technology: "technology",
  vision: "vision",
  about: "about",
  contact: "contact",
};

export function Header() {
  const t = useTranslations("nav");
  const tCta = useTranslations("cta");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-4 top-4 z-50 transition-all duration-500 ease-premium md:inset-x-6 lg:inset-x-10 xl:inset-x-20"
        )}
      >
        {/* Outer wrapper: owns the animated conic-gradient border only.
            Keeping backdrop-filter off this node (and on the inner node
            instead) is required for the border animation to composite
            correctly on wide desktop headers — see globals.css. */}
        <div className="animated-border rounded-2xl transition-all duration-500 ease-premium">
          <div
            className={cn(
              "glass flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 ease-premium md:px-6",
              scrolled
                ? "shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
                : "backdrop-blur-xl"
            )}
            style={{ background: "var(--header-bg)" }}
          >
            {/* Left — Logo */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Volver al inicio"
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            >
              <Logo />
            </button>

            {/* Center — Nav links (desktop) */}
            <nav aria-label="Main navigation" className="hidden lg:flex">
              <ul className="flex items-center gap-1">
                {NAV_ITEMS.map((key) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => scrollTo(SECTION_IDS[key])}
                      className="rounded-lg px-3.5 py-2 text-[0.8125rem] font-medium text-ink-muted transition-all duration-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                    >
                      {t(key)}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Right — Controls + CTA */}
            <div className="flex items-center gap-2">
              <LocaleSwitcher className="hidden sm:flex" />
              <ThemeToggle />

              <MagneticButton
                onClick={() => scrollTo("contact")}
                className="hidden sm:inline-flex"
                ariaLabel={tCta("talkToUs")}
              >
                {tCta("talkToUs")}
              </MagneticButton>

              {/* Hamburger (mobile) */}
              <button
                type="button"
                aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink lg:hidden"
              >
                {mobileOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[4.75rem] z-40 glass-strong rounded-2xl p-4 lg:hidden"
          >
            <nav aria-label="Mobile navigation">
              <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((key) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => scrollTo(SECTION_IDS[key])}
                      className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      {t(key)}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <LocaleSwitcher />
                <MagneticButton
                  onClick={() => scrollTo("contact")}
                  ariaLabel={tCta("talkToUs")}
                >
                  {tCta("talkToUs")}
                </MagneticButton>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
