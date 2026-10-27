import React, { useState } from 'react';
import { PlayerStats } from '../types/game';
import { REALMS } from '../data/realms';
import { GAME_MAPS } from '../data/maps';
import { 
  Shield, 
  Sparkles, 
  BookOpen, 
  Package, 
  Scroll, 
  Map as MapIcon, 
  Flame, 
  Hammer, 
  Swords,
  Volume2, 
  VolumeX, 
  Menu,
  Clock,
  Trophy,
  Crown,
  Smartphone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { soundManager } from '../engine/audio';
import { formatGameTime } from '../engine/cultivationEngine';

interface HUDProps {
  player: PlayerStats;
  onOpenCharacter: () => void;
  onOpenCultivation: () => void;
  onOpenInventory: () => void;
  onOpenQuests: () => void;
  onOpenMap: () => void;
  onOpenAlchemy: () => void;
  onOpenForging: () => void;
  onOpenWarRoom: () => void;
  onOpenAchievements: () => void;
  onOpenMenu: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  touchControlsEnabled?: boolean;
  onToggleTouchControls?: () => void;
  renderMode?: '3d' | '2d';
  onToggleRenderMode?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  onOpenCharacter,
  onOpenCultivation,
  onOpenInventory,
  onOpenQuests,
  onOpenMap,
  onOpenAlchemy,
  onOpenForging,
  onOpenWarRoom,
  onOpenAchievements,
  onOpenMenu,
  musicEnabled,
  onToggleMusic,
  touchControlsEnabled = false,
  onToggleTouchControls,
  renderMode = '3d',
  onToggleRenderMode,
}) => {
  const [isQuestCollapsed, setIsQuestCollapsed] = useState<boolean>(false);
  const currentRealm = REALMS[player.realmIndex] || REALMS[0];
  const currentMap = GAME_MAPS[player.currentMapId] || GAME_MAPS.map_thanh_khe;

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (player.mp / player.maxMp) * 100));
  const expPercent = Math.max(0, Math.min(100, (player.exp / currentRealm.requiredExp) * 100));

  const activeMainQuest = player.activeQuests.find(q => q.type === 'main') || player.activeQuests[0];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-3 select-none z-20">
      {/* === TOP ROW: CHARACTER BARS & QUICK ACTIONS === */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex justify-between items-start gap-2">
          {/* Top-Left: Player Stats Panel (Responsive Mobile / Desktop) */}
          <div className="pointer-events-auto bg-stone-900/90 border border-amber-600/40 rounded-lg p-2 sm:p-3 backdrop-blur-md shadow-xl flex items-center gap-2 sm:gap-3 max-w-[210px] sm:max-w-none sm:w-80">
            <div className="relative shrink-0">
              <div 
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-amber-500 bg-stone-950 flex flex-col items-center justify-center shadow-inner cursor-pointer hover:scale-105 transition-transform"
                onClick={onOpenCharacter}
                title="Nhấn để xem Nhân Vật và Đột Phá"
              >
                <span className="font-serif font-black text-amber-400 text-sm sm:text-lg leading-none">修</span>
                <span className="text-[7px] sm:text-[8px] text-amber-200/70 font-mono tracking-tighter">TIÊN</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-600 text-stone-950 text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded-full border border-amber-300">
                C{player.realmIndex + 1}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
              <div className="flex justify-between items-center gap-1">
                <span className="font-bold text-amber-200 text-xs sm:text-sm truncate">{player.name}</span>
                <span className="text-[9px] sm:text-[11px] px-1 sm:px-2 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50 truncate shrink-0">
                  {currentRealm.fullName}
                </span>
              </div>

              {/* HP Bar */}
              <div className="relative w-full h-2.5 sm:h-3.5 bg-stone-950 rounded-full overflow-hidden border border-red-900/60">
                <div 
                  className="h-full bg-gradient-to-r from-red-700 to-rose-500 transition-all duration-200"
                  style={{ width: `${hpPercent}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[10px] text-white font-medium drop-shadow">
                  {Math.floor(player.hp)} / {player.maxHp}
                </span>
              </div>

              {/* MP Bar */}
              <div className="relative w-full h-2.5 sm:h-3.5 bg-stone-950 rounded-full overflow-hidden border border-sky-900/60">
                <div 
                  className="h-full bg-gradient-to-r from-sky-700 to-cyan-400 transition-all duration-200"
                  style={{ width: `${mpPercent}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[10px] text-white font-medium drop-shadow">
                  {Math.floor(player.mp)} / {player.maxMp}
                </span>
              </div>

              {/* Tu Vi (Exp) Bar */}
              <div className="relative w-full h-1.5 sm:h-2 bg-stone-950 rounded-full overflow-hidden border border-amber-900/60 hidden xs:block">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-300 transition-all duration-200"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] sm:text-[10px] text-stone-400">
                <span className="truncate">Tu Vi: {player.exp}/{currentRealm.requiredExp}</span>
                <span className="text-amber-400 font-semibold">{Math.floor(expPercent)}%</span>
              </div>
            </div>
          </div>

          {/* Top-Right: Map Info, Game Time, Spirit Stones & System Buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Game Calendar / Canh Giờ */}
            <div className="bg-stone-900/90 border border-amber-600/40 rounded-lg px-2 py-1 backdrop-blur-md shadow-lg text-right hidden lg:block">
              <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {formatGameTime(player.gameTime)}
              </div>
              <div className="text-[9px] text-stone-400">Thời Gian Tiên Giới</div>
            </div>

            {/* Location */}
            <div
              className={`bg-stone-900/90 border rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur-md shadow-lg text-right ${
                player.currentMapId === 'map_hac_phong_bi_canh' || player.currentMapId === 'map_ancient_ruins'
                  ? 'border-purple-500/70 shadow-purple-950/50'
                  : 'border-amber-600/40'
              }`}
            >
              <div className="text-[10px] sm:text-xs font-bold text-amber-200 flex items-center gap-1 justify-end">
                <MapIcon className="w-3 h-3 text-amber-400" />
                <span className="truncate max-w-[80px] sm:max-w-none">{currentMap.name}</span>
              </div>
              <div className="text-[8px] sm:text-[10px] text-rose-400 font-medium hidden sm:block">{currentMap.dangerLevel}</div>
            </div>

            {/* Spirit Stones */}
            <div className="bg-stone-900/90 border border-amber-600/40 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 backdrop-blur-md shadow-lg flex items-center gap-1">
              <span className="text-amber-400 font-bold text-xs sm:text-sm">💎 {player.spiritStones}</span>
            </div>

            {/* 3D / 2D Render Mode Toggle */}
            {onToggleRenderMode && (
              <button
                onClick={onToggleRenderMode}
                className={`px-2 py-1 rounded-lg border hidden sm:flex items-center gap-1 text-[11px] font-semibold transition-colors shadow-lg cursor-pointer ${
                  renderMode === '3d'
                    ? 'bg-amber-950/85 border-amber-500 text-amber-200'
                    : 'bg-stone-900/90 border-amber-600/40 text-stone-300 hover:text-amber-200 hover:bg-stone-800'
                }`}
                title="Chuyển đổi giữa 3D Tiên Cảnh (2.5D) và 2D Cổ Phong"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{renderMode === '3d' ? '3D' : '2D'}</span>
              </button>
            )}

            {/* Touch Controls Toggle button */}
            <button
              onClick={onToggleTouchControls}
              className={`p-1.5 sm:p-2 rounded-lg border transition-colors shadow-lg cursor-pointer ${
                touchControlsEnabled
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                  : 'bg-stone-900/90 border-amber-600/40 text-stone-400 hover:text-amber-200 hover:bg-stone-800'
              }`}
              title="Bật/Tắt Cần Gạt Ảo & Phím Cảm Ứng Di Động"
            >
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Audio toggle */}
            <button
              onClick={onToggleMusic}
              className="p-1.5 sm:p-2 rounded-lg bg-stone-900/90 border border-amber-600/40 text-amber-200 hover:bg-stone-800 transition-colors shadow-lg cursor-pointer"
              title="Bật/Tắt Âm Nhạc Cổ Phong"
            >
              {musicEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-stone-500" />}
            </button>

            {/* Menu button */}
            <button
              onClick={onOpenMenu}
              className="p-1.5 sm:p-2 rounded-lg bg-stone-900/90 border border-amber-600/40 text-amber-200 hover:bg-stone-800 transition-colors shadow-lg cursor-pointer"
              title="Cài đặt & Lưu Game"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Quick Action Buttons Bar (Sleek row when touch mode is active) */}
        {touchControlsEnabled && (
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto py-1 px-2 bg-stone-950/85 border border-amber-600/40 rounded-xl backdrop-blur-md shadow-xl self-end">
            <button 
              onClick={onOpenInventory} 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/90 text-[10px] font-bold text-amber-300 border border-amber-600/40 active:scale-95 transition"
            >
              <span>🎒</span>
              <span>Túi</span>
            </button>
            <button 
              onClick={onOpenCharacter} 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/90 text-[10px] font-bold text-amber-300 border border-amber-600/40 active:scale-95 transition"
            >
              <span>👤</span>
              <span>Nhân Vật</span>
            </button>
            <button 
              onClick={onOpenCultivation} 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/90 text-[10px] font-bold text-cyan-300 border border-cyan-600/40 active:scale-95 transition"
            >
              <span>☯️</span>
              <span>Tu Vi</span>
            </button>
            <button 
              onClick={onOpenQuests} 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/90 text-[10px] font-bold text-emerald-300 border border-emerald-600/40 active:scale-95 transition"
            >
              <span>📜</span>
              <span>Nhiệm Vụ</span>
            </button>
            <button 
              onClick={onOpenMap} 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/90 text-[10px] font-bold text-purple-300 border border-purple-600/40 active:scale-95 transition"
            >
              <span>🗺️</span>
              <span>Bản Đồ</span>
            </button>
            <button 
              onClick={onOpenAlchemy} 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/90 text-[10px] font-bold text-rose-300 border border-rose-600/40 active:scale-95 transition"
            >
              <span>🏺</span>
              <span>Đan</span>
            </button>
            <button 
              onClick={onOpenAchievements} 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/90 text-[10px] font-bold text-yellow-300 border border-yellow-600/40 active:scale-95 transition"
            >
              <span>🏆</span>
              <span>Thành Tựu</span>
            </button>
          </div>
        )}
      </div>

      {/* === MIDDLE RIGHT: ACTIVE QUEST TRACKER (Collapsible so it doesn't block screen) === */}
      {activeMainQuest && (
        <div className="self-end pointer-events-auto mt-1 max-w-[260px] sm:max-w-xs bg-stone-900/90 border border-amber-600/40 rounded-lg p-2 sm:p-2.5 backdrop-blur-md shadow-xl text-xs space-y-1">
          <div 
            className="flex items-center justify-between border-b border-amber-800/40 pb-1 cursor-pointer"
            onClick={() => setIsQuestCollapsed(prev => !prev)}
            title="Nhấn để thu gọn / mở rộng nhiệm vụ"
          >
            <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px] sm:text-xs">
              <Scroll className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              Nhiệm Vụ (Ch. {activeMainQuest.chapter})
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-stone-400 hidden sm:inline">[J]</span>
              {isQuestCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> : <ChevronUp className="w-3.5 h-3.5 text-amber-400" />}
            </div>
          </div>

          {!isQuestCollapsed ? (
            <>
              <div className="font-semibold text-stone-200 text-[11px] sm:text-xs truncate">{activeMainQuest.title}</div>
              <div className="space-y-1 text-stone-300 text-[10px] sm:text-[11px]">
                {activeMainQuest.objectives.map(obj => (
                  <div key={obj.id} className="flex items-center gap-1.5">
                    <span className={obj.completed ? 'text-emerald-400' : 'text-stone-500'}>
                      {obj.completed ? '✓' : '○'}
                    </span>
                    <span className={`truncate ${obj.completed ? 'line-through text-stone-500' : ''}`}>
                      {obj.text}
                    </span>
                    {obj.targetCount > 1 && (
                      <span className="text-amber-400 ml-auto font-mono shrink-0">
                        ({obj.currentCount}/{obj.targetCount})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-[10px] text-amber-300/80 truncate">
              {activeMainQuest.title}: {activeMainQuest.objectives[0]?.text}
            </div>
          )}
        </div>
      )}

      {/* === BOTTOM ROW: DESKTOP HOTBAR & COMBAT SKILLS (HIDDEN WHEN TOUCH CONTROLS ACTIVE) === */}
      {!touchControlsEnabled && (
        <div className="hidden md:flex flex-col items-center gap-2">
          {/* Navigation Hotbar Buttons */}
          <div className="pointer-events-auto flex items-center gap-2 bg-stone-900/90 border border-amber-600/40 rounded-full px-4 py-1.5 backdrop-blur-md shadow-2xl">
            <button 
              onClick={onOpenCharacter} 
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-300 hover:text-amber-300 hover:bg-stone-800 transition"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Nhân Vật [C]
            </button>
            <button 
              onClick={onOpenCultivation} 
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-300 hover:text-amber-300 hover:bg-stone-800 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Tu Luyện [K]
            </button>
            <button 
              onClick={onOpenInventory} 
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-300 hover:text-amber-300 hover:bg-stone-800 transition"
            >
              <Package className="w-3.5 h-3.5 text-yellow-400" />
              Túi Đồ [I]
            </button>
            <button 
              onClick={onOpenQuests} 
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-300 hover:text-amber-300 hover:bg-stone-800 transition"
            >
              <Scroll className="w-3.5 h-3.5 text-emerald-400" />
              Nhiệm Vụ [J]
            </button>
            <button 
              onClick={onOpenMap} 
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-300 hover:text-amber-300 hover:bg-stone-800 transition"
            >
              <MapIcon className="w-3.5 h-3.5 text-purple-400" />
              Bản Đồ [M]
            </button>
            <div className="h-4 w-[1px] bg-stone-700 mx-1" />
            <button 
              onClick={onOpenAlchemy} 
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-300 hover:text-amber-300 hover:bg-stone-800 transition"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Luyện Đan [P]
            </button>
            <button 
              onClick={onOpenForging} 
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-300 hover:text-amber-300 hover:bg-stone-800 transition"
            >
              <Hammer className="w-3.5 h-3.5 text-orange-400" />
              Luyện Khí [L]
            </button>
            <div className="h-4 w-[1px] bg-stone-700 mx-1" />
            <button 
              onClick={onOpenWarRoom} 
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-red-300 hover:text-red-200 bg-red-950/60 hover:bg-red-900/80 border border-red-700/60 transition shadow-sm"
              title="Chiến Tranh Tông Môn & Sự Kiện Thế Giới [Phím O]"
            >
              <Swords className="w-3.5 h-3.5 text-red-400" />
              Chiến Sự [O]
            </button>
            <div className="h-4 w-[1px] bg-stone-700 mx-1" />
            <button 
              onClick={onOpenAchievements} 
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-yellow-300 hover:text-yellow-200 bg-amber-950/70 hover:bg-amber-900/90 border border-amber-600/70 transition shadow-sm"
              title="Thiên Đạo Thành Tựu, Danh Hiệu & Hồ Sơ Hành Trình [Phím Y]"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Thành Tựu [Y]
            </button>
          </div>

          {/* Combat Skill Slots — Ornate Bronze-Jade Xianxia Style */}
          <div className="pointer-events-auto flex items-center gap-2.5 bg-stone-950/95 border-2 border-amber-600/60 rounded-2xl px-4 py-2 backdrop-blur-md shadow-2xl">
            {/* Skill 1: Basic Attack - Kiếm Khí Trảm (LMB) */}
            {(() => {
              const skill = player.equippedSkills.find(s => s.key === 'lmb');
              const isOnCooldown = skill && skill.currentCooldown > 0;
              return (
                <div className="relative group flex flex-col items-center">
                  <div 
                    className={`w-12 h-12 rounded-xl bg-gradient-to-b from-stone-800 to-stone-950 border-2 flex items-center justify-center text-xl shadow-inner transition cursor-pointer ${
                      isOnCooldown ? 'border-stone-700 opacity-70' : 'border-amber-500/80 group-hover:border-amber-300 group-hover:scale-105'
                    }`}
                    title={`${skill ? skill.name : 'Kiếm Khí Trảm'}: Vung kiếm xuất kiếm khí trăng khuyết`}
                  >
                    <span className="drop-shadow">⚔️</span>
                    {isOnCooldown && (
                      <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center text-xs font-bold text-amber-400">
                        {skill.currentCooldown.toFixed(1)}s
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-2 bg-stone-900 border border-amber-700/70 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded shadow">
                    LMB
                  </span>
                  <span className="absolute -top-1.5 right-0 text-[8px] font-bold px-1 rounded bg-amber-950 text-amber-300 border border-amber-700/40">
                    KIM
                  </span>
                </div>
              );
            })()}

            {/* Skill 2: Dash - Phiêu Diêu Thân Pháp (Space / RMB) */}
            <div className="relative group flex flex-col items-center">
              <div 
                className={`w-12 h-12 rounded-xl bg-gradient-to-b from-stone-800 to-stone-950 border-2 flex items-center justify-center text-xl shadow-inner transition cursor-pointer ${
                  player.dodgeCooldown > 0 ? 'border-stone-700 opacity-70' : 'border-cyan-500/80 group-hover:border-cyan-300 group-hover:scale-105'
                }`}
                title="Phiêu Diêu Thân Pháp [Space / Chuột Phải]: Thân ảnh hóa gió, né tránh sát thương"
              >
                <span className="drop-shadow">💨</span>
                {player.dodgeCooldown > 0 && (
                  <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center text-xs font-bold text-cyan-400">
                    {player.dodgeCooldown.toFixed(1)}s
                  </div>
                )}
              </div>
              <span className="absolute -bottom-2 bg-stone-900 border border-cyan-700/70 text-cyan-300 text-[10px] font-bold px-1.5 py-0.2 rounded shadow">
                SPACE
              </span>
              <span className="absolute -top-1.5 right-0 text-[8px] font-bold px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/40">
                PHONG
              </span>
            </div>

            <div className="w-[1px] h-8 bg-amber-800/40 mx-0.5" />

            {/* Active Skills: Q, E, R, F */}
            {['q', 'e', 'r', 'f'].map(key => {
              const skill = player.equippedSkills.find(s => s.key === key);
              if (!skill) return null;

              const notEnoughMp = player.mp < skill.mpCost;
              const isOnCooldown = skill.currentCooldown > 0;

              const elementColor = 
                skill.element === 'moc' ? 'text-emerald-400 border-emerald-600/70 bg-emerald-950' :
                skill.element === 'loi' ? 'text-purple-400 border-purple-600/70 bg-purple-950' :
                skill.element === 'ngu_hanh' ? 'text-sky-400 border-sky-600/70 bg-sky-950' :
                skill.element === 'hoa' ? 'text-rose-400 border-rose-600/70 bg-rose-950' :
                'text-amber-400 border-amber-600/70 bg-amber-950';

              return (
                <div key={skill.id} className="relative group flex flex-col items-center">
                  <div 
                    className={`w-12 h-12 rounded-xl bg-gradient-to-b from-stone-800 to-stone-950 border-2 flex items-center justify-center text-xl shadow-inner transition cursor-pointer ${
                      isOnCooldown
                        ? 'border-stone-700 opacity-70'
                        : notEnoughMp
                        ? 'border-sky-900/80 bg-sky-950/40 text-stone-400'
                        : 'border-amber-600/70 group-hover:border-amber-300 group-hover:scale-105'
                    }`}
                    title={`${skill.name} [Phím ${key.toUpperCase()}]: Tiêu hao ${skill.mpCost} Linh Lực, Hồi chiêu ${skill.cooldown}s. ${skill.description}`}
                  >
                    <span className="drop-shadow">{skill.icon}</span>

                    {/* Cooldown overlay */}
                    {isOnCooldown && (
                      <div className="absolute inset-0 bg-black/85 rounded-xl flex items-center justify-center text-xs font-bold text-amber-300">
                        {skill.currentCooldown.toFixed(1)}s
                      </div>
                    )}

                    {/* Insufficient MP badge */}
                    {!isOnCooldown && notEnoughMp && (
                      <div className="absolute inset-0 bg-sky-950/80 rounded-xl flex items-center justify-center text-[10px] font-bold text-sky-400">
                        Cạn MP
                      </div>
                    )}
                  </div>

                  <span className="absolute -bottom-2 bg-stone-900 border border-amber-700/70 text-amber-300 text-[10px] font-bold px-2 py-0.2 rounded uppercase shadow">
                    {key}
                  </span>

                  <span className={`absolute -top-1.5 right-0 text-[8px] font-bold px-1 rounded border ${elementColor}`}>
                    {skill.mpCost}MP
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
