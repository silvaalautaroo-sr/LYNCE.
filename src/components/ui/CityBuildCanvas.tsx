"use client";

import { useEffect, useRef } from "react";

interface CityBuildCanvasProps {
  theme: "dark" | "light";
  /** Fired once when the digital-twin stage begins (HUD appears). */
  onTwinReady?: () => void;
  /**
   * Aerial photo shown at the start (e.g. /central-park.jpg in /public),
   * cropped like the reference: Central Park vertical, north up.
   * The scanner consumes it progressively, revealing the code-built twin.
   */
  satelliteImage?: string;
  /** Tag text for the highlighted building. */
  label?: string;
}

/* ============================================================================
 * CENTRAL PARK — FINAL SEQUENCE
 *
 *   1. PHOTO   — the aerial image of NY appears, slightly dimmed.
 *   2. SCAN    — a scanner line climbs the image; wherever it has passed,
 *                the photo is replaced by the code-built digital twin (plan).
 *   3. TWIN    — the city now lives as a flat wireframe twin.
 *   4. CAMERA  — the view swings to a lateral isometric angle (rotation +
 *                tilt), so buildings will show TWO faces.
 *   5. RISE    — the buildings extrude out of their footprints, in 3/4 view.
 *   6. ZOOM    — the camera pushes into one building beside the park.
 *   7. TAG     — it is painted in the theme accent: "Simulation Builder".
 * ========================================================================== */

interface Palette {
  land: string;
  satBlock: string;
  wire: string;
  faceF: string; // front faces (toward camera)
  faceS: string; // side faces
  top: string;
  park: string;
  parkDark: string;
  meadow: string;
  water: string;
  accent: string;
  accent2: string;
  window: string;
  ink: string;
  tagBg: string;
}

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    land: "#0a1119",
    satBlock: "#243040",
    wire: "#18c29c",
    faceF: "#14243a",
    faceS: "#0e1826",
    top: "#1d3a52",
    park: "#1a5c46",
    parkDark: "#14493a",
    meadow: "#2b7a58",
    water: "#123d5c",
    accent: "#18c29c",
    accent2: "#53e4e1",
    window: "#7ff0dc",
    ink: "#eaf4ff",
    tagBg: "rgba(8,16,26,0.82)",
  },
  light: {
    land: "#e8edf4",
    satBlock: "#c3cdd9",
    wire: "#e8834f",
    faceF: "#d6dfea",
    faceS: "#c4d0de",
    top: "#f4f8fd",
    park: "#8fc4a6",
    parkDark: "#7db394",
    meadow: "#a4d4b6",
    water: "#8fc0e0",
    accent: "#e8834f",
    accent2: "#f2739c",
    window: "#f7b98e",
    ink: "#13202e",
    tagBg: "rgba(255,255,255,0.85)",
  },
};

const ACCENT_RGB: Record<"dark" | "light", string> = {
  dark: "24,194,156",
  light: "232,131,79",
};

/* ── Manhattan frame around Central Park ──────────────────────────────────── */
const AVE = 3.5;
const UC = 6.5; // framing centred on the park (like the reference photo)
const VB0 = 60;
const VB1 = 108;
const VW0 = 70;
const VW1 = 98;
const VC = (VW0 + VW1) / 2;
const PARK = { u0: 5, u1: 8, v0: 59, v1: 110 };
const ROT_BASE = Math.PI; // top-down: north up, west left
const ROT_ISO = -0.55; // extra swing for the lateral isometric view (~31°)
const PITCH_END = 0.62;
const HI_ZOOM = 2.4;

const rnd = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const seg = (p: number, s: number, e: number) => clamp((p - s) / (e - s));
const smooth = (t: number) => t * t * (3 - 2 * t);

const inPark = (u: number, v: number) =>
  u >= PARK.u0 && u < PARK.u1 && v >= PARK.v0 && v < PARK.v1;

const heightAt = (u: number, v: number) => {
  const midtown = Math.max(0, 68 - v) * 0.065;
  const frontline = u === 4 || u === 8 ? 0.18 : 0;
  return 0.3 + rnd(u * 7.3, v * 1.9) * 0.45 + midtown + frontline;
};

interface Block {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  cu: number;
  cv: number;
  wx: number; // world x of centre (precomputed)
  wy: number; // world y of centre
  h: number;
  lit: boolean;
  order: number;
  hi: boolean;
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

export function CityBuildCanvas({
  theme,
  onTwinReady,
  satelliteImage,
  label = "Simulation Builder",
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

    let img: HTMLImageElement | null = null;
    if (satelliteImage) {
      const im = new Image();
      im.src = satelliteImage;
      im.onload = () => {
        img = im;
      };
    }

    /* ── build the city once ──────────────────────────────────────────────── */
    const blocks: Block[] = [];
    for (let v = VB0; v < VB1; v += 2) {
      for (let u = 0; u <= 10; u++) {
        if (inPark(u + 0.5, v + 1)) continue;
        blocks.push({
          u0: u + 0.12,
          u1: u + 0.88,
          v0: v + 0.25,
          v1: v + 1.75,
          cu: u + 0.5,
          cv: v + 1,
          wx: (u + 0.5 - UC) * AVE,
          wy: v + 1 - VC,
          h: heightAt(u, v),
          lit: rnd(u * 3.1, v * 5.7) > 0.4,
          order: (v - VB0) / (VB1 - VB0),
          hi: false,
        });
      }
    }
    let hb = blocks[0];
    let best = 1e9;
    for (const b of blocks) {
      const d = Math.hypot(b.cu - 8.5, b.cv - 87);
      if (d < best) {
        best = d;
        hb = b;
      }
    }
    hb.hi = true;
    hb.h = Math.max(hb.h, 0.85);

    const foliage = Array.from({ length: 260 }, (_, i) => ({
      u: PARK.u0 + 0.12 + rnd(i, 61) * (PARK.u1 - PARK.u0 - 0.24),
      v: VB0 + rnd(i, 62) * (VB1 - VB0),
      r: 0.5 + rnd(i, 63) * 1.4,
      tone: rnd(i, 64),
    }));

    const reservoir: { u: number; v: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const w = 1 + 0.14 * Math.sin(a * 3 + 1.3) + 0.08 * Math.sin(a * 5);
      reservoir.push({
        u: 6.4 + Math.cos(a) * 1.0 * w,
        v: 91 + Math.sin(a) * 4.6 * w,
      });
    }

    const meadows = [
      { u0: 5.7, u1: 7.3, v0: 79.2, v1: 84.4 },
      { u0: 5.4, u1: 7.0, v0: 97.2, v1: 101.6 },
      { u0: 5.2, u1: 6.4, v0: 66.2, v1: 69.4 },
    ];
    const transverses = [79.1, 85.7, 96.7];

    const cars = Array.from({ length: 10 }, (_, i) => ({
      lane: i % 2 === 0 ? 5.0 : 8.03,
      t: rnd(i, 71),
      spd: 0.035 + rnd(i, 72) * 0.04,
      dir: rnd(i, 73) > 0.5 ? 1 : -1,
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
    let cosR = -1; // updated per frame (rotation is animated)
    let sinR = 0;

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
      const spanX = 11.5 * AVE;
      const spanY = (VW1 - VW0) * Math.cos(PITCH_END);
      baseScale = Math.min((W * 0.98) / spanX, (H * 0.94) / spanY);
      baseOx = W / 2;
      baseOy = H / 2;
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

    /** Extrude a block: back walls first, front last, then the roof. */
    const drawPrism = (
      foot: Pt[],
      top: Pt[],
      faceF: string,
      faceS: string,
      topFill: string
    ) => {
      const walls: { i: number; j: number; midY: number; front: boolean }[] = [];
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        const dx = foot[j].x - foot[i].x;
        const dy = foot[j].y - foot[i].y;
        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) continue;
        walls.push({
          i,
          j,
          midY: (foot[i].y + foot[j].y) / 2,
          front: Math.abs(dx) >= Math.abs(dy),
        });
      }
      walls.sort((a, b) => a.midY - b.midY);
      for (const w of walls)
        poly([foot[w.i], foot[w.j], top[w.j], top[w.i]], w.front ? faceF : faceS);
      poly(top, topFill);
    };

    const start = performance.now();
    const DURATION = 13000;
    let raf = 0;

    const draw = (now: number) => {
      const p = clamp((now - start) / DURATION);
      const time = now / 1000;

      if (!twinFired.current && p > 0.74) {
        twinFired.current = true;
        onTwinReady?.();
      }

      /* ── phase map (the final script) ── */
      const scan = seg(p, 0.06, 0.28); // 2. the scanner climbs the image
      const sat = 1 - seg(p, 0.26, 0.34); // procedural plate fallback fade
      const camT = smooth(seg(p, 0.36, 0.56)); // 4. swing to lateral isometric
      const rise = smooth(seg(p, 0.56, 0.74)); // 5. buildings rise, in 3/4 view
      const duskA = seg(p, 0.64, 0.78);
      const lifeA = seg(p, 0.68, 0.78);
      const hiT = smooth(seg(p, 0.78, 0.96)); // 6-7. zoom + paint + tag

      /* camera: animated rotation + tilt, then push-in */
      const rot = ROT_BASE + ROT_ISO * camT;
      cosR = Math.cos(rot);
      sinR = Math.sin(rot);
      pitch = PITCH_END * camT;
      scale = baseScale * (1 + (HI_ZOOM - 1) * hiT);
      const frx = hb.wx * cosR - hb.wy * sinR;
      const fry = hb.wx * sinR + hb.wy * cosR;
      const fz = hb.h * 5.2 * (1 + 0.4 * hiT) * 0.5;
      const desOx = W / 2 - frx * scale;
      const desOy =
        H * 0.54 - (fry * Math.cos(pitch) - fz * Math.sin(pitch)) * scale;
      ox = baseOx + (desOx - baseOx) * hiT;
      oy = baseOy + (desOy - baseOy) * hiT;

      /* painter's order follows the animated rotation */
      blocks.sort(
        (a, b) => a.wx * sinR + a.wy * cosR - (b.wx * sinR + b.wy * cosR)
      );

      ctx.clearRect(0, 0, W, H);

      /* ground */
      ctx.fillStyle = pal.land;
      ctx.fillRect(0, 0, W, H);

      /* ── Central Park ── */
      poly(
        [
          proj(PARK.u0, VB0 - 2),
          proj(PARK.u1, VB0 - 2),
          proj(PARK.u1, VB1 + 2),
          proj(PARK.u0, VB1 + 2),
        ],
        pal.park
      );
      for (const f of foliage) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = f.tone > 0.5 ? pal.meadow : pal.parkDark;
        const s = proj(f.u, f.v);
        ctx.beginPath();
        ctx.arc(s.x, s.y, f.r * clamp(scale * 0.04, 0.7, 2.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (const m of meadows) {
        ctx.globalAlpha = 0.9;
        poly(
          [proj(m.u0, m.v0), proj(m.u1, m.v0), proj(m.u1, m.v1), proj(m.u0, m.v1)],
          pal.meadow
        );
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = pal.land;
      ctx.lineWidth = clamp(scale * 0.05, 1, 3);
      for (const tv of transverses) {
        const a = proj(PARK.u0, tv);
        const b = proj(PARK.u1, tv);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      poly(
        reservoir.map((q) => proj(q.u, q.v)),
        pal.water,
        theme === "dark" ? "rgba(127,240,220,0.25)" : "rgba(255,255,255,0.5)",
        1
      );

      /* 1-2. the aerial photo, slightly dimmed, consumed by the scanner.
         (Photo phase lives entirely before the camera swing, so the frontal
         mapping below stays valid.) */
      if (img && p < 0.36) {
        const photoA = 1 - seg(p, 0.28, 0.34);
        if (photoA > 0.01) {
          const dw = 11.5 * AVE;
          const dh = VB1 - VB0;
          const x0 = -(11.5 - UC) * AVE;
          const y0 = -(VB1 - VC);
          const destAspect = dw / dh;
          const imgAspect = img.width / img.height;
          let sx = 0;
          let sy = 0;
          let sw = img.width;
          let sh = img.height;
          if (imgAspect > destAspect) {
            sw = img.height * destAspect;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / destAspect;
            sy = (img.height - sh) / 2;
          }
          ctx.save();
          ctx.globalAlpha = photoA * 0.82; // "un poco opaca"
          ctx.translate(ox, oy);
          ctx.scale(scale, scale * Math.cos(pitch));
          if (scan > 0) {
            const vS = VB0 + scan * (VB1 - VB0);
            const yS = -(vS - VC);
            ctx.beginPath();
            ctx.rect(x0, y0, dw, yS - y0); // photo survives only north of the sweep
            ctx.clip();
          }
          ctx.filter = "saturate(0.7) brightness(0.85)";
          ctx.drawImage(img, sx, sy, sw, sh, x0, y0, dw, dh);
          ctx.filter = "none";
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }

      /* ── blocks: plan plates → wireframe twin → extrusion ── */
      const plateA = img ? 0 : 1;
      const mX = 3 * scale;
      for (const b of blocks) {
        const c0 = proj(b.cu, b.cv, 0);
        if (c0.x < -mX || c0.x > W + mX || c0.y < -mX * 2 || c0.y > H + mX * 2)
          continue;

        const foot: Pt[] = [
          proj(b.u0, b.v0),
          proj(b.u1, b.v0),
          proj(b.u1, b.v1),
          proj(b.u0, b.v1),
        ];

        if (sat > 0.01 && plateA > 0) {
          const shade = 0.7 + rnd(b.cu * 9, b.cv * 7) * 0.45;
          ctx.globalAlpha = sat * plateA;
          poly(foot, shadeHex(pal.satBlock, shade));
          ctx.globalAlpha = 1;
        }

        if (scan <= b.order) continue;

        // 3. the flat wireframe twin (persists until the rise consumes it)
        const wireA = clamp((scan - b.order) * 6) * (1 - rise * 0.8);
        if (wireA > 0.01) {
          ctx.globalAlpha = wireA * 0.9;
          poly(foot, undefined, pal.wire, 1);
          ctx.globalAlpha = 1;
        }

        const grow = b.hi ? 1 + 0.4 * hiT : 1;
        const z = b.h * rise * 5.2 * grow;
        if (z < 0.04) continue;

        const top: Pt[] = [
          proj(b.u0, b.v0, z),
          proj(b.u1, b.v0, z),
          proj(b.u1, b.v1, z),
          proj(b.u0, b.v1, z),
        ];

        const fF = b.hi ? mixHex(pal.faceF, pal.accent, hiT * 0.7) : pal.faceF;
        const fS = b.hi ? mixHex(pal.faceS, pal.accent, hiT * 0.5) : pal.faceS;
        const fT = b.hi
          ? mixHex(pal.top, pal.accent, hiT * 0.9)
          : shadeHex(pal.top, 0.82 + rnd(b.cv * 3, b.cu * 5) * 0.32);

        drawPrism(foot, top, fF, fS, fT);

        if (b.hi && hiT > 0.03) {
          ctx.globalAlpha = hiT;
          ctx.shadowBlur = 14;
          ctx.shadowColor = pal.accent2;
          poly(top, undefined, pal.accent2, 1.3);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }

        if (duskA > 0 && b.lit && z > 1.4 && !b.hi) {
          const c = proj(b.cu, b.cv, z * 0.55);
          const tw = 0.55 + 0.45 * Math.sin(time * 2 + b.cu * 3 + b.cv);
          ctx.globalAlpha = duskA * tw * 0.75;
          ctx.fillStyle = pal.window;
          ctx.fillRect(c.x - 1.3, c.y - 1.3, 2.6, 2.6);
          ctx.globalAlpha = 1;
        }
      }

      /* scan line climbing the image */
      if (scan > 0 && scan < 1) {
        const v = VB0 + scan * (VB1 - VB0);
        const a = proj(-1.5, v);
        const c = proj(13, v);
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

      /* avenue traffic beside the park */
      if (lifeA > 0) {
        for (const car of cars) {
          car.t = (car.t + car.spd * 0.016 * car.dir + 1) % 1;
          const v = VB0 + car.t * (VB1 - VB0);
          const s = proj(car.lane, v, 0.06);
          if (s.y < -20 || s.y > H + 20 || s.x < -20 || s.x > W + 20) continue;
          ctx.globalAlpha = lifeA * 0.9;
          ctx.fillStyle = car.lane < 6 ? pal.accent : pal.accent2;
          ctx.beginPath();
          ctx.arc(s.x, s.y, clamp(scale * 0.04, 1.4, 3), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      /* 7. the "Simulation Builder" tag */
      if (hiT > 0.15) {
        const A = seg(hiT, 0.15, 0.6);
        const z = hb.h * rise * 5.2 * (1 + 0.4 * hiT);
        const tip = proj(hb.cu, hb.cv, z);
        const floatY = Math.sin(time * 1.6) * 3;
        const fs = clamp(scale * 0.32, 12, 15);
        ctx.font = `600 ${fs}px Inter, ui-sans-serif, system-ui`;
        const tw = ctx.measureText(label).width;
        const pad = fs * 0.7;
        const tagW = tw + pad * 2 + fs * 0.9;
        const tagH = fs * 2;
        const tagX = clamp(tip.x + scale * 0.9, 8, W - tagW - 8);
        const tagY = clamp(tip.y - scale * 1.6 + floatY, 8, H - tagH - 8);

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
        ctx.fillStyle = pal.tagBg;
        ctx.strokeStyle = `rgba(${aRGB},0.65)`;
        ctx.lineWidth = 1;
        rrect(tagX, tagY, tagW, tagH, tagH / 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.arc(tagX + pad * 0.85, tagY + tagH / 2, fs * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.ink;
        ctx.textBaseline = "middle";
        ctx.fillText(label, tagX + pad * 0.85 + fs * 0.75, tagY + tagH / 2 + 0.5);
        ctx.globalAlpha = 1;
      }

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
