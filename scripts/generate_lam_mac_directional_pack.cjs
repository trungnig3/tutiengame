/**
 * LÂM MẶC COMPLETE 4-DIRECTION SPRITE SHEET GENERATOR
 * Project: Phàm Trần Tiên Lộ
 * Generates transparent PNG sprite sheets for all 10 animations in 4 directions:
 * Row 0: Down (South)
 * Row 1: Left (West)
 * Row 2: Right (East)
 * Row 3: Up (North)
 * Output folder: public/assets/pixel-art/characters/lam_mac/
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT_DIR = path.resolve(__dirname, '../public/assets/pixel-art/characters/lam_mac');

// Source master images
const SRC_FRONT = 'src/assets/images/lam_mac_front_1794137273797.jpg';
const SRC_BACK = 'src/assets/images/lam_mac_back_1794137254356.jpg';
const SRC_SIDE = 'src/assets/images/lam_mac_side_1794137256776.jpg';
const SRC_ACTION = 'src/assets/images/cultivator_hero_1794048452272.jpg';

/**
 * Extract transparent foreground with border flood-fill
 */
async function extractForeground(imagePath, threshold = 230) {
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
  const queue = [];

  function isBg(idx) {
    const r = rgba[idx * 4];
    const g = rgba[idx * 4 + 1];
    const b = rgba[idx * 4 + 2];
    return r >= threshold && g >= threshold && b >= threshold;
  }

  for (let x = 0; x < width; x++) {
    queue.push(x, 0); queue.push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    queue.push(0, y); queue.push(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = y * width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;
    if (isBg(idx)) {
      rgba[idx * 4 + 3] = 0;
      if (x > 0 && !visited[idx - 1]) queue.push(x - 1, y);
      if (x < width - 1 && !visited[idx + 1]) queue.push(x + 1, y);
      if (y > 0 && !visited[idx - width]) queue.push(x, y - 1);
      if (y < height - 1 && !visited[idx + width]) queue.push(x, y + 1);
    }
  }

  // Find bounding box
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] > 10) {
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
    const srcRow = (minY + y) * width + minX;
    rgba.copy(cropped, y * cropW * 4, srcRow * 4, (srcRow + cropW) * 4);
  }

  return { buffer: cropped, width: cropW, height: cropH };
}

/**
 * Pixel CanvasBuffer with exact integer blitting
 */
class CanvasBuffer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4, 0);
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || a <= 0) return;
    const idx = (y * this.width + x) * 4;
    if (a < 255) {
      const prevA = this.data[idx + 3] / 255;
      const curA = a / 255;
      const outA = curA + prevA * (1 - curA);
      if (outA > 0) {
        this.data[idx] = Math.round((r * curA + this.data[idx] * prevA * (1 - curA)) / outA);
        this.data[idx + 1] = Math.round((g * curA + this.data[idx + 1] * prevA * (1 - curA)) / outA);
        this.data[idx + 2] = Math.round((b * curA + this.data[idx + 2] * prevA * (1 - curA)) / outA);
        this.data[idx + 3] = Math.round(outA * 255);
      }
    } else {
      this.data[idx] = r;
      this.data[idx + 1] = g;
      this.data[idx + 2] = b;
      this.data[idx + 3] = a;
    }
  }

  blit(srcBuf, srcW, srcH, destX, destY, opts = {}) {
    const {
      scaleX = 1,
      scaleY = 1,
      tintR = 1,
      tintG = 1,
      tintB = 1,
      alpha = 1,
      flipX = false,
      shearX = 0,
      offsetYPerX = 0,
    } = opts;

    const targetW = Math.round(srcW * Math.abs(scaleX));
    const targetH = Math.round(srcH * Math.abs(scaleY));

    for (let ty = 0; ty < targetH; ty++) {
      const sy = Math.floor(ty / Math.abs(scaleY));
      if (sy < 0 || sy >= srcH) continue;
      const xOffset = Math.round((ty - targetH) * shearX);

      for (let tx = 0; tx < targetW; tx++) {
        const mappedTx = flipX ? targetW - 1 - tx : tx;
        const sx = Math.floor(mappedTx / Math.abs(scaleX));
        if (sx < 0 || sx >= srcW) continue;

        const srcIdx = (sy * srcW + sx) * 4;
        const sa = srcBuf[srcIdx + 3];
        if (sa < 10) continue;

        const r = Math.min(255, Math.round(srcBuf[srcIdx] * tintR));
        const g = Math.min(255, Math.round(srcBuf[srcIdx + 1] * tintG));
        const b = Math.min(255, Math.round(srcBuf[srcIdx + 2] * tintB));
        const a = Math.round(sa * alpha);

        const yExtra = Math.round(tx * offsetYPerX);
        this.setPixel(destX + tx + xOffset, destY + ty + yExtra, r, g, b, a);
      }
    }
  }

  async savePng(outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    await sharp(this.data, {
      raw: {
        width: this.width,
        height: this.height,
        channels: 4,
      },
    })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);
    console.log(`Saved: ${outputPath} (${this.width}x${this.height})`);
  }
}

/**
 * Main Builder
 */
async function buildLamMacPack() {
  console.log('=== BUILDING LÂM MẶC 4-DIRECTION PIXEL ART PACK ===');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Prepare Base Directional Sprites normalized to 40x52 within 64x64 frame
  console.log('1. Extracting 4-direction master sprites...');
  const rawFront = await extractForeground(SRC_FRONT, 235);
  const rawBack = await extractForeground(SRC_BACK, 235);
  const rawSide = await extractForeground(SRC_SIDE, 235);
  const rawAction = await extractForeground(SRC_ACTION, 235);

  const baseFront = await sharp(rawFront.buffer, { raw: { width: rawFront.width, height: rawFront.height, channels: 4 } })
    .resize(38, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const baseBack = await sharp(rawBack.buffer, { raw: { width: rawBack.width, height: rawBack.height, channels: 4 } })
    .resize(38, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const baseRight = await sharp(rawSide.buffer, { raw: { width: rawSide.width, height: rawSide.height, channels: 4 } })
    .resize(36, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const baseAction = await sharp(rawAction.buffer, { raw: { width: rawAction.width, height: rawAction.height, channels: 4 } })
    .resize(44, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Direction definitions:
  // dirIndex 0 = Down (South), dirIndex 1 = Left (West), dirIndex 2 = Right (East), dirIndex 3 = Up (North)
  function getBaseForDir(d, isAction = false) {
    if (d === 0) return { data: isAction ? baseAction.data : baseFront.data, w: isAction ? baseAction.info.width : baseFront.info.width, h: isAction ? baseAction.info.height : baseFront.info.height, flipX: false };
    if (d === 1) return { data: baseRight.data, w: baseRight.info.width, h: baseRight.info.height, flipX: true };
    if (d === 2) return { data: baseRight.data, w: baseRight.info.width, h: baseRight.info.height, flipX: false };
    return { data: baseBack.data, w: baseBack.info.width, h: baseBack.info.height, flipX: false };
  }

  // -------------------------------------------------------------
  // A. IDLE (4 directions x 6 frames = 384x256)
  // -------------------------------------------------------------
  console.log('Building lam_mac_idle.png (384x256, 4 directions x 6 frames)...');
  const idleCanvas = new CanvasBuffer(384, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d);
    const fy = d * 64;
    for (let f = 0; f < 6; f++) {
      const fx = f * 64;
      const bob = Math.round(Math.sin((f / 6) * Math.PI * 2) * 1.2);
      const breathe = 1 + Math.sin((f / 6) * Math.PI * 2) * 0.02;
      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + 6 + bob;

      idleCanvas.blit(base.data, base.w, base.h, posX, posY, {
        scaleY: breathe,
        flipX: base.flipX,
      });

      // Sword gleam on frame 3
      if (f === 3) {
        if (d === 0 || d === 2) {
          idleCanvas.setPixel(posX + (base.flipX ? 4 : base.w - 4), posY + 20, 255, 255, 255, 255);
          idleCanvas.setPixel(posX + (base.flipX ? 5 : base.w - 5), posY + 20, 100, 240, 255, 255);
        } else if (d === 3) {
          idleCanvas.setPixel(posX + 24, posY + 10, 255, 255, 255, 255);
        }
      }
    }
  }
  await idleCanvas.savePng(path.join(OUT_DIR, 'lam_mac_idle.png'));

  // -------------------------------------------------------------
  // B. WALK (4 directions x 8 frames = 512x256)
  // -------------------------------------------------------------
  console.log('Building lam_mac_walk.png (512x256, 4 directions x 8 frames)...');
  const walkCanvas = new CanvasBuffer(512, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d);
    const fy = d * 64;
    for (let f = 0; f < 8; f++) {
      const fx = f * 64;
      const cycle = (f / 8) * Math.PI * 2;
      const bob = Math.abs(Math.sin(cycle)) * 2;
      const legStride = Math.sin(cycle) * 0.09;
      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + 5 + Math.round(bob);

      walkCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        shearX: (d === 1 ? -legStride : legStride),
      });
    }
  }
  await walkCanvas.savePng(path.join(OUT_DIR, 'lam_mac_walk.png'));

  // -------------------------------------------------------------
  // C. RUN (4 directions x 8 frames = 512x256)
  // -------------------------------------------------------------
  console.log('Building lam_mac_run.png (512x256, 4 directions x 8 frames)...');
  const runCanvas = new CanvasBuffer(512, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d);
    const fy = d * 64;
    for (let f = 0; f < 8; f++) {
      const fx = f * 64;
      const cycle = (f / 8) * Math.PI * 2;
      const bob = Math.abs(Math.sin(cycle)) * 3;
      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + 4 + Math.round(bob);
      const lean = d === 1 ? -0.15 : (d === 2 ? 0.15 : 0.08);

      runCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        shearX: lean,
      });

      // Dust puffs behind gót chân
      if (f % 2 === 0) {
        const dustX = posX + (d === 1 ? base.w + 2 : (d === 2 ? -4 : 6));
        runCanvas.setPixel(dustX, posY + base.h - 2, 210, 210, 200, 180);
        runCanvas.setPixel(dustX + 1, posY + base.h - 3, 230, 230, 220, 120);
      }
    }
  }
  await runCanvas.savePng(path.join(OUT_DIR, 'lam_mac_run.png'));

  // -------------------------------------------------------------
  // D. ATTACK 1 (4 directions x 5 frames = 320x256)
  // -------------------------------------------------------------
  console.log('Building lam_mac_attack_1.png (320x256, 4 directions x 5 frames)...');
  const atk1Canvas = new CanvasBuffer(320, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d, true);
    const fy = d * 64;
    for (let f = 0; f < 5; f++) {
      const fx = f * 64;
      let shiftX = 0, shiftY = 6, shear = 0;

      if (f === 0) { shear = -0.1; shiftX = -2; } // Windup
      else if (f === 1) { shear = 0.12; shiftX = 2; } // Thrust
      else if (f === 2) { shear = 0.2; shiftX = 4; } // Strike (hitFrame)
      else if (f === 3) { shear = 0.08; shiftX = 2; } // Follow-through
      else { shear = 0; shiftX = 0; } // Recovery

      const posX = fx + Math.round((64 - base.w) / 2) + shiftX;
      const posY = fy + shiftY;

      atk1Canvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        shearX: (d === 1 ? -shear : shear),
      });

      // Crescent sword blade wind arc on frame 2
      if (f === 2) {
        const arcCenterX = posX + (d === 1 ? -6 : (d === 2 ? base.w + 6 : base.w / 2));
        const arcCenterY = posY + 22;
        for (let a = -12; a <= 12; a++) {
          const px = arcCenterX + a;
          const py = arcCenterY - Math.round(Math.cos((a / 12) * 1.5) * 10);
          atk1Canvas.setPixel(px, py, 120, 240, 255, 255);
          atk1Canvas.setPixel(px, py + 1, 240, 255, 255, 200);
        }
      }
    }
  }
  await atk1Canvas.savePng(path.join(OUT_DIR, 'lam_mac_attack_1.png'));

  // -------------------------------------------------------------
  // E. ATTACK 2 (4 directions x 5 frames = 320x256)
  // -------------------------------------------------------------
  console.log('Building lam_mac_attack_2.png (320x256, 4 directions x 5 frames)...');
  const atk2Canvas = new CanvasBuffer(320, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d, true);
    const fy = d * 64;
    for (let f = 0; f < 5; f++) {
      const fx = f * 64;
      let shiftX = 0, shiftY = 6, shear = 0;
      if (f === 0) shear = -0.06;
      else if (f === 1) shear = 0.15;
      else if (f === 2) shear = 0.22; // Strike
      else if (f === 3) shear = 0.1;
      else shear = 0;

      const posX = fx + Math.round((64 - base.w) / 2) + shiftX;
      const posY = fy + shiftY;

      atk2Canvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        shearX: (d === 1 ? -shear : shear),
      });

      // Golden-cyan horizontal energy slash on frame 2
      if (f === 2) {
        for (let w = -15; w <= 18; w++) {
          const px = posX + (base.w / 2) + (d === 1 ? -w : w);
          atk2Canvas.setPixel(px, posY + 26, 255, 215, 80, 255);
          atk2Canvas.setPixel(px, posY + 27, 255, 255, 220, 230);
        }
      }
    }
  }
  await atk2Canvas.savePng(path.join(OUT_DIR, 'lam_mac_attack_2.png'));

  // -------------------------------------------------------------
  // F. ATTACK 3 (4 directions x 6 frames = 384x256)
  // -------------------------------------------------------------
  console.log('Building lam_mac_attack_3.png (384x256, 4 directions x 6 frames)...');
  const atk3Canvas = new CanvasBuffer(384, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d, true);
    const fy = d * 64;
    for (let f = 0; f < 6; f++) {
      const fx = f * 64;
      let shiftY = 6;
      if (f === 1) shiftY = 0; // Leap
      else if (f === 2) shiftY = -4; // Apex
      else if (f === 3) shiftY = 8; // Ground Plunge HitFrame 3
      else if (f === 4) shiftY = 7;
      else shiftY = 6;

      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + shiftY;

      atk3Canvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        shearX: f === 3 ? 0.12 : 0,
      });

      // Ground shockwave burst on frame 3
      if (f === 3) {
        for (let r = -18; r <= 18; r++) {
          const alpha = Math.round(255 * (1 - Math.abs(r) / 20));
          atk3Canvas.setPixel(posX + (base.w / 2) + r, posY + base.h - 1, 120, 240, 255, alpha);
          atk3Canvas.setPixel(posX + (base.w / 2) + r, posY + base.h - 2, 255, 255, 255, Math.round(alpha * 0.8));
        }
      }
    }
  }
  await atk3Canvas.savePng(path.join(OUT_DIR, 'lam_mac_attack_3.png'));

  // -------------------------------------------------------------
  // G. DODGE (4 directions x 4 frames = 256x256)
  // -------------------------------------------------------------
  console.log('Building lam_mac_dodge.png (256x256, 4 directions x 4 frames)...');
  const dodgeCanvas = new CanvasBuffer(256, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d);
    const fy = d * 64;
    for (let f = 0; f < 4; f++) {
      const fx = f * 64;
      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + 6;

      // Fading phantom shadow behind
      const shadowOffset = (d === 1 ? 6 : (d === 2 ? -6 : 0));
      dodgeCanvas.blit(base.data, base.w, base.h, posX + shadowOffset, posY, {
        flipX: base.flipX,
        alpha: 0.35,
        tintR: 0.5,
        tintG: 0.9,
        tintB: 1.0,
        shearX: 0.2,
      });

      // Main dashing body
      dodgeCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        alpha: 0.9,
        shearX: 0.18,
      });
    }
  }
  await dodgeCanvas.savePng(path.join(OUT_DIR, 'lam_mac_dodge.png'));

  // -------------------------------------------------------------
  // H. SKILL (4 directions x 8 frames = 512x256)
  // -------------------------------------------------------------
  console.log('Building lam_mac_skill.png (512x256, 4 directions x 8 frames)...');
  const skillCanvas = new CanvasBuffer(512, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d, true);
    const fy = d * 64;
    for (let f = 0; f < 8; f++) {
      const fx = f * 64;
      const glow = f <= 4 ? f / 4 : (8 - f) / 4;
      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + 6 - Math.round(glow * 2);

      skillCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        tintR: 1 + glow * 0.3,
        tintG: 1 + glow * 0.4,
        tintB: 1 + glow * 0.6,
      });

      // Celestial Sword aura ring at castFrame 4
      if (f >= 2 && f <= 5) {
        const radius = 10 + (f - 2) * 5;
        for (let a = 0; a < 32; a++) {
          const ang = (a / 32) * Math.PI * 2;
          const px = posX + (base.w / 2) + Math.cos(ang) * radius;
          const py = posY + 24 + Math.sin(ang) * (radius * 0.6);
          skillCanvas.setPixel(px, py, 120, 240, 255, 210);
        }
      }
    }
  }
  await skillCanvas.savePng(path.join(OUT_DIR, 'lam_mac_skill.png'));

  // -------------------------------------------------------------
  // I. HIT (4 directions x 3 frames = 192x256)
  // -------------------------------------------------------------
  console.log('Building lam_mac_hit.png (192x256, 4 directions x 3 frames)...');
  const hitCanvas = new CanvasBuffer(192, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d);
    const fy = d * 64;
    for (let f = 0; f < 3; f++) {
      const fx = f * 64;
      const recoilX = (d === 1 ? f * 3 : (d === 2 ? -f * 3 : 0));
      const recoilY = (d === 0 ? -f * 2 : (d === 3 ? f * 2 : 0));
      const posX = fx + Math.round((64 - base.w) / 2) + recoilX;
      const posY = fy + 6 + recoilY;

      hitCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        tintR: 1.6, // Red damage flash
        tintG: 0.6,
        tintB: 0.6,
        shearX: (d === 1 ? 0.15 : -0.15),
      });
    }
  }
  await hitCanvas.savePng(path.join(OUT_DIR, 'lam_mac_hit.png'));

  // -------------------------------------------------------------
  // J. DEATH (4 directions x 8 frames = 512x256)
  // -------------------------------------------------------------
  console.log('Building lam_mac_death.png (512x256, 4 directions x 8 frames)...');
  const deathCanvas = new CanvasBuffer(512, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d);
    const fy = d * 64;
    for (let f = 0; f < 8; f++) {
      const fx = f * 64;
      const collapseH = Math.max(0.25, 1 - f * 0.12);
      const dropY = Math.min(20, f * 3);
      const fadeAlpha = Math.max(0.35, 1 - f * 0.08);
      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + 6 + dropY;

      deathCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        scaleY: collapseH,
        alpha: fadeAlpha,
        tintR: 0.7,
        tintG: 0.7,
        tintB: 0.9,
      });
    }
  }
  await deathCanvas.savePng(path.join(OUT_DIR, 'lam_mac_death.png'));

  // -------------------------------------------------------------
  // K. CONTACT SHEET PREVIEW: lam_mac_preview.png (1024 x 1400)
  // -------------------------------------------------------------
  console.log('Building lam_mac_preview.png contact sheet...');
  const previewCanvas = new CanvasBuffer(1024, 1400);

  // Background banner styling (dark slate slate-950)
  for (let y = 0; y < 1400; y++) {
    for (let x = 0; x < 1024; x++) {
      const r = 24, g = 28, b = 32;
      previewCanvas.setPixel(x, y, r, g, b, 255);
    }
  }

  // Header banner box
  for (let y = 10; y < 70; y++) {
    for (let x = 20; x < 1004; x++) {
      previewCanvas.setPixel(x, y, 36, 44, 52, 255);
    }
  }

  // Draw sections for all 10 animations
  const animSections = [
    { name: '1. IDLE (6 Frames)', sheet: idleCanvas, cols: 6, w: 384, h: 256 },
    { name: '2. WALK (8 Frames)', sheet: walkCanvas, cols: 8, w: 512, h: 256 },
    { name: '3. RUN (8 Frames)', sheet: runCanvas, cols: 8, w: 512, h: 256 },
    { name: '4. ATTACK 1 (5 Frames)', sheet: atk1Canvas, cols: 5, w: 320, h: 256 },
    { name: '5. ATTACK 2 (5 Frames)', sheet: atk2Canvas, cols: 5, w: 320, h: 256 },
    { name: '6. ATTACK 3 (6 Frames)', sheet: atk3Canvas, cols: 6, w: 384, h: 256 },
    { name: '7. DODGE (4 Frames)', sheet: dodgeCanvas, cols: 4, w: 256, h: 256 },
    { name: '8. SKILL (8 Frames)', sheet: skillCanvas, cols: 8, w: 512, h: 256 },
    { name: '9. HIT (3 Frames)', sheet: hitCanvas, cols: 3, w: 192, h: 256 },
    { name: '10. DEATH (8 Frames)', sheet: deathCanvas, cols: 8, w: 512, h: 256 },
  ];

  // Arrange in 5 rows x 2 columns of previews
  for (let idx = 0; idx < animSections.length; idx++) {
    const sec = animSections[idx];
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const startX = 30 + col * 490;
    const startY = 85 + row * 260;

    // Draw frame panel background
    for (let py = 0; py < 250; py++) {
      for (let px = 0; px < 470; px++) {
        previewCanvas.setPixel(startX + px, startY + py, 16, 20, 24, 255);
      }
    }

    // Blit sheet scaled to fit into 470x230 panel
    const scaleFactor = Math.min(460 / sec.w, 220 / sec.h, 1.0);
    previewCanvas.blit(sec.sheet.data, sec.w, sec.h, startX + 5, startY + 20, {
      scaleX: scaleFactor,
      scaleY: scaleFactor,
    });
  }

  await previewCanvas.savePng(path.join(OUT_DIR, 'lam_mac_preview.png'));

  console.log('=== ALL 11 LÂM MẶC ASSETS CREATED SUCCESSFULLY! ===');
}

buildLamMacPack().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
