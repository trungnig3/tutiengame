import React, { useState } from 'react';
import { PlayerStats, ForgingRecipe, Item, EquipmentTier } from '../../types/game';
import { FORGING_RECIPES } from '../../data/recipes';
import { ITEMS } from '../../data/items';
import { soundManager } from '../../engine/audio';
import { recordEvent } from '../../engine/achievementEngine';
import { recomputePlayerStats, getItemEnhancedStats } from '../../engine/cultivationEngine';
import { X, Hammer, Shield, Sword, Sparkles, CheckCircle2, ChevronRight, Zap, ArrowUpCircle, Flame, AlertCircle } from 'lucide-react';

interface ForgingModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
}

export const ForgingModal: React.FC<ForgingModalProps> = ({
  player,
  onUpdatePlayer,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'craft' | 'enhance'>('craft');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'weapon' | 'armor' | 'accessory' | 'talisman'>('all');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(FORGING_RECIPES[0].id);
  const [craftedResult, setCraftedResult] = useState<string | null>(null);

  // Refinement / Enhancement state
  const [selectedEnhanceSlot, setSelectedEnhanceSlot] = useState<{
    source: 'equipment' | 'inventory';
    slotType?: 'weapon' | 'armor' | 'accessory' | 'talisman';
    invIndex?: number;
    item: Item;
  } | null>(null);
  const [enhanceResult, setEnhanceResult] = useState<{ success: boolean; message: string } | null>(null);

  // Filtered recipes
  const filteredRecipes = FORGING_RECIPES.filter(r => {
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  const selectedRecipe = FORGING_RECIPES.find(r => r.id === selectedRecipeId) || filteredRecipes[0] || FORGING_RECIPES[0];
  const targetItem = ITEMS[selectedRecipe.resultItemId];

  // Craft conditions check
  const hasOres = selectedRecipe.ingredients.every(req => {
    const slot = player.inventory.find(s => s.item.id === req.itemId);
    return slot && slot.count >= req.count;
  });
  const hasStones = player.spiritStones >= selectedRecipe.spiritStonesCost;
  const hasSpace = player.inventory.length < player.maxInventorySize || (targetItem?.stackable && player.inventory.some(s => s.item.id === targetItem.id));
  const canForge = hasOres && hasStones && hasSpace;

  const handleForge = () => {
    if (!canForge) return;

    soundManager.playPillCraft();

    onUpdatePlayer(prev => {
      let updatedInv = [...prev.inventory];
      selectedRecipe.ingredients.forEach(req => {
        const idx = updatedInv.findIndex(s => s.item.id === req.itemId);
        if (idx !== -1) {
          updatedInv[idx].count -= req.count;
        }
      });
      updatedInv = updatedInv.filter(s => s.count > 0);

      // Add forged item
      const itemToAdd: Item = {
        ...targetItem,
        enhancementLevel: 0,
      };

      const existing = updatedInv.find(s => s.item.id === itemToAdd.id && (s.item.enhancementLevel || 0) === 0);
      if (existing && itemToAdd.stackable) {
        existing.count += 1;
      } else if (updatedInv.length < prev.maxInventorySize) {
        updatedInv.push({ item: itemToAdd, count: 1 });
      }

      const updated = {
        ...prev,
        spiritStones: prev.spiritStones - selectedRecipe.spiritStonesCost,
        inventory: updatedInv,
        exp: prev.exp + 60,
      };

      return recordEvent(updated, {
        type: 'forge_equipment',
        payload: { itemId: targetItem.id, rarity: targetItem.rarity },
      });
    });

    setCraftedResult(`Đúc tạo thành công [${targetItem.name}]! Đã cất vào túi trữ vật.`);
  };

  // --- REFINEMENT / ENHANCEMENT LOGIC ---
  const currentItem = selectedEnhanceSlot?.item;
  const currentEnhLevel = currentItem?.enhancementLevel || 0;
  const nextEnhLevel = currentEnhLevel + 1;

  // Enhancement costs and chances
  let reqMaterialId = 'thiet_khoang';
  let reqMaterialCount = 3;
  let stoneCost = 30;
  let successRate = 1.0;

  if (currentEnhLevel === 0) {
    reqMaterialId = 'thiet_khoang';
    reqMaterialCount = 4;
    stoneCost = 40;
    successRate = 1.0;
  } else if (currentEnhLevel === 1) {
    reqMaterialId = 'thiet_khoang';
    reqMaterialCount = 6;
    stoneCost = 80;
    successRate = 0.95;
  } else if (currentEnhLevel === 2) {
    reqMaterialId = 'huyen_thiet';
    reqMaterialCount = 2;
    stoneCost = 120;
    successRate = 0.90;
  } else if (currentEnhLevel === 3) {
    reqMaterialId = 'huyen_thiet';
    reqMaterialCount = 3;
    stoneCost = 180;
    successRate = 0.80;
  } else if (currentEnhLevel === 4) {
    reqMaterialId = 'thanh_cuong_sa';
    reqMaterialCount = 2;
    stoneCost = 250;
    successRate = 0.70;
  } else if (currentEnhLevel === 5) {
    reqMaterialId = 'thanh_cuong_sa';
    reqMaterialCount = 3;
    stoneCost = 350;
    successRate = 0.60;
  } else if (currentEnhLevel === 6) {
    reqMaterialId = 'huyen_loi_tinh';
    reqMaterialCount = 2;
    stoneCost = 500;
    successRate = 0.50;
  } else if (currentEnhLevel === 7) {
    reqMaterialId = 'huyen_loi_tinh';
    reqMaterialCount = 3;
    stoneCost = 700;
    successRate = 0.40;
  } else {
    reqMaterialId = 'cuu_u_minh_thiet';
    reqMaterialCount = 2;
    stoneCost = 1000;
    successRate = 0.35;
  }

  const matItem = ITEMS[reqMaterialId];
  const playerMatCount = player.inventory.find(s => s.item.id === reqMaterialId)?.count || 0;
  const canEnhance = currentItem && currentEnhLevel < 9 && playerMatCount >= reqMaterialCount && player.spiritStones >= stoneCost;

  const handleEnhance = () => {
    if (!selectedEnhanceSlot || !canEnhance) return;

    const isSuccess = Math.random() < successRate;

    onUpdatePlayer(prev => {
      // Deduct materials & stones
      let updatedInv = prev.inventory.map(s => {
        if (s.item.id === reqMaterialId) {
          return { ...s, count: s.count - reqMaterialCount };
        }
        return s;
      }).filter(s => s.count > 0);

      let updatedEq = { ...prev.equipment };

      if (isSuccess) {
        soundManager.playBreakthrough();
        // Upgrade item
        if (selectedEnhanceSlot.source === 'equipment' && selectedEnhanceSlot.slotType) {
          const eqItem = updatedEq[selectedEnhanceSlot.slotType];
          if (eqItem) {
            updatedEq[selectedEnhanceSlot.slotType] = {
              ...eqItem,
              enhancementLevel: nextEnhLevel,
            };
            setSelectedEnhanceSlot({
              ...selectedEnhanceSlot,
              item: updatedEq[selectedEnhanceSlot.slotType]!,
            });
          }
        } else if (selectedEnhanceSlot.source === 'inventory' && selectedEnhanceSlot.invIndex !== undefined) {
          if (updatedInv[selectedEnhanceSlot.invIndex]) {
            updatedInv[selectedEnhanceSlot.invIndex].item = {
              ...updatedInv[selectedEnhanceSlot.invIndex].item,
              enhancementLevel: nextEnhLevel,
            };
            setSelectedEnhanceSlot({
              ...selectedEnhanceSlot,
              item: updatedInv[selectedEnhanceSlot.invIndex].item,
            });
          }
        }
      } else {
        soundManager.playHit();
      }

      const updated = recomputePlayerStats({
        ...prev,
        equipment: updatedEq,
        inventory: updatedInv,
        spiritStones: prev.spiritStones - stoneCost,
      });

      return updated;
    });

    if (isSuccess) {
      setEnhanceResult({
        success: true,
        message: `Tinh luyện thành công! [${currentItem.name}] đã thăng lên cấp [+${nextEnhLevel}], uy lực tăng +15%!`,
      });
    } else {
      setEnhanceResult({
        success: false,
        message: `Hỏa hầu bất ổn, khoáng chất phân rã! Tinh luyện thất bại, trang bị được giữ nguyên không tổn hại!`,
      });
    }
  };

  // Helper for tier badge color
  const getTierBadge = (tier?: EquipmentTier) => {
    switch (tier) {
      case 'co_bao':
      case 'thong_thien':
        return { label: 'Cổ Bảo', cls: 'bg-purple-950 text-purple-300 border-purple-600' };
      case 'linh_khi':
        return { label: 'Linh Khí', cls: 'bg-cyan-950 text-cyan-300 border-cyan-600' };
      case 'phap_khi_thuong':
        return { label: 'Pháp Khí Thượng Phẩm', cls: 'bg-amber-950 text-amber-300 border-amber-600' };
      case 'phap_khi_trung':
        return { label: 'Pháp Khí Trung Phẩm', cls: 'bg-yellow-950 text-yellow-300 border-yellow-700' };
      case 'phap_khi_ha':
        return { label: 'Pháp Khí Hạ Phẩm', cls: 'bg-stone-800 text-stone-300 border-stone-600' };
      default:
        return { label: 'Phàm Khí', cls: 'bg-stone-900 text-stone-400 border-stone-700' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-3xl bg-stone-900 border-2 border-amber-600/80 rounded-2xl shadow-2xl p-6 text-stone-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-950/60 border border-orange-500/50 shadow-inner">
              <Hammer className="w-6 h-6 text-orange-400 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-300 font-title">
                Thần Binh Các – Luyện Khí Đúc Bảo
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Trui rèn huyền thiết, may dệt pháp bào, chế tác pháp bảo và tinh luyện cường hóa
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

        {/* Tab Switcher (Craft vs Enhance) */}
        <div className="flex border-b border-stone-800 mb-3 text-xs">
          <button
            onClick={() => { setActiveTab('craft'); setCraftedResult(null); }}
            className={`flex-1 py-2 font-bold flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === 'craft'
                ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sword className="w-4 h-4 text-amber-400" />
            Đúc Tạo Pháp Bảo & Binh Khí
          </button>

          <button
            onClick={() => {
              setActiveTab('enhance');
              setEnhanceResult(null);
              // Auto-select equipped weapon if none selected
              if (!selectedEnhanceSlot && player.equipment.weapon) {
                setSelectedEnhanceSlot({ source: 'equipment', slotType: 'weapon', item: player.equipment.weapon });
              }
            }}
            className={`flex-1 py-2 font-bold flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === 'enhance'
                ? 'border-orange-400 text-orange-300 bg-orange-950/30'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            Tinh Luyện Cường Hóa (+1 ~ +9)
          </button>
        </div>

        {/* === TAB 1: CRAFTING === */}
        {activeTab === 'craft' && (
          <>
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 border-b border-stone-800/60 text-xs">
              {[
                { id: 'all', label: 'Tất Cả' },
                { id: 'weapon', label: '⚔️ Vũ Khí / Phi Kiếm' },
                { id: 'armor', label: '🥋 Hộ Giáp / Đạo Bào' },
                { id: 'accessory', label: '📿 Pháp Bảo / Bí Khí' },
                { id: 'talisman', label: '📜 Phù Lục' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer font-medium ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-stone-950 font-bold shadow'
                      : 'bg-stone-950/60 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto pr-1 flex-1">
              {/* Recipes List */}
              <div className="space-y-2 bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Binh Khí Phổ ({filteredRecipes.length})
                  </h3>
                  <span className="text-[11px] text-stone-400">
                    Linh Thạch: <span className="text-amber-400 font-bold">{player.spiritStones} 💎</span>
                  </span>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[52vh] pr-1">
                  {filteredRecipes.map(recipe => {
                    const isSelected = selectedRecipeId === recipe.id;
                    const it = ITEMS[recipe.resultItemId];
                    const canAfford = player.spiritStones >= recipe.spiritStonesCost;
                    const canOres = recipe.ingredients.every(req => {
                      const s = player.inventory.find(slot => slot.item.id === req.itemId);
                      return s && s.count >= req.count;
                    });
                    const tierBadge = getTierBadge(recipe.tier || it?.equipmentTier);

                    return (
                      <div
                        key={recipe.id}
                        onClick={() => {
                          setSelectedRecipeId(recipe.id);
                          setCraftedResult(null);
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-950/30 shadow-md ring-1 ring-orange-500/40'
                            : 'border-stone-800 bg-stone-900/90 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold text-amber-200 text-xs flex items-center gap-1.5">
                            <span className="text-base">{it?.icon || '⚔️'}</span> {recipe.name}
                          </span>
                          <span className="text-[11px] text-amber-400 font-mono font-bold">
                            💎 {recipe.spiritStonesCost}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-stone-400">
                            Cần: {recipe.ingredients.map(i => `${ITEMS[i.itemId]?.name || i.itemId} x${i.count}`).join(', ')}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${tierBadge.cls}`}>
                            {tierBadge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recipe Details & Craft Preview */}
              <div className="space-y-4 bg-stone-950/70 border border-stone-800 p-4 rounded-xl flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="border-b border-stone-800 pb-3">
                    <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                      Thành Phẩm Đúc Tạo:
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="w-12 h-12 rounded-xl bg-stone-900 border border-amber-600/50 flex items-center justify-center text-2xl shadow">
                        {targetItem?.icon || '⚔️'}
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                          {targetItem?.name}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadge(targetItem?.equipmentTier).cls}`}>
                            {getTierBadge(targetItem?.equipmentTier).label}
                          </span>
                        </h4>
                        <p className="text-xs text-stone-300 italic mt-0.5">{selectedRecipe.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Passive effect if artifact */}
                  {targetItem?.artifactPassive && (
                    <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-600/50 text-xs space-y-1">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        Uy Lực Pháp Bảo Bị Động: [{targetItem.artifactPassive.name}]
                      </div>
                      <p className="text-[11px] text-amber-100/90">
                        {targetItem.artifactPassive.description}
                      </p>
                    </div>
                  )}

                  {/* Stats list */}
                  {targetItem?.stats && (
                    <div className="text-xs space-y-1 bg-stone-900/90 p-3 rounded-xl border border-stone-800">
                      <span className="font-semibold text-amber-400 block mb-1">Chỉ Số Cơ Bản:</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {targetItem.stats.atk && <div className="text-rose-400">⚔️ Tấn Công: +{targetItem.stats.atk}</div>}
                        {targetItem.stats.def && <div className="text-blue-400">🛡️ Phòng Thủ: +{targetItem.stats.def}</div>}
                        {targetItem.stats.hp && <div className="text-emerald-400">❤️ Khí Huyết: +{targetItem.stats.hp}</div>}
                        {targetItem.stats.mp && <div className="text-cyan-400">💧 Linh Lực: +{targetItem.stats.mp}</div>}
                        {targetItem.stats.speed && <div className="text-yellow-400">⚡ Tốc Độ: +{targetItem.stats.speed}</div>}
                        {targetItem.stats.critRate && <div className="text-orange-400">💥 Bạo Kích: +{Math.round(targetItem.stats.critRate * 100)}%</div>}
                      </div>
                    </div>
                  )}

                  {/* Result Message */}
                  {craftedResult && (
                    <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{craftedResult}</span>
                    </div>
                  )}
                </div>

                {/* Craft button */}
                <button
                  onClick={handleForge}
                  disabled={!canForge}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 ${
                    canForge
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-stone-950 font-black cursor-pointer active:scale-98'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  {!hasSpace
                    ? 'Túi Trữ Vật Đã Đầy'
                    : !hasStones
                    ? `Thiếu Linh Thạch (Cần ${selectedRecipe.spiritStonesCost} 💎)`
                    : hasOres
                    ? 'KHỞI HỎA RÈN ĐÚC BẢO VẬT'
                    : 'Thiếu Khoáng Thạch'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* === TAB 2: REFINEMENT & ENHANCEMENT (+1 ~ +9) === */}
        {activeTab === 'enhance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto pr-1 flex-1">
            {/* Equipment selector */}
            <div className="space-y-3 bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl flex flex-col">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Chọn Trang Bị Cần Cường Hóa
              </h3>

              {/* Currently equipped items */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-stone-400 font-semibold">Đang Mặc Trên Người:</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['weapon', 'armor', 'accessory', 'talisman'] as const).map(slotKey => {
                    const eqItem = player.equipment[slotKey];
                    if (!eqItem) return null;
                    const isSelected = selectedEnhanceSlot?.source === 'equipment' && selectedEnhanceSlot.slotType === slotKey;
                    const enh = eqItem.enhancementLevel || 0;

                    return (
                      <div
                        key={slotKey}
                        onClick={() => {
                          setSelectedEnhanceSlot({ source: 'equipment', slotType: slotKey, item: eqItem });
                          setEnhanceResult(null);
                        }}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-orange-500 bg-orange-950/40 ring-1 ring-orange-500/50'
                            : 'border-stone-800 bg-stone-900/90 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-lg">{eqItem.icon}</span>
                          <div className="truncate">
                            <div className="font-bold text-xs text-amber-200 truncate">
                              {eqItem.name} {enh > 0 && <span className="text-amber-400 font-mono">+{enh}</span>}
                            </div>
                            <div className="text-[10px] text-stone-400 capitalize">{slotKey}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items in inventory that are equipment */}
              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-48 pr-1">
                <span className="text-[11px] text-stone-400 font-semibold">Trong Túi Đồ:</span>
                <div className="space-y-1.5">
                  {player.inventory
                    .map((s, idx) => ({ ...s, invIdx: idx }))
                    .filter(s => ['weapon', 'armor', 'accessory', 'talisman'].includes(s.item.type))
                    .map(slot => {
                      const isSelected = selectedEnhanceSlot?.source === 'inventory' && selectedEnhanceSlot.invIndex === slot.invIdx;
                      const enh = slot.item.enhancementLevel || 0;

                      return (
                        <div
                          key={`inv-${slot.invIdx}`}
                          onClick={() => {
                            setSelectedEnhanceSlot({ source: 'inventory', invIndex: slot.invIdx, item: slot.item });
                            setEnhanceResult(null);
                          }}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-orange-500 bg-orange-950/40 ring-1 ring-orange-500/50'
                              : 'border-stone-800 bg-stone-900/90 hover:border-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{slot.item.icon}</span>
                            <span className="font-semibold text-xs text-stone-200">
                              {slot.item.name} {enh > 0 && <span className="text-amber-400 font-mono">+{enh}</span>}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400">x{slot.count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Enhancement Forge Chamber */}
            <div className="space-y-4 bg-stone-950/70 border border-stone-800 p-4 rounded-xl flex flex-col justify-between">
              {currentItem ? (
                <div className="space-y-3.5">
                  <div className="border-b border-stone-800 pb-3">
                    <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                      Trang Bị Đang Tinh Luyện:
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="w-12 h-12 rounded-xl bg-stone-900 border border-orange-500/50 flex items-center justify-center text-2xl shadow">
                        {currentItem.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                          {currentItem.name}
                          <span className="text-xs px-2 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-600 font-mono">
                            Cấp: +{currentEnhLevel}
                          </span>
                        </h4>
                        <div className="text-xs text-stone-300 mt-0.5">
                          Tỷ lệ thành công: <span className="text-emerald-400 font-bold">{Math.round(successRate * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stat comparison: Current vs Next Level */}
                  {(() => {
                    const curStats = getItemEnhancedStats(currentItem);
                    const nextStats = getItemEnhancedStats({
                      ...currentItem,
                      enhancementLevel: nextEnhLevel,
                    });

                    return (
                      <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 space-y-2">
                        <span className="font-semibold text-amber-400 text-xs block">
                          Biến Đổi Uy Lực: (+{currentEnhLevel} ➜ +{nextEnhLevel})
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {curStats.atk > 0 && (
                            <div className="text-rose-400">
                              ⚔️ Công: {curStats.atk} ➜ <span className="font-bold text-emerald-400">{nextStats.atk} (+{nextStats.atk - curStats.atk})</span>
                            </div>
                          )}
                          {curStats.def > 0 && (
                            <div className="text-blue-400">
                              🛡️ Thủ: {curStats.def} ➜ <span className="font-bold text-emerald-400">{nextStats.def} (+{nextStats.def - curStats.def})</span>
                            </div>
                          )}
                          {curStats.hp > 0 && (
                            <div className="text-emerald-400">
                              ❤️ Máu: {curStats.hp} ➜ <span className="font-bold text-emerald-300">{nextStats.hp} (+{nextStats.hp - curStats.hp})</span>
                            </div>
                          )}
                          {curStats.mp > 0 && (
                            <div className="text-cyan-400">
                              💧 Linh Lực: {curStats.mp} ➜ <span className="font-bold text-cyan-300">{nextStats.mp} (+{nextStats.mp - curStats.mp})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Material Requirements */}
                  <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs space-y-1.5">
                    <span className="font-semibold text-stone-300">Nguyên Liệu Cần Cho Thăng Cấp:</span>
                    <div className="flex justify-between items-center text-[11px]">
                      <span>{matItem?.name || reqMaterialId}:</span>
                      <span className={`font-mono font-bold ${playerMatCount >= reqMaterialCount ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {playerMatCount} / {reqMaterialCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span>Linh Thạch Tiêu Hao:</span>
                      <span className={`font-mono font-bold ${player.spiritStones >= stoneCost ? 'text-amber-400' : 'text-rose-400'}`}>
                        {stoneCost} 💎 (Có: {player.spiritStones})
                      </span>
                    </div>
                  </div>

                  {/* Result Message */}
                  {enhanceResult && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      enhanceResult.success
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                        : 'bg-rose-950/70 border-rose-500 text-rose-200'
                    }`}>
                      {enhanceResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{enhanceResult.message}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-stone-500 space-y-2">
                  <Hammer className="w-10 h-10 opacity-30" />
                  <p className="text-xs">Vui lòng chọn một trang bị ở danh sách bên trái để bắt đầu tinh luyện.</p>
                </div>
              )}

              {/* Enhance button */}
              <button
                onClick={handleEnhance}
                disabled={!canEnhance}
                className={`w-full py-3 rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 ${
                  canEnhance
                    ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-stone-950 font-black cursor-pointer active:scale-98 shadow-orange-600/30'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                }`}
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                {currentEnhLevel >= 9
                  ? 'ĐÃ ĐẠT CẤP ĐỘ CƯỜNG HÓA TỐI ĐA (+9)'
                  : !currentItem
                  ? 'CHỌN TRANG BỊ CẦN TINH LUYỆN'
                  : player.spiritStones < stoneCost
                  ? `Thiếu Linh Thạch (${stoneCost} 💎)`
                  : playerMatCount < reqMaterialCount
                  ? `Thiếu ${matItem?.name || 'Khoáng Thạch'} (Cần ${reqMaterialCount})`
                  : `TINH LUYỆN THĂNG CẤP (+${nextEnhLevel})`}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
