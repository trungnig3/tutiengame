import React, { useState } from 'react';
import { PlayerStats, NPC, Item } from '../../types/game';
import { ITEMS } from '../../data/items';
import { soundManager } from '../../engine/audio';
import { recordEvent } from '../../engine/achievementEngine';
import { X, ShoppingBag, Coins, ArrowRightLeft, ShieldCheck, AlertCircle } from 'lucide-react';

interface ShopModalProps {
  npc: NPC;
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  npc,
  player,
  onUpdatePlayer,
  onClose,
}) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedBuyItem, setSelectedBuyItem] = useState<{ item: Item; price: number; currency: 'spiritStones' | 'contribution'; stock?: number } | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [selectedSellSlotIndex, setSelectedSellSlotIndex] = useState<number | null>(null);
  const [sellQuantity, setSellQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Shop inventory items list
  const shopItems = (npc.shopItems || []).map(entry => ({
    item: ITEMS[entry.itemId],
    price: entry.price,
    stock: entry.stock ?? 99,
    currency: entry.currency ?? 'spiritStones',
  })).filter(entry => !!entry.item);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelectBuyItem = (entry: { item: Item; price: number; currency: 'spiritStones' | 'contribution'; stock?: number }) => {
    setSelectedBuyItem(entry);
    setBuyQuantity(1);
  };

  const handleConfirmBuy = () => {
    if (!selectedBuyItem || isProcessing) return;
    setIsProcessing(true);

    const { item, price, currency, stock } = selectedBuyItem;
    const qty = Math.max(1, Math.min(buyQuantity, stock ?? 99));
    const totalCost = price * qty;

    // Check balance
    if (currency === 'spiritStones' && player.spiritStones < totalCost) {
      showToast(`Không đủ Linh Thạch! Cần 💎 ${totalCost}, hiện có 💎 ${player.spiritStones}.`, 'error');
      setIsProcessing(false);
      return;
    }

    if (currency === 'contribution' && (player.contributionPoints || 0) < totalCost) {
      showToast(`Không đủ Điểm Cống Hiến! Cần 🏅 ${totalCost}, hiện có 🏅 ${player.contributionPoints || 0}.`, 'error');
      setIsProcessing(false);
      return;
    }

    // Check inventory capacity
    const currentSlot = player.inventory.find(s => s.item.id === item.id);
    if (!currentSlot && player.inventory.length >= player.maxInventorySize) {
      showToast('Túi trữ vật đã đầy! Hãy dọn dẹp hoặc mở rộng túi đồ.', 'error');
      setIsProcessing(false);
      return;
    }

    soundManager.playCollect();

    onUpdatePlayer(prev => {
      let updatedInv = [...prev.inventory];
      const existingIdx = updatedInv.findIndex(s => s.item.id === item.id);

      if (existingIdx >= 0 && item.stackable) {
        updatedInv[existingIdx] = {
          ...updatedInv[existingIdx],
          count: updatedInv[existingIdx].count + qty,
        };
      } else if (updatedInv.length < prev.maxInventorySize) {
        updatedInv.push({ item, count: qty });
      }

      const nextStones = currency === 'spiritStones' ? Math.max(0, prev.spiritStones - totalCost) : prev.spiritStones;
      const nextContrib = currency === 'contribution' ? Math.max(0, (prev.contributionPoints || 0) - totalCost) : (prev.contributionPoints || 0);

      // Increase faction reputation slightly when trading with merchants
      let updatedRep = { ...prev.factionReputation };
      if (npc.faction.includes('Vạn Bảo')) {
        updatedRep.van_bao_thuong_hoi = (updatedRep.van_bao_thuong_hoi || 0) + Math.min(5, Math.ceil(qty * 0.5));
      } else if (npc.faction.includes('Thanh Vân')) {
        updatedRep.thanh_van_tong = (updatedRep.thanh_van_tong || 0) + Math.min(5, Math.ceil(qty * 0.5));
      }

      const updated = {
        ...prev,
        spiritStones: nextStones,
        contributionPoints: nextContrib,
        inventory: updatedInv,
        factionReputation: updatedRep,
      };

      return recordEvent(updated, {
        type: 'trade_spirit_stones',
        payload: { amount: totalCost },
      });
    });

    showToast(`Đã mua thành công x${qty} [${item.name}]!`, 'success');
    setIsProcessing(false);
  };

  const handleSelectSellSlot = (slotIdx: number) => {
    setSelectedSellSlotIndex(slotIdx);
    setSellQuantity(1);
  };

  const handleConfirmSell = () => {
    if (selectedSellSlotIndex === null || isProcessing) return;
    setIsProcessing(true);

    const slot = player.inventory[selectedSellSlotIndex];
    if (!slot) {
      setIsProcessing(false);
      return;
    }

    if (slot.item.type === 'quest' || slot.item.type === 'treasure') {
      showToast('Vật phẩm nhiệm vụ trọng yếu / Bảo vật di tích, không thể bán!', 'error');
      setIsProcessing(false);
      return;
    }

    const qty = Math.max(1, Math.min(sellQuantity, slot.count));
    // Sell price formula: 65% base price (at least 1 spirit stone)
    const unitSellPrice = Math.max(1, Math.floor(slot.item.price * 0.65));
    const totalEarned = unitSellPrice * qty;

    soundManager.playCollect();

    onUpdatePlayer(prev => {
      let updatedInv = prev.inventory
        .map((s, idx) => {
          if (idx === selectedSellSlotIndex) {
            const rem = s.count - qty;
            return rem > 0 ? { ...s, count: rem } : null;
          }
          return s;
        })
        .filter((s): s is { item: Item; count: number } => s !== null);

      const updated = {
        ...prev,
        spiritStones: prev.spiritStones + totalEarned,
        inventory: updatedInv,
      };

      return recordEvent(updated, {
        type: 'trade_spirit_stones',
        payload: { amount: totalEarned },
      });
    });

    showToast(`Đã bán x${qty} [${slot.item.name}] thu về +💎 ${totalEarned} Linh Thạch!`, 'success');
    setSelectedSellSlotIndex(null);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-3xl bg-stone-900 border-2 border-amber-600/70 rounded-2xl shadow-2xl p-6 text-stone-100 flex flex-col gap-4 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-stone-950 border border-amber-500/80 flex items-center justify-center text-2xl shadow-inner">
              {npc.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-amber-300 font-title">
                  {npc.name} – Tiệm Giao Dịch
                </h2>
                <span className="text-[10px] bg-amber-950/80 text-amber-400 border border-amber-700/60 px-2 py-0.5 rounded font-semibold">
                  {npc.faction}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">{npc.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-stone-950/80 px-3 py-1.5 rounded-lg border border-stone-800 text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                💎 Linh Thạch: {player.spiritStones}
              </span>
              {(player.contributionPoints > 0 || npc.merchantCategory === 'sect') && (
                <span className="text-sky-400 font-bold flex items-center gap-1 border-l border-stone-700 pl-3">
                  🏅 Cống Hiến: {player.contributionPoints || 0}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs: Mua / Bán */}
        <div className="flex gap-2 border-b border-stone-800 pb-2">
          <button
            onClick={() => { setTab('buy'); setSelectedBuyItem(null); }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tab === 'buy' ? 'bg-amber-600 text-stone-950 shadow-md font-extrabold' : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Mua Vật Phẩm ({shopItems.length})
          </button>
          <button
            onClick={() => { setTab('sell'); setSelectedSellSlotIndex(null); }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tab === 'sell' ? 'bg-amber-600 text-stone-950 shadow-md font-extrabold' : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Bán Đồ Túi Trữ Vật ({player.inventory.length}/{player.maxInventorySize})
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className={`p-2.5 rounded-xl border text-xs font-semibold text-center flex items-center justify-center gap-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}>
            {toastMessage.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toastMessage.text}
          </div>
        )}

        {/* Tab 1: MUA HÀNG */}
        {tab === 'buy' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
            {/* Danh sách hàng */}
            <div className="md:col-span-2 overflow-y-auto max-h-[50vh] pr-1 space-y-2">
              {shopItems.map(entry => {
                const { item, price, currency, stock } = entry;
                const isSelected = selectedBuyItem?.item.id === item.id;
                const canAfford = currency === 'spiritStones' 
                  ? player.spiritStones >= price 
                  : (player.contributionPoints || 0) >= price;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectBuyItem(entry)}
                    className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/40 shadow-md'
                        : 'border-stone-800 bg-stone-950/60 hover:border-amber-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center text-2xl shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-bold text-amber-200 text-xs flex items-center gap-2">
                          {item.name}
                          <span className="text-[10px] text-stone-400 font-normal">
                            (Còn: {stock})
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className={`font-bold text-xs ${currency === 'spiritStones' ? 'text-amber-400' : 'text-sky-400'}`}>
                        {currency === 'spiritStones' ? `💎 ${price}` : `🏅 ${price} CH`}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        {canAfford ? 'Đủ điều kiện' : 'Thiếu tài nguyên'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Khung Chi Tiết & Mua Số Lượng */}
            <div className="bg-stone-950/90 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
              {selectedBuyItem ? (
                <div className="space-y-3.5">
                  <div className="text-center pb-2 border-b border-stone-800">
                    <div className="text-4xl mb-1">{selectedBuyItem.item.icon}</div>
                    <div className="font-bold text-amber-200 text-sm">{selectedBuyItem.item.name}</div>
                    <span className="text-[10px] bg-stone-900 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40">
                      {selectedBuyItem.item.type.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed italic">
                    "{selectedBuyItem.item.description}"
                  </p>

                  <div className="bg-stone-900/80 p-2.5 rounded-lg text-xs space-y-1 text-stone-400">
                    <div>Đơn giá: <strong className="text-amber-300">{selectedBuyItem.currency === 'spiritStones' ? `💎 ${selectedBuyItem.price}` : `🏅 ${selectedBuyItem.price} Cống hiến`}</strong></div>
                    <div>Tồn kho tiệm: <strong>{selectedBuyItem.stock}</strong></div>
                  </div>

                  {/* Quantity selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-stone-400 font-semibold">Chọn số lượng mua:</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBuyQuantity(q => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={selectedBuyItem.stock ?? 99}
                        value={buyQuantity}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 1;
                          setBuyQuantity(Math.max(1, Math.min(val, selectedBuyItem.stock ?? 99)));
                        }}
                        className="w-16 h-8 text-center bg-stone-900 border border-stone-700 rounded text-amber-300 font-bold text-xs"
                      />
                      <button
                        onClick={() => setBuyQuantity(q => Math.min(selectedBuyItem.stock ?? 99, q + 1))}
                        className="w-8 h-8 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold"
                      >
                        +
                      </button>
                      <button
                        onClick={() => {
                          const maxAffordable = selectedBuyItem.currency === 'spiritStones'
                            ? Math.floor(player.spiritStones / selectedBuyItem.price)
                            : Math.floor((player.contributionPoints || 0) / selectedBuyItem.price);
                          setBuyQuantity(Math.max(1, Math.min(maxAffordable, selectedBuyItem.stock ?? 99)));
                        }}
                        className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded text-amber-400 font-semibold"
                      >
                        Tối Đa
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-xs">
                    <span className="text-stone-400">Tổng thanh toán:</span>
                    <span className="font-extrabold text-amber-300 text-sm">
                      {selectedBuyItem.currency === 'spiritStones' 
                        ? `💎 ${selectedBuyItem.price * buyQuantity}` 
                        : `🏅 ${selectedBuyItem.price * buyQuantity} CH`}
                    </span>
                  </div>

                  <button
                    onClick={handleConfirmBuy}
                    disabled={
                      isProcessing ||
                      (selectedBuyItem.currency === 'spiritStones' 
                        ? player.spiritStones < selectedBuyItem.price * buyQuantity 
                        : (player.contributionPoints || 0) < selectedBuyItem.price * buyQuantity)
                    }
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold text-xs shadow-lg transition cursor-pointer"
                  >
                    Xác Nhận Mua
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 text-xs p-4">
                  <ShoppingBag className="w-10 h-10 mb-2 opacity-40 text-amber-400" />
                  Chọn một vật phẩm bên trái để xem mô tả và lựa chọn số lượng giao dịch.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: BÁN ĐỒ TÚI TRỮ VẬT */}
        {tab === 'sell' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
            {/* Danh sách vật phẩm trong túi */}
            <div className="md:col-span-2 overflow-y-auto max-h-[50vh] pr-1 space-y-2">
              {player.inventory.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-xs">
                  Túi trữ vật trống không, không có vật phẩm nào để bán.
                </div>
              ) : (
                player.inventory.map((slot, idx) => {
                  const isSelected = selectedSellSlotIndex === idx;
                  const unitSellPrice = Math.max(1, Math.floor(slot.item.price * 0.65));
                  const isQuest = slot.item.type === 'quest' || slot.item.type === 'treasure';

                  return (
                    <div
                      key={`${slot.item.id}_${idx}`}
                      onClick={() => !isQuest && handleSelectSellSlot(idx)}
                      className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/40 shadow-md'
                          : isQuest
                          ? 'border-stone-900 bg-stone-950/30 opacity-40 cursor-not-allowed'
                          : 'border-stone-800 bg-stone-950/60 hover:border-amber-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center text-2xl shrink-0">
                          {slot.item.icon}
                        </div>
                        <div>
                          <div className="font-bold text-amber-200 text-xs flex items-center gap-2">
                            {slot.item.name}
                            <span className="text-stone-400 font-normal">x{slot.count}</span>
                            {isQuest && (
                              <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.2 rounded border border-red-800">
                                Không thể bán
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                            {slot.item.description}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="font-bold text-xs text-amber-400">
                          +💎 {unitSellPrice}/cái
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          Tổng: 💎 {unitSellPrice * slot.count}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Khung Chi Tiết & Bán Số Lượng */}
            <div className="bg-stone-950/90 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
              {selectedSellSlotIndex !== null && player.inventory[selectedSellSlotIndex] ? (
                (() => {
                  const slot = player.inventory[selectedSellSlotIndex];
                  const unitSellPrice = Math.max(1, Math.floor(slot.item.price * 0.65));
                  const totalEarned = unitSellPrice * sellQuantity;

                  return (
                    <div className="space-y-3.5">
                      <div className="text-center pb-2 border-b border-stone-800">
                        <div className="text-4xl mb-1">{slot.item.icon}</div>
                        <div className="font-bold text-amber-200 text-sm">{slot.item.name}</div>
                        <span className="text-[10px] bg-stone-900 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40">
                          Hiện có: x{slot.count}
                        </span>
                      </div>

                      <p className="text-xs text-stone-300 leading-relaxed italic">
                        "{slot.item.description}"
                      </p>

                      <div className="bg-stone-900/80 p-2.5 rounded-lg text-xs space-y-1 text-stone-400">
                        <div>Giá thu mua: <strong className="text-amber-300">+💎 {unitSellPrice} Linh Thạch</strong> (65% giá gốc)</div>
                      </div>

                      {/* Quantity selector */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-stone-400 font-semibold">Chọn số lượng bán:</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSellQuantity(q => Math.max(1, q - 1))}
                            className="w-8 h-8 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={slot.count}
                            value={sellQuantity}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 1;
                              setSellQuantity(Math.max(1, Math.min(val, slot.count)));
                            }}
                            className="w-16 h-8 text-center bg-stone-900 border border-stone-700 rounded text-amber-300 font-bold text-xs"
                          />
                          <button
                            onClick={() => setSellQuantity(q => Math.min(slot.count, q + 1))}
                            className="w-8 h-8 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold"
                          >
                            +
                          </button>
                          <button
                            onClick={() => setSellQuantity(slot.count)}
                            className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded text-amber-400 font-semibold"
                          >
                            Bán Hết
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-xs">
                        <span className="text-stone-400">Thu về Linh Thạch:</span>
                        <span className="font-extrabold text-amber-300 text-sm">
                          +💎 {totalEarned}
                        </span>
                      </div>

                      <button
                        onClick={handleConfirmSell}
                        disabled={isProcessing}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                      >
                        Xác Nhận Bán
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 text-xs p-4">
                  <ArrowRightLeft className="w-10 h-10 mb-2 opacity-40 text-emerald-400" />
                  Chọn một vật phẩm trong túi trữ vật bên trái để chỉ định số lượng và xuất bán.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
