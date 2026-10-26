import { GameMap, NPC, Enemy, PlayerStats, GroundDrop, CollectibleResource } from '../types/game';

export type MapObstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rock' | 'tree' | 'building' | 'water' | 'wall';
};

// ============================================================================
// TRUE 16-BIT PIXEL ART ENGINE - PROCEDURAL RASTERIZER & 1PX OUTLINE
// 100% Procedural HTML5 Canvas & ImageData Rasterization
// Zero external images - Ultra-sharp nearest-neighbor scaling
// ============================================================================

const spriteCache = new Map<string, HTMLCanvasElement>();

/**
 * Universal Vector-to-PixelArt Rasterizer:
 * Takes a logical coordinate drawing function, renders it to an Offscreen Canvas,
 * performs an automated 1px dark border outline (#0f172a) around all opaque pixels,
 * and scales it to true crisp pixel art with imageSmoothingEnabled = false.
 */
export function rasterizeToPixelSprite(
  logicalWidth: number,
  logicalHeight: number,
  drawFn: (ctx: CanvasRenderingContext2D) => void,
  scale: number = 2,
  cacheKey?: string,
  outlineColor: string = '#0f172a'
): HTMLCanvasElement {
  if (cacheKey && spriteCache.has(cacheKey)) {
    return spriteCache.get(cacheKey)!;
  }

  // 1. Render crisp unblurred vector art onto logical canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = logicalWidth;
  srcCanvas.height = logicalHeight;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return srcCanvas;

  srcCtx.imageSmoothingEnabled = false;
  drawFn(srcCtx);

  // 2. Read raw pixel buffer
  const imgData = srcCtx.getImageData(0, 0, logicalWidth, logicalHeight);
  const data = imgData.data;

  // Solid pixel detector
  const isSolid = (x: number, y: number): boolean => {
    if (x < 0 || x >= logicalWidth || y < 0 || y >= logicalHeight) return false;
    const idx = (y * logicalWidth + x) * 4;
    return data[idx + 3] > 40;
  };

  // 3. Render onto destination canvas with 1px outline padding
  const pad = 1;
  const outW = logicalWidth + pad * 2;
  const outH = logicalHeight + pad * 2;

  const destCanvas = document.createElement('canvas');
  destCanvas.width = outW * scale;
  destCanvas.height = outH * scale;
  const destCtx = destCanvas.getContext('2d');
  if (!destCtx) return destCanvas;

  destCtx.imageSmoothingEnabled = false;

  // Outline Pass: if any of 4 cardinal neighbors is solid, stamp outline pixel
  destCtx.fillStyle = outlineColor;
  for (let y = -1; y <= logicalHeight; y++) {
    for (let x = -1; x <= logicalWidth; x++) {
      if (!isSolid(x, y)) {
        if (
          isSolid(x - 1, y) ||
          isSolid(x + 1, y) ||
          isSolid(x, y - 1) ||
          isSolid(x, y + 1)
        ) {
          destCtx.fillRect((x + pad) * scale, (y + pad) * scale, scale, scale);
        }
      }
    }
  }

  // Color Fill Pass: copy solid pixels at magnified scale
  for (let y = 0; y < logicalHeight; y++) {
    for (let x = 0; x < logicalWidth; x++) {
      const idx = (y * logicalWidth + x) * 4;
      const a = data[idx + 3];
      if (a > 40) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        destCtx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
        destCtx.fillRect((x + pad) * scale, (y + pad) * scale, scale, scale);
      }
    }
  }

  if (cacheKey) {
    spriteCache.set(cacheKey, destCanvas);
  }

  return destCanvas;
}

/**
 * Universal Pixel Sprite Drawing Helper
 */
export function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  x: number,
  y: number,
  anchor: 'center' | 'bottom' = 'center',
  flipX: boolean = false,
  scaleMul: number = 1
) {
  const w = sprite.width * scaleMul;
  const h = sprite.height * scaleMul;
  const drawX = x - w / 2;
  const drawY = anchor === 'bottom' ? y - h : y - h / 2;

  ctx.save();
  if (flipX) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, -w / 2, anchor === 'bottom' ? -h : -h / 2, w, h);
  } else {
    ctx.drawImage(sprite, drawX, drawY, w, h);
  }
  ctx.restore();
}

// ============================================================================
// 1. CULTIVATOR (LÂM MẶC) PIXEL SPRITE GENERATOR
// Tall, slender sword cultivator: Flowing long black hair, white-gray robe, jade belt
// Logical Size: 28 x 48, Scaled by 2 = 56 x 96 True Pixel Art
// ============================================================================

export function getPlayerSprite(
  facing: 'up' | 'down' | 'left' | 'right',
  isWalking: boolean,
  walkTimer: number,
  isCultivating: boolean,
  _robeColorHex: string = '#f1f5f9'
): { sprite: HTMLCanvasElement; flipX: boolean } {
  const step = Math.floor(walkTimer * 6) % 2 === 1;
  const animFrame = isWalking ? (step ? 1 : 2) : 0;
  const cacheKey = `cultivator_lm_${facing}_${animFrame}_${isCultivating ? 'med' : 'act'}`;

  if (spriteCache.has(cacheKey)) {
    return {
      sprite: spriteCache.get(cacheKey)!,
      flipX: facing === 'left',
    };
  }

  const sprite = rasterizeToPixelSprite(
    28,
    48,
    ctx => {
      ctx.imageSmoothingEnabled = false;

      // Color Palette - Tiên Hiệp Trắng Xám Thanh Nhã
      const cSkin = '#fed7aa';
      const cSkinShade = '#fcd34d';
      const cHair = '#090d16';
      const cHairHighlight = '#1e293b';
      const cRobeWhite = '#f8fafc';
      const cRobeGray = '#cbd5e1';
      const cRobeTrim = '#94a3b8';
      const cJadeBelt = '#059669';
      const cJadePendant = '#34d399';
      const cGold = '#f59e0b';
      const cBoot = '#1e293b';

      if (isCultivating) {
        // --- MEDITATION POSE (Kiết Già Tọa Thiền) ---
        // Hair topknot & hair flowing
        ctx.fillStyle = cHair;
        ctx.fillRect(11, 4, 6, 6);
        ctx.fillStyle = cGold;
        ctx.fillRect(10, 6, 8, 2); // Trâm cài vàng
        ctx.fillStyle = cHairHighlight;
        ctx.fillRect(12, 5, 4, 2);

        // Long flowing black hair
        ctx.fillStyle = cHair;
        ctx.fillRect(8, 9, 12, 10);

        // Head & peaceful eyes
        ctx.fillStyle = cSkin;
        ctx.fillRect(10, 9, 8, 8);
        ctx.fillStyle = cSkinShade;
        ctx.fillRect(9, 11, 2, 4);
        ctx.fillRect(17, 11, 2, 4);
        ctx.fillStyle = cHair;
        ctx.fillRect(11, 13, 2, 1);
        ctx.fillRect(15, 13, 2, 1);

        // White-Gray Sage Robe
        ctx.fillStyle = cRobeWhite;
        ctx.fillRect(8, 17, 12, 11);
        ctx.fillStyle = cRobeGray;
        ctx.fillRect(12, 17, 4, 11);
        ctx.fillStyle = cJadeBelt;
        ctx.fillRect(9, 27, 10, 3);
        ctx.fillStyle = cJadePendant;
        ctx.fillRect(13, 28, 2, 5);

        // Meditating hands in lap
        ctx.fillStyle = cRobeGray;
        ctx.fillRect(6, 21, 4, 7);
        ctx.fillRect(18, 21, 4, 7);
        ctx.fillStyle = cSkin;
        ctx.fillRect(11, 26, 6, 3);

        // Folded crossed legs
        ctx.fillStyle = cRobeGray;
        ctx.fillRect(3, 30, 22, 12);
        ctx.fillStyle = cRobeWhite;
        ctx.fillRect(5, 31, 18, 9);
        ctx.fillStyle = cBoot;
        ctx.fillRect(4, 40, 5, 4);
        ctx.fillRect(19, 40, 5, 4);
        return;
      }

      // --- FACING DOWN (FRONT) ---
      if (facing === 'down') {
        // 1. Topknot & Hairpin
        ctx.fillStyle = cHair;
        ctx.fillRect(11, 2, 6, 5);
        ctx.fillStyle = cGold;
        ctx.fillRect(10, 4, 8, 2);
        ctx.fillStyle = cHairHighlight;
        ctx.fillRect(12, 3, 4, 2);

        // Long black hair flowing over shoulders
        ctx.fillStyle = cHair;
        ctx.fillRect(8, 7, 12, 14);
        ctx.fillRect(7, 10, 2, 12);
        ctx.fillRect(19, 10, 2, 12);

        // Face
        ctx.fillStyle = cSkin;
        ctx.fillRect(10, 7, 8, 8);
        ctx.fillStyle = cSkinShade;
        ctx.fillRect(9, 9, 1, 3);
        ctx.fillRect(18, 9, 1, 3);

        // Sharp Tu Tiên Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(11, 9, 2, 2);
        ctx.fillRect(15, 9, 2, 2);
        ctx.fillStyle = '#38bdf8'; // Linh quang nhãn
        ctx.fillRect(12, 10, 1, 1);
        ctx.fillRect(16, 10, 1, 1);

        // Flowing White-Gray Robe (Trường Bào)
        ctx.fillStyle = cRobeWhite;
        ctx.fillRect(7, 15, 14, 13);
        ctx.fillStyle = cRobeGray;
        ctx.fillRect(11, 15, 6, 13);
        ctx.fillStyle = cRobeTrim;
        ctx.fillRect(13, 15, 2, 13);

        // Jade Sash & Pendant
        ctx.fillStyle = cJadeBelt;
        ctx.fillRect(8, 27, 12, 3);
        ctx.fillStyle = cJadePendant;
        ctx.fillRect(13, 28, 2, 6);

        // Lower Robe Skirt (Hem)
        ctx.fillStyle = cRobeWhite;
        ctx.fillRect(7, 30, 14, 11);
        ctx.fillStyle = cRobeGray;
        ctx.fillRect(11, 30, 6, 11);

        // Boots & Walking animation
        if (animFrame === 1) {
          ctx.fillStyle = cBoot;
          ctx.fillRect(8, 41, 4, 6);
          ctx.fillRect(16, 39, 4, 4);
        } else if (animFrame === 2) {
          ctx.fillStyle = cBoot;
          ctx.fillRect(8, 39, 4, 4);
          ctx.fillRect(16, 41, 4, 6);
        } else {
          ctx.fillStyle = cBoot;
          ctx.fillRect(8, 41, 4, 5);
          ctx.fillRect(16, 41, 4, 5);
        }
      } else if (facing === 'up') {
        // --- FACING UP (BACK) ---
        // Topknot & Pin
        ctx.fillStyle = cHair;
        ctx.fillRect(11, 2, 6, 5);
        ctx.fillStyle = cGold;
        ctx.fillRect(10, 4, 8, 2);

        // Back of head & long flowing silky hair to mid-back
        ctx.fillStyle = cHair;
        ctx.fillRect(8, 7, 12, 19);
        ctx.fillStyle = cHairHighlight;
        ctx.fillRect(10, 9, 3, 16);

        // Back Robe
        ctx.fillStyle = cRobeWhite;
        ctx.fillRect(7, 16, 14, 12);
        ctx.fillStyle = cRobeGray;
        ctx.fillRect(9, 16, 10, 12);

        // Belt & lower robe
        ctx.fillStyle = cJadeBelt;
        ctx.fillRect(8, 27, 12, 3);
        ctx.fillStyle = cRobeWhite;
        ctx.fillRect(7, 30, 14, 11);
        ctx.fillStyle = cRobeGray;
        ctx.fillRect(10, 30, 8, 11);

        // Boots
        if (animFrame === 1) {
          ctx.fillStyle = cBoot;
          ctx.fillRect(8, 41, 4, 6);
          ctx.fillRect(16, 39, 4, 4);
        } else if (animFrame === 2) {
          ctx.fillStyle = cBoot;
          ctx.fillRect(8, 39, 4, 4);
          ctx.fillRect(16, 41, 4, 6);
        } else {
          ctx.fillStyle = cBoot;
          ctx.fillRect(8, 41, 4, 5);
          ctx.fillRect(16, 41, 4, 5);
        }
      } else {
        // --- FACING RIGHT (facing === 'right' or 'left' via flipX) ---
        // Topknot & Pin
        ctx.fillStyle = cHair;
        ctx.fillRect(10, 2, 6, 5);
        ctx.fillStyle = cGold;
        ctx.fillRect(13, 4, 4, 2);

        // Profile head & hair
        ctx.fillStyle = cHair;
        ctx.fillRect(7, 7, 9, 17); // Long back hair
        ctx.fillStyle = cSkin;
        ctx.fillRect(12, 7, 6, 7);

        // Profile eye
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(15, 9, 2, 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(16, 9, 1, 1);

        // Side Torso Robe
        ctx.fillStyle = cRobeWhite;
        ctx.fillRect(8, 15, 12, 13);
        ctx.fillStyle = cRobeGray;
        ctx.fillRect(8, 15, 5, 13);

        // Jade Belt
        ctx.fillStyle = cJadeBelt;
        ctx.fillRect(9, 27, 10, 3);
        ctx.fillStyle = cJadePendant;
        ctx.fillRect(15, 29, 2, 6);

        // Flowing robe hem
        ctx.fillStyle = cRobeWhite;
        ctx.fillRect(8, 30, 11, 11);
        ctx.fillStyle = cRobeGray;
        ctx.fillRect(7, 30, 4, 11);

        // Boots
        if (animFrame === 1) {
          ctx.fillStyle = cBoot;
          ctx.fillRect(14, 41, 5, 6);
          ctx.fillRect(8, 39, 4, 4);
        } else if (animFrame === 2) {
          ctx.fillStyle = cBoot;
          ctx.fillRect(7, 41, 5, 6);
          ctx.fillRect(13, 39, 4, 4);
        } else {
          ctx.fillStyle = cBoot;
          ctx.fillRect(9, 41, 5, 5);
          ctx.fillRect(13, 41, 4, 5);
        }
      }
    },
    2,
    cacheKey
  );

  return {
    sprite,
    flipX: facing === 'left',
  };
}

// ============================================================================
// 2. MONSTERS & BEASTS (YÊU THÚ TIÊN HIỆP) SPRITE GENERATOR
// Wolf, Boar, Cultist, Demonic Ape Boss, Scorpion King
// ============================================================================

export function getEnemySprite(enemy: Enemy): HTMLCanvasElement {
  const shape = enemy.shape || (enemy.category === 'boss' ? 'monkey' : 'wolf');
  const isBoss = Boolean(enemy.isBoss || enemy.category === 'boss');
  const cacheKey = `enemy_${shape}_${isBoss ? 'boss' : 'norm'}`;

  if (spriteCache.has(cacheKey)) {
    return spriteCache.get(cacheKey)!;
  }

  let logicalW = 36;
  let logicalH = 32;

  if (shape === 'boar') {
    logicalW = 40;
    logicalH = 32;
  } else if (shape === 'cultist') {
    logicalW = 30;
    logicalH = 44;
  } else if (shape === 'monkey' || shape === 'ape_boss' || isBoss) {
    logicalW = 54;
    logicalH = 54;
  } else if (shape === 'scorpion_king') {
    logicalW = 48;
    logicalH = 40;
  }

  const sprite = rasterizeToPixelSprite(
    logicalW,
    logicalH,
    ctx => {
      ctx.imageSmoothingEnabled = false;

      if (shape === 'boar') {
        // --- THIẾT BÌ DÃ TRƯ (Armored Iron-Hide Boar) ---
        ctx.fillStyle = '#1c1917';
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(10 + i * 4, 4 - (i % 2), 3, 5);
        }

        ctx.fillStyle = '#78350f';
        ctx.fillRect(8, 7, 24, 18);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(6, 10, 28, 14);

        ctx.fillStyle = '#292524';
        ctx.fillRect(10, 10, 6, 7);
        ctx.fillRect(18, 10, 7, 7);
        ctx.fillRect(26, 11, 6, 6);

        ctx.fillStyle = '#9a3412';
        ctx.fillRect(28, 14, 8, 8);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(34, 16, 3, 5);

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(29, 12, 3, 2);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(30, 12, 1, 1);

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(33, 21);
        ctx.lineTo(38, 14);
        ctx.lineTo(36, 22);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1c1917';
        ctx.fillRect(10, 24, 5, 7);
        ctx.fillRect(17, 24, 4, 7);
        ctx.fillRect(24, 24, 5, 7);
        ctx.fillRect(30, 24, 4, 7);
      } else if (shape === 'cultist') {
        // --- HẮC SÁT MA ĐỒ (Evil Cultist) ---
        ctx.fillStyle = '#2e1065';
        ctx.fillRect(8, 4, 14, 12);
        ctx.fillStyle = '#3b0764';
        ctx.fillRect(6, 8, 18, 28);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(10, 9, 10, 7);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(12, 11, 2, 2);
        ctx.fillRect(16, 11, 2, 2);

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(5, 22, 3, 4);
        ctx.fillRect(22, 22, 3, 4);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(24, 8, 2, 32);
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(25, 8, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === 'monkey' || shape === 'ape_boss' || isBoss) {
        // --- BẠCH MAU VIÊN HẦU (Demonic White Ape Boss) ---
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(12, 10, 30, 26);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(10, 14, 34, 22);

        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(4, 16, 10, 24);
        ctx.fillRect(40, 16, 10, 24);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(18, 6, 18, 14);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(16, 4, 22, 6);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(20, 11, 4, 3);
        ctx.fillRect(30, 11, 4, 3);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(22, 12, 2, 2);
        ctx.fillRect(32, 12, 2, 2);

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(23, 17, 3, 4);
        ctx.fillRect(28, 17, 3, 4);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(14, 36, 10, 15);
        ctx.fillRect(30, 36, 10, 15);
      } else {
        // --- THANH KHÊ DÃ LANG (Spiritual Forest Wolf) ---
        ctx.fillStyle = '#334155';
        ctx.fillRect(8, 10, 20, 14);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(6, 12, 24, 11);

        ctx.fillStyle = '#475569';
        ctx.fillRect(24, 8, 9, 9);
        ctx.fillRect(30, 12, 6, 5);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(24, 4, 3, 5);
        ctx.fillRect(28, 4, 3, 5);

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(27, 10, 3, 2);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(33, 14, 2, 2);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(8, 23, 4, 7);
        ctx.fillRect(15, 23, 4, 7);
        ctx.fillRect(22, 23, 4, 7);
        ctx.fillRect(28, 23, 4, 7);
      }
    },
    2,
    cacheKey
  );

  return sprite;
}

// ============================================================================
// 3. NPC SPRITE GENERATOR (LÝ ĐỨC, MẠC LÃO, CHƯỞNG MÔN, ĐAN SƯ, RÈN SƯ...)
// Sắc Nét Chuẩn Tu Sĩ Tiên Hiệp & Phàm Nhân Cổ Trang - Tuyệt Đối Không Hộp Xám
// ============================================================================

export function getNPCSprite(npc: NPC): HTMLCanvasElement {
  const id = npc.id.toLowerCase();
  const name = npc.name.toLowerCase();

  let role: 'ly_duc' | 'mac_lao' | 'sect_master' | 'alchemist' | 'blacksmith' | 'merchant' = 'ly_duc';

  if (id.includes('truong_thon') || name.includes('lý đức') || name.includes('trưởng thôn')) {
    role = 'ly_duc';
  } else if (id.includes('mac_lao') || id.includes('mo_lao') || name.includes('mạc') || name.includes('mặc')) {
    role = 'mac_lao';
  } else if (
    id.includes('chuong_mon') ||
    id.includes('truong_lao') ||
    name.includes('chưởng môn') ||
    name.includes('trưởng lão')
  ) {
    role = 'sect_master';
  } else if (id.includes('dan_su') || name.includes('đan')) {
    role = 'alchemist';
  } else if (id.includes('ren_su') || name.includes('rèn')) {
    role = 'blacksmith';
  } else if (id.includes('thuong_nhan') || name.includes('thương nhân') || name.includes('chủ tiệm')) {
    role = 'merchant';
  }

  const cacheKey = `npc_v2_${role}`;
  if (spriteCache.has(cacheKey)) {
    return spriteCache.get(cacheKey)!;
  }

  const sprite = rasterizeToPixelSprite(
    28,
    48,
    ctx => {
      ctx.imageSmoothingEnabled = false;

      const cSkin = '#fed7aa';
      const cHair = '#090d16';
      const cWhiteHair = '#f8fafc';
      const cSilverHair = '#e2e8f0';

      if (role === 'ly_duc') {
        // --- LÝ ĐỨC (TRƯỞNG THÔN THANH KHÊ) ---
        // Thôn trưởng phàm trần đôn hậu: Áo vải thô nâu xám, búi tóc bạc trâm gỗ, râu chòm dài, gậy trúc đầu rồng
        // 1. Tóc bạc búi cao & trâm gỗ thôn dã
        ctx.fillStyle = cSilverHair;
        ctx.fillRect(11, 2, 6, 5);
        ctx.fillStyle = '#b45309'; // Trâm gỗ
        ctx.fillRect(10, 4, 8, 2);

        // Mái tóc bạc hoa râm
        ctx.fillStyle = cSilverHair;
        ctx.fillRect(9, 7, 10, 8);

        // Khuôn mặt hiền từ & Râu dài bạc phơ
        ctx.fillStyle = cSkin;
        ctx.fillRect(11, 8, 6, 6);
        ctx.fillStyle = '#0f172a'; // Mắt hiền từ
        ctx.fillRect(12, 10, 1, 1);
        ctx.fillRect(15, 10, 1, 1);

        // Chòm râu dài bạc trắng buông trước ngực
        ctx.fillStyle = cWhiteHair;
        ctx.fillRect(11, 14, 6, 9);
        ctx.fillRect(12, 23, 4, 5);

        // Trường bào vải thô nâu xám mộc mạc
        ctx.fillStyle = '#78716c';
        ctx.fillRect(7, 17, 14, 13);
        ctx.fillStyle = '#57534e';
        ctx.fillRect(11, 17, 6, 13);
        ctx.fillStyle = '#44403c'; // Đai lưng thừng
        ctx.fillRect(8, 28, 12, 3);

        // Vạt áo dài qua gối
        ctx.fillStyle = '#78716c';
        ctx.fillRect(7, 31, 14, 11);
        ctx.fillStyle = '#57534e';
        ctx.fillRect(10, 31, 8, 11);

        // Giày vải thôn dã
        ctx.fillStyle = '#292524';
        ctx.fillRect(8, 42, 4, 4);
        ctx.fillRect(16, 42, 4, 4);

        // Gậy trúc du hành đầu rồng
        ctx.fillStyle = '#a16207';
        ctx.fillRect(4, 8, 3, 38);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(3, 6, 6, 4); // Đầu trượng
      } else if (role === 'mac_lao') {
        // --- MẠC TRƯỜNG PHONG (TÁN TU ĐẠI NĂNG THỤ THƯƠNG) ---
        // Tiên phong đạo cốt: Trường bào lam chàm, râu tóc bạc phơ uy nghiêm, tay áo thụng tiên gia, phù triện bay lượn
        // Tóc bạc búi tiên đạo
        ctx.fillStyle = cWhiteHair;
        ctx.fillRect(11, 2, 6, 5);
        ctx.fillStyle = '#38bdf8'; // Trâm ngọc thanh lam
        ctx.fillRect(10, 4, 8, 2);

        // Tóc bạc dài xõa hai bên vai
        ctx.fillStyle = cWhiteHair;
        ctx.fillRect(8, 7, 12, 14);
        ctx.fillRect(7, 10, 2, 12);
        ctx.fillRect(19, 10, 2, 12);

        // Gương mặt tiên nhân
        ctx.fillStyle = cSkin;
        ctx.fillRect(10, 7, 8, 7);
        ctx.fillStyle = '#0284c7'; // Mắt linh khí sâu thẳm
        ctx.fillRect(11, 9, 2, 2);
        ctx.fillRect(15, 9, 2, 2);

        // Chòm râu bạc dài đến ngực
        ctx.fillStyle = cSilverHair;
        ctx.fillRect(11, 14, 6, 11);
        ctx.fillRect(12, 25, 4, 6);

        // Trường bào đạo sĩ Lam Chàm Uy Nghiêm
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(6, 17, 16, 13);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(10, 17, 8, 13);
        ctx.fillStyle = '#60a5fa'; // Vân mây thêu
        ctx.fillRect(12, 19, 4, 9);

        // Đai ngọc lam
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(7, 28, 14, 3);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(13, 29, 2, 5);

        // Vạt áo thụng tiên gia
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(6, 31, 16, 11);
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(9, 31, 10, 11);

        // Giày đạo sĩ
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(8, 42, 4, 4);
        ctx.fillRect(16, 42, 4, 4);

        // Lá bùa Phù Triện Kim Quang lơ lửng bên cạnh
        ctx.fillStyle = '#facc15';
        ctx.fillRect(23, 14, 4, 8);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(24, 16, 2, 4);
      } else if (role === 'sect_master') {
        // --- CHƯỞNG MÔN (TỬ KIM QUÁN, HOÀNG KIM BÀO, PHẤT TRẦN) ---
        ctx.fillStyle = '#facc15';
        ctx.fillRect(9, 2, 10, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(13, 3, 2, 2);

        ctx.fillStyle = cHair;
        ctx.fillRect(9, 7, 10, 7);
        ctx.fillStyle = cSkin;
        ctx.fillRect(11, 7, 6, 7);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(12, 9, 1, 1);
        ctx.fillRect(15, 9, 1, 1);

        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(6, 15, 16, 14);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(10, 15, 8, 14);

        ctx.fillStyle = '#1e40af';
        ctx.fillRect(6, 29, 16, 13);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(8, 29, 12, 3);

        ctx.fillStyle = '#854d0e';
        ctx.fillRect(23, 16, 2, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(21, 10, 6, 10);
      } else if (role === 'alchemist') {
        // --- ĐAN SƯ (HỎA DIỄM BÀO, HỒ LÔ ĐAN DƯỢC) ---
        ctx.fillStyle = cHair;
        ctx.fillRect(10, 3, 8, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(9, 5, 10, 2);
        ctx.fillStyle = cSkin;
        ctx.fillRect(11, 8, 6, 6);

        ctx.fillStyle = '#991b1b';
        ctx.fillRect(7, 15, 14, 25);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(10, 15, 8, 25);

        ctx.fillStyle = '#d97706';
        ctx.fillRect(21, 23, 5, 4);
        ctx.fillRect(22, 27, 4, 6);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(23, 22, 2, 2);
      } else if (role === 'blacksmith') {
        // --- RÈN SƯ (CƠ BẮP, TẠP DỀ DA, BÚA LINH KHÍ) ---
        ctx.fillStyle = '#18181b';
        ctx.fillRect(9, 4, 10, 6);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(10, 8, 8, 7);

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(5, 15, 4, 12);
        ctx.fillRect(19, 15, 4, 12);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(9, 15, 10, 24);

        ctx.fillStyle = '#64748b';
        ctx.fillRect(22, 12, 6, 6);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(24, 18, 2, 18);
      } else {
        // --- THƯƠNG NHÂN (GẤM KIM TUYẾN, KIM NGUYÊN BẢO) ---
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(9, 3, 10, 5);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(13, 4, 2, 2);

        ctx.fillStyle = cSkin;
        ctx.fillRect(10, 8, 8, 6);

        ctx.fillStyle = '#ea580c';
        ctx.fillRect(6, 15, 16, 26);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(11, 15, 6, 26);

        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, 22, 6, 5);
      }
    },
    2,
    cacheKey
  );

  return sprite;
}

// ============================================================================
// 4. PROCEDURAL MAP BACKGROUND GENERATOR
// Zero Checkerboard! Màu Xanh Xám Sương Mù Cổ Trang (#5c7a72 / #68807a)
// Đường mòn uốn lượn liền mạch (ctx.bezierCurveTo), bề rộng lớn, đất đá trầm
// Khóm linh thảo cỏ nhọn có viền tối, tuyệt đối không dùng hình tròn xếp chồng!
// ============================================================================

const mapBgCache = new Map<string, HTMLCanvasElement>();

export function getPixelMapBackground(map: GameMap): HTMLCanvasElement {
  if (mapBgCache.has(map.id)) {
    return mapBgCache.get(map.id)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = map.width;
  canvas.height = map.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  const isSectOrMarket = map.id === 'map_thanh_van_tong' || map.id === 'map_phuong_thi';
  const isVolcano = map.id === 'map_hac_phong_son';
  const isRuins = map.id === 'map_ancient_ruins' || map.id === 'map_hac_phong_bi_canh';

  // Seeded hash
  const hash = (x: number, y: number) => {
    const val = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return val - Math.floor(val);
  };

  // 1. BASE BACKGROUND FILL (Màu Sương Mù Cổ Trang #5c7a72 / #68807a)
  if (isSectOrMarket) {
    ctx.fillStyle = '#334155'; // Thanh Vân Tông & Phường Thị: Xám đá lam cổ kính
    ctx.fillRect(0, 0, map.width, map.height);
  } else if (isVolcano) {
    ctx.fillStyle = '#1c1917'; // Hắc Phong Sơn: Bazan núi lửa nứt nẻ
    ctx.fillRect(0, 0, map.width, map.height);
  } else if (isRuins) {
    ctx.fillStyle = '#1e1b4b'; // Cổ Di Tích: Tường đá ngọc tím sẫm
    ctx.fillRect(0, 0, map.width, map.height);
  } else {
    // Thanh Khê / Linh Vũ / Thanh Phong Sơn: Nền sương mù trầm mặc #5c7a72
    ctx.fillStyle = '#5c7a72';
    ctx.fillRect(0, 0, map.width, map.height);
  }

  // 2. LAYERED MIST & ORGANIC BIOME PATCHES (Không có bất kỳ ô bàn cờ nào)
  const patchStep = 64;
  const pCols = Math.ceil(map.width / patchStep);
  const pRows = Math.ceil(map.height / patchStep);

  for (let r = 0; r < pRows; r++) {
    for (let c = 0; c < pCols; c++) {
      const px = c * patchStep;
      const py = r * patchStep;
      const h = hash(c * 3, r * 3);

      if (isSectOrMarket) {
        // Từng khối đá hoa cương quảng trường lớn
        if (h > 0.5) {
          ctx.fillStyle = h > 0.75 ? '#3b4758' : '#2d3748';
          ctx.fillRect(px, py, patchStep, patchStep);
        }
        // Viền rãnh đá cổ kính
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, patchStep - 1, patchStep - 1);
      } else if (isVolcano) {
        if (h > 0.4) {
          ctx.fillStyle = h > 0.7 ? '#262626' : '#171717';
          ctx.fillRect(px, py, patchStep, patchStep);
        }
        if (h > 0.82) {
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px + 10, py + 20);
          ctx.lineTo(px + 35, py + 45);
          ctx.lineTo(px + 50, py + 40);
          ctx.stroke();
        }
      } else if (isRuins) {
        if (h > 0.45) {
          ctx.fillStyle = h > 0.75 ? '#312e81' : '#1e1b4b';
          ctx.fillRect(px, py, patchStep, patchStep);
        }
        if (h > 0.8) {
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(px + 20, py + 20, 6, 6);
        }
      } else {
        // Sắc thái sương mù hòa quyện nhẹ nhàng
        if (h > 0.6) {
          ctx.fillStyle = '#4f6b64';
          ctx.fillRect(px, py, patchStep, patchStep);
        } else if (h > 0.3) {
          ctx.fillStyle = '#68807a';
          ctx.fillRect(px, py, patchStep, patchStep);
        }
      }
    }
  }

  // 3. KHÓM LINH THẢO / CỎ NHỌN CÓ VIỀN TỐI (Tạo chất tiên hiệp cổ phong)
  const herbStep = 80;
  const hCols = Math.ceil(map.width / herbStep);
  const hRows = Math.ceil(map.height / herbStep);

  for (let r = 0; r < hRows; r++) {
    for (let c = 0; c < hCols; c++) {
      const hx = c * herbStep + (hash(c, r) * 40);
      const hy = r * herbStep + (hash(r, c) * 40);
      const hVal = hash(hx, hy);

      if (!isSectOrMarket && !isVolcano) {
        if (hVal > 0.35) {
          // Vẽ khóm linh thảo 3-4 lá nhọn có viền tối
          const herbColor = hVal > 0.85 ? '#34d399' : '#22c55e';
          ctx.save();
          ctx.translate(hx, hy);

          // Dark outline pass
          ctx.strokeStyle = '#162521';
          ctx.lineWidth = 2.5;
          ctx.fillStyle = herbColor;

          // Lá trái
          ctx.beginPath();
          ctx.moveTo(-8, 6);
          ctx.quadraticCurveTo(-12, -8, -14, -14);
          ctx.quadraticCurveTo(-7, -8, -4, 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Lá giữa cao
          ctx.beginPath();
          ctx.moveTo(-3, 6);
          ctx.quadraticCurveTo(0, -12, 1, -20);
          ctx.quadraticCurveTo(4, -12, 4, 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Lá phải
          ctx.beginPath();
          ctx.moveTo(3, 6);
          ctx.quadraticCurveTo(8, -8, 12, -13);
          ctx.quadraticCurveTo(7, -8, 7, 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Tinh quang linh khí nhỏ
          if (hVal > 0.85) {
            ctx.fillStyle = '#a7f3d0';
            ctx.fillRect(0, -22, 2, 2);
          }
          ctx.restore();
        }
      }
    }
  }

  // 4. CON ĐƯỜNG MÒN UỐN LƯỢN LIỀN MẠCH (ctx.bezierCurveTo - BỀ RỘNG LỚN, ĐẤT ĐÁ TRẦM)
  // Tuyệt đối KHÔNG DÙNG CÁC HÌNH TRÒN XẾP CHỒNG NHAU!
  const waypoints: { x: number; y: number }[] = [];
  const cx = map.width / 2;
  const cy = map.height / 2;

  // Thu thập các mốc trọng yếu: portals, npcs
  map.portals.forEach(p => waypoints.push({ x: p.x, y: p.y }));
  map.npcs.forEach(n => waypoints.push({ x: n.x, y: n.y }));

  if (waypoints.length > 0) {
    const roadBorderCol = isSectOrMarket ? '#1e293b' : (isVolcano ? '#1c1917' : '#33271f');
    const roadFillCol = isSectOrMarket ? '#475569' : (isVolcano ? '#382f2d' : '#6b5849');
    const roadInnerCol = isSectOrMarket ? '#64748b' : (isVolcano ? '#443b39' : '#7c6858');

    waypoints.forEach((wp, wIdx) => {
      // Điểm uốn cong tự nhiên giữa tâm bản đồ và mục tiêu
      const midX = (cx + wp.x) / 2 + Math.sin(wIdx * 1.5) * 60;
      const midY = (cy + wp.y) / 2 + Math.cos(wIdx * 1.5) * 60;

      // 1. Lớp viền đất đá tối (Bề rộng lớn 64px)
      ctx.strokeStyle = roadBorderCol;
      ctx.lineWidth = 64;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(midX, midY, wp.x, wp.y);
      ctx.stroke();

      // 2. Lớp lòng đường đất đá trầm (Bề rộng 50px)
      ctx.strokeStyle = roadFillCol;
      ctx.lineWidth = 50;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(midX, midY, wp.x, wp.y);
      ctx.stroke();

      // 3. Vệt mòn chân người đi bộ (Bề rộng 26px)
      ctx.strokeStyle = roadInnerCol;
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(midX, midY, wp.x, wp.y);
      ctx.stroke();
    });

    // Rải rác vài phiến đá dẹt tự nhiên dọc theo đường (không phải hình tròn sâu róm)
    waypoints.forEach((wp, wIdx) => {
      for (let s = 1; s <= 5; s++) {
        const t = s / 6;
        const midX = (cx + wp.x) / 2 + Math.sin(wIdx * 1.5) * 60;
        const midY = (cy + wp.y) / 2 + Math.cos(wIdx * 1.5) * 60;
        // Điểm trên đường quadratic bezier
        const sx = (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * midX + t * t * wp.x;
        const sy = (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * midY + t * t * wp.y;

        // Phiến đá dẹt đa giác có viền
        ctx.fillStyle = '#8c7d70';
        ctx.strokeStyle = '#292019';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - 7, sy - 2);
        ctx.lineTo(sx + 5, sy - 4);
        ctx.lineTo(sx + 8, sy + 3);
        ctx.lineTo(sx - 4, sy + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  // 5. ĐẠI QUẢNG TRƯỜNG BÁT QUÁI CHO THANH VÂN TÔNG & PHƯỜNG THỊ
  if (isSectOrMarket) {
    const rad = 82;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rad - 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const bx = cx + Math.cos(a) * (rad - 8);
      const by = cy + Math.sin(a) * (rad - 8);
      ctx.fillRect(bx - 5, by - 2, 10, 2);
      ctx.fillRect(bx - 5, by + 2, 10, 2);
    }
  }

  mapBgCache.set(map.id, canvas);
  return canvas;
}

// ============================================================================
// 5. ORIENTAL OBSTACLES (PAGODAS, SPIRIT PINES, ROCK FORMATIONS, PONDS)
// ============================================================================

export function drawPixelObstacle(
  ctx: CanvasRenderingContext2D,
  obs: MapObstacle,
  time: number
) {
  const cx = obs.x + obs.width / 2;
  const cy = obs.y + obs.height;

  // Ground contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, obs.width * 0.45, Math.min(obs.height * 0.25, 16), 0, 0, Math.PI * 2);
  ctx.fill();

  if (obs.type === 'building') {
    // --- ANCIENT ORIENTAL PAGODA / PAVILION ---
    ctx.save();

    // 1. Stone Foundation 3-step podium
    ctx.fillStyle = '#334155';
    ctx.fillRect(obs.x + 4, obs.y + obs.height - 18, obs.width - 8, 14);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(obs.x + 8, obs.y + obs.height - 14, obs.width - 16, 4);

    // 2. Timber Pillars (Crimson Lacquer)
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(obs.x + 8, obs.y + 18, 10, obs.height - 34);
    ctx.fillRect(obs.x + obs.width - 18, obs.y + 18, 10, obs.height - 34);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(obs.x + 8, obs.y + 18, 10, obs.height - 34);
    ctx.strokeRect(obs.x + obs.width - 18, obs.y + 18, 10, obs.height - 34);

    // 3. Chamber Wall & Lattice Doors
    ctx.fillStyle = '#451a03';
    ctx.fillRect(obs.x + 18, obs.y + 24, obs.width - 36, obs.height - 40);
    ctx.fillStyle = '#b45309'; // Carved doors
    ctx.fillRect(obs.x + obs.width / 2 - 12, obs.y + 28, 24, obs.height - 44);

    // 4. Curved Eaves (Mái Ngói Âm Dương Cong Vút)
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(obs.x - 14, obs.y + 24);
    ctx.quadraticCurveTo(obs.x + obs.width / 2, obs.y + 8, obs.x + obs.width + 14, obs.y + 24);
    ctx.lineTo(obs.x + obs.width + 8, obs.y + 14);
    ctx.quadraticCurveTo(obs.x + obs.width / 2, obs.y - 12, obs.x - 8, obs.y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Hanging Red Lanterns with gentle swaying animation
    const lanternBob = Math.sin(time / 200) * 2;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(obs.x + 2, obs.y + 26 + lanternBob, 8, 12);
    ctx.fillRect(obs.x + obs.width - 10, obs.y + 26 + lanternBob, 8, 12);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(obs.x + 4, obs.y + 29 + lanternBob, 4, 6);
    ctx.fillRect(obs.x + obs.width - 8, obs.y + 29 + lanternBob, 4, 6);

    ctx.restore();
  } else if (obs.type === 'tree') {
    // --- ANCIENT SPIRIT PINE TREE ---
    ctx.save();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 7, cy - 36, 14, 34);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(cx - 2, cy - 36, 9, 34);
    ctx.fillRect(cx - 14, cy - 6, 10, 4);
    ctx.fillRect(cx + 4, cy - 6, 10, 4);

    const foliage = [
      { y: cy - 42, r: 32, col: '#14532d' },
      { y: cy - 54, r: 28, col: '#166534' },
      { y: cy - 66, r: 22, col: '#15803d' },
      { y: cy - 76, r: 16, col: '#22c55e' },
    ];

    foliage.forEach(f => {
      ctx.fillStyle = f.col;
      ctx.beginPath();
      ctx.arc(cx, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.restore();
  } else if (obs.type === 'rock') {
    // --- CHISELED POLYGON ROCK WITH SPIRIT CRYSTALS ---
    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(obs.x + 8, cy);
    ctx.lineTo(obs.x + 2, cy - obs.height * 0.6);
    ctx.lineTo(obs.x + obs.width * 0.35, obs.y + 4);
    ctx.lineTo(obs.x + obs.width * 0.75, obs.y);
    ctx.lineTo(obs.x + obs.width - 2, cy - obs.height * 0.5);
    ctx.lineTo(obs.x + obs.width - 6, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(obs.x + obs.width * 0.35, obs.y + 4);
    ctx.lineTo(obs.x + obs.width * 0.75, obs.y);
    ctx.lineTo(obs.x + obs.width - 2, cy - obs.height * 0.5);
    ctx.lineTo(cx, cy - 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 4, cy - obs.height * 0.5, 8, 10);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(cx - 2, cy - obs.height * 0.5 + 2, 4, 6);

    ctx.restore();
  } else if (obs.type === 'water') {
    // --- CLEAR LOTUS POND ---
    ctx.save();
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(cx, cy - obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Lily pad
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(cx - 10, cy - obs.height / 2 + 4, 8, 0, Math.PI * 1.8);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(cx - 11, cy - obs.height / 2 + 2, 3, 3);

    ctx.restore();
  } else {
    // Wall
    ctx.fillStyle = '#334155';
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
  }
}

// ============================================================================
// 6. COLLECTIBLE RESOURCES (HERBS, ORES, STELES, ALTARS)
// ============================================================================

export function drawPixelResource(
  ctx: CanvasRenderingContext2D,
  res: CollectibleResource,
  time: number
) {
  if (res.collected && res.currentRespawnTimer > 0) return;

  const bob = Math.sin(time / 240 + res.x) * 3;
  const drawY = res.y + bob;

  if (res.type === 'herb') {
    // Spirit Herb (Ngưng Huyết Thảo / U Lan)
    const herbCol = res.itemId.includes('dia') || res.name.includes('Huyết') ? '#f43f5e' : (res.name.includes('Lan') ? '#c084fc' : '#22c55e');
    ctx.fillStyle = herbCol;
    ctx.beginPath();
    ctx.moveTo(res.x - 7, drawY);
    ctx.lineTo(res.x - 12, drawY - 14);
    ctx.lineTo(res.x - 3, drawY - 4);
    ctx.lineTo(res.x, drawY - 18);
    ctx.lineTo(res.x + 3, drawY - 4);
    ctx.lineTo(res.x + 12, drawY - 14);
    ctx.lineTo(res.x + 7, drawY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(res.x - 1.5, drawY - 19, 3, 3);
  } else if (res.type === 'ore') {
    // Spirit Crystal Ore (Huyền Thiết / Xích Đồng)
    ctx.fillStyle = '#475569';
    ctx.fillRect(res.x - 12, drawY - 10, 24, 18);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(res.x - 6, drawY - 14, 12, 12);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(res.x - 3, drawY - 12, 4, 4);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(res.x - 12, drawY - 10, 24, 18);
  } else if (res.type === 'stele') {
    // Ancient Monument Stele (Ngộ Đạo Cổ Bi)
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(res.x - 14, drawY - 32, 28, 40);
    ctx.fillStyle = '#4338ca';
    ctx.fillRect(res.x - 12, drawY - 30, 24, 36);

    // Glowing ancient rune inscriptions
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(res.x - 8, drawY - 24, 16, 2);
    ctx.fillRect(res.x - 6, drawY - 18, 12, 2);
    ctx.fillRect(res.x - 9, drawY - 12, 18, 2);
    ctx.fillRect(res.x - 5, drawY - 6, 10, 2);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(res.x - 14, drawY - 32, 28, 40);
  } else if (res.type === 'altar') {
    // Sealing Altar (Phong Ấn Tế Đàn)
    ctx.fillStyle = '#334155';
    ctx.fillRect(res.x - 20, drawY - 12, 40, 20);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(res.x - 16, drawY - 16, 32, 6);

    // Hovering Seal Crystal
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(res.x, drawY - 36);
    ctx.lineTo(res.x + 8, drawY - 26);
    ctx.lineTo(res.x, drawY - 16);
    ctx.lineTo(res.x - 8, drawY - 26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
