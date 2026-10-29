import React, { useEffect, useRef, useState } from 'react';
import { PlayerStats, NPC, Enemy, CollectibleResource, GameMap, FloatingText, Particle, GroundDrop, Portal, AoEZone, AdvancedProjectile } from '../types/game';
import { GAME_MAPS } from '../data/maps';
import { ITEMS } from '../data/items';
import { soundManager } from '../engine/audio';
import { inputManager } from '../engine/inputManager';
import { STRONGHOLDS } from '../data/territory';
import { WORLD_EVENTS } from '../data/worldEvents';
import { FACTIONS } from '../data/factions';
import {
  calculateRootAffinity,
  getEffectiveExpMultiplier,
  advanceGameTime,
  recomputePlayerStats
} from '../engine/cultivationEngine';
import {
  getMapBackground,
  clearMapBackgroundCache,
  renderXianxiaPlayer,
  renderXianxiaEnemy,
  renderXianxiaNPC,
  drawXianxiaObstacle,
  drawXianxiaResource,
  renderSwordArcSlash,
  renderFlyingSwordProjectile,
  renderXianxiaGoldenBell,
  renderHealingPillar,
  renderAdvancedFlyingSwords,
  renderAoEZones,
} from '../engine/proceduralRenderer';
import { checkArtCompatibility } from '../data/spiritualRoots';
import { BossLootData } from './modals/BossLootModal';

interface GameCanvasProps {
  player: PlayerStats;
  isPaused?: boolean;
  onUpdatePlayer: (updater: (prev: PlayerStats) => PlayerStats) => void;
  onOpenDialogue: (npcId: string) => void;
  onEnemyKilled: (enemyId: string) => void;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  onOpenCultivation: () => void;
  onOpenQuests: () => void;
  onOpenMap: () => void;
  onOpenMenu: () => void;
  onOpenDungeonGate?: (portal: Portal) => void;
  onOpenStele?: (resource: CollectibleResource) => void;
  onOpenWarRoom?: () => void;
  onOpenAchievements?: () => void;
  onInteractionNearChange?: (isNear: boolean) => void;
  onBossDefeated?: (bossLoot: BossLootData) => void;
  touchControlsEnabled?: boolean;
}

interface AfterImage {
  x: number;
  y: number;
  alpha: number;
  color: string;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
  element: string;
  life: number;
  radius: number;
}

// Line intersection helper for walls/obstacles line-of-sight
function lineIntersectsRect(x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, rw: number, rh: number): boolean {
  // Check if either point is inside
  if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
  if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

  const left = rx;
  const right = rx + rw;
  const top = ry;
  const bottom = ry + rh;

  const lineIntersectsSegment = (x3: number, y3: number, x4: number, y4: number) => {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  };

  return (
    lineIntersectsSegment(left, top, right, top) ||
    lineIntersectsSegment(right, top, right, bottom) ||
    lineIntersectsSegment(right, bottom, left, bottom) ||
    lineIntersectsSegment(left, bottom, left, top)
  );
}

function hasLineOfSight(x1: number, y1: number, x2: number, y2: number, obstacles: any[]): boolean {
  for (const obs of obstacles) {
    if (obs.type === 'building' || obs.type === 'rock' || obs.type === 'wall') {
      if (lineIntersectsRect(x1, y1, x2, y2, obs.x, obs.y, obs.width, obs.height)) {
        return false;
      }
    }
  }
  return true;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  player,
  isPaused = false,
  onUpdatePlayer,
  onOpenDialogue,
  onEnemyKilled,
  onOpenInventory,
  onOpenCharacter,
  onOpenCultivation,
  onOpenQuests,
  onOpenMap,
  onOpenMenu,
  onOpenDungeonGate,
  onOpenStele,
  onOpenWarRoom,
  onOpenAchievements,
  onInteractionNearChange,
  onBossDefeated,
  touchControlsEnabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<{ x: number; y: number; worldX: number; worldY: number }>({
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
  });

  const currentMap = GAME_MAPS[player.currentMapId] || GAME_MAPS.map_thanh_khe;
  const enemiesRef = useRef<Enemy[]>([]);
  const resourcesRef = useRef<CollectibleResource[]>([]);
  const groundDropsRef = useRef<GroundDrop[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const advancedProjectilesRef = useRef<AdvancedProjectile[]>([]);
  const aoeZonesRef = useRef<AoEZone[]>([]);
  const castingAnimRef = useRef<{ active: boolean; type: string; progress: number; timer: number; maxTimer: number }>({
    active: false,
    type: '',
    progress: 0,
    timer: 0,
    maxTimer: 0,
  });
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const afterImagesRef = useRef<AfterImage[]>([]);
  const screenShakeRef = useRef<number>(0);
  const localPosRef = useRef<{ x: number; y: number; facing: 'up' | 'down' | 'left' | 'right' }>({
    x: player.x,
    y: player.y,
    facing: player.facing,
  });

  const animPosRef = useRef<{ x: number; y: number }>({
    x: player.x,
    y: player.y,
  });

  const playerRef = useRef<PlayerStats>(player);
  playerRef.current = {
    ...player,
    x: localPosRef.current.x,
    y: localPosRef.current.y,
    facing: localPosRef.current.facing,
  };

  const wasMovingRef = useRef<boolean>(false);
  const syncTickerRef = useRef<number>(0);
  const currentMapIdRef = useRef<string>(player.currentMapId);

  const isPausedRef = useRef<boolean>(isPaused);
  isPausedRef.current = isPaused;
  const gameTimeTickerRef = useRef<number>(0);
  const interactionCheckTickerRef = useRef<number>(0);
  const lastInteractionNearRef = useRef<boolean>(false);
  const walkAnimTimerRef = useRef<number>(0);
  const stationaryIdleTimerRef = useRef<number>(0);
  const dustPuffTimerRef = useRef<number>(0);
  const ambientMotesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[]>([]);

  const cameraRef = useRef<{ x: number; y: number }>({ x: player.x, y: player.y });

  // Sync localPosRef only on map transition or major teleport/respawn (> 150px)
  useEffect(() => {
    if (player.currentMapId !== currentMapIdRef.current) {
      clearMapBackgroundCache(player.currentMapId);
      currentMapIdRef.current = player.currentMapId;
      localPosRef.current.x = player.x;
      localPosRef.current.y = player.y;
      localPosRef.current.facing = player.facing;
      animPosRef.current.x = player.x;
      animPosRef.current.y = player.y;
      cameraRef.current.x = player.x;
      cameraRef.current.y = player.y;
    }
  }, [player.currentMapId, player.x, player.y, player.facing]);

  useEffect(() => {
    const dist = Math.hypot(player.x - localPosRef.current.x, player.y - localPosRef.current.y);
    if (dist > 150) {
      localPosRef.current.x = player.x;
      localPosRef.current.y = player.y;
      localPosRef.current.facing = player.facing;
      animPosRef.current.x = player.x;
      animPosRef.current.y = player.y;
      cameraRef.current.x = player.x;
      cameraRef.current.y = player.y;
    }
  }, [player.x, player.y, player.facing]);

  const comboStateRef = useRef<{
    currentStep: 1 | 2 | 3;
    comboWindowTimer: number;
  }>({
    currentStep: 1,
    comboWindowTimer: 0,
  });

  const [activeComboStep, setActiveComboStep] = useState<1 | 2 | 3>(1);
  const hitStopTimerRef = useRef<number>(0);
  const queuedAttackRef = useRef<boolean>(false);

  const attackAnimRef = useRef<{
    active: boolean;
    step: 1 | 2 | 3;
    angle: number;
    progress: number;
    hasDealtDamage: boolean;
    hasSpawnedWave?: boolean;
    duration: number;
    range: number;
    slashArc: number;
    damageMult: number;
    knockback: number;
  }>({
    active: false,
    step: 1,
    angle: 0,
    progress: 0,
    hasDealtDamage: false,
    hasSpawnedWave: false,
    duration: 0.26,
    range: 95,
    slashArc: Math.PI * 0.75,
    damageMult: 1.0,
    knockback: 18,
  });

  const activeSkillsAnimRef = useRef<{
    shieldActive: boolean;
    shieldTimer: number;
    swordsOrbitAngle: number;
    swordsActive: boolean;
    swordsTimer: number;
    healPillarTimer: number;
  }>({
    shieldActive: false,
    shieldTimer: 0,
    swordsOrbitAngle: 0,
    swordsActive: false,
    swordsTimer: 0,
    healPillarTimer: 0,
  });

  // Spawn enemies & map state on map change
  useEffect(() => {
    const spawnedEnemies: Enemy[] = [];
    currentMap.enemySpawners.forEach((spawner, sIdx) => {
      for (let i = 0; i < spawner.count; i++) {
        const x = spawner.spawnArea.x + Math.random() * spawner.spawnArea.width;
        const y = spawner.spawnArea.y + Math.random() * spawner.spawnArea.height;
        spawnedEnemies.push({
          ...spawner.enemyPrototype,
          id: `${spawner.enemyPrototype.name}_${sIdx}_${i}`,
          spawnX: x,
          spawnY: y,
          leashRange: spawner.enemyPrototype.leashRange || 360,
          radius: spawner.enemyPrototype.radius || 20,
          x,
          y,
          hp: spawner.enemyPrototype.maxHp,
          attackTimer: Math.random() * 1.5,
          windupTimer: 0,
          hurtTimer: 0,
          detectTimer: 0,
          patrolTimer: Math.random() * 3,
          patrolTarget: { x, y },
          state: 'idle',
          bossPhase: 1,
        });
      }
    });
    enemiesRef.current = spawnedEnemies;
    resourcesRef.current = currentMap.resources.map(r => ({ ...r, collected: false, currentRespawnTimer: 0 }));
    groundDropsRef.current = [];
    projectilesRef.current = [];
    cameraRef.current = { x: player.x, y: player.y };

    // Spawn ambient spiritual motes / fireflies suited for map atmosphere
    const motes: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[] = [];
    const moteCount = 30;
    const isForest = currentMap.id === 'map_linh_vu' || currentMap.id === 'map_thanh_phong_son';
    const isRuins = currentMap.id === 'map_ancient_ruins' || currentMap.id === 'map_hac_phong_bi_canh';
    const isMountain = currentMap.id === 'map_hac_phong_son';

    for (let i = 0; i < moteCount; i++) {
      const color = isForest ? (Math.random() > 0.4 ? '#4ade80' : '#facc15')
        : isRuins ? (Math.random() > 0.5 ? '#c084fc' : '#38bdf8')
        : isMountain ? '#f87171'
        : '#fde047';
      const life = 3.5 + Math.random() * 4;
      motes.push({
        x: Math.random() * currentMap.width,
        y: Math.random() * currentMap.height,
        vx: (Math.random() - 0.5) * 15,
        vy: -7 - Math.random() * 12,
        life,
        maxLife: life,
        color,
        size: 1.5 + Math.random() * 2,
      });
    }
    ambientMotesRef.current = motes;

    soundManager.startMusic(currentMap.musicTheme);
  }, [player.currentMapId]);

  // Synchronize paused state with inputManager
  useEffect(() => {
    inputManager.setPaused(isPaused || player.hp <= 0);
  }, [isPaused, player.hp]);

  // Input listeners: Register unified inputManager and canvas mouse listeners
  useEffect(() => {
    inputManager.attachListeners();

    // Subscribe to unified combat & interaction actions
    const unsubscribeAction = inputManager.addActionListener(action => {
      if (isPausedRef.current || playerRef.current.hp <= 0) return;
      switch (action) {
        case 'attack':
          triggerBasicAttack();
          break;
        case 'dodge':
          triggerDash();
          break;
        case 'skill_q':
          triggerSkillByKey('q');
          break;
        case 'skill_e':
          triggerSkillByKey('e');
          break;
        case 'skill_r':
          triggerSkillByKey('r');
          break;
        case 'skill_f':
          triggerSkillByKey('f');
          break;
        case 'interact':
          handleInteraction();
          break;
      }
    });

    // Subscribe to menu hotkeys
    const unsubscribeMenu = inputManager.addMenuActionListener(menuKey => {
      switch (menuKey) {
        case 'escape':
          onOpenMenu();
          break;
        case 'inventory':
          onOpenInventory();
          break;
        case 'character':
          onOpenCharacter();
          break;
        case 'cultivation':
          onOpenCultivation();
          break;
        case 'quests':
          onOpenQuests();
          break;
        case 'map':
          onOpenMap();
          break;
        case 'war_room':
          if (onOpenWarRoom) onOpenWarRoom();
          break;
        case 'achievements':
          if (onOpenAchievements) onOpenAchievements();
          break;
      }
    });

    // Mouse aiming & mouse clicks on Canvas
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      mouseRef.current.x = mouseX;
      mouseRef.current.y = mouseY;
      const viewW = rect.width;
      const viewH = rect.height;
      const worldX = mouseX + cameraRef.current.x - viewW / 2;
      const worldY = mouseY + cameraRef.current.y - viewH / 2;
      mouseRef.current.worldX = worldX;
      mouseRef.current.worldY = worldY;
      inputManager.setMousePosition(mouseX, mouseY, worldX, worldY);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isPausedRef.current || playerRef.current.hp <= 0) return;
      if (e.button === 0) {
        inputManager.triggerAction('attack');
      } else if (e.button === 2) {
        e.preventDefault();
        inputManager.triggerAction('dodge');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      unsubscribeAction();
      unsubscribeMenu();
      inputManager.detachListeners();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onOpenInventory, onOpenCharacter, onOpenCultivation, onOpenQuests, onOpenMap, onOpenMenu, onOpenWarRoom, onOpenAchievements]);

  // COMBAT: Basic Attack — Combo 3 Đòn Kiếm Pháp (LMB / 3-Step Dynamic Sword Combo)
  const triggerBasicAttack = () => {
    const p = playerRef.current;
    if (attackAnimRef.current.active) {
      if (attackAnimRef.current.progress >= 0.45) {
        queuedAttackRef.current = true;
      }
      return;
    }
    if (p.hp <= 0) return;

    const skill = p.equippedSkills.find(s => s.key === 'lmb');
    if (skill && skill.currentCooldown > 0) return;

    // Determine combo step with 0.75s combo window
    let nextStep: 1 | 2 | 3 = 1;
    if (comboStateRef.current.comboWindowTimer > 0) {
      if (comboStateRef.current.currentStep === 1) nextStep = 2;
      else if (comboStateRef.current.currentStep === 2) nextStep = 3;
      else nextStep = 1;
    } else {
      nextStep = 1;
    }

    comboStateRef.current.currentStep = nextStep;
    comboStateRef.current.comboWindowTimer = 0; // reset while swinging
    setActiveComboStep(nextStep);

    const angle = inputManager.getAimAngle(p.x, p.y, p.facing, enemiesRef.current);

    // Setup distinct parameters per combo step
    let duration = 0.22;
    let range = 95;
    let slashArc = Math.PI * 0.72; // 130 deg
    let damageMult = 1.0;
    let knockback = 18;

    if (nextStep === 1) {
      // Step 1: Hoành Tảo Kiếm Khí (Swift Horizontal Opening Slash)
      duration = 0.22;
      range = 95;
      slashArc = Math.PI * 0.72;
      damageMult = 1.0;
      knockback = 18;
      soundManager.playSlash();
    } else if (nextStep === 2) {
      // Step 2: Nghịch Phong Kiếm (Reverse Upward Slash, Wider Arc & Weight)
      duration = 0.24;
      range = 108;
      slashArc = Math.PI * 0.82;
      damageMult = 1.35;
      knockback = 28;
      soundManager.playSlash();
    } else {
      // Step 3: Phách Không Tuyệt Trảm (Heavy Downward Cleave & Micro Dash forward)
      duration = 0.36;
      range = 130;
      slashArc = Math.PI * 0.95;
      damageMult = 1.95;
      knockback = 45;

      // Micro Dash forward 16px along angle with obstacle boundary safety
      const forwardDist = 16;
      const targetX = p.x + Math.cos(angle) * forwardDist;
      const targetY = p.y + Math.sin(angle) * forwardDist;
      let blocked = false;
      currentMap.obstacles.forEach(obs => {
        if (targetX + 16 > obs.x && targetX - 16 < obs.x + obs.width && targetY + 20 > obs.y && targetY - 20 < obs.y + obs.height) {
          blocked = true;
        }
      });
      if (!blocked) {
        localPosRef.current.x = targetX;
        localPosRef.current.y = targetY;
      }
      soundManager.playSlash();
    }

    // Trigger LMB cooldown
    if (skill) {
      onUpdatePlayer(prev => ({
        ...prev,
        equippedSkills: prev.equippedSkills.map(s => s.key === 'lmb' ? { ...s, currentCooldown: s.cooldown } : s),
      }));
    }

    attackAnimRef.current = {
      active: true,
      step: nextStep,
      angle,
      progress: 0,
      hasDealtDamage: false,
      hasSpawnedWave: false,
      duration,
      range,
      slashArc,
      damageMult,
      knockback,
    };
  };

  // COMBAT: Dash / Dodge with Perfect Dodge Mechanics
  const triggerDash = () => {
    const p = playerRef.current;
    if (p.dodgeCooldown > 0 || p.mp < 12 || p.hp <= 0) return;

    const angle = inputManager.getAimAngle(p.x, p.y, p.facing, enemiesRef.current);
    const dashDist = 150;

    let targetX = p.x + Math.cos(angle) * dashDist;
    let targetY = p.y + Math.sin(angle) * dashDist;

    // Check if dash passes through a wall, stop at wall edge
    for (const obs of currentMap.obstacles) {
      if (obs.type === 'building' || obs.type === 'rock' || obs.type === 'wall') {
        if (lineIntersectsRect(p.x, p.y, targetX, targetY, obs.x, obs.y, obs.width, obs.height)) {
          targetX = p.x + Math.cos(angle) * 45;
          targetY = p.y + Math.sin(angle) * 45;
          break;
        }
      }
    }

    targetX = Math.max(30, Math.min(currentMap.width - 30, targetX));
    targetY = Math.max(30, Math.min(currentMap.height - 30, targetY));

    // Perfect Dodge Window Detection:
    // Check if any enemy is currently in attack windup (near strike <= 0.26s) within 170px
    // OR if an active enemy projectile is heading near player within 130px
    let isPerfectDodge = false;
    enemiesRef.current.forEach(enemy => {
      if (enemy.hp <= 0) return;
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist <= 170 && enemy.state === 'attack_windup' && enemy.windupTimer <= 0.26) {
        isPerfectDodge = true;
      }
    });

    if (!isPerfectDodge) {
      projectilesRef.current.forEach(proj => {
        if (!proj.fromPlayer && proj.life > 0) {
          const dist = Math.hypot(proj.x - p.x, proj.y - p.y);
          if (dist <= 130) {
            isPerfectDodge = true;
          }
        }
      });
    }

    const afterImageColor = isPerfectDodge ? '#fbbf24' : '#38bdf8';
    const afterImageCount = isPerfectDodge ? 6 : 4;

    // Spawn afterimages
    for (let i = 0; i < afterImageCount; i++) {
      const frac = i / afterImageCount;
      afterImagesRef.current.push({
        x: p.x + (targetX - p.x) * frac,
        y: p.y + (targetY - p.y) * frac,
        alpha: 0.85 - frac * 0.12,
        color: afterImageColor,
      });
    }

    if (isPerfectDodge) {
      soundManager.playBreakthrough();
      addFloatingText(p.x, p.y - 42, '⚡ NÉ HOÀN HẢO! (TIÊN PHONG HUYỄN ẢNH)', '#facc15', 16);
      addFloatingText(p.x, p.y - 22, '+15 MP · HỒI THÂN PHÁP', '#38bdf8', 13);
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        particlesRef.current.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * (130 + Math.random() * 80),
          vy: Math.sin(a) * (130 + Math.random() * 80),
          life: 0.35,
          maxLife: 0.35,
          color: '#facc15',
          size: 4,
          shape: 'spark',
        });
      }
    } else {
      soundManager.playDash();
    }

    localPosRef.current.x = targetX;
    localPosRef.current.y = targetY;

    onUpdatePlayer(prev => ({
      ...prev,
      x: targetX,
      y: targetY,
      mp: isPerfectDodge ? Math.min(prev.maxMp, prev.mp + 15) : Math.max(0, prev.mp - 12),
      dodgeCooldown: isPerfectDodge ? 0.6 : 1.8,
      isDodging: true,
      dodgeTimer: isPerfectDodge ? 0.65 : 0.35,
      invulnerableTimer: isPerfectDodge ? 0.65 : 0.35,
    }));
  };

  // COMBAT: Skill Triggers (Q, E, R, F)
  const triggerSkillByKey = (key: 'q' | 'e' | 'r' | 'f') => {
    const p = playerRef.current;
    if (p.hp <= 0) return;
    const skill = p.equippedSkills.find(s => s.key === key);
    if (!skill) return;

    // Check spiritual root compatibility before casting!
    const rootCheck = checkArtCompatibility(p.spiritualRoot, skill.element);
    if (!rootCheck.compatible) {
      addFloatingText(p.x, p.y - 35, 'Linh căn bất tương dung, không thể thi triển!', '#ef4444', 14);
      soundManager.playBacklash();
      return;
    }

    if (skill.currentCooldown > 0) {
      addFloatingText(p.x, p.y - 30, 'Đang hồi chiêu!', '#94a3b8', 13);
      return;
    }
    if (p.mp < skill.mpCost) {
      addFloatingText(p.x, p.y - 30, 'Linh lực bất túc!', '#38bdf8', 13);
      return;
    }

    // Spend MP and put on cooldown
    onUpdatePlayer(prev => ({
      ...prev,
      mp: prev.mp - skill.mpCost,
      equippedSkills: prev.equippedSkills.map(s => (s.key === key ? { ...s, currentCooldown: s.cooldown } : s)),
    }));

    if (key === 'q') {
      // 1. THANH TRÚC PHI KIẾM QUYẾT (Q / Ranged 3-Sword Summon & Launch)
      soundManager.playSpell('moc');
      const angle = inputManager.getAimAngle(p.x, p.y, p.facing, enemiesRef.current);
      const mocAffinity = calculateRootAffinity(p.spiritualRoot, 'moc');
      const elementScaling = 1 + (mocAffinity - 40) * 0.005;
      const damage = Math.floor(p.atk * skill.damageMultiplier * elementScaling);

      // Spawn 3 flying swords with distinct staggering, offsets and pincer trajectory
      const count = 3;
      // Staggered launch timings: Left blade first, center blade follow-through, right blade flank
      const delays = [0.08, 0.22, 0.15];
      // Varied flight speeds to break synchronous clone movement
      const speeds = [510, 560, 530];
      // Slight inward pincer angles towards aiming trajectory
      const spreadAngles = [-0.14, 0.14, 0];
      const offsets = [
        { x: -Math.sin(angle) * 22 - Math.cos(angle) * 10, y: Math.cos(angle) * 22 - Math.sin(angle) * 10 },
        { x: Math.sin(angle) * 22 - Math.cos(angle) * 10, y: -Math.cos(angle) * 22 - Math.sin(angle) * 10 },
        { x: -Math.cos(angle) * 24, y: -Math.sin(angle) * 24 },
      ];

      for (let i = 0; i < count; i++) {
        const swordAngle = angle + spreadAngles[i];
        const off = offsets[i];
        const spawnX = p.x + off.x;
        const spawnY = p.y + off.y;
        const delay = delays[i];
        const spd = speeds[i];

        advancedProjectilesRef.current.push({
          id: `adv_sword_${Date.now()}_${i}`,
          skillId: 'skill_phi_kiem',
          x: spawnX,
          y: spawnY,
          startX: spawnX,
          startY: spawnY,
          vx: Math.cos(swordAngle) * spd,
          vy: Math.sin(swordAngle) * spd,
          speed: spd,
          angle: swordAngle,
          damage: Math.floor(damage / 2.2),
          fromPlayer: true,
          element: 'moc',
          life: 0.78,
          maxLife: 0.78,
          radius: 14,
          state: 'summoning',
          summonTimer: delay,
          summonOffset: off,
          trailPoints: [],
        });
      }

      addFloatingText(p.x, p.y - 36, 'PHI KIẾM XUẤT TIÊU!', '#34d399', 15);
    } else if (key === 'e') {
      // 2. LÔI ĐỘNG CỬU THIÊN (E / AoE Heavenly Thunder Ground Strike with Telegraph)
      soundManager.playSpell('hoa');
      const loiAffinity = calculateRootAffinity(p.spiritualRoot, 'loi');
      const elementScaling = 1 + (loiAffinity - 40) * 0.005;
      const damage = Math.floor(p.atk * skill.damageMultiplier * elementScaling);

      // Target resolution: Aim towards mouse within 260px range, or closest enemy, or facing offset
      let targetX = mouseRef.current.worldX;
      let targetY = mouseRef.current.worldY;
      const maxRange = 260;
      const dToMouse = Math.hypot(targetX - p.x, targetY - p.y);

      if (dToMouse > maxRange || (targetX === 0 && targetY === 0)) {
        // Find closest enemy within range
        let closest: Enemy | null = null;
        let cDist = maxRange;
        enemiesRef.current.forEach(e => {
          if (e.hp <= 0) return;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < cDist) {
            cDist = d;
            closest = e;
          }
        });

        if (closest) {
          targetX = (closest as Enemy).x;
          targetY = (closest as Enemy).y;
        } else {
          // Default to facing direction at 160px
          const aimA = inputManager.getAimAngle(p.x, p.y, p.facing);
          targetX = p.x + Math.cos(aimA) * 160;
          targetY = p.y + Math.sin(aimA) * 160;
        }
      }

      // Clamp to map boundaries
      targetX = Math.max(50, Math.min(currentMap.width - 50, targetX));
      targetY = Math.max(50, Math.min(currentMap.height - 50, targetY));

      // Player enters casting mudra pose
      castingAnimRef.current = {
        active: true,
        type: 'thunder',
        progress: 0,
        timer: 0.55,
        maxTimer: 0.55,
      };

      // Spawn AoEZone for Heavenly Thunder
      aoeZonesRef.current.push({
        id: `aoe_thunder_${Date.now()}`,
        x: targetX,
        y: targetY,
        radius: 85,
        phase: 'telegraph',
        timer: 0.55,
        telegraphDuration: 0.55,
        strikeDuration: 0.22,
        aftermathDuration: 0.5,
        damage,
        element: 'loi',
        fromPlayer: true,
        skillId: 'skill_loi_dong',
        hasDealtDamage: false,
        statusEffect: {
          type: 'stun',
          duration: 1.0,
        },
      });

      addFloatingText(p.x, p.y - 36, 'CỬU THIÊN DẪN LÔI!', '#c084fc', 16);
    } else if (key === 'r') {
      // Vạn Kiếm Quy Tông: Orbiting sword blades
      soundManager.playSpell('ngu_hanh');
      const nguHanhAffinity = calculateRootAffinity(p.spiritualRoot, 'ngu_hanh');
      const elementScaling = 1 + (nguHanhAffinity - 40) * 0.005;
      activeSkillsAnimRef.current.swordsActive = true;
      activeSkillsAnimRef.current.swordsTimer = 4.0;
      screenShakeRef.current = 6;
      addFloatingText(p.x, p.y - 40, 'VẠN KIẾM QUY TÔNG!', '#38bdf8', 18);

      enemiesRef.current.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist < 260 && hasLineOfSight(p.x, p.y, enemy.x, enemy.y, currentMap.obstacles)) {
          applyDamageToEnemy(enemy, Math.floor(p.atk * skill.damageMultiplier * elementScaling), true, 'ngu_hanh', Math.atan2(enemy.y - p.y, enemy.x - p.x));
        }
      });
    } else if (key === 'f') {
      // Ất Mộc Hồi Xuân Thuật
      soundManager.playSpell('moc');
      const mocAffinity = calculateRootAffinity(p.spiritualRoot, 'moc');
      const healAmount = Math.floor(p.maxHp * (0.32 + (mocAffinity - 40) * 0.002));
      activeSkillsAnimRef.current.healPillarTimer = 1.0;
      addFloatingText(p.x, p.y - 35, `+${healAmount} Khí Huyết (Ất Mộc)`, '#22c55e', 16);
      onUpdatePlayer(prev => ({
        ...prev,
        hp: Math.min(prev.maxHp, prev.hp + healAmount),
        statusEffects: {
          ...prev.statusEffects,
          injured: false,
        },
      }));

      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        particlesRef.current.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * 60,
          vy: Math.sin(a) * 60,
          life: 0.7,
          maxLife: 0.7,
          color: '#4ade80',
          size: 5,
          shape: 'leaf',
        });
      }
    }
  };

  // COMBAT: Apply Damage & Knockback to Enemy
  const applyDamageToEnemy = (enemy: Enemy, rawAtk: number, isSkill: boolean, element: string, hitAngle: number) => {
    if (enemy.hp <= 0 || enemy.state === 'dead') return;

    const p = playerRef.current;
    const eq = p.equipment;

    // Artifact Passive: Fire skill boost (e.g., Xích Viêm Pháp Đao, Cửu Dương Thần Hỏa Ấn)
    let finalAtk = rawAtk;
    if (element === 'hoa') {
      const firePassive = eq.weapon?.artifactPassive?.trigger === 'fire_skill_boost'
        ? eq.weapon.artifactPassive
        : eq.accessory?.artifactPassive?.trigger === 'fire_skill_boost'
        ? eq.accessory.artifactPassive
        : null;
      if (firePassive) {
        finalAtk = Math.floor(finalAtk * (1 + firePassive.value));
      }
    }

    // Punish Window Damage Bonus (+35% damage during boss exhaustion)
    const isPunished = enemy.isBoss && !!enemy.bossPunishTimer && enemy.bossPunishTimer > 0;
    if (isPunished) {
      finalAtk = Math.floor(finalAtk * 1.35);
    }

    const isCrit = Math.random() < p.critRate;
    let damage = Math.max(1, Math.floor((finalAtk * (isCrit ? 1.8 : 1.0)) - enemy.def * 0.4));

    enemy.hp = Math.max(0, enemy.hp - damage);

    // Artifact Passive: Mana Siphon (Phệ Linh Khí - e.g., Hỗn Nguyên Phệ Linh Châu, Cổ Khuyết Tru Ma Kiếm)
    const siphonPassive = eq.weapon?.artifactPassive?.trigger === 'mana_siphon'
      ? eq.weapon.artifactPassive
      : eq.accessory?.artifactPassive?.trigger === 'mana_siphon'
      ? eq.accessory.artifactPassive
      : null;

    if (siphonPassive && siphonPassive.value > 0) {
      const siphonVal = siphonPassive.value;
      onUpdatePlayer(prev => ({
        ...prev,
        mp: Math.min(prev.maxMp, prev.mp + siphonVal),
      }));
      addFloatingText(p.x, p.y - 35, `+${siphonVal} MP`, '#38bdf8', 12);
    }

    if (isCrit) {
      soundManager.playCritHit();
      screenShakeRef.current = Math.max(screenShakeRef.current, 5.5);
    } else {
      soundManager.playHit();
    }

    // Knockback & hurt reaction
    const knockbackDist = enemy.isBoss ? 8 : 26;
    enemy.x += Math.cos(hitAngle) * knockbackDist;
    enemy.y += Math.sin(hitAngle) * knockbackDist;
    enemy.hurtTimer = 0.22;
    if (enemy.state !== 'attack_windup' || !enemy.isBoss) {
      enemy.state = 'hurt';
    }

    // Boss Phase 2 Enrage check
    if (enemy.isBoss && enemy.bossPhase === 1 && enemy.hp <= enemy.maxHp * 0.5) {
      enemy.bossPhase = 2;
      enemy.speed = Math.floor(enemy.speed * 1.25);
      enemy.attackCooldown = Math.max(1.2, enemy.attackCooldown * 0.7);
      soundManager.playRoar();
      screenShakeRef.current = 10;
      addFloatingText(enemy.x, enemy.y - 55, 'CUỒNG BẠO HÓA THẦN!', '#ef4444', 20);
    }

    // Floating combat text with clear distinction
    addFloatingText(
      enemy.x + (Math.random() - 0.5) * 22,
      enemy.y - 22,
      isCrit ? `💥 BẠO KÍCH! -${damage}` : `-${damage}`,
      isCrit ? '#f59e0b' : '#f8fafc',
      isCrit ? 19 : 14
    );

    if (isPunished) {
      addFloatingText(enemy.x, enemy.y - 42, '⚔️ TRỪNG PHẠT! (+35%)', '#38bdf8', 16);
    }

    // Hit sparks & slash impact effects tailored to attack element/combo step
    let primarySpark = isCrit ? '#fbbf24' : '#38bdf8';
    let secondarySpark = '#ffffff';
    let impactRingColor = isCrit ? '#f59e0b' : '#38bdf8';
    let ringSize = isCrit ? 30 : 20;

    if (element === 'kiem_step1') {
      primarySpark = '#38bdf8';
      secondarySpark = '#a7f3d0';
      impactRingColor = '#38bdf8';
      ringSize = 22;
    } else if (element === 'kiem_step2') {
      primarySpark = '#34d399';
      secondarySpark = '#6ee7b7';
      impactRingColor = '#10b981';
      ringSize = 24;
    } else if (element === 'kiem_step3') {
      primarySpark = '#f59e0b';
      secondarySpark = '#fef08a';
      impactRingColor = '#f59e0b';
      ringSize = 38;
    } else if (element === 'loi') {
      primarySpark = '#c084fc';
      secondarySpark = '#67e8f9';
      impactRingColor = '#9333ea';
      ringSize = 32;
    } else if (element === 'moc') {
      primarySpark = '#34d399';
      secondarySpark = '#a7f3d0';
      impactRingColor = '#059669';
      ringSize = 24;
    }

    const sparkCount = isCrit ? 16 : (element === 'kiem_step3' ? 14 : 9);
    for (let i = 0; i < sparkCount; i++) {
      const a = hitAngle + (Math.random() - 0.5) * (isCrit ? Math.PI : 1.1);
      particlesRef.current.push({
        x: enemy.x + (Math.random() - 0.5) * 8,
        y: enemy.y + (Math.random() - 0.5) * 8,
        vx: Math.cos(a) * (isCrit ? 170 + Math.random() * 150 : 110 + Math.random() * 120),
        vy: Math.sin(a) * (isCrit ? 170 + Math.random() * 150 : 110 + Math.random() * 120),
        life: isCrit ? 0.38 : 0.26,
        maxLife: isCrit ? 0.38 : 0.26,
        color: Math.random() > 0.4 ? primarySpark : secondarySpark,
        size: isCrit ? 4.5 : 3.2,
        shape: 'spark',
      });
    }

    // Slash impact flash ring at exact hit coordinate
    particlesRef.current.push({
      x: enemy.x,
      y: enemy.y,
      vx: 0,
      vy: 0,
      life: 0.2,
      maxLife: 0.2,
      color: impactRingColor,
      size: ringSize,
      shape: 'ring',
    });

    // Enemy Death & Loot Drops (with single execution guard to prevent duplicate rewards)
    if (enemy.hp <= 0 && !enemy.hasGivenRewards) {
      enemy.state = 'dead';
      enemy.hasGivenRewards = true;

      addFloatingText(enemy.x, enemy.y - 45, `+${enemy.expReward} Tu Vi`, '#38bdf8', 16);
      addFloatingText(enemy.x, enemy.y - 25, `+${enemy.spiritStonesReward} Linh Thạch`, '#fbbf24', 15);

      // Boss Victory & Major Loot Modal
      if (enemy.isBoss && onBossDefeated) {
        const bossItems: { item: any; count: number }[] = [];
        for (const drop of enemy.dropTable) {
          if (Math.random() <= drop.chance) {
            const count = Math.floor(1 + Math.random() * drop.maxCount);
            const it = ITEMS[drop.itemId];
            if (it) {
              bossItems.push({ item: it, count });
            }
          }
        }
        // Ensure at least 1 guaranteed reward item for defeating a mighty boss
        if (bossItems.length === 0 && enemy.dropTable.length > 0) {
          const drop = enemy.dropTable[0];
          const it = ITEMS[drop.itemId];
          if (it) {
            bossItems.push({ item: it, count: 1 });
          }
        }

        const lootData: BossLootData = {
          bossId: enemy.id,
          bossName: enemy.name,
          bossTitle: enemy.bossTitle || 'Thủ Lĩnh Yêu Vương',
          exp: enemy.expReward,
          spiritStones: enemy.spiritStonesReward,
          items: bossItems,
        };
        onBossDefeated(lootData);
      } else {
        // Spawn physical Ground Drops for regular minions
        const dropCount = 2;
        for (let i = 0; i < dropCount; i++) {
          const spreadAngle = Math.random() * Math.PI * 2;
          const spd = 60 + Math.random() * 80;

          // Check drop table
          let droppedItem: any = null;
          for (const drop of enemy.dropTable) {
            if (Math.random() <= drop.chance) {
              droppedItem = {
                itemId: drop.itemId,
                count: Math.floor(1 + Math.random() * drop.maxCount),
              };
              break;
            }
          }

          const it = droppedItem ? ITEMS[droppedItem.itemId] : null;

          groundDropsRef.current.push({
            id: `drop_${Date.now()}_${Math.random()}`,
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(spreadAngle) * spd,
            vy: Math.sin(spreadAngle) * spd,
            itemId: it?.id,
            count: droppedItem?.count || 1,
            spiritStones: Math.floor(enemy.spiritStonesReward / dropCount),
            exp: Math.floor(enemy.expReward / dropCount),
            name: it?.name || 'Linh Thạch',
            icon: it?.icon || '💎',
            rarity: it?.rarity || 'pham',
            life: 45,
            maxLife: 45,
            bobTimer: Math.random() * 5,
          });
        }
      }

      onEnemyKilled(enemy.id);
    }
  };

  // Interaction (NPCs, Gathering, Portals)
  const handleInteraction = () => {
    const p = playerRef.current;
    if (p.hp <= 0) return;

    // Check NPC
    for (const npc of currentMap.npcs) {
      const dist = Math.hypot(npc.x - p.x, npc.y - p.y);
      if (dist <= npc.interactionRadius) {
        onOpenDialogue(npc.id);
        return;
      }
    }

    // Check Collectible Resources & Ancient Relics
    for (const res of resourcesRef.current) {
      if (!res.collected && res.currentRespawnTimer <= 0) {
        const dist = Math.hypot(res.x - p.x, res.y - p.y);
        if (dist <= 75) {
          if (res.type === 'stele' || res.type === 'altar' || res.type === 'ancient_mechanism') {
            if (onOpenStele) {
              onOpenStele(res);
              return;
            }
          }
          res.collected = true;
          res.currentRespawnTimer = res.respawnTime;
          soundManager.playCollect();

          const it = ITEMS[res.itemId];
          if (it) {
            addFloatingText(res.x, res.y - 30, `Thu hái [${it.name}] x${res.count}`, '#4ade80', 15);
            onUpdatePlayer(prev => {
              const updatedInv = [...prev.inventory];
              const existing = updatedInv.find(slot => slot.item.id === it.id);
              if (existing && it.stackable) {
                existing.count += res.count;
              } else if (updatedInv.length < prev.maxInventorySize) {
                updatedInv.push({ item: it, count: res.count });
              }
              return { ...prev, inventory: updatedInv };
            });
          }
          return;
        }
      }
    }

    // Check Portals
    for (const portal of currentMap.portals) {
      const dist = Math.hypot(portal.x - p.x, portal.y - p.y);
      if (dist <= 70) {
        if (portal.isSecretDungeon && onOpenDungeonGate) {
          onOpenDungeonGate(portal);
          return;
        }
        if (portal.minRealmIndex !== undefined && p.realmIndex < portal.minRealmIndex) {
          addFloatingText(p.x, p.y - 35, `Cảnh giới bất túc, chưa thể tiến vào!`, '#ef4444', 15);
          return;
        }
        soundManager.playDash();
        onUpdatePlayer(prev => ({
          ...prev,
          currentMapId: portal.toMapId,
          x: portal.targetX,
          y: portal.targetY,
          discoveredMaps: prev.discoveredMaps.includes(portal.toMapId)
            ? prev.discoveredMaps
            : [...prev.discoveredMaps, portal.toMapId],
        }));
        return;
      }
    }

    // Check Territory Stronghold on this map
    const mapStrongholds = STRONGHOLDS.filter(s => s.mapId === currentMap.id);
    for (const sh of mapStrongholds) {
      const dist = Math.hypot(sh.x - p.x, sh.y - p.y);
      if (dist <= 85) {
        if (onOpenWarRoom) {
          onOpenWarRoom();
          return;
        }
      }
    }

    // Check Active World Event on this map
    const activeEvents = WORLD_EVENTS.filter(
      e => e.mapId === currentMap.id && !p.completedEventIds?.includes(e.id)
    );
    for (const ev of activeEvents) {
      const dist = Math.hypot(ev.x - p.x, ev.y - p.y);
      if (dist <= 85) {
        if (onOpenWarRoom) {
          onOpenWarRoom();
          return;
        }
      }
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string, size: number) => {
    floatingTextsRef.current.push({
      id: `${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      size,
      life: 1.2,
      maxLife: 1.2,
      vy: -35,
    });
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const p = playerRef.current;
      const paused = isPausedRef.current || p.hp <= 0;

      // Handle Hit-Stop micro freeze for crunchy impact feel
      if (hitStopTimerRef.current > 0) {
        hitStopTimerRef.current -= dt;
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // 1. Update Player Movement (unified inputManager for Keyboard & Touch Joystick)
      let moveX = 0;
      let moveY = 0;
      if (!paused && p.hp > 0) {
        const moveVec = inputManager.getMoveVector();
        moveX = moveVec.x;
        moveY = moveVec.y;
      }

      let newX = localPosRef.current.x + moveX * p.speed * dt;
      let newY = localPosRef.current.y + moveY * p.speed * dt;

      // Obstacle collision check with smooth sliding
      currentMap.obstacles.forEach(obs => {
        if (newX + 16 > obs.x && newX - 16 < obs.x + obs.width && newY + 20 > obs.y && newY - 20 < obs.y + obs.height) {
          if (localPosRef.current.x + 16 <= obs.x || localPosRef.current.x - 16 >= obs.x + obs.width) newX = localPosRef.current.x;
          if (localPosRef.current.y + 20 <= obs.y || localPosRef.current.y - 20 >= obs.y + obs.height) newY = localPosRef.current.y;
        }
      });

      newX = Math.max(30, Math.min(currentMap.width - 30, newX));
      newY = Math.max(30, Math.min(currentMap.height - 30, newY));

      const facing: 'left' | 'right' | 'up' | 'down' =
        Math.abs(moveX) > Math.abs(moveY)
          ? moveX < 0 ? 'left' : 'right'
          : moveY < 0 ? 'up' : 'down';

      // Update movement animations and footsteps dust
      const isMoving = moveX !== 0 || moveY !== 0;
      if (isMoving && !paused) {
        walkAnimTimerRef.current += dt * 10;
        stationaryIdleTimerRef.current = 0;
        dustPuffTimerRef.current += dt;
        if (dustPuffTimerRef.current >= 0.22) {
          dustPuffTimerRef.current = 0;
          particlesRef.current.push({
            x: p.x + (Math.random() - 0.5) * 8,
            y: p.y + 14,
            vx: -moveX * 16 + (Math.random() - 0.5) * 8,
            vy: -moveY * 16 - 8,
            life: 0.26,
            maxLife: 0.26,
            color: 'rgba(168, 162, 158, 0.6)',
            size: 3.5,
            shape: 'smoke',
          });
        }
      } else {
        stationaryIdleTimerRef.current += dt;
      }

      // Proximity interaction check for mobile TouchControls (throttled every 150ms)
      interactionCheckTickerRef.current += dt;
      if (interactionCheckTickerRef.current >= 0.15) {
        interactionCheckTickerRef.current = 0;
        let isNear = false;
        // Check NPC proximity
        for (const npc of currentMap.npcs) {
          if (Math.hypot(npc.x - p.x, npc.y - p.y) <= npc.interactionRadius) {
            isNear = true;
            break;
          }
        }
        // Check Collectibles
        if (!isNear) {
          for (const res of resourcesRef.current) {
            if (!res.collected && res.currentRespawnTimer <= 0 && Math.hypot(res.x - p.x, res.y - p.y) <= 75) {
              isNear = true;
              break;
            }
          }
        }
        // Check Portals
        if (!isNear) {
          for (const portal of currentMap.portals) {
            if (Math.hypot(portal.x - p.x, portal.y - p.y) <= 70) {
              isNear = true;
              break;
            }
          }
        }
        // Check Ground Drops
        if (!isNear) {
          for (const drop of groundDropsRef.current) {
            if (drop.life > 0 && Math.hypot(drop.x - p.x, drop.y - p.y) <= 80) {
              isNear = true;
              break;
            }
          }
        }
        if (isNear !== lastInteractionNearRef.current) {
          lastInteractionNearRef.current = isNear;
          if (onInteractionNearChange) {
            onInteractionNearChange(isNear);
          }
        }
      }

      const newDodgeTimer = Math.max(0, p.dodgeTimer - dt);
      const isDodging = newDodgeTimer > 0;
      const newDodgeCooldown = Math.max(0, p.dodgeCooldown - dt);
      const newInvulnTimer = Math.max(0, (p.invulnerableTimer || 0) - dt);
      const newHurtFlash = Math.max(0, (p.hurtFlashTimer || 0) - dt);
      const newPassiveShieldCooldown = Math.max(0, (p.passiveShieldCooldown || 0) - dt);

      let newHp = Math.min(p.maxHp, p.hp + 2 * dt);
      let newMp = Math.min(p.maxMp, p.mp + 4 * dt);

      const updatedSkills = p.equippedSkills.map(s => ({
        ...s,
        currentCooldown: Math.max(0, s.currentCooldown - dt),
      }));

      const skillsNeedUpdate = p.equippedSkills.some(s => s.currentCooldown > 0);
      const timersNeedUpdate = newDodgeCooldown > 0 || p.dodgeCooldown > 0 || (p.invulnerableTimer || 0) > 0 || (p.hurtFlashTimer || 0) > 0 || (p.passiveShieldCooldown || 0) > 0;
      const dodgingChanged = isDodging !== p.isDodging;

      localPosRef.current.x = newX;
      localPosRef.current.y = newY;
      if (isMoving) localPosRef.current.facing = facing;

      // 60 FPS Subpixel Motion Smoothing (Anti-jitter interpolation)
      animPosRef.current.x += (localPosRef.current.x - animPosRef.current.x) * 0.35;
      animPosRef.current.y += (localPosRef.current.y - animPosRef.current.y) * 0.35;
      if (Math.abs(localPosRef.current.x - animPosRef.current.x) < 0.05) animPosRef.current.x = localPosRef.current.x;
      if (Math.abs(localPosRef.current.y - animPosRef.current.y) < 0.05) animPosRef.current.y = localPosRef.current.y;

      p.x = newX;
      p.y = newY;
      p.facing = localPosRef.current.facing;
      p.hp = newHp;
      p.mp = newMp;
      p.isDodging = isDodging;
      p.dodgeTimer = newDodgeTimer;
      p.dodgeCooldown = newDodgeCooldown;
      p.invulnerableTimer = newInvulnTimer;
      p.hurtFlashTimer = newHurtFlash;
      p.passiveShieldCooldown = newPassiveShieldCooldown;
      p.equippedSkills = updatedSkills;

      // Throttle React State Sync (Max once every 0.5s, or immediately upon stopping or dodge trigger)
      syncTickerRef.current += dt;
      const justStopped = wasMovingRef.current && !isMoving;
      wasMovingRef.current = isMoving;

      if (!paused && p.hp > 0 && (syncTickerRef.current >= 0.5 || justStopped || dodgingChanged)) {
        syncTickerRef.current = 0;
        onUpdatePlayer(prev => ({
          ...prev,
          x: localPosRef.current.x,
          y: localPosRef.current.y,
          facing: localPosRef.current.facing,
          hp: p.hp,
          mp: p.mp,
          isDodging: p.isDodging,
          dodgeTimer: p.dodgeTimer,
          dodgeCooldown: p.dodgeCooldown,
          invulnerableTimer: p.invulnerableTimer,
          hurtFlashTimer: p.hurtFlashTimer,
          passiveShieldCooldown: p.passiveShieldCooldown,
          equippedSkills: p.equippedSkills,
        }));
      }

      // Passive game time advancement (every 50s real-time = 1 canh giờ)
      if (!paused) {
        gameTimeTickerRef.current += dt;
        if (gameTimeTickerRef.current >= 50) {
          gameTimeTickerRef.current = 0;
          onUpdatePlayer(prev => ({
            ...prev,
            gameTime: advanceGameTime(prev.gameTime, 1),
          }));
        }
      }

      // Combo Window Timer countdown (when not actively swinging)
      if (!attackAnimRef.current.active && comboStateRef.current.comboWindowTimer > 0) {
        comboStateRef.current.comboWindowTimer -= dt;
        if (comboStateRef.current.comboWindowTimer <= 0) {
          comboStateRef.current.currentStep = 1;
          setActiveComboStep(1);
        }
      }

      // 2. Attack Visuals & Active-Frame Hit Detection Update
      if (attackAnimRef.current.active) {
        const anim = attackAnimRef.current;
        anim.progress += dt / (anim.duration || 0.26);

        // Active damage frames:
        // Steps 1 & 2: Anticipation [0.0 - 0.20], Active [0.20 - 0.65], Recovery [0.65 - 1.0]
        // Step 3: Anticipation [0.0 - 0.25], Active [0.25 - 0.70], Recovery [0.70 - 1.0]
        const activeStart = anim.step === 3 ? 0.25 : 0.20;
        const activeEnd = anim.step === 3 ? 0.70 : 0.65;

        // Spawn Traveling Sword Qi Wave (Kiếm Khí Trảm) matching character's slash angle & step
        if (anim.progress >= activeStart && !anim.hasSpawnedWave) {
          anim.hasSpawnedWave = true;
          const waveSpeed = anim.step === 3 ? 460 : 410;
          const waveLife = 0.38;
          const waveDmg = Math.floor(p.atk * anim.damageMult * 0.75);
          const slashElement: import('../types/game').ElementType = anim.step === 1 ? 'kim' : anim.step === 2 ? 'phong' : 'tho';

          advancedProjectilesRef.current.push({
            id: `sword_wave_${Date.now()}_${Math.random()}`,
            skillId: 'skill_slash',
            x: p.x + Math.cos(anim.angle) * 36,
            y: p.y + Math.sin(anim.angle) * 36,
            startX: p.x,
            startY: p.y,
            vx: Math.cos(anim.angle) * waveSpeed,
            vy: Math.sin(anim.angle) * waveSpeed,
            speed: waveSpeed,
            angle: anim.angle,
            damage: waveDmg,
            fromPlayer: true,
            element: slashElement,
            life: waveLife,
            maxLife: waveLife,
            radius: 22,
            state: 'flying',
            summonTimer: 0,
            summonOffset: { x: 0, y: 0 },
            trailPoints: [],
          });
        }

        if (anim.progress >= activeStart && anim.progress <= activeEnd && !anim.hasDealtDamage) {
          anim.hasDealtDamage = true;
          let hitAny = false;

          enemiesRef.current.forEach(enemy => {
            if (enemy.hp <= 0) return;
            const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
            if (dist <= anim.range) {
              const enemyAngle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
              let angleDiff = enemyAngle - anim.angle;
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

              if (Math.abs(angleDiff) <= anim.slashArc / 2) {
                if (hasLineOfSight(p.x, p.y, enemy.x, enemy.y, currentMap.obstacles)) {
                  hitAny = true;
                  // Knockback
                  enemy.x += Math.cos(anim.angle) * anim.knockback;
                  enemy.y += Math.sin(anim.angle) * anim.knockback;

                  // Mini-stun on heavy cleave (Step 3) with Boss CC Diminishing Returns
                  if (anim.step === 3) {
                    if (enemy.isBoss) {
                      if (enemy.bossImmuneTimer && enemy.bossImmuneTimer > 0) {
                        addFloatingText(enemy.x, enemy.y - 30, '🛡️ KHÁNG CHOÁNG!', '#94a3b8', 13);
                      } else {
                        enemy.stunTimer = 0.45;
                        enemy.bossImmuneTimer = 3.5;
                        addFloatingText(enemy.x, enemy.y - 30, 'CHOÁNG VÁNG!', '#fbbf24', 14);
                      }
                    } else {
                      enemy.stunTimer = 0.55;
                      addFloatingText(enemy.x, enemy.y - 30, 'CHOÁNG VÁNG!', '#fbbf24', 14);
                    }
                  }

                  // Apply damage with combo damage multiplier
                  const comboElement = anim.step === 1 ? 'kiem_step1' : anim.step === 2 ? 'kiem_step2' : 'kiem_step3';
                  applyDamageToEnemy(enemy, Math.floor(p.atk * anim.damageMult), false, comboElement, anim.angle);
                }
              }
            }
          });

          // Only trigger combat hit reactions if an enemy was actually hit
          if (hitAny) {
            hitStopTimerRef.current = anim.step === 3 ? 0.08 : 0.045;

            // Step 3 Heavy Ground Split Shockwave FX only triggers on actual impact
            if (anim.step === 3) {
              screenShakeRef.current = Math.max(screenShakeRef.current, 5.0);
              for (let i = 1; i <= 3; i++) {
                const fx = p.x + Math.cos(anim.angle) * (i * 32);
                const fy = p.y + Math.sin(anim.angle) * (i * 32);
                particlesRef.current.push({
                  x: fx,
                  y: fy,
                  vx: (Math.random() - 0.5) * 50,
                  vy: (Math.random() - 0.5) * 50,
                  life: 0.35,
                  maxLife: 0.35,
                  color: '#f59e0b',
                  size: 6,
                  shape: 'spark',
                });
              }
            }

            soundManager.playHit();
            soundManager.playBeastYelp();
          }
        }

        if (anim.progress >= 1) {
          anim.active = false;
          // Step 3 finishes combo sequence; steps 1 & 2 open 0.75s combo window
          if (anim.step === 3) {
            comboStateRef.current.currentStep = 1;
            comboStateRef.current.comboWindowTimer = 0;
            setActiveComboStep(1);
          } else {
            comboStateRef.current.comboWindowTimer = 0.75;
          }

          if (queuedAttackRef.current) {
            queuedAttackRef.current = false;
            triggerBasicAttack();
          }
        }
      }

      if (castingAnimRef.current.active) {
        castingAnimRef.current.timer -= dt;
        castingAnimRef.current.progress = 1 - Math.max(0, castingAnimRef.current.timer) / castingAnimRef.current.maxTimer;
        if (castingAnimRef.current.timer <= 0) {
          castingAnimRef.current.active = false;
        }
      }

      if (activeSkillsAnimRef.current.shieldActive) {
        activeSkillsAnimRef.current.shieldTimer -= dt;
        if (activeSkillsAnimRef.current.shieldTimer <= 0) {
          activeSkillsAnimRef.current.shieldActive = false;
        }
      }
      if (activeSkillsAnimRef.current.swordsActive) {
        activeSkillsAnimRef.current.swordsTimer -= dt;
        activeSkillsAnimRef.current.swordsOrbitAngle += dt * 8;
        if (activeSkillsAnimRef.current.swordsTimer <= 0) {
          activeSkillsAnimRef.current.swordsActive = false;
        }
      }
      if (activeSkillsAnimRef.current.healPillarTimer > 0) {
        activeSkillsAnimRef.current.healPillarTimer -= dt;
      }

      if (screenShakeRef.current > 0) {
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 25);
      }

      // 3. Projectiles Update
      projectilesRef.current.forEach(proj => {
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.life -= dt;

        // Check obstacle collision
        currentMap.obstacles.forEach(obs => {
          if (proj.x >= obs.x && proj.x <= obs.x + obs.width && proj.y >= obs.y && proj.y <= obs.y + obs.height) {
            proj.life = 0; // impact wall
          }
        });

        // Hit enemies if player projectile
        if (proj.fromPlayer) {
          enemiesRef.current.forEach(enemy => {
            if (enemy.hp <= 0 || proj.life <= 0) return;
            const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
            if (dist <= proj.radius + (enemy.radius || 20)) {
              applyDamageToEnemy(enemy, proj.damage, true, proj.element, Math.atan2(proj.vy, proj.vx));
              proj.life = 0;
            }
          });
        } else {
          // Hit player if enemy projectile
          const distToPlayer = Math.hypot(p.x - proj.x, p.y - proj.y);
          if (distToPlayer <= proj.radius + 18 && proj.life > 0) {
            proj.life = 0;
            if (!p.isDodging && (p.invulnerableTimer || 0) <= 0) {
              let incoming = Math.max(1, Math.floor(proj.damage - p.def * 0.4));
              if (activeSkillsAnimRef.current.shieldActive) {
                incoming = Math.floor(incoming * 0.4);
                addFloatingText(p.x, p.y - 25, 'Kim Chung Chắn Đỡ!', '#eab308', 13);
              }
              soundManager.playHit();
              addFloatingText(p.x, p.y - 25, `-${incoming}`, '#ef4444', 16);
              screenShakeRef.current = 5;
              onUpdatePlayer(prev => {
                const newHp = Math.max(0, prev.hp - incoming);
                const shieldPassive = prev.equipment.accessory?.artifactPassive?.trigger === 'low_hp_shield'
                  ? prev.equipment.accessory.artifactPassive
                  : prev.equipment.talisman?.artifactPassive?.trigger === 'low_hp_shield'
                  ? prev.equipment.talisman.artifactPassive
                  : null;

                let newShieldCd = prev.passiveShieldCooldown || 0;
                if (shieldPassive && newHp > 0 && newHp <= prev.maxHp * 0.3 && newShieldCd <= 0) {
                  newShieldCd = 35;
                  activeSkillsAnimRef.current.shieldActive = true;
                  activeSkillsAnimRef.current.shieldTimer = 8;
                  soundManager.playBreakthrough();
                  addFloatingText(prev.x, prev.y - 45, 'BÁT QUÁI HỘ TÂM! KIM CHUNG HỘ THỂ!', '#facc15', 18);
                }

                return {
                  ...prev,
                  hp: newHp,
                  passiveShieldCooldown: newShieldCd,
                  invulnerableTimer: 0.45,
                  hurtFlashTimer: 0.2,
                };
              });
            }
          }
        }
      });
      projectilesRef.current = projectilesRef.current.filter(pr => pr.life > 0);

      // 3B. Advanced Multi-Flying Swords Update (Thanh Trúc Phi Kiếm)
      advancedProjectilesRef.current.forEach(proj => {
        if (proj.state === 'summoning') {
          proj.summonTimer -= dt;
          proj.x = p.x + proj.summonOffset.x;
          proj.y = p.y + proj.summonOffset.y;
          if (proj.summonTimer <= 0) {
            proj.state = 'flying';
            soundManager.playSlash();
          }
        } else if (proj.state === 'flying') {
          proj.x += proj.vx * dt;
          proj.y += proj.vy * dt;
          proj.life -= dt;

          proj.trailPoints.push({ x: proj.x, y: proj.y, alpha: 1 });
          if (proj.trailPoints.length > 8) {
            proj.trailPoints.shift();
          }

          // Wall collision
          currentMap.obstacles.forEach(obs => {
            if (proj.x >= obs.x && proj.x <= obs.x + obs.width && proj.y >= obs.y && proj.y <= obs.y + obs.height) {
              proj.state = 'impact';
              proj.life = 0.22;
              proj.maxLife = 0.22;
            }
          });

          // Enemy collision
          if (proj.state === 'flying') {
            enemiesRef.current.forEach(enemy => {
              if (enemy.hp <= 0 || proj.state !== 'flying') return;
              // Prevent duplicate damage on the same target if they were just struck by melee slash
              if (proj.skillId === 'skill_slash' && enemy.hurtTimer && enemy.hurtTimer > 0.12) return;

              const dist = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
              if (dist <= proj.radius + (enemy.radius || 20)) {
                applyDamageToEnemy(enemy, proj.damage, true, proj.element, proj.angle);
                enemy.hurtTimer = 0.35;
                enemy.x += Math.cos(proj.angle) * 24;
                enemy.y += Math.sin(proj.angle) * 24;

                proj.state = 'impact';
                proj.life = 0.22;
                proj.maxLife = 0.22;

                // Impact sparks
                for (let i = 0; i < 6; i++) {
                  const spA = proj.angle + (Math.random() - 0.5) * 1.5;
                  particlesRef.current.push({
                    x: proj.x,
                    y: proj.y,
                    vx: Math.cos(spA) * (140 + Math.random() * 80),
                    vy: Math.sin(spA) * (140 + Math.random() * 80),
                    life: 0.25,
                    maxLife: 0.25,
                    color: Math.random() > 0.5 ? '#34d399' : '#38bdf8',
                    size: 4,
                    shape: 'spark',
                  });
                }
              }
            });
          }

          if (proj.life <= 0 && proj.state === 'flying') {
            proj.state = 'impact';
            proj.life = 0.18;
            proj.maxLife = 0.18;
          }
        } else if (proj.state === 'impact') {
          proj.life -= dt;
        }
      });
      advancedProjectilesRef.current = advancedProjectilesRef.current.filter(pr => pr.life > 0);

      // 3C. AoE Zones Update (Lôi Động Cửu Thiên)
      aoeZonesRef.current.forEach(zone => {
        zone.timer -= dt;

        if (zone.phase === 'telegraph' && zone.timer <= 0) {
          zone.phase = 'strike';
          zone.timer = zone.strikeDuration;
          soundManager.playSpell('hoa');
          screenShakeRef.current = 5.5;

          if (!zone.hasDealtDamage) {
            zone.hasDealtDamage = true;
            enemiesRef.current.forEach(enemy => {
              if (enemy.hp <= 0) return;
              const dist = Math.hypot(enemy.x - zone.x, enemy.y - zone.y);
              if (dist <= zone.radius + (enemy.radius || 20)) {
                applyDamageToEnemy(enemy, zone.damage, true, zone.element, Math.atan2(enemy.y - zone.y, enemy.x - zone.x));
                enemy.hurtTimer = 1.0;
                enemy.x += Math.cos(Math.atan2(enemy.y - zone.y, enemy.x - zone.x)) * 32;
                enemy.y += Math.sin(Math.atan2(enemy.y - zone.y, enemy.x - zone.x)) * 32;
                addFloatingText(enemy.x, enemy.y - 32, '⚡ TÊ LIỆT!', '#c084fc', 16);

                for (let i = 0; i < 14; i++) {
                  const a = Math.random() * Math.PI * 2;
                  particlesRef.current.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(a) * (150 + Math.random() * 100),
                    vy: Math.sin(a) * (150 + Math.random() * 100),
                    life: 0.35,
                    maxLife: 0.35,
                    color: Math.random() > 0.5 ? '#c084fc' : '#67e8f9',
                    size: 5,
                    shape: 'spark',
                  });
                }
              }
            });
          }
        } else if (zone.phase === 'strike' && zone.timer <= 0) {
          zone.phase = 'aftermath';
          zone.timer = zone.aftermathDuration;
        } else if (zone.phase === 'aftermath' && zone.timer <= 0) {
          zone.phase = 'done';
        }
      });
      aoeZonesRef.current = aoeZonesRef.current.filter(z => z.phase !== 'done');

      // 4. Enemy AI Update
      enemiesRef.current.forEach((enemy, eIdx) => {
        if (enemy.hp <= 0) return;

        // Decrement CC immune timer
        if (enemy.bossImmuneTimer && enemy.bossImmuneTimer > 0) {
          enemy.bossImmuneTimer -= dt;
        }

        // Decrement stun timer
        if (enemy.stunTimer && enemy.stunTimer > 0) {
          enemy.stunTimer -= dt;
          return; // Stunned: skip AI movement and attack
        }

        // Decrement Boss Punish / Exhaustion Window
        if (enemy.isBoss && enemy.bossPunishTimer && enemy.bossPunishTimer > 0) {
          enemy.bossPunishTimer -= dt;
          return; // Boss is exhausted during punish window: vulnerable, cannot move or attack!
        }

        // Decrement hurt timer
        if (enemy.hurtTimer && enemy.hurtTimer > 0) {
          enemy.hurtTimer -= dt;
          if (enemy.hurtTimer <= 0 && enemy.state === 'hurt') {
            enemy.state = 'chase';
          }
        }

        // Boss Phase 2 Enrage check
        if (enemy.isBoss && enemy.hp < enemy.maxHp * 0.5 && (!enemy.bossPhase || enemy.bossPhase === 1)) {
          enemy.bossPhase = 2;
          enemy.speed = Math.floor(enemy.speed * 1.35);
          enemy.atk = Math.floor(enemy.atk * 1.25);
          soundManager.playRoar();
          screenShakeRef.current = 10;
          addFloatingText(enemy.x, enemy.y - 45, 'HẮC HUYẾT CUỒNG NỘ (PHASE 2)!', '#ef4444', 20);
        }

        const distToPlayer = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        const distToSpawn = Math.hypot((enemy.spawnX || enemy.x) - enemy.x, (enemy.spawnY || enemy.y) - enemy.y);
        const clearLoS = hasLineOfSight(enemy.x, enemy.y, p.x, p.y, currentMap.obstacles);

        // State Machine
        if (enemy.state === 'return') {
          // Returning to home spawn point
          const homeX = enemy.spawnX || enemy.x;
          const homeY = enemy.spawnY || enemy.y;
          const distHome = Math.hypot(homeX - enemy.x, homeY - enemy.y);

          if (distHome > 15) {
            const returnAngle = Math.atan2(homeY - enemy.y, homeX - enemy.x);
            enemy.x += Math.cos(returnAngle) * (enemy.speed * 1.1) * dt;
            enemy.y += Math.sin(returnAngle) * (enemy.speed * 1.1) * dt;
            // Heal 10% hp per sec while returning
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.1 * dt);
          } else {
            enemy.state = 'idle';
            enemy.patrolTimer = 2.0;
          }
        } else if (distToSpawn > (enemy.leashRange || 380)) {
          // Leash trigger: player ran too far away
          enemy.state = 'return';
          addFloatingText(enemy.x, enemy.y - 25, 'Rút lui!', '#94a3b8', 12);
        } else if (distToPlayer <= (enemy.isBoss ? enemy.attackRange + 120 : enemy.attackRange) && clearLoS) {
          // Inside attack range
          enemy.attackTimer -= dt;
          if (enemy.attackTimer <= 0 && enemy.state !== 'attack_windup') {
            enemy.state = 'attack_windup';
            if (enemy.isBoss) {
              const rand = Math.random();
              if (rand < 0.35) {
                enemy.bossAttackPattern = 'slam';
                enemy.windupTimer = 0.85;
                enemy.telegraphRadius = 140;
              } else if (rand < 0.70) {
                enemy.bossAttackPattern = 'charge';
                enemy.windupTimer = 0.75;
                enemy.chargeTarget = { x: p.x, y: p.y };
              } else {
                enemy.bossAttackPattern = 'roar';
                enemy.windupTimer = 0.65;
              }
            } else {
              enemy.windupTimer = 0.38;
            }
            enemy.attackTimer = enemy.attackCooldown;
          }
        } else if (distToPlayer <= enemy.aggroRange && clearLoS) {
          // In aggro range
          if (enemy.state === 'idle' || enemy.state === 'patrol') {
            // First detection
            enemy.state = 'detect';
            enemy.detectTimer = 0.35;
            if (enemy.category === 'boss') soundManager.playRoar();
          } else if (enemy.state === 'detect') {
            enemy.detectTimer = (enemy.detectTimer || 0) - dt;
            if ((enemy.detectTimer || 0) <= 0) {
              enemy.state = 'chase';
            }
          } else if (enemy.state === 'chase') {
            // Chasing player
            const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
            let nextEx = enemy.x + Math.cos(angle) * enemy.speed * dt;
            let nextEy = enemy.y + Math.sin(angle) * enemy.speed * dt;

            // Obstacle collision for enemy
            currentMap.obstacles.forEach(obs => {
              const rad = enemy.radius || 20;
              if (nextEx + rad > obs.x && nextEx - rad < obs.x + obs.width && nextEy + rad > obs.y && nextEy - rad < obs.y + obs.height) {
                if (enemy.x + rad <= obs.x || enemy.x - rad >= obs.x + obs.width) nextEx = enemy.x;
                if (enemy.y + rad <= obs.y || enemy.y - rad >= obs.y + obs.height) nextEy = enemy.y;
              }
            });

            enemy.x = nextEx;
            enemy.y = nextEy;
          }
        } else {
          // Idle / Patrol
          enemy.state = 'patrol';
          enemy.patrolTimer = (enemy.patrolTimer || 0) - dt;
          if ((enemy.patrolTimer || 0) <= 0) {
            enemy.patrolTimer = 2.5 + Math.random() * 2;
            const homeX = enemy.spawnX || enemy.x;
            const homeY = enemy.spawnY || enemy.y;
            enemy.patrolTarget = {
              x: homeX + (Math.random() - 0.5) * 80,
              y: homeY + (Math.random() - 0.5) * 80,
            };
          } else if (enemy.patrolTarget) {
            const pAngle = Math.atan2(enemy.patrolTarget.y - enemy.y, enemy.patrolTarget.x - enemy.x);
            const pDist = Math.hypot(enemy.patrolTarget.x - enemy.x, enemy.patrolTarget.y - enemy.y);
            if (pDist > 10) {
              enemy.x += Math.cos(pAngle) * (enemy.speed * 0.4) * dt;
              enemy.y += Math.sin(pAngle) * (enemy.speed * 0.4) * dt;
            }
          }
        }

        // Enemy-to-Enemy physical separation (no stacking)
        for (let j = eIdx + 1; j < enemiesRef.current.length; j++) {
          const other = enemiesRef.current[j];
          if (other.hp <= 0) continue;
          const cdx = other.x - enemy.x;
          const cdy = other.y - enemy.y;
          const cDist = Math.hypot(cdx, cdy);
          const minSep = (enemy.radius || 20) + (other.radius || 20);

          if (cDist < minSep && cDist > 0) {
            const overlap = (minSep - cDist) * 0.5;
            const sepAngle = Math.atan2(cdy, cdx);
            enemy.x -= Math.cos(sepAngle) * overlap;
            enemy.y -= Math.sin(sepAngle) * overlap;
            other.x += Math.cos(sepAngle) * overlap;
            other.y += Math.sin(sepAngle) * overlap;
          }
        }

        // Handle Attack Windup completion
        if (enemy.state === 'attack_windup') {
          enemy.windupTimer -= dt;
          if (enemy.windupTimer <= 0) {
            enemy.state = 'chase';

            if (enemy.isBoss) {
              // Boss Attack Patterns with Punish Windows
              if (enemy.bossAttackPattern === 'slam') {
                // 1. Ground Slam AoE
                soundManager.playRoar();
                screenShakeRef.current = 10;
                const slamRadius = enemy.telegraphRadius || 140;
                if (distToPlayer <= slamRadius) {
                  if (p.isDodging || (p.invulnerableTimer || 0) > 0) {
                    addFloatingText(p.x, p.y - 30, 'Né tránh Địa Chấn!', '#38bdf8', 14);
                  } else {
                    let incomingDmg = Math.max(1, Math.floor(enemy.atk * 1.3 - p.def * 0.45));
                    if (activeSkillsAnimRef.current.shieldActive) {
                      incomingDmg = Math.floor(incomingDmg * 0.4);
                      addFloatingText(p.x, p.y - 25, 'Kim Chung Chắn Đỡ!', '#eab308', 13);
                    }
                    soundManager.playHit();
                    addFloatingText(p.x, p.y - 25, `Địa Chấn! -${incomingDmg}`, '#ef4444', 18);
                    onUpdatePlayer(prev => ({
                      ...prev,
                      hp: Math.max(0, prev.hp - incomingDmg),
                      invulnerableTimer: 0.5,
                      hurtFlashTimer: 0.2,
                    }));
                  }
                }
                // Enter Punish Window
                enemy.bossPunishTimer = 1.4;
                addFloatingText(enemy.x, enemy.y - 45, '⚡ SƠ HỞ! TRỪNG PHẠT +35%', '#38bdf8', 16);
              } else if (enemy.bossAttackPattern === 'charge') {
                // 2. Charge Attack
                soundManager.playSlash();
                screenShakeRef.current = 7;
                const chargeAngle = Math.atan2(
                  (enemy.chargeTarget?.y || p.y) - enemy.y,
                  (enemy.chargeTarget?.x || p.x) - enemy.x
                );
                enemy.x += Math.cos(chargeAngle) * 160;
                enemy.y += Math.sin(chargeAngle) * 160;
                const newDist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
                if (newDist <= 65) {
                  if (p.isDodging || (p.invulnerableTimer || 0) > 0) {
                    addFloatingText(p.x, p.y - 30, 'Né tránh Xung Kích!', '#38bdf8', 14);
                  } else {
                    let incomingDmg = Math.max(1, Math.floor(enemy.atk * 1.2 - p.def * 0.4));
                    soundManager.playHit();
                    addFloatingText(p.x, p.y - 25, `Xung Kích! -${incomingDmg}`, '#ef4444', 17);
                    onUpdatePlayer(prev => ({
                      ...prev,
                      hp: Math.max(0, prev.hp - incomingDmg),
                      invulnerableTimer: 0.5,
                      hurtFlashTimer: 0.2,
                    }));
                  }
                }
                // Enter Punish Window
                enemy.bossPunishTimer = 1.2;
                addFloatingText(enemy.x, enemy.y - 45, '⚡ HÚC TRƯỢT! TRỪNG PHẠT +35%', '#38bdf8', 16);
              } else if (enemy.bossAttackPattern === 'roar') {
                // 3. Roar Wave: fires 3 ma khí projectiles in cone
                soundManager.playRoar();
                screenShakeRef.current = 6;
                const baseA = Math.atan2(p.y - enemy.y, p.x - enemy.x);
                [-0.25, 0, 0.25].forEach((offsetA, idx) => {
                  const a = baseA + offsetA;
                  projectilesRef.current.push({
                    id: `proj_boss_${Date.now()}_${idx}`,
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(a) * 300,
                    vy: Math.sin(a) * 300,
                    damage: Math.floor(enemy.atk * 0.85),
                    fromPlayer: false,
                    element: enemy.element,
                    life: 1.5,
                    radius: 14,
                  });
                });
                addFloatingText(enemy.x, enemy.y - 40, 'CUỒNG HỐNG MA KHÍ!', '#f43f5e', 15);
              } else {
                // Melee strike
                if (distToPlayer <= enemy.attackRange + 25 && clearLoS) {
                  if (p.isDodging || (p.invulnerableTimer || 0) > 0) {
                    addFloatingText(p.x, p.y - 30, 'Né tránh!', '#38bdf8', 14);
                  } else {
                    let incomingDmg = Math.max(1, Math.floor(enemy.atk - p.def * 0.45));
                    soundManager.playHit();
                    screenShakeRef.current = 6;
                    addFloatingText(p.x, p.y - 25, `-${incomingDmg}`, '#ef4444', 16);
                    onUpdatePlayer(prev => ({
                      ...prev,
                      hp: Math.max(0, prev.hp - incomingDmg),
                      invulnerableTimer: 0.45,
                      hurtFlashTimer: 0.2,
                    }));
                  }
                }
              }
            } else if (enemy.shape === 'cultist') {
              // Hắc Sát Ma Đồ casts fireball
              soundManager.playSpell('hoa');
              const a = Math.atan2(p.y - enemy.y, p.x - enemy.x);
              projectilesRef.current.push({
                id: `proj_cultist_${Date.now()}`,
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(a) * 280,
                vy: Math.sin(a) * 280,
                damage: enemy.atk,
                fromPlayer: false,
                element: 'hoa',
                life: 1.5,
                radius: 12,
              });
            } else {
              // Minion Melee attack hit check
              if (distToPlayer <= enemy.attackRange + 25 && clearLoS) {
                if (p.isDodging || (p.invulnerableTimer || 0) > 0) {
                  addFloatingText(p.x, p.y - 30, 'Né tránh!', '#38bdf8', 14);
                } else {
                  let incomingDmg = Math.max(1, Math.floor(enemy.atk - p.def * 0.45));
                  if (activeSkillsAnimRef.current.shieldActive) {
                    incomingDmg = Math.floor(incomingDmg * 0.4);
                    addFloatingText(p.x, p.y - 25, 'Kim Chung Chắn Đỡ!', '#eab308', 13);
                  }
                  soundManager.playHit();
                  screenShakeRef.current = 6;
                  addFloatingText(p.x, p.y - 25, `-${incomingDmg}`, '#ef4444', 16);

                  onUpdatePlayer(prev => {
                    const newHp = Math.max(0, prev.hp - incomingDmg);
                    const shieldPassive = prev.equipment.accessory?.artifactPassive?.trigger === 'low_hp_shield'
                      ? prev.equipment.accessory.artifactPassive
                      : prev.equipment.talisman?.artifactPassive?.trigger === 'low_hp_shield'
                      ? prev.equipment.talisman.artifactPassive
                      : null;

                    let newShieldCd = prev.passiveShieldCooldown || 0;
                    if (shieldPassive && newHp > 0 && newHp <= prev.maxHp * 0.3 && newShieldCd <= 0) {
                      newShieldCd = 35;
                      activeSkillsAnimRef.current.shieldActive = true;
                      activeSkillsAnimRef.current.shieldTimer = 8;
                      soundManager.playBreakthrough();
                      addFloatingText(prev.x, prev.y - 45, 'BÁT QUÁI HỘ TÂM! KIM CHUNG HỘ THỂ!', '#facc15', 18);
                    }

                    return {
                      ...prev,
                      hp: newHp,
                      passiveShieldCooldown: newShieldCd,
                      invulnerableTimer: 0.45,
                      hurtFlashTimer: 0.2,
                    };
                  });
                }
              }
            }
          }
        }
      });

      // 5. Ground Drops Magnet & Pickup
      groundDropsRef.current.forEach(drop => {
        drop.life -= dt;
        drop.bobTimer += dt * 3;
        // Dampen initial velocity
        drop.x += drop.vx * dt;
        drop.y += drop.vy * dt;
        drop.vx *= 0.88;
        drop.vy *= 0.88;

        // Vacuum towards player
        const dist = Math.hypot(p.x - drop.x, p.y - drop.y);
        if (dist < 80 && p.hp > 0) {
          const pullAngle = Math.atan2(p.y - drop.y, p.x - drop.x);
          drop.x += Math.cos(pullAngle) * 260 * dt;
          drop.y += Math.sin(pullAngle) * 260 * dt;

          if (dist < 26) {
            // Picked up!
            drop.life = 0;
            soundManager.playCollect();

            onUpdatePlayer(prev => {
              let updatedInv = [...prev.inventory];
              if (drop.itemId) {
                const it = ITEMS[drop.itemId];
                if (it) {
                  const existing = updatedInv.find(s => s.item.id === it.id);
                  if (existing && it.stackable) {
                    existing.count += drop.count;
                  } else if (updatedInv.length < prev.maxInventorySize) {
                    updatedInv.push({ item: it, count: drop.count });
                  }
                  addFloatingText(p.x, p.y - 30, `Nhặt: ${it.name} x${drop.count}`, '#a855f7', 14);
                }
              }

              const addedStones = drop.spiritStones || 0;
              const { totalMultiplier } = getEffectiveExpMultiplier(prev);
              const addedExp = Math.round((drop.exp || 0) * totalMultiplier);

              return {
                ...prev,
                spiritStones: prev.spiritStones + addedStones,
                exp: prev.exp + addedExp,
                inventory: updatedInv,
              };
            });
          }
        }
      });
      groundDropsRef.current = groundDropsRef.current.filter(dr => dr.life > 0);

      // 6. Resources Respawn Update
      resourcesRef.current.forEach(res => {
        if (res.collected && res.currentRespawnTimer > 0) {
          res.currentRespawnTimer -= dt;
          if (res.currentRespawnTimer <= 0) {
            res.collected = false;
          }
        }
      });

      // 7. Particles & Texts Update
      particlesRef.current.forEach(pt => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        if (pt.vRot) {
          pt.rotation = (pt.rotation || 0) + pt.vRot * dt;
        }
        pt.life -= dt;
      });
      if (particlesRef.current.length > 140) {
        particlesRef.current = particlesRef.current.slice(-140);
      }
      particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);

      // Ambient spiritual motes drift
      ambientMotesRef.current.forEach(mote => {
        mote.x += (mote.vx + Math.sin(currentTime * 0.002 + mote.y * 0.05) * 6) * dt;
        mote.y += mote.vy * dt;
        mote.life -= dt;
        if (mote.life <= 0 || mote.y < 0) {
          mote.x = Math.random() * currentMap.width;
          mote.y = currentMap.height + Math.random() * 20;
          mote.life = mote.maxLife;
        }
      });

      floatingTextsRef.current.forEach(ft => {
        ft.y += ft.vy * dt;
        ft.life -= dt;
      });
      floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);

      afterImagesRef.current.forEach(ai => {
        ai.alpha -= dt * 2.8;
      });
      afterImagesRef.current = afterImagesRef.current.filter(ai => ai.alpha > 0);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width <= 0 || canvas.height <= 0) {
        const fallbackW = Math.max(canvas.parentElement?.clientWidth || 0, window.innerWidth || 800);
        const fallbackH = Math.max(canvas.parentElement?.clientHeight || 0, window.innerHeight || 600);
        canvas.width = Math.floor(fallbackW * dpr);
        canvas.height = Math.floor(fallbackH * dpr);
      }

      const viewW = Math.max(canvas.width / dpr, 320);
      const viewH = Math.max(canvas.height / dpr, 240);

      // 8. Camera Follow with smooth exponential interpolation
      const camLerp = 1 - Math.exp(-12 * dt);
      if (!Number.isFinite(cameraRef.current.x)) cameraRef.current.x = animPosRef.current.x || 700;
      if (!Number.isFinite(cameraRef.current.y)) cameraRef.current.y = animPosRef.current.y || 700;
      cameraRef.current.x += (animPosRef.current.x - cameraRef.current.x) * camLerp;
      cameraRef.current.y += (animPosRef.current.y - cameraRef.current.y) * camLerp;

      const halfW = viewW / 2;
      const halfH = viewH / 2;
      cameraRef.current.x = Math.max(halfW, Math.min(currentMap.width - halfW, cameraRef.current.x));
      cameraRef.current.y = Math.max(halfH, Math.min(currentMap.height - halfH, cameraRef.current.y));

      // ==========================================
      // RENDERING PIPELINE — PREMIUM 2.5D XIANXIA DEPTH SORTED
      // ==========================================
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.save();
      // Apply screen shake
      const shakeX = screenShakeRef.current > 0 ? (Math.random() - 0.5) * screenShakeRef.current : 0;
      const shakeY = screenShakeRef.current > 0 ? (Math.random() - 0.5) * screenShakeRef.current : 0;

      ctx.translate(viewW / 2 - cameraRef.current.x + shakeX, viewH / 2 - cameraRef.current.y + shakeY);

      // 1. GROUND PLANE & DECAL LAYERS (Rendered first beneath all entities)
      renderGround(ctx, currentMap);
      renderAoEZones(ctx, aoeZonesRef.current, currentTime);
      renderPortals(ctx, currentMap.portals, currentTime);
      renderStrongholds(ctx, currentMap, p);
      renderWorldEvents(ctx, currentMap, p, currentTime);
      renderGroundDrops(ctx, groundDropsRef.current);

      // 2. UNIFIED 2.5D Y-SORTED ENTITIES (Obstacles, Resources, NPCs, Enemies, Player)
      const renderP: PlayerStats = {
        ...p,
        x: animPosRef.current.x,
        y: animPosRef.current.y,
        facing: localPosRef.current.facing,
      };

      type RenderItem = { y: number; render: () => void };
      const depthEntities: RenderItem[] = [];

      // Obstacles (Buildings, Trees, Rocks sorted by ground contact line)
      currentMap.obstacles.forEach(obs => {
        depthEntities.push({
          y: obs.y + obs.height,
          render: () => drawXianxiaObstacle(ctx, obs, currentTime, { x: renderP.x, y: renderP.y }),
        });
      });

      // Decorations (Lamps, Statues, Flags, Flowers)
      if (currentMap.decorations) {
        currentMap.decorations.forEach(dec => {
          depthEntities.push({
            y: dec.y,
            render: () => renderDecoration(ctx, dec, currentTime),
          });
        });
      }

      // Collectible Resources
      resourcesRef.current.forEach(res => {
        depthEntities.push({
          y: res.y + 10,
          render: () => drawXianxiaResource(ctx, res, currentTime),
        });
      });

      // NPCs
      currentMap.npcs.forEach(npc => {
        depthEntities.push({
          y: npc.y + 14,
          render: () => renderXianxiaNPC(ctx, npc, p, currentTime),
        });
      });

      // Enemies
      enemiesRef.current.forEach(enemy => {
        if (enemy.hp <= 0) return;
        depthEntities.push({
          y: enemy.y + (enemy.height ? enemy.height * 0.4 : 14),
          render: () => renderXianxiaEnemy(ctx, enemy, currentTime, playerRef.current.x),
        });
      });

      // Player & Associated Combat Visuals
      depthEntities.push({
        y: renderP.y + 14,
        render: () => {
          // Ghost afterimages when dashing
          afterImagesRef.current.forEach(ai => {
            ctx.save();
            ctx.globalAlpha = ai.alpha;
            ctx.fillStyle = ai.color;
            ctx.beginPath();
            ctx.arc(ai.x, ai.y, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });

          renderPlayer(ctx, renderP, currentTime);

          if (attackAnimRef.current.active) {
            renderAttackArc(ctx, renderP, attackAnimRef.current);
          }
          if (activeSkillsAnimRef.current.shieldActive) {
            renderGoldenBellShield(ctx, renderP, currentTime);
          }
          if (activeSkillsAnimRef.current.swordsActive) {
            renderOrbitingSwords(ctx, renderP, activeSkillsAnimRef.current.swordsOrbitAngle);
          }
          if (activeSkillsAnimRef.current.healPillarTimer > 0) {
            renderHealingPillar(ctx, renderP, activeSkillsAnimRef.current.healPillarTimer);
          }
        },
      });

      // Sort all entities by ascending Y (back to front in 2.5D perspective)
      depthEntities.sort((a, b) => a.y - b.y);
      depthEntities.forEach(item => item.render());

      // 3. FOREGROUND COMBAT FX, PROJECTILES & FLOATING TEXTS (Rendered above entities)
      renderProjectiles(ctx, projectilesRef.current);
      renderAdvancedFlyingSwords(ctx, advancedProjectilesRef.current, currentTime);
      renderParticles(ctx, particlesRef.current);
      renderAmbientMotes(ctx, ambientMotesRef.current);
      renderFloatingTexts(ctx, floatingTextsRef.current);

      ctx.restore();

      // Screen Weather / Ambient Overlay
      ctx.fillStyle = currentMap.ambientColor;
      ctx.fillRect(0, 0, viewW, viewH);

      // Hurt Flash Screen Vignette if recently hit
      if ((p.hurtFlashTimer || 0) > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${(p.hurtFlashTimer || 0) * 1.5})`;
        ctx.fillRect(0, 0, viewW, viewH);
      }

      // Boss Bar on Top Center if any Boss is active
      renderBossHealthBar(ctx, enemiesRef.current, viewW);

      ctx.restore(); // restore dpr scale
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentMap, onUpdatePlayer]);

  // Resize handler with High-DPI support
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const parent = canvasRef.current.parentElement;
        const w = Math.max(parent ? parent.clientWidth : 0, window.innerWidth || 800);
        const h = Math.max(parent ? parent.clientHeight : 0, window.innerHeight || 600);
        canvasRef.current.width = Math.floor(w * dpr);
        canvasRef.current.height = Math.floor(h * dpr);
        canvasRef.current.style.width = `${w}px`;
        canvasRef.current.style.height = `${h}px`;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const renderGround = (ctx: CanvasRenderingContext2D, map: GameMap) => {
    const bg = getMapBackground(map);
    ctx.drawImage(bg, 0, 0);
  };

  const renderDecoration = (ctx: CanvasRenderingContext2D, dec: any, time: number) => {
    if (dec.type === 'lamp') {
      const flicker = Math.sin((time / 160) + dec.x) * 4;
      // Stone lantern pagoda base
      ctx.fillStyle = '#44403c';
      ctx.fillRect(dec.x - 6, dec.y + 4, 12, 14);
      ctx.fillRect(dec.x - 8, dec.y + 14, 16, 4);

      // Lantern chamber
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(dec.x - 5, dec.y - 4, 10, 8);
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 1;
      ctx.strokeRect(dec.x - 5, dec.y - 4, 10, 8);

      // Pagoda roof cap
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(dec.x - 10, dec.y - 4);
      ctx.lineTo(dec.x, dec.y - 12);
      ctx.lineTo(dec.x + 10, dec.y - 4);
      ctx.closePath();
      ctx.fill();

      // Warm radial torch glow
      const glow = ctx.createRadialGradient(dec.x, dec.y, 2, dec.x, dec.y, 50 + flicker);
      glow.addColorStop(0, 'rgba(245, 158, 11, 0.52)');
      glow.addColorStop(0.7, 'rgba(245, 158, 11, 0.16)');
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dec.x, dec.y, 50 + flicker, 0, Math.PI * 2);
      ctx.fill();
    } else if (dec.type === 'flower') {
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(dec.x - 3, dec.y - 3, 6, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(dec.x - 1, dec.y - 1, 2, 2);
    } else if (dec.type === 'statue') {
      // Celestial Guardian Stone Beast
      ctx.fillStyle = '#78716c';
      ctx.fillRect(dec.x - 10, dec.y - 18, 20, 26);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(dec.x - 12, dec.y + 6, 24, 6);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(dec.x - 5, dec.y - 12, 3, 2);
      ctx.fillRect(dec.x + 2, dec.y - 12, 3, 2);
    } else if (dec.type === 'flag') {
      // Sect pennant flag
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(dec.x - 2, dec.y - 30, 4, 30);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(dec.x + 2, dec.y - 30);
      ctx.lineTo(dec.x + 24, dec.y - 20);
      ctx.lineTo(dec.x + 2, dec.y - 10);
      ctx.closePath();
      ctx.fill();
    }
  };

  const renderResources = (ctx: CanvasRenderingContext2D, resources: CollectibleResource[], time: number) => {
    resources.forEach(res => {
      drawXianxiaResource(ctx, res, time);

      if (res.collected && res.currentRespawnTimer > 0) return;

      const dist = Math.hypot(res.x - playerRef.current.x, res.y - playerRef.current.y);
      if (dist <= 75) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(res.x - 70, res.y - 42, 140, 22);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.strokeRect(res.x - 70, res.y - 42, 140, 22);

        ctx.fillStyle = res.type === 'stele' || res.type === 'altar' ? '#fde047' : '#4ade80';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        const label =
          res.type === 'stele'
            ? '[Space] Lĩnh Ngộ Bia Đá'
            : res.type === 'altar'
            ? '[Space] Phá Giải Cấm Chế'
            : '[Space] Thu Thập';
        ctx.fillText(label, res.x, res.y - 27);
      }
    });
  };

  const renderGroundDrops = (ctx: CanvasRenderingContext2D, drops: GroundDrop[]) => {
    drops.forEach(drop => {
      const bob = Math.sin(drop.bobTimer) * 4;
      const drawY = drop.y + bob;

      // Vertical spirit light beam
      const beamGrad = ctx.createLinearGradient(drop.x, drawY - 24, drop.x, drawY);
      beamGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
      beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0.45)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(drop.x - 6, drawY - 24, 12, 24);

      // Procedural Spirit Orb & Loot Sparkle (zero emoji)
      const lootColor = drop.rarity === 'thien' ? '#facc15' : drop.rarity === 'dia' ? '#f97316' : drop.rarity === 'huyen' ? '#c084fc' : drop.rarity === 'hoang' ? '#38bdf8' : '#4ade80';
      const orbGlow = ctx.createRadialGradient(drop.x, drawY, 2, drop.x, drawY, 14);
      orbGlow.addColorStop(0, lootColor);
      orbGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      orbGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = orbGlow;
      ctx.beginPath();
      ctx.arc(drop.x, drawY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Diamond Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(drop.x, drawY - 7);
      ctx.lineTo(drop.x + 5, drawY);
      ctx.lineTo(drop.x, drawY + 7);
      ctx.lineTo(drop.x - 5, drawY);
      ctx.closePath();
      ctx.fill();

      // Name label
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(drop.x - 45, drawY - 24, 90, 16);
      ctx.strokeStyle = lootColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(drop.x - 45, drawY - 24, 90, 16);

      ctx.fillStyle = lootColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(drop.name, drop.x, drawY - 12);
    });
  };

  const renderPortals = (ctx: CanvasRenderingContext2D, portals: any[], time: number) => {
    portals.forEach(portal => {
      const angle = (time / 1000) * 1.5;
      const isSecret = !!portal.isSecretDungeon;

      ctx.save();
      ctx.translate(portal.x, portal.y);
      ctx.rotate(angle);

      ctx.strokeStyle = isSecret ? '#c084fc' : '#38bdf8';
      ctx.lineWidth = isSecret ? 4 : 3;
      ctx.beginPath();
      ctx.arc(0, 0, isSecret ? 34 : 28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isSecret ? '#f43f5e' : '#818cf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, isSecret ? 22 : 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isSecret ? 'rgba(38, 10, 60, 0.9)' : 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(portal.x - 85, portal.y - 52, 170, 22);
      ctx.fillStyle = isSecret ? '#fbcfe8' : '#7dd3fc';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(portal.name, portal.x, portal.y - 37);
    });
  };

  const renderNPCs = (ctx: CanvasRenderingContext2D, npcs: NPC[], p: PlayerStats, time: number) => {
    npcs.forEach(npc => {
      renderXianxiaNPC(ctx, npc, p, time);
    });
  };

  const renderStrongholds = (ctx: CanvasRenderingContext2D, map: GameMap, p: PlayerStats) => {
    const mapStrongholds = STRONGHOLDS.filter(s => s.mapId === map.id);
    mapStrongholds.forEach(sh => {
      const ownerId = p.territoryControl?.[sh.id] || sh.defaultOwner;
      const faction = FACTIONS[ownerId] || { name: 'Vô Chủ', color: '#94a3b8', icon: 'Cứ Điểm' };

      // Base pedestal
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(sh.x - 24, sh.y - 12, 48, 24);
      ctx.strokeStyle = faction.color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(sh.x - 24, sh.y - 12, 48, 24);

      // Flagpole
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(sh.x - 2, sh.y - 50, 4, 38);

      // Fluttering Banner with faction color
      ctx.fillStyle = faction.color;
      ctx.beginPath();
      ctx.moveTo(sh.x + 2, sh.y - 50);
      ctx.lineTo(sh.x + 36, sh.y - 38);
      ctx.lineTo(sh.x + 2, sh.y - 24);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Faction Crest Emblem (Golden disc with crossed spears)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(sh.x, sh.y + 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sh.x - 5, sh.y - 3);
      ctx.lineTo(sh.x + 5, sh.y + 7);
      ctx.moveTo(sh.x + 5, sh.y - 3);
      ctx.lineTo(sh.x - 5, sh.y + 7);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(sh.x - 85, sh.y - 70, 170, 18);
      ctx.strokeStyle = faction.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(sh.x - 85, sh.y - 70, 170, 18);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`[Cứ Điểm] ${sh.name}`, sh.x, sh.y - 57);

      const dist = Math.hypot(sh.x - p.x, sh.y - p.y);
      if (dist <= 85) {
        ctx.fillStyle = faction.color;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`[Space/O] Quản Lý (${faction.name})`, sh.x, sh.y + 30);
      }
    });
  };

  const renderWorldEvents = (ctx: CanvasRenderingContext2D, map: GameMap, p: PlayerStats, time: number) => {
    const activeEvents = WORLD_EVENTS.filter(
      e => e.mapId === map.id && !p.completedEventIds?.includes(e.id)
    );
    activeEvents.forEach(ev => {
      const pulse = 18 + Math.sin(time / 250) * 5;
      const angle = (time / 1000) * 1.8;

      // Anomaly aura circle
      ctx.save();
      ctx.translate(ev.x, ev.y);
      ctx.rotate(angle);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, pulse + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.beginPath();
      ctx.arc(ev.x, ev.y, pulse, 0, Math.PI * 2);
      ctx.fill();

      // Procedural Celestial Beacon Glyph (Zero emoji)
      ctx.save();
      ctx.translate(ev.x, ev.y);
      ctx.rotate(-angle * 1.5);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(3, -2);
      ctx.lineTo(9, 0);
      ctx.lineTo(3, 2);
      ctx.lineTo(0, 9);
      ctx.lineTo(-3, 2);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-3, -2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Title Banner
      ctx.fillStyle = 'rgba(67, 20, 7, 0.9)';
      ctx.fillRect(ev.x - 90, ev.y - 48, 180, 18);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(ev.x - 90, ev.y - 48, 180, 18);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SỰ KIỆN: ${ev.title.slice(0, 24)}...`, ev.x, ev.y - 35);

      const dist = Math.hypot(ev.x - p.x, ev.y - p.y);
      if (dist <= 85) {
        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('[Space/O] Can Thiệp Sự Kiện', ev.x, ev.y + 36);
      }
    });
  };

  const renderEnemies = (ctx: CanvasRenderingContext2D, enemies: Enemy[], time: number) => {
    enemies.forEach(enemy => {
      renderXianxiaEnemy(ctx, enemy, time, playerRef.current.x);
    });
  };

  const renderProjectiles = (ctx: CanvasRenderingContext2D, projectiles: Projectile[]) => {
    projectiles.forEach(pr => {
      renderFlyingSwordProjectile(ctx, pr);
    });
  };

  const renderPlayer = (ctx: CanvasRenderingContext2D, p: PlayerStats, time: number) => {
    const isCultivating = stationaryIdleTimerRef.current > 3.0 && !p.isDodging && !attackAnimRef.current.active && !castingAnimRef.current.active && p.hp > 0;
    const walkTimer = walkAnimTimerRef.current;
    const isWalking = walkTimer > 0;
    const idleBob = (!isWalking && !isCultivating) ? Math.sin(time / 280) * 1.5 : 0;
    renderXianxiaPlayer(ctx, p, time, walkTimer, isWalking, isCultivating, idleBob, attackAnimRef.current, castingAnimRef.current);
  };

  const renderAttackArc = (
    ctx: CanvasRenderingContext2D,
    p: PlayerStats,
    anim: { angle: number; progress: number }
  ) => {
    renderSwordArcSlash(ctx, p, anim);
  };

  const renderGoldenBellShield = (ctx: CanvasRenderingContext2D, p: PlayerStats, time: number) => {
    renderXianxiaGoldenBell(ctx, p, time);
  };

  const renderOrbitingSwords = (ctx: CanvasRenderingContext2D, p: PlayerStats, orbitAngle: number) => {
    const swordCount = 6;
    const orbitRadiusX = 85;
    const orbitRadiusY = 55;

    for (let i = 0; i < swordCount; i++) {
      const angle = orbitAngle + (i * Math.PI * 2) / swordCount;
      const sx = p.x + Math.cos(angle) * orbitRadiusX;
      const sy = p.y + Math.sin(angle) * orbitRadiusY;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle + Math.PI / 2);

      // Trailing Light Ribbon
      const trailGrad = ctx.createLinearGradient(0, 16, 0, -22);
      trailGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0.85)');
      ctx.fillStyle = trailGrad;
      ctx.fillRect(-3, -22, 6, 26);

      // Double-edged Jian Blade
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-2, -18, 4, 24);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-1, -18, 2, 24);

      // Golden Guard & Pommel
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-4, 6, 8, 3);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-1, 9, 2, 5); // Tassel

      ctx.restore();
    }
  };

  const renderAmbientMotes = (ctx: CanvasRenderingContext2D, motes: { x: number; y: number; color: string; size: number; life: number; maxLife: number }[]) => {
    motes.forEach(mote => {
      const alpha = Math.min(1, Math.sin((mote.life / mote.maxLife) * Math.PI));
      ctx.save();
      ctx.globalAlpha = alpha * 0.75;
      ctx.fillStyle = mote.color;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const renderParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    particles.forEach(pt => {
      const alpha = pt.life / pt.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;

      if (pt.shape === 'spark') {
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rotation || Math.PI / 4);
        ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
        ctx.restore();
      } else if (pt.shape === 'ring') {
        const expand = (1 - alpha) * 16;
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 2.5 * alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size + expand, 0, Math.PI * 2);
        ctx.stroke();
      } else if (pt.shape === 'smoke') {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (1.5 - alpha * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (pt.shape === 'leaf') {
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rotation || (alpha * Math.PI));
        ctx.beginPath();
        ctx.ellipse(0, 0, pt.size, pt.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  };

  const renderFloatingTexts = (ctx: CanvasRenderingContext2D, texts: FloatingText[]) => {
    texts.forEach(ft => {
      const alpha = ft.life / ft.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  };

  // Dedicated Boss Bar rendered on UI screen space
  const renderBossHealthBar = (ctx: CanvasRenderingContext2D, enemies: Enemy[], screenW: number) => {
    const activeBoss = enemies.find(e => e.isBoss && e.hp > 0 && (e.state === 'chase' || e.state === 'attack_windup' || e.state === 'hurt'));
    if (!activeBoss) return;

    const barW = Math.min(screenW - 60, 480);
    const barH = 14;
    const x = (screenW - barW) / 2;
    const y = 38;
    const hpPct = activeBoss.hp / activeBoss.maxHp;

    // Header info
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(x - 10, y - 26, barW + 20, barH + 34);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 10, y - 26, barW + 20, barH + 34);

    ctx.fillStyle = activeBoss.bossPhase === 2 ? '#ef4444' : '#fde047';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`👑 ${activeBoss.name} [${activeBoss.bossTitle || activeBoss.realmName}]`, x, y - 8);

    if (activeBoss.bossPhase === 2) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('⚡ CUỒNG BẠO GIAI ĐOẠN 2', x + barW, y - 8);
    }

    // Health Bar
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(x, y, barW, barH);
    ctx.fillStyle = activeBoss.bossPhase === 2 ? '#dc2626' : '#d97706';
    ctx.fillRect(x, y, barW * hpPct, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(activeBoss.hp)} / ${activeBoss.maxHp} (${Math.floor(hpPct * 100)}%)`, x + barW / 2, y + 11);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-stone-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* 2D Thủy Mặc Mode Indicator (Only on desktop large screens, hidden on touch controls) */}
      {!touchControlsEnabled && (
        <div className="absolute top-28 left-3 z-10 pointer-events-none hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/80 border border-amber-600/35 backdrop-blur-sm text-[11px] font-medium text-amber-200/90 shadow">
          <span className="text-amber-400">🖌️</span>
          <span>2D Thủy Mặc Cổ Phong</span>
        </div>
      )}

      {/* Floating 3-Step Combo Indicator - Visible only on desktop keyboard/mouse, hidden on mobile touch screens */}
      {!touchControlsEnabled && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-950/90 border border-amber-500/50 backdrop-blur-md shadow-2xl text-xs font-semibold text-amber-300">
          <span className="text-amber-400/90 tracking-wide font-serif">Tam Thức Kiếm Quyết:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full transition-all ${
              activeComboStep === 1
                ? 'bg-amber-500/30 text-amber-200 border border-amber-400/70 font-bold shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                : 'text-stone-500 border border-transparent'
            }`}
          >
            1. Hoành Tảo
          </span>
          <span className="text-stone-600">→</span>
          <span
            className={`px-2.5 py-0.5 rounded-full transition-all ${
              activeComboStep === 2
                ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/70 font-bold shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                : 'text-stone-500 border border-transparent'
            }`}
          >
            2. Nghịch Phong
          </span>
          <span className="text-stone-600">→</span>
          <span
            className={`px-2.5 py-0.5 rounded-full transition-all ${
              activeComboStep === 3
                ? 'bg-yellow-500/40 text-yellow-100 border border-yellow-300/80 font-bold shadow-[0_0_12px_rgba(250,204,21,0.5)]'
                : 'text-stone-500 border border-transparent'
            }`}
          >
            3. Tuyệt Trảm
          </span>
        </div>
      )}
    </div>
  );
};
