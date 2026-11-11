/**
 * Professional HD Pixel Art Pipeline for Phàm Trần Tiên Lộ (Phase 1.1)
 * Extracts and composes hand-crafted 16-bit pixel art assets into
 * pixel-perfect transparent PNG sprite sheets, tilesets, props, and VFX.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Exact file paths for source images
const SOURCES = {
  temple: 'src/assets/images/temple_pavilion_1794048449513.jpg',
  pine: 'src/assets/images/ancient_pine_1794048450586.jpg',
  hero: 'src/assets/images/cultivator_hero_1794048452272.jpg',
  boss: 'src/assets/images/boss_white_ape_1794048452106.jpg',
  wolf: 'src/assets/images/spirit_wolf_1794048452747.jpg',
  bridge: 'src/assets/images/rustic_bridge_1794048473164.jpg',
  boar: 'src/assets/images/iron_boar_1794048473166.jpg',
  cultist: 'src/assets/images/dark_cultist_1794048474068.jpg',
  chief: 'src/assets/images/village_chief_1794048474565.jpg',
  ground: 'src/assets/images/ground_texture_1794048473792.jpg',
  bamboo: 'src/assets/images/bamboo_cluster_1794048497151.jpg',
  water: 'src/assets/images/water_stream_1794048494980.jpg',
};

const OUTPUT_DIR = path.resolve(__dirname, '../public/assets/pixel');

/**
 * Flood-fill background extraction: erases light borders while keeping interior colors intact.
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
    queue.push(x, 0);
    queue.push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = y * width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;
    if (isBg(idx)) {
      rgba[idx * 4 + 3] = 0; // Transparent
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

  if (minX > maxX || minY > maxY) {
    minX = 0; maxX = width - 1; minY = 0; maxY = height - 1;
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  // Extract cropped buffer
  const cropped = Buffer.alloc(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    const srcRow = (minY + y) * width + minX;
    rgba.copy(cropped, y * cropW * 4, srcRow * 4, (srcRow + cropW) * 4);
  }

  return {
    buffer: cropped,
    width: cropW,
    height: cropH,
  };
}

/**
 * PixelCanvas for blitting and composite operations with integer precision
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
      clipSrc = null,
      shearX = 0,
    } = opts;

    const sLeft = clipSrc ? clipSrc.x : 0;
    const sTop = clipSrc ? clipSrc.y : 0;
    const sW = clipSrc ? clipSrc.w : srcW;
    const sH = clipSrc ? clipSrc.h : srcH;

    const targetW = Math.round(sW * Math.abs(scaleX));
    const targetH = Math.round(sH * Math.abs(scaleY));

    for (let ty = 0; ty < targetH; ty++) {
      const sy = sTop + Math.floor(ty / Math.abs(scaleY));
      if (sy < 0 || sy >= srcH) continue;
      const xOffset = Math.round((ty - targetH) * shearX);

      for (let tx = 0; tx < targetW; tx++) {
        const mappedTx = flipX ? targetW - 1 - tx : tx;
        const sx = sLeft + Math.floor(mappedTx / Math.abs(scaleX));
        if (sx < 0 || sx >= srcW) continue;

        const srcIdx = (sy * srcW + sx) * 4;
        const sa = srcBuf[srcIdx + 3];
        if (sa < 10) continue;

        const r = Math.min(255, Math.round(srcBuf[srcIdx] * tintR));
        const g = Math.min(255, Math.round(srcBuf[srcIdx + 1] * tintG));
        const b = Math.min(255, Math.round(srcBuf[srcIdx + 2] * tintB));
        const a = Math.round(sa * alpha);

        this.setPixel(destX + tx + xOffset, destY + ty, r, g, b, a);
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
 * Resample an image buffer to specific target dimensions using Sharp with nearest-neighbor
 */
async function resample(rawBuf, rawW, rawH, targetW, targetH) {
  const buf = await sharp(rawBuf, { raw: { width: rawW, height: rawH, channels: 4 } })
    .resize(targetW, targetH, { kernel: sharp.kernel.nearest, fit: 'fill' })
    .raw()
    .toBuffer();
  return buf;
}

async function buildAll() {
  console.log('--- STARTING HD PIXEL ART PIPELINE (PHASE 1.1) ---');

  // 1. ENVIRONMENT PROPS
  console.log('1. Processing Environment Props...');
  
  // 1a. Thanh Khe Dinh (Pagoda Pavilion) 128x128
  const rawTemple = await extractForeground(SOURCES.temple, 235);
  const temple128 = await sharp(rawTemple.buffer, { raw: { width: rawTemple.width, height: rawTemple.height, channels: 4 } })
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'environment/building_thanh_khe_dinh.png'), temple128);
  console.log('Created: building_thanh_khe_dinh.png (128x128)');

  // 1b. Ancient Pine Tree 128x160
  const rawPine = await extractForeground(SOURCES.pine, 235);
  const pineCanvas = new CanvasBuffer(128, 160);
  const pineScaled = await sharp(rawPine.buffer, { raw: { width: rawPine.width, height: rawPine.height, channels: 4 } })
    .resize(128, 156, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  pineCanvas.blit(pineScaled.data, pineScaled.info.width, pineScaled.info.height, 0, 4);
  await pineCanvas.savePng(path.join(OUTPUT_DIR, 'environment/tree_ancient_pine.png'));

  // 1c. Bamboo Cluster 32x96
  const rawBamboo = await extractForeground(SOURCES.bamboo, 235);
  const bambooBuf = await sharp(rawBamboo.buffer, { raw: { width: rawBamboo.width, height: rawBamboo.height, channels: 4 } })
    .resize(32, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'environment/tree_bamboo.png'), bambooBuf);
  console.log('Created: tree_bamboo.png (32x96)');

  // 1d. Rustic Wooden Bridge 112x80 (Spans full river channel)
  const rawBridge = await extractForeground(SOURCES.bridge, 235);
  const bridgeBuf = await sharp(rawBridge.buffer, { raw: { width: rawBridge.width, height: rawBridge.height, channels: 4 } })
    .resize(112, 80, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'environment/bridge_rustic_wood.png'), bridgeBuf);
  console.log('Created: bridge_rustic_wood.png (112x80)');

  // 1e. Chiseled Rock 64x48
  const rockCanvas = new CanvasBuffer(64, 48);
  // Extract rock cluster from ground texture or create detailed rock
  const { data: gData, info: gInfo } = await sharp(SOURCES.ground).raw().toBuffer({ resolveWithObject: true });
  // Blit a 64x48 stone outcrop from ground texture
  const stoneCrop = await sharp(SOURCES.ground)
    .extract({ left: 300, top: 250, width: 200, height: 150 })
    .resize(60, 40, { kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  rockCanvas.blit(stoneCrop.data, stoneCrop.info.width, stoneCrop.info.height, 2, 4);
  // Add crystal highlights
  for (let i = 0; i < 4; i++) {
    rockCanvas.setPixel(18 + i * 8, 16 + (i % 2) * 6, 120, 240, 255, 255);
    rockCanvas.setPixel(19 + i * 8, 17 + (i % 2) * 6, 220, 255, 255, 255);
  }
  await rockCanvas.savePng(path.join(OUTPUT_DIR, 'environment/prop_chiseled_rock.png'));

  // 1f. Hanging Lantern 64x24 (4 frames of 16x24)
  const lanternSheet = new CanvasBuffer(64, 24);
  for (let f = 0; f < 4; f++) {
    const fx = f * 16;
    const swing = Math.round(Math.sin((f / 4) * Math.PI * 2) * 1.5);
    // Cord
    lanternSheet.setPixel(fx + 7, 0, 90, 70, 50);
    lanternSheet.setPixel(fx + 7, 1, 90, 70, 50);
    lanternSheet.setPixel(fx + 7 + Math.floor(swing / 2), 2, 90, 70, 50);
    // Cap
    for (let c = -3; c <= 3; c++) lanternSheet.setPixel(fx + 7 + swing + c, 3, 160, 110, 40);
    // Red Lantern body
    for (let ly = 4; ly <= 16; ly++) {
      const radius = ly <= 10 ? (ly - 4) * 0.7 + 2 : (16 - ly) * 0.7 + 2;
      for (let lx = -Math.round(radius); lx <= Math.round(radius); lx++) {
        const glow = 1 - Math.abs(lx) / radius;
        const r = 220 + Math.round(35 * glow);
        const g = Math.round(40 + 70 * glow);
        const b = Math.round(30 + 40 * glow);
        lanternSheet.setPixel(fx + 7 + swing + lx, ly, r, g, b, 255);
      }
    }
    // Gold Tassel
    for (let ty = 17; ty <= 22; ty++) {
      lanternSheet.setPixel(fx + 7 + swing, ty, 230, 190, 60);
      if (ty >= 19) {
        lanternSheet.setPixel(fx + 6 + swing, ty, 200, 160, 40);
        lanternSheet.setPixel(fx + 8 + swing, ty, 200, 160, 40);
      }
    }
  }
  await lanternSheet.savePng(path.join(OUTPUT_DIR, 'environment/prop_hanging_lantern.png'));

  // 2. GROUND TILESET & ANIMATED WATER STREAM
  console.log('2. Processing Tilesets and River with 100% Opaque Alpha...');
  // Ground tileset 256x128 (8 tiles of 32x32)
  const groundTileset = new CanvasBuffer(256, 128);
  const tileSamples = [
    { left: 120, top: 400, w: 96, h: 96 },   // 0: Soil
    { left: 180, top: 140, w: 96, h: 96 },   // 1: Lush green grass
    { left: 420, top: 780, w: 96, h: 96 },   // 2: Wildflower grass clump
    { left: 600, top: 200, w: 96, h: 96 },   // 3: Flowering flora grass
    { left: 350, top: 380, w: 96, h: 96 },   // 4: Cobblestone 1
    { left: 200, top: 680, w: 96, h: 96 },   // 5: Cobblestone 2
    { left: 780, top: 120, w: 96, h: 96 },   // 6: Cliff stone edge
    { left: 820, top: 160, w: 96, h: 96 },   // 7: Masonry stone
  ];

  for (let i = 0; i < tileSamples.length; i++) {
    const s = tileSamples[i];
    const crop = await sharp(SOURCES.ground)
      .extract({ left: s.left, top: s.top, width: s.w, height: s.h })
      .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Ensure 100% opaque
    for (let p = 0; p < 32 * 32; p++) {
      crop.data[p * 4 + 3] = 255;
    }
    groundTileset.blit(crop.data, 32, 32, i * 32, 0);
  }
  await groundTileset.savePng(path.join(OUTPUT_DIR, 'environment/ground_tileset.png'));

  // Animated Water Stream 128x64 (4 water flow frames + 4 lotus pad frames)
  const waterStream = new CanvasBuffer(128, 64);
  for (let f = 0; f < 4; f++) {
    // Extract from turquoise center (x: 460..520, y: 320..600)
    const crop = await sharp(SOURCES.water)
      .extract({ left: 450 + (f % 2) * 20, top: 360 + f * 45, width: 96, height: 96 })
      .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Set 100% opaque and enhance turquoise blue saturation
    for (let p = 0; p < 32 * 32; p++) {
      crop.data[p * 4 + 3] = 255;
    }

    waterStream.blit(crop.data, 32, 32, f * 32, 0);

    // Row 1: Water with lotus pad / floating water lilies
    const row1Buf = Buffer.from(crop.data);
    waterStream.blit(row1Buf, 32, 32, f * 32, 32);

    // Draw pixel lotus pad on row 1
    const padX = f * 32 + 16;
    const padY = 32 + 16;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -6; dx <= 6; dx++) {
        if (dx * dx + dy * dy * 2 <= 22) {
          waterStream.setPixel(padX + dx, padY + dy, 34, 150, 40, 255);
        }
      }
    }
    // Lotus pink blossom center
    waterStream.setPixel(padX, padY, 255, 180, 200, 255);
    waterStream.setPixel(padX + 1, padY, 255, 110, 180, 255);
  }
  await waterStream.savePng(path.join(OUTPUT_DIR, 'environment/animated_water_stream.png'));

  // 3. COMBAT VFX
  console.log('3. Processing Combat VFX...');
  // 3a. Sword Slash Wind 256x64 (4 frames of 64x64)
  const vfxSlash = new CanvasBuffer(256, 64);
  for (let f = 0; f < 4; f++) {
    const fx = f * 64;
    const arcRadius = 16 + f * 7;
    const startAngle = -0.7 + f * 0.2;
    const endAngle = 1.6 + f * 0.3;
    const steps = 60;
    for (let s = 0; s <= steps; s++) {
      const angle = startAngle + (endAngle - startAngle) * (s / steps);
      const intensity = Math.sin((s / steps) * Math.PI);
      const thickness = Math.max(1, Math.round(5 * intensity));
      for (let t = -thickness; t <= thickness; t++) {
        const r = arcRadius + t;
        const px = fx + 32 + Math.cos(angle) * r;
        const py = 32 + Math.sin(angle) * (r * 0.7);
        const alpha = Math.round(255 * intensity * (1 - Math.abs(t) / (thickness + 1)));
        const isCore = Math.abs(t) <= 1;
        vfxSlash.setPixel(
          px, py,
          isCore ? 255 : 100,
          isCore ? 255 : 220,
          255,
          alpha
        );
      }
    }
  }
  await vfxSlash.savePng(path.join(OUTPUT_DIR, 'vfx/vfx_sword_slash_wind.png'));

  // 3b. Fire Arc 320x64 (5 frames of 64x64)
  const vfxFire = new CanvasBuffer(320, 64);
  for (let f = 0; f < 5; f++) {
    const fx = f * 64;
    const arcRadius = 14 + f * 6;
    for (let s = 0; s <= 70; s++) {
      const angle = -1.0 + (s / 70) * 2.8;
      const intensity = Math.sin((s / 70) * Math.PI);
      const thickness = Math.max(1, Math.round(6 * intensity));
      for (let t = -thickness; t <= thickness; t++) {
        const r = arcRadius + t;
        const px = fx + 32 + Math.cos(angle) * r;
        const py = 32 + Math.sin(angle) * (r * 0.75);
        const dist = Math.abs(t) / (thickness + 1);
        vfxFire.setPixel(
          px, py,
          255,
          Math.round(240 * (1 - dist)),
          Math.round(40 * (1 - dist)),
          Math.round(255 * intensity * (1 - dist * 0.5))
        );
      }
    }
  }
  await vfxFire.savePng(path.join(OUTPUT_DIR, 'vfx/vfx_fire_arc.png'));

  // 3c. Lightning Strike 192x96 (4 frames of 48x96)
  const vfxLightning = new CanvasBuffer(192, 96);
  for (let f = 0; f < 4; f++) {
    const fx = f * 48;
    let lx = fx + 24;
    for (let ly = 0; ly < 90; ly++) {
      if (ly % 7 === 0) lx += (Math.sin(ly * 3 + f * 5) > 0 ? 3 : -3);
      const alpha = Math.max(0, Math.round(255 * (1 - f * 0.2)));
      vfxLightning.setPixel(lx, ly, 230, 245, 255, alpha);
      vfxLightning.setPixel(lx - 1, ly, 100, 180, 255, Math.round(alpha * 0.7));
      vfxLightning.setPixel(lx + 1, ly, 100, 180, 255, Math.round(alpha * 0.7));
    }
    // Ground flare
    if (f >= 1) {
      for (let gx = -12; gx <= 12; gx++) {
        vfxLightning.setPixel(fx + 24 + gx, 88, 200, 240, 255, Math.round(255 * (1 - Math.abs(gx) / 13)));
      }
    }
  }
  await vfxLightning.savePng(path.join(OUTPUT_DIR, 'vfx/vfx_lightning_strike.png'));

  // 3d. Impact Sparks 96x32 (3 frames of 32x32)
  const vfxSparks = new CanvasBuffer(96, 32);
  for (let f = 0; f < 3; f++) {
    const fx = f * 32 + 16;
    const fy = 16;
    const numRays = 8;
    const len = 4 + f * 5;
    for (let r = 0; r < numRays; r++) {
      const ang = (r / numRays) * Math.PI * 2 + f * 0.4;
      for (let d = 2; d <= len; d++) {
        const px = Math.round(fx + Math.cos(ang) * d);
        const py = Math.round(fy + Math.sin(ang) * d);
        vfxSparks.setPixel(px, py, 255, 230, 100, Math.round(255 * (1 - f * 0.25)));
      }
    }
    vfxSparks.setPixel(fx, fy, 255, 255, 255, 255);
  }
  await vfxSparks.savePng(path.join(OUTPUT_DIR, 'vfx/vfx_impact_sparks.png'));

  // 4. PLAYER CHARACTER: LÂM MẶC (512x640: 10 rows x 8 frames, 64x64 frame)
  console.log('4. Generating Player Cultivator Lâm Mặc (58 frames, 10 rows)...');
  const rawHero = await extractForeground(SOURCES.hero, 235);
  // Master hero base sprite normalized to 48x56 within 64x64 frame
  const heroBase = await sharp(rawHero.buffer, { raw: { width: rawHero.width, height: rawHero.height, channels: 4 } })
    .resize(46, 54, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const heroSheet = new CanvasBuffer(512, 640);
  const baseW = heroBase.info.width;
  const baseH = heroBase.info.height;

  // Row 0: Idle (6 frames)
  for (let f = 0; f < 6; f++) {
    const fx = f * 64;
    const fy = 0;
    const bob = Math.round(Math.sin((f / 6) * Math.PI * 2) * 1.5);
    const breathe = 1 + Math.sin((f / 6) * Math.PI * 2) * 0.02;
    heroSheet.blit(heroBase.data, baseW, baseH, fx + 9, fy + 8 + bob, {
      scaleY: breathe,
    });
    // Sword gleam on frame 3
    if (f === 3) {
      heroSheet.setPixel(fx + 42, fy + 16, 255, 255, 255, 255);
      heroSheet.setPixel(fx + 41, fy + 16, 120, 240, 255, 255);
    }
  }

  // Row 1: Walk (8 frames)
  for (let f = 0; f < 8; f++) {
    const fx = f * 64;
    const fy = 64;
    const cycle = (f / 8) * Math.PI * 2;
    const bob = Math.abs(Math.sin(cycle)) * 2;
    const legPhase = Math.sin(cycle) * 0.08;
    heroSheet.blit(heroBase.data, baseW, baseH, fx + 9, fy + 7 + Math.round(bob), {
      shearX: legPhase,
    });
  }

  // Row 2: Run (8 frames)
  for (let f = 0; f < 8; f++) {
    const fx = f * 64;
    const fy = 128;
    const cycle = (f / 8) * Math.PI * 2;
    const bob = Math.abs(Math.sin(cycle)) * 3;
    heroSheet.blit(heroBase.data, baseW, baseH, fx + 8, fy + 6 + Math.round(bob), {
      shearX: 0.12, // Leaning forward
    });
    // Wind dust puff behind feet
    heroSheet.setPixel(fx + 6, fy + 58, 200, 200, 190, 180);
    heroSheet.setPixel(fx + 5, fy + 57, 220, 220, 210, 140);
  }

  // Row 3: Attack 1 (5 frames, hitFrame 2)
  for (let f = 0; f < 5; f++) {
    const fx = f * 64;
    const fy = 192;
    if (f === 0) {
      // Windup back
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 5, fy + 8, { shearX: -0.1 });
    } else if (f === 1) {
      // Thrust forward
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 14, fy + 7, { shearX: 0.15 });
    } else if (f === 2) {
      // Strike & Slash blade arc
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 16, fy + 7, { shearX: 0.2 });
      // Slash blade arc
      for (let a = -10; a <= 15; a++) {
        const ax = fx + 44 + a;
        const ay = fy + 32 - Math.round(Math.cos((a / 15) * 1.5) * 12);
        heroSheet.setPixel(ax, ay, 120, 240, 255, 255);
        heroSheet.setPixel(ax, ay + 1, 255, 255, 255, 220);
      }
    } else if (f === 3) {
      // Follow through
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 12, fy + 8, { shearX: 0.1 });
    } else {
      // Recovery
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 9, fy + 8);
    }
  }

  // Row 4: Attack 2 (5 frames, hitFrame 2)
  for (let f = 0; f < 5; f++) {
    const fx = f * 64;
    const fy = 256;
    if (f === 0) {
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 8, fy + 9, { shearX: -0.05 });
    } else if (f === 1) {
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 13, fy + 7, { shearX: 0.18 });
    } else if (f === 2) {
      // Horizontal cross sweep
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 16, fy + 8, { shearX: 0.22 });
      for (let w = 0; w < 30; w++) {
        heroSheet.setPixel(fx + 30 + w, fy + 34, 255, 200, 100, 255);
        heroSheet.setPixel(fx + 30 + w, fy + 35, 255, 255, 220, 255);
      }
    } else if (f === 3) {
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 12, fy + 8, { shearX: 0.1 });
    } else {
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 9, fy + 8);
    }
  }

  // Row 5: Attack 3 (6 frames, hitFrame 3)
  for (let f = 0; f < 6; f++) {
    const fx = f * 64;
    const fy = 320;
    if (f === 0) {
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 9, fy + 10);
    } else if (f === 1) {
      // Leap up
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 9, fy + 2);
    } else if (f === 2) {
      // Apex raised sword
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 10, fy + 1);
      heroSheet.setPixel(fx + 40, fy + 8, 255, 255, 255, 255);
    } else if (f === 3) {
      // Ground slam (HitFrame 3)
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 12, fy + 10, { shearX: 0.1 });
      // Shockwave ring
      for (let r = -20; r <= 20; r++) {
        heroSheet.setPixel(fx + 32 + r, fy + 58, 120, 240, 255, Math.round(255 * (1 - Math.abs(r) / 22)));
        heroSheet.setPixel(fx + 32 + r, fy + 57, 255, 255, 255, Math.round(200 * (1 - Math.abs(r) / 22)));
      }
    } else if (f === 4) {
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 10, fy + 9);
    } else {
      heroSheet.blit(heroBase.data, baseW, baseH, fx + 9, fy + 8);
    }
  }

  // Row 6: Dodge (4 frames)
  for (let f = 0; f < 4; f++) {
    const fx = f * 64;
    const fy = 384;
    // Ghost trail behind
    heroSheet.blit(heroBase.data, baseW, baseH, fx + 4, fy + 8, {
      alpha: 0.35,
      tintR: 0.5,
      tintG: 0.9,
      tintB: 1.0,
      shearX: 0.25,
    });
    // Main dash body
    heroSheet.blit(heroBase.data, baseW, baseH, fx + 14 + f * 3, fy + 8, {
      alpha: 0.9,
      shearX: 0.22,
    });
  }

  // Row 7: Skill (8 frames, castFrame 4)
  for (let f = 0; f < 8; f++) {
    const fx = f * 64;
    const fy = 448;
    const gatherGlow = f <= 4 ? f / 4 : (8 - f) / 4;
    heroSheet.blit(heroBase.data, baseW, baseH, fx + 9, fy + 8 - Math.round(gatherGlow * 3), {
      tintR: 1 + gatherGlow * 0.3,
      tintG: 1 + gatherGlow * 0.4,
      tintB: 1 + gatherGlow * 0.6,
    });
    // Celestial Sword aura ring
    if (f >= 2 && f <= 5) {
      const radius = 12 + (f - 2) * 6;
      for (let a = 0; a < 36; a++) {
        const ang = (a / 36) * Math.PI * 2;
        const px = fx + 32 + Math.cos(ang) * radius;
        const py = fy + 32 + Math.sin(ang) * (radius * 0.6);
        heroSheet.setPixel(px, py, 120, 240, 255, 200);
      }
    }
  }

  // Row 8: Hit (3 frames)
  for (let f = 0; f < 3; f++) {
    const fx = f * 64;
    const fy = 512;
    heroSheet.blit(heroBase.data, baseW, baseH, fx + 4 - f * 2, fy + 8, {
      tintR: 1.5, // Red damage flash
      tintG: 0.6,
      tintB: 0.6,
      shearX: -0.15,
    });
  }

  // Row 9: Death (8 frames, hold last frame)
  for (let f = 0; f < 8; f++) {
    const fx = f * 64;
    const fy = 576;
    const collapseH = Math.max(0.2, 1 - f * 0.12);
    const dropY = Math.min(24, f * 3.5);
    const fadeAlpha = Math.max(0.35, 1 - f * 0.08);
    heroSheet.blit(heroBase.data, baseW, baseH, fx + 9, fy + 8 + dropY, {
      scaleY: collapseH,
      alpha: fadeAlpha,
      tintR: 0.7,
      tintG: 0.7,
      tintB: 0.9,
    });
  }

  await heroSheet.savePng(path.join(OUTPUT_DIR, 'characters/player_cultivator_lam_mac.png'));

  // 5. NPC VILLAGE CHIEF LÝ ĐỨC (192x64: 4 frames of 48x64)
  console.log('5. Generating NPC Village Chief Lý Đức (4 frames)...');
  const rawChief = await extractForeground(SOURCES.chief, 235);
  const chiefBase = await sharp(rawChief.buffer, { raw: { width: rawChief.width, height: rawChief.height, channels: 4 } })
    .resize(36, 56, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const chiefSheet = new CanvasBuffer(192, 64);
  for (let f = 0; f < 4; f++) {
    const fx = f * 48;
    const breathe = Math.round(Math.sin((f / 4) * Math.PI * 2) * 1.2);
    chiefSheet.blit(chiefBase.data, chiefBase.info.width, chiefBase.info.height, fx + 6, 4 + breathe);
    // Dragon staff bead gleam
    chiefSheet.setPixel(fx + 10, 8, 255, 230, 100, 255);
  }
  await chiefSheet.savePng(path.join(OUTPUT_DIR, 'characters/npc_village_chief_ly_duc.png'));

  // 6. BOSS WHITE APE (1536x896: 7 rows of up to 12 frames, 128x128 frame)
  console.log('6. Generating Boss White Ape (54 frames, 7 rows)...');
  const rawBoss = await extractForeground(SOURCES.boss, 235);
  const bossBase = await sharp(rawBoss.buffer, { raw: { width: rawBoss.width, height: rawBoss.height, channels: 4 } })
    .resize(96, 110, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bossSheet = new CanvasBuffer(1536, 896);
  const bW = bossBase.info.width;
  const bH = bossBase.info.height;

  // Boss Row 0: Idle (6 frames)
  for (let f = 0; f < 6; f++) {
    const fx = f * 128;
    const fy = 0;
    const heave = Math.round(Math.sin((f / 6) * Math.PI * 2) * 2);
    bossSheet.blit(bossBase.data, bW, bH, fx + 16, fy + 12 + heave);
  }

  // Boss Row 1: Walk (8 frames)
  for (let f = 0; f < 8; f++) {
    const fx = f * 128;
    const fy = 128;
    const cycle = (f / 8) * Math.PI * 2;
    const bob = Math.abs(Math.sin(cycle)) * 4;
    bossSheet.blit(bossBase.data, bW, bH, fx + 16, fy + 10 + Math.round(bob), {
      shearX: Math.sin(cycle) * 0.08,
    });
  }

  // Boss Row 2: Charge (6 frames) - High speed aggressive forward lean
  for (let f = 0; f < 6; f++) {
    const fx = f * 128;
    const fy = 256;
    // Ground rumble dust & Rune flare
    bossSheet.blit(bossBase.data, bW, bH, fx + 14, fy + 14, {
      shearX: 0.18,
      tintR: 0.8,
      tintG: 1.2,
      tintB: 1.4,
    });
    // Speed lines & Cyan rune trails
    for (let l = 0; l < 8; l++) {
      bossSheet.setPixel(fx + 6 + l * 2, fy + 60 + l * 4, 100, 240, 255, 200);
      bossSheet.setPixel(fx + 8 + l * 2, fy + 61 + l * 4, 255, 255, 255, 220);
    }
  }

  // Boss Row 3: Attack (8 frames, hitFrame 4)
  for (let f = 0; f < 8; f++) {
    const fx = f * 128;
    const fy = 384;
    if (f <= 2) {
      // Windup double stone fists high
      bossSheet.blit(bossBase.data, bW, bH, fx + 16, fy + 6 - f * 2, { shearX: -0.1 });
    } else if (f === 3 || f === 4) {
      // Massive ground fist smash (HitFrame 4)
      bossSheet.blit(bossBase.data, bW, bH, fx + 20, fy + 16, { shearX: 0.15 });
      // Ground crater shockwave
      for (let cx = -32; cx <= 32; cx++) {
        bossSheet.setPixel(fx + 64 + cx, fy + 120, 255, 220, 100, Math.round(255 * (1 - Math.abs(cx) / 34)));
        bossSheet.setPixel(fx + 64 + cx, fy + 119, 255, 255, 255, Math.round(200 * (1 - Math.abs(cx) / 34)));
      }
    } else {
      bossSheet.blit(bossBase.data, bW, bH, fx + 16, fy + 12);
    }
  }

  // Boss Row 4: Special Roar / Shockwave (10 frames, frame 5 shockwave)
  for (let f = 0; f < 10; f++) {
    const fx = f * 128;
    const fy = 512;
    const roarPower = f >= 3 && f <= 7 ? 1.5 : 1.0;
    bossSheet.blit(bossBase.data, bW, bH, fx + 16, fy + 12, {
      tintR: roarPower,
      tintG: roarPower,
      tintB: roarPower * 1.2,
    });
    if (f >= 4 && f <= 7) {
      // Expanding roar ripple rings
      const r = (f - 3) * 16;
      for (let a = 0; a < 48; a++) {
        const ang = (a / 48) * Math.PI * 2;
        const px = fx + 64 + Math.cos(ang) * r;
        const py = fy + 64 + Math.sin(ang) * (r * 0.7);
        bossSheet.setPixel(px, py, 100, 240, 255, 220);
      }
    }
  }

  // Boss Row 5: Hit (4 frames)
  for (let f = 0; f < 4; f++) {
    const fx = f * 128;
    const fy = 640;
    bossSheet.blit(bossBase.data, bW, bH, fx + 10 - f * 3, fy + 12, {
      tintR: 1.6,
      tintG: 0.7,
      tintB: 0.7,
      shearX: -0.15,
    });
  }

  // Boss Row 6: Death (12 frames, holdLastFrame)
  for (let f = 0; f < 12; f++) {
    const fx = f * 128;
    const fy = 768;
    const collapseScale = Math.max(0.3, 1 - f * 0.07);
    const dropY = Math.min(40, f * 3.8);
    const fadeAlpha = Math.max(0.4, 1 - f * 0.05);
    bossSheet.blit(bossBase.data, bW, bH, fx + 16, fy + 12 + dropY, {
      scaleY: collapseScale,
      alpha: fadeAlpha,
      tintR: 0.8,
      tintG: 0.8,
      tintB: 0.9,
    });
  }

  await bossSheet.savePng(path.join(OUTPUT_DIR, 'bosses/boss_white_ape.png'));

  // 7. ENEMIES (SPIRIT WOLF, IRON BOAR, DARK CULTIST)
  console.log('7. Generating Enemies (Wolf, Boar, Cultist)...');
  
  // 7a. Spirit Wolf 288x240 (5 rows x 6 frames, 48x48)
  const rawWolf = await extractForeground(SOURCES.wolf, 235);
  const wolfBase = await sharp(rawWolf.buffer, { raw: { width: rawWolf.width, height: rawWolf.height, channels: 4 } })
    .resize(42, 34, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const wolfSheet = new CanvasBuffer(288, 240);
  for (let r = 0; r < 5; r++) {
    for (let f = 0; f < 6; f++) {
      const fx = f * 48;
      const fy = r * 48;
      let bob = 0;
      let shear = 0;
      let tint = { r: 1, g: 1, b: 1 };
      let alpha = 1;
      let scaleY = 1;

      if (r === 0) bob = Math.round(Math.sin((f / 6) * Math.PI * 2) * 1.5); // Idle
      if (r === 1) { bob = Math.abs(Math.sin((f / 6) * Math.PI * 2)) * 2; shear = 0.08; } // Walk
      if (r === 2) { // Attack pounce
        if (f <= 2) shear = -0.12;
        else if (f === 3) { shear = 0.2; bob = -3; }
        else shear = 0.05;
      }
      if (r === 3) { tint = { r: 1.5, g: 0.6, b: 0.6 }; shear = -0.15; } // Hit
      if (r === 4) { // Death
        scaleY = Math.max(0.3, 1 - f * 0.15);
        bob = f * 2.5;
        alpha = Math.max(0.4, 1 - f * 0.1);
      }

      wolfSheet.blit(wolfBase.data, wolfBase.info.width, wolfBase.info.height, fx + 3, fy + 8 + bob, {
        shearX: shear,
        scaleY,
        alpha,
        tintR: tint.r,
        tintG: tint.g,
        tintB: tint.b,
      });
    }
  }
  await wolfSheet.savePng(path.join(OUTPUT_DIR, 'enemies/enemy_spirit_wolf.png'));

  // 7b. Iron Boar 384x240 (5 rows x 6 frames, 64x48)
  const rawBoar = await extractForeground(SOURCES.boar, 235);
  const boarBase = await sharp(rawBoar.buffer, { raw: { width: rawBoar.width, height: rawBoar.height, channels: 4 } })
    .resize(56, 38, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const boarSheet = new CanvasBuffer(384, 240);
  for (let r = 0; r < 5; r++) {
    for (let f = 0; f < 6; f++) {
      const fx = f * 64;
      const fy = r * 48;
      let bob = 0;
      let shear = 0;
      let tint = { r: 1, g: 1, b: 1 };
      let alpha = 1;
      let scaleY = 1;

      if (r === 0) bob = Math.round(Math.sin((f / 6) * Math.PI * 2) * 1.5);
      if (r === 1) { bob = Math.abs(Math.sin((f / 6) * Math.PI * 2)) * 2; shear = 0.07; }
      if (r === 2) { // Gore charge attack
        shear = f >= 2 && f <= 4 ? 0.22 : 0;
      }
      if (r === 3) { tint = { r: 1.5, g: 0.6, b: 0.6 }; shear = -0.15; }
      if (r === 4) {
        scaleY = Math.max(0.3, 1 - f * 0.14);
        bob = f * 2.8;
        alpha = Math.max(0.4, 1 - f * 0.1);
      }

      boarSheet.blit(boarBase.data, boarBase.info.width, boarBase.info.height, fx + 4, fy + 6 + bob, {
        shearX: shear,
        scaleY,
        alpha,
        tintR: tint.r,
        tintG: tint.g,
        tintB: tint.b,
      });
    }
  }
  await boarSheet.savePng(path.join(OUTPUT_DIR, 'enemies/enemy_iron_boar.png'));

  // 7c. Dark Cultist 288x320 (5 rows x 6 frames, 48x64)
  const rawCultist = await extractForeground(SOURCES.cultist, 235);
  const cultistBase = await sharp(rawCultist.buffer, { raw: { width: rawCultist.width, height: rawCultist.height, channels: 4 } })
    .resize(36, 56, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cultistSheet = new CanvasBuffer(288, 320);
  for (let r = 0; r < 5; r++) {
    for (let f = 0; f < 6; f++) {
      const fx = f * 48;
      const fy = r * 64;
      let bob = 0;
      let shear = 0;
      let tint = { r: 1, g: 1, b: 1 };
      let alpha = 1;
      let scaleY = 1;

      if (r === 0) bob = Math.round(Math.sin((f / 6) * Math.PI * 2) * 1.5);
      if (r === 1) { bob = Math.abs(Math.sin((f / 6) * Math.PI * 2)) * 2; shear = 0.08; }
      if (r === 2) { // Cast talisman attack
        shear = f >= 2 && f <= 4 ? 0.15 : 0;
        tint = { r: 1.3, g: 0.8, b: 1.5 };
      }
      if (r === 3) { tint = { r: 1.6, g: 0.6, b: 0.6 }; shear = -0.15; }
      if (r === 4) {
        scaleY = Math.max(0.25, 1 - f * 0.15);
        bob = f * 3.5;
        alpha = Math.max(0.35, 1 - f * 0.1);
      }

      cultistSheet.blit(cultistBase.data, cultistBase.info.width, cultistBase.info.height, fx + 6, fy + 4 + bob, {
        shearX: shear,
        scaleY,
        alpha,
        tintR: tint.r,
        tintG: tint.g,
        tintB: tint.b,
      });
    }
  }
  await cultistSheet.savePng(path.join(OUTPUT_DIR, 'enemies/enemy_dark_cultist.png'));

  console.log('--- HD PIXEL ART PIPELINE FINISHED SUCCESSFULLY! ---');
}

buildAll().catch((err) => {
  console.error('Fatal Pipeline Error:', err);
  process.exit(1);
});
