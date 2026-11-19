/**
 * PHASE 2.1 – MONSTER EVIDENCE ASSETS & WEBM VIDEO GENERATOR
 * Generates:
 *  - 15 individual animation WebM videos (5 animations x 3 monsters) in public/evidence/videos/monsters/
 *  - 3 4-direction matrix WebM videos (1 per monster) in public/evidence/videos/monsters/
 *  - 15 frame-timeline PNGs in public/evidence/frames/monsters/
 *  - phase_2_1_vram_breakdown.json in public/evidence/logs/
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const MONSTERS_DIR = path.resolve(__dirname, '../public/assets/pixel-art/monsters');
const OUT_VIDEOS = path.resolve(__dirname, '../public/evidence/videos/monsters');
const OUT_FRAMES = path.resolve(__dirname, '../public/evidence/frames/monsters');
const OUT_LOGS = path.resolve(__dirname, '../public/evidence/logs');

fs.mkdirSync(OUT_VIDEOS, { recursive: true });
fs.mkdirSync(OUT_FRAMES, { recursive: true });
fs.mkdirSync(OUT_LOGS, { recursive: true });

const MONSTERS = [
  { id: 'da_lang', label: 'Dã Lang (野狼)' },
  { id: 'da_tru', label: 'Dã Trư (野猪)' },
  { id: 'ma_do', label: 'Ma Đồ (魔徒)' },
];

const ANIMS = [
  { key: 'idle', label: 'IDLE', cols: 4, fps: 6, loop: true },
  { key: 'walk', label: 'WALK', cols: 6, fps: 10, loop: true },
  { key: 'attack', label: 'ATTACK', cols: 6, fps: 12, loop: false, hitFrame: 3 },
  { key: 'hit', label: 'HIT', cols: 3, fps: 10, loop: false },
  { key: 'death', label: 'DEATH', cols: 6, fps: 10, loop: false, holdLastFrame: true },
];

const DIR_NAMES = ['NAM (DOWN)', 'TÂY (LEFT)', 'ĐÔNG (RIGHT)', 'BẮC (UP)'];

async function generateMonsterVramReport() {
  const report = {
    phase: '2.1',
    formula: 'RGBA 32-bit uncompressed texture: Width * Height * 4 bytes',
    monsters: {},
    totals: { files: 0, frames: 0, pixels: 0, diskBytes: 0, vramBytes: 0, vramMb: '0.000' },
  };

  for (const m of MONSTERS) {
    const sheets = [];
    let mPixels = 0;
    let mDisk = 0;
    let mFrames = 0;
    for (const a of ANIMS) {
      const p = path.join(MONSTERS_DIR, m.id, `${a.key}.png`);
      const meta = await sharp(p).metadata();
      const stat = fs.statSync(p);
      const px = meta.width * meta.height;
      const vram = px * 4;
      sheets.push({
        animation: a.key,
        dimensions: `${meta.width}x${meta.height}`,
        frames: a.cols * 4,
        diskBytes: stat.size,
        vramBytes: vram,
      });
      mPixels += px;
      mDisk += stat.size;
      mFrames += a.cols * 4;
    }
    report.monsters[m.id] = {
      name: m.label,
      sheets,
      totalFrames: mFrames,
      totalPixels: mPixels,
      diskKb: (mDisk / 1024).toFixed(2),
      vramMb: ((mPixels * 4) / (1024 * 1024)).toFixed(3),
    };
    report.totals.files += ANIMS.length;
    report.totals.frames += mFrames;
    report.totals.pixels += mPixels;
    report.totals.diskBytes += mDisk;
    report.totals.vramBytes += mPixels * 4;
  }

  report.totals.diskKb = (report.totals.diskBytes / 1024).toFixed(2);
  report.totals.vramMb = (report.totals.vramBytes / (1024 * 1024)).toFixed(3);
  fs.writeFileSync(path.join(OUT_LOGS, 'phase_2_1_vram_breakdown.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Phase 2.1 VRAM report: ${report.totals.files} PNGs, ${report.totals.frames} frames, ${report.totals.diskKb} KB disk, ${report.totals.vramMb} MB decoded RGBA`);
}

async function generateTimelines() {
  const SCALE = 2;
  const FSIZE = 64 * SCALE;
  const PAD = 14;
  const HEAD = 72;
  const FOOT = 36;

  for (const m of MONSTERS) {
    for (const a of ANIMS) {
      const sheetPath = path.join(MONSTERS_DIR, m.id, `${a.key}.png`);
      const w = a.cols * (FSIZE + PAD) + PAD;
      const h = HEAD + FSIZE + FOOT;
      const composite = [];
      const svg = [
        `<text x="${PAD}" y="28" font-family="monospace" font-size="18" font-weight="bold" fill="#38bdf8">${m.label.toUpperCase()} – ${a.label}</text>`,
        `<text x="${PAD}" y="50" font-family="monospace" font-size="12" fill="#94a3b8">${m.id}/${a.key}.png | ${a.cols} frames x 4 rows | ${a.fps} FPS | loop=${a.loop}</text>`,
      ];

      for (let c = 0; c < a.cols; c++) {
        const x = PAD + c * (FSIZE + PAD);
        const y = HEAD;
        const buf = await sharp(sheetPath)
          .extract({ left: c * 64, top: 0, width: 64, height: 64 })
          .resize(FSIZE, FSIZE, { kernel: sharp.kernel.nearest })
          .toBuffer();
        composite.push({ input: buf, left: x, top: y });

        const px = x + 32 * SCALE;
        const py = y + 56 * SCALE;
        const ms = Math.round(c * (1000 / a.fps));
        svg.push(`<rect x="${x}" y="${y}" width="${FSIZE}" height="${FSIZE}" fill="none" stroke="#334155" stroke-width="1.5" />`);
        svg.push(`<circle cx="${px}" cy="${py}" r="4" fill="none" stroke="#eab308" stroke-width="1.5" />`);
        svg.push(`<text x="${x + FSIZE / 2}" y="${y + FSIZE + 16}" font-family="monospace" font-size="11" font-weight="bold" fill="#f8fafc" text-anchor="middle">Frame [${c}]</text>`);
        svg.push(`<text x="${x + FSIZE / 2}" y="${y + FSIZE + 30}" font-family="monospace" font-size="10" fill="#38bdf8" text-anchor="middle">${ms} ms</text>`);
        if (a.hitFrame === c) {
          svg.push(`<rect x="${x + 2}" y="${y + 2}" width="${FSIZE - 4}" height="18" rx="3" fill="#ef4444" /><text x="${x + FSIZE / 2}" y="${y + 14}" font-family="sans-serif" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle">HIT FRAME</text>`);
        }
        if (a.holdLastFrame && c === a.cols - 1) {
          svg.push(`<rect x="${x + 2}" y="${y + 2}" width="${FSIZE - 4}" height="18" rx="3" fill="#eab308" /><text x="${x + FSIZE / 2}" y="${y + 14}" font-family="sans-serif" font-size="9" font-weight="bold" fill="#000" text-anchor="middle">HOLD LAST</text>`);
        }
      }

      composite.push({
        input: Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svg.join('\n')}</svg>`),
        left: 0,
        top: 0,
      });

      await sharp({ create: { width: w, height: h, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } } })
        .composite(composite)
        .png()
        .toFile(path.join(OUT_FRAMES, `timeline_${m.id}_${a.key}.png`));
    }
  }
  console.log('Generated 15 monster frame timeline PNGs.');
}

async function encodeSingleAnimVideo(monster, anim) {
  const tmpDir = '/tmp/p21_anim_single';
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const f of fs.readdirSync(tmpDir)) fs.unlinkSync(path.join(tmpDir, f));

  const W = 480;
  const H = 360;
  const SCALE = 3;
  const FW = 64 * SCALE;
  const sheetPath = path.join(MONSTERS_DIR, monster.id, `${anim.key}.png`);
  const totalPlayFrames = anim.loop ? anim.cols * 3 : anim.cols * 2 + 4;

  for (let i = 0; i < totalPlayFrames; i++) {
    let col;
    if (anim.loop) {
      col = i % anim.cols;
    } else {
      const cycle = Math.floor(i / anim.cols);
      const local = i % anim.cols;
      col = anim.holdLastFrame && i >= anim.cols * 2 ? anim.cols - 1 : local;
    }

    const frameBuf = await sharp(sheetPath)
      .extract({ left: col * 64, top: 0, width: 64, height: 64 })
      .resize(FW, FW, { kernel: sharp.kernel.nearest })
      .toBuffer();

    const cx = Math.round(W / 2 - FW / 2);
    const cy = 96;
    const svg = Buffer.from(`
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <text x="${W / 2}" y="34" font-family="monospace" font-size="18" font-weight="bold" fill="#fbbf24" text-anchor="middle">${monster.label} – ${anim.label}</text>
        <text x="${W / 2}" y="56" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="middle">Frame [${col}/${anim.cols - 1}] | ${anim.fps} FPS | Row 0 (Down)</text>
        <ellipse cx="${W / 2}" cy="${cy + 56 * SCALE}" rx="42" ry="13" fill="rgba(0,0,0,0.45)" />
        <rect x="${cx}" y="${cy}" width="${FW}" height="${FW}" fill="none" stroke="#334155" stroke-width="1.5" />
        <circle cx="${W / 2}" cy="${cy + 56 * SCALE}" r="4" fill="none" stroke="#38bdf8" stroke-width="2" />
        <text x="${W / 2}" y="${H - 22}" font-family="monospace" font-size="11" fill="#64748b" text-anchor="middle">Pivot (32, 56) | Nearest-Neighbor 3x | Phase 2.1</text>
      </svg>
    `);

    await sharp({ create: { width: W, height: H, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } } })
      .composite([
        { input: svg, left: 0, top: 0 },
        { input: frameBuf, left: cx, top: cy },
      ])
      .png()
      .toFile(path.join(tmpDir, `f_${String(i).padStart(4, '0')}.png`));
  }

  const outPath = path.join(OUT_VIDEOS, `${monster.id}_${anim.key}.webm`);
  execSync(`ffmpeg -y -loglevel error -framerate ${anim.fps} -i "${tmpDir}/f_%04d.png" -c:v libvpx -b:v 900k -pix_fmt yuv420p "${outPath}"`);
}

async function encode4DirMatrixVideo(monster) {
  const tmpDir = '/tmp/p21_anim_4dir';
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const f of fs.readdirSync(tmpDir)) fs.unlinkSync(path.join(tmpDir, f));

  const W = 800;
  const H = 440;
  const SCALE = 3;
  const FW = 64 * SCALE;
  const X_CENTERS = [100, 300, 500, 700];

  let gIdx = 0;
  for (const anim of ANIMS) {
    const sheetPath = path.join(MONSTERS_DIR, monster.id, `${anim.key}.png`);
    const repeats = anim.key === 'attack' || anim.key === 'death' ? anim.cols * 2 : anim.cols * 2;
    for (let i = 0; i < repeats; i++) {
      const col = anim.holdLastFrame && i >= anim.cols ? anim.cols - 1 : (i % anim.cols);
      const composite = [];
      const svg = [
        `<text x="400" y="34" font-family="monospace" font-size="20" font-weight="bold" fill="#38bdf8" text-anchor="middle">${monster.label.toUpperCase()} – 4 HƯỚNG: ${anim.label}</text>`,
        `<text x="400" y="58" font-family="monospace" font-size="13" fill="#94a3b8" text-anchor="middle">Sheet: ${monster.id}/${anim.key}.png | Frame [${col}/${anim.cols - 1}] | ${anim.fps} FPS</text>`,
      ];

      for (let r = 0; r < 4; r++) {
        const frameBuf = await sharp(sheetPath)
          .extract({ left: col * 64, top: r * 64, width: 64, height: 64 })
          .resize(FW, FW, { kernel: sharp.kernel.nearest })
          .toBuffer();
        const x = X_CENTERS[r] - FW / 2;
        const y = 120;
        composite.push({ input: frameBuf, left: x, top: y });
        const sy = y + 56 * SCALE;
        svg.push(`<ellipse cx="${X_CENTERS[r]}" cy="${sy}" rx="42" ry="13" fill="rgba(0,0,0,0.45)" />`);
        svg.push(`<rect x="${x + 8}" y="84" width="${FW - 16}" height="24" rx="4" fill="#1e293b" stroke="#475569" />`);
        svg.push(`<text x="${X_CENTERS[r]}" y="100" font-family="sans-serif" font-size="11" font-weight="bold" fill="#fbbf24" text-anchor="middle">${DIR_NAMES[r]}</text>`);
        svg.push(`<circle cx="${X_CENTERS[r]}" cy="${sy}" r="4" fill="none" stroke="#ef4444" stroke-width="2" />`);
      }

      svg.push(`<text x="400" y="${H - 18}" font-family="monospace" font-size="11" fill="#64748b" text-anchor="middle">PHÀM TRẦN TIÊN LỘ – PHASE 2.1 | ROW 0=DOWN, 1=LEFT, 2=RIGHT, 3=UP | PIVOT (32,56)</text>`);
      composite.unshift({
        input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${svg.join('\n')}</svg>`),
        left: 0,
        top: 0,
      });

      await sharp({ create: { width: W, height: H, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } } })
        .composite(composite)
        .png()
        .toFile(path.join(tmpDir, `f_${String(gIdx++).padStart(4, '0')}.png`));
    }
  }

  const outPath = path.join(OUT_VIDEOS, `${monster.id}_4_directions.webm`);
  execSync(`ffmpeg -y -loglevel error -framerate 10 -i "${tmpDir}/f_%04d.png" -c:v libvpx -b:v 1100k -pix_fmt yuv420p "${outPath}"`);
}

async function main() {
  await generateMonsterVramReport();
  await generateTimelines();

  for (const m of MONSTERS) {
    console.log(`Encoding WebM videos for ${m.id}...`);
    for (const a of ANIMS) {
      await encodeSingleAnimVideo(m, a);
    }
    await encode4DirMatrixVideo(m);
  }
  console.log('=== ALL 18 PHASE 2.1 MONSTER WEBM VIDEOS & 15 TIMELINES GENERATED! ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
