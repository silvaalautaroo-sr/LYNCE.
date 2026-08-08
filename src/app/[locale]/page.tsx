import { HeroCity } from "@/components/sections/HeroCity";
import { SectionIntro } from "@/components/sections/SectionIntro";
import { SectionProblemVision } from "@/components/sections/SectionProblemVision";
import { SectionWhereWeStart } from "@/components/sections/SectionWhereWeStart";
import { SectionCityBuild } from "@/components/sections/SectionCityBuild";
import { SectionUrbanIntelligence } from "@/components/sections/SectionUrbanIntelligence";
import { SectionCTA } from "@/components/sections/SectionCTA";

export default function HomePage() {
  return (
    <>
      {/* Hero — unchanged */}
      <HeroCity />

      {/* 1 · Intro statement below the hero */}
      <SectionIntro />

      {/* 2 · Problem + Vision (convergence network) */}
      <SectionProblemVision />

      {/* 3 · Where we start (metrics + flip cards) */}
      <SectionWhereWeStart />

      {/* 4 · The city comes to life (canvas build + digital twin) */}
      <SectionCityBuild />

      {/* 5 · Built on urban intelligence */}
      <SectionUrbanIntelligence />

      {/* 6 · CTA — schedule a meeting / contact us */}
      <SectionCTA />
    </>
  );
}
