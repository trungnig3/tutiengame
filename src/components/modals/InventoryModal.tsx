import React, { useState } from 'react';
import { PlayerStats, Item, InventorySlot, EquipmentTier, PillQuality } from '../../types/game';
import { soundManager } from '../../engine/audio';
import { recomputePlayerStats, getItemEnhancedStats } from '../../engine/cultivationEngine';
import { CULTIVATION_ARTS } from '../../data/arts';
import { checkArtCompatibility } from '../../data/spiritualRoots';
import { X, Shield, Sword, Package, Heart, Zap, Sparkles, ArrowRight, ArrowUpRight, ArrowDownRight, Award, BookOpen, AlertCircle } from 'lucide-react';

interface InventoryModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  onUpdatePlayer,
  onClose,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [compatError, setCompatError] = useState<string | null>(null);
  const selectedSlot = selectedSlotIndex !== null ? player.inventory[selectedSlotIndex] : null;

  const handleUseItem = () => {
    if (selectedSlotIndex === null || !selectedSlot) return;
    const { item } = selectedSlot;

    if (item.useEffect) {
      soundManager.playCollect();
      onUpdatePlayer(prev => {
        let newHp = prev.hp;
        let newMp = prev.mp;
        let newExp = prev.exp;
        let status = { ...prev.statusEffects };
        let currentMapId = prev.currentMapId;
        let x = prev.x;
        let y = prev.y;

        if (item.useEffect?.healHp) {
          newHp = Math.min(prev.maxHp, newHp + item.useEffect.healHp);
        }
        if (item.useEffect?.restoreMp) {
          newMp = Math.min(prev.maxMp, newMp + item.useEffect.restoreMp);
        }
        if (item.useEffect?.addExp) {
          newExp = newExp + item.useEffect.addExp;
        }
        if (item.useEffect?.cureBacklash) {
          status.injured = false;
          status.qiDeviation = false;
        }
        if (item.useEffect?.curePoison) {
          status.poisoned = false;
        }
        if (item.useEffect?.teleportToSafe) {
          if (prev.currentMapId === 'map_hac_phong_bi_canh' || prev.currentMapId === 'map_ancient_ruins') {
            currentMapId = 'map_hac_phong_son';
            x = 1420;
            y = 340;
          } else {
            currentMapId = 'map_thanh_khe';
            x = 380;
            y = 430;
          }
        }

        // Reduce count
        const updatedInv = prev.inventory
          .map((slot, idx) => (idx === selectedSlotIndex ? { ...slot, count: slot.count - 1 } : slot))
          .filter(slot => slot.count > 0);

        return {
          ...prev,
          hp: newHp,
          mp: newMp,
          exp: newExp,
          statusEffects: status,
          currentMapId,
          x,
          y,
          inventory: updatedInv,
        };
      });

      if (selectedSlot.count <= 1) {
        setSelectedSlotIndex(null);
      }
    }
  };

  const handleLearnManual = () => {
    if (selectedSlotIndex === null || !selectedSlot) return;
    const { item } = selectedSlot;
    if (item.type !== 'manual') return;

    // Check if it is a cultivation manual or a recipe/blueprint scroll
    if (item.manualArtId) {
      if (player.learnedArtIds.includes(item.manualArtId)) {
        setCompatError('Đạo hữu đã lĩnh ngộ bộ công pháp này từ trước!');
        return;
      }

      const art = CULTIVATION_ARTS[item.manualArtId];
      if (art) {
        const rootCheck = checkArtCompatibility(player.spiritualRoot, art.element);
        if (!rootCheck.compatible) {
          soundManager.playBacklash();
          setCompatError(rootCheck.reason);
          return;
        }
      }

      soundManager.playBreakthrough();
      setCompatError(null);
      onUpdatePlayer(prev => {
        const updatedLearned = [...prev.learnedArtIds, item.manualArtId!];
        const updatedInv = prev.inventory
          .map((slot, idx) => (idx === selectedSlotIndex ? { ...slot, count: slot.count - 1 } : slot))
          .filter(slot => slot.count > 0);

        return recomputePlayerStats({
          ...prev,
          learnedArtIds: updatedLearned,
          currentArtId: item.manualArtId!,
          inventory: updatedInv,
        });
      });

      setSelectedSlotIndex(null);
    } else if (item.id.startsWith('dan_phuong_') || item.id.startsWith('ban_ve_')) {
      // Recipe learning
      soundManager.playBreakthrough();
      onUpdatePlayer(prev => {
        let learnedAlchemy = [...(prev.learnedAlchemyRecipeIds || [])];
        let learnedForging = [...(prev.learnedForgingRecipeIds || [])];

        if (item.id.startsWith('dan_phuong_')) {
          const recId = item.id.replace('dan_phuong_', 'recipe_');
          if (!learnedAlchemy.includes(recId)) learnedAlchemy.push(recId);
        } else if (item.id.startsWith('ban_ve_')) {
          const forgeId = item.id.replace('ban_ve_', 'forge_');
          if (!learnedForging.includes(forgeId)) learnedForging.push(forgeId);
        }

        const updatedInv = prev.inventory
          .map((slot, idx) => (idx === selectedSlotIndex ? { ...slot, count: slot.count - 1 } : slot))
          .filter(slot => slot.count > 0);

        return {
          ...prev,
          learnedAlchemyRecipeIds: learnedAlchemy,
          learnedForgingRecipeIds: learnedForging,
          inventory: updatedInv,
          exp: prev.exp + 100,
        };
      });

      setSelectedSlotIndex(null);
    }
  };

  const handleEquipItem = () => {
    if (selectedSlotIndex === null || !selectedSlot) return;
    const { item } = selectedSlot;

    soundManager.playCollect();

    onUpdatePlayer(prev => {
      let eq = { ...prev.equipment };
      let unequippedItem: Item | null = null;

      if (item.type === 'weapon') {
        unequippedItem = eq.weapon;
        eq.weapon = item;
      } else if (item.type === 'armor') {
        unequippedItem = eq.armor;
        eq.armor = item;
      } else if (item.type === 'accessory') {
        unequippedItem = eq.accessory;
        eq.accessory = item;
      } else if (item.type === 'talisman') {
        unequippedItem = eq.talisman;
        eq.talisman = item;
      }

      // Remove equipped item from inventory, put back old equipment if any
      let updatedInv = prev.inventory
        .map((slot, idx) => (idx === selectedSlotIndex ? { ...slot, count: slot.count - 1 } : slot))
        .filter(slot => slot.count > 0);

      if (unequippedItem) {
        const existing = updatedInv.find(s => s.item.id === unequippedItem!.id && s.item.enhancementLevel === unequippedItem!.enhancementLevel);
        if (existing && unequippedItem.stackable) {
          existing.count += 1;
        } else {
          updatedInv.push({ item: unequippedItem, count: 1 });
        }
      }

      return recomputePlayerStats({
        ...prev,
        equipment: eq,
        inventory: updatedInv,
      });
    });

    setSelectedSlotIndex(null);
  };

  const handleUnequip = (type: 'weapon' | 'armor' | 'accessory' | 'talisman') => {
    const item = player.equipment[type];
    if (!item) return;

    soundManager.playCollect();

    onUpdatePlayer(prev => {
      let eq = { ...prev.equipment };
      eq[type] = null;

      let updatedInv = [...prev.inventory];
      const existing = updatedInv.find(s => s.item.id === item.id && s.item.enhancementLevel === item.enhancementLevel);
      if (existing && item.stackable) {
        existing.count += 1;
      } else if (updatedInv.length < prev.maxInventorySize) {
        updatedInv.push({ item, count: 1 });
      }

      return recomputePlayerStats({
        ...prev,
        equipment: eq,
        inventory: updatedInv,
      });
    });
  };

  // Helper for quality badge
  const renderQualityBadge = (quality?: PillQuality) => {
    if (!quality || quality === 'ha_pham') {
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">Hạ Phẩm</span>;
    }
    if (quality === 'trung_pham') {
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-600">Trung Phẩm (+20%)</span>;
    }
    if (quality === 'thuong_pham') {
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500 font-bold">Thượng Phẩm (+35%)</span>;
    }
    if (quality === 'cuc_pham') {
      return <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-400 font-bold animate-pulse">Cực Phẩm (+50%)</span>;
    }
    if (quality === 'phe_dan') {
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">Phế Đan</span>;
    }
    return null;
  };

  // Stat comparison helper
  const isEquipment = selectedSlot && ['weapon', 'armor', 'accessory', 'talisman'].includes(selectedSlot.item.type);
  const eqType = isEquipment ? (selectedSlot.item.type as 'weapon' | 'armor' | 'accessory' | 'talisman') : null;
  const currentEquipped = eqType ? player.equipment[eqType] : null;
  const currentStats = getItemEnhancedStats(currentEquipped);
  const selectedStats = isEquipment ? getItemEnhancedStats(selectedSlot.item) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-4xl bg-stone-900 border-2 border-amber-600/80 rounded-2xl shadow-2xl p-6 text-stone-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 shadow-inner">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-300 font-title">
                Túi Trữ Vật & Pháp Bảo Trang Bị
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Sức chứa: {player.inventory.length} / {player.maxInventorySize} | Linh Thạch: <span className="text-amber-400 font-mono font-bold">💎 {player.spiritStones}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 overflow-y-auto pr-1 flex-1">
          {/* LEFT: CURRENTLY EQUIPPED */}
          <div className="space-y-3 bg-stone-950/70 border border-stone-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider text-center">
              Trang Bị Hiện Tại (Nhấp Để Tháo)
            </h3>

            <div className="space-y-2.5 flex-1">
              {/* Weapon */}
              <div 
                onClick={() => handleUnequip('weapon')}
                className="p-3 rounded-xl border border-stone-800 bg-stone-900/90 flex items-center justify-between hover:border-rose-500/60 cursor-pointer transition shadow"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{player.equipment.weapon?.icon || '🗡️'}</span>
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase font-semibold">Vũ Khí</div>
                    <div className="text-xs font-bold text-amber-200">
                      {player.equipment.weapon?.name || 'Trống'}
                      {(player.equipment.weapon?.enhancementLevel || 0) > 0 && (
                        <span className="text-amber-400 font-mono ml-1">+{player.equipment.weapon?.enhancementLevel}</span>
                      )}
                    </div>
                  </div>
                </div>
                {player.equipment.weapon && (
                  <span className="text-xs text-rose-400 font-bold font-mono">
                    +{getItemEnhancedStats(player.equipment.weapon).atk} Công
                  </span>
                )}
              </div>

              {/* Armor */}
              <div 
                onClick={() => handleUnequip('armor')}
                className="p-3 rounded-xl border border-stone-800 bg-stone-900/90 flex items-center justify-between hover:border-blue-500/60 cursor-pointer transition shadow"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{player.equipment.armor?.icon || '🥋'}</span>
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase font-semibold">Đạo Bào / Giáp</div>
                    <div className="text-xs font-bold text-amber-200">
                      {player.equipment.armor?.name || 'Trống'}
                      {(player.equipment.armor?.enhancementLevel || 0) > 0 && (
                        <span className="text-amber-400 font-mono ml-1">+{player.equipment.armor?.enhancementLevel}</span>
                      )}
                    </div>
                  </div>
                </div>
                {player.equipment.armor && (
                  <span className="text-xs text-blue-400 font-bold font-mono">
                    +{getItemEnhancedStats(player.equipment.armor).def} Thủ
                  </span>
                )}
              </div>

              {/* Accessory / Artifact */}
              <div 
                onClick={() => handleUnequip('accessory')}
                className="p-3 rounded-xl border border-stone-800 bg-stone-900/90 flex items-center justify-between hover:border-purple-500/60 cursor-pointer transition shadow"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{player.equipment.accessory?.icon || '📿'}</span>
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase font-semibold">Pháp Bảo / Bí Khí</div>
                    <div className="text-xs font-bold text-amber-200">
                      {player.equipment.accessory?.name || 'Trống'}
                      {(player.equipment.accessory?.enhancementLevel || 0) > 0 && (
                        <span className="text-amber-400 font-mono ml-1">+{player.equipment.accessory?.enhancementLevel}</span>
                      )}
                    </div>
                  </div>
                </div>
                {player.equipment.accessory && (
                  <span className="text-xs text-purple-400 font-bold font-mono">
                    +{getItemEnhancedStats(player.equipment.accessory).hp} Máu
                  </span>
                )}
              </div>

              {/* Talisman */}
              <div 
                onClick={() => handleUnequip('talisman')}
                className="p-3 rounded-xl border border-stone-800 bg-stone-900/90 flex items-center justify-between hover:border-yellow-500/60 cursor-pointer transition shadow"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{player.equipment.talisman?.icon || '📜'}</span>
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase font-semibold">Phù Lục / Bùa Hộ Thân</div>
                    <div className="text-xs font-bold text-amber-200">
                      {player.equipment.talisman?.name || 'Trống'}
                    </div>
                  </div>
                </div>
                {player.equipment.talisman && (
                  <span className="text-xs text-yellow-400 font-bold font-mono">
                    +{getItemEnhancedStats(player.equipment.talisman).speed} Tốc
                  </span>
                )}
              </div>
            </div>

            {/* Quick stats recap */}
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs space-y-1">
              <span className="text-stone-400 font-semibold block mb-1">Tổng Lực Chiến Đạo Hạnh:</span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div className="text-rose-400">⚔️ Công: <span className="font-bold">{player.atk}</span></div>
                <div className="text-blue-400">🛡️ Thủ: <span className="font-bold">{player.def}</span></div>
                <div className="text-emerald-400">❤️ Máu: <span className="font-bold">{player.hp}/{player.maxHp}</span></div>
                <div className="text-cyan-400">💧 Linh: <span className="font-bold">{player.mp}/{player.maxMp}</span></div>
              </div>
            </div>
          </div>

          {/* MIDDLE: INVENTORY GRID */}
          <div className="space-y-3 bg-stone-950/70 border border-stone-800 p-4 rounded-xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Vật Phẩm Trong Túi ({player.inventory.length})
            </h3>

            <div className="grid grid-cols-4 gap-2.5 max-h-[58vh] overflow-y-auto p-1">
              {player.inventory.map((slot, idx) => {
                const isSelected = selectedSlotIndex === idx;
                const rarityBorder =
                  slot.item.rarity === 'thien' ? 'border-amber-400 bg-amber-950/40' :
                  slot.item.rarity === 'dia' ? 'border-purple-500 bg-purple-950/30' :
                  slot.item.rarity === 'huyen' ? 'border-sky-500 bg-sky-950/30' :
                  slot.item.rarity === 'hoang' ? 'border-emerald-500 bg-emerald-950/20' :
                  'border-stone-700 bg-stone-900';

                return (
                  <div
                    key={`${slot.item.id}_${idx}`}
                    onClick={() => {
                      setSelectedSlotIndex(idx);
                      setCompatError(null);
                    }}
                    className={`relative w-15 h-15 rounded-xl border-2 flex items-center justify-center text-2xl cursor-pointer transition ${rarityBorder} ${
                      isSelected ? 'ring-2 ring-amber-300 scale-105 shadow-lg shadow-amber-500/20' : 'hover:scale-102'
                    }`}
                  >
                    <span>{slot.item.icon}</span>

                    {/* Count */}
                    {slot.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white bg-black/80 px-1 rounded font-mono">
                        {slot.count}
                      </span>
                    )}

                    {/* Enhancement level tag */}
                    {(slot.item.enhancementLevel || 0) > 0 && (
                      <span className="absolute top-0.5 left-1 text-[9px] font-black text-amber-300 bg-stone-950/90 px-1 rounded border border-amber-600 font-mono">
                        +{slot.item.enhancementLevel}
                      </span>
                    )}

                    {/* Pill quality dot */}
                    {slot.item.quality && slot.item.quality !== 'ha_pham' && (
                      <span className="absolute top-0.5 right-1 w-2 h-2 rounded-full bg-amber-400 shadow shadow-amber-400 animate-pulse" />
                    )}
                  </div>
                );
              })}

              {/* Empty placeholder slots */}
              {Array.from({ length: Math.max(0, 16 - player.inventory.length) }).map((_, i) => (
                <div key={`empty_${i}`} className="w-15 h-15 rounded-xl border border-stone-800/60 bg-stone-900/30" />
              ))}
            </div>
          </div>

          {/* RIGHT: DETAILS & DIRECT STAT COMPARISON */}
          <div className="space-y-3 bg-stone-950/70 border border-stone-800 p-4 rounded-xl flex flex-col justify-between">
            {selectedSlot ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between border-b border-stone-800 pb-2.5">
                  <div>
                    <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                      {selectedSlot.item.name}
                      {(selectedSlot.item.enhancementLevel || 0) > 0 && (
                        <span className="text-amber-400 font-mono font-bold">
                          +{selectedSlot.item.enhancementLevel}
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-amber-400 uppercase font-semibold">
                        Phẩm: {selectedSlot.item.rarity}
                      </span>
                      {renderQualityBadge(selectedSlot.item.quality)}
                    </div>
                  </div>
                  <span className="text-3xl">{selectedSlot.item.icon}</span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed italic">
                  {selectedSlot.item.description}
                </p>

                {/* Passive artifact effect if present */}
                {selectedSlot.item.artifactPassive && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/50 text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      Hiệu Ứng Bí Khí: [{selectedSlot.item.artifactPassive.name}]
                    </span>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      {selectedSlot.item.artifactPassive.description}
                    </p>
                  </div>
                )}

                {/* === DIRECT STAT COMPARISON PANEL === */}
                {isEquipment && selectedStats ? (
                  <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-2">
                    <span className="font-semibold text-amber-400 text-xs flex items-center justify-between">
                      <span>So Sánh Với Đang Mặc ({currentEquipped?.name || 'Chưa mặc'}):</span>
                    </span>

                    <div className="space-y-1.5 text-xs">
                      {/* ATK */}
                      {(selectedStats.atk > 0 || currentStats.atk > 0) && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-stone-400">⚔️ Tấn Công:</span>
                          <span className="font-mono">
                            {currentStats.atk} ➜ <span className="font-bold">{selectedStats.atk}</span>{' '}
                            {selectedStats.atk >= currentStats.atk ? (
                              <span className="text-emerald-400 font-bold">(+{selectedStats.atk - currentStats.atk}) ▲</span>
                            ) : (
                              <span className="text-rose-400 font-bold">(-{currentStats.atk - selectedStats.atk}) ▼</span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* DEF */}
                      {(selectedStats.def > 0 || currentStats.def > 0) && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-stone-400">🛡️ Phòng Thủ:</span>
                          <span className="font-mono">
                            {currentStats.def} ➜ <span className="font-bold">{selectedStats.def}</span>{' '}
                            {selectedStats.def >= currentStats.def ? (
                              <span className="text-emerald-400 font-bold">(+{selectedStats.def - currentStats.def}) ▲</span>
                            ) : (
                              <span className="text-rose-400 font-bold">(-{currentStats.def - selectedStats.def}) ▼</span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* HP */}
                      {(selectedStats.hp > 0 || currentStats.hp > 0) && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-stone-400">❤️ Khí Huyết:</span>
                          <span className="font-mono">
                            {currentStats.hp} ➜ <span className="font-bold">{selectedStats.hp}</span>{' '}
                            {selectedStats.hp >= currentStats.hp ? (
                              <span className="text-emerald-400 font-bold">(+{selectedStats.hp - currentStats.hp}) ▲</span>
                            ) : (
                              <span className="text-rose-400 font-bold">(-{currentStats.hp - selectedStats.hp}) ▼</span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* MP */}
                      {(selectedStats.mp > 0 || currentStats.mp > 0) && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-stone-400">💧 Linh Lực:</span>
                          <span className="font-mono">
                            {currentStats.mp} ➜ <span className="font-bold">{selectedStats.mp}</span>{' '}
                            {selectedStats.mp >= currentStats.mp ? (
                              <span className="text-emerald-400 font-bold">(+{selectedStats.mp - currentStats.mp}) ▲</span>
                            ) : (
                              <span className="text-rose-400 font-bold">(-{currentStats.mp - selectedStats.mp}) ▼</span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Speed */}
                      {(selectedStats.speed > 0 || currentStats.speed > 0) && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-stone-400">⚡ Thân Pháp:</span>
                          <span className="font-mono">
                            {currentStats.speed} ➜ <span className="font-bold">{selectedStats.speed}</span>{' '}
                            {selectedStats.speed >= currentStats.speed ? (
                              <span className="text-emerald-400 font-bold">(+{selectedStats.speed - currentStats.speed}) ▲</span>
                            ) : (
                              <span className="text-rose-400 font-bold">(-{currentStats.speed - selectedStats.speed}) ▼</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedSlot.item.useEffect ? (
                  /* Pill Effects */
                  <div className="text-xs space-y-1 bg-stone-900/90 p-3 rounded-xl border border-stone-800">
                    <span className="font-semibold text-emerald-400 block mb-1">Hiệu Dụng Khi Dùng:</span>
                    {selectedSlot.item.useEffect.healHp && <div className="text-rose-400">❤️ Hồi phục {selectedSlot.item.useEffect.healHp} Khí Huyết</div>}
                    {selectedSlot.item.useEffect.restoreMp && <div className="text-cyan-400">💧 Hồi phục {selectedSlot.item.useEffect.restoreMp} Linh Lực</div>}
                    {selectedSlot.item.useEffect.addExp && <div className="text-amber-400">🧘 Tăng {selectedSlot.item.useEffect.addExp} Tu Vi</div>}
                    {selectedSlot.item.useEffect.cureBacklash && <div className="text-purple-400">✨ Trị liệu Thương Thế & Phản Phệ</div>}
                    {selectedSlot.item.useEffect.curePoison && <div className="text-emerald-400">🌿 Giải Độc & Chướng Khí</div>}
                    {selectedSlot.item.stats?.breakthroughBonus && (
                      <div className="text-yellow-400 font-bold">🌟 Tăng +{selectedSlot.item.stats.breakthroughBonus}% Tỷ Lệ Đột Phá!</div>
                    )}
                  </div>
                ) : null}

                {/* Cultivation Manual Compatibility Badge */}
                {selectedSlot.item.type === 'manual' && selectedSlot.item.manualArtId && (() => {
                  const art = CULTIVATION_ARTS[selectedSlot.item.manualArtId!];
                  if (!art) return null;
                  const compat = checkArtCompatibility(player.spiritualRoot, art.element);
                  const isLearned = player.learnedArtIds.includes(art.id);
                  return (
                    <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                      isLearned ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                      : compat.compatible ? 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300'
                      : 'bg-rose-950/50 border-rose-600/40 text-rose-300'
                    }`}>
                      <div className="font-bold flex items-center gap-1.5">
                        {isLearned ? '📜 Đã Từng Lĩnh Hội'
                        : compat.compatible ? '✅ Tương Dung Tuyệt Đối'
                        : '❌ Tương Khắc Linh Căn'}
                      </div>
                      <div className="text-[11px] opacity-90 leading-relaxed">
                        {isLearned ? 'Công pháp này đã nằm trong tàng thức của đạo hữu.' : compat.reason}
                      </div>
                    </div>
                  );
                })()}

                {/* Compatibility error alert banner */}
                {compatError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-start gap-2 animate-fade-in shadow-lg">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{compatError}</span>
                  </div>
                )}

                <div className="text-xs text-stone-400">
                  Giá trị thương hội: 💎 {selectedSlot.item.price} Linh Thạch
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-stone-500 py-12">
                Hãy chọn một vật phẩm trong túi để xem chi tiết và so sánh
              </div>
            )}

            {/* Action buttons */}
            {selectedSlot && (
              <div className="space-y-2 pt-2 border-t border-stone-800">
                {isEquipment ? (
                  <button
                    onClick={handleEquipItem}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 font-bold text-xs transition cursor-pointer shadow-lg active:scale-98"
                  >
                    Trang Bị Vào Người
                  </button>
                ) : selectedSlot.item.type === 'manual' ? (
                  <button
                    onClick={handleLearnManual}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold text-xs transition cursor-pointer shadow-lg active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    Lĩnh Hội Bí Tịch / Đan Phương / Bản Vẽ
                  </button>
                ) : selectedSlot.item.useEffect ? (
                  <button
                    onClick={handleUseItem}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-lg active:scale-98"
                  >
                    Uống / Sử Dụng Đan Dược
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
