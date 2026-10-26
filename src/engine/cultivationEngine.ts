import { PlayerStats, RealmInfo, Item, SpiritualRoot, ElementType } from '../types/game';
import { REALMS } from '../data/realms';
import { CULTIVATION_ARTS } from '../data/arts';
import { ITEMS } from '../data/items';
import { TITLES } from '../data/titles';

export const CANH_GIO_NAMES = [
  'Giờ Tý (23h - 01h)',
  'Giờ Sửu (01h - 03h)',
  'Giờ Dần (03h - 05h)',
  'Giờ Mão (05h - 07h)',
  'Giờ Thìn (07h - 09h)',
  'Giờ Tỵ (09h - 11h)',
  'Giờ Ngọ (11h - 13h)',
  'Giờ Mùi (13h - 15h)',
  'Giờ Thân (15h - 17h)',
  'Giờ Dậu (17h - 19h)',
  'Giờ Tuất (19h - 21h)',
  'Giờ Hợi (21h - 23h)',
];

export function getCanhGioName(hour: number): string {
  const index = Math.max(0, Math.min(11, (hour - 1) % 12));
  return CANH_GIO_NAMES[index];
}

export function formatGameTime(gameTime?: { year: number; day: number; hour: number }): string {
  if (!gameTime) return 'Năm 1, Ngày 1 - Giờ Thìn';
  const canhGio = getCanhGioName(gameTime.hour);
  return `Năm ${gameTime.year}, Ngày ${gameTime.day} · ${canhGio}`;
}

export function advanceGameTime(
  currentTime?: { year: number; day: number; hour: number },
  hoursToAdd: number = 1
): { year: number; day: number; hour: number } {
  const time = currentTime ? { ...currentTime } : { year: 1, day: 1, hour: 5 };
  let totalHours = time.hour + hoursToAdd;
  
  while (totalHours > 12) {
    totalHours -= 12;
    time.day += 1;
    if (time.day > 360) {
      time.day = 1;
      time.year += 1;
    }
  }
  time.hour = totalHours;
  return time;
}

/**
 * Calculate Spiritual Root affinity (0% - 100%) for a given element
 */
export function calculateRootAffinity(spiritualRoot: SpiritualRoot, element: ElementType): number {
  const elements = spiritualRoot?.elements || { kim: 50, moc: 50, thuy: 50, hoa: 50, tho: 50 };
  const purity = spiritualRoot?.purity ?? 45;

  if (element === 'kim') return elements.kim ?? 50;
  if (element === 'moc') return elements.moc ?? 50;
  if (element === 'thuy') return elements.thuy ?? 50;
  if (element === 'hoa') return elements.hoa ?? 50;
  if (element === 'tho') return elements.tho ?? 50;

  // For Ngu Hanh or special elements (Loi / Phong), average of all five elements + purity factor
  const avg = (
    (elements.kim ?? 50) +
    (elements.moc ?? 50) +
    (elements.thuy ?? 50) +
    (elements.hoa ?? 50) +
    (elements.tho ?? 50)
  ) / 5;
  return Math.min(100, Math.round(avg * 1.1 + purity * 0.15));
}

/**
 * Get effective Exp absorption multiplier from active art and spiritual root
 */
export function getEffectiveExpMultiplier(player: PlayerStats): {
  totalMultiplier: number;
  artMultiplier: number;
  affinityBonus: number;
  affinityPercent: number;
} {
  const art = CULTIVATION_ARTS[player.currentArtId] || CULTIVATION_ARTS.truong_sinh_quyet;
  const affinity = calculateRootAffinity(player.spiritualRoot, art.element);
  
  // Higher affinity grants up to +40% extra absorption speed
  const affinityBonus = (affinity / 100) * 0.35;
  const totalMultiplier = Math.round((art.expMultiplier + affinityBonus) * 100) / 100;

  return {
    totalMultiplier,
    artMultiplier: art.expMultiplier,
    affinityBonus: Math.round(affinityBonus * 100) / 100,
    affinityPercent: affinity,
  };
}

/**
 * Helper to compute stats of an item with its enhancement level (+1 to +9) and quality
 */
export function getItemEnhancedStats(item: Item | null): {
  atk: number;
  def: number;
  hp: number;
  mp: number;
  speed: number;
  critRate: number;
} {
  if (!item || !item.stats) {
    return { atk: 0, def: 0, hp: 0, mp: 0, speed: 0, critRate: 0 };
  }

  const enhLevel = item.enhancementLevel || 0;
  const enhMult = 1 + enhLevel * 0.15; // +15% per enhancement level
  let qualMult = 1.0;
  if (item.quality === 'cuc_pham') qualMult = 1.5;
  else if (item.quality === 'thuong_pham') qualMult = 1.35;
  else if (item.quality === 'trung_pham') qualMult = 1.2;

  return {
    atk: Math.round((item.stats.atk || 0) * enhMult * qualMult),
    def: Math.round((item.stats.def || 0) * enhMult * qualMult),
    hp: Math.round((item.stats.hp || 0) * enhMult * qualMult),
    mp: Math.round((item.stats.mp || 0) * enhMult * qualMult),
    speed: Math.round((item.stats.speed || 0) * enhMult),
    critRate: Math.round(((item.stats.critRate || 0) * enhMult) * 100) / 100,
  };
}

/**
 * Recomputes player derived combat stats based on Realm, Equipment, Active Art, and status
 */
export function recomputePlayerStats(player: PlayerStats): PlayerStats {
  const realm = REALMS[player.realmIndex] || REALMS[0];
  const art = CULTIVATION_ARTS[player.currentArtId] || CULTIVATION_ARTS.truong_sinh_quyet;
  const eq = player.equipment;

  // Title stat bonuses
  const activeTitle = player.equippedTitleId ? TITLES[player.equippedTitleId] : null;
  const titleAtk = activeTitle?.statsBonus?.atk || 0;
  const titleDef = activeTitle?.statsBonus?.def || 0;
  const titleHp = activeTitle?.statsBonus?.hp || 0;
  const titleMp = activeTitle?.statsBonus?.mp || 0;
  const titleSpeed = activeTitle?.statsBonus?.speed || 0;
  const titleCrit = activeTitle?.statsBonus?.critRate || 0;

  // Enhanced equipment stats
  const wStats = getItemEnhancedStats(eq.weapon);
  const aStats = getItemEnhancedStats(eq.armor);
  const accStats = getItemEnhancedStats(eq.accessory);
  const tStats = getItemEnhancedStats(eq.talisman);

  // Equipment flat additions (including weapon, armor, accessory, and talisman)
  const eqAtk = wStats.atk + aStats.atk + accStats.atk + tStats.atk + titleAtk;
  const eqDef = wStats.def + aStats.def + accStats.def + tStats.def + titleDef;
  const eqHp = wStats.hp + aStats.hp + accStats.hp + tStats.hp + titleHp;
  const eqMp = wStats.mp + aStats.mp + accStats.mp + tStats.mp + titleMp;
  const eqSpeed = wStats.speed + aStats.speed + accStats.speed + tStats.speed + titleSpeed;
  const eqCrit = wStats.critRate + aStats.critRate + accStats.critRate + tStats.critRate + titleCrit;

  // Active Cultivation Art percentage boosts
  const artHpBonus = art.statBonus?.hpPercent || 0;
  const artMpBonus = art.statBonus?.mpPercent || 0;
  const artAtkBonus = art.statBonus?.atkPercent || 0;
  const artDefBonus = art.statBonus?.defPercent || 0;

  // Base + Equipment scaled by Art
  const maxHp = Math.round((realm.baseHp + eqHp) * (1 + artHpBonus));
  const maxMp = Math.round((realm.baseMp + eqMp) * (1 + artMpBonus));
  let atk = Math.round((realm.baseAtk + eqAtk) * (1 + artAtkBonus));
  let def = Math.round((realm.baseDef + eqDef) * (1 + artDefBonus));
  let speed = Math.max(120, Math.round((realm.baseSpeed + eqSpeed)));
  let critRate = Math.min(0.75, 0.05 + eqCrit);

  // Injury penalties if hurt
  if (player.statusEffects.injured) {
    atk = Math.max(5, Math.floor(atk * 0.82));
    def = Math.max(3, Math.floor(def * 0.88));
  }
  if (player.statusEffects.qiDeviation) {
    atk = Math.max(5, Math.floor(atk * 0.70));
    speed = Math.max(100, Math.floor(speed * 0.85));
  }

  return {
    ...player,
    maxHp,
    maxMp,
    hp: Math.min(maxHp, player.hp),
    mp: Math.min(maxMp, player.mp),
    atk,
    def,
    speed,
    critRate,
  };
}

/**
 * Check if the player meets all conditions to attempt breakthrough
 */
export function canAttemptBreakthrough(player: PlayerStats): {
  canAttempt: boolean;
  reason?: string;
  hasPillRequirementWarning?: boolean;
  isTrucCoStep?: boolean;
} {
  const currentRealm = REALMS[player.realmIndex] || REALMS[0];
  const nextRealm = REALMS[player.realmIndex + 1];

  if (!nextRealm) {
    return { canAttempt: false, reason: 'Đạo hữu đã đạt tới cực hạn cảnh giới cao nhất hiện tại!' };
  }

  // Check Exp (Tu vi)
  if (player.exp < currentRealm.requiredExp) {
    return {
      canAttempt: false,
      reason: `Tu vi chưa viên mãn! Cần thêm ${currentRealm.requiredExp - player.exp} điểm Tu Vi để xung kích bình cảnh.`,
    };
  }

  // Check character state (Health and Status effects)
  if (player.statusEffects.injured) {
    return {
      canAttempt: false,
      reason: 'Đạo thể đang mang Thương Thế! Kinh mạch bất ổn, xung kích bình cảnh lúc này sẽ nguy hiểm tính mạng. Cần dùng Hồi Xuân Đan / Kim Sáng Đan trị thương trước.',
    };
  }

  if (player.statusEffects.qiDeviation) {
    return {
      canAttempt: false,
      reason: 'Đang vướng phải Tẩu Hỏa Nhập Ma! Thần thức hỗn loạn, cần dùng Định Thần Đan để bình ổn đan điền.',
    };
  }

  if (player.hp < player.maxHp * 0.4) {
    return {
      canAttempt: false,
      reason: 'Khí huyết suy nhược (dưới 40%)! Không đủ thể lực để chống đỡ thiên đạo áp bức khi đột phá.',
    };
  }

  // Check special milestone: Trúc Cơ (Luyện Khí Tầng 13 -> Trúc Cơ Sơ Kỳ)
  const isTrucCoStep = currentRealm.id === 'luyen_khi_13';
  const hasTrucCoDan = player.inventory.some(s => s.item.id === 'truc_co_dan' && s.count > 0);

  if (isTrucCoStep && !hasTrucCoDan) {
    return {
      canAttempt: true,
      hasPillRequirementWarning: true,
      isTrucCoStep: true,
      reason: 'CẢNH BÁO NGUY HIỂM: Đạo hữu đang xung kích TRÚC CƠ KỲ mà KHÔNG CÓ Trúc Cơ Đan! Tỷ lệ thành công cực thấp và phản phệ thiên kiếp có thể gây trọng thương!',
    };
  }

  return { canAttempt: true, isTrucCoStep };
}

/**
 * Calculate total breakthrough chance and detailed bonuses
 */
export function calculateBreakthroughChance(
  player: PlayerStats,
  pillItem?: Item | null
): {
  totalChance: number;
  baseChance: number;
  pillBonus: number;
  artBonus: number;
  rootBonus: number;
} {
  const currentRealm = REALMS[player.realmIndex] || REALMS[0];
  const art = CULTIVATION_ARTS[player.currentArtId] || CULTIVATION_ARTS.truong_sinh_quyet;
  const rootAffinity = calculateRootAffinity(player.spiritualRoot, art.element);

  const baseChance = currentRealm.breakthroughChance;
  const artBonus = art.breakthroughBonus || 0.05;
  const rootBonus = Math.max(0, (rootAffinity - 50) * 0.002); // -0% to +10%

  let pillBonus = 0;
  if (pillItem) {
    if (pillItem.stats?.breakthroughBonus) {
      pillBonus = pillItem.stats.breakthroughBonus / 100;
    } else if (pillItem.id === currentRealm.recommendedPillId && currentRealm.pillSuccessBonus) {
      pillBonus = currentRealm.pillSuccessBonus;
    } else if (pillItem.type === 'pill') {
      pillBonus = 0.15;
    }
  }

  const totalChance = Math.min(0.98, Math.max(0.15, baseChance + artBonus + rootBonus + pillBonus));

  return {
    totalChance: Math.round(totalChance * 100) / 100,
    baseChance: Math.round(baseChance * 100) / 100,
    pillBonus: Math.round(pillBonus * 100) / 100,
    artBonus: Math.round(artBonus * 100) / 100,
    rootBonus: Math.round(rootBonus * 100) / 100,
  };
}

/**
 * Execute a Cultivation Session (Đả Tọa Bế Quan)
 * Consumes in-game time and resources, awards authentic calculated Tu Vi
 */
export function performCultivationSession(
  player: PlayerStats,
  type: 'tieu_chu_thien' | 'dai_chu_thien' | 'luyen_dan_tro_tu',
  selectedPillId?: string
): {
  updatedPlayer: PlayerStats;
  expGained: number;
  hoursPassed: number;
  message: string;
  success: boolean;
} {
  const { totalMultiplier } = getEffectiveExpMultiplier(player);
  let hoursPassed = 2;
  let baseExp = 120;
  let message = '';

  let updatedPlayer = { ...player };

  if (type === 'tieu_chu_thien') {
    // 2 Canh Giờ, consumes 10 MP or 5 Spirit Stones
    hoursPassed = 2;
    baseExp = 150 + player.realmIndex * 35;
    
    if (updatedPlayer.spiritStones >= 5) {
      updatedPlayer.spiritStones -= 5;
    } else if (updatedPlayer.mp >= 10) {
      updatedPlayer.mp -= 10;
    } else {
      return {
        updatedPlayer: player,
        expGained: 0,
        hoursPassed: 0,
        message: 'Linh lực hoặc Linh thạch không đủ để vận chuyển Tiểu Chu Thiên!',
        success: false,
      };
    }
    
    const expGained = Math.round(baseExp * totalMultiplier);
    updatedPlayer.exp += expGained;
    updatedPlayer.gameTime = advanceGameTime(updatedPlayer.gameTime, hoursPassed);
    updatedPlayer.cultivationCount = (updatedPlayer.cultivationCount || 0) + 1;
    updatedPlayer = recomputePlayerStats(updatedPlayer);

    message = `Vận chuyển 36 vòng Tiểu Chu Thiên thuận lợi! Tiêu hao 2 Canh Giờ, hấp thu linh khí nhận được +${expGained} Tu Vi.`;
    return { updatedPlayer, expGained, hoursPassed, message, success: true };
  }

  if (type === 'dai_chu_thien') {
    // 6 Canh Giờ, consumes 25 Spirit Stones, restores HP/MP and gives comprehension
    hoursPassed = 6;
    if (updatedPlayer.spiritStones < 25) {
      return {
        updatedPlayer: player,
        expGained: 0,
        hoursPassed: 0,
        message: 'Không đủ 25 Linh Thạch để bố trí Tụ Linh Trận Bế Quan!',
        success: false,
      };
    }

    updatedPlayer.spiritStones -= 25;
    baseExp = 550 + player.realmIndex * 140;
    const expGained = Math.round(baseExp * totalMultiplier);

    updatedPlayer.exp += expGained;
    updatedPlayer.hp = updatedPlayer.maxHp;
    updatedPlayer.mp = updatedPlayer.maxMp;
    updatedPlayer.comprehension += 1;
    updatedPlayer.consciousness += 1;
    updatedPlayer.gameTime = advanceGameTime(updatedPlayer.gameTime, hoursPassed);
    updatedPlayer.cultivationCount = (updatedPlayer.cultivationCount || 0) + 1;
    updatedPlayer = recomputePlayerStats(updatedPlayer);

    message = `Bế quan 108 vòng Đại Chu Thiên trong Tụ Linh Trận! Tiêu hao 6 Canh Giờ và 25 Linh Thạch. Khí huyết hồi đầy, tăng +1 Ngộ Tính, +1 Thần Thức và +${expGained} Tu Vi!`;
    return { updatedPlayer, expGained, hoursPassed, message, success: true };
  }

  if (type === 'luyen_dan_tro_tu') {
    // Consumes a cultivation pill from inventory
    if (!selectedPillId) {
      return {
        updatedPlayer: player,
        expGained: 0,
        hoursPassed: 0,
        message: 'Hãy chọn một viên đan dược hỗ trợ tu luyện trong túi đồ!',
        success: false,
      };
    }

    const pillSlot = updatedPlayer.inventory.find(s => s.item.id === selectedPillId && s.count > 0);
    if (!pillSlot) {
      return {
        updatedPlayer: player,
        expGained: 0,
        hoursPassed: 0,
        message: 'Đan dược này đã hết hoặc không tồn tại!',
        success: false,
      };
    }

    hoursPassed = 4;
    const pill = pillSlot.item;
    baseExp = pill.useEffect?.addExp || 250;

    // Deduct 1 pill
    const updatedInv = updatedPlayer.inventory
      .map(s => s.item.id === selectedPillId ? { ...s, count: s.count - 1 } : s)
      .filter(s => s.count > 0);
    updatedPlayer.inventory = updatedInv;

    const expGained = Math.round(baseExp * totalMultiplier * 1.2);
    updatedPlayer.exp += expGained;
    updatedPlayer.gameTime = advanceGameTime(updatedPlayer.gameTime, hoursPassed);
    updatedPlayer.cultivationCount = (updatedPlayer.cultivationCount || 0) + 1;
    updatedPlayer = recomputePlayerStats(updatedPlayer);

    message = `Luyện hóa đan khí của [${pill.name}] thành công! Tiêu hao 4 Canh Giờ, đan độc được hóa giải hoàn toàn, hấp thu trọn vẹn +${expGained} Tu Vi!`;
    return { updatedPlayer, expGained, hoursPassed, message, success: true };
  }

  return {
    updatedPlayer: player,
    expGained: 0,
    hoursPassed: 0,
    message: 'Không rõ phương thức tu luyện!',
    success: false,
  };
}

/**
 * Execute Breakthrough Attempt
 * Checks conditions, calculates chances, handles success or backlash failure
 */
export function performBreakthroughAttempt(
  player: PlayerStats,
  selectedPillId?: string | null
): {
  updatedPlayer: PlayerStats;
  success: boolean;
  message: string;
  backlashDamage: number;
} {
  const currentRealm = REALMS[player.realmIndex] || REALMS[0];
  const nextRealm = REALMS[player.realmIndex + 1];

  if (!nextRealm) {
    return {
      updatedPlayer: player,
      success: false,
      message: 'Đạo hữu đã đạt cảnh giới cao nhất!',
      backlashDamage: 0,
    };
  }

  const check = canAttemptBreakthrough(player);
  if (!check.canAttempt) {
    return {
      updatedPlayer: player,
      success: false,
      message: check.reason || 'Chưa đủ điều kiện đột phá!',
      backlashDamage: 0,
    };
  }

  let pillItem: Item | null = null;
  let updatedInv = [...player.inventory];

  if (selectedPillId) {
    const slotIndex = updatedInv.findIndex(s => s.item.id === selectedPillId && s.count > 0);
    if (slotIndex !== -1) {
      pillItem = updatedInv[slotIndex].item;
      // Consume 1 pill
      updatedInv = updatedInv
        .map((s, idx) => idx === slotIndex ? { ...s, count: s.count - 1 } : s)
        .filter(s => s.count > 0);
    }
  }

  const { totalChance } = calculateBreakthroughChance(player, pillItem);
  const roll = Math.random();

  let updatedPlayer: PlayerStats = {
    ...player,
    inventory: updatedInv,
    gameTime: advanceGameTime(player.gameTime, 12), // 1 day of intense tribulation
  };

  if (roll <= totalChance) {
    // === SUCCESSFUL BREAKTHROUGH ===
    const newRealmIndex = player.realmIndex + 1;
    const remainingExp = Math.max(0, player.exp - currentRealm.requiredExp);

    updatedPlayer.realmIndex = newRealmIndex;
    updatedPlayer.exp = remainingExp;
    updatedPlayer.consciousness += 5;
    updatedPlayer.comprehension += 5;
    updatedPlayer.physique += 5;

    // Check newly unlocked skills for this realm
    const unlockedSkillNames: string[] = [];
    const allSkills = player.equippedSkills;
    allSkills.forEach(s => {
      if (s.requiredRealmIndex <= newRealmIndex) {
        unlockedSkillNames.push(s.name);
      }
    });

    // Recompute stats according to new realm
    updatedPlayer = recomputePlayerStats(updatedPlayer);
    // Fully heal on breakthrough!
    updatedPlayer.hp = updatedPlayer.maxHp;
    updatedPlayer.mp = updatedPlayer.maxMp;
    updatedPlayer.statusEffects = {
      ...updatedPlayer.statusEffects,
      injured: false,
      qiDeviation: false,
    };

    let msg = `🎉 CHÚC MỪNG ĐẠO HỮU NGHỊCH THIÊN ĐỘT PHÁ THÀNH CÔNG!\nChính thức tấn thăng [${nextRealm.fullName}]!`;
    if (nextRealm.unlockedFeature) {
      msg += `\nKhai mở: ${nextRealm.unlockedFeature}`;
    }

    return {
      updatedPlayer,
      success: true,
      message: msg,
      backlashDamage: 0,
    };
  } else {
    // === FAILED BREAKTHROUGH & BACKLASH ===
    let backlashDamage = currentRealm.tribulationDamage || 40;
    
    // If Kim Cuong art or high physique, mitigate backlash
    if (player.currentArtId === 'kim_cuong_than') {
      backlashDamage = Math.floor(backlashDamage * 0.5);
    }
    const physiqueMitigation = Math.min(0.3, (player.physique || 15) * 0.005);
    backlashDamage = Math.max(15, Math.floor(backlashDamage * (1 - physiqueMitigation)));

    // Lost 15% unstable exp
    const lostExp = Math.floor(currentRealm.requiredExp * 0.12);
    updatedPlayer.exp = Math.max(0, updatedPlayer.exp - lostExp);

    // Apply injury and HP damage
    updatedPlayer.hp = Math.max(10, updatedPlayer.hp - backlashDamage);
    updatedPlayer.statusEffects = {
      ...updatedPlayer.statusEffects,
      injured: true,
    };

    updatedPlayer = recomputePlayerStats(updatedPlayer);

    const msg = `⚡ ĐỘT PHÁ THẤT BẠI! Thiên đạo bình cảnh kiên cố, chân khí tán loạn nghịch chuyển!\nChịu tổn thương ${backlashDamage} Khí Huyết, thất thoát ${lostExp} Tu Vi và vướng phải trạng thái [Thương Thế]! Hãy dùng đan dược điều dưỡng kinh mạch trước khi thử lại.`;

    return {
      updatedPlayer,
      success: false,
      message: msg,
      backlashDamage,
    };
  }
}
