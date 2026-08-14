/**
 * Lightweight 2D gradient noise generator.
 */

const PERM_SIZE = 256;

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

export class Noise2D {
  private perm: Uint8Array;
  private gradients: [number, number][];

  constructor(seed = 1337) {
    const rand = mulberry32(seed);
    const base = new Uint8Array(PERM_SIZE);
    for (let i = 0; i < PERM_SIZE; i++) base[i] = i;
    for (let i = PERM_SIZE - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = base[i];
      base[i] = base[j];
      base[j] = tmp;
    }
    this.perm = new Uint8Array(PERM_SIZE * 2);
    for (let i = 0; i < PERM_SIZE * 2; i++) this.perm[i] = base[i & 255];
    this.gradients = [];
    for (let i = 0; i < PERM_SIZE; i++) {
      const angle = (i / PERM_SIZE) * Math.PI * 2;
      this.gradients.push([Math.cos(angle), Math.sin(angle)]);
    }
  }

  private gradAt(hash: number, x: number, y: number) {
    const g = this.gradients[hash & 255];
    return g[0] * x + g[1] * y;
  }

  noise(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = this.perm[this.perm[xi] + yi];
    const ab = this.perm[this.perm[xi] + yi + 1];
    const ba = this.perm[this.perm[xi + 1] + yi];
    const bb = this.perm[this.perm[xi + 1] + yi + 1];
    const x1 = lerp(this.gradAt(aa, xf, yf), this.gradAt(ba, xf - 1, yf), u);
    const x2 = lerp(this.gradAt(ab, xf, yf - 1), this.gradAt(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v);
  }

  fbm(x: number, y: number, octaves = 3): number {
    let total = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      max += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return total / max;
  }
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function clamp(x: number, min: number, max: number) {
  return Math.min(max, Math.max(min, x));
}
