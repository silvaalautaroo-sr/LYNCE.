import { HeroCity } from "@/components/sections/HeroCity";
import { Section1Problem } from "@/components/sections/Section1Problem";
import { Section2Ecosystem } from "@/components/sections/Section2Ecosystem";
import { Section3Platform } from "@/components/sections/Section3Platform";
import { Section4OwnSolutions } from "@/components/sections/Section4OwnSolutions";
import { Section5Technology } from "@/components/sections/Section5Technology";
import { Section6Vision } from "@/components/sections/Section6Vision";
import { SectionContact } from "@/components/sections/SectionContact";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <>
      <HeroCity />
      
      {/* Nueva frase bajo hero */}
      <motion.div 
        className="w-full py-8 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.p
          className="mx-auto max-w-4xl px-6"
          style={{
            fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
            lineHeight: 1.4,
            color: "var(--ink-muted)",
            fontWeight: 400,
          }}
        >
          <span style={{ fontStyle: "italic", fontWeight: 900 }} className="hero-word-gradient">
            Simula
          </span>
          {" "}el impacto de proyectos urbanos antes de construirlos.
        </motion.p>
      </motion.div>

      {/* NUEVO ORDEN DE SECCIONES */}
      <Section1Problem />
      <Section2Ecosystem />
      <Section3Platform />
      <Section4OwnSolutions />
      <Section5Technology />
      <Section6Vision />
      <SectionContact />
    </>
  );
}
