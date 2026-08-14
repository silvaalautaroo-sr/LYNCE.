import { HeroCity } from "@/components/sections/HeroCity";
import { SectionUSP } from "@/components/sections/SectionUSP";
import { SectionIntro } from "@/components/sections/SectionIntro";
import { SectionProblemVision } from "@/components/sections/SectionProblemVision";
import { SectionWhereWeStart } from "@/components/sections/SectionWhereWeStart";
import { SectionCityBuild } from "@/components/sections/SectionCityBuild";
import { SectionApplicationCases } from "@/components/sections/SectionApplicationCases";
import { SectionUrbanIntelligence } from "@/components/sections/SectionUrbanIntelligence";
import { SectionTeam } from "@/components/sections/SectionTeam";
import { SectionCTA } from "@/components/sections/SectionCTA";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <HeroCity />

      {/* USP — directly beneath the hero across the page width */}
      <SectionUSP />

      {/* 1 · Section: ¿Qué es Lynce? */}
      <SectionIntro />

      {/* 2 · Where we start (metrics + product benefits) */}
      <SectionWhereWeStart />

      {/* 3 · Application Cases (Casos de aplicación) */}
      <SectionApplicationCases />

      {/* 4 · The city comes to life (canvas build + digital twin) */}
      <SectionCityBuild />

      {/* 5 · Built on urban intelligence */}
      <SectionUrbanIntelligence />

      {/* 5 · Connecting the Smart City ecosystem (Problem + Vision / convergence network) */}
      <SectionProblemVision />

      {/* 6 · Team */}
      <SectionTeam />

      {/* 7 · CTA — schedule a meeting / contact us */}
      <SectionCTA />
    </>
  );
}
