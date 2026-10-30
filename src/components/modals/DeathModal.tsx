import React from 'react';
import { PlayerStats } from '../../types/game';
import { soundManager } from '../../engine/audio';
import { RotateCcw, ShieldAlert, Upload } from 'lucide-react';
import { SaveManager } from '../../engine/saveManager';

interface DeathModalProps {
  onRevive: () => void;
  onLoadAutoSave: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  onRevive,
  onLoadAutoSave,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 select-none">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-stone-950 border-2 border-red-700/80 rounded-2xl shadow-2xl p-4 sm:p-6 text-center text-stone-100 space-y-3 sm:space-y-4">
        <div className="w-14 h-14 sm:w-18 sm:h-18 mx-auto rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center text-3xl sm:text-4xl shadow-inner animate-pulse">
          💀
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-red-500 font-title tracking-widest">
            THÂN TIÊU ĐẠO VẪN
          </h2>
          <p className="text-xs text-stone-400 italic leading-relaxed">
            "Tiên lộ gập ghềnh, một bước sa chân vạn kiếp bất phục... May nhờ có Cổ Ngũ Hành Ngọc Đồng hộ thể giữ lại một sợi tàn hồn bất diệt!"
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={onRevive}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:brightness-110 text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Hồi Hồn Tái Sinh Tại Thanh Khê Thôn
          </button>

          <button
            onClick={onLoadAutoSave}
            className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Tải Lại Bản Lưu Gần Nhất
          </button>
        </div>
      </div>
    </div>
  );
};
