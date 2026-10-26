import React, { useState } from 'react';
import { PlayerStats } from '../../types/game';
import { FACTIONS, FACTION_RELATIONS } from '../../data/factions';
import { STRONGHOLDS, TerritoryStronghold } from '../../data/territory';
import { WORLD_EVENTS, WorldEvent } from '../../data/worldEvents';
import { 
  SECT_WAR_STAGES, 
  claimTerritoryYields, 
  captureStronghold, 
  completeWorldEvent,
  ensureWarAndTerritoryState 
} from '../../engine/warEngine';
import { soundManager } from '../../engine/audio';
import { GAME_MAPS } from '../../data/maps';
import { 
  ShieldAlert, 
  Swords, 
  MapPin, 
  Globe, 
  Flame, 
  CheckCircle2, 
  Coins, 
  Clock, 
  TrendingUp, 
  Users, 
  X, 
  Award,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Navigation
} from 'lucide-react';

interface SectWarModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
}

export const SectWarModal: React.FC<SectWarModalProps> = ({
  player,
  onUpdatePlayer,
  onClose,
}) => {
  const p = ensureWarAndTerritoryState(player);
  const [activeTab, setActiveTab] = useState<'war' | 'territory' | 'events' | 'factions'>('war');
  const [selectedStronghold, setSelectedStronghold] = useState<TerritoryStronghold | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WorldEvent | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const warState = p.warState!;
  const currentStageInfo = SECT_WAR_STAGES[warState.stage] || SECT_WAR_STAGES.tension;

  const totalPoints = warState.thanhVanPoints + warState.hacPhongPoints || 1;
  const thanhVanRatio = Math.round((warState.thanhVanPoints / totalPoints) * 100);
  const hacPhongRatio = 100 - thanhVanRatio;

  // Travel to Stronghold, Event, or Faction headquarters
  const handleTravelTo = (mapId: string, x: number, y: number, name: string) => {
    soundManager.playDash();
    onUpdatePlayer(prev => ({
      ...prev,
      currentMapId: mapId,
      x,
      y,
      discoveredMaps: prev.discoveredMaps.includes(mapId)
        ? prev.discoveredMaps
        : [...prev.discoveredMaps, mapId],
    }));
    onClose();
  };

  // Claim Daily Yields
  const handleClaimYields = () => {
    soundManager.playCollect();
    const res = claimTerritoryYields(p);
    onUpdatePlayer(() => res.updatedPlayer);
    setActionFeedback(res.message);
  };

  // Change Player Stance
  const handleChangeStance = (stance: 'thanh_van' | 'hac_phong' | 'neutral' | 'mediator') => {
    soundManager.playDash();
    onUpdatePlayer(prev => {
      const ensured = ensureWarAndTerritoryState(prev);
      return {
        ...ensured,
        warState: {
          ...ensured.warState!,
          playerStance: stance,
        },
      };
    });
    const stanceNames = {
      thanh_van: 'Chính Đạo Thanh Vân Tông (Bảo Vệ Đạo Thống)',
      hac_phong: 'Tà Tu Hắc Phong Môn (Huyết Sát Đoạt Bảo)',
      neutral: 'Tự Do Trung Lập (Tán Tu Kiếm Lợi)',
      mediator: 'Hòa Giải & Cứu Trợ (Trọng Sinh Mạng)',
    };
    setActionFeedback(`Đã chuyển lập trường sang: [${stanceNames[stance]}]! Các môn phái sẽ thay đổi thái độ với đạo hữu.`);
  };

  // Capture Stronghold
  const handleCapture = (targetFactionId: string, strongholdOverride?: TerritoryStronghold) => {
    const sh = strongholdOverride || selectedStronghold;
    if (!sh) return;
    setSelectedStronghold(sh);
    soundManager.playSlash();
    const res = captureStronghold(p, sh.id, targetFactionId);
    onUpdatePlayer(() => res.updatedPlayer);
    setActionFeedback(res.message);
  };

  // Resolve Event
  const handleCompleteEvent = (eventId: string) => {
    soundManager.playQuestComplete();
    const res = completeWorldEvent(p, eventId);
    onUpdatePlayer(() => res.updatedPlayer);
    setActionFeedback(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3">
      <div className="relative w-full max-w-5xl bg-stone-950 border-2 border-amber-700/80 rounded-2xl shadow-2xl text-stone-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Ancient Banner Header */}
        <div className="flex justify-between items-center p-4 border-b border-amber-800/60 bg-gradient-to-r from-stone-950 via-red-950/40 to-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-900 to-amber-900 border border-amber-500/50 flex items-center justify-center text-2xl shadow-lg">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-amber-300 font-title tracking-wider">
                  Chiến Tranh Tông Môn & Sự Kiện Thế Giới
                </h3>
                <span className="text-[10px] bg-red-950/80 text-red-300 px-2 py-0.5 rounded border border-red-700/60 font-semibold uppercase">
                  Thời Khắc Biến Cục
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Linh mạch tranh phong · Chiếm cứ cứ điểm · Định đoạt vận mệnh Đông Hoang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab navigation */}
            <div className="flex bg-stone-900 rounded-xl p-1 border border-stone-800 text-xs">
              <button
                onClick={() => setActiveTab('war')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'war'
                    ? 'bg-red-700 text-stone-100 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                Chiến Sự
              </button>
              <button
                onClick={() => setActiveTab('territory')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'territory'
                    ? 'bg-amber-600 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Cứ Điểm ({STRONGHOLDS.length})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'events'
                    ? 'bg-purple-700 text-stone-100 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Sự Kiện Động ({(p.activeWorldEventIds || []).length})
              </button>
              <button
                onClick={() => setActiveTab('factions')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'factions'
                    ? 'bg-sky-700 text-stone-100 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Thế Lực
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-stone-900 transition"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionFeedback && (
          <div className="bg-amber-950/70 border-b border-amber-800/60 p-2.5 px-4 text-xs text-amber-200 flex items-center justify-between">
            <span className="font-medium whitespace-pre-line">{actionFeedback}</span>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-stone-400 hover:text-white text-xs px-2 py-0.5 rounded"
            >
              Đã hiểu
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* TAB 1: CHIẾN SỰ TÔNG MÔN */}
          {activeTab === 'war' && (
            <div className="space-y-5">
              {/* War Stage Card */}
              <div className="p-4 rounded-xl bg-stone-900/90 border border-red-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                    {currentStageInfo.title}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Cảnh giới khuyến nghị: <strong className="text-amber-300">{currentStageInfo.recommendedRealm}</strong>
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed italic">
                  "{currentStageInfo.description}"
                </p>

                {/* War Progress Power Balance Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-sky-400 flex items-center gap-1">
                      🏔️ Thanh Vân Tông ({thanhVanRatio}%)
                    </span>
                    <span className="text-stone-400 text-[11px]">
                      Thế Trận Cân Bằng ({warState.battleVictories} Trận Thắng)
                    </span>
                    <span className="text-red-400 flex items-center gap-1">
                      Hắc Phong Môn ({hacPhongRatio}%) 🩸
                    </span>
                  </div>
                  <div className="w-full h-4 rounded-full bg-stone-950 border border-stone-800 overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-sky-600 to-cyan-500 transition-all duration-500"
                      style={{ width: `${thanhVanRatio}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-rose-700 transition-all duration-500"
                      style={{ width: `${hacPhongRatio}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Player Stance Selection (Lựa Chọn Lập Trường) */}
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Lựa Chọn Lập Trường Của Đạo Hữu
                </h4>
                <p className="text-[11px] text-stone-400">
                  Lập trường quyết định hướng hỗ trợ, phần thưởng nhiệm vụ và khả năng tiếp cận các cứ điểm.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
                  <button
                    onClick={() => handleChangeStance('thanh_van')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition cursor-pointer ${
                      warState.playerStance === 'thanh_van'
                        ? 'bg-sky-950/60 border-sky-500 text-sky-200 shadow-md'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-sky-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 text-sky-400">
                      🏔️ Hộ Đạo Thanh Vân
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Bảo vệ chính đạo, trảm ma, nhận bổng lộc Chân Truyền và kiếm quyết thượng thừa.
                    </div>
                  </button>

                  <button
                    onClick={() => handleChangeStance('hac_phong')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition cursor-pointer ${
                      warState.playerStance === 'hac_phong'
                        ? 'bg-red-950/60 border-red-500 text-red-200 shadow-md'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-red-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 text-red-400">
                      🩸 Gia Nhập Ma Đạo
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Huyết sát đoạt bảo, cướp mỏ quặng, nhận Ma Khí và đan dược tăng tu vi cực nhanh.
                    </div>
                  </button>

                  <button
                    onClick={() => handleChangeStance('neutral')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition cursor-pointer ${
                      warState.playerStance === 'neutral'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-md'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-amber-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 text-amber-400">
                      🏕️ Tán Tu Trung Lập
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Không theo phe nào, tự do giao dịch hai bên, thu thập cơ duyên nơi loạn lạc.
                    </div>
                  </button>

                  <button
                    onClick={() => handleChangeStance('mediator')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition cursor-pointer ${
                      warState.playerStance === 'mediator'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-md'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-emerald-700'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 text-emerald-400">
                      🕊️ Hòa Giải & Cứu Trợ
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Cùng Bách Thảo Cốc cứu chữa thương binh hai phái, tăng mạnh Đạo Tâm thiện hạnh.
                    </div>
                  </button>
                </div>
              </div>

              {/* Harvest Daily Yields Button */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/40 border border-amber-800/60">
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-200 text-xs flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    Thu Hoạch Bổng Lộc & Tài Nguyên Cứ Điểm Hàng Ngày
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Cứ điểm do phe đạo hữu kiểm soát sẽ sản sinh Linh Thạch, Điểm Cống Hiến và Dược Liệu mỗi ngày.
                  </div>
                </div>
                <button
                  onClick={handleClaimYields}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 active:scale-98 text-stone-950 font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Thu Hoạch Ngay
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CỨ ĐIỂM TRANH ĐOẠT TÀI NGUYÊN */}
          {activeTab === 'territory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STRONGHOLDS.map(stronghold => {
                const currentOwnerId = p.territoryControl?.[stronghold.id] || stronghold.defaultOwner;
                const ownerFaction = FACTIONS[currentOwnerId] || { name: 'Vô Chủ / Trung Lập', color: '#94a3b8', icon: '🏳️' };

                return (
                  <div
                    key={stronghold.id}
                    className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-3 shadow-md hover:border-amber-700/60 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-amber-200 text-sm flex items-center gap-1.5">
                          <span>{stronghold.name}</span>
                        </div>
                        <span className="text-[10px] text-stone-400">
                          Loại hình: {stronghold.type === 'spirit_mine' ? 'Mỏ Linh Thạch' : stronghold.type === 'herb_field' ? 'Linh Điền Dược Thảo' : stronghold.type === 'ancient_abode' ? 'Cổ Tu Động Phủ' : 'Cửa Khẩu Tiêu Cục'}
                        </span>
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1"
                        style={{
                          backgroundColor: `${ownerFaction.color}25`,
                          borderColor: ownerFaction.color,
                          color: ownerFaction.color,
                        }}
                      >
                        <span>{ownerFaction.icon}</span>
                        <span>{ownerFaction.name}</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed italic bg-stone-950/60 p-2.5 rounded-lg border border-stone-800">
                      "{stronghold.description}"
                    </p>

                    <div className="text-[11px] text-amber-300 font-semibold bg-amber-950/30 p-2 rounded border border-amber-900/40">
                      ⚡ Giá trị chiến lược: {stronghold.strategicValue}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800">
                      <span className="text-stone-400">
                        Thủ lĩnh trấn thủ: <strong className="text-stone-200">{stronghold.garrison.commanderName}</strong> ({stronghold.garrison.realmText})
                      </span>
                    </div>

                    {/* Action buttons to contest stronghold */}
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => handleTravelTo(stronghold.mapId, stronghold.x, stronghold.y, stronghold.name)}
                        className="w-full py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm hover:border-amber-600/60"
                      >
                        <Navigation className="w-3.5 h-3.5 text-amber-400" />
                        Hành Quân Đến Cứ Điểm ({GAME_MAPS[stronghold.mapId]?.name || stronghold.mapId})
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCapture('thanh_van_tong', stronghold)}
                          disabled={currentOwnerId === 'thanh_van_tong'}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentOwnerId === 'thanh_van_tong'
                              ? 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                              : 'bg-sky-700 hover:bg-sky-600 text-white shadow'
                          }`}
                        >
                          Chiếm Cho Thanh Vân
                        </button>

                        <button
                          onClick={() => handleCapture('hac_phong_mon', stronghold)}
                          disabled={currentOwnerId === 'hac_phong_mon'}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentOwnerId === 'hac_phong_mon'
                              ? 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white shadow'
                          }`}
                        >
                          Chiếm Cho Hắc Phong
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: SỰ KIỆN THẾ GIỚI ĐỘNG */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-xl text-xs text-purple-200">
                🌐 Các sự kiện thế giới diễn ra theo dòng thời gian và điều kiện nội bộ. Khi hoàn thành, thế giới sẽ biến chuyển, danh tiếng và phần thưởng sẽ cập nhật trực tiếp vào nhân vật.
              </div>

              <div className="space-y-3">
                {WORLD_EVENTS.map(event => {
                  const isCompleted = p.completedEventIds?.includes(event.id);
                  const isActive = p.activeWorldEventIds?.includes(event.id) || !isCompleted;

                  return (
                    <div
                      key={event.id}
                      className={`p-4 rounded-xl border transition ${
                        isCompleted
                          ? 'bg-stone-900/40 border-stone-800 opacity-60'
                          : 'bg-stone-900/90 border-purple-900/60 shadow-lg'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-amber-200 font-title">{event.title}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isCompleted ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-purple-950 text-purple-300 border border-purple-700'}`}>
                              {isCompleted ? 'Đã Giải Quyết' : 'Đang Diễn Ra'}
                            </span>
                          </div>
                          <span className="text-[11px] text-purple-400 font-semibold">{event.subtitle}</span>
                        </div>

                        <div className="text-right text-[11px] text-stone-400">
                          Thời hạn: <strong className="text-amber-300">{event.timeLimitHours} Canh Giờ</strong>
                        </div>
                      </div>

                      <p className="text-xs text-stone-300 leading-relaxed italic mt-2">
                        "{event.description}"
                      </p>

                      <div className="bg-stone-950/80 p-2.5 rounded-lg border border-stone-800 mt-2 space-y-1 text-xs">
                        <div className="text-amber-300 font-semibold">🎯 Mục tiêu: {event.targetObjective}</div>
                        <div className="text-emerald-400 text-[11px]">
                          🎁 Thưởng: +{event.rewards.exp} Tu Vi, +{event.rewards.spiritStones} Linh Thạch{event.rewards.items ? `, ${event.rewards.items.map(i => `${i.name} x${i.count}`).join(', ')}` : ''}
                        </div>
                        <div className="text-stone-400 text-[11px] italic">
                          ⚖️ Hậu quả: {event.consequencesText}
                        </div>
                      </div>

                      <div className="pt-3 flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => handleTravelTo(event.mapId, event.x, event.y, event.title)}
                          className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-purple-300 border border-stone-700 font-bold text-xs shadow transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5 text-purple-400" />
                          Đến Vị Trí Sự Kiện ({GAME_MAPS[event.mapId]?.name || event.mapId})
                        </button>

                        {!isCompleted && (
                          <button
                            onClick={() => handleCompleteEvent(event.id)}
                            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 active:scale-98 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Tiến Hành Can Thiệp & Hoàn Thành Sự Kiện
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: DANH SÁCH THẾ LỰC & NGOẠI GIAO */}
          {activeTab === 'factions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(FACTIONS).map(faction => {
                  const rep = p.factionReputation?.[faction.id] || 0;
                  const repRank = rep >= 300 ? 'Sùng Bái' : rep >= 100 ? 'Tôn Kính' : rep >= 30 ? 'Thân Thiện' : rep >= -30 ? 'Trung Lập' : rep >= -100 ? 'Cảnh Giác' : 'Tử Thù';
                  const relations = FACTION_RELATIONS[faction.id] || {};

                  // Teleport targets for each faction
                  const factionCoords: Record<string, { mapId: string; x: number; y: number; npcName: string }> = {
                    thanh_van_tong: { mapId: 'map_thanh_van_tong', x: 480, y: 650, npcName: 'Khương Chân Nhân (Sơn Môn)' },
                    hac_phong_mon: { mapId: 'map_hac_phong_son', x: 260, y: 380, npcName: 'Ma Lệ (Tiền Đồn Huyết Đao)' },
                    bach_thao_coc: { mapId: 'map_linh_vu', x: 1080, y: 280, npcName: 'Tố Vấn Tiên Cô (Linh Điền)' },
                    tan_tu_lien_minh: { mapId: 'map_phuong_thi', x: 1050, y: 490, npcName: 'Bách Hiểu Sinh (Phường Thị)' },
                    van_bao_thuong_hoi: { mapId: 'map_phuong_thi', x: 480, y: 320, npcName: 'Thẩm Vạn Kim (Vạn Bảo Các)' },
                    co_ngoc_bi_an: { mapId: 'map_ancient_ruins', x: 750, y: 420, npcName: 'Cổ Thần Tàn Niệm (Di Tích)' },
                  };

                  const targetLoc = factionCoords[faction.id];

                  return (
                    <div
                      key={faction.id}
                      className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-3 shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{faction.icon}</span>
                          <div>
                            <h4 className="font-bold text-amber-200 text-sm">{faction.name}</h4>
                            <span className="text-[10px] text-stone-400">{faction.title}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-xs font-bold ${rep >= 30 ? 'text-emerald-400' : rep >= -30 ? 'text-amber-300' : 'text-red-400'}`}>
                            {repRank} ({rep})
                          </div>
                          <span className="text-[10px] text-stone-500">Quan hệ với Lâm Mặc</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-300 leading-relaxed italic bg-stone-950/60 p-2.5 rounded-lg border border-stone-800">
                        "{faction.description}"
                      </p>

                      {/* Diplomacy Relations with other sects */}
                      {Object.keys(relations).length > 0 && (
                        <div className="space-y-1 bg-stone-950/40 p-2 rounded-lg border border-stone-800/80 text-[11px]">
                          <span className="text-stone-400 font-semibold block text-[10px] uppercase">Ngoại giao môn phái:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(relations).map(([targetId, rel]) => {
                              const targetFaction = FACTIONS[targetId];
                              const statusColor =
                                rel.status === 'war' ? 'bg-red-950 text-red-400 border-red-800' :
                                rel.status === 'ally' ? 'bg-sky-950 text-sky-400 border-sky-800' :
                                rel.status === 'friendly' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                                rel.status === 'tension' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                                'bg-stone-900 text-stone-400 border-stone-700';

                              const statusLabel =
                                rel.status === 'war' ? 'Chiến Tranh ⚔️' :
                                rel.status === 'ally' ? 'Đồng Minh 🛡️' :
                                rel.status === 'friendly' ? 'Hòa Hảo 🤝' :
                                rel.status === 'tension' ? 'Căng Thẳng ⚠️' : 'Trung Lập 🏳️';

                              return (
                                <span
                                  key={targetId}
                                  className={`px-2 py-0.5 rounded border text-[10px] font-medium ${statusColor}`}
                                  title={rel.description}
                                >
                                  {targetFaction?.name || targetId}: {statusLabel}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-stone-400 flex items-center justify-between border-t border-stone-800 pt-2">
                        <span>Chưởng quản: <strong className="text-stone-200">{faction.leader}</strong></span>
                        <span className="text-stone-500 font-mono">Tổng đàn: {GAME_MAPS[faction.baseMapId]?.name || faction.baseMapId}</span>
                      </div>

                      {targetLoc && (
                        <div className="pt-1">
                          <button
                            onClick={() => handleTravelTo(targetLoc.mapId, targetLoc.x, targetLoc.y, faction.name)}
                            className="w-full py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-sky-300 border border-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm hover:border-sky-600/60"
                          >
                            <Navigation className="w-3.5 h-3.5 text-sky-400" />
                            Gặp NPC Đại Diện: {targetLoc.npcName}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
