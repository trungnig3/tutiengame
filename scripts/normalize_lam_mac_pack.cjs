/**
 * LÂM MẶC SPRITE SHEET NORMALIZATION & VFX SEPARATION SCRIPT (PHASE 1.2)
 * Project: Phàm Trần Tiên Lộ
 * 
 * Standards enforced:
 * 1. Consistent frame dimensions: 64x64 px.
 * 2. Consistent character scale: centered at x=32, feet at y=56 (pivot x:0.5, y:0.875).
 * 3. 100% transparent backgrounds with clean boundaries (Alpha=0).
 * 4. SEPARATE character sprite sheets from VFX:
 *    - All energy arcs, sword trails, ground shockwaves, aura rings, dust puffs, and phantom shadows
 *      are removed from the character sprite sheets.
 *    - Weapon artwork (sword carried/wielded) is preserved.
 *    - Separated VFX assets are generated independently into public/assets/pixel-art/vfx/.
 * 5. Update master contact sheet preview: lam_mac_preview.png.
 * 6. Generate lam_mac_metadata.json with complete technical specs.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CHAR_OUT_DIR = path.resolve(__dirname, '../public/assets/pixel-art/characters/lam_mac');
const VFX_OUT_DIR = path.resolve(__dirname, '../public/assets/pixel-art/vfx');

// Original master source images
const SRC_FRONT = 'src/assets/images/lam_mac_front_1794137273797.jpg';
const SRC_BACK = 'src/assets/images/lam_mac_back_1794137254356.jpg';
const SRC_SIDE = 'src/assets/images/lam_mac_side_1794137256776.jpg';
const SRC_ACTION = 'src/assets/images/cultivator_hero_1794048452272.jpg';

/**
 * Extract transparent foreground with border flood-fill & bounding crop
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
 * Pixel CanvasBuffer with exact integer blitting & nearest-neighbor scaling
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
    const stat = fs.statSync(outputPath);
    console.log(`Saved: ${outputPath} (${this.width}x${this.height} px, ${stat.size} bytes)`);
  }
}

async function runNormalization() {
  console.log('=== NORMALIZING LÂM MẶC SPRITE SHEETS & SEPARATING VFX ===');
  fs.mkdirSync(CHAR_OUT_DIR, { recursive: true });
  fs.mkdirSync(VFX_OUT_DIR, { recursive: true });

  // 1. Prepare Base Directional Sprites normalized to 38x52 within 64x64 frame
  const rawFront = await extractForeground(SRC_FRONT, 235);
  const rawBack = await extractForeground(SRC_BACK, 235);
  const rawSide = await extractForeground(SRC_SIDE, 235);
  const rawAction = await extractForeground(SRC_ACTION, 235);

  const baseFront = await sharp(rawFront.buffer, { raw: { width: rawFront.width, height: rawFront.height, channels: 4 } })
    .resize(38, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.nearest })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const baseBack = await sharp(rawBack.buffer, { raw: { width: rawBack.width, height: rawBack.height, channels: 4 } })
    .resize(38, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.nearest })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const baseRight = await sharp(rawSide.buffer, { raw: { width: rawSide.width, height: rawSide.height, channels: 4 } })
    .resize(36, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.nearest })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const baseAction = await sharp(rawAction.buffer, { raw: { width: rawAction.width, height: rawAction.height, channels: 4 } })
    .resize(44, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.nearest })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Helper for 4 directions:
  // d=0: Down (Row 0), d=1: Left (Row 1), d=2: Right (Row 2), d=3: Up (Row 3)
  function getBaseForDir(d, isAction = false) {
    if (d === 0) return { data: isAction ? baseAction.data : baseFront.data, w: isAction ? baseAction.info.width : baseFront.info.width, h: isAction ? baseAction.info.height : baseFront.info.height, flipX: false };
    if (d === 1) return { data: baseRight.data, w: baseRight.info.width, h: baseRight.info.height, flipX: true };
    if (d === 2) return { data: baseRight.data, w: baseRight.info.width, h: baseRight.info.height, flipX: false };
    return { data: baseBack.data, w: baseBack.info.width, h: baseBack.info.height, flipX: false };
  }

  // -------------------------------------------------------------
  // 1. IDLE (Clean Character, Zero Feet Jitter - Anchored at Y=56)
  // -------------------------------------------------------------
  const idleCanvas = new CanvasBuffer(384, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d);
    const fy = d * 64;
    for (let f = 0; f < 6; f++) {
      const fx = f * 64;
      const breathe = 1 + Math.sin((f / 6) * Math.PI * 2) * 0.02;
      const targetH = Math.round(base.h * breathe);
      const posX = fx + Math.round((64 - base.w) / 2);
      // Anchor feet firmly at fy + 56
      const posY = fy + 56 - targetH;

      idleCanvas.blit(base.data, base.w, base.h, posX, posY, {
        scaleY: breathe,
        flipX: base.flipX,
      });
      // PURE CHARACTER ONLY - NO BAKED SWORD GLEAM PARTICLES
    }
  }
  await idleCanvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_idle.png'));

  // -------------------------------------------------------------
  // 2. WALK (Clean Character, 8 distinct frames)
  // -------------------------------------------------------------
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
      const posY = fy + 4 + Math.round(bob);

      walkCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        shearX: (d === 1 ? -legStride : legStride),
      });
    }
  }
  await walkCanvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_walk.png'));

  // -------------------------------------------------------------
  // 3. RUN (Clean Character, No Baked Dust Puffs)
  // -------------------------------------------------------------
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
      // PURE CHARACTER ONLY - NO BAKED DUST PUFFS
    }
  }
  await runCanvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_run.png'));

  // -------------------------------------------------------------
  // 4. ATTACK 1 (Character Only) + SEPARATED VFX SLICE
  // -------------------------------------------------------------
  const atk1Canvas = new CanvasBuffer(320, 256);
  const vfxSlashWind = new CanvasBuffer(320, 256);

  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d, true);
    const fy = d * 64;
    for (let f = 0; f < 5; f++) {
      const fx = f * 64;
      let shiftX = 0, shiftY = 4, shear = 0;

      if (f === 0) { shear = -0.1; shiftX = -2; } // Windup
      else if (f === 1) { shear = 0.12; shiftX = 2; } // Thrust
      else if (f === 2) { shear = 0.22; shiftX = 5; } // Strike (HitFrame 2)
      else if (f === 3) { shear = 0.08; shiftX = 2; } // Follow-through
      else { shear = 0; shiftX = 0; } // Recovery

      const posX = fx + Math.round((64 - base.w) / 2) + shiftX;
      const posY = fy + shiftY;

      // Character body & weapon
      atk1Canvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        shearX: (d === 1 ? -shear : shear),
      });

      // SEPARATED VFX: Wind blade arc on frame 2 & 3
      if (f === 2 || f === 3) {
        const arcCenterX = posX + (d === 1 ? -6 : (d === 2 ? base.w + 6 : base.w / 2));
        const arcCenterY = posY + 22;
        const opacity = f === 2 ? 1.0 : 0.5;
        for (let a = -14; a <= 14; a++) {
          const px = arcCenterX + a;
          const py = arcCenterY - Math.round(Math.cos((a / 14) * 1.5) * 11);
          vfxSlashWind.setPixel(px, py, 130, 240, 255, Math.round(255 * opacity));
          vfxSlashWind.setPixel(px, py + 1, 255, 255, 255, Math.round(210 * opacity));
        }
      }
    }
  }
  await atk1Canvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_attack_1.png'));
  await vfxSlashWind.savePng(path.join(VFX_OUT_DIR, 'vfx_sword_slash_wind.png'));

  // -------------------------------------------------------------
  // 5. ATTACK 2 (Character Only) + SEPARATED GOLDEN THRUST VFX
  // -------------------------------------------------------------
  const atk2Canvas = new CanvasBuffer(320, 256);
  const vfxThrustGolden = new CanvasBuffer(320, 256);

  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d, true);
    const fy = d * 64;
    for (let f = 0; f < 5; f++) {
      const fx = f * 64;
      let shiftX = 0, shiftY = 4, shear = 0;
      if (f === 0) shear = -0.06;
      else if (f === 1) shear = 0.15;
      else if (f === 2) shear = 0.25; // Strike
      else if (f === 3) shear = 0.1;
      else shear = 0;

      const posX = fx + Math.round((64 - base.w) / 2) + shiftX;
      const posY = fy + shiftY;

      // Pure character
      atk2Canvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        shearX: (d === 1 ? -shear : shear),
      });

      // SEPARATED VFX: Golden thrust beam
      if (f === 2 || f === 3) {
        const opacity = f === 2 ? 1.0 : 0.45;
        for (let w = -16; w <= 20; w++) {
          const px = posX + (base.w / 2) + (d === 1 ? -w : w);
          vfxThrustGolden.setPixel(px, posY + 26, 255, 220, 90, Math.round(255 * opacity));
          vfxThrustGolden.setPixel(px, posY + 27, 255, 255, 220, Math.round(220 * opacity));
        }
      }
    }
  }
  await atk2Canvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_attack_2.png'));
  await vfxThrustGolden.savePng(path.join(VFX_OUT_DIR, 'vfx_sword_thrust_golden.png'));

  // -------------------------------------------------------------
  // 6. ATTACK 3 (Character Only) + SEPARATED SHOCKWAVE VFX
  // -------------------------------------------------------------
  const atk3Canvas = new CanvasBuffer(384, 256);
  const vfxShockwave = new CanvasBuffer(384, 256);

  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d, true);
    const fy = d * 64;
    for (let f = 0; f < 6; f++) {
      const fx = f * 64;
      let shiftY = 0;
      if (f === 1) shiftY = -2; // Leap
      else if (f === 2) shiftY = -3; // Apex (safe top margin >= 3px)
      else if (f === 3) shiftY = 2; // Impact (safe bottom margin >= 4px)
      else if (f === 4) shiftY = 1;
      else shiftY = 0;

      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + 4 + shiftY;

      // Pure character
      atk3Canvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        shearX: f === 3 ? 0.08 : 0,
      });

      // SEPARATED VFX: Ground shockwave burst
      if (f >= 3 && f <= 5) {
        const spread = (f - 2) * 8;
        const alpha = 1.0 - (f - 3) * 0.4;
        for (let r = -spread; r <= spread; r++) {
          const falloff = 1 - Math.abs(r) / (spread + 1);
          const px = posX + (base.w / 2) + r;
          const py = fy + 56;
          vfxShockwave.setPixel(px, py, 120, 240, 255, Math.round(255 * alpha * falloff));
          vfxShockwave.setPixel(px, py - 1, 255, 255, 255, Math.round(200 * alpha * falloff));
        }
      }
    }
  }
  await atk3Canvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_attack_3.png'));
  await vfxShockwave.savePng(path.join(VFX_OUT_DIR, 'vfx_ground_slam_shockwave.png'));

  // -------------------------------------------------------------
  // 7. DODGE (Character Only, No Baked Ghosting Shadow) + SEPARATED PHANTOM VFX
  // -------------------------------------------------------------
  const dodgeCanvas = new CanvasBuffer(256, 256);
  const vfxPhantom = new CanvasBuffer(256, 256);

  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d);
    const fy = d * 64;
    for (let f = 0; f < 4; f++) {
      const fx = f * 64;
      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + 4;

      // Pure Character: Crisp clean body in dashing stance
      dodgeCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        alpha: 1.0,
        shearX: 0.18,
      });

      // SEPARATED VFX: Phantom cyan ghost trail behind
      const shadowOffset = (d === 1 ? 8 : (d === 2 ? -8 : 0));
      vfxPhantom.blit(base.data, base.w, base.h, posX + shadowOffset, posY, {
        flipX: base.flipX,
        alpha: 0.45,
        tintR: 0.4,
        tintG: 0.9,
        tintB: 1.0,
        shearX: 0.22,
      });
    }
  }
  await dodgeCanvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_dodge.png'));
  await vfxPhantom.savePng(path.join(VFX_OUT_DIR, 'vfx_dodge_phantom_trail.png'));

  // -------------------------------------------------------------
  // 8. SKILL (Character Only) + SEPARATED CELESTIAL SWORD AURA VFX
  // -------------------------------------------------------------
  const skillCanvas = new CanvasBuffer(512, 256);
  const vfxAura = new CanvasBuffer(512, 256);

  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d, true);
    const fy = d * 64;
    for (let f = 0; f < 8; f++) {
      const fx = f * 64;
      const floatCycle = Math.sin((f / 8) * Math.PI * 2) * 2;
      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + 4 - Math.round(floatCycle);

      // Pure character cast pose
      skillCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
      });

      // SEPARATED VFX: Celestial sword energy aura
      if (f >= 1 && f <= 6) {
        const radius = 12 + f * 3;
        for (let a = 0; a < 36; a++) {
          const ang = (a / 36) * Math.PI * 2;
          const px = posX + (base.w / 2) + Math.cos(ang) * radius;
          const py = posY + 26 + Math.sin(ang) * (radius * 0.6);
          vfxAura.setPixel(px, py, 120, 240, 255, 220);
          vfxAura.setPixel(px, py - 1, 255, 255, 255, 180);
        }
      }
    }
  }
  await skillCanvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_skill.png'));
  await vfxAura.savePng(path.join(VFX_OUT_DIR, 'vfx_celestial_sword_aura.png'));

  // -------------------------------------------------------------
  // 9. HIT (Character Only, Natural Colors, No Hard Baked Red Glare)
  // -------------------------------------------------------------
  const hitCanvas = new CanvasBuffer(192, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d);
    const fy = d * 64;
    for (let f = 0; f < 3; f++) {
      const fx = f * 64;
      const recoilX = (d === 1 ? f * 2 : (d === 2 ? -f * 2 : 0));
      const posX = fx + Math.round((64 - base.w) / 2) + recoilX;
      const posY = fy + 4; // Firmly within [4, 56] px, zero border touch

      // Pure character natural colors with recoil lean
      hitCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        shearX: (d === 1 ? 0.10 : -0.10),
      });
    }
  }
  await hitCanvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_hit.png'));

  // -------------------------------------------------------------
  // 10. DEATH (Clean Collapse Sequence)
  // -------------------------------------------------------------
  const deathCanvas = new CanvasBuffer(512, 256);
  for (let d = 0; d < 4; d++) {
    const base = getBaseForDir(d);
    const fy = d * 64;
    for (let f = 0; f < 8; f++) {
      const fx = f * 64;
      const collapseH = Math.max(0.28, 1 - f * 0.11);
      const dropY = Math.min(22, f * 3.2);
      const fadeAlpha = Math.max(0.4, 1 - f * 0.08);
      const posX = fx + Math.round((64 - base.w) / 2);
      const posY = fy + 4 + dropY;

      deathCanvas.blit(base.data, base.w, base.h, posX, posY, {
        flipX: base.flipX,
        scaleY: collapseH,
        alpha: fadeAlpha,
      });
    }
  }
  await deathCanvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_death.png'));

  // -------------------------------------------------------------
  // 11. REGENERATE MASTER CONTACT SHEET: lam_mac_preview.png (1024 x 1400)
  // -------------------------------------------------------------
  console.log('Generating standardized lam_mac_preview.png (1024x1400)...');
  const previewCanvas = new CanvasBuffer(1024, 1400);

  // Background slate styling
  for (let y = 0; y < 1400; y++) {
    for (let x = 0; x < 1024; x++) {
      previewCanvas.setPixel(x, y, 20, 24, 28, 255);
    }
  }

  // Header banner box
  for (let y = 10; y < 65; y++) {
    for (let x = 20; x < 1004; x++) {
      previewCanvas.setPixel(x, y, 32, 40, 48, 255);
    }
  }

  const animSections = [
    { name: '1. IDLE (6 Frames, 6 FPS)', sheet: idleCanvas, w: 384, h: 256 },
    { name: '2. WALK (8 Frames, 10 FPS)', sheet: walkCanvas, w: 512, h: 256 },
    { name: '3. RUN (8 Frames, 12 FPS)', sheet: runCanvas, w: 512, h: 256 },
    { name: '4. ATTACK 1 (5 Frames, 12 FPS)', sheet: atk1Canvas, w: 320, h: 256 },
    { name: '5. ATTACK 2 (5 Frames, 12 FPS)', sheet: atk2Canvas, w: 320, h: 256 },
    { name: '6. ATTACK 3 (6 Frames, 12 FPS)', sheet: atk3Canvas, w: 384, h: 256 },
    { name: '7. DODGE (4 Frames, 14 FPS)', sheet: dodgeCanvas, w: 256, h: 256 },
    { name: '8. SKILL (8 Frames, 10 FPS)', sheet: skillCanvas, w: 512, h: 256 },
    { name: '9. HIT (3 Frames, 8 FPS)', sheet: hitCanvas, w: 192, h: 256 },
    { name: '10. DEATH (8 Frames, 8 FPS)', sheet: deathCanvas, w: 512, h: 256 },
  ];

  for (let idx = 0; idx < animSections.length; idx++) {
    const sec = animSections[idx];
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const startX = 30 + col * 490;
    const startY = 80 + row * 260;

    // Panel box
    for (let py = 0; py < 250; py++) {
      for (let px = 0; px < 470; px++) {
        previewCanvas.setPixel(startX + px, startY + py, 14, 18, 22, 255);
      }
    }

    const scaleFactor = Math.min(460 / sec.w, 220 / sec.h, 1.0);
    previewCanvas.blit(sec.sheet.data, sec.w, sec.h, startX + 5, startY + 20, {
      scaleX: scaleFactor,
      scaleY: scaleFactor,
    });
  }

  await previewCanvas.savePng(path.join(CHAR_OUT_DIR, 'lam_mac_preview.png'));

  // -------------------------------------------------------------
  // 12. GENERATE ANIMATION METADATA JSON
  // -------------------------------------------------------------
  console.log('Generating lam_mac_metadata.json...');
  const metadata = {
    character: 'Lâm Mặc',
    genre: 'Chinese Xianxia Action RPG',
    perspective: 'Top-down 3/4 Oblique',
    standardFrameWidth: 64,
    standardFrameHeight: 64,
    normalizedPivot: { x: 0.5, y: 0.875 },
    pixelPivot: { x: 32, y: 56 },
    directionOrder: ['down', 'left', 'right', 'up'],
    directionRows: {
      down: 0,
      left: 1,
      right: 2,
      up: 3,
    },
    animations: {
      idle: {
        name: 'Idle (Đứng Tĩnh Tọa)',
        sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_idle.png',
        imageWidth: 384,
        imageHeight: 256,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 6,
        fps: 6,
        loop: true,
        pivotX: 0.5,
        pivotY: 0.875,
        directions: ['down', 'left', 'right', 'up'],
        separatedVfx: null,
      },
      walk: {
        name: 'Walk (Đi Bộ Cẩn Trọng)',
        sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_walk.png',
        imageWidth: 512,
        imageHeight: 256,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 8,
        fps: 10,
        loop: true,
        pivotX: 0.5,
        pivotY: 0.875,
        directions: ['down', 'left', 'right', 'up'],
        separatedVfx: null,
      },
      run: {
        name: 'Run (Chạy Nhanh Ngự Phong)',
        sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_run.png',
        imageWidth: 512,
        imageHeight: 256,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 8,
        fps: 12,
        loop: true,
        pivotX: 0.5,
        pivotY: 0.875,
        directions: ['down', 'left', 'right', 'up'],
        separatedVfx: null,
      },
      attack_1: {
        name: 'Attack 1 (Trảm Kiếm)',
        sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_attack_1.png',
        imageWidth: 320,
        imageHeight: 256,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 5,
        fps: 12,
        loop: false,
        hitFrame: 2,
        pivotX: 0.5,
        pivotY: 0.875,
        directions: ['down', 'left', 'right', 'up'],
        separatedVfx: {
          sourcePng: '/assets/pixel-art/vfx/vfx_sword_slash_wind.png',
          frameWidth: 64,
          frameHeight: 64,
          frameCount: 5,
          activeFrames: [2, 3],
        },
      },
      attack_2: {
        name: 'Attack 2 (Thứ Kiếm)',
        sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_attack_2.png',
        imageWidth: 320,
        imageHeight: 256,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 5,
        fps: 12,
        loop: false,
        hitFrame: 2,
        pivotX: 0.5,
        pivotY: 0.875,
        directions: ['down', 'left', 'right', 'up'],
        separatedVfx: {
          sourcePng: '/assets/pixel-art/vfx/vfx_sword_thrust_golden.png',
          frameWidth: 64,
          frameHeight: 64,
          frameCount: 5,
          activeFrames: [2, 3],
        },
      },
      attack_3: {
        name: 'Attack 3 (Bổ Kiếm Oanh Địa)',
        sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_attack_3.png',
        imageWidth: 384,
        imageHeight: 256,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 6,
        fps: 12,
        loop: false,
        hitFrame: 3,
        pivotX: 0.5,
        pivotY: 0.875,
        directions: ['down', 'left', 'right', 'up'],
        separatedVfx: {
          sourcePng: '/assets/pixel-art/vfx/vfx_ground_slam_shockwave.png',
          frameWidth: 64,
          frameHeight: 64,
          frameCount: 6,
          activeFrames: [3, 4, 5],
        },
      },
      dodge: {
        name: 'Dodge (Phi Thân Thiểm Tị)',
        sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_dodge.png',
        imageWidth: 256,
        imageHeight: 256,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 4,
        fps: 14,
        loop: false,
        invulnerableFrames: [1, 2],
        pivotX: 0.5,
        pivotY: 0.875,
        directions: ['down', 'left', 'right', 'up'],
        separatedVfx: {
          sourcePng: '/assets/pixel-art/vfx/vfx_dodge_phantom_trail.png',
          frameWidth: 64,
          frameHeight: 64,
          frameCount: 4,
          activeFrames: [0, 1, 2, 3],
        },
      },
      skill: {
        name: 'Skill (Ngự Kiếm Quyết)',
        sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_skill.png',
        imageWidth: 512,
        imageHeight: 256,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 8,
        fps: 10,
        loop: false,
        hitFrame: 4,
        pivotX: 0.5,
        pivotY: 0.875,
        directions: ['down', 'left', 'right', 'up'],
        separatedVfx: {
          sourcePng: '/assets/pixel-art/vfx/vfx_celestial_sword_aura.png',
          frameWidth: 64,
          frameHeight: 64,
          frameCount: 8,
          activeFrames: [1, 2, 3, 4, 5, 6],
        },
      },
      hit: {
        name: 'Hit (Trúng Đòn Phản Chấn)',
        sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_hit.png',
        imageWidth: 192,
        imageHeight: 256,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 3,
        fps: 8,
        loop: false,
        pivotX: 0.5,
        pivotY: 0.875,
        directions: ['down', 'left', 'right', 'up'],
        separatedVfx: null,
      },
      death: {
        name: 'Death (Đạo Tiêu Thân Vong)',
        sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_death.png',
        imageWidth: 512,
        imageHeight: 256,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 8,
        fps: 8,
        loop: false,
        holdLastFrame: true,
        pivotX: 0.5,
        pivotY: 0.875,
        directions: ['down', 'left', 'right', 'up'],
        separatedVfx: null,
      },
    },
  };

  const metadataPath = path.join(CHAR_OUT_DIR, 'lam_mac_metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  console.log(`Saved: ${metadataPath}`);
  console.log('=== NORMALIZATION COMPLETE! ===');
}

runNormalization().catch((err) => {
  console.error('Fatal normalization error:', err);
  process.exit(1);
});
