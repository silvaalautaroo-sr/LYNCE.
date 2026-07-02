import { useTranslations } from "next-intl";
import Image from "next/image";

const NAV_ITEMS = [
  "platform",
  "ecosystem",
  "technology",
  "vision",
  "about",
  "contact",
] as const;

export function Footer() {
  const t = useTranslations("nav");
  const tf = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer
      id="about"
      className="border-t border-border bg-bg-primary/80 backdrop-blur-xl"
    >
      <div className="container mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_auto_auto]">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative h-10 w-7">
                <Image
                  src="/logo/lynx-icon-light.png"
                  alt="Lynce"
                  fill
                  sizes="28px"
                  className="object-contain dark:block hidden"
                />
                <Image
                  src="/logo/lynx-icon-dark.png"
                  alt="Lynce"
                  fill
                  sizes="28px"
                  className="object-contain dark:hidden block"
                />
              </div>
              <span className="text-base font-semibold tracking-[0.16em] text-ink">
                LYNCE
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-ink-faint italic">
              &ldquo;{tf("tagline")}&rdquo;
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-faint">
              {tf("navTitle")}
            </p>
            <ul className="space-y-2.5">
              {NAV_ITEMS.map((key) => (
                <li key={key}>
                  <a
                    href={`#${key}`}
                    className="text-sm text-ink-muted transition-colors hover:text-ink"
                  >
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-faint">
              {tf("contactTitle")}
            </p>
            <a
              href={`mailto:${tf("email")}`}
              className="text-sm text-accent-primary transition-opacity hover:opacity-80"
            >
              {tf("email")}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint">
            &copy; {year} Lynce. {tf("rights")}
          </p>
          <p className="text-xs text-ink-faint">
            lynce.tech
          </p>
        </div>
      </div>
    </footer>
  );
}
