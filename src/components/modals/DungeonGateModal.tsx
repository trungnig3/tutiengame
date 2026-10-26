import React from 'react';
import { PlayerStats, Portal } from '../../types/game';
import { REALMS } from '../../data/realms';
import { soundManager } from '../../engine/audio';
import { ShieldAlert, Compass, Coins, Sparkles, X, Flame, KeyRound } from 'lucide-react';

interface DungeonGateModalProps {
  portal: Portal;
  player: PlayerStats;
  onEnter: () => void;
  onClose: () => void;
}

export const DungeonGateModal: React.FC<DungeonGateModalProps> = ({
  portal,
  player,
  onEnter,
  onClose,
}) => {
  const minRealm = portal.minRealmIndex ?? 6;
  const isRealmMet = player.realmIndex >= minRealm;
  const costStones = portal.costSpiritStones ?? 50;
  const hasStones = player.spiritStones >= costStones;
  const hasToken = player.inventory.some(slot =>
    slot.item.id === 'mieng_ngoc_dong' ||
    slot.item.id === 'hac_phong_lenh' ||
    slot.item.id === 'co_ngoc_di_thu'
  ) || true; // Mảnh ngọc đồng nhân vật luôn có trong hành trình

  const canEnter = isRealmMet && hasStones;

  const handleConfirm = () => {
    if (!canEnter) return;
    soundManager.playBreakthrough();
    onEnter();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-stone-900 via-stone-950 to-purple-950/90 border-2 border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden text-stone-100 flex flex-col max-h-[92vh]">
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative px-6 py-4 border-b border-purple-800/40 bg-purple-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-900/60 border border-purple-500/40 text-purple-300 shadow-inner">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-purple-900/80 text-purple-300 border border-purple-600/30">
                  Cổ Tiên Bí Cảnh
                </span>
                <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {portal.dungeonDifficulty || 'Hung Hiểm Vạn Phần'}
                </span>
              </div>
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-amber-300 font-title">
                {portal.dungeonName || portal.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800/80 text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Lore description */}
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/30 text-stone-300 text-xs leading-relaxed italic font-serif">
            "{portal.dungeonDescription ||
              'Nơi đây là động phủ thượng cổ của Hắc Phong Thượng Nhân, lưu lại từ thời đại tiên ma đại chiến. Khí tức linh áp cực kỳ cuồng bạo, bên trong ẩn chứa vô số cơ duyên quý hiếm như Thiên Linh Thảo, Chu Quả, Bia Đá Cổ Đạo và tàn thiên công pháp, nhưng cũng tràn ngập yêu thú hung hãn!'}"
          </div>

          {/* Conditions evaluation */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Điều Kiện Tiến Vào Cấm Chế Đại Trận:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Realm Condition */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 transition ${
                  isRealmMet
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isRealmMet ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {isRealmMet ? '✓' : '✗'}
                </div>
                <div>
                  <div className="font-bold">
                    Cảnh giới tối thiểu: Luyện Khí Tầng {minRealm}
                  </div>
                  <div className="text-[11px] opacity-80">
                    Hiện tại: {REALMS[player.realmIndex]?.fullName || 'Phàm Nhân'}
                  </div>
                </div>
              </div>

              {/* Spirit stones cost */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 transition ${
                  hasStones
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    hasStones ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {hasStones ? '✓' : '✗'}
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    Kích hoạt linh trận: {costStones} Linh Thạch
                  </div>
                  <div className="text-[11px] opacity-80">
                    Đang có: {player.spiritStones} Linh Thạch
                  </div>
                </div>
              </div>

              {/* Secret token check */}
              <div className="p-3 rounded-xl border bg-emerald-950/30 border-emerald-500/40 text-emerald-200 flex items-start gap-2.5 sm:col-span-2">
                <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Tín Vật Đạo Dẫn: Cổ Ngũ Hành Ngọc Đồng / Cổ Di Lệnh
                  </div>
                  <div className="text-[11px] opacity-80">
                    Mảnh ngọc đồng trên người Lâm Mặc phát ra huỳnh quang cộng hưởng với kết giới bí cảnh!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings & Survival guide */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-700/40 space-y-1.5 text-xs text-amber-200/90">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Chỉ Dẫn Sinh Tồn Khi Thám Hiểm Bí Cảnh:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-300">
              <li>
                <strong className="text-amber-300">Linh Thảo & Khoáng Vật:</strong> Khám phá sâu để thu thập Thiên Linh Thảo, Chu Quả và Cửu U Minh Thiết.
              </li>
              <li>
                <strong className="text-amber-300">Bia Đá Cổ Đạo & Cơ Quan:</strong> Tương tác với thạch bi để ngộ kiếm quyết, phá giải cấm chế để nhận kho tàng.
              </li>
              <li>
                <strong className="text-amber-300">Thủ Hộ Yêu Thú:</strong> Cẩn thận thủ lĩnh Hắc Huyết Viên Vương, chiêu thức cuồng nộ có phạm vi sát thương cực lớn.
              </li>
              <li>
                <strong className="text-amber-300">Rút lui an toàn:</strong> Sử dụng <span className="text-emerald-300 font-semibold">[Bí Cảnh Thoát Hiểm Phù]</span> hoặc tìm Cổ Trận Truyền Tống ở cuối động để rời bí cảnh.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="p-4 border-t border-purple-800/40 bg-stone-950/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs font-semibold transition cursor-pointer"
          >
            Hủy Bỏ / Chuẩn Bị Thêm
          </button>

          <button
            onClick={handleConfirm}
            disabled={!canEnter}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition shadow-lg flex items-center gap-2 cursor-pointer ${
              canEnter
                ? 'bg-gradient-to-r from-purple-600 via-amber-600 to-purple-600 hover:from-purple-500 hover:to-amber-500 text-white shadow-purple-900/40 hover:scale-102 active:scale-98'
                : 'bg-stone-800 border border-stone-700 text-stone-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Compass className="w-4 h-4" />
            {canEnter ? 'Xác Nhận Tiến Vào Bí Cảnh' : 'Chưa Đủ Điều Kiện Tham Gia'}
          </button>
        </div>
      </div>
    </div>
  );
};
