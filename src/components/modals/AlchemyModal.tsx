import React, { useState, useEffect } from 'react';
import { PlayerStats, AlchemyRecipe, PillQuality, Item } from '../../types/game';
import { ALCHEMY_RECIPES } from '../../data/recipes';
import { ITEMS } from '../../data/items';
import { soundManager } from '../../engine/audio';
import { recordEvent } from '../../engine/achievementEngine';
import { X, Flame, Sparkles, CheckCircle2, ChevronRight, ShieldAlert, Award, Zap, ArrowUpCircle } from 'lucide-react';

interface AlchemyModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
}

export const AlchemyModal: React.FC<AlchemyModalProps> = ({
  player,
  onUpdatePlayer,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'healing' | 'qi' | 'breakthrough' | 'cure'>('all');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(ALCHEMY_RECIPES[0].id);
  const [useAuxiliaryCore, setUseAuxiliaryCore] = useState<boolean>(false);

  // Filtered recipes
  const filteredRecipes = ALCHEMY_RECIPES.filter(r => {
    if (activeCategory === 'all') return true;
    return r.category === activeCategory;
  });

  const selectedRecipe = ALCHEMY_RECIPES.find(r => r.id === selectedRecipeId) || filteredRecipes[0] || ALCHEMY_RECIPES[0];

  // Furnace level
  const furnaceLevel = player.alchemyFurnaceLevel || 1;
  const furnaceName = furnaceLevel === 3
    ? 'Bát Quái Cửu Dương Lô (Thần Phẩm)'
    : furnaceLevel === 2
    ? 'Huyền Thiết Tử Đỉnh (Trung Phẩm)'
    : 'Thanh Đồng Đan Lô (Cơ Bản)';

  // Mini-game heat control state
  const [isBrewing, setIsBrewing] = useState<boolean>(false);
  const [currentHeat, setCurrentHeat] = useState<number>(30); // 0 to 100
  const [brewProgress, setBrewProgress] = useState<number>(0); // 0 to 100
  const [goodHeatTime, setGoodHeatTime] = useState<number>(0);
  const [brewResult, setBrewResult] = useState<{
    success: boolean;
    quality: PillQuality;
    qualityName: string;
    message: string;
    count: number;
  } | null>(null);

  // Check if player has ingredients & inventory capacity
  const targetPill = ITEMS[selectedRecipe.pillId];
  const hasSpace = player.inventory.length < player.maxInventorySize || (targetPill?.stackable && player.inventory.some(s => s.item.id === targetPill.id));
  
  const hasMainIngredients = selectedRecipe.ingredients.every(req => {
    const slot = player.inventory.find(s => s.item.id === req.itemId);
    return slot && slot.count >= req.count;
  });

  // Check auxiliary beast core if enabled
  const auxReq = selectedRecipe.auxiliaryIngredients?.[0];
  const hasAux = auxReq ? player.inventory.some(s => s.item.id === auxReq.itemId && s.count >= auxReq.count) : false;

  const mpCost = Math.max(5, (selectedRecipe.mpCost || 15) - (furnaceLevel > 1 ? 5 : 0));
  const hasMp = player.mp >= mpCost;
  const canBrew = hasMainIngredients && hasSpace && hasMp && (!useAuxiliaryCore || (useAuxiliaryCore && hasAux));

  // Furnace heat tick loop when brewing
  useEffect(() => {
    if (!isBrewing) return;

    // Decay rate decreases with better furnace
    const decayRate = furnaceLevel === 3 ? 0.7 : furnaceLevel === 2 ? 0.95 : 1.3;

    const interval = setInterval(() => {
      // Natural heat decay
      setCurrentHeat(h => Math.max(0, h - decayRate));
      setBrewProgress(p => {
        const next = p + 2.5;
        if (next >= 100) {
          finishBrewing();
          return 100;
        }
        return next;
      });

      // Check if heat is within target zone
      const [minH, maxH] = selectedRecipe.targetHeatZone;
      setCurrentHeat(cur => {
        if (cur >= minH && cur <= maxH) {
          setGoodHeatTime(g => g + 1);
        }
        return cur;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isBrewing, selectedRecipe, furnaceLevel]);

  const startBrewing = () => {
    if (!canBrew || isBrewing) return;

    // Deduct ingredients & MP
    onUpdatePlayer(prev => {
      let updatedInv = [...prev.inventory];
      selectedRecipe.ingredients.forEach(req => {
        const idx = updatedInv.findIndex(s => s.item.id === req.itemId);
        if (idx !== -1) {
          updatedInv[idx].count -= req.count;
        }
      });

      if (useAuxiliaryCore && auxReq) {
        const auxIdx = updatedInv.findIndex(s => s.item.id === auxReq.itemId);
        if (auxIdx !== -1) {
          updatedInv[auxIdx].count -= auxReq.count;
        }
      }

      return {
        ...prev,
        mp: Math.max(0, prev.mp - mpCost),
        inventory: updatedInv.filter(s => s.count > 0),
      };
    });

    setIsBrewing(true);
    setCurrentHeat(45);
    setBrewProgress(0);
    setGoodHeatTime(0);
    setBrewResult(null);
  };

  const handleAddFuel = (amount: number) => {
    if (!isBrewing) return;
    setCurrentHeat(h => Math.min(100, Math.max(0, h + amount)));
  };

  // Quick auto-brew if player is far beyond realm
  const handleQuickBrew = () => {
    if (!canBrew || isBrewing) return;
    
    // Deduct ingredients
    onUpdatePlayer(prev => {
      let updatedInv = [...prev.inventory];
      selectedRecipe.ingredients.forEach(req => {
        const idx = updatedInv.findIndex(s => s.item.id === req.itemId);
        if (idx !== -1) {
          updatedInv[idx].count -= req.count;
        }
      });
      return {
        ...prev,
        mp: Math.max(0, prev.mp - mpCost),
        inventory: updatedInv.filter(s => s.count > 0),
      };
    });

    // Calculate outcome based on realm and base success rate
    const realmAdvantage = Math.max(0, player.realmIndex - selectedRecipe.requiredRealmIndex) * 0.05;
    const finalRate = Math.min(0.98, selectedRecipe.baseSuccessRate + realmAdvantage + (furnaceLevel * 0.05));
    const isSuccess = Math.random() < finalRate;

    if (isSuccess) {
      soundManager.playPillCraft();
      const isExtreme = Math.random() < 0.35 + (furnaceLevel * 0.1);
      const quality: PillQuality = isExtreme ? 'cuc_pham' : 'thuong_pham';
      const qualityName = isExtreme ? 'Cực Phẩm' : 'Thượng Phẩm';
      const count = isExtreme ? 2 : 1;

      addPillToInventory(quality, count, qualityName);
    } else {
      soundManager.playHit();
      addPillToInventory('phe_dan', 1, 'Phế Đan');
    }
  };

  const finishBrewing = () => {
    setIsBrewing(false);

    // Calculate quality based on percentage of time heat was in ideal zone
    let accuracy = goodHeatTime / 40; // ~40 ticks total
    if (furnaceLevel === 3) accuracy += 0.15;
    if (furnaceLevel === 2) accuracy += 0.08;
    if (useAuxiliaryCore && auxReq) accuracy += 0.15;

    if (accuracy >= 0.40) {
      soundManager.playPillCraft();
      let quality: PillQuality = 'ha_pham';
      let qualityName = 'Hạ Phẩm';
      let count = 1;

      if (accuracy >= 0.88) {
        quality = 'cuc_pham';
        qualityName = 'Cực Phẩm (+50% Dược Hiệu)';
        count = 2;
      } else if (accuracy >= 0.70) {
        quality = 'thuong_pham';
        qualityName = 'Thượng Phẩm (+35% Dược Hiệu)';
        count = 1;
      } else if (accuracy >= 0.52) {
        quality = 'trung_pham';
        qualityName = 'Trung Phẩm (+20% Dược Hiệu)';
        count = 1;
      } else {
        quality = 'ha_pham';
        qualityName = 'Hạ Phẩm (Chuẩn)';
        count = 1;
      }

      addPillToInventory(quality, count, qualityName);
    } else {
      soundManager.playHit();
      addPillToInventory('phe_dan', 1, 'Phế Đan');
    }
  };

  const addPillToInventory = (quality: PillQuality, count: number, qualityName: string) => {
    const basePill = quality === 'phe_dan' ? ITEMS.phe_dan : ITEMS[selectedRecipe.pillId];
    if (!basePill) return;

    // Multiplier based on quality
    const multiplier = quality === 'cuc_pham' ? 1.5 : quality === 'thuong_pham' ? 1.35 : quality === 'trung_pham' ? 1.2 : 1.0;
    
    // Create cloned item with quality adjustments
    const itemToAdd: Item = {
      ...basePill,
      quality,
      name: quality === 'phe_dan' ? 'Phế Đan Tro Tàn' : `${basePill.name} [${qualityName.split(' ')[0]}]`,
      description: quality === 'phe_dan' 
        ? basePill.description 
        : `${basePill.description} (Lò luyện phẩm chất: ${qualityName})`,
      useEffect: basePill.useEffect ? {
        ...basePill.useEffect,
        healHp: basePill.useEffect.healHp ? Math.round(basePill.useEffect.healHp * multiplier) : undefined,
        restoreMp: basePill.useEffect.restoreMp ? Math.round(basePill.useEffect.restoreMp * multiplier) : undefined,
        addExp: basePill.useEffect.addExp ? Math.round(basePill.useEffect.addExp * multiplier) : undefined,
      } : undefined,
      stats: basePill.stats ? {
        ...basePill.stats,
        breakthroughBonus: basePill.stats.breakthroughBonus ? Math.round(basePill.stats.breakthroughBonus * multiplier) : undefined,
      } : undefined,
    };

    onUpdatePlayer(prev => {
      let updatedInv = [...prev.inventory];
      const existing = updatedInv.find(s => s.item.id === itemToAdd.id && s.item.quality === quality);
      if (existing) {
        existing.count += count;
      } else if (updatedInv.length < prev.maxInventorySize) {
        updatedInv.push({ item: itemToAdd, count });
      }

      const updated = {
        ...prev,
        exp: prev.exp + (quality === 'phe_dan' ? 10 : 80),
        inventory: updatedInv,
      };

      if (quality !== 'phe_dan') {
        return recordEvent(updated, {
          type: 'craft_pill',
          payload: { recipeId: selectedRecipe.id, pillId: basePill.id },
        });
      }
      return updated;
    });

    if (quality === 'phe_dan') {
      setBrewResult({
        success: false,
        quality: 'phe_dan',
        qualityName: 'Phế Đan',
        count: 1,
        message: 'Đan hỏa bất ổn! Dược liệu bị thiêu rụi thành tro tàn Phế Đan, luyện chế thất bại!',
      });
    } else {
      setBrewResult({
        success: true,
        quality,
        qualityName,
        count,
        message: `Đan thành xuất lô! Đạt phẩm chất [${qualityName}]! Thu được ${count} viên ${itemToAdd.name}. Đan hương nồng nàn ngút trời!`,
      });
    }
  };

  // Upgrade furnace level
  const handleUpgradeFurnace = () => {
    const costStones = furnaceLevel === 1 ? 300 : 800;
    const reqOreId = furnaceLevel === 1 ? 'huyen_thiet' : 'cuu_u_minh_thiet';
    const reqOreCount = furnaceLevel === 1 ? 5 : 2;
    const oreName = ITEMS[reqOreId]?.name || 'Khoáng thạch';

    const hasStones = player.spiritStones >= costStones;
    const oreSlot = player.inventory.find(s => s.item.id === reqOreId);
    const hasOre = oreSlot && oreSlot.count >= reqOreCount;

    if (!hasStones || !hasOre) return;

    soundManager.playBreakthrough();
    onUpdatePlayer(prev => {
      let updatedInv = prev.inventory.map(s => {
        if (s.item.id === reqOreId) {
          return { ...s, count: s.count - reqOreCount };
        }
        return s;
      }).filter(s => s.count > 0);

      return {
        ...prev,
        spiritStones: prev.spiritStones - costStones,
        alchemyFurnaceLevel: (prev.alchemyFurnaceLevel || 1) + 1,
        inventory: updatedInv,
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-3xl bg-stone-900 border-2 border-amber-600/80 rounded-2xl shadow-2xl p-6 text-stone-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 shadow-inner">
              <Flame className="w-6 h-6 text-rose-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-amber-300 font-title">
                  Bát Quái Đan Phòng – Luyện Đan Thuật
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700 font-mono">
                  {furnaceName}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Dung hợp linh thảo, khống chế hỏa hầu, luyện thành linh đan diệu dược
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Furnace upgrade prompt if not max */}
            {furnaceLevel < 3 && (
              <button
                onClick={handleUpgradeFurnace}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-950 border border-amber-600/50 hover:border-amber-400 text-amber-300 text-xs transition cursor-pointer"
                title={`Nâng cấp Đan Lô: Cần ${furnaceLevel === 1 ? '300 💎 + 5 Huyền Thiết' : '800 💎 + 2 Cửu U Minh Thiết'}`}
              >
                <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                <span>Thăng Cấp Đan Lô</span>
              </button>
            )}

            <button
              onClick={!isBrewing ? onClose : undefined}
              disabled={isBrewing}
              className={`p-2 rounded-lg text-stone-400 transition ${
                isBrewing ? 'opacity-30 cursor-not-allowed' : 'hover:text-amber-300 hover:bg-stone-800 cursor-pointer'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 border-b border-stone-800 text-xs">
          {[
            { id: 'all', label: 'Tất Cả Đan Phương' },
            { id: 'healing', label: '❤️ Khí Huyết / Chữa Thương' },
            { id: 'qi', label: '💧 Linh Lực / Tụ Khí' },
            { id: 'cure', label: '🧪 Giải Độc / Trấn Tâm' },
            { id: 'breakthrough', label: '🌟 Đột Phá (Trúc Cơ Đan)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer font-medium ${
                activeCategory === tab.id
                  ? 'bg-amber-600 text-stone-950 font-bold shadow'
                  : 'bg-stone-950/60 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto pr-1 flex-1">
          {/* RECIPES LIST */}
          <div className="space-y-2 bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Đan Phương Khả Dụng ({filteredRecipes.length})
              </h3>
              <span className="text-[11px] text-stone-400">
                Tiêu Hao: <span className="text-cyan-400 font-bold">{mpCost} MP</span>
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[55vh] pr-1">
              {filteredRecipes.map(recipe => {
                const isSelected = selectedRecipeId === recipe.id;
                const canCraft = recipe.ingredients.every(req => {
                  const s = player.inventory.find(slot => slot.item.id === req.itemId);
                  return s && s.count >= req.count;
                });
                const pill = ITEMS[recipe.pillId];

                return (
                  <div
                    key={recipe.id}
                    onClick={() => !isBrewing && setSelectedRecipeId(recipe.id)}
                    className={`p-3 rounded-xl border transition ${
                      isBrewing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      isSelected
                        ? 'border-rose-500 bg-rose-950/30 shadow-md ring-1 ring-rose-500/40'
                        : 'border-stone-800 bg-stone-900/90 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-amber-200 text-xs flex items-center gap-1.5">
                        <span className="text-base">{pill?.icon || '💊'}</span> {recipe.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        canCraft
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600'
                          : 'bg-stone-950 text-stone-500 border border-stone-800'
                      }`}>
                        {canCraft ? 'Đủ Nguyên Liệu' : 'Thiếu Dược Liệu'}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-400">
                      Cần: {recipe.ingredients.map(i => `${ITEMS[i.itemId]?.name || i.itemId} x${i.count}`).join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FURNACE HEATING & MINI-GAME PANEL */}
          <div className="space-y-4 bg-stone-950/70 border border-stone-800 p-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Target pill preview */}
              <div className="border-b border-stone-800 pb-3">
                <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                  Đan Dược Mục Tiêu:
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="w-12 h-12 rounded-xl bg-stone-900 border border-amber-600/50 flex items-center justify-center text-2xl shadow">
                    {targetPill?.icon || '💊'}
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-300 text-sm">{selectedRecipe.targetPillName}</h4>
                    <p className="text-xs text-stone-300 italic mt-0.5">{selectedRecipe.description}</p>
                  </div>
                </div>
              </div>

              {/* Auxiliary Beast Core Toggle */}
              {auxReq && (
                <div className="p-2.5 rounded-lg bg-stone-900/90 border border-stone-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      Thêm Yêu Đan Trợ Lực (+15%~30% Tỷ Lệ Cực Phẩm)
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Cần: {auxReq.name} (Có: {player.inventory.find(s => s.item.id === auxReq.itemId)?.count || 0})
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useAuxiliaryCore}
                    disabled={isBrewing || !hasAux}
                    onChange={e => setUseAuxiliaryCore(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Temperature Gauge */}
              <div className="space-y-1.5 bg-stone-900/70 p-3 rounded-xl border border-stone-800">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-stone-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" /> Nhiệt Độ Lò Đan:
                  </span>
                  <span className={`font-mono font-bold ${
                    currentHeat >= selectedRecipe.targetHeatZone[0] && currentHeat <= selectedRecipe.targetHeatZone[1]
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}>
                    {Math.floor(currentHeat)}°C (Vùng Lý Tưởng: {selectedRecipe.targetHeatZone[0]}° - {selectedRecipe.targetHeatZone[1]}°C)
                  </span>
                </div>

                <div className="relative w-full h-7 bg-stone-950 rounded-lg overflow-hidden border border-stone-700 shadow-inner">
                  {/* Ideal zone highlighted in green */}
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-500/40 border-x-2 border-emerald-400 flex items-center justify-center"
                    style={{
                      left: `${selectedRecipe.targetHeatZone[0]}%`,
                      width: `${selectedRecipe.targetHeatZone[1] - selectedRecipe.targetHeatZone[0]}%`,
                    }}
                  >
                    <span className="text-[9px] text-emerald-200 font-bold uppercase tracking-widest opacity-80">
                      Vùng Đan Hỏa
                    </span>
                  </div>
                  {/* Current heat indicator bar */}
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 transition-all duration-100"
                    style={{ width: `${currentHeat}%` }}
                  />
                </div>
              </div>

              {/* Progress bar */}
              {isBrewing && (
                <div className="space-y-1 bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="flex justify-between text-[11px] text-stone-300">
                    <span>Tiến Trình Ngưng Kết Linh Đan:</span>
                    <span className="font-bold text-amber-400 font-mono">{Math.floor(brewProgress)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-100"
                      style={{ width: `${brewProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result display */}
              {brewResult && (
                <div className={`p-3 rounded-xl text-xs leading-relaxed border shadow-lg ${
                  brewResult.success
                    ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-600/80 text-rose-200'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {brewResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
                    <span>{brewResult.success ? 'Luyện Đan Thành Công!' : 'Luyện Đan Thất Bại!'}</span>
                  </div>
                  {brewResult.message}
                </div>
              )}
            </div>

            {/* Brewing action buttons */}
            <div className="space-y-2 pt-2">
              {isBrewing ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddFuel(7)}
                    className="py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-stone-950 font-bold text-xs transition cursor-pointer shadow-lg active:scale-95"
                  >
                    🔥 Ôn Hỏa (+7°C)
                  </button>
                  <button
                    onClick={() => handleAddFuel(15)}
                    className="py-3 rounded-xl bg-gradient-to-r from-orange-600 to-rose-600 text-white font-bold text-xs transition cursor-pointer shadow-lg active:scale-95 animate-pulse"
                  >
                    ⚡ Vũ Hỏa (+15°C)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={startBrewing}
                    disabled={!canBrew}
                    className={`col-span-2 py-3 rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-1.5 ${
                      canBrew
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 cursor-pointer active:scale-98 font-black'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-stone-950" />
                    {!hasSpace
                      ? 'Túi Trữ Vật Đã Đầy'
                      : !hasMp
                      ? `Linh Lực Không Đủ (Cần ${mpCost} MP)`
                      : hasMainIngredients
                      ? 'KHAI LÒ LUYỆN ĐAN (Thủ Công)'
                      : 'Thiếu Dược Liệu'}
                  </button>

                  <button
                    onClick={handleQuickBrew}
                    disabled={!canBrew}
                    className={`py-3 rounded-xl text-xs font-bold transition border ${
                      canBrew
                        ? 'bg-stone-900 border-amber-500/60 text-amber-300 hover:bg-stone-800 cursor-pointer active:scale-98'
                        : 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'
                    }`}
                    title="Luyện nhanh đan dược không cần chơi hỏa hầu nếu đạo hạnh đã đủ"
                  >
                    ⚡ Luyện Nhanh
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
