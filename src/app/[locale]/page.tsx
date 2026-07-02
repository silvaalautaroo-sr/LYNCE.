import { HeroCity } from "@/components/sections/HeroCity";
import { Section1Problem } from "@/components/sections/Section1Problem";
import { Section2Ecosystem } from "@/components/sections/Section2Ecosystem";
import { Section3Platform } from "@/components/sections/Section3Platform";
import { Section4OwnSolutions } from "@/components/sections/Section4OwnSolutions";
import { Section5Technology } from "@/components/sections/Section5Technology";
import { Section6Vision } from "@/components/sections/Section6Vision";

export default function HomePage() {
  return (
    <>
      <HeroCity />
      <Section1Problem />
      <Section2Ecosystem />
      <Section3Platform />
      <Section4OwnSolutions />
      <Section5Technology />
      <Section6Vision />
    </>
  );
}
