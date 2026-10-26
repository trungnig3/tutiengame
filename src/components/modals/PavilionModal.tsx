import React, { useState } from 'react';
import { PlayerStats, PavilionManual, SectRank } from '../../types/game';
import { PAVILION_MANUALS, SECT_RANK_DETAILS, SECT_RANKS_ORDER } from '../../data/factions';
import { CULTIVATION_ARTS } from '../../data/arts';
import { REALMS } from '../../data/realms';
import { soundManager } from '../../engine/audio';
import { checkArtCompatibility } from '../../data/spiritualRoots';
import { X, BookOpen, Sparkles, Shield, Check, Lock, Coins, Award } from 'lucide-react';

interface PavilionModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
}

export const PavilionModal: React.FC<PavilionModalProps> = ({
  player,
  onUpdatePlayer,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedManual, setSelectedManual] = useState<PavilionManual | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'spiritStones' | 'contribution'>('spiritStones');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const categories = [
    { id: 'all', label: 'Tất Cả Bí Điển' },
    { id: 'co_so', label: 'Cơ Sở & Tâm Pháp' },
    { id: 'kiem_quyet', label: 'Kiếm Quyết' },
    { id: 'phap_thuat', label: 'Pháp Thuật Ngũ Hành' },
    { id: 'than_phap', label: 'Thân Pháp' },
    { id: 'phong_ngu', label: 'Phòng Ngự & Thể Tu' },
    { id: 'tu_luyen', label: 'Chí Tôn Thần Thông' },
  ];

  const filteredManuals = PAVILION_MANUALS.filter(m => {
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getRankLevel = (rank: SectRank) => SECT_RANKS_ORDER.indexOf(rank);

  const handleLearnManual = (manual: PavilionManual) => {
    // Check if already learned
    if (player.learnedArtIds.includes(manual.artId)) {
      showToast('Đã sở hữu và lĩnh hội công pháp này rồi!', 'error');
      return;
    }

    // Check spiritual root compatibility
    const rootCheck = checkArtCompatibility(player.spiritualRoot, manual.element);
    if (!rootCheck.compatible) {
      showToast(rootCheck.reason, 'error');
      return;
    }

    // Check realm requirement
    if (player.realmIndex < manual.requiredRealmIndex) {
      const realmReq = REALMS[manual.requiredRealmIndex]?.fullName || `Cảnh giới ${manual.requiredRealmIndex}`;
      showToast(`Chưa đủ cảnh giới! Yêu cầu tối thiểu: ${realmReq}.`, 'error');
      return;
    }

    // Check sect rank requirement if any
    if (manual.requiredSectRank && getRankLevel(player.sectRank) < getRankLevel(manual.requiredSectRank)) {
      const rankName = SECT_RANK_DETAILS[manual.requiredSectRank]?.name;
      showToast(`Cấp bậc tông môn chưa đủ! Yêu cầu: ${rankName}.`, 'error');
      return;
    }

    // Check payment
    const cost = paymentMethod === 'spiritStones' ? manual.priceSpiritStones : manual.priceContribution;

    if (paymentMethod === 'spiritStones') {
      if (player.spiritStones < cost) {
        showToast(`Không đủ Linh Thạch! Cần 💎 ${cost}, hiện có 💎 ${player.spiritStones}.`, 'error');
        return;
      }
    } else {
      if ((player.contributionPoints || 0) < cost) {
        showToast(`Không đủ Điểm Cống Hiến! Cần 🏅 ${cost}, hiện có 🏅 ${player.contributionPoints || 0}.`, 'error');
        return;
      }
    }

    soundManager.playBreakthrough();

    onUpdatePlayer(prev => {
      const newLearned = prev.learnedArtIds.includes(manual.artId)
        ? prev.learnedArtIds
        : [...prev.learnedArtIds, manual.artId];

      const nextStones = paymentMethod === 'spiritStones'
        ? Math.max(0, prev.spiritStones - cost)
        : prev.spiritStones;

      const nextContrib = paymentMethod === 'contribution'
        ? Math.max(0, (prev.contributionPoints || 0) - cost)
        : (prev.contributionPoints || 0);

      // Add sect reputation
      const rep = { ...prev.factionReputation };
      rep.thanh_van_tong = (rep.thanh_van_tong || 0) + 15;

      return {
        ...prev,
        spiritStones: nextStones,
        contributionPoints: nextContrib,
        learnedArtIds: newLearned,
        factionReputation: rep,
      };
    });

    showToast(`Đã mua và lĩnh hội thành công [${manual.name}]! Mở [K] Tu Luyện để vận hành.`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-4xl bg-stone-900 border-2 border-amber-600/70 rounded-2xl shadow-2xl p-6 text-stone-100 flex flex-col gap-4 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-950 border border-sky-400 flex items-center justify-center text-2xl shadow-inner">
              📖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-sky-300 font-title">
                  Tàng Kinh Các – Thanh Vân Tiên Tông
                </h2>
                <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-600/60 px-2 py-0.5 rounded font-semibold">
                  {SECT_RANK_DETAILS[player.sectRank]?.name || 'Khách Viếng Thăm'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Vạn quyển đạo tàng, ngự kiếm trừ yêu, hóa hợp ngũ hành
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-stone-950/80 px-3 py-1.5 rounded-lg border border-stone-800 text-xs">
              <span className="text-amber-400 font-bold">
                💎 {player.spiritStones}
              </span>
              <span className="text-sky-400 font-bold border-l border-stone-700 pl-3">
                🏅 {player.contributionPoints || 0} CH
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-stone-800 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className={`p-2.5 rounded-xl border text-xs font-semibold text-center ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}>
            {toastMessage.text}
          </div>
        )}

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* List of Manuals */}
          <div className="md:col-span-2 overflow-y-auto max-h-[52vh] pr-1 space-y-2">
            {filteredManuals.map(manual => {
              const isSelected = selectedManual?.id === manual.id;
              const isLearned = player.learnedArtIds.includes(manual.artId);
              const isRealmEnough = player.realmIndex >= manual.requiredRealmIndex;
              const isRankEnough = !manual.requiredSectRank || getRankLevel(player.sectRank) >= getRankLevel(manual.requiredSectRank);

              return (
                <div
                  key={manual.id}
                  onClick={() => setSelectedManual(manual)}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-sky-400 bg-sky-950/40 shadow-md'
                      : isLearned
                      ? 'border-emerald-800/60 bg-emerald-950/20'
                      : 'border-stone-800 bg-stone-950/60 hover:border-sky-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-2xl shrink-0">
                      {manual.grade === 'dia' ? '📜' : manual.grade === 'huyen' ? '📘' : '📗'}
                    </div>
                    <div>
                      <div className="font-bold text-sky-200 text-xs flex items-center gap-2">
                        {manual.name}
                        {isLearned && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-700 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Đã Học
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                        {manual.effects}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        Yêu cầu: {REALMS[manual.requiredRealmIndex]?.fullName}
                        {manual.requiredSectRank && ` • ${SECT_RANK_DETAILS[manual.requiredSectRank]?.name}`}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="font-bold text-xs text-amber-400">
                      💎 {manual.priceSpiritStones}
                    </div>
                    <div className="font-bold text-[11px] text-sky-400 mt-0.5">
                      🏅 {manual.priceContribution} CH
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Details Panel */}
          <div className="bg-stone-950/90 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
            {selectedManual ? (
              (() => {
                const isLearned = player.learnedArtIds.includes(selectedManual.artId);
                const isRealmEnough = player.realmIndex >= selectedManual.requiredRealmIndex;
                const isRankEnough = !selectedManual.requiredSectRank || getRankLevel(player.sectRank) >= getRankLevel(selectedManual.requiredSectRank);

                return (
                  <div className="space-y-3.5">
                    <div className="text-center pb-2 border-b border-stone-800">
                      <div className="text-3xl mb-1">📜</div>
                      <div className="font-bold text-sky-300 text-sm">{selectedManual.name}</div>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.2 rounded uppercase">
                          Phẩm: {selectedManual.grade}
                        </span>
                        <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.2 rounded uppercase">
                          Hệ: {selectedManual.element}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed italic">
                      "{selectedManual.description}"
                    </p>

                    <div className="bg-stone-900/80 p-2.5 rounded-lg text-xs space-y-1 text-stone-400 border border-stone-800">
                      <div>Hiệu quả: <strong className="text-emerald-300">{selectedManual.effects}</strong></div>
                      <div>Cảnh giới yêu cầu: <strong className={isRealmEnough ? 'text-stone-200' : 'text-red-400'}>{REALMS[selectedManual.requiredRealmIndex]?.fullName}</strong></div>
                      {selectedManual.requiredSectRank && (
                        <div>Cấp bậc tông môn: <strong className={isRankEnough ? 'text-stone-200' : 'text-red-400'}>{SECT_RANK_DETAILS[selectedManual.requiredSectRank]?.name}</strong></div>
                      )}
                    </div>

                    {/* Payment Mode Selector */}
                    {!isLearned && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-stone-400 font-semibold">Chọn phương thức sao chép:</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setPaymentMethod('spiritStones')}
                            className={`p-2 rounded-lg text-xs font-bold border transition cursor-pointer flex flex-col items-center ${
                              paymentMethod === 'spiritStones'
                                ? 'border-amber-400 bg-amber-950/60 text-amber-300'
                                : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700'
                            }`}
                          >
                            <span>💎 Linh Thạch</span>
                            <span className="text-[11px] font-normal">{selectedManual.priceSpiritStones}</span>
                          </button>
                          <button
                            onClick={() => setPaymentMethod('contribution')}
                            className={`p-2 rounded-lg text-xs font-bold border transition cursor-pointer flex flex-col items-center ${
                              paymentMethod === 'contribution'
                                ? 'border-sky-400 bg-sky-950/60 text-sky-300'
                                : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700'
                            }`}
                          >
                            <span>🏅 Cống Hiến</span>
                            <span className="text-[11px] font-normal">{selectedManual.priceContribution}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleLearnManual(selectedManual)}
                      disabled={isLearned || !isRealmEnough || !isRankEnough}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition cursor-pointer ${
                        isLearned
                          ? 'bg-emerald-950 border border-emerald-600 text-emerald-400 cursor-default'
                          : !isRealmEnough || !isRankEnough
                          ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                          : 'bg-sky-600 hover:bg-sky-500 text-white'
                      }`}
                    >
                      {isLearned ? 'Đã Lĩnh Hội Đạo Tàng' : 'Sao Chép & Lĩnh Hội'}
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 text-xs p-4">
                <BookOpen className="w-10 h-10 mb-2 opacity-40 text-sky-400" />
                Chọn một bộ công pháp bí tịch bên trái để xem hiệu quả và học bí quyết.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
