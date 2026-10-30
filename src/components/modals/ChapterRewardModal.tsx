import React, { useState } from 'react';
import { PlayerStats, Item } from '../../types/game';
import { ITEMS } from '../../data/items';
import { CULTIVATION_ARTS } from '../../data/arts';
import { getSpiritualRootConfig } from '../../data/spiritualRoots';
import { Sparkles, Award, Check, Sword, BookOpen, Pill, Shield } from 'lucide-react';
import { soundManager } from '../../engine/audio';

interface ChapterRewardModalProps {
  player: PlayerStats;
  chapterNumber: number;
  chapterTitle: string;
  onSelectReward: (rewardType: 'manual' | 'equipment' | 'breakthrough_bundle') => void;
  onClose: () => void;
}

export function ChapterRewardModal({
  player,
  chapterNumber,
  chapterTitle,
  onSelectReward,
  onClose,
}: ChapterRewardModalProps) {
  const [selectedReward, setSelectedReward] = useState<'manual' | 'equipment' | 'breakthrough_bundle'>('manual');
  const rootCfg = getSpiritualRootConfig(player.spiritualRoot);

  // Match optimal manual for player's spiritual root
  let recommendedManualName = 'Thanh Phong Kiếm Quyết (Bí Tịch)';
  let recommendedManualDesc = 'Bí tịch kiếm tu chính tông Thanh Vân Tông, tăng 25% Công Kích, mở khóa Vạn Kiếm Quy Tông!';
  if (player.spiritualRoot?.type === 'hoa') {
    recommendedManualName = 'Thuần Dương Chân Hỏa Quyết (Bí Tịch)';
    recommendedManualDesc = 'Bí tịch hỏa tu cương mãnh, tăng 30% Công Kích, mở khóa Viêm Bạo Liệt Địa!';
  } else if (player.spiritualRoot?.type === 'thuy') {
    recommendedManualName = 'Huyền Băng Linh Thủy Quyết (Bí Tịch)';
    recommendedManualDesc = 'Bí tịch thủy tu huyền diệu, tăng 35% Linh Lực và khả năng làm chậm mục tiêu!';
  } else if (player.spiritualRoot?.type === 'moc') {
    recommendedManualName = 'Trường Sinh Quyết Viên Mãn (Bí Tịch)';
    recommendedManualDesc = 'Đạo gia mộc hệ chân kinh, tăng 25% Khí Huyết, kháng độc và hồi máu liên tục!';
  } else if (player.spiritualRoot?.type === 'tho') {
    recommendedManualName = 'Kim Cương Bất Hoại Thân (Bí Tịch)';
    recommendedManualDesc = 'Thể tu thượng thừa, tăng 35% Phòng Ngự và miễn dịch chấn thương!';
  }

  const handleConfirm = () => {
    soundManager.playBreakthrough();
    onSelectReward(selectedReward);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col bg-gradient-to-b from-stone-900 via-stone-950 to-black border-2 border-yellow-500/70 rounded-2xl shadow-2xl shadow-yellow-950/50 p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-hidden">
        {/* Divine Aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-yellow-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative text-center space-y-1 sm:space-y-2 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/50 bg-yellow-950/60 text-yellow-300 text-xs tracking-widest font-semibold uppercase">
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            Viên Mãn Đạo Quả Chương {chapterNumber}
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 font-title tracking-wider">
            KHEN THƯỞNG ĐẠO QUẢ CUỐI CHƯƠNG
          </h2>
          <p className="text-stone-300 text-xs md:text-sm font-medium">
            Đạo hữu đã vượt qua bao sóng gió tại <span className="text-amber-400 font-bold">{chapterTitle}</span>. Hãy chọn một phần thưởng tương xứng!
          </p>
        </div>

        {/* 3 Choices */}
        <div className="flex-1 overflow-y-auto overscroll-contain pr-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option 1: Tailored Manual */}
          <div
            onClick={() => setSelectedReward('manual')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedReward === 'manual'
                ? 'border-yellow-400 bg-yellow-950/30 shadow-lg shadow-yellow-950/40 scale-102'
                : 'border-stone-800 bg-stone-900/60 hover:border-stone-700'
            }`}
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/60 flex items-center justify-center text-xl">
                📜
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/40 text-purple-300 border border-purple-700/50">
                BÍ TỊCH CÔNG PHÁP
              </div>
              <h4 className="font-bold text-sm text-yellow-200">{recommendedManualName}</h4>
              <p className="text-xs text-stone-400 leading-relaxed">{recommendedManualDesc}</p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-400">Tương hợp 100% Linh Căn</span>
              {selectedReward === 'manual' && <Check className="w-4 h-4 text-yellow-400" />}
            </div>
          </div>

          {/* Option 2: Equipment */}
          <div
            onClick={() => setSelectedReward('equipment')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedReward === 'equipment'
                ? 'border-yellow-400 bg-yellow-950/30 shadow-lg shadow-yellow-950/40 scale-102'
                : 'border-stone-800 bg-stone-900/60 hover:border-stone-700'
            }`}
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/60 flex items-center justify-center text-xl">
                ⚔️
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-sky-900/40 text-sky-300 border border-sky-700/50">
                THƯỢNG PHẨM PHÁP BẢO
              </div>
              <h4 className="font-bold text-sm text-sky-200">Thanh Phong Cổ Kiếm +2</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Bảo kiếm tinh luyện từ Thanh Cương Tinh Sa và Huyền Thiết. Tăng +32 Công Kích, +10 Tốc Độ và +6% Bạo Kích!
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-semibold">
              <span className="text-sky-400">Trang Bị Ngay Lập Tức</span>
              {selectedReward === 'equipment' && <Check className="w-4 h-4 text-yellow-400" />}
            </div>
          </div>

          {/* Option 3: Breakthrough Bundle */}
          <div
            onClick={() => setSelectedReward('breakthrough_bundle')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedReward === 'breakthrough_bundle'
                ? 'border-yellow-400 bg-yellow-950/30 shadow-lg shadow-yellow-950/40 scale-102'
                : 'border-stone-800 bg-stone-900/60 hover:border-stone-700'
            }`}
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-xl">
                💊
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/40 text-amber-300 border border-amber-700/50">
                ĐỘT PHÁ TÀI NGUYÊN
              </div>
              <h4 className="font-bold text-sm text-amber-200">Hỗn Nguyên Đột Phá Lễ Bao</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Bao gồm 3x Tụ Khí Đan Cực Phẩm, 1x Trúc Cơ Đan Thượng Phẩm và 150 Linh Thạch tinh khiết giúp phá cảnh thần tốc!
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-semibold">
              <span className="text-amber-400">+150 Linh Thạch & 4 Đan Dược</span>
              {selectedReward === 'breakthrough_bundle' && <Check className="w-4 h-4 text-yellow-400" />}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 shrink-0">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 hover:from-yellow-400 hover:to-amber-300 text-stone-950 font-black text-sm tracking-wide transition shadow-xl hover:scale-101 active:scale-99 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-stone-950" />
            Xác Nhận Lĩnh Nhận Phần Thưởng
          </button>
        </div>
      </div>
    </div>
  );
}
