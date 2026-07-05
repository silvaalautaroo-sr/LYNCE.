"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  className?: string;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale  = useLocale();
  const router  = useRouter();
  const pathname = usePathname();

  const switchLocale = (next: string) => {
    router.replace(pathname, { locale: next });
  };

  return (
    <div
      className={cn(
        "glass flex items-center gap-px rounded-full px-1 py-1",
        className
      )}
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-label={l === "es" ? "Español" : "English"}
          onClick={() => switchLocale(l)}
          className={cn(
            // Base
            "rounded-full px-3 py-1.5 text-[0.72rem] font-medium tracking-[-0.01em]",
            "transition-all duration-[280ms] ease-out",
            // Hover
            "hover:-translate-y-[1px] hover:brightness-110",
            // Active locale
            locale === l
              ? "bg-accent-primary/20 text-accent-primary"
              : "text-ink-muted hover:text-ink"
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
