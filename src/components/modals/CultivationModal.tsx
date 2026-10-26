import React, { useState } from 'react';
import { PlayerStats, Item, RealmInfo } from '../../types/game';
import { REALMS } from '../../data/realms';
import { CULTIVATION_ARTS } from '../../data/arts';
import { ITEMS } from '../../data/items';
import { soundManager } from '../../engine/audio';
import confetti from 'canvas-confetti';
import {
  X,
  BookOpen,
  Sparkles,
  Zap,
  Shield,
  Heart,
  Flame,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  Layers,
  ArrowRight,
  Compass
} from 'lucide-react';
import {
  calculateRootAffinity,
  getEffectiveExpMultiplier,
  calculateBreakthroughChance,
  canAttemptBreakthrough,
  performCultivationSession,
  performBreakthroughAttempt,
  formatGameTime
} from '../../engine/cultivationEngine';
import { checkArtCompatibility, getSpiritualRootConfig } from '../../data/spiritualRoots';

interface CultivationModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onStartTribulation?: (targetRealm: RealmInfo, selectedPill: Item | null) => void;
  onClose: () => void;
}

export const CultivationModal: React.FC<CultivationModalProps> = ({
  player,
  onUpdatePlayer,
  onStartTribulation,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'cultivate' | 'arts'>('cultivate');
  const [selectedPillId, setSelectedPillId] = useState<string | null>(null);
  const [meditationPillId, setMeditationPillId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const currentRealm = REALMS[player.realmIndex] || REALMS[0];
  const nextRealm = REALMS[player.realmIndex + 1];
  const currentArt = CULTIVATION_ARTS[player.currentArtId] || CULTIVATION_ARTS.truong_sinh_quyet;

  // Pills suitable for breakthrough
  const breakthroughPills = player.inventory.filter(slot =>
    slot.item.type === 'pill' && (slot.item.stats?.breakthroughBonus || slot.item.id.includes('dan'))
  );

  // Pills suitable for meditation sessions
  const meditationPills = player.inventory.filter(slot =>
    slot.item.type === 'pill' && slot.item.useEffect?.addExp
  );

  const { totalMultiplier, artMultiplier, affinityBonus, affinityPercent } = getEffectiveExpMultiplier(player);

  const selectedBreakthroughPill = selectedPillId
    ? player.inventory.find(s => s.item.id === selectedPillId)?.item || null
    : null;

  const chanceInfo = calculateBreakthroughChance(player, selectedBreakthroughPill);
  const conditionCheck = canAttemptBreakthrough(player);

  const expPercent = Math.min(100, Math.floor((player.exp / currentRealm.requiredExp) * 100));

  // Cultivation session triggers
  const handleMeditation = (type: 'tieu_chu_thien' | 'dai_chu_thien' | 'luyen_dan_tro_tu') => {
    soundManager.playCollect();
    const result = performCultivationSession(player, type, meditationPillId || undefined);

    if (result.success) {
      onUpdatePlayer(() => result.updatedPlayer);
      setActionFeedback({
        success: true,
        message: result.message,
      });
    } else {
      setActionFeedback({
        success: false,
        message: result.message,
      });
    }
  };

  // Breakthrough trigger
  const handleBreakthrough = () => {
    if (!nextRealm) return;

    // Check if this breakthrough requires facing Heavenly Tribulation & Inner Demon (Major breakthrough: Trúc Cơ, Kim Đan, etc.)
    const requiresTribulation =
      currentRealm.tribulationType !== undefined ||
      currentRealm.id === 'luyen_khi_13' ||
      currentRealm.stage === 'vien_man';

    if (requiresTribulation && onStartTribulation) {
      onStartTribulation(nextRealm, selectedBreakthroughPill);
      onClose();
      return;
    }

    const result = performBreakthroughAttempt(player, selectedPillId);

    if (result.success) {
      soundManager.playBreakthrough();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#eab308', '#38bdf8', '#a855f7', '#22c55e'],
        });
      } catch (e) {}
      onUpdatePlayer(() => result.updatedPlayer);
      setActionFeedback({
        success: true,
        message: result.message,
      });
      setSelectedPillId(null);
    } else {
      soundManager.playHit();
      onUpdatePlayer(() => result.updatedPlayer);
      setActionFeedback({
        success: false,
        message: result.message,
      });
    }
  };

  // Select active cultivation art
  const handleSelectArt = (artId: string) => {
    if (player.currentArtId === artId) return;
    const art = CULTIVATION_ARTS[artId];
    if (!art) return;

    // Check spiritual root compatibility
    const rootCheck = checkArtCompatibility(player.spiritualRoot, art.element);
    if (!rootCheck.compatible) {
      soundManager.playBacklash();
      setActionFeedback({
        success: false,
        message: rootCheck.reason,
      });
      return;
    }

    soundManager.playCollect();
    onUpdatePlayer(prev => ({
      ...prev,
      currentArtId: artId,
    }));
    setActionFeedback({
      success: true,
      message: `Đã đổi công pháp chủ tu sang [${art.name}]! Khí tức kinh mạch đã tương thích với thuộc tính ${art.element.toUpperCase()}.`,
    });
  };

  // Comprehend art
  const handleComprehendArt = () => {
    if (player.exp < 150) {
      setActionFeedback({
        success: false,
        message: 'Cần ít nhất 150 điểm Tu Vi để tĩnh tâm tham ngộ đạo tàng!',
      });
      return;
    }
    soundManager.playCollect();
    onUpdatePlayer(prev => ({
      ...prev,
      exp: prev.exp - 150,
      comprehension: prev.comprehension + 2,
      consciousness: prev.consciousness + 1,
    }));
    setActionFeedback({
      success: true,
      message: 'Tĩnh tâm tham ngộ cổ thiên thành công! Ngộ Tính tăng +2, Thần Thức tăng +1, tiêu hao 150 Tu Vi.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border-2 border-amber-600/70 rounded-xl shadow-2xl text-stone-100 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Ancient Header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 p-4 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-amber-500/60 bg-amber-950/40 flex items-center justify-center text-xl shadow">
              🧘‍♂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-amber-300 font-title tracking-wide">
                  Động Phủ Tu Luyện · Con Đường Đạo Quả
                </h2>
                <span className="text-[10px] bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded border border-amber-700/60 font-semibold">
                  Phím [K]
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatGameTime(player.gameTime)}</span>
                <span className="text-stone-600">|</span>
                <span>Số lần đả tọa: <strong className="text-amber-300">{player.cultivationCount || 0}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-stone-950 rounded-lg p-1 border border-stone-800 text-xs">
              <button
                onClick={() => setActiveTab('cultivate')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'cultivate'
                    ? 'bg-amber-600 text-stone-950 font-bold shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Vận Khí & Đột Phá
              </button>
              <button
                onClick={() => setActiveTab('arts')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'arts'
                    ? 'bg-amber-600 text-stone-950 font-bold shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Đạo Tàng Công Pháp ({player.learnedArtIds.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Realm & Progress Bar Strip */}
        <div className="bg-stone-950/90 border-b border-amber-900/40 p-3 px-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">Cảnh Giới Hiện Tại:</span>
              <span className="text-sm font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-600/50">
                {currentRealm.fullName}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                {currentRealm.stage === 'so_ky' && 'Giai đoạn Sơ Kỳ'}
                {currentRealm.stage === 'trung_ky' && 'Giai đoạn Trung Kỳ'}
                {currentRealm.stage === 'hau_ky' && 'Giai đoạn Hậu Kỳ'}
                {currentRealm.stage === 'vien_man' && 'Đại Viên Mãn (Chuẩn bị đột phá đại cảnh giới)'}
              </span>
            </div>

            {nextRealm ? (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-stone-400">Mục Tiêu Tấn Thăng:</span>
                <span className="text-cyan-300 font-bold flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  {nextRealm.fullName}
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-amber-400">Đã đạt đỉnh cao tu đạo hiện thời</span>
            )}
          </div>

          {/* Meridian Tu Vi Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-stone-300 font-medium">
              <span>Tu Vi Kinh Mạch: <strong className="text-amber-400">{player.exp}</strong> / {currentRealm.requiredExp}</span>
              <span className={player.exp >= currentRealm.requiredExp ? 'text-emerald-400 font-bold' : 'text-amber-400 font-semibold'}>
                {player.exp >= currentRealm.requiredExp ? 'Đã Viên Mãn (Có Thể Đột Phá)' : `Tiến Độ: ${expPercent}%`}
              </span>
            </div>
            <div className="relative w-full h-3 bg-stone-900 rounded-full overflow-hidden border border-amber-900/60">
              <div
                className={`h-full transition-all duration-300 ${
                  player.exp >= currentRealm.requiredExp
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-400 to-amber-300 animate-pulse'
                    : 'bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400'
                }`}
                style={{ width: `${Math.min(100, expPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
        {actionFeedback && (
          <div className={`p-2.5 px-4 text-xs leading-relaxed flex items-center justify-between border-b ${
            actionFeedback.success
              ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/70 border-rose-700/60 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {actionFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              <span className="whitespace-pre-line">{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-stone-400 hover:text-white text-xs px-2 py-0.5 rounded"
            >
              Đóng
            </button>
          </div>
        )}

        {/* TAB 1: VẬN KHÍ & ĐỘT PHÁ */}
        {activeTab === 'cultivate' && (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LEFT: CÔNG PHÁP CHỦ TU, LINH CĂN & CÁC BUỔI ĐẢ TỌA */}
            <div className="space-y-4">
              {/* Active Art Card */}
              <div className="bg-stone-950/70 border border-stone-800 rounded-lg p-3.5 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] text-stone-400">Công Pháp Đang Vận Hành:</span>
                    <h3 className="text-base font-bold text-amber-300 flex items-center gap-1.5">
                      {currentArt.name}
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-amber-950 border border-amber-700/60 text-amber-400">
                        {currentArt.grade} Phẩm
                      </span>
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-semibold uppercase">
                    Hệ: {currentArt.element}
                  </span>
                </div>

                <p className="text-xs text-stone-300 italic border-l-2 border-amber-600/70 pl-2 py-0.5">
                  "{currentArt.lore}"
                </p>

                {/* Absorption Rate Calculation */}
                <div className="bg-stone-900/80 p-2.5 rounded border border-stone-800 text-xs space-y-1">
                  <div className="flex justify-between text-stone-300">
                    <span>Tốc độ cơ bản công pháp:</span>
                    <strong className="text-amber-400">x{artMultiplier}</strong>
                  </div>
                  <div className="flex justify-between text-stone-300">
                    <span>Gia trì Linh căn ({currentArt.element.toUpperCase()} {affinityPercent}%):</span>
                    <strong className="text-cyan-400">+{Math.round(affinityBonus * 100)}%</strong>
                  </div>
                  <div className="border-t border-stone-800 pt-1 flex justify-between font-bold text-amber-300">
                    <span>Hệ số Hấp Thu Tu Vi Thực Tế:</span>
                    <span className="text-emerald-400">x{totalMultiplier}</span>
                  </div>
                </div>

                {/* Passive Buffs */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-1.5 rounded bg-stone-900/80 border border-stone-800 text-rose-300 flex justify-between">
                    <span>Tấn Công:</span>
                    <strong className="font-bold">+{Math.round(currentArt.statBonus.atkPercent * 100)}%</strong>
                  </div>
                  <div className="p-1.5 rounded bg-stone-900/80 border border-stone-800 text-blue-300 flex justify-between">
                    <span>Phòng Thủ:</span>
                    <strong className="font-bold">+{Math.round(currentArt.statBonus.defPercent * 100)}%</strong>
                  </div>
                  <div className="p-1.5 rounded bg-stone-900/80 border border-stone-800 text-emerald-300 flex justify-between">
                    <span>Khí Huyết:</span>
                    <strong className="font-bold">+{Math.round(currentArt.statBonus.hpPercent * 100)}%</strong>
                  </div>
                  <div className="p-1.5 rounded bg-stone-900/80 border border-stone-800 text-cyan-300 flex justify-between">
                    <span>Linh Lực:</span>
                    <strong className="font-bold">+{Math.round(currentArt.statBonus.mpPercent * 100)}%</strong>
                  </div>
                </div>
              </div>

              {/* Linh Căn Ngũ Hành Overview with Roguelite Talents & Passive */}
              {(() => {
                const root = player.spiritualRoot;
                const rootCfg = getSpiritualRootConfig(root);
                const rootName = root?.name || rootCfg.name;
                const rootPurity = root?.purity ?? 45;
                const elements = root?.elements || rootCfg.initialElements;

                const gradeBadge =
                  rootCfg.grade === 'hiem'
                    ? 'border-yellow-400 bg-yellow-950/70 text-yellow-300'
                    : rootCfg.grade === 'dac_biet'
                    ? 'border-purple-400 bg-purple-950/70 text-purple-300'
                    : 'border-amber-600 bg-amber-950/70 text-amber-300';

                const gradeLabel =
                  rootCfg.grade === 'hiem' ? 'Dị Thường Chí Tôn' : rootCfg.grade === 'dac_biet' ? 'Dị Biến Đặc Biệt' : 'Chính Thống Cơ Bản';

                return (
                  <div className="bg-stone-950/70 border border-stone-800 rounded-lg p-3 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{rootCfg.icon}</span>
                        <div>
                          <div className="font-bold text-amber-300 text-sm">{rootName}</div>
                          <div className="text-[10px] text-stone-400">{rootCfg.description}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase shrink-0 ${gradeBadge}`}>
                        {gradeLabel}
                      </span>
                    </div>

                    {/* Passive Effect */}
                    <div className="p-2 rounded bg-stone-900/90 border border-amber-900/40 text-[11px] space-y-0.5">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        Thiên Phú Bị Động: {rootCfg.passiveEffect.name}
                      </div>
                      <div className="text-stone-300 text-[10px] leading-relaxed">
                        {rootCfg.passiveEffect.description}
                      </div>
                    </div>

                    {/* Element percentages */}
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                      <div className={`p-1 rounded border ${currentArt.element === 'kim' ? 'border-yellow-400 bg-yellow-950/40 text-yellow-300 font-bold' : 'border-stone-800 bg-stone-900 text-stone-300'}`}>
                        <div>Kim</div>
                        <div>{elements.kim ?? 40}%</div>
                      </div>
                      <div className={`p-1 rounded border ${currentArt.element === 'moc' ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 font-bold' : 'border-stone-800 bg-stone-900 text-stone-300'}`}>
                        <div>Mộc</div>
                        <div>{elements.moc ?? 40}%</div>
                      </div>
                      <div className={`p-1 rounded border ${currentArt.element === 'thuy' ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 font-bold' : 'border-stone-800 bg-stone-900 text-stone-300'}`}>
                        <div>Thủy</div>
                        <div>{elements.thuy ?? 40}%</div>
                      </div>
                      <div className={`p-1 rounded border ${currentArt.element === 'hoa' ? 'border-rose-400 bg-rose-950/40 text-rose-300 font-bold' : 'border-stone-800 bg-stone-900 text-stone-300'}`}>
                        <div>Hỏa</div>
                        <div>{elements.hoa ?? 40}%</div>
                      </div>
                      <div className={`p-1 rounded border ${currentArt.element === 'tho' ? 'border-amber-400 bg-amber-950/40 text-amber-300 font-bold' : 'border-stone-800 bg-stone-900 text-stone-300'}`}>
                        <div>Thổ</div>
                        <div>{elements.tho ?? 40}%</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Cultivation Meditation Sessions (Đả Tọa Tu Luyện Thực Sự) */}
              <div className="bg-stone-950/70 border border-stone-800 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Đả Tọa Vận Khí Hấp Thu Linh Khí
                  </h4>
                  <span className="text-[10px] text-stone-400">Tiêu hao thời gian & tài nguyên</span>
                </div>

                <div className="space-y-2">
                  {/* Option 1: Tieu Chu Thien */}
                  <div className="p-2.5 rounded bg-stone-900 border border-stone-800 hover:border-amber-700/50 transition flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-amber-200">1. Vận Khí Tiểu Chu Thiên (2 Canh Giờ)</div>
                      <div className="text-[11px] text-stone-400">
                        Tiêu hao: <span className="text-amber-400">5 Linh Thạch</span> hoặc <span className="text-cyan-400">10 Linh Lực</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMeditation('tieu_chu_thien')}
                      className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition cursor-pointer shadow"
                    >
                      Đả Tọa
                    </button>
                  </div>

                  {/* Option 2: Dai Chu Thien */}
                  <div className="p-2.5 rounded bg-stone-900 border border-stone-800 hover:border-amber-700/50 transition flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-amber-200">2. Bố Trận Bế Quan Đại Chu Thiên (6 Canh Giờ)</div>
                      <div className="text-[11px] text-stone-400">
                        Tiêu hao: <span className="text-amber-400">25 Linh Thạch</span> · Hồi đầy Khí Huyết, +1 Ngộ Tính, +1 Thần Thức
                      </div>
                    </div>
                    <button
                      onClick={() => handleMeditation('dai_chu_thien')}
                      disabled={player.spiritStones < 25}
                      className={`px-3 py-1.5 rounded font-bold text-xs transition ${
                        player.spiritStones >= 25
                          ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 cursor-pointer shadow'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      Bế Quan
                    </button>
                  </div>

                  {/* Option 3: Luyen Hoa Dan Duoc */}
                  <div className="p-2.5 rounded bg-stone-900 border border-stone-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-200">3. Luyện Hóa Đan Dược Trợ Tu (4 Canh Giờ)</span>
                      <span className="text-[10px] text-stone-400">Đột biến lượng lớn Tu Vi</span>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={meditationPillId || ''}
                        onChange={e => setMeditationPillId(e.target.value || null)}
                        className="flex-1 bg-stone-950 border border-stone-700 rounded p-1.5 text-xs text-amber-200 focus:outline-none"
                      >
                        <option value="">-- Chọn Đan Dược Trong Túi --</option>
                        {meditationPills.map(s => (
                          <option key={s.item.id} value={s.item.id}>
                            {s.item.name} (Có: {s.count}) - +{s.item.useEffect?.addExp} Tu Vi
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleMeditation('luyen_dan_tro_tu')}
                        disabled={!meditationPillId}
                        className={`px-3 py-1.5 rounded font-bold text-xs transition ${
                          meditationPillId
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        Luyện Hóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: BREAKTHROUGH SYSTEM (ĐỘT PHÁ CẢNH GIỚI) */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="bg-stone-950/70 border border-stone-800 rounded-lg p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Xung Kích Đột Phá Cảnh Giới
                  </h3>
                  {nextRealm && (
                    <span className="text-xs text-cyan-400 font-semibold">
                      Tiến Vào: {nextRealm.fullName}
                    </span>
                  )}
                </div>

                {nextRealm ? (
                  <>
                    {/* Breakthrough Condition Checklist */}
                    <div className="space-y-2 bg-stone-900/80 p-3 rounded border border-stone-800 text-xs">
                      <div className="font-semibold text-stone-200 border-b border-stone-800 pb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        Điều Kiện Đột Phá:
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-300">1. Tu Vi Tích Lũy:</span>
                        <span className={player.exp >= currentRealm.requiredExp ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                          {player.exp} / {currentRealm.requiredExp} {player.exp >= currentRealm.requiredExp ? '✓ Đạt' : '✗ Chưa đủ'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-300">2. Trạng Thái Đạo Thể:</span>
                        <span className={!player.statusEffects.injured && !player.statusEffects.qiDeviation ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {player.statusEffects.injured
                            ? '✗ Bị Thương Thế'
                            : player.statusEffects.qiDeviation
                            ? '✗ Tẩu Hỏa Nhập Ma'
                            : '✓ Kinh Mạch Lành Lặn'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-300">3. Khí Huyết Tối Thiểu:</span>
                        <span className={player.hp >= player.maxHp * 0.4 ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                          {Math.floor(player.hp)} / {player.maxHp} ({Math.round((player.hp / player.maxHp) * 100)}%) {player.hp >= player.maxHp * 0.4 ? '✓' : '✗ Quá yếu'}
                        </span>
                      </div>

                      {/* Special Trúc Cơ Check */}
                      {conditionCheck.isTrucCoStep && (
                        <div className="flex items-center justify-between border-t border-stone-800 pt-1 text-amber-300 font-semibold">
                          <span>4. Trúc Cơ Đan (Bảo hộ đạo cơ):</span>
                          <span>
                            {player.inventory.some(s => s.item.id === 'truc_co_dan' && s.count > 0)
                              ? '✓ Có Trong Túi'
                              : '⚠️ Không Có (Cực Nguy Hiểm)'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Breakthrough Pill Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                        <span>Chọn Đan Dược Trợ Phá (Tăng Tỷ Lệ & Giảm Phản Phệ):</span>
                        {currentRealm.recommendedPillId && (
                          <span className="text-[10px] text-amber-400">
                            Khuyên dùng: {ITEMS[currentRealm.recommendedPillId]?.name || currentRealm.recommendedPillId}
                          </span>
                        )}
                      </label>
                      <select
                        value={selectedPillId || ''}
                        onChange={e => setSelectedPillId(e.target.value || null)}
                        className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- Không Dùng Đan Dược (Chỉ dựa vào căn cơ) --</option>
                        {breakthroughPills.map(s => (
                          <option key={s.item.id} value={s.item.id}>
                            {s.item.name} (Có: {s.count}) - +{s.item.stats?.breakthroughBonus || 20}% tỷ lệ thành công
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Chance Breakdown */}
                    <div className="bg-stone-900 p-2.5 rounded border border-stone-800 space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-300">
                        <span>Tỷ lệ cơ bản thiên đạo:</span>
                        <span>{Math.round(chanceInfo.baseChance * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-stone-300">
                        <span>Gia trì công pháp ({currentArt.name}):</span>
                        <span className="text-amber-400">+{Math.round(chanceInfo.artBonus * 100)}%</span>
                      </div>
                      {chanceInfo.pillBonus > 0 && (
                        <div className="flex justify-between text-stone-300">
                          <span>Đan dược trợ phá:</span>
                          <span className="text-emerald-400">+{Math.round(chanceInfo.pillBonus * 100)}%</span>
                        </div>
                      )}
                      <div className="border-t border-stone-800 pt-1.5 flex justify-between font-bold text-sm">
                        <span className="text-stone-200">TỔNG XÁC SUẤT ĐỘT PHÁ:</span>
                        <span className={chanceInfo.totalChance >= 0.7 ? 'text-emerald-400' : chanceInfo.totalChance >= 0.4 ? 'text-yellow-400' : 'text-rose-400'}>
                          {Math.round(chanceInfo.totalChance * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Backlash Tribulation Warning */}
                    <div className="p-2.5 bg-rose-950/40 border border-rose-900/60 rounded text-[11px] text-rose-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <strong>Thiên Kiếp Phản Phệ:</strong> Nếu thất bại sẽ tổn thất{' '}
                        <strong>{currentRealm.tribulationDamage || 40}</strong> Khí Huyết, mất một phần Tu Vi và kinh mạch vướng phải [Thương Thế]!
                      </div>
                    </div>

                    {/* Unlocked feature preview */}
                    {nextRealm.unlockedFeature && (
                      <div className="p-2 bg-cyan-950/30 border border-cyan-900/50 rounded text-[11px] text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Tấn thăng sẽ mở khóa: <strong>{nextRealm.unlockedFeature}</strong></span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center text-amber-300 text-sm">
                    Đạo hữu đã đạt đến giới hạn cao nhất hiện thời của Tiên Giới!
                  </div>
                )}
              </div>

              {/* Action Button */}
              {nextRealm && (
                <div className="space-y-2">
                  {!conditionCheck.canAttempt && (
                    <div className="text-[11px] text-rose-400 text-center font-medium bg-rose-950/40 p-2 rounded border border-rose-900/60">
                      {conditionCheck.reason}
                    </div>
                  )}

                  <button
                    onClick={handleBreakthrough}
                    disabled={!conditionCheck.canAttempt}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition shadow-xl ${
                      conditionCheck.canAttempt
                        ? currentRealm.tribulationType || currentRealm.stage === 'vien_man' || currentRealm.id === 'luyen_khi_13'
                          ? 'bg-gradient-to-r from-purple-600 via-amber-500 to-yellow-500 text-stone-950 hover:brightness-110 active:scale-98 cursor-pointer'
                          : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 text-stone-950 hover:brightness-110 active:scale-98 cursor-pointer'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                    }`}
                  >
                    {conditionCheck.canAttempt
                      ? currentRealm.tribulationType || currentRealm.stage === 'vien_man' || currentRealm.id === 'luyen_khi_13'
                        ? `⚡ NGHÊNH TIẾP THIÊN KIẾP & TÂM MA [${nextRealm.fullName}]`
                        : `⚡ XUNG KÍCH TIỂU BÌNH CẢNH [${nextRealm.fullName}] (${Math.round(chanceInfo.totalChance * 100)}%)`
                      : 'Chưa Đạt Điều Kiện Đột Phá'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ĐẠO TÀNG CÔNG PHÁP */}
        {activeTab === 'arts' && (
          <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* List of Cultivation Arts */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Đạo Tàng Lục Đại Công Pháp
              </h3>

              <div className="space-y-2">
                {Object.values(CULTIVATION_ARTS).map(art => {
                  const isLearned = player.learnedArtIds.includes(art.id);
                  const isActive = player.currentArtId === art.id;
                  const affinity = calculateRootAffinity(player.spiritualRoot, art.element);
                  const compat = checkArtCompatibility(player.spiritualRoot, art.element);

                  return (
                    <div
                      key={art.id}
                      onClick={() => isLearned && handleSelectArt(art.id)}
                      className={`p-3 rounded-lg border transition ${
                        !isLearned
                          ? 'opacity-60 border-stone-800 bg-stone-950/60 cursor-not-allowed'
                          : !compat.compatible
                          ? 'border-rose-900/50 bg-rose-950/20 hover:border-rose-700/60 cursor-pointer'
                          : isActive
                          ? 'border-amber-500 bg-amber-950/50 cursor-pointer shadow-lg ring-1 ring-amber-500/50'
                          : 'border-stone-800 bg-stone-900/80 hover:border-amber-700/60 cursor-pointer'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-amber-200 text-sm flex items-center gap-1.5">
                          {art.name}
                          {isActive && (
                            <span className="text-[10px] bg-amber-600 text-stone-950 px-1.5 py-0.2 rounded font-bold">
                              Chủ Tu
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            compat.compatible
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          }`}>
                            {compat.compatible ? 'Hợp Linh Căn' : 'Bất Tương Dung'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-amber-300 uppercase">
                            {art.grade} Cấp
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 uppercase font-semibold">
                            {art.element}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-400 line-clamp-2">
                        {art.description}
                      </p>

                      <div className="mt-2 flex justify-between text-[11px] text-stone-400 border-t border-stone-800/60 pt-1.5">
                        <span>Hấp thu tu vi: <strong className="text-amber-400">x{art.expMultiplier}</strong></span>
                        <span>Độ tương hợp: <strong className="text-cyan-400">{affinity}%</strong></span>
                        <span className={isLearned ? 'text-emerald-400 font-semibold' : 'text-stone-500'}>
                          {isLearned ? 'Đã Lĩnh Hội' : 'Chưa Lĩnh Hội'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Active Art Details & Comprehension Action */}
            <div className="space-y-4 bg-stone-950/70 border border-stone-800 p-4 rounded-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="border-b border-stone-800 pb-2">
                  <span className="text-xs text-stone-400">Công Pháp Đang Vận Hành:</span>
                  <h4 className="text-base font-bold text-amber-300">{currentArt.name}</h4>
                  <p className="text-xs text-stone-300 mt-1 italic leading-relaxed">
                    "{currentArt.lore}"
                  </p>
                </div>

                {/* Passive Buffs list */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-stone-300">Gia Tăng Thuộc Tính Chiến Đấu:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-stone-900 border border-stone-800 text-rose-300 flex justify-between">
                      <span>Tấn Công:</span>
                      <span className="font-bold">+{Math.round(currentArt.statBonus.atkPercent * 100)}%</span>
                    </div>
                    <div className="p-2 rounded bg-stone-900 border border-stone-800 text-blue-300 flex justify-between">
                      <span>Phòng Thủ:</span>
                      <span className="font-bold">+{Math.round(currentArt.statBonus.defPercent * 100)}%</span>
                    </div>
                    <div className="p-2 rounded bg-stone-900 border border-stone-800 text-emerald-300 flex justify-between">
                      <span>Khí Huyết:</span>
                      <span className="font-bold">+{Math.round(currentArt.statBonus.hpPercent * 100)}%</span>
                    </div>
                    <div className="p-2 rounded bg-stone-900 border border-stone-800 text-cyan-300 flex justify-between">
                      <span>Linh Lực:</span>
                      <span className="font-bold">+{Math.round(currentArt.statBonus.mpPercent * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Comprehend action */}
                <div className="p-3 bg-stone-900 rounded-lg border border-amber-900/40 text-xs space-y-2">
                  <div className="flex justify-between items-center text-amber-300 font-semibold">
                    <span>Tĩnh Tâm Đả Tọa Tham Ngộ Đạo Tàng</span>
                    <span>Ngộ Tính: {player.comprehension}</span>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Tiêu hao 150 Tu Vi để tĩnh tâm tham ngộ đạo tàng, tăng vĩnh viễn 2 điểm Ngộ Tính và 1 điểm Thần Thức.
                  </p>
                  <button
                    onClick={handleComprehendArt}
                    disabled={player.exp < 150}
                    className={`w-full py-2 rounded font-bold text-xs transition ${
                      player.exp >= 150
                        ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 cursor-pointer shadow'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    Tĩnh Tâm Tham Ngộ (150 Tu Vi)
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-stone-500 text-center bg-stone-900/50 p-2 rounded">
                💡 Muốn lĩnh hội công pháp mới, đạo hữu có thể tìm kiếm Bí Tịch qua nhiệm vụ, mua tại Vạn Bảo Các hoặc đánh bại ma tu, thám hiểm Cổ Di Tích Bí Cảnh!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
