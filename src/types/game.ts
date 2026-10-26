export type RealmTier = 
  | 'phan_nhan_so' | 'phan_nhan_vien_man'
  | 'luyen_khi_1' | 'luyen_khi_2' | 'luyen_khi_3' | 'luyen_khi_4'
  | 'luyen_khi_5' | 'luyen_khi_6' | 'luyen_khi_7' | 'luyen_khi_8'
  | 'luyen_khi_9' | 'luyen_khi_10' | 'luyen_khi_11' | 'luyen_khi_12' | 'luyen_khi_13'
  | 'truc_co_so' | 'truc_co_trung' | 'truc_co_hau' | 'truc_co_vien_man'
  | 'kim_dan_so' | 'kim_dan_trung' | 'kim_dan_hau' | 'kim_dan_vien_man'
  | 'nguyen_anh_so' | 'nguyen_anh_vien_man'
  | 'hoa_than_so' | 'hoa_than_vien_man'
  | 'luyen_hu_so' | 'luyen_hu_vien_man'
  | 'hop_the_so' | 'hop_the_vien_man'
  | 'dai_thua_so' | 'dai_thua_vien_man'
  | 'do_kiep_so' | 'do_kiep_vien_man';

export interface RealmInfo {
  id: RealmTier;
  majorName: string; // e.g. "Luyện Khí"
  subName: string;   // e.g. "Tầng 3 (Sơ kỳ)"
  fullName: string;  // e.g. "Luyện Khí Tầng 3"
  stage: 'so_ky' | 'trung_ky' | 'hau_ky' | 'vien_man';
  requiredExp: number;
  baseHp: number;
  baseMp: number;
  baseAtk: number;
  baseDef: number;
  baseSpeed: number;
  breakthroughChance: number; // 0 to 1
  recommendedPillId?: string;
  pillSuccessBonus?: number;
  tribulationDamage?: number;
  tribulationType?: 'minor_thunder' | 'major_thunder' | 'nine_heavens' | 'chaos_tribulation' | 'dao_annihilation';
  hasInnerDemon?: boolean;
  innerDemonId?: string;
  requiredMaterials?: { itemId: string; count: number; name: string }[];
  unlockedFeature?: string;
  description: string;
}

export type ElementType = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho' | 'loi' | 'phong' | 'bang' | 'quang' | 'am' | 'ngu_hanh' | 'vat_ly';

export interface SpiritualRoot {
  name: string;
  type: ElementType;
  purity: number; // 1 to 100
  description: string;
  elements: {
    kim: number;
    moc: number;
    thuy: number;
    hoa: number;
    tho: number;
  };
}

export type ItemType = 'herb' | 'ore' | 'pill' | 'talisman' | 'weapon' | 'armor' | 'accessory' | 'manual' | 'quest' | 'treasure';

export type ItemRarity = 'pham' | 'hoang' | 'huyen' | 'dia' | 'thien';

export type PillQuality = 'ha_pham' | 'trung_pham' | 'thuong_pham' | 'cuc_pham' | 'phe_dan';

export type EquipmentTier = 'pham_khi' | 'phap_khi_ha' | 'phap_khi_trung' | 'phap_khi_thuong' | 'linh_khi' | 'co_bao' | 'thong_thien';

export interface ArtifactPassive {
  id: string;
  name: string;
  description: string;
  trigger: 'low_hp_shield' | 'fire_skill_boost' | 'metal_skill_boost' | 'mana_siphon' | 'poison_immunity';
  value: number;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  price: number;
  stackable: boolean;
  icon: string;
  manualArtId?: string;
  quality?: PillQuality;
  enhancementLevel?: number; // 0 to 9
  equipmentTier?: EquipmentTier;
  artifactPassive?: ArtifactPassive;
  stats?: {
    atk?: number;
    def?: number;
    hp?: number;
    mp?: number;
    speed?: number;
    critRate?: number;
    breakthroughBonus?: number;
  };
  useEffect?: {
    healHp?: number;
    restoreMp?: number;
    addExp?: number;
    cureBacklash?: boolean;
    curePoison?: boolean;
    teleportToSafe?: boolean;
    temporaryBuff?: { stat: string; value: number; duration: number };
  };
}

export interface InventorySlot {
  item: Item;
  count: number;
}

export interface Equipment {
  weapon: Item | null;
  armor: Item | null;
  accessory: Item | null;
  talisman: Item | null;
}

export type SkillMechanism = 'melee_slash' | 'flying_sword' | 'aoe_thunder' | 'shield' | 'heal' | 'dash';

export interface SkillStatusEffect {
  type: 'stun' | 'burn' | 'paralyze' | 'slow' | 'knockback';
  duration: number;
  value?: number;
}

export interface SkillGrowth {
  damagePerLevel: number;
  cooldownReductionPerLevel: number;
  mpCostIncreasePerLevel: number;
}

export interface Skill {
  id: string;
  name: string;
  key: 'lmb' | 'rmb' | 'q' | 'e' | 'r' | 'f';
  mpCost: number;
  cooldown: number; // in seconds
  currentCooldown: number;
  damageMultiplier: number;
  range: number;
  description: string;
  element: ElementType;
  icon: string;
  requiredRealmIndex: number;
  // Extensible Architecture Fields
  grade?: 'hoang' | 'huyen' | 'dia' | 'thien';
  sect?: string;
  mechanism?: SkillMechanism;
  castTime?: number; // Windup duration in seconds
  activeDuration?: number; // Active slash / impact duration
  recoveryTime?: number; // Recovery animation duration
  targetType?: 'self' | 'directional' | 'ground_target' | 'auto_target';
  aoeRadius?: number; // Radius of area of effect
  telegraphDuration?: number; // Ground rune warning duration
  level?: number;
  maxLevel?: number;
  growth?: SkillGrowth;
  statusEffect?: SkillStatusEffect;
  projectileConfig?: {
    count: number;
    speed: number;
    spreadAngle: number;
    spawnDelay: number;
    piercing?: boolean;
    homing?: boolean;
  };
}

export interface AoEZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  phase: 'telegraph' | 'strike' | 'aftermath' | 'done';
  timer: number;
  telegraphDuration: number;
  strikeDuration: number;
  aftermathDuration: number;
  damage: number;
  element: ElementType;
  fromPlayer: boolean;
  skillId: string;
  hasDealtDamage: boolean;
  statusEffect?: SkillStatusEffect;
}

export interface AdvancedProjectile {
  id: string;
  skillId: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX?: number;
  targetY?: number;
  vx: number;
  vy: number;
  speed: number;
  angle: number;
  damage: number;
  fromPlayer: boolean;
  element: ElementType;
  life: number;
  maxLife: number;
  radius: number;
  state: 'summoning' | 'flying' | 'impact';
  summonTimer: number;
  summonOffset: { x: number; y: number };
  trailPoints: { x: number; y: number; alpha: number }[];
  impactVFX?: boolean;
}

export interface CultivationArt {
  id: string;
  name: string;
  grade: 'hoang' | 'huyen' | 'dia' | 'thien';
  element: ElementType;
  description: string;
  lore: string;
  expMultiplier: number;
  breakthroughBonus?: number;
  statBonus: {
    atkPercent: number;
    defPercent: number;
    hpPercent: number;
    mpPercent: number;
  };
  unlockedSkills: string[];
}

export interface QuestObjective {
  id: string;
  text: string;
  type: 'kill' | 'gather' | 'talk' | 'breakthrough' | 'explore';
  targetId?: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

export interface Quest {
  id: string;
  chapter: number;
  title: string;
  description: string;
  type: 'main' | 'side' | 'sect' | 'secret';
  giverNpcId?: string;
  objectives: QuestObjective[];
  rewards: {
    exp: number;
    spiritStones: number;
    items?: { itemId: string; count: number }[];
    reputation?: number;
    contributionPoints?: number;
    factionId?: string;
  };
  status: 'available' | 'active' | 'ready_to_turn_in' | 'completed';
}

export type SectRank = 'visitor' | 'outer' | 'inner' | 'core' | 'elder' | 'master';

export interface FactionInfo {
  id: string;
  name: string;
  title: string;
  description: string;
  leader: string;
  baseMapId: string;
  color: string;
  icon: string;
}

export interface PavilionManual {
  id: string; // matches CultivationArt ID or unique manual
  name: string;
  category: 'co_so' | 'tu_luyen' | 'kiem_quyet' | 'phap_thuat' | 'than_phap' | 'phong_ngu';
  artId: string; // ID in CULTIVATION_ARTS
  grade: 'hoang' | 'huyen' | 'dia' | 'thien';
  element: ElementType;
  requiredRealmIndex: number;
  requiredSectRank?: SectRank;
  requiredReputation?: number;
  priceSpiritStones: number;
  priceContribution: number;
  description: string;
  effects: string;
  stock?: number;
}

export interface DialogueChoice {
  text: string;
  nextDialogueId?: string;
  action?: 
    | 'accept_quest' 
    | 'complete_quest' 
    | 'open_shop' 
    | 'open_alchemy' 
    | 'open_forging' 
    | 'start_fight' 
    | 'gain_secret'
    | 'join_sect'
    | 'reject_sect'
    | 'open_pavilion'
    | 'open_sect_missions'
    | 'promote_sect_rank'
    | 'open_war_room'
    | 'claim_stronghold'
    | 'trigger_event'
    | 'heal_full'
    | 'join_hac_phong'
    | 'set_stance';
  actionPayload?: string;
  requiredQuestId?: string;
  requiredRealmIndex?: number;
  requiredSectRank?: SectRank;
}

export interface DialogueNode {
  id: string;
  npcText: string;
  choices: DialogueChoice[];
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  faction: string;
  avatar: string;
  mapId: string;
  x: number;
  y: number;
  interactionRadius: number;
  dialogueRootId: string;
  dialogues: Record<string, DialogueNode>;
  shopItems?: { itemId: string; price: number; stock?: number; currency?: 'spiritStones' | 'contribution' }[];
  isMerchant?: boolean;
  merchantCategory?: 'herbs' | 'pills' | 'artifacts' | 'general' | 'sect';
}

export interface Enemy {
  id: string;
  name: string;
  category?: 'beast' | 'elite' | 'boss';
  realmName: string;
  realmLevel: number;
  isBoss: boolean;
  bossTitle?: string;
  bossPhase?: number;
  spawnX?: number;
  spawnY?: number;
  leashRange?: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  attackRange: number;
  aggroRange: number;
  attackCooldown: number;
  attackTimer: number;
  state: 'idle' | 'patrol' | 'detect' | 'chase' | 'attack_windup' | 'attacking' | 'hurt' | 'return' | 'dead';
  windupTimer: number;
  hurtTimer?: number;
  stunTimer?: number;
  detectTimer?: number;
  patrolTimer?: number;
  patrolTarget?: { x: number; y: number };
  telegraphRadius?: number;
  element: ElementType;
  expReward: number;
  spiritStonesReward: number;
  dropTable: { itemId: string; chance: number; maxCount: number }[];
  tintColor: string;
  shape: 'wolf' | 'boar' | 'cultist' | 'scorpion_king' | 'corpse_boss' | 'monkey' | 'leopard' | 'ape_boss' | 'ghost_wolf';
  width: number;
  height: number;
  radius?: number;
  specialCooldown?: number;
  specialTimer?: number;
  rageMode?: boolean;
  bossAttackPattern?: 'melee' | 'slam' | 'charge' | 'roar';
  bossPunishTimer?: number;
  bossImmuneTimer?: number;
  chargeTarget?: { x: number; y: number };
  hasGivenRewards?: boolean;
  projectile?: {
    active: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    element: ElementType;
  };
}

export interface GroundDrop {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  itemId?: string;
  count: number;
  spiritStones?: number;
  exp?: number;
  name: string;
  icon: string;
  rarity: ItemRarity;
  life: number;
  maxLife: number;
  bobTimer: number;
}

export interface CollectibleResource {
  id: string;
  name: string;
  type: 'herb' | 'ore' | 'chest' | 'stele' | 'ancient_mechanism' | 'altar';
  x: number;
  y: number;
  itemId: string;
  count: number;
  respawnTime: number; // in seconds
  currentRespawnTimer: number;
  collected: boolean;
  loreTitle?: string;
  loreText?: string;
  rewardType?: 'art' | 'exp' | 'item' | 'buff';
  rewardArtId?: string;
  rewardExp?: number;
  requiredMp?: number;
  riskChallenge?: boolean;
}

export interface Portal {
  id: string;
  name: string;
  fromMapId: string;
  toMapId: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  minRealmIndex?: number;
  requiredQuestId?: string;
  isSecretDungeon?: boolean;
  dungeonName?: string;
  dungeonDifficulty?: string;
  dungeonDescription?: string;
  dungeonRequirementNote?: string;
  costSpiritStones?: number;
}

export interface GameMap {
  id: string;
  name: string;
  dangerLevel: string;
  width: number;
  height: number;
  ambientColor: string;
  musicTheme: 'peaceful' | 'forest' | 'market' | 'dark_mountain' | 'ancient_ruins';
  portals: Portal[];
  npcs: NPC[];
  enemySpawners: {
    enemyPrototype: Omit<Enemy, 'id' | 'x' | 'y' | 'hp' | 'attackTimer' | 'windupTimer' | 'state'>;
    count: number;
    spawnArea: { x: number; y: number; width: number; height: number };
  }[];
  resources: CollectibleResource[];
  obstacles: { x: number; y: number; width: number; height: number; type: 'rock' | 'tree' | 'building' | 'water' | 'wall' }[];
  decorations: { x: number; y: number; type: 'flower' | 'stone' | 'lamp' | 'flag' | 'statue' }[];
}

export interface AlchemyRecipe {
  id: string;
  pillId: string;
  name: string;
  targetPillName: string;
  requiredRealmIndex: number;
  ingredients: { itemId: string; count: number }[];
  auxiliaryIngredients?: { itemId: string; count: number; name: string }[];
  baseSuccessRate: number;
  targetHeatZone: [number, number]; // [min, max] ideal temperature 0-100
  mpCost?: number;
  category?: 'healing' | 'qi' | 'breakthrough' | 'cure' | 'special';
  description: string;
}

export interface ForgingRecipe {
  id: string;
  resultItemId: string;
  name: string;
  requiredRealmIndex: number;
  ingredients: { itemId: string; count: number }[];
  spiritStonesCost: number;
  category?: 'weapon' | 'armor' | 'accessory' | 'talisman';
  tier?: EquipmentTier;
  description: string;
}

export interface PlayerStats {
  name: string;
  title: string;
  realmIndex: number; // index in realms array
  exp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  speed: number;
  critRate: number;
  consciousness: number; // Thần thức (radar/vision/gather range)
  comprehension: number; // Ngộ tính (speeds up art mastery)
  physique: number;      // Thể phách (reduces tribulation damage)
  spiritualRoot: SpiritualRoot;
  spiritStones: number;
  currentArtId: string;
  equippedSkills: Skill[];
  learnedArtIds: string[];
  equipment: Equipment;
  inventory: InventorySlot[];
  maxInventorySize: number;
  activeQuests: Quest[];
  completedQuestIds: string[];
  discoveredMaps: string[];
  currentMapId: string;
  x: number;
  y: number;
  facing: 'left' | 'right' | 'up' | 'down';
  isDodging: boolean;
  dodgeCooldown: number;
  dodgeTimer: number;
  invulnerableTimer?: number;
  hurtFlashTimer?: number;
  isDead?: boolean;
  statusEffects: {
    injured: boolean; // thương thế
    qiDeviation: boolean; // tẩu hỏa nhập ma
    poisoned: boolean;
  };
  storyFlags: Record<string, boolean | string | number>;
  karma: number; // Đạo tâm thiện / ác
  // Sect & Faction System
  sectId?: 'thanh_van_tong' | 'hac_phong_mon' | 'bach_thao_coc' | 'tan_tu' | 'none';
  sectRank: SectRank;
  contributionPoints: number;
  factionReputation: Record<string, number>; // factionId -> reputation score (-100 to 1000)
  gameTime?: {
    year: number;
    day: number;
    hour: number;
  };
  cultivationCount?: number;
  exploredDungeons?: string[];
  clearedMechanisms?: string[];
  // Sect War & World Dynamics
  territoryControl?: Record<string, string>; // strongholdId -> factionId
  warState?: {
    stage: 'tension' | 'skirmish' | 'ultimatum' | 'all_out_war' | 'truce' | 'victory';
    thanhVanPoints: number;
    hacPhongPoints: number;
    playerStance: 'thanh_van' | 'hac_phong' | 'neutral' | 'mediator';
    lastEventDay?: number;
    battleVictories: number;
  };
  activeWorldEventIds?: string[];
  completedEventIds?: string[];
  lastSalaryClaimDay?: number;
  // Alchemy, Forging & Artifact Systems
  learnedAlchemyRecipeIds?: string[];
  learnedForgingRecipeIds?: string[];
  alchemyFurnaceLevel?: number; // 1: Đồng Lô, 2: Huyền Thiết Đỉnh, 3: Bát Quái Tử Kim Lô
  forgingAnvilLevel?: number;   // 1: Đe Thường, 2: Huyền Thiết Đe, 3: Thần Hỏa Đe
  passiveShieldCooldown?: number;
  // Achievement, Title & Collection System
  equippedTitleId?: string;
  unlockedTitleIds?: string[];
  achievements?: Record<string, import('./achievements').AchievementProgress>;
  collectionStats?: import('./achievements').PlayerCollectionStats;
}

export * from './achievements';

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape?: 'circle' | 'spark' | 'sword_arc' | 'leaf' | 'ring' | 'smoke' | 'lightning' | 'petal' | 'mote';
  rotation?: number;
  vRot?: number;
  alpha?: number;
}
