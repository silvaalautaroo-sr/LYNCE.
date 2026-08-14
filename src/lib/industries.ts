import type { ComponentType, SVGProps } from "react";
import {
  AgricultureIcon,
  ArtificialIntelligenceIcon,
  AutomotiveIcon,
  ConnectivityIcon,
  ConstructionIcon,
  DigitalTwinsIcon,
  EnergyIcon,
  GovernmentIcon,
  MapsIcon,
  MobilityIcon,
  SecurityIcon,
  SustainabilityIcon,
} from "@/lib/industry-icons";

export interface Industry {
  id: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  angleDeg: number;
  priority: boolean;
}

export const INDUSTRIES: Industry[] = [
  { id: "automotive", Icon: AutomotiveIcon, angleDeg: 0, priority: false },
  { id: "digital-twins", Icon: DigitalTwinsIcon, angleDeg: 30, priority: true },
  { id: "ai", Icon: ArtificialIntelligenceIcon, angleDeg: 60, priority: true },
  { id: "sustainability", Icon: SustainabilityIcon, angleDeg: 90, priority: true },
  { id: "energy", Icon: EnergyIcon, angleDeg: 120, priority: false },
  { id: "security", Icon: SecurityIcon, angleDeg: 150, priority: false },
  { id: "maps", Icon: MapsIcon, angleDeg: 180, priority: false },
  { id: "connectivity", Icon: ConnectivityIcon, angleDeg: 210, priority: false },
  { id: "government", Icon: GovernmentIcon, angleDeg: 240, priority: false },
  { id: "construction", Icon: ConstructionIcon, angleDeg: 270, priority: false },
  { id: "mobility", Icon: MobilityIcon, angleDeg: 300, priority: false },
  { id: "agriculture", Icon: AgricultureIcon, angleDeg: 330, priority: false },
];

export function angleToUnitVector(angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: Math.cos(rad), y: Math.sin(rad) };
}
