/**
 * NORMAL MONSTER SPRITE RENDERER (PHÀM TRẦN TIÊN LỘ – PHASE 2.1)
 * High-performance HD Pixel Art Sprite Renderer for 3 Normal Monsters:
 *   - Dã Lang (野狼, shape: 'wolf')    -> /assets/pixel-art/monsters/da_lang/
 *   - Dã Trư  (野猪, shape: 'boar')    -> /assets/pixel-art/monsters/da_tru/
 *   - Ma Đồ   (魔徒, shape: 'cultist') -> /assets/pixel-art/monsters/ma_do/
 *
 * Technical Standard (aligned 100% with Phase 2.0 Lâm Mặc):
 *   - 5 Animations per monster: idle (4f/6fps), walk (6f/10fps), attack (6f/12fps), hit (3f/10fps), death (6f/10fps).
 *   - 4 Directions row order: Down (0), Left (1), Right (2), Up (3).
 *   - Standard Frame Size: 64x64 px.
 *   - Normalized Feet Pivot: (0.5, 0.875) -> Pixel (32, 56).
 *   - Nearest-Neighbor (ctx.imageSmoothingEnabled = false).
 *   - Zero per-frame heap allocation in hot render loop.
 */

import { AnimationController, AnimationSpec } from './AnimationController';
import { pixelAssetLoader } from './PixelAssetLoader';
import { DIRECTION_ROWS, LamMacSpriteRenderer } from './LamMacSpriteRenderer';
import { Enemy } from '../../types/game';

export type NormalMonsterId = 'da_lang' | 'da_tru' | 'ma_do';
export type MonsterAnimKey = 'idle' | 'walk' | 'attack' | 'hit' | 'death';
export type CardinalDirection = 'down' | 'left' | 'right' | 'up';

export interface MonsterAnimMeta {
  file: string;
  frameCount: number;
  fps: number;
  loop: boolean;
  hitFrame?: number;
  holdLastFrame?: boolean;
}

export const NORMAL_MONSTER_IDS: readonly NormalMonsterId[] = ['da_lang', 'da_tru', 'ma_do'];

export const MONSTER_SHAPE_TO_ID: Record<string, NormalMonsterId> = {
  wolf: 'da_lang',
  boar: 'da_tru',
  cultist: 'ma_do',
};

export const MONSTER_ANIM_SPECS: Record<MonsterAnimKey, MonsterAnimMeta> = {
  idle: {
    file: 'idle.png',
    frameCount: 4,
    fps: 6,
    loop: true,
  },
  walk: {
    file: 'walk.png',
    frameCount: 6,
    fps: 10,
    loop: true,
  },
  attack: {
    file: 'attack.png',
    frameCount: 6,
    fps: 12,
    loop: false,
    hitFrame: 3,
  },
  hit: {
    file: 'hit.png',
    frameCount: 3,
    fps: 10,
    loop: false,
  },
  death: {
    file: 'death.png',
    frameCount: 6,
    fps: 10,
    loop: false,
    holdLastFrame: true,
  },
};

export function getMonsterSheetUrl(monsterId: NormalMonsterId, animKey: MonsterAnimKey): string {
  return `/assets/pixel-art/monsters/${monsterId}/${MONSTER_ANIM_SPECS[animKey].file}`;
}

export interface MonsterInstanceState {
  monsterId: NormalMonsterId;
  controller: AnimationController;
  currentAnimKey: MonsterAnimKey;
  currentDirection: CardinalDirection;
  isLocked: boolean;
  lockPriority: number;
  prevX: number;
  prevY: number;
  hasPrevPos: boolean;
  moveGraceTimer: number;
  prevHurtTimer: number;
  deathTimer: number;
  lastFrameStamp: number;
}

const DEATH_HOLD_VISIBLE_SECONDS = 1.15;

export class MonsterSpriteRenderer {
  private static instance: MonsterSpriteRenderer;

  private instances: Map<string, MonsterInstanceState> = new Map();
  private preloadPromise: Promise<void> | null = null;
  private isPreloaded: boolean = false;
  private frameStamp: number = 0;

  // Constant dimensions & normalized feet pivot
  public readonly frameWidth = 64;
  public readonly frameHeight = 64;
  public readonly pivotX = 0.5;
  public readonly pivotY = 0.875; // Y = 56px anchor inside 64x64 frame

  // Reusable scratch Spec object to prevent per-frame object churn during transitions
  private readonly scratchSpec: AnimationSpec = {
    fps: 6,
    loop: true,
    frameCount: 4,
    row: 0,
  };

  private constructor() {}

  public static getInstance(): MonsterSpriteRenderer {
    if (!MonsterSpriteRenderer.instance) {
      MonsterSpriteRenderer.instance = new MonsterSpriteRenderer();
    }
    return MonsterSpriteRenderer.instance;
  }

  /**
   * Check whether an enemy uses the Phase 2.1 Pixel Art Normal Monster Renderer.
   * Bosses and other monster shapes safely stay on fallback renderer.
   */
  public static supportsEnemy(enemy: Pick<Enemy, 'shape' | 'isBoss'>): boolean {
    if (enemy.isBoss) return false;
    return enemy.shape !== undefined && enemy.shape in MONSTER_SHAPE_TO_ID;
  }

  public static resolveMonsterId(enemy: Pick<Enemy, 'shape' | 'isBoss'>): NormalMonsterId | null {
    if (!MonsterSpriteRenderer.supportsEnemy(enemy)) return null;
    return MONSTER_SHAPE_TO_ID[enemy.shape!] ?? null;
  }

  /**
   * Preload all 15 PNG sprite sheets (3 monsters x 5 animations) once into PixelAssetLoader cache
   */
  public preloadAll(): Promise<void> {
    if (this.preloadPromise) return this.preloadPromise;

    const urls: string[] = [];
    for (const monsterId of NORMAL_MONSTER_IDS) {
      for (const animKey of Object.keys(MONSTER_ANIM_SPECS) as MonsterAnimKey[]) {
        urls.push(getMonsterSheetUrl(monsterId, animKey));
      }
    }

    this.preloadPromise = (async () => {
      try {
        await pixelAssetLoader.loadAssetPack(urls);
        this.isPreloaded = true;
      } catch (err) {
        console.warn('[MonsterSpriteRenderer] Warning during asset preloading:', err);
        this.isPreloaded = true;
      }
    })();

    return this.preloadPromise;
  }

  public hasPreloaded(): boolean {
    return this.isPreloaded;
  }

  /**
   * Clear tracked per-enemy controllers (e.g. on map/scene switch)
   */
  public clearInstances(): void {
    this.instances.clear();
  }

  /**
   * Remove stale enemy instances that are no longer in the active map
   */
  public pruneStaleInstances(): void {
    if (this.instances.size <= 32) return;
    for (const [id, inst] of this.instances) {
      if (this.frameStamp - inst.lastFrameStamp > 120) {
        this.instances.delete(id);
      }
    }
  }

  public getInstanceState(enemyId: string): MonsterInstanceState | undefined {
    return this.instances.get(enemyId);
  }

  /**
   * Whether a dead enemy should still remain visible briefly to finish its death animation
   */
  public shouldRenderDead(enemy: Enemy): boolean {
    if (enemy.hp > 0) return false;
    if (!MonsterSpriteRenderer.supportsEnemy(enemy)) return false;
    const inst = this.instances.get(enemy.id);
    if (!inst) return true; // allow first death frame to initialize
    return inst.deathTimer < DEATH_HOLD_VISIBLE_SECONDS;
  }

  private getOrCreateInstance(enemy: Enemy, monsterId: NormalMonsterId): MonsterInstanceState {
    let inst = this.instances.get(enemy.id);
    if (!inst || inst.monsterId !== monsterId) {
      const idleSpec = MONSTER_ANIM_SPECS.idle;
      inst = {
        monsterId,
        controller: new AnimationController('idle', {
          fps: idleSpec.fps,
          loop: idleSpec.loop,
          frameCount: idleSpec.frameCount,
          row: 0,
        }),
        currentAnimKey: 'idle',
        currentDirection: 'down',
        isLocked: false,
        lockPriority: 0,
        prevX: enemy.x,
        prevY: enemy.y,
        hasPrevPos: true,
        moveGraceTimer: 0,
        prevHurtTimer: 0,
        deathTimer: 0,
        lastFrameStamp: this.frameStamp,
      };
      this.instances.set(enemy.id, inst);
    }
    return inst;
  }

  /**
   * Switch animation for a monster instance with priority locking
   */
  public playAnimation(
    inst: MonsterInstanceState,
    animKey: MonsterAnimKey,
    direction: CardinalDirection,
    priority: number = 1,
    forceRestart: boolean = false
  ): boolean {
    const spec = MONSTER_ANIM_SPECS[animKey];
    if (!spec) return false;

    // Death is irrevocable while dead
    if (inst.currentAnimKey === 'death' && animKey !== 'death') {
      return false;
    }

    // Active higher-priority non-looping animation cannot be cut off prematurely
    if (inst.isLocked && !inst.controller.isDone() && priority < inst.lockPriority && !forceRestart) {
      return false;
    }

    const row = DIRECTION_ROWS[direction] ?? 0;
    const isNewAnim = inst.currentAnimKey !== animKey;
    const isNewDir = inst.currentDirection !== direction;

    if (!isNewAnim && !isNewDir && !forceRestart && !inst.controller.isDone()) {
      return true;
    }

    inst.currentAnimKey = animKey;
    inst.currentDirection = direction;
    inst.lockPriority = priority;
    inst.isLocked = !spec.loop;

    this.scratchSpec.fps = spec.fps;
    this.scratchSpec.loop = spec.loop;
    this.scratchSpec.frameCount = spec.frameCount;
    this.scratchSpec.row = row;
    this.scratchSpec.holdLastFrame = spec.holdLastFrame;
    this.scratchSpec.hitFrame = spec.hitFrame;

    // Copy spec cleanly for AnimationController ownership
    const ownedSpec: AnimationSpec = {
      fps: spec.fps,
      loop: spec.loop,
      frameCount: spec.frameCount,
      row,
      holdLastFrame: spec.holdLastFrame,
      hitFrame: spec.hitFrame,
    };

    inst.controller.play(
      animKey,
      ownedSpec,
      () => {
        if (!spec.loop && animKey !== 'death') {
          inst.isLocked = false;
          inst.lockPriority = 0;
        }
      },
      undefined,
      isNewAnim || forceRestart
    );

    return true;
  }

  /**
   * Synchronize monster animation & 4-way facing directly from live AI state & movement delta
   */
  public syncWithEnemyAI(
    enemy: Enemy,
    dt: number,
    playerX: number,
    playerY: number
  ): MonsterInstanceState | null {
    const monsterId = MonsterSpriteRenderer.resolveMonsterId(enemy);
    if (!monsterId) return null;

    const inst = this.getOrCreateInstance(enemy, monsterId);
    inst.lastFrameStamp = this.frameStamp;

    // Compute motion delta from previous rendered frame (zero gameplay mutation)
    const dx = inst.hasPrevPos ? enemy.x - inst.prevX : 0;
    const dy = inst.hasPrevPos ? enemy.y - inst.prevY : 0;
    inst.prevX = enemy.x;
    inst.prevY = enemy.y;
    inst.hasPrevPos = true;

    const movedDist = Math.hypot(dx, dy);
    const isMovingNow = movedDist > 0.12;
    if (isMovingNow) {
      inst.moveGraceTimer = 0.10;
    } else if (inst.moveGraceTimer > 0) {
      inst.moveGraceTimer = Math.max(0, inst.moveGraceTimer - dt);
    }

    // Determine 4-way facing
    let dir = inst.currentDirection;
    const toPlayerAngle = Math.atan2(playerY - enemy.y, playerX - enemy.x);
    if (enemy.state === 'attack_windup' || enemy.state === 'attacking' || enemy.state === 'detect') {
      dir = LamMacSpriteRenderer.getDirectionFromAngle(toPlayerAngle);
    } else if (isMovingNow) {
      dir = LamMacSpriteRenderer.getDirectionFromAngle(Math.atan2(dy, dx));
    } else if (enemy.state === 'chase') {
      dir = LamMacSpriteRenderer.getDirectionFromAngle(toPlayerAngle);
    }

    // Respawn recovery: if enemy HP was restored after previous death, reset instance cleanly
    if (enemy.hp > 0 && inst.currentAnimKey === 'death') {
      inst.currentAnimKey = 'idle';
      inst.isLocked = false;
      inst.lockPriority = 0;
      inst.deathTimer = 0;
    }

    // 1. DEATH (Priority 5)
    if (enemy.hp <= 0 || enemy.state === 'dead') {
      inst.deathTimer += dt;
      this.playAnimation(inst, 'death', dir, 5);
      return inst;
    }

    // 2. HIT REACTION (Priority 4)
    const hurtTimer = enemy.hurtTimer || 0;
    const hurtReTriggered = hurtTimer > inst.prevHurtTimer + 0.05;
    inst.prevHurtTimer = hurtTimer;

    if (hurtTimer > 0.04 || enemy.state === 'hurt') {
      this.playAnimation(inst, 'hit', dir, 4, hurtReTriggered);
      return inst;
    }

    // 3. ATTACK (Priority 2)
    if (enemy.state === 'attack_windup' || enemy.state === 'attacking') {
      this.playAnimation(inst, 'attack', dir, 2);
      return inst;
    }

    // Let active non-looping attack/hit animation finish its frames cleanly
    if (inst.isLocked && !inst.controller.isDone()) {
      return inst;
    }

    // 4. WALK vs IDLE (Priority 1)
    if (isMovingNow || inst.moveGraceTimer > 0) {
      this.playAnimation(inst, 'walk', dir, 1);
    } else {
      this.playAnimation(inst, 'idle', dir, 1);
    }

    return inst;
  }

  /**
   * Advance global frame stamp once per render tick
   */
  public beginFrame(): void {
    this.frameStamp++;
    if (this.frameStamp % 180 === 0) {
      this.pruneStaleInstances();
    }
  }

  /**
   * Render normal monster sprite + ground shadow + gameplay overlays (telegraph, !, HP bar).
   * Returns true if rendered by Pixel Art pipeline, false if caller should use fallback renderer.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    dt: number,
    time: number,
    playerX: number,
    playerY: number
  ): boolean {
    const monsterId = MonsterSpriteRenderer.resolveMonsterId(enemy);
    if (!monsterId) return false;

    const inst = this.syncWithEnemyAI(enemy, dt, playerX, playerY);
    if (!inst) return false;

    // Stop drawing after death corpse fade-out window completes
    if (enemy.hp <= 0 && inst.deathTimer >= DEATH_HOLD_VISIBLE_SECONDS) {
      return true;
    }

    inst.controller.update(dt);

    const animKey = inst.controller.getAnimName() as MonsterAnimKey;
    const currentFrame = inst.controller.getCurrentFrame();
    const row = inst.controller.getRow();
    const sheetUrl = getMonsterSheetUrl(monsterId, animKey);
    const image = pixelAssetLoader.getImage(sheetUrl);

    const isAlive = enemy.hp > 0;
    const isHurt = isAlive && (enemy.hurtTimer || 0) > 0;

    // 1. Telegraph Warning Indicator for Windup Attacks (alive only)
    if (isAlive && enemy.state === 'attack_windup') {
      renderNormalEnemyTelegraph(ctx, enemy, time);
    }

    // 2. Alert icon (alive only)
    if (isAlive && enemy.state === 'detect') {
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', enemy.x, enemy.y - 36);
      ctx.restore();
    }

    // 3. Ground Contact Shadow anchored at feet pivot
    const footX = Math.round(enemy.x);
    const footY = Math.round(enemy.y + 14);
    const fadeAlpha =
      !isAlive && inst.deathTimer > 0.65
        ? Math.max(0, 1 - (inst.deathTimer - 0.65) / (DEATH_HOLD_VISIBLE_SECONDS - 0.65))
        : 1;

    ctx.save();
    ctx.globalAlpha = 0.44 * fadeAlpha;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(footX, footY, monsterId === 'da_tru' ? 18 : 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Nearest-Neighbor Sprite Frame Draw
    if (image && image.complete && image.naturalWidth > 0) {
      const sx = currentFrame * this.frameWidth;
      const sy = row * this.frameHeight;
      const dx = Math.round(footX - this.frameWidth * this.pivotX);
      const dy = Math.round(footY - this.frameHeight * this.pivotY);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (fadeAlpha < 1) {
        ctx.globalAlpha = fadeAlpha;
      }
      if (isHurt) {
        ctx.filter = 'brightness(1.45) drop-shadow(0 0 4px #ef4444)';
      }

      ctx.drawImage(
        image,
        sx,
        sy,
        this.frameWidth,
        this.frameHeight,
        dx,
        dy,
        this.frameWidth,
        this.frameHeight
      );
      ctx.restore();
    }

    // 5. Overhead Health Bar & Name (alive only)
    if (isAlive) {
      renderNormalEnemyHealthBar(ctx, enemy);
    }

    return true;
  }
}

function renderNormalEnemyTelegraph(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  time: number
): void {
  const maxWindup = 0.38;
  const elapsed = Math.max(0, maxWindup - (enemy.windupTimer || 0));
  const progress = Math.min(1, Math.max(0, elapsed / maxWindup));
  const radius = enemy.telegraphRadius || enemy.attackRange + 22;

  ctx.save();
  const pulseAlpha = 0.22 + Math.sin(time / 70) * 0.1;
  ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + 12, radius, radius * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + 12, radius, radius * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const curR = radius * (1 - progress);
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + 12, Math.max(4, curR), Math.max(2, curR * 0.5), 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  const telegraphText =
    enemy.shape === 'boar'
      ? '⚡ SẮP LAO HÚC!'
      : enemy.shape === 'cultist'
      ? '⚡ TỤ MA KHÍ!'
      : '⚡ CHỰC VỒ!';
  ctx.fillText(telegraphText, enemy.x, enemy.y - radius * 0.5 - 14);
  ctx.restore();
}

function renderNormalEnemyHealthBar(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  const barW = 48;
  const barH = 5;
  const hpPct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
  const barY = enemy.y - 34;

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(enemy.x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#292524';
  ctx.fillRect(enemy.x - barW / 2, barY, barW, barH);
  ctx.fillStyle = enemy.category === 'elite' ? '#a855f7' : hpPct > 0.3 ? '#ef4444' : '#dc2626';
  ctx.fillRect(enemy.x - barW / 2, barY, barW * hpPct, barH);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(enemy.name, enemy.x, barY - 4);
  ctx.restore();
}

export const monsterSpriteRenderer = MonsterSpriteRenderer.getInstance();
