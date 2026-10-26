import { PlayerStats, SpiritualRoot } from '../types/game';
import { ITEMS } from './items';
import { DEFAULT_SKILLS, getInitialSkillsForRoot } from './arts';
import { INITIAL_QUESTS } from './quests';
import { initPlayerAchievements } from '../engine/achievementEngine';
import { rollRandomSpiritualRoot, getSpiritualRootConfig } from './spiritualRoots';

export function createInitialPlayer(forcedRoot?: SpiritualRoot): PlayerStats {
  const root = forcedRoot || rollRandomSpiritualRoot();
  const rootCfg = getSpiritualRootConfig(root);
  const talents = rootCfg.talents;

  // Determine initial art matching the rolled root
  let initialArtId = 'truong_sinh_quyet';
  if (root.type === 'hoa') initialArtId = 'thuan_duong_hoa_quyet';
  else if (root.type === 'kim') initialArtId = 'thanh_phong_kiem_quyet';
  else if (root.type === 'thuy') initialArtId = 'huyen_bang_quyet';
  else if (root.type === 'tho') initialArtId = 'kim_cuong_than';
  else if (root.type === 'loi') initialArtId = 'thanh_phong_kiem_quyet';

  const initialSkills = getInitialSkillsForRoot(root.type);

  const baseHp = Math.round(120 * (1 + talents.hpBonusPercent));
  const baseMp = Math.round(30 * (1 + talents.mpBonusPercent));
  const baseAtk = Math.round(18 * (1 + talents.atkBonusPercent));
  const baseDef = Math.round(10 * (1 + talents.defBonusPercent));
  const baseSpeed = 175 + talents.speedBonus;
  const baseCrit = 0.05 + talents.critRateBonus;

  const rawPlayer: PlayerStats = {
    name: 'Lâm Mặc',
    title: 'Thôn Gian Thiếu Niên',
    realmIndex: 0, // Phàm Nhân Sơ Kỳ
    exp: 0,
    hp: baseHp,
    maxHp: baseHp,
    mp: baseMp,
    maxMp: baseMp,
    atk: baseAtk,
    def: baseDef,
    speed: baseSpeed,
    critRate: baseCrit,
    consciousness: 15,
    comprehension: 20,
    physique: 15,
    spiritualRoot: root,
    spiritStones: 30,
    currentArtId: initialArtId,
    learnedArtIds: [initialArtId],
    equippedSkills: initialSkills,
    equipment: {
      weapon: ITEMS.moc_kiem,
      armor: ITEMS.tho_bo_y,
      accessory: null,
      talisman: null,
    },
    inventory: [
      { item: ITEMS.kim_sang_dan, count: 2 },
      { item: ITEMS.ngung_huyet_thao, count: 1 },
      { item: ITEMS.thiet_khoang, count: 2 },
    ],
    maxInventorySize: 32,
    activeQuests: [INITIAL_QUESTS.quest_c1_1],
    completedQuestIds: [],
    discoveredMaps: ['map_thanh_khe'],
    currentMapId: 'map_thanh_khe',
    x: 380,
    y: 430,
    facing: 'right',
    isDodging: false,
    dodgeCooldown: 0,
    dodgeTimer: 0,
    statusEffects: {
      injured: false,
      qiDeviation: false,
      poisoned: false,
    },
    storyFlags: {
      savedMacLao: false,
      sectChoice: 'none',
      metShopkeeper: false,
    },
    karma: 50,
    sectId: 'none',
    sectRank: 'visitor',
    contributionPoints: 0,
    factionReputation: {
      thanh_van_tong: 0,
      tan_tu_lien_minh: 15,
      van_bao_thuong_hoi: 10,
      bach_thao_coc: 20,
      hac_phong_mon: -50,
      hac_sat_mon: -50,
      co_ngoc_bi_an: 0,
    },
    gameTime: {
      year: 1,
      day: 1,
      hour: 5, // Giờ Thìn
    },
    cultivationCount: 0,
    exploredDungeons: [],
    clearedMechanisms: [],
    territoryControl: {
      stronghold_hac_phong_mine: 'hac_phong_mon',
      stronghold_linh_vu_herb_field: 'bach_thao_coc',
      stronghold_ancient_cave_core: 'neutral',
      stronghold_phuong_thi_checkpoint: 'tan_tu_lien_minh',
    },
    warState: {
      stage: 'tension',
      thanhVanPoints: 100,
      hacPhongPoints: 100,
      playerStance: 'neutral',
      battleVictories: 0,
      lastEventDay: 1,
    },
    activeWorldEventIds: ['event_beast_tide_village', 'event_ambush_caravan'],
    completedEventIds: [],
    equippedTitleId: 'title_thon_gian',
    unlockedTitleIds: ['title_thon_gian'],
    learnedAlchemyRecipeIds: ['recipe_kim_sang_dan', 'recipe_hoi_khi_dan', 'recipe_tu_khi_dan'],
    learnedForgingRecipeIds: ['forge_moc_kiem', 'forge_thanh_phong_kiem', 'forge_thanh_van_dao_bao', 'forge_than_hanh_phu'],
    alchemyFurnaceLevel: 1,
    forgingAnvilLevel: 1,
    passiveShieldCooldown: 0,
  };

  return initPlayerAchievements(rawPlayer);
}
