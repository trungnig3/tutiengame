import React, { useState, useMemo } from 'react';
import { PlayerStats } from '../../types/game';
import { 
  AchievementCategory, 
  AchievementRarity, 
  AchievementDefinition,
  TitleDefinition 
} from '../../types/achievements';
import { ACHIEVEMENTS } from '../../data/achievements';
import { TITLES } from '../../data/titles';
import { 
  BOSS_COLLECTION, 
  CLUES_COLLECTION, 
  ENDINGS_COLLECTION 
} from '../../data/collection';
import { CULTIVATION_ARTS } from '../../data/arts';
import { ALCHEMY_RECIPES, FORGING_RECIPES } from '../../data/recipes';
import { GAME_MAPS } from '../../data/maps';
import { ITEMS } from '../../data/items';
import { 
  claimAchievementReward, 
  equipTitle 
} from '../../engine/achievementEngine';
import { soundManager } from '../../engine/audio';
import confetti from 'canvas-confetti';
import { 
  X, 
  Trophy, 
  Crown, 
  BookMarked, 
  Search, 
  Filter, 
  CheckCircle2, 
  Lock, 
  Gift, 
  Sparkles, 
  Flame, 
  Shield, 
  Zap, 
  Swords, 
  Compass, 
  Scroll, 
  Hammer, 
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface AchievementsModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
  defaultTab?: 'achievements' | 'titles' | 'collection';
}

const CATEGORY_NAMES: Record<AchievementCategory, { name: string; icon: any }> = {
  cultivation: { name: 'Tu Luyện', icon: Sparkles },
  combat: { name: 'Chiến Đấu', icon: Swords },
  exploration: { name: 'Khám Phá', icon: Compass },
  quests: { name: 'Cốt Truyện', icon: Scroll },
  sect: { name: 'Tông Môn', icon: Shield },
  crafting: { name: 'Nghề Nghiệp', icon: Hammer },
};

const RARITY_COLORS: Record<AchievementRarity, { label: string; text: string; border: string; bg: string }> = {
  pham: { label: 'Phàm Phẩm', text: 'text-stone-300', border: 'border-stone-600', bg: 'bg-stone-800/80' },
  hiem: { label: 'Hiếm', text: 'text-sky-300', border: 'border-sky-500/70', bg: 'bg-sky-950/60' },
  su_thi: { label: 'Sử Thi', text: 'text-purple-300', border: 'border-purple-500/70', bg: 'bg-purple-950/60' },
  truyen_thuyet: { label: 'Truyền Thuyết', text: 'text-amber-300', border: 'border-amber-400', bg: 'bg-amber-950/60' },
  bi_an: { label: 'Bí Ẩn', text: 'text-rose-400', border: 'border-rose-500', bg: 'bg-rose-950/60' },
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  player,
  onUpdatePlayer,
  onClose,
  defaultTab = 'achievements',
}) => {
  const [mainTab, setMainTab] = useState<'achievements' | 'titles' | 'collection'>(defaultTab);
  
  // Achievements filters
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked' | 'claimable'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collection subtab
  const [collectionSubTab, setCollectionSubTab] = useState<'bosses' | 'maps' | 'arts' | 'clues' | 'endings'>('bosses');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const allAchievementsList = useMemo(() => Object.values(ACHIEVEMENTS), []);

  // Calculate statistics
  const stats = useMemo(() => {
    let unlocked = 0;
    let claimed = 0;
    let claimable = 0;
    allAchievementsList.forEach(ach => {
      const state = player.achievements?.[ach.id];
      if (state?.unlocked) {
        unlocked++;
        if (state.claimed) claimed++;
        else claimable++;
      }
    });
    const percent = Math.round((unlocked / allAchievementsList.length) * 100);
    return { unlocked, total: allAchievementsList.length, claimed, claimable, percent };
  }, [allAchievementsList, player.achievements]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return allAchievementsList.filter(ach => {
      const state = player.achievements?.[ach.id];
      const isUnlocked = !!state?.unlocked;
      const isClaimed = !!state?.claimed;

      // Category filter
      if (selectedCategory !== 'all' && ach.category !== selectedCategory) return false;

      // Rarity filter
      if (selectedRarity !== 'all' && ach.rarity !== selectedRarity) return false;

      // Status filter
      if (statusFilter === 'unlocked' && !isUnlocked) return false;
      if (statusFilter === 'locked' && isUnlocked) return false;
      if (statusFilter === 'claimable' && (!isUnlocked || isClaimed)) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = ach.name.toLowerCase().includes(query);
        const matchDesc = ach.description.toLowerCase().includes(query);
        const matchCondition = ach.conditionDescription.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCondition) return false;
      }

      return true;
    });
  }, [allAchievementsList, player.achievements, selectedCategory, selectedRarity, statusFilter, searchQuery]);

  const handleClaim = (achId: string) => {
    const res = claimAchievementReward(player, achId);
    if (res.success) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#fbbf24', '#38bdf8', '#a855f7'],
        });
      } catch (e) {}
      onUpdatePlayer(() => res.updatedPlayer);
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handleEquipTitle = (titleId: string | null) => {
    const updated = equipTitle(player, titleId);
    onUpdatePlayer(() => updated);
    if (titleId) {
      const name = TITLES[titleId]?.name || titleId;
      showToast(`Đã trang bị danh hiệu: [${name}]!`);
    } else {
      showToast('Đã gỡ bỏ danh hiệu trang bị.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 select-none">
      <div className="relative w-full max-w-5xl h-[92vh] bg-stone-900 border-2 border-amber-600/70 rounded-2xl shadow-2xl flex flex-col text-stone-100 overflow-hidden">
        {/* Ancient ornament header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-amber-800/60 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-xl shadow-inner">
              🏆
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-300 font-title tracking-wide flex items-center gap-2">
                Thiên Đạo Thành Tựu & Hồ Sơ Hành Trình
              </h2>
              <p className="text-xs text-stone-400">
                Ghi nhận công tích tu tiên, danh hiệu hiển hách và biên niên sử nghịch mệnh
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Global Progress Bar Header */}
        <div className="bg-stone-950/80 px-6 py-3 border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-[280px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-stone-400 font-medium">Tổng Tiến Độ Tu Tiên:</span>
              <span className="text-sm font-bold text-amber-300 font-mono">
                {stats.unlocked} / {stats.total} Thành Tựu ({stats.percent}%)
              </span>
            </div>
            <div className="flex-1 max-w-md h-3.5 bg-stone-900 rounded-full overflow-hidden border border-amber-800/40 p-0.5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-2 text-xs">
            {stats.claimable > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 font-bold animate-pulse flex items-center gap-1.5 shadow-sm">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                {stats.claimable} Có Thể Nhận Thưởng
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-stone-900 text-stone-300 border border-stone-700/60 font-medium">
              Đã Nhận: {stats.claimed}
            </span>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-900/90 px-6 gap-2 pt-2">
          <button
            onClick={() => { soundManager.playCollect(); setMainTab('achievements'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-bold text-sm transition-all border-t border-x ${
              mainTab === 'achievements'
                ? 'bg-stone-900 text-amber-300 border-amber-600/70 shadow-sm'
                : 'bg-transparent text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Bảng Thành Tựu
            {stats.claimable > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => { soundManager.playCollect(); setMainTab('titles'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-bold text-sm transition-all border-t border-x ${
              mainTab === 'titles'
                ? 'bg-stone-900 text-amber-300 border-amber-600/70 shadow-sm'
                : 'bg-transparent text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Crown className="w-4 h-4 text-yellow-400" />
            Danh Hiệu ({player.unlockedTitleIds?.length || 1})
          </button>

          <button
            onClick={() => { soundManager.playCollect(); setMainTab('collection'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-bold text-sm transition-all border-t border-x ${
              mainTab === 'collection'
                ? 'bg-stone-900 text-amber-300 border-amber-600/70 shadow-sm'
                : 'bg-transparent text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <BookMarked className="w-4 h-4 text-purple-400" />
            Hồ Sơ & Bộ Sưu Tập
          </button>
        </div>

        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="absolute top-20 right-6 z-50 bg-amber-950/95 border-2 border-amber-500 text-amber-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TAB 1: ACHIEVEMENTS LIST */}
        {mainTab === 'achievements' && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950/60 p-3 rounded-xl border border-stone-800">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedCategory === 'all'
                      ? 'bg-amber-600 text-stone-950 shadow'
                      : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  Tất Cả ({allAchievementsList.length})
                </button>
                {(Object.keys(CATEGORY_NAMES) as AchievementCategory[]).map(cat => {
                  const info = CATEGORY_NAMES[cat];
                  const Icon = info.icon;
                  const count = allAchievementsList.filter(a => a.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        selectedCategory === cat
                          ? 'bg-amber-600 text-stone-950 shadow'
                          : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {info.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search Box & Status Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên thành tựu..."
                    className="pl-8 pr-3 py-1 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500 w-44"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-stone-400 hover:text-stone-200 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status selector */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-300 py-1 px-2.5 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="all">Trạng Thái: Tất Cả</option>
                  <option value="claimable">⭐ Có Thể Nhận Thưởng</option>
                  <option value="unlocked">✓ Đã Mở Khóa</option>
                  <option value="locked">🔒 Chưa Đạt</option>
                </select>

                {/* Rarity selector */}
                <select
                  value={selectedRarity}
                  onChange={e => setSelectedRarity(e.target.value as any)}
                  className="bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-300 py-1 px-2.5 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="all">Độ Hiếm: Tất Cả</option>
                  <option value="pham">Phàm Phẩm</option>
                  <option value="hiem">Hiếm</option>
                  <option value="su_thi">Sử Thi</option>
                  <option value="truyen_thuyet">Truyền Thuyết</option>
                  <option value="bi_an">Bí Ẩn</option>
                </select>
              </div>
            </div>

            {/* Achievements Grid / List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {filteredAchievements.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-stone-500 gap-2">
                  <Trophy className="w-12 h-12 stroke-[1.2]" />
                  <p className="text-sm">Không tìm thấy thành tựu phù hợp bộ lọc.</p>
                </div>
              ) : (
                filteredAchievements.map(ach => {
                  const state = player.achievements?.[ach.id];
                  const isUnlocked = !!state?.unlocked;
                  const isClaimed = !!state?.claimed;
                  const progress = state?.progress || 0;
                  const maxProg = ach.maxProgress;
                  const progPercent = Math.min(100, Math.round((progress / maxProg) * 100));

                  const rarityInfo = RARITY_COLORS[ach.rarity] || RARITY_COLORS.pham;
                  const isSecretAndLocked = ach.isSecret && !isUnlocked;

                  return (
                    <div
                      key={ach.id}
                      className={`relative flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                        isUnlocked
                          ? isClaimed
                            ? 'bg-stone-950/50 border-stone-800 opacity-80'
                            : 'bg-stone-950/90 border-amber-500/70 shadow-lg shadow-amber-950/20'
                          : 'bg-stone-950/40 border-stone-800/80 opacity-70'
                      }`}
                    >
                      {/* Left: Icon & Details */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Icon Box */}
                        <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl shadow-inner flex-shrink-0 ${
                          isUnlocked 
                            ? 'bg-amber-950/40 border-amber-500 text-amber-200' 
                            : 'bg-stone-900 border-stone-700 text-stone-500'
                        }`}>
                          {isSecretAndLocked ? '❓' : ach.icon}
                        </div>

                        {/* Title & Description */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`font-bold text-sm tracking-wide ${
                              isUnlocked ? 'text-amber-200' : 'text-stone-300'
                            }`}>
                              {isSecretAndLocked ? 'Thành Tựu Ẩn' : ach.name}
                            </h4>

                            {/* Rarity Tag */}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${rarityInfo.text} ${rarityInfo.border} ${rarityInfo.bg}`}>
                              {rarityInfo.label}
                            </span>

                            {/* Category Tag */}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-400">
                              {CATEGORY_NAMES[ach.category].name}
                            </span>

                            {isUnlocked && state?.unlockedAt && (
                              <span className="text-[10px] text-stone-500 ml-auto font-mono">
                                Đạt ngày: {state.unlockedAt}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-stone-400 leading-relaxed">
                            {isSecretAndLocked 
                              ? (ach.hintIfSecret || 'Thành tựu ẩn danh, hãy phiêu bạt giang hồ để tự mình khám phá.') 
                              : ach.description}
                          </p>

                          {/* Condition & Progress Bar */}
                          {!isSecretAndLocked && (
                            <div className="flex items-center gap-3 pt-1">
                              <span className="text-[11px] text-stone-400 italic">
                                Điều kiện: {ach.conditionDescription}
                              </span>
                              {maxProg > 1 && (
                                <div className="flex items-center gap-2 ml-auto w-36">
                                  <div className="flex-1 h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                                    <div
                                      className="h-full bg-amber-500 rounded-full transition-all"
                                      style={{ width: `${progPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-amber-400">
                                    {progress}/{maxProg}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Rewards Preview */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            <span className="text-stone-400 font-semibold">Phần thưởng:</span>
                            {ach.reward.spiritStones && (
                              <span className="text-amber-300 font-mono bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                                +{ach.reward.spiritStones} Linh thạch
                              </span>
                            )}
                            {ach.reward.exp && (
                              <span className="text-sky-300 font-mono bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded">
                                +{ach.reward.exp} Tu vi
                              </span>
                            )}
                            {ach.reward.titleId && (
                              <span className="text-yellow-400 font-semibold bg-yellow-950/60 border border-yellow-700/60 px-2 py-0.5 rounded flex items-center gap-1">
                                👑 Danh hiệu: {TITLES[ach.reward.titleId]?.name || ach.reward.titleId}
                              </span>
                            )}
                            {ach.reward.items?.map(it => {
                              const itDef = ITEMS[it.itemId];
                              return (
                                <span key={it.itemId} className="text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                                  {itDef?.name || it.itemId} x{it.count}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Action / Status Button */}
                      <div className="flex-shrink-0 flex items-center justify-center pl-2">
                        {isUnlocked ? (
                          isClaimed ? (
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Đã Nhận
                            </div>
                          ) : (
                            <button
                              onClick={() => handleClaim(ach.id)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-bold text-xs hover:from-amber-400 hover:to-yellow-400 shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                            >
                              <Gift className="w-4 h-4" />
                              Nhận Thưởng
                            </button>
                          )
                        ) : (
                          <div className="flex items-center gap-1 text-stone-500 text-xs px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800">
                            <Lock className="w-3.5 h-3.5 text-stone-500" />
                            Chưa Mở Khóa
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TITLES MANAGEMENT */}
        {mainTab === 'titles' && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
            {/* Equipped Title Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 via-stone-900 to-stone-950 border-2 border-amber-500/60 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-stone-950 flex items-center justify-center text-2xl shadow">
                  👑
                </div>
                <div>
                  <div className="text-xs text-amber-400 uppercase tracking-widest font-semibold">Danh Hiệu Đang Trang Bị</div>
                  <div className="text-lg font-bold text-amber-200">
                    {TITLES[player.equippedTitleId || 'title_thon_gian']?.name || player.title}
                  </div>
                  <div className="text-xs text-stone-400">
                    {TITLES[player.equippedTitleId || 'title_thon_gian']?.description}
                  </div>
                </div>
              </div>

              {player.equippedTitleId && player.equippedTitleId !== 'title_thon_gian' && (
                <button
                  onClick={() => handleEquipTitle(null)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-600 transition"
                >
                  Gỡ Bỏ Danh Hiệu
                </button>
              )}
            </div>

            {/* List of Titles */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              <h3 className="text-sm font-bold text-stone-300 flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                Kho Danh Hiệu Tu Chân Giới ({Object.keys(TITLES).length} Danh Hiệu)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {Object.values(TITLES).map(titleDef => {
                  const isUnlocked = (player.unlockedTitleIds || ['title_thon_gian']).includes(titleDef.id);
                  const isEquipped = (player.equippedTitleId || 'title_thon_gian') === titleDef.id;
                  const statsBonus = titleDef.statsBonus || {};

                  return (
                    <div
                      key={titleDef.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition ${
                        isEquipped
                          ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/20'
                          : isUnlocked
                          ? 'bg-stone-950/70 border-stone-700/80 hover:border-amber-600/50'
                          : 'bg-stone-950/30 border-stone-800/60 opacity-60'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-base font-bold tracking-wide"
                            style={{ color: titleDef.color }}
                          >
                            {titleDef.name}
                          </span>

                          {isEquipped ? (
                            <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full shadow">
                              Đang Trang Bị
                            </span>
                          ) : isUnlocked ? (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold px-2 py-0.5 rounded-full">
                              Đã Sở Hữu
                            </span>
                          ) : (
                            <span className="text-[10px] bg-stone-900 text-stone-500 border border-stone-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Chưa Mở Khóa
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-400 leading-relaxed">
                          {titleDef.description}
                        </p>

                        <div className="text-[11px] text-stone-500 italic">
                          Nguồn gốc: {titleDef.source}
                        </div>

                        {/* Practical Stat Bonuses */}
                        <div className="pt-1.5 border-t border-stone-800/60">
                          <span className="text-[11px] font-semibold text-stone-400 block mb-1">Hiệu ứng thực tế:</span>
                          {Object.keys(statsBonus).length === 0 ? (
                            <span className="text-xs text-stone-500 italic">Không có hiệu ứng phụ gia.</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                              {statsBonus.atk && (
                                <span className="px-2 py-0.5 rounded bg-red-950/50 text-red-300 border border-red-800/40">
                                  +{statsBonus.atk} Công Kích
                                </span>
                              )}
                              {statsBonus.def && (
                                <span className="px-2 py-0.5 rounded bg-blue-950/50 text-blue-300 border border-blue-800/40">
                                  +{statsBonus.def} Phòng Thủ
                                </span>
                              )}
                              {statsBonus.hp && (
                                <span className="px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800/40">
                                  +{statsBonus.hp} Khí Huyết
                                </span>
                              )}
                              {statsBonus.mp && (
                                <span className="px-2 py-0.5 rounded bg-sky-950/50 text-sky-300 border border-sky-800/40">
                                  +{statsBonus.mp} Linh Lực
                                </span>
                              )}
                              {statsBonus.speed && (
                                <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
                                  +{statsBonus.speed} Tốc Độ
                                </span>
                              )}
                              {statsBonus.critRate && (
                                <span className="px-2 py-0.5 rounded bg-yellow-950/50 text-yellow-300 border border-yellow-800/40">
                                  +{Math.round(statsBonus.critRate * 100)}% Bạo Kích
                                </span>
                              )}
                              {statsBonus.expBonusPercent && (
                                <span className="px-2 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-800/40">
                                  +{statsBonus.expBonusPercent}% Tu Vi
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 border-t border-stone-800 flex justify-end">
                        {isUnlocked ? (
                          isEquipped ? (
                            <button
                              onClick={() => handleEquipTitle(null)}
                              className="px-3.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-600 transition"
                            >
                              Tháo Ra
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEquipTitle(titleDef.id)}
                              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition shadow"
                            >
                              Trang Bị
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] text-stone-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Chưa đủ điều kiện
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLLECTION & JOURNEY LOG */}
        {mainTab === 'collection' && (
          <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
            {/* Subtabs for Collection */}
            <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
              <button
                onClick={() => setCollectionSubTab('bosses')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  collectionSubTab === 'bosses'
                    ? 'bg-amber-600 text-stone-950'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                }`}
              >
                🐉 Ma Thú & Lĩnh Chủ ({Object.keys(player.collectionStats?.defeatedBosses || {}).length}/{BOSS_COLLECTION.length})
              </button>

              <button
                onClick={() => setCollectionSubTab('maps')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  collectionSubTab === 'maps'
                    ? 'bg-amber-600 text-stone-950'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                }`}
              >
                🗺️ Sơn Hà & Bí Cảnh ({player.discoveredMaps?.length || 1}/{Object.keys(GAME_MAPS).length})
              </button>

              <button
                onClick={() => setCollectionSubTab('arts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  collectionSubTab === 'arts'
                    ? 'bg-amber-600 text-stone-950'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                }`}
              >
                📖 Thần Thông Công Pháp ({player.learnedArtIds?.length || 1}/{Object.keys(CULTIVATION_ARTS).length})
              </button>

              <button
                onClick={() => setCollectionSubTab('clues')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  collectionSubTab === 'clues'
                    ? 'bg-amber-600 text-stone-950'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                }`}
              >
                🧿 Manh Mối Cổ Ngọc ({player.collectionStats?.discoveredClues?.length || 0}/{CLUES_COLLECTION.length})
              </button>

              <button
                onClick={() => setCollectionSubTab('endings')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  collectionSubTab === 'endings'
                    ? 'bg-amber-600 text-stone-950'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                }`}
              >
                📜 Biên Niên Sử & Đại Kết Cục ({player.collectionStats?.unlockedEndings?.length || 0}/{ENDINGS_COLLECTION.length})
              </button>
            </div>

            {/* Collection Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {/* 1. Bosses Subtab */}
              {collectionSubTab === 'bosses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {BOSS_COLLECTION.map(boss => {
                    const kills = player.collectionStats?.defeatedBosses?.[boss.id] || 0;
                    const isDefeated = kills > 0;

                    return (
                      <div
                        key={boss.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          isDefeated
                            ? 'bg-stone-950/80 border-amber-500/60 shadow-md'
                            : 'bg-stone-950/30 border-stone-800 opacity-60'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{isDefeated ? boss.avatarIcon : '❓'}</span>
                              <div>
                                <h4 className="font-bold text-amber-200 text-sm">{isDefeated ? boss.name : 'Ma Thú Ẩn Danh'}</h4>
                                <span className="text-xs text-rose-400 font-semibold">{boss.realmName}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isDefeated ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-stone-900 text-stone-500'
                            }`}>
                              Hạ gục: {kills} lần
                            </span>
                          </div>

                          <p className="text-xs text-stone-400 leading-relaxed">
                            {isDefeated ? boss.description : 'Chưa từng chạm trán thủ hộ thú này trong cấm khu.'}
                          </p>

                          <div className="text-[11px] text-stone-400">
                            Vị trí phân bố: <span className="text-stone-300 font-medium">{boss.location}</span>
                          </div>

                          {isDefeated && (
                            <div className="pt-2 border-t border-stone-800">
                              <span className="text-[10px] text-stone-400 font-semibold block mb-1">Chiến lợi phẩm đặc trưng:</span>
                              <div className="flex flex-wrap gap-1 text-[11px]">
                                {boss.signatureDrops.map(itId => {
                                  const it = ITEMS[itId];
                                  return (
                                    <span key={itId} className="px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-700">
                                      {it?.name || itId}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. Maps Subtab */}
              {collectionSubTab === 'maps' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(GAME_MAPS).map(m => {
                    const isDiscovered = player.discoveredMaps?.includes(m.id);

                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-2.5 ${
                          isDiscovered
                            ? 'bg-stone-950/80 border-purple-500/60 shadow-md'
                            : 'bg-stone-950/30 border-stone-800 opacity-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-purple-200">
                              {isDiscovered ? m.name : 'Vùng Đất Chưa Thám Hiểm'}
                            </h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isDiscovered ? 'bg-purple-950 text-purple-300 border border-purple-700' : 'bg-stone-900 text-stone-500'
                            }`}>
                              {isDiscovered ? 'Đã Khám Phá' : 'Chưa Đặt Chân'}
                            </span>
                          </div>
                          <p className="text-xs text-rose-400/90 font-medium">{m.dangerLevel}</p>
                          <p className="text-xs text-stone-400">
                            Cơ quan & Tài nguyên: {m.resources?.length || 0} điểm · Nhân vật NPC: {m.npcs?.length || 0} người
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Cultivation Arts Subtab */}
              {collectionSubTab === 'arts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(CULTIVATION_ARTS).map(art => {
                    const isLearned = player.learnedArtIds?.includes(art.id);
                    const isActive = player.currentArtId === art.id;

                    return (
                      <div
                        key={art.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          isActive
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-md'
                            : isLearned
                            ? 'bg-stone-950/80 border-stone-700'
                            : 'bg-stone-950/30 border-stone-800 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-amber-200">{art.name}</h4>
                            {isActive ? (
                              <span className="text-[10px] bg-cyan-500 text-stone-950 font-bold px-2 py-0.5 rounded-full">
                                Đang Vận Chuyển
                              </span>
                            ) : isLearned ? (
                              <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full">
                                Đã Lĩnh Ngộ
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-500 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Chưa Học
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 leading-relaxed">{art.description}</p>
                          <div className="text-[11px] text-stone-500 italic">{art.lore}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. Clues Subtab */}
              {collectionSubTab === 'clues' && (
                <div className="space-y-3">
                  {CLUES_COLLECTION.map(clue => {
                    const isFound = (player.collectionStats?.discoveredClues || []).includes(clue.id) ||
                      player.inventory.some(s => s.item.id === clue.discoveredItemOrStele);

                    return (
                      <div
                        key={clue.id}
                        className={`p-4 rounded-xl border space-y-2 ${
                          isFound
                            ? 'bg-stone-950/90 border-amber-500/70 shadow-lg'
                            : 'bg-stone-950/30 border-stone-800 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{isFound ? '🧿' : '🔒'}</span>
                            <h4 className="font-bold text-amber-300 text-sm">
                              {isFound ? clue.name : 'Manh Mối Chưa Khai Phá'}
                            </h4>
                          </div>
                          <span className="text-xs text-stone-400 font-mono">Chương {clue.chapter}</span>
                        </div>

                        <p className="text-xs text-stone-300 italic bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                          {isFound ? clue.textSnippet : 'Ký ức cổ xưa còn chìm trong sương mù...'}
                        </p>

                        <div className="text-[11px] text-amber-400/90">
                          Ý nghĩa tiên lộ: {isFound ? clue.significance : 'Hãy tìm kiếm tàn tích và khảo sát các góc bí mật.'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 5. Endings Subtab */}
              {collectionSubTab === 'endings' && (
                <div className="space-y-4">
                  {ENDINGS_COLLECTION.map(end => {
                    const isUnlocked = (player.collectionStats?.unlockedEndings || []).includes(end.id);

                    return (
                      <div
                        key={end.id}
                        className={`p-5 rounded-2xl border space-y-3 ${
                          isUnlocked
                            ? 'bg-stone-950/90 border-amber-500 shadow-xl'
                            : 'bg-stone-950/30 border-stone-800 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{end.icon}</span>
                            <div>
                              <h4 className="font-bold text-amber-200 text-base">{end.title}</h4>
                              <p className="text-xs text-stone-400">{end.subtitle}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            isUnlocked ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-stone-900 text-stone-500'
                          }`}>
                            {isUnlocked ? '✓ Đã Đạt Được' : '🔒 Chưa Mở Khóa'}
                          </span>
                        </div>

                        <p className="text-xs text-stone-300 leading-relaxed">
                          {isUnlocked ? end.description : 'Đại kết cục của vận mệnh tu tiên, hình thành từ những lựa chọn then chốt trong cốt truyện chính.'}
                        </p>

                        <div className="text-[11px] text-stone-400 italic">
                          Ý nghĩa đạo tâm: {end.moralChoice}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
