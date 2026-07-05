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

export function Header() {
  const tCta = useTranslations("cta");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToContact = () => {
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-4 top-4 z-50 md:inset-x-6 lg:inset-x-10">
        <div
          className={cn(
            "animated-border glass flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 md:px-5",
            scrolled && "shadow-[0_8px_40px_rgba(0,0,0,0.32)]"
          )}
          style={{
            background: "var(--header-bg)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            fontFamily: "var(--font-inter), Inter, sans-serif",
          }}
        >
          {/* ── Logo ──────────────────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <Logo />
          </button>

          {/* ── Right controls (desktop) ───────────────────────────────────── */}
          <div className="hidden sm:flex items-center gap-1.5">
            {/* Language switcher */}
            <div className="nav-item-wrap">
              <LocaleSwitcher />
            </div>

            {/* Theme toggle */}
            <div className="nav-item-wrap">
              <ThemeToggle />
            </div>

            {/* CTA */}
            <MagneticButton
              onClick={scrollToContact}
              ariaLabel={tCta("talkToUs")}
              className="nav-cta-btn"
            >
              {tCta("talkToUs")}
            </MagneticButton>
          </div>

          {/* ── Mobile hamburger ──────────────────────────────────────────────── */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink sm:hidden"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[4.5rem] z-40 glass-strong rounded-2xl p-4 sm:hidden"
            style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <LocaleSwitcher />
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <MagneticButton onClick={scrollToContact}>
                    {tCta("talkToUs")}
                  </MagneticButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
