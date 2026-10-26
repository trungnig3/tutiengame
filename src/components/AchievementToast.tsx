import React from 'react';
import { AchievementDefinition } from '../types/achievements';
import { Trophy, Sparkles, X } from 'lucide-react';

interface AchievementToastProps {
  achievement: AchievementDefinition | null;
  onClose: () => void;
  onClick?: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onClose,
  onClick,
}) => {
  if (!achievement) return null;

  return (
    <div 
      className="fixed bottom-20 right-6 z-50 max-w-sm w-full bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/90 border-2 border-amber-500 rounded-2xl shadow-2xl p-4 text-stone-100 flex items-center justify-between gap-3 animate-slide-in cursor-pointer select-none transition-all hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-amber-950/90 border border-amber-400 flex items-center justify-center text-2xl shadow-inner flex-shrink-0 animate-pulse">
          {achievement.icon || '🏆'}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Thành Tựu Mở Khóa!
          </div>
          <div className="font-bold text-sm text-stone-100 truncate">
            {achievement.name}
          </div>
          <p className="text-[11px] text-stone-300 truncate">
            {achievement.description}
          </p>
        </div>
      </div>

      <button
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
        className="p-1 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
