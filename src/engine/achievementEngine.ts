import { PlayerStats } from '../types/game';
import { 
  AchievementDefinition, 
  AchievementProgress, 
  PlayerCollectionStats 
} from '../types/achievements';
import { ACHIEVEMENTS } from '../data/achievements';
import { TITLES } from '../data/titles';
import { ITEMS } from '../data/items';
import { recomputePlayerStats } from './cultivationEngine';
import { soundManager } from './audio';

export type AchievementEventType =
  | 'kill_enemy'
  | 'breakthrough'
  | 'meditate'
  | 'craft_pill'
  | 'forge_equipment'
  | 'open_chest'
  | 'read_stele'
  | 'solve_mechanism'
  | 'trade_spirit_stones'
  | 'join_sect'
  | 'promote_sect'
  | 'finish_quest'
  | 'reach_ending'
  | 'discover_map'
  | 'discover_clue'
  | 'crit_hit';

export interface AchievementEvent {
  type: AchievementEventType;
  payload?: any;
}

/**
 * Initializes player achievements, titles, and collection stats if missing
 */
export function initPlayerAchievements(player: PlayerStats): PlayerStats {
  const currentAchievements: Record<string, AchievementProgress> = { ...(player.achievements || {}) };

  // Populate default progress for all achievements in database
  Object.keys(ACHIEVEMENTS).forEach(achId => {
    if (!currentAchievements[achId]) {
      currentAchievements[achId] = {
        unlocked: false,
        progress: 0,
        claimed: false,
      };
    }
  });

  const unlockedTitleIds = Array.isArray(player.unlockedTitleIds) && player.unlockedTitleIds.length > 0
    ? [...player.unlockedTitleIds]
    : ['title_thon_gian'];

  if (!unlockedTitleIds.includes('title_thon_gian')) {
    unlockedTitleIds.unshift('title_thon_gian');
  }

  const equippedTitleId = player.equippedTitleId || 'title_thon_gian';
  const equippedTitleName = TITLES[equippedTitleId]?.name || player.title || 'Thôn Gian Thiếu Niên';

  const defaultCollectionStats: PlayerCollectionStats = {
    defeatedBosses: {},
    totalKills: 0,
    craftedPills: {},
    craftedEquipments: {},
    totalCrafts: 0,
    openedChests: [],
    readSteles: [],
    solvedMechanisms: [],
    unlockedEndings: [],
    discoveredClues: [],
    totalTrades: 0,
    totalSpentStones: 0,
    breakthroughCountWithoutPill: 0,
    tribulationPassedCount: 0,
    bossNoDeathVictories: 0,
  };

  const collectionStats: PlayerCollectionStats = {
    ...defaultCollectionStats,
    ...(player.collectionStats || {}),
    defeatedBosses: { ...(player.collectionStats?.defeatedBosses || {}) },
    craftedPills: { ...(player.collectionStats?.craftedPills || {}) },
    craftedEquipments: { ...(player.collectionStats?.craftedEquipments || {}) },
    openedChests: [...(player.collectionStats?.openedChests || [])],
    readSteles: [...(player.collectionStats?.readSteles || [])],
    solvedMechanisms: [...(player.collectionStats?.solvedMechanisms || [])],
    unlockedEndings: [...(player.collectionStats?.unlockedEndings || [])],
    discoveredClues: [...(player.collectionStats?.discoveredClues || [])],
  };

  return {
    ...player,
    title: equippedTitleName,
    equippedTitleId,
    unlockedTitleIds,
    achievements: currentAchievements,
    collectionStats,
  };
}

/**
 * Checks and updates achievements based on state and returns newly unlocked list
 */
export function checkAllAchievements(
  playerInput: PlayerStats,
  onNotify?: (ach: AchievementDefinition) => void
): { updatedPlayer: PlayerStats; newlyUnlocked: AchievementDefinition[] } {
  let player = initPlayerAchievements(playerInput);
  const achievements = { ...player.achievements! };
  const collection = { ...player.collectionStats! };
  const unlockedTitleIds = [...(player.unlockedTitleIds || ['title_thon_gian'])];
  const newlyUnlocked: AchievementDefinition[] = [];

  const updateProgress = (achId: string, currentVal: number) => {
    const achDef = ACHIEVEMENTS[achId];
    if (!achDef) return;
    const current = achievements[achId] || { unlocked: false, progress: 0, claimed: false };

    const newProg = Math.min(achDef.maxProgress, Math.max(current.progress, currentVal));
    const wasUnlocked = current.unlocked;
    const isNowUnlocked = newProg >= achDef.maxProgress;

    achievements[achId] = {
      ...current,
      progress: newProg,
      unlocked: wasUnlocked || isNowUnlocked,
      unlockedAt: wasUnlocked
        ? current.unlockedAt
        : isNowUnlocked
        ? (current.unlockedAt || new Date().toLocaleString('vi-VN'))
        : undefined,
    };

    if (!wasUnlocked && isNowUnlocked) {
      newlyUnlocked.push(achDef);
      // Auto-unlock title if achievement grants one
      if (achDef.reward.titleId && !unlockedTitleIds.includes(achDef.reward.titleId)) {
        unlockedTitleIds.push(achDef.reward.titleId);
      }
      if (onNotify) {
        onNotify(achDef);
      }
    }
  };

  // 1. CULTIVATION CHECKS
  // Realm level (0 = Phan Nhan, 1 = Luyen Khi 1, 14 = Truc Co 1, 18 = Kim Dan 1, etc.)
  if (player.realmIndex >= 1) updateProgress('ach_tu_tien_nhap_mon', 1);
  if (player.realmIndex >= 1) updateProgress('ach_dot_pha_dau_tien', 1);
  if (player.realmIndex >= 14) updateProgress('ach_truc_co_dai_dao', 1);
  if (player.realmIndex >= 18) updateProgress('ach_kim_dan_dai_dao', 1);
  if (player.realmIndex >= 22) updateProgress('ach_nguyen_anh_lao_to', 1);
  if (player.realmIndex >= 24) updateProgress('ach_hoa_than_chi_ton', 1);

  if (collection.tribulationPassedCount >= 1) updateProgress('ach_thien_kiep_vuot_qua', 1);
  if (collection.breakthroughCountWithoutPill >= 1) updateProgress('ach_nghich_thien_khong_dan', 1);
  if ((player.cultivationCount || 0) >= 1) updateProgress('ach_tinh_toa_khac_kho', player.cultivationCount || 0);

  // 2. COMBAT CHECKS
  updateProgress('ach_diet_yeu_so_cap', collection.totalKills);
  updateProgress('ach_diet_yeu_bach_chien', collection.totalKills);
  updateProgress('ach_diet_yeu_thien_quan', collection.totalKills);

  const totalBossKills = Object.values(collection.defeatedBosses).reduce((a, b) => a + b, 0);
  if (totalBossKills >= 1) updateProgress('ach_boss_dau_tien', 1);
  if ((collection.defeatedBosses['boss_hac_huyet_vien_vuong'] || 0) >= 1) updateProgress('ach_boss_hac_huyet_vien', 1);
  if ((collection.defeatedBosses['boss_ma_linh_hat_vuong'] || 0) >= 1) updateProgress('ach_boss_ma_linh_hat', 1);
  if ((collection.defeatedBosses['boss_co_thi_ma_ton'] || 0) >= 1) updateProgress('ach_boss_co_thi_ma_ton', 1);
  if (collection.bossNoDeathVictories >= 1) updateProgress('ach_boss_vo_thuong', 1);

  // 3. EXPLORATION CHECKS
  const discoveredCount = player.discoveredMaps ? player.discoveredMaps.length : 1;
  updateProgress('ach_kham_pha_toan_canh', discoveredCount);

  if (player.discoveredMaps?.includes('map_hac_phong_bi_canh')) updateProgress('ach_bi_canh_dong_phu', 1);
  if (player.discoveredMaps?.includes('map_ancient_ruins')) updateProgress('ach_co_di_tich_bi_an', 1);

  updateProgress('ach_mo_co_bao_ruong', collection.openedChests.length);
  if (collection.solvedMechanisms.length >= 1) updateProgress('ach_giai_ma_co_quan', 1);
  if (collection.readSteles.length >= 1) updateProgress('ach_tham_ngo_thach_bi', 1);
  updateProgress('ach_manh_moi_co_ngoc', collection.discoveredClues.length);

  // 4. QUESTS & STORY CHECKS
  const completedQ = player.completedQuestIds || [];
  if (completedQ.includes('quest_c1_4') || completedQ.includes('quest_c1_3')) updateProgress('ach_chuong_1_hoan_thanh', 1);
  if (completedQ.includes('quest_c2_3') || completedQ.includes('quest_c2_2')) updateProgress('ach_chuong_2_hoan_thanh', 1);
  if (completedQ.includes('quest_c3_3') || completedQ.includes('quest_c3_2')) updateProgress('ach_chuong_3_hoan_thanh', 1);
  if (completedQ.includes('quest_c4_2') || completedQ.includes('quest_c4_1')) updateProgress('ach_chuong_4_hoan_thanh', 1);
  if (completedQ.includes('quest_c5_1')) updateProgress('ach_chuong_5_hoan_thanh', 1);

  const sideCompletedCount = completedQ.filter(qId => qId.includes('side') || qId.includes('sect') || qId.includes('tps')).length;
  updateProgress('ach_chuoi_nhiem_vu_phu', sideCompletedCount);

  if (collection.unlockedEndings.includes('ending_nghich_menh')) updateProgress('ach_ket_thuc_nghich_menh', 1);
  if (collection.unlockedEndings.includes('ending_thu_ho')) updateProgress('ach_ket_thuc_thu_ho', 1);
  if (collection.unlockedEndings.includes('ending_truy_cau')) updateProgress('ach_ket_thuc_truy_cau', 1);

  if (player.storyFlags?.savedMacLao || player.storyFlags?.macLaoSecretKnown) {
    updateProgress('ach_an_bi_mat_mac_lao', 1);
  }

  // 5. SECT & COMMERCE CHECKS
  if (player.sectId && player.sectId !== 'none') {
    updateProgress('ach_gia_nhap_tong_mon', 1);
    if (player.sectId === 'tan_tu') {
      updateProgress('ach_doc_hanh_tan_tu', 1);
      if (!unlockedTitleIds.includes('title_doc_hanh_kiem_tien') && player.realmIndex >= 14) {
        unlockedTitleIds.push('title_doc_hanh_kiem_tien');
      }
    }
  }

  if (player.sectRank === 'inner' || player.sectRank === 'core' || player.sectRank === 'elder' || player.sectRank === 'master') {
    updateProgress('ach_tan_thang_noi_mon', 1);
  }
  if (player.sectRank === 'core' || player.sectRank === 'elder' || player.sectRank === 'master') {
    updateProgress('ach_tan_thang_chan_truyen', 1);
  }

  updateProgress('ach_cong_hien_tram_diem', player.contributionPoints || 0);
  updateProgress('ach_giao_dich_phuong_thi', collection.totalSpentStones);

  const maxRep = Math.max(0, ...Object.values(player.factionReputation || {}));
  updateProgress('ach_danh_vong_hien_hach', maxRep);

  const playerControlled = Object.values(player.territoryControl || {}).filter(fac => fac === player.sectId).length;
  if (playerControlled >= 1 || (player.warState?.battleVictories || 0) >= 1) {
    updateProgress('ach_chiem_linh_cu_diem', 1);
  }

  // 6. CRAFTING & ARTIFACTS CHECKS
  const totalPillsCrafted = Object.values(collection.craftedPills).reduce((a, b) => a + b, 0);
  if (totalPillsCrafted >= 1) updateProgress('ach_luyen_dan_dau_tien', 1);
  updateProgress('ach_dan_dao_dai_su', totalPillsCrafted);

  const totalForged = Object.values(collection.craftedEquipments).reduce((a, b) => a + b, 0);
  if (totalForged >= 1) updateProgress('ach_luyen_khi_dau_tien', 1);

  // Check inventory for high tier items or Co Khuyet Kiem
  const hasRareEquipment = player.inventory.some(s => s.item.rarity === 'huyen' || s.item.rarity === 'dia' || s.item.rarity === 'thien') ||
    [player.equipment.weapon, player.equipment.armor, player.equipment.accessory, player.equipment.talisman].some(
      it => it && (it.rarity === 'huyen' || it.rarity === 'dia' || it.rarity === 'thien')
    );
  if (hasRareEquipment) updateProgress('ach_than_binh_xuat_the', 1);

  const rareHerbsCount = player.inventory.filter(s => 
    s.item.id === 'bach_nien_linh_chi' || s.item.id === 'thien_linh_thao' || s.item.id === 'chu_qua' || s.item.id === 'huyet_tinh_chi'
  ).reduce((sum, slot) => sum + slot.count, 0);
  if (rareHerbsCount >= 1) updateProgress('ach_thu_thap_duoc_thao_hiem', rareHerbsCount);

  const hasCoKhuyet = player.inventory.some(s => s.item.id === 'co_khuyet_kiem') || player.equipment.weapon?.id === 'co_khuyet_kiem';
  if (hasCoKhuyet) updateProgress('ach_phap_bao_co_khuyet', 1);

  const artsMastered = player.learnedArtIds ? player.learnedArtIds.length : 1;
  updateProgress('ach_dai_vien_man_cong_phap', artsMastered);

  return {
    updatedPlayer: {
      ...player,
      achievements,
      collectionStats: collection,
      unlockedTitleIds,
    },
    newlyUnlocked,
  };
}

/**
 * Dispatches an event to update collection stats and trigger achievement evaluations
 */
export function recordEvent(
  playerInput: PlayerStats,
  event: AchievementEvent,
  onNotify?: (ach: AchievementDefinition) => void
): PlayerStats {
  const player = initPlayerAchievements(playerInput);
  const col = { ...player.collectionStats! };

  switch (event.type) {
    case 'kill_enemy': {
      col.totalKills += 1;
      const { enemyId, isBoss } = event.payload || {};
      if (isBoss) {
        let bossKey = 'boss_other';
        const lower = (enemyId || '').toLowerCase();
        if (lower.includes('viên vương') || lower.includes('monkey')) bossKey = 'boss_hac_huyet_vien_vuong';
        else if (lower.includes('hạt vương') || lower.includes('scorpion')) bossKey = 'boss_ma_linh_hat_vuong';
        else if (lower.includes('ma tôn') || lower.includes('corpse')) bossKey = 'boss_co_thi_ma_ton';
        else if (lower.includes('mãng') || lower.includes('snake')) bossKey = 'boss_thanh_phong_cu_mang';
        else if (lower.includes('trư') || lower.includes('boar')) bossKey = 'boss_heo_rung';

        col.defeatedBosses[bossKey] = (col.defeatedBosses[bossKey] || 0) + 1;
        if (!player.isDead) {
          col.bossNoDeathVictories += 1;
        }
      }
      break;
    }

    case 'breakthrough': {
      const { usedPill, passedTribulation } = event.payload || {};
      if (!usedPill) {
        col.breakthroughCountWithoutPill += 1;
      }
      if (passedTribulation) {
        col.tribulationPassedCount += 1;
      }
      break;
    }

    case 'meditate': {
      player.cultivationCount = (player.cultivationCount || 0) + 1;
      break;
    }

    case 'craft_pill': {
      const { pillId } = event.payload || {};
      if (pillId) {
        col.craftedPills[pillId] = (col.craftedPills[pillId] || 0) + 1;
        col.totalCrafts += 1;
      }
      break;
    }

    case 'forge_equipment': {
      const { itemId } = event.payload || {};
      if (itemId) {
        col.craftedEquipments[itemId] = (col.craftedEquipments[itemId] || 0) + 1;
        col.totalCrafts += 1;
      }
      break;
    }

    case 'open_chest': {
      const { chestId } = event.payload || {};
      if (chestId && !col.openedChests.includes(chestId)) {
        col.openedChests.push(chestId);
      }
      break;
    }

    case 'read_stele': {
      const { steleId } = event.payload || {};
      if (steleId && !col.readSteles.includes(steleId)) {
        col.readSteles.push(steleId);
      }
      break;
    }

    case 'solve_mechanism': {
      const { altarId } = event.payload || {};
      if (altarId && !col.solvedMechanisms.includes(altarId)) {
        col.solvedMechanisms.push(altarId);
      }
      break;
    }

    case 'trade_spirit_stones': {
      const { amount } = event.payload || {};
      if (typeof amount === 'number' && amount > 0) {
        col.totalSpentStones += amount;
        col.totalTrades += 1;
      }
      break;
    }

    case 'finish_quest': {
      const { questId } = event.payload || {};
      if (questId && !player.completedQuestIds.includes(questId)) {
        player.completedQuestIds = [...player.completedQuestIds, questId];
      }
      break;
    }

    case 'reach_ending': {
      const { endingId } = event.payload || {};
      if (endingId && !col.unlockedEndings.includes(endingId)) {
        col.unlockedEndings.push(endingId);
      }
      break;
    }

    case 'discover_clue': {
      const { clueId } = event.payload || {};
      if (clueId && !col.discoveredClues.includes(clueId)) {
        col.discoveredClues.push(clueId);
      }
      break;
    }

    case 'discover_map': {
      const { mapId } = event.payload || {};
      if (mapId && !player.discoveredMaps.includes(mapId)) {
        player.discoveredMaps = [...player.discoveredMaps, mapId];
      }
      break;
    }

    case 'crit_hit': {
      const { damage } = event.payload || {};
      if (damage && damage > 50) {
        // Just checking
      }
      break;
    }
  }

  const updatedWithCol = {
    ...player,
    collectionStats: col,
  };

  const { updatedPlayer } = checkAllAchievements(updatedWithCol, onNotify);
  return updatedPlayer;
}

/**
 * Claims achievement reward safely (only once)
 */
export function claimAchievementReward(
  playerInput: PlayerStats,
  achievementId: string
): { success: boolean; message: string; updatedPlayer: PlayerStats } {
  let player = initPlayerAchievements(playerInput);
  const achDef = ACHIEVEMENTS[achievementId];
  const achState = player.achievements?.[achievementId];

  if (!achDef) {
    return { success: false, message: 'Thành tựu không tồn tại!', updatedPlayer: player };
  }
  if (!achState || !achState.unlocked) {
    return { success: false, message: 'Thành tựu chưa hoàn thành điều kiện mở khóa!', updatedPlayer: player };
  }
  if (achState.claimed) {
    return { success: false, message: 'Đạo hữu đã nhận phần thưởng này rồi!', updatedPlayer: player };
  }

  // Grant rewards
  let updatedInv = [...player.inventory];
  if (achDef.reward.items && achDef.reward.items.length > 0) {
    for (const rew of achDef.reward.items) {
      const it = ITEMS[rew.itemId];
      if (it) {
        const existing = updatedInv.find(s => s.item.id === it.id);
        if (existing && it.stackable) {
          existing.count += rew.count;
        } else if (updatedInv.length < player.maxInventorySize) {
          updatedInv.push({ item: it, count: rew.count });
        }
      }
    }
  }

  const unlockedTitles = [...(player.unlockedTitleIds || ['title_thon_gian'])];
  if (achDef.reward.titleId && !unlockedTitles.includes(achDef.reward.titleId)) {
    unlockedTitles.push(achDef.reward.titleId);
  }

  const nextRep = { ...(player.factionReputation || {}) };
  if (achDef.reward.reputationBonus) {
    const { factionId, amount } = achDef.reward.reputationBonus;
    nextRep[factionId] = (nextRep[factionId] || 0) + amount;
  }

  const updatedAchievements = {
    ...player.achievements,
    [achievementId]: {
      ...achState,
      claimed: true,
    },
  };

  soundManager.playQuestComplete();

  let message = `Đã nhận thưởng thành tựu [${achDef.name}]!`;
  if (achDef.reward.spiritStones) message += ` +${achDef.reward.spiritStones} Linh thạch.`;
  if (achDef.reward.exp) message += ` +${achDef.reward.exp} Tu vi.`;
  if (achDef.reward.titleId) {
    const titleName = TITLES[achDef.reward.titleId]?.name || achDef.reward.titleId;
    message += ` Mở khóa danh hiệu mới: [${titleName}]!`;
  }

  const updatedPlayer = recomputePlayerStats({
    ...player,
    spiritStones: player.spiritStones + (achDef.reward.spiritStones || 0),
    exp: player.exp + (achDef.reward.exp || 0),
    inventory: updatedInv,
    unlockedTitleIds: unlockedTitles,
    factionReputation: nextRep,
    achievements: updatedAchievements,
  });

  return {
    success: true,
    message,
    updatedPlayer,
  };
}

/**
 * Equips or unequips a title, recomputing all player stats
 */
export function equipTitle(playerInput: PlayerStats, titleId: string | null): PlayerStats {
  const player = initPlayerAchievements(playerInput);
  
  if (titleId && !player.unlockedTitleIds?.includes(titleId)) {
    return player; // Not unlocked
  }

  const targetTitleId = titleId || 'title_thon_gian';
  const targetTitle = TITLES[targetTitleId] || TITLES.title_thon_gian;

  soundManager.playCollect();

  return recomputePlayerStats({
    ...player,
    equippedTitleId: targetTitleId,
    title: targetTitle.name,
  });
}
