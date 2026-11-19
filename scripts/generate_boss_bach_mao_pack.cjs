/**
 * PHASE 2.2 – BOSS BẠCH MAO VIÊN HẦU (白毛猿猴) SPRITE SHEET & VFX GENERATOR
 * Project: Phàm Trần Tiên Lộ (凡尘仙路)
 *
 * Generates:
 *  - 9 directional 128x128 pixel-art Boss sprite sheets (4 rows: down, left, right, up):
 *      idle.png (6f), walk.png (8f), run.png (8f),
 *      attack_1.png (7f), attack_2.png (8f), attack_3.png (8f),
 *      skill.png (10f), hit.png (4f), death.png (10f)
 *  - preview.png & metadata.json inside public/assets/pixel-art/bosses/bach_mao_vien_hau/
 *  - 6 dedicated Boss VFX pixel-art sprite sheets inside public/assets/pixel-art/vfx/bach_mao_vien_hau/:
 *      1. vfx_chuong_kich.png       (Bạch Viên Chưởng Kích - 6f @ 128x128)
 *      2. vfx_dia_chan.png          (Địa Chấn - 6f @ 160x160)
 *      3. vfx_yeu_khi_tu_luc.png    (Yêu Khí Tụ Lực - 6f @ 128x128)
 *      4. vfx_bach_vien_chan_dia.png(Bạch Viên Chấn Địa - 8f @ 160x160)
 *      5. vfx_cuong_no.png          (Cuồng Nộ Phase 2 - 6f @ 128x128)
 *      6. vfx_boss_death.png        (Boss Death Effect - 8f @ 128x128)
 *
 * Standards:
 *  - Frame Size: 128x128 px (character height ~84-96 px, ~2x human height)
 *  - Normalized Pivot: (0.5, 0.90) -> Pixel (64, 115)
 *  - Zero border overflow: Pixels strictly clipped inside [1..126, 1..126] per cell
 *  - Clean binary alpha (zero white/grey JPEG halo)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BOSS_OUT = path.resolve(__dirname, '../public/assets/pixel-art/bosses/bach_mao_vien_hau');
const VFX_OUT = path.resolve(__dirname, '../public/assets/pixel-art/vfx/bach_mao_vien_hau');

const FRAME_W = 128;
const FRAME_H = 128;
const PIVOT_X = 64;
const PIVOT_Y = 115; // 128 * 0.90 = 115.2 -> 115

const MASTER_PATHS = {
  front: path.resolve(__dirname, '../src/assets/images/bach_mao_front_1794922927462.jpg'),
  side: path.resolve(__dirname, '../src/assets/images/boss_white_ape_1794048452106.jpg'),
  back: path.resolve(__dirname, '../src/assets/images/bach_mao_back_1794922927802.jpg'),
  slamRaise: path.resolve(__dirname, '../src/assets/images/bach_mao_slam_raise_1794922927386.jpg'),
  lunge: path.resolve(__dirname, '../src/assets/images/bach_mao_lunge_1794922928675.jpg'),
};

const ANIM_SPECS = {
  idle: {
    name: 'Idle (Đứng Thở Uy Nghi)',
    file: 'idle.png',
    frameCount: 6,
    fps: 6,
    loop: true,
    vfxBinding: null,
  },
  walk: {
    name: 'Walk (Bước Nặng Trầm Ổn)',
    file: 'walk.png',
    frameCount: 8,
    fps: 8,
    loop: true,
    vfxBinding: null,
  },
  run: {
    name: 'Run (Cuồng Bạo Truy Kích)',
    file: 'run.png',
    frameCount: 8,
    fps: 12,
    loop: true,
    vfxBinding: null,
  },
  attack_1: {
    name: 'Attack 1 – Thiết Chưởng',
    file: 'attack_1.png',
    frameCount: 7,
    fps: 12,
    loop: false,
    hitFrame: 4,
    vfxBinding: 'vfx_chuong_kich',
  },
  attack_2: {
    name: 'Attack 2 – Cuồng Nộ Liên Kích',
    file: 'attack_2.png',
    frameCount: 8,
    fps: 14,
    loop: false,
    hitFrame: 3,
    secondaryHitFrame: 6,
    vfxBinding: 'vfx_chuong_kich',
  },
  attack_3: {
    name: 'Attack 3 – Cuồng Bạo Xung Kích',
    file: 'attack_3.png',
    frameCount: 8,
    fps: 14,
    loop: false,
    hitFrame: 4,
    vfxBinding: 'vfx_dia_chan',
  },
  skill: {
    name: 'Skill – Bạch Viên Chấn Địa',
    file: 'skill.png',
    frameCount: 10,
    fps: 10,
    loop: false,
    hitFrame: 6,
    vfxBinding: 'vfx_bach_vien_chan_dia',
    chargeVfxBinding: 'vfx_yeu_khi_tu_luc',
  },
  hit: {
    name: 'Hit (Chịu Đòn / Choáng)',
    file: 'hit.png',
    frameCount: 4,
    fps: 10,
    loop: false,
    vfxBinding: null,
  },
  death: {
    name: 'Death (Trọng Thương Ngã Gục)',
    file: 'death.png',
    frameCount: 10,
    fps: 8,
    loop: false,
    holdLastFrame: true,
    vfxBinding: 'vfx_boss_death',
  },
};

const VFX_SPECS = {
  vfx_chuong_kich: {
    name: 'Bạch Viên Chưởng Kích',
    file: 'vfx_chuong_kich.png',
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 6,
    fps: 16,
    loop: false,
    pivot: { x: 0.5, y: 0.5 },
  },
  vfx_dia_chan: {
    name: 'Địa Chấn',
    file: 'vfx_dia_chan.png',
    frameWidth: 160,
    frameHeight: 160,
    frameCount: 6,
    fps: 14,
    loop: false,
    pivot: { x: 0.5, y: 0.5 },
  },
  vfx_yeu_khi_tu_luc: {
    name: 'Yêu Khí Tụ Lực',
    file: 'vfx_yeu_khi_tu_luc.png',
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 6,
    fps: 12,
    loop: false,
    pivot: { x: 0.5, y: 0.55 },
  },
  vfx_bach_vien_chan_dia: {
    name: 'Bạch Viên Chấn Địa',
    file: 'vfx_bach_vien_chan_dia.png',
    frameWidth: 160,
    frameHeight: 160,
    frameCount: 8,
    fps: 14,
    loop: false,
    pivot: { x: 0.5, y: 0.5 },
  },
  vfx_cuong_no: {
    name: 'Cuồng Nộ (Phase 2)',
    file: 'vfx_cuong_no.png',
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 6,
    fps: 10,
    loop: true,
    pivot: { x: 0.5, y: 0.75 },
  },
  vfx_boss_death: {
    name: 'Hiệu Ứng Tiêu Diệt Boss',
    file: 'vfx_boss_death.png',
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 8,
    fps: 10,
    loop: false,
    pivot: { x: 0.5, y: 0.6 },
  },
};

/**
 * Flood-fill transparent background extractor + bright fringe removal + crisp binary alpha
 */
async function extractCleanSprite(imagePath, targetW, targetH) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Missing master artwork: ${imagePath}`);
  }
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
    return minC >= 220 && (maxC - minC) <= 28;
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

  // Also clear enclosed interior background pockets (pure neutral white regions trapped under arms/legs)
  const holeVisited = new Uint8Array(width * height);
  for (let sy = 0; sy < height; sy++) {
    for (let sx = 0; sx < width; sx++) {
      const sIdx = sy * width + sx;
      if (holeVisited[sIdx] || rgba[sIdx * 4 + 3] === 0) continue;
      const sr = rgba[sIdx * 4], sg = rgba[sIdx * 4 + 1], sb = rgba[sIdx * 4 + 2];
      if (Math.min(sr, sg, sb) < 238 || Math.max(sr, sg, sb) - Math.min(sr, sg, sb) > 12) continue;

      const comp = [sIdx];
      holeVisited[sIdx] = 1;
      let cHead = 0;
      let sumLum = 0;
      let sumChroma = 0;
      while (cHead < comp.length) {
        const cur = comp[cHead++];
        const cr = rgba[cur * 4], cg = rgba[cur * 4 + 1], cb = rgba[cur * 4 + 2];
        sumLum += (cr + cg + cb) / 3;
        sumChroma += Math.max(cr, cg, cb) - Math.min(cr, cg, cb);
        const cx = cur % width;
        const cy = (cur - cx) / width;
        const neighbors = [
          cx > 0 ? cur - 1 : -1,
          cx < width - 1 ? cur + 1 : -1,
          cy > 0 ? cur - width : -1,
          cy < height - 1 ? cur + width : -1,
        ];
        for (const nIdx of neighbors) {
          if (nIdx < 0 || holeVisited[nIdx] || rgba[nIdx * 4 + 3] === 0) continue;
          const nr = rgba[nIdx * 4], ng = rgba[nIdx * 4 + 1], nb = rgba[nIdx * 4 + 2];
          if (Math.min(nr, ng, nb) >= 238 && Math.max(nr, ng, nb) - Math.min(nr, ng, nb) <= 12) {
            holeVisited[nIdx] = 1;
            comp.push(nIdx);
          }
        }
      }

      const avgLum = sumLum / comp.length;
      const avgChroma = sumChroma / comp.length;
      if (comp.length >= 120 && avgLum >= 246 && avgChroma <= 8) {
        for (const pIdx of comp) {
          rgba[pIdx * 4 + 3] = 0;
        }
      }
    }
  }

  // 2-pass neutral white halo edge trim (preserving white ape fur inside dark outline)
  for (let pass = 0; pass < 2; pass++) {
    const toClear = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (rgba[idx * 4 + 3] === 0) continue;
        const touchesTrans =
          rgba[(idx - 1) * 4 + 3] === 0 ||
          rgba[(idx + 1) * 4 + 3] === 0 ||
          rgba[(idx - width) * 4 + 3] === 0 ||
          rgba[(idx + width) * 4 + 3] === 0;
        if (!touchesTrans) continue;
        const r = rgba[idx * 4];
        const g = rgba[idx * 4 + 1];
        const b = rgba[idx * 4 + 2];
        const avg = (r + g + b) / 3;
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        if (avg > 175 && sat < 28) {
          toClear.push(idx);
        }
      }
    }
    for (const idx of toClear) {
      rgba[idx * 4 + 3] = 0;
    }
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

  let actualBottomY = 0;
  let actualTopY = outH - 1;
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const idx = (y * outW + x) * 4;
      if (outData[idx + 3] >= 120) {
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

  drawCircleOutline(cx, cy, radius, r, g, b, a = 255, thickness = 1, clip = null, squashY = 1) {
    const steps = Math.max(24, Math.round(radius * 6));
    for (let i = 0; i < steps; i++) {
      const ang = (i / steps) * Math.PI * 2;
      for (let t = 0; t < thickness; t++) {
        const rr = radius - t;
        if (rr <= 0) continue;
        const px = cx + Math.cos(ang) * rr;
        const py = cy + Math.sin(ang) * rr * squashY;
        this.setPixel(px, py, r, g, b, a, clip);
      }
    }
  }

  drawLine(x0, y0, x1, y1, r, g, b, a = 255, thickness = 1, clip = null) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 1.5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = Math.round(x0 + dx * t);
      const py = Math.round(y0 + dy * t);
      for (let oy = -Math.floor(thickness / 2); oy <= Math.floor(thickness / 2); oy++) {
        for (let ox = -Math.floor(thickness / 2); ox <= Math.floor(thickness / 2); ox++) {
          this.setPixel(px + ox, py + oy, r, g, b, a, clip);
        }
      }
    }
  }

  /**
   * Articulated Boss Sprite Blitter with upper-torso breathing/swing, independent stride legs,
   * gauntlets arm swing accent, rune charge glow, and 90-degree death collapse.
   */
  blitBoss(sprite, footX, footY, clip, opts = {}) {
    const {
      flipX = false,
      scaleX = 1,
      scaleY = 1,
      shearX = 0,
      upperDx = 0,
      upperDy = 0,
      legSplitRatio = 0.72,
      leftLegDx = 0,
      leftLegDy = 0,
      rightLegDx = 0,
      rightLegDy = 0,
      armSpanRatio = 0,
      tintR = 1,
      tintG = 1,
      tintB = 1,
      flashWhite = 0,
      cyanBoost = 0,
      alpha = 1,
      rotateSide = false,
      collapseRatio = 0,
    } = opts;

    const { data, w, h, bottomY } = sprite;

    if (rotateSide) {
      const flatW = Math.min(108, Math.round(h * 0.96));
      const flatH = Math.max(24, Math.round(w * (0.58 - collapseRatio * 0.24)));
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
          const g = Math.min(255, Math.round(data[srcIdx + 1] * tintG + flashWhite * 160));
          const b = Math.min(255, Math.round(data[srcIdx + 2] * tintB + flashWhite * 160));
          this.setPixel(startX + tx, startY + ty, r, g, b, Math.round(sa * alpha), clip);
        }
      }
      return;
    }

    // Smooth continuous non-tearing deformation (never split rows/cols with empty gaps)
    const effectiveScaleX = scaleX * (1 + Math.max(-0.08, Math.min(0.10, armSpanRatio * 0.06)));
    const effectiveScaleY = scaleY * (1 - Math.max(-0.06, Math.min(0.06, upperDy * 0.008)));
    const targetW = Math.max(1, Math.round(w * effectiveScaleX));
    const targetH = Math.max(1, Math.round(h * effectiveScaleY));
    const scaledBottom = Math.round((bottomY / Math.max(1, h - 1)) * (targetH - 1));
    const destX = Math.round(footX - targetW / 2);
    const destY = Math.round(footY - scaledBottom);
    const splitRow = Math.round(targetH * legSplitRatio);

    for (let ty = 0; ty < targetH; ty++) {
      const sy = Math.min(h - 1, Math.floor((ty / targetH) * h));
      const vRatio = 1 - ty / Math.max(1, targetH - 1); // 1 at top, 0 at feet
      const rowShear = Math.round((targetH - ty) * shearX + upperDx * vRatio);
      const legBlend = ty >= splitRow ? (ty - splitRow) / Math.max(1, targetH - splitRow) : 0;

      for (let tx = 0; tx < targetW; tx++) {
        const mappedTx = flipX ? targetW - 1 - tx : tx;
        const sx = Math.min(w - 1, Math.floor((mappedTx / targetW) * w));
        const srcIdx = (sy * w + sx) * 4;
        const sa = data[srcIdx + 3];
        if (sa < 20) continue;

        let ox = rowShear;
        let oy = 0;

        if (legBlend > 0) {
          if (tx < targetW * 0.48) {
            ox += Math.round(leftLegDx * legBlend);
            oy += Math.round(leftLegDy * legBlend);
          } else if (tx > targetW * 0.52) {
            ox += Math.round(rightLegDx * legBlend);
            oy += Math.round(rightLegDy * legBlend);
          }
        }

        let r = data[srcIdx] * tintR + flashWhite * 210;
        let g = data[srcIdx + 1] * tintG + flashWhite * 130;
        let b = data[srcIdx + 2] * tintB + flashWhite * 130;

        if (cyanBoost > 0 && b > r + 35 && g > r + 25) {
          g = Math.min(255, g + cyanBoost * 60);
          b = Math.min(255, b + cyanBoost * 80);
        }

        const a = Math.round(sa * alpha);
        const px = destX + tx + ox;
        const py = destY + ty + oy;
        this.setPixel(px, py, Math.round(r), Math.round(g), Math.round(b), a, clip);
        // Micro fill for diagonal leg stride so 1px gaps never open at ankles
        if (legBlend > 0.45 && Math.abs(ox - rowShear) >= 2) {
          this.setPixel(px - Math.sign(ox - rowShear), py, Math.round(r), Math.round(g), Math.round(b), a, clip);
        }
      }
    }
  }

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

function getDirectionOffset(dir) {
  switch (dir) {
    case 0: return { dx: 0, dy: 1 };   // down
    case 1: return { dx: -1, dy: 0 };  // left
    case 2: return { dx: 1, dy: 0 };   // right
    case 3: return { dx: 0, dy: -1 };  // up
  }
}

/**
 * Render one frame of a Boss animation inside clipped 128x128 cell
 */
function renderBossFrame(canvas, sprites, animKey, dir, fIdx, col, row) {
  const cellX = col * FRAME_W;
  const cellY = row * FRAME_H;
  const footX = cellX + PIVOT_X;
  const footY = cellY + PIVOT_Y;
  // Strict 1px safety border so border overflow = 0
  const clip = {
    minX: cellX + 1,
    maxX: cellX + FRAME_W - 2,
    minY: cellY + 1,
    maxY: cellY + FRAME_H - 2,
  };

  const pickBase = () => {
    if (dir === 0) return { sprite: sprites.front, flipX: false };
    if (dir === 1) return { sprite: sprites.side, flipX: true };
    if (dir === 2) return { sprite: sprites.side, flipX: false };
    return { sprite: sprites.back, flipX: false };
  };

  const { dx: dirDx, dy: dirDy } = getDirectionOffset(dir);
  const sideFlip = dir === 1;

  if (animKey === 'idle') {
    const { sprite, flipX } = pickBase();
    const phase = (fIdx / 6) * Math.PI * 2;
    const breathY = Math.sin(phase);
    canvas.blitBoss(sprite, footX, footY, clip, {
      flipX,
      scaleX: 1 + breathY * 0.024,
      scaleY: 1 - breathY * 0.022,
      upperDy: breathY * 1.4,
      armSpanRatio: breathY * 0.3,
      cyanBoost: Math.max(0, breathY * 0.55),
    });
    return;
  }

  if (animKey === 'walk') {
    const { sprite, flipX } = pickBase();
    const phase = (fIdx / 8) * Math.PI * 2;
    const stride = Math.sin(phase);
    const bounce = Math.abs(Math.cos(phase));
    const bobY = Math.round(-bounce * 3);
    canvas.blitBoss(sprite, footX, footY + bobY, clip, {
      flipX,
      scaleX: 1 + (1 - bounce) * 0.02,
      scaleY: 0.99 + bounce * 0.02,
      shearX: dir === 1 ? -0.04 : dir === 2 ? 0.04 : stride * 0.025,
      upperDx: dir === 0 || dir === 3 ? stride * 2 : dirDx * 1.5,
      upperDy: -bounce * 1.6,
      leftLegDx: dir === 1 || dir === 2 ? stride * 5 : -stride * 1.5,
      rightLegDx: dir === 1 || dir === 2 ? -stride * 5 : stride * 1.5,
      leftLegDy: Math.max(0, stride) * -3,
      rightLegDy: Math.max(0, -stride) * -3,
    });
    return;
  }

  if (animKey === 'run') {
    const { sprite, flipX } = pickBase();
    const phase = (fIdx / 8) * Math.PI * 2;
    const stride = Math.sin(phase);
    const leap = Math.abs(Math.sin(phase));
    const runOffsetX = Math.round(dirDx * 4);
    const runOffsetY = Math.round(-leap * 6);
    canvas.blitBoss(sprite, footX + runOffsetX, footY + runOffsetY, clip, {
      flipX,
      scaleX: 1.03,
      scaleY: 0.96 + leap * 0.04,
      shearX: dir === 1 ? -0.10 : dir === 2 ? 0.10 : stride * 0.04,
      upperDx: dirDx * 3,
      upperDy: -leap * 2.5,
      armSpanRatio: leap * 0.6,
      leftLegDx: dir === 1 || dir === 2 ? stride * 7 : -stride * 2,
      rightLegDx: dir === 1 || dir === 2 ? -stride * 7 : stride * 2,
      leftLegDy: Math.max(0, stride) * -4,
      rightLegDy: Math.max(0, -stride) * -4,
    });
    return;
  }

  if (animKey === 'attack_1') {
    // Thiết Chưởng (7 frames): Windup overhead raise -> crushing forward palm strike -> follow-through
    let sprite = sprites.side;
    let flipX = sideFlip;
    let opts = {};

    if (fIdx <= 2) {
      const t = fIdx / 2;
      sprite = dir === 3 ? sprites.back : sprites.slamRaise;
      flipX = dir === 1;
      opts = {
        flipX,
        scaleX: 1.0 + t * 0.03,
        scaleY: 1.02 + t * 0.05,
        armSpanRatio: 0.5 * t,
        cyanBoost: 0.4 + 0.6 * t,
      };
    } else if (fIdx <= 5) {
      const impact = fIdx === 4 ? 1.0 : 0.7;
      sprite = dir === 3 ? sprites.back : (dir === 0 ? (fIdx === 4 ? sprites.lunge : sprites.front) : sprites.lunge);
      flipX = dir === 1;
      const pushX = Math.round(dirDx * 10 * impact);
      const pushY = Math.round(dirDy * 6 * impact);
      opts = {
        flipX,
        scaleX: 1.04 + impact * 0.04,
        scaleY: 0.94 - impact * 0.03,
        shearX: dir === 1 ? -0.11 * impact : dir === 2 ? 0.11 * impact : 0,
        upperDx: dirDx * 4 * impact,
        cyanBoost: impact,
      };
      canvas.blitBoss(sprite, footX + pushX, footY + pushY, clip, opts);
      return;
    } else {
      const base = pickBase();
      sprite = base.sprite;
      opts = { flipX: base.flipX, scaleX: 1.01, scaleY: 0.98 };
    }
    canvas.blitBoss(sprite, footX, footY, clip, opts);
    return;
  }

  if (animKey === 'attack_2') {
    // Cuồng Nộ Liên Kích (8 frames): Dual alternating gauntlet strikes (hits f3 & f6)
    const isHit1 = fIdx >= 2 && fIdx <= 3;
    const isHit2 = fIdx >= 5 && fIdx <= 6;
    if (fIdx === 0 || fIdx === 1) {
      const sprite = dir === 3 ? sprites.back : sprites.slamRaise;
      canvas.blitBoss(sprite, footX - dirDx * 4, footY, clip, {
        flipX: dir === 1,
        scaleX: 0.98,
        scaleY: 1.04,
        shearX: dir === 1 ? 0.06 : -0.06,
      });
    } else if (isHit1) {
      const sprite = dir === 3 ? sprites.back : sprites.lunge;
      const pow = fIdx === 3 ? 1.0 : 0.7;
      canvas.blitBoss(sprite, footX + dirDx * 8 * pow, footY + dirDy * 5 * pow, clip, {
        flipX: dir === 1,
        scaleX: 1.05,
        scaleY: 0.95,
        shearX: dir === 1 ? -0.10 : dir === 2 ? 0.10 : -0.05,
        armSpanRatio: 0.7,
        cyanBoost: 0.85,
      });
    } else if (fIdx === 4) {
      const sprite = dir === 3 ? sprites.back : sprites.front;
      canvas.blitBoss(sprite, footX, footY - 2, clip, {
        flipX: dir === 1,
        scaleX: 1.03,
        scaleY: 1.0,
        shearX: dir === 1 ? 0.05 : -0.05,
        upperDx: -dirDx * 3,
      });
    } else if (isHit2) {
      const sprite = dir === 3 ? sprites.back : sprites.lunge;
      const pow = fIdx === 6 ? 1.0 : 0.75;
      canvas.blitBoss(sprite, footX + dirDx * 11 * pow, footY + dirDy * 6 * pow, clip, {
        flipX: dir === 1 || (dir === 0 && fIdx === 6),
        scaleX: 1.07,
        scaleY: 0.92,
        shearX: dir === 1 ? -0.13 : dir === 2 ? 0.13 : 0.06,
        tintR: 1.08,
        cyanBoost: 1.0,
      });
    } else {
      const base = pickBase();
      canvas.blitBoss(base.sprite, footX, footY, clip, { flipX: base.flipX, scaleY: 0.98 });
    }
    return;
  }

  if (animKey === 'attack_3') {
    // Cuồng Bạo Xung Kích / Charge (8 frames): Deep crouch gather -> explosive dash -> heavy slam brake
    if (fIdx <= 1) {
      const base = pickBase();
      canvas.blitBoss(base.sprite, footX - dirDx * 6, footY + 3, clip, {
        flipX: base.flipX,
        scaleX: 1.06,
        scaleY: 0.89,
        shearX: dir === 1 ? 0.08 : -0.08,
      });
    } else if (fIdx <= 5) {
      const dashProg = (fIdx - 1) / 4;
      const sprite = dir === 3 ? sprites.back : sprites.lunge;
      const dx = Math.round(dirDx * (8 + Math.sin(dashProg * Math.PI) * 7));
      const dy = Math.round(dirDy * 6 - Math.sin(dashProg * Math.PI) * 5);
      canvas.blitBoss(sprite, footX + dx, footY + dy, clip, {
        flipX: dir === 1,
        scaleX: 1.08,
        scaleY: 0.94,
        shearX: dir === 1 ? -0.16 : dir === 2 ? 0.16 : 0,
        leftLegDx: -6,
        rightLegDx: 6,
        cyanBoost: 0.9,
      });
    } else {
      const sprite = dir === 3 ? sprites.back : sprites.front;
      canvas.blitBoss(sprite, footX + dirDx * 4, footY + 1, clip, {
        flipX: dir === 1,
        scaleX: 1.04,
        scaleY: 0.95,
        shearX: dir === 1 ? -0.06 : 0.06,
      });
    }
    return;
  }

  if (animKey === 'skill') {
    // Bạch Viên Chấn Địa (10 frames, hitFrame: 6)
    if (fIdx <= 2) {
      const t = fIdx / 2;
      const base = pickBase();
      canvas.blitBoss(base.sprite, footX, footY + 2, clip, {
        flipX: base.flipX,
        scaleX: 1.04 + t * 0.04,
        scaleY: 0.92 - t * 0.04,
        cyanBoost: 0.6 + t * 0.8,
      });
    } else if (fIdx === 3 || fIdx === 4) {
      const lift = fIdx === 4 ? -10 : -5;
      const sprite = dir === 3 ? sprites.back : sprites.slamRaise;
      canvas.blitBoss(sprite, footX, footY + lift, clip, {
        flipX: dir === 1,
        scaleX: 1.02,
        scaleY: 1.08,
        armSpanRatio: 0.8,
        cyanBoost: 1.2,
      });
    } else if (fIdx >= 5 && fIdx <= 7) {
      const impact = fIdx === 6 ? 1.0 : 0.65;
      const sprite = dir === 3 ? sprites.back : sprites.front;
      canvas.blitBoss(sprite, footX, footY + 4, clip, {
        flipX: dir === 1,
        scaleX: 1.12,
        scaleY: 0.84,
        armSpanRatio: 0.9,
        cyanBoost: impact,
      });
    } else {
      const base = pickBase();
      canvas.blitBoss(base.sprite, footX, footY, clip, {
        flipX: base.flipX,
        scaleX: 1.02,
        scaleY: 0.97,
      });
    }
    return;
  }

  if (animKey === 'hit') {
    const base = pickBase();
    const recoilMag = fIdx === 0 ? 7 : fIdx === 1 ? 5 : fIdx === 2 ? 2 : 0;
    canvas.blitBoss(base.sprite, footX - dirDx * recoilMag, footY - (fIdx === 0 ? 3 : 0), clip, {
      flipX: base.flipX,
      scaleX: fIdx === 0 ? 0.96 : 1.01,
      scaleY: fIdx === 0 ? 1.03 : 0.98,
      shearX: dir === 1 ? 0.08 * (3 - fIdx) * 0.35 : -0.08 * (3 - fIdx) * 0.35,
      flashWhite: fIdx <= 1 ? (fIdx === 0 ? 0.75 : 0.35) : 0,
      tintR: fIdx <= 1 ? 1.2 : 1.0,
      tintG: fIdx <= 1 ? 0.75 : 1.0,
      tintB: fIdx <= 1 ? 0.75 : 1.0,
    });
    return;
  }

  if (animKey === 'death') {
    const base = pickBase();
    if (fIdx <= 1) {
      canvas.blitBoss(base.sprite, footX - dirDx * (4 - fIdx * 2), footY, clip, {
        flipX: base.flipX,
        flashWhite: fIdx === 0 ? 0.5 : 0.2,
        tintR: 1.15,
        tintG: 0.82,
        tintB: 0.82,
        shearX: dir === 1 ? 0.1 : -0.1,
      });
    } else if (fIdx <= 4) {
      const t = (fIdx - 2) / 2;
      canvas.blitBoss(base.sprite, footX, footY + Math.round(t * 4), clip, {
        flipX: base.flipX,
        scaleX: 1.05 + t * 0.06,
        scaleY: 0.90 - t * 0.22,
        tintR: 0.95 - t * 0.12,
        tintG: 0.88 - t * 0.12,
        tintB: 0.88 - t * 0.12,
      });
    } else {
      const t = Math.min(1, (fIdx - 5) / 4);
      canvas.blitBoss(base.sprite, footX, footY + 2, clip, {
        flipX: base.flipX,
        rotateSide: true,
        collapseRatio: t,
        tintR: 0.78 - t * 0.12,
        tintG: 0.76 - t * 0.12,
        tintB: 0.80 - t * 0.12,
        alpha: 1.0 - Math.max(0, (fIdx - 7) * 0.08),
      });
    }
  }
}

/**
 * Draw jagged pixel-art fissure crack (segmented lightning-style ground fracture)
 */
function drawJaggedCrack(canvas, cx, cy, angle, length, r, g, b, glowR, glowG, glowB, alpha, clip, squashY = 0.52) {
  const segs = 4;
  let px = cx + Math.cos(angle) * 6;
  let py = cy + Math.sin(angle) * 6 * squashY;
  for (let s = 1; s <= segs; s++) {
    const jitter = ((s % 2 === 0 ? 1 : -1) * 0.22);
    const curLen = (s / segs) * length;
    const nx = cx + Math.cos(angle + jitter) * curLen;
    const ny = cy + Math.sin(angle + jitter) * curLen * squashY;
    canvas.drawLine(px, py, nx, ny, 28, 25, 23, alpha, 3, clip);
    canvas.drawLine(px, py, nx, ny, r, g, b, alpha, 1, clip);
    if (s <= 2) {
      canvas.drawLine(px, py - 1, nx, ny - 1, glowR, glowG, glowB, Math.round(alpha * 0.75), 1, clip);
    }
    px = nx;
    py = ny;
  }
}

/**
 * Generate the 6 dedicated Boss Pixel Art VFX sheets (crisp Xianxia pixel art, transparent bg, zero canvas blur)
 */
async function generateBossVfxSheets() {
  fs.mkdirSync(VFX_OUT, { recursive: true });

  // 1. vfx_chuong_kich (6f @ 128x128) – Bạch Viên Chưởng Kích (palm shockwave crest & spirit shards)
  {
    const fw = 128, fh = 128, fc = 6;
    const c = new PixelCanvas(fw * fc, fh);
    for (let f = 0; f < fc; f++) {
      const cx = f * fw + 64;
      const cy = 64;
      const clip = { minX: f * fw + 1, maxX: (f + 1) * fw - 2, minY: 1, maxY: fh - 2 };
      const t = f / (fc - 1);
      const r = Math.round(14 + t * 42);
      const alpha = Math.round(255 * (1 - Math.max(0, t - 0.35) * 0.7));
      // Deep outline ring + bright cyan-white energy shock ring
      c.drawCircleOutline(cx, cy, r + 1, 12, 74, 110, Math.round(alpha * 0.8), 1, clip);
      c.drawCircleOutline(cx, cy, r, 56, 189, 248, alpha, 3, clip);
      c.drawCircleOutline(cx, cy, Math.max(4, r - 5), 224, 242, 254, alpha, 2, clip);
      // Tapered radial claw/palm burst streaks (varying lengths, crisp pixel tips)
      for (let k = 0; k < 10; k++) {
        const ang = (k / 10) * Math.PI * 2 + f * 0.08;
        const inner = Math.max(4, r * 0.45);
        const outer = Math.min(56, r + (k % 2 === 0 ? 12 : 6));
        c.drawLine(
          cx + Math.cos(ang) * inner,
          cy + Math.sin(ang) * inner,
          cx + Math.cos(ang) * outer,
          cy + Math.sin(ang) * outer,
          k % 2 === 0 ? 103 : 240, k % 2 === 0 ? 232 : 249, k % 2 === 0 ? 249 : 255, alpha, k % 2 === 0 ? 2 : 1, clip
        );
      }
      if (f <= 2) {
        c.fillRect(cx - 7 + f * 2, cy - 7 + f * 2, 14 - f * 4, 14 - f * 4, 240, 249, 255, 245, clip);
      }
    }
    await c.savePng(path.join(VFX_OUT, 'vfx_chuong_kich.png'));
  }

  // 2. vfx_dia_chan (6f @ 160x160) – Địa Chấn (earth tremor ring + jagged stone cracks + flying boulders)
  {
    const fw = 160, fh = 160, fc = 6;
    const c = new PixelCanvas(fw * fc, fh);
    for (let f = 0; f < fc; f++) {
      const cx = f * fw + 80;
      const cy = 88;
      const clip = { minX: f * fw + 1, maxX: (f + 1) * fw - 2, minY: 1, maxY: fh - 2 };
      const t = f / (fc - 1);
      const rx = Math.round(22 + t * 50);
      const alpha = Math.round(255 * (1 - Math.max(0, t - 0.35) * 0.6));
      c.drawCircleOutline(cx, cy, rx + 2, 69, 26, 3, alpha, 1, clip, 0.52);
      c.drawCircleOutline(cx, cy, rx, 245, 158, 11, alpha, 3, clip, 0.52);
      c.drawCircleOutline(cx, cy, Math.max(8, rx - 10), 254, 240, 138, Math.round(alpha * 0.9), 2, clip, 0.52);

      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2 + 0.15;
        drawJaggedCrack(c, cx, cy, ang, 20 + t * 44, 168, 162, 158, 251, 191, 36, alpha, clip, 0.52);

        const rockDist = 18 + t * 44;
        const rockLift = Math.round(Math.sin(t * Math.PI) * 24 + (k % 3) * 5);
        const rpx = Math.round(cx + Math.cos(ang) * rockDist);
        const rpy = Math.round(cy + Math.sin(ang) * rockDist * 0.5 - rockLift);
        c.fillRect(rpx - 3, rpy - 3, 7, 6, 41, 37, 36, alpha, clip);
        c.fillRect(rpx - 2, rpy - 2, 5, 4, 120, 113, 108, alpha, clip);
        c.fillRect(rpx - 2, rpy - 2, 3, 2, 214, 211, 209, alpha, clip);
      }
    }
    await c.savePng(path.join(VFX_OUT, 'vfx_dia_chan.png'));
  }

  // 3. vfx_yeu_khi_tu_luc (6f @ 128x128) – Yêu Khí Tụ Lực (spiraling silver-cyan & deep-violet qi gathering)
  {
    const fw = 128, fh = 128, fc = 6;
    const c = new PixelCanvas(fw * fc, fh);
    for (let f = 0; f < fc; f++) {
      const cx = f * fw + 64;
      const cy = 68;
      const clip = { minX: f * fw + 1, maxX: (f + 1) * fw - 2, minY: 1, maxY: fh - 2 };
      const t = f / (fc - 1);
      const shrinkR = Math.round(52 - t * 30);
      c.drawCircleOutline(cx, cy, shrinkR, 124, 58, 237, 225, 2, clip, 0.65);
      c.drawCircleOutline(cx, cy, Math.max(8, shrinkR - 8), 34, 211, 238, 245, 2, clip, 0.65);
      for (let k = 0; k < 12; k++) {
        const ang = (k / 12) * Math.PI * 2 + t * 2.4;
        const d1 = shrinkR + 9;
        const d2 = Math.max(4, shrinkR - 12);
        const col = k % 2 === 0 ? [165, 243, 252] : [167, 139, 250];
        c.drawLine(
          cx + Math.cos(ang) * d1,
          cy + Math.sin(ang) * d1 * 0.7,
          cx + Math.cos(ang + 0.35) * d2,
          cy + Math.sin(ang + 0.35) * d2 * 0.7,
          col[0], col[1], col[2], 240, 2, clip
        );
      }
      const coreR = Math.round(5 + t * 10);
      c.drawCircleOutline(cx, cy, coreR, 224, 242, 254, 245, 3, clip);
      c.fillRect(cx - 3, cy - 3, 6, 6, 255, 255, 255, 240, clip);
    }
    await c.savePng(path.join(VFX_OUT, 'vfx_yeu_khi_tu_luc.png'));
  }

  // 4. vfx_bach_vien_chan_dia (8f @ 160x160) – Ultimate Bạch Viên Chấn Địa (jade-cyan pillar + seismic fissures)
  {
    const fw = 160, fh = 160, fc = 8;
    const c = new PixelCanvas(fw * fc, fh);
    for (let f = 0; f < fc; f++) {
      const cx = f * fw + 80;
      const cy = 96;
      const clip = { minX: f * fw + 1, maxX: (f + 1) * fw - 2, minY: 1, maxY: fh - 2 };
      const t = f / (fc - 1);
      const rx = Math.round(24 + t * 50);
      const alpha = Math.round(255 * (1 - Math.max(0, t - 0.4) * 0.85));

      c.drawCircleOutline(cx, cy, rx + 2, 12, 74, 110, alpha, 1, clip, 0.5);
      c.drawCircleOutline(cx, cy, rx, 56, 189, 248, alpha, 3, clip, 0.5);
      c.drawCircleOutline(cx, cy, Math.max(10, rx - 13), 251, 191, 36, alpha, 2, clip, 0.5);

      if (f <= 5) {
        const pillarH = Math.round(42 + Math.sin((f / 5) * Math.PI) * 38);
        const pillarW = Math.round(24 - f * 2);
        for (let py = cy - pillarH; py <= cy; py++) {
          c.fillRect(cx - Math.floor(pillarW / 2) - 1, py, 1, 1, 14, 116, 144, Math.round(alpha * 0.8), clip);
          c.fillRect(cx + Math.floor(pillarW / 2), py, 1, 1, 14, 116, 144, Math.round(alpha * 0.8), clip);
          c.fillRect(cx - Math.floor(pillarW / 2), py, pillarW, 1, 56, 189, 248, Math.round(alpha * 0.72), clip);
          if (pillarW > 8) {
            c.fillRect(cx - Math.floor(pillarW / 4), py, Math.floor(pillarW / 2), 1, 224, 242, 254, Math.round(alpha * 0.92), clip);
          }
        }
      }

      for (let k = 0; k < 10; k++) {
        const ang = (k / 10) * Math.PI * 2;
        drawJaggedCrack(c, cx, cy, ang, rx, 103, 232, 249, 254, 240, 138, alpha, clip, 0.5);
        const debrisR = 16 + t * 52;
        const debrisLift = Math.round(Math.sin(t * Math.PI) * 30 + (k % 2) * 7);
        const dx = Math.round(cx + Math.cos(ang) * debrisR);
        const dy = Math.round(cy + Math.sin(ang) * debrisR * 0.5 - debrisLift);
        c.fillRect(dx - 3, dy - 3, 6, 6, 41, 37, 36, alpha, clip);
        c.fillRect(dx - 2, dy - 2, 4, 4, 168, 162, 158, alpha, clip);
        c.fillRect(dx - 1, dy - 1, 2, 2, 103, 232, 249, alpha, clip);
      }
    }
    await c.savePng(path.join(VFX_OUT, 'vfx_bach_vien_chan_dia.png'));
  }

  // 5. vfx_cuong_no (6f @ 128x128) – Cuồng Nộ (Phase 2 looping crimson-gold demonic beast aura)
  {
    const fw = 128, fh = 128, fc = 6;
    const c = new PixelCanvas(fw * fc, fh);
    for (let f = 0; f < fc; f++) {
      const cx = f * fw + 64;
      const baseY = 96;
      const clip = { minX: f * fw + 1, maxX: (f + 1) * fw - 2, minY: 1, maxY: fh - 2 };
      const phase = (f / fc) * Math.PI * 2;

      c.drawCircleOutline(cx, baseY, 45 + Math.round(Math.sin(phase) * 3), 127, 29, 29, 230, 1, clip, 0.45);
      c.drawCircleOutline(cx, baseY, 44 + Math.round(Math.sin(phase) * 3), 239, 68, 68, 225, 2, clip, 0.45);
      c.drawCircleOutline(cx, baseY, 35, 251, 191, 36, 195, 2, clip, 0.45);

      for (let k = 0; k < 10; k++) {
        const offsetPhase = phase + (k / 10) * Math.PI * 2;
        const xOff = Math.round(Math.cos(offsetPhase) * 34);
        const yBase = baseY + Math.round(Math.sin(offsetPhase) * 12);
        const flameH = 22 + Math.round(((f + k * 2) % 6) * 5);
        for (let h = 0; h < flameH; h++) {
          const w = Math.max(1, Math.round(5 * (1 - h / flameH)));
          const fx = cx + xOff + Math.round(Math.sin(h * 0.35 + offsetPhase) * 3);
          const fy = yBase - h;
          const isGold = h < flameH * 0.42;
          c.fillRect(fx - Math.floor(w / 2), fy, w, 1, isGold ? 253 : 220, isGold ? 224 : 38, isGold ? 71 : 38, 215, clip);
        }
      }
    }
    await c.savePng(path.join(VFX_OUT, 'vfx_cuong_no.png'));
  }

  // 6. vfx_boss_death (8f @ 128x128) – Death Effect (spirit core rupture & ascending soul wisps)
  {
    const fw = 128, fh = 128, fc = 8;
    const c = new PixelCanvas(fw * fc, fh);
    for (let f = 0; f < fc; f++) {
      const cx = f * fw + 64;
      const cy = 78;
      const clip = { minX: f * fw + 1, maxX: (f + 1) * fw - 2, minY: 1, maxY: fh - 2 };
      const t = f / (fc - 1);
      const alpha = Math.round(255 * (1 - t * 0.65));

      if (f <= 4) {
        c.drawCircleOutline(cx, cy, Math.round(12 + t * 44), 165, 243, 252, alpha, 2, clip, 0.6);
      }
      for (let k = 0; k < 14; k++) {
        const ang = (k / 14) * Math.PI * 2;
        const spread = 10 + t * 38;
        const lift = Math.round(t * (28 + (k % 4) * 10));
        const px = Math.round(cx + Math.cos(ang) * spread);
        const py = Math.round(cy + Math.sin(ang) * spread * 0.45 - lift);
        const col = k % 3 === 0 ? [248, 250, 252] : k % 3 === 1 ? [56, 189, 248] : [203, 213, 225];
        const sz = f < 4 ? 4 : 2;
        c.fillRect(px - 1, py - 1, sz, sz, col[0], col[1], col[2], alpha, clip);
      }
    }
    await c.savePng(path.join(VFX_OUT, 'vfx_boss_death.png'));
  }
}

async function main() {
  console.log('=== PHASE 2.2: Generating Bạch Mao Viên Hầu Sprite Pack & VFX ===');
  fs.mkdirSync(BOSS_OUT, { recursive: true });
  fs.mkdirSync(VFX_OUT, { recursive: true });

  // Extract clean transparent master sprites scaled cleanly inside 128x128 frame (~88-96px body height)
  const sprites = {
    front: await extractCleanSprite(MASTER_PATHS.front, 92, 92),
    side: await extractCleanSprite(MASTER_PATHS.side, 94, 92),
    back: await extractCleanSprite(MASTER_PATHS.back, 92, 92),
    slamRaise: await extractCleanSprite(MASTER_PATHS.slamRaise, 96, 102),
    lunge: await extractCleanSprite(MASTER_PATHS.lunge, 98, 92),
  };

  console.log('Extracted clean masters:', {
    front: `${sprites.front.w}x${sprites.front.h} (bottom=${sprites.front.bottomY})`,
    side: `${sprites.side.w}x${sprites.side.h} (bottom=${sprites.side.bottomY})`,
    back: `${sprites.back.w}x${sprites.back.h} (bottom=${sprites.back.bottomY})`,
    slamRaise: `${sprites.slamRaise.w}x${sprites.slamRaise.h} (bottom=${sprites.slamRaise.bottomY})`,
    lunge: `${sprites.lunge.w}x${sprites.lunge.h} (bottom=${sprites.lunge.bottomY})`,
  });

  const metadataAnims = {};
  const previewRows = [];

  for (const [animKey, spec] of Object.entries(ANIM_SPECS)) {
    const sheetW = spec.frameCount * FRAME_W;
    const sheetH = 4 * FRAME_H;
    const canvas = new PixelCanvas(sheetW, sheetH);

    for (let dir = 0; dir < 4; dir++) {
      for (let f = 0; f < spec.frameCount; f++) {
        renderBossFrame(canvas, sprites, animKey, dir, f, f, dir);
      }
    }

    const outPath = path.join(BOSS_OUT, spec.file);
    await canvas.savePng(outPath);
    console.log(`  Generated ${spec.file} (${sheetW}x${sheetH}, ${spec.frameCount}f x 4 dirs)`);

    metadataAnims[animKey] = {
      name: spec.name,
      sourcePng: `/assets/pixel-art/bosses/bach_mao_vien_hau/${spec.file}`,
      imageWidth: sheetW,
      imageHeight: sheetH,
      frameWidth: FRAME_W,
      frameHeight: FRAME_H,
      columns: spec.frameCount,
      rows: 4,
      frameCount: spec.frameCount,
      fps: spec.fps,
      durationMs: Math.round((spec.frameCount / spec.fps) * 1000),
      loop: spec.loop,
      ...(spec.hitFrame !== undefined ? { hitFrame: spec.hitFrame } : {}),
      ...(spec.secondaryHitFrame !== undefined ? { secondaryHitFrame: spec.secondaryHitFrame } : {}),
      ...(spec.holdLastFrame ? { holdLastFrame: true } : {}),
      endState: spec.holdLastFrame ? 'hold_last_frame' : spec.loop ? 'loop' : 'return_to_locomotion',
      pivotX: 0.5,
      pivotY: 0.90,
      directions: ['down', 'left', 'right', 'up'],
      vfxBinding: spec.vfxBinding || null,
      ...(spec.chargeVfxBinding ? { chargeVfxBinding: spec.chargeVfxBinding } : {}),
    };

    previewRows.push({ animKey, spec, canvas });
  }

  // Generate Boss VFX sheets
  await generateBossVfxSheets();
  console.log('  Generated 6 Boss VFX PNG sheets in public/assets/pixel-art/vfx/bach_mao_vien_hau/');

  // Build preview.png showing Down/Left/Right/Up idle + all 9 animation Down rows
  const maxCols = 10;
  const previewW = maxCols * FRAME_W;
  const previewH = (1 + previewRows.length) * FRAME_H;
  const preview = new PixelCanvas(previewW, previewH);
  // Subtle dark slate grid background for preview clarity
  preview.fillRect(0, 0, previewW, previewH, 15, 23, 42, 255);
  for (let r = 0; r < 1 + previewRows.length; r++) {
    for (let c = 0; c < maxCols; c++) {
      if ((r + c) % 2 === 1) {
        preview.fillRect(c * FRAME_W, r * FRAME_H, FRAME_W, FRAME_H, 23, 33, 54, 255);
      }
    }
  }

  // Row 0 of preview: 4 cardinal idle directions side-by-side (Down, Left, Right, Up)
  const idleCanvas = previewRows[0].canvas;
  for (let dir = 0; dir < 4; dir++) {
    const srcCell = Buffer.alloc(FRAME_W * FRAME_H * 4);
    for (let y = 0; y < FRAME_H; y++) {
      const srcOffset = ((dir * FRAME_H + y) * idleCanvas.width + 0) * 4;
      idleCanvas.data.copy(srcCell, y * FRAME_W * 4, srcOffset, srcOffset + FRAME_W * 4);
    }
    preview.blitRaw(srcCell, FRAME_W, FRAME_H, dir * FRAME_W, 0, 1);
  }

  // Rows 1..9 of preview: Row 0 (Down) of every animation
  previewRows.forEach((rowObj, idx) => {
    const destY = (idx + 1) * FRAME_H;
    for (let f = 0; f < rowObj.spec.frameCount; f++) {
      const srcCell = Buffer.alloc(FRAME_W * FRAME_H * 4);
      for (let y = 0; y < FRAME_H; y++) {
        const srcOffset = (y * rowObj.canvas.width + f * FRAME_W) * 4;
        rowObj.canvas.data.copy(srcCell, y * FRAME_W * 4, srcOffset, srcOffset + FRAME_W * 4);
      }
      preview.blitRaw(srcCell, FRAME_W, FRAME_H, f * FRAME_W, destY, 1);
    }
  });
  await preview.savePng(path.join(BOSS_OUT, 'preview.png'));

  // Write metadata.json
  const metadata = {
    bossId: 'bach_mao_vien_hau',
    shape: 'ape_boss',
    name: 'Bạch Mao Viên Hầu (白毛猿猴)',
    style: 'Premium HD Pixel Art – Chinese Xianxia Action RPG',
    perspective: 'Top-down 3/4 Oblique',
    standardFrameWidth: FRAME_W,
    standardFrameHeight: FRAME_H,
    logicalBodySize: { width: 88, height: 96 },
    normalizedPivot: { x: 0.5, y: 0.90 },
    pixelPivot: { x: PIVOT_X, y: PIVOT_Y },
    hitbox: { type: 'circle', radius: 38, offsetX: 0, offsetY: -8 },
    directionOrder: ['down', 'left', 'right', 'up'],
    directionRows: { down: 0, left: 1, right: 2, up: 3 },
    animations: metadataAnims,
    vfx: Object.fromEntries(
      Object.entries(VFX_SPECS).map(([key, v]) => [
        key,
        {
          ...v,
          sourcePng: `/assets/pixel-art/vfx/bach_mao_vien_hau/${v.file}`,
          imageWidth: v.frameWidth * v.frameCount,
          imageHeight: v.frameHeight,
        },
      ])
    ),
  };

  fs.writeFileSync(path.join(BOSS_OUT, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
  console.log('Saved preview.png & metadata.json successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
