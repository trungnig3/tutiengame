import React, { useState } from 'react';
import { PlayerStats } from '../../types/game';
import { SaveManager, SaveSlotData } from '../../engine/saveManager';
import { soundManager } from '../../engine/audio';
import { X, Save, Upload, RotateCcw, Volume2, Key, Check, Smartphone } from 'lucide-react';

interface MenuModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onLoadPlayer: (loadedStats: PlayerStats) => void;
  onRestartGame: () => void;
  onClose: () => void;
  touchControlsEnabled?: boolean;
  onToggleTouchControls?: () => void;
  onOpenMobileInstall?: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  player,
  onUpdatePlayer,
  onLoadPlayer,
  onRestartGame,
  onClose,
  touchControlsEnabled = false,
  onToggleTouchControls,
  onOpenMobileInstall,
}) => {
  const [slots, setSlots] = useState<{ slotId: string; data: SaveSlotData | null }[]>(
    SaveManager.listSlots()
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [vol, setVol] = useState<number>(soundManager.masterVolume);

  const handleSaveToSlot = (slotId: string) => {
    soundManager.playCollect();
    const ok = SaveManager.saveGame(slotId, player);
    if (ok) {
      setSlots(SaveManager.listSlots());
      setFeedback(`Đã lưu game vào [${slotId.toUpperCase()}] thành công!`);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleLoadFromSlot = (slotId: string) => {
    const data = SaveManager.loadGame(slotId);
    if (data && data.playerStats) {
      soundManager.playCollect();
      onLoadPlayer(data.playerStats);
      onClose();
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVol(newVol);
    soundManager.setVolume(newVol);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col bg-stone-900 border-2 border-amber-600/70 rounded-xl shadow-2xl p-3 sm:p-6 text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 pb-2.5 sm:pb-3 mb-3 sm:mb-4 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-amber-300 font-title">
              Cài Đặt & Lưu Trữ Đạo Quả
            </h2>
            <p className="text-[10px] sm:text-xs text-stone-400">Quản lý các ô lưu dữ liệu và điều chỉnh âm lượng</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div className="mb-3 p-2 rounded bg-emerald-950/70 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-400" />
            {feedback}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* LEFT: SAVE SLOTS */}
          <div className="space-y-3 bg-stone-950/70 border border-stone-800 p-4 rounded-lg">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Các Ô Lưu Trữ
            </h3>

            <div className="space-y-2.5">
              {slots.map(({ slotId, data }) => (
                <div
                  key={slotId}
                  className="p-3 rounded-lg border border-stone-800 bg-stone-900 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-amber-300 uppercase">
                      {slotId === 'auto' ? 'Tự Động Lưu' : `Ô Lưu ${slotId.replace('slot', '')}`}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {data ? data.savedAt : 'Trống'}
                    </span>
                  </div>

                  {data ? (
                    <div className="text-[11px] text-stone-300">
                      {data.playerStats.name} - {data.playerStats.title} (Cảnh giới {data.playerStats.realmIndex + 1})
                    </div>
                  ) : (
                    <div className="text-[11px] text-stone-600 italic">Chưa có dữ liệu</div>
                  )}

                  <div className="flex gap-2 pt-1 border-t border-stone-800/60">
                    <button
                      onClick={() => handleSaveToSlot(slotId)}
                      className="flex-1 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Ghi Đè
                    </button>
                    {data && (
                      <button
                        onClick={() => handleLoadFromSlot(slotId)}
                        className="flex-1 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Tải Lưu
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: SOUND SETTINGS & CONTROLS GUIDE */}
          <div className="space-y-4 bg-stone-950/70 border border-stone-800 p-4 rounded-lg flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Âm Thanh & Điều Khiển
              </h3>

              {/* Volume Slider */}
              <div className="space-y-1.5 bg-stone-900 p-3 rounded border border-stone-800">
                <div className="flex justify-between text-xs text-stone-300">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-400" /> Âm Lượng Tổng:
                  </span>
                  <span className="font-bold text-amber-400">{Math.round(vol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vol}
                  onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Touch Controls Switch */}
              <div className="flex items-center justify-between p-3 rounded bg-stone-900 border border-stone-800 text-xs">
                <span className="flex items-center gap-1.5 text-stone-300">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  Cần Gạt Cảm Ứng Di Động:
                </span>
                <button
                  type="button"
                  onClick={onToggleTouchControls}
                  className={`px-3 py-1 rounded text-xs font-bold transition border cursor-pointer ${
                    touchControlsEnabled
                      ? 'bg-amber-600 border-amber-400 text-stone-950'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  {touchControlsEnabled ? 'Đang Bật' : 'Đang Tắt'}
                </button>
              </div>

              {/* Controls Keybinding Guide */}
              <div className="text-xs space-y-1 bg-stone-900 p-3 rounded border border-stone-800">
                <span className="font-semibold text-amber-300 flex items-center gap-1 mb-1">
                  <Key className="w-3.5 h-3.5" /> Bảng Phím Tắt:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-stone-300">
                  <div><strong>W, A, S, D:</strong> Di chuyển</div>
                  <div><strong>Chuột Trái:</strong> Tấn công thường</div>
                  <div><strong>Chuột Phải:</strong> Thân pháp né đòn</div>
                  <div><strong>Phím Space:</strong> Tương tác / Nhặt</div>
                  <div><strong>Q, E, R, F:</strong> Kỹ năng võ học</div>
                  <div><strong>C:</strong> Nhân vật / Đột phá</div>
                  <div><strong>K:</strong> Tu luyện công pháp</div>
                  <div><strong>I:</strong> Túi đồ trữ vật</div>
                  <div><strong>J:</strong> Danh sách nhiệm vụ</div>
                  <div><strong>M:</strong> Sơn Hà Đồ (Bản đồ)</div>
                  <div><strong>P:</strong> Luyện Đan Thuật</div>
                  <div><strong>L:</strong> Luyện Khí Binh Giáp</div>
                </div>
              </div>
            </div>

            {/* Mobile PWA / APK Install Button */}
            {onOpenMobileInstall && (
              <button
                type="button"
                onClick={onOpenMobileInstall}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600/90 to-yellow-600/90 hover:from-amber-500 hover:to-yellow-500 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Smartphone className="w-4 h-4" /> Tải / Cài Đặt Game Về Điện Thoại
              </button>
            )}

            {/* Restart button */}
            <button
              onClick={() => {
                if (window.confirm('Đạo hữu có chắc chắn muốn luân hồi chuyển thế, bắt đầu lại từ đầu?')) {
                  onRestartGame();
                }
              }}
              className="w-full py-2 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Luân Hồi Trọng Sinh (Chơi Lại Từ Đầu)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
