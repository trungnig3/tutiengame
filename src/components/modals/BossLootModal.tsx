import React from 'react';
import { Item, PlayerStats } from '../../types/game';
import { checkArtCompatibility } from '../../data/spiritualRoots';
import { Sparkles, Trophy, Gem, BookOpen, Sword, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { soundManager } from '../../engine/audio';

export interface BossLootData {
  bossId: string;
  bossName: string;
  bossTitle: string;
  exp: number;
  spiritStones: number;
  items: { item: Item; count: number }[];
}

interface BossLootModalProps {
  loot: BossLootData;
  player: PlayerStats;
  onClaimAll: (loot: BossLootData) => void;
  onClose: () => void;
}

export function BossLootModal({ loot, player, onClaimAll, onClose }: BossLootModalProps) {
  const handleClaim = () => {
    soundManager.playCollect();
    onClaimAll(loot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-stone-950 to-black border-2 border-amber-600/60 rounded-2xl shadow-2xl shadow-amber-950/50 p-6 space-y-6 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-950/50 text-amber-300 text-xs tracking-widest font-semibold uppercase">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            Trảm Sát Lĩnh Chủ Thành Công
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 font-title tracking-wider">
            CHIẾN LỢI PHẨM THƯỢNG CỔ
          </h2>
          <div className="text-stone-300 text-sm font-semibold flex items-center justify-center gap-2">
            <span>Bại tướng:</span>
            <span className="text-rose-400 font-bold">{loot.bossName}</span>
            <span className="text-stone-500 text-xs">({loot.bossTitle})</span>
          </div>
        </div>

        {/* Currency & Exp Banner */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center gap-3 px-3 py-2 bg-stone-950/60 border border-amber-900/40 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-400 font-bold">
              💎
            </div>
            <div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Linh Thạch Thu Hoạch</div>
              <div className="text-base font-black text-amber-300">+{loot.spiritStones}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-stone-950/60 border border-sky-900/40 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-600/50 flex items-center justify-center text-sky-400 font-bold">
              ✨
            </div>
            <div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Tu Vi Tăng Cường</div>
              <div className="text-base font-black text-sky-300">+{loot.exp} Điểm</div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400 font-semibold px-1">
            <span>Danh sách bảo vật rơi ({loot.items.length} món)</span>
            <span className="text-amber-500/80">Linh căn hiện tại: {player.spiritualRoot?.name}</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loot.items.map((slot, idx) => {
              const it = slot.item;
              const isManual = it.type === 'manual' || it.manualArtId;
              let compatibility: { compatible: boolean; reason: string } | null = null;
              
              if (isManual) {
                // Determine manual element
                const elem = (it.id.includes('hoa') ? 'hoa' : it.id.includes('kim') ? 'kim' : it.id.includes('thuy') ? 'thuy' : it.id.includes('moc') ? 'moc' : it.id.includes('tho') ? 'tho' : it.id.includes('loi') ? 'loi' : 'ngu_hanh') as any;
                compatibility = checkArtCompatibility(player.spiritualRoot, elem);
              }

              const rarityColor =
                it.rarity === 'thien' ? 'border-yellow-500/70 bg-yellow-950/20 text-yellow-300' :
                it.rarity === 'dia' ? 'border-amber-500/70 bg-amber-950/20 text-amber-300' :
                it.rarity === 'huyen' ? 'border-purple-500/70 bg-purple-950/20 text-purple-300' :
                it.rarity === 'hoang' ? 'border-sky-500/70 bg-sky-950/20 text-sky-300' :
                'border-stone-700 bg-stone-900/60 text-stone-300';

              return (
                <div
                  key={`${it.id}_${idx}`}
                  className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${rarityColor}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl p-2 rounded-lg bg-black/40 border border-stone-800 shrink-0">
                      {it.icon || '📦'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-100">{it.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/50 border border-stone-700 text-stone-300">
                          x{slot.count}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">{it.description}</p>
                    </div>
                  </div>

                  {/* Compatibility Badge if Manual */}
                  {isManual && compatibility && (
                    <div className="shrink-0 text-right">
                      {compatibility.compatible ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-semibold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          Hợp Linh Căn
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-semibold" title={compatibility.reason}>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          Khác Linh Căn (Có thể bán {it.price} 💎)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleClaim}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black text-sm tracking-wide transition shadow-xl hover:scale-101 active:scale-99 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-stone-950" />
            Thu Nạp Toàn Bộ Vào Túi Càn Khôn
          </button>
        </div>
      </div>
    </div>
  );
}
