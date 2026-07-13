"use client";

import { useEffect, useRef } from "react";

interface CityBuildCanvasProps {
  theme: "dark" | "light";
  /** Fired once when the digital-twin stage begins (HUD appears). */
  onTwinReady?: () => void;
  /**
   * Optional public-domain satellite photo of Barcelona (e.g. NASA/USGS
   * imagery placed in /public). Shown during the top-down phase, then
   * vectorized by the scanner. Crop with the coast at the bottom.
   */
  satelliteImage?: string;
  /** Tag text for the highlighted building. */
  label?: string;
}

/* ============================================================================
 * BARCELONA — FROM SPACE TO DIGITAL TWIN
 *
 * Script:
 *   1. SPACE    — Earth seen from orbit, night side glowing; we dive toward
 *                 the Mediterranean coast.
 *   2. REGION   — the Catalan coastline rushes closer, Barcelona shining.
 *   3. CITY     — top-down satellite view: the Eixample grid with its
 *                 chamfered octagonal blocks, Diagonal Avenue, the old town,
 *                 the port, Montjuïc and the Collserola hills. All procedural
 *                 (real geometry, no copyrighted imagery, a few KB).
 *   4. SCAN     — a scanner sweep vectorizes the city into a wireframe twin.
 *   5. RISE     — the buildings extrude out of their footprints.
 *   6. TILT     — the camera swings from top-down to an oblique 3D view.
 *   7. TAG      — one building is painted in the theme accent and tagged
 *                 "Building Simulation" with a leader line.
 * ========================================================================== */

interface Palette {
  space: string;
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
  glowWarm: string;
  ink: string;
  tagBg: string;
}

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    space: "#01030a",
    water: "#04080f",
    land: "#0a1119",
    satBlock: "#243040",
    wire: "#18c29c",
    faceL: "#0e1826",
    faceR: "#14243a",
    top: "#1d3a52",
    park: "#17543f",
    accent: "#18c29c",
    accent2: "#53e4e1",
    window: "#7ff0dc",
    glowWarm: "255,196,120",
    ink: "#eaf4ff",
    tagBg: "rgba(8,16,26,0.82)",
  },
  light: {
    space: "#0a1524",
    water: "#cfdeee",
    land: "#eef2f7",
    satBlock: "#c3cdd9",
    wire: "#e8834f",
    faceL: "#c4d0de",
    faceR: "#d6dfea",
    top: "#f4f8fd",
    park: "#8fc4a6",
    accent: "#e8834f",
    accent2: "#f2739c",
    window: "#f7b98e",
    glowWarm: "255,196,120",
    ink: "#13202e",
    tagBg: "rgba(255,255,255,0.85)",
  },
};

const ACCENT_RGB: Record<"dark" | "light", string> = {
  dark: "24,194,156",
  light: "232,131,79",
};

/* ── Barcelona world frame (km-ish units) ────────────────────────────────────
 * x runs along the coast (SW → NE), y runs inland. The sea is at y < coast.
 */
const BX0 = -10;
const BX1 = 9;
const BY1 = 8.4;
const SEA = -1.4; // how much open sea to keep in frame
const ROT = Math.PI - 0.3; // sea at the bottom, coast tilted across the frame
const PITCH_END = 0.62;
const HI_ZOOM = 1.9;

/* Diagonal Avenue: a straight corridor slicing the grid */
const DIAG_A = { x: -7, y: 6.9 };
const DIAG_B = { x: 9, y: 2.7 };

/* world centre (so the city sits centred in frame) */
const CX = (BX0 + BX1) / 2; // -0.5
const CY = (SEA + BY1) / 2;

const rnd = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const seg = (p: number, s: number, e: number) => clamp((p - s) / (e - s));
const smooth = (t: number) => t * t * (3 - 2 * t);

const coastY = (x: number) => 0.18 * Math.sin(x * 0.35) - Math.max(0, (x - 4) * 0.05);
const hillsY = (x: number) => 7.0 + 0.35 * Math.sin(x * 0.45 + 1.2);

const distToDiagonal = (x: number, y: number) => {
  const dx = DIAG_B.x - DIAG_A.x;
  const dy = DIAG_B.y - DIAG_A.y;
  const len = Math.hypot(dx, dy);
  const t = clamp(((x - DIAG_A.x) * dx + (y - DIAG_A.y) * dy) / (len * len));
  const px = DIAG_A.x + t * dx;
  const py = DIAG_A.y + t * dy;
  return Math.hypot(x - px, y - py);
};

const inOldTown = (x: number, y: number) =>
  x > -1.9 && x < 1.6 && y > 0.3 && y < 2.25;
const inMontjuic = (x: number, y: number) =>
  x > -9.2 && x < -5.2 && y > 0.15 && y < 2.3 && (y - 0.15) < (x + 9.2) * 0.9;

interface Block {
  pts: { x: number; y: number }[]; // footprint polygon (world)
  cx: number;
  cy: number;
  h: number;
  order: number;
  depth: number;
  hi: boolean;
  landmark: boolean;
}

function shadeHex(hex: string, f: number) {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * f));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * f));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * f));
  return `rgb(${r},${g},${b})`;
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

/** Chamfered Eixample block (octagon). */
function octagon(cx: number, cy: number, s: number, c: number) {
  return [
    { x: cx - s + c, y: cy - s },
    { x: cx + s - c, y: cy - s },
    { x: cx + s, y: cy - s + c },
    { x: cx + s, y: cy + s - c },
    { x: cx + s - c, y: cy + s },
    { x: cx - s + c, y: cy + s },
    { x: cx - s, y: cy + s - c },
    { x: cx - s, y: cy - s + c },
  ];
}

export function CityBuildCanvas({
  theme,
  onTwinReady,
  satelliteImage,
  label = "Building Simulation",
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

    let img: HTMLImageElement | null = null;
    if (satelliteImage) {
      const im = new Image();
      im.src = satelliteImage;
      im.onload = () => {
        img = im;
      };
    }

    /* ── build Barcelona once ─────────────────────────────────────────────── */
    const blocks: Block[] = [];

    // Eixample grid — chamfered octagonal blocks
    for (let gx = 0; gx < 30; gx++) {
      for (let gy = 0; gy < 12; gy++) {
        const bx = -6.4 + gx * 0.5;
        let by = 1.25 + gy * 0.5;
        if (by > 2.55) by += 0.16; // Gran Via: a visibly wider street
        if (bx > BX1 - 0.4 || by > hillsY(bx) - 0.5) continue;
        if (by < coastY(bx) + 0.6) continue;
        if (inOldTown(bx, by) || inMontjuic(bx, by)) continue;
        if (distToDiagonal(bx, by) < 0.26) continue; // Diagonal Avenue corridor
        const nearGlories = Math.hypot(bx - 5.9, by - 3.2) < 0.9;
        const sagrada = Math.hypot(bx - 2.1, by - 4.55) < 0.26;
        const h = sagrada
          ? 1.55
          : nearGlories && rnd(gx, gy) > 0.55
            ? 0.9 + rnd(gx, gy + 1) * 0.5
            : 0.36 + rnd(gx, gy + 2) * 0.12; // the famous uniform Eixample carpet
        blocks.push({
          pts: octagon(bx, by, 0.185, 0.07),
          cx: bx,
          cy: by,
          h,
          order: 0,
          depth: 0,
          hi: false,
          landmark: sagrada,
        });
      }
    }

    // Ciutat Vella (old town) — dense irregular little blocks
    for (let i = 0; i < 64; i++) {
      const bx = -1.7 + rnd(i, 31) * 3.1;
      const by = 0.42 + rnd(i, 32) * 1.7;
      if (!inOldTown(bx, by)) continue;
      const s = 0.09 + rnd(i, 33) * 0.07;
      const a = rnd(i, 34) * 0.8 - 0.4;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const corners = [
        { x: -s, y: -s },
        { x: s, y: -s },
        { x: s, y: s },
        { x: -s, y: s },
      ].map((q) => ({ x: bx + q.x * ca - q.y * sa, y: by + q.x * sa + q.y * ca }));
      blocks.push({
        pts: corners,
        cx: bx,
        cy: by,
        h: 0.18 + rnd(i, 35) * 0.08,
        order: 0,
        depth: 0,
        hi: false,
        landmark: false,
      });
    }

    // Torre Glòries — the round tower by the Diagonal
    blocks.push({
      pts: octagon(6.05, 3.05, 0.11, 0.055),
      cx: 6.05,
      cy: 3.05,
      h: 1.35,
      order: 0,
      depth: 0,
      hi: false,
      landmark: true,
    });

    // pick the highlighted "Building Simulation" block (mid-Eixample)
    let hb = blocks[0];
    let best = 1e9;
    for (const b of blocks) {
      const d = Math.hypot(b.cx - 0.6, b.cy - 3.7);
      if (d < best && !b.landmark) {
        best = d;
        hb = b;
      }
    }
    hb.hi = true;
    hb.h = Math.max(hb.h, 0.52);

    for (const b of blocks) {
      b.order = clamp((b.cy - (-0.6)) / (BY1 + 0.6)); // scan sweeps from the sea inland
      b.depth = b.cx * sinR + b.cy * cosR;
    }
    blocks.sort((a, b) => a.depth - b.depth);

    // life on the avenues after the tilt
    const cars = Array.from({ length: 14 }, (_, i) => ({
      onDiag: i % 2 === 0,
      t: rnd(i, 41),
      spd: 0.03 + rnd(i, 42) * 0.035,
      dir: rnd(i, 43) > 0.5 ? 1 : -1,
    }));

    // starfield (screen space)
    const stars = Array.from({ length: 130 }, (_, i) => ({
      x: rnd(i, 51),
      y: rnd(i, 52),
      r: 0.4 + rnd(i, 53) * 1.1,
      ph: rnd(i, 54) * Math.PI * 2,
    }));

    let W = 0;
    let H = 0;
    let baseScale = 1;
    let baseOx = 0;
    let baseOy = 0;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let pitch = 0;

    const proj = (x: number, y: number, z = 0) => {
      const wx = x - CX;
      const wy = y - CY;
      const rx = wx * cosR - wy * sinR;
      const ry = wx * sinR + wy * cosR;
      return {
        x: ox + rx * scale,
        y: oy + ry * Math.cos(pitch) * scale - z * Math.sin(pitch) * scale,
      };
    };

    const fit = () => {
      const pts: { x: number; y: number }[] = [];
      for (const [x, y] of [
        [BX0, SEA],
        [BX1, SEA],
        [BX0, BY1],
        [BX1, BY1],
      ]) {
        pts.push({
          x: x * cosR - y * sinR,
          y: (x * sinR + y * cosR) * Math.cos(PITCH_END),
        });
      }
      const spanX =
        Math.max(...pts.map((q) => q.x)) - Math.min(...pts.map((q) => q.x));
      const spanY =
        Math.max(...pts.map((q) => q.y)) - Math.min(...pts.map((q) => q.y));
      baseScale = Math.min((W * 0.96) / spanX, (H * 0.86) / spanY);
      baseOx = W / 2;
      baseOy = H / 2 + H * 0.04;
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

    /* ── scene: Earth from orbit ──────────────────────────────────────────── */
    const drawSpace = (alpha: number, t: number, time: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pal.space;
      ctx.fillRect(0, 0, W, H);

      // stars
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(time * 1.4 + s.ph);
        ctx.globalAlpha = alpha * (0.25 + 0.55 * tw);
        ctx.fillStyle = "#cfe4ff";
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = alpha;

      // Earth: the target point (Barcelona) stays put while the sphere swells
      const R = H * 0.34 * Math.pow(60, t);
      const P = { x: W * 0.54, y: H * 0.48 };
      const dl = Math.hypot(0.34, 0.8);
      const cx = P.x + (0.34 / dl) * R * 0.86;
      const cy = P.y + (0.8 / dl) * R * 0.86;

      const g = ctx.createRadialGradient(
        cx - R * 0.4,
        cy - R * 0.4,
        R * 0.1,
        cx,
        cy,
        R
      );
      g.addColorStop(0, "#122740");
      g.addColorStop(0.55, "#081527");
      g.addColorStop(1, "#030910");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // atmosphere rim
      ctx.strokeStyle = `rgba(83,228,225,0.5)`;
      ctx.lineWidth = Math.max(1.6, R * 0.005);
      ctx.shadowBlur = 26;
      ctx.shadowColor = "#53e4e1";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // night-side city lights: warm clusters, Barcelona at the target point
      const cluster = (px: number, py: number, s: number, a2: number) => {
        const gg = ctx.createRadialGradient(px, py, 0, px, py, s);
        gg.addColorStop(0, `rgba(${pal.glowWarm},${0.9 * a2})`);
        gg.addColorStop(0.4, `rgba(${pal.glowWarm},${0.35 * a2})`);
        gg.addColorStop(1, `rgba(${pal.glowWarm},0)`);
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(px, py, s, 0, Math.PI * 2);
        ctx.fill();
      };
      const spread = R * 0.14;
      cluster(P.x, P.y, Math.max(8, spread * 0.5), alpha);
      cluster(P.x - spread * 1.6, P.y + spread * 0.9, spread * 0.32, alpha * 0.6);
      cluster(P.x + spread * 1.3, P.y - spread * 0.6, spread * 0.26, alpha * 0.5);
      // pulsing target marker
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
      ctx.strokeStyle = pal.accent2;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = alpha * (0.5 + 0.5 * pulse);
      ctx.beginPath();
      ctx.arc(P.x, P.y, 8 + pulse * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    /* ── scene: regional dive to the Catalan coast ────────────────────────── */
    const drawRegion = (alpha: number, t: number, time: number) => {
      const rs = (Math.min(W, H) / 15) * Math.pow(24, t);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#03060c"; // Mediterranean at night
      ctx.fillRect(0, 0, W, H);
      ctx.translate(W * 0.54, H * 0.48);
      ctx.rotate(-0.3);
      ctx.scale(rs, rs);

      // land above the coastline
      ctx.fillStyle = pal.land;
      ctx.beginPath();
      ctx.moveTo(-60, 0.4 * Math.sin(-60 * 0.12));
      for (let x = -60; x <= 60; x += 3)
        ctx.lineTo(x, 0.4 * Math.sin(x * 0.12));
      ctx.lineTo(60, -60);
      ctx.lineTo(-60, -60);
      ctx.closePath();
      ctx.fill();

      // faint road veins radiating from Barcelona
      ctx.strokeStyle = "rgba(130,160,190,0.14)";
      ctx.lineWidth = 0.12;
      for (const [tx, ty] of [
        [-14, -6],
        [12, -4],
        [4, -14],
        [-6, -13],
        [16, -10],
      ]) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }

      // glowing towns; Barcelona is the big one at the origin
      const glow = (px: number, py: number, s: number, a2: number) => {
        const gg = ctx.createRadialGradient(px, py, 0, px, py, s);
        gg.addColorStop(0, `rgba(${pal.glowWarm},${0.95 * a2})`);
        gg.addColorStop(0.45, `rgba(${pal.glowWarm},${0.3 * a2})`);
        gg.addColorStop(1, `rgba(${pal.glowWarm},0)`);
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(px, py, s, 0, Math.PI * 2);
        ctx.fill();
      };
      glow(0, -0.6, 2.6, 1);
      glow(6.5, -0.7, 0.8, 0.55); // Badalona / Maresme
      glow(-6.8, -0.5, 0.7, 0.5); // El Prat / delta
      glow(3.5, -6.5, 0.5, 0.4); // inland towns
      glow(-3.2, -8, 0.5, 0.35);

      // target ring on Barcelona
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
      ctx.strokeStyle = pal.accent2;
      ctx.lineWidth = 0.08;
      ctx.globalAlpha = alpha * (0.45 + 0.45 * pulse);
      ctx.beginPath();
      ctx.arc(0, -0.6, 1.1 + pulse * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const start = performance.now();
    const DURATION = 14000;
    let raf = 0;

    const draw = (now: number) => {
      const p = clamp((now - start) / DURATION);
      const time = now / 1000;

      if (!twinFired.current && p > 0.8) {
        twinFired.current = true;
        onTwinReady?.();
      }

      /* phase map */
      const spaceA = 1 - seg(p, 0.14, 0.21);
      const earthT = seg(p, 0, 0.21);
      const regionA = seg(p, 0.13, 0.185) * (1 - seg(p, 0.275, 0.335));
      const regionT = seg(p, 0.12, 0.34);
      const scan = seg(p, 0.38, 0.52);
      const sat = 1 - seg(p, 0.4, 0.52);
      const rise = smooth(seg(p, 0.52, 0.68));
      const tilt = smooth(seg(p, 0.68, 0.82));
      const lifeA = seg(p, 0.72, 0.82);
      const hiT = smooth(seg(p, 0.82, 1));

      pitch = 0.16 * rise + (PITCH_END - 0.16) * tilt;

      /* camera: settle after the dive, then push toward the tagged building */
      scale =
        baseScale *
        (0.86 + 0.14 * smooth(seg(p, 0.27, 0.45))) *
        (1 + (HI_ZOOM - 1) * hiT);
      const frx = (hb.cx - CX) * cosR - (hb.cy - CY) * sinR;
      const fry = (hb.cx - CX) * sinR + (hb.cy - CY) * cosR;
      const fz = hb.h * 4 * (1 + 0.4 * hiT) * 0.5;
      const desOx = W / 2 - frx * scale;
      const desOy =
        H * 0.52 - (fry * Math.cos(pitch) - fz * Math.sin(pitch)) * scale;
      ox = baseOx + (desOx - baseOx) * hiT;
      oy = baseOy + (desOy - baseOy) * hiT;

      ctx.clearRect(0, 0, W, H);

      /* ═══ CITY (drawn first, revealed as the overlays fade) ═══ */
      if (p > 0.24) {
        // sea
        ctx.fillStyle = pal.water;
        ctx.fillRect(0, 0, W, H);

        // landmass above the coastline
        const landPts: Pt[] = [];
        for (let x = BX0 - 2; x <= BX1 + 2; x += 0.5)
          landPts.push(proj(x, coastY(x)));
        landPts.push(proj(BX1 + 2, BY1 + 2));
        landPts.push(proj(BX0 - 2, BY1 + 2));
        poly(landPts, pal.land);

        // port breakwaters
        poly(
          [
            proj(-5.8, -0.02),
            proj(-2.5, -0.05),
            proj(-2.4, -0.42),
            proj(-4.3, -0.58),
            proj(-5.8, -0.4),
          ],
          shadeHex(theme === "dark" ? "#101a26" : "#dce4ee", 1)
        );
        poly(
          [proj(-2.2, -0.08), proj(-0.9, -0.55), proj(-0.7, -0.32), proj(-1.9, 0.02)],
          shadeHex(theme === "dark" ? "#101a26" : "#dce4ee", 1)
        );

        // Montjuïc + Collserola (parks / hills)
        poly(
          [proj(-9.2, 0.2), proj(-5.6, 0.32), proj(-5.3, 1.5), proj(-6.6, 2.3), proj(-8.7, 2.0)],
          pal.park
        );
        const hillPts: Pt[] = [];
        for (let x = BX0 - 2; x <= BX1 + 2; x += 0.5)
          hillPts.push(proj(x, hillsY(x)));
        hillPts.push(proj(BX1 + 2, BY1 + 2));
        hillPts.push(proj(BX0 - 2, BY1 + 2));
        ctx.globalAlpha = 0.9;
        poly(hillPts, pal.park);
        ctx.globalAlpha = 1;

        // coastline glow during the scan
        if (scan > 0) {
          ctx.globalAlpha = 0.3 * scan;
          const cl: Pt[] = [];
          for (let x = BX0; x <= BX1; x += 0.4) cl.push(proj(x, coastY(x)));
          ctx.strokeStyle = pal.accent;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cl[0].x, cl[0].y);
          for (const q of cl) ctx.lineTo(q.x, q.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // optional real satellite plate
        if (img && sat > 0.01) {
          ctx.save();
          ctx.globalAlpha = sat * 0.9;
          ctx.translate(ox, oy);
          ctx.scale(scale, scale * Math.cos(pitch));
          ctx.rotate(ROT);
          ctx.filter = "saturate(0.4) brightness(0.92)";
          ctx.drawImage(img, BX0 - CX, SEA - CY, BX1 - BX0, BY1 - SEA);
          ctx.filter = "none";
          ctx.restore();
          ctx.globalAlpha = 1;
        }

        /* blocks: satellite plate → wireframe → extruded volumes */
        const plateA = img ? 0.35 : 1;
        const mX = 3 * scale;
        for (const b of blocks) {
          const c0 = proj(b.cx, b.cy, 0);
          if (c0.x < -mX || c0.x > W + mX || c0.y < -mX || c0.y > H + mX * 2)
            continue;

          const foot = b.pts.map((q) => proj(q.x, q.y));

          if (sat > 0.01) {
            const shade = 0.72 + rnd(b.cx * 9, b.cy * 7) * 0.4;
            ctx.globalAlpha = sat * plateA;
            poly(foot, shadeHex(pal.satBlock, shade));
            ctx.globalAlpha = 1;
          }

          if (scan <= b.order) continue;

          const wireA = clamp((scan - b.order) * 6) * (1 - rise * 0.75);
          if (wireA > 0.01) {
            ctx.globalAlpha = wireA * 0.9;
            poly(foot, undefined, pal.wire, 1);
            ctx.globalAlpha = 1;
          }

          const grow = b.hi ? 1 + 0.4 * hiT : 1;
          const z = b.h * rise * 4 * grow;
          if (z < 0.03) continue;

          const topPts = b.pts.map((q) => proj(q.x, q.y, z));

          const fL = b.hi ? mixHex(pal.faceL, pal.accent, hiT * 0.5) : pal.faceL;
          const fR = b.hi ? mixHex(pal.faceR, pal.accent, hiT * 0.7) : pal.faceR;
          const fT = b.hi
            ? mixHex(pal.top, pal.accent, hiT * 0.9)
            : shadeHex(pal.top, 0.82 + rnd(b.cy * 3, b.cx * 5) * 0.32);

          for (let i = 0; i < foot.length; i++) {
            const j = (i + 1) % foot.length;
            const dy = foot[j].y - foot[i].y;
            if (Math.abs(dy) < 0.01) continue;
            poly([foot[i], foot[j], topPts[j], topPts[i]], dy > 0 ? fR : fL);
          }
          poly(topPts, fT);

          if (b.hi && hiT > 0.03) {
            ctx.globalAlpha = hiT;
            ctx.shadowBlur = 14;
            ctx.shadowColor = pal.accent2;
            poly(topPts, undefined, pal.accent2, 1.3);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
          }
        }

        // Diagonal + Gran Via emphasized while scanning
        if (scan > 0.1 && hiT < 0.85) {
          ctx.globalAlpha = clamp(scan) * 0.5 * (1 - hiT);
          ctx.strokeStyle = pal.accent2;
          ctx.lineWidth = 1.4;
          const a = proj(DIAG_A.x, DIAG_A.y);
          const b2 = proj(DIAG_B.x, DIAG_B.y);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b2.x, b2.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // scan line sweeping from the sea inland
        if (scan > 0 && scan < 1) {
          const y = -0.6 + scan * (BY1 + 0.6);
          const a = proj(BX0 - 2, y);
          const c = proj(BX1 + 2, y);
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

        // life on the avenues
        if (lifeA > 0) {
          for (const car of cars) {
            car.t = (car.t + car.spd * 0.016 * car.dir + 1) % 1;
            let x: number;
            let y: number;
            if (car.onDiag) {
              x = DIAG_A.x + car.t * (DIAG_B.x - DIAG_A.x);
              y = DIAG_A.y + car.t * (DIAG_B.y - DIAG_A.y);
            } else {
              x = -8 + car.t * 16.6;
              y = 2.72;
            }
            const s = proj(x, y, 0.06);
            if (s.x < -20 || s.x > W + 20) continue;
            ctx.globalAlpha = lifeA * 0.9;
            ctx.fillStyle = car.onDiag ? pal.accent2 : pal.accent;
            ctx.beginPath();
            ctx.arc(s.x, s.y, clamp(scale * 0.03, 1.4, 3), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        /* the "Building Simulation" tag */
        if (hiT > 0.15) {
          const A = seg(hiT, 0.15, 0.6);
          const z = hb.h * rise * 4 * (1 + 0.4 * hiT);
          const tip = proj(hb.cx, hb.cy, z);
          const floatY = Math.sin(time * 1.6) * 3;
          const fs = clamp(scale * 0.24, 12, 15);
          ctx.font = `600 ${fs}px Inter, ui-sans-serif, system-ui`;
          const tw = ctx.measureText(label).width;
          const pad = fs * 0.7;
          const tagW = tw + pad * 2 + fs * 0.9;
          const tagH = fs * 2;
          const tagX = clamp(tip.x + scale * 0.5, 8, W - tagW - 8);
          const tagY = clamp(tip.y - scale * 1.15 + floatY, 8, H - tagH - 8);

          // leader line + anchor dot
          ctx.globalAlpha = A;
          ctx.strokeStyle = pal.accent2;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(tip.x, tip.y);
          ctx.lineTo(tagX + tagH * 0.5, tagY + tagH);
          ctx.stroke();
          const pulse = 0.5 + 0.5 * Math.sin(time * 2.6);
          ctx.fillStyle = pal.accent2;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = pal.accent2;
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 5 + pulse * 6, 0, Math.PI * 2);
          ctx.stroke();

          // tag
          ctx.fillStyle = pal.tagBg;
          ctx.strokeStyle = `rgba(${aRGB},0.65)`;
          ctx.lineWidth = 1;
          rrect(tagX, tagY, tagW, tagH, tagH / 2);
          ctx.fill();
          ctx.stroke();
          // status dot + text
          ctx.fillStyle = pal.accent;
          ctx.beginPath();
          ctx.arc(tagX + pad * 0.85, tagY + tagH / 2, fs * 0.26, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = pal.ink;
          ctx.textBaseline = "middle";
          ctx.fillText(label, tagX + pad * 0.85 + fs * 0.75, tagY + tagH / 2 + 0.5);
          ctx.globalAlpha = 1;
        }
      } else {
        ctx.fillStyle = pal.water;
        ctx.fillRect(0, 0, W, H);
      }

      /* ═══ overlays: the dive from space (drawn on top, fading out) ═══ */
      if (regionA > 0.004) drawRegion(regionA, regionT, time);
      if (spaceA > 0.004) drawSpace(spaceA, earthT, time);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [theme, onTwinReady, satelliteImage, label]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
