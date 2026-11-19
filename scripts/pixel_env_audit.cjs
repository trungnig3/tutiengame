const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ENV_DIR = path.resolve(process.cwd(), 'public/assets/pixel-art/environment');
const OUT_JSON = path.resolve(process.cwd(), 'public/evidence/logs/phase_2_3_env_audit.json');

const EXPECTED_SHEETS = [
  { rel: 'tilesets/ground_tiles.png', width: 256, height: 256, requireOpaque: true },
  { rel: 'tilesets/transition_tiles.png', width: 512, height: 192, requireOpaque: false },
  { rel: 'tilesets/animated_water_tiles.png', width: 256, height: 128, requireOpaque: true },
  { rel: 'objects/flora_sheet.png', width: 512, height: 320, requireOpaque: false },
  { rel: 'objects/rocks_nature_sheet.png', width: 384, height: 192, requireOpaque: false },
  { rel: 'objects/architecture_props.png', width: 640, height: 352, requireOpaque: false },
  { rel: 'objects/resources_sheet.png', width: 192, height: 64, requireOpaque: false },
  { rel: 'preview_showcase.png', width: 1080, height: 660, requireOpaque: true },
];

async function main() {
  const metadataPath = path.join(ENV_DIR, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Missing metadata.json at ${metadataPath}`);
  }
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  let totalDecodedBytes = 0;
  let totalFileBytes = 0;
  const sheetReports = [];

  for (const spec of EXPECTED_SHEETS) {
    const absPath = path.join(ENV_DIR, spec.rel);
    if (!fs.existsSync(absPath)) {
      throw new Error(`Missing PNG asset: ${spec.rel}`);
    }
    const stat = fs.statSync(absPath);
    const { data, info } = await sharp(absPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    if (info.width !== spec.width || info.height !== spec.height) {
      throw new Error(`${spec.rel} dimensions mismatch: got ${info.width}x${info.height}, expected ${spec.width}x${spec.height}`);
    }

    let opaquePixels = 0;
    let transparentPixels = 0;
    let semiTransparentPixels = 0;
    const totalPixels = info.width * info.height;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a === 255) opaquePixels++;
      else if (a === 0) transparentPixels++;
      else semiTransparentPixels++;
    }

    const decodedRgbaBytes = info.width * info.height * 4;
    if (spec.rel !== 'preview_showcase.png') {
      totalDecodedBytes += decodedRgbaBytes;
      totalFileBytes += stat.size;
    }

    let wrapMaxDelta = null;
    if (spec.rel === 'tilesets/ground_tiles.png') {
      let maxDiff = 0;
      for (let tile = 0; tile < 4; tile++) {
        const ox = tile * 32;
        for (let y = 0; y < 32; y++) {
          const leftIdx = (y * info.width + ox) * 4;
          const rightIdx = (y * info.width + ox + 31) * 4;
          const d =
            Math.abs(data[leftIdx] - data[rightIdx]) +
            Math.abs(data[leftIdx + 1] - data[rightIdx + 1]) +
            Math.abs(data[leftIdx + 2] - data[rightIdx + 2]);
          if (d > maxDiff) maxDiff = d;
        }
      }
      wrapMaxDelta = maxDiff;
    }

    sheetReports.push({
      file: spec.rel,
      width: info.width,
      height: info.height,
      channels: info.channels,
      fileBytes: stat.size,
      decodedRgbaBytes,
      decodedRgbaMB: Number((decodedRgbaBytes / (1024 * 1024)).toFixed(4)),
      opaquePixels,
      transparentPixels,
      semiTransparentPixels,
      transparencyRatio: Number((transparentPixels / totalPixels).toFixed(4)),
      wrapMaxDelta,
      pass:
        info.width === spec.width &&
        info.height === spec.height &&
        (spec.requireOpaque ? opaquePixels > totalPixels * 0.5 : transparentPixels > 0),
    });
  }

  const maxMapCacheBytes = 1800 * 1200 * 4;
  const summary = {
    phase: '2.3',
    generatedAt: new Date().toISOString(),
    metadataVersion: metadata.version || '2.3.0',
    totalRuntimeSheets: sheetReports.filter((s) => s.file !== 'preview_showcase.png').length,
    totalDiskBytes: totalFileBytes,
    totalDiskKB: Number((totalFileBytes / 1024).toFixed(2)),
    totalDecodedSpriteSheetsBytes: totalDecodedBytes,
    totalDecodedSpriteSheetsMB: Number((totalDecodedBytes / (1024 * 1024)).toFixed(3)),
    activeMapStaticOffscreenCacheMaxBytes: maxMapCacheBytes,
    activeMapStaticOffscreenCacheMaxMB: Number((maxMapCacheBytes / (1024 * 1024)).toFixed(3)),
    combinedEnvironmentDecodedAndCacheMB: Number(((totalDecodedBytes + maxMapCacheBytes) / (1024 * 1024)).toFixed(3)),
    hardwareNote: 'Measured mathematically from RGBA8888 buffer dimensions; physical Android GPU FPS is NOT VERIFIED ON PHYSICAL HARDWARE.',
    sheets: sheetReports,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  const failed = sheetReports.filter((s) => !s.pass);
  if (failed.length > 0) {
    throw new Error(`Audit failed for sheets: ${failed.map((f) => f.file).join(', ')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
