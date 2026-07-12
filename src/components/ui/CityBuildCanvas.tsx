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
 * MANHATTAN — DIGITAL TWIN (street-level analysis)
 *
 * Real geometry, built procedurally (no copyright, a few KB):
 *   grid, Central Park (true 1:5 footprint), rivers, Broadway, Midtown spike.
 *
 * Sequence:
 *   1. SATELLITE — top-down imagery plate (optionally a real public photo)
 *   2. SCAN      — a sweep vectorizes imagery into wireframe footprints
 *   3. EXTRUDE   — camera tilts, footprints rise into volumes
 *   4. LIFE      — traffic, pedestrians, dusk lights
 *   5. TWIN      — live data pins
 *   6. FOCUS     — the camera dives to STREET LEVEL on the analysed building:
 *      full facade with lit windows, the ENTRANCE DOOR with a canopy (people
 *      walk in), the PARKING GATE with its ramp (cars drive in), street lamps,
 *      lane markings, crosswalks, a bus leaving its route line, rooftop
 *      emissions and an energy feed.
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

const ACCENT_RGB: Record<"dark" | "light", string> = {
  dark: "24,194,156",
  light: "232,131,79",
};

const AVE = 3.5;
const V0 = 34;
const V1 = 122;
const VSTEP = 2;
const PARK = { u0: 5, u1: 8, v0: 59, v1: 110 };
const ROT = (-72 * Math.PI) / 180;
const PITCH_END = 0.62;
const UC = 5.75;
const ZOOM = 11; // street-level: you can read the entrance
const FOCUS_U = 6; // analysed building: block column
const FOCUS_V = 44; // block row (≈ 44th St — Midtown)
const STREET_N = FOCUS_V + VSTEP; // the street the entrance fronts (visible face)

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
    const aRGB = ACCENT_RGB[theme];

    const cosR = Math.cos(ROT);
    const sinR = Math.sin(ROT);
    const VC = (V0 + V1) / 2;

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
    focus.h = Math.max(focus.h, 1.1);
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
        tone: rnd(i, 11),
      };
    });
    const peds = Array.from({ length: 30 }, (_, i) => ({
      lane: Math.floor(rnd(i, 6) * 11) + 0.5,
      v: V0 + rnd(i, 7) * (V1 - V0),
      t: rnd(i, 8),
      spd: 0.02 + rnd(i, 9) * 0.02,
      dir: rnd(i, 10) > 0.5 ? 1 : -1,
    }));
    // Sidewalk pedestrians around the analysed building (mostly the visible
    // north sidewalk) …
    const walkers = Array.from({ length: 8 }, (_, i) => ({
      side: i % 3 === 0 ? 0 : 1,
      t: rnd(i, 21),
      spd: 0.03 + rnd(i, 22) * 0.03,
      dir: rnd(i, 23) > 0.5 ? 1 : -1,
      ph: rnd(i, 24) * Math.PI * 2,
    }));
    // …and two people who walk up to the door and go inside.
    const enterers = [
      { off: 0.0, from: -1 },
      { off: 0.5, from: 1 },
    ];

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

    const rrect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const dirOf = (u1: number, v1: number, u2: number, v2: number): Pt => {
      const a = proj(u1, v1, 0.15);
      const b = proj(u2, v2, 0.15);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const l = Math.hypot(dx, dy) || 1;
      return { x: dx / l, y: dy / l };
    };

    /** A real little car: body + cabin + headlights + taillights. */
    const drawCar = (pt: Pt, dir: Pt, color: string, alpha: number, k = 1) => {
      const L = clamp(scale * 0.28, 5, 34) * k;
      const Wd = L * 0.5;
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(Math.atan2(dir.y, dir.x));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      rrect(-L / 2, -Wd / 2, L, Wd, Wd * 0.34);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      rrect(-L * 0.16, -Wd * 0.3, L * 0.4, Wd * 0.6, Wd * 0.2);
      ctx.fill();
      ctx.fillStyle = pal.window;
      ctx.fillRect(L / 2 - L * 0.08, -Wd * 0.34, L * 0.08, Wd * 0.2);
      ctx.fillRect(L / 2 - L * 0.08, Wd * 0.14, L * 0.08, Wd * 0.2);
      ctx.fillStyle = "rgba(255,90,90,0.85)";
      ctx.fillRect(-L / 2, -Wd * 0.3, L * 0.06, Wd * 0.16);
      ctx.fillRect(-L / 2, Wd * 0.14, L * 0.06, Wd * 0.16);
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    /** The bus: long body, side windows, headlights. */
    const drawBus = (pt: Pt, dir: Pt, alpha: number) => {
      const L = clamp(scale * 0.28, 5, 34) * 2.1;
      const Wd = L * 0.3;
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(Math.atan2(dir.y, dir.x));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pal.accent2;
      rrect(-L / 2, -Wd / 2, L, Wd, Wd * 0.28);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      const n = 4;
      for (let i = 0; i < n; i++) {
        const wx = -L * 0.36 + (i * L * 0.62) / (n - 1);
        ctx.fillRect(wx, -Wd * 0.3, L * 0.11, Wd * 0.6);
      }
      ctx.fillStyle = pal.window;
      ctx.fillRect(L / 2 - L * 0.05, -Wd * 0.3, L * 0.05, Wd * 0.22);
      ctx.fillRect(L / 2 - L * 0.05, Wd * 0.08, L * 0.05, Wd * 0.22);
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    /** A walking person: head, torso, swinging arms and legs, subtle bob. */
    const drawPerson = (
      foot: Pt,
      phase: number,
      color: string,
      alpha: number
    ) => {
      const k = clamp(scale / 34, 0.5, 3.4);
      const bob = Math.sin(phase * 2) * 0.5 * k;
      ctx.save();
      ctx.translate(foot.x, foot.y + bob * 0.4);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.1 * k;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, -6.4 * k, 1.35 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -5 * k);
      ctx.lineTo(0, -2.4 * k);
      ctx.stroke();
      const sw = Math.sin(phase) * 1.9 * k;
      ctx.beginPath();
      ctx.moveTo(0, -2.4 * k);
      ctx.lineTo(sw, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -2.4 * k);
      ctx.lineTo(-sw, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -4.6 * k);
      ctx.lineTo(-sw * 0.7, -2.9 * k);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -4.6 * k);
      ctx.lineTo(sw * 0.7, -2.9 * k);
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    /** A street lamp: pole + arm + glowing bulb. */
    const drawLamp = (
      u: number,
      v: number,
      armU: number,
      armV: number,
      alpha: number,
      glow: number
    ) => {
      const base = proj(u, v, 0);
      const topP = proj(u, v, 1.5);
      const tip = proj(u + armU, v + armV, 1.48);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = shadeHex(theme === "dark" ? "#3a4a5e" : "#8a99ab", 1);
      ctx.lineWidth = clamp(scale * 0.016, 0.8, 2.2);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(topP.x, topP.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      ctx.fillStyle = pal.window;
      ctx.shadowBlur = 14 * glow;
      ctx.shadowColor = pal.window;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, clamp(scale * 0.02, 1.2, 3.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    /** Moving head with a fading line trail. */
    const trail = (head: Pt, tail: Pt, color: string, width: number, alpha: number) => {
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
      ctx.globalAlpha = 1;
    };

    const start = performance.now();
    const DURATION = 15000;
    let raf = 0;

    const draw = (now: number) => {
      const p = clamp((now - start) / DURATION);
      const time = now / 1000;

      if (!twinFired.current && p > 0.8) {
        twinFired.current = true;
        onTwinReady?.();
      }

      const scan = seg(p, 0.12, 0.28);
      const sat = 1 - seg(p, 0.15, 0.38);
      pitch = smooth(seg(p, 0.26, 0.5)) * PITCH_END;
      const rise = smooth(seg(p, 0.28, 0.56));
      const dusk = seg(p, 0.66, 0.78);
      const twinR = seg(p, 0.76, 0.85);
      const focusT = smooth(seg(p, 0.85, 1));

      /* camera: dive to street level at the entrance corner, subtle drift */
      scale = baseScale * (1 + (ZOOM - 1) * focusT);
      const fAu = focus.cu; // anchor: middle of the entrance facade…
      const fAv = focus.v1; // …on the visible north face
      const fx = (fAu - UC) * AVE;
      const fy = fAv - VC;
      const frx = fx * cosR - fy * sinR;
      const fry = fx * sinR + fy * cosR;
      const fzAim = 1.5; // aim at door height
      const driftX = Math.sin(time * 0.22) * scale * 0.012 * focusT;
      const driftY = Math.cos(time * 0.17) * scale * 0.008 * focusT;
      const desOx = W / 2 - frx * scale + driftX;
      const desOy =
        H * 0.56 - (fry * Math.cos(pitch) - fzAim * Math.sin(pitch)) * scale + driftY;
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

      /* optional real satellite plate */
      if (img && sat > 0.01) {
        ctx.save();
        ctx.globalAlpha = sat * 0.92;
        ctx.translate(ox, oy);
        ctx.scale(scale, scale * Math.cos(pitch));
        ctx.rotate(ROT);
        ctx.scale(1, -1);
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

      /* blocks: imagery → wireframe → volumes (with off-screen culling) */
      const plateA = img ? 0.3 : 1;
      const mX = 3 * scale;
      const mB = 6 * scale;
      for (const b of blocks) {
        const cpt = proj(b.cu, b.cv, 0);
        if (cpt.x < -mX || cpt.x > W + mX || cpt.y < -mX || cpt.y > H + mB)
          continue;

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

        const fL = b.focus ? mixHex(pal.faceL, pal.accent, focusT * 0.4) : pal.faceL;
        const fR = b.focus ? mixHex(pal.faceR, pal.accent, focusT * 0.55) : pal.faceR;
        const fT = b.focus
          ? mixHex(pal.top, pal.accent, focusT * 0.8)
          : shadeHex(pal.top, 0.85 + rnd(b.v0, b.u0) * 0.3);

        for (let i = 0; i < 4; i++) {
          const j = (i + 1) % 4;
          const dy = foot[j].y - foot[i].y;
          if (Math.abs(dy) < 0.01) continue;
          poly([foot[i], foot[j], top[j], top[i]], dy > 0 ? fR : fL);
        }
        poly(top, fT);

        /* ── STREET-LEVEL FACADE of the analysed building ── */
        if (b.focus && focusT > 0.02) {
          const A = focusT;
          // visible faces: N (v = v1, the entrance) and E (u = u0, the parking)
          const faceN = (s: number, h: number) =>
            proj(b.u0 + (b.u1 - b.u0) * s, b.v1, h);
          const faceE = (s: number, h: number) =>
            proj(b.u0, b.v0 + (b.v1 - b.v0) * s, h);
          const quad = (
            f: (s: number, h: number) => Pt,
            s0: number,
            s1: number,
            h0: number,
            h1: number,
            fill?: string,
            stroke?: string,
            lw = 1
          ) => poly([f(s0, h0), f(s1, h0), f(s1, h1), f(s0, h1)], fill, stroke, lw);

          // windows on both visible faces (above the ground floor)
          const rows = Math.max(3, Math.floor((z - 1.5) / 0.6));
          const faces: [typeof faceN, number][] = [
            [faceN, 5],
            [faceE, 4],
          ];
          for (const [f, cols] of faces) {
            for (let r = 0; r < rows; r++) {
              const h0 = 1.4 + r * ((z - 1.9) / rows);
              const h1 = h0 + ((z - 1.9) / rows) * 0.45;
              for (let c = 0; c < cols; c++) {
                const s0 = 0.09 + (c * 0.82) / cols;
                const s1 = s0 + (0.82 / cols) * 0.58;
                const lit = rnd(r * 7 + c, b.u0 * 13 + (f === faceN ? 0 : 5)) > 0.38;
                if (lit) {
                  const tw = 0.6 + 0.4 * Math.sin(time * 1.6 + r * 2.1 + c);
                  ctx.globalAlpha = A * 0.75 * tw;
                  quad(f, s0, s1, h0, h1, pal.window);
                } else {
                  ctx.globalAlpha = A * 0.4;
                  quad(f, s0, s1, h0, h1, "rgba(0,0,0,0.45)");
                }
                ctx.globalAlpha = 1;
              }
            }
          }

          // ── ENTRANCE (north face): recessed double door + canopy + steps
          ctx.globalAlpha = A;
          quad(faceN, 0.42, 0.58, 0, 1.0, "rgba(0,0,0,0.55)"); // doorway
          quad(faceN, 0.42, 0.58, 0, 1.0, undefined, pal.accent2, 1.2); // frame
          {
            // door leaf split + glowing handles
            const mA = faceN(0.5, 0);
            const mB2 = faceN(0.5, 1.0);
            ctx.strokeStyle = pal.accent2;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mA.x, mA.y);
            ctx.lineTo(mB2.x, mB2.y);
            ctx.stroke();
            const h1 = faceN(0.465, 0.45);
            const h2 = faceN(0.535, 0.45);
            ctx.fillStyle = pal.window;
            ctx.beginPath();
            ctx.arc(h1.x, h1.y, clamp(scale * 0.012, 0.8, 2), 0, Math.PI * 2);
            ctx.arc(h2.x, h2.y, clamp(scale * 0.012, 0.8, 2), 0, Math.PI * 2);
            ctx.fill();
            // warm light spilling from the doorway
            const g = ctx.createLinearGradient(mB2.x, mB2.y, mA.x, mA.y);
            g.addColorStop(0, "rgba(0,0,0,0)");
            g.addColorStop(1, `rgba(${aRGB},0.35)`);
            quadFill(faceN, 0.42, 0.58, 0, 1.0, g);
          }
          // canopy (awning) protruding over the sidewalk
          poly(
            [
              proj(b.cu - 0.11, b.v1, 1.1),
              proj(b.cu + 0.11, b.v1, 1.1),
              proj(b.cu + 0.13, b.v1 + 0.14, 1.0),
              proj(b.cu - 0.13, b.v1 + 0.14, 1.0),
            ],
            mixHex(pal.top, pal.accent, 0.85)
          );
          ctx.shadowBlur = 10;
          ctx.shadowColor = pal.accent2;
          poly(
            [
              proj(b.cu - 0.13, b.v1 + 0.14, 1.0),
              proj(b.cu + 0.13, b.v1 + 0.14, 1.0),
            ],
            undefined,
            pal.accent2,
            1.4
          );
          ctx.shadowBlur = 0;

          // ── PARKING GATE (east face): shuttered opening + ramp
          const sG0 = (b.cv - 0.17 - b.v0) / (b.v1 - b.v0);
          const sG1 = (b.cv + 0.17 - b.v0) / (b.v1 - b.v0);
          quad(faceE, sG0, sG1, 0, 0.75, "rgba(0,0,0,0.6)");
          quad(faceE, sG0, sG1, 0, 0.75, undefined, pal.accent, 1.2);
          ctx.strokeStyle = `rgba(${aRGB},0.55)`;
          ctx.lineWidth = 1;
          for (let k = 1; k <= 3; k++) {
            const a1 = faceE(sG0, (0.75 * k) / 4);
            const b1 = faceE(sG1, (0.75 * k) / 4);
            ctx.beginPath();
            ctx.moveTo(a1.x, a1.y);
            ctx.lineTo(b1.x, b1.y);
            ctx.stroke();
          }
          // "P" ramp markings on the asphalt leading in
          ctx.globalAlpha = A * 0.5;
          ctx.strokeStyle = pal.accent;
          ctx.setLineDash([scale * 0.05, scale * 0.05]);
          for (const dv of [-0.1, 0.1]) {
            const a1 = proj(b.u0 - 0.36, b.cv + dv, 0.02);
            const b1 = proj(b.u0, b.cv + dv, 0.02);
            ctx.beginPath();
            ctx.moveTo(a1.x, a1.y);
            ctx.lineTo(b1.x, b1.y);
            ctx.stroke();
          }
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;

          // glowing roof outline + pulsing ring
          ctx.globalAlpha = focusT;
          ctx.shadowBlur = 16;
          ctx.shadowColor = pal.accent2;
          poly(top, undefined, pal.accent2, 1.4);
          ctx.shadowBlur = 0;
          const cc = proj(b.cu, b.cv, z);
          const pulse = 0.5 + 0.5 * Math.sin(time * 2.6);
          ctx.strokeStyle = pal.accent2;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cc.x, cc.y, 4 + pulse * 8, 0, Math.PI * 2);
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
      if (scan > 0.15 && focusT < 0.7) {
        ctx.globalAlpha = clamp(scan) * (0.35 + 0.4 * rise) * (1 - focusT);
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
      if (p > 0.11 && scan < 1) {
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

      /* ══ street detail near the focus (fades in with the zoom) ══ */
      if (focusT > 0.1) {
        const an = focusT;
        const mk = theme === "dark" ? "rgba(220,232,244,1)" : "rgba(70,84,100,1)";

        // lane dashes on the entrance street + the parking avenue
        ctx.strokeStyle = mk;
        ctx.lineWidth = clamp(scale * 0.02, 0.6, 2.4);
        ctx.setLineDash([scale * 0.1, scale * 0.12]);
        ctx.globalAlpha = an * 0.22;
        ctx.beginPath();
        let s0 = proj(FOCUS_U - 3.2, STREET_N);
        let s1 = proj(FOCUS_U + 4.2, STREET_N);
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.stroke();
        ctx.beginPath();
        s0 = proj(FOCUS_U, STREET_N - 7);
        s1 = proj(FOCUS_U, STREET_N + 6);
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // crosswalks at the entrance-street corner
        ctx.globalAlpha = an * 0.32;
        ctx.lineWidth = clamp(scale * 0.045, 1, 5);
        for (let k = -3; k <= 3; k++) {
          const uu = FOCUS_U + k * 0.075;
          const a1 = proj(uu, STREET_N - 0.16);
          const b1 = proj(uu, STREET_N + 0.16);
          ctx.beginPath();
          ctx.moveTo(a1.x, a1.y);
          ctx.lineTo(b1.x, b1.y);
          ctx.stroke();
        }
        for (let k = -3; k <= 3; k++) {
          const vv = STREET_N + k * 0.075;
          const a1 = proj(FOCUS_U - 0.16, vv);
          const b1 = proj(FOCUS_U + 0.16, vv);
          ctx.beginPath();
          ctx.moveTo(a1.x, a1.y);
          ctx.lineTo(b1.x, b1.y);
          ctx.stroke();
        }

        // sidewalk kerb around the analysed block
        ctx.globalAlpha = an * 0.28;
        poly(
          [
            proj(focus.u0 - 0.08, focus.v0 - 0.08),
            proj(focus.u1 + 0.08, focus.v0 - 0.08),
            proj(focus.u1 + 0.08, focus.v1 + 0.08),
            proj(focus.u0 - 0.08, focus.v1 + 0.08),
          ],
          undefined,
          mk,
          1
        );
        ctx.globalAlpha = 1;

        // street lamps on the entrance sidewalk + the avenue
        const glow = 0.5 + dusk * 0.5;
        drawLamp(focus.cu - 0.55, focus.v1 + 0.17, 0, 0.12, an, glow);
        drawLamp(focus.cu + 0.55, focus.v1 + 0.17, 0, 0.12, an, glow);
        drawLamp(focus.u0 - 0.18, focus.cv - 0.75, 0.1, 0, an, glow);
      }

      /* ambient traffic — dots far away, real cars once we zoom in */
      const vehR = seg(p, 0.54, 0.64);
      if (vehR > 0) {
        for (const car of vehicles) {
          car.t = (car.t + car.spd * 0.016 * car.dir + 1) % 1;
          const u = car.avenue ? car.lane : 0.5 + car.t * 10.5;
          const v = car.avenue ? V0 + car.t * (V1 - V0) : car.lane;
          const s = proj(u, v, 0.15);
          if (s.x < -60 || s.x > W + 60 || s.y < -60 || s.y > H + 60) continue;
          const col =
            car.tone > 0.6 ? pal.accent2 : car.tone > 0.3 ? pal.accent : pal.ped;
          if (focusT > 0.25) {
            const d = car.avenue
              ? dirOf(u, v, u, v + 0.3 * car.dir)
              : dirOf(u, v, u + 0.3 * car.dir, v);
            drawCar(s, d, col, vehR * (0.55 + 0.45 * focusT));
          } else {
            ctx.globalAlpha = vehR;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 1.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }

      /* ambient pedestrians (distant dots) */
      const pedR = seg(p, 0.62, 0.7);
      if (pedR > 0) {
        for (const pd of peds) {
          pd.t = (pd.t + pd.spd * 0.016 * pd.dir + 1) % 1;
          const vv = V0 + ((pd.v - V0 + pd.t * 24) % (V1 - V0));
          const s = proj(pd.lane, vv, 0.1);
          if (s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20) continue;
          ctx.globalAlpha = pedR * 0.75 * (1 - focusT * 0.7);
          ctx.fillStyle = pal.ped;
          ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
          ctx.globalAlpha = 1;
        }
      }

      /* twin pins (fade away as we dive) */
      if (twinR > 0 && focusT < 0.6) {
        pins.forEach((pin, i) => {
          const z = heightAt(pin.u, pin.v) * 5.6 + 1.5;
          const s = proj(pin.u, pin.v, z);
          const base = proj(pin.u, pin.v, 0);
          const pulse = 0.5 + 0.5 * Math.sin(time * 2.4 + i);
          ctx.globalAlpha = twinR * (1 - focusT / 0.6);
          ctx.strokeStyle = `rgba(${aRGB},0.35)`;
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

      /* ══ ANALYSIS LAYER — live agents at the entrance ══ */
      if (focusT > 0.05) {
        const an = focusT;
        const fz = focus.h * (1 + 0.35 * focusT) * 5.6;

        // 1 · PUBLIC TRANSIT — the bus on the entrance street, leaving its line
        {
          const uE = eastEdge(STREET_N) + 0.4;
          const uW = westEdge(STREET_N) - 0.4;
          const t = (time * 0.045) % 1;
          const u = uE + t * (uW - uE);
          const head = proj(u, STREET_N + 0.07, 0.12);
          const tail = proj(Math.max(uE, u - 3), STREET_N + 0.07, 0.12);
          trail(head, tail, pal.accent2, clamp(scale * 0.05, 1.5, 4), an * 0.85);
          drawBus(head, dirOf(u, STREET_N, u + 0.3, STREET_N), an);
        }

        // 2 · PARKING — cars come down the avenue and drive in through the gate
        for (let k = 0; k < 2; k++) {
          const t = (time * 0.11 + k * 0.5) % 1;
          let u: number;
          let v: number;
          let d: Pt;
          if (t < 0.62) {
            const tt = t / 0.62;
            u = FOCUS_U - 0.07;
            v = focus.cv + 4.5 - tt * 4.5;
            d = dirOf(u, v, u, v - 0.3);
          } else {
            const tt = (t - 0.62) / 0.38;
            u = FOCUS_U - 0.07 + tt * (focus.u0 + 0.25 - (FOCUS_U - 0.07));
            v = focus.cv;
            d = dirOf(u, v, u + 0.3, v);
          }
          const fadeIn = clamp(t * 6);
          const fadeOut = t > 0.86 ? 1 - (t - 0.86) / 0.14 : 1; // swallowed by the gate
          const head = proj(u, v, 0.1);
          const tail =
            t < 0.62
              ? proj(u, Math.min(focus.cv + 4.5, v + 1.6), 0.1)
              : proj(FOCUS_U - 0.07, focus.cv, 0.1);
          trail(head, tail, pal.accent, clamp(scale * 0.03, 1, 2.6), an * 0.7 * fadeIn * fadeOut);
          drawCar(head, d, pal.accent, an * fadeIn * fadeOut, 0.9);
        }

        // 3 · SIDEWALK PEDESTRIANS — people walking along both sidewalks
        for (const wk of walkers) {
          wk.t = (wk.t + wk.spd * 0.016 * wk.dir + 1) % 1;
          const vSide = wk.side === 0 ? focus.v0 - 0.12 : focus.v1 + 0.14;
          const u = focus.u0 - 0.5 + wk.t * (focus.u1 - focus.u0 + 1);
          const foot = proj(u, vSide, 0);
          const phase = time * (5 + wk.spd * 70) + wk.ph;
          drawPerson(foot, phase, pal.ped, an * 0.95);
        }

        // …two of them reach the door and go inside
        for (const en of enterers) {
          const t = (time * 0.05 + en.off) % 1;
          let u: number;
          let v: number;
          let alpha = 1;
          if (t < 0.68) {
            const tt = t / 0.68;
            u = focus.cu + en.from * 1.5 * (1 - tt);
            v = focus.v1 + 0.14;
          } else {
            const tt = (t - 0.68) / 0.32;
            u = focus.cu;
            v = focus.v1 + 0.14 - tt * 0.13;
            alpha = tt > 0.55 ? 1 - (tt - 0.55) / 0.45 : 1; // through the door
          }
          const foot = proj(u, v, 0);
          drawPerson(foot, time * 6.2 + en.off * 9, pal.ped, an * alpha);
        }

        // 4 · EMISSIONS — wavy lines rising from the rooftop
        for (let k = 0; k < 3; k++) {
          const lift = (time * 0.45 + k * 0.33) % 1;
          const a = an * (1 - lift) * 0.55;
          if (a <= 0.02) continue;
          ctx.globalAlpha = a;
          ctx.strokeStyle = pal.ped;
          ctx.lineWidth = clamp(scale * 0.03, 1, 2.6);
          ctx.beginPath();
          for (let s = 0; s <= 6; s++) {
            const zz = fz + lift * 2.6 + (s / 6) * 0.9;
            const sway = Math.sin(time * 2 + zz * 2.4 + k * 2.1) * 0.14;
            const pt = proj(focus.cu - 0.18 + sway, focus.cv, zz);
            if (s === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // 5 · ENERGY FEED — dashes flowing along the street into the base
        {
          const a = proj(focus.cu + 2.4, STREET_N, 0.04);
          const b = proj(focus.cu, STREET_N, 0.04);
          const c = proj(focus.cu, focus.v1 + 0.05, 0.04);
          ctx.globalAlpha = an * 0.3;
          ctx.strokeStyle = pal.accent;
          ctx.lineWidth = clamp(scale * 0.03, 1.2, 2.6);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
          ctx.globalAlpha = an * 0.95;
          ctx.setLineDash([scale * 0.08, scale * 0.16]);
          ctx.lineDashOffset = -time * scale * 0.7;
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

    /** Fill a facade quad with an arbitrary fillStyle (gradient etc.). */
    const quadFill = (
      f: (s: number, h: number) => { x: number; y: number },
      s0: number,
      s1: number,
      h0: number,
      h1: number,
      fill: string | CanvasGradient
    ) => {
      const pts = [f(s0, h0), f(s1, h0), f(s1, h1), f(s0, h1)];
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [theme, onTwinReady, satelliteImage]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
