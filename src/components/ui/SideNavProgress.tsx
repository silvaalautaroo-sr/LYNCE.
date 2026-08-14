"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  { key: "intro", id: "intro" },
  { key: "product", id: "product" },
  { key: "cases", id: "cases" },
  { key: "digitalTwin", id: "digital-twin" },
  { key: "difference", id: "difference" },
  { key: "vision", id: "vision" },
  { key: "team", id: "team" },
  { key: "contact", id: "contact" },
] as const;

export function SideNavProgress() {
  const t = useTranslations("nav");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showActiveLabel, setShowActiveLabel] = useState(false);

  // Show active section label for 2 seconds whenever section changes
  useEffect(() => {
    if (!activeId) {
      setShowActiveLabel(false);
      return;
    }

    setShowActiveLabel(true);
    const timer = setTimeout(() => {
      setShowActiveLabel(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeId]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.35;
      let currentSection: string | null = null;

      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentSection = section.id;
            break;
          }
        }
      }

      // If scrolled near the bottom of the page, activate the contact section
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 120
      ) {
        currentSection = "contact";
      }

      setActiveId((prev) => (prev !== currentSection ? currentSection : prev));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      aria-label="Side navigation"
      className="fixed right-3 sm:right-5 lg:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-2.5 select-none"
    >
      {SECTIONS.map((sec) => {
        const isActive = activeId === sec.id;
        const isHovered = hoveredId === sec.id;
        const showLabel = isHovered || (isActive && showActiveLabel);

        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollTo(sec.id)}
            onMouseEnter={() => setHoveredId(sec.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group flex items-center justify-end gap-3 py-1.5 px-2 -mr-2 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-accent-primary rounded-lg transition-transform active:scale-95"
            aria-label={t(sec.key)}
            aria-current={isActive ? "true" : undefined}
          >
            {/* Section label floating to the left */}
            <AnimatePresence>
              {showLabel && (
                <motion.span
                  initial={{ opacity: 0, x: 10, scale: 0.92 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.92 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`pointer-events-none rounded-md px-2 py-0.5 text-xs font-medium tracking-tight whitespace-nowrap backdrop-blur-md transition-all duration-200 ${
                    isHovered
                      ? "border border-accent-primary/40 bg-[var(--header-bg)] text-accent-primary shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.3)]"
                      : isActive
                      ? "border border-accent-primary/20 bg-[var(--header-bg)] text-ink shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                      : "text-ink-muted"
                  }`}
                  style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
                >
                  {t(sec.key)}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Indicator bar */}
            <div
              className={`rounded-full transition-all duration-300 ease-out ${
                isHovered
                  ? "h-1.5 w-10 bg-accent-primary shadow-[0_0_14px_rgba(var(--accent-primary-rgb),0.95)]"
                  : isActive
                  ? "h-1.5 w-7 bg-accent-primary shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.75)]"
                  : "h-1 w-4 bg-white/25 hover:bg-accent-primary/70 dark:bg-white/20"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
