/**
 * PHASE 2.2 – BOSS BẠCH MAO VIÊN HẦU EVIDENCE ASSETS & WEBM VIDEO GENERATOR
 * Generates:
 *  - 9 individual animation WebM videos in public/evidence/videos/boss_bach_mao/
 *  - 4-direction matrix WebM video (bach_mao_4_directions.webm)
 *  - Combat + Phase 2 Enrage + 6 VFX showcase WebM (bach_mao_combat_vfx_showcase.webm)
 *  - 9 Boss frame-timeline PNGs + 6 VFX timeline PNGs in public/evidence/frames/boss_bach_mao/
 *  - phase_2_2_vram_breakdown.json in public/evidence/logs/
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const BOSS_DIR = path.resolve(__dirname, '../public/assets/pixel-art/bosses/bach_mao_vien_hau');
const VFX_DIR = path.resolve(__dirname, '../public/assets/pixel-art/vfx/bach_mao_vien_hau');
const OUT_VIDEOS = path.resolve(__dirname, '../public/evidence/videos/boss_bach_mao');
const OUT_FRAMES = path.resolve(__dirname, '../public/evidence/frames/boss_bach_mao');
const OUT_LOGS = path.resolve(__dirname, '../public/evidence/logs');

fs.mkdirSync(OUT_VIDEOS, { recursive: true });
fs.mkdirSync(OUT_FRAMES, { recursive: true });
fs.mkdirSync(OUT_LOGS, { recursive: true });

const ANIMS = [
  { key: 'idle', label: 'IDLE (Thở &amp; Tràng Hạt)', cols: 6, fps: 6, loop: true },
  { key: 'walk', label: 'WALK (Di Chuyển Nặng Nề)', cols: 8, fps: 8, loop: true },
  { key: 'run', label: 'RUN (Truy Đuổi Cuồng Bạo)', cols: 8, fps: 12, loop: true },
  { key: 'attack_1', label: 'ATTACK 1 (Thiết Chưởng)', cols: 7, fps: 12, loop: false, hitFrame: 4, vfx: 'vfx_chuong_kich' },
  { key: 'attack_2', label: 'ATTACK 2 (Cuồng Nộ Liên Kích)', cols: 8, fps: 14, loop: false, hitFrame: 3, vfx: 'vfx_chuong_kich' },
  { key: 'attack_3', label: 'ATTACK 3 (Cuồng Bạo Xung Kích)', cols: 8, fps: 14, loop: false, hitFrame: 4, vfx: 'vfx_dia_chan' },
  { key: 'skill', label: 'SKILL (Bạch Viên Chấn Địa)', cols: 10, fps: 10, loop: false, hitFrame: 6, vfx: 'vfx_bach_vien_chan_dia' },
  { key: 'hit', label: 'HIT / STUN (Bị Thương &amp; Choáng)', cols: 4, fps: 10, loop: false },
  { key: 'death', label: 'DEATH (Gục Ngã &amp; Yêu Đan Vỡ)', cols: 10, fps: 8, loop: false, holdLastFrame: true, vfx: 'vfx_boss_death' },
];

const VFX_LIST = [
  { key: 'vfx_chuong_kich', label: 'Chưởng Kích', fw: 128, fh: 128, frames: 6, fps: 16 },
  { key: 'vfx_dia_chan', label: 'Địa Chấn Nứt Đá', fw: 160, fh: 160, frames: 6, fps: 14 },
  { key: 'vfx_yeu_khi_tu_luc', label: 'Yêu Khí Tụ Lực', fw: 128, fh: 128, frames: 6, fps: 12 },
  { key: 'vfx_bach_vien_chan_dia', label: 'Bạch Viên Chấn Địa', fw: 160, fh: 160, frames: 8, fps: 14 },
  { key: 'vfx_cuong_no', label: 'Cuồng Nộ Phase 2', fw: 128, fh: 128, frames: 6, fps: 10 },
  { key: 'vfx_boss_death', label: 'Yêu Đan Vỡ Tan', fw: 128, fh: 128, frames: 8, fps: 10 },
];

const DIR_NAMES = ['NAM (DOWN)', 'TÂY (LEFT)', 'ĐÔNG (RIGHT)', 'BẮC (UP)'];

async function generateVramReport() {
  const report = {
    phase: '2.2',
    bossId: 'bach_mao_vien_hau',
    formula: 'RGBA 32-bit uncompressed texture: Width * Height * 4 bytes',
    bossSheets: [],
    vfxSheets: [],
    totals: { files: 0, frames: 0, pixels: 0, diskBytes: 0, vramBytes: 0, vramMb: '0.000' },
  };

  for (const a of ANIMS) {
    const p = path.join(BOSS_DIR, `${a.key}.png`);
    const meta = await sharp(p).metadata();
    const stat = fs.statSync(p);
    const px = meta.width * meta.height;
    const vram = px * 4;
    report.bossSheets.push({
      animation: a.key,
      dimensions: `${meta.width}x${meta.height}`,
      frames: a.cols * 4,
      diskBytes: stat.size,
      vramBytes: vram,
    });
    report.totals.files += 1;
    report.totals.frames += a.cols * 4;
    report.totals.pixels += px;
    report.totals.diskBytes += stat.size;
    report.totals.vramBytes += vram;
  }

  for (const v of VFX_LIST) {
    const p = path.join(VFX_DIR, `${v.key}.png`);
    const meta = await sharp(p).metadata();
    const stat = fs.statSync(p);
    const px = meta.width * meta.height;
    const vram = px * 4;
    report.vfxSheets.push({
      vfx: v.key,
      dimensions: `${meta.width}x${meta.height}`,
      frames: v.frames,
      diskBytes: stat.size,
      vramBytes: vram,
    });
    report.totals.files += 1;
    report.totals.frames += v.frames;
    report.totals.pixels += px;
    report.totals.diskBytes += stat.size;
    report.totals.vramBytes += vram;
  }

  report.totals.diskKb = (report.totals.diskBytes / 1024).toFixed(2);
  report.totals.vramMb = (report.totals.vramBytes / (1024 * 1024)).toFixed(3);
  fs.writeFileSync(path.join(OUT_LOGS, 'phase_2_2_vram_breakdown.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Phase 2.2 VRAM report: ${report.totals.files} PNGs, ${report.totals.frames} frames, ${report.totals.diskKb} KB disk, ${report.totals.vramMb} MB decoded RGBA`);
}

async function generateTimelines() {
  const FSIZE = 128;
  const PAD = 12;
  const HEAD = 72;
  const FOOT = 36;

  for (const a of ANIMS) {
    const sheetPath = path.join(BOSS_DIR, `${a.key}.png`);
    const w = a.cols * (FSIZE + PAD) + PAD;
    const h = HEAD + FSIZE + FOOT;
    const composite = [];
    const svg = [
      `<text x="${PAD}" y="28" font-family="monospace" font-size="18" font-weight="bold" fill="#fbbf24">BOSS BẠCH MAO VIÊN HẦU – ${a.label}</text>`,
      `<text x="${PAD}" y="50" font-family="monospace" font-size="12" fill="#94a3b8">${a.key}.png | ${a.cols} frames x 4 rows (128x128) | ${a.fps} FPS | pivot (64, 115)</text>`,
    ];

    for (let c = 0; c < a.cols; c++) {
      const x = PAD + c * (FSIZE + PAD);
      const y = HEAD;
      const buf = await sharp(sheetPath).extract({ left: c * 128, top: 0, width: 128, height: 128 }).toBuffer();
      composite.push({ input: buf, left: x, top: y });

      const px = x + 64;
      const py = y + 115;
      const ms = Math.round(c * (1000 / a.fps));
      svg.push(`<rect x="${x}" y="${y}" width="${FSIZE}" height="${FSIZE}" fill="none" stroke="#334155" stroke-width="1.5" />`);
      svg.push(`<circle cx="${px}" cy="${py}" r="4" fill="none" stroke="#38bdf8" stroke-width="1.5" />`);
      svg.push(`<text x="${x + FSIZE / 2}" y="${y + FSIZE + 16}" font-family="monospace" font-size="11" font-weight="bold" fill="#f8fafc" text-anchor="middle">F[${c}]</text>`);
      svg.push(`<text x="${x + FSIZE / 2}" y="${y + FSIZE + 30}" font-family="monospace" font-size="10" fill="#38bdf8" text-anchor="middle">${ms}ms</text>`);
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
      .toFile(path.join(OUT_FRAMES, `timeline_boss_${a.key}.png`));
  }

  console.log('Generated 9 Boss animation timeline PNGs.');
}

async function encodeSingleAnimVideo(anim) {
  const tmpDir = '/tmp/p22_boss_single';
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const f of fs.readdirSync(tmpDir)) fs.unlinkSync(path.join(tmpDir, f));

  const W = 560;
  const H = 420;
  const SCALE = 2;
  const FW = 128 * SCALE;
  const sheetPath = path.join(BOSS_DIR, `${anim.key}.png`);
  const totalPlayFrames = anim.loop ? anim.cols * 3 : anim.cols * 2 + 4;

  const vfxSpec = anim.vfx ? VFX_LIST.find(v => v.key === anim.vfx) : null;
  const vfxPath = vfxSpec ? path.join(VFX_DIR, `${vfxSpec.key}.png`) : null;

  for (let i = 0; i < totalPlayFrames; i++) {
    const local = i % anim.cols;
    const col = anim.loop ? local : (anim.holdLastFrame && i >= anim.cols * 2 ? anim.cols - 1 : local);

    const frameBuf = await sharp(sheetPath)
      .extract({ left: col * 128, top: 0, width: 128, height: 128 })
      .resize(FW, FW, { kernel: sharp.kernel.nearest })
      .toBuffer();

    const cx = Math.round(W / 2 - FW / 2);
    const cy = 90;
    const footY = cy + Math.round(115 * SCALE);
    const layers = [];

    const svg = Buffer.from(`
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <text x="${W / 2}" y="34" font-family="monospace" font-size="18" font-weight="bold" fill="#fbbf24" text-anchor="middle">BẠCH MAO VIÊN HẦU – ${anim.label}</text>
        <text x="${W / 2}" y="58" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="middle">Frame [${col}/${anim.cols - 1}] | ${anim.fps} FPS | Row 0 (Down) | 128x128 @ 2x</text>
        <ellipse cx="${W / 2}" cy="${footY}" rx="68" ry="20" fill="rgba(0,0,0,0.48)" />
        <rect x="${cx}" y="${cy}" width="${FW}" height="${FW}" fill="none" stroke="#334155" stroke-width="1.5" />
        <circle cx="${W / 2}" cy="${footY}" r="5" fill="none" stroke="#38bdf8" stroke-width="2" />
        <text x="${W / 2}" y="${H - 22}" font-family="monospace" font-size="11" fill="#64748b" text-anchor="middle">Pivot (64, 115) | Nearest-Neighbor 2x | Phase 2.2 Boss</text>
      </svg>
    `);
    layers.push({ input: svg, left: 0, top: 0 });
    layers.push({ input: frameBuf, left: cx, top: cy });

    // Overlay paired VFX when at or after hitFrame
    if (vfxSpec && vfxPath && (!anim.hitFrame || col >= anim.hitFrame)) {
      const vIdx = Math.min(vfxSpec.frames - 1, anim.hitFrame ? col - anim.hitFrame : col);
      const vw = vfxSpec.fw * 2;
      const vh = vfxSpec.fh * 2;
      const vBuf = await sharp(vfxPath)
        .extract({ left: vIdx * vfxSpec.fw, top: 0, width: vfxSpec.fw, height: vfxSpec.fh })
        .resize(vw, vh, { kernel: sharp.kernel.nearest })
        .toBuffer();
      layers.push({
        input: vBuf,
        left: Math.round(W / 2 - vw / 2),
        top: Math.round(footY - vh * 0.55),
      });
    }

    await sharp({ create: { width: W, height: H, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } } })
      .composite(layers)
      .png()
      .toFile(path.join(tmpDir, `f_${String(i).padStart(4, '0')}.png`));
  }

  const outPath = path.join(OUT_VIDEOS, `bach_mao_${anim.key}.webm`);
  execSync(`ffmpeg -y -loglevel error -framerate ${anim.fps} -i "${tmpDir}/f_%04d.png" -c:v libvpx -b:v 1100k -pix_fmt yuv420p "${outPath}"`);
}

async function encode4DirMatrixVideo() {
  const tmpDir = '/tmp/p22_boss_4dir';
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const f of fs.readdirSync(tmpDir)) fs.unlinkSync(path.join(tmpDir, f));

  const W = 880;
  const H = 420;
  const SCALE = 1.5;
  const FW = Math.round(128 * SCALE);
  const X_CENTERS = [110, 330, 550, 770];

  const subset = ANIMS.filter(a => ['idle', 'walk', 'run', 'attack_1', 'skill'].includes(a.key));
  let gIdx = 0;

  for (const anim of subset) {
    const sheetPath = path.join(BOSS_DIR, `${anim.key}.png`);
    const repeats = anim.cols * 2;
    for (let i = 0; i < repeats; i++) {
      const col = i % anim.cols;
      const composite = [];
      const svg = [
        `<text x="${W / 2}" y="34" font-family="monospace" font-size="20" font-weight="bold" fill="#38bdf8" text-anchor="middle">BẠCH MAO VIÊN HẦU – 4 HƯỚNG: ${anim.label}</text>`,
        `<text x="${W / 2}" y="58" font-family="monospace" font-size="13" fill="#94a3b8" text-anchor="middle">Sheet: ${anim.key}.png | Frame [${col}/${anim.cols - 1}] | ${anim.fps} FPS</text>`,
      ];

      for (let r = 0; r < 4; r++) {
        const frameBuf = await sharp(sheetPath)
          .extract({ left: col * 128, top: r * 128, width: 128, height: 128 })
          .resize(FW, FW, { kernel: sharp.kernel.nearest })
          .toBuffer();
        const x = Math.round(X_CENTERS[r] - FW / 2);
        const y = 120;
        const sy = Math.round(y + 115 * SCALE);
        composite.push({ input: frameBuf, left: x, top: y });
        svg.push(`<ellipse cx="${X_CENTERS[r]}" cy="${sy}" rx="52" ry="15" fill="rgba(0,0,0,0.48)" />`);
        svg.push(`<rect x="${x + 12}" y="82" width="${FW - 24}" height="24" rx="4" fill="#1e293b" stroke="#475569" />`);
        svg.push(`<text x="${X_CENTERS[r]}" y="98" font-family="sans-serif" font-size="11" font-weight="bold" fill="#fbbf24" text-anchor="middle">${DIR_NAMES[r]}</text>`);
        svg.push(`<circle cx="${X_CENTERS[r]}" cy="${sy}" r="4" fill="none" stroke="#ef4444" stroke-width="2" />`);
      }

      svg.push(`<text x="${W / 2}" y="${H - 18}" font-family="monospace" font-size="11" fill="#64748b" text-anchor="middle">PHÀM TRẦN TIÊN LỘ – PHASE 2.2 | ROW 0=DOWN, 1=LEFT, 2=RIGHT, 3=UP | PIVOT (64, 115)</text>`);
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

  const outPath = path.join(OUT_VIDEOS, 'bach_mao_4_directions.webm');
  execSync(`ffmpeg -y -loglevel error -framerate 10 -i "${tmpDir}/f_%04d.png" -c:v libvpx -b:v 1300k -pix_fmt yuv420p "${outPath}"`);
}

async function encodeCombatVfxShowcaseVideo() {
  const tmpDir = '/tmp/p22_boss_vfx';
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const f of fs.readdirSync(tmpDir)) fs.unlinkSync(path.join(tmpDir, f));

  const W = 720;
  const H = 440;
  const FW = 256; // 2x of 128
  const auraPath = path.join(VFX_DIR, 'vfx_cuong_no.png');
  const cx = Math.round(W / 2 - FW / 2);
  const cy = 96;
  const footY = cy + 230;

  let gIdx = 0;
  const sequence = [
    { anim: 'skill', vfx: 'vfx_yeu_khi_tu_luc', title: 'PHASE 2 CUỒNG NỘ + YÊU KHÍ TỤ LỰC', enrage: true, cols: 6 },
    { anim: 'skill', vfx: 'vfx_bach_vien_chan_dia', title: 'SKILL: BẠCH VIÊN CHẤN ĐỊA (FULL AOE)', enrage: true, cols: 8 },
    { anim: 'attack_2', vfx: 'vfx_chuong_kich', title: 'ATTACK 2: CUỒNG NỘ LIÊN KÍCH', enrage: true, cols: 6 },
    { anim: 'attack_3', vfx: 'vfx_dia_chan', title: 'ATTACK 3: CUỒNG BẠO XUNG KÍCH', enrage: true, cols: 6 },
    { anim: 'death', vfx: 'vfx_boss_death', title: 'BOSS DEFEATED: YÊU ĐAN VỠ TAN', enrage: false, cols: 8 },
  ];

  for (const step of sequence) {
    const bossSpec = ANIMS.find(a => a.key === step.anim);
    const vfxSpec = VFX_LIST.find(v => v.key === step.vfx);
    const bossPath = path.join(BOSS_DIR, `${step.anim}.png`);
    const vfxPath = path.join(VFX_DIR, `${step.vfx}.png`);

    for (let f = 0; f < step.cols; f++) {
      const bossCol = Math.min(bossSpec.cols - 1, f + (step.anim === 'skill' && step.vfx === 'vfx_bach_vien_chan_dia' ? 4 : 0));
      const vfxCol = Math.min(vfxSpec.frames - 1, f);
      const layers = [];

      const svg = Buffer.from(`
        <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
          <text x="${W / 2}" y="36" font-family="monospace" font-size="20" font-weight="bold" fill="#f87171" text-anchor="middle">${step.title}</text>
          <text x="${W / 2}" y="60" font-family="monospace" font-size="13" fill="#94a3b8" text-anchor="middle">Boss: ${step.anim}.png (F${bossCol}) + VFX: ${step.vfx}.png (F${vfxCol})</text>
          <ellipse cx="${W / 2}" cy="${footY}" rx="74" ry="22" fill="rgba(0,0,0,0.52)" />
          <text x="${W / 2}" y="${H - 20}" font-family="monospace" font-size="11" fill="#64748b" text-anchor="middle">Phàm Trần Tiên Lộ – Boss Combat &amp; Phase 2 VFX Showcase</text>
        </svg>
      `);
      layers.push({ input: svg, left: 0, top: 0 });

      if (step.enrage) {
        const aBuf = await sharp(auraPath)
          .extract({ left: (gIdx % 6) * 128, top: 0, width: 128, height: 128 })
          .resize(256, 256, { kernel: sharp.kernel.nearest })
          .toBuffer();
        layers.push({ input: aBuf, left: Math.round(W / 2 - 128), top: footY - 190 });
      }

      const bBuf = await sharp(bossPath)
        .extract({ left: bossCol * 128, top: 0, width: 128, height: 128 })
        .resize(FW, FW, { kernel: sharp.kernel.nearest })
        .toBuffer();
      layers.push({ input: bBuf, left: cx, top: cy });

      const vw = Math.round(vfxSpec.fw * 1.8);
      const vh = Math.round(vfxSpec.fh * 1.8);
      const vBuf = await sharp(vfxPath)
        .extract({ left: vfxCol * vfxSpec.fw, top: 0, width: vfxSpec.fw, height: vfxSpec.fh })
        .resize(vw, vh, { kernel: sharp.kernel.nearest })
        .toBuffer();
      layers.push({ input: vBuf, left: Math.round(W / 2 - vw / 2), top: Math.round(footY - vh * 0.6) });

      await sharp({ create: { width: W, height: H, channels: 4, background: { r: 12, g: 18, b: 32, alpha: 1 } } })
        .composite(layers)
        .png()
        .toFile(path.join(tmpDir, `f_${String(gIdx++).padStart(4, '0')}.png`));
    }
  }

  const outPath = path.join(OUT_VIDEOS, 'bach_mao_combat_vfx_showcase.webm');
  execSync(`ffmpeg -y -loglevel error -framerate 10 -i "${tmpDir}/f_%04d.png" -c:v libvpx -b:v 1400k -pix_fmt yuv420p "${outPath}"`);
}

async function main() {
  console.log('=== GENERATING PHASE 2.2 BOSS BẠCH MAO VIÊN HẦU EVIDENCE & WEBM VIDEOS ===');
  await generateVramReport();
  await generateTimelines();
  for (const a of ANIMS) {
    await encodeSingleAnimVideo(a);
    console.log(`Encoded bach_mao_${a.key}.webm`);
  }
  await encode4DirMatrixVideo();
  console.log('Encoded bach_mao_4_directions.webm');
  await encodeCombatVfxShowcaseVideo();
  console.log('Encoded bach_mao_combat_vfx_showcase.webm');
  console.log('=== PHASE 2.2 EVIDENCE GENERATION COMPLETE ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
