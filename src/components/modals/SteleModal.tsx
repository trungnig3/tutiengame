import React, { useState } from 'react';
import { PlayerStats, CollectibleResource } from '../../types/game';
import { ITEMS } from '../../data/items';
import { CULTIVATION_ARTS } from '../../data/arts';
import { soundManager } from '../../engine/audio';
import { recordEvent } from '../../engine/achievementEngine';
import { Sparkles, Scroll, Flame, ShieldAlert, X, Check, Award, Lock, BookOpen } from 'lucide-react';

interface SteleModalProps {
  resource: CollectibleResource;
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onSpawnChallengeEnemies?: () => void;
  onClose: () => void;
}

export const SteleModal: React.FC<SteleModalProps> = ({
  resource,
  player,
  onUpdatePlayer,
  onSpawnChallengeEnemies,
  onClose,
}) => {
  const [comprehended, setComprehended] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const isStele = resource.type === 'stele';
  const isAltar = resource.type === 'altar' || resource.type === 'ancient_mechanism';

  // Comprehend Ancient Stele
  const handleComprehendStele = () => {
    if (player.mp < 30) {
      setResultMessage('Linh lực bất túc (cần tối thiểu 30 MP để vận chuyển kiếm ý)!');
      return;
    }

    soundManager.playBreakthrough();
    setComprehended(true);

    const art = resource.rewardArtId ? CULTIVATION_ARTS[resource.rewardArtId] : null;
    const expGained = resource.rewardExp || 800;

    onUpdatePlayer(prev => {
      let nextArts = [...prev.learnedArtIds];
      let unlockedManuals = [...prev.inventory];

      // Add art if not yet known
      if (art && !nextArts.includes(art.id)) {
        nextArts.push(art.id);
      }

      // Add book item to inventory if not already having it
      const bookItem = ITEMS.bi_tich_hac_phong_kiem;
      if (bookItem && !unlockedManuals.some(slot => slot.item.id === bookItem.id)) {
        if (unlockedManuals.length < prev.maxInventorySize) {
          unlockedManuals.push({ item: bookItem, count: 1 });
        }
      }

      const updated = {
        ...prev,
        mp: Math.max(0, prev.mp - 30),
        exp: prev.exp + expGained,
        learnedArtIds: nextArts,
        currentArtId: prev.currentArtId || (art ? art.id : prev.currentArtId),
        inventory: unlockedManuals,
        exploredDungeons: prev.exploredDungeons
          ? [...new Set([...prev.exploredDungeons, resource.id])]
          : [resource.id],
      };

      return recordEvent(updated, {
        type: 'read_stele',
        payload: { steleId: resource.id },
      });
    });

    setResultMessage(
      `Lĩnh ngộ thành công! Thu hoạch +${expGained} Tu Vi, cảm ngộ kiếm ý bí truyền [Hắc Phong Bá Kiếm Quyết] và thu được tàn thiên ngọc giản!`
    );
  };

  // Dispel seal on Altar / Ancient Mechanism
  const handleDispelAltar = () => {
    const requiredMp = resource.requiredMp || 50;
    if (player.mp < requiredMp) {
      setResultMessage(`Linh lực bất túc (cần tối thiểu ${requiredMp} MP để phá trận)!`);
      return;
    }

    soundManager.playBreakthrough();
    setComprehended(true);
    const expGained = resource.rewardExp || 600;

    onUpdatePlayer(prev => {
      let inv = [...prev.inventory];
      const dropPill = ITEMS.truc_co_dan;
      if (dropPill && !inv.some(s => s.item.id === dropPill.id)) {
        if (inv.length < prev.maxInventorySize) {
          inv.push({ item: dropPill, count: 1 });
        }
      }

      const updated = {
        ...prev,
        mp: Math.max(0, prev.mp - requiredMp),
        exp: prev.exp + expGained,
        inventory: inv,
        clearedMechanisms: prev.clearedMechanisms
          ? [...new Set([...prev.clearedMechanisms, resource.id])]
          : [resource.id],
      };

      return recordEvent(updated, {
        type: 'solve_mechanism',
        payload: { altarId: resource.id },
      });
    });

    setResultMessage(
      `Phá giải cấm chế thành công! Nhận +${expGained} Tu Vi và giải trừ phong ấn bảo hạp: Thu hoạch được 1 viên [Trúc Cơ Đan]!`
    );
  };

  // Risk challenge: Awaken guardian spirits
  const handleTriggerRiskChallenge = () => {
    soundManager.playSlash();
    setComprehended(true);

    if (onSpawnChallengeEnemies) {
      onSpawnChallengeEnemies();
    }

    setResultMessage(
      `Cấm chế huyết sát đã bị kích hoạt! Khí tức yêu ma bùng nổ, Huyết Thi Tinh Anh đã thức tỉnh và đang lao tới tấn công bạn! Hãy tiêu diệt chúng để đoạt bảo!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-stone-900 via-stone-950 to-purple-950/90 border-2 border-amber-600/50 rounded-2xl shadow-2xl overflow-hidden text-stone-100 flex flex-col">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative px-6 py-4 border-b border-amber-800/40 bg-stone-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-300">
              {isStele ? <BookOpen className="w-5 h-5" /> : <Flame className="w-5 h-5 text-rose-400" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {isStele ? 'Thượng Cổ Thạch Bi' : 'Cổ Trận Cấm Chế'}
              </span>
              <h2 className="text-lg font-black text-amber-200 font-title">
                {resource.loreTitle || resource.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm overflow-y-auto max-h-[70vh]">
          {/* Lore inscription */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/30 text-stone-200 text-xs leading-relaxed italic font-serif">
            "{resource.loreText ||
              'Văn tự thượng cổ lưu lại dấu vết kiếm khí sắc bén như sấm sét. Đứng trước thạch bi, kinh mạch toàn thân không tự chủ được mà rung chuyển cộng hưởng.'}"
          </div>

          {/* Result notice */}
          {resultMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2 animate-fade-in">
              <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>{resultMessage}</div>
            </div>
          )}

          {/* Interactive Actions if not yet taken */}
          {!comprehended && (
            <div className="space-y-3 pt-2">
              {isStele && (
                <button
                  onClick={handleComprehendStele}
                  className="w-full p-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-101 active:scale-99"
                >
                  <Sparkles className="w-4 h-4 text-stone-950" />
                  Vận Chuyển Linh Lực – Tham Ngộ Kiếm Ý (Tiêu hao 30 MP)
                </button>
              )}

              {isAltar && (
                <>
                  <button
                    onClick={handleDispelAltar}
                    className="w-full p-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-101 active:scale-99"
                  >
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    Hiến Tế Ngũ Hành Linh Lực Phá Giải Trận (Tiêu hao 50 MP)
                  </button>

                  <button
                    onClick={handleTriggerRiskChallenge}
                    className="w-full p-3.5 rounded-xl bg-rose-950/60 border border-rose-600/60 hover:bg-rose-900/60 text-rose-200 font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Kích Hoạt Thí Luyện Huyết Sát (Nguy hiểm: Triệu hồi tinh anh hộ vệ)
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-800/40 bg-stone-950/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition cursor-pointer"
          >
            {comprehended ? 'Hoàn Tất & Rời Khỏi' : 'Đóng / Tạm Thời Rút Lui'}
          </button>
        </div>
      </div>
    </div>
  );
};
