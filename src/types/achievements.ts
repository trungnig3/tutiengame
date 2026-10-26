export type AchievementCategory = 'cultivation' | 'combat' | 'exploration' | 'quests' | 'sect' | 'crafting';

export type AchievementRarity = 'pham' | 'hiem' | 'su_thi' | 'truyen_thuyet' | 'bi_an';

export interface AchievementReward {
  spiritStones?: number;
  exp?: number;
  items?: { itemId: string; count: number }[];
  titleId?: string;
  reputationBonus?: { factionId: string; amount: number };
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  hintIfSecret?: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  isSecret?: boolean;
  maxProgress: number;
  conditionDescription: string;
  reward: AchievementReward;
}

export interface AchievementProgress {
  unlocked: boolean;
  progress: number;
  claimed: boolean;
  unlockedAt?: string;
}

export interface TitleDefinition {
  id: string;
  name: string;
  color: string;
  bgGradient: string;
  description: string;
  source: string;
  statsBonus: {
    atk?: number;
    def?: number;
    hp?: number;
    mp?: number;
    speed?: number;
    critRate?: number;
    expBonusPercent?: number;
    consciousness?: number;
    comprehension?: number;
    physique?: number;
  };
}

export interface PlayerCollectionStats {
  defeatedBosses: Record<string, number>;
  totalKills: number;
  craftedPills: Record<string, number>;
  craftedEquipments: Record<string, number>;
  totalCrafts: number;
  openedChests: string[];
  readSteles: string[];
  solvedMechanisms: string[];
  unlockedEndings: string[];
  discoveredClues: string[];
  totalTrades: number;
  totalSpentStones: number;
  breakthroughCountWithoutPill: number;
  tribulationPassedCount: number;
  bossNoDeathVictories: number;
}
