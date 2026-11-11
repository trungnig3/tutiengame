/**
 * ANIMATION CONTROLLER (PHÀM TRẦN TIÊN LỘ)
 * Controls deterministic frame-based sprite animation.
 * Adheres to animation specifications defined in ART_BIBLE.md.
 */

export interface AnimationSpec {
  fps: number;
  loop: boolean;
  frameCount: number;
  row?: number;
  frames?: number[];
  holdLastFrame?: boolean;
  hitFrame?: number;
  castFrame?: number;
}

export class AnimationController {
  private currentAnimName: string = '';
  private currentSpec: AnimationSpec = { fps: 6, loop: true, frameCount: 4, row: 0 };
  private elapsedTime: number = 0;
  private currentFrameIndex: number = 0;
  private isFinished: boolean = false;
  private hitTriggered: boolean = false;
  private onCompleteCallback?: () => void;
  private onHitCallback?: () => void;

  constructor(
    initialAnimName: string = 'idle',
    initialSpec?: AnimationSpec,
    onComplete?: () => void,
    onHit?: () => void
  ) {
    if (initialSpec) {
      this.play(initialAnimName, initialSpec, onComplete, onHit, true);
    } else {
      this.currentAnimName = initialAnimName;
    }
  }

  /**
   * Switch to a new animation state
   */
  public play(
    animName: string,
    spec: AnimationSpec,
    onComplete?: () => void,
    onHit?: () => void,
    forceRestart: boolean = false
  ): void {
    if (this.currentAnimName === animName && !this.isFinished && !forceRestart && !onComplete && !onHit) {
      return; // Already playing this animation
    }

    this.currentAnimName = animName;
    this.currentSpec = spec;
    this.elapsedTime = 0;
    this.currentFrameIndex = 0;
    this.isFinished = false;
    this.hitTriggered = false;
    this.onCompleteCallback = onComplete;
    this.onHitCallback = onHit;
  }

  /**
   * Advance animation time by delta time (seconds)
   */
  public update(dt: number): void {
    if (this.isFinished && this.currentSpec.holdLastFrame) {
      return;
    }

    const prevElapsed = this.elapsedTime;
    this.elapsedTime += dt;
    const frameDuration = 1 / Math.max(1, this.currentSpec.fps);
    const totalFrames = this.currentSpec.frameCount;

    const frameStep = Math.floor(this.elapsedTime / frameDuration);

    if (this.currentSpec.loop) {
      this.currentFrameIndex = frameStep % totalFrames;
    } else {
      if (frameStep >= totalFrames) {
        this.currentFrameIndex = totalFrames - 1;
        if (!this.isFinished) {
          this.isFinished = true;
          this.onCompleteCallback?.();
        }
      } else {
        this.currentFrameIndex = frameStep;
      }
    }

    // Check hit frame callback (triggers if reached or crossed)
    if (
      this.currentSpec.hitFrame !== undefined &&
      !this.hitTriggered &&
      (frameStep >= this.currentSpec.hitFrame || this.currentFrameIndex === this.currentSpec.hitFrame)
    ) {
      this.hitTriggered = true;
      this.onHitCallback?.();
    }
  }

  public getCurrentFrame(): number {
    if (this.currentSpec.frames && this.currentSpec.frames.length > 0) {
      const idx = Math.min(this.currentFrameIndex, this.currentSpec.frames.length - 1);
      return this.currentSpec.frames[idx];
    }
    return this.currentFrameIndex;
  }

  public getRow(): number {
    return this.currentSpec.row ?? 0;
  }

  public getAnimName(): string {
    return this.currentAnimName;
  }

  public isDone(): boolean {
    return this.isFinished;
  }
}
