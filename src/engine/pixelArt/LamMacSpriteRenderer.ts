/**
 * LAM MAC SPRITE RENDERER (PHÀM TRẦN TIÊN LỘ - PHASE 2.0)
 * High-performance HD Pixel Art Sprite Renderer for Main Character Lâm Mặc.
 * 
 * Technical Standard:
 * - 10 Character Animations across 4 Directions (Down: Row 0, Left: Row 1, Right: Row 2, Up: Row 3).
 * - Standard Frame Size: 64x64 px.
 * - Normalized Feet Pivot: (0.5, 0.875) -> Pixel (32, 56).
 * - Nearest-Neighbor (imageSmoothingEnabled = false).
 * - 5 Separated Combat VFX on dedicated layer with additive blending.
 * - Zero GC churn: Pre-cached assets, reused controllers, no per-frame heap allocation.
 */

import { AnimationController, AnimationSpec } from './AnimationController';
import { pixelAssetLoader } from './PixelAssetLoader';
import { PlayerStats } from '../../types/game';

export interface VfxConfig {
  sourcePng: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  activeFrames: number[];
  blendMode?: GlobalCompositeOperation;
}

export interface LamMacAnimMeta {
  sourcePng: string;
  frameCount: number;
  fps: number;
  loop: boolean;
  hitFrame?: number;
  holdLastFrame?: boolean;
  vfx?: VfxConfig;
}

// Direction row index standard (ART_BIBLE.md & lam_mac_metadata.json)
export const DIRECTION_ROWS: Record<'down' | 'left' | 'right' | 'up', number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

// Embedded metadata specifications for instant deterministic access without network latency
export const LAM_MAC_ANIM_SPECS: Record<string, LamMacAnimMeta> = {
  idle: {
    sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_idle.png',
    frameCount: 6,
    fps: 6,
    loop: true,
  },
  walk: {
    sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_walk.png',
    frameCount: 8,
    fps: 10,
    loop: true,
  },
  run: {
    sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_run.png',
    frameCount: 8,
    fps: 12,
    loop: true,
  },
  attack_1: {
    sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_attack_1.png',
    frameCount: 5,
    fps: 12,
    loop: false,
    hitFrame: 2,
    vfx: {
      sourcePng: '/assets/pixel-art/vfx/vfx_sword_slash_wind.png',
      frameWidth: 64,
      frameHeight: 64,
      frameCount: 5,
      activeFrames: [2, 3],
      blendMode: 'lighter',
    },
  },
  attack_2: {
    sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_attack_2.png',
    frameCount: 5,
    fps: 12,
    loop: false,
    hitFrame: 2,
    vfx: {
      sourcePng: '/assets/pixel-art/vfx/vfx_sword_thrust_golden.png',
      frameWidth: 64,
      frameHeight: 64,
      frameCount: 5,
      activeFrames: [2, 3],
      blendMode: 'lighter',
    },
  },
  attack_3: {
    sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_attack_3.png',
    frameCount: 6,
    fps: 12,
    loop: false,
    hitFrame: 3,
    vfx: {
      sourcePng: '/assets/pixel-art/vfx/vfx_ground_slam_shockwave.png',
      frameWidth: 64,
      frameHeight: 64,
      frameCount: 6,
      activeFrames: [3, 4, 5],
      blendMode: 'lighter',
    },
  },
  dodge: {
    sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_dodge.png',
    frameCount: 4,
    fps: 14,
    loop: false,
    vfx: {
      sourcePng: '/assets/pixel-art/vfx/vfx_dodge_phantom_trail.png',
      frameWidth: 64,
      frameHeight: 64,
      frameCount: 4,
      activeFrames: [0, 1, 2, 3],
      blendMode: 'source-over',
    },
  },
  skill: {
    sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_skill.png',
    frameCount: 8,
    fps: 10,
    loop: false,
    hitFrame: 4,
    vfx: {
      sourcePng: '/assets/pixel-art/vfx/vfx_celestial_sword_aura.png',
      frameWidth: 64,
      frameHeight: 64,
      frameCount: 8,
      activeFrames: [1, 2, 3, 4, 5, 6],
      blendMode: 'lighter',
    },
  },
  hit: {
    sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_hit.png',
    frameCount: 3,
    fps: 8,
    loop: false,
  },
  death: {
    sourcePng: '/assets/pixel-art/characters/lam_mac/lam_mac_death.png',
    frameCount: 8,
    fps: 8,
    loop: false,
    holdLastFrame: true,
  },
};

export class LamMacSpriteRenderer {
  private static instance: LamMacSpriteRenderer;

  // Animation controller
  private animController: AnimationController;
  private currentAnimKey: string = 'idle';
  private currentDirection: 'down' | 'left' | 'right' | 'up' = 'down';

  // State locking for non-looping animations (attack, dodge, skill, hit, death)
  private isLocked: boolean = false;
  private lockPriority: number = 0; // 1: walk/run, 2: attack/skill, 3: dodge, 4: hit, 5: death

  // VFX settings & toggles
  private vfxEnabled: Record<string, boolean> = {
    vfx_sword_slash_wind: true,
    vfx_sword_thrust_golden: true,
    vfx_ground_slam_shockwave: true,
    vfx_dodge_phantom_trail: true,
    vfx_celestial_sword_aura: true,
  };

  // Asset loading state
  private isPreloaded: boolean = false;
  private preloadPromise: Promise<void> | null = null;

  // Constant dimensions & pivot
  public readonly frameWidth = 64;
  public readonly frameHeight = 64;
  public readonly pivotX = 0.5;
  public readonly pivotY = 0.875; // Y = 56px anchor

  private constructor() {
    const idleSpec = LAM_MAC_ANIM_SPECS.idle;
    this.animController = new AnimationController('idle', {
      fps: idleSpec.fps,
      loop: idleSpec.loop,
      frameCount: idleSpec.frameCount,
      row: 0,
    });
  }

  public static getInstance(): LamMacSpriteRenderer {
    if (!LamMacSpriteRenderer.instance) {
      LamMacSpriteRenderer.instance = new LamMacSpriteRenderer();
    }
    return LamMacSpriteRenderer.instance;
  }

  /**
   * Preload all 10 character sheets and 5 VFX sheets into memory cache
   */
  public preloadAll(): Promise<void> {
    if (this.preloadPromise) return this.preloadPromise;

    const urls: string[] = [];

    // Character sheets
    for (const key of Object.keys(LAM_MAC_ANIM_SPECS)) {
      urls.push(LAM_MAC_ANIM_SPECS[key].sourcePng);
      const vfx = LAM_MAC_ANIM_SPECS[key].vfx;
      if (vfx && !urls.includes(vfx.sourcePng)) {
        urls.push(vfx.sourcePng);
      }
    }

    this.preloadPromise = (async () => {
      try {
        await pixelAssetLoader.loadAssetPack(urls);
        this.isPreloaded = true;
      } catch (err) {
        console.warn('[LamMacSpriteRenderer] Warning during asset preloading:', err);
        this.isPreloaded = true;
      }
    })();

    return this.preloadPromise;
  }

  /**
   * Reset state machine (used during respawn or scene transitions)
   */
  public reset(animKey: string = 'idle', direction: 'down' | 'left' | 'right' | 'up' = 'down'): void {
    this.currentAnimKey = animKey;
    this.currentDirection = direction;
    this.isLocked = false;
    this.lockPriority = 0;
    const spec = LAM_MAC_ANIM_SPECS[animKey] || LAM_MAC_ANIM_SPECS.idle;
    this.animController = new AnimationController(animKey, {
      fps: spec.fps,
      loop: spec.loop,
      frameCount: spec.frameCount,
      row: DIRECTION_ROWS[direction] ?? 0,
      holdLastFrame: spec.holdLastFrame,
      hitFrame: spec.hitFrame,
    });
  }

  /**
   * Toggle individual VFX on/off
   */
  public setVfxEnabled(vfxKey: string, enabled: boolean): void {
    this.vfxEnabled[vfxKey] = enabled;
  }

  public isVfxEnabled(vfxKey: string): boolean {
    return this.vfxEnabled[vfxKey] ?? true;
  }

  /**
   * Switch animation with strict priority hierarchy
   */
  public playAnimation(
    animKey: string,
    direction: 'down' | 'left' | 'right' | 'up',
    priority: number = 1,
    forceRestart: boolean = false
  ): boolean {
    const spec = LAM_MAC_ANIM_SPECS[animKey];
    if (!spec) return false;

    // Death is irrevocable
    if (this.currentAnimKey === 'death' && animKey !== 'death') {
      return false;
    }

    // Check if current non-looping animation is still active and has higher priority
    if (this.isLocked && !this.animController.isDone() && priority < this.lockPriority && !forceRestart) {
      return false; // Cannot override active higher-priority action
    }

    const row = DIRECTION_ROWS[direction] ?? 0;
    const isNewAnim = this.currentAnimKey !== animKey;
    const isNewDir = this.currentDirection !== direction;

    if (!isNewAnim && !isNewDir && !forceRestart && !this.animController.isDone()) {
      return true; // Keep playing
    }

    this.currentAnimKey = animKey;
    this.currentDirection = direction;
    this.lockPriority = priority;
    this.isLocked = !spec.loop;

    const animSpec: AnimationSpec = {
      fps: spec.fps,
      loop: spec.loop,
      frameCount: spec.frameCount,
      row,
      holdLastFrame: spec.holdLastFrame,
      hitFrame: spec.hitFrame,
    };

    this.animController.play(
      animKey,
      animSpec,
      () => {
        // Animation complete callback
        if (!spec.loop && animKey !== 'death') {
          this.isLocked = false;
          this.lockPriority = 0;
        }
      },
      undefined,
      isNewAnim || forceRestart
    );

    return true;
  }

  /**
   * Determine direction from aim angle (radians)
   */
  public static getDirectionFromAngle(angle: number): 'down' | 'left' | 'right' | 'up' {
    // Normalize angle to [-PI, PI]
    let a = angle;
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;

    if (a >= -Math.PI * 0.25 && a <= Math.PI * 0.25) {
      return 'right';
    } else if (a > Math.PI * 0.25 && a < Math.PI * 0.75) {
      return 'down';
    } else if (a < -Math.PI * 0.25 && a > -Math.PI * 0.75) {
      return 'up';
    } else {
      return 'left';
    }
  }

  /**
   * Synchronize animation state from gameplay parameters
   */
  public syncWithGameplay(
    p: PlayerStats,
    isMoving: boolean,
    walkTimer: number,
    attackAnim?: { active: boolean; step?: 1 | 2 | 3; angle?: number; progress?: number },
    castingAnim?: { active: boolean; type?: string; progress?: number }
  ): void {
    // 1. DEATH (Priority 5)
    if (p.hp <= 0 || p.isDead) {
      this.playAnimation('death', p.facing || 'down', 5);
      return;
    }

    // 2. HIT REACTION (Priority 4)
    if ((p.hurtFlashTimer || 0) > 0.05 && this.currentAnimKey !== 'death') {
      this.playAnimation('hit', p.facing || 'down', 4);
      return;
    }

    // 3. DODGE (Priority 3)
    if (p.isDodging) {
      this.playAnimation('dodge', p.facing || 'down', 3);
      return;
    }

    // 4. ATTACK COMBO (Priority 2)
    if (attackAnim && attackAnim.active) {
      const step = attackAnim.step || 1;
      const attackKey = step === 1 ? 'attack_1' : step === 2 ? 'attack_2' : 'attack_3';
      const attackDir = attackAnim.angle !== undefined
        ? LamMacSpriteRenderer.getDirectionFromAngle(attackAnim.angle)
        : (p.facing || 'down');

      this.playAnimation(attackKey, attackDir, 2);
      return;
    }

    // 5. SKILL CASTING (Priority 2)
    if (castingAnim && castingAnim.active) {
      this.playAnimation('skill', p.facing || 'down', 2);
      return;
    }

    // If currently playing a locked non-looping animation that hasn't finished, let it finish!
    if (this.isLocked && !this.animController.isDone()) {
      return;
    }

    // 6. MOVEMENT (Walk vs Run) (Priority 1)
    const hasMovement = isMoving || walkTimer > 0;
    if (hasMovement) {
      // If speed exceeds standard walking threshold (speed > 160), use Run animation
      const isRunning = p.speed > 160;
      const animKey = isRunning ? 'run' : 'walk';
      this.playAnimation(animKey, p.facing || 'down', 1);
      return;
    }

    // 7. IDLE (Priority 1)
    this.playAnimation('idle', p.facing || 'down', 1);
  }

  /**
   * Main render function called from GameCanvas renderPlayer.
   * Renders the pixel-perfect sprite with ground shadow and associated VFX.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    p: PlayerStats,
    dt: number,
    time: number,
    walkTimer: number,
    isWalking: boolean,
    attackAnim?: { active: boolean; step?: 1 | 2 | 3; angle?: number; progress?: number },
    castingAnim?: { active: boolean; type?: string; progress?: number }
  ): void {
    // 1. Update state machine
    this.syncWithGameplay(p, isWalking, walkTimer, attackAnim, castingAnim);

    // 2. Advance animation controller
    this.animController.update(dt);

    const animKey = this.animController.getAnimName();
    const spec = LAM_MAC_ANIM_SPECS[animKey] || LAM_MAC_ANIM_SPECS.idle;
    const currentFrame = this.animController.getCurrentFrame();
    const row = this.animController.getRow();

    // 3. Ground contact shadow (soft elliptical pixel shadow under feet)
    const footX = Math.round(p.x);
    const footY = Math.round(p.y + 14);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(footX, footY, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Invulnerability & Hurt flashing visual effects
    const isInvuln = (p.invulnerableTimer || 0) > 0;
    const isHurt = (p.hurtFlashTimer || 0) > 0;

    ctx.save();

    // Nearest-neighbor sampling enforcement
    ctx.imageSmoothingEnabled = false;

    if (isInvuln && Math.floor(time / 70) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    } else if (isHurt) {
      ctx.filter = 'brightness(1.5) drop-shadow(0 0 4px #ef4444)';
    }

    // 5. Render Character Sprite Sheet Frame
    const image = pixelAssetLoader.getImage(spec.sourcePng);
    let renderedSuccessfully = false;

    if (image && image.complete && image.naturalWidth > 0) {
      const sx = currentFrame * this.frameWidth;
      const sy = row * this.frameHeight;
      const sw = this.frameWidth;
      const sh = this.frameHeight;

      // Integer anchor coordinates derived from feet pivot (0.5, 0.875)
      const dx = Math.round(footX - this.frameWidth * this.pivotX);
      const dy = Math.round(footY - this.frameHeight * this.pivotY);

      ctx.drawImage(image, sx, sy, sw, sh, dx, dy, this.frameWidth, this.frameHeight);
      renderedSuccessfully = true;
    }

    ctx.restore();

    // 6. Render Separated VFX on Layer Above Character
    if (spec.vfx) {
      this.renderVfx(ctx, spec.vfx, currentFrame, row, footX, footY);
    }
  }

  /**
   * Render separated skill VFX
   */
  private renderVfx(
    ctx: CanvasRenderingContext2D,
    vfx: VfxConfig,
    currentFrame: number,
    row: number,
    footX: number,
    footY: number
  ): void {
    // Extract base filename for toggle check
    const filename = vfx.sourcePng.split('/').pop()?.replace('.png', '') || '';
    if (!this.isVfxEnabled(filename)) return;

    // Check if current animation frame is an active VFX frame
    if (!vfx.activeFrames.includes(currentFrame)) return;

    const vfxImg = pixelAssetLoader.getImage(vfx.sourcePng);
    if (!vfxImg || !vfxImg.complete || vfxImg.naturalWidth <= 0) return;

    const sx = currentFrame * vfx.frameWidth;
    const sy = row * vfx.frameHeight;
    const sw = vfx.frameWidth;
    const sh = vfx.frameHeight;

    const dx = Math.round(footX - vfx.frameWidth * this.pivotX);
    const dy = Math.round(footY - vfx.frameHeight * this.pivotY);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (vfx.blendMode) {
      ctx.globalCompositeOperation = vfx.blendMode;
    }

    ctx.drawImage(vfxImg, sx, sy, sw, sh, dx, dy, vfx.frameWidth, vfx.frameHeight);
    ctx.restore();
  }

  /**
   * Get current animation key for telemetry/testing
   */
  public getCurrentAnimKey(): string {
    return this.currentAnimKey;
  }

  /**
   * Get current direction
   */
  public getCurrentDirection(): 'down' | 'left' | 'right' | 'up' {
    return this.currentDirection;
  }

  /**
   * Check if renderer is locked in a non-looping animation
   */
  public isAnimationLocked(): boolean {
    return this.isLocked;
  }
}

export const lamMacSpriteRenderer = LamMacSpriteRenderer.getInstance();
