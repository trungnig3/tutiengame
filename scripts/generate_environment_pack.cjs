/**
 * PHASE 2.3 – ENVIRONMENT PIXEL ART ASSET PACK GENERATOR (REFINED HD XIANXIA EDITION)
 * Project: Phàm Trần Tiên Lộ (凡尘仙路)
 *
 * Generates cohesive, seamless, Nearest-Neighbor HD Pixel Art assets in:
 *   public/assets/pixel-art/environment/
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT_ROOT = path.resolve(__dirname, '../public/assets/pixel-art/environment');
const TILES_DIR = path.join(OUT_ROOT, 'tilesets');
const OBJ_DIR = path.join(OUT_ROOT, 'objects');

fs.mkdirSync(TILES_DIR, { recursive: true });
fs.mkdirSync(OBJ_DIR, { recursive: true });

function hex(h, a = 255) {
  const s = h.replace('#', '');
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
    a,
  ];
}

const PAL = {
  inkDark: hex('#0b132b'),
  inkBrown: hex('#1c120c'),
  inkStone: hex('#151824'),
  shadowAlpha: [11, 19, 43, 74],

  // Grass (Thanh Khê)
  grassDeep: hex('#173b2c'),
  grassDark: hex('#265c42'),
  grassMid: hex('#37825a'),
  grassLight: hex('#4ca673'),
  grassHighlight: hex('#73c48e'),
  grassSunlit: hex('#9ae0ae'),

  // Dark Forest Grass (Linh Vụ)
  dgrassDeep: hex('#0d241c'),
  dgrassDark: hex('#16382b'),
  dgrassMid: hex('#224f3c'),
  dgrassLight: hex('#326b50'),
  dgrassHi: hex('#498a68'),

  // Dry Grass (Hắc Phong Sơn)
  dryDeep: hex('#3d301b'),
  dryDark: hex('#5c4727'),
  dryMid: hex('#7a5f35'),
  dryLight: hex('#9c7b46'),
  dryTip: hex('#bfa05e'),

  // Earth & Dirt
  dirtDeep: hex('#382214'),
  dirtDark: hex('#52331f'),
  dirtMid: hex('#70472c'),
  dirtLight: hex('#8f5e3d'),
  dirtPale: hex('#ad7953'),

  // Sand / Gravel
  sandDark: hex('#7a684b'),
  sandMid: hex('#9c8763'),
  sandLight: hex('#bda67e'),
  sandPale: hex('#d9c59e'),

  // Stone
  stoneDeep: hex('#222633'),
  stoneDark: hex('#383e52'),
  stoneMid: hex('#525b73'),
  stoneLight: hex('#737e9c'),
  stoneHigh: hex('#9aa6c2'),

  // Dark Mountain Basalt (Hắc Phong Sơn)
  basaltDeep: hex('#12111a'),
  basaltDark: hex('#1f1d2b'),
  basaltMid: hex('#2f2c40'),
  basaltLight: hex('#45415c'),
  basaltEdge: hex('#615b7d'),

  // Sect Jade Plaza
  jadeDeep: hex('#163f57'),
  jadeDark: hex('#245d75'),
  jadeMid: hex('#4e8291'),
  jadeLight: hex('#83b1bf'),
  jadeHigh: hex('#cde5eb'),

  // Ruins Purple Slate
  ruinDeep: hex('#1a1226'),
  ruinDark: hex('#2b1e40'),
  ruinMid: hex('#412e5e'),
  ruinLight: hex('#61468a'),

  // Water
  waterAbyss: hex('#0a223d'),
  waterDeep: hex('#123963'),
  waterMid: hex('#1c5887'),
  waterLight: hex('#2b7ea8'),
  waterBright: hex('#52a9cc'),
  waterFoam: hex('#7cc4d9'),
  darkWaterDeep: hex('#161126'),
  darkWaterMid: hex('#261c42'),
  darkWaterLight: hex('#3d2c69'),
  bloodWaterDeep: hex('#330912'),
  bloodWaterMid: hex('#591220'),
  bloodWaterLight: hex('#8c2032'),

  // Wood & Bark
  woodDeep: hex('#26150b'),
  woodDark: hex('#422515'),
  woodMid: hex('#633922'),
  woodLight: hex('#875032'),
  woodHigh: hex('#ab6d48'),

  // Roofs
  roofDeep: hex('#141b26'),
  roofDark: hex('#232e40'),
  roofMid: hex('#35445c'),
  roofLight: hex('#4f6482'),
  sectRoofDeep: hex('#0c303d'),
  sectRoofDark: hex('#164c5e'),
  sectRoofMid: hex('#236d82'),
  sectRoofLight: hex('#3d96ab'),

  // Accents
  goldDark: hex('#94630f'),
  goldMid: hex('#cc921f'),
  goldBright: hex('#fcd34d'),
  redDeep: hex('#5e1010'),
  redDark: hex('#8c1818'),
  redMid: hex('#cc2424'),
  redBright: hex('#f26666'),
  emberGlow: hex('#fef08a'),
  spiritGlow: hex('#6ee7b7'),
  spiritBlue: hex('#38bdf8'),
  spiritPurple: hex('#c084fc'),
  flowerPink: hex('#f472b6'),
  flowerWhite: hex('#fef2f2'),
  boneDark: hex('#8a806f'),
  boneMid: hex('#c2b8a3'),
  boneLight: hex('#e8e0cf'),
};

class PixelBuffer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4, 0);
  }

  set(x, y, rgba) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.w || iy < 0 || iy >= this.h) return;
    const idx = (iy * this.w + ix) * 4;
    if (rgba[3] === 255) {
      this.data[idx] = rgba[0];
      this.data[idx + 1] = rgba[1];
      this.data[idx + 2] = rgba[2];
      this.data[idx + 3] = 255;
    } else if (rgba[3] > 0) {
      const a = rgba[3] / 255;
      const inv = 1 - a;
      const dstA = this.data[idx + 3] / 255;
      const outA = a + dstA * inv;
      if (outA <= 0) return;
      this.data[idx] = Math.round((rgba[0] * a + this.data[idx] * dstA * inv) / outA);
      this.data[idx + 1] = Math.round((rgba[1] * a + this.data[idx + 1] * dstA * inv) / outA);
      this.data[idx + 2] = Math.round((rgba[2] * a + this.data[idx + 2] * dstA * inv) / outA);
      this.data[idx + 3] = Math.round(outA * 255);
    }
  }

  get(x, y) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return [0, 0, 0, 0];
    const idx = (y * this.w + x) * 4;
    return [this.data[idx], this.data[idx + 1], this.data[idx + 2], this.data[idx + 3]];
  }

  fillRect(x, y, w, h, rgba) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.set(px, py, rgba);
      }
    }
  }

  fillEllipse(cx, cy, rx, ry, rgba) {
    const x0 = Math.floor(cx - rx - 1);
    const x1 = Math.ceil(cx + rx + 1);
    const y0 = Math.floor(cy - ry - 1);
    const y1 = Math.ceil(cy + ry + 1);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1.0) this.set(x, y, rgba);
      }
    }
  }

  addOutline(outlineCol, minX = 1, minY = 1, maxX = this.w - 2, maxY = this.h - 2) {
    const copy = Buffer.from(this.data);
    const alphaAt = (x, y) => {
      if (x < 0 || x >= this.w || y < 0 || y >= this.h) return 0;
      return copy[(y * this.w + x) * 4 + 3];
    };
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (alphaAt(x, y) === 0) {
          if (
            alphaAt(x - 1, y) > 128 ||
            alphaAt(x + 1, y) > 128 ||
            alphaAt(x, y - 1) > 128 ||
            alphaAt(x, y + 1) > 128
          ) {
            this.set(x, y, outlineCol);
          }
        }
      }
    }
  }

  async savePng(outPath) {
    await sharp(this.data, {
      raw: { width: this.w, height: this.h, channels: 4 },
    })
      .png({ compressionLevel: 9, palette: false })
      .toFile(outPath);
  }
}

function hash2d(x, y, seed = 1337) {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
  n = (n ^ (n >>> 13)) | 0;
  n = Math.imul(n, 1274126177);
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 4294967296;
}

function periodicNoise(x, y, period, seed) {
  const fx = (((x % period) + period) % period) / period;
  const fy = (((y % period) + period) % period) / period;
  const angleX = fx * Math.PI * 2;
  const angleY = fy * Math.PI * 2;
  const s1 = Math.sin(angleX + seed * 0.7) * Math.cos(angleY - seed * 0.3);
  const s2 = Math.cos(angleX * 2 - seed * 1.1) * Math.sin(angleY * 2 + seed * 0.9) * 0.5;
  const s3 = Math.sin(angleX * 3 + angleY * 2 + seed) * 0.25;
  return (s1 + s2 + s3 + 1.75) / 3.5;
}

// 1. GROUND TILESET (256x256 - 8x8 grid of 32x32)
function drawGrassTile(buf, ox, oy, palette, seed, variant) {
  const [deep, dark, mid, light, hi] = palette;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const n = periodicNoise(x, y, 32, seed);
      const bayer = ((x & 1) ^ (y & 1)) * 0.08 + ((x & 2) ? 0.04 : -0.04);
      const v = n + bayer;
      let col = mid;
      if (v < 0.36) col = dark;
      else if (v > 0.68) col = light;
      if (hash2d(x, y, seed + 17) > 0.94) col = dark;
      buf.set(ox + x, oy + y, col);
    }
  }
  const bladeCount = variant === 0 ? 6 : variant === 1 ? 10 : variant === 2 ? 14 : 8;
  for (let i = 0; i < bladeCount; i++) {
    const bx = 3 + Math.floor(hash2d(i, seed, 99) * 25);
    const by = 4 + Math.floor(hash2d(seed, i, 77) * 24);
    buf.set(ox + bx, oy + by, deep);
    buf.set(ox + bx + 1, oy + by, deep);
    buf.set(ox + bx, oy + by - 1, light);
    buf.set(ox + bx + 1, oy + by - 1, hi);
    if (i % 2 === 0) {
      buf.set(ox + bx - 1, oy + by - 2, light);
      buf.set(ox + bx + 2, oy + by - 1, dark);
    }
  }
  if (variant === 3) {
    for (let i = 0; i < 3; i++) {
      const fx = 5 + Math.floor(hash2d(i, seed, 301) * 22);
      const fy = 5 + Math.floor(hash2d(seed, i, 302) * 22);
      buf.set(ox + fx, oy + fy, PAL.flowerWhite);
      buf.set(ox + fx + 1, oy + fy, PAL.goldBright);
    }
  }
}

function drawDirtTile(buf, ox, oy, palette, seed, isPath = false) {
  const [deep, dark, mid, light, pale] = palette;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const n = periodicNoise(x, y, 32, seed);
      const grain = hash2d(x, y, seed + 31);
      const bayer = ((x & 1) ^ (y & 1)) * 0.06;
      const v = n + bayer;
      let col = mid;
      if (v < 0.34) col = dark;
      else if (v > 0.68) col = light;
      if (isPath && grain > 0.88) col = pale;
      else if (!isPath && grain < 0.07) col = deep;
      buf.set(ox + x, oy + y, col);
    }
  }
  const pebbleCount = isPath ? 5 : 3;
  for (let i = 0; i < pebbleCount; i++) {
    const px = 4 + Math.floor(hash2d(i, seed, 41) * 22);
    const py = 4 + Math.floor(hash2d(seed, i, 42) * 22);
    buf.set(ox + px, oy + py, light);
    buf.set(ox + px + 1, oy + py, pale);
    buf.set(ox + px, oy + py + 1, deep);
    buf.set(ox + px + 1, oy + py + 1, dark);
  }
}

function drawStoneTile(buf, ox, oy, palette, seed, mossy = false, jade = false) {
  const [deep, dark, mid, light, hi] = palette;
  const rows = [0, 8, 17, 25, 32];
  for (let r = 0; r < rows.length - 1; r++) {
    const y0 = rows[r];
    const y1 = rows[r + 1];
    const shift = (r * 9 + seed) % 16;
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < 32; x++) {
        const sx = (x + shift) % 16;
        const isMortar = y === y0 || sx === 0;
        const isTopEdge = y === y0 + 1 || sx === 1;
        const isBottomEdge = y === y1 - 1 || sx === 15;
        const n = periodicNoise(x, y, 32, seed + r);
        let col = mid;
        if (isMortar) col = deep;
        else if (isTopEdge) col = hi;
        else if (isBottomEdge) col = dark;
        else if (n < 0.35) col = dark;
        else if (n > 0.72) col = light;
        buf.set(ox + x, oy + y, col);
      }
    }
  }
  if (mossy) {
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const m = periodicNoise(x, y, 32, seed + 55);
        if (m > 0.72) {
          buf.set(ox + x, oy + y, m > 0.84 ? PAL.grassLight : PAL.grassDark);
        }
      }
    }
  }
  if (jade) {
    for (let i = 7; i < 25; i++) {
      buf.set(ox + i, oy + 7, hi);
      buf.set(ox + i, oy + 24, dark);
      buf.set(ox + 7, oy + i, hi);
      buf.set(ox + 24, oy + i, dark);
    }
  }
}

function drawWoodDeckTile(buf, ox, oy, vertical = false) {
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const a = vertical ? x : y;
      const b = vertical ? y : x;
      const plank = Math.floor(a / 6);
      const seam = a % 6 === 0;
      const grain = periodicNoise(b, plank * 5, 32, 91);
      let col = PAL.woodMid;
      if (seam) col = PAL.woodDeep;
      else if (a % 6 === 1) col = PAL.woodHigh;
      else if (grain < 0.35) col = PAL.woodDark;
      else if (grain > 0.72) col = PAL.woodLight;
      if (!seam && (b === 3 || b === 28) && a % 6 === 3) col = PAL.inkBrown;
      buf.set(ox + x, oy + y, col);
    }
  }
}

function drawCliffTile(buf, ox, oy, part, darkTheme = false) {
  const pal = darkTheme
    ? [PAL.basaltDeep, PAL.basaltDark, PAL.basaltMid, PAL.basaltLight, PAL.basaltEdge]
    : [PAL.stoneDeep, PAL.stoneDark, PAL.stoneMid, PAL.stoneLight, PAL.stoneHigh];
  const [deep, dark, mid, light, hi] = pal;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const n = periodicNoise(x, y, 32, part.length * 19 + (darkTheme ? 7 : 1));
      if (part === 'top') {
        if (y < 24) {
          buf.set(ox + x, oy + y, n > 0.65 ? hi : n < 0.3 ? dark : mid);
        } else if (y < 27) {
          buf.set(ox + x, oy + y, hi);
        } else {
          buf.set(ox + x, oy + y, deep);
        }
      } else if (part === 'face') {
        const crack = Math.abs(((x * 3 + y) % 16) - 8) < 1;
        buf.set(ox + x, oy + y, crack || y % 11 === 0 ? deep : n > 0.65 ? light : n < 0.35 ? deep : dark);
      } else {
        if (y < 14) buf.set(ox + x, oy + y, y % 4 === 0 ? deep : dark);
        else buf.set(ox + x, oy + y, n > 0.5 ? mid : dark);
      }
    }
  }
}

async function buildGroundTileset() {
  const buf = new PixelBuffer(256, 256);
  const grassPal = [PAL.grassDeep, PAL.grassDark, PAL.grassMid, PAL.grassLight, PAL.grassHighlight];
  const dgrassPal = [PAL.dgrassDeep, PAL.dgrassDark, PAL.dgrassMid, PAL.dgrassLight, PAL.dgrassHi];
  const dryPal = [PAL.dryDeep, PAL.dryDark, PAL.dryMid, PAL.dryLight, PAL.dryTip];
  const dirtPal = [PAL.dirtDeep, PAL.dirtDark, PAL.dirtMid, PAL.dirtLight, PAL.dirtPale];
  const sandPal = [PAL.dirtDark, PAL.sandDark, PAL.sandMid, PAL.sandLight, PAL.sandPale];
  const stonePal = [PAL.stoneDeep, PAL.stoneDark, PAL.stoneMid, PAL.stoneLight, PAL.stoneHigh];
  const basaltPal = [PAL.basaltDeep, PAL.basaltDark, PAL.basaltMid, PAL.basaltLight, PAL.basaltEdge];
  const ruinPal = [PAL.ruinDeep, PAL.ruinDark, PAL.ruinMid, PAL.ruinLight, PAL.stoneHigh];
  const jadePal = [PAL.jadeDeep, PAL.jadeDark, PAL.jadeMid, PAL.jadeLight, PAL.jadeHigh];

  for (let c = 0; c < 4; c++) drawGrassTile(buf, c * 32, 0, grassPal, 10 + c, c);
  for (let c = 0; c < 3; c++) drawGrassTile(buf, (4 + c) * 32, 0, dgrassPal, 20 + c, c);
  drawGrassTile(buf, 7 * 32, 0, dryPal, 30, 0);

  drawGrassTile(buf, 0, 32, dryPal, 31, 1);
  drawGrassTile(buf, 32, 32, dryPal, 32, 2);
  for (let c = 0; c < 3; c++) drawDirtTile(buf, (2 + c) * 32, 32, dirtPal, 40 + c, false);
  for (let c = 0; c < 3; c++) drawDirtTile(buf, (5 + c) * 32, 32, dirtPal, 50 + c, true);

  for (let c = 0; c < 3; c++) drawStoneTile(buf, c * 32, 64, stonePal, 60 + c, false, false);
  for (let c = 0; c < 3; c++) drawStoneTile(buf, (3 + c) * 32, 64, stonePal, 70 + c, true, false);
  for (let c = 0; c < 2; c++) drawDirtTile(buf, (6 + c) * 32, 64, sandPal, 80 + c, true);

  for (let c = 0; c < 3; c++) drawDirtTile(buf, c * 32, 96, basaltPal, 90 + c, c === 2);
  for (let c = 0; c < 3; c++) drawStoneTile(buf, (3 + c) * 32, 96, ruinPal, 100 + c, c === 1, false);
  for (let c = 0; c < 2; c++) drawStoneTile(buf, (6 + c) * 32, 96, jadePal, 110 + c, false, true);

  drawWoodDeckTile(buf, 0, 128, false);
  drawWoodDeckTile(buf, 32, 128, true);
  for (let c = 0; c < 2; c++) {
    const ox = (2 + c) * 32;
    for (let y = 0; y < 32; y++) {
      const step = y % 8;
      const col = step === 0 ? PAL.inkStone : step === 1 ? PAL.stoneHigh : step > 5 ? PAL.stoneDark : PAL.stoneMid;
      for (let x = 0; x < 32; x++) {
        buf.set(ox + x, 128 + y, (x === 0 || x === 31) ? PAL.stoneDeep : col);
      }
    }
  }
  for (let c = 4; c < 8; c++) drawStoneTile(buf, c * 32, 128, stonePal, 130 + c, false, false);

  for (let c = 0; c < 3; c++) drawDirtTile(buf, c * 32, 160, [PAL.dgrassDeep, PAL.dirtDeep, PAL.dirtDark, PAL.dirtMid, PAL.dirtLight], 140 + c, true);
  drawCliffTile(buf, 3 * 32, 160, 'top', false);
  drawCliffTile(buf, 4 * 32, 160, 'top', true);
  drawCliffTile(buf, 5 * 32, 160, 'face', false);
  drawCliffTile(buf, 6 * 32, 160, 'face', false);
  drawCliffTile(buf, 7 * 32, 160, 'face', true);

  drawCliffTile(buf, 0, 192, 'base', false);
  drawCliffTile(buf, 32, 192, 'base', true);
  for (let c = 2; c < 5; c++) drawStoneTile(buf, c * 32, 192, basaltPal, 160 + c, false, false);
  for (let c = 5; c < 8; c++) drawStoneTile(buf, c * 32, 192, ruinPal, 170 + c, true, false);

  for (let c = 0; c < 4; c++) drawGrassTile(buf, c * 32, 224, [PAL.grassDeep, PAL.dgrassMid, PAL.grassMid, PAL.grassLight, PAL.grassSunlit], 180 + c, 3);
  for (let c = 4; c < 8; c++) drawDirtTile(buf, c * 32, 224, [PAL.basaltDeep, PAL.dirtDeep, PAL.basaltDark, PAL.dirtMid, PAL.dirtLight], 190 + c, true);

  await buf.savePng(path.join(TILES_DIR, 'ground_tiles.png'));
}

// 2. TRANSITION TILES (512x192, 16x6 feathered organic edges)
async function buildTransitionTileset() {
  const buf = new PixelBuffer(512, 192);
  const softFoam = hex('#7cbac9');
  const warmBank = hex('#5e4d37');
  const rows = [
    { name: 'grass_dirt', top: [PAL.grassDeep, PAL.grassDark, PAL.grassMid, PAL.grassLight], isWaterEdge: false, seed: 10 },
    { name: 'grass_stone', top: [PAL.grassDeep, PAL.grassDark, PAL.grassMid, PAL.grassLight], isWaterEdge: false, seed: 20 },
    { name: 'dirt_stone', top: [PAL.dirtDeep, PAL.dirtDark, PAL.dirtMid, PAL.dirtLight], isWaterEdge: false, seed: 30 },
    { name: 'grass_water', top: [PAL.sandDark, warmBank, PAL.sandMid, softFoam], isWaterEdge: true, seed: 40 },
    { name: 'water_rock', top: [PAL.stoneDeep, PAL.stoneDark, PAL.stoneMid, softFoam], isWaterEdge: true, seed: 50 },
    { name: 'ground_cliff', top: [PAL.basaltDeep, PAL.basaltDark, PAL.basaltMid, PAL.basaltEdge], isWaterEdge: false, seed: 60 },
  ];

  for (let r = 0; r < rows.length; r++) {
    const spec = rows[r];
    for (let mask = 0; mask < 16; mask++) {
      const ox = mask * 32;
      const oy = r * 32;
      const hasN = (mask & 1) !== 0;
      const hasE = (mask & 2) !== 0;
      const hasS = (mask & 4) !== 0;
      const hasW = (mask & 8) !== 0;

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const wave = Math.sin((x + y) * 0.4 + spec.seed) * 1.1;
          const speck = hash2d(x, y, spec.seed + mask * 13);
          const edgeBand = 3 + Math.floor(wave + speck * 2.2);
          let dist = 99;

          if (hasN) dist = Math.min(dist, y);
          if (hasS) dist = Math.min(dist, 31 - y);
          if (hasW) dist = Math.min(dist, x);
          if (hasE) dist = Math.min(dist, 31 - x);

          if (dist < edgeBand) {
            if (dist === edgeBand - 1 && speck < 0.48) continue;
            if (spec.isWaterEdge) {
              if (dist === edgeBand - 1) buf.set(ox + x, oy + y, spec.top[3]);
              else if (dist <= 1) buf.set(ox + x, oy + y, spec.top[1]);
              else buf.set(ox + x, oy + y, speck > 0.55 ? spec.top[2] : spec.top[0]);
            } else {
              if (dist === edgeBand - 1) buf.set(ox + x, oy + y, spec.top[1]);
              else buf.set(ox + x, oy + y, speck > 0.5 ? spec.top[3] : spec.top[2]);
            }
          }
        }
      }
    }
  }

  await buf.savePng(path.join(TILES_DIR, 'transition_tiles.png'));
}

// 3. ANIMATED WATER TILES (256x128 - seamless periodic ripples & bobbing lotus)
function drawWaterFrame(buf, ox, oy, palette, frame, mode) {
  const [deep, mid, light, foam] = palette;
  const phase = frame * 8;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (mode === 'waterfall') {
        const py = ((y - phase) % 32 + 32) % 32;
        const streak = (x + Math.floor(Math.sin(x * 0.9) * 1.5)) % 6;
        let c = mid;
        if (streak === 0) c = deep;
        else if (streak === 2 || streak === 3) c = (py % 10 < 4 ? foam : light);
        buf.set(ox + x, oy + y, c);
      } else if (mode === 'splash') {
        const px = ((x + phase) % 32 + 32) % 32;
        const r = Math.hypot(x - 15.5, (y - 16) * 1.35 + Math.sin((px / 32) * Math.PI * 2) * 2.5);
        let c = mid;
        if (r < 6 + (frame % 2) * 2) c = foam;
        else if (r < 11) c = light;
        else if ((x + y + phase) % 13 === 0) c = light;
        buf.set(ox + x, oy + y, c);
      } else {
        const px = ((x + frame * 4) % 32 + 32) % 32;
        const py = ((y + frame * 8) % 32 + 32) % 32;
        const n1 = periodicNoise(px, py, 32, 71);
        const n2 = periodicNoise(px * 2, py, 32, 139);
        const ripple = n1 * 0.65 + n2 * 0.35;
        let c = mid;
        if (ripple < 0.38) c = deep;
        else if (ripple > 0.68) c = light;
        if (ripple > 0.85 && (py % 8 === 2) && (px % 11 === 4 || px % 11 === 5)) {
          c = foam;
        }
        buf.set(ox + x, oy + y, c);
      }
    }
  }
  if (mode === 'lotus') {
    const bob = frame % 2 === 0 ? 0 : 1;
    buf.fillEllipse(ox + 16, oy + 17 + bob, 8, 6, PAL.grassDeep);
    buf.fillEllipse(ox + 15, oy + 16 + bob, 6, 4, PAL.grassMid);
    buf.set(ox + 16, oy + 17 + bob, PAL.grassDeep);
    buf.set(ox + 18, oy + 14 + bob, PAL.flowerPink);
    buf.set(ox + 17, oy + 14 + bob, PAL.flowerPink);
    buf.set(ox + 19, oy + 14 + bob, PAL.flowerPink);
    buf.set(ox + 18, oy + 13 + bob, PAL.flowerWhite);
  }
}

async function buildAnimatedWaterTileset() {
  const buf = new PixelBuffer(256, 128);
  const clearPal = [PAL.waterDeep, PAL.waterMid, PAL.waterLight, PAL.waterFoam];
  const shallowPal = [PAL.waterMid, PAL.waterLight, PAL.waterBright, PAL.waterFoam];
  const deepPal = [PAL.waterAbyss, PAL.waterDeep, PAL.waterMid, PAL.waterLight];
  const darkPal = [PAL.darkWaterDeep, PAL.darkWaterMid, PAL.darkWaterLight, PAL.spiritBlue];
  const bloodPal = [PAL.bloodWaterDeep, PAL.bloodWaterMid, PAL.bloodWaterLight, PAL.redBright];

  for (let f = 0; f < 4; f++) {
    drawWaterFrame(buf, f * 32, 0, clearPal, f, 'flow');
    drawWaterFrame(buf, (4 + f) * 32, 0, shallowPal, f, 'flow');
    drawWaterFrame(buf, f * 32, 32, deepPal, f, 'flow');
    drawWaterFrame(buf, (4 + f) * 32, 32, darkPal, f, 'flow');
    drawWaterFrame(buf, f * 32, 64, clearPal, f, 'waterfall');
    drawWaterFrame(buf, (4 + f) * 32, 64, shallowPal, f, 'splash');
    drawWaterFrame(buf, f * 32, 96, clearPal, f, 'lotus');
    drawWaterFrame(buf, (4 + f) * 32, 96, bloodPal, f, 'flow');
  }

  await buf.savePng(path.join(TILES_DIR, 'animated_water_tiles.png'));
}

// 4. ORGANIC PIXEL-SCULPTED FLORA SHEET (512x320)
function drawLeafyCanopyCluster(buf, cx, cy, rx, ry, pal, seed) {
  const [deep, dark, mid, light, hi] = pal;
  for (let y = Math.floor(cy - ry - 3); y <= Math.ceil(cy + ry + 3); y++) {
    for (let x = Math.floor(cx - rx - 3); x <= Math.ceil(cx + rx + 3); x++) {
      const angle = Math.atan2(y - cy, x - cx);
      const leafLobe = Math.sin(angle * 7 + seed) * 0.12 + Math.cos(angle * 13 - seed * 0.5) * 0.07;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = Math.hypot(dx, dy) - leafLobe;
      if (d <= 1.0) {
        const sun = -dx * 0.48 - dy * 0.52;
        const leafTex = ((x ^ y) & 1) * 0.08 + (hash2d(x >> 1, y >> 1, seed) - 0.5) * 0.25;
        const score = sun + leafTex;
        let col = mid;
        if (d > 0.88 && (dy > 0.05 || dx > 0.1)) col = deep;
        else if (score < -0.22) col = dark;
        else if (score > 0.34) col = hi;
        else if (score > 0.1) col = light;
        buf.set(x, y, col);
      }
    }
  }
}

function drawBarkTrunk(buf, cx, baseY, topY, halfW, flaredBase = 6) {
  for (let y = topY; y <= baseY; y++) {
    const t = (y - topY) / Math.max(1, baseY - topY);
    const flare = t > 0.72 ? Math.pow((t - 0.72) / 0.28, 1.5) * flaredBase : 0;
    const hw = Math.round(halfW + flare);
    for (let x = cx - hw; x <= cx + hw; x++) {
      const u = (x - cx) / Math.max(1, hw);
      let col = PAL.woodMid;
      if (u < -0.68 || u > 0.72) col = PAL.woodDeep;
      else if (u < -0.2) col = PAL.woodLight;
      else if (u > 0.28) col = PAL.woodDark;
      if (Math.abs(x - cx) % 4 === 1 && hash2d(x, y >> 1, 71) > 0.45) col = PAL.woodDeep;
      buf.set(x, y, col);
    }
  }
}

async function buildFloraSheet() {
  const buf = new PixelBuffer(512, 320);
  const greenPal = [PAL.grassDeep, PAL.grassDark, PAL.grassMid, PAL.grassLight, PAL.grassHighlight];
  const pinePal = [PAL.dgrassDeep, PAL.dgrassDark, PAL.dgrassMid, PAL.dgrassLight, PAL.dgrassHi];
  const spiritPal = [hex('#114a46'), hex('#1a7066'), hex('#2c9988'), PAL.spiritGlow, hex('#d1fae5')];
  const dryPal = [PAL.dryDeep, PAL.dryDark, PAL.dryMid, PAL.dryLight, PAL.dryTip];

  // 1. ancient_tree (0,0, 128x160)
  {
    const sub = new PixelBuffer(128, 160);
    sub.fillEllipse(64, 147, 36, 9, PAL.shadowAlpha);
    drawBarkTrunk(sub, 64, 146, 84, 10, 9);
    for (let y = 78; y <= 98; y++) {
      const t = (y - 78) / 20;
      sub.fillRect(Math.round(58 - t * 18), y, 8, 2, PAL.woodDark);
      sub.fillRect(Math.round(64 + t * 18), y, 8, 2, PAL.woodDeep);
    }
    drawLeafyCanopyCluster(sub, 64, 72, 46, 26, greenPal, 11);
    drawLeafyCanopyCluster(sub, 38, 64, 29, 22, greenPal, 22);
    drawLeafyCanopyCluster(sub, 90, 66, 29, 22, greenPal, 33);
    drawLeafyCanopyCluster(sub, 62, 46, 36, 25, greenPal, 44);
    drawLeafyCanopyCluster(sub, 56, 30, 22, 16, greenPal, 55);
    sub.addOutline(PAL.inkDark);
    for (let y = 0; y < 160; y++) for (let x = 0; x < 128; x++) buf.set(x, y, sub.get(x, y));
  }

  // 2. pine_tree (128,0, 96x128)
  {
    const sub = new PixelBuffer(96, 128);
    sub.fillEllipse(48, 118, 26, 7, PAL.shadowAlpha);
    drawBarkTrunk(sub, 48, 118, 72, 6, 5);
    const tiers = [
      { cy: 74, w: 38, h: 24 },
      { cy: 56, w: 31, h: 22 },
      { cy: 38, w: 23, h: 20 },
      { cy: 22, w: 14, h: 16 },
    ];
    for (const tier of tiers) {
      for (let dy = 0; dy <= tier.h; dy++) {
        const p = dy / tier.h;
        const hw = Math.round(tier.w * p) + Math.round(Math.sin(dy * 1.4) * 2);
        for (let dx = -hw; dx <= hw; dx++) {
          const x = 48 + dx;
          const y = tier.cy - tier.h / 2 + dy;
          const fringe = dy >= tier.h - 3 && Math.abs(dx) % 5 < 2;
          let col = pinePal[2];
          if (dy > tier.h - 2 && !fringe) col = pinePal[0];
          else if (dx < -hw * 0.25 && dy < tier.h * 0.6) col = pinePal[4];
          else if (dx < 0) col = pinePal[3];
          else if (dx > hw * 0.35) col = pinePal[1];
          if (hash2d(x, y, 71) > 0.85) col = pinePal[0];
          sub.set(x, y, col);
        }
      }
    }
    sub.addOutline(PAL.inkDark);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 96; x++) buf.set(128 + x, y, sub.get(x, y));
  }

  // 3. spirit_tree (224,0, 128x160)
  {
    const sub = new PixelBuffer(128, 160);
    sub.fillEllipse(64, 147, 36, 9, PAL.shadowAlpha);
    drawBarkTrunk(sub, 64, 146, 82, 9, 8);
    drawLeafyCanopyCluster(sub, 64, 70, 44, 24, spiritPal, 61);
    drawLeafyCanopyCluster(sub, 40, 62, 27, 20, spiritPal, 72);
    drawLeafyCanopyCluster(sub, 88, 64, 27, 20, spiritPal, 83);
    drawLeafyCanopyCluster(sub, 64, 42, 34, 23, spiritPal, 94);
    for (let i = 0; i < 6; i++) {
      const fx = 34 + i * 12;
      const fy = 40 + (i % 3) * 14;
      sub.set(fx, fy, PAL.spiritBlue);
      sub.set(fx + 1, fy, PAL.flowerWhite);
    }
    sub.addOutline(PAL.inkDark);
    for (let y = 0; y < 160; y++) for (let x = 0; x < 128; x++) buf.set(224 + x, y, sub.get(x, y));
  }

  // 4. bamboo_cluster (352,0, 64x128)
  {
    const sub = new PixelBuffer(64, 128);
    sub.fillEllipse(32, 118, 20, 6, PAL.shadowAlpha);
    const stalks = [
      { x: 20, h: 98, lean: -2 },
      { x: 32, h: 108, lean: 0 },
      { x: 43, h: 92, lean: 2 },
    ];
    for (const st of stalks) {
      for (let y = 118 - st.h; y <= 118; y++) {
        const px = Math.round(st.x + st.lean * ((118 - y) / st.h));
        const isJoint = y % 16 === 0;
        sub.set(px - 1, y, isJoint ? PAL.grassDeep : PAL.grassLight);
        sub.set(px, y, isJoint ? PAL.grassSunlit : PAL.grassMid);
        sub.set(px + 1, y, PAL.grassDeep);
      }
      drawLeafyCanopyCluster(sub, st.x + st.lean * 2, 118 - st.h + 12, 15, 11, greenPal, st.x);
    }
    sub.addOutline(PAL.inkDark);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) buf.set(352 + x, y, sub.get(x, y));
  }

  // 5. dark_dead_tree (416,0, 96x128)
  {
    const sub = new PixelBuffer(96, 128);
    sub.fillEllipse(48, 118, 24, 6, PAL.shadowAlpha);
    drawBarkTrunk(sub, 48, 118, 60, 7, 7);
    const drawBranch = (x0, y0, x1, y1, w) => {
      const steps = Math.max(8, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = Math.round(x0 + (x1 - x0) * t + Math.sin(t * Math.PI) * 3);
        const py = Math.round(y0 + (y1 - y0) * t);
        const r = Math.max(1, Math.round(w * (1 - t * 0.75)));
        sub.fillRect(px - r, py - 1, r * 2, 2, i % 3 === 0 ? PAL.basaltMid : PAL.woodDeep);
      }
    };
    drawBranch(48, 66, 20, 32, 3);
    drawBranch(48, 62, 76, 28, 3);
    drawBranch(34, 48, 14, 52, 2);
    drawBranch(64, 44, 82, 48, 2);
    drawBranch(48, 60, 46, 18, 2);
    sub.addOutline(PAL.inkStone);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 96; x++) buf.set(416 + x, y, sub.get(x, y));
  }

  // Bushes
  const drawBush = (ox, oy, pal, seed) => {
    const sub = new PixelBuffer(48, 48);
    sub.fillEllipse(24, 41, 16, 4, PAL.shadowAlpha);
    drawLeafyCanopyCluster(sub, 16, 30, 10, 9, pal, seed);
    drawLeafyCanopyCluster(sub, 32, 30, 10, 9, pal, seed + 1);
    drawLeafyCanopyCluster(sub, 24, 24, 13, 10, pal, seed + 2);
    sub.addOutline(PAL.inkDark);
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) buf.set(ox + x, oy + y, sub.get(x, y));
  };
  drawBush(0, 160, greenPal, 1);
  drawBush(48, 160, pinePal, 2);
  drawBush(96, 160, dryPal, 3);

  // Grass tufts
  for (let i = 0; i < 4; i++) {
    const ox = 144 + i * 32;
    const pal = i === 2 ? pinePal : i === 3 ? dryPal : greenPal;
    for (let b = 0; b < 5 + i; b++) {
      const bx = 7 + b * 3;
      for (let h = 0; h < 6 + (b % 3) * 2; h++) {
        const lean = Math.round(((b - 2) * h) / 6);
        buf.set(ox + bx + lean, 27 - h + 160, h > 4 ? pal[4] : h > 2 ? pal[3] : pal[1]);
      }
    }
  }

  // Wildflowers
  const flowerCols = [PAL.flowerPink, PAL.goldBright, PAL.flowerWhite, PAL.spiritBlue];
  for (let i = 0; i < 4; i++) {
    const ox = 272 + i * 32;
    const fcol = flowerCols[i];
    for (let k = 0; k < 4; k++) {
      const fx = 7 + k * 5;
      const fy = 22 - (k % 2) * 4 + 160;
      buf.set(ox + fx, fy + 3, PAL.grassDeep);
      buf.set(ox + fx, fy + 2, PAL.grassLight);
      buf.set(ox + fx - 1, fy, fcol);
      buf.set(ox + fx + 1, fy, fcol);
      buf.set(ox + fx, fy - 1, fcol);
      buf.set(ox + fx, fy + 1, fcol);
      buf.set(ox + fx, fy, PAL.goldBright);
    }
  }

  // Mushrooms
  const mushCaps = [
    [PAL.redDark, PAL.redMid, PAL.redBright],
    [hex('#115e59'), hex('#14b8a6'), PAL.spiritGlow],
    [PAL.ruinMid, hex('#9333ea'), PAL.spiritPurple],
  ];
  for (let m = 0; m < 3; m++) {
    const ox = m * 32;
    const [d, mid, hi] = mushCaps[m];
    buf.fillRect(ox + 14, 224 + 18, 4, 8, PAL.boneMid);
    buf.fillRect(ox + 15, 224 + 18, 2, 8, PAL.boneLight);
    buf.fillEllipse(ox + 16, 224 + 16, 8, 5, d);
    buf.fillEllipse(ox + 15, 224 + 15, 7, 4, mid);
    buf.set(ox + 12, 224 + 14, hi);
    buf.set(ox + 18, 224 + 13, PAL.flowerWhite);
    buf.set(ox + 14, 224 + 13, PAL.flowerWhite);
  }

  // tree_roots (96, 224, 48x32)
  buf.fillRect(96 + 10, 224 + 18, 28, 4, PAL.woodDark);
  buf.fillRect(96 + 14, 224 + 15, 20, 4, PAL.woodMid);
  buf.fillRect(96 + 6, 224 + 21, 10, 3, PAL.woodDeep);
  buf.fillRect(96 + 32, 224 + 21, 10, 3, PAL.woodDeep);

  await buf.savePng(path.join(OBJ_DIR, 'flora_sheet.png'));
}

// 5. ROCKS, BONES, CRAGS, PILLARS (384x192)
function drawFacetedRock(buf, cx, cy, rx, ry, pal, seed, mossy = false, crystal = false) {
  const [deep, dark, mid, light, hi] = pal;
  for (let y = Math.floor(cy - ry - 2); y <= Math.ceil(cy + ry + 2); y++) {
    for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
      const a = Math.atan2(y - cy, x - cx);
      const poly = Math.sin(a * 5 + seed) * 0.1 + Math.cos(a * 3 - seed) * 0.08;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = Math.hypot(dx, dy) - poly;
      if (d <= 1.0) {
        const plane = -dx * 0.55 - dy * 0.65;
        let col = mid;
        if (d > 0.85 || dy > 0.45) col = deep;
        else if (plane > 0.35) col = hi;
        else if (plane > 0.05) col = light;
        else if (plane < -0.2) col = dark;
        if (mossy && dy < 0.05 && dx < 0.25 && hash2d(x >> 1, y >> 1, seed) > 0.42) {
          col = dy < -0.2 ? PAL.grassLight : PAL.grassDark;
        }
        buf.set(x, y, col);
      }
    }
  }
  if (crystal) {
    const spikes = [
      { x: cx - 10, y: cy - 10, h: 12 },
      { x: cx + 4, y: cy - 14, h: 16 },
      { x: cx + 13, y: cy - 6, h: 10 },
    ];
    for (const s of spikes) {
      for (let i = 0; i < s.h; i++) {
        const w = Math.max(1, Math.round(3 - (i / s.h) * 2));
        buf.fillRect(s.x - w, s.y - i, w * 2, 1, i > s.h * 0.6 ? PAL.flowerWhite : PAL.spiritBlue);
      }
    }
  }
}

async function buildRocksNatureSheet() {
  const buf = new PixelBuffer(384, 192);
  const stonePal = [PAL.stoneDeep, PAL.stoneDark, PAL.stoneMid, PAL.stoneLight, PAL.stoneHigh];
  const basaltPal = [PAL.basaltDeep, PAL.basaltDark, PAL.basaltMid, PAL.basaltLight, PAL.basaltEdge];

  for (let i = 0; i < 3; i++) {
    const sub = new PixelBuffer(32, 32);
    sub.fillEllipse(16, 24, 10, 4, PAL.shadowAlpha);
    drawFacetedRock(sub, 16, 17, 10 - i, 8, i === 2 ? basaltPal : stonePal, 10 + i);
    sub.addOutline(PAL.inkStone);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) buf.set(i * 32 + x, y, sub.get(x, y));
  }

  const drawMediumRock = (ox, pal, seed, mossy, crystal) => {
    const sub = new PixelBuffer(64, 48);
    sub.fillEllipse(32, 39, 24, 6, PAL.shadowAlpha);
    drawFacetedRock(sub, 32, 26, 22, 14, pal, seed, mossy, crystal);
    sub.addOutline(PAL.inkStone);
    for (let y = 0; y < 48; y++) for (let x = 0; x < 64; x++) buf.set(ox + x, y, sub.get(x, y));
  };
  drawMediumRock(96, stonePal, 41, false, false);
  drawMediumRock(160, stonePal, 52, true, false);
  drawMediumRock(224, basaltPal, 63, false, true);

  // beast_bones (288,0, 64x48)
  {
    const sub = new PixelBuffer(64, 48);
    sub.fillEllipse(32, 39, 22, 6, PAL.shadowAlpha);
    sub.fillEllipse(24, 30, 11, 8, PAL.boneMid);
    sub.fillEllipse(24, 28, 9, 6, PAL.boneLight);
    sub.fillRect(19, 35, 10, 4, PAL.boneDark);
    for (let i = 0; i < 8; i++) {
      sub.set(16 - i, 24 - Math.round(i * 0.8), i > 4 ? PAL.boneDark : PAL.boneLight);
      sub.set(32 + i, 24 - Math.round(i * 0.8), i > 4 ? PAL.boneDark : PAL.boneLight);
    }
    sub.fillEllipse(20, 31, 2, 2, PAL.inkBrown);
    sub.fillEllipse(28, 31, 2, 2, PAL.inkBrown);
    for (let r = 0; r < 3; r++) {
      const rx = 38 + r * 6;
      for (let t = 0; t < 12; t++) {
        sub.set(rx + Math.round(Math.sin(t * 0.25) * 4), 26 + t, t < 5 ? PAL.boneLight : PAL.boneDark);
      }
    }
    sub.addOutline(PAL.inkBrown);
    for (let y = 0; y < 48; y++) for (let x = 0; x < 64; x++) buf.set(288 + x, y, sub.get(x, y));
  }

  // Crags & Pillars
  const drawCrag = (ox, pal, seed) => {
    const sub = new PixelBuffer(96, 80);
    sub.fillEllipse(48, 70, 38, 8, PAL.shadowAlpha);
    drawFacetedRock(sub, 48, 44, 34, 24, pal, seed);
    drawFacetedRock(sub, 34, 34, 18, 20, pal, seed + 5);
    drawFacetedRock(sub, 62, 48, 20, 16, pal, seed + 9);
    sub.addOutline(PAL.inkStone);
    for (let y = 0; y < 80; y++) for (let x = 0; x < 96; x++) buf.set(ox + x, 64 + y, sub.get(x, y));
  };
  drawCrag(0, stonePal, 80);
  drawCrag(96, basaltPal, 90);

  const drawPillar = (ox, broken) => {
    const sub = new PixelBuffer(48, 96);
    sub.fillEllipse(24, 88, 16, 5, PAL.shadowAlpha);
    sub.fillRect(10, 76, 28, 12, PAL.stoneDark);
    sub.fillRect(12, 76, 24, 4, PAL.stoneLight);
    const topY = broken ? 32 : 16;
    for (let y = topY; y < 76; y++) {
      const bw = broken && y < 38 ? 10 - (38 - y) : 10;
      sub.fillRect(24 - bw, y, bw * 2, 1, y % 12 === 0 ? PAL.stoneDeep : PAL.stoneMid);
      sub.fillRect(24 - bw, y, 4, 1, PAL.stoneLight);
      sub.fillRect(24 + bw - 3, y, 3, 1, PAL.stoneDark);
    }
    if (!broken) {
      sub.fillRect(10, 10, 28, 8, PAL.stoneLight);
      sub.fillRect(12, 12, 24, 3, PAL.stoneHigh);
    }
    sub.addOutline(PAL.inkStone);
    for (let y = 0; y < 96; y++) for (let x = 0; x < 48; x++) buf.set(ox + x, 64 + y, sub.get(x, y));
  };
  drawPillar(192, false);
  drawPillar(240, true);

  await buf.savePng(path.join(OBJ_DIR, 'rocks_nature_sheet.png'));
}

// 6. XIANXIA ARCHITECTURE & PROPS (640x352)
function drawXianxiaBuilding(buf, w, h, options) {
  const { roofPal, isGrand, hasPillars, doorW, wallColor, trimColor } = options;
  const sub = new PixelBuffer(w, h);
  const cx = Math.floor(w / 2);

  sub.fillEllipse(cx, h - 10, Math.floor(w * 0.44), 9, PAL.shadowAlpha);

  const baseTop = Math.floor(h * 0.56);
  const baseH = h - 14 - baseTop;
  const wallHalfW = Math.floor(w * 0.36);
  const wallX = cx - wallHalfW;
  const wallW = wallHalfW * 2;

  sub.fillRect(wallX - 4, h - 16, wallW + 8, 6, PAL.stoneDark);
  sub.fillRect(wallX - 4, h - 16, wallW + 8, 2, PAL.stoneLight);

  sub.fillRect(wallX, baseTop, wallW, baseH - 2, wallColor);
  for (let y = baseTop; y < h - 16; y += 8) {
    sub.fillRect(wallX, y, wallW, 1, PAL.woodDeep);
  }

  sub.fillRect(wallX + 2, baseTop, 5, baseH - 2, trimColor);
  sub.fillRect(wallX + wallW - 7, baseTop, 5, baseH - 2, trimColor);
  if (hasPillars) {
    sub.fillRect(cx - Math.floor(wallHalfW * 0.48), baseTop, 5, baseH - 2, trimColor);
    sub.fillRect(cx + Math.floor(wallHalfW * 0.44), baseTop, 5, baseH - 2, trimColor);
  }

  const dx = cx - Math.floor(doorW / 2);
  const dh = Math.floor(baseH * 0.7);
  sub.fillRect(dx, h - 16 - dh, doorW, dh, PAL.woodDeep);
  sub.fillRect(dx + 2, h - 16 - dh + 2, doorW - 4, dh - 2, PAL.woodDark);
  sub.fillRect(cx - 1, h - 16 - dh + 2, 2, dh - 2, PAL.woodDeep);

  if (wallW >= 90) {
    for (const wx of [wallX + 12, wallX + wallW - 26]) {
      sub.fillRect(wx, baseTop + 8, 14, 12, PAL.woodDeep);
      sub.fillRect(wx + 2, baseTop + 10, 10, 8, PAL.emberGlow);
      sub.fillRect(wx + 6, baseTop + 10, 2, 8, PAL.woodDark);
      sub.fillRect(wx + 2, baseTop + 13, 10, 2, PAL.woodDark);
    }
  }

  const roofBottom = baseTop + 8;
  const roofTop = 10;
  const roofSpan = roofBottom - roofTop;
  for (let y = roofTop; y <= roofBottom; y++) {
    const t = (y - roofTop) / Math.max(1, roofSpan);
    const hw = Math.round(w * (0.24 + t * 0.24));
    const curveLift = y > roofBottom - 7 && t > 0.8 ? -Math.round((t - 0.8) * 14) : 0;
    const drawY = y + curveLift;
    for (let x = cx - hw; x <= cx + hw; x++) {
      const tileCol = (x - (cx - hw)) % 6 === 0;
      let col = roofPal[2];
      if (drawY === roofTop || (y === roofBottom && Math.abs(x - cx) > hw - 10)) col = PAL.goldMid;
      else if (y > roofBottom - 3) col = roofPal[0];
      else if (tileCol) col = roofPal[0];
      else if (x < cx - hw * 0.15 && t < 0.6) col = roofPal[3];
      else if (x > cx + hw * 0.2) col = roofPal[1];
      sub.set(x, drawY, col);
    }
  }

  const ridgeHalf = Math.floor(w * 0.25);
  sub.fillRect(cx - ridgeHalf, roofTop - 2, ridgeHalf * 2, 4, PAL.goldMid);
  sub.fillRect(cx - ridgeHalf - 3, roofTop - 5, 4, 5, PAL.goldBright);
  sub.fillRect(cx + ridgeHalf - 1, roofTop - 5, 4, 5, PAL.goldBright);
  if (isGrand) {
    sub.fillRect(cx - 24, roofBottom - 9, 48, 10, PAL.woodDeep);
    sub.fillRect(cx - 22, roofBottom - 7, 44, 6, PAL.goldMid);
    sub.fillRect(cx - 12, roofBottom - 5, 24, 2, PAL.inkBrown);
  }

  sub.addOutline(PAL.inkDark);
  return sub;
}

async function buildArchitecturePropsSheet() {
  const buf = new PixelBuffer(640, 352);
  const darkRoof = [PAL.roofDeep, PAL.roofDark, PAL.roofMid, PAL.roofLight];
  const jadeRoof = [PAL.sectRoofDeep, PAL.sectRoofDark, PAL.sectRoofMid, PAL.sectRoofLight];

  const paste = (sub, ox, oy) => {
    for (let y = 0; y < sub.h; y++) for (let x = 0; x < sub.w; x++) buf.set(ox + x, oy + y, sub.get(x, y));
  };

  paste(drawXianxiaBuilding(buf, 144, 128, { roofPal: darkRoof, isGrand: false, hasPillars: false, doorW: 22, wallColor: hex('#cbb896'), trimColor: PAL.woodMid }), 0, 0);
  paste(drawXianxiaBuilding(buf, 160, 144, { roofPal: darkRoof, isGrand: true, hasPillars: true, doorW: 26, wallColor: PAL.woodLight, trimColor: PAL.redDark }), 144, 0);
  paste(drawXianxiaBuilding(buf, 224, 160, { roofPal: jadeRoof, isGrand: true, hasPillars: true, doorW: 34, wallColor: hex('#e6dec8'), trimColor: PAL.redDark }), 304, 0);
  paste(drawXianxiaBuilding(buf, 80, 96, { roofPal: jadeRoof, isGrand: false, hasPillars: false, doorW: 16, wallColor: PAL.stoneLight, trimColor: PAL.redMid }), 528, 0);

  // Walls & Wood Gate
  const drawWallSegment = (ox, oy, pal, jadeTop) => {
    const sub = new PixelBuffer(96, 96);
    sub.fillEllipse(48, 86, 42, 6, PAL.shadowAlpha);
    sub.fillRect(8, 36, 80, 50, pal[2]);
    for (let y = 40; y < 86; y += 10) sub.fillRect(8, y, 80, 1, pal[0]);
    for (let x = 16; x < 84; x += 16) sub.fillRect(x, 36, 2, 50, pal[0]);
    sub.fillRect(4, 24, 88, 14, jadeTop ? PAL.sectRoofMid : PAL.roofDark);
    sub.fillRect(4, 24, 88, 3, jadeTop ? PAL.sectRoofLight : PAL.roofLight);
    sub.addOutline(PAL.inkStone);
    paste(sub, ox, oy);
  };
  drawWallSegment(0, 160, [PAL.ruinDeep, PAL.ruinDark, PAL.ruinMid], false);
  drawWallSegment(96, 160, [PAL.stoneDeep, PAL.stoneDark, PAL.stoneLight], true);

  {
    const sub = new PixelBuffer(96, 96);
    sub.fillEllipse(48, 86, 40, 6, PAL.shadowAlpha);
    sub.fillRect(14, 28, 10, 58, PAL.redDark);
    sub.fillRect(72, 28, 10, 58, PAL.redDark);
    sub.fillRect(8, 18, 80, 12, PAL.roofMid);
    sub.fillRect(4, 14, 88, 5, PAL.roofLight);
    sub.fillRect(30, 22, 36, 8, PAL.goldMid);
    sub.addOutline(PAL.inkDark);
    paste(sub, 192, 160);
  }

  // Wooden Bridge (288, 160, 160x64)
  {
    const sub = new PixelBuffer(160, 64);
    sub.fillRect(8, 12, 144, 42, PAL.woodDeep);
    for (let x = 10; x < 148; x += 7) {
      sub.fillRect(x, 14, 6, 36, (x / 7) % 2 === 0 ? PAL.woodMid : PAL.woodLight);
      sub.fillRect(x, 14, 6, 2, PAL.woodHigh);
    }
    sub.fillRect(4, 10, 152, 5, PAL.woodDark);
    sub.fillRect(4, 48, 152, 5, PAL.woodDark);
    for (const px of [10, 56, 104, 144]) {
      sub.fillRect(px, 6, 6, 12, PAL.woodHigh);
      sub.fillRect(px, 44, 6, 12, PAL.woodHigh);
    }
    sub.addOutline(PAL.inkBrown);
    paste(sub, 288, 160);
  }

  // Ancient Stele
  {
    const sub = new PixelBuffer(48, 72);
    sub.fillEllipse(24, 64, 16, 5, PAL.shadowAlpha);
    sub.fillRect(10, 54, 28, 10, PAL.stoneDark);
    sub.fillRect(14, 16, 20, 40, PAL.stoneMid);
    sub.fillRect(16, 12, 16, 6, PAL.stoneLight);
    for (let r = 0; r < 5; r++) sub.fillRect(22, 22 + r * 6, 4, 3, PAL.spiritGlow);
    sub.addOutline(PAL.inkStone);
    paste(sub, 448, 160);
  }

  // Guardian Statue
  {
    const sub = new PixelBuffer(48, 64);
    sub.fillEllipse(24, 57, 15, 4, PAL.shadowAlpha);
    sub.fillRect(10, 48, 28, 8, PAL.stoneDark);
    sub.fillRect(14, 24, 20, 24, PAL.stoneLight);
    sub.fillRect(16, 12, 16, 14, PAL.stoneHigh);
    sub.set(19, 17, PAL.goldBright);
    sub.set(29, 17, PAL.goldBright);
    sub.addOutline(PAL.inkStone);
    paste(sub, 496, 160);
  }

  // Sect Flag
  {
    const sub = new PixelBuffer(48, 80);
    sub.fillEllipse(18, 73, 10, 4, PAL.shadowAlpha);
    sub.fillRect(16, 10, 3, 64, PAL.woodHigh);
    sub.fillRect(15, 6, 5, 4, PAL.goldBright);
    for (let x = 19; x < 44; x++) {
      const wave = Math.round(Math.sin((x - 19) * 0.35) * 2);
      sub.fillRect(x, 14 + wave, 1, 24, x < 24 ? PAL.goldMid : x % 5 === 0 ? PAL.redDark : PAL.redMid);
    }
    sub.addOutline(PAL.inkDark);
    paste(sub, 544, 160);
  }

  // Animated Stone Lantern (4 frames @ 0..96, 256)
  for (let f = 0; f < 4; f++) {
    const sub = new PixelBuffer(32, 48);
    sub.fillEllipse(16, 43, 10, 3, PAL.shadowAlpha);
    sub.fillRect(10, 38, 12, 5, PAL.stoneDark);
    sub.fillRect(13, 24, 6, 14, PAL.stoneMid);
    sub.fillRect(10, 14, 12, 10, PAL.stoneDark);
    const glowCol = f % 2 === 0 ? PAL.emberGlow : PAL.goldBright;
    sub.fillRect(12, 16, 8, 6, glowCol);
    sub.fillRect(7, 10, 18, 4, PAL.roofMid);
    sub.fillRect(11, 7, 10, 3, PAL.roofLight);
    sub.addOutline(PAL.inkStone);
    paste(sub, f * 32, 256);
  }

  // Animated Hanging Lantern (4 frames @ 128..200, 256)
  for (let f = 0; f < 4; f++) {
    const sway = f === 1 ? 1 : f === 3 ? -1 : 0;
    const sub = new PixelBuffer(24, 32);
    sub.fillRect(11, 0, 2, 6, PAL.goldDark);
    sub.fillEllipse(12 + sway, 14, 7, 8, PAL.redMid);
    sub.fillEllipse(12 + sway, 14, 4, 6, f % 2 === 0 ? PAL.emberGlow : PAL.redBright);
    sub.fillRect(8 + sway, 6, 8, 2, PAL.goldBright);
    sub.fillRect(8 + sway, 21, 8, 2, PAL.goldBright);
    sub.fillRect(11 + sway, 23, 2, 6, PAL.goldMid);
    sub.addOutline(PAL.inkDark);
    paste(sub, 128 + f * 24, 256);
  }

  // Wood Fence
  {
    const sub = new PixelBuffer(64, 32);
    sub.fillRect(4, 14, 56, 3, PAL.woodLight);
    sub.fillRect(4, 22, 56, 3, PAL.woodMid);
    for (const px of [8, 28, 48]) sub.fillRect(px, 8, 6, 21, PAL.woodDark);
    sub.addOutline(PAL.inkBrown);
    paste(sub, 224, 256);
  }

  // Stone Table
  {
    const sub = new PixelBuffer(48, 40);
    sub.fillEllipse(24, 33, 18, 5, PAL.shadowAlpha);
    sub.fillRect(16, 20, 16, 13, PAL.stoneDark);
    sub.fillEllipse(24, 18, 18, 8, PAL.stoneLight);
    sub.fillEllipse(24, 16, 16, 6, PAL.stoneHigh);
    sub.addOutline(PAL.inkStone);
    paste(sub, 288, 256);
  }

  // Wood Post
  {
    const sub = new PixelBuffer(24, 48);
    sub.fillEllipse(12, 43, 6, 3, PAL.shadowAlpha);
    sub.fillRect(9, 12, 6, 31, PAL.woodMid);
    sub.fillRect(8, 10, 8, 4, PAL.woodHigh);
    sub.addOutline(PAL.inkBrown);
    paste(sub, 336, 256);
  }

  // Stone Steps
  {
    const sub = new PixelBuffer(64, 48);
    for (let s = 0; s < 5; s++) {
      sub.fillRect(6, 8 + s * 7, 52, 6, PAL.stoneMid);
      sub.fillRect(6, 8 + s * 7, 52, 2, PAL.stoneHigh);
      sub.fillRect(6, 13 + s * 7, 52, 1, PAL.stoneDeep);
    }
    sub.addOutline(PAL.inkStone);
    paste(sub, 360, 256);
  }

  await buf.savePng(path.join(OBJ_DIR, 'architecture_props.png'));
}

// 7. COLLECTIBLE RESOURCES SHEET (192x64)
async function buildResourcesSheet() {
  const buf = new PixelBuffer(192, 64);
  const paste = (sub, ox) => {
    for (let y = 0; y < sub.h; y++) for (let x = 0; x < sub.w; x++) buf.set(ox + x, y, sub.get(x, y));
  };

  {
    const sub = new PixelBuffer(32, 64);
    sub.fillEllipse(16, 56, 10, 4, hex('#34d399', 90));
    sub.fillRect(15, 36, 2, 18, PAL.grassDeep);
    sub.fillEllipse(10, 42, 5, 3, PAL.grassLight);
    sub.fillEllipse(22, 40, 5, 3, PAL.grassLight);
    sub.fillEllipse(16, 30, 4, 4, PAL.spiritGlow);
    sub.set(15, 29, PAL.flowerWhite);
    sub.addOutline(PAL.inkDark);
    paste(sub, 0);
  }

  {
    const sub = new PixelBuffer(32, 64);
    sub.fillEllipse(16, 56, 11, 4, PAL.shadowAlpha);
    drawFacetedRock(sub, 16, 46, 11, 9, [PAL.stoneDeep, PAL.stoneDark, PAL.stoneMid, PAL.stoneLight, PAL.stoneHigh], 3);
    sub.fillRect(12, 42, 4, 4, PAL.goldBright);
    sub.fillRect(18, 44, 3, 5, PAL.spiritBlue);
    sub.addOutline(PAL.inkStone);
    paste(sub, 32);
  }

  {
    const sub = new PixelBuffer(32, 64);
    sub.fillEllipse(16, 56, 11, 4, PAL.shadowAlpha);
    sub.fillRect(6, 40, 20, 14, PAL.woodMid);
    sub.fillRect(6, 36, 20, 6, PAL.woodHigh);
    sub.fillRect(6, 42, 20, 2, PAL.goldBright);
    sub.fillRect(14, 41, 4, 5, PAL.goldBright);
    sub.addOutline(PAL.inkBrown);
    paste(sub, 64);
  }

  {
    const sub = new PixelBuffer(32, 64);
    sub.fillEllipse(16, 56, 11, 4, PAL.shadowAlpha);
    sub.fillRect(9, 22, 14, 32, PAL.stoneMid);
    sub.fillRect(11, 18, 10, 5, PAL.stoneLight);
    for (let r = 0; r < 4; r++) sub.fillRect(15, 27 + r * 6, 2, 3, PAL.spiritGlow);
    sub.addOutline(PAL.inkStone);
    paste(sub, 96);
  }

  {
    const sub = new PixelBuffer(32, 64);
    sub.fillEllipse(16, 56, 12, 4, hex('#38bdf8', 110));
    sub.fillRect(7, 42, 18, 12, PAL.jadeDark);
    sub.fillRect(5, 38, 22, 5, PAL.jadeLight);
    sub.fillEllipse(16, 30, 5, 5, PAL.spiritBlue);
    sub.addOutline(PAL.inkDark);
    paste(sub, 128);
  }

  await buf.savePng(path.join(OBJ_DIR, 'resources_sheet.png'));
}

// 8. METADATA + SHOWCASE
async function buildMetadataAndShowcase() {
  const metadata = {
    version: '2.3.0',
    standard: 'Premium HD Pixel Art - Chinese Xianxia ARPG',
    baseTileSize: 32,
    nearestNeighborOnly: true,
    tilesets: {
      ground_tiles: { src: '/assets/pixel-art/environment/tilesets/ground_tiles.png', width: 256, height: 256, tileSize: 32, cols: 8, rows: 8 },
      transition_tiles: { src: '/assets/pixel-art/environment/tilesets/transition_tiles.png', width: 512, height: 192, tileSize: 32, cols: 16, rows: 6, bitmask: 'N=1, E=2, S=4, W=8' },
      animated_water_tiles: { src: '/assets/pixel-art/environment/tilesets/animated_water_tiles.png', width: 256, height: 128, tileSize: 32, cols: 8, rows: 4, frameCount: 4, fps: 6 },
    },
    objects: {
      flora_sheet: { src: '/assets/pixel-art/environment/objects/flora_sheet.png', width: 512, height: 320 },
      rocks_nature_sheet: { src: '/assets/pixel-art/environment/objects/rocks_nature_sheet.png', width: 384, height: 192 },
      architecture_props: { src: '/assets/pixel-art/environment/objects/architecture_props.png', width: 640, height: 352 },
      resources_sheet: { src: '/assets/pixel-art/environment/objects/resources_sheet.png', width: 192, height: 64 },
    },
  };
  fs.writeFileSync(path.join(OUT_ROOT, 'metadata.json'), JSON.stringify(metadata, null, 2));

  await sharp({
    create: { width: 1080, height: 660, channels: 4, background: { r: 11, g: 16, b: 30, alpha: 255 } },
  })
    .composite([
      { input: path.join(TILES_DIR, 'ground_tiles.png'), left: 24, top: 24 },
      { input: path.join(TILES_DIR, 'animated_water_tiles.png'), left: 24, top: 300 },
      { input: path.join(OBJ_DIR, 'flora_sheet.png'), left: 304, top: 24 },
      { input: path.join(OBJ_DIR, 'architecture_props.png'), left: 304, top: 300 },
      { input: path.join(OBJ_DIR, 'rocks_nature_sheet.png'), left: 24, top: 450 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_ROOT, 'preview_showcase.png'));
}

async function main() {
  await buildGroundTileset();
  await buildTransitionTileset();
  await buildAnimatedWaterTileset();
  await buildFloraSheet();
  await buildRocksNatureSheet();
  await buildArchitecturePropsSheet();
  await buildResourcesSheet();
  await buildMetadataAndShowcase();
  console.log('Generated all Phase 2.3 Environment Pixel Art sheets + preview_showcase.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
