"use client";

import { useEffect, useRef } from "react";

interface CityBuildCanvasProps {
  theme: "dark" | "light";
  /** Fired once when the build reaches the digital-twin stage (progress > 0.9). */
  onTwinReady?: () => void;
}

/* ============================================================================
 * MANHATTAN — DIGITAL TWIN
 *
 * This is not a generic city: it reconstructs Manhattan's real geometry
 * procedurally (no imagery, no copyright, a few KB):
 *   · the commissioners' grid — avenues ~3.5x farther apart than streets
 *   · Central Park at its true footprint: 59th->110th St, 5th->8th Ave (~1:5)
 *   · the Hudson and the East River flanking the island
 *   · Broadway slicing diagonally across the grid
 *   · Manhattan's real height profile (Midtown spikes, lower uptown)
 *
 * The sequence tells the digital-twin story literally:
 *   1. SATELLITE — flat, top-down, desaturated "imagery" plate
 *   2. SCAN      — a sweep line vectorizes imagery into wireframe footprints
 *   3. EXTRUDE   — the camera tilts and the footprints rise into volumes
 *   4. LIFE      — park, traffic, pedestrians, dusk lighting
 *   5. TWIN      — live data indicators over the model
 * ========================================================================== */

interface Palette {
  water: string;
  land: string;
  satBlock: string;
  wire: string;
  faceL: string;
  faceR: string;
  top: string;
  park: string;
  accent: string;
  accent2: string;
  window: string;
  ped: string;
}

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    water: "#050a11",
    land: "#0a1119",
    satBlock: "#243040",
    wire: "#18c29c",
    faceL: "#0e1826",
    faceR: "#14243a",
    top: "#1d3a52",
    park: "#1c6b52",
    accent: "#18c29c",
    accent2: "#53e4e1",
    window: "#7ff0dc",
    ped: "#9fb4c9",
  },
  light: {
    water: "#dbe6f2",
    land: "#eef2f7",
    satBlock: "#c3cdd9",
    wire: "#e8834f",
    faceL: "#c4d0de",
    faceR: "#d6dfea",
    top: "#eef3fa",
    park: "#8fc4a6",
    accent: "#e8834f",
    accent2: "#f2739c",
    window: "#f7b98e",
    ped: "#8a6f66",
  },
};

/* Manhattan reference frame:
 * u = avenue axis (0 ~ 1st Ave / East River, 11.5 ~ 12th Ave / Hudson)
 * v = street number (34th -> 122nd: Midtown up through Harlem)
 */
const AVE = 3.5; // avenues are ~3.5x farther apart than streets
const V0 = 34;
const V1 = 122;
const VSTEP = 2; // one block spans 2 street numbers
const PARK = { u0: 5, u1: 8, v0: 59, v1: 110 };
const ROT = (-72 * Math.PI) / 180; // lay the island diagonally across a 16:9 frame
const PITCH_END = 0.62; // final camera tilt (0 = top-down / satellite)
const UC = 5.75; // world centre (u)

const rnd = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const seg = (p: number, s: number, e: number) => clamp((p - s) / (e - s));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Shoreline: drifts organically and the island narrows uptown. */
const westEdge = (v: number) =>
  11.5 - Math.max(0, (v - 96) * 0.02) + Math.sin(v * 0.09) * 0.16;
const eastEdge = (v: number) =>
  0.2 + Math.max(0, (v - 100) * 0.02) + Math.sin(v * 0.11 + 1.7) * 0.14;

/** Broadway drifts west as it climbs north (crosses 7th Ave around 45th). */
const broadwayU = (v: number) => clamp(5.6 + (v - 34) * 0.055, 4, 9.4);

/** Real-ish skyline: Midtown towers, lower uptown, avenues taller. */
const heightAt = (u: number, v: number) => {
  const midtown = Math.exp(-Math.pow((v - 48) / 13, 2));
  const upper = Math.exp(-Math.pow((v - 86) / 26, 2)) * 0.34;
  const avenueBoost = Math.abs(u - Math.round(u)) < 0.28 ? 0.22 : 0;
  const base = 0.16 + midtown + upper + avenueBoost;
  return base * (0.55 + rnd(u * 7.3, v * 1.9) * 0.95);
};

interface Block {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  h: number;
  park: boolean;
  lit: boolean;
  order: number; // position along the scan sweep (0..1)
  depth: number; // painter's-order key (constant: depends only on rotation)
}

export function CityBuildCanvas({ theme, onTwinReady }: CityBuildCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const twinFired = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pal = PALETTES[theme];

    const cosR = Math.cos(ROT);
    const sinR = Math.sin(ROT);
    const VC = (V0 + V1) / 2;

    /* ── build Manhattan once ─────────────────────────────────────────────── */
    const blocks: Block[] = [];
    for (let v = V0; v < V1; v += VSTEP) {
      const uW = westEdge(v);
      const uE = eastEdge(v);
      for (let u = Math.ceil(uE); u < Math.floor(uW); u++) {
        const inPark = u >= PARK.u0 && u < PARK.u1 && v >= PARK.v0 && v < PARK.v1;
        const cu = u + 0.5;
        const cv = v + VSTEP / 2;
        // Painter's order key: rotated y. Tilt only scales it, so it's constant.
        const depth =
          (cu - UC) * AVE * sinR + (cv - VC) * cosR;
        blocks.push({
          u0: u + 0.12,
          u1: u + 0.88, // the gap between blocks IS the avenue
          v0: v + 0.25,
          v1: v + VSTEP - 0.25, // the gap IS the street
          h: inPark ? 0 : heightAt(u, v),
          park: inPark,
          lit: rnd(u * 3.1, v * 5.7) > 0.35,
          order: (v - V0) / (V1 - V0),
          depth,
        });
      }
    }
    blocks.sort((a, b) => a.depth - b.depth); // far -> near, once

    // Traffic: mostly up/down the avenues, some crosstown.
    const vehicles = Array.from({ length: 26 }, (_, i) => {
      const avenue = i % 3 !== 0;
      return {
        avenue,
        lane: avenue
          ? Math.floor(rnd(i, 1) * 11) + 0.5
          : Math.floor(rnd(i, 2) * ((V1 - V0) / 8)) * 8 + V0,
        t: rnd(i, 3),
        spd: 0.06 + rnd(i, 4) * 0.08,
        dir: rnd(i, 5) > 0.5 ? 1 : -1,
      };
    });
    const peds = Array.from({ length: 30 }, (_, i) => ({
      lane: Math.floor(rnd(i, 6) * 11) + 0.5,
      v: V0 + rnd(i, 7) * (V1 - V0),
      t: rnd(i, 8),
      spd: 0.02 + rnd(i, 9) * 0.02,
      dir: rnd(i, 10) > 0.5 ? 1 : -1,
    }));

    // Live-data pins over notable spots.
    const pins = [
      { u: 6.5, v: 44 },
      { u: 3.5, v: 52 },
      { u: 8.5, v: 66 },
      { u: 4.5, v: 96 },
    ];

    let W = 0;
    let H = 0;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let pitch = 0;

    // world (u, v, z) -> rotated plan -> tilted screen
    const proj = (u: number, v: number, z = 0) => {
      const x = (u - UC) * AVE;
      const y = v - VC;
      const rx = x * cosR - y * sinR;
      const ry = x * sinR + y * cosR;
      return {
        x: ox + rx * scale,
        y: oy + ry * Math.cos(pitch) * scale - z * Math.sin(pitch) * scale,
      };
    };

    const fit = () => {
      const pts: { x: number; y: number }[] = [];
      for (const [u, v] of [
        [0, V0],
        [11.5, V0],
        [0, V1],
        [11.5, V1],
      ]) {
        const x = (u - UC) * AVE;
        const y = v - VC;
        pts.push({
          x: x * cosR - y * sinR,
          y: (x * sinR + y * cosR) * Math.cos(PITCH_END),
        });
      }
      const spanX =
        Math.max(...pts.map((q) => q.x)) - Math.min(...pts.map((q) => q.x));
      const spanY =
        Math.max(...pts.map((q) => q.y)) - Math.min(...pts.map((q) => q.y));
      scale = Math.min((W * 0.92) / spanX, (H * 0.74) / spanY);
      ox = W / 2;
      oy = H / 2 + H * 0.08;
    };

    let dpr = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fit();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    type Pt = { x: number; y: number };
    const poly = (pts: Pt[], fill?: string, stroke?: string, lw = 1) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
    };

    const start = performance.now();
    const DURATION = 11000;
    let raf = 0;

    const draw = (now: number) => {
      const p = clamp((now - start) / DURATION);
      const time = now / 1000;

      if (!twinFired.current && p > 0.9) {
        twinFired.current = true;
        onTwinReady?.();
      }

      // Camera lifts from satellite (top-down) to oblique twin view.
      pitch = smooth(seg(p, 0.34, 0.62)) * PITCH_END;

      const sat = 1 - seg(p, 0.2, 0.44); // imagery fades as vectors take over
      const scan = seg(p, 0.16, 0.36); // the scanning sweep
      const rise = smooth(seg(p, 0.36, 0.66)); // extrusion
      const dusk = seg(p, 0.82, 0.95);

      ctx.clearRect(0, 0, W, H);

      /* water */
      ctx.fillStyle = pal.water;
      ctx.fillRect(0, 0, W, H);

      /* landmass + shoreline */
      const shore: Pt[] = [];
      for (let v = V0; v <= V1; v += 2) shore.push(proj(westEdge(v), v));
      for (let v = V1; v >= V0; v -= 2) shore.push(proj(eastEdge(v), v));
      poly(shore, pal.land);
      if (scan > 0) {
        ctx.globalAlpha = 0.35 * scan;
        poly(shore, undefined, pal.accent, 1);
        ctx.globalAlpha = 1;
      }

      /* blocks: imagery -> wireframe -> volumes */
      for (const b of blocks) {
        const foot: Pt[] = [
          proj(b.u0, b.v0),
          proj(b.u1, b.v0),
          proj(b.u1, b.v1),
          proj(b.u0, b.v1),
        ];

        // 1 · SATELLITE plate
        if (sat > 0.01) {
          const shade = 0.72 + rnd(b.u0, b.v0) * 0.42;
          ctx.globalAlpha = sat;
          poly(foot, shadeHex(b.park ? pal.park : pal.satBlock, shade));
          ctx.globalAlpha = 1;
        }

        const revealed = scan > b.order;
        if (!revealed) continue;

        // 2 · WIREFRAME footprint
        const wireA = clamp((scan - b.order) * 6) * (1 - rise * 0.7);
        if (wireA > 0.01) {
          ctx.globalAlpha = wireA * 0.9;
          poly(foot, undefined, pal.wire, 1);
          ctx.globalAlpha = 1;
        }

        // 3 · EXTRUSION
        if (b.park) {
          ctx.globalAlpha = clamp(rise * 1.2);
          poly(foot, pal.park);
          ctx.globalAlpha = 1;
          continue;
        }

        const z = b.h * rise * 5.6;
        if (z < 0.05) continue;

        const top: Pt[] = [
          proj(b.u0, b.v0, z),
          proj(b.u1, b.v0, z),
          proj(b.u1, b.v1, z),
          proj(b.u0, b.v1, z),
        ];

        for (let i = 0; i < 4; i++) {
          const j = (i + 1) % 4;
          const dy = foot[j].y - foot[i].y;
          if (Math.abs(dy) < 0.01) continue;
          poly([foot[i], foot[j], top[j], top[i]], dy > 0 ? pal.faceR : pal.faceL);
        }
        poly(top, shadeHex(pal.top, 0.85 + rnd(b.v0, b.u0) * 0.3));

        // dusk: lights come on
        if (dusk > 0 && b.lit && z > 1) {
          const c = proj((b.u0 + b.u1) / 2, (b.v0 + b.v1) / 2, z * 0.55);
          const tw = 0.55 + 0.45 * Math.sin(time * 2 + b.u0 * 3 + b.v0);
          ctx.globalAlpha = dusk * tw * 0.8;
          ctx.fillStyle = pal.window;
          ctx.fillRect(c.x - 1.4, c.y - 1.4, 2.8, 2.8);
          ctx.globalAlpha = 1;
        }
      }

      /* Broadway — the diagonal that breaks the grid */
      if (scan > 0.15) {
        ctx.globalAlpha = clamp(scan) * (0.35 + 0.4 * rise);
        ctx.strokeStyle = pal.accent2;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let v = V0; v <= V1; v += 2) {
          const s = proj(broadwayU(v), v);
          if (v === V0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      /* SCAN LINE — imagery becoming vector */
      if (p > 0.14 && scan < 1) {
        const v = V0 + scan * (V1 - V0);
        const a = proj(-1.8, v);
        const c = proj(13.3, v);
        const g = ctx.createLinearGradient(a.x, a.y, c.x, c.y);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.5, pal.accent2);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = pal.accent2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      /* traffic */
      const vehR = seg(p, 0.66, 0.76);
      if (vehR > 0) {
        for (const car of vehicles) {
          car.t = (car.t + car.spd * 0.016 * car.dir + 1) % 1;
          const u = car.avenue ? car.lane : 0.5 + car.t * 10.5;
          const v = car.avenue ? V0 + car.t * (V1 - V0) : car.lane;
          const s = proj(u, v, 0.2);
          ctx.globalAlpha = vehR;
          ctx.fillStyle = car.avenue ? pal.accent2 : pal.accent;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      /* pedestrians */
      const pedR = seg(p, 0.74, 0.84);
      if (pedR > 0) {
        for (const pd of peds) {
          pd.t = (pd.t + pd.spd * 0.016 * pd.dir + 1) % 1;
          const vv = V0 + ((pd.v - V0 + pd.t * 24) % (V1 - V0));
          const s = proj(pd.lane, vv, 0.1);
          ctx.globalAlpha = pedR * 0.75;
          ctx.fillStyle = pal.ped;
          ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
          ctx.globalAlpha = 1;
        }
      }

      /* digital-twin indicators */
      const twinR = seg(p, 0.88, 1);
      if (twinR > 0) {
        pins.forEach((pin, i) => {
          const z = heightAt(pin.u, pin.v) * 5.6 + 1.5;
          const s = proj(pin.u, pin.v, z);
          const base = proj(pin.u, pin.v, 0);
          const pulse = 0.5 + 0.5 * Math.sin(time * 2.4 + i);
          ctx.globalAlpha = twinR;
          ctx.strokeStyle = "rgba(var(--accent-primary-rgb),0.35)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(base.x, base.y);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
          ctx.strokeStyle = pal.accent2;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 3.5 + pulse * 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = pal.accent2;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [theme, onTwinReady]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}

/** Multiply a hex colour by a shade factor. */
function shadeHex(hex: string, f: number) {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * f));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * f));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * f));
  return `rgb(${r},${g},${b})`;
}
