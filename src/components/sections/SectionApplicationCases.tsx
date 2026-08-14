"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FlipCard } from "@/components/ui/FlipCard";

const ease = [0.16, 1, 0.3, 1] as const;

interface Card {
  front: string;
  items: string[];
  about: string;
}

/**
 * Image map: when hovering card N, the OTHER 3 cards show these 3 images.
 * Each entry is an array of 3 image paths (one for each of the other cards).
 */
const CASE_IMAGES: string[][] = [
  // Card 0 hovered ("Desarrollos Urbanos") → images shown on cards 1, 2, 3
  [
    "/images/cases/Desarrollos-urbano-1.webp",
    "/images/cases/Desarrollos-urbano-2.webp",
    "/images/cases/Desarrollos-urbano-3.webp",
  ],
  // Card 1 hovered ("Infraestructura Vial") → images shown on cards 0, 2, 3
  [
    "/images/cases/Infraestructura-vial-1.webp",
    "/images/cases/Infraestructura-vial-2.webp",
    "/images/cases/Infraestructura-vial-3.webp",
  ],
  // Card 2 hovered ("Obras Públicas") → images shown on cards 0, 1, 3
  [
    "/images/cases/obras-publicas-1.webp",
    "/images/cases/obras-publicas-2.webp",
    "/images/cases/obras-publicas-3.webp",
  ],
  // Card 3 hovered ("Construcción Privada") → images shown on cards 0, 1, 2
  [
    "/images/cases/Construccion-privada-1.webp",
    "/images/cases/Construccion-privada-2.webp",
    "/images/cases/Construccion-privada-3.webp",
  ],
];

/**
 * Given which card is hovered and which card we're rendering,
 * return the image path that card should show on its back.
 */
function getImageForCard(hoveredIndex: number, cardIndex: number): string {
  const images = CASE_IMAGES[hoveredIndex];
  // The 3 images go to the 3 non-hovered cards in order
  const otherIndices = [0, 1, 2, 3].filter((i) => i !== hoveredIndex);
  const slot = otherIndices.indexOf(cardIndex);
  return images[slot];
}

/**
 * Front background images for the idle/normal state of the cards.
 */
const FRONT_IMAGES: string[] = [
  "/images/cases/front-desarrollos-urbanos.webp",
  "/images/cases/front-infraestructura-vial.webp",
  "/images/cases/front-obras-publicas.webp",
  "/images/cases/front-construccion-privada.webp",
];

/**
 * SECTION — Casos de aplicación (Application Cases).
 * Four interactive cards placed right below the Digital Twin section.
 */
export function SectionApplicationCases() {
  const t = useTranslations("whereWeStart");
  const cards = t.raw("cards") as Card[];
  const aboutLabel = t("aboutLabel");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="cases" className="relative overflow-hidden pt-6 pb-12 sm:pt-8 sm:pb-16 lg:pt-8 lg:pb-18 scroll-mt-20 sm:scroll-mt-24 lg:scroll-mt-24">
      <div className="container mx-auto max-w-6xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em]"
        >
          <span className="h-px w-6 bg-accent-primary/60" />
          <span className="keyword-gradient">{t("cardsEyebrow")}</span>
        </motion.p>

        <div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {cards.map((c, i) => {
            const isHoveredCard = hoveredIndex === i;
            const anotherIsHovered = hoveredIndex !== null && hoveredIndex !== i;
            return (
              <FlipCard
                key={c.front}
                front={c.front}
                items={c.items}
                about={c.about}
                aboutLabel={aboutLabel}
                index={i}
                isFlipped={isHoveredCard || anotherIsHovered}
                showImage={anotherIsHovered}
                frontImageSrc={FRONT_IMAGES[i]}
                imageSrc={
                  anotherIsHovered && hoveredIndex !== null
                    ? getImageForCard(hoveredIndex, i)
                    : undefined
                }
                imageLabel={hoveredIndex !== null ? cards[hoveredIndex].front : undefined}
                onHoverStart={() => setHoveredIndex(i)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
