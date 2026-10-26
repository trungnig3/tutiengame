import { PlayerStats, Quest } from '../types/game';
import { FACTIONS } from '../data/factions';
import { STRONGHOLDS, TerritoryStronghold } from '../data/territory';
import { WORLD_EVENTS, WorldEvent } from '../data/worldEvents';
import { ITEMS } from '../data/items';
import { advanceGameTime } from './cultivationEngine';

export interface SectWarStageInfo {
  stage: 'tension' | 'skirmish' | 'ultimatum' | 'all_out_war' | 'truce' | 'victory';
  title: string;
  description: string;
  thanhVanDescription: string;
  hacPhongDescription: string;
  recommendedRealm: string;
}

export const SECT_WAR_STAGES: Record<string, SectWarStageInfo> = {
  tension: {
    stage: 'tension',
    title: 'Giai Đoạn 1: Tranh Chấp Linh Mạch Căng Thẳng',
    description: 'Thanh Vân Tông và Hắc Phong Môn đang ngầm điều động đệ tử phong tỏa các cửa rừng và tranh chấp quyền khai thác Mỏ Linh Thạch Hắc Phong Cốc.',
    thanhVanDescription: 'Thanh Vân Tông yêu cầu thu hồi linh mỏ cổ xưa vốn thuộc địa giới đạo môn.',
    hacPhongDescription: 'Hắc Phong Môn tuyên bố ai mạnh kẻ đó làm chủ, công khai cướp bóc xe chở quặng.',
    recommendedRealm: 'Luyện Khí Tầng 3 - 6',
  },
  skirmish: {
    stage: 'skirmish',
    title: 'Giai Đoạn 2: Phục Kích & Xung Đột Biên Giới',
    description: 'Tiếng binh khí va chạm vang dội sườn Hắc Phong Sơn. Các đoàn xe tiêu cục bị tập kích, đệ tử hai phái liên tục giao tranh đổ máu.',
    thanhVanDescription: 'Hộ tống đoàn vận chuyển đan dược, cứu viện đệ tử bị vây khốn.',
    hacPhongDescription: 'Đoạt xe quặng, diệt trừ tiền trạm do thám của Thanh Vân Tông.',
    recommendedRealm: 'Luyện Khí Tầng 6 - 9',
  },
  ultimatum: {
    stage: 'ultimatum',
    title: 'Giai Đoạn 3: Tối Hậu Thư & Chiêu Mộ Tán Tu',
    description: 'Hai bên tung chiến thư! Trưởng lão hai phái ra giá chiêu mộ tán tu giang hồ và đệ tử tham chiến với mức thù lao linh thạch hậu hĩnh.',
    thanhVanDescription: 'Trao thưởng bội phần linh thạch và ban danh phận Chân Truyền Đệ Tử.',
    hacPhongDescription: 'Treo thưởng Ma Khí, cấm đan và hứa chia chác linh mỏ sau khi thắng trận.',
    recommendedRealm: 'Luyện Khí Tầng 9 - 13',
  },
  all_out_war: {
    stage: 'all_out_war',
    title: 'Giai Đoạn 4: Đại Chiến Bùng Nổ – Huyết Chiến Hắc Phong Sơn',
    description: 'Chiến tranh tổng lực bùng nổ! Trận chiến cứ điểm quyết định vận mệnh thế lực toàn bộ vùng Thanh Hà. Người chơi trực tiếp dẫn đầu mũi tấn công!',
    thanhVanDescription: 'Tổng công phá tan đại bản doanh Hắc Phong Môn, giải thoát con tin.',
    hacPhongDescription: 'Công phá phòng tuyến Thanh Vân Tông, đồ sát đoạt bảo!',
    recommendedRealm: 'Luyện Khí Đỉnh Phong / Trúc Cơ',
  },
  victory: {
    stage: 'victory',
    title: 'Giai Đoạn 5: Cục Diện Tân Sinh – Định Đoạt Bá Quyền',
    description: 'Đại chiến đã ngã ngũ! Thế lực chiến thắng nắm quyền kiểm soát toàn bộ mỏ linh thạch và phường thị, định hình lại trật tự giới tu tiên.',
    thanhVanDescription: 'Chính đạo đại thắng! Linh mạch thái bình, vạn dân ca tụng kiếm tu nghĩa hiệp.',
    hacPhongDescription: 'Hắc Phong Môn thống trị vùng núi, thu thuế khắc nghiệt đối với thương nhân.',
    recommendedRealm: 'Toàn cảnh giới',
  },
};

/**
 * Ensure player has initialized territory and war states
 */
export function ensureWarAndTerritoryState(player: PlayerStats): PlayerStats {
  const territoryControl = player.territoryControl ? { ...player.territoryControl } : {};

  // Initialize default owners if empty
  STRONGHOLDS.forEach(s => {
    if (!territoryControl[s.id]) {
      territoryControl[s.id] = s.defaultOwner;
    }
  });

  const warState: NonNullable<PlayerStats['warState']> = player.warState ? { ...player.warState } : {
    stage: 'tension',
    thanhVanPoints: 100,
    hacPhongPoints: 100,
    playerStance: 'neutral',
    battleVictories: 0,
    lastEventDay: 1,
  };

  const activeWorldEventIds = player.activeWorldEventIds ? [...player.activeWorldEventIds] : [
    'event_beast_tide_village',
    'event_ambush_caravan',
  ];

  const completedEventIds = player.completedEventIds ? [...player.completedEventIds] : [];

  return {
    ...player,
    territoryControl,
    warState,
    activeWorldEventIds,
    completedEventIds,
  };
}

/**
 * Harvest yields from all strongholds controlled by player's faction or player
 */
export function claimTerritoryYields(player: PlayerStats): {
  updatedPlayer: PlayerStats;
  totalStones: number;
  totalContrib: number;
  itemsGained: { itemId: string; count: number; name: string }[];
  message: string;
} {
  const currentDay = player.gameTime?.day || 1;
  const lastClaimDay = player.lastSalaryClaimDay || 0;

  if (currentDay <= lastClaimDay) {
    return {
      updatedPlayer: player,
      totalStones: 0,
      totalContrib: 0,
      itemsGained: [],
      message: 'Hôm nay đạo hữu đã nhận bổng lộc và tài nguyên cứ điểm rồi! Hãy quay lại vào ngày mai.',
    };
  }

  const p = ensureWarAndTerritoryState(player);
  let totalStones = 0;
  let totalContrib = 0;
  const itemsGained: { itemId: string; count: number; name: string }[] = [];

  const playerFaction = p.sectId === 'thanh_van_tong' ? 'thanh_van_tong' : (p.warState?.playerStance || 'tan_tu_lien_minh');

  STRONGHOLDS.forEach(stronghold => {
    const owner = p.territoryControl?.[stronghold.id];
    // If player faction controls the stronghold, or player is neutral/mediator
    if (owner === playerFaction || owner === 'thanh_van_tong' || owner === 'tan_tu_lien_minh') {
      if (stronghold.yieldPerHour.spiritStones) {
        totalStones += stronghold.yieldPerHour.spiritStones;
      }
      if (stronghold.yieldPerHour.contribution) {
        totalContrib += stronghold.yieldPerHour.contribution;
      }
      if (stronghold.yieldPerHour.items) {
        stronghold.yieldPerHour.items.forEach(it => {
          itemsGained.push(it);
        });
      }
    }
  });

  // Also include daily sect salary based on rank
  const sectRankSalary = p.sectRank === 'outer' ? 15 : p.sectRank === 'inner' ? 40 : p.sectRank === 'core' ? 100 : p.sectRank === 'elder' ? 250 : 0;
  totalStones += sectRankSalary;

  let updatedInv = [...p.inventory];
  itemsGained.forEach(it => {
    const item = ITEMS[it.itemId];
    if (item) {
      const existing = updatedInv.find(s => s.item.id === item.id);
      if (existing && item.stackable) {
        existing.count += it.count;
      } else if (updatedInv.length < p.maxInventorySize) {
        updatedInv.push({ item, count: it.count });
      }
    }
  });

  let updatedPlayer: PlayerStats = {
    ...p,
    spiritStones: p.spiritStones + totalStones,
    contributionPoints: (p.contributionPoints || 0) + totalContrib,
    inventory: updatedInv,
    lastSalaryClaimDay: currentDay,
  };

  const msg = `Thu hoạch thành công từ các cứ điểm kiểm soát!\nNhận: +${totalStones} Linh Thạch, +${totalContrib} Điểm Cống Hiến${itemsGained.length > 0 ? ` cùng ${itemsGained.map(i => `${i.name} x${i.count}`).join(', ')}` : ''}!`;

  return {
    updatedPlayer,
    totalStones,
    totalContrib,
    itemsGained,
    message: msg,
  };
}

/**
 * Capture or contest a territorial stronghold
 */
export function captureStronghold(
  player: PlayerStats,
  strongholdId: string,
  newOwnerFactionId: string
): {
  updatedPlayer: PlayerStats;
  message: string;
} {
  const p = ensureWarAndTerritoryState(player);
  const stronghold = STRONGHOLDS.find(s => s.id === strongholdId);
  if (!stronghold) {
    return { updatedPlayer: player, message: 'Cứ điểm không tồn tại!' };
  }

  const oldOwner = p.territoryControl?.[strongholdId] || stronghold.defaultOwner;
  const updatedTerritory = {
    ...p.territoryControl,
    [strongholdId]: newOwnerFactionId,
  };

  // Adjust war points & reputation
  let thanhVanDelta = newOwnerFactionId === 'thanh_van_tong' ? 50 : newOwnerFactionId === 'hac_phong_mon' ? -50 : 0;
  let hacPhongDelta = newOwnerFactionId === 'hac_phong_mon' ? 50 : newOwnerFactionId === 'thanh_van_tong' ? -50 : 0;

  const newWarState = {
    ...p.warState!,
    thanhVanPoints: Math.max(0, p.warState!.thanhVanPoints + thanhVanDelta),
    hacPhongPoints: Math.max(0, p.warState!.hacPhongPoints + hacPhongDelta),
    battleVictories: p.warState!.battleVictories + 1,
  };

  // Check stage advance
  if (newWarState.battleVictories >= 3 && newWarState.stage === 'tension') {
    newWarState.stage = 'skirmish';
  } else if (newWarState.battleVictories >= 6 && newWarState.stage === 'skirmish') {
    newWarState.stage = 'ultimatum';
  } else if (newWarState.battleVictories >= 9 && newWarState.stage === 'ultimatum') {
    newWarState.stage = 'all_out_war';
  }

  // Reputation changes
  const newRep = { ...p.factionReputation };
  if (newOwnerFactionId === 'thanh_van_tong') {
    newRep.thanh_van_tong = (newRep.thanh_van_tong || 0) + 40;
    newRep.hac_phong_mon = (newRep.hac_phong_mon || 0) - 40;
  } else if (newOwnerFactionId === 'hac_phong_mon') {
    newRep.hac_phong_mon = (newRep.hac_phong_mon || 0) + 40;
    newRep.thanh_van_tong = (newRep.thanh_van_tong || 0) - 40;
  }

  const updatedPlayer: PlayerStats = {
    ...p,
    territoryControl: updatedTerritory,
    warState: newWarState,
    factionReputation: newRep,
    spiritStones: p.spiritStones + 150,
    exp: p.exp + 400,
  };

  const targetFactionName = FACTIONS[newOwnerFactionId]?.name || newOwnerFactionId;
  const msg = `Chiếm giữ thành công [${stronghold.name}] cho phe [${targetFactionName}]!\nNhận 150 Linh Thạch chiến lợi phẩm và 400 Tu Vi! Cục diện chiến tranh đã biến chuyển.`;

  return { updatedPlayer, message: msg };
}

/**
 * Resolve World Event completion
 */
export function completeWorldEvent(
  player: PlayerStats,
  eventId: string
): {
  updatedPlayer: PlayerStats;
  message: string;
} {
  const p = ensureWarAndTerritoryState(player);
  const event = WORLD_EVENTS.find(e => e.id === eventId);
  if (!event) {
    return { updatedPlayer: player, message: 'Sự kiện không tồn tại!' };
  }

  if (p.completedEventIds?.includes(eventId)) {
    return { updatedPlayer: player, message: 'Sự kiện này đã hoàn thành trước đó!' };
  }

  // Update reputation
  const newRep = { ...p.factionReputation };
  Object.entries(event.rewards.reputationChange).forEach(([factionId, delta]) => {
    newRep[factionId] = (newRep[factionId] || 0) + delta;
  });

  const newCompleted = [...(p.completedEventIds || []), eventId];
  const newActive = (p.activeWorldEventIds || []).filter(id => id !== eventId);

  // Add items if any
  let updatedInv = [...p.inventory];
  if (event.rewards.items) {
    event.rewards.items.forEach(rewItem => {
      const it = ITEMS[rewItem.itemId];
      if (it) {
        const slot = updatedInv.find(s => s.item.id === it.id);
        if (slot && it.stackable) {
          slot.count += rewItem.count;
        } else if (updatedInv.length < p.maxInventorySize) {
          updatedInv.push({ item: it, count: rewItem.count });
        }
      }
    });
  }

  const updatedPlayer: PlayerStats = {
    ...p,
    exp: p.exp + event.rewards.exp,
    spiritStones: p.spiritStones + event.rewards.spiritStones,
    contributionPoints: (p.contributionPoints || 0) + (event.rewards.contribution || 0),
    factionReputation: newRep,
    inventory: updatedInv,
    activeWorldEventIds: newActive,
    completedEventIds: newCompleted,
  };

  const msg = `🎉 ĐÃ GIẢI QUYẾT SỰ KIỆN: [${event.title}]!\nPhần thưởng: +${event.rewards.exp} Tu Vi, +${event.rewards.spiritStones} Linh Thạch${event.rewards.contribution ? `, +${event.rewards.contribution} Cống Hiến` : ''}.\n${event.consequencesText}`;

  return { updatedPlayer, message: msg };
}
