const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const CHAR_DIR = path.resolve(__dirname, '../public/assets/pixel-art/characters/lam_mac');
const VFX_DIR = path.resolve(__dirname, '../public/assets/pixel-art/vfx');
const OUT_FRAMES_DIR = path.resolve(__dirname, '../public/evidence/frames');
const OUT_LOGS_DIR = path.resolve(__dirname, '../public/evidence/logs');
const OUT_VIDEOS_DIR = path.resolve(__dirname, '../public/evidence/videos');

fs.mkdirSync(OUT_FRAMES_DIR, { recursive: true });
fs.mkdirSync(OUT_LOGS_DIR, { recursive: true });
fs.mkdirSync(OUT_VIDEOS_DIR, { recursive: true });

const ANIM_METADATA = [
  { name: 'idle', file: 'lam_mac_idle.png', cols: 6, rows: 4, fps: 6, loop: true, hitFrame: null, special: {} },
  { name: 'walk', file: 'lam_mac_walk.png', cols: 8, rows: 4, fps: 10, loop: true, hitFrame: null, special: {} },
  { name: 'run', file: 'lam_mac_run.png', cols: 8, rows: 4, fps: 12, loop: true, hitFrame: null, special: {} },
  { name: 'attack_1', file: 'lam_mac_attack_1.png', cols: 5, rows: 4, fps: 12, loop: false, hitFrame: 2, special: { 2: 'SÁT THƯƠNG (HIT)' } },
  { name: 'attack_2', file: 'lam_mac_attack_2.png', cols: 5, rows: 4, fps: 12, loop: false, hitFrame: 2, special: { 2: 'SÁT THƯƠNG (HIT)' } },
  { name: 'attack_3', file: 'lam_mac_attack_3.png', cols: 6, rows: 4, fps: 12, loop: false, hitFrame: 3, special: { 3: 'SÁT THƯƠNG (SLAM)' } },
  { name: 'dodge', file: 'lam_mac_dodge.png', cols: 4, rows: 4, fps: 14, loop: false, hitFrame: null, special: { 1: 'I-FRAME (BẤT TỬ)', 2: 'I-FRAME (BẤT TỬ)' } },
  { name: 'skill', file: 'lam_mac_skill.png', cols: 8, rows: 4, fps: 10, loop: false, hitFrame: 4, special: { 4: 'PHÓNG PHI KIẾM' } },
  { name: 'hit', file: 'lam_mac_hit.png', cols: 3, rows: 4, fps: 12, loop: false, hitFrame: null, special: { 0: 'TRÚNG ĐÒN (RECOIL)' } },
  { name: 'death', file: 'lam_mac_death.png', cols: 8, rows: 4, fps: 8, loop: false, hitFrame: null, special: { 7: 'GIỮ FRAME CUỐI' } },
];

const VFX_METADATA = [
  { name: 'vfx_sword_slash_wind', file: 'vfx_sword_slash_wind.png' },
  { name: 'vfx_sword_thrust_golden', file: 'vfx_sword_thrust_golden.png' },
  { name: 'vfx_ground_slam_shockwave', file: 'vfx_ground_slam_shockwave.png' },
  { name: 'vfx_celestial_sword_aura', file: 'vfx_celestial_sword_aura.png' },
  { name: 'vfx_dodge_phantom_trail', file: 'vfx_dodge_phantom_trail.png' },
];

async function generateVRAMReport() {
  console.log('Calculating exact VRAM & Memory footprints...');
  const breakdown = {
    methodology: {
      explanation: 'Cách tính VRAM thực tế dựa trên chuẩn Canvas 2D / WebGL Texture Backing Store:',
      disk_formula: 'Kích thước tệp PNG nén lưu trữ trên đĩa (Byte stream).',
      decoded_cpu_ram_formula: 'Width x Height x 4 bytes (RGBA 32-bit không nén) trong bộ nhớ heap trình duyệt khi đối tượng Image() được giải mã.',
      gpu_vram_formula: 'Width x Height x 4 bytes (GL_RGBA8 texture buffer) khi Canvas 2D hardware-accelerated đưa con trỏ bitmap lên GPU VRAM.',
      historical_note: 'Báo cáo sơ bộ Phase 2.0 trước đây ghi 1.83 MB là tính riêng pixel thô ban đầu (458,752 pixels x 4 = ~1.83 MB). Dưới đây là bảng hạch toán chi tiết toàn diện 15 tệp (10 nhân vật + 5 VFX).'
    },
    character_sheets: [],
    vfx_sheets: [],
    totals: {
      total_character_pixels: 0,
      total_character_vram_bytes: 0,
      total_vfx_pixels: 0,
      total_vfx_vram_bytes: 0,
      total_uncompressed_vram_bytes: 0,
      total_uncompressed_vram_mb: 0,
      total_disk_compressed_bytes: 0,
      total_disk_compressed_kb: 0,
    }
  };

  for (const anim of ANIM_METADATA) {
    const filePath = path.join(CHAR_DIR, anim.file);
    const meta = await sharp(filePath).metadata();
    const stat = fs.statSync(filePath);
    const pixels = meta.width * meta.height;
    const vramBytes = pixels * 4;
    breakdown.character_sheets.push({
      animation: anim.name,
      file: anim.file,
      dimensions: `${meta.width}x${meta.height}`,
      frames: `${anim.cols} cols x ${anim.rows} rows = ${anim.cols * anim.rows} frames`,
      pixels,
      uncompressed_vram_bytes: vramBytes,
      uncompressed_vram_kb: (vramBytes / 1024).toFixed(2),
      disk_bytes: stat.size,
      disk_kb: (stat.size / 1024).toFixed(2),
    });
    breakdown.totals.total_character_pixels += pixels;
    breakdown.totals.total_character_vram_bytes += vramBytes;
    breakdown.totals.total_disk_compressed_bytes += stat.size;
  }

  for (const vfx of VFX_METADATA) {
    const filePath = path.join(VFX_DIR, vfx.file);
    const meta = await sharp(filePath).metadata();
    const stat = fs.statSync(filePath);
    const pixels = meta.width * meta.height;
    const vramBytes = pixels * 4;
    breakdown.vfx_sheets.push({
      vfx_name: vfx.name,
      file: vfx.file,
      dimensions: `${meta.width}x${meta.height}`,
      pixels,
      uncompressed_vram_bytes: vramBytes,
      uncompressed_vram_kb: (vramBytes / 1024).toFixed(2),
      disk_bytes: stat.size,
      disk_kb: (stat.size / 1024).toFixed(2),
    });
    breakdown.totals.total_vfx_pixels += pixels;
    breakdown.totals.total_vfx_vram_bytes += vramBytes;
    breakdown.totals.total_disk_compressed_bytes += stat.size;
  }

  breakdown.totals.total_uncompressed_vram_bytes =
    breakdown.totals.total_character_vram_bytes + breakdown.totals.total_vfx_vram_bytes;
  breakdown.totals.total_uncompressed_vram_mb =
    (breakdown.totals.total_uncompressed_vram_bytes / (1024 * 1024)).toFixed(3);
  breakdown.totals.total_disk_compressed_kb =
    (breakdown.totals.total_disk_compressed_bytes / 1024).toFixed(2);

  fs.writeFileSync(
    path.join(OUT_LOGS_DIR, 'vram_memory_breakdown.json'),
    JSON.stringify(breakdown, null, 2),
    'utf-8'
  );
  console.log(`VRAM report generated: Total VRAM = ${breakdown.totals.total_uncompressed_vram_mb} MB, Disk = ${breakdown.totals.total_disk_compressed_kb} KB`);
  return breakdown;
}

async function generateFrameTimelines() {
  console.log('Generating frame timeline breakdown images...');
  const SCALE = 2; // 64x64 scaled to 128x128
  const FRAME_SIZE = 64 * SCALE;
  const PAD = 16;
  const HEADER_H = 80;
  const FOOTER_H = 40;

  for (const anim of ANIM_METADATA) {
    const filePath = path.join(CHAR_DIR, anim.file);
    const cols = anim.cols;
    const canvasW = cols * (FRAME_SIZE + PAD) + PAD;
    const canvasH = HEADER_H + FRAME_SIZE + FOOTER_H;

    // Slices for Row 0 (Down direction)
    const compositeList = [];
    const svgLabels = [];

    // Header label
    svgLabels.push(`
      <text x="${PAD}" y="32" font-family="monospace" font-size="20" font-weight="bold" fill="#38bdf8">ANIMATION: ${anim.name.toUpperCase()} (HƯỚNG NAM / ROW 0)</text>
      <text x="${PAD}" y="56" font-family="monospace" font-size="13" fill="#94a3b8">File: ${anim.file} | Cols: ${cols} | Rows: 4 | FPS: ${anim.fps} (${(1000 / anim.fps).toFixed(1)} ms/frame) | Loop: ${anim.loop}</text>
    `);

    for (let c = 0; c < cols; c++) {
      const x = PAD + c * (FRAME_SIZE + PAD);
      const y = HEADER_H;
      const ms = Math.round(c * (1000 / anim.fps));

      // Extract and scale frame
      const frameBuffer = await sharp(filePath)
        .extract({ left: c * 64, top: 0, width: 64, height: 64 })
        .resize(FRAME_SIZE, FRAME_SIZE, { kernel: sharp.kernel.nearest })
        .toBuffer();

      compositeList.push({
        input: frameBuffer,
        left: x,
        top: y,
      });

      // Pivot crosshair at (32, 56) scaled -> (64, 112)
      const pivotX = x + 32 * SCALE;
      const pivotY = y + 56 * SCALE;

      const specialBadge = anim.special[c];
      const badgeColor = specialBadge ? (specialBadge.includes('HIT') ? '#ef4444' : specialBadge.includes('BẤT TỬ') ? '#3b82f6' : '#eab308') : '#22c55e';

      svgLabels.push(`
        <!-- Frame box border -->
        <rect x="${x}" y="${y}" width="${FRAME_SIZE}" height="${FRAME_SIZE}" fill="none" stroke="#334155" stroke-width="1.5" />
        
        <!-- Pivot crosshair -->
        <circle cx="${pivotX}" cy="${pivotY}" r="4" fill="none" stroke="#eab308" stroke-width="1.5" />
        <line x1="${pivotX - 6}" y1="${pivotY}" x2="${pivotX + 6}" y2="${pivotY}" stroke="#eab308" stroke-width="1.5" />
        <line x1="${pivotX}" y1="${pivotY - 6}" x2="${pivotX}" y2="${pivotY + 6}" stroke="#eab308" stroke-width="1.5" />
        
        <!-- Frame label -->
        <text x="${x + FRAME_SIZE / 2}" y="${y + FRAME_SIZE + 18}" font-family="monospace" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle">Frame [${c}]</text>
        <text x="${x + FRAME_SIZE / 2}" y="${y + FRAME_SIZE + 32}" font-family="monospace" font-size="11" fill="#38bdf8" text-anchor="middle">${ms} ms</text>
      `);

      if (specialBadge) {
        svgLabels.push(`
          <rect x="${x + 2}" y="${y + 2}" width="${FRAME_SIZE - 4}" height="20" rx="3" fill="${badgeColor}" fill-opacity="0.9" />
          <text x="${x + FRAME_SIZE / 2}" y="${y + 16}" font-family="sans-serif" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">${specialBadge}</text>
        `);
      }
    }

    const svgOverlay = Buffer.from(`
      <svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
        ${svgLabels.join('\n')}
      </svg>
    `);

    compositeList.push({
      input: svgOverlay,
      left: 0,
      top: 0,
    });

    const outPath = path.join(OUT_FRAMES_DIR, `timeline_${anim.name}.png`);
    await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }, // slate-900
      }
    })
      .composite(compositeList)
      .png()
      .toFile(outPath);

    console.log(`Saved timeline: ${outPath}`);
  }
}

async function generate4DirectionsVideo() {
  console.log('Generating 4-directions sequential & matrix video...');
  const tmpDir = path.resolve('/tmp/anim_4dir_render');
  fs.mkdirSync(tmpDir, { recursive: true });

  // Clean old frames
  const oldFiles = fs.readdirSync(tmpDir);
  for (const f of oldFiles) fs.unlinkSync(path.join(tmpDir, f));

  // Render a 800x480 video showing Lâm Mặc facing Down (Row 0), Left (Row 1), Right (Row 2), Up (Row 3)
  // We will demonstrate 3 representative actions:
  // Phase A: IDLE in all 4 directions side-by-side (2 seconds = 40 frames @ 20 FPS)
  // Phase B: WALK in all 4 directions side-by-side (2.5 seconds = 50 frames @ 20 FPS)
  // Phase C: ATTACK 1 in all 4 directions side-by-side (2 seconds = 40 frames @ 20 FPS)
  // Phase D: DODGE in all 4 directions side-by-side (1.5 seconds = 30 frames @ 20 FPS)
  // Total = 160 frames = 8 seconds video

  const WIDTH = 800;
  const HEIGHT = 480;
  const SCALE = 3; // 64x64 -> 192x192
  const FRAME_W = 64 * SCALE;
  const FRAME_H = 64 * SCALE;

  const DIR_NAMES = ['HƯỚNG NAM (ROW 0: DOWN)', 'HƯỚNG TÂY (ROW 1: LEFT)', 'HƯỚNG ĐÔNG (ROW 2: RIGHT)', 'HƯỚNG BẮC (ROW 3: UP)'];
  const X_CENTERS = [100, 300, 500, 700];

  const phases = [
    { name: 'TĨNH TỌA (IDLE)', file: 'lam_mac_idle.png', cols: 6, fps: 6, framesCount: 36 },
    { name: 'HÀNH TẨU (WALK)', file: 'lam_mac_walk.png', cols: 8, fps: 10, framesCount: 40 },
    { name: 'TRẢM KIẾM (ATTACK 1)', file: 'lam_mac_attack_1.png', cols: 5, fps: 12, framesCount: 35 },
    { name: 'THIỂM TỊ (DODGE)', file: 'lam_mac_dodge.png', cols: 4, fps: 14, framesCount: 30 },
  ];

  let globalFrameIndex = 0;

  for (const phase of phases) {
    const sheetPath = path.join(CHAR_DIR, phase.file);
    const sheetMeta = await sharp(sheetPath).metadata();

    for (let f = 0; f < phase.framesCount; f++) {
      const colIndex = f % phase.cols;
      const compositeList = [];
      const svgLabels = [];

      svgLabels.push(`
        <text x="400" y="40" font-family="monospace" font-size="22" font-weight="bold" fill="#38bdf8" text-anchor="middle">KIỂM ĐỊNH 4 HƯỚNG NHÂN VẬT LÂM MẶC: ${phase.name}</text>
        <text x="400" y="68" font-family="monospace" font-size="14" fill="#94a3b8" text-anchor="middle">Tệp nguồn: ${phase.file} | Khung hình hiện tại: Frame [${colIndex}] | Tốc độ: ${phase.fps} FPS</text>
      `);

      for (let r = 0; r < 4; r++) {
        const frameBuffer = await sharp(sheetPath)
          .extract({ left: colIndex * 64, top: r * 64, width: 64, height: 64 })
          .resize(FRAME_W, FRAME_H, { kernel: sharp.kernel.nearest })
          .toBuffer();

        const x = X_CENTERS[r] - FRAME_W / 2;
        const y = 140;

        compositeList.push({
          input: frameBuffer,
          left: x,
          top: y,
        });

        // Soft ground shadow
        const shadowX = X_CENTERS[r];
        const shadowY = y + 56 * SCALE;

        svgLabels.push(`
          <!-- Ground shadow -->
          <ellipse cx="${shadowX}" cy="${shadowY}" rx="42" ry="14" fill="rgba(0,0,0,0.4)" />
          
          <!-- Direction Column Header -->
          <rect x="${x + 6}" y="98" width="${FRAME_W - 12}" height="28" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1" />
          <text x="${X_CENTERS[r]}" y="117" font-family="sans-serif" font-size="11" font-weight="bold" fill="#fbbf24" text-anchor="middle">${DIR_NAMES[r]}</text>
          
          <!-- Feet Pivot Indicator -->
          <circle cx="${shadowX}" cy="${shadowY}" r="4" fill="none" stroke="#ef4444" stroke-width="2" />
          
          <!-- Sub status -->
          <text x="${X_CENTERS[r]}" y="${y + FRAME_H + 28}" font-family="monospace" font-size="12" fill="#38bdf8" text-anchor="middle">Y-Pivot = 56px</text>
          <text x="${X_CENTERS[r]}" y="${y + FRAME_H + 46}" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="middle">Hàng ${r} [0..3]</text>
        `);
      }

      svgLabels.push(`
        <!-- Bottom watermark -->
        <rect x="0" y="445" width="800" height="35" fill="#090d16" />
        <text x="400" y="468" font-family="monospace" font-size="12" fill="#64748b" text-anchor="middle">DỰ ÁN: PHÀM TRẦN TIÊN LỘ | CHUẨN HÓA 4 HƯỚNG ROW ORDER 0..3 | BẢO TOÀN PIVOT CHÂN TUYỆT ĐỐI</text>
      `);

      const svgOverlay = Buffer.from(`
        <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
          ${svgLabels.join('\n')}
        </svg>
      `);

      compositeList.push({
        input: svgOverlay,
        left: 0,
        top: 0,
      });

      const frameFile = path.join(tmpDir, `frame_${String(globalFrameIndex).padStart(5, '0')}.png`);
      await sharp({
        create: {
          width: WIDTH,
          height: HEIGHT,
          channels: 4,
          background: { r: 15, g: 23, b: 42, alpha: 1 }, // slate-900
        }
      })
        .composite(compositeList)
        .png()
        .toFile(frameFile);

      globalFrameIndex++;
    }
  }

  const outVideo = path.join(OUT_VIDEOS_DIR, 'anim_4_directions.webm');
  console.log(`Encoding video from ${globalFrameIndex} frames to ${outVideo}...`);
  execSync(`ffmpeg -y -framerate 15 -i "${tmpDir}/frame_%05d.png" -c:v libvpx -b:v 1200k -crf 15 -pix_fmt yuv420p "${outVideo}"`, { stdio: 'inherit' });
  console.log(`Successfully generated 4-directions video: ${outVideo}`);
}

async function main() {
  await generateVRAMReport();
  await generateFrameTimelines();
  await generate4DirectionsVideo();
  console.log('All animation evidence generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
