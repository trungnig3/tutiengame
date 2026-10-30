import React, { useState, useEffect } from 'react';
import { PlayerStats, NPC } from '../../types/game';
import { NPCS } from '../../data/maps';
import { INITIAL_QUESTS } from '../../data/quests';
import { ITEMS } from '../../data/items';
import { SECT_RANK_DETAILS, SECT_RANKS_ORDER } from '../../data/factions';
import { soundManager } from '../../engine/audio';
import { recordEvent } from '../../engine/achievementEngine';
import { X, MessageSquare, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface DialogueModalProps {
  npcId: string;
  player: PlayerStats;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onClose: () => void;
  onOpenShop: (npc: NPC) => void;
  onOpenAlchemy: () => void;
  onOpenForging: () => void;
  onOpenPavilion?: () => void;
  onOpenWarRoom?: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npcId,
  player,
  onUpdatePlayer,
  onClose,
  onOpenShop,
  onOpenAlchemy,
  onOpenForging,
  onOpenPavilion,
  onOpenWarRoom,
}) => {
  const npc = NPCS[npcId];
  const [currentNodeId, setCurrentNodeId] = useState<string>(npc ? npc.dialogueRootId : 'root');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Auto-advance active quest objectives of type 'talk'
  useEffect(() => {
    onUpdatePlayer(prev => {
      let hasUpdate = false;
      const updatedQuests = prev.activeQuests.map(q => {
        let questUpdated = false;
        const updatedObjs = q.objectives.map(obj => {
          if (
            obj.type === 'talk' &&
            !obj.completed &&
            (!obj.targetId ||
              obj.targetId === npcId ||
              (npc && npc.name.toLowerCase().includes(obj.targetId.toLowerCase())))
          ) {
            hasUpdate = true;
            questUpdated = true;
            return {
              ...obj,
              currentCount: obj.targetCount,
              completed: true,
            };
          }
          return obj;
        });
        return questUpdated ? { ...q, objectives: updatedObjs } : q;
      });

      return hasUpdate ? { ...prev, activeQuests: updatedQuests } : prev;
    });
  }, [npcId, onUpdatePlayer]);

  if (!npc) return null;

  const currentNode = npc.dialogues[currentNodeId] || npc.dialogues[npc.dialogueRootId];

  const handleChoiceClick = (choice: any) => {
    soundManager.playCollect();

    // 1. Join Sect (Thanh Vân Tông)
    if (choice.action === 'join_sect') {
      soundManager.playBreakthrough();
      onUpdatePlayer(prev => {
        const nextRep = { ...prev.factionReputation };
        nextRep.thanh_van_tong = Math.max(30, (nextRep.thanh_van_tong || 0) + 30);
        return {
          ...prev,
          sectId: 'thanh_van_tong',
          sectRank: 'outer',
          storyFlags: { ...prev.storyFlags, sectChoice: 'thanh_van_tong' },
          factionReputation: nextRep,
        };
      });
      setFeedback('Chúc mừng! Ngươi đã chính thức bái nhập Thanh Vân Tiên Tông, nhận danh hiệu Ngoại Môn Đệ Tử!');
    }

    // 2. Reject Sect / Choose Rogue Path
    else if (choice.action === 'reject_sect') {
      onUpdatePlayer(prev => {
        const nextRep = { ...prev.factionReputation };
        nextRep.tan_tu_lien_minh = (nextRep.tan_tu_lien_minh || 0) + 25;
        return {
          ...prev,
          sectId: 'tan_tu',
          sectRank: 'visitor',
          storyFlags: { ...prev.storyFlags, sectChoice: 'tan_tu' },
          factionReputation: nextRep,
        };
      });
      setFeedback('Ngươi đã chọn con đường Độc Hành Tán Tu! Danh vọng Liên Minh Tán Tu tăng lên.');
    }

    // 3. Promote Sect Rank
    else if (choice.action === 'promote_sect_rank') {
      const currentRankIdx = SECT_RANKS_ORDER.indexOf(player.sectRank);
      if (currentRankIdx >= 0 && currentRankIdx < SECT_RANKS_ORDER.length - 1) {
        const nextRank = SECT_RANKS_ORDER[currentRankIdx + 1];
        const req = SECT_RANK_DETAILS[nextRank];

        if (player.realmIndex >= req.minRealmIndex && (player.contributionPoints || 0) >= req.minContribution) {
          soundManager.playBreakthrough();
          onUpdatePlayer(prev => ({
            ...prev,
            sectRank: nextRank,
            atk: prev.atk + req.bonusStats.atk,
            def: prev.def + req.bonusStats.def,
            maxHp: prev.maxHp + req.bonusStats.maxHp,
            hp: prev.hp + req.bonusStats.maxHp,
          }));
          setFeedback(`Tấn thăng thành công! Ngươi hiện là [${req.name}], nhận thêm chiến lực môn phái!`);
        } else {
          setFeedback(`Chưa đủ điều kiện! Cần Cảnh giới tối thiểu [${req.minRealmIndex}] và [${req.minContribution}] Điểm Cống Hiến.`);
        }
      }
    }

    // 4. Accept Quest
    else if (choice.action === 'accept_quest' && choice.actionPayload) {
      const q = INITIAL_QUESTS[choice.actionPayload];
      if (q) {
        onUpdatePlayer(prev => {
          if (prev.activeQuests.some(item => item.id === q.id) || prev.completedQuestIds.includes(q.id)) {
            return prev;
          }
          return {
            ...prev,
            activeQuests: [...prev.activeQuests, { ...q, status: 'active' }],
          };
        });
        setFeedback(`Đã nhận nhiệm vụ: [${q.title}]! Nhấn phím [J] để theo dõi tiến độ.`);
      }
    } 
    
    // 5. Complete Quest
    else if (choice.action === 'complete_quest' && choice.actionPayload) {
      const q = INITIAL_QUESTS[choice.actionPayload];
      if (q) {
        soundManager.playQuestComplete();
        onUpdatePlayer(prev => {
          const nextRep = { ...prev.factionReputation };
          if (q.rewards.factionId && q.rewards.reputation) {
            nextRep[q.rewards.factionId] = (nextRep[q.rewards.factionId] || 0) + q.rewards.reputation;
          }

          let nextInv = [...prev.inventory];
          if (q.rewards.items) {
            q.rewards.items.forEach(rew => {
              const it = ITEMS[rew.itemId];
              if (it) {
                const existing = nextInv.find(s => s.item.id === it.id);
                if (existing && it.stackable) {
                  existing.count += rew.count;
                } else if (nextInv.length < prev.maxInventorySize) {
                  nextInv.push({ item: it, count: rew.count });
                }
              }
            });
          }

          let newActiveQuests = prev.activeQuests.filter(item => item.id !== q.id);
          const questOrder = [
            'quest_c1_1', 'quest_c1_2', 'quest_c1_3', 'quest_c1_4',
            'quest_c2_1', 'quest_c2_2', 'quest_c2_3',
            'quest_c3_1', 'quest_c3_2', 'quest_c3_3',
            'quest_c4_1', 'quest_c4_2',
            'quest_c5_1'
          ];
          const curIdx = questOrder.indexOf(q.id);
          if (curIdx !== -1 && curIdx < questOrder.length - 1) {
            const nextId = questOrder[curIdx + 1];
            const nextQ = INITIAL_QUESTS[nextId];
            if (nextQ && !prev.completedQuestIds.includes(nextId) && !newActiveQuests.some(item => item.id === nextId)) {
              newActiveQuests.push({ ...nextQ, status: 'active' });
            }
          }

          const updated = {
            ...prev,
            activeQuests: newActiveQuests,
            completedQuestIds: prev.completedQuestIds.includes(q.id) ? prev.completedQuestIds : [...prev.completedQuestIds, q.id],
            exp: prev.exp + q.rewards.exp,
            spiritStones: prev.spiritStones + q.rewards.spiritStones,
            contributionPoints: (prev.contributionPoints || 0) + (q.rewards.contributionPoints || 0),
            factionReputation: nextRep,
            inventory: nextInv,
          };
          return recordEvent(updated, {
            type: 'finish_quest',
            payload: { questId: q.id },
          });
        });
        setFeedback(`Hoàn thành nhiệm vụ [${q.title}]! Nhận +${q.rewards.spiritStones} Linh thạch, +${q.rewards.contributionPoints || 0} Cống hiến!`);
      }
    } 
    
    // 6. Special UI Modals
    else if (choice.action === 'open_shop') {
      onClose();
      onOpenShop(npc);
      return;
    } else if (choice.action === 'open_alchemy') {
      onClose();
      onOpenAlchemy();
      return;
    } else if (choice.action === 'open_forging') {
      onClose();
      onOpenForging();
      return;
    } else if (choice.action === 'open_pavilion') {
      onClose();
      if (onOpenPavilion) onOpenPavilion();
      return;
    } else if (choice.action === 'open_war_room') {
      onClose();
      if (onOpenWarRoom) onOpenWarRoom();
      return;
    } else if (choice.action === 'heal_full') {
      soundManager.playCollect();
      onUpdatePlayer(prev => ({
        ...prev,
        hp: prev.maxHp,
        mp: prev.maxMp,
      }));
      setFeedback('🌿 Tiên Y Bách Thảo Cốc thi triển Mộc Linh Bí Thuật! Toàn bộ Khí Huyết và Linh Lực của đạo hữu đã hồi phục hoàn toàn.');
    } else if (choice.action === 'join_hac_phong') {
      soundManager.playDash();
      onUpdatePlayer(prev => {
        const nextRep = { ...prev.factionReputation };
        nextRep.hac_phong_mon = (nextRep.hac_phong_mon || 0) + 60;
        nextRep.thanh_van_tong = (nextRep.thanh_van_tong || 0) - 50;
        const currentWar = prev.warState || {
          stage: 'tension',
          thanhVanPoints: 100,
          hacPhongPoints: 100,
          playerStance: 'hac_phong',
          battleVictories: 0,
          lastEventDay: 1,
        };
        return {
          ...prev,
          sectId: 'hac_phong_mon',
          factionReputation: nextRep,
          warState: {
            ...currentWar,
            playerStance: 'hac_phong',
          },
        };
      });
      setFeedback('🩸 Đã đầu quân Hắc Phong Môn! Giờ đây đạo hữu là minh hữu của Ma Đạo, nhận được sự kính sợ và tiếp tế ma khí!');
    } else if (choice.action === 'set_stance' && choice.actionPayload) {
      soundManager.playDash();
      const targetStance = choice.actionPayload as any;
      onUpdatePlayer(prev => {
        const currentWar = prev.warState || {
          stage: 'tension',
          thanhVanPoints: 100,
          hacPhongPoints: 100,
          playerStance: targetStance,
          battleVictories: 0,
          lastEventDay: 1,
        };
        return {
          ...prev,
          warState: {
            ...currentWar,
            playerStance: targetStance,
          },
        };
      });
      setFeedback(`Đã chuyển đổi lập trường chiến tranh sang: [${choice.actionPayload}]!`);
    }

    if (choice.nextDialogueId && npc.dialogues[choice.nextDialogueId]) {
      setCurrentNodeId(choice.nextDialogueId);
    } else {
      if (!choice.action) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-2 pb-3 sm:p-6 sm:pb-8 select-none">
      <div className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto bg-stone-900/95 border-2 border-amber-600/70 rounded-2xl shadow-2xl p-3 sm:p-5 text-stone-100 flex flex-col gap-2.5 sm:gap-4">
        {/* Header: NPC Avatar & Title */}
        <div className="flex justify-between items-start border-b border-amber-800/50 pb-3">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950/40 flex flex-col items-center justify-center shadow-inner">
              <span className="font-serif font-black text-amber-300 text-2xl leading-none">
                {npc.id.includes('dan_su') ? '丹' :
                 npc.id.includes('tho_ren') || npc.id.includes('ren_su') ? '器' :
                 npc.id.includes('thuong_nhan') || npc.id.includes('tham_van_kim') ? '商' :
                 npc.id.includes('chuong_mon') || npc.id.includes('truong_lao') ? '宗' :
                 npc.id.includes('mac_lao') ? '墨' :
                 npc.id.includes('hac_phong') ? '魔' : '道'}
              </span>
              <span className="text-[8px] text-amber-400/80 font-mono tracking-tighter">TIÊN NHÂN</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-amber-300 font-title">{npc.name}</h3>
                <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-700/60 px-2 py-0.5 rounded font-semibold">
                  {npc.faction}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">{npc.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert if any */}
        {feedback && (
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            {feedback}
          </div>
        )}

        {/* NPC Dialogue Text */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 text-stone-200 text-sm leading-relaxed min-h-20 flex items-center italic">
          "{currentNode.npcText}"
        </div>

        {/* Dialogue Choices */}
        <div className="space-y-2">
          {currentNode.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => handleChoiceClick(choice)}
              className="w-full text-left p-3 rounded-xl bg-stone-800/80 hover:bg-amber-950/60 border border-stone-700 hover:border-amber-500/80 text-xs font-semibold text-stone-200 hover:text-amber-200 transition flex items-center justify-between group cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-stone-900 border border-stone-600 flex items-center justify-center text-[10px] text-amber-400 group-hover:border-amber-400">
                  {idx + 1}
                </span>
                {choice.text}
              </span>
              <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-300 transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
