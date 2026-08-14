"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface FlipCardProps {
  front: string;
  items: string[];
  about: string;
  aboutLabel: string;
  index?: number;
  isFlipped: boolean;
  showImage: boolean;
  frontImageSrc?: string;
  imageSrc?: string;
  imageLabel?: string;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

export function FlipCard({
  front,
  items,
  about,
  aboutLabel,
  index = 0,
  isFlipped,
  showImage,
  frontImageSrc,
  imageSrc,
  imageLabel,
  onHoverStart,
  onHoverEnd,
}: FlipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      tabIndex={0}
      className="group relative h-[420px] cursor-pointer rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary"
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative h-full w-full transition-transform ease-premium"
        style={{
          transformStyle: "preserve-3d",
          transitionDuration: "700ms",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── Front ── */}
        <div
          className="glass absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl p-6 transition-shadow duration-500 hover:shadow-[0_0_30px_rgba(var(--accent-primary-rgb),0.15)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          {/* Background image if present */}
          {frontImageSrc && (
            <>
              <Image
                src={frontImageSrc}
                alt={front}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              {/* Gradient overlay for readability and sleek glass look */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/75 backdrop-blur-[1px]"
                aria-hidden="true"
              />
            </>
          )}

          <div className="relative z-10 flex items-start justify-between">
            <span className="font-feature-tabular text-xs font-semibold tracking-[0.18em] text-white/70">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-md text-white/80 transition-all duration-500 group-hover:rotate-45 group-hover:border-accent-primary/60 group-hover:bg-accent-primary/20 group-hover:text-accent-primary">
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.6} />
            </span>
          </div>

          <div className="relative z-10">
            <span className="mb-3 block h-1.5 w-1.5 rounded-full bg-accent-primary transition-all duration-500 group-hover:w-10 group-hover:rounded-full" />
            <span className="text-xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm">
              {front}
            </span>
          </div>
        </div>

        {/* ── Back — text content ── */}
        {!showImage && (
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-[rgba(var(--accent-primary-rgb),0.45)] p-6 shadow-[0_0_34px_rgba(var(--accent-primary-rgb),0.22)]"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background:
                "linear-gradient(135deg, rgba(var(--accent-primary-rgb),0.28) 0%, rgba(var(--accent-primary-rgb),0.1) 45%, var(--glass-bg-strong) 100%)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            {/* soft glow */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 animate-pulse-glow rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(var(--accent-primary-rgb),0.35) 0%, transparent 70%)",
              }}
            />

            <span className="relative mb-2 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-accent-primary">
              {front}
            </span>

            <div className="relative flex flex-col gap-1.5">
              {items.map((it) => (
                <span
                  key={it}
                  className="flex items-center gap-2 text-sm text-ink"
                >
                  <span className="h-px w-3 shrink-0 bg-accent-primary" />
                  {it}
                </span>
              ))}
            </div>

            {/* Separator */}
            <div className="my-3 h-px w-full bg-accent-primary/20" />

            {/* About section */}
            <div className="relative mt-auto">
              <span className="mb-1.5 block text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-accent-primary/80">
                {aboutLabel}
              </span>
              <p className="text-xs leading-relaxed text-ink-muted">
                {about}
              </p>
            </div>
          </div>
        )}

        {/* ── Back — context image ── */}
        {showImage && (
          <div
            className="absolute inset-0 overflow-hidden rounded-3xl border border-[rgba(var(--accent-primary-rgb),0.3)]"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={imageLabel || ""}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(var(--accent-primary-rgb),0.15) 0%, rgba(var(--accent-secondary-rgb),0.08) 50%, var(--glass-bg-strong) 100%)",
                }}
              />
            )}

            {/* Label overlay at bottom */}
            {imageLabel && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-5 pb-4 pt-10">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/80">
                  {imageLabel}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
