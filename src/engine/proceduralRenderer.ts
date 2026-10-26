import { GameMap, NPC, Enemy, PlayerStats, CollectibleResource, AoEZone, AdvancedProjectile } from '../types/game';

export type MapObstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rock' | 'tree' | 'building' | 'water' | 'wall';
};

export interface ProjectileVisual {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fromPlayer: boolean;
  element: string;
}

// ============================================================================
// PREMIUM 2.5D CHINESE XIANXIA ACTION RPG PROCEDURAL RENDER ENGINE
// High-DPI Anti-Aliased Vector & Painterly Chinese Ink-Wash Aesthetics
// Zero low-res pixelation, Zero emoji, Zero generic geometric shortcuts
// ============================================================================

const mapBgCache = new Map<string, HTMLCanvasElement>();

export function clearMapBackgroundCache(mapId?: string) {
  if (mapId) {
    mapBgCache.delete(mapId);
  } else {
    mapBgCache.clear();
  }
}

/**
 * 1. PROCEDURAL 2.5D XIANXIA TERRAIN (THANH KHÊ THÔN & WORLD BIOMES)
 * Multi-layer misty ground, organic slate cobblestone roads, and clear streams
 */
export function getMapBackground(map: GameMap): HTMLCanvasElement {
  if (mapBgCache.has(map.id)) {
    return mapBgCache.get(map.id)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = map.width;
  canvas.height = map.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;

  const isSectOrMarket = map.id === 'map_thanh_van_tong' || map.id === 'map_phuong_thi';
  const isVolcano = map.id === 'map_hac_phong_son';
  const isRuins = map.id === 'map_ancient_ruins' || map.id === 'map_hac_phong_bi_canh';
  const isThanhKhe = map.id === 'map_thanh_khe';

  const hash = (x: number, y: number) => {
    const val = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return val - Math.floor(val);
  };

  // 1. BASE ATMOSPHERIC GROUND
  if (isSectOrMarket) {
    ctx.fillStyle = '#1e293b'; // Sect grand stone plaza
  } else if (isVolcano) {
    ctx.fillStyle = '#18181b'; // Basalt magma crags
  } else if (isRuins) {
    ctx.fillStyle = '#17153b'; // Ancient violet ruins
  } else {
    // Thanh Khê Thôn & Valleys: Deep rich Guohua jade-wash mountain valley earth
    ctx.fillStyle = '#2b4438';
  }
  ctx.fillRect(0, 0, map.width, map.height);

  // 1.1 DISTANT GUOHUA INK MOUNTAINS & HORIZON MIST (NỀN XA THỦY MẶC)
  if (isThanhKhe || (!isSectOrMarket && !isVolcano)) {
    ctx.save();
    // Far layer mountains (Soft slate-indigo ink silhouette)
    ctx.fillStyle = '#182d30';
    ctx.beginPath();
    ctx.moveTo(0, 100);
    for (let mx = 0; mx <= map.width; mx += 140) {
      const peakH = 40 + Math.sin(mx * 0.007) * 32 + Math.cos(mx * 0.018) * 16;
      ctx.quadraticCurveTo(mx + 70, peakH, mx + 140, 95 + Math.sin(mx * 0.014) * 14);
    }
    ctx.lineTo(map.width, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Mid layer mountains (Forest jade-charcoal wash)
    ctx.fillStyle = '#16382a';
    ctx.beginPath();
    ctx.moveTo(0, 125);
    for (let mx = 0; mx <= map.width; mx += 120) {
      const peakH = 60 + Math.sin(mx * 0.011 + 1) * 36 + Math.cos(mx * 0.024) * 20;
      ctx.quadraticCurveTo(mx + 60, peakH, mx + 120, 115 + Math.sin(mx * 0.018) * 16);
    }
    ctx.lineTo(map.width, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Morning Mountain Mist Gradient (Lan tỏa sương mờ chân núi)
    const mistGrad = ctx.createLinearGradient(0, 60, 0, 145);
    mistGrad.addColorStop(0, 'rgba(15, 30, 25, 0)');
    mistGrad.addColorStop(0.65, 'rgba(43, 68, 56, 0.55)');
    mistGrad.addColorStop(1, 'rgba(43, 68, 56, 0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 50, map.width, 95);
    ctx.restore();
  }

  // 2. LAYERED ORGANIC BIOME PATCHES (Rich Painterly Ink-Wash Transitions)
  const patchStep = 60;
  const pCols = Math.ceil(map.width / patchStep);
  const pRows = Math.ceil(map.height / patchStep);

  for (let r = 0; r < pRows; r++) {
    for (let c = 0; c < pCols; c++) {
      const px = c * patchStep + (hash(c, r) - 0.5) * 24;
      const py = r * patchStep + (hash(r, c) - 0.5) * 24;
      const h = hash(c * 7, r * 13);

      if (isSectOrMarket) {
        // Imperial slate flagstones
        if (h > 0.45) {
          ctx.fillStyle = h > 0.75 ? '#334155' : '#273549';
          ctx.beginPath();
          ctx.roundRect(px, py, patchStep - 2, patchStep - 2, 4);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, patchStep - 1, patchStep - 1);
      } else if (isVolcano) {
        if (h > 0.35) {
          const rGrad = ctx.createRadialGradient(px + 30, py + 30, 5, px + 30, py + 30, 55);
          rGrad.addColorStop(0, h > 0.7 ? '#27201e' : '#1c1716');
          rGrad.addColorStop(1, 'rgba(24, 24, 27, 0)');
          ctx.fillStyle = rGrad;
          ctx.beginPath();
          ctx.ellipse(px + 30, py + 30, 50, 40, h * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Thanh Khê Thôn: Layered soft moss knolls & damp forest soil gradients
        if (h > 0.25) {
          const rGrad = ctx.createRadialGradient(px + 30, py + 30, 6, px + 30, py + 30, 54);
          const col1 = h > 0.75 ? 'rgba(30, 64, 46, 0.85)' : h > 0.5 ? 'rgba(44, 82, 60, 0.75)' : 'rgba(56, 102, 76, 0.6)';
          rGrad.addColorStop(0, col1);
          rGrad.addColorStop(0.7, 'rgba(38, 70, 52, 0.35)');
          rGrad.addColorStop(1, 'rgba(43, 68, 56, 0)');
          ctx.fillStyle = rGrad;
          ctx.beginPath();
          ctx.ellipse(px + 30, py + 30, 52 + h * 18, 38 + h * 14, h * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // 3. THANH KHÊ STREAM / CELESTIAL BROOK (Eastern side winding waterway)
  if (isThanhKhe) {
    const riverStartX = 640;
    ctx.save();

    // Outer River Bed Depression
    ctx.fillStyle = 'rgba(12, 38, 32, 0.75)';
    ctx.beginPath();
    ctx.moveTo(riverStartX - 15, 0);
    ctx.bezierCurveTo(riverStartX + 70, 380, riverStartX - 75, 780, riverStartX + 30, map.height);
    ctx.lineTo(riverStartX + 205, map.height);
    ctx.bezierCurveTo(riverStartX + 85, 780, riverStartX + 225, 380, riverStartX + 145, 0);
    ctx.closePath();
    ctx.fill();

    // Main Stream Water Bed (Multi-stop turquoise-jade depth)
    const waterGrad = ctx.createLinearGradient(riverStartX, 0, riverStartX + 160, 0);
    waterGrad.addColorStop(0, '#09252c');
    waterGrad.addColorStop(0.25, '#0e7490');
    waterGrad.addColorStop(0.55, '#06b6d4');
    waterGrad.addColorStop(0.8, '#0891b2');
    waterGrad.addColorStop(1, '#09252c');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(riverStartX, 0);
    ctx.bezierCurveTo(riverStartX + 80, 400, riverStartX - 60, 800, riverStartX + 40, map.height);
    ctx.lineTo(riverStartX + 180, map.height);
    ctx.bezierCurveTo(riverStartX + 60, 800, riverStartX + 200, 400, riverStartX + 120, 0);
    ctx.closePath();
    ctx.fill();

    // Rocky Mossy Banks (Both shores lined with natural river pebbles)
    ctx.strokeStyle = '#183329';
    ctx.lineWidth = 5;
    ctx.stroke();

    for (let by = 20; by < map.height; by += 45) {
      const bxL = riverStartX + Math.sin(by * 0.04) * 35;
      const bxR = riverStartX + 160 + Math.cos(by * 0.04) * 30;
      // Left Shore Pebble
      ctx.fillStyle = by % 2 === 0 ? '#4b5563' : '#374151';
      ctx.beginPath();
      ctx.ellipse(bxL - 6, by, 7, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Right Shore Pebble
      ctx.fillStyle = by % 3 === 0 ? '#6b7280' : '#4b5563';
      ctx.beginPath();
      ctx.ellipse(bxR + 6, by, 8, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gentle Water Caustics / Sun Reflections
    ctx.strokeStyle = 'rgba(207, 250, 254, 0.45)';
    ctx.lineWidth = 1.8;
    for (let wy = 40; wy < map.height; wy += 70) {
      const wx = riverStartX + 45 + Math.sin(wy * 0.06) * 22;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.bezierCurveTo(wx + 20, wy + 8, wx + 40, wy + 4, wx + 60, wy + 14);
      ctx.stroke();
    }

    // Wooden Bridge across stream for players
    const bridgeY = 560;
    // Shadow under bridge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(riverStartX - 25, bridgeY - 26, 190, 68);

    // Stone Abutments on both shores
    ctx.fillStyle = '#475569';
    ctx.fillRect(riverStartX - 28, bridgeY - 32, 22, 64);
    ctx.fillRect(riverStartX + 148, bridgeY - 32, 22, 64);

    // Weathered Timber Beams
    ctx.fillStyle = '#382216';
    ctx.fillRect(riverStartX - 20, bridgeY - 28, 180, 56);

    // Horizontal Planks with woodgrain
    for (let bx = riverStartX - 18; bx < riverStartX + 158; bx += 12) {
      ctx.fillStyle = (bx % 2 === 0) ? '#5c3a21' : '#6d4527';
      ctx.fillRect(bx, bridgeY - 26, 10, 52);
      ctx.strokeStyle = '#27170c';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, bridgeY - 26, 10, 52);
    }

    // Guard Rails & Carved Posts
    ctx.fillStyle = '#8c5932';
    ctx.fillRect(riverStartX - 24, bridgeY - 30, 188, 4);
    ctx.fillRect(riverStartX - 24, bridgeY + 26, 188, 4);
    // Posts
    [-20, 30, 90, 154].forEach(pxOff => {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(riverStartX + pxOff, bridgeY - 34, 6, 8);
      ctx.fillRect(riverStartX + pxOff, bridgeY + 26, 6, 8);
    });

    ctx.restore();
  }

  // 4. VILLAGE ELDER TAIJI PLAZA (Thanh Khê Thôn Đình Viện)
  if (isThanhKhe) {
    const plazaX = 420;
    const plazaY = 380;
    ctx.save();

    // Outer Cobblestone Circle
    ctx.fillStyle = 'rgba(71, 85, 105, 0.45)';
    ctx.beginPath();
    ctx.ellipse(plazaX, plazaY, 85, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Concentric Granite Flagstone Rings
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(plazaX, plazaY, 65, 34, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Carved Yin-Yang Taiji Center in Stone
    ctx.fillStyle = 'rgba(241, 245, 249, 0.25)';
    ctx.beginPath();
    ctx.ellipse(plazaX, plazaY, 28, 14, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(plazaX, plazaY, 28, 14, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 5. ORGANIC COBBLESTONE THOROUGHFARE
  const waypoints: { x: number; y: number }[] = [];
  const cx = map.width / 2;
  const cy = map.height / 2;
  map.portals.forEach(p => waypoints.push({ x: p.x, y: p.y }));
  map.npcs.forEach(n => waypoints.push({ x: n.x, y: n.y }));

  if (waypoints.length > 0) {
    const roadBorder = isSectOrMarket ? '#0f172a' : '#1a2b22';
    const roadBed = isSectOrMarket ? '#334155' : '#4a3f35';
    const roadCenter = isSectOrMarket ? '#475569' : '#645447';

    waypoints.forEach((wp, wIdx) => {
      const midX = (cx + wp.x) / 2 + Math.sin(wIdx * 1.4) * 65;
      const midY = (cy + wp.y) / 2 + Math.cos(wIdx * 1.4) * 65;

      // Soft Earth Boundary
      ctx.strokeStyle = roadBorder;
      ctx.lineWidth = 66;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(midX, midY, wp.x, wp.y);
      ctx.stroke();

      // Main Road Bed
      ctx.strokeStyle = roadBed;
      ctx.lineWidth = 50;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(midX, midY, wp.x, wp.y);
      ctx.stroke();

      // Inner Cobblestone Tread
      ctx.strokeStyle = roadCenter;
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(midX, midY, wp.x, wp.y);
      ctx.stroke();
    });

    // Paved Stone Flagstones along path
    waypoints.forEach((wp, wIdx) => {
      for (let s = 1; s <= 7; s++) {
        const t = s / 8;
        const midX = (cx + wp.x) / 2 + Math.sin(wIdx * 1.4) * 65;
        const midY = (cy + wp.y) / 2 + Math.cos(wIdx * 1.4) * 65;
        const sx = (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * midX + t * t * wp.x;
        const sy = (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * midY + t * t * wp.y;

        ctx.fillStyle = s % 2 === 0 ? '#78716c' : '#57534e';
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 9, 6, (s * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  // 5. WILD SPIRIT FLORA (Delicate tufts of sword-grass and wild lotuses)
  if (!isSectOrMarket && !isVolcano) {
    const fStep = 90;
    for (let gy = 40; gy < map.height; gy += fStep) {
      for (let gx = 40; gx < map.width; gx += fStep) {
        const hv = hash(gx * 1.1, gy * 1.7);
        if (hv > 0.4) {
          ctx.save();
          ctx.translate(gx + hv * 20, gy + (1 - hv) * 20);
          ctx.strokeStyle = '#132e26';
          ctx.lineWidth = 2;
          ctx.fillStyle = hv > 0.75 ? '#34d399' : '#10b981';

          // Center blade
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-2, -14, 0, -22);
          ctx.quadraticCurveTo(3, -12, 0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Left blade
          ctx.beginPath();
          ctx.moveTo(-3, 0);
          ctx.quadraticCurveTo(-9, -10, -12, -16);
          ctx.quadraticCurveTo(-6, -8, -1, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Right blade
          ctx.beginPath();
          ctx.moveTo(2, 0);
          ctx.quadraticCurveTo(7, -8, 11, -15);
          ctx.quadraticCurveTo(6, -6, 0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Glowing spiritual pollen
          if (hv > 0.85) {
            ctx.fillStyle = '#a7f3d0';
            ctx.beginPath();
            ctx.arc(0, -24, 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }
    }
  }

  // 6. Border Daoist Talisman Seal Barrier
  ctx.strokeStyle = isVolcano ? '#dc2626' : '#d97706';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, map.width - 6, map.height - 6);
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(7, 7, map.width - 14, map.height - 14);

  mapBgCache.set(map.id, canvas);
  return canvas;
}

/**
 * 2. CULTIVATOR LÂM MẶC (2.5D CỔ PHONG TIÊN HIỆP)
 * Proportions: 1:6.5 Head-to-Body ratio, billowing white-gray Hanfu, floating bamboo sword, Bagua Array
 */
export function renderXianxiaPlayer(
  ctx: CanvasRenderingContext2D,
  p: PlayerStats,
  time: number,
  walkTimer: number,
  isWalking: boolean,
  isCultivating: boolean,
  idleBob: number,
  attackAnim?: { active: boolean; angle: number; progress: number; step?: number },
  castingAnim?: { active: boolean; type: string; progress: number }
) {
  const isInvuln = (p.invulnerableTimer || 0) > 0;
  ctx.save();
  if (isInvuln && Math.floor(time / 70) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  const footX = p.x;
  const footY = p.y + 14;

  // 1. ROTATING 2.5D JADE BAGUA FORMATION (BÁT QUÁI LINH TRẬN DƯỚI CHÂN)
  ctx.save();
  const bgAngle = time / 1800;
  const arrayY = footY;

  // Outer jade radiance bloom
  const auraGrad = ctx.createRadialGradient(footX, arrayY, 4, footX, arrayY, 52);
  auraGrad.addColorStop(0, 'rgba(52, 211, 153, 0.5)');
  auraGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.25)');
  auraGrad.addColorStop(1, 'rgba(5, 150, 105, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.ellipse(footX, arrayY, 52, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Double jade rings with 2.5D perspective
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(footX, arrayY, 42, 16, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(footX, arrayY, 28, 10.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 8 Rotating Trigram Glyphs (Càn Khảm Cấn Chấn Tốn Ly Khôn Đoài)
  const trigrams = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
  ctx.fillStyle = '#6ee7b7';
  ctx.font = 'bold 9px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 8; i++) {
    const a = bgAngle + (i * Math.PI * 2) / 8;
    const tx = footX + Math.cos(a) * 35;
    const ty = arrayY + Math.sin(a) * 13;
    ctx.fillText(trigrams[i], tx, ty);
  }

  // Taiji Yin-Yang Center
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(footX, arrayY, 8, 3.2, bgAngle, 0, Math.PI);
  ctx.stroke();
  ctx.restore();

  // 2. CULTIVATOR GROUND CONTACT SHADOW
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(footX, footY, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. CULTIVATOR ANATOMY (2.5D CỔ PHONG)
  // 3. CULTIVATOR ANATOMY (2.5D CỔ PHONG & MARTIAL ARTS KINEMATICS)
  const isAttacking = attackAnim && attackAnim.active;
  const isCasting = castingAnim && castingAnim.active;

  // Calculate dynamic physical weight shift and body kinematics
  let bodyLeanX = 0;
  let bodyLeanY = 0;
  let bodyAngle = 0;
  let attackLegL = 0;
  let attackLegR = 0;
  let attackRobeWave = 0;

  if (isAttacking) {
    const prog = attackAnim.progress;
    const step = attackAnim.step || 1;
    if (step === 1) {
      // ĐÒN 1: HOÀNH TẢO — Windup (0.0-0.2) -> Swift Horizontal Slash (0.2-0.65) -> Recovery (0.65-1.0)
      if (prog < 0.2) {
        const t = prog / 0.2;
        bodyLeanX = -3 * t;
        bodyAngle = -0.12 * t;
        attackLegL = -2 * t;
        attackLegR = 1 * t;
        attackRobeWave = 2 * t;
      } else if (prog < 0.65) {
        const t = (prog - 0.2) / 0.45;
        bodyLeanX = -3 + 8 * t; // Forward drive
        bodyAngle = -0.12 + 0.35 * t; // Forward torso rotation
        attackLegL = -2 + 4 * t;
        attackLegR = 1 - 3 * t;
        attackRobeWave = -6 * Math.sin(t * Math.PI);
      } else {
        const t = (prog - 0.65) / 0.35;
        bodyLeanX = 5 * (1 - t);
        bodyAngle = 0.23 * (1 - t);
        attackRobeWave = 2 * (1 - t);
      }
    } else if (step === 2) {
      // ĐÒN 2: NGHỊCH PHONG — Weight drops to rear foot, upward reverse diagonal cut
      if (prog < 0.2) {
        const t = prog / 0.2;
        bodyLeanX = -3 * t;
        bodyLeanY = 3 * t;
        bodyAngle = -0.16 * t;
        attackLegL = -3 * t;
        attackLegR = 2 * t;
      } else if (prog < 0.7) {
        const t = (prog - 0.2) / 0.5;
        bodyLeanX = -3 + 6 * t;
        bodyLeanY = 3 - 5 * t; // Rise up
        bodyAngle = -0.16 + 0.42 * t; // Upward twist
        attackRobeWave = -7 * Math.sin(t * Math.PI);
      } else {
        const t = (prog - 0.7) / 0.3;
        bodyLeanX = 3 * (1 - t);
        bodyLeanY = -2 * (1 - t);
        bodyAngle = 0.26 * (1 - t);
      }
    } else {
      // ĐÒN 3: PHÁCH KHÔNG — Gather Charge (0.0-0.3) -> Heavy Downward Cleave (0.3-0.7) -> Recovery (0.7-1.0)
      if (prog < 0.3) {
        const t = prog / 0.3;
        bodyLeanY = 6 * t; // Deep crouch
        bodyLeanX = -2 * t;
        bodyAngle = -0.10 * t;
        attackLegL = -4 * t;
        attackLegR = 4 * t;
        attackRobeWave = 4 * t;
      } else if (prog < 0.7) {
        const t = (prog - 0.3) / 0.4;
        bodyLeanY = 6 - 4 * t;
        bodyLeanX = -2 + 10 * t; // Massive forward plunge
        bodyAngle = -0.10 + 0.48 * t; // Torso bowing downward
        attackLegL = -4 + 7 * t;
        attackLegR = 4 - 7 * t;
        attackRobeWave = -10 * Math.sin(t * Math.PI);
      } else {
        const t = (prog - 0.7) / 0.3;
        bodyLeanY = 2 * (1 - t);
        bodyLeanX = 8 * (1 - t);
        bodyAngle = 0.38 * (1 - t);
      }
    }
  }

  ctx.save();
  ctx.translate(p.x + bodyLeanX, p.y + idleBob + bodyLeanY);

  const flipX = p.facing === 'left';
  if (flipX) ctx.scale(-1, 1);

  // Apply martial torso torque angle
  ctx.rotate(bodyAngle);

  // Walk cycle animation offsets
  const walkPhase = Math.sin(walkTimer * 0.8);
  const legOffsetL = isWalking ? walkPhase * 6 : attackLegL;
  const legOffsetR = isWalking ? -walkPhase * 6 : attackLegR;
  const robeFlutter = isWalking ? Math.sin(time / 120) * 4 : attackRobeWave;

  // Layer A: Flowing Back Hair (Raven black hair with physics inertia)
  ctx.fillStyle = '#0a0d14';
  ctx.beginPath();
  ctx.moveTo(-6, -42);
  ctx.bezierCurveTo(-14 - robeFlutter * 0.4, -28, -12 + robeFlutter, -14, -8 + robeFlutter, -2);
  ctx.lineTo(2, -2);
  ctx.bezierCurveTo(4, -18, 6, -32, 4, -42);
  ctx.closePath();
  ctx.fill();

  // Layer B: Legs & Dark Leather Boots (With stances)
  ctx.fillStyle = '#1e293b'; // Left leg/boot
  ctx.fillRect(-7 + legOffsetL, 4, 6, 12);
  ctx.fillStyle = '#334155'; // Right leg/boot
  ctx.fillRect(1 + legOffsetR, 4, 6, 12);

  // Layer C: Flowing Pleated Lower Hanfu Robe
  ctx.fillStyle = '#cbd5e1'; // Inner shadow skirt
  ctx.beginPath();
  ctx.moveTo(-11, -12);
  ctx.lineTo(-14 + robeFlutter, 8);
  ctx.lineTo(14 - robeFlutter, 8);
  ctx.lineTo(11, -12);
  ctx.closePath();
  ctx.fill();

  // Outer White-Gray Silk Robe
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(-10, -14);
  ctx.bezierCurveTo(-12, -2, -13 + robeFlutter, 4, -12 + robeFlutter, 6);
  ctx.lineTo(12 - robeFlutter, 6);
  ctx.bezierCurveTo(11, 2, 10, -6, 10, -14);
  ctx.closePath();
  ctx.fill();

  // Layer D: Torso & Crossed Lapel (Giao Lĩnh Cổ Phong)
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(-10, -34);
  ctx.lineTo(10, -34);
  ctx.lineTo(9, -14);
  ctx.lineTo(-9, -14);
  ctx.closePath();
  ctx.fill();

  // Cyan Silk Lapel Trim
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -34);
  ctx.lineTo(4, -16);
  ctx.moveTo(8, -34);
  ctx.lineTo(-2, -18);
  ctx.stroke();

  // Layer E: Jade Waistband & Talisman Cord
  ctx.fillStyle = '#0f172a'; // Obsidian belt
  ctx.fillRect(-10, -16, 20, 5);
  ctx.fillStyle = '#10b981'; // Imperial green jade clasp
  ctx.fillRect(-3, -17, 6, 7);
  // Red silk tassel cord
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(1 + robeFlutter * 0.5, 2);
  ctx.stroke();

  // Layer F: Dynamic Billowing Daoist Sleeves & Weapon in Hand
  if (isAttacking) {
    const slashProgress = attackAnim.progress;
    const step = attackAnim.step || 1;

    if (step === 1) {
      // ========================================================
      // COMBO 1: HOÀNH TẢO KIẾM KHÍ (Horizontal Slash - Elegant Crisp Blade)
      // ========================================================
      const armAngle = -0.9 + slashProgress * 2.2;

      // Left Arm: Drawn back into Taoist sword-seal (Kiếm Quyết) balance pose
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(-10, -32);
      ctx.bezierCurveTo(-22, -24, -26, -14, -20, -4);
      ctx.lineTo(-12, -8);
      ctx.closePath();
      ctx.fill();

      // Left Hand: Two fingers extended (Sword Seal)
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-22, -4, 4, 4);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-25, -5, 3, 2); // Cyan fingertip qi point

      // Weapon Ghost After-Image 1 (Trailing Motion Blur)
      if (slashProgress > 0.25) {
        ctx.save();
        ctx.translate(8, -28);
        ctx.rotate(armAngle - 0.28);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.fillRect(20, -2, 38, 4);
        ctx.restore();
      }

      // Right Arm: Swinging horizontal with shoulder extension
      ctx.save();
      ctx.translate(8, -28);
      ctx.rotate(armAngle);

      // Billowing White Daoist Sleeve
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.bezierCurveTo(14, -9, 22, -3, 25, 6);
      ctx.lineTo(9, 8);
      ctx.closePath();
      ctx.fill();

      // Cyan Silk Cuff
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(18, 1, 4, 6);

      // Hand
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(21, 2, 5, 5);

      // Procedural Thanh Trúc Kiếm in hand
      ctx.save();
      ctx.translate(23, 4);
      ctx.rotate(0.15);

      // Sword Qi Aura Sheath
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(0, -6, 42, 12);

      // Jade Steel Blade
      ctx.fillStyle = '#059669';
      ctx.fillRect(0, -3, 38, 6);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(2, -1.2, 34, 2.4);
      // Razor Spine & Tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(42, 0);
      ctx.lineTo(38, -3.5);
      ctx.lineTo(38, 3.5);
      ctx.closePath();
      ctx.fill();

      // Ornate Gold Guard
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3, -6, 5, 12);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-1, -7, 2, 14);

      // Grip & Pommel
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-9, -1.5, 7, 3);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-11, -2.5, 2.5, 5);

      // Fluttering Crimson Tassel
      const tasselWave = Math.sin(time / 90) * 3;
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.quadraticCurveTo(-15, 4 + tasselWave, -18, 9 + tasselWave);
      ctx.stroke();

      ctx.restore();
      ctx.restore();
    } else if (step === 2) {
      // ========================================================
      // COMBO 2: NGHỊCH PHONG KIẾM (Reverse Upward Slash - Emerald Wind)
      // ========================================================
      const armAngle = 0.9 - slashProgress * 2.3;

      // Left Arm: Drawn in to support near chest
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-10, -30);
      ctx.bezierCurveTo(-16, -26, -14, -18, -6, -20);
      ctx.lineTo(-4, -16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-5, -18, 4, 4);

      // Ghost Echo Blade trace
      if (slashProgress > 0.22) {
        ctx.save();
        ctx.translate(6, -24);
        ctx.rotate(armAngle + 0.32);
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = 'rgba(52, 211, 153, 0.6)';
        ctx.fillRect(18, -2, 40, 5);
        ctx.restore();
      }

      // Right Arm sweeping upward from lower hip to high shoulder
      ctx.save();
      ctx.translate(6, -24);
      ctx.rotate(armAngle);

      // Dynamic Sleeve
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.bezierCurveTo(12, 11, 21, 5, 24, -4);
      ctx.lineTo(9, -8);
      ctx.closePath();
      ctx.fill();

      // Hand
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(20, -4, 5, 5);

      // Sword tilted at upward reverse angle
      ctx.save();
      ctx.translate(22, -2);
      ctx.rotate(-0.4);

      // Emerald Wind Aura
      ctx.fillStyle = 'rgba(52, 211, 153, 0.42)';
      ctx.fillRect(0, -6, 44, 12);

      // Blade body
      ctx.fillStyle = '#047857';
      ctx.fillRect(0, -3, 40, 6);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(2, -1.2, 36, 2.4);

      // Razor tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(44, 0);
      ctx.lineTo(40, -3.5);
      ctx.lineTo(40, 3.5);
      ctx.closePath();
      ctx.fill();

      // Gold Guard & Tassel
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3, -6, 5, 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-9, -1.5, 7, 3);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-11, -2.5, 2.5, 5);

      const tasselWave = Math.sin(time / 90) * 3;
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.quadraticCurveTo(-14, -5 + tasselWave, -16, -10 + tasselWave);
      ctx.stroke();

      ctx.restore();
      ctx.restore();
    } else {
      // ========================================================
      // COMBO 3: PHÁCH KHÔNG TUYỆT TRẢM (Heavy Overhead Cleave - Maximum Weight)
      // ========================================================
      // Progress 0.0 - 0.3: Gather Charge high overhead
      // Progress 0.3 - 0.7: Heavy downward plunge
      // Progress 0.7 - 1.0: Impact recoil
      let armAngle = -1.4;
      if (slashProgress < 0.3) {
        armAngle = -1.4 - (slashProgress / 0.3) * 0.3; // Raise higher
      } else if (slashProgress < 0.7) {
        const t = (slashProgress - 0.3) / 0.4;
        armAngle = -1.7 + t * 2.8; // Downward heave
      } else {
        armAngle = 1.1; // Ground rest
      }

      // Two-handed overhead grip plunging down
      ctx.save();
      ctx.translate(2, -34);
      ctx.rotate(armAngle);

      // Both Sleeves meeting on grip
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-7, -4, 14, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-5, 4, 10, 8);

      // Both Hands
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-4, 10, 8, 6);

      // Blazing Imperial Greatsword descending
      ctx.save();
      ctx.translate(0, 15);

      // Massive Golden Aura Bloom
      ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
      ctx.fillRect(-8, 0, 16, 52);

      // Dual-toned Greatsword Blade
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-4.5, 0, 9, 46);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-2, 2, 4, 42);

      // Incandescent Diamond Tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, 52);
      ctx.lineTo(-5, 44);
      ctx.lineTo(5, 44);
      ctx.closePath();
      ctx.fill();

      // Heavy Gold Guard
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-9, -3, 18, 5);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2.5, -9, 5, 7);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-4, -12, 8, 3);

      ctx.restore();
      ctx.restore();
    }
  } else if (isCasting) {
    // 2. DAOIST MUDRA HAND SEALS (Kiết Ấn Niệm Chú)
    // Left & Right Sleeves meeting in front of chest
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-10, -30);
    ctx.bezierCurveTo(-14, -24, -6, -20, 0, -22);
    ctx.lineTo(-6, -16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(10, -30);
    ctx.bezierCurveTo(14, -24, 6, -20, 0, -22);
    ctx.lineTo(6, -16);
    ctx.closePath();
    ctx.fill();

    // Clenched Mudra Hands
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-3, -24, 6, 5);

    // Crackling Lightning Sparks around mudra
    const sparkA = (time * 0.01) % (Math.PI * 2);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, -22);
    ctx.lineTo(Math.cos(sparkA) * 10, -22 + Math.sin(sparkA) * 6);
    ctx.lineTo(4, -22);
    ctx.stroke();
  } else {
    // 3. IDLE / WALKING BILLOWING SLEEVES
    // Left Sleeve
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-10, -32);
    ctx.bezierCurveTo(-18, -24, -20 - robeFlutter, -14, -14 - robeFlutter, -6);
    ctx.lineTo(-9, -12);
    ctx.closePath();
    ctx.fill();

    // Right Sleeve & Sword Hand
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(10, -32);
    ctx.bezierCurveTo(18, -24, 20 + robeFlutter, -14, 14 + robeFlutter, -6);
    ctx.lineTo(9, -12);
    ctx.closePath();
    ctx.fill();

    // Hands (Fair skin)
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-12 - robeFlutter * 0.5, -8, 4, 4);
    ctx.fillRect(9 + robeFlutter * 0.5, -8, 4, 4);
  }

  // Layer G: Cultivator Head & Face
  // Neck
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(-3, -37, 6, 4);

  // Defined Facial Profile
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.ellipse(0, -42, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes with jade brilliance
  ctx.fillStyle = '#065f46';
  ctx.fillRect(2, -43, 2, 2);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(3, -43, 1, 1);

  // Flowing bangs & Top Hair
  ctx.fillStyle = '#0a0d14';
  ctx.beginPath();
  ctx.arc(0, -45, 8, Math.PI * 0.8, Math.PI * 2.2);
  ctx.fill();

  // Topknot Guan & Cyan Jade Pin (Quán Ngọc & Trâm Cài)
  ctx.fillStyle = '#e2e8f0'; // Silver Guan
  ctx.fillRect(-4, -56, 8, 5);
  ctx.fillStyle = '#34d399'; // Emerald jade hairpin
  ctx.fillRect(-8, -54, 16, 2);

  ctx.restore(); // Undo flip & bodyAngle & translation

  // 4. FLOATING THANH TRÚC PHONG VÂN KIẾM (LEFT SHOULDER HOVERING SWORD)
  // Only floats when NOT actively swinging the sword in hand!
  if (p.hp > 0 && !isAttacking) {
    ctx.save();
    const swordBob = Math.sin(time / 220) * 3;
    const swordX = p.x - 22;
    const swordY = p.y - 24 + swordBob;

    // Sword Qi halo radiance
    const bladeGlow = ctx.createRadialGradient(swordX, swordY, 2, swordX, swordY, 18);
    bladeGlow.addColorStop(0, 'rgba(52, 211, 153, 0.7)');
    bladeGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.3)');
    bladeGlow.addColorStop(1, 'rgba(5, 150, 105, 0)');
    ctx.fillStyle = bladeGlow;
    ctx.beginPath();
    ctx.arc(swordX, swordY, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(swordX, swordY);

    // Bamboo-green blade body (Thanh Trúc Kiếm)
    ctx.fillStyle = '#059669'; // Edge
    ctx.fillRect(-2, -16, 4, 24);
    ctx.fillStyle = '#34d399'; // Blade Spine
    ctx.fillRect(-1, -15, 2, 22);

    // Tip
    ctx.fillStyle = '#a7f3d0';
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(2, -16);
    ctx.lineTo(-2, -16);
    ctx.closePath();
    ctx.fill();

    // Gold Guard & Pommel
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-5, 8, 10, 3);
    ctx.fillStyle = '#78350f'; // Grip
    ctx.fillRect(-1.5, 11, 3, 5);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2.5, 16, 5, 2);

    // Crimson Silk Tassel swaying
    const tasselSway = Math.sin(time / 180) * 2;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-0.5 + tasselSway, 18, 1.5, 7);

    ctx.restore();
  }

  ctx.restore();

  // Overhead Name & Title Badge
  ctx.save();
  const nameY = p.y - 82;
  const nameText = `${p.name} [${p.title}]`;
  const tagW = Math.max(80, nameText.length * 6.5 + 16);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(p.x - tagW / 2, nameY - 12, tagW, 16);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x - tagW / 2, nameY - 12, tagW, 16);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(nameText, p.x, nameY);
  ctx.restore();
}

/**
 * 3. THANH KHÊ DÃ LANG & BEASTS (ANATOMICAL WOLF WITH DEMONIC BLUE EYES)
 */
export function renderXianxiaEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  time: number,
  playerX: number
) {
  if (enemy.hp <= 0) return;

  const isFlipped = playerX < enemy.x;
  const isWolf = enemy.shape === 'wolf' || !enemy.shape || enemy.id.includes('lang');
  const isHurt = (enemy.hurtTimer || 0) > 0;

  // 1. Telegraph Warning Indicator for Windup Attacks
  if (enemy.state === 'attack_windup') {
    const maxWindup = enemy.isBoss ? (enemy.bossAttackPattern === 'slam' ? 0.85 : enemy.bossAttackPattern === 'charge' ? 0.75 : 0.65) : 0.38;
    const elapsed = Math.max(0, maxWindup - (enemy.windupTimer || 0));
    const progress = Math.min(1, Math.max(0, elapsed / maxWindup));
    const radius = enemy.telegraphRadius || (enemy.isBoss ? 135 : enemy.attackRange + 22);

    ctx.save();
    // Red danger zone on ground with pulsing opacity
    const pulseAlpha = 0.22 + Math.sin(time / 70) * 0.1;
    ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 12, radius, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 12, radius, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Charging countdown circle
    const curR = radius * (1 - progress);
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 12, Math.max(4, curR), Math.max(2, curR * 0.5), 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';

    let telegraphText = '⚡ CHỰC VỒ!';
    if (enemy.isBoss) {
      if (enemy.bossAttackPattern === 'slam') telegraphText = '⚠️ ĐỊA CHẤN QUYỀN (CHUẨN BỊ NÉ)!';
      else if (enemy.bossAttackPattern === 'charge') telegraphText = '⚠️ CUỒNG BẠO XUNG KÍCH!';
      else if (enemy.bossAttackPattern === 'roar') telegraphText = '⚠️ CUỒNG HỐNG MA KHÍ!';
    }
    ctx.fillText(telegraphText, enemy.x, enemy.y - radius * 0.5 - 14);
    ctx.restore();
  }

  // 1B. Boss Exhaustion / Punish Window Indicator
  if (enemy.isBoss && enemy.bossPunishTimer && enemy.bossPunishTimer > 0) {
    ctx.save();
    const dizzyAngle = time / 120;
    for (let i = 0; i < 3; i++) {
      const a = dizzyAngle + (i * Math.PI * 2) / 3;
      const sx = enemy.x + Math.cos(a) * 26;
      const sy = enemy.y - 40 + Math.sin(a) * 8;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#67e8f9';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ SƠ HỞ! (+35% SÁT THƯƠNG)', enemy.x, enemy.y - 52);
    ctx.restore();
  }

  // 1C. Boss CC Immunity Aura
  if (enemy.isBoss && enemy.bossImmuneTimer && enemy.bossImmuneTimer > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 10, 36, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Alert icon
  if (enemy.state === 'detect') {
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', enemy.x, enemy.y - 32);
    ctx.restore();
  }

  // 3. Ground Soft Radial Shadow
  ctx.save();
  const shadowGrad = ctx.createRadialGradient(enemy.x, enemy.y + 14, 2, enemy.x, enemy.y + 14, enemy.isBoss ? 32 : 24);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + 14, enemy.isBoss ? 32 : 24, enemy.isBoss ? 13 : 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. ANATOMICAL DEMONIC DIRE WOLF (THANH KHÊ DÃ LANG)
  ctx.save();
  ctx.translate(enemy.x, enemy.y + 4);
  if (isFlipped) ctx.scale(-1, 1);

  if (isWolf) {
    const isWindup = enemy.state === 'attack_windup';
    const isChasing = enemy.state === 'chase';
    const legPhase = isChasing ? Math.sin(time / 90) * 8 : Math.sin(time / 220) * 2;
    const crouchY = isWindup ? 4 : 0;

    // Demonic Qi Ethereal Mist around paws
    ctx.save();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-12, 10 + crouchY, 8, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(12, 10 + crouchY, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bushy Tail with indigo tip (Swishing)
    const tailWag = Math.sin(time / 160) * 5;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-16, -4 + crouchY);
    ctx.bezierCurveTo(-26, -14 + tailWag + crouchY, -32, -4 + tailWag + crouchY, -24, 6 + crouchY);
    ctx.closePath();
    ctx.fill();
    // Indigo demonic tip
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(-26, -8 + tailWag + crouchY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Hind Leg Left (Back leg)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-15 - legPhase * 0.5, 2 + crouchY, 6, 12);
    ctx.fillRect(-17 - legPhase * 0.5, 12 + crouchY, 7, 3); // Paw claws

    // Hind Leg Right (Fore leg)
    ctx.fillStyle = '#334155';
    ctx.fillRect(-9 + legPhase * 0.5, 3 + crouchY, 6, 11);
    ctx.fillRect(-11 + legPhase * 0.5, 13 + crouchY, 7, 3);

    // Torso (Muscular arched back, silver-gray coat with demonic spine ruff)
    ctx.fillStyle = isHurt ? '#ef4444' : '#475569';
    ctx.beginPath();
    ctx.ellipse(0, -3 + crouchY, 17, 11, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Dark Spiny Hackles along spine
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-14, -10 + crouchY);
    ctx.lineTo(-4, -14 + crouchY);
    ctx.lineTo(8, -13 + crouchY);
    ctx.lineTo(12, -4 + crouchY);
    ctx.lineTo(-4, -3 + crouchY);
    ctx.closePath();
    ctx.fill();

    // Demonic Cyan Runes on Flank
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-6, -6 + crouchY);
    ctx.lineTo(-2, -1 + crouchY);
    ctx.moveTo(3, -7 + crouchY);
    ctx.lineTo(7, -2 + crouchY);
    ctx.stroke();

    // Foreleg Left (Back leg)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8 + legPhase * 0.6, 2 + crouchY, 6, 12);
    ctx.fillRect(7 + legPhase * 0.6, 12 + crouchY, 7, 3);

    // Foreleg Right (Fore leg)
    ctx.fillStyle = '#475569';
    ctx.fillRect(14 - legPhase * 0.6, 3 + crouchY, 6, 11);
    ctx.fillRect(13 - legPhase * 0.6, 13 + crouchY, 7, 3);

    // Muscular Neck & Throat
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(8, -8 + crouchY);
    ctx.lineTo(18, -19 + crouchY);
    ctx.lineTo(26, -11 + crouchY);
    ctx.lineTo(16, 2 + crouchY);
    ctx.closePath();
    ctx.fill();

    // Snarling Wolf Head & Jaws
    ctx.fillStyle = isHurt ? '#f87171' : '#475569';
    ctx.beginPath();
    ctx.moveTo(16, -19 + crouchY);
    ctx.lineTo(29, -15 + crouchY);
    ctx.lineTo(31, -8 + crouchY);
    ctx.lineTo(19, -4 + crouchY);
    ctx.closePath();
    ctx.fill();

    // Pointed Ears (Pricked up / angled)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(15, -19 + crouchY);
    ctx.lineTo(17, -29 + crouchY);
    ctx.lineTo(22, -19 + crouchY);
    ctx.closePath();
    ctx.fill();

    // Sharp White Fangs protruding
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(27, -7 + crouchY);
    ctx.lineTo(29, -3 + crouchY);
    ctx.lineTo(30, -7 + crouchY);
    ctx.closePath();
    ctx.fill();

    // Piercing Crimson/Cyan Demonic Eye
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(22, -14 + crouchY, 3.5, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(22.5, -14 + crouchY, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, -15 + crouchY, 1, 1);
  }

  // Universal Electric Stun Arcs / Paralysis Visual when hurt by thunder or blade
  if (isHurt) {
    ctx.strokeStyle = Math.random() > 0.5 ? '#c084fc' : '#38bdf8';
    ctx.lineWidth = 2.2;
    for (let s = 0; s < 4; s++) {
      const sa = (s * Math.PI * 2) / 4 + time * 0.012;
      const sx = Math.cos(sa) * 20;
      const sy = Math.sin(sa) * 14 - 4;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 14, sy - 8);
      ctx.lineTo(sx + (Math.random() - 0.5) * 20, sy + 6);
      ctx.stroke();
    }
  }

  ctx.restore();

  // 5. Overhead Health Bar
  if (!enemy.isBoss) {
    const barW = 48;
    const barH = 5;
    const hpPct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
    const barY = enemy.y - 28;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(enemy.x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#292524';
    ctx.fillRect(enemy.x - barW / 2, barY, barW, barH);
    ctx.fillStyle = enemy.category === 'elite' ? '#a855f7' : (hpPct > 0.3 ? '#ef4444' : '#dc2626');
    ctx.fillRect(enemy.x - barW / 2, barY, barW * hpPct, barH);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.name, enemy.x, barY - 4);
  }
}


/**
 * Helper: Draw Calligraphic Crescent Blade Wave (Lưỡi Liềm Khí Mang Thủy Mặc)
 * Constructs a tapered, organic bezier/polygon blade wave with needle tips.
 */
function drawCalligraphicCrescent(
  ctx: CanvasRenderingContext2D,
  outerRadius: number,
  maxThickness: number,
  startAngle: number,
  endAngle: number,
  isReverse: boolean = false
) {
  const segments = 22;
  const delta = endAngle - startAngle;
  if (Math.abs(delta) < 0.05) return;

  ctx.beginPath();
  // 1. Outer Arc: from start to end, thickness expanding along swing
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = startAngle + delta * t;
    // Thickness profile: needle at tail (t=0), swells to max at t=0.75, sharpens to cutting tip
    const swell = Math.sin(t * Math.PI * 0.88);
    const r = outerRadius + swell * (maxThickness * 0.25);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  // Sharp cutting needle tip
  const tipX = Math.cos(endAngle) * (outerRadius + maxThickness * 0.35);
  const tipY = Math.sin(endAngle) * (outerRadius + maxThickness * 0.35);
  ctx.lineTo(tipX, tipY);

  // 2. Inner Arc: returning from end to start
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const a = startAngle + delta * t;
    const swell = Math.sin(t * Math.PI * 0.88);
    const r = Math.max(12, outerRadius - maxThickness * swell);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * 4. KỸ NĂNG ĐÁNH THƯỜNG — COMBO 3 ĐÒN KIẾM PHÁP (LMB / TRIPLE SWORD COMBO)
 * Step 1: Hoành Tảo Kiếm Khí (Horizontal Slash - Silver-Cyan Calligraphic Crescent with Trail Lag)
 * Step 2: Nghịch Phong Kiếm (Reverse Upward Slash - Emerald-Jade Dual Arc & Wind Vortex)
 * Step 3: Phách Không Tuyệt Trảm (Heavy Downward Cleave - Imperial Gold Earth-Split & Shockwave)
 */
export function renderSwordArcSlash(
  ctx: CanvasRenderingContext2D,
  p: PlayerStats,
  anim: { angle: number; progress: number; step?: number }
) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(anim.angle);

  const step = anim.step || 1;

  if (step === 1) {
    // ========================================================
    // ĐÒN 1: HOÀNH TẢO KIẾM KHÍ (Horizontal Slash - Crisp Cyan-Silver Crescent)
    // Windup [0.0 - 0.16] -> Active Swing [0.16 - 0.70] -> Recovery [0.70 - 1.0]
    // ========================================================
    const radius = 96;
    const sweep = Math.PI * 0.76; // 137 degrees
    const startAngle = -sweep / 2;

    if (anim.progress < 0.16) {
      // Windup Phase: Gleaming gathering spark at blade tip (No full slash wave yet!)
      const prepGlint = anim.progress / 0.16;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(radius * 0.65, 0, 3 * prepGlint, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Active Swing & Trail Lag Calculation:
    // Leading tip sweeps forward, trailing tail follows with lag
    const swingProg = Math.min(1, (anim.progress - 0.16) / 0.54);
    const headAngle = startAngle + sweep * swingProg;
    const tailProg = Math.max(0, swingProg - 0.38);
    const tailAngle = startAngle + sweep * tailProg;
    const alpha = anim.progress > 0.70 ? Math.max(0, (1 - anim.progress) / 0.30) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. Motion Blur Ghost Trail (Dư Ảnh Kiếm Ngân)
    if (swingProg > 0.25) {
      const ghostTailProg = Math.max(0, tailProg - 0.15);
      const ghostHeadProg = Math.max(0, swingProg - 0.18);
      const gTailA = startAngle + sweep * ghostTailProg;
      const gHeadA = startAngle + sweep * ghostHeadProg;

      ctx.save();
      ctx.globalAlpha = alpha * 0.32;
      const ghostGrad = ctx.createRadialGradient(0, 0, radius - 20, 0, 0, radius + 14);
      ghostGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      ghostGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.45)');
      ghostGrad.addColorStop(1, 'rgba(167, 243, 208, 0)');
      ctx.fillStyle = ghostGrad;
      drawCalligraphicCrescent(ctx, radius - 4, 16, gTailA, gHeadA);
      ctx.fill();
      ctx.restore();
    }

    // 2. Main Calligraphic Crescent Blade Wave (Connecting tail to head)
    const bladeGrad = ctx.createRadialGradient(0, 0, radius - 22, 0, 0, radius + 18);
    bladeGrad.addColorStop(0, 'rgba(2, 132, 199, 0)');
    bladeGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.65)');
    bladeGrad.addColorStop(0.7, 'rgba(167, 243, 208, 0.85)');
    bladeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
    ctx.fillStyle = bladeGrad;
    drawCalligraphicCrescent(ctx, radius, 22, tailAngle, headAngle);
    ctx.fill();

    // 3. Piercing White Core Line along cutting spine
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, tailAngle, headAngle);
    ctx.stroke();

    // Secondary cyan outer bevel
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 4, tailAngle, headAngle);
    ctx.stroke();

    // 4. Leading Edge Starburst at cutting tip (Only active while swinging)
    if (swingProg < 1.0) {
      const tipX = Math.cos(headAngle) * (radius + 2);
      const tipY = Math.sin(headAngle) * (radius + 2);

      // Glowing diamond core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(tipX, tipY - 5);
      ctx.lineTo(tipX + 5, tipY);
      ctx.lineTo(tipX, tipY + 5);
      ctx.lineTo(tipX - 5, tipY);
      ctx.closePath();
      ctx.fill();

      // 4-point cross glint
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(tipX - 1.5, tipY - 12, 3, 24);
      ctx.fillRect(tipX - 12, tipY - 1.5, 24, 3);

      // Flying spark motes
      ctx.fillStyle = '#a7f3d0';
      for (let s = 1; s <= 3; s++) {
        const spA = headAngle - s * 0.12;
        const spX = Math.cos(spA) * (radius + (s % 2 === 0 ? 8 : -6));
        const spY = Math.sin(spA) * (radius + (s % 2 === 0 ? 8 : -6));
        ctx.fillRect(spX - 1.5, spY - 1.5, 3, 3);
      }
    }

    ctx.restore();
  } else if (step === 2) {
    // ========================================================
    // ĐÒN 2: NGHỊCH PHONG KIẾM (Reverse Upward Slash - Emerald Wind)
    // Windup [0.0 - 0.16] -> Active Reverse Cut [0.16 - 0.68] -> Recovery [0.68 - 1.0]
    // ========================================================
    const radius = 108;
    const sweep = Math.PI * 0.82; // 148 degrees
    const startAngle = sweep / 2; // from bottom-right

    if (anim.progress < 0.16) {
      // Windup / Lower hip stance gleam
      const prepGlint = anim.progress / 0.16;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(radius * 0.55, 12, 3.5 * prepGlint, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const swingProg = Math.min(1, (anim.progress - 0.16) / 0.52);
    // Reverse direction (from bottom-right sweeping up to top-left)
    const headAngle = startAngle - sweep * swingProg;
    const tailProg = Math.max(0, swingProg - 0.36);
    const tailAngle = startAngle - sweep * tailProg;
    const alpha = anim.progress > 0.68 ? Math.max(0, (1 - anim.progress) / 0.32) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. Secondary Phantom Blade Wave (Dư Ảnh Bích Kiếm)
    if (swingProg > 0.22) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.42;
      const secGrad = ctx.createRadialGradient(0, 0, radius - 36, 0, 0, radius);
      secGrad.addColorStop(0, 'rgba(5, 150, 105, 0)');
      secGrad.addColorStop(0.6, 'rgba(52, 211, 153, 0.55)');
      secGrad.addColorStop(1, 'rgba(167, 243, 208, 0.85)');
      ctx.fillStyle = secGrad;
      drawCalligraphicCrescent(ctx, radius - 16, 16, tailAngle, headAngle, true);
      ctx.fill();
      ctx.restore();
    }

    // 2. Main Emerald Jade Crescent Wave
    const bladeGrad = ctx.createRadialGradient(0, 0, radius - 24, 0, 0, radius + 20);
    bladeGrad.addColorStop(0, 'rgba(4, 120, 87, 0)');
    bladeGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.65)');
    bladeGrad.addColorStop(0.7, 'rgba(52, 211, 153, 0.85)');
    bladeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
    ctx.fillStyle = bladeGrad;
    drawCalligraphicCrescent(ctx, radius, 25, tailAngle, headAngle, true);
    ctx.fill();

    // 3. Piercing White Incandescent Core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, headAngle, tailAngle);
    ctx.stroke();

    // Jade inner trim
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 5, headAngle, tailAngle);
    ctx.stroke();

    // 4. Spiral Wind Whirls along trailing edge
    if (swingProg < 1.0) {
      const tipX = Math.cos(headAngle) * (radius + 2);
      const tipY = Math.sin(headAngle) * (radius + 2);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Emerald Glint Flares
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(tipX - 1.5, tipY - 14, 3, 28);
      ctx.fillRect(tipX - 14, tipY - 1.5, 28, 3);

      // Spiraling wind wisps
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      for (let w = 1; w <= 3; w++) {
        const wa = headAngle + w * 0.16;
        const wx = Math.cos(wa) * (radius + w * 4);
        const wy = Math.sin(wa) * (radius + w * 4);
        ctx.beginPath();
        ctx.arc(wx, wy, 4 + w, 0, Math.PI * 1.5);
        ctx.stroke();
      }
    }

    ctx.restore();
  } else {
    // ========================================================
    // ĐÒN 3: PHÁCH KHÔNG TUYỆT TRẢM (Heavy Overhead Cleave - Imperial Gold Earth-Split)
    // Gather Charge [0.0 - 0.26] -> Heavy Cleave [0.26 - 0.72] -> Recovery [0.72 - 1.0]
    // ========================================================
    const radius = 130;
    const sweep = Math.PI * 0.95; // 171 degrees massive vertical cleave
    const startAngle = -sweep / 2;

    if (anim.progress < 0.26) {
      // Gather Charge Phase: Blazing golden aura gathering overhead!
      const chargeGlow = anim.progress / 0.26;
      ctx.save();
      const gatherGrad = ctx.createRadialGradient(0, -28, 2, 0, -28, 32 * chargeGlow);
      gatherGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      gatherGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.5)');
      gatherGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = gatherGrad;
      ctx.beginPath();
      ctx.arc(0, -28, 32 * chargeGlow, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore();
      return;
    }

    const swingProg = Math.min(1, (anim.progress - 0.26) / 0.46);
    const headAngle = startAngle + sweep * swingProg;
    const tailProg = Math.max(0, swingProg - 0.40);
    const tailAngle = startAngle + sweep * tailProg;
    const alpha = anim.progress > 0.72 ? Math.max(0, (1 - anim.progress) / 0.28) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. Massive Golden Qi Radiance Bloom
    const bloomGrad = ctx.createRadialGradient(0, 0, radius - 40, 0, 0, radius + 32);
    bloomGrad.addColorStop(0, 'rgba(180, 83, 9, 0)');
    bloomGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.45)');
    bloomGrad.addColorStop(0.65, 'rgba(250, 204, 21, 0.75)');
    bloomGrad.addColorStop(0.9, 'rgba(254, 240, 138, 0.9)');
    bloomGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
    ctx.fillStyle = bloomGrad;
    drawCalligraphicCrescent(ctx, radius, 34, tailAngle, headAngle);
    ctx.fill();

    // 2. Dual Golden & Amber Edge Bands
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, tailAngle, headAngle);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, tailAngle, headAngle);
    ctx.stroke();

    // 3. Piercing White Incandescent Core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, 0, radius, tailAngle, headAngle);
    ctx.stroke();

    // 4. Four Jagged Forward Shockwave Spikes (Phi Kiếm Nha - Earth-Splitting Spikes)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    for (let s = 0; s < 4; s++) {
      const sa = startAngle + (sweep * swingProg * (0.35 + s * 0.18));
      const sBaseR = radius + 2;
      const sTipR = radius + 18 + (s % 2 === 0 ? 12 : 6);
      const bx = Math.cos(sa) * sBaseR;
      const by = Math.sin(sa) * sBaseR;
      const tx = Math.cos(sa + 0.04) * sTipR;
      const ty = Math.sin(sa + 0.04) * sTipR;
      const rx = Math.cos(sa + 0.08) * sBaseR;
      const ry = Math.sin(sa + 0.08) * sBaseR;

      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tx, ty);
      ctx.lineTo(rx, ry);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Heavy Forward Starburst & Shockwave at tip
    if (swingProg < 1.0) {
      const tipX = Math.cos(headAngle) * (radius + 4);
      const tipY = Math.sin(headAngle) * (radius + 4);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
      ctx.fill();

      // 8-Point Imperial Gold Glint
      ctx.fillStyle = '#fde047';
      ctx.fillRect(tipX - 2, tipY - 18, 4, 36);
      ctx.fillRect(tipX - 18, tipY - 2, 36, 4);
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-1.5, -12, 3, 24);
      ctx.fillRect(-12, -1.5, 24, 3);
      ctx.restore();

      // Ground Rupture Fracture Ripple
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(tipX * 0.8, tipY * 0.8, 22, 10, anim.angle, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * 5. KỸ NĂNG 2 — PHI KIẾM QUYẾT (Q / FLYING SWORD PROJECTILE)
 * High-fidelity Chinese Jian (Thanh Trúc Kiếm) with etched jade blade, gold guard, and flowing silk tassel
 */
export function renderFlyingSwordProjectile(
  ctx: CanvasRenderingContext2D,
  pr: ProjectileVisual
) {
  ctx.save();
  const angle = Math.atan2(pr.vy, pr.vx);
  ctx.translate(pr.x, pr.y);
  ctx.rotate(angle);

  if (pr.fromPlayer) {
    const bladeLen = Math.max(32, pr.radius * 2.8);

    // 1. Trailing Light Ribbon Wake
    const ribbonGrad = ctx.createLinearGradient(-bladeLen * 1.8, 0, bladeLen * 0.4, 0);
    ribbonGrad.addColorStop(0, 'rgba(52, 211, 153, 0)');
    ribbonGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.55)');
    ribbonGrad.addColorStop(0.85, 'rgba(167, 243, 208, 0.8)');
    ribbonGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
    ctx.fillStyle = ribbonGrad;
    ctx.fillRect(-bladeLen * 1.8, -4.5, bladeLen * 2.2, 9);

    // 2. Bamboo-Jade Blade Body
    ctx.fillStyle = '#059669'; // Emerald edge
    ctx.fillRect(-bladeLen * 0.5, -2.8, bladeLen, 5.6);
    ctx.fillStyle = '#34d399'; // Spine
    ctx.fillRect(-bladeLen * 0.45, -1.2, bladeLen * 0.92, 2.4);

    // Central Fuller Groove
    ctx.fillStyle = '#047857';
    ctx.fillRect(-bladeLen * 0.4, -0.6, bladeLen * 0.75, 1.2);

    // Incandescent Razor Diamond Tip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(bladeLen * 0.65, 0);
    ctx.lineTo(bladeLen * 0.48, -3.8);
    ctx.lineTo(bladeLen * 0.48, 3.8);
    ctx.closePath();
    ctx.fill();

    // 3. Golden Dragon Crossguard
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-bladeLen * 0.55, -7, 3.5, 14);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-bladeLen * 0.53, -4, 2, 8);

    // Rosewood Grip & Golden Pommel
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-bladeLen * 0.75, -1.5, bladeLen * 0.2, 3);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-bladeLen * 0.8, -2.5, 2.5, 5);

    // 4. Dynamic Flowing Crimson Silk Tassel (Kiếm Tuệ)
    const tasselWave = Math.sin(Date.now() / 80) * 3;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-bladeLen * 0.8, 0);
    ctx.quadraticCurveTo(-bladeLen * 0.95, tasselWave, -bladeLen * 1.15, tasselWave * 1.5);
    ctx.stroke();

    // Tassel golden bead
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(-bladeLen * 0.85, tasselWave * 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Enemy Cultist Demonic Flame Sphere
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(0, 0, pr.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, pr.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 6. KỸ NĂNG 3 — HỘ THỂ LINH THUẪN (E / GOLDEN BELL SHIELD)
 * Ancient Imperial Golden Bell with rotating Bagua runes & golden lotus pedestal
 */
export function renderXianxiaGoldenBell(
  ctx: CanvasRenderingContext2D,
  p: PlayerStats,
  time: number
) {
  const angle = (time / 1000) * 1.4;
  ctx.save();
  ctx.translate(p.x, p.y);

  // 1. Translucent Golden Bell Body Silhouette
  const bellH = 56;
  const bellW = 44;

  const bellGrad = ctx.createRadialGradient(0, -10, 8, 0, -10, bellW + 8);
  bellGrad.addColorStop(0, 'rgba(254, 240, 138, 0.12)');
  bellGrad.addColorStop(0.75, 'rgba(234, 179, 8, 0.35)');
  bellGrad.addColorStop(1, 'rgba(250, 204, 21, 0.85)');
  ctx.fillStyle = bellGrad;
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  // Bell top crown loop (Long Nữu)
  ctx.arc(0, -bellH + 12, 6, Math.PI, 0);
  // Curved bell shoulders flaring out down to bottom rim
  ctx.quadraticCurveTo(bellW * 0.7, -bellH + 24, bellW, 14);
  ctx.quadraticCurveTo(0, 20, -bellW, 14);
  ctx.quadraticCurveTo(-bellW * 0.7, -bellH + 24, 0, -bellH + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Rotating Daoist Bagua Trigrams (Bát Quái Phù Văn)
  ctx.save();
  ctx.rotate(angle);
  const trigrams = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'center';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8;
    const tx = Math.cos(a) * 36;
    const ty = Math.sin(a) * 36;
    ctx.fillText(trigrams[i], tx, ty + 4);
  }
  ctx.restore();

  // 3. Golden Lotus Petal Foundation at feet
  ctx.fillStyle = 'rgba(234, 179, 8, 0.6)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * 7. 2.5D ORIENTAL OBSTACLES (ĐÌNH LÀNG THANH KHÊ, CỔ TÙNG NGÀN NĂM, ĐÁ THẦN)
 */
export function drawXianxiaObstacle(
  ctx: CanvasRenderingContext2D,
  obs: MapObstacle,
  time: number,
  playerPos?: { x: number; y: number }
) {
  const cx = obs.x + obs.width / 2;
  const cy = obs.y + obs.height;

  // Occlusion transparency: if player is standing behind this obstacle, make it translucent
  const isOccluded = playerPos &&
    playerPos.y < cy &&
    playerPos.y > obs.y - 30 &&
    Math.abs(playerPos.x - cx) < obs.width * 0.55;

  ctx.save();
  if (isOccluded) {
    ctx.globalAlpha = 0.55;
  }

  // Contact shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, obs.width * 0.45, Math.min(obs.height * 0.25, 18), 0, 0, Math.PI * 2);
  ctx.fill();

  if (obs.type === 'building') {
    // --- ĐÌNH LÀNG THANH KHÊ (HAND-PAINTED ORIENTAL PAVILION HOUSE) ---
    ctx.save();

    // 1. Triple-step stone terrace foundation with mossy edge
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(obs.x + 2, obs.y + obs.height - 24, obs.width - 4, 20);
    ctx.fillStyle = '#334155';
    ctx.fillRect(obs.x + 6, obs.y + obs.height - 20, obs.width - 12, 12);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(obs.x + 10, obs.y + obs.height - 16, obs.width - 20, 6);

    // Front stone steps
    const stepW = 44;
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - stepW / 2, obs.y + obs.height - 18, stepW, 16);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - stepW / 2 + 2, obs.y + obs.height - 14, stepW - 4, 3);
    ctx.fillRect(cx - stepW / 2 + 2, obs.y + obs.height - 8, stepW - 4, 3);

    // 2. Chamber Wall (Dark cedar wood walls)
    ctx.fillStyle = '#27170c';
    ctx.fillRect(obs.x + 16, obs.y + 26, obs.width - 32, obs.height - 48);

    // Lattice Windows & Double Entry Doors (Cửa Song Tiễn & Bản Khắc Bát Quái)
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(cx - 18, obs.y + 32, 36, obs.height - 54);
    ctx.strokeStyle = '#8c5932';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 18, obs.y + 32, 36, obs.height - 54);
    // Door seam & Brass Knockers (Thao Thiết Kim Hoàn)
    ctx.strokeStyle = '#27170c';
    ctx.beginPath();
    ctx.moveTo(cx, obs.y + 32);
    ctx.lineTo(cx, obs.y + obs.height - 22);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx - 6, obs.y + 48, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 6, obs.y + 48, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Four Vermilion Lacquer Pillars with Brass Footings
    const pillarPositions = [
      obs.x + 10,
      obs.x + 36,
      obs.x + obs.width - 48,
      obs.x + obs.width - 22,
    ];
    pillarPositions.forEach(px => {
      // Brass plinth
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px - 1, obs.y + obs.height - 24, 14, 4);
      // Vermilion Pillar
      const pGrad = ctx.createLinearGradient(px, 0, px + 12, 0);
      pGrad.addColorStop(0, '#7f1d1d');
      pGrad.addColorStop(0.5, '#b91c1c');
      pGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = pGrad;
      ctx.fillRect(px, obs.y + 20, 12, obs.height - 44);
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, obs.y + 20, 12, obs.height - 44);
    });

    // 4. Dou Gong (Đẩu Củng) Wooden Bracket Cluster under eaves
    ctx.fillStyle = '#991b1b';
    for (let bx = obs.x + 6; bx < obs.x + obs.width - 6; bx += 22) {
      ctx.fillRect(bx, obs.y + 16, 16, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx + 4, obs.y + 14, 8, 3);
      ctx.fillStyle = '#991b1b';
    }

    // Signboard plaque above door (Biển Hiệu Đình Làng)
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(cx - 26, obs.y + 18, 52, 12);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - 26, obs.y + 18, 52, 12);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 8px serif';
    ctx.textAlign = 'center';
    ctx.fillText('THANH KHÊ ĐÌNH', cx, obs.y + 27);

    // 5. Curved Glazed Eaves (Mái Ngói Lưu Ly Âm Dương 4 Góc Đao)
    const roofOverhang = 24;
    // Lower eave shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(obs.x - 10, obs.y + 20, obs.width + 20, 6);

    // Main Roof Body (Ceramic Glazed Slate / Jade Tiles)
    const rGrad = ctx.createLinearGradient(0, obs.y - 18, 0, obs.y + 22);
    rGrad.addColorStop(0, '#042f2e');
    rGrad.addColorStop(0.3, '#0f766e');
    rGrad.addColorStop(0.7, '#134e4a');
    rGrad.addColorStop(1, '#042f2e');
    ctx.fillStyle = rGrad;

    ctx.beginPath();
    ctx.moveTo(obs.x - roofOverhang, obs.y + 22);
    // Swept curved eave lines
    ctx.quadraticCurveTo(cx, obs.y + 4, obs.x + obs.width + roofOverhang, obs.y + 22);
    ctx.lineTo(obs.x + obs.width + roofOverhang - 8, obs.y + 10);
    ctx.quadraticCurveTo(cx, obs.y - 18, obs.x - roofOverhang + 8, obs.y + 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#042f2e';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Tile ridge lines
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
    ctx.lineWidth = 1.2;
    for (let rx = obs.x - 12; rx <= obs.x + obs.width + 12; rx += 14) {
      ctx.beginPath();
      ctx.moveTo(rx, obs.y + 18);
      ctx.quadraticCurveTo(cx, obs.y + 2, cx + (rx - cx) * 0.6, obs.y - 8);
      ctx.stroke();
    }

    // Upturned Flying Horns at Eaves (Đầu Đao Khắc Thao Thiết)
    ctx.fillStyle = '#f59e0b';
    [-roofOverhang, obs.width + roofOverhang].forEach(hx => {
      ctx.beginPath();
      ctx.arc(obs.x + hx, obs.y + 18, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Swaying Red Silk Lanterns with Ambient Radial Glow
    const lanternBob = Math.sin(time / 200) * 2;
    const lLeftX = obs.x + 4;
    const lRightX = obs.x + obs.width - 12;
    const lY = obs.y + 24 + lanternBob;

    // Ambient Warm Light Bloom on Ground
    [lLeftX + 4, lRightX + 4].forEach(lx => {
      const gLight = ctx.createRadialGradient(lx, lY + 6, 2, lx, lY + 6, 42);
      gLight.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
      gLight.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
      gLight.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = gLight;
      ctx.beginPath();
      ctx.arc(lx, lY + 6, 42, 0, Math.PI * 2);
      ctx.fill();
    });

    // Lantern bodies
    [lLeftX, lRightX].forEach(lx => {
      // Cord
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(lx + 4, obs.y + 16);
      ctx.lineTo(lx + 4, lY);
      ctx.stroke();

      // Red Silk Shell
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(lx + 4, lY + 8, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner Candle Light
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(lx + 2.5, lY + 5, 3, 6);

      // Gold Caps
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(lx + 1, lY, 6, 2);
      ctx.fillRect(lx + 1, lY + 15, 6, 2);

      // Tassel
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(lx + 4, lY + 17);
      ctx.lineTo(lx + 4 + Math.sin(time / 180) * 2, lY + 23);
      ctx.stroke();
    });

    ctx.restore();
  } else if (obs.type === 'tree') {
    // --- CỔ TÙNG NGÀN NĂM (THOUSAND-YEAR ANCIENT SPIRIT PINE) ---
    ctx.save();

    // 1. Gnarled, twisting ancient trunk with fissure bark contours
    ctx.fillStyle = '#271406'; // Deep bark shadow
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 2);
    ctx.quadraticCurveTo(cx - 18, cy - 24, cx - 10, cy - 52);
    ctx.lineTo(cx + 8, cy - 52);
    ctx.quadraticCurveTo(cx + 14, cy - 24, cx + 18, cy - 2);
    ctx.closePath();
    ctx.fill();

    // Rich Brown Bark Core
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 2);
    ctx.quadraticCurveTo(cx - 12, cy - 26, cx - 6, cy - 50);
    ctx.lineTo(cx + 4, cy - 50);
    ctx.quadraticCurveTo(cx + 10, cy - 26, cx + 12, cy - 2);
    ctx.closePath();
    ctx.fill();

    // Trunk Bark Ridges & Lichen streaks
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 4);
    ctx.quadraticCurveTo(cx - 6, cy - 28, cx - 2, cy - 48);
    ctx.moveTo(cx + 3, cy - 6);
    ctx.quadraticCurveTo(cx + 5, cy - 24, cx + 1, cy - 46);
    ctx.stroke();

    // Exposed Clutched Roots
    ctx.fillStyle = '#271406';
    ctx.fillRect(cx - 20, cy - 6, 12, 6);
    ctx.fillRect(cx + 8, cy - 6, 14, 6);

    // 2. Multi-tier Cloud-Scalloped Pine Needle Canopies
    const pineCanopies = [
      { y: cy - 48, r: 38, col: '#064e3b', colHi: '#10b981' },
      { y: cy - 64, r: 32, col: '#14532d', colHi: '#22c55e' },
      { y: cy - 78, r: 26, col: '#166534', colHi: '#34d399' },
      { y: cy - 90, r: 18, col: '#15803d', colHi: '#4ade80' },
    ];

    pineCanopies.forEach((tier, tIdx) => {
      // Main dark foliage cloud
      ctx.fillStyle = tier.col;
      ctx.beginPath();
      ctx.ellipse(cx, tier.y, tier.r, tier.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Organic needle lobes
      const lobes = 5 + tIdx;
      for (let i = 0; i < lobes; i++) {
        const la = (i * Math.PI * 2) / lobes;
        const lx = cx + Math.cos(la) * (tier.r * 0.75);
        const ly = tier.y + Math.sin(la) * (tier.r * 0.4);
        ctx.fillStyle = tier.col;
        ctx.beginPath();
        ctx.ellipse(lx, ly, tier.r * 0.38, tier.r * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight rim on upper half
        ctx.strokeStyle = tier.colHi;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(lx, ly, tier.r * 0.3, Math.PI * 0.9, Math.PI * 2.1);
        ctx.stroke();
      }
    });

    ctx.restore();
  } else if (obs.type === 'rock') {
    // --- CHISELED MOUNTAIN SLATE CRAG WITH SPIRIT JADE VEINS ---
    ctx.save();
    // Shadow Facet
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(obs.x + 8, cy);
    ctx.lineTo(obs.x + 2, cy - obs.height * 0.65);
    ctx.lineTo(obs.x + obs.width * 0.4, obs.y + 4);
    ctx.lineTo(obs.x + obs.width * 0.8, obs.y);
    ctx.lineTo(obs.x + obs.width - 2, cy - obs.height * 0.5);
    ctx.lineTo(obs.x + obs.width - 6, cy);
    ctx.closePath();
    ctx.fill();

    // Lit Facet
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(obs.x + obs.width * 0.4, obs.y + 4);
    ctx.lineTo(obs.x + obs.width * 0.8, obs.y);
    ctx.lineTo(obs.x + obs.width - 2, cy - obs.height * 0.5);
    ctx.lineTo(cx, cy - 8);
    ctx.closePath();
    ctx.fill();

    // Highlight Crest
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(obs.x + 2, cy - obs.height * 0.65);
    ctx.lineTo(obs.x + obs.width * 0.4, obs.y + 4);
    ctx.lineTo(cx - 4, cy - 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Embedded Glowing Cyan Spirit Jade Veins
    const jPulse = 0.7 + Math.sin(time / 200) * 0.3;
    ctx.fillStyle = `rgba(56, 189, 248, ${jPulse})`;
    ctx.fillRect(cx - 5, cy - obs.height * 0.5, 10, 12);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(cx - 2, cy - obs.height * 0.5 + 2, 4, 8);

    ctx.restore();
  } else {
    // Water pond or wall
    ctx.fillStyle = '#0e7490';
    ctx.beginPath();
    ctx.ellipse(cx, cy - obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#083344';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore(); // Restore outer occlusion save
}

/**
 * 8. COLLECTIBLE RESOURCES (HERBS, ORES, STELES)
 */
export function drawXianxiaResource(
  ctx: CanvasRenderingContext2D,
  res: CollectibleResource,
  time: number
) {
  if (res.collected && res.currentRespawnTimer > 0) return;

  const bob = Math.sin(time / 240 + res.x) * 3;
  const drawY = res.y + bob;

  // Ground glowing circle
  ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
  ctx.beginPath();
  ctx.ellipse(res.x, res.y + 8, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(res.x, drawY);

  if (res.type === 'herb') {
    // Glowing Spiritual Herb
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-8, -4, -10, -14, 0, -18);
    ctx.bezierCurveTo(10, -14, 8, -4, 0, 4);
    ctx.fill();
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Red dew fruit
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -18, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (res.type === 'ore') {
    // Deep iron ore
    ctx.fillStyle = '#475569';
    ctx.fillRect(-7, -10, 14, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, -6, 5, 5);
  } else {
    // Ancient stone stele
    ctx.fillStyle = '#334155';
    ctx.fillRect(-8, -18, 16, 22);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(-5, -14, 10, 2);
    ctx.fillRect(-5, -9, 10, 2);
  }

  ctx.restore();
}

/**
 * 9. NPC CỔ TRANG CHÂN THỰC (LÝ ĐỨC, MẠC LÃO, CHƯỞNG MÔN)
 */
export function renderXianxiaNPC(
  ctx: CanvasRenderingContext2D,
  npc: NPC,
  p: PlayerStats,
  time: number
) {
  const dist = Math.hypot(npc.x - p.x, npc.y - p.y);
  const isFacingPlayer = dist < 140;
  const flipX = isFacingPlayer && p.x < npc.x;

  ctx.save();
  // Contact Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(npc.x, npc.y + 14, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(npc.x, npc.y + 12);
  if (flipX) ctx.scale(-1, 1);

  const isLyDuc = npc.id.includes('truong_thon') || npc.name.includes('Lý Đức') || npc.name.includes('Trưởng Thôn');
  const isMacLao = npc.id.includes('mac_lao') || npc.name.includes('Mạc');

  if (isLyDuc) {
    // Lý Đức: Prestigious Village Elder in traditional Earth-tone Hanfu robe, long white beard, bamboo elder hat, dragon staff with medicine gourd
    // Layer 1: Inner Linen Robe
    ctx.fillStyle = '#d6d3d1';
    ctx.beginPath();
    ctx.moveTo(-9, -26);
    ctx.lineTo(9, -26);
    ctx.lineTo(13, 0);
    ctx.lineTo(-13, 0);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Rustic Terracotta Outer Robe (Áo Vạt Dài Nâu Trầm)
    ctx.fillStyle = '#5c4033';
    ctx.beginPath();
    ctx.moveTo(-11, -28);
    ctx.lineTo(-2, -28);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4a3328';
    ctx.beginPath();
    ctx.moveTo(2, -28);
    ctx.lineTo(11, -28);
    ctx.lineTo(14, 0);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    // Amber Silk Sash (Thắt Lưng Lụa Hổ Phách)
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-11, -15, 22, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, -15, 4, 12); // Hanging sash tail

    // Billowing Elder Sleeves
    ctx.fillStyle = '#5c4033';
    ctx.beginPath();
    ctx.moveTo(-10, -26);
    ctx.quadraticCurveTo(-18, -18, -16, -6);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -26);
    ctx.quadraticCurveTo(18, -18, 16, -6);
    ctx.lineTo(10, -10);
    ctx.closePath();
    ctx.fill();

    // Elder Countenance & Skin
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(0, -36, 6.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kind elderly eyes & eyebrows
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -40, 3, 1.5);
    ctx.fillRect(1, -40, 3, 1.5);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-3, -37, 2, 2);
    ctx.fillRect(1, -37, 2, 2);

    // Majestic Flowing Silver-White Beard (Râu Bạc Tiên Phong Đạo Cốt)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-5, -34);
    ctx.lineTo(5, -34);
    ctx.quadraticCurveTo(6, -20, 0, -10);
    ctx.quadraticCurveTo(-6, -20, -5, -34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Elder Bamboo Conical Hat with Jade Finial (Nón Lá Cổ Phong)
    ctx.fillStyle = '#a16207';
    ctx.beginPath();
    ctx.moveTo(-16, -42);
    ctx.lineTo(0, -54);
    ctx.lineTo(16, -42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hat jade finial
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(0, -55, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Carved Dragon Wood Staff with Jade Spirit Gourd (Trượng Đầu Rồng & Hồ Lô Linh Dược)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(13, -46, 3.5, 48); // Staff shaft
    // Dragon head carved top
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(11, -46);
    ctx.lineTo(18, -50);
    ctx.lineTo(19, -44);
    ctx.lineTo(14, -44);
    ctx.closePath();
    ctx.fill();

    // Hanging Purple Spirit Gourd (Hồ Lô Linh Dược) swaying
    const gourdSway = Math.sin(time / 220) * 2;
    ctx.save();
    ctx.translate(17 + gourdSway, -38);
    ctx.fillStyle = '#eab308'; // Golden cord
    ctx.fillRect(-0.5, -4, 1, 4);
    // Upper bulb
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.arc(0, 2, 3, 0, Math.PI * 2);
    ctx.fill();
    // Lower bulb
    ctx.beginPath();
    ctx.arc(0, 7, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-1.5, 1, 3, 1);
    ctx.restore();
  } else if (isMacLao) {
    // Mạc Lão: Powerful rogue cultivator with deep blue Daoist robes & floating talismans
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(-11, -30);
    ctx.lineTo(11, -30);
    ctx.lineTo(13, 0);
    ctx.lineTo(-13, 0);
    ctx.closePath();
    ctx.fill();

    // Long white hair & beard
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-5, -30);
    ctx.lineTo(5, -30);
    ctx.lineTo(0, -14);
    ctx.closePath();
    ctx.fill();

    // Head & Cyan Jade Guan
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(0, -38, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-4, -48, 8, 5);

    // Floating Golden Talisman
    const talBob = Math.sin(time / 200) * 3;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(14, -28 + talBob, 5, 9);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(15.5, -26 + talBob, 2, 5);
  } else {
    // Standard cultivator with flowing cyan-slate Daoist robe
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-10, -28);
    ctx.lineTo(10, -28);
    ctx.lineTo(12, 0);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-10, -14, 20, 3); // Belt

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(0, -36, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -38, 7, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();
  }

  ctx.restore();

  // Nameplate
  const nameW = Math.max(80, npc.name.length * 8 + 14);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(npc.x - nameW / 2, npc.y - 86, nameW, 18);
  ctx.strokeStyle = npc.faction === 'hac_phong' ? '#9333ea' : npc.faction === 'thanh_van' ? '#38bdf8' : '#eab308';
  ctx.lineWidth = 1;
  ctx.strokeRect(npc.x - nameW / 2, npc.y - 86, nameW, 18);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, npc.x, npc.y - 73);

  // Interaction prompt
  if (dist <= npc.interactionRadius) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(npc.x - 65, npc.y + 18, 130, 20);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(npc.x - 65, npc.y + 18, 130, 20);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('[Space/O] Đàm Đạo', npc.x, npc.y + 32);
  }
}

/**
 * 10. KỸ NĂNG 4 — ẤT MỘC HỒI XUÂN THUẬT (F / CELESTIAL HEALING PILLAR)
 * Radiant jade beam descending from the heavens with blooming spirit lotus and emerald particles
 */
export function renderHealingPillar(
  ctx: CanvasRenderingContext2D,
  p: PlayerStats,
  timer: number
) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const alpha = Math.min(1, timer * 1.5);

  // 1. Descending Celestial Beam from sky
  const beamGrad = ctx.createLinearGradient(0, -380, 0, 16);
  beamGrad.addColorStop(0, 'rgba(74, 222, 128, 0)');
  beamGrad.addColorStop(0.25, `rgba(74, 222, 128, ${0.4 * alpha})`);
  beamGrad.addColorStop(0.75, `rgba(34, 197, 94, ${0.75 * alpha})`);
  beamGrad.addColorStop(1, `rgba(240, 253, 244, ${0.95 * alpha})`);

  ctx.fillStyle = beamGrad;
  ctx.fillRect(-26, -380, 52, 400);

  // Core white incandescent beam
  ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * alpha})`;
  ctx.fillRect(-8, -380, 16, 400);

  // 2. Blooming Jade Lotus at base
  const lotusR = 38 * (1 - Math.max(0, timer - 0.7));
  ctx.fillStyle = `rgba(34, 197, 94, ${0.5 * alpha})`;
  ctx.strokeStyle = `rgba(187, 247, 208, ${0.9 * alpha})`;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8 + timer * 2.2;
    const px = Math.cos(angle) * lotusR;
    const py = Math.sin(angle) * (lotusR * 0.45) + 12;
    ctx.beginPath();
    ctx.ellipse(px, py, 11, 5.5, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 3. Ground Ripple rings
  ctx.strokeStyle = `rgba(52, 211, 153, ${0.8 * alpha})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 14, lotusR + 12, (lotusR + 12) * 0.45, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * 11. KỸ NĂNG 2 — THANH TRÚC PHI KIẾM QUYẾT (Q / MULTI-SWORD ADVANCED FLYING SWORDS)
 * Summoning -> High-speed Flight with Ribbon Trail -> Impact Blade Qi Dispersal
 */
/**
 * 11. KỸ NĂNG 2 — THANH TRÚC PHI KIẾM QUYẾT (Q / MULTI-SWORD ADVANCED FLYING SWORDS)
 * Summoning (Bát Quái Ngưng Kiếm Trận) -> High-speed Flight with Tassel & Ribbon -> Impact Shards
 */
export function renderAdvancedFlyingSwords(
  ctx: CanvasRenderingContext2D,
  swords: AdvancedProjectile[],
  time: number
) {
  const trigrams = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

  swords.forEach(sword => {
    ctx.save();

    if (sword.state === 'summoning') {
      // 1. SUMMON PHASE: Condensing behind cultivator's shoulders with Daoist talisman formation
      const pulse = Math.sin(time / 80 + sword.x) * 0.2 + 0.8;
      const rot = (time / 600);
      ctx.translate(sword.x, sword.y);
      ctx.rotate(sword.angle);

      // Daoist Bagua Trigram Array on ground
      ctx.save();
      ctx.strokeStyle = `rgba(52, 211, 153, ${0.85 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotating Trigram Runes
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = `rgba(167, 243, 208, ${0.9 * pulse})`;
      ctx.textAlign = 'center';
      for (let i = 0; i < 8; i += 2) {
        const a = (i * Math.PI * 2) / 8 + rot;
        const tx = Math.cos(a) * 14;
        const ty = Math.sin(a) * 14;
        ctx.fillText(trigrams[i], tx, ty + 2.5);
      }
      ctx.restore();

      // Inward gathering spirit wisps
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.75)';
      ctx.lineWidth = 1.2;
      for (let w = 0; w < 3; w++) {
        const wAngle = (w * Math.PI * 2) / 3 - rot * 3;
        const wDist = 16 * (1 - (sword.summonTimer % 0.2) / 0.2);
        ctx.beginPath();
        ctx.moveTo(Math.cos(wAngle) * wDist, Math.sin(wAngle) * wDist);
        ctx.lineTo(0, 0);
        ctx.stroke();
      }

      // Condensing double-edged bamboo blade
      ctx.fillStyle = `rgba(52, 211, 153, ${0.9 * pulse})`;
      ctx.fillRect(-2.5, -20, 5, 28);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -18, 2, 24);

      // Gold hilt
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-4.5, 8, 9, 3.5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-0.8, 11, 1.6, 6); // Tassel start
    } else if (sword.state === 'flying') {
      if (sword.skillId === 'skill_slash') {
        // ========================================================
        // KIẾM KHÍ TRẢM — TRAVELLING CRESCENT SWORD QI BLADE WAVE
        // Sharp needle horns, curved body, incandescent spine & spirit mist wake
        // ========================================================
        ctx.translate(sword.x, sword.y);
        ctx.rotate(sword.angle);
        const alpha = Math.max(0, sword.life / sword.maxLife);
        ctx.globalAlpha = alpha;

        const cWidth = 28;

        // 1. Crescent Outer Energy Mist Wake
        const wakeGrad = ctx.createLinearGradient(-20, 0, 10, 0);
        wakeGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        const isGreen = sword.element === 'moc' || sword.element === 'phong';
        const isGold = sword.element === 'hoa' || sword.element === 'tho';
        wakeGrad.addColorStop(0.6, isGreen ? 'rgba(52, 211, 153, 0.45)' : isGold ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.45)');
        wakeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
        ctx.fillStyle = wakeGrad;
        ctx.beginPath();
        ctx.moveTo(8, -cWidth);
        ctx.quadraticCurveTo(-16, 0, 8, cWidth);
        ctx.quadraticCurveTo(0, 0, 8, -cWidth);
        ctx.closePath();
        ctx.fill();

        // 2. Razor Sharp Curved Crescent Blade (Needle Tips)
        ctx.beginPath();
        // Leading convex cutting arc
        ctx.moveTo(6, -cWidth * 0.88);
        ctx.quadraticCurveTo(14, 0, 6, cWidth * 0.88);
        // Trailing concave back
        ctx.quadraticCurveTo(-3, 0, 6, -cWidth * 0.88);
        ctx.closePath();

        const bladeFill = ctx.createLinearGradient(0, -cWidth * 0.5, 14, 0);
        if (isGreen) {
          bladeFill.addColorStop(0, '#059669');
          bladeFill.addColorStop(0.5, '#34d399');
          bladeFill.addColorStop(1, '#ffffff');
        } else if (isGold) {
          bladeFill.addColorStop(0, '#b45309');
          bladeFill.addColorStop(0.5, '#f59e0b');
          bladeFill.addColorStop(1, '#ffffff');
        } else {
          bladeFill.addColorStop(0, '#0284c7');
          bladeFill.addColorStop(0.5, '#38bdf8');
          bladeFill.addColorStop(1, '#ffffff');
        }
        ctx.fillStyle = bladeFill;
        ctx.fill();

        // 3. Piercing White Core Line along cutting spine
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(6, -cWidth * 0.88);
        ctx.quadraticCurveTo(14, 0, 6, cWidth * 0.88);
        ctx.stroke();

        // 4. Trailing Spirit Sparks along wake
        ctx.fillStyle = isGreen ? '#a7f3d0' : isGold ? '#fde047' : '#ffffff';
        for (let sp = 1; sp <= 3; sp++) {
          const offX = -sp * 6;
          const offY = (sp % 2 === 0 ? 1 : -1) * (sp * 3.5);
          ctx.fillRect(offX, offY, 2.5, 2.5);
        }

        ctx.restore();
        return;
      }

      // 2. TRAVEL / FLYING PHASE: High-speed double-edged Jian with ribbon trail & waving tassel
      if (sword.trailPoints && sword.trailPoints.length > 1) {
        // Soft outer teal bloom
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(sword.trailPoints[0].x, sword.trailPoints[0].y);
        for (let i = 1; i < sword.trailPoints.length; i++) {
          ctx.lineTo(sword.trailPoints[i].x, sword.trailPoints[i].y);
        }
        ctx.stroke();

        // Incandescent inner white core
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(sword.trailPoints[0].x, sword.trailPoints[0].y);
        for (let i = 1; i < sword.trailPoints.length; i++) {
          ctx.lineTo(sword.trailPoints[i].x, sword.trailPoints[i].y);
        }
        ctx.stroke();
      }

      ctx.translate(sword.x, sword.y);
      ctx.rotate(sword.angle);

      const bladeLen = 38;

      // Trailing Light Ribbon
      const ribbonGrad = ctx.createLinearGradient(-bladeLen * 1.8, 0, bladeLen * 0.4, 0);
      ribbonGrad.addColorStop(0, 'rgba(52, 211, 153, 0)');
      ribbonGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.65)');
      ribbonGrad.addColorStop(0.85, 'rgba(167, 243, 208, 0.85)');
      ribbonGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      ctx.fillStyle = ribbonGrad;
      ctx.fillRect(-bladeLen * 1.8, -4.5, bladeLen * 2.2, 9);

      // Bamboo Jade Blade Body
      ctx.fillStyle = '#059669';
      ctx.fillRect(-bladeLen * 0.5, -2.8, bladeLen, 5.6);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(-bladeLen * 0.45, -1.2, bladeLen * 0.92, 2.4);

      // Fuller
      ctx.fillStyle = '#047857';
      ctx.fillRect(-bladeLen * 0.4, -0.6, bladeLen * 0.75, 1.2);

      // Razor Diamond Tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(bladeLen * 0.65, 0);
      ctx.lineTo(bladeLen * 0.48, -3.8);
      ctx.lineTo(bladeLen * 0.48, 3.8);
      ctx.closePath();
      ctx.fill();

      // Gold Dragon Crossguard
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-bladeLen * 0.55, -7, 3.5, 14);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-bladeLen * 0.53, -4, 2, 8);

      // Rosewood Grip & Pommel
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-bladeLen * 0.75, -1.5, bladeLen * 0.2, 3);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-bladeLen * 0.8, -2.5, 2.5, 5);

      // Flowing Crimson Silk Tassel with flight wave
      const tasselWave = Math.sin(time / 70 + sword.x * 0.1) * 3.5;
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-bladeLen * 0.8, 0);
      ctx.quadraticCurveTo(-bladeLen * 0.95, tasselWave, -bladeLen * 1.2, tasselWave * 1.4);
      ctx.stroke();

      // Gold tassel bead
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-bladeLen * 0.85, tasselWave * 0.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (sword.state === 'impact') {
      // 3. IMPACT PHASE: Explosive burst of sword qi shards
      ctx.translate(sword.x, sword.y);
      const alpha = Math.max(0, sword.life / sword.maxLife);

      if (sword.skillId === 'skill_slash') {
        // Crescent Qi Wave Dispersal
        const burstR = (1 - alpha) * 32;
        const isImpactGreen = sword.element === 'moc' || sword.element === 'phong';
        const isImpactGold = sword.element === 'hoa' || sword.element === 'tho';
        ctx.strokeStyle = isImpactGreen ? `rgba(52, 211, 153, ${alpha})` : isImpactGold ? `rgba(245, 158, 11, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 2.2 * alpha;
        ctx.beginPath();
        ctx.arc(0, 0, burstR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI * 2) / 6;
          const dist = (1 - alpha) * 24;
          ctx.fillRect(Math.cos(a) * dist - 1.5, Math.sin(a) * dist - 1.5, 3, 3);
        }
        ctx.restore();
        return;
      }

      // Radial Shockwave ring for flying swords
      const ringRadius = (1 - alpha) * 44;
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 3.0 * alpha;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 8 Dispersing Needle Sword Qi Shards
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const shardAngle = (i * Math.PI * 2) / 8;
        const dist = (1 - alpha) * 36;
        const sx = Math.cos(shardAngle) * dist;
        const sy = Math.sin(shardAngle) * dist;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(shardAngle) * 6, sy + Math.sin(shardAngle) * 6);
        ctx.stroke();
      }
    }

    ctx.restore();
  });
}

/**
 * 12. KỸ NĂNG 3 — LÔI ĐỘNG CỬU THIÊN (E / AOE HEAVENLY THUNDER GROUND STRIKE)
 * Telegraph Bagua Rune Array -> Multi-Branching Fractal Lightning Column -> Scorch Crater
 */
export function renderAoEZones(
  ctx: CanvasRenderingContext2D,
  zones: AoEZone[],
  time: number
) {
  const trigrams = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

  zones.forEach(zone => {
    ctx.save();
    ctx.translate(zone.x, zone.y);

    if (zone.phase === 'telegraph') {
      // ========================================================
      // 1. TELEGRAPH PHASE: Daoist Cửu Thiên Lôi Phù Trận on ground
      // ========================================================
      const progress = 1 - (zone.timer / zone.telegraphDuration);
      const rot = (time / 700);

      // Ground pulsing danger aura
      const auraGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, zone.radius);
      auraGrad.addColorStop(0, 'rgba(192, 132, 252, 0.25)');
      auraGrad.addColorStop(0.65, 'rgba(147, 51, 234, 0.32)');
      auraGrad.addColorStop(1, 'rgba(126, 34, 206, 0.02)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, zone.radius, zone.radius * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer boundary ring with Bagua runes
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(0, 0, zone.radius, zone.radius * 0.48, rot, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotating Bagua Trigrams on perimeter
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#e9d5ff';
      ctx.textAlign = 'center';
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8 + rot;
        const tx = Math.cos(a) * (zone.radius - 8);
        const ty = Math.sin(a) * ((zone.radius - 8) * 0.48);
        ctx.fillText(trigrams[i], tx, ty + 3.5);
      }

      // Inner contracting warning circle indicating exact strike timing
      const innerR = Math.max(8, zone.radius * (1 - progress));
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, innerR, innerR * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 6 Crawling electric arcs crackling between rune nodes on the ground
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) {
        const arcAngle = (i * Math.PI / 3) + rot * 2.2;
        const r1 = zone.radius * 0.25;
        const r2 = zone.radius * 0.88;
        const x1 = Math.cos(arcAngle) * r1;
        const y1 = Math.sin(arcAngle) * (r1 * 0.48);
        const midX = Math.cos(arcAngle + 0.3) * (r1 + r2) * 0.5 + (Math.sin(time * 0.02 + i) * 8);
        const midY = Math.sin(arcAngle + 0.3) * ((r1 + r2) * 0.5 * 0.48) + (Math.cos(time * 0.02 + i) * 4);
        const x2 = Math.cos(arcAngle) * r2;
        const y2 = Math.sin(arcAngle) * (r2 * 0.48);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(midX, midY);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    } else if (zone.phase === 'strike') {
      // ========================================================
      // 2. STRIKE PHASE: Giant Multi-Branching Fractal Heavenly Thunder
      // ========================================================
      const strikeProgress = zone.timer / zone.strikeDuration;
      const alpha = Math.min(1, strikeProgress * 1.6);

      // Blinding ground impact flash
      ctx.fillStyle = `rgba(240, 249, 255, ${0.9 * alpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, zone.radius * 1.25, zone.radius * 0.56, 0, 0, Math.PI * 2);
      ctx.fill();

      // Violet-cyan outer ionization plasma sheath
      const colGrad = ctx.createLinearGradient(-45, 0, 45, 0);
      colGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
      colGrad.addColorStop(0.3, `rgba(56, 189, 248, ${0.9 * alpha})`);
      colGrad.addColorStop(0.7, `rgba(168, 85, 247, ${0.9 * alpha})`);
      colGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = colGrad;
      ctx.fillRect(-45, -500, 90, 510);

      // Core incandescent white lightning trunk from sky (-500px down to ground)
      ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * alpha})`;
      ctx.fillRect(-12, -500, 24, 510);

      // 4 Multi-branching fractal lightning bolts with procedural jagged offsets
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      for (let b = 0; b < 4; b++) {
        const side = b === 0 ? -1 : b === 1 ? 1 : b === 2 ? -0.5 : 0.5;
        ctx.beginPath();
        ctx.moveTo(side * 12, -480);
        let curY = -480;
        let curX = side * 12;
        while (curY < 0) {
          curY += 50 + ((b * 17) % 30);
          curX += Math.sin(curY * 0.08 + b) * 35;
          ctx.lineTo(curX, Math.min(0, curY));
        }
        ctx.stroke();

        // Sub-forks
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(curX * 0.6, -180);
        ctx.lineTo(curX * 0.6 + side * 28, -90);
        ctx.lineTo(curX * 0.6 + side * 40, 0);
        ctx.stroke();
      }

      // Expanding ground shockwave rings
      ctx.strokeStyle = `rgba(147, 51, 234, ${0.95 * alpha})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, zone.radius * (1.35 - strikeProgress * 0.35), zone.radius * 0.58 * (1.35 - strikeProgress * 0.35), 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(56, 189, 248, ${0.85 * alpha})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(0, 0, zone.radius * (1.1 - strikeProgress * 0.2), zone.radius * 0.52 * (1.1 - strikeProgress * 0.2), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (zone.phase === 'aftermath') {
      // ========================================================
      // 3. AFTERMATH PHASE: Smoking Blackened Scorch Mark with Fractures
      // ========================================================
      const alpha = Math.max(0, zone.timer / zone.aftermathDuration);

      // Charcoal scorch mark
      ctx.fillStyle = `rgba(24, 24, 27, ${0.72 * alpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, zone.radius * 0.8, zone.radius * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Radiating ground fracture crack lines
      ctx.strokeStyle = `rgba(15, 23, 42, ${0.85 * alpha})`;
      ctx.lineWidth = 1.8;
      for (let f = 0; f < 6; f++) {
        const fa = (f * Math.PI * 2) / 6;
        const fr = zone.radius * (0.65 + ((f % 2) * 0.25));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(fa) * (fr * 0.5), Math.sin(fa) * (fr * 0.25));
        ctx.lineTo(Math.cos(fa + 0.15) * fr, Math.sin(fa + 0.15) * (fr * 0.48));
        ctx.stroke();
      }

      // Lingering purple and cyan electric sparks dancing on the ground
      ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6 + (time * 0.004);
        const r = zone.radius * 0.48;
        const sx = Math.cos(a) * r;
        const sy = Math.sin(a) * (r * 0.48);
        ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
      }
    }

    ctx.restore();
  });
}


