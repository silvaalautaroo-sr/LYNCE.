"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ease = [0.16, 1, 0.3, 1] as const;

interface Member {
  name: string;
  role: string;
  tags: string[];
}

const MEMBER_IMAGES: Record<string, string> = {
  "Valeria Bravo": "/team/valeria.webp",
  "Carolina Millicevic": "/team/carolina.webp",
  "Lautaro Silva": "/team/lautaro.webp",
  "Alexis Ramundo": "/team/alexis.webp",
};

/**
 * Team member avatar with profile photo and fallback to initials.
 */
function TeamAvatar({ name }: { name: string }) {
  const imgSrc = MEMBER_IMAGES[name];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative mx-auto h-32 w-32 sm:h-36 sm:w-36">
      {/* Outer glow ring */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent-primary/40 via-accent-secondary/30 to-transparent opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
      {/* Avatar circle */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-border/80 bg-gradient-to-br from-white/[0.06] to-transparent shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:border-accent-primary/50 group-hover:shadow-[0_0_30px_rgba(var(--accent-primary-rgb),0.25)]">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 128px, 144px"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="keyword-gradient text-3xl font-bold tracking-wider sm:text-4xl">
            {initials}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * SECTION — Team.
 * Team description + four member cards with placeholder avatars,
 * role badges, and skill tags.
 */
export function SectionTeam() {
  const t = useTranslations("team");
  const members = t.raw("members") as Member[];

  return (
    <section id="team" className="relative overflow-hidden py-20 lg:py-28">
      <div className="container mx-auto max-w-6xl px-6">
        {/* Heading + description */}
        <div className="max-w-3xl">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.1, ease }}
            className="mt-6 text-base leading-relaxed text-ink-muted sm:text-lg"
          >
            {t("description")}
          </motion.p>
        </div>

        {/* Team grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65, delay: i * 0.1, ease }}
              whileHover={{ y: -6 }}
              className="glass group relative flex flex-col items-center rounded-2xl px-5 py-8 text-center transition-all duration-500 hover:border-accent-primary/40 hover:shadow-[0_0_40px_rgba(var(--accent-primary-rgb),0.12)]"
            >
              {/* Avatar */}
              <TeamAvatar name={member.name} />

              {/* Name */}
              <h3 className="mt-5 text-lg font-semibold leading-tight text-ink transition-colors duration-300 group-hover:text-accent-primary">
                {member.name}
              </h3>

              {/* Role badge */}
              <span className="mt-2 inline-flex items-center rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-0.5 text-xs font-semibold tracking-wide text-accent-primary">
                {member.role}
              </span>

              {/* Skill tags */}
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {member.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-glass px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors duration-300 group-hover:border-accent-primary/20 group-hover:text-ink"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Bottom accent line */}
              <div className="mt-6 h-px w-10 bg-accent-primary/30 transition-all duration-500 group-hover:w-3/4 group-hover:bg-accent-primary/60" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
