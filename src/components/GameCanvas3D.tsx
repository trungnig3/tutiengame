import React, { useEffect, useRef, useState } from 'react';
import { PlayerStats, NPC, Enemy, CollectibleResource, Portal } from '../types/game';
import { SceneManager3D } from '../engine3d/sceneManager3D';
import { GAME_MAPS } from '../data/maps';
import { soundManager } from '../engine/audio';
import { inputManager } from '../engine/inputManager';
import { BossLootData } from './modals/BossLootModal';
import { checkArtCompatibility } from '../data/spiritualRoots';
import { ITEMS } from '../data/items';
import { advanceGameTime } from '../engine/cultivationEngine';
import { Eye, Sparkles, Activity } from 'lucide-react';

interface GameCanvas3DProps {
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
  onBossDefeated?: (loot: BossLootData) => void;
  onToggle2DMode: () => void;
  touchControlsEnabled?: boolean;
}

export function GameCanvas3D({
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
  onToggle2DMode,
  touchControlsEnabled = false,
}: GameCanvas3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneManagerRef = useRef<SceneManager3D | null>(null);

  // Gameplay Refs & State
  const playerRef = useRef<PlayerStats>(player);
  playerRef.current = player;
  const isPausedRef = useRef<boolean>(isPaused);
  isPausedRef.current = isPaused;

  const currentMap = GAME_MAPS[player.currentMapId] || GAME_MAPS.map_thanh_khe;
  const enemiesRef = useRef<Enemy[]>([]);

  // FPS monitor
  const [fps, setFps] = useState<number>(60);
  const fpsTickerRef = useRef<{ count: number; timer: number }>({ count: 0, timer: 0 });

  // Reactive Combo Step for UI
  const [activeComboStep, setActiveComboStep] = useState<1 | 2 | 3>(1);

  // Combo 3 Đòn Kiếm Pháp State
  const comboStateRef = useRef<{
    currentStep: 1 | 2 | 3;
    comboWindowTimer: number;
  }>({
    currentStep: 1,
    comboWindowTimer: 0,
  });

  const attackAnimRef = useRef<{
    active: boolean;
    step: 1 | 2 | 3;
    angle: number;
    progress: number;
    hasDealtDamage: boolean;
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
    duration: 0.26,
    range: 95,
    slashArc: Math.PI * 0.75,
    damageMult: 1.0,
    knockback: 18,
  });

  const castingAnimRef = useRef<{ active: boolean; progress: number; timer: number; maxTimer: number }>({
    active: false,
    progress: 0,
    timer: 0,
    maxTimer: 0,
  });

  const activeSkillsAnimRef = useRef<{
    shieldActive: boolean;
    shieldTimer: number;
    swordsActive: boolean;
    swordsTimer: number;
  }>({
    shieldActive: false,
    shieldTimer: 0,
    swordsActive: false,
    swordsTimer: 0,
  });

  const walkTimerRef = useRef<number>(0);
  const isWalkingRef = useRef<boolean>(false);
  const hitStopTimerRef = useRef<number>(0);
  const queuedAttackRef = useRef<boolean>(false);

  // Initialize Map Enemies
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
  }, [player.currentMapId]);

  // COMBAT: Basic Attack — Combo 3 Đòn với Input Buffer
  const triggerBasicAttack = () => {
    const p = playerRef.current;
    if (p.hp <= 0) return;

    // Input buffer: if attacking and in active/recovery phase (progress >= 0.45), queue next attack!
    if (attackAnimRef.current.active) {
      if (attackAnimRef.current.progress >= 0.45) {
        queuedAttackRef.current = true;
      }
      return;
    }

    let nextStep: 1 | 2 | 3 = 1;
    if (comboStateRef.current.comboWindowTimer > 0) {
      if (comboStateRef.current.currentStep === 1) nextStep = 2;
      else if (comboStateRef.current.currentStep === 2) nextStep = 3;
      else nextStep = 1;
    } else {
      nextStep = 1;
    }

    comboStateRef.current.currentStep = nextStep;
    comboStateRef.current.comboWindowTimer = 0;
    setActiveComboStep(nextStep);

    const angle = inputManager.getAimAngle(p.x, p.y, p.facing, enemiesRef.current);

    let duration = 0.28;
    let range = 100;
    let slashArc = Math.PI * 0.78;
    let damageMult = 1.0;
    let knockback = 20;

    if (nextStep === 1) {
      duration = 0.28;
      range = 100;
      slashArc = Math.PI * 0.78;
      damageMult = 1.0;
      knockback = 20;
      soundManager.playSlash();
    } else if (nextStep === 2) {
      duration = 0.26;
      range = 110;
      slashArc = Math.PI * 0.85;
      damageMult = 1.35;
      knockback = 28;
      soundManager.playSlash();
    } else {
      duration = 0.38;
      range = 135;
      slashArc = Math.PI * 1.05;
      damageMult = 2.1;
      knockback = 48;
      soundManager.playSlash();
    }

    attackAnimRef.current = {
      active: true,
      step: nextStep,
      angle,
      progress: 0,
      hasDealtDamage: false,
      duration,
      range,
      slashArc,
      damageMult,
      knockback,
    };

    // Trigger 3D Slash Arc VFX
    if (sceneManagerRef.current) {
      const p3d = SceneManager3D.toWorldCoords(p.x, p.y);
      sceneManagerRef.current.vfxManager.triggerSwordArc(p3d.x, 0, p3d.z, angle, nextStep);
      if (nextStep === 3) {
        sceneManagerRef.current.triggerCameraShake(0.38);
      }
    }
  };

  // COMBAT: Dash / Dodge
  const triggerDash = () => {
    const p = playerRef.current;
    if (p.dodgeCooldown > 0 || p.mp < 12 || p.hp <= 0) return;

    const angle = inputManager.getAimAngle(p.x, p.y, p.facing, enemiesRef.current);
    const dashDist = 150;
    const targetX = Math.max(30, Math.min(currentMap.width - 30, p.x + Math.cos(angle) * dashDist));
    const targetY = Math.max(30, Math.min(currentMap.height - 30, p.y + Math.sin(angle) * dashDist));

    soundManager.playDash();

    onUpdatePlayer(prev => ({
      ...prev,
      x: targetX,
      y: targetY,
      mp: Math.max(0, prev.mp - 12),
      dodgeCooldown: 1.8,
      isDodging: true,
      dodgeTimer: 0.35,
    }));
  };

  // COMBAT: Apply Damage & Knockback to Enemy
  const applyDamageToEnemy = (enemy: Enemy, rawAtk: number, isSkill: boolean, element: string, hitAngle: number) => {
    if (enemy.hp <= 0 || enemy.state === 'dead') return;
    const p = playerRef.current;

    const isCrit = Math.random() < p.critRate;
    const damage = Math.max(1, Math.floor(rawAtk * (isCrit ? 1.85 : 1.0) - enemy.def * 0.4));
    enemy.hp = Math.max(0, enemy.hp - damage);
    enemy.hurtTimer = 0.35; // Trigger wolf hurt recoil & red flash

    // Micro hit-stop for tactile crunch feel
    hitStopTimerRef.current = isCrit ? 0.055 : 0.04;

    // Directional knockback
    const kb = (attackAnimRef.current.knockback || 22) * (isCrit ? 1.4 : 1.0);
    enemy.x = Math.max(30, Math.min(currentMap.width - 30, enemy.x + Math.cos(hitAngle) * kb));
    enemy.y = Math.max(30, Math.min(currentMap.height - 30, enemy.y + Math.sin(hitAngle) * kb));

    // Audio tactile feedback
    if (isCrit) {
      soundManager.playCritHit();
    } else {
      soundManager.playHit();
    }
    soundManager.playBeastYelp();

    if (sceneManagerRef.current) {
      const e3d = SceneManager3D.toWorldCoords(enemy.x, enemy.y);
      // Localized crisp hit sparks & blood/chi burst
      sceneManagerRef.current.vfxManager.spawnHitSparks(e3d.x, 0.65, e3d.z, isCrit ? 35 : 20, isCrit ? 0xf59e0b : 0xef4444);
      // 3D Floating Combat Damage Text
      const damageText = isCrit ? `BẠO! -${damage}` : `-${damage}`;
      sceneManagerRef.current.vfxManager.spawnDamageText(e3d.x, 0.7, e3d.z, damageText, isCrit);
      // Screen shake
      sceneManagerRef.current.triggerCameraShake(isCrit ? 0.35 : 0.2);
    }

    if (enemy.hp <= 0 && (enemy.state as string) !== 'dead') {
      enemy.state = 'dead' as any;
      (enemy as any).deathTimer = 1.8; // Allow death collapse animation to play out
      if (enemy.isBoss && onBossDefeated) {
        const bossItems: { item: any; count: number }[] = [];
        for (const drop of enemy.dropTable) {
          const it = ITEMS[drop.itemId];
          if (it) bossItems.push({ item: it, count: 1 });
        }
        onBossDefeated({
          bossId: enemy.id,
          bossName: enemy.name,
          bossTitle: enemy.bossTitle || 'Thủ Lĩnh Yêu Vương',
          exp: enemy.expReward,
          spiritStones: enemy.spiritStonesReward,
          items: bossItems,
        });
      }
      onEnemyKilled(enemy.id);
    }
  };

  // COMBAT: Skills (Q, E, R, F)
  const triggerSkill = (key: 'q' | 'e' | 'r' | 'f') => {
    const p = playerRef.current;
    if (p.hp <= 0) return;
    const skill = p.equippedSkills.find(s => s.key === key);
    if (!skill) return;

    const rootCheck = checkArtCompatibility(p.spiritualRoot, skill.element);
    if (!rootCheck.compatible) {
      soundManager.playBacklash();
      return;
    }

    if (skill.currentCooldown > 0 || p.mp < skill.mpCost) return;

    onUpdatePlayer(prev => ({
      ...prev,
      mp: prev.mp - skill.mpCost,
      equippedSkills: prev.equippedSkills.map(s => (s.key === key ? { ...s, currentCooldown: s.cooldown } : s)),
    }));

    if (key === 'q') {
      // Kiếm Khí Trảm & Phi Kiếm
      soundManager.playSpell('moc');
      const angle = inputManager.getAimAngle(p.x, p.y, p.facing, enemiesRef.current);
      const targetDist = 280;
      const tx = p.x + Math.cos(angle) * targetDist;
      const ty = p.y + Math.sin(angle) * targetDist;

      if (sceneManagerRef.current) {
        const p3d = SceneManager3D.toWorldCoords(p.x, p.y);
        const t3d = SceneManager3D.toWorldCoords(tx, ty);
        // Fire travelling Sword Qi Wave and Flying Swords
        sceneManagerRef.current.vfxManager.triggerSwordQiWave(p3d.x, 0, p3d.z, angle);
        sceneManagerRef.current.vfxManager.triggerFlyingSwords(p3d.x, 0, p3d.z, t3d.x, 0, t3d.z, 3);
      }

      // Deal damage to enemies in line
      enemiesRef.current.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist <= 280) {
          applyDamageToEnemy(enemy, Math.floor(p.atk * skill.damageMultiplier), true, 'moc', angle);
        }
      });
    } else if (key === 'e') {
      // Lôi Động Cửu Thiên
      soundManager.playSpell('loi');
      const angle = inputManager.getAimAngle(p.x, p.y, p.facing, enemiesRef.current);
      const strikeX = p.x + Math.cos(angle) * 120;
      const strikeY = p.y + Math.sin(angle) * 120;

      if (sceneManagerRef.current) {
        const s3d = SceneManager3D.toWorldCoords(strikeX, strikeY);
        sceneManagerRef.current.vfxManager.triggerThunderStrike(s3d.x, 0, s3d.z);
        sceneManagerRef.current.triggerCameraShake(0.55);
      }

      enemiesRef.current.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const dist = Math.hypot(enemy.x - strikeX, enemy.y - strikeY);
        if (dist <= 140) {
          applyDamageToEnemy(enemy, Math.floor(p.atk * skill.damageMultiplier), true, 'loi', angle);
          enemy.stunTimer = 1.0;
        }
      });
    } else if (key === 'r') {
      // Vạn Kiếm Quy Tông
      soundManager.playSpell('ngu_hanh');
      activeSkillsAnimRef.current.swordsActive = true;
      activeSkillsAnimRef.current.swordsTimer = 4.0;

      enemiesRef.current.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist <= 260) {
          applyDamageToEnemy(enemy, Math.floor(p.atk * skill.damageMultiplier), true, 'ngu_hanh', 0);
        }
      });
    } else if (key === 'f') {
      // Ất Mộc Hồi Xuân
      soundManager.playSpell('moc');
      activeSkillsAnimRef.current.shieldActive = true;
      activeSkillsAnimRef.current.shieldTimer = 3.5;
      const healAmount = Math.floor(p.maxHp * 0.35);
      onUpdatePlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + healAmount) }));
    }
  };

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const sceneManager = new SceneManager3D(container, width, height);
    sceneManagerRef.current = sceneManager;

    let lastTime = performance.now();
    let animFrameId = 0;

    const handleResize = () => {
      if (!container || !sceneManagerRef.current) return;
      sceneManagerRef.current.resize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    inputManager.attachListeners();

    const unsubAction = inputManager.addActionListener(action => {
      if (isPausedRef.current) return;
      if (action === 'attack') triggerBasicAttack();
      else if (action === 'dodge') triggerDash();
      else if (action === 'skill_q') triggerSkill('q');
      else if (action === 'skill_e') triggerSkill('e');
      else if (action === 'skill_r') triggerSkill('r');
      else if (action === 'skill_f') triggerSkill('f');
    });

    const unsubMenu = inputManager.addMenuActionListener(menuKey => {
      if (menuKey === 'inventory') onOpenInventory();
      else if (menuKey === 'character') onOpenCharacter();
      else if (menuKey === 'cultivation') onOpenCultivation();
      else if (menuKey === 'quests') onOpenQuests();
      else if (menuKey === 'map') onOpenMap();
      else if (menuKey === 'menu' || menuKey === 'escape') onOpenMenu();
      else if (menuKey === 'war_room' && onOpenWarRoom) onOpenWarRoom();
      else if (menuKey === 'achievements' && onOpenAchievements) onOpenAchievements();
    });

    const handlePointerDown = (e: PointerEvent) => {
      if (isPausedRef.current) return;
      if (e.button === 0) triggerBasicAttack();
      else if (e.button === 2) triggerDash();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const p = playerRef.current;
      const worldX = p.x + (screenX - rect.width / 2);
      const worldY = p.y + (screenY - rect.height / 2);
      inputManager.setMousePosition(screenX, screenY, worldX, worldY);
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('contextmenu', handleContextMenu);

    // Render loop
    const animate = (currentTime: number) => {
      animFrameId = requestAnimationFrame(animate);

      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // FPS Monitor
      fpsTickerRef.current.count++;
      fpsTickerRef.current.timer += dt;
      if (fpsTickerRef.current.timer >= 1.0) {
        setFps(fpsTickerRef.current.count);
        fpsTickerRef.current.count = 0;
        fpsTickerRef.current.timer = 0;
      }

      if (isPausedRef.current) return;

      // Handle Hit-Stop micro pause for crunchy weapon bite feel
      if (hitStopTimerRef.current > 0) {
        hitStopTimerRef.current -= dt;
        if (sceneManagerRef.current) {
          sceneManagerRef.current.renderer.render(sceneManagerRef.current.scene, sceneManagerRef.current.camera);
        }
        return;
      }

      const p = playerRef.current;

      // Input polling
      const move = inputManager.getMoveVector();
      isWalkingRef.current = move.x !== 0 || move.y !== 0;
      if (isWalkingRef.current) {
        walkTimerRef.current += dt;
        const speed = p.speed * (p.isDodging ? 2.5 : 1.0);
        const newX = Math.max(30, Math.min(currentMap.width - 30, p.x + move.x * speed * dt));
        const newY = Math.max(30, Math.min(currentMap.height - 30, p.y + move.y * speed * dt));

        let facing = p.facing;
        if (Math.abs(move.x) > Math.abs(move.y)) {
          facing = move.x > 0 ? 'right' : 'left';
        } else if (move.y !== 0) {
          facing = move.y > 0 ? 'down' : 'up';
        }

        onUpdatePlayer(prev => ({ ...prev, x: newX, y: newY, facing }));
      }

      // Combo Window Timer countdown
      if (!attackAnimRef.current.active && comboStateRef.current.comboWindowTimer > 0) {
        comboStateRef.current.comboWindowTimer -= dt;
        if (comboStateRef.current.comboWindowTimer <= 0) {
          comboStateRef.current.currentStep = 1;
          setActiveComboStep(1);
        }
      }

      // Active Frames Hit Detection
      if (attackAnimRef.current.active) {
        const anim = attackAnimRef.current;
        anim.progress += dt / (anim.duration || 0.28);

        const activeStart = anim.step === 3 ? 0.26 : 0.22;
        const activeEnd = anim.step === 3 ? 0.66 : 0.62;

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
                hitAny = true;
                if (anim.step === 3) enemy.stunTimer = 0.55;
                applyDamageToEnemy(enemy, Math.floor(p.atk * anim.damageMult), false, 'vat_ly', anim.angle);
              }
            }
          });

          if (hitAny) soundManager.playHit();
        }

        if (anim.progress >= 1) {
          anim.active = false;
          if (anim.step === 3) {
            comboStateRef.current.currentStep = 1;
            comboStateRef.current.comboWindowTimer = 0;
          } else {
            comboStateRef.current.comboWindowTimer = 0.65;
          }

          // Trigger buffered attack immediately
          if (queuedAttackRef.current) {
            queuedAttackRef.current = false;
            triggerBasicAttack();
          }
        }
      }

      // Enemy AI Update (including hurt flinch, death collapse timer)
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const enemy = enemiesRef.current[i];
        if ((enemy.state as string) === 'dead') {
          if ((enemy as any).deathTimer !== undefined) {
            (enemy as any).deathTimer -= dt;
            if ((enemy as any).deathTimer <= 0) {
              enemiesRef.current.splice(i, 1);
            }
          }
          continue;
        }

        if (enemy.hurtTimer && enemy.hurtTimer > 0) {
          enemy.hurtTimer -= dt;
        }

        if (enemy.stunTimer && enemy.stunTimer > 0) {
          enemy.stunTimer -= dt;
          continue;
        }

        const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (dist <= enemy.aggroRange && dist > enemy.attackRange) {
          enemy.state = 'chase';
          const a = Math.atan2(p.y - enemy.y, p.x - enemy.x);
          enemy.x += Math.cos(a) * enemy.speed * dt;
          enemy.y += Math.sin(a) * enemy.speed * dt;
        } else if (dist <= enemy.attackRange) {
          enemy.state = 'attacking';
          enemy.attackTimer -= dt;
          if (enemy.attackTimer <= 0) {
            enemy.attackTimer = enemy.attackCooldown;
            const rawDmg = Math.max(1, enemy.atk - p.def * 0.35);
            onUpdatePlayer(prev => ({
              ...prev,
              hp: Math.max(0, prev.hp - rawDmg),
              hurtFlashTimer: 0.25,
            }));
            soundManager.playHit();
            soundManager.playBeastYelp();
          }
        } else {
          enemy.state = 'idle';
        }
      }

      // Update 3D Scene
      sceneManager.update(
        dt,
        currentTime / 1000,
        p,
        enemiesRef.current,
        isWalkingRef.current,
        walkTimerRef.current,
        attackAnimRef.current,
        castingAnimRef.current,
        activeSkillsAnimRef.current
      );
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('contextmenu', handleContextMenu);
      unsubAction();
      unsubMenu();
      cancelAnimationFrame(animFrameId);
      sceneManager.dispose();
      if (container && sceneManager.renderer.domElement) {
        container.removeChild(sceneManager.renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full bg-[#0c1926]" />

      {/* Subtle 3D Performance Badge - visible only on large desktop screens */}
      {!touchControlsEnabled && (
        <div className="absolute top-28 left-3 z-10 pointer-events-none hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/80 border border-amber-600/35 backdrop-blur-sm text-[11px] font-medium text-amber-200/90 shadow">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>3D Tiên Cảnh (2.5D)</span>
          <span className="text-stone-400 text-[10px] ml-1 flex items-center gap-1">
            <Activity className="w-2.5 h-2.5 text-emerald-400" />
            {fps} FPS
          </span>
        </div>
      )}

      {/* Bottom Center Combo Indicator - Visible only on desktop large screens */}
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
}
