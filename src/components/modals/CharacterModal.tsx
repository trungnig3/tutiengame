import React, { useState } from 'react';
import { PlayerStats } from '../../types/game';
import { REALMS } from '../../data/realms';
import { ITEMS } from '../../data/items';
import { soundManager } from '../../engine/audio';
import confetti from 'canvas-confetti';
import { X, Zap, Shield, Heart, Activity, Sparkles, AlertTriangle } from 'lucide-react';
import {
  canAttemptBreakthrough,
  calculateBreakthroughChance,
  performBreakthroughAttempt
} from '../../engine/cultivationEngine';

interface CharacterModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
  onOpenTitles?: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  player,
  onUpdatePlayer,
  onClose,
  onOpenTitles,
}) => {
  const currentRealm = REALMS[player.realmIndex] || REALMS[0];
  const nextRealm = REALMS[player.realmIndex + 1];

  const [selectedPillId, setSelectedPillId] = useState<string | null>(null);
  const [breakthroughResult, setBreakthroughResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Available breakthrough pills in inventory
  const availablePills = player.inventory.filter(slot => 
    slot.item.type === 'pill' && (slot.item.stats?.breakthroughBonus || slot.item.id.includes('dan'))
  );

  const selectedPill = selectedPillId
    ? player.inventory.find(s => s.item.id === selectedPillId)?.item || null
    : null;

  const conditionCheck = canAttemptBreakthrough(player);
  const chanceInfo = calculateBreakthroughChance(player, selectedPill);

  const handleBreakthrough = () => {
    const result = performBreakthroughAttempt(player, selectedPillId);

    if (result.success) {
      soundManager.playBreakthrough();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#eab308', '#38bdf8', '#a855f7'],
        });
      } catch (e) {}
      onUpdatePlayer(() => result.updatedPlayer);
      setBreakthroughResult({
        success: true,
        message: result.message,
      });
      setSelectedPillId(null);
    } else {
      soundManager.playHit();
      onUpdatePlayer(() => result.updatedPlayer);
      setBreakthroughResult({
        success: false,
        message: result.message,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col bg-stone-900 border-2 border-amber-600/70 rounded-xl shadow-2xl p-3 sm:p-6 text-stone-100 overflow-hidden">
        {/* Ancient ornament header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 pb-2.5 sm:pb-3 mb-3 sm:mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🥋</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-300 font-title">
                Nhân Vật & Đột Phá Cảnh Giới
              </h2>
              <p className="text-[10px] sm:text-xs text-stone-400">Xem chỉ số đạo thể, linh căn và xung kích thiên đạo bình cảnh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* LEFT: CHARACTER STATS & SPIRITUAL ROOTS */}
            <div className="space-y-4 bg-stone-950/70 border border-stone-800 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-amber-500 bg-stone-900 flex items-center justify-center text-3xl shadow">
                🧘‍♂️
              </div>
              <div>
                <div className="font-bold text-amber-200 text-base">{player.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-stone-400">
                  <span className="text-yellow-300 font-semibold">{player.title}</span>
                  {onOpenTitles && (
                    <button
                      onClick={onOpenTitles}
                      className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/70 text-[10px] hover:bg-amber-900 transition flex items-center gap-1"
                      title="Đổi hoặc xem Danh Hiệu"
                    >
                      👑 Đổi
                    </button>
                  )}
                </div>
                <div className="text-xs font-semibold text-amber-400">{currentRealm.fullName}</div>
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-red-400" /> Khí Huyết:
                </span>
                <span className="font-bold text-rose-300">{Math.floor(player.hp)} / {player.maxHp}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-sky-400" /> Linh Lực:
                </span>
                <span className="font-bold text-cyan-300">{Math.floor(player.mp)} / {player.maxMp}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-amber-400" /> Tấn Công:
                </span>
                <span className="font-bold text-amber-300">{player.atk}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-400" /> Phòng Thủ:
                </span>
                <span className="font-bold text-blue-300">{player.def}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400">Tốc Độ:</span>
                <span className="font-bold text-emerald-300">{player.speed}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400">Bạo Kích:</span>
                <span className="font-bold text-yellow-300">{Math.round(player.critRate * 100)}%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400">Thần Thức:</span>
                <span className="font-bold text-purple-300">{player.consciousness}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-900 border border-stone-800">
                <span className="text-stone-400">Ngộ Tính:</span>
                <span className="font-bold text-teal-300">{player.comprehension}</span>
              </div>
            </div>

            {/* Spiritual Root Details */}
            <div className="p-2.5 rounded bg-amber-950/40 border border-amber-900/60 text-xs space-y-1">
              <div className="flex justify-between items-center font-bold text-amber-300">
                <span>Linh Căn: {player.spiritualRoot?.name || 'Ngũ Hành Tạp Linh Căn'}</span>
                <span className="text-[11px] text-amber-400">Độ Thuần: {player.spiritualRoot?.purity ?? 45}%</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                {player.spiritualRoot?.description || 'Ngũ hành tạp linh căn, tuy tiến cảnh chậm rãi nhưng căn cơ vững chắc kiêm tu vạn pháp.'}
              </p>
            </div>

            {/* Sect & Faction Affiliation Status */}
            <div className="p-2.5 rounded bg-sky-950/40 border border-sky-900/60 text-xs space-y-1.5">
              <div className="flex justify-between items-center font-bold text-sky-300">
                <span className="flex items-center gap-1">
                  🏔️ Tông Môn: {player.sectId === 'thanh_van_tong' ? 'Thanh Vân Tiên Tông' : player.sectId === 'tan_tu' ? 'Độc Hành Tán Tu' : 'Chưa Gia Nhập'}
                </span>
                <span className="text-[10px] bg-sky-900 text-sky-200 px-2 py-0.5 rounded font-semibold">
                  {player.sectRank ? player.sectRank.toUpperCase() : 'VISITOR'}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-300 pt-0.5 border-t border-sky-900/40">
                <span>Điểm Cống Hiến Tông Môn:</span>
                <span className="font-bold text-sky-400">🏅 {player.contributionPoints || 0} CH</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-400 pt-1 border-t border-sky-900/40">
                <div>Thanh Vân Tông: <strong className="text-sky-300">+{player.factionReputation?.thanh_van_tong || 0}</strong></div>
                <div>Vạn Bảo Hội: <strong className="text-amber-300">+{player.factionReputation?.van_bao_thuong_hoi || 0}</strong></div>
                <div>Tán Tu Minh: <strong className="text-emerald-300">+{player.factionReputation?.tan_tu_lien_minh || 0}</strong></div>
                <div>Hắc Sát Môn: <strong className="text-red-400">{player.factionReputation?.hac_sat_mon || -50}</strong></div>
              </div>
            </div>
          </div>

          {/* RIGHT: BREAKTHROUGH SYSTEM */}
          <div className="space-y-4 bg-stone-950/70 border border-stone-800 p-4 rounded-lg flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Tiến Trình Đột Phá Cảnh Giới
              </h3>

              {nextRealm ? (
                <>
                  <div className="p-3 bg-stone-900 rounded-lg border border-amber-800/40 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Hiện tại:</span>
                      <span className="font-semibold text-stone-200">{currentRealm.fullName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Mục tiêu:</span>
                      <span className="font-bold text-amber-400">{nextRealm.fullName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Tu Vi Tích Lũy:</span>
                      <span className={player.exp >= currentRealm.requiredExp ? 'text-emerald-400 font-bold' : 'text-stone-300'}>
                        {player.exp} / {currentRealm.requiredExp}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-400">Xác Suất Thành Công:</span>
                      <span className="font-bold text-sky-400">{Math.round(chanceInfo.totalChance * 100)}%</span>
                    </div>
                  </div>

                  {/* Breakthrough Pill Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300">
                      Chọn Đan Dược Trợ Phá (Tăng Tỷ Lệ & Giảm Phản Phệ):
                    </label>
                    <select
                      value={selectedPillId || ''}
                      onChange={e => setSelectedPillId(e.target.value || null)}
                      className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Không Dùng Đan Dược --</option>
                      {availablePills.map(slot => (
                        <option key={slot.item.id} value={slot.item.id}>
                          {slot.item.name} (Có: {slot.count}) - +{slot.item.stats?.breakthroughBonus || 20}% tỷ lệ
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Warning / Backlash info */}
                  <div className="flex items-start gap-2 p-2 bg-rose-950/40 border border-rose-900/60 rounded text-[11px] text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>
                      {conditionCheck.reason || `Cảnh báo: Đột phá thất bại có thể gây tổn thất Khí Huyết (${currentRealm.tribulationDamage || 30} điểm) và dẫn đến Thương Thế!`}
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-amber-300 text-sm font-semibold">
                  Đạo hữu đã đạt tới đỉnh cao giới hạn hiện tại của tu tiên giới!
                </div>
              )}

              {/* Result banner */}
              {breakthroughResult && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                  breakthroughResult.success 
                    ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-200' 
                    : 'bg-rose-950/60 border-rose-600/70 text-rose-200'
                }`}>
                  {breakthroughResult.message}
                </div>
              )}
            </div>

            {/* Action button */}
            {nextRealm && (
              <button
                onClick={handleBreakthrough}
                disabled={!conditionCheck.canAttempt}
                className={`w-full py-2.5 rounded-lg font-bold text-sm tracking-wide transition shadow-lg ${
                  conditionCheck.canAttempt
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 hover:brightness-110 active:scale-98 cursor-pointer'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                }`}
              >
                {conditionCheck.canAttempt ? `⚡ XUNG KÍCH ĐỘT PHÁ CẢNH GIỚI (${Math.round(chanceInfo.totalChance * 100)}%)` : 'Chưa Đạt Điều Kiện Để Xung Kích'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
