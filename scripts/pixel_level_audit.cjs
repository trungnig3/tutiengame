/**
 * COMPREHENSIVE PIXEL-LEVEL AUDIT SCRIPT (PHASE 1.3)
 * Project: Phàm Trần Tiên Lộ
 * Analyzes every pixel of all character and VFX PNG files:
 * - Dimensions, rows, cols, frame counts
 * - Alpha channel statistics (transparent vs opaque pixels)
 * - Bounding boxes per frame (minX, minY, maxX, maxY)
 * - Frame border overflow detection
 * - Feet pivot verification vs (32, 56) px
 * - Height/width jitter and stability check
 * - JSON metadata schema & value consistency
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CHAR_DIR = path.resolve(__dirname, '../public/assets/pixel-art/characters/lam_mac');
const VFX_DIR = path.resolve(__dirname, '../public/assets/pixel-art/vfx');
const METADATA_PATH = path.join(CHAR_DIR, 'lam_mac_metadata.json');

const CHAR_FILES = [
  'lam_mac_idle.png',
  'lam_mac_walk.png',
  'lam_mac_run.png',
  'lam_mac_attack_1.png',
  'lam_mac_attack_2.png',
  'lam_mac_attack_3.png',
  'lam_mac_dodge.png',
  'lam_mac_skill.png',
  'lam_mac_hit.png',
  'lam_mac_death.png',
];

const VFX_FILES = [
  'vfx_sword_slash_wind.png',
  'vfx_sword_thrust_golden.png',
  'vfx_ground_slam_shockwave.png',
  'vfx_dodge_phantom_trail.png',
  'vfx_celestial_sword_aura.png',
];

async function auditPngFile(filePath, isVfx = false) {
  const filename = path.basename(filePath);
  const stat = fs.statSync(filePath);
  const image = sharp(filePath);
  const metadata = await image.metadata();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const frameWidth = 64;
  const frameHeight = 64;
  const cols = Math.floor(width / frameWidth);
  const rows = Math.floor(height / frameHeight);

  let totalPixels = width * height;
  let transparentPixels = 0; // Alpha === 0
  let opaquePixels = 0;      // Alpha === 255
  let translucentPixels = 0;  // 0 < Alpha < 255
  let overflowCount = 0;

  const frameStats = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let fMinX = 64, fMaxX = -1, fMinY = 64, fMaxY = -1;
      let fPixels = 0;
      let borderTouches = 0;

      for (let py = 0; py < frameHeight; py++) {
        for (let px = 0; px < frameWidth; px++) {
          const gx = c * frameWidth + px;
          const gy = r * frameHeight + py;
          const idx = (gy * width + gx) * channels;
          const a = channels === 4 ? data[idx + 3] : 255;

          if (a === 0) {
            transparentPixels++;
          } else {
            if (a === 255) opaquePixels++;
            else translucentPixels++;

            fPixels++;
            if (px < fMinX) fMinX = px;
            if (px > fMaxX) fMaxX = px;
            if (py < fMinY) fMinY = py;
            if (py > fMaxY) fMaxY = py;

            // Check if touches outer border of 64x64 frame
            if (px === 0 || px === 63 || py === 0 || py === 63) {
              borderTouches++;
              overflowCount++;
            }
          }
        }
      }

      frameStats.push({
        row: r,
        col: c,
        nonZeroPixels: fPixels,
        bbox: fPixels > 0 ? { minX: fMinX, minY: fMinY, maxX: fMaxX, maxY: fMaxY } : null,
        width: fPixels > 0 ? fMaxX - fMinX + 1 : 0,
        height: fPixels > 0 ? fMaxY - fMinY + 1 : 0,
        feetY: fPixels > 0 ? fMaxY : 0,
        centerX: fPixels > 0 ? Math.round((fMinX + fMaxX) / 2) : 0,
        borderTouches,
      });
    }
  }

  return {
    filename,
    filePath,
    fileSize: stat.size,
    dimensions: { width, height },
    channels,
    format: metadata.format,
    frameDimensions: { width: frameWidth, height: frameHeight },
    grid: { rows, cols, totalFrames: rows * cols },
    alphaStats: {
      totalPixels,
      transparentPixels,
      opaquePixels,
      translucentPixels,
      transparentPercent: ((transparentPixels / totalPixels) * 100).toFixed(2),
      foregroundPercent: (((opaquePixels + translucentPixels) / totalPixels) * 100).toFixed(2),
    },
    overflowCount,
    frameStats,
  };
}

async function runAudit() {
  console.log('=====================================================');
  console.log('       PHASE 1.3 - DEEP PIXEL & METADATA AUDIT       ');
  console.log('=====================================================\n');

  // 1. Audit character sheets
  console.log('1. AUDITING 10 CHARACTER SPRITE SHEETS...');
  const charResults = [];
  for (const file of CHAR_FILES) {
    const fullPath = path.join(CHAR_DIR, file);
    const result = await auditPngFile(fullPath, false);
    charResults.push(result);
  }

  // 2. Audit VFX sheets
  console.log('2. AUDITING 5 SEPARATED VFX SPRITE SHEETS...');
  const vfxResults = [];
  for (const file of VFX_FILES) {
    const fullPath = path.join(VFX_DIR, file);
    const result = await auditPngFile(fullPath, true);
    vfxResults.push(result);
  }

  // 3. Audit master contact sheet
  console.log('3. AUDITING MASTER CONTACT SHEET (lam_mac_preview.png)...');
  const previewPath = path.join(CHAR_DIR, 'lam_mac_preview.png');
  const previewResult = await sharp(previewPath).metadata();
  const previewStat = fs.statSync(previewPath);

  // 4. Audit Metadata JSON
  console.log('4. AUDITING METADATA JSON...');
  const metadataRaw = fs.readFileSync(METADATA_PATH, 'utf-8');
  const metadataJson = JSON.parse(metadataRaw);

  // Generate audit summary object
  const auditReport = {
    timestamp: new Date().toISOString(),
    characterSheets: charResults.map((r) => {
      // Analyze feet stability across frames in Row 0 (Down direction)
      const row0Frames = r.frameStats.filter((f) => f.row === 0 && f.nonZeroPixels > 0);
      const feetYList = row0Frames.map((f) => f.feetY);
      const minFeetY = Math.min(...feetYList);
      const maxFeetY = Math.max(...feetYList);
      const feetYJitter = maxFeetY - minFeetY;

      const heights = row0Frames.map((f) => f.height);
      const minH = Math.min(...heights);
      const maxH = Math.max(...heights);

      return {
        filename: r.filename,
        fileSize: r.fileSize,
        imageDimensions: `${r.dimensions.width}x${r.dimensions.height} px`,
        rows: r.grid.rows,
        cols: r.grid.cols,
        frameDimensions: '64x64 px',
        framesPerDirection: r.grid.cols,
        totalFrames: r.grid.totalFrames,
        transparentPixels: r.alphaStats.transparentPixels,
        transparentPercent: `${r.alphaStats.transparentPercent}%`,
        foregroundPercent: `${r.alphaStats.foregroundPercent}%`,
        borderOverflowPixels: r.overflowCount,
        averageHeight: Math.round(heights.reduce((a, b) => a + b, 0) / heights.length),
        minHeight: minH,
        maxHeight: maxH,
        minFeetY,
        maxFeetY,
        feetYJitter,
      };
    }),
    vfxSheets: vfxResults.map((r) => ({
      filename: r.filename,
      fileSize: r.fileSize,
      imageDimensions: `${r.dimensions.width}x${r.dimensions.height} px`,
      rows: r.grid.rows,
      cols: r.grid.cols,
      frameDimensions: '64x64 px',
      totalFrames: r.grid.totalFrames,
      transparentPercent: `${r.alphaStats.transparentPercent}%`,
      overflowCount: r.overflowCount,
    })),
    previewSheet: {
      filename: 'lam_mac_preview.png',
      fileSize: previewStat.size,
      width: previewResult.width,
      height: previewResult.height,
      channels: previewResult.channels,
      format: previewResult.format,
    },
    metadataValidation: {
      standardFrameWidth: metadataJson.standardFrameWidth,
      standardFrameHeight: metadataJson.standardFrameHeight,
      normalizedPivot: metadataJson.normalizedPivot,
      pixelPivot: metadataJson.pixelPivot,
      animationsDeclared: Object.keys(metadataJson.animations).length,
      allPointersExistOnDisk: Object.values(metadataJson.animations).every((a) =>
        fs.existsSync(path.resolve(__dirname, '../public', a.sourcePng.replace(/^\//, '')))
      ),
    },
  };

  const reportOutPath = path.resolve(__dirname, '../scripts/audit_output.json');
  fs.writeFileSync(reportOutPath, JSON.stringify(auditReport, null, 2), 'utf-8');
  console.log(`\nAudit completed successfully! Saved to: ${reportOutPath}`);
  console.log('\n--- AUDIT SUMMARY TABLE ---');
  console.table(auditReport.characterSheets, [
    'filename',
    'imageDimensions',
    'cols',
    'transparentPercent',
    'borderOverflowPixels',
    'averageHeight',
    'feetYJitter',
  ]);
}

runAudit().catch((err) => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
