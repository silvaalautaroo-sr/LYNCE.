"use client";

import { useEffect, useRef } from "react";

interface CityBuildCanvasProps {
  theme: "dark" | "light";
  /** Fired once when the build reaches the digital-twin stage. */
  onTwinReady?: () => void;
  /**
   * Optional public-domain satellite photo (e.g. NASA/USGS imagery placed in
   * /public). Shown during the opening "satellite" phase, then vectorized.
   * The image should be a top-down crop with the island running vertically
   * (north up). If it renders mirrored, flip it in any editor.
   */
  satelliteImage?: string;
}

/* ============================================================================
 * MANHATTAN — DIGITAL TWIN
 *
 * Real geometry, built procedurally (no copyright, a few KB):
 *   · the commissioners' grid (avenues ~3.5x farther apart than streets)
 *   · Central Park at its true footprint (59th→110th, 5th→8th ≈ 1:5)
 *   · Hudson + East River, Broadway cutting the grid diagonally
 *   · Midtown height spike, lower uptown
 *
 * Sequence:
 *   1. SATELLITE — top-down imagery plate (optionally a real public-domain photo)
 *   2. SCAN      — a sweep vectorizes imagery into wireframe footprints
 *   3. EXTRUDE   — camera tilts, footprints rise into volumes
 *   4. LIFE      — traffic, pedestrians, dusk lights
 *   5. TWIN      — live data pins
 *   6. FOCUS     — camera ZOOMS into one building: it highlights, grows, and
 *      line-based measurements animate around it (bus trail, parking entries,
 *      sidewalk pedestrians, rooftop emissions, energy feed)
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

const AVE = 3.5;
const V0 = 34;
const V1 = 122;
const VSTEP = 2;
const PARK = { u0: 5, u1: 8, v0: 59, v1: 110 };
const ROT = (-72 * Math.PI) / 180;
const PITCH_END = 0.62;
const UC = 5.75;
const ZOOM = 2.15; // focus zoom factor
const FOCUS_U = 6; // analysed building: block column (6th Ave-ish)
const FOCUS_V = 44; // block row (≈ 44th St — Midtown)

const rnd = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const seg = (p: number, s: number, e: number) => clamp((p - s) / (e - s));
const smooth = (t: number) => t * t * (3 - 2 * t);

const westEdge = (v: number) =>
  11.5 - Math.max(0, (v - 96) * 0.02) + Math.sin(v * 0.09) * 0.16;
const eastEdge = (v: number) =>
  0.2 + Math.max(0, (v - 100) * 0.02) + Math.sin(v * 0.11 + 1.7) * 0.14;
const broadwayU = (v: number) => clamp(5.6 + (v - 34) * 0.055, 4, 9.4);

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
  cu: number;
  cv: number;
  h: number;
  park: boolean;
  lit: boolean;
  order: number;
  depth: number;
  focus: boolean;
}

function mixHex(c1: string, c2: string, t: number) {
  const p = (c: string) => [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
  const a = p(c1);
  const b = p(c2);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}
function shadeHex(hex: string, f: number) {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * f));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * f));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * f));
  return `rgb(${r},${g},${b})`;
}

export function CityBuildCanvas({
  theme,
  onTwinReady,
  satelliteImage,
}: CityBuildCanvasProps) {
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

    // Optional real satellite plate
    let img: HTMLImageElement | null = null;
    if (satelliteImage) {
      const im = new Image();
      im.src = satelliteImage;
      im.onload = () => {
        img = im;
      };
    }

    /* ── build Manhattan once ─────────────────────────────────────────────── */
    const blocks: Block[] = [];
    for (let v = V0; v < V1; v += VSTEP) {
      const uW = westEdge(v);
      const uE = eastEdge(v);
      for (let u = Math.ceil(uE); u < Math.floor(uW); u++) {
        const inPark = u >= PARK.u0 && u < PARK.u1 && v >= PARK.v0 && v < PARK.v1;
        const cu = u + 0.5;
        const cv = v + VSTEP / 2;
        blocks.push({
          u0: u + 0.12,
          u1: u + 0.88,
          v0: v + 0.25,
          v1: v + VSTEP - 0.25,
          cu,
          cv,
          h: inPark ? 0 : heightAt(u, v),
          park: inPark,
          lit: rnd(u * 3.1, v * 5.7) > 0.35,
          order: (v - V0) / (V1 - V0),
          depth: (cu - UC) * AVE * sinR + (cv - VC) * cosR,
          focus: u === FOCUS_U && v === FOCUS_V,
        });
      }
    }
    const focus = blocks.find((b) => b.focus)!;
    focus.h = Math.max(focus.h, 1.1); // make the analysed building a landmark
    focus.lit = true;
    blocks.sort((a, b) => a.depth - b.depth);

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
    // Sidewalk pedestrians around the focus block (analysis layer)
    const walkers = Array.from({ length: 7 }, (_, i) => ({
      side: i % 2, // 0 = south sidewalk, 1 = north
      t: rnd(i, 21),
      spd: 0.05 + rnd(i, 22) * 0.05,
      dir: rnd(i, 23) > 0.5 ? 1 : -1,
    }));

    const pins = [
      { u: 3.5, v: 52 },
      { u: 8.5, v: 66 },
      { u: 4.5, v: 96 },
    ];

    let W = 0;
    let H = 0;
    let baseScale = 1;
    let baseOx = 0;
    let baseOy = 0;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let pitch = 0;

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
      baseScale = Math.min((W * 0.92) / spanX, (H * 0.74) / spanY);
      baseOx = W / 2;
      baseOy = H / 2 + H * 0.08;
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

    /** A moving dot with a fading line trail (the "measurement line" motif). */
    const trailDot = (
      head: Pt,
      tail: Pt,
      color: string,
      width: number,
      alpha: number,
      dotR = 2
    ) => {
      const g = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, color);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = g;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(head.x, head.y);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(head.x, head.y, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const start = performance.now();
    const DURATION = 13000;
    let raf = 0;

    const draw = (now: number) => {
      const p = clamp((now - start) / DURATION);
      const time = now / 1000;

      if (!twinFired.current && p > 0.84) {
        twinFired.current = true;
        onTwinReady?.();
      }

      const scan = seg(p, 0.13, 0.3);
      const sat = 1 - seg(p, 0.17, 0.4);
      pitch = smooth(seg(p, 0.28, 0.52)) * PITCH_END;
      const rise = smooth(seg(p, 0.3, 0.58));
      const dusk = seg(p, 0.7, 0.82);
      const twinR = seg(p, 0.8, 0.88);
      const focusT = smooth(seg(p, 0.88, 1));

      /* camera: zoom + travel toward the focus building */
      scale = baseScale * (1 + (ZOOM - 1) * focusT);
      const fx = (focus.cu - UC) * AVE;
      const fy = focus.cv - VC;
      const frx = fx * cosR - fy * sinR;
      const fry = fx * sinR + fy * cosR;
      const fzMid = (focus.h * (1 + 0.35 * focusT) * 5.6) * 0.45;
      const desOx = W / 2 - frx * scale;
      const desOy =
        H * 0.56 - (fry * Math.cos(pitch) - fzMid * Math.sin(pitch)) * scale;
      ox = baseOx + (desOx - baseOx) * focusT;
      oy = baseOy + (desOy - baseOy) * focusT;

      ctx.clearRect(0, 0, W, H);

      /* water */
      ctx.fillStyle = pal.water;
      ctx.fillRect(0, 0, W, H);

      /* landmass */
      const shore: Pt[] = [];
      for (let v = V0; v <= V1; v += 2) shore.push(proj(westEdge(v), v));
      for (let v = V1; v >= V0; v -= 2) shore.push(proj(eastEdge(v), v));
      poly(shore, pal.land);
      if (scan > 0) {
        ctx.globalAlpha = 0.35 * scan;
        poly(shore, undefined, pal.accent, 1);
        ctx.globalAlpha = 1;
      }

      /* optional real satellite photo plate */
      if (img && sat > 0.01) {
        ctx.save();
        ctx.globalAlpha = sat * 0.92;
        ctx.translate(ox, oy);
        ctx.scale(scale, scale * Math.cos(pitch));
        ctx.rotate(ROT);
        ctx.scale(1, -1); // photo north-up → world v-up
        ctx.filter = "saturate(0.4) brightness(0.92)";
        const x0 = (0 - UC) * AVE - 1.5;
        const x1 = (11.5 - UC) * AVE + 1.5;
        const y0 = V0 - VC - 1.5;
        const y1 = V1 - VC + 1.5;
        ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0);
        ctx.filter = "none";
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      /* blocks: imagery → wireframe → volumes */
      const plateA = img ? 0.3 : 1;
      for (const b of blocks) {
        const foot: Pt[] = [
          proj(b.u0, b.v0),
          proj(b.u1, b.v0),
          proj(b.u1, b.v1),
          proj(b.u0, b.v1),
        ];

        if (sat > 0.01) {
          const shade = 0.72 + rnd(b.u0, b.v0) * 0.42;
          ctx.globalAlpha = sat * plateA;
          poly(foot, shadeHex(b.park ? pal.park : pal.satBlock, shade));
          ctx.globalAlpha = 1;
        }

        if (scan <= b.order) continue;

        const wireA = clamp((scan - b.order) * 6) * (1 - rise * 0.7);
        if (wireA > 0.01) {
          ctx.globalAlpha = wireA * 0.9;
          poly(foot, undefined, pal.wire, 1);
          ctx.globalAlpha = 1;
        }

        if (b.park) {
          ctx.globalAlpha = clamp(rise * 1.2);
          poly(foot, pal.park);
          ctx.globalAlpha = 1;
          continue;
        }

        const grow = b.focus ? 1 + 0.35 * focusT : 1;
        const z = b.h * rise * 5.6 * grow;
        if (z < 0.05) continue;

        const top: Pt[] = [
          proj(b.u0, b.v0, z),
          proj(b.u1, b.v0, z),
          proj(b.u1, b.v1, z),
          proj(b.u0, b.v1, z),
        ];

        // the analysed building shifts to the accent colour as we zoom in
        const fL = b.focus ? mixHex(pal.faceL, pal.accent, focusT * 0.55) : pal.faceL;
        const fR = b.focus ? mixHex(pal.faceR, pal.accent, focusT * 0.75) : pal.faceR;
        const fT = b.focus
          ? mixHex(pal.top, pal.accent, focusT * 0.9)
          : shadeHex(pal.top, 0.85 + rnd(b.v0, b.u0) * 0.3);

        for (let i = 0; i < 4; i++) {
          const j = (i + 1) % 4;
          const dy = foot[j].y - foot[i].y;
          if (Math.abs(dy) < 0.01) continue;
          poly([foot[i], foot[j], top[j], top[i]], dy > 0 ? fR : fL);
        }
        poly(top, fT);

        if (b.focus && focusT > 0.05) {
          // glowing outline + pulsing rooftop ring on the analysed building
          ctx.globalAlpha = focusT;
          ctx.shadowBlur = 16;
          ctx.shadowColor = pal.accent2;
          poly(top, undefined, pal.accent2, 1.4);
          ctx.shadowBlur = 0;
          const c = proj(b.cu, b.cv, z);
          const pulse = 0.5 + 0.5 * Math.sin(time * 2.6);
          ctx.strokeStyle = pal.accent2;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 4 + pulse * 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (dusk > 0 && b.lit && z > 1 && !b.focus) {
          const c = proj(b.cu, b.cv, z * 0.55);
          const tw = 0.55 + 0.45 * Math.sin(time * 2 + b.u0 * 3 + b.v0);
          ctx.globalAlpha = dusk * tw * 0.8;
          ctx.fillStyle = pal.window;
          ctx.fillRect(c.x - 1.4, c.y - 1.4, 2.8, 2.8);
          ctx.globalAlpha = 1;
        }
      }

      /* Broadway */
      if (scan > 0.15) {
        ctx.globalAlpha = clamp(scan) * (0.35 + 0.4 * rise) * (1 - focusT * 0.5);
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

      /* scan line */
      if (p > 0.12 && scan < 1) {
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

      /* ambient traffic + pedestrians */
      const vehR = seg(p, 0.56, 0.66);
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
      const pedR = seg(p, 0.64, 0.72);
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

      /* twin pins (fade back once we focus) */
      if (twinR > 0) {
        pins.forEach((pin, i) => {
          const z = heightAt(pin.u, pin.v) * 5.6 + 1.5;
          const s = proj(pin.u, pin.v, z);
          const base = proj(pin.u, pin.v, 0);
          const pulse = 0.5 + 0.5 * Math.sin(time * 2.4 + i);
          ctx.globalAlpha = twinR * (1 - 0.75 * focusT);
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

      /* ══ ANALYSIS LAYER — line-based measurements around the building ══ */
      if (focusT > 0.05) {
        const an = focusT;
        const fvBase = FOCUS_V; // street south of the block runs at v = FOCUS_V
        const fuAve = FOCUS_U; // avenue east of the block runs at u = FOCUS_U
        const fz = focus.h * (1 + 0.35 * focusT) * 5.6;

        // 1 · PUBLIC TRANSIT — a bus crossing the street, leaving a line
        {
          const uE = eastEdge(fvBase) + 0.4;
          const uW = westEdge(fvBase) - 0.4;
          const t = (time * 0.09) % 1;
          const u = uE + t * (uW - uE);
          const head = proj(u, fvBase, 0.18);
          const tail = proj(Math.max(uE, u - 2.4), fvBase, 0.18);
          trailDot(head, tail, pal.accent2, 2.2, an * 0.95, 2.6);
        }

        // 2 · PARKING ENTRIES — cars turn off the avenue into the building
        for (let k = 0; k < 2; k++) {
          const t = (time * 0.16 + k * 0.5) % 1;
          let u: number;
          let v: number;
          if (t < 0.6) {
            // approach along the avenue
            const tt = t / 0.6;
            u = fuAve;
            v = focus.cv + 5 - tt * 5;
          } else {
            // turn into the block (parking)
            const tt = (t - 0.6) / 0.4;
            u = fuAve + tt * (focus.u0 + 0.3 - fuAve);
            v = focus.cv;
          }
          const fadeIn = clamp(t * 6);
          const fadeOut = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
          const head = proj(u, v, 0.15);
          const tail = proj(u, Math.min(focus.cv + 5, v + 1.4), 0.15);
          trailDot(head, t < 0.6 ? tail : proj(fuAve, focus.cv, 0.15), pal.accent, 1.6, an * 0.9 * fadeIn * fadeOut, 1.9);
        }

        // 3 · SIDEWALK PEDESTRIANS — small trails along both sidewalks
        for (const wk of walkers) {
          wk.t = (wk.t + wk.spd * 0.016 * wk.dir + 1) % 1;
          const vSide = wk.side === 0 ? focus.v0 - 0.1 : focus.v1 + 0.1;
          const u = focus.u0 - 0.5 + wk.t * (focus.u1 - focus.u0 + 1);
          const head = proj(u, vSide, 0.08);
          const tail = proj(u - 0.45 * wk.dir, vSide, 0.08);
          trailDot(head, tail, pal.ped, 1, an * 0.8, 1.2);
        }

        // 4 · EMISSIONS — wavy lines rising from the rooftop
        for (let k = 0; k < 3; k++) {
          const lift = (time * 0.45 + k * 0.33) % 1;
          const a = an * (1 - lift) * 0.55;
          if (a <= 0.02) continue;
          ctx.globalAlpha = a;
          ctx.strokeStyle = pal.ped;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          for (let s = 0; s <= 6; s++) {
            const zz = fz + lift * 2.6 + (s / 6) * 0.9;
            const sway = Math.sin(time * 2 + zz * 2.4 + k * 2.1) * 0.14;
            const pt = proj(focus.cu - 0.18 + sway, focus.v0 + 0.35, zz);
            if (s === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // 5 · ENERGY FEED — dashes flowing along the street into the base
        {
          const a = proj(fuAve + 2.2, fvBase, 0.05);
          const b = proj(focus.cu, fvBase, 0.05);
          const c = proj(focus.cu, focus.v0 + 0.1, 0.05);
          ctx.globalAlpha = an * 0.3;
          ctx.strokeStyle = pal.accent;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
          ctx.globalAlpha = an * 0.95;
          ctx.setLineDash([4, 9]);
          ctx.lineDashOffset = -time * 30;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [theme, onTwinReady, satelliteImage]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
