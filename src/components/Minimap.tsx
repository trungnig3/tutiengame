import React, { useState } from 'react';
import { PlayerStats, GameMap } from '../types/game';
import { Compass, Maximize2, Minimize2, Navigation } from 'lucide-react';
import { STRONGHOLDS } from '../data/territory';
import { WORLD_EVENTS } from '../data/worldEvents';

interface MinimapProps {
  player: PlayerStats;
  currentMap: GameMap;
  onOpenWorldMap: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  player,
  currentMap,
  onOpenWorldMap,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Radar dimensions
  const radarSize = 136;
  const radarRadius = radarSize / 2;

  // Scale map coordinates to radar space
  // Player is at center of radar, and nearby objects are positioned relative to player
  // Radar range is influenced by player's consciousness (Thần thức)
  const baseRange = 400 + (player.consciousness || 15) * 20; // in world pixels

  const worldToRadar = (wx: number, wy: number) => {
    const dx = wx - player.x;
    const dy = wy - player.y;

    // Relative distance scaled
    const rx = (dx / baseRange) * (radarRadius - 10);
    const ry = (dy / baseRange) * (radarRadius - 10);

    const dist = Math.hypot(rx, ry);
    // Clamp inside circular radar boundary
    const isInside = dist <= radarRadius - 6;

    const angle = Math.atan2(ry, rx);
    const clampedDist = Math.min(dist, radarRadius - 8);

    const cx = radarRadius + Math.cos(angle) * clampedDist;
    const cy = radarRadius + Math.sin(angle) * clampedDist;

    return { x: cx, y: cy, isInside, distWorld: Math.hypot(dx, dy) };
  };

  // Active world events on this map
  const activeEvents = WORLD_EVENTS.filter(
    e => e.mapId === currentMap.id && !player.completedEventIds?.includes(e.id)
  );

  // Strongholds on this map
  const strongholds = STRONGHOLDS.filter(s => s.mapId === currentMap.id);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="pointer-events-auto bg-stone-900/90 hover:bg-stone-800 border border-amber-600/50 rounded-xl p-2 backdrop-blur-md shadow-xl flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition cursor-pointer group"
        title="Mở Tiên Đạo La Bàn (Minimap)"
      >
        <Compass className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
        <span className="text-[11px] font-bold">La Bàn</span>
        <Maximize2 className="w-3 h-3 text-stone-400" />
      </button>
    );
  }

  return (
    <div className="pointer-events-auto relative flex flex-col items-end gap-1 select-none">
      <div className="relative bg-stone-950/90 border-2 border-amber-600/70 rounded-2xl p-1.5 backdrop-blur-md shadow-2xl flex flex-col items-center">
        {/* Header toolbar */}
        <div className="w-full flex justify-between items-center px-1 pb-1 border-b border-amber-900/40 text-[10px]">
          <span className="font-bold text-amber-300 flex items-center gap-1 truncate max-w-[95px]">
            <Compass className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="truncate">{currentMap.name.split(' ')[0]}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenWorldMap}
              className="text-stone-400 hover:text-cyan-300 p-0.5 rounded transition"
              title="Mở Toàn Cảnh Sơn Hà Đồ [M]"
            >
              <Navigation className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-stone-400 hover:text-stone-200 p-0.5 rounded transition"
              title="Thu gọn La Bàn"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Circular Radar Canvas Area */}
        <div
          onClick={onOpenWorldMap}
          className="relative mt-1 cursor-pointer group"
          style={{ width: radarSize, height: radarSize }}
          title="Nhấn để mở Toàn Cảnh Bản Đồ Sơn Hà Đồ [M]"
        >
          {/* Radar background with compass markings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-stone-900 via-emerald-950/30 to-stone-950 border border-amber-500/40 overflow-hidden shadow-inner">
            {/* Concentric distance rings */}
            <div className="absolute inset-2 rounded-full border border-stone-800/60 pointer-events-none" />
            <div className="absolute inset-6 rounded-full border border-stone-800/40 pointer-events-none" />
            <div className="absolute inset-10 rounded-full border border-stone-800/30 pointer-events-none" />

            {/* Crosshairs */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-amber-500/15 pointer-events-none" />
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-amber-500/15 pointer-events-none" />

            {/* Compass Cardinal Points */}
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-amber-500/60">B</span>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-amber-500/40">N</span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-black text-amber-500/40">T</span>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-black text-amber-500/40">Đ</span>
          </div>

          {/* 1. Portals (Exits) */}
          {currentMap.portals.map(p => {
            const pos = worldToRadar(p.x, p.y);
            return (
              <div
                key={p.id}
                className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500 border border-white flex items-center justify-center text-[7px] font-bold text-stone-950 shadow-md animate-pulse"
                style={{ left: pos.x, top: pos.y }}
                title={`Cổng Dịch Chuyển: ${p.name}`}
              >
                C
              </div>
            );
          })}

          {/* 2. Strongholds */}
          {strongholds.map(sh => {
            const pos = worldToRadar(sh.x, sh.y);
            return (
              <div
                key={sh.id}
                className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded bg-amber-500 border border-amber-200 flex items-center justify-center text-[8px] shadow-lg"
                style={{ left: pos.x, top: pos.y }}
                title={`Cứ Điểm: ${sh.name}`}
              >
                ⚔️
              </div>
            );
          })}

          {/* 3. World Events */}
          {activeEvents.map(ev => {
            const pos = worldToRadar(ev.x, ev.y);
            return (
              <div
                key={ev.id}
                className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600 border border-amber-300 flex items-center justify-center text-[8px] shadow-lg animate-ping"
                style={{ left: pos.x, top: pos.y }}
                title={`Sự Kiện: ${ev.title}`}
              >
                ⚡
              </div>
            );
          })}

          {/* 4. NPCs */}
          {currentMap.npcs.map(npc => {
            const pos = worldToRadar(npc.x, npc.y);
            if (!pos.isInside && pos.distWorld > baseRange) return null;
            return (
              <div
                key={npc.id}
                className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 border border-stone-950 shadow"
                style={{ left: pos.x, top: pos.y }}
                title={`NPC: ${npc.name}`}
              />
            );
          })}

          {/* 5. Player Dot in center */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-stone-950 shadow-xl flex items-center justify-center"
          >
            {/* Direction pointer */}
            <div
              className="w-1.5 h-1.5 bg-stone-950 rounded-xs transform"
              style={{
                transform:
                  player.facing === 'up'
                    ? 'translateY(-2px)'
                    : player.facing === 'down'
                    ? 'translateY(2px)'
                    : player.facing === 'left'
                    ? 'translateX(-2px)'
                    : 'translateX(2px)',
              }}
            />
          </div>

          {/* Hover overlay hint */}
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[9px] font-bold text-amber-200">
            [M] Bản Đồ
          </div>
        </div>

        {/* Coordinates & Radar range */}
        <div className="w-full flex justify-between items-center px-1 pt-1 text-[9px] text-stone-400 border-t border-amber-900/30">
          <span className="font-mono text-amber-400">
            X:{Math.floor(player.x)} Y:{Math.floor(player.y)}
          </span>
          <span className="text-[8px] text-stone-500" title="Phạm vi quét do Thần Thức quyết định">
            Thần Thức: {player.consciousness}
          </span>
        </div>
      </div>
    </div>
  );
};
