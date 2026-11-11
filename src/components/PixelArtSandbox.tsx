/**
 * PIXEL ART VISUAL SANDBOX (PHASE 1)
 * Project: Phàm Trần Tiên Lộ
 * Completely isolated sandbox demonstrating the new Premium HD Pixel Art visual direction.
 * Integrates 100% real PNG pixel art assets with frame animation and performance telemetry.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { pixelAssetLoader, AssetLoadProgress } from '../engine/pixelArt/PixelAssetLoader';
import { spriteManager } from '../engine/pixelArt/SpriteManager';
import { AnimationController } from '../engine/pixelArt/AnimationController';
import { PixelArtRenderer, PerformanceTelemetry } from '../engine/pixelArt/PixelArtRenderer';
import { Play, Sparkles, Zap, Flame, Wind, ShieldAlert, ArrowLeft, RefreshCw, Smartphone, Eye } from 'lucide-react';

interface PixelArtSandboxProps {
  onExit: () => void;
  onOpenSpriteViewer?: () => void;
}

// 18 Core Real Pixel Art Assets
const SANDBOX_ASSETS = [
  '/assets/pixel/characters/player_cultivator_lam_mac.png',
  '/assets/pixel/characters/npc_village_chief_ly_duc.png',
  '/assets/pixel/enemies/enemy_spirit_wolf.png',
  '/assets/pixel/enemies/enemy_iron_boar.png',
  '/assets/pixel/enemies/enemy_dark_cultist.png',
  '/assets/pixel/bosses/boss_white_ape.png',
  '/assets/pixel/environment/building_thanh_khe_dinh.png',
  '/assets/pixel/environment/tree_ancient_pine.png',
  '/assets/pixel/environment/tree_bamboo.png',
  '/assets/pixel/environment/bridge_rustic_wood.png',
  '/assets/pixel/environment/prop_chiseled_rock.png',
  '/assets/pixel/environment/prop_hanging_lantern.png',
  '/assets/pixel/environment/ground_tileset.png',
  '/assets/pixel/environment/animated_water_stream.png',
  '/assets/pixel/vfx/vfx_sword_slash_wind.png',
  '/assets/pixel/vfx/vfx_fire_arc.png',
  '/assets/pixel/vfx/vfx_lightning_strike.png',
  '/assets/pixel/vfx/vfx_impact_sparks.png'
];

interface ActiveVFX {
  src: string;
  x: number;
  y: number;
  fw: number;
  fh: number;
  pivot: { x: number; y: number };
  controller: AnimationController;
}

export function PixelArtSandbox({ onExit, onOpenSpriteViewer }: PixelArtSandboxProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PixelArtRenderer | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<AssetLoadProgress>({
    total: SANDBOX_ASSETS.length,
    loaded: 0,
    failed: 0,
    percent: 0,
    loadingTimeMs: 0,
    isComplete: false
  });
  const [telemetry, setTelemetry] = useState<PerformanceTelemetry>({
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    visibleSprites: 0,
    vramMemoryMB: 12,
    assetLoadTimeMs: 0,
    isAndroid: false
  });

  // Zoom state (1x, 1.5x, 2x, 3x nearest-neighbor)
  const [zoom, setZoom] = useState<number>(1.0);
  const playerPos = useRef({ x: 380, y: 260 });
  const playerFacing = useRef<'left' | 'right'>('right');
  const playerAnim = useRef(new AnimationController('idle', { fps: 6, loop: true, frameCount: 6, row: 0 }));

  // NPC animation
  const npcAnim = useRef(new AnimationController('idle', { fps: 4, loop: true, frameCount: 4, row: 0 }));

  // Enemies animations
  const wolfAnim = useRef(new AnimationController('walk', { fps: 8, loop: true, frameCount: 6, row: 1 }));
  const boarAnim = useRef(new AnimationController('walk', { fps: 6, loop: true, frameCount: 6, row: 1 }));
  const cultistAnim = useRef(new AnimationController('idle', { fps: 5, loop: true, frameCount: 4, row: 0 }));

  // Boss animation
  const bossAnim = useRef(new AnimationController('idle', { fps: 6, loop: true, frameCount: 6, row: 0 }));
  const bossState = useRef<'idle' | 'charging'>('idle');
  const bossX = useRef(620);

  // Active VFX list
  const activeVFXList = useRef<ActiveVFX[]>([]);

  // Water animation timer
  const waterFrameTimer = useRef(0);
  const waterFrameIndex = useRef(0);

  // Keyboard input tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // 1. Preload real pixel assets
  useEffect(() => {
    let isMounted = true;
    pixelAssetLoader.loadAssetPack(SANDBOX_ASSETS).then(() => {
      if (isMounted) {
        setLoadingProgress(pixelAssetLoader.getProgress());
      }
    });

    const progressInterval = setInterval(() => {
      const prog = pixelAssetLoader.getProgress();
      setLoadingProgress(prog);
      if (prog.isComplete) {
        clearInterval(progressInterval);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, []);

  // 2. Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      // Quick triggers
      if (e.key === '1' || e.key.toLowerCase() === 'j') triggerPlayerAttack('attack1');
      if (e.key === '2' || e.key.toLowerCase() === 'k') triggerPlayerAttack('attack2');
      if (e.key === '3') triggerPlayerAttack('attack3');
      if (e.key === ' ' || e.key.toLowerCase() === 'q') triggerPlayerDash();
      if (e.key.toLowerCase() === 'h') triggerPlayerHit();
      if (e.key.toLowerCase() === 'd') triggerPlayerDeath();
      if (e.key.toLowerCase() === 'b') triggerBossCharge();
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
  }, []);

  // Action Triggers
  const triggerPlayerAttack = useCallback((type: 'attack1' | 'attack2' | 'attack3' = 'attack1') => {
    const row = type === 'attack1' ? 3 : (type === 'attack2' ? 4 : 5);
    const count = type === 'attack3' ? 6 : 5;
    playerAnim.current.play(
      type,
      { fps: 14, loop: false, frameCount: count, row },
      () => {
        playerAnim.current.play('idle', { fps: 6, loop: true, frameCount: 6, row: 0 });
      },
      () => {
        // Spawn sword slash VFX
        spawnVFX('/assets/pixel/vfx/vfx_sword_slash_wind.png', playerPos.current.x + 20, playerPos.current.y - 10, 64, 64, 4, 16);
        spawnVFX('/assets/pixel/vfx/vfx_impact_sparks.png', playerPos.current.x + 35, playerPos.current.y - 12, 32, 32, 3, 20);
      }
    );
  }, []);

  const triggerPlayerDash = useCallback(() => {
    playerAnim.current.play(
      'dodge',
      { fps: 16, loop: false, frameCount: 4, row: 6 },
      () => {
        playerAnim.current.play('idle', { fps: 6, loop: true, frameCount: 6, row: 0 });
      }
    );
    // Instant dash forward with safety margin
    const dx = playerFacing.current === 'right' ? 45 : -45;
    playerPos.current.x = Math.max(80, Math.min(720, playerPos.current.x + dx));
  }, []);

  const triggerPlayerHit = useCallback(() => {
    playerAnim.current.play(
      'hit',
      { fps: 12, loop: false, frameCount: 3, row: 8 },
      () => {
        playerAnim.current.play('idle', { fps: 6, loop: true, frameCount: 6, row: 0 });
      }
    );
  }, []);

  const triggerPlayerDeath = useCallback(() => {
    playerAnim.current.play(
      'death',
      { fps: 8, loop: false, frameCount: 8, row: 9, holdLastFrame: true }
    );
  }, []);

  const triggerFireSkill = useCallback(() => {
    playerAnim.current.play(
      'skill',
      { fps: 12, loop: false, frameCount: 8, row: 7 },
      () => {
        playerAnim.current.play('idle', { fps: 6, loop: true, frameCount: 6, row: 0 });
      }
    );
    spawnVFX('/assets/pixel/vfx/vfx_fire_arc.png', playerPos.current.x + 24, playerPos.current.y - 8, 64, 64, 5, 16);
  }, []);

  const triggerLightningSkill = useCallback(() => {
    playerAnim.current.play(
      'skill',
      { fps: 12, loop: false, frameCount: 8, row: 7 },
      () => {
        playerAnim.current.play('idle', { fps: 6, loop: true, frameCount: 6, row: 0 });
      }
    );
    spawnVFX('/assets/pixel/vfx/vfx_lightning_strike.png', playerPos.current.x + 50, playerPos.current.y, 48, 96, 4, 20, { x: 0.5, y: 0.95 });
  }, []);

  const triggerBossCharge = useCallback(() => {
    bossState.current = 'charging';
    bossAnim.current.play('charge', { fps: 14, loop: true, frameCount: 6, row: 2 });
  }, []);

  const spawnVFX = (
    src: string,
    x: number,
    y: number,
    fw: number,
    fh: number,
    frameCount: number,
    fps: number,
    pivot: { x: number; y: number } = { x: 0.5, y: 0.5 }
  ) => {
    const ctrl = new AnimationController('play', { fps, loop: false, frameCount, row: 0 });
    activeVFXList.current.push({ src, x, y, fw, fh, pivot, controller: ctrl });
  };

  // 3. Main Render Loop
  useEffect(() => {
    if (!loadingProgress.isComplete || !canvasRef.current) return;

    const canvas = canvasRef.current;
    rendererRef.current = new PixelArtRenderer(canvas);
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.max(0.001, Math.min(0.05, (timestamp - lastTime) / 1000));
      lastTime = timestamp;

      // Update animations
      playerAnim.current.update(dt);
      npcAnim.current.update(dt);
      wolfAnim.current.update(dt);
      boarAnim.current.update(dt);
      cultistAnim.current.update(dt);
      bossAnim.current.update(dt);

      // Water animation (4 FPS)
      waterFrameTimer.current += dt;
      if (waterFrameTimer.current >= 0.25) {
        waterFrameTimer.current = 0;
        waterFrameIndex.current = (waterFrameIndex.current + 1) % 4;
      }

      // Handle Player Input Movement
      let moveX = 0, moveY = 0;
      if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveY -= 1;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveY += 1;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) moveX -= 1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) moveX += 1;

      const isMoving = moveX !== 0 || moveY !== 0;
      if (moveX < 0) playerFacing.current = 'left';
      else if (moveX > 0) playerFacing.current = 'right';

      if (isMoving && !playerAnim.current.isDone() && (playerAnim.current.getAnimName() === 'idle' || playerAnim.current.getAnimName() === 'walk')) {
        const isRunning = keysPressed.current['shift'];
        const speed = isRunning ? 160 : 95;
        const norm = Math.hypot(moveX, moveY) || 1;
        playerPos.current.x = Math.max(60, Math.min(740, playerPos.current.x + (moveX / norm) * speed * dt));
        playerPos.current.y = Math.max(120, Math.min(420, playerPos.current.y + (moveY / norm) * speed * dt));

        if (isRunning && playerAnim.current.getAnimName() !== 'run') {
          playerAnim.current.play('run', { fps: 12, loop: true, frameCount: 8, row: 2 });
        } else if (!isRunning && playerAnim.current.getAnimName() !== 'walk') {
          playerAnim.current.play('walk', { fps: 10, loop: true, frameCount: 8, row: 1 });
        }
      } else if (!isMoving && (playerAnim.current.getAnimName() === 'walk' || playerAnim.current.getAnimName() === 'run')) {
        playerAnim.current.play('idle', { fps: 6, loop: true, frameCount: 6, row: 0 });
      }

      // Update Boss Charge logic
      if (bossState.current === 'charging') {
        bossX.current -= 280 * dt;
        if (bossX.current <= 460) {
          bossState.current = 'idle';
          bossAnim.current.play('idle', { fps: 6, loop: true, frameCount: 6, row: 0 });
          // Impact on rock
          spawnVFX('/assets/pixel/vfx/vfx_impact_sparks.png', 450, 310, 32, 32, 3, 20);
        }
      }

      // Update active VFX
      activeVFXList.current = activeVFXList.current.filter(vfx => {
        vfx.controller.update(dt);
        return !vfx.controller.isDone();
      });

      // Camera follows player smoothly
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.cameraX += (playerPos.current.x - renderer.cameraX) * 0.1;
        renderer.cameraY += (playerPos.current.y - renderer.cameraY) * 0.1;
        renderer.zoom = zoom;

        renderer.beginFrame(timestamp);

        // --- LAYER 0: GROUND & WATER (Organic Curving River with Shore Transitions) ---
        renderer.submitEntity({
          layer: 0,
          sortY: 0,
          render: (ctx) => {
            // Base meadow background
            ctx.fillStyle = '#265422';
            ctx.fillRect(0, 0, 800, 450);

            // Draw detailed ground & curving river stream
            for (let r = 0; r < 14; r++) {
              for (let c = 0; c < 25; c++) {
                const tx = c * 32;
                const ty = r * 32;

                // River curves naturally: c < 8 (rows 9..11), c 8..15 (rows 8..10), c > 15 (rows 9..11)
                const riverStartR = (c >= 8 && c <= 15) ? 8 : 9;
                const riverEndR = riverStartR + 2;
                const isRiver = r >= riverStartR && r <= riverEndR;
                const isRiverShoreTop = r === riverStartR - 1 && (c + r) % 3 === 0;
                const isRiverShoreBottom = r === riverEndR + 1 && (c + r) % 3 === 1;

                if (isRiver) {
                  // Animated Turquoise Water Stream
                  const isLotus = (r === riverStartR + 1 && (c === 4 || c === 18));
                  const waterRowY = isLotus ? 32 : 0;
                  spriteManager.drawTile(
                    ctx,
                    '/assets/pixel/environment/animated_water_stream.png',
                    waterFrameIndex.current * 32,
                    waterRowY,
                    tx,
                    ty,
                    32
                  );

                  // Natural shoreline grass/pebble fringes
                  if (r === riverStartR && (c % 3 === 0)) {
                    ctx.fillStyle = '#265422';
                    ctx.fillRect(tx, ty, 32, 5);
                    ctx.fillStyle = '#7a8e77';
                    ctx.fillRect(tx + 6, ty + 2, 7, 3);
                  }
                  if (r === riverEndR && (c % 3 === 1)) {
                    ctx.fillStyle = '#265422';
                    ctx.fillRect(tx, ty + 27, 32, 5);
                    ctx.fillStyle = '#7a8e77';
                    ctx.fillRect(tx + 16, ty + 25, 7, 3);
                  }
                } else if (
                  (r === 6 && c >= 2 && c <= 22) ||
                  ((c === 11 || c === 12) && r >= 7 && r < riverStartR) ||
                  ((c === 11 || c === 12) && r > riverEndR && r <= 13)
                ) {
                  // Chiseled Cobblestone Mountain Pathway
                  const cobbleX = (c + r) % 2 === 0 ? 128 : 160;
                  spriteManager.drawTile(ctx, '/assets/pixel/environment/ground_tileset.png', cobbleX, 0, tx, ty, 32);
                } else if (isRiverShoreTop || isRiverShoreBottom) {
                  // Shoreline pebble transition tile
                  spriteManager.drawTile(ctx, '/assets/pixel/environment/ground_tileset.png', 192, 0, tx, ty, 32);
                } else {
                  // Organic Lush Grass Variations & Wildflower Clumps
                  const seed = (c * 7 + r * 13) % 10;
                  let tileX = 32; // Default lush grass
                  if (seed === 0 || seed === 3) tileX = 64; // Wildflower grass
                  else if (seed === 7) tileX = 96; // Blooming flora
                  else if (seed === 8) tileX = 0; // Fertile soil patch
                  spriteManager.drawTile(ctx, '/assets/pixel/environment/ground_tileset.png', tileX, 0, tx, ty, 32);
                }
              }
            }
          }
        });

        // --- LAYER 1: WOODEN BRIDGE ACROSS CURVING RIVER ---
        renderer.submitEntity({
          layer: 1,
          sortY: 304,
          render: (ctx) => {
            // Rustic timber arched bridge spanning across the river channel (rows 8..10 at c=12)
            spriteManager.drawProp(ctx, '/assets/pixel/environment/bridge_rustic_wood.png', 384, 304, { x: 0.5, y: 0.5 });
          }
        });

        // --- LAYER 2: Y-SORTED ENTITIES & PROPS (Sorted by feetY) ---
        // 1a. Building Thanh Khê Đình (Pagoda Pavilion)
        renderer.submitEntity({
          layer: 2,
          sortY: 180,
          render: (ctx) => {
            spriteManager.drawProp(ctx, '/assets/pixel/environment/building_thanh_khe_dinh.png', 200, 180, { x: 0.5, y: 0.90 });
          }
        });

        // 1b. Hanging Lanterns on Pavilion Eaves (Animated)
        renderer.submitEntity({
          layer: 2,
          sortY: 175,
          render: (ctx) => {
            const lanternFrame = Math.floor((timestamp / 250) % 4);
            spriteManager.drawSpriteFrame(
              ctx,
              '/assets/pixel/environment/prop_hanging_lantern.png',
              155,
              138,
              lanternFrame,
              0,
              16,
              24,
              { x: 0.5, y: 0.1 }
            );
            spriteManager.drawSpriteFrame(
              ctx,
              '/assets/pixel/environment/prop_hanging_lantern.png',
              245,
              138,
              lanternFrame,
              0,
              16,
              24,
              { x: 0.5, y: 0.1 }
            );
          }
        });

        // 2. Ancient Spirit Pine (Gnarled Bonsai Tree)
        renderer.submitEntity({
          layer: 2,
          sortY: 210,
          render: (ctx) => {
            spriteManager.drawProp(ctx, '/assets/pixel/environment/tree_ancient_pine.png', 580, 210, { x: 0.5, y: 0.95 });
          }
        });

        // 3. Bamboo Stalk Cluster
        renderer.submitEntity({
          layer: 2,
          sortY: 260,
          render: (ctx) => {
            spriteManager.drawProp(ctx, '/assets/pixel/environment/tree_bamboo.png', 120, 260, { x: 0.5, y: 0.95 });
          }
        });

        // 4. Chiseled Rock (Planted naturally along the mountain path)
        renderer.submitEntity({
          layer: 2,
          sortY: 250,
          render: (ctx) => {
            spriteManager.drawProp(ctx, '/assets/pixel/environment/prop_chiseled_rock.png', 460, 250, { x: 0.5, y: 0.85 });
          }
        });

        // 5. NPC Trưởng Thôn Lý Đức
        renderer.submitEntity({
          layer: 2,
          sortY: 195,
          render: (ctx) => {
            spriteManager.drawSpriteFrame(
              ctx,
              '/assets/pixel/characters/npc_village_chief_ly_duc.png',
              240,
              195,
              npcAnim.current.getCurrentFrame(),
              0,
              48,
              64,
              { x: 0.5, y: 0.875 }
            );
          }
        });

        // 6. Regular Enemy: Thanh Khê Dã Lang (Spirit Wolf)
        renderer.submitEntity({
          layer: 2,
          sortY: 250,
          render: (ctx) => {
            spriteManager.drawSpriteFrame(
              ctx,
              '/assets/pixel/enemies/enemy_spirit_wolf.png',
              160,
              250,
              wolfAnim.current.getCurrentFrame(),
              wolfAnim.current.getRow(),
              48,
              48,
              { x: 0.5, y: 0.85 }
            );
          }
        });

        // 7. Regular Enemy: Thiết Bì Dã Trư (Prowling on Southern Grass Shore)
        renderer.submitEntity({
          layer: 2,
          sortY: 415,
          render: (ctx) => {
            spriteManager.drawSpriteFrame(
              ctx,
              '/assets/pixel/enemies/enemy_iron_boar.png',
              260,
              415,
              boarAnim.current.getCurrentFrame(),
              boarAnim.current.getRow(),
              64,
              48,
              { x: 0.5, y: 0.85 }
            );
          }
        });

        // 8. Regular Enemy: Hắc Sát Ma Đồ (Dark Cultist)
        renderer.submitEntity({
          layer: 2,
          sortY: 275,
          render: (ctx) => {
            spriteManager.drawSpriteFrame(
              ctx,
              '/assets/pixel/enemies/enemy_dark_cultist.png',
              520,
              275,
              cultistAnim.current.getCurrentFrame(),
              cultistAnim.current.getRow(),
              48,
              64,
              { x: 0.5, y: 0.875 }
            );
          }
        });

        // 9. Boss: Bạch Mao Viên Hầu (Giant White Ape Boss)
        renderer.submitEntity({
          layer: 2,
          sortY: 295,
          render: (ctx) => {
            spriteManager.drawSpriteFrame(
              ctx,
              '/assets/pixel/bosses/boss_white_ape.png',
              bossX.current,
              295,
              bossAnim.current.getCurrentFrame(),
              bossAnim.current.getRow(),
              128,
              128,
              { x: 0.5, y: 0.90 }
            );
          }
        });

        // 10. Player: Lâm Mặc (Kiếm Tu)
        renderer.submitEntity({
          layer: 2,
          sortY: playerPos.current.y,
          render: (ctx) => {
            spriteManager.drawSpriteFrame(
              ctx,
              '/assets/pixel/characters/player_cultivator_lam_mac.png',
              playerPos.current.x,
              playerPos.current.y,
              playerAnim.current.getCurrentFrame(),
              playerAnim.current.getRow(),
              64,
              64,
              { x: 0.5, y: 0.875 },
              playerFacing.current === 'left'
            );
          }
        });

        // --- LAYER 4: ACTIVE COMBAT VFX ---
        for (const vfx of activeVFXList.current) {
          renderer.submitEntity({
            layer: 4,
            sortY: vfx.y,
            render: (ctx) => {
              spriteManager.drawSpriteFrame(
                ctx,
                vfx.src,
                vfx.x,
                vfx.y,
                vfx.controller.getCurrentFrame(),
                vfx.controller.getRow(),
                vfx.fw,
                vfx.fh,
                vfx.pivot
              );
            }
          });
        }

        const metrics = renderer.endFrame();
        setTelemetry(metrics);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [loadingProgress.isComplete]);

  return (
    <div className="relative w-screen h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      {/* Loading Overlay */}
      {!loadingProgress.isComplete && (
        <div className="absolute inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <h2 className="text-xl font-bold text-amber-300 tracking-wider">
            ĐANG TẢI GÓI NGHỆ THUẬT PIXEL ART (PHASE 1)...
          </h2>
          <div className="w-64 bg-stone-800 rounded-full h-2.5 overflow-hidden border border-stone-700">
            <div
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-200"
              style={{ width: `${loadingProgress.percent}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 font-mono">
            {loadingProgress.loaded} / {loadingProgress.total} PNG Sprite Sheets ({loadingProgress.percent}%) · {loadingProgress.loadingTimeMs}ms
          </p>
        </div>
      )}

      {/* Top Header & Telemetry Bar */}
      <header className="absolute top-0 left-0 right-0 z-40 px-4 py-2 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between text-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Trở về Game Gốc
          </button>
          {onOpenSpriteViewer && (
            <button
              onClick={onOpenSpriteViewer}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-amber-500 to-emerald-600 hover:from-cyan-500 hover:via-amber-400 hover:to-emerald-500 text-stone-950 font-bold flex items-center gap-1.5 transition cursor-pointer shadow text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              👁️ Xem Sprite Sheet Lâm Mặc
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400 tracking-wider">🎨 PIXEL ART VISUAL SANDBOX</span>
            <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
              [Top-Down 3/4 · 800x450]
            </span>
          </div>
          {/* Zoom Level Selector */}
          <div className="flex items-center gap-1 bg-stone-800/90 p-0.5 rounded-lg border border-stone-700">
            <span className="text-[10px] text-stone-400 px-1 font-sans hidden md:inline">Zoom:</span>
            {[1, 1.5, 2, 3].map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                  zoom === z
                    ? 'bg-amber-600 text-stone-950 font-bold shadow'
                    : 'text-stone-300 hover:bg-stone-700'
                }`}
              >
                {z}x
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Telemetry Indicators */}
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1">
            <span className="text-stone-400">FPS:</span>
            <span className={`font-bold ${telemetry.fps >= 55 ? 'text-emerald-400' : (telemetry.fps >= 40 ? 'text-amber-400' : 'text-red-400')}`}>
              {telemetry.fps}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-stone-400">
            <span>Frame:</span>
            <span className="text-stone-200">{telemetry.frameTimeMs}ms</span>
          </div>
          <div className="hidden lg:flex items-center gap-1 text-stone-400">
            <span>DrawCalls:</span>
            <span className="text-stone-200">{telemetry.drawCalls}</span>
          </div>
          <div className="hidden lg:flex items-center gap-1 text-stone-400">
            <span>Sprites:</span>
            <span className="text-stone-200">{telemetry.visibleSprites}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-stone-400">
            <span>VRAM:</span>
            <span className="text-stone-200">~{telemetry.vramMemoryMB}MB</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-amber-300 font-semibold text-[10px]">
            {telemetry.isAndroid ? '📱 Android WebView' : '💻 Desktop Browser'}
          </div>
        </div>
      </header>

      {/* Main Pixel Canvas Viewport */}
      <div className="relative w-full h-full flex items-center justify-center p-2 pt-12 pb-16 bg-stone-950">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full border border-stone-800 shadow-2xl rounded-lg"
          style={{
            imageRendering: 'pixelated',
            aspectRatio: '16 / 9'
          }}
        />
      </div>

      {/* Floating Bottom Interactive Test Action Bar */}
      <footer className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-stone-900/95 border border-stone-800 shadow-2xl flex flex-wrap items-center justify-center gap-2 backdrop-blur-md max-w-[96vw]">
        <div className="flex items-center gap-1 text-xs text-stone-400 pr-2 border-r border-stone-700 hidden md:flex">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Thao tác:</span>
        </div>

        <button
          onClick={() => triggerPlayerAttack('attack1')}
          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition cursor-pointer flex items-center gap-1"
        >
          ⚔️ Trảm Kiếm 1 [J]
        </button>

        <button
          onClick={() => triggerPlayerAttack('attack2')}
          className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-stone-100 font-bold text-xs transition cursor-pointer flex items-center gap-1"
        >
          ⚔️ Thứ Kiếm 2 [K]
        </button>

        <button
          onClick={triggerFireSkill}
          className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-stone-100 font-bold text-xs transition cursor-pointer flex items-center gap-1"
        >
          <Flame className="w-3.5 h-3.5 text-yellow-300" />
          Hỏa Kiếm [Fire]
        </button>

        <button
          onClick={triggerLightningSkill}
          className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-stone-100 font-bold text-xs transition cursor-pointer flex items-center gap-1"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          Lôi Đình [Lightning]
        </button>

        <button
          onClick={triggerPlayerDash}
          className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-stone-100 font-bold text-xs transition cursor-pointer flex items-center gap-1"
        >
          <Wind className="w-3.5 h-3.5 text-cyan-200" />
          Né [Space]
        </button>

        <button
          onClick={triggerPlayerHit}
          className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-red-300 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Trúng Đòn [H]
        </button>

        <button
          onClick={triggerPlayerDeath}
          className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 font-semibold text-xs transition cursor-pointer"
        >
          Tử Vong [D]
        </button>

        <button
          onClick={triggerBossCharge}
          className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-stone-100 font-bold text-xs transition cursor-pointer flex items-center gap-1"
        >
          🦍 Boss Húc [B]
        </button>
      </footer>
    </div>
  );
}
