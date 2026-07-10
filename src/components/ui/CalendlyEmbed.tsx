"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface CalendlyEmbedProps {
  /**
   * Your Calendly scheduling link, e.g. "https://calendly.com/lynce/30min".
   * Replace the default below with the real one.
   */
  url?: string;
  height?: number;
}

const CALENDLY_CSS = "https://assets.calendly.com/assets/external/widget.css";
const CALENDLY_JS = "https://assets.calendly.com/assets/external/widget.js";

// Loads the Calendly assets once and reuses them across mounts.
function useCalendlyAssets() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!document.querySelector(`link[href="${CALENDLY_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CALENDLY_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CALENDLY_JS}"]`
    );
    if (existing) {
      if ((window as unknown as { Calendly?: unknown }).Calendly) setReady(true);
      else existing.addEventListener("load", () => setReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = CALENDLY_JS;
    script.async = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, []);
  return ready;
}

export function CalendlyEmbed({
  url = "https://calendly.com/lynce/30min",
  height = 640,
}: CalendlyEmbedProps) {
  const { resolvedTheme } = useTheme();
  const ready = useCalendlyAssets();
  const containerRef = useRef<HTMLDivElement>(null);

  // Tint the widget to match the current theme accent.
  const accent = resolvedTheme === "light" ? "e8834f" : "18c29c";
  const bg = resolvedTheme === "light" ? "ffffff" : "05090f";
  const text = resolvedTheme === "light" ? "0f172a" : "ffffff";

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const el = containerRef.current;
    el.innerHTML = "";
    const full =
      `${url}?hide_gdpr_banner=1&background_color=${bg}` +
      `&text_color=${text}&primary_color=${accent}`;
    (
      window as unknown as {
        Calendly?: {
          initInlineWidget: (o: {
            url: string;
            parentElement: HTMLElement;
          }) => void;
        };
      }
    ).Calendly?.initInlineWidget({ url: full, parentElement: el });
  }, [ready, url, accent, bg, text]);

  return (
    <div className="glass overflow-hidden rounded-2xl">
      {!ready && (
        <div
          className="flex items-center justify-center text-sm text-ink-faint"
          style={{ height }}
        >
          <span className="animate-pulse">Cargando calendario…</span>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ minWidth: 280, height: ready ? height : 0 }}
      />
    </div>
  );
}
