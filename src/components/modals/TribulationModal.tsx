import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerStats, RealmInfo, Item } from '../../types/game';
import { REALMS } from '../../data/realms';
import { CULTIVATION_ARTS } from '../../data/arts';
import { ITEMS } from '../../data/items';
import { soundManager } from '../../engine/audio';
import { recomputePlayerStats, advanceGameTime } from '../../engine/cultivationEngine';
import { SaveManager } from '../../engine/saveManager';
import confetti from 'canvas-confetti';
import {
  getTribulationConfig,
  TribulationConfig,
  TribulationWave,
  InnerDemonChallenge
} from '../../data/tribulationConfig';
import {
  Zap,
  Shield,
  Heart,
  Skull,
  Flame,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Eye,
  CheckCircle,
  XCircle,
  Sword,
  Clock
} from 'lucide-react';

interface TribulationModalProps {
  player: PlayerStats;
  targetRealm: RealmInfo;
  selectedPill: Item | null;
  onSuccess: (updatedPlayer: PlayerStats) => void;
  onFailure: (updatedPlayer: PlayerStats, reason: string) => void;
  onClose: () => void;
}

interface StrikeCircle {
  id: string;
  x: number;
  y: number;
  radius: number;
  createTime: number;
  strikeTime: number;
  damage: number;
  hasStruck: boolean;
}

export const TribulationModal: React.FC<TribulationModalProps> = ({
  player,
  targetRealm,
  selectedPill,
  onSuccess,
  onFailure,
  onClose,
}) => {
  // Phase state: 'intro' | 'active_tribulation' | 'inner_demon_dialogue' | 'inner_demon_combat' | 'concluded'
  const [phase, setPhase] = useState<
    'intro' | 'active_tribulation' | 'inner_demon_dialogue' | 'inner_demon_combat' | 'concluded'
  >('intro');

  const config = getTribulationConfig(REALMS[player.realmIndex]);
  const [currentWaveIndex, setCurrentWaveIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(player.hp);
  const [playerMaxHp, setPlayerMaxHp] = useState(player.maxHp);
  const [strikesDodged, setStrikesDodged] = useState(0);
  const [strikesHit, setStrikesHit] = useState(0);

  // Player position inside the arena (Arena size: 600 x 400)
  const [playerPos, setPlayerPos] = useState({ x: 300, y: 220 });
  const [isDodging, setIsDodging] = useState(false);
  const [dodgeCooldown, setDodgeCooldown] = useState(0);
  const keysPressed = useRef<Record<string, boolean>>({});

  // Active strikes
  const [strikes, setStrikes] = useState<StrikeCircle[]>([]);

  // Shield / Talisman boosts
  const hasShieldTalisman = player.inventory.some(s => s.item.id === 'bich_tieu_ti_loi_phu' && s.count > 0);
  const hasHeartMirror = player.equipment.accessory?.id === 'ho_tam_bao_kinh';
  const hasMindTalisman = player.inventory.some(s => s.item.id === 'thanh_tam_dinh_than_phu' && s.count > 0);

  const [shieldActive, setShieldActive] = useState(false);
  const [shieldHp, setShieldHp] = useState(hasShieldTalisman ? 350 : 0);

  // Inner Demon state
  const demonChallenge = config.innerDemon;
  const [selectedDemonChoiceId, setSelectedDemonChoiceId] = useState<string | null>(null);
  const [demonChoiceResult, setDemonChoiceResult] = useState<string | null>(null);
  const [demonHp, setDemonHp] = useState(demonChallenge?.baseDemonHp || 1000);
  const [demonMaxHp, setDemonMaxHp] = useState(demonChallenge?.baseDemonHp || 1000);
  const [demonAtkTimer, setDemonAtkTimer] = useState(0);

  // Outcome
  const [outcome, setOutcome] = useState<{
    success: boolean;
    title: string;
    details: string;
    updatedPlayer?: PlayerStats;
  } | null>(null);

  const arenaRef = useRef<HTMLDivElement | null>(null);

  // Handle keyboard movement during active tribulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        triggerDodge();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dodgeCooldown, isDodging]);

  const triggerDodge = () => {
    if (dodgeCooldown > 0 || isDodging) return;
    setIsDodging(true);
    setDodgeCooldown(1000); // 1s cooldown
    soundManager.playDash();
    setTimeout(() => {
      setIsDodging(false);
    }, 400); // 400ms invulnerability
  };

  // Cooldown countdown
  useEffect(() => {
    if (dodgeCooldown <= 0) return;
    const timer = setInterval(() => {
      setDodgeCooldown(prev => Math.max(0, prev - 100));
    }, 100);
    return () => clearInterval(timer);
  }, [dodgeCooldown]);

  // Main Arena Simulation Loop (Movement & Strike collisions)
  useEffect(() => {
    if (phase !== 'active_tribulation' && phase !== 'inner_demon_combat') return;

    const interval = setInterval(() => {
      // 1. Move player
      setPlayerPos(prev => {
        let dx = 0;
        let dy = 0;
        const speed = isDodging ? 8 : 4.5;
        if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy -= speed;
        if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy += speed;
        if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= speed;
        if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += speed;

        return {
          x: Math.max(30, Math.min(570, prev.x + dx)),
          y: Math.max(30, Math.min(370, prev.y + dy)),
        };
      });

      // 2. Process strikes in 'active_tribulation'
      if (phase === 'active_tribulation') {
        const now = Date.now();
        setStrikes(prev => {
          const nextStrikes: StrikeCircle[] = [];

          prev.forEach(strike => {
            if (!strike.hasStruck && now >= strike.strikeTime) {
              // Lightning strikes down!
              soundManager.playThunderStrike();
              strike.hasStruck = true;

              // Check distance to player
              const dist = Math.hypot(strike.x - playerPos.x, strike.y - playerPos.y);
              if (dist <= strike.radius) {
                if (isDodging) {
                  // Dodged successfully!
                  setStrikesDodged(c => c + 1);
                } else {
                  // Hit! Calculate damage with defense and buffs
                  let dmg = strike.damage;
                  if (hasShieldTalisman) dmg = Math.floor(dmg * 0.7);
                  if (player.currentArtId === 'kim_cuong_than') dmg = Math.floor(dmg * 0.65);
                  dmg = Math.max(10, dmg - Math.floor(player.def * 0.2));

                  setStrikesHit(c => c + 1);
                  soundManager.playHit();

                  setPlayerHp(currHp => {
                    const newHp = currHp - dmg;
                    if (newHp <= 0) {
                      // Trigger failure
                      handleTribulationFailed('Khí huyết cạn kiệt, không chịu nổi thiên lôi oanh kích!');
                    }
                    return Math.max(0, newHp);
                  });
                }
              } else {
                setStrikesDodged(c => c + 1);
              }
            }

            // Keep strike on screen for a short flash (200ms after strikeTime)
            if (now < strike.strikeTime + 250) {
              nextStrikes.push(strike);
            }
          });

          return nextStrikes;
        });
      }

      // 3. Inner Demon Combat Loop
      if (phase === 'inner_demon_combat') {
        setDemonAtkTimer(t => {
          if (t >= 20) {
            // Demon attacks
            soundManager.playDemonWhisper();
            const dmg = Math.max(15, Math.floor(demonChallenge?.baseDemonAtk || 50) - Math.floor(player.def * 0.15));
            setPlayerHp(h => {
              const newHp = h - dmg;
              if (newHp <= 0) {
                handleTribulationFailed('Tâm Ma cắn trả, thần hồn bị ảo ảnh ma đầu thôn phệ!');
              }
              return Math.max(0, newHp);
            });
            return 0;
          }
          return t + 1;
        });
      }
    }, 33); // ~30 fps loop

    return () => clearInterval(interval);
  }, [phase, playerPos, isDodging, hasShieldTalisman, player.def, player.currentArtId, demonChallenge]);

  // Wave Spawner for active tribulation
  useEffect(() => {
    if (phase !== 'active_tribulation') return;

    const wave = config.waves[currentWaveIndex];
    if (!wave) {
      // Completed all waves! Transition to Inner Demon or Success
      if (demonChallenge) {
        setPhase('inner_demon_dialogue');
        soundManager.playDemonWhisper();
      } else {
        handleTribulationSuccess();
      }
      return;
    }

    let strikeCount = 0;
    const waveInterval = setInterval(() => {
      if (strikeCount >= wave.totalStrikes) {
        clearInterval(waveInterval);
        // Wait 1.5s then advance to next wave
        setTimeout(() => {
          setCurrentWaveIndex(idx => idx + 1);
        }, 1500);
        return;
      }

      // Spawn strike around player or random in arena
      const leadX = playerPos.x + (Math.random() - 0.5) * 160;
      const leadY = playerPos.y + (Math.random() - 0.5) * 160;
      const strikeX = Math.max(50, Math.min(550, leadX));
      const strikeY = Math.max(50, Math.min(350, leadY));

      const newStrike: StrikeCircle = {
        id: `strike_${Date.now()}_${Math.random()}`,
        x: strikeX,
        y: strikeY,
        radius: wave.areaRadius,
        createTime: Date.now(),
        strikeTime: Date.now() + wave.warningDurationMs,
        damage: wave.damagePerStrike,
        hasStruck: false,
      };

      setStrikes(s => [...s, newStrike]);
      strikeCount++;
    }, wave.strikeDelayMs);

    return () => clearInterval(waveInterval);
  }, [phase, currentWaveIndex, config.waves, demonChallenge]);

  // Inner Demon Dialogue Selection
  const handleSelectDemonChoice = (choiceId: string) => {
    if (!demonChallenge) return;
    const choice = demonChallenge.dialogueChoices.find(c => c.id === choiceId);
    if (!choice) return;

    setSelectedDemonChoiceId(choiceId);
    setDemonChoiceResult(choice.loreOutcome);

    if (choice.outcomeType === 'combat') {
      setTimeout(() => {
        setPhase('inner_demon_combat');
        setDemonHp(Math.round(demonChallenge.baseDemonHp * choice.demonHpMultiplier));
        setDemonMaxHp(Math.round(demonChallenge.baseDemonHp * choice.demonHpMultiplier));
      }, 1500);
    } else {
      // Enlightenment / peaceful resolve
      soundManager.playQuestComplete();
      setTimeout(() => {
        handleTribulationSuccess(choice.karmaChange);
      }, 1800);
    }
  };

  // Player attacks demon in combat phase
  const handleAttackDemon = () => {
    if (phase !== 'inner_demon_combat') return;
    soundManager.playSlash();
    const dmg = Math.max(40, Math.floor(player.atk * 0.85));

    setDemonHp(prev => {
      const nextHp = prev - dmg;
      if (nextHp <= 0) {
        soundManager.playQuestComplete();
        setTimeout(() => {
          handleTribulationSuccess(15);
        }, 800);
        return 0;
      }
      return nextHp;
    });
  };

  // Handle Breakthrough Success
  const handleTribulationSuccess = (bonusKarma: number = 0) => {
    setPhase('concluded');
    soundManager.playBreakthrough();
    try {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#38bdf8', '#facc15', '#a855f7', '#22c55e'],
      });
    } catch (e) {}

    // Deduct pill if selected
    let updatedInv = [...player.inventory];
    if (selectedPill) {
      const slotIdx = updatedInv.findIndex(s => s.item.id === selectedPill.id && s.count > 0);
      if (slotIdx !== -1) {
        updatedInv = updatedInv
          .map((s, idx) => (idx === slotIdx ? { ...s, count: s.count - 1 } : s))
          .filter(s => s.count > 0);
      }
    }

    const currentRealm = REALMS[player.realmIndex];
    const newRealmIndex = player.realmIndex + 1;
    const remainingExp = Math.max(0, player.exp - currentRealm.requiredExp);

    let updatedPlayer: PlayerStats = {
      ...player,
      realmIndex: newRealmIndex,
      exp: remainingExp,
      inventory: updatedInv,
      consciousness: player.consciousness + 10,
      comprehension: player.comprehension + 8,
      physique: player.physique + 10,
      karma: player.karma + bonusKarma,
      statusEffects: {
        injured: false,
        qiDeviation: false,
        poisoned: false,
      },
      gameTime: advanceGameTime(player.gameTime, 12),
    };

    updatedPlayer = recomputePlayerStats(updatedPlayer);
    // Fully heal on breakthrough
    updatedPlayer.hp = updatedPlayer.maxHp;
    updatedPlayer.mp = updatedPlayer.maxMp;

    // Check main quests for breakthrough
    updatedPlayer.activeQuests = updatedPlayer.activeQuests.map(q => {
      const updatedObjs = q.objectives.map(obj => {
        if (obj.type === 'breakthrough') {
          if (
            obj.targetId === targetRealm.id ||
            obj.targetId === 'truc_co_so' ||
            obj.targetId === 'luyen_khi_13'
          ) {
            return { ...obj, currentCount: 1, completed: true };
          }
        }
        return obj;
      });
      return { ...q, objectives: updatedObjs };
    });

    SaveManager.saveGame('auto', updatedPlayer, `Đột phá ${targetRealm.fullName}`);

    setOutcome({
      success: true,
      title: `NGHỊCH THIÊN ĐỘT PHÁ THÀNH CÔNG!`,
      details: `Đạo hữu đã thuận lợi vượt qua Thiên Kiếp Lôi Đình và hàng phục Tâm Ma! Chính thức tấn thăng [${targetRealm.fullName}], thoát thai hoán cốt, thọ nguyên tăng trưởng!`,
      updatedPlayer,
    });
  };

  // Handle Breakthrough Failure
  const handleTribulationFailed = (reason: string) => {
    setPhase('concluded');
    soundManager.playHit();

    // Deduct pill if selected
    let updatedInv = [...player.inventory];
    if (selectedPill) {
      const slotIdx = updatedInv.findIndex(s => s.item.id === selectedPill.id && s.count > 0);
      if (slotIdx !== -1) {
        updatedInv = updatedInv
          .map((s, idx) => (idx === slotIdx ? { ...s, count: s.count - 1 } : s))
          .filter(s => s.count > 0);
      }
    }

    const currentRealm = REALMS[player.realmIndex];
    let backlashDmg = currentRealm.tribulationDamage || 250;
    if (hasHeartMirror) backlashDmg = Math.floor(backlashDmg * 0.5);

    const lostExp = Math.floor(currentRealm.requiredExp * 0.15);

    let updatedPlayer: PlayerStats = {
      ...player,
      exp: Math.max(0, player.exp - lostExp),
      hp: Math.max(15, player.hp - backlashDmg),
      inventory: updatedInv,
      statusEffects: {
        ...player.statusEffects,
        injured: true,
        qiDeviation: Math.random() < 0.35,
      },
      gameTime: advanceGameTime(player.gameTime, 8),
    };

    updatedPlayer = recomputePlayerStats(updatedPlayer);
    SaveManager.saveGame('auto', updatedPlayer, 'Đột phá thất bại (Lôi Kiếp Phản Phệ)');

    setOutcome({
      success: false,
      title: `ĐỘT PHÁ THẤT BẠI · THIÊN ĐẠO PHẢN PHỆ!`,
      details: `${reason}\nThiên kiếp tán đi, kinh mạch bị trọng thương tổn thất ${backlashDmg} Khí Huyết, thất thoát ${lostExp} Tu Vi. Hãy dùng Hồi Xuân Đan / Định Thần Đan để tĩnh dưỡng!`,
      updatedPlayer,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl bg-stone-950 border-2 border-amber-600/80 rounded-2xl shadow-2xl text-stone-100 overflow-hidden flex flex-col">
        {/* Ancient Header */}
        <div className="flex justify-between items-center p-4 border-b border-amber-800/60 bg-gradient-to-r from-stone-950 via-purple-950/40 to-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/50 flex items-center justify-center text-2xl shadow-lg">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-amber-300 font-title tracking-wider">
                  {config.name}
                </h3>
                <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-700/60 font-semibold uppercase">
                  Đại Cảnh Giới
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Mục tiêu tấn thăng: <strong className="text-cyan-300">{targetRealm.fullName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {phase === 'intro' && (
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-lg border border-stone-800 hover:border-amber-700 text-stone-400 hover:text-amber-200 text-xs transition"
              >
                Hủy Bỏ
              </button>
            )}
          </div>
        </div>

        {/* Phase 1: Intro & Preparation Details */}
        {phase === 'intro' && (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-stone-900/90 border border-amber-900/50 space-y-2">
              <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Thiên Địa Dị Tượng · Kiếp Vân Hội Tụ
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed italic">
                Khi tu sĩ chạm tới ngưỡng cửa chuyển đổi bản chất sinh mệnh (từ Khí sang Dịch, đúc thành Đạo Cơ),
                quy luật thiên địa sẽ giáng hạ Lôi Kiếp để tôi luyện thể phách và khảo nghiệm đạo tâm. Nếu né tránh hoặc
                chống đỡ thành công toàn bộ các đợt sấm sét, đạo hữu sẽ chính thức mở ra con đường Tiên Đạo chân chính!
              </p>
            </div>

            {/* Preparation Buffs & Protections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 space-y-1">
                <div className="text-stone-400 flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Đan Dược Trợ Phá:
                </div>
                <div className="text-amber-200 font-bold">
                  {selectedPill ? selectedPill.name : 'Không dùng đan dược'}
                </div>
                <div className="text-[11px] text-stone-400">
                  {selectedPill ? `+${selectedPill.stats?.breakthroughBonus || 25}% Tỷ lệ bảo hộ` : 'Cơ hội sống sót thấp hơn'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 space-y-1">
                <div className="text-stone-400 flex items-center gap-1.5 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Hộ Thể Phù Lục:
                </div>
                <div className={hasShieldTalisman ? 'text-emerald-300 font-bold' : 'text-stone-500'}>
                  {hasShieldTalisman ? 'Bích Tiêu Tị Lôi Phù (Kích hoạt)' : 'Chưa trang bị'}
                </div>
                <div className="text-[11px] text-stone-400">
                  {hasShieldTalisman ? 'Giảm 30% sát thương lôi kiếp' : 'Không có giảm trừ sát thương'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 space-y-1">
                <div className="text-stone-400 flex items-center gap-1.5 font-semibold">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Hộ Thần Pháp Bảo:
                </div>
                <div className={hasHeartMirror ? 'text-emerald-300 font-bold' : 'text-stone-500'}>
                  {hasHeartMirror ? 'Hộ Tâm Bảo Kính (Bảo vệ)' : 'Chưa có pháp bảo'}
                </div>
                <div className="text-[11px] text-stone-400">
                  {hasHeartMirror ? 'Giảm 50% phản phệ thất bại' : 'Nguy cơ trọng thương nếu thất bại'}
                </div>
              </div>
            </div>

            {/* Trial Specs */}
            <div className="bg-stone-900/60 p-3.5 rounded-lg border border-stone-800 space-y-2 text-xs">
              <div className="font-semibold text-stone-300 flex items-center justify-between">
                <span>Số Đợt Thiên Kiếp: <strong>{config.totalWaves} Đợt</strong></span>
                <span>Thử Thách Tâm Ma: <strong className={demonChallenge ? 'text-purple-400' : 'text-stone-500'}>{demonChallenge ? 'Có Xuất Hiện' : 'Không'}</strong></span>
              </div>
              <p className="text-[11px] text-stone-400">
                Điều khiển trong Lôi Kiếp: Sử dụng phím <strong>WASD / Phím Mũi Tên</strong> để di chuyển, và nhấn <strong>Phím Space (Cách)</strong> để Né Tránh (vô địch 0.4s). Tránh đứng trong các vòng tròn đỏ báo trước khi sét đánh xuống!
              </p>
            </div>

            <button
              onClick={() => {
                soundManager.playThunderStrike();
                setPhase('active_tribulation');
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-amber-500 to-yellow-500 hover:brightness-110 active:scale-98 text-stone-950 font-bold text-sm tracking-wider uppercase transition shadow-xl cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Nghênh Đón Thiên Kiếp · Bắt Đầu Độ Kiếp!
            </button>
          </div>
        )}

        {/* Phase 2: Active Arena Simulation */}
        {phase === 'active_tribulation' && (
          <div className="p-4 space-y-3">
            {/* HUD Status Bar */}
            <div className="flex items-center justify-between text-xs bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-stone-400">Đợt: </span>
                  <span className="text-amber-300 font-bold">
                    {Math.min(config.totalWaves, currentWaveIndex + 1)} / {config.totalWaves}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-stone-300 font-semibold">
                    {Math.floor(playerHp)} / {playerMaxHp}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-semibold">Né được: {strikesDodged}</span>
                <span className="text-rose-400 font-semibold">Trúng đòn: {strikesHit}</span>
                <div className={`px-2 py-0.5 rounded text-[11px] font-bold ${dodgeCooldown <= 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' : 'bg-stone-800 text-stone-500'}`}>
                  {dodgeCooldown <= 0 ? 'Space: Né Đòn Sẵn Sàng' : `Hồi: ${(dodgeCooldown / 1000).toFixed(1)}s`}
                </div>
              </div>
            </div>

            {/* Canvas-Like Interactive Arena */}
            <div
              ref={arenaRef}
              className="relative w-full h-[380px] bg-stone-950 border-2 border-purple-900/60 rounded-xl overflow-hidden shadow-inner cursor-crosshair select-none"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(88, 28, 135, 0.15) 0%, rgba(10, 10, 15, 0.95) 75%)`,
              }}
            >
              {/* Rolling storm clouds overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-transparent to-transparent pointer-events-none animate-pulse" />

              {/* Warning Circles and Lightning Strikes */}
              {strikes.map(strike => {
                const elapsed = Date.now() - strike.createTime;
                const total = strike.strikeTime - strike.createTime;
                const progress = Math.min(1, elapsed / total);

                return (
                  <div
                    key={strike.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: strike.x - strike.radius,
                      top: strike.y - strike.radius,
                      width: strike.radius * 2,
                      height: strike.radius * 2,
                    }}
                  >
                    {!strike.hasStruck ? (
                      /* Warning Telegraph Ring */
                      <div
                        className="w-full h-full rounded-full border-2 border-rose-500/80 bg-rose-950/20 relative flex items-center justify-center transition-all"
                        style={{
                          boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        {/* Contracting Inner Ring */}
                        <div
                          className="rounded-full bg-rose-500/30"
                          style={{
                            width: `${progress * 100}%`,
                            height: `${progress * 100}%`,
                          }}
                        />
                      </div>
                    ) : (
                      /* Lightning Strike Flash */
                      <div className="w-full h-full rounded-full bg-cyan-200/90 animate-ping flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.9)]">
                        <span className="text-2xl font-black text-amber-200">⚡</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Player Avatar */}
              <div
                className={`absolute transition-transform duration-75 flex flex-col items-center pointer-events-none ${
                  isDodging ? 'opacity-50 scale-110 filter brightness-150' : 'opacity-100'
                }`}
                style={{
                  left: playerPos.x - 20,
                  top: playerPos.y - 30,
                  width: 40,
                  height: 60,
                }}
              >
                {/* Aura if dodging */}
                {isDodging && (
                  <div className="absolute inset-0 rounded-full border border-cyan-400 bg-cyan-400/20 animate-ping" />
                )}
                <div className="w-8 h-8 rounded-full border border-amber-400/80 bg-amber-950/80 flex items-center justify-center text-sm shadow">
                  🧘
                </div>
                <div className="text-[9px] font-bold text-amber-300 bg-stone-900/80 px-1 rounded mt-0.5 whitespace-nowrap">
                  {player.name}
                </div>
              </div>
            </div>

            <div className="text-center text-[11px] text-stone-400">
              Dùng phím <strong>WASD / Mũi tên</strong> di chuyển, <strong>Phím Space</strong> né đòn. Đang ở đợt: {config.waves[currentWaveIndex]?.description}
            </div>
          </div>
        )}

        {/* Phase 3: Inner Demon Dialogue Trial */}
        {phase === 'inner_demon_dialogue' && demonChallenge && (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-purple-400" />
                  {demonChallenge.title}
                </span>
                <span className="text-[11px] text-purple-400 font-semibold">{demonChallenge.subtitle}</span>
              </div>
              <h4 className="text-base font-bold text-amber-200 font-title">{demonChallenge.demonName}</h4>
              <p className="text-xs text-stone-300 leading-relaxed italic bg-stone-950/60 p-3 rounded-lg border border-purple-900/40">
                "{demonChallenge.loreIntro}"
              </p>
            </div>

            {/* Dialogue / Choice Options */}
            {!demonChoiceResult ? (
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-stone-300">Hãy đưa ra quyết định của Đạo Tâm:</div>
                {demonChallenge.dialogueChoices.map(choice => (
                  <button
                    key={choice.id}
                    onClick={() => handleSelectDemonChoice(choice.id)}
                    className="w-full text-left p-3 rounded-xl bg-stone-900 hover:bg-purple-950/50 border border-stone-800 hover:border-purple-600 transition cursor-pointer space-y-1 shadow group"
                  >
                    <div className="text-xs font-bold text-amber-200 group-hover:text-amber-300 flex items-center justify-between">
                      <span>{choice.text}</span>
                      <span className="text-[10px] text-purple-400 uppercase font-semibold">
                        {choice.outcomeType === 'combat' ? '⚔️ Chiến Đấu' : '🕊️ Ngộ Đạo'}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 group-hover:text-stone-300">
                      {choice.description}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-stone-900/90 border border-amber-600/60 space-y-2 text-center animate-fade-in">
                <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-amber-300">Ảo Cảnh Chuyển Động</h4>
                <p className="text-xs text-stone-200 leading-relaxed italic">
                  {demonChoiceResult}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Phase 4: Inner Demon Combat */}
        {phase === 'inner_demon_combat' && demonChallenge && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between bg-stone-900 p-3 rounded-xl border border-purple-800/60">
              <div className="space-y-1">
                <span className="text-xs text-purple-300 font-bold">{demonChallenge.demonName}</span>
                <div className="w-48 bg-stone-950 rounded-full h-3 overflow-hidden border border-purple-900">
                  <div
                    className="bg-purple-600 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, (demonHp / demonMaxHp) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-stone-400">
                  {demonHp} / {demonMaxHp} Ma Khí
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-xs text-amber-300 font-bold">Bản Thể: {player.name}</span>
                <div className="w-48 bg-stone-950 rounded-full h-3 overflow-hidden border border-rose-900">
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-stone-400">
                  {playerHp} / {playerMaxHp} Khí Huyết
                </div>
              </div>
            </div>

            <div className="p-8 text-center bg-stone-950/80 rounded-xl border border-stone-800 space-y-3">
              <div className="text-5xl animate-bounce">⚔️</div>
              <p className="text-xs text-stone-300">
                Nhấn liên tục để vận dụng Kiếm Ý và Đạo Lực đánh tan ảo ảnh Tâm Ma!
              </p>
              <button
                onClick={handleAttackDemon}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-stone-950 font-bold text-sm tracking-wide shadow-xl cursor-pointer active:scale-95 transition"
              >
                Trảm Ma Kiếm Quyết (Công kích)
              </button>
            </div>
          </div>
        )}

        {/* Phase 5: Concluded Outcome Screen */}
        {phase === 'concluded' && outcome && (
          <div className="p-6 space-y-5 text-center">
            <div className={`p-5 rounded-xl border ${outcome.success ? 'bg-emerald-950/30 border-emerald-600/60' : 'bg-rose-950/30 border-rose-600/60'} space-y-3`}>
              <div className="text-4xl">
                {outcome.success ? '🎉' : '⚡'}
              </div>
              <h3 className={`text-lg font-black font-title tracking-wider ${outcome.success ? 'text-amber-300' : 'text-rose-400'}`}>
                {outcome.title}
              </h3>
              <p className="text-xs text-stone-200 leading-relaxed whitespace-pre-line max-w-lg mx-auto">
                {outcome.details}
              </p>
            </div>

            <button
              onClick={() => {
                const finalPlayer = outcome.updatedPlayer || player;
                if (outcome.success) {
                  onSuccess(finalPlayer);
                } else {
                  onFailure(finalPlayer, outcome.details);
                }
              }}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase transition shadow-xl cursor-pointer ${
                outcome.success
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:brightness-110 text-stone-950'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
              }`}
            >
              {outcome.success ? 'Tiếp Nhận Đạo Quả Mới' : 'Tĩnh Dưỡng Thương Thế'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
