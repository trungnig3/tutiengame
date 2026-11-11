/**
 * PIXEL ART ASSET PACK GENERATOR FOR PHÀM TRẦN TIÊN LỘ
 * Generates true 32-bit RGBA PNG sprite sheets with transparent background,
 * following the exact specifications in ART_BIBLE.md and ASSET_MANIFEST.json.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table & calculator
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit per channel
  ihdr[9] = 6; // Color type 6 = RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter 0
  ihdr[12] = 0; // Non-interlaced
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (rowBytes + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter None
    rgbaBuffer.copy(rawData, rowOffset + 1, y * rowBytes, (y + 1) * rowBytes);
  }
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Pixel Canvas helper to set pixels and draw primitives with integer precision
 */
class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4, 0); // 0 = fully transparent
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a < 255) {
      // Alpha blending
      const prevA = this.buffer[idx + 3] / 255;
      const curA = a / 255;
      const outA = curA + prevA * (1 - curA);
      if (outA > 0) {
        this.buffer[idx] = Math.round((r * curA + this.buffer[idx] * prevA * (1 - curA)) / outA);
        this.buffer[idx + 1] = Math.round((g * curA + this.buffer[idx + 1] * prevA * (1 - curA)) / outA);
        this.buffer[idx + 2] = Math.round((b * curA + this.buffer[idx + 2] * prevA * (1 - curA)) / outA);
        this.buffer[idx + 3] = Math.round(outA * 255);
      }
    } else {
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = a;
    }
  }

  setHex(x, y, hex, a = 255) {
    const c = parseHex(hex);
    this.setPixel(x, y, c.r, c.g, c.b, a);
  }

  fillRect(x, y, w, h, hex, a = 255) {
    const c = parseHex(hex);
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, c.r, c.g, c.b, a);
      }
    }
  }

  strokeRect(x, y, w, h, hex, a = 255) {
    for (let px = x; px < x + w; px++) {
      this.setHex(px, y, hex, a);
      this.setHex(px, y + h - 1, hex, a);
    }
    for (let py = y; py < y + h; py++) {
      this.setHex(x, py, hex, a);
      this.setHex(x + w - 1, py, hex, a);
    }
  }

  fillEllipse(cx, cy, rx, ry, hex, a = 255) {
    const c = parseHex(hex);
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          this.setPixel(x, y, c.r, c.g, c.b, a);
        }
      }
    }
  }

  strokeLine(x0, y0, x1, y1, hex, a = 255) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      this.setHex(x0, y0, hex, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  // Draw contact shadow at base
  drawContactShadow(cx, cy, rx, ry, alpha = 100) {
    this.fillEllipse(cx, cy, rx, ry, '#090d16', alpha);
  }

  toPNG() {
    return encodePNG(this.width, this.height, this.buffer);
  }
}

function parseHex(hex) {
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map(ch => ch + ch).join('');
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Xianxia Master Color Palette (ART_BIBLE.md)
const PALETTE = {
  inkBlack: '#090d16',
  inkNavy: '#111827',
  slateDark: '#1e293b',
  slateMid: '#475569',
  slateLight: '#94a3b8',
  whitePure: '#ffffff',
  whiteCloud: '#f8fafc',
  robeGray: '#cbd5e1',
  jadeDeep: '#064e3b',
  jadeEmerald: '#059669',
  jadeLight: '#10b981',
  jadeDew: '#6ee7b7',
  cyanDark: '#0c4a6e',
  cyanSpirit: '#0284c7',
  cyanGlow: '#38bdf8',
  cyanFrost: '#e0f2fe',
  goldWood: '#78350f',
  goldAmber: '#d97706',
  goldSpirit: '#f59e0b',
  goldPure: '#fde047',
  redDark: '#450a0a',
  redLacquer: '#991b1b',
  redCinnabar: '#dc2626',
  redGlow: '#f87171',
  skinBase: '#fed7aa',
  skinShade: '#f59e0b',
  skinShadow: '#7c2d12',
  groundMisty: '#4f6b64',
  groundDirt: '#5c4d3c',
  groundStone: '#334155'
};

const BASE_OUTLINE = '#0b132b';

// Ensure output directories exist
const OUT_DIRS = [
  'public/assets/pixel/characters',
  'public/assets/pixel/enemies',
  'public/assets/pixel/bosses',
  'public/assets/pixel/environment',
  'public/assets/pixel/vfx',
  'public/assets/pixel/ui'
];

for (const dir of OUT_DIRS) {
  fs.mkdirSync(dir, { recursive: true });
}

console.log('Generating Pixel Art Asset Pack according to ART_BIBLE.md...');

// ============================================================================
// 1. PLAYER: LÂM MẶC (KIẾM TU) - 64x64 per frame, 10 rows (512x640)
// ============================================================================
{
  const FW = 64, FH = 64;
  const sheetW = 512, sheetH = 640;
  const canvas = new PixelCanvas(sheetW, sheetH);

  const drawCultivator = (ox, oy, pose) => {
    const cx = ox + 32;
    const cy = oy + 56; // Pivot [0.5, 0.875]

    // Contact shadow
    canvas.drawContactShadow(cx, cy - 2, 12, 5, 90);

    const bobY = pose.bobY || 0;
    const bodyX = cx;
    const bodyY = cy - 24 + bobY;

    // Sword on back or swinging
    if (pose.slashFrame) {
      const sf = pose.slashFrame;
      const slashAngle = sf * 0.5;
      const swX = cx + Math.cos(slashAngle) * 22;
      const swY = cy - 26 + Math.sin(slashAngle) * 16;
      canvas.strokeLine(cx + 4, cy - 24, swX, swY, PALETTE.cyanGlow);
      canvas.strokeLine(cx + 3, cy - 23, swX, swY, PALETTE.whitePure);
      // Sword slash arc
      canvas.strokeLine(swX - 10, swY - 8, swX + 12, swY + 6, PALETTE.cyanGlow, 180);
    } else {
      // Sheathed sword on back
      canvas.strokeLine(cx - 8, cy - 36 + bobY, cx - 14, cy - 14 + bobY, PALETTE.goldAmber);
      canvas.setHex(cx - 7, cy - 38 + bobY, PALETTE.cyanSpirit);
      canvas.setHex(cx - 8, cy - 37 + bobY, PALETTE.whitePure);
    }

    // Legs / Boots
    const legOffset = pose.legSwing || 0;
    canvas.fillRect(cx - 6 + legOffset, cy - 10, 4, 10, PALETTE.slateDark);
    canvas.fillRect(cx + 2 - legOffset, cy - 10, 4, 10, PALETTE.slateDark);
    canvas.fillRect(cx - 7 + legOffset, cy - 3, 5, 3, BASE_OUTLINE);
    canvas.fillRect(cx + 1 - legOffset, cy - 3, 5, 3, BASE_OUTLINE);

    // Flowing White-Gray Robe (Trường Bào)
    canvas.fillRect(cx - 8, bodyY - 4, 16, 18, PALETTE.whiteCloud);
    canvas.fillRect(cx - 4, bodyY - 4, 8, 18, PALETTE.robeGray);
    canvas.fillRect(cx - 1, bodyY - 4, 2, 18, PALETTE.slateLight);
    // Robe outline
    canvas.strokeRect(cx - 8, bodyY - 4, 16, 18, BASE_OUTLINE);

    // Jade Sash & Hanging Jade Pendant
    canvas.fillRect(cx - 7, bodyY + 6, 14, 3, PALETTE.jadeEmerald);
    canvas.setHex(cx, bodyY + 7, PALETTE.goldSpirit);
    canvas.fillRect(cx - 1, bodyY + 9, 2, 6, PALETTE.jadeDew);

    // Arms & Sleeves
    const armSwing = pose.armSwing || 0;
    canvas.fillRect(cx - 11, bodyY - 2 + armSwing, 3, 10, PALETTE.whiteCloud);
    canvas.fillRect(cx + 8, bodyY - 2 - armSwing, 3, 10, PALETTE.whiteCloud);
    canvas.strokeRect(cx - 11, bodyY - 2 + armSwing, 3, 10, BASE_OUTLINE);
    canvas.strokeRect(cx + 8, bodyY - 2 - armSwing, 3, 10, BASE_OUTLINE);
    canvas.fillRect(cx - 11, bodyY + 7 + armSwing, 3, 3, PALETTE.skinBase);
    canvas.fillRect(cx + 8, bodyY + 7 - armSwing, 3, 3, PALETTE.skinBase);

    // Long flowing black hair over shoulders
    canvas.fillRect(cx - 7, bodyY - 14, 14, 14, PALETTE.inkBlack);
    canvas.fillRect(cx - 8, bodyY - 10, 2, 12, PALETTE.inkNavy);
    canvas.fillRect(cx + 6, bodyY - 10, 2, 12, PALETTE.inkNavy);

    // Head / Face
    canvas.fillRect(cx - 5, bodyY - 15, 10, 9, PALETTE.skinBase);
    canvas.fillRect(cx - 6, bodyY - 12, 1, 4, PALETTE.skinShade);
    canvas.fillRect(cx + 5, bodyY - 12, 1, 4, PALETTE.skinShade);
    canvas.strokeRect(cx - 5, bodyY - 15, 10, 9, BASE_OUTLINE);

    // Sharp Cultivator Eyes (Linh quang nhãn)
    if (pose.eyesClosed) {
      canvas.setHex(cx - 3, bodyY - 11, BASE_OUTLINE);
      canvas.setHex(cx + 2, bodyY - 11, BASE_OUTLINE);
    } else {
      canvas.fillRect(cx - 4, bodyY - 12, 2, 2, BASE_OUTLINE);
      canvas.fillRect(cx + 2, bodyY - 12, 2, 2, BASE_OUTLINE);
      canvas.setHex(cx - 3, bodyY - 12, PALETTE.cyanGlow);
      canvas.setHex(cx + 3, bodyY - 12, PALETTE.cyanGlow);
    }

    // Topknot & Golden Hairpin
    canvas.fillRect(cx - 3, bodyY - 20, 6, 6, PALETTE.inkBlack);
    canvas.fillRect(cx - 4, bodyY - 17, 8, 2, PALETTE.goldSpirit); // Golden pin
    canvas.strokeRect(cx - 3, bodyY - 20, 6, 6, BASE_OUTLINE);

    // Afterimage or hit flash
    if (pose.hitFlash) {
      canvas.fillEllipse(cx, bodyY, 14, 20, PALETTE.whitePure, 120);
    }
  };

  // Row 0: Idle (6 frames)
  for (let f = 0; f < 6; f++) {
    const ox = f * FW, oy = 0 * FH;
    const bob = (f === 2 || f === 3) ? -1 : 0;
    drawCultivator(ox, oy, { bobY: bob });
  }

  // Row 1: Walk (8 frames)
  for (let f = 0; f < 8; f++) {
    const ox = f * FW, oy = 1 * FH;
    const leg = Math.sin((f / 8) * Math.PI * 2) * 4;
    const arm = Math.sin((f / 8) * Math.PI * 2) * 3;
    drawCultivator(ox, oy, { legSwing: leg, armSwing: arm, bobY: Math.abs(leg) > 2 ? -1 : 0 });
  }

  // Row 2: Run (8 frames)
  for (let f = 0; f < 8; f++) {
    const ox = f * FW, oy = 2 * FH;
    const leg = Math.sin((f / 8) * Math.PI * 2) * 7;
    const arm = Math.sin((f / 8) * Math.PI * 2) * 5;
    drawCultivator(ox, oy, { legSwing: leg, armSwing: arm, bobY: -1 });
  }

  // Row 3: Attack 1 (5 frames)
  for (let f = 0; f < 5; f++) {
    const ox = f * FW, oy = 3 * FH;
    drawCultivator(ox, oy, { slashFrame: f + 1 });
  }

  // Row 4: Attack 2 (5 frames)
  for (let f = 0; f < 5; f++) {
    const ox = f * FW, oy = 4 * FH;
    drawCultivator(ox, oy, { slashFrame: f + 2 });
  }

  // Row 5: Attack 3 (6 frames)
  for (let f = 0; f < 6; f++) {
    const ox = f * FW, oy = 5 * FH;
    drawCultivator(ox, oy, { slashFrame: f + 1, legSwing: 2 });
  }

  // Row 6: Dodge (4 frames)
  for (let f = 0; f < 4; f++) {
    const ox = f * FW, oy = 6 * FH;
    // Ghost trail
    drawCultivator(ox - 8, oy, { bobY: 2 });
    drawCultivator(ox, oy, { bobY: 2, legSwing: 4 });
  }

  // Row 7: Skill (8 frames)
  for (let f = 0; f < 8; f++) {
    const ox = f * FW, oy = 7 * FH;
    drawCultivator(ox, oy, { bobY: -2 });
    // Talismans floating around
    const angle = (f / 8) * Math.PI * 2;
    const tx = ox + 32 + Math.cos(angle) * 20;
    const ty = oy + 32 + Math.sin(angle) * 16;
    canvas.fillRect(tx - 2, ty - 4, 4, 8, PALETTE.goldSpirit);
    canvas.setHex(tx, ty, PALETTE.redCinnabar);
  }

  // Row 8: Hit (3 frames)
  for (let f = 0; f < 3; f++) {
    const ox = f * FW, oy = 8 * FH;
    drawCultivator(ox, oy, { bobY: 2, hitFlash: f === 1 });
  }

  // Row 9: Death (8 frames)
  for (let f = 0; f < 8; f++) {
    const ox = f * FW, oy = 9 * FH;
    const drop = Math.min(f * 4, 24);
    if (f < 7) {
      drawCultivator(ox, oy, { bobY: drop, eyesClosed: f > 2 });
    } else {
      // Dispersed spirit sparks
      canvas.drawContactShadow(ox + 32, oy + 56, 12, 4, 40);
      for (let s = 0; s < 8; s++) {
        const sx = ox + 20 + (s * 4);
        const sy = oy + 40 - (s % 3) * 6;
        canvas.setHex(sx, sy, PALETTE.cyanGlow);
      }
    }
  }

  fs.writeFileSync('public/assets/pixel/characters/player_cultivator_lam_mac.png', canvas.toPNG());
  console.log('✓ Player sprite sheet created: player_cultivator_lam_mac.png');
}

// ============================================================================
// 2. NPC: TRƯỞNG THÔN LÝ ĐỨC - 48x64 per frame, 4 frames (192x64)
// ============================================================================
{
  const FW = 48, FH = 64;
  const canvas = new PixelCanvas(FW * 4, FH);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW, oy = 0;
    const cx = ox + 24;
    const cy = oy + 56;
    const bob = (f === 1 || f === 2) ? -1 : 0;

    canvas.drawContactShadow(cx, cy - 2, 11, 4, 80);

    // Walking wooden dragon cane
    canvas.strokeLine(cx - 12, cy - 38, cx - 12, cy - 2, PALETTE.goldAmber);
    canvas.fillRect(cx - 14, cy - 40, 5, 4, PALETTE.goldWood);

    // Rustic brown robe
    canvas.fillRect(cx - 8, cy - 28 + bob, 16, 22, '#78716c');
    canvas.fillRect(cx - 3, cy - 28 + bob, 6, 22, '#57534e');
    canvas.strokeRect(cx - 8, cy - 28 + bob, 16, 22, BASE_OUTLINE);
    canvas.fillRect(cx - 7, cy - 14 + bob, 14, 2, '#44403c'); // Belt

    // Boots
    canvas.fillRect(cx - 6, cy - 6, 4, 5, '#292524');
    canvas.fillRect(cx + 2, cy - 6, 4, 5, '#292524');

    // Kind face & long silver beard
    canvas.fillRect(cx - 5, cy - 38 + bob, 10, 8, PALETTE.skinBase);
    canvas.strokeRect(cx - 5, cy - 38 + bob, 10, 8, BASE_OUTLINE);
    canvas.setHex(cx - 2, cy - 35 + bob, BASE_OUTLINE);
    canvas.setHex(cx + 2, cy - 35 + bob, BASE_OUTLINE);

    // Flowing white beard
    canvas.fillRect(cx - 4, cy - 30 + bob, 8, 12, PALETTE.whiteCloud);
    canvas.fillRect(cx - 2, cy - 18 + bob, 4, 4, PALETTE.robeGray);

    // Silver hair in bun with wood pin
    canvas.fillRect(cx - 4, cy - 44 + bob, 8, 6, PALETTE.robeGray);
    canvas.fillRect(cx - 5, cy - 42 + bob, 10, 2, PALETTE.goldWood);
    canvas.strokeRect(cx - 4, cy - 44 + bob, 8, 6, BASE_OUTLINE);
  }

  fs.writeFileSync('public/assets/pixel/characters/npc_village_chief_ly_duc.png', canvas.toPNG());
  console.log('✓ NPC sprite sheet created: npc_village_chief_ly_duc.png');
}

// ============================================================================
// 3. ENEMY: THANH KHÊ DÃ LANG - 48x48 per frame, 5 rows (288x240)
// ============================================================================
{
  const FW = 48, FH = 48;
  const canvas = new PixelCanvas(FW * 6, FH * 5);

  const drawWolf = (ox, oy, pose) => {
    const cx = ox + 24;
    const cy = oy + 40;

    canvas.drawContactShadow(cx, cy - 1, 14, 5, 80);

    const bodyX = cx - 4 + (pose.bodyX || 0);
    const bodyY = cy - 16 + (pose.bodyY || 0);

    // Legs
    const l1 = pose.leg1 || 0, l2 = pose.leg2 || 0;
    canvas.fillRect(bodyX - 8 + l1, cy - 9, 3, 8, PALETTE.slateDark);
    canvas.fillRect(bodyX - 2 + l2, cy - 9, 3, 8, PALETTE.slateDark);
    canvas.fillRect(bodyX + 5 - l1, cy - 9, 3, 8, PALETTE.slateDark);
    canvas.fillRect(bodyX + 10 - l2, cy - 9, 3, 8, PALETTE.slateDark);

    // Body
    canvas.fillRect(bodyX - 10, bodyY - 4, 22, 10, PALETTE.slateMid);
    canvas.fillRect(bodyX - 8, bodyY - 2, 18, 8, PALETTE.slateDark);
    canvas.strokeRect(bodyX - 10, bodyY - 4, 22, 10, BASE_OUTLINE);

    // Tail
    canvas.strokeLine(bodyX - 10, bodyY, bodyX - 16, bodyY - 6 + (pose.tailY || 0), PALETTE.slateMid);

    // Wolf Head & Ears
    const headX = bodyX + 10;
    const headY = bodyY - 4;
    canvas.fillRect(headX, headY, 10, 8, PALETTE.slateMid);
    canvas.fillRect(headX + 4, headY + 2, 6, 5, PALETTE.slateDark);
    canvas.strokeRect(headX, headY, 10, 8, BASE_OUTLINE);
    // Pointed ears
    canvas.fillRect(headX + 2, headY - 4, 2, 4, BASE_OUTLINE);
    canvas.fillRect(headX + 6, headY - 4, 2, 4, BASE_OUTLINE);

    // Glowing cyan spirit eyes
    canvas.fillRect(headX + 4, headY + 2, 2, 2, PALETTE.cyanGlow);

    // Fangs & muzzle
    canvas.fillRect(headX + 9, headY + 4, 2, 2, PALETTE.whitePure);

    if (pose.hitFlash) {
      canvas.fillEllipse(cx, cy - 12, 16, 12, PALETTE.redCinnabar, 100);
    }
  };

  // Row 0: Idle (4f)
  for (let f = 0; f < 4; f++) drawWolf(f * FW, 0 * FH, { bodyY: (f % 2 === 1) ? 1 : 0 });
  // Row 1: Walk (6f)
  for (let f = 0; f < 6; f++) {
    const s = Math.sin((f / 6) * Math.PI * 2) * 3;
    drawWolf(f * FW, 1 * FH, { leg1: s, leg2: -s });
  }
  // Row 2: Attack (6f)
  for (let f = 0; f < 6; f++) {
    const lunge = f < 3 ? -f * 2 : (f - 3) * 4;
    drawWolf(f * FW, 2 * FH, { bodyX: lunge, tailY: -3 });
  }
  // Row 3: Hit (2f)
  for (let f = 0; f < 2; f++) drawWolf(f * FW, 3 * FH, { bodyX: -3, hitFlash: f === 0 });
  // Row 4: Death (6f)
  for (let f = 0; f < 6; f++) drawWolf(f * FW, 4 * FH, { bodyY: f * 2 });

  fs.writeFileSync('public/assets/pixel/enemies/enemy_spirit_wolf.png', canvas.toPNG());
  console.log('✓ Enemy sprite sheet created: enemy_spirit_wolf.png');
}

// ============================================================================
// 4. ENEMY: THIẾT BÌ DÃ TRƯ - 64x48 per frame, 5 rows (384x240)
// ============================================================================
{
  const FW = 64, FH = 48;
  const canvas = new PixelCanvas(FW * 6, FH * 5);

  const drawBoar = (ox, oy, pose) => {
    const cx = ox + 32;
    const cy = oy + 40;

    canvas.drawContactShadow(cx, cy - 1, 18, 6, 90);

    const bx = cx - 6 + (pose.bodyX || 0);
    const by = cy - 16 + (pose.bodyY || 0);

    // Heavy stout legs
    const l = pose.leg || 0;
    canvas.fillRect(bx - 12 + l, cy - 8, 4, 7, PALETTE.inkBlack);
    canvas.fillRect(bx - 4 - l, cy - 8, 4, 7, PALETTE.inkBlack);
    canvas.fillRect(bx + 4 + l, cy - 8, 4, 7, PALETTE.inkBlack);
    canvas.fillRect(bx + 12 - l, cy - 8, 4, 7, PALETTE.inkBlack);

    // Armored Iron-Hide Back Spines
    for (let s = 0; s < 5; s++) {
      canvas.fillRect(bx - 12 + s * 5, by - 8 - (s % 2), 3, 5, PALETTE.inkBlack);
    }

    // Heavy Boar Body
    canvas.fillRect(bx - 14, by - 4, 28, 14, '#78350f');
    canvas.fillRect(bx - 10, by - 2, 22, 10, '#451a03');
    canvas.strokeRect(bx - 14, by - 4, 28, 14, BASE_OUTLINE);

    // Boar Head & Snout
    canvas.fillRect(bx + 12, by - 2, 10, 10, '#9a3412');
    canvas.fillRect(bx + 18, by + 1, 4, 6, '#451a03');
    canvas.strokeRect(bx + 12, by - 2, 10, 10, BASE_OUTLINE);

    // Curved Ivory Tusk
    canvas.fillRect(bx + 16, by + 4, 2, 4, PALETTE.goldPure);
    canvas.fillRect(bx + 17, by + 2, 3, 2, PALETTE.goldPure);

    // Red Glowing Eye
    canvas.fillRect(bx + 14, by, 2, 2, PALETTE.redCinnabar);

    if (pose.hitFlash) {
      canvas.fillEllipse(cx, cy - 10, 20, 12, PALETTE.redCinnabar, 100);
    }
  };

  // Row 0: Idle (4f)
  for (let f = 0; f < 4; f++) drawBoar(f * FW, 0 * FH, { bodyY: (f % 2 === 1) ? 1 : 0 });
  // Row 1: Walk (6f)
  for (let f = 0; f < 6; f++) {
    const s = Math.sin((f / 6) * Math.PI * 2) * 3;
    drawBoar(f * FW, 1 * FH, { leg: s });
  }
  // Row 2: Attack (6f)
  for (let f = 0; f < 6; f++) {
    const lunge = f < 3 ? -f * 3 : (f - 3) * 6;
    drawBoar(f * FW, 2 * FH, { bodyX: lunge });
  }
  // Row 3: Hit (2f)
  for (let f = 0; f < 2; f++) drawBoar(f * FW, 3 * FH, { bodyX: -4, hitFlash: f === 0 });
  // Row 4: Death (6f)
  for (let f = 0; f < 6; f++) drawBoar(f * FW, 4 * FH, { bodyY: f * 2 });

  fs.writeFileSync('public/assets/pixel/enemies/enemy_iron_boar.png', canvas.toPNG());
  console.log('✓ Enemy sprite sheet created: enemy_iron_boar.png');
}

// ============================================================================
// 5. ENEMY: HẮC SÁT MA ĐỒ - 48x64 per frame, 5 rows (288x320)
// ============================================================================
{
  const FW = 48, FH = 64;
  const canvas = new PixelCanvas(FW * 6, FH * 5);

  const drawCultist = (ox, oy, pose) => {
    const cx = ox + 24;
    const cy = oy + 56;

    canvas.drawContactShadow(cx, cy - 2, 11, 4, 80);

    const by = cy - 26 + (pose.bodyY || 0);

    // Dark Hooded Robe
    canvas.fillRect(cx - 8, by - 6, 16, 24, '#2e1065');
    canvas.fillRect(cx - 6, by - 4, 12, 20, '#3b0764');
    canvas.strokeRect(cx - 8, by - 6, 16, 24, BASE_OUTLINE);

    // Hood & Red Eyes in darkness
    canvas.fillRect(cx - 6, by - 14, 12, 10, '#1e1b4b');
    canvas.fillRect(cx - 4, by - 12, 8, 6, PALETTE.inkBlack);
    canvas.strokeRect(cx - 6, by - 14, 12, 10, BASE_OUTLINE);
    canvas.fillRect(cx - 3, by - 10, 2, 2, PALETTE.redCinnabar);
    canvas.fillRect(cx + 1, by - 10, 2, 2, PALETTE.redCinnabar);

    // Skull Staff
    canvas.strokeLine(cx + 9, cy - 36, cx + 9, cy - 4, '#78350f');
    canvas.fillRect(cx + 7, cy - 40, 5, 5, PALETTE.robeGray);
    canvas.setHex(cx + 8, cy - 38, PALETTE.redCinnabar);

    if (pose.hitFlash) {
      canvas.fillEllipse(cx, cy - 18, 14, 20, PALETTE.redCinnabar, 100);
    }
  };

  // Row 0: Idle (4f)
  for (let f = 0; f < 4; f++) drawCultist(f * FW, 0 * FH, { bodyY: (f % 2 === 1) ? -1 : 0 });
  // Row 1: Walk (6f)
  for (let f = 0; f < 6; f++) {
    drawCultist(f * FW, 1 * FH, { bodyY: Math.sin(f) * 2 });
  }
  // Row 2: Attack (6f)
  for (let f = 0; f < 6; f++) {
    drawCultist(f * FW, 2 * FH, { bodyY: -2 });
  }
  // Row 3: Hit (2f)
  for (let f = 0; f < 2; f++) drawCultist(f * FW, 3 * FH, { hitFlash: f === 0 });
  // Row 4: Death (6f)
  for (let f = 0; f < 6; f++) drawCultist(f * FW, 4 * FH, { bodyY: f * 4 });

  fs.writeFileSync('public/assets/pixel/enemies/enemy_dark_cultist.png', canvas.toPNG());
  console.log('✓ Enemy sprite sheet created: enemy_dark_cultist.png');
}

// ============================================================================
// 6. BOSS: BẠCH MAO VIÊN HẦU - 128x128 per frame, 7 rows (1536x896)
// ============================================================================
{
  const FW = 128, FH = 128;
  const canvas = new PixelCanvas(FW * 12, FH * 7);

  const drawApeBoss = (ox, oy, pose) => {
    const cx = ox + 64;
    const cy = oy + 116; // Pivot [0.5, 0.90]

    canvas.drawContactShadow(cx, cy - 3, 34, 10, 110);

    const bx = cx + (pose.bodyX || 0);
    const by = cy - 54 + (pose.bodyY || 0);

    // Thick ape legs
    canvas.fillRect(bx - 22, cy - 24, 14, 22, PALETTE.slateDark);
    canvas.fillRect(bx + 8, cy - 24, 14, 22, PALETTE.slateDark);
    canvas.strokeRect(bx - 22, cy - 24, 14, 22, BASE_OUTLINE);
    canvas.strokeRect(bx + 8, cy - 24, 14, 22, BASE_OUTLINE);

    // Massive muscular torso (Silvery white fur with shaded core)
    canvas.fillRect(bx - 28, by - 16, 56, 44, PALETTE.whiteCloud);
    canvas.fillRect(bx - 22, by - 12, 44, 38, PALETTE.slateLight);
    canvas.fillRect(bx - 14, by - 6, 28, 28, PALETTE.slateDark); // Dark muscular pectoral plates
    canvas.strokeRect(bx - 28, by - 16, 56, 44, BASE_OUTLINE);

    // Massive Ape Arms & Fists
    const armY = pose.armsRaised ? -18 : 6;
    canvas.fillRect(bx - 38, by - 10 + armY, 14, 46, PALETTE.whiteCloud);
    canvas.fillRect(bx + 24, by - 10 + armY, 14, 46, PALETTE.whiteCloud);
    canvas.strokeRect(bx - 38, by - 10 + armY, 14, 46, BASE_OUTLINE);
    canvas.strokeRect(bx + 24, by - 10 + armY, 14, 46, BASE_OUTLINE);
    // Dark stone knuckles
    canvas.fillRect(bx - 40, by + 32 + armY, 16, 12, PALETTE.slateDark);
    canvas.fillRect(bx + 24, by + 32 + armY, 16, 12, PALETTE.slateDark);

    // Ape Head with wild white mane
    canvas.fillRect(bx - 18, by - 36, 36, 24, PALETTE.whiteCloud);
    canvas.fillRect(bx - 14, by - 32, 28, 20, PALETTE.inkBlack); // Dark face
    canvas.strokeRect(bx - 18, by - 36, 36, 24, BASE_OUTLINE);

    // Glowing Ruby Eyes
    canvas.fillRect(bx - 10, by - 26, 6, 4, PALETTE.redCinnabar);
    canvas.fillRect(bx + 4, by - 26, 6, 4, PALETTE.redCinnabar);
    canvas.setHex(bx - 8, by - 25, PALETTE.goldPure);
    canvas.setHex(bx + 6, by - 25, PALETTE.goldPure);

    // Savage Curved Fangs
    canvas.fillRect(bx - 6, by - 16, 3, 6, PALETTE.whitePure);
    canvas.fillRect(bx + 3, by - 16, 3, 6, PALETTE.whitePure);

    // Shockwave or charge trail
    if (pose.chargeTrail) {
      canvas.fillEllipse(cx - 30, cy - 20, 24, 16, PALETTE.cyanGlow, 80);
      canvas.fillEllipse(cx + 30, cy - 20, 24, 16, PALETTE.cyanGlow, 80);
    }
    if (pose.hitFlash) {
      canvas.fillEllipse(cx, cy - 40, 36, 40, PALETTE.redCinnabar, 100);
    }
  };

  // Row 0: Idle (6f)
  for (let f = 0; f < 6; f++) drawApeBoss(f * FW, 0 * FH, { bodyY: (f % 2 === 1) ? 2 : 0 });
  // Row 1: Walk (8f)
  for (let f = 0; f < 8; f++) drawApeBoss(f * FW, 1 * FH, { bodyY: Math.sin(f) * 3 });
  // Row 2: Charge (6f)
  for (let f = 0; f < 6; f++) drawApeBoss(f * FW, 2 * FH, { bodyY: 4, chargeTrail: true });
  // Row 3: Attack (8f)
  for (let f = 0; f < 8; f++) drawApeBoss(f * FW, 3 * FH, { armsRaised: f < 4 });
  // Row 4: Special (10f)
  for (let f = 0; f < 10; f++) drawApeBoss(f * FW, 4 * FH, { armsRaised: true, bodyY: -4 });
  // Row 5: Hit/Stun (4f)
  for (let f = 0; f < 4; f++) drawApeBoss(f * FW, 5 * FH, { bodyX: (f % 2 === 0 ? 4 : -4), hitFlash: f === 1 });
  // Row 6: Death (12f)
  for (let f = 0; f < 12; f++) drawApeBoss(f * FW, 6 * FH, { bodyY: f * 4 });

  fs.writeFileSync('public/assets/pixel/bosses/boss_white_ape.png', canvas.toPNG());
  console.log('✓ Boss sprite sheet created: boss_white_ape.png');
}

// ============================================================================
// 7. ENVIRONMENT: THANH KHÊ ĐÌNH - 128x128
// ============================================================================
{
  const canvas = new PixelCanvas(128, 128);
  // Ground shadow
  canvas.drawContactShadow(64, 120, 56, 10, 100);

  // 1. Stone Foundation 3-step podium
  canvas.fillRect(8, 106, 112, 14, '#334155');
  canvas.fillRect(16, 110, 96, 4, '#64748b');
  canvas.strokeRect(8, 106, 112, 14, BASE_OUTLINE);

  // 2. Timber Pillars (Crimson Lacquer)
  canvas.fillRect(16, 42, 12, 66, '#7f1d1d');
  canvas.fillRect(100, 42, 12, 66, '#7f1d1d');
  canvas.strokeRect(16, 42, 12, 66, BASE_OUTLINE);
  canvas.strokeRect(100, 42, 12, 66, BASE_OUTLINE);

  // 3. Chamber Wall & Lattice Doors
  canvas.fillRect(28, 50, 72, 56, '#451a03');
  canvas.fillRect(50, 56, 28, 50, '#b45309'); // Carved doors
  canvas.strokeRect(28, 50, 72, 56, BASE_OUTLINE);
  canvas.strokeRect(50, 56, 28, 50, BASE_OUTLINE);

  // 4. Curved Eaves (Mái Ngói Âm Dương Cong Vút)
  for (let y = 0; y < 24; y++) {
    const curve = Math.round(Math.pow((y - 12) / 12, 2) * 8);
    canvas.fillRect(6 - curve, 22 + y, 116 + curve * 2, 2, '#0f766e');
  }
  canvas.strokeRect(4, 22, 120, 24, BASE_OUTLINE);
  // Ridge adornment
  canvas.fillRect(58, 14, 12, 8, PALETTE.goldSpirit);
  canvas.strokeRect(58, 14, 12, 8, BASE_OUTLINE);

  // 5. Hanging Red Lanterns on left and right
  canvas.fillRect(12, 48, 8, 12, PALETTE.redCinnabar);
  canvas.fillRect(108, 48, 8, 12, PALETTE.redCinnabar);
  canvas.fillRect(14, 51, 4, 6, PALETTE.goldPure);
  canvas.fillRect(110, 51, 4, 6, PALETTE.goldPure);

  fs.writeFileSync('public/assets/pixel/environment/building_thanh_khe_dinh.png', canvas.toPNG());
  console.log('✓ Prop created: building_thanh_khe_dinh.png');
}

// ============================================================================
// 8. ENVIRONMENT: CỔ TÙNG THỤ (CÂY LỚN) - 128x160
// ============================================================================
{
  const canvas = new PixelCanvas(128, 160);
  canvas.drawContactShadow(64, 154, 28, 6, 110);

  // Trunk & roots
  canvas.fillRect(54, 100, 20, 54, '#78350f');
  canvas.fillRect(58, 100, 14, 54, '#451a03');
  canvas.strokeRect(54, 100, 20, 54, BASE_OUTLINE);
  // Roots splaying
  canvas.fillRect(44, 148, 14, 6, '#451a03');
  canvas.fillRect(70, 148, 14, 6, '#451a03');

  // Tiered foliage canopies
  const foliage = [
    { cy: 110, rx: 46, ry: 22, col: '#14532d' },
    { cy: 85,  rx: 40, ry: 20, col: '#166534' },
    { cy: 62,  rx: 34, ry: 18, col: '#15803d' },
    { cy: 40,  rx: 26, ry: 16, col: '#22c55e' },
    { cy: 22,  rx: 16, ry: 12, col: '#4ade80' }
  ];

  for (const f of foliage) {
    canvas.fillEllipse(64, f.cy, f.rx, f.ry, f.col);
    // Dark rim outline
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const px = Math.round(64 + Math.cos(a) * f.rx);
      const py = Math.round(f.cy + Math.sin(a) * f.ry);
      canvas.setHex(px, py, BASE_OUTLINE);
    }
  }

  fs.writeFileSync('public/assets/pixel/environment/tree_ancient_pine.png', canvas.toPNG());
  console.log('✓ Prop created: tree_ancient_pine.png');
}

// ============================================================================
// 9. ENVIRONMENT: TRÚC LINH MỘC (CÂY NHỎ) - 32x96
// ============================================================================
{
  const canvas = new PixelCanvas(32, 96);
  canvas.drawContactShadow(16, 92, 10, 3, 90);

  // Segmented bamboo stem
  canvas.fillRect(14, 24, 4, 68, PALETTE.jadeEmerald);
  canvas.strokeRect(14, 24, 4, 68, BASE_OUTLINE);
  for (let s = 34; s < 90; s += 14) {
    canvas.fillRect(13, s, 6, 2, PALETTE.jadeDew);
  }

  // Drooping bamboo leaves
  const leaves = [
    { x: 10, y: 28, dx: -8, dy: 6 },
    { x: 18, y: 32, dx: 10, dy: 6 },
    { x: 12, y: 44, dx: -10, dy: 8 },
    { x: 18, y: 50, dx: 11, dy: 7 },
    { x: 12, y: 64, dx: -9, dy: 7 }
  ];
  for (const l of leaves) {
    canvas.strokeLine(l.x, l.y, l.x + l.dx, l.y + l.dy, PALETTE.jadeLight);
    canvas.setHex(l.x + l.dx, l.y + l.dy, PALETTE.jadeDew);
  }

  fs.writeFileSync('public/assets/pixel/environment/tree_bamboo.png', canvas.toPNG());
  console.log('✓ Prop created: tree_bamboo.png');
}

// ============================================================================
// 10. ENVIRONMENT: CẦU GỖ MỘC CỔ (BRIDGE) - 96x64
// ============================================================================
{
  const canvas = new PixelCanvas(96, 64);
  canvas.drawContactShadow(48, 56, 44, 8, 80);

  // Stone abutments at both sides
  canvas.fillRect(4, 18, 16, 36, '#475569');
  canvas.fillRect(76, 18, 16, 36, '#475569');
  canvas.strokeRect(4, 18, 16, 36, BASE_OUTLINE);
  canvas.strokeRect(76, 18, 16, 36, BASE_OUTLINE);

  // Wooden deck planks
  canvas.fillRect(16, 22, 64, 24, '#78350f');
  canvas.strokeRect(16, 22, 64, 24, BASE_OUTLINE);
  for (let p = 22; p < 80; p += 6) {
    canvas.strokeLine(p, 22, p, 46, '#451a03');
  }

  // Wooden handrails
  canvas.strokeLine(16, 18, 80, 18, '#b45309');
  canvas.strokeLine(16, 48, 80, 48, '#b45309');
  for (let post = 18; post <= 78; post += 15) {
    canvas.fillRect(post, 14, 2, 8, '#451a03');
    canvas.fillRect(post, 46, 2, 8, '#451a03');
  }

  fs.writeFileSync('public/assets/pixel/environment/bridge_rustic_wood.png', canvas.toPNG());
  console.log('✓ Prop created: bridge_rustic_wood.png');
}

// ============================================================================
// 11. ENVIRONMENT: PROPS (CHISELED ROCK & LANTERN)
// ============================================================================
{
  // Rock 64x48
  const rock = new PixelCanvas(64, 48);
  rock.drawContactShadow(32, 44, 26, 4, 90);
  rock.fillEllipse(32, 28, 24, 16, '#475569');
  rock.fillRect(20, 20, 24, 16, '#334155');
  rock.strokeRect(10, 16, 44, 26, BASE_OUTLINE);
  // Spirit crystals embedded
  rock.fillRect(26, 22, 6, 8, PALETTE.cyanGlow);
  rock.fillRect(28, 24, 2, 4, PALETTE.whitePure);
  fs.writeFileSync('public/assets/pixel/environment/prop_chiseled_rock.png', rock.toPNG());

  // Lantern 64x24 (4 frames)
  const lantern = new PixelCanvas(64, 24);
  for (let f = 0; f < 4; f++) {
    const ox = f * 16;
    const sway = Math.sin((f / 4) * Math.PI * 2) * 1;
    lantern.strokeLine(ox + 8, 0, ox + 8 + sway, 6, PALETTE.goldWood);
    lantern.fillRect(ox + 4 + sway, 6, 8, 12, PALETTE.redCinnabar);
    lantern.fillRect(ox + 6 + sway, 9, 4, 6, PALETTE.goldPure);
    lantern.strokeRect(ox + 4 + sway, 6, 8, 12, BASE_OUTLINE);
  }
  fs.writeFileSync('public/assets/pixel/environment/prop_hanging_lantern.png', lantern.toPNG());
  console.log('✓ Props created: prop_chiseled_rock.png, prop_hanging_lantern.png');
}

// ============================================================================
// 12. ENVIRONMENT: GROUND TILESET - 256x128 (8x4 tiles of 32x32)
// ============================================================================
{
  const canvas = new PixelCanvas(256, 128);

  // Tile 0: Misty Ground (0,0)
  canvas.fillRect(0, 0, 32, 32, PALETTE.groundMisty);
  canvas.fillRect(8, 8, 4, 4, '#445b54');
  canvas.fillRect(20, 18, 5, 3, '#5c7a72');

  // Tile 1: Grass Plain (32,0)
  canvas.fillRect(32, 0, 32, 32, '#3f5d54');
  canvas.fillRect(40, 6, 4, 4, '#2e4840');

  // Tile 2: Grass with Spirit Dewdrop (64,0)
  canvas.fillRect(64, 0, 32, 32, '#3f5d54');
  // Clump 3 blades
  canvas.strokeLine(74, 22, 70, 12, PALETTE.jadeEmerald);
  canvas.strokeLine(78, 22, 80, 8, PALETTE.jadeLight);
  canvas.strokeLine(82, 22, 86, 14, PALETTE.jadeEmerald);
  canvas.setHex(80, 7, PALETTE.jadeDew); // dewdrop

  // Tile 3: Dirt Path (96,0)
  canvas.fillRect(96, 0, 32, 32, '#6b5849');
  canvas.fillRect(104, 10, 12, 8, '#7c6858');
  canvas.strokeRect(96, 0, 32, 32, '#554437');

  // Tile 4: Cobblestone Path (128,0)
  canvas.fillRect(128, 0, 32, 32, '#475569');
  canvas.strokeRect(130, 2, 12, 12, BASE_OUTLINE);
  canvas.strokeRect(144, 4, 14, 10, BASE_OUTLINE);
  canvas.strokeRect(132, 16, 14, 12, BASE_OUTLINE);
  canvas.strokeRect(148, 16, 12, 14, BASE_OUTLINE);

  // Tile 5: Stone Cliff Edge (160,0)
  canvas.fillRect(160, 0, 32, 16, '#64748b');
  canvas.fillRect(160, 16, 32, 16, '#334155');
  canvas.strokeLine(160, 16, 192, 16, BASE_OUTLINE);

  fs.writeFileSync('public/assets/pixel/environment/ground_tileset.png', canvas.toPNG());
  console.log('✓ Tileset created: ground_tileset.png');
}

// ============================================================================
// 13. ENVIRONMENT: ANIMATED WATER STREAM - 128x64 (4 frames of 32x32 tiles)
// ============================================================================
{
  const canvas = new PixelCanvas(128, 64);

  // Row 0: Deep Water (4 frames)
  for (let f = 0; f < 4; f++) {
    const ox = f * 32;
    canvas.fillRect(ox, 0, 32, 32, PALETTE.cyanSpirit);
    canvas.fillRect(ox, 8, 32, 16, '#0369a1');
    // Ripple line moving across frames
    const rx = (f * 8) % 32;
    canvas.strokeLine(ox + rx, 12, ox + rx + 10, 12, PALETTE.cyanGlow);
    canvas.strokeLine(ox + ((rx + 16) % 32), 20, ox + ((rx + 16) % 32) + 8, 20, PALETTE.cyanFrost);
  }

  // Row 1: Water with Floating Lotus Pad
  for (let f = 0; f < 4; f++) {
    const ox = f * 32;
    canvas.fillRect(ox, 32, 32, 32, PALETTE.cyanSpirit);
    const bob = (f % 2 === 1) ? 1 : 0;
    // Green pad
    canvas.fillEllipse(ox + 16, 48 + bob, 8, 5, PALETTE.jadeEmerald);
    // Pink flower
    canvas.fillRect(ox + 14, 46 + bob, 4, 3, '#f472b6');
    canvas.setHex(ox + 15, 47 + bob, PALETTE.whitePure);
  }

  fs.writeFileSync('public/assets/pixel/environment/animated_water_stream.png', canvas.toPNG());
  console.log('✓ Animated tileset created: animated_water_stream.png');
}

// ============================================================================
// 14. COMBAT VFX: SWORD SLASH WIND - 256x64 (4 frames x 64x64)
// ============================================================================
{
  const FW = 64;
  const canvas = new PixelCanvas(FW * 4, 64);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + 32, cy = 32;
    const arcRadius = 14 + f * 5;
    const alpha = Math.max(40, 255 - f * 55);

    for (let a = -1.2; a <= 1.2; a += 0.08) {
      const px = cx + Math.cos(a) * arcRadius;
      const py = cy + Math.sin(a) * arcRadius;
      canvas.setHex(px, py, PALETTE.cyanGlow, alpha);
      canvas.setHex(px + 1, py, PALETTE.whitePure, alpha);
    }
  }

  fs.writeFileSync('public/assets/pixel/vfx/vfx_sword_slash_wind.png', canvas.toPNG());
  console.log('✓ VFX created: vfx_sword_slash_wind.png');
}

// ============================================================================
// 15. COMBAT VFX: FIRE ARC - 320x64 (5 frames x 64x64)
// ============================================================================
{
  const FW = 64;
  const canvas = new PixelCanvas(FW * 5, 64);

  for (let f = 0; f < 5; f++) {
    const ox = f * FW;
    const cx = ox + 32, cy = 32;
    const r = 12 + f * 4;

    for (let a = -1.0; a <= 1.0; a += 0.08) {
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      canvas.setHex(px, py, PALETTE.redCinnabar);
      canvas.setHex(px - 1, py, PALETTE.goldSpirit);
      canvas.setHex(px, py - 1, PALETTE.goldPure);
    }
    // Flying embers
    canvas.setHex(cx + 10 + f * 2, cy - 8 - f * 2, PALETTE.goldPure);
    canvas.setHex(cx - 8, cy - 10 - f * 2, PALETTE.goldSpirit);
  }

  fs.writeFileSync('public/assets/pixel/vfx/vfx_fire_arc.png', canvas.toPNG());
  console.log('✓ VFX created: vfx_fire_arc.png');
}

// ============================================================================
// 16. COMBAT VFX: LIGHTNING STRIKE - 192x96 (4 frames x 48x96)
// ============================================================================
{
  const FW = 48;
  const canvas = new PixelCanvas(FW * 4, 96);

  for (let f = 0; f < 4; f++) {
    const ox = f * FW;
    const cx = ox + 24;
    // Zigzag lightning down
    let lx = cx;
    for (let y = 4; y < 90; y += 4) {
      const shift = ((y / 8 + f) % 2 === 0) ? 3 : -3;
      lx += shift;
      canvas.fillRect(lx - 1, y, 3, 4, '#a855f7');
      canvas.fillRect(lx, y, 1, 4, PALETTE.whitePure);
    }
    // Ground burst
    canvas.fillEllipse(cx, 88, 12, 4, PALETTE.cyanGlow, 180);
  }

  fs.writeFileSync('public/assets/pixel/vfx/vfx_lightning_strike.png', canvas.toPNG());
  console.log('✓ VFX created: vfx_lightning_strike.png');
}

// ============================================================================
// 17. COMBAT VFX: IMPACT SPARKS - 96x32 (3 frames x 32x32)
// ============================================================================
{
  const FW = 32;
  const canvas = new PixelCanvas(FW * 3, 32);

  for (let f = 0; f < 3; f++) {
    const ox = f * FW;
    const cx = ox + 16, cy = 16;
    const size = 3 + f * 3;
    // 4-pointed star
    canvas.strokeLine(cx - size, cy, cx + size, cy, PALETTE.goldPure);
    canvas.strokeLine(cx, cy - size, cx, cy + size, PALETTE.goldPure);
    canvas.setHex(cx, cy, PALETTE.whitePure);
  }

  fs.writeFileSync('public/assets/pixel/vfx/vfx_impact_sparks.png', canvas.toPNG());
  console.log('✓ VFX created: vfx_impact_sparks.png');
}

console.log('🎉 ALL PIXEL ART ASSET FILES SUCCESSFULLY GENERATED AND SAVED TO DISK!');
