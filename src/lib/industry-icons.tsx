/**
 * Minimal outline icon set, drawn by hand as plain SVG paths.
 * Style: 24x24 viewBox, stroke = currentColor, no fill, 1.6 stroke width,
 * rounded joins — matches the reference glassmorphism circles (white,
 * simple, outline only, nothing decorative inside).
 */

import { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function GovernmentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10.5 12 5l8 5.5" />
      <path d="M5 10.5v8M9 10.5v8M15 10.5v8M19 10.5v8" />
      <path d="M3.5 18.5h17" />
      <path d="M3.5 21h17" />
    </svg>
  );
}

export function ConstructionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 16.5c0-4.7 3.6-8.5 8-8.5s8 3.8 8 8.5" />
      <path d="M3 16.5h18" />
      <path d="M12 8v-2" />
    </svg>
  );
}

export function AgricultureIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20V10" />
      <path d="M12 10c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Z" />
      <path d="M12 13c0-3 2.2-5.2 5.2-5.2 0 3-2.2 5.2-5.2 5.2Z" />
    </svg>
  );
}

export function AutomotiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 16v-3.2L6 9h12l2 3.8V16" />
      <path d="M4 16h16" />
      <path d="M4 16v2M20 16v2" />
      <circle cx="7.5" cy="16" r="1.4" />
      <circle cx="16.5" cy="16" r="1.4" />
    </svg>
  );
}

export function DigitalTwinsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 19 7.5v9L12 20.5 5 16.5v-9L12 3.5Z" />
      <path d="M12 3.5v17M5 7.5l7 4 7-4" />
    </svg>
  );
}

export function ArtificialIntelligenceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M18.5 5.5l-2.8 2.8M5.5 18.5l2.8-2.8M18.5 18.5l-2.8-2.8" />
    </svg>
  );
}

export function SustainabilityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6 20c-1-6 2.5-13 12-14 1 8-4 13-12 14Z" />
      <path d="M6.5 19.5 16 10" />
    </svg>
  );
}

export function EnergyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12.5 3 5 13.5h5.5L11 21l7.5-10.5H13L12.5 3Z" />
    </svg>
  );
}

export function SecurityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-2.5Z" />
      <path d="M9.2 12 11 13.8 15 9.8" />
    </svg>
  );
}

export function ConnectivityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 10.5a11 11 0 0 1 15 0" />
      <path d="M7.5 13.7a7 7 0 0 1 9 0" />
      <path d="M10.5 16.8a3 3 0 0 1 3 0" />
      <circle cx="12" cy="19.2" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MapsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4.5 4.5 6v13.5L9 18l6 1.5 4.5-1.5V4.5L15 6 9 4.5Z" />
      <path d="M9 4.5V18M15 6v13.5" />
    </svg>
  );
}

export function MobilityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M6 17 9.5 9h3l3 8M9.5 9H8M12.5 9l3.5 3.5H18" />
    </svg>
  );
}
