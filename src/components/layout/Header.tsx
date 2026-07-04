"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { cn } from "@/lib/utils";

export function Header() {
  const tCta = useTranslations("cta");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToContact = () => {
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={cn(
        "fixed inset-x-4 top-4 z-50 transition-all duration-500 ease-premium md:inset-x-6 lg:inset-x-10 xl:inset-x-20"
      )}
    >
      <div
        className={cn(
          "animated-border flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 ease-premium md:px-6",
          scrolled
            ? "shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            : "backdrop-blur-xl",
          "glass"
        )}
        style={{ background: "var(--header-bg)" }}
      >
        {/* Left — Logo (icon morphs into the LYNCE wordmark on scroll) */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        >
          <Logo />
        </button>

        {/* Center — intentionally empty (no navigation) */}

        {/* Right — Language switcher, theme toggle, single CTA */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <MagneticButton onClick={scrollToContact} ariaLabel={tCta("talkToUs")}>
            {tCta("talkToUs")}
          </MagneticButton>
        </div>
      </div>
    </header>
  );
}
