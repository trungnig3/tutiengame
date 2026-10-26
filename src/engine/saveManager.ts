import { PlayerStats } from '../types/game';
import { initPlayerAchievements } from './achievementEngine';

export interface SaveSlotData {
  slotId: string;
  slotName: string;
  savedAt: string;
  playtime: number;
  playerStats: PlayerStats;
}

const STORAGE_PREFIX = 'pham_tran_tien_lo_save_';

export class SaveManager {
  public static saveGame(slotId: string, playerStats: PlayerStats, slotName?: string): boolean {
    try {
      const data: SaveSlotData = {
        slotId,
        slotName: slotName || `Lưu Trữ: ${playerStats.name} (${playerStats.title})`,
        savedAt: new Date().toLocaleString('vi-VN'),
        playtime: Date.now(),
        playerStats,
      };
      localStorage.setItem(`${STORAGE_PREFIX}${slotId}`, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Lỗi khi lưu game:', e);
      return false;
    }
  }

  public static loadGame(slotId: string): SaveSlotData | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${slotId}`);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveSlotData;
      if (data && data.playerStats) {
        if (!data.playerStats.gameTime) {
          data.playerStats.gameTime = { year: 1, day: 1, hour: 5 };
        }
        if (data.playerStats.cultivationCount === undefined) {
          data.playerStats.cultivationCount = 0;
        }
        if (!data.playerStats.sectRank) {
          data.playerStats.sectRank = 'visitor';
        }
        if (!data.playerStats.sectId) {
          data.playerStats.sectId = 'none';
        }
        if (data.playerStats.contributionPoints === undefined) {
          data.playerStats.contributionPoints = 0;
        }
        if (!data.playerStats.factionReputation) {
          data.playerStats.factionReputation = {
            thanh_van_tong: 0,
            tan_tu_lien_minh: 15,
            van_bao_thuong_hoi: 10,
            bach_thao_coc: 20,
            hac_phong_mon: -50,
            hac_sat_mon: -50,
            co_ngoc_bi_an: 0,
          };
        }
        if (!data.playerStats.territoryControl) {
          data.playerStats.territoryControl = {
            stronghold_hac_phong_mine: 'hac_phong_mon',
            stronghold_linh_vu_herb_field: 'bach_thao_coc',
            stronghold_ancient_cave_core: 'neutral',
            stronghold_phuong_thi_checkpoint: 'tan_tu_lien_minh',
          };
        }
        if (!data.playerStats.warState) {
          data.playerStats.warState = {
            stage: 'tension',
            thanhVanPoints: 100,
            hacPhongPoints: 100,
            playerStance: 'neutral',
            battleVictories: 0,
            lastEventDay: 1,
          };
        }
        if (!data.playerStats.activeWorldEventIds) {
          data.playerStats.activeWorldEventIds = ['event_beast_tide_village', 'event_ambush_caravan'];
        }
        if (!data.playerStats.completedEventIds) {
          data.playerStats.completedEventIds = [];
        }
        if (!data.playerStats.discoveredMaps || data.playerStats.discoveredMaps.length === 0) {
          data.playerStats.discoveredMaps = ['map_thanh_khe'];
        }
        if (!data.playerStats.currentMapId) {
          data.playerStats.currentMapId = 'map_thanh_khe';
        }
        if (data.playerStats.karma === undefined) {
          data.playerStats.karma = 50;
        }
        if (!data.playerStats.exploredDungeons) {
          data.playerStats.exploredDungeons = [];
        }
        if (!data.playerStats.clearedMechanisms) {
          data.playerStats.clearedMechanisms = [];
        }
        if (!data.playerStats.learnedAlchemyRecipeIds) {
          data.playerStats.learnedAlchemyRecipeIds = ['recipe_kim_sang_dan', 'recipe_hoi_khi_dan', 'recipe_tu_khi_dan'];
        }
        if (!data.playerStats.learnedForgingRecipeIds) {
          data.playerStats.learnedForgingRecipeIds = ['forge_moc_kiem', 'forge_thanh_phong_kiem', 'forge_thanh_van_dao_bao', 'forge_than_hanh_phu'];
        }
        if (data.playerStats.alchemyFurnaceLevel === undefined) {
          data.playerStats.alchemyFurnaceLevel = 1;
        }
        if (data.playerStats.forgingAnvilLevel === undefined) {
          data.playerStats.forgingAnvilLevel = 1;
        }
        if (data.playerStats.passiveShieldCooldown === undefined) {
          data.playerStats.passiveShieldCooldown = 0;
        }
        if (!data.playerStats.spiritualRoot) {
          data.playerStats.spiritualRoot = {
            name: 'Ngũ Hành Tạp Linh Căn',
            type: 'ngu_hanh',
            purity: 45,
            description: 'Cả năm thuộc tính Kim, Mộc, Thủy, Hỏa, Thổ đều có mặt, phàm nhân coi là phế căn, nhưng cổ tịch gọi là Hỗn Độn Tiên Căn chưa thức tỉnh.',
            elements: { kim: 42, moc: 58, thuy: 45, hoa: 38, tho: 50 },
          };
        } else if (!data.playerStats.spiritualRoot.elements) {
          data.playerStats.spiritualRoot.elements = { kim: 42, moc: 58, thuy: 45, hoa: 38, tho: 50 };
        }
        if (!data.playerStats.storyFlags) {
          data.playerStats.storyFlags = {};
        }
        if (!data.playerStats.learnedArtIds) {
          data.playerStats.learnedArtIds = ['art_truong_sinh_quyet'];
        }
        data.playerStats = initPlayerAchievements(data.playerStats);
      }
      return data;
    } catch (e) {
      console.error('Lỗi khi tải game:', e);
      return null;
    }
  }

  public static listSlots(): { slotId: string; data: SaveSlotData | null }[] {
    const slots = ['auto', 'slot1', 'slot2', 'slot3'];
    return slots.map(slotId => ({
      slotId,
      data: this.loadGame(slotId),
    }));
  }

  public static deleteSave(slotId: string): boolean {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${slotId}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  public static exportSaveToString(slotId: string): string | null {
    const data = this.loadGame(slotId);
    if (!data) return null;
    return btoa(encodeURIComponent(JSON.stringify(data)));
  }

  public static importSaveFromString(slotId: string, encoded: string): boolean {
    try {
      const decoded = decodeURIComponent(atob(encoded));
      const parsed = JSON.parse(decoded) as SaveSlotData;
      parsed.slotId = slotId;
      localStorage.setItem(`${STORAGE_PREFIX}${slotId}`, JSON.stringify(parsed));
      return true;
    } catch (e) {
      console.error('Lỗi khi import file lưu:', e);
      return false;
    }
  }
}
