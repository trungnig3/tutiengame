/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerStats, NPC, Portal, CollectibleResource, Item, RealmInfo } from './types/game';
import { createInitialPlayer } from './data/initialPlayer';
import { SaveManager } from './engine/saveManager';
import { soundManager } from './engine/audio';
import { GameCanvas } from './components/GameCanvas';
import { GameCanvas3D } from './components/GameCanvas3D';
import { HUD } from './components/HUD';
import { CharacterModal } from './components/modals/CharacterModal';
import { CultivationModal } from './components/modals/CultivationModal';
import { InventoryModal } from './components/modals/InventoryModal';
import { QuestsModal } from './components/modals/QuestsModal';
import { WorldMapModal } from './components/modals/WorldMapModal';
import { AlchemyModal } from './components/modals/AlchemyModal';
import { ForgingModal } from './components/modals/ForgingModal';
import { DialogueModal } from './components/modals/DialogueModal';
import { ShopModal } from './components/modals/ShopModal';
import { PavilionModal } from './components/modals/PavilionModal';
import { DungeonGateModal } from './components/modals/DungeonGateModal';
import { SteleModal } from './components/modals/SteleModal';
import { TribulationModal } from './components/modals/TribulationModal';
import { SectWarModal } from './components/modals/SectWarModal';
import { MenuModal } from './components/modals/MenuModal';
import { DeathModal } from './components/modals/DeathModal';
import { AchievementsModal } from './components/modals/AchievementsModal';
import { BossLootModal, BossLootData } from './components/modals/BossLootModal';
import { ChapterRewardModal } from './components/modals/ChapterRewardModal';
import { MobileInstallModal } from './components/modals/MobileInstallModal';
import { AchievementToast } from './components/AchievementToast';
import { TouchControls } from './components/TouchControls';
import { inputManager } from './engine/inputManager';
import { AchievementDefinition } from './types/achievements';
import { checkAllAchievements, recordEvent } from './engine/achievementEngine';
import { ITEMS } from './data/items';
import confetti from 'canvas-confetti';
import { Play, BookOpen, Volume2, Sparkles, Compass, Smartphone } from 'lucide-react';

export default function App() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasSave, setHasSave] = useState<boolean>(false);
  const [player, setPlayer] = useState<PlayerStats>(() => {
    const autoSave = SaveManager.loadGame('auto');
    if (autoSave && autoSave.playerStats) {
      return autoSave.playerStats;
    }
    return createInitialPlayer();
  });
  const [activeModal, setActiveModal] = useState<
    'character' | 'cultivation' | 'inventory' | 'quests' | 'map' | 'alchemy' | 'forging' | 'menu' | 'pavilion' | 'war_room' | 'achievements' | null
  >(null);
  const [renderMode, setRenderMode] = useState<'3d' | '2d'>('2d');
  const [bossLootData, setBossLootData] = useState<BossLootData | null>(null);
  const [chapterRewardModal, setChapterRewardModal] = useState<{
    chapterNumber: number;
    chapterTitle: string;
  } | null>(null);
  const [achievementsDefaultTab, setAchievementsDefaultTab] = useState<'achievements' | 'titles' | 'collection'>('achievements');
  const [activeToastAchievement, setActiveToastAchievement] = useState<AchievementDefinition | null>(null);
  const [dialogueNpcId, setDialogueNpcId] = useState<string | null>(null);
  const [shopNpc, setShopNpc] = useState<NPC | null>(null);
  const [dungeonGatePortal, setDungeonGatePortal] = useState<Portal | null>(null);
  const [activeSteleResource, setActiveSteleResource] = useState<CollectibleResource | null>(null);
  const [activeTribulation, setActiveTribulation] = useState<{
    targetRealm: RealmInfo;
    selectedPill: Item | null;
  } | null>(null);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [isTouchControlsVisible, setIsTouchControlsVisible] = useState<boolean>(false);
  const [isInteractionNear, setIsInteractionNear] = useState<boolean>(false);
  const [isMobileInstallOpen, setIsMobileInstallOpen] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [showRotateNotice, setShowRotateNotice] = useState<boolean>(true);

  // Auto-detect mobile touch support and orientation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasTouch = 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0) || window.innerWidth <= 840;
    setIsTouchControlsVisible(hasTouch);
    if (hasTouch) {
      inputManager.setDeviceMode('touch');
    }

    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth <= 840;
      setIsPortrait(portrait);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleToggleTouchControls = useCallback(() => {
    setIsTouchControlsVisible(prev => {
      const next = !prev;
      inputManager.setDeviceMode(next ? 'touch' : 'desktop');
      return next;
    });
  }, []);

  // Check initial saves on mount
  useEffect(() => {
    const autoSave = SaveManager.loadGame('auto');
    if (autoSave && autoSave.playerStats) {
      setHasSave(true);
    }
  }, []);

  // Periodic Auto-Save every 45s while playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      SaveManager.saveGame('auto', player, 'Tự động lưu');
    }, 45000);
    return () => clearInterval(interval);
  }, [isPlaying, player]);

  // Notification handler for achievement unlock
  const handleNotifyAchievement = useCallback((ach: AchievementDefinition) => {
    setActiveToastAchievement(ach);
    soundManager.playQuestComplete();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.85, y: 0.85 },
        colors: ['#eab308', '#38bdf8', '#a855f7'],
      });
    } catch (e) {}
  }, []);

  // Synchronize Quest Objectives & Achievements when player state changes
  const updatePlayerWithQuestChecks = useCallback((updater: (prev: PlayerStats) => PlayerStats) => {
    setPlayer(prev => {
      const next = updater(prev);

      // Only run quests & achievement checks if meaningful stats changed!
      const questsOrAchievementsMayChange =
        next.exp !== prev.exp ||
        next.realmIndex !== prev.realmIndex ||
        next.spiritStones !== prev.spiritStones ||
        next.inventory !== prev.inventory ||
        next.activeQuests !== prev.activeQuests ||
        next.completedQuestIds !== prev.completedQuestIds;

      if (!questsOrAchievementsMayChange) {
        return next;
      }

      // Check breakthrough objectives
      if (next.realmIndex !== prev.realmIndex) {
        next.activeQuests = next.activeQuests.map(q => {
          let updatedObjectives = q.objectives.map(obj => {
            if (obj.type === 'breakthrough' && !obj.completed) {
              return { ...obj, currentCount: 1, completed: true };
            }
            return obj;
          });
          return { ...q, objectives: updatedObjectives };
        });
      }

      // Check gather items objectives against inventory counts
      if (next.inventory !== prev.inventory) {
        next.activeQuests = next.activeQuests.map(q => {
          let updatedObjectives = q.objectives.map(obj => {
            if (obj.type === 'gather' && obj.targetId) {
              const slot = next.inventory.find(s => s.item.id === obj.targetId);
              const count = slot?.count || 0;
              return {
                ...obj,
                currentCount: Math.min(obj.targetCount, count),
                completed: count >= obj.targetCount,
              };
            }
            return obj;
          });
          return { ...q, objectives: updatedObjectives };
        });
      }

      // Synchronize Achievement checks
      const { updatedPlayer } = checkAllAchievements(next, handleNotifyAchievement);
      return updatedPlayer;
    });
  }, [handleNotifyAchievement]);

  // Handle enemy kill quest progression & combat achievements
  const handleEnemyKilled = useCallback((enemyId: string) => {
    setPlayer(prev => {
      let updatedQuests = prev.activeQuests.map(q => {
        let updatedObjectives = q.objectives.map(obj => {
          if (obj.type === 'kill') {
            // Check if matches target keyword
            const isMatch =
              (obj.targetId === 'enemy_wolf' && enemyId.toLowerCase().includes('lang')) ||
              (obj.targetId === 'enemy_boar' && (enemyId.toLowerCase().includes('trư') || enemyId.toLowerCase().includes('boar'))) ||
              (obj.targetId === 'enemy_monkey' && (enemyId.toLowerCase().includes('hầu') || enemyId.toLowerCase().includes('monkey'))) ||
              (obj.targetId === 'enemy_cultist' && (enemyId.toLowerCase().includes('ma đồ') || enemyId.toLowerCase().includes('cultist') || enemyId.toLowerCase().includes('tà tu'))) ||
              (obj.targetId === 'boss_scorpion_king' && enemyId.toLowerCase().includes('hạt vương')) ||
              (obj.targetId === 'boss_corpse_emperor' && enemyId.toLowerCase().includes('ma tôn')) ||
              (obj.targetId === 'Hắc Phong Quỷ Lang' && enemyId.toLowerCase().includes('quỷ lang')) ||
              (obj.targetId === 'Hắc Huyết Viên Vương' && enemyId.toLowerCase().includes('viên vương')) ||
              (obj.targetId ? enemyId.toLowerCase().includes(obj.targetId.toLowerCase()) : false) ||
              obj.targetId === enemyId;

            if (isMatch && !obj.completed) {
              const newCount = obj.currentCount + 1;
              return {
                ...obj,
                currentCount: newCount,
                completed: newCount >= obj.targetCount,
              };
            }
          }
          return obj;
        });
        return { ...q, objectives: updatedObjectives };
      });

      const withQuests: PlayerStats = {
        ...prev,
        activeQuests: updatedQuests,
      };

      const isBoss = enemyId.toLowerCase().includes('vương') ||
        enemyId.toLowerCase().includes('tôn') ||
        enemyId.toLowerCase().includes('mãng') ||
        enemyId.toLowerCase().includes('boss');

      return recordEvent(withQuests, {
        type: 'kill_enemy',
        payload: { enemyId, isBoss },
      }, handleNotifyAchievement);
    });
  }, [handleNotifyAchievement]);

  const handleStartNewGame = () => {
    soundManager.playCollect();
    const newPlayer = createInitialPlayer();
    setPlayer(newPlayer);
    SaveManager.saveGame('auto', newPlayer, 'Khởi đầu con đường mới');
    setIsPlaying(true);
    soundManager.startMusic('peaceful');
  };

  const handleClaimBossLoot = (loot: BossLootData) => {
    soundManager.playCollect();
    setPlayer(prev => {
      let updatedInv = [...prev.inventory];
      loot.items.forEach(({ item, count }) => {
        const existing = updatedInv.find(s => s.item.id === item.id);
        if (existing && item.stackable) {
          existing.count += count;
        } else if (updatedInv.length < prev.maxInventorySize) {
          updatedInv.push({ item, count });
        }
      });

      const isFirstKill = !prev.storyFlags[`boss_first_kill_${loot.bossId}`];
      let firstKillStones = 0;
      let firstKillExp = 0;
      if (isFirstKill) {
        firstKillStones = Math.floor(loot.spiritStones * 0.5);
        firstKillExp = Math.floor(loot.exp * 0.5);
        // Guaranteed bonus breakthrough pill for first kill
        const bonusPill = ITEMS.tu_khi_dan;
        if (bonusPill) {
          const ex = updatedInv.find(s => s.item.id === bonusPill.id);
          if (ex) ex.count += 2;
          else if (updatedInv.length < prev.maxInventorySize) {
            updatedInv.push({ item: bonusPill, count: 2 });
          }
        }
      }

      const updated = {
        ...prev,
        exp: prev.exp + loot.exp + firstKillExp,
        spiritStones: prev.spiritStones + loot.spiritStones + firstKillStones,
        inventory: updatedInv,
        storyFlags: {
          ...prev.storyFlags,
          [`boss_cleared_${loot.bossId}`]: true,
          [`boss_first_kill_${loot.bossId}`]: true,
        },
      };

      SaveManager.saveGame('auto', updated, `Trảm Sát: ${loot.bossName}`);
      return updated;
    });

    // Check if defeat triggers chapter milestone reward (e.g. Boar King in Thanh Khê or Ancient Ruins Boss)
    const nameAndId = `${loot.bossId} ${loot.bossName}`.toLowerCase();
    const isChapter1Boss = nameAndId.includes('trư') || nameAndId.includes('boar');
    const isChapter2Boss = nameAndId.includes('hạt') || nameAndId.includes('scorpion') || nameAndId.includes('viên vương') || nameAndId.includes('tôn') || nameAndId.includes('huyết');

    if (isChapter1Boss && !player.storyFlags['chapter_1_completed']) {
      setChapterRewardModal({
        chapterNumber: 1,
        chapterTitle: 'Thanh Khê Khởi Đạo',
      });
    } else if (isChapter2Boss && !player.storyFlags['chapter_2_completed']) {
      setChapterRewardModal({
        chapterNumber: 2,
        chapterTitle: 'Bí Cảnh Thượng Cổ',
      });
    }
  };

  const handleSelectChapterReward = (rewardType: 'manual' | 'equipment' | 'breakthrough_bundle') => {
    soundManager.playBreakthrough();
    setPlayer(prev => {
      let updatedInv = [...prev.inventory];
      const rootType = prev.spiritualRoot?.type;

      if (rewardType === 'manual') {
        const manualItem: Item = {
          id: `manual_chapter_${rootType}`,
          name: rootType === 'hoa' ? 'Thuần Dương Chân Hỏa Quyết'
            : rootType === 'thuy' ? 'Huyền Băng Linh Thủy Quyết'
            : rootType === 'moc' ? 'Trường Sinh Quyết Viên Mãn'
            : rootType === 'tho' ? 'Kim Cương Bất Hoại Thân'
            : rootType === 'loi' ? 'Cửu Thiên Dẫn Lôi Chân Quyết'
            : (rootType as string) === 'bang' ? 'Hàn Sương Kiếm Quyết'
            : (rootType as string) === 'phong' ? 'Ngự Phong Tiên Quyết'
            : 'Thanh Phong Kiếm Quyết (Bí Tịch)',
          type: 'manual',
          rarity: 'huyen',
          price: 600,
          description: 'Bí điển công pháp cổ truyền tương hợp linh căn đắc lực.',
          icon: '📜',
          stackable: false,
        };
        if (updatedInv.length < prev.maxInventorySize) {
          updatedInv.push({ item: manualItem, count: 1 });
        }
      } else if (rewardType === 'equipment') {
        const weaponItem = ITEMS.han_bang_kiem || ITEMS.thanh_phong_kiem || {
          id: 'weapon_chapter_reward',
          name: 'Huyền Thiết Trảm Ma Kiếm',
          type: 'weapon' as const,
          rarity: 'huyen' as const,
          price: 650,
          description: 'Bảo kiếm thượng phẩm tôi luyện từ huyền thiết cổ.',
          icon: '⚔️',
          stackable: false,
          stats: { atk: 35, critRate: 0.12 },
        };
        if (updatedInv.length < prev.maxInventorySize) {
          updatedInv.push({ item: weaponItem, count: 1 });
        }
      } else {
        const pillItem = ITEMS.truc_co_dan || ITEMS.boi_nguyen_dan;
        if (pillItem && updatedInv.length < prev.maxInventorySize) {
          const existing = updatedInv.find(s => s.item.id === pillItem.id);
          if (existing) existing.count += 2;
          else updatedInv.push({ item: pillItem, count: 2 });
        }
      }

      const chapterKey = chapterRewardModal ? `chapter_${chapterRewardModal.chapterNumber}_completed` : 'chapter_1_completed';
      const updated = {
        ...prev,
        inventory: updatedInv,
        spiritStones: prev.spiritStones + 300,
        exp: prev.exp + 600,
        storyFlags: {
          ...prev.storyFlags,
          [chapterKey]: true,
        },
      };
      SaveManager.saveGame('auto', updated, 'Nhận thưởng vượt chương');
      return updated;
    });

    setChapterRewardModal(null);
  };

  const handleContinueGame = () => {
    const autoSave = SaveManager.loadGame('auto');
    if (autoSave && autoSave.playerStats) {
      soundManager.playCollect();
      setPlayer(autoSave.playerStats);
      setIsPlaying(true);
      soundManager.startMusic('peaceful');
    } else {
      handleStartNewGame();
    }
  };

  const handleRevive = () => {
    soundManager.playBreakthrough();
    setPlayer(prev => ({
      ...prev,
      hp: Math.floor(prev.maxHp * 0.7),
      mp: Math.floor(prev.maxMp * 0.7),
      currentMapId: 'map_thanh_khe',
      x: 380,
      y: 430,
    }));
  };

  const handleLoadAutoSave = () => {
    const autoSave = SaveManager.loadGame('auto');
    if (autoSave && autoSave.playerStats) {
      soundManager.playCollect();
      setPlayer(autoSave.playerStats);
    } else {
      handleRevive();
    }
  };

  const handleToggleMusic = () => {
    const next = soundManager.toggleMusic();
    setMusicEnabled(next);
  };

  return (
    <div className="relative w-screen h-screen bg-stone-950 text-stone-100 overflow-hidden font-sans">
      {/* === TITLE SCREEN / MAIN MENU === */}
      {!isPlaying ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-radial from-stone-900 via-stone-950 to-black select-none">
          {/* Subtle mist effect background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(217,119,6,0.08)_0%,_transparent_70%)] pointer-events-none" />

          <div className="relative z-10 max-w-xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-600/40 bg-amber-950/40 text-amber-300 text-xs tracking-widest font-semibold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Cultivation Action RPG Tiên Hiệp
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 font-title tracking-wider drop-shadow-xl">
                PHÀM TRẦN TIÊN LỘ
              </h1>
              <h2 className="text-lg md:text-xl font-bold text-amber-500/90 tracking-widest uppercase">
                – Con Đường Nghịch Mệnh –
              </h2>
            </div>

            <p className="text-stone-300 text-xs md:text-sm leading-relaxed max-w-lg mx-auto italic font-serif">
              "Phàm nhân xuất thân Thanh Khê thôn, tay nắm Cổ Ngũ Hành Ngọc Đồng. Giữa chốn Tu Tiên Giới tàn khốc đầy rẫy tranh đoạt sát cơ, cẩn trọng sinh tồn, phá giải phong ấn thượng cổ, nghịch thiên cải mệnh đúc thành Tiên Thiên Đạo Cơ!"
            </p>

            {/* Menu Buttons */}
            <div className="space-y-3 pt-4 max-w-xs mx-auto">
              {hasSave && (
                <button
                  onClick={handleContinueGame}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-bold text-sm tracking-wide transition shadow-xl hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-stone-950" />
                  Tiếp Tục Đạo Quả (Bản Lưu)
                </button>
              )}

              <button
                onClick={handleStartNewGame}
                className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition shadow-xl hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
                  hasSave
                    ? 'bg-stone-900 border border-amber-700/60 hover:bg-stone-800 text-amber-200'
                    : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950'
                }`}
              >
                <Compass className="w-4 h-4" />
                Khởi Đầu Con Đường Tiên Lộ
              </button>

              <button
                onClick={() => setIsMobileInstallOpen(true)}
                className="w-full py-2.5 rounded-xl bg-stone-900/90 border border-amber-600/60 hover:border-amber-400 text-amber-300 font-bold text-xs tracking-wide transition shadow-lg hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                📱 Tải & Cài Đặt Game Về Điện Thoại
              </button>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleToggleMusic}
                  className="px-4 py-1.5 rounded-full bg-stone-900/80 border border-stone-800 text-stone-400 hover:text-amber-300 text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Âm Nhạc Cổ Phong: {musicEnabled ? 'Bật' : 'Tắt'}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-stone-500 pt-6">
              Điều khiển: WASD Di chuyển | Chuột trái Đánh | Chuột phải Né đòn | Q, E, R, F Kỹ năng | Space Tương tác
            </div>
          </div>
        </div>
      ) : (
        /* === ACTIVE GAMEPLAY VIEW === */
        <div className="relative w-full h-full">
          {/* Dual Engine: Stylized 3D 2.5D Renderer (Thanh Khê Thôn Vertical Slice) or 2D Canvas */}
          {renderMode === '3d' ? (
            <GameCanvas3D
              player={player}
              isPaused={
                activeModal !== null ||
                dialogueNpcId !== null ||
                shopNpc !== null ||
                dungeonGatePortal !== null ||
                activeSteleResource !== null ||
                activeTribulation !== null ||
                bossLootData !== null ||
                chapterRewardModal !== null ||
                player.hp <= 0
              }
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onOpenDialogue={npcId => setDialogueNpcId(npcId)}
              onEnemyKilled={handleEnemyKilled}
              onOpenInventory={() => setActiveModal('inventory')}
              onOpenCharacter={() => setActiveModal('character')}
              onOpenCultivation={() => setActiveModal('cultivation')}
              onOpenQuests={() => setActiveModal('quests')}
              onOpenMap={() => setActiveModal('map')}
              onOpenMenu={() => setActiveModal('menu')}
              onOpenDungeonGate={portal => setDungeonGatePortal(portal)}
              onOpenStele={resource => setActiveSteleResource(resource)}
              onOpenWarRoom={() => setActiveModal('war_room')}
              onOpenAchievements={() => {
                setAchievementsDefaultTab('achievements');
                setActiveModal('achievements');
              }}
              onInteractionNearChange={setIsInteractionNear}
              onBossDefeated={setBossLootData}
              onToggle2DMode={() => setRenderMode('2d')}
            />
          ) : (
            <div className="relative w-full h-full">
              <GameCanvas
                player={player}
                isPaused={
                  activeModal !== null ||
                  dialogueNpcId !== null ||
                  shopNpc !== null ||
                  dungeonGatePortal !== null ||
                  activeSteleResource !== null ||
                  activeTribulation !== null ||
                  bossLootData !== null ||
                  chapterRewardModal !== null ||
                  player.hp <= 0
                }
                onUpdatePlayer={updatePlayerWithQuestChecks}
                onOpenDialogue={npcId => setDialogueNpcId(npcId)}
                onEnemyKilled={handleEnemyKilled}
                onOpenInventory={() => setActiveModal('inventory')}
                onOpenCharacter={() => setActiveModal('character')}
                onOpenCultivation={() => setActiveModal('cultivation')}
                onOpenQuests={() => setActiveModal('quests')}
                onOpenMap={() => setActiveModal('map')}
                onOpenMenu={() => setActiveModal('menu')}
                onOpenDungeonGate={portal => setDungeonGatePortal(portal)}
                onOpenStele={resource => setActiveSteleResource(resource)}
                onOpenWarRoom={() => setActiveModal('war_room')}
                onOpenAchievements={() => {
                  setAchievementsDefaultTab('achievements');
                  setActiveModal('achievements');
                }}
                onInteractionNearChange={setIsInteractionNear}
                onBossDefeated={setBossLootData}
              />
            </div>
          )}

          {/* Interactive HUD overlay */}
          <HUD
            player={player}
            onOpenCharacter={() => setActiveModal('character')}
            onOpenCultivation={() => setActiveModal('cultivation')}
            onOpenInventory={() => setActiveModal('inventory')}
            onOpenQuests={() => setActiveModal('quests')}
            onOpenMap={() => setActiveModal('map')}
            onOpenAlchemy={() => setActiveModal('alchemy')}
            onOpenForging={() => setActiveModal('forging')}
            onOpenWarRoom={() => setActiveModal('war_room')}
            onOpenAchievements={() => {
              setAchievementsDefaultTab('achievements');
              setActiveModal('achievements');
            }}
            onOpenMenu={() => setActiveModal('menu')}
            musicEnabled={musicEnabled}
            onToggleMusic={handleToggleMusic}
            touchControlsEnabled={isTouchControlsVisible}
            onToggleTouchControls={handleToggleTouchControls}
            renderMode={renderMode}
            onToggleRenderMode={() => setRenderMode(prev => (prev === '3d' ? '2d' : '3d'))}
          />

          {/* Mobile Virtual Joystick & Touch Action Cluster */}
          {isTouchControlsVisible && (
            <TouchControls
              player={player}
              isInteractionAvailable={isInteractionNear}
              disabled={
                activeModal !== null ||
                dialogueNpcId !== null ||
                shopNpc !== null ||
                dungeonGatePortal !== null ||
                activeSteleResource !== null ||
                activeTribulation !== null ||
                player.hp <= 0
              }
            />
          )}

          {/* === MODAL OVERLAYS === */}
          {activeModal === 'character' && (
            <CharacterModal
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onOpenTitles={() => {
                setAchievementsDefaultTab('titles');
                setActiveModal('achievements');
              }}
              onClose={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'cultivation' && (
            <CultivationModal
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onStartTribulation={(targetRealm, selectedPill) => {
                setActiveTribulation({ targetRealm, selectedPill });
                setActiveModal(null);
              }}
              onClose={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'inventory' && (
            <InventoryModal
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'quests' && (
            <QuestsModal
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'map' && (
            <WorldMapModal
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'alchemy' && (
            <AlchemyModal
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'forging' && (
            <ForgingModal
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setActiveModal(null)}
            />
          )}

          {activeModal === 'menu' && (
            <MenuModal
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onLoadPlayer={loaded => setPlayer(loaded)}
              onRestartGame={() => {
                setActiveModal(null);
                handleStartNewGame();
              }}
              onClose={() => setActiveModal(null)}
              touchControlsEnabled={isTouchControlsVisible}
              onToggleTouchControls={handleToggleTouchControls}
              onOpenMobileInstall={() => setIsMobileInstallOpen(true)}
            />
          )}

          {/* NPC Branching Dialogue Modal */}
          {dialogueNpcId && (
            <DialogueModal
              npcId={dialogueNpcId}
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setDialogueNpcId(null)}
              onOpenShop={npc => setShopNpc(npc)}
              onOpenAlchemy={() => setActiveModal('alchemy')}
              onOpenForging={() => setActiveModal('forging')}
              onOpenPavilion={() => setActiveModal('pavilion')}
              onOpenWarRoom={() => setActiveModal('war_room')}
            />
          )}

          {/* Pavilion (Tàng Kinh Các) Modal */}
          {activeModal === 'pavilion' && (
            <PavilionModal
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setActiveModal(null)}
            />
          )}

          {/* Sect War & World Dynamics War Room Modal */}
          {activeModal === 'war_room' && (
            <SectWarModal
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setActiveModal(null)}
            />
          )}

          {/* Merchant Shop Modal */}
          {shopNpc && (
            <ShopModal
              npc={shopNpc}
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setShopNpc(null)}
            />
          )}

          {/* Secret Realm Entrance Confirmation Gate Modal */}
          {dungeonGatePortal && (
            <DungeonGateModal
              portal={dungeonGatePortal}
              player={player}
              onEnter={() => {
                const targetMap = dungeonGatePortal.toMapId;
                const cost = dungeonGatePortal.costSpiritStones ?? 50;
                setPlayer(prev => ({
                  ...prev,
                  spiritStones: Math.max(0, prev.spiritStones - cost),
                  currentMapId: targetMap,
                  x: dungeonGatePortal.targetX,
                  y: dungeonGatePortal.targetY,
                  discoveredMaps: prev.discoveredMaps.includes(targetMap)
                    ? prev.discoveredMaps
                    : [...prev.discoveredMaps, targetMap],
                }));
                setDungeonGatePortal(null);
                SaveManager.saveGame('auto', player, 'Tiến vào Bí Cảnh Hắc Phong');
              }}
              onClose={() => setDungeonGatePortal(null)}
            />
          )}

          {/* Ancient Stele / Altar / Mechanism Comprehension Modal */}
          {activeSteleResource && (
            <SteleModal
              resource={activeSteleResource}
              player={player}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setActiveSteleResource(null)}
            />
          )}

          {/* Heavenly Tribulation & Inner Demon Modal */}
          {activeTribulation && (
            <TribulationModal
              player={player}
              targetRealm={activeTribulation.targetRealm}
              selectedPill={activeTribulation.selectedPill}
              onSuccess={updated => {
                updatePlayerWithQuestChecks(() => updated);
                setActiveTribulation(null);
              }}
              onFailure={(updated, reason) => {
                updatePlayerWithQuestChecks(() => updated);
                setActiveTribulation(null);
              }}
              onClose={() => setActiveTribulation(null)}
            />
          )}

          {/* Thiên Đạo Thành Tựu, Danh Hiệu & Hồ Sơ Hành Trình Modal */}
          {activeModal === 'achievements' && (
            <AchievementsModal
              player={player}
              defaultTab={achievementsDefaultTab}
              onUpdatePlayer={updatePlayerWithQuestChecks}
              onClose={() => setActiveModal(null)}
            />
          )}

          {/* Achievement Unlocked Floating Toast Notification */}
          <AchievementToast
            achievement={activeToastAchievement}
            onClose={() => setActiveToastAchievement(null)}
            onClick={() => {
              setAchievementsDefaultTab('achievements');
              setActiveModal('achievements');
              setActiveToastAchievement(null);
            }}
          />

          {/* Death / Revival Modal */}
          {player.hp <= 0 && (
            <DeathModal
              onRevive={handleRevive}
              onLoadAutoSave={handleLoadAutoSave}
            />
          )}

          {/* Boss Victory & Loot Modal */}
          {bossLootData && (
            <BossLootModal
              loot={bossLootData}
              player={player}
              onClaimAll={handleClaimBossLoot}
              onClose={() => setBossLootData(null)}
            />
          )}

          {/* Roguelite Chapter Milestone Reward Modal */}
          {chapterRewardModal && (
            <ChapterRewardModal
              player={player}
              chapterNumber={chapterRewardModal.chapterNumber}
              chapterTitle={chapterRewardModal.chapterTitle}
              onSelectReward={handleSelectChapterReward}
              onClose={() => setChapterRewardModal(null)}
            />
          )}
        </div>
      )}

      {/* Floating Landscape Recommendation Banner on Mobile */}
      {isPlaying && isPortrait && showRotateNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-stone-900/95 border border-amber-500/80 rounded-xl px-3.5 py-2 shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-[90vw]">
          <span className="text-base animate-spin">🔄</span>
          <span className="text-xs text-amber-200 font-medium">
            Hãy <b>xoay ngang điện thoại</b> để có tầm nhìn rộng và thao tác thoải mái nhất!
          </span>
          <button
            onClick={() => setShowRotateNotice(false)}
            className="text-stone-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-stone-800 shrink-0 cursor-pointer"
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile Download & Installation Modal */}
      {isMobileInstallOpen && (
        <MobileInstallModal onClose={() => setIsMobileInstallOpen(false)} />
      )}
    </div>
  );
}
