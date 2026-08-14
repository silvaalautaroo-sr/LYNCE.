"use client";

import { useEffect, useRef } from "react";
import { INDUSTRIES, angleToUnitVector } from "@/lib/industries";
import { Noise2D, smoothstep, clamp } from "@/lib/noise";

/** RGB color reported per icon so the icon glass can tint itself. */
export type IconColorMap = Record<string, [number, number, number, number]>;

interface HeatFieldProps {
  /** Timestamp (performance.now) when the expansion (Stage 3) began. Null = not started. */
  startedAt: number | null;
  /** How long the initial expansion takes to reach full radius, in ms. */
  expansionDurationMs?: number;
  /** Icon ring radius, as a fraction of the container half-size. */
  ringRadius?: number;
  /** Internal simulation resolution. Lower = faster; the CSS blur hides the pixels. */
  gridSize?: number;
  /** Called (throttled) with the heat color currently under each icon. */
  onIconColors?: (colors: IconColorMap) => void;
}

/* ------------------------------------------------------------------ *
 * WHAT THE FIELD ENCODES
 *
 * 1. Where the data concentrates -> a dominant core, plus energy
 *    packets that travel from each industry inward to that core.
 * 2. Which zones take the most impact -> per-sector intensity; the
 *    priority industries burn hotter than the rest.
 * 3. Which variables are most connected -> a heat CHANNEL between the
 *    core and each industry. Channel width and brightness encode the
 *    strength of that link.
 * 4. How an urban scenario shifts -> every sector runs its own slow,
 *    phase-shifted cycle, so the map keeps migrating instead of just
 *    pulsing in place.
 *
 * All four are tunable from the constants below.
 * ------------------------------------------------------------------ */

const CORE_INTENSITY = 1.75;
const CORE_SIGMA = 0.32;

// Per-sector concentration (impact zone)
const SECTOR_INTENSITY_PRIORITY = 0.55;
const SECTOR_INTENSITY_NORMAL = 0.2;
const SECTOR_SIGMA_PRIORITY = 0.26;
const SECTOR_SIGMA_NORMAL = 0.18;

// Connection channel core <-> sector (how strongly the variables are linked).
// Kept deliberately WIDE: the canvas is blurred heavily on the way to the
// screen, and thin channels get washed out completely.
const CHANNEL_SIGMA = 0.14;
const CHANNEL_INTENSITY_PRIORITY = 0.55;
const CHANNEL_INTENSITY_NORMAL = 0.18;
const CHANNEL_TAPER = 0.35; // channel fades slightly toward the outer end

// Data packets travelling along the channel, industry -> core.
const PULSE_SPEED = 0.2; // laps per second
const PULSE_LENGTH_SIGMA = 0.09; // along the channel
const PULSE_RADIUS_SIGMA = 0.11; // across the channel
const PULSE_INTENSITY_PRIORITY = 0.6;
const PULSE_INTENSITY_NORMAL = 0.25;

// Scenario drift: each sector breathes on its own slow, offset cycle.
const SCENARIO_SPEED = 0.18;
const SCENARIO_DEPTH = 0.28;

const VALUE_NORMALIZER = 2.2; // maps accumulated field value into 0..1

// Colormap sampled from the reference sketch: value 0 (outer edge) -> 1 (core).
// Indigo rim -> purple -> magenta -> amber -> deep orange -> warm orange core.
const COLOR_STOPS: { t: number; rgb: [number, number, number]; a: number }[] = [
  { t: 0.0, rgb: [40, 0, 90], a: 0.0 },
  { t: 0.08, rgb: [72, 18, 198], a: 0.42 },
  { t: 0.18, rgb: [88, 12, 176], a: 0.68 },
  { t: 0.27, rgb: [110, 18, 150], a: 0.8 },
  { t: 0.36, rgb: [161, 66, 151], a: 0.87 },
  { t: 0.45, rgb: [189, 89, 144], a: 0.9 },
  { t: 0.55, rgb: [184, 110, 60], a: 0.93 },
  { t: 0.64, rgb: [182, 128, 14], a: 0.95 },
  { t: 0.78, rgb: [178, 84, 32], a: 0.97 },
  { t: 0.89, rgb: [196, 92, 18], a: 0.99 },
  { t: 1.0, rgb: [245, 150, 78], a: 1.0 },
];

function sampleColor(t: number): [number, number, number, number] {
  const v = clamp(t, 0, 1);
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const a = COLOR_STOPS[i];
    const b = COLOR_STOPS[i + 1];
    if (v >= a.t && v <= b.t) {
      const span = b.t - a.t || 1;
      const f = (v - a.t) / span;
      return [
        a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f,
        a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f,
        a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f,
        a.a + (b.a - a.a) * f,
      ];
    }
  }
  return [245, 150, 78, 1];
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

/** One industry node: its concentration blob plus its link back to the core. */
interface Sector {
  id: string;
  x: number;
  y: number;
  invL2: number; // 1 / |pos|^2, for projecting a point onto the channel
  priority: boolean;
  phase: number; // scenario-cycle offset, so sectors peak at different times
  twoSigmaSq: number;
  sectorCut: number; // squared distance beyond which the blob is negligible
  sectorIntensity: number;
  channelIntensity: number;
  pulseIntensity: number;
}

// Precomputed constants for the inner loop.
const TWO_CHANNEL_SIGMA_SQ = 2 * CHANNEL_SIGMA * CHANNEL_SIGMA;
const CHANNEL_CUT = (3 * CHANNEL_SIGMA) ** 2;
const TWO_PULSE_LEN_SQ = 2 * PULSE_LENGTH_SIGMA * PULSE_LENGTH_SIGMA;
const TWO_PULSE_RAD_SQ = 2 * PULSE_RADIUS_SIGMA * PULSE_RADIUS_SIGMA;
const PULSE_LEN_CUT = (3 * PULSE_LENGTH_SIGMA) ** 2;
const TWO_CORE_SIGMA_SQ = 2 * CORE_SIGMA * CORE_SIGMA;

export default function HeatField({
  startedAt,
  expansionDurationMs = 2600,
  ringRadius = 0.8,
  gridSize = 96,
  onIconColors,
}: HeatFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const noiseA = useRef(new Noise2D(11));
  const noiseB = useRef(new Noise2D(97));
  const noiseEdge = useRef(new Noise2D(453));
  const lastColorPush = useRef(0);

  const sectors = useRef<Sector[]>(
    INDUSTRIES.map((industry, i) => {
      const { x, y } = angleToUnitVector(industry.angleDeg);
      const px = x * ringRadius;
      const py = y * ringRadius;
      const sigma = industry.priority
        ? SECTOR_SIGMA_PRIORITY
        : SECTOR_SIGMA_NORMAL;
      return {
        id: industry.id,
        x: px,
        y: py,
        invL2: 1 / Math.max(px * px + py * py, 1e-6),
        priority: industry.priority,
        // Golden-ratio spacing keeps the peaks from lining up into a wave.
        phase: (i * 2.399963) % (Math.PI * 2),
        twoSigmaSq: 2 * sigma * sigma,
        sectorCut: (3 * sigma) ** 2,
        sectorIntensity: industry.priority
          ? SECTOR_INTENSITY_PRIORITY
          : SECTOR_INTENSITY_NORMAL,
        channelIntensity: industry.priority
          ? CHANNEL_INTENSITY_PRIORITY
          : CHANNEL_INTENSITY_NORMAL,
        pulseIntensity: industry.priority
          ? PULSE_INTENSITY_PRIORITY
          : PULSE_INTENSITY_NORMAL,
      };
    })
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    canvas.width = gridSize;
    canvas.height = gridSize;
    const imageData = ctx.createImageData(gridSize, gridSize);
    const data = imageData.data;

    // Per-frame sector weights, allocated once and reused.
    const scenarioWeight = new Float32Array(sectors.current.length);
    const pulsePos = new Float32Array(sectors.current.length);

    /**
     * Accumulated heat at a (already noise-warped) point: core + sector
     * concentrations + connection channels + travelling data packets.
     */
    const fieldValue = (wx: number, wy: number, priorityRamp: number) => {
      let value =
        CORE_INTENSITY * Math.exp(-(wx * wx + wy * wy) / TWO_CORE_SIGMA_SQ);

      const list = sectors.current;
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const w = scenarioWeight[i];

        // --- concentration blob (impact zone) ---
        const dx = wx - s.x;
        const dy = wy - s.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < s.sectorCut) {
          const boost = s.priority ? 1 + priorityRamp * 0.9 : 1;
          value += s.sectorIntensity * w * boost * Math.exp(-d2 / s.twoSigmaSq);
        }

        // --- connection channel (how linked this variable is) ---
        // Project the point onto the core->sector segment.
        const tp = clamp((wx * s.x + wy * s.y) * s.invL2, 0, 1);
        const cdx = wx - tp * s.x;
        const cdy = wy - tp * s.y;
        const cd2 = cdx * cdx + cdy * cdy;
        if (cd2 < CHANNEL_CUT) {
          const across = Math.exp(-cd2 / TWO_CHANNEL_SIGMA_SQ);
          value += s.channelIntensity * w * (1 - CHANNEL_TAPER * tp) * across;

          // --- data packet travelling inward along the channel ---
          const dp = tp - pulsePos[i];
          const dp2 = dp * dp;
          if (dp2 < PULSE_LEN_CUT) {
            value +=
              s.pulseIntensity *
              Math.exp(-dp2 / TWO_PULSE_LEN_SQ) *
              Math.exp(-cd2 / TWO_PULSE_RAD_SQ);
          }
        }
      }
      return value;
    };

    const render = (now: number) => {
      rafRef.current = requestAnimationFrame(render);
      if (startedAt === null) return;

      const elapsedMs = now - startedAt;
      const t = elapsedMs / 1000;
      const expansionT = clamp(elapsedMs / expansionDurationMs, 0, 1);
      const expansionEase = easeOutCubic(expansionT);

      const maxRadius = ringRadius * 1.25;
      const currentRadius = maxRadius * expansionEase;

      const priorityRamp = clamp(
        (t - (expansionDurationMs / 1000) * 0.5) / 1.6,
        0,
        1
      );

      // Scenario drift + packet positions, computed once per frame.
      const list = sectors.current;
      for (let i = 0; i < list.length; i++) {
        scenarioWeight[i] =
          1 -
          SCENARIO_DEPTH +
          SCENARIO_DEPTH * Math.sin(t * SCENARIO_SPEED + list[i].phase);
        // Packets run from the industry (1) toward the core (0).
        pulsePos[i] = 1 - ((t * PULSE_SPEED + i * 0.083) % 1);
      }

      // Global breathing + slow radius wobble: the settled field never freezes.
      const breathe = 0.93 + 0.07 * Math.sin(t * 0.7);
      const idleRadiusWobble = expansionEase * 0.03 * Math.sin(t * 0.45 + 1.3);

      const nA = noiseA.current;
      const nB = noiseB.current;
      const nEdge = noiseEdge.current;

      let idx = 0;
      for (let j = 0; j < gridSize; j++) {
        const ny = (j / (gridSize - 1)) * 2 - 1;
        for (let i = 0; i < gridSize; i++) {
          const nx = (i / (gridSize - 1)) * 2 - 1;

          // Domain warp keeps the whole field fluid rather than geometric.
          const warpAmt = 0.17;
          const wx =
            nx + nA.fbm(nx * 1.6 + t * 0.06, ny * 1.6 - t * 0.05, 3) * warpAmt;
          const wy =
            ny + nB.fbm(nx * 1.6 - t * 0.05, ny * 1.6 + t * 0.07, 3) * warpAmt;

          const distFromCenter = Math.sqrt(nx * nx + ny * ny);
          const edgeNoise =
            nEdge.fbm(nx * 2.2 + t * 0.14, ny * 2.2 + t * 0.11, 3) * 0.17;
          const localRadius = Math.max(
            0.05,
            currentRadius + edgeNoise + idleRadiusWobble
          );
          const mask =
            1 - smoothstep(localRadius * 0.72, localRadius, distFromCenter);

          if (mask <= 0.001) {
            const p = idx * 4;
            data[p] = 0;
            data[p + 1] = 0;
            data[p + 2] = 0;
            data[p + 3] = 0;
            idx++;
            continue;
          }

          const value = fieldValue(wx, wy, priorityRamp) * mask * breathe;
          const t01 = clamp(value / VALUE_NORMALIZER, 0, 1);
          const [r, g, b, a] = sampleColor(t01);

          const p = idx * 4;
          data[p] = r;
          data[p + 1] = g;
          data[p + 2] = b;
          data[p + 3] = a * 255 * mask;
          idx++;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // --- Report per-icon colors (throttled to ~12fps) ----------------
      if (onIconColors && now - lastColorPush.current > 80) {
        lastColorPush.current = now;
        const colors: IconColorMap = {};
        for (const s of list) {
          const wx =
            s.x + nA.fbm(s.x * 1.6 + t * 0.06, s.y * 1.6 - t * 0.05, 3) * 0.17;
          const wy =
            s.y + nB.fbm(s.x * 1.6 - t * 0.05, s.y * 1.6 + t * 0.07, 3) * 0.17;
          const dist = Math.sqrt(s.x * s.x + s.y * s.y);
          const edgeNoise =
            nEdge.fbm(s.x * 2.2 + t * 0.14, s.y * 2.2 + t * 0.11, 3) * 0.17;
          const localRadius = Math.max(
            0.05,
            currentRadius + edgeNoise + idleRadiusWobble
          );
          const mask = 1 - smoothstep(localRadius * 0.72, localRadius, dist);
          const value = fieldValue(wx, wy, priorityRamp) * mask * breathe;
          const t01 = clamp(value / VALUE_NORMALIZER, 0, 1);
          const [r, g, b] = sampleColor(t01);
          colors[s.id] = [r, g, b, clamp(mask * (0.35 + t01 * 0.65), 0, 1)];
        }
        onIconColors(colors);
      }
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, expansionDurationMs, gridSize, ringRadius, onIconColors]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700"
      style={{
        opacity: startedAt !== null ? 1 : 0,
        filter: "blur(16px) saturate(1.15)",
        mixBlendMode: "screen",
      }}
      aria-hidden="true"
    />
  );
}
