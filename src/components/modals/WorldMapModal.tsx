import React from 'react';
import { PlayerStats } from '../../types/game';
import { GAME_MAPS } from '../../data/maps';
import { soundManager } from '../../engine/audio';
import { X, Map as MapIcon, Compass, Navigation, AlertTriangle } from 'lucide-react';

interface WorldMapModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  player,
  onUpdatePlayer,
  onClose,
}) => {
  const mapsList = Object.values(GAME_MAPS);

  const handleFastTravel = (mapId: string) => {
    // Only allow fast travel if map is discovered
    if (!player.discoveredMaps.includes(mapId)) return;
    if (player.currentMapId === mapId) return;

    soundManager.playDash();

    // Default entry spawn points
    const spawnCoords: Record<string, { x: number; y: number }> = {
      map_thanh_khe: { x: 380, y: 430 },
      map_thanh_phong_son: { x: 340, y: 420 },
      map_linh_vu: { x: 120, y: 450 },
      map_phuong_thi: { x: 200, y: 450 },
      map_thanh_van_tong: { x: 500, y: 650 },
      map_hac_phong_son: { x: 120, y: 450 },
      map_hac_phong_bi_canh: { x: 120, y: 550 },
      map_ancient_ruins: { x: 120, y: 500 },
    };

    const coord = spawnCoords[mapId] || { x: 300, y: 300 };

    onUpdatePlayer(prev => ({
      ...prev,
      currentMapId: mapId,
      x: coord.x,
      y: coord.y,
    }));

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl bg-stone-900 border-2 border-amber-600/70 rounded-xl shadow-2xl p-6 text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-lg font-bold text-amber-300 font-title">
                Sơn Hà Đồ – Thế Giới Tu Tiên
              </h2>
              <p className="text-xs text-stone-400">
                Toàn cảnh địa vực phàm trần quốc Đại Lương và các vùng cấm địa linh mạch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {mapsList.map(map => {
            const isCurrent = player.currentMapId === map.id;
            const isDiscovered = player.discoveredMaps.includes(map.id);

            return (
              <div
                key={map.id}
                className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-950/40 shadow-lg'
                    : isDiscovered
                    ? 'border-stone-800 bg-stone-950/70 hover:border-amber-700/50'
                    : 'border-stone-900 bg-stone-950/40 opacity-40'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <h3 className="font-bold text-amber-200 text-sm flex items-center gap-1.5">
                      {map.name}
                      {isCurrent && (
                        <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.2 rounded">
                          Vị Trí Hiện Tại
                        </span>
                      )}
                    </h3>
                  </div>

                  <p className="text-[11px] text-stone-400 mb-2">
                    {map.dangerLevel}
                  </p>

                  <div className="text-[11px] text-stone-300 space-y-1 bg-stone-900/60 p-2 rounded">
                    <div>NPC: {map.npcs.length > 0 ? map.npcs.map(n => n.name.split(' ')[0]).join(', ') : 'Không có'}</div>
                    <div>Yêu Thú: {map.enemySpawners.length > 0 ? 'Có dã thú & ma tu' : 'An toàn'}</div>
                    <div>Khai Thác: {map.resources.length > 0 ? 'Linh thảo, khoáng thạch' : 'Chợ giao dịch'}</div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-800/80">
                  {isCurrent ? (
                    <div className="text-center text-xs text-amber-400 font-semibold py-1">
                      Đang Ở Khu Vực Này
                    </div>
                  ) : isDiscovered ? (
                    <button
                      onClick={() => handleFastTravel(map.id)}
                      className="w-full py-1.5 rounded bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Ngự Kiếm Di Chuyển
                    </button>
                  ) : (
                    <div className="text-center text-xs text-stone-600 py-1 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Chưa Thăm Dò Khám Phá
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
