import React, { useState } from 'react';
import { PlayerStats, Quest } from '../../types/game';
import { INITIAL_QUESTS } from '../../data/quests';
import { ITEMS } from '../../data/items';
import { soundManager } from '../../engine/audio';
import { X, Scroll, CheckCircle2, Clock, Award, Sparkles } from 'lucide-react';

interface QuestsModalProps {
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({
  player,
  onUpdatePlayer,
  onClose,
}) => {
  const [selectedQuestId, setSelectedQuestId] = useState<string>(
    player.activeQuests[0]?.id || 'quest_c1_1'
  );

  const selectedQuest =
    player.activeQuests.find(q => q.id === selectedQuestId) ||
    INITIAL_QUESTS[selectedQuestId];

  const handleClaimReward = (quest: Quest) => {
    // Check all objectives completed
    const allDone = quest.objectives.every(obj => obj.completed || obj.currentCount >= obj.targetCount);
    if (!allDone) return;

    soundManager.playQuestComplete();

    onUpdatePlayer(prev => {
      // Add items
      let updatedInv = [...prev.inventory];
      quest.rewards.items?.forEach(rItem => {
        const item = ITEMS[rItem.itemId];
        if (item) {
          const existing = updatedInv.find(s => s.item.id === item.id);
          if (existing && item.stackable) {
            existing.count += rItem.count;
          } else if (updatedInv.length < prev.maxInventorySize) {
            updatedInv.push({ item, count: rItem.count });
          }
        }
      });

      // Unlock next chapter quest if applicable
      let newActiveQuests = prev.activeQuests.filter(q => q.id !== quest.id);

      // Auto trigger progression
      const questOrder = [
        'quest_c1_1', 'quest_c1_2', 'quest_c1_3', 'quest_c1_4',
        'quest_c2_1', 'quest_c2_2', 'quest_c2_3',
        'quest_c3_1', 'quest_c3_2', 'quest_c3_3',
        'quest_c4_1', 'quest_c4_2',
        'quest_c5_1'
      ];
      const curIdx = questOrder.indexOf(quest.id);
      if (curIdx !== -1 && curIdx < questOrder.length - 1) {
        const nextId = questOrder[curIdx + 1];
        const nextQ = INITIAL_QUESTS[nextId];
        if (nextQ && !prev.completedQuestIds.includes(nextId) && !newActiveQuests.some(q => q.id === nextId)) {
          newActiveQuests.push({ ...nextQ, status: 'active' });
        }
      }

      return {
        ...prev,
        exp: prev.exp + quest.rewards.exp,
        spiritStones: prev.spiritStones + quest.rewards.spiritStones,
        inventory: updatedInv,
        activeQuests: newActiveQuests,
        completedQuestIds: [...prev.completedQuestIds, quest.id],
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-stone-900 border-2 border-amber-600/70 rounded-xl shadow-2xl p-6 text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Scroll className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-amber-300 font-title">
                Hành Trình & Nhiệm Vụ Tu Tiên
              </h2>
              <p className="text-xs text-stone-400">Ghi chép cơ duyên, mối ân oán và con đường nghịch mệnh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* LEFT: QUEST LIST */}
          <div className="space-y-3 bg-stone-950/70 border border-stone-800 p-4 rounded-lg">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Nhiệm Vụ Đang Thực Hiện ({player.activeQuests.length})
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {player.activeQuests.map(quest => {
                const isSelected = selectedQuestId === quest.id;
                const isReady = quest.objectives.every(o => o.completed || o.currentCount >= o.targetCount);

                return (
                  <div
                    key={quest.id}
                    onClick={() => setSelectedQuestId(quest.id)}
                    className={`p-3 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/30 shadow'
                        : 'border-stone-800 bg-stone-900 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-stone-200 text-xs">
                        [Chương {quest.chapter}] {quest.title}
                      </span>
                      {isReady && (
                        <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold animate-pulse">
                          Hoàn thành
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400 line-clamp-1">
                      {quest.description}
                    </div>
                  </div>
                );
              })}

              {/* Completed Quests section */}
              {player.completedQuestIds.length > 0 && (
                <div className="pt-3 border-t border-stone-800">
                  <div className="text-[11px] font-bold text-stone-500 mb-2">
                    Đã Hoàn Thành ({player.completedQuestIds.length})
                  </div>
                  {player.completedQuestIds.map(qId => {
                    const q = INITIAL_QUESTS[qId];
                    if (!q) return null;
                    return (
                      <div
                        key={qId}
                        onClick={() => setSelectedQuestId(qId)}
                        className="p-2 rounded bg-stone-950/40 border border-stone-800/60 text-stone-500 text-xs flex items-center justify-between cursor-pointer mb-1"
                      >
                        <span className="line-through">{q.title}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: QUEST DETAILS */}
          <div className="space-y-3 bg-stone-950/70 border border-stone-800 p-4 rounded-lg flex flex-col justify-between">
            {selectedQuest ? (
              <div className="space-y-3">
                <div className="border-b border-stone-800 pb-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-bold">
                    Chương {selectedQuest.chapter} - Chính Tuyến
                  </span>
                  <h4 className="font-bold text-amber-300 text-sm mt-1">{selectedQuest.title}</h4>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed italic">
                  "{selectedQuest.description}"
                </p>

                {/* Objectives */}
                <div className="space-y-2 bg-stone-900 p-3 rounded border border-stone-800">
                  <span className="text-xs font-semibold text-emerald-400">Mục Tiêu Cần Đạt:</span>
                  <div className="space-y-1.5 text-xs text-stone-200">
                    {selectedQuest.objectives.map(obj => {
                      const done = obj.completed || obj.currentCount >= obj.targetCount;
                      return (
                        <div key={obj.id} className="flex items-center justify-between">
                          <span className={done ? 'text-emerald-400 font-medium' : 'text-stone-300'}>
                            {done ? '✓ ' : '○ '} {obj.text}
                          </span>
                          {obj.targetCount > 1 && (
                            <span className="text-amber-400 font-mono text-[11px]">
                              {obj.currentCount}/{obj.targetCount}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rewards */}
                <div className="p-2.5 rounded bg-amber-950/30 border border-amber-900/50 text-xs space-y-1">
                  <span className="font-semibold text-amber-300">Phần Thưởng:</span>
                  <div className="flex gap-4 text-stone-300">
                    <span>⚡ +{selectedQuest.rewards.exp} Tu Vi</span>
                    <span>💎 +{selectedQuest.rewards.spiritStones} Linh Thạch</span>
                  </div>
                  {selectedQuest.rewards.items && (
                    <div className="text-[11px] text-amber-400 mt-1">
                      Vật phẩm: {selectedQuest.rewards.items.map(i => `${ITEMS[i.itemId]?.name || i.itemId} x${i.count}`).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-stone-500 py-12">
                Chọn nhiệm vụ để xem diễn biến
              </div>
            )}

            {/* Claim button if active & done */}
            {selectedQuest && player.activeQuests.some(q => q.id === selectedQuest.id) && (
              <button
                onClick={() => handleClaimReward(selectedQuest)}
                disabled={!selectedQuest.objectives.every(o => o.completed || o.currentCount >= o.targetCount)}
                className={`w-full py-2.5 rounded-lg text-xs font-bold transition ${
                  selectedQuest.objectives.every(o => o.completed || o.currentCount >= o.targetCount)
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg animate-pulse'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                {selectedQuest.objectives.every(o => o.completed || o.currentCount >= o.targetCount)
                  ? '🎁 NHẬN THƯỞNG & HOÀN THÀNH NHIỆM VỤ'
                  : 'Chưa Hoàn Thành Tất Cả Mục Tiêu'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
