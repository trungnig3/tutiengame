/**
 * PHASE 2.1 – NORMAL MONSTER 4-DIRECTION SPRITE SHEET GENERATOR
 * Project: Phàm Trần Tiên Lộ (凡尘仙路)
 *
 * Generates 15 standardized 64x64 pixel-art PNG sprite sheets + 3 previews + 3 metadata.json files:
 *   1. da_lang (Dã Lang / 野狼) -> public/assets/pixel-art/monsters/da_lang/
 *   2. da_tru  (Dã Trư / 野猪)  -> public/assets/pixel-art/monsters/da_tru/
 *   3. ma_do   (Ma Đồ / 魔徒)   -> public/assets/pixel-art/monsters/ma_do/
 *
 * Row Order Standard (ART_BIBLE.md):
 *   Row 0: down  (South)
 *   Row 1: left  (West)
 *   Row 2: right (East)
 *   Row 3: up    (North)
 *
 * Normalized Feet Pivot: { x: 0.5, y: 0.875 } -> Pixel (32, 56) inside 64x64 cell.
 * Zero border overflow: All pixels clipped strictly inside [1..62, 1..62] per 64x64 frame.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_OUT = path.resolve(__dirname, '../public/assets/pixel-art/monsters');

const MONSTER_CONFIGS = [
  {
    id: 'da_lang',
    shape: 'wolf',
    nameVi: 'Dã Lang',
    nameHan: '野狼',
    frontSrc: 'src/assets/images/da_lang_front_1794655638004.jpg',
    sideSrc: 'src/assets/images/da_lang_side_1794655639439.jpg',
    backSrc: 'src/assets/images/da_lang_back_1794655641280.jpg',
    frontSize: [40, 44],
    sideSize: [48, 38],
    backSize: [44, 42],
    legSplitRatio: 0.65,
    attackStyle: 'wolf_bite',
    accentRgb: [249, 115, 22], // fierce amber-crimson slash
  },
  {
    id: 'da_tru',
    shape: 'boar',
    nameVi: 'Dã Trư',
    nameHan: '野猪',
    frontSrc: 'src/assets/images/da_tru_front_1794655641616.jpg',
    sideSrc: 'src/assets/images/iron_boar_1794048473166.jpg',
    backSrc: 'src/assets/images/da_tru_back_1794655641223.jpg',
    frontSize: [46, 42],
    sideSize: [50, 40],
    backSize: [46, 42],
    legSplitRatio: 0.68,
    attackStyle: 'boar_charge',
    accentRgb: [251, 191, 36], // ivory-amber tusk impact
  },
  {
    id: 'ma_do',
    shape: 'cultist',
    nameVi: 'Ma Đồ',
    nameHan: '魔徒',
    frontSrc: 'src/assets/images/dark_cultist_1794048474068.jpg',
    sideSrc: 'src/assets/images/ma_do_side_1794655642618.jpg',
    backSrc: 'src/assets/images/ma_do_back_1794655643806.jpg',
    frontSize: [40, 50],
    sideSize: [38, 50],
    backSize: [40, 50],
    legSplitRatio: 0.72,
    attackStyle: 'cultist_cast',
    accentRgb: [192, 38, 211], // demonic crimson-violet talisman energy
  },
];

const ANIM_DEFS = {
  idle:   { label: 'Idle (Đứng Thở)',       file: 'idle.png',   frameCount: 4, fps: 6,  loop: true },
  walk:   { label: 'Walk (Di Chuyển)',      file: 'walk.png',   frameCount: 6, fps: 10, loop: true },
  attack: { label: 'Attack (Công Kích)',    file: 'attack.png', frameCount: 6, fps: 12, loop: false, hitFrame: 3 },
  hit:    { label: 'Hit (Bị Trúng Đòn)',    file: 'hit.png',    frameCount: 3, fps: 10, loop: false },
  death:  { label: 'Death (Ngã Gục)',       file: 'death.png',  frameCount: 6, fps: 10, loop: false, holdLastFrame: true },
};

/**
 * Extract clean transparent foreground via edge flood-fill + anti-halo de-fringe
 */
async function extractCleanSprite(imagePath, targetW, targetH) {
  const { data, info } = await sharp(imagePath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = data[i * channels];
    rgba[i * 4 + 1] = data[i * channels + 1];
    rgba[i * 4 + 2] = data[i * channels + 2];
    rgba[i * 4 + 3] = 255;
  }

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height * 2);
  let head = 0;
  let tail = 0;

  function enqueue(x, y) {
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    queue[tail++] = x;
    queue[tail++] = y;
  }

  function isWhiteBg(idx) {
    const r = rgba[idx * 4];
    const g = rgba[idx * 4 + 1];
    const b = rgba[idx * 4 + 2];
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    return minC >= 218 && (maxC - minC) <= 28;
  }

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = y * width + x;
    if (isWhiteBg(idx)) {
      rgba[idx * 4 + 3] = 0;
      if (x > 0) enqueue(x - 1, y);
      if (x < width - 1) enqueue(x + 1, y);
      if (y > 0) enqueue(x, y - 1);
      if (y < height - 1) enqueue(x, y + 1);
    }
  }

  // 1-pass bright neutral fringe removal along transparent edges
  const toClear = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (rgba[idx * 4 + 3] === 0) continue;
      const touchesTransparent =
        rgba[(idx - 1) * 4 + 3] === 0 ||
        rgba[(idx + 1) * 4 + 3] === 0 ||
        rgba[(idx - width) * 4 + 3] === 0 ||
        rgba[(idx + width) * 4 + 3] === 0;
      if (!touchesTransparent) continue;
      const r = rgba[idx * 4];
      const g = rgba[idx * 4 + 1];
      const b = rgba[idx * 4 + 2];
      const avg = (r + g + b) / 3;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (avg > 170 && sat < 30) {
        toClear.push(idx);
      }
    }
  }
  for (const idx of toClear) {
    rgba[idx * 4 + 3] = 0;
  }

  // Tight bounding box
  let minX = width, maxX = -1, minY = height, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const cropW = Math.max(1, maxX - minX + 1);
  const cropH = Math.max(1, maxY - minY + 1);
  const cropped = Buffer.alloc(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    const srcStart = ((minY + y) * width + minX) * 4;
    rgba.copy(cropped, y * cropW * 4, srcStart, srcStart + cropW * 4);
  }

  // Downscale cleanly to pixel art dimensions
  const resized = await sharp(cropped, { raw: { width: cropW, height: cropH, channels: 4 } })
    .resize(targetW, targetH, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outData = resized.data;
  const outW = resized.info.width;
  const outH = resized.info.height;

  // Binary alpha threshold + edge dark-fringe polish for crisp pixel silhouettes
  let actualBottomY = 0;
  let actualTopY = outH - 1;
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const idx = (y * outW + x) * 4;
      if (outData[idx + 3] >= 115) {
        outData[idx + 3] = 255;
        if (y > actualBottomY) actualBottomY = y;
        if (y < actualTopY) actualTopY = y;
      } else {
        outData[idx] = 0;
        outData[idx + 1] = 0;
        outData[idx + 2] = 0;
        outData[idx + 3] = 0;
      }
    }
  }

  return {
    data: outData,
    w: outW,
    h: outH,
    bottomY: actualBottomY,
    topY: actualTopY,
  };
}

/**
 * Pixel Canvas with strict per-cell clipping bounds to guarantee zero border bleed
 */
class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4, 0);
  }

  setPixel(x, y, r, g, b, a = 255, clip = null) {
    x = Math.round(x);
    y = Math.round(y);
    if (a <= 0) return;
    if (clip) {
      if (x < clip.minX || x > clip.maxX || y < clip.minY || y > clip.maxY) return;
    } else {
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    }
    const idx = (y * this.width + x) * 4;
    if (a >= 255) {
      this.data[idx] = Math.max(0, Math.min(255, r));
      this.data[idx + 1] = Math.max(0, Math.min(255, g));
      this.data[idx + 2] = Math.max(0, Math.min(255, b));
      this.data[idx + 3] = 255;
    } else {
      const prevA = this.data[idx + 3] / 255;
      const curA = a / 255;
      const outA = curA + prevA * (1 - curA);
      if (outA > 0) {
        this.data[idx] = Math.max(0, Math.min(255, Math.round((r * curA + this.data[idx] * prevA * (1 - curA)) / outA)));
        this.data[idx + 1] = Math.max(0, Math.min(255, Math.round((g * curA + this.data[idx + 1] * prevA * (1 - curA)) / outA)));
        this.data[idx + 2] = Math.max(0, Math.min(255, Math.round((b * curA + this.data[idx + 2] * prevA * (1 - curA)) / outA)));
        this.data[idx + 3] = Math.round(outA * 255);
      }
    }
  }

  fillRect(x, y, w, h, r, g, b, a = 255, clip = null) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.setPixel(x + dx, y + dy, r, g, b, a, clip);
      }
    }
  }

  /**
   * Articulated sprite blit with separate upper/lower stride deformation & optional 90-deg side collapse
   */
  blitArticulated(sprite, footX, footY, clip, opts = {}) {
    const {
      flipX = false,
      scaleX = 1,
      scaleY = 1,
      shearX = 0,
      legSplitRatio = 0.68,
      leftLegDx = 0,
      leftLegDy = 0,
      rightLegDx = 0,
      rightLegDy = 0,
      tintR = 1,
      tintG = 1,
      tintB = 1,
      flashWhite = 0,
      alpha = 1,
      rotateSide = false,
      collapseRatio = 0, // 0 = upright, 1 = flattened sideways on ground
    } = opts;

    const { data, w, h, bottomY } = sprite;

    if (rotateSide) {
      // Collapse onto ground plane (rotated sideways around feet pivot)
      const flatW = Math.min(54, h);
      const flatH = Math.max(12, Math.round(w * (1 - collapseRatio * 0.45)));
      const startX = Math.round(footX - flatW / 2);
      const startY = Math.round(footY - flatH);

      for (let ty = 0; ty < flatH; ty++) {
        const sx = Math.min(w - 1, Math.floor((ty / flatH) * w));
        for (let tx = 0; tx < flatW; tx++) {
          const syRaw = Math.min(h - 1, Math.floor((tx / flatW) * h));
          const sy = flipX ? (h - 1 - syRaw) : syRaw;
          const mappedSx = flipX ? (w - 1 - sx) : sx;
          const srcIdx = (sy * w + mappedSx) * 4;
          const sa = data[srcIdx + 3];
          if (sa < 20) continue;

          const r = Math.min(255, Math.round(data[srcIdx] * tintR + flashWhite * 180));
          const g = Math.min(255, Math.round(data[srcIdx + 1] * tintG + flashWhite * 180));
          const b = Math.min(255, Math.round(data[srcIdx + 2] * tintB + flashWhite * 180));
          this.setPixel(startX + tx, startY + ty, r, g, b, Math.round(sa * alpha), clip);
        }
      }
      return;
    }

    const targetW = Math.max(1, Math.round(w * scaleX));
    const targetH = Math.max(1, Math.round(h * scaleY));
    const scaledBottom = Math.round((bottomY / Math.max(1, h - 1)) * (targetH - 1));
    const destX = Math.round(footX - targetW / 2);
    const destY = Math.round(footY - scaledBottom);
    const splitRow = Math.round(targetH * legSplitRatio);

    for (let ty = 0; ty < targetH; ty++) {
      const sy = Math.min(h - 1, Math.floor((ty / targetH) * h));
      const rowShear = Math.round((targetH - ty) * shearX);
      const isLegBand = ty >= splitRow;

      for (let tx = 0; tx < targetW; tx++) {
        const mappedTx = flipX ? targetW - 1 - tx : tx;
        const sx = Math.min(w - 1, Math.floor((mappedTx / targetW) * w));
        const srcIdx = (sy * w + sx) * 4;
        const sa = data[srcIdx + 3];
        if (sa < 20) continue;

        let legOx = 0;
        let legOy = 0;
        if (isLegBand) {
          if (tx < targetW * 0.5) {
            legOx = leftLegDx;
            legOy = leftLegDy;
          } else {
            legOx = rightLegDx;
            legOy = rightLegDy;
          }
        }

        const r = Math.min(255, Math.round(data[srcIdx] * tintR + flashWhite * 200));
        const g = Math.min(255, Math.round(data[srcIdx + 1] * tintG + flashWhite * 120));
        const b = Math.min(255, Math.round(data[srcIdx + 2] * tintB + flashWhite * 120));
        const a = Math.round(sa * alpha);

        this.setPixel(destX + tx + rowShear + legOx, destY + ty + legOy, r, g, b, a, clip);
      }
    }
  }

  /**
   * Blit another buffer verbatim (for preview grid)
   */
  blitRaw(srcData, srcW, srcH, dx, dy, scale = 1) {
    const targetW = Math.round(srcW * scale);
    const targetH = Math.round(srcH * scale);
    for (let ty = 0; ty < targetH; ty++) {
      const sy = Math.floor(ty / scale);
      for (let tx = 0; tx < targetW; tx++) {
        const sx = Math.floor(tx / scale);
        const sIdx = (sy * srcW + sx) * 4;
        const sa = srcData[sIdx + 3];
        if (sa === 0) continue;
        this.setPixel(dx + tx, dy + ty, srcData[sIdx], srcData[sIdx + 1], srcData[sIdx + 2], sa);
      }
    }
  }

  async savePng(outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    await sharp(this.data, {
      raw: { width: this.width, height: this.height, channels: 4 },
    })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);
  }
}

/**
 * Draw crisp pixel-art attack slash/shockwave/talisman arc inside clipped 64x64 cell
 */
function drawPixelAttackVfx(canvas, style, dir, frameIdx, footX, footY, accentRgb, clip) {
  const [ar, ag, ab] = accentRgb;
  // Direction vectors
  const dirVec = [
    { x: 0, y: 1 },   // 0: down
    { x: -1, y: 0 },  // 1: left
    { x: 1, y: 0 },   // 2: right
    { x: 0, y: -1 },  // 3: up
  ][dir];

  if (style === 'wolf_bite') {
    if (frameIdx === 2 || frameIdx === 3) {
      const cx = footX + dirVec.x * 20;
      const cy = (dir === 0 ? footY - 10 : dir === 3 ? footY - 34 : footY - 18);
      const span = frameIdx === 3 ? 11 : 7;
      for (let t = -span; t <= span; t++) {
        const ox = dirVec.x !== 0 ? Math.round(-Math.abs(t) * 0.35 * dirVec.x) : t;
        const oy = dirVec.y !== 0 ? Math.round(-Math.abs(t) * 0.35 * dirVec.y) : Math.round(t * 0.7);
        canvas.setPixel(cx + ox, cy + oy, ar, ag, ab, 255, clip);
        canvas.setPixel(cx + ox + dirVec.x, cy + oy + dirVec.y, 255, 240, 180, 230, clip);
        if (frameIdx === 3) {
          canvas.setPixel(cx + ox - dirVec.x * 2, cy + oy - 3, 220, 38, 38, 220, clip);
        }
      }
    }
  } else if (style === 'boar_charge') {
    if (frameIdx === 0 || frameIdx === 1) {
      // Dust scrape behind rear hooves
      for (let p = 0; p < 4; p++) {
        const px = footX - dirVec.x * (10 + p * 3) + (p % 2 === 0 ? -2 : 2);
        const py = footY - 2 - p;
        canvas.fillRect(px, py, 2, 2, 168, 142, 110, 210, clip);
      }
    } else if (frameIdx === 2 || frameIdx === 3) {
      // Heavy tusk ramming crescent + ground impact pebbles
      const cx = footX + dirVec.x * 22;
      const cy = (dir === 0 ? footY - 10 : dir === 3 ? footY - 32 : footY - 15);
      const radius = frameIdx === 3 ? 12 : 8;
      for (let t = -radius; t <= radius; t++) {
        const px = cx + (dirVec.y !== 0 ? t : Math.round((1 - (t * t) / (radius * radius)) * 5 * dirVec.x));
        const py = cy + (dirVec.x !== 0 ? Math.round(t * 0.75) : Math.round((1 - (t * t) / (radius * radius)) * 4 * dirVec.y));
        canvas.setPixel(px, py, 255, 250, 220, 255, clip);
        canvas.setPixel(px - dirVec.x, py - dirVec.y, ar, ag, ab, 230, clip);
      }
      // Speed streak lines trailing behind charge
      for (let l = -1; l <= 1; l++) {
        const sx = footX - dirVec.x * 16 + (dirVec.y !== 0 ? l * 7 : 0);
        const sy = footY - 18 + (dirVec.x !== 0 ? l * 6 : -dirVec.y * 10);
        for (let k = 0; k < 7; k++) {
          canvas.setPixel(sx - dirVec.x * k, sy - dirVec.y * k, 226, 232, 240, 200 - k * 22, clip);
        }
      }
    }
  } else if (style === 'cultist_cast') {
    if (frameIdx === 1) {
      // Gathering dark-violet qi orb near talisman
      const ox = footX + (dir === 1 ? -14 : dir === 2 ? 14 : 11);
      const oy = footY - 28;
      canvas.fillRect(ox - 1, oy - 1, 3, 3, ar, ag, ab, 235, clip);
      canvas.setPixel(ox, oy, 255, 200, 255, 255, clip);
    } else if (frameIdx === 2 || frameIdx === 3) {
      // Demonic talisman sigil burst + crimson-violet crescent
      const cx = footX + dirVec.x * 20;
      const cy = (dir === 0 ? footY - 16 : dir === 3 ? footY - 36 : footY - 26);
      const r = frameIdx === 3 ? 11 : 7;
      for (let a = 0; a < 18; a++) {
        const ang = (a / 18) * Math.PI * 2;
        const px = Math.round(cx + Math.cos(ang) * r);
        const py = Math.round(cy + Math.sin(ang) * (r * 0.7));
        canvas.setPixel(px, py, ar, ag, ab, 245, clip);
        if (a % 2 === 0) {
          canvas.setPixel(px, py - 1, 239, 68, 68, 220, clip);
        }
      }
      if (frameIdx === 3) {
        canvas.fillRect(cx - 2, cy - 2, 4, 4, 244, 114, 182, 255, clip);
        canvas.fillRect(cx - 1, cy - 1, 2, 2, 255, 255, 255, 255, clip);
      }
    }
  }
}

/**
 * Generate a 5-sheet + preview + metadata pack for one monster
 */
async function buildMonsterPack(cfg) {
  console.log(`\n=== GENERATING ${cfg.nameVi.toUpperCase()} (${cfg.id}) ===`);
  const outDir = path.join(ROOT_OUT, cfg.id);
  fs.mkdirSync(outDir, { recursive: true });

  const [frontSprite, sideSprite, backSprite] = await Promise.all([
    extractCleanSprite(cfg.frontSrc, cfg.frontSize[0], cfg.frontSize[1]),
    extractCleanSprite(cfg.sideSrc, cfg.sideSize[0], cfg.sideSize[1]),
    extractCleanSprite(cfg.backSrc, cfg.backSize[0], cfg.backSize[1]),
  ]);

  function getDirSprite(dirIdx) {
    // 0: down, 1: left, 2: right, 3: up
    if (dirIdx === 0) return { sprite: frontSprite, flipX: false };
    if (dirIdx === 1) return { sprite: sideSprite, flipX: true };
    if (dirIdx === 2) return { sprite: sideSprite, flipX: false };
    return { sprite: backSprite, flipX: false };
  }

  function cellClip(row, col) {
    return {
      minX: col * 64 + 1,
      minY: row * 64 + 1,
      maxX: col * 64 + 62,
      maxY: row * 64 + 62,
    };
  }

  const sheets = {};

  // 1. IDLE (4 frames -> 256x256)
  const idleCanvas = new PixelCanvas(256, 256);
  for (let d = 0; d < 4; d++) {
    const { sprite, flipX } = getDirSprite(d);
    for (let f = 0; f < 4; f++) {
      const clip = cellClip(d, f);
      const footX = f * 64 + 32;
      const footY = d * 64 + 56;
      const scaleY = f === 1 || f === 2 ? 1.03 : 1.0;
      const scaleX = f === 1 || f === 2 ? 0.985 : 1.0;
      idleCanvas.blitArticulated(sprite, footX, footY, clip, {
        flipX,
        scaleX,
        scaleY,
        legSplitRatio: cfg.legSplitRatio,
      });
      // Subtle eye / talisman pulse on frame 2
      if (f === 2) {
        const gx = footX + (d === 1 ? -10 : d === 2 ? 10 : 0);
        const gy = footY - (cfg.id === 'ma_do' ? 28 : 20);
        idleCanvas.setPixel(gx, gy, cfg.accentRgb[0], cfg.accentRgb[1], cfg.accentRgb[2], 210, clip);
      }
    }
  }
  await idleCanvas.savePng(path.join(outDir, 'idle.png'));
  sheets.idle = idleCanvas;

  // 2. WALK (6 frames -> 384x256)
  const walkCanvas = new PixelCanvas(384, 256);
  const walkBobs = [0, -1, -2, 0, -1, -2];
  const leftLegDxSeq = [-2, -1, 1, 2, 1, -1];
  const rightLegDxSeq = [2, 1, -1, -2, -1, 1];
  const leftLegDySeq = [0, -2, -1, 0, 0, 0];
  const rightLegDySeq = [0, 0, 0, 0, -2, -1];

  for (let d = 0; d < 4; d++) {
    const { sprite, flipX } = getDirSprite(d);
    for (let f = 0; f < 6; f++) {
      const clip = cellClip(d, f);
      const footX = f * 64 + 32;
      const footY = d * 64 + 56 + walkBobs[f];
      const lean = d === 1 ? -0.05 : d === 2 ? 0.05 : 0;

      walkCanvas.blitArticulated(sprite, footX, footY, clip, {
        flipX,
        shearX: lean,
        legSplitRatio: cfg.legSplitRatio,
        leftLegDx: d === 0 || d === 3 ? 0 : leftLegDxSeq[f],
        leftLegDy: leftLegDySeq[f],
        rightLegDx: d === 0 || d === 3 ? 0 : rightLegDxSeq[f],
        rightLegDy: rightLegDySeq[f],
      });

      // Tiny pixel foot dust
      if (f === 1 || f === 4) {
        const dustX = footX + (d === 1 ? 12 : d === 2 ? -12 : f === 1 ? -8 : 8);
        walkCanvas.fillRect(dustX, d * 64 + 55, 2, 2, 160, 148, 128, 170, clip);
      }
    }
  }
  await walkCanvas.savePng(path.join(outDir, 'walk.png'));
  sheets.walk = walkCanvas;

  // 3. ATTACK (6 frames -> 384x256, hitFrame: 3)
  const attackCanvas = new PixelCanvas(384, 256);
  const dirVecs = [
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
  ];
  const lungeMag = [-2, -4, 4, 6, 3, 1];
  const crouchY = [1, 2, -1, 0, 1, 0];

  for (let d = 0; d < 4; d++) {
    const { sprite, flipX } = getDirSprite(d);
    const dv = dirVecs[d];
    for (let f = 0; f < 6; f++) {
      const clip = cellClip(d, f);
      const shiftX = Math.round(dv.x * lungeMag[f]);
      const shiftY = Math.round(dv.y * Math.max(-2, Math.min(3, lungeMag[f] * 0.45))) + crouchY[f];
      const footX = f * 64 + 32 + shiftX;
      const footY = d * 64 + 56 + shiftY;
      const shear = (d === 1 ? -1 : d === 2 ? 1 : 0.35) * (f === 0 || f === 1 ? -0.10 : f === 2 || f === 3 ? 0.16 : 0.05);

      attackCanvas.blitArticulated(sprite, footX, footY, clip, {
        flipX,
        scaleX: f === 2 || f === 3 ? 1.06 : f === 1 ? 0.96 : 1.0,
        scaleY: f === 1 ? 0.93 : f === 2 ? 1.04 : 1.0,
        shearX: shear,
        legSplitRatio: cfg.legSplitRatio,
      });

      drawPixelAttackVfx(attackCanvas, cfg.attackStyle, d, f, footX, footY, cfg.accentRgb, clip);
    }
  }
  await attackCanvas.savePng(path.join(outDir, 'attack.png'));
  sheets.attack = attackCanvas;

  // 4. HIT (3 frames -> 192x256)
  const hitCanvas = new PixelCanvas(192, 256);
  const recoilMag = [-4, -2, 0];
  for (let d = 0; d < 4; d++) {
    const { sprite, flipX } = getDirSprite(d);
    const dv = dirVecs[d];
    for (let f = 0; f < 3; f++) {
      const clip = cellClip(d, f);
      const footX = f * 64 + 32 + Math.round(dv.x * recoilMag[f]);
      const footY = d * 64 + 56 + Math.round(dv.y * recoilMag[f] * 0.5);
      hitCanvas.blitArticulated(sprite, footX, footY, clip, {
        flipX,
        shearX: f === 0 ? (d === 1 ? 0.16 : -0.16) : f === 1 ? (d === 1 ? 0.08 : -0.08) : 0,
        tintR: f === 0 ? 1.45 : f === 1 ? 1.2 : 1.0,
        tintG: f === 0 ? 0.65 : f === 1 ? 0.85 : 1.0,
        tintB: f === 0 ? 0.65 : f === 1 ? 0.85 : 1.0,
        flashWhite: f === 0 ? 0.35 : 0,
        legSplitRatio: cfg.legSplitRatio,
      });

      if (f === 0) {
        hitCanvas.fillRect(footX - 6, footY - 26, 2, 2, 255, 255, 255, 240, clip);
        hitCanvas.fillRect(footX + 5, footY - 20, 2, 2, 248, 113, 113, 240, clip);
      }
    }
  }
  await hitCanvas.savePng(path.join(outDir, 'hit.png'));
  sheets.hit = hitCanvas;

  // 5. DEATH (6 frames -> 384x256, holdLastFrame: true)
  const deathCanvas = new PixelCanvas(384, 256);
  for (let d = 0; d < 4; d++) {
    const { sprite, flipX } = getDirSprite(d);
    for (let f = 0; f < 6; f++) {
      const clip = cellClip(d, f);
      const footX = f * 64 + 32;
      const footY = d * 64 + 56;

      if (f === 0) {
        deathCanvas.blitArticulated(sprite, footX + (d === 1 ? 3 : -3), footY, clip, {
          flipX,
          shearX: d === 1 ? 0.14 : -0.14,
          tintR: 1.25,
          tintG: 0.72,
          tintB: 0.72,
        });
      } else if (f === 1) {
        deathCanvas.blitArticulated(sprite, footX, footY, clip, {
          flipX,
          scaleY: 0.82,
          scaleX: 1.06,
          shearX: d === 1 ? 0.18 : -0.18,
          tintR: 0.9,
          tintG: 0.8,
          tintB: 0.85,
        });
      } else {
        // Quadrupeds collapse flat onto belly/side; humanoid rotates horizontally onto ground
        const collapseProgress = (f - 2) / 3;
        const isHumanoid = cfg.id === 'ma_do';
        if (isHumanoid) {
          deathCanvas.blitArticulated(sprite, footX, footY, clip, {
            flipX,
            rotateSide: true,
            collapseRatio: 0.3 + collapseProgress * 0.65,
            tintR: 0.75,
            tintG: 0.75,
            tintB: 0.82,
            alpha: f === 5 ? 0.82 : 0.95 - collapseProgress * 0.1,
          });
        } else {
          deathCanvas.blitArticulated(sprite, footX, footY, clip, {
            flipX,
            scaleX: 1.06 + collapseProgress * 0.08,
            scaleY: 0.52 - collapseProgress * 0.16,
            shearX: (d === 1 ? -0.18 : 0.18) * (1 - collapseProgress * 0.4),
            tintR: 0.72,
            tintG: 0.72,
            tintB: 0.80,
            alpha: f === 5 ? 0.84 : 0.95 - collapseProgress * 0.08,
          });
        }

        // Subtle dark qi dissipation wisps on frames 2-4
        if (f >= 2 && f <= 4) {
          for (let w = -1; w <= 1; w++) {
            const wx = footX + w * 8;
            const wy = footY - 14 - (f - 1) * 4;
            deathCanvas.fillRect(wx, wy, 2, 2, cfg.accentRgb[0], cfg.accentRgb[1], cfg.accentRgb[2], 190 - (f - 2) * 50, clip);
          }
        }
      }
    }
  }
  await deathCanvas.savePng(path.join(outDir, 'death.png'));
  sheets.death = deathCanvas;

  // 6. PREVIEW CONTACT SHEET (860 x 560 dark slate grid showcasing all 5 animations x 4 directions)
  const previewW = 860;
  const previewH = 580;
  const previewCanvas = new PixelCanvas(previewW, previewH);
  previewCanvas.fillRect(0, 0, previewW, previewH, 15, 23, 42, 255);

  const panels = [
    { key: 'idle',   sheet: idleCanvas,   x: 20,  y: 20 },
    { key: 'hit',    sheet: hitCanvas,    x: 440, y: 20 },
    { key: 'walk',   sheet: walkCanvas,   x: 20,  y: 300 },
    { key: 'attack', sheet: attackCanvas, x: 440, y: 300 },
  ];
  // Use 2-column layout with death below or 3 rows
  const fullPreview = new PixelCanvas(840, 860);
  fullPreview.fillRect(0, 0, 840, 860, 12, 17, 30, 255);
  const layout = [
    { key: 'idle',   sheet: idleCanvas,   x: 20,  y: 20 },
    { key: 'hit',    sheet: hitCanvas,    x: 440, y: 20 },
    { key: 'walk',   sheet: walkCanvas,   x: 20,  y: 300 },
    { key: 'attack', sheet: attackCanvas, x: 440, y: 300 },
    { key: 'death',  sheet: deathCanvas,  x: 20,  y: 580 },
  ];
  for (const item of layout) {
    fullPreview.fillRect(item.x - 4, item.y - 4, item.sheet.width + 8, item.sheet.height + 8, 30, 41, 59, 255);
    fullPreview.blitRaw(item.sheet.data, item.sheet.width, item.sheet.height, item.x, item.y, 1);
  }
  await fullPreview.savePng(path.join(outDir, 'preview.png'));

  // 7. METADATA JSON
  const metadata = {
    monsterId: cfg.id,
    shape: cfg.shape,
    name: `${cfg.nameVi} (${cfg.nameHan})`,
    style: 'Premium HD Pixel Art – Chinese Xianxia Action RPG',
    perspective: 'Top-down 3/4 Oblique',
    standardFrameWidth: 64,
    standardFrameHeight: 64,
    normalizedPivot: { x: 0.5, y: 0.875 },
    pixelPivot: { x: 32, y: 56 },
    directionOrder: ['down', 'left', 'right', 'up'],
    directionRows: { down: 0, left: 1, right: 2, up: 3 },
    animations: {},
  };

  for (const [animKey, def] of Object.entries(ANIM_DEFS)) {
    const sheet = sheets[animKey];
    metadata.animations[animKey] = {
      name: def.label,
      sourcePng: `/assets/pixel-art/monsters/${cfg.id}/${def.file}`,
      imageWidth: sheet.width,
      imageHeight: sheet.height,
      frameWidth: 64,
      frameHeight: 64,
      columns: def.frameCount,
      rows: 4,
      frameCount: def.frameCount,
      fps: def.fps,
      durationMs: Math.round((def.frameCount / def.fps) * 1000),
      loop: def.loop,
      ...(def.hitFrame !== undefined ? { hitFrame: def.hitFrame } : {}),
      ...(def.holdLastFrame !== undefined ? { holdLastFrame: def.holdLastFrame } : {}),
      endState: def.loop ? 'loop' : def.holdLastFrame ? 'hold_last_frame' : 'return_to_locomotion',
      pivotX: 0.5,
      pivotY: 0.875,
      directions: ['down', 'left', 'right', 'up'],
    };
  }

  fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
  console.log(`Saved metadata.json and 5 sheets + preview.png in ${outDir}`);
}

async function main() {
  for (const cfg of MONSTER_CONFIGS) {
    await buildMonsterPack(cfg);
  }
  console.log('\n=== ALL 15 MONSTER SPRITE SHEETS GENERATED SUCCESSFULLY! ===');
}

main().catch((err) => {
  console.error('Monster pack generation failed:', err);
  process.exit(1);
});
