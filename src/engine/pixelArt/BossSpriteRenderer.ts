/**
 * BOSS SPRITE RENDERER – BẠCH MAO VIÊN HẦU (白毛猿猴) (PHÀM TRẦN TIÊN LỘ – PHASE 2.2)
 * High-performance HD Pixel Art Sprite Renderer for Giant White Ape Boss.
 *
 * Technical Standard:
 *  - 9 Boss Animations (128x128 px, 4 directions: down=0, left=1, right=2, up=3):
 *      idle (6f/6fps), walk (8f/8fps), run (8f/12fps),
 *      attack_1 (7f/12fps, Thiết Chưởng), attack_2 (8f/14fps, Cuồng Nộ Liên Kích),
 *      attack_3 (8f/14fps, Cuồng Bạo Xung Kích), skill (10f/10fps, Bạch Viên Chấn Địa),
 *      hit (4f/10fps), death (10f/8fps, holdLastFrame).
 *  - 6 Dedicated Pixel Art VFX Sheets in /assets/pixel-art/vfx/bach_mao_vien_hau/:
 *      vfx_chuong_kich, vfx_dia_chan, vfx_yeu_khi_tu_luc,
 *      vfx_bach_vien_chan_dia, vfx_cuong_no (Phase 2 Enrage), vfx_boss_death.
 *  - Normalized Feet Pivot: (0.5, 0.90) -> Pixel (64, 115) inside 128x128 cell.
 *  - Nearest-Neighbor (ctx.imageSmoothingEnabled = false).
 *  - Android-budget friendly: zero ctx.filter blur/drop-shadow, pre-allocated per-boss instance state.
 */

import { AnimationController, AnimationSpec } from './AnimationController';
import { pixelAssetLoader } from './PixelAssetLoader';
import { DIRECTION_ROWS, LamMacSpriteRenderer } from './LamMacSpriteRenderer';
import { CardinalDirection } from './MonsterSpriteRenderer';
import { Enemy } from '../../types/game';

export type BossAnimKey =
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack_1'
  | 'attack_2'
  | 'attack_3'
  | 'skill'
  | 'hit'
  | 'death';

export type BossVfxKey =
  | 'vfx_chuong_kich'
  | 'vfx_dia_chan'
  | 'vfx_yeu_khi_tu_luc'
  | 'vfx_bach_vien_chan_dia'
  | 'vfx_cuong_no'
  | 'vfx_boss_death';

export interface BossAnimMeta {
  file: string;
  frameCount: number;
  fps: number;
  loop: boolean;
  hitFrame?: number;
  secondaryHitFrame?: number;
  holdLastFrame?: boolean;
  vfxBinding?: BossVfxKey | null;
}

export interface BossVfxMeta {
  file: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
  pivotX: number;
  pivotY: number;
}

export const BOSS_ID = 'bach_mao_vien_hau';

export const BOSS_ANIM_SPECS: Record<BossAnimKey, BossAnimMeta> = {
  idle: {
    file: 'idle.png',
    frameCount: 6,
    fps: 6,
    loop: true,
    vfxBinding: null,
  },
  walk: {
    file: 'walk.png',
    frameCount: 8,
    fps: 8,
    loop: true,
    vfxBinding: null,
  },
  run: {
    file: 'run.png',
    frameCount: 8,
    fps: 12,
    loop: true,
    vfxBinding: null,
  },
  attack_1: {
    file: 'attack_1.png',
    frameCount: 7,
    fps: 12,
    loop: false,
    hitFrame: 4,
    vfxBinding: 'vfx_chuong_kich',
  },
  attack_2: {
    file: 'attack_2.png',
    frameCount: 8,
    fps: 14,
    loop: false,
    hitFrame: 3,
    secondaryHitFrame: 6,
    vfxBinding: 'vfx_chuong_kich',
  },
  attack_3: {
    file: 'attack_3.png',
    frameCount: 8,
    fps: 14,
    loop: false,
    hitFrame: 4,
    vfxBinding: 'vfx_dia_chan',
  },
  skill: {
    file: 'skill.png',
    frameCount: 10,
    fps: 10,
    loop: false,
    hitFrame: 6,
    vfxBinding: 'vfx_bach_vien_chan_dia',
  },
  hit: {
    file: 'hit.png',
    frameCount: 4,
    fps: 10,
    loop: false,
    vfxBinding: null,
  },
  death: {
    file: 'death.png',
    frameCount: 10,
    fps: 8,
    loop: false,
    holdLastFrame: true,
    vfxBinding: 'vfx_boss_death',
  },
};

export const BOSS_VFX_SPECS: Record<BossVfxKey, BossVfxMeta> = {
  vfx_chuong_kich: {
    file: 'vfx_chuong_kich.png',
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 6,
    fps: 16,
    loop: false,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  vfx_dia_chan: {
    file: 'vfx_dia_chan.png',
    frameWidth: 160,
    frameHeight: 160,
    frameCount: 6,
    fps: 14,
    loop: false,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  vfx_yeu_khi_tu_luc: {
    file: 'vfx_yeu_khi_tu_luc.png',
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 6,
    fps: 12,
    loop: false,
    pivotX: 0.5,
    pivotY: 0.55,
  },
  vfx_bach_vien_chan_dia: {
    file: 'vfx_bach_vien_chan_dia.png',
    frameWidth: 160,
    frameHeight: 160,
    frameCount: 8,
    fps: 14,
    loop: false,
    pivotX: 0.5,
    pivotY: 0.5,
  },
  vfx_cuong_no: {
    file: 'vfx_cuong_no.png',
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 6,
    fps: 10,
    loop: true,
    pivotX: 0.5,
    pivotY: 0.75,
  },
  vfx_boss_death: {
    file: 'vfx_boss_death.png',
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 8,
    fps: 10,
    loop: false,
    pivotX: 0.5,
    pivotY: 0.6,
  },
};

export function getBossSheetUrl(animKey: BossAnimKey): string {
  return `/assets/pixel-art/bosses/${BOSS_ID}/${BOSS_ANIM_SPECS[animKey].file}`;
}

export function getBossVfxUrl(vfxKey: BossVfxKey): string {
  return `/assets/pixel-art/vfx/${BOSS_ID}/${BOSS_VFX_SPECS[vfxKey].file}`;
}

export interface BossVfxSlot {
  active: boolean;
  key: BossVfxKey | null;
  x: number;
  y: number;
  controller: AnimationController;
}

export interface BossInstanceState {
  controller: AnimationController;
  currentAnimKey: BossAnimKey;
  currentDirection: CardinalDirection;
  isLocked: boolean;
  lockPriority: number;
  isEnraged: boolean;
  prevX: number;
  prevY: number;
  hasPrevPos: boolean;
  moveGraceTimer: number;
  prevHurtTimer: number;
  prevState: Enemy['state'];
  prevWindupPattern: Enemy['bossAttackPattern'] | undefined;
  deathTimer: number;
  lastFrameStamp: number;
  primaryVfx: BossVfxSlot;
  secondaryVfx: BossVfxSlot;
  enrageAuraController: AnimationController;
}

const DEATH_HOLD_VISIBLE_SECONDS = 1.65;

export class BossSpriteRenderer {
  private static instance: BossSpriteRenderer;

  private instances: Map<string, BossInstanceState> = new Map();
  private preloadPromise: Promise<void> | null = null;
  private isPreloaded: boolean = false;
  private frameStamp: number = 0;

  // Constant dimensions & normalized feet pivot (128x128 frame)
  public readonly frameWidth = 128;
  public readonly frameHeight = 128;
  public readonly pivotX = 0.5;
  public readonly pivotY = 0.90; // Y = 115px inside 128x128 frame

  // Reusable scratch Spec object for zero hot-loop churn
  private readonly scratchSpec: AnimationSpec = {
    fps: 6,
    loop: true,
    frameCount: 6,
    row: 0,
  };

  private constructor() {}

  public static getInstance(): BossSpriteRenderer {
    if (!BossSpriteRenderer.instance) {
      BossSpriteRenderer.instance = new BossSpriteRenderer();
    }
    return BossSpriteRenderer.instance;
  }

  /**
   * Check whether an enemy uses Boss Bạch Mao Viên Hầu Pixel Art Pipeline.
   * Normal monsters and unrelated legacy bosses safely pass through.
   */
  public static supportsEnemy(enemy: Pick<Enemy, 'shape' | 'isBoss' | 'name'>): boolean {
    if (!enemy.isBoss) return false;
    if (enemy.shape === 'ape_boss') return true;
    const lower = (enemy.name || '').toLowerCase();
    return lower.includes('bạch mao viên hầu');
  }

  /**
   * Preload all 9 Boss sheets + 6 Boss VFX sheets once into PixelAssetLoader cache.
   */
  public preloadAll(): Promise<void> {
    if (this.preloadPromise) return this.preloadPromise;

    const urls: string[] = [];
    for (const animKey of Object.keys(BOSS_ANIM_SPECS) as BossAnimKey[]) {
      urls.push(getBossSheetUrl(animKey));
    }
    for (const vfxKey of Object.keys(BOSS_VFX_SPECS) as BossVfxKey[]) {
      urls.push(getBossVfxUrl(vfxKey));
    }

    this.preloadPromise = (async () => {
      try {
        await pixelAssetLoader.loadAssetPack(urls);
        this.isPreloaded = true;
      } catch (err) {
        console.warn('[BossSpriteRenderer] Warning during Boss asset preloading:', err);
        this.isPreloaded = true;
      }
    })();

    return this.preloadPromise;
  }

  public hasPreloaded(): boolean {
    return this.isPreloaded;
  }

  public clearInstances(): void {
    this.instances.clear();
  }

  public releasePreloadState(): void {
    this.instances.clear();
    this.preloadPromise = null;
    this.isPreloaded = false;
  }

  public pruneStaleInstances(): void {
    if (this.instances.size <= 8) return;
    for (const [id, inst] of this.instances) {
      if (this.frameStamp - inst.lastFrameStamp > 240) {
        this.instances.delete(id);
      }
    }
  }

  public getInstanceState(enemyId: string): BossInstanceState | undefined {
    return this.instances.get(enemyId);
  }

  public shouldRenderDead(enemy: Enemy): boolean {
    if (enemy.hp > 0) return false;
    if (!BossSpriteRenderer.supportsEnemy(enemy)) return false;
    const inst = this.instances.get(enemy.id);
    if (!inst) return true;
    return inst.deathTimer < DEATH_HOLD_VISIBLE_SECONDS;
  }

  private getOrCreateInstance(enemy: Enemy): BossInstanceState {
    let inst = this.instances.get(enemy.id);
    if (!inst) {
      const idleSpec = BOSS_ANIM_SPECS.idle;
      const enrageVfx = BOSS_VFX_SPECS.vfx_cuong_no;
      const enrageCtrl = new AnimationController('vfx_cuong_no', {
        fps: enrageVfx.fps,
        loop: true,
        frameCount: enrageVfx.frameCount,
        row: 0,
      });

      const primaryCtrl = new AnimationController('idle_vfx', {
        fps: 12,
        loop: false,
        frameCount: 6,
        row: 0,
      });
      const secondaryCtrl = new AnimationController('sec_vfx', {
        fps: 12,
        loop: false,
        frameCount: 6,
        row: 0,
      });

      inst = {
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
        isEnraged: (enemy.bossPhase || 1) >= 2,
        prevX: enemy.x,
        prevY: enemy.y,
        hasPrevPos: true,
        moveGraceTimer: 0,
        prevHurtTimer: 0,
        prevState: enemy.state,
        prevWindupPattern: enemy.bossAttackPattern,
        deathTimer: 0,
        lastFrameStamp: this.frameStamp,
        primaryVfx: {
          active: false,
          key: null,
          x: enemy.x,
          y: enemy.y,
          controller: primaryCtrl,
        },
        secondaryVfx: {
          active: false,
          key: null,
          x: enemy.x,
          y: enemy.y,
          controller: secondaryCtrl,
        },
        enrageAuraController: enrageCtrl,
      };
      this.instances.set(enemy.id, inst);
    }
    return inst;
  }

  /**
   * Trigger a dedicated Boss Pixel VFX at world coordinates (x, y)
   */
  public triggerVfx(
    enemyId: string,
    vfxKey: BossVfxKey,
    worldX: number,
    worldY: number,
    useSecondarySlot: boolean = false
  ): void {
    const inst = this.instances.get(enemyId);
    if (!inst) return;
    const spec = BOSS_VFX_SPECS[vfxKey];
    if (!spec) return;

    const slot = useSecondarySlot ? inst.secondaryVfx : inst.primaryVfx;
    slot.active = true;
    slot.key = vfxKey;
    slot.x = worldX;
    slot.y = worldY;
    slot.controller.play(
      vfxKey,
      {
        fps: spec.fps,
        loop: spec.loop,
        frameCount: spec.frameCount,
        row: 0,
      },
      () => {
        if (!spec.loop) {
          slot.active = false;
          slot.key = null;
        }
      },
      undefined,
      true
    );
  }

  /**
   * Play a Boss animation with strict priority locking:
   * Priority: Death (6) > Hit/Stun (5) > Skill (4) > Attack 1/2/3 (3) > Enrage Run (2) > Walk (1) > Idle (0)
   */
  public playAnimation(
    inst: BossInstanceState,
    animKey: BossAnimKey,
    direction: CardinalDirection,
    priority: number = 1,
    forceRestart: boolean = false
  ): boolean {
    const spec = BOSS_ANIM_SPECS[animKey];
    if (!spec) return false;

    if (inst.currentAnimKey === 'death' && animKey !== 'death') {
      return false;
    }

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

    const ownedSpec: AnimationSpec = {
      fps: this.scratchSpec.fps,
      loop: this.scratchSpec.loop,
      frameCount: this.scratchSpec.frameCount,
      row: this.scratchSpec.row,
      holdLastFrame: this.scratchSpec.holdLastFrame,
      hitFrame: this.scratchSpec.hitFrame,
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

  private resolveAttackAnimKey(pattern: Enemy['bossAttackPattern']): BossAnimKey {
    switch (pattern) {
      case 'combo':
        return 'attack_2';
      case 'charge':
        return 'attack_3';
      case 'slam':
      case 'skill':
      case 'roar':
        return 'skill';
      case 'melee':
      default:
        return 'attack_1';
    }
  }

  /**
   * Synchronize Boss 9 animations & VFX states directly from live AI state (zero gameplay mutation)
   */
  public syncWithBossAI(
    enemy: Enemy,
    dt: number,
    playerX: number,
    playerY: number
  ): BossInstanceState | null {
    if (!BossSpriteRenderer.supportsEnemy(enemy)) return null;

    const inst = this.getOrCreateInstance(enemy);
    inst.lastFrameStamp = this.frameStamp;
    inst.isEnraged = (enemy.bossPhase || 1) >= 2;

    const dx = inst.hasPrevPos ? enemy.x - inst.prevX : 0;
    const dy = inst.hasPrevPos ? enemy.y - inst.prevY : 0;
    inst.prevX = enemy.x;
    inst.prevY = enemy.y;
    inst.hasPrevPos = true;

    const movedDist = Math.hypot(dx, dy);
    const isMovingNow = movedDist > 0.14;
    if (isMovingNow) {
      inst.moveGraceTimer = 0.12;
    } else if (inst.moveGraceTimer > 0) {
      inst.moveGraceTimer = Math.max(0, inst.moveGraceTimer - dt);
    }

    // 4-direction orientation
    let dir = inst.currentDirection;
    const toPlayerAngle = Math.atan2(playerY - enemy.y, playerX - enemy.x);
    if (
      enemy.state === 'attack_windup' ||
      enemy.state === 'attacking' ||
      enemy.state === 'detect' ||
      (enemy.bossPunishTimer || 0) > 0
    ) {
      if (enemy.state === 'attacking' && enemy.chargeState) {
        const cdx = enemy.chargeState.targetX - enemy.chargeState.startX;
        const cdy = enemy.chargeState.targetY - enemy.chargeState.startY;
        dir = LamMacSpriteRenderer.getDirectionFromAngle(Math.atan2(cdy, cdx));
      } else {
        dir = LamMacSpriteRenderer.getDirectionFromAngle(toPlayerAngle);
      }
    } else if (isMovingNow) {
      dir = LamMacSpriteRenderer.getDirectionFromAngle(Math.atan2(dy, dx));
    } else if (enemy.state === 'chase') {
      dir = LamMacSpriteRenderer.getDirectionFromAngle(toPlayerAngle);
    }

    // Respawn reset guard
    if (enemy.hp > 0 && inst.currentAnimKey === 'death') {
      inst.currentAnimKey = 'idle';
      inst.isLocked = false;
      inst.lockPriority = 0;
      inst.deathTimer = 0;
    }

    // 1. DEATH (Priority 6)
    if (enemy.hp <= 0 || enemy.state === 'dead') {
      const enteringDeath = inst.currentAnimKey !== 'death';
      inst.deathTimer += dt;
      this.playAnimation(inst, 'death', dir, 6);
      if (enteringDeath) {
        this.triggerVfx(enemy.id, 'vfx_boss_death', enemy.x, enemy.y + 10);
      }
      inst.prevState = enemy.state;
      return inst;
    }

    // 2. HIT / STUNNED (Priority 5)
    const hurtTimer = enemy.hurtTimer || 0;
    const hurtReTriggered = hurtTimer > inst.prevHurtTimer + 0.05;
    inst.prevHurtTimer = hurtTimer;

    if ((enemy.stunTimer || 0) > 0 || (hurtTimer > 0.04 && enemy.state !== 'attack_windup' && enemy.state !== 'attacking')) {
      this.playAnimation(inst, 'hit', dir, 5, hurtReTriggered);
      inst.prevState = enemy.state;
      return inst;
    }

    // 3. SKILL & ATTACK PATTERNS (Priority 4 for Skill, 3 for Attacks)
    const enteredAttackWindup =
      enemy.state === 'attack_windup' &&
      (inst.prevState !== 'attack_windup' || inst.prevWindupPattern !== enemy.bossAttackPattern);

    if (enemy.state === 'attack_windup' || enemy.state === 'attacking') {
      const targetAnim = this.resolveAttackAnimKey(enemy.bossAttackPattern);
      const priority = targetAnim === 'skill' ? 4 : 3;
      this.playAnimation(inst, targetAnim, dir, priority, enteredAttackWindup);

      // Automatically trigger gather qi VFX at start of Skill windup
      if (enteredAttackWindup && targetAnim === 'skill') {
        this.triggerVfx(enemy.id, 'vfx_yeu_khi_tu_luc', enemy.x, enemy.y + 6);
      }
      // Trigger shockwave trail during active multi-frame Charge
      if (enemy.state === 'attacking' && targetAnim === 'attack_3' && inst.prevState !== 'attacking') {
        this.triggerVfx(enemy.id, 'vfx_dia_chan', enemy.x, enemy.y + 12, true);
      }

      inst.prevState = enemy.state;
      inst.prevWindupPattern = enemy.bossAttackPattern;
      return inst;
    }

    inst.prevState = enemy.state;
    inst.prevWindupPattern = enemy.bossAttackPattern;

    // Allow active non-looping attack/skill/hit animations to finish smoothly
    if (inst.isLocked && !inst.controller.isDone()) {
      return inst;
    }

    // 4. LOCOMOTION: RUN (Chase or Phase 2 Enraged speed) vs WALK vs IDLE
    if (isMovingNow || inst.moveGraceTimer > 0) {
      const shouldRun = enemy.state === 'chase' || enemy.state === 'return' || inst.isEnraged;
      this.playAnimation(inst, shouldRun ? 'run' : 'walk', dir, shouldRun ? 2 : 1);
    } else {
      this.playAnimation(inst, 'idle', dir, 0);
    }

    return inst;
  }

  public beginFrame(): void {
    this.frameStamp++;
    if (this.frameStamp % 240 === 0) {
      this.pruneStaleInstances();
    }
  }

  private drawVfxSlot(
    ctx: CanvasRenderingContext2D,
    slot: BossVfxSlot,
    alphaMult: number = 1
  ): void {
    if (!slot.active || !slot.key) return;
    const spec = BOSS_VFX_SPECS[slot.key];
    const image = pixelAssetLoader.getImage(getBossVfxUrl(slot.key));
    if (!image || !image.complete || image.naturalWidth <= 0) return;

    const sx = slot.controller.getCurrentFrame() * spec.frameWidth;
    const dx = Math.round(slot.x - spec.frameWidth * spec.pivotX);
    const dy = Math.round(slot.y - spec.frameHeight * spec.pivotY);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (alphaMult < 1) ctx.globalAlpha = alphaMult;
    ctx.drawImage(
      image,
      sx,
      0,
      spec.frameWidth,
      spec.frameHeight,
      dx,
      dy,
      spec.frameWidth,
      spec.frameHeight
    );
    ctx.restore();
  }

  /**
   * Render Bạch Mao Viên Hầu Boss + Ground Shadow + 6 Pixel Art VFX + Overlays.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    dt: number,
    time: number,
    playerX: number,
    playerY: number
  ): boolean {
    if (!BossSpriteRenderer.supportsEnemy(enemy)) return false;

    const inst = this.syncWithBossAI(enemy, dt, playerX, playerY);
    if (!inst) return false;

    if (enemy.hp <= 0 && inst.deathTimer >= DEATH_HOLD_VISIBLE_SECONDS) {
      return true;
    }

    // Advance controllers
    inst.controller.update(dt);
    if (inst.primaryVfx.active) inst.primaryVfx.controller.update(dt);
    if (inst.secondaryVfx.active) inst.secondaryVfx.controller.update(dt);
    if (inst.isEnraged && enemy.hp > 0) inst.enrageAuraController.update(dt);

    const animKey = inst.controller.getAnimName() as BossAnimKey;
    const currentFrame = inst.controller.getCurrentFrame();
    const row = inst.controller.getRow();
    const sheetUrl = getBossSheetUrl(animKey);
    const image = pixelAssetLoader.getImage(sheetUrl);

    const isAlive = enemy.hp > 0;
    const isHurt = isAlive && (enemy.hurtTimer || 0) > 0;
    const footX = Math.round(enemy.x);
    const footY = Math.round(enemy.y + 14);
    const fadeAlpha =
      !isAlive && inst.deathTimer > 0.95
        ? Math.max(0, 1 - (inst.deathTimer - 0.95) / (DEATH_HOLD_VISIBLE_SECONDS - 0.95))
        : 1;

    // 1. Boss Telegraph Ground Warning (dodgeable!)
    if (isAlive && enemy.state === 'attack_windup') {
      renderBossTelegraph(ctx, enemy, time);
    }

    // 2. Boss Punish / Stunned Window Indicator
    if (isAlive && ((enemy.bossPunishTimer || 0) > 0 || (enemy.stunTimer || 0) > 0)) {
      renderBossPunishIndicator(ctx, enemy, time);
    }

    // 3. Alert Icon
    if (isAlive && enemy.state === 'detect') {
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', footX, enemy.y - 68);
      ctx.restore();
    }

    // 4. Ground Contact Shadow (anchored firmly beneath giant ape feet)
    ctx.save();
    ctx.globalAlpha = 0.52 * fadeAlpha;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(footX, footY, 34, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Phase 2 Enraged Looping Beast Aura (vfx_cuong_no) beneath Boss
    if (isAlive && inst.isEnraged) {
      const auraImg = pixelAssetLoader.getImage(getBossVfxUrl('vfx_cuong_no'));
      if (auraImg && auraImg.complete && auraImg.naturalWidth > 0) {
        const spec = BOSS_VFX_SPECS.vfx_cuong_no;
        const sx = inst.enrageAuraController.getCurrentFrame() * spec.frameWidth;
        const dx = Math.round(footX - spec.frameWidth * spec.pivotX);
        const dy = Math.round(footY - spec.frameHeight * spec.pivotY);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = 0.85;
        ctx.drawImage(auraImg, sx, 0, spec.frameWidth, spec.frameHeight, dx, dy, spec.frameWidth, spec.frameHeight);
        ctx.restore();
      }
    }

    // 6. Ground-layer secondary VFX (vfx_dia_chan beneath Boss impact)
    this.drawVfxSlot(ctx, inst.secondaryVfx, fadeAlpha);

    // 7. Nearest-Neighbor Boss Sprite Frame (128x128 @ pivot 0.5, 0.90)
    if (image && image.complete && image.naturalWidth > 0) {
      const sx = currentFrame * this.frameWidth;
      const sy = row * this.frameHeight;
      const dx = Math.round(footX - this.frameWidth * this.pivotX);
      const dy = Math.round(footY - this.frameHeight * this.pivotY);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = fadeAlpha * (isHurt && Math.floor(time / 45) % 2 === 0 ? 0.72 : 1);
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

    // 8. Foreground Burst VFX (vfx_chuong_kich, vfx_yeu_khi_tu_luc, vfx_bach_vien_chan_dia, vfx_boss_death)
    this.drawVfxSlot(ctx, inst.primaryVfx, 1);

    return true;
  }
}

function renderBossTelegraph(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number): void {
  const maxWindup =
    enemy.bossAttackPattern === 'slam' || enemy.bossAttackPattern === 'skill'
      ? 0.95
      : enemy.bossAttackPattern === 'charge'
      ? 0.72
      : enemy.bossAttackPattern === 'combo'
      ? 0.55
      : 0.62;
  const elapsed = Math.max(0, maxWindup - (enemy.windupTimer || 0));
  const progress = Math.min(1, Math.max(0, elapsed / maxWindup));
  const radius = enemy.telegraphRadius || (enemy.bossAttackPattern === 'slam' ? 155 : enemy.attackRange + 35);

  ctx.save();
  const pulseAlpha = 0.2 + Math.sin(time / 65) * 0.08;
  const isCharge = enemy.bossAttackPattern === 'charge';

  if (isCharge && enemy.chargeTarget) {
    // Line corridor telegraph for Charge Attack 3
    const angle = Math.atan2(enemy.chargeTarget.y - enemy.y, enemy.chargeTarget.x - enemy.x);
    const len = 175;
    ctx.translate(enemy.x, enemy.y + 8);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
    ctx.fillRect(0, -28, len, 56);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(0, -28, len, 56);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(252, 165, 165, 0.35)';
    ctx.fillRect(0, -28, len * progress, 56);
  } else {
    ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 14, radius, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = enemy.bossPhase === 2 ? '#f43f5e' : '#ef4444';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([9, 5]);
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 14, radius, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const curR = radius * (1 - progress);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 14, Math.max(4, curR), Math.max(2, curR * 0.5), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#fca5a5';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  let text = '⚠️ THIẾT CHƯỞNG!';
  if (enemy.bossAttackPattern === 'slam' || enemy.bossAttackPattern === 'skill') {
    text = '⚠️ BẠCH VIÊN CHẤN ĐỊA (NÉ RA NGOÀI)!';
  } else if (enemy.bossAttackPattern === 'combo') {
    text = '⚠️ CUỒNG NỘ LIÊN KÍCH!';
  } else if (enemy.bossAttackPattern === 'charge') {
    text = '⚠️ CUỒNG BẠO XUNG KÍCH!';
  }
  ctx.fillText(text, enemy.x, enemy.y - 78);
  ctx.restore();
}

function renderBossPunishIndicator(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number): void {
  ctx.save();
  const dizzyAngle = time / 110;
  for (let i = 0; i < 3; i++) {
    const a = dizzyAngle + (i * Math.PI * 2) / 3;
    const sx = enemy.x + Math.cos(a) * 30;
    const sy = enemy.y - 68 + Math.sin(a) * 8;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#67e8f9';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  const label = (enemy.stunTimer || 0) > 0 ? '⚡ BỊ CHOÁNG!' : '⚡ SƠ HỞ! (+35% SÁT THƯƠNG)';
  ctx.fillText(label, enemy.x, enemy.y - 82);
  ctx.restore();
}

export const bossSpriteRenderer = BossSpriteRenderer.getInstance();
