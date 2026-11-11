/**
 * PIXEL ART RENDERER (PHÀM TRẦN TIÊN LỘ)
 * High-performance 2D Canvas Renderer for the Pixel Art Visual Sandbox.
 * Enforces Nearest-Neighbor scaling, camera follow, and performance telemetry.
 */

import { spriteManager } from './SpriteManager';
import { pixelDepthSorter, RenderableCommand } from './PixelDepthSorter';
import { pixelAssetLoader } from './PixelAssetLoader';

export interface PerformanceTelemetry {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  visibleSprites: number;
  vramMemoryMB: number;
  assetLoadTimeMs: number;
  isAndroid: boolean;
}

export class PixelArtRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Virtual resolution
  public readonly virtualWidth = 800;
  public readonly virtualHeight = 450;

  // Camera coordinates (centered on player)
  public cameraX = 400;
  public cameraY = 225;

  // Telemetry
  private lastFrameTimestamp = 0;
  private frameTimeHistory: number[] = [];
  private currentFPS = 60;
  private currentFrameTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to acquire 2D Canvas context for PixelArtRenderer');
    }
    this.ctx = context;
    this.setupResolution();
  }

  public setupResolution(): void {
    this.canvas.width = this.virtualWidth;
    this.canvas.height = this.virtualHeight;
    this.ctx.imageSmoothingEnabled = false;
  }

  public beginFrame(timestamp: number): void {
    if (this.lastFrameTimestamp > 0) {
      const dt = timestamp - this.lastFrameTimestamp;
      this.currentFrameTime = dt;
      this.frameTimeHistory.push(dt);
      if (this.frameTimeHistory.length > 60) {
        this.frameTimeHistory.shift();
      }
      const avgDt = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      this.currentFPS = Math.round(1000 / Math.max(1, avgDt));
    }
    this.lastFrameTimestamp = timestamp;

    spriteManager.resetDrawCallCount();
    pixelDepthSorter.clear();

    // Ensure nearest neighbor is preserved
    this.ctx.imageSmoothingEnabled = false;

    // Clear with dark mist background
    this.ctx.fillStyle = '#1c2423';
    this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
  }

  // Camera zoom factor (1.0 = normal, 2.0 = 2x nearest-neighbor, 3.0 = 3x)
  public zoom = 1.0;

  public submitEntity(command: RenderableCommand): void {
    pixelDepthSorter.submit(command);
  }

  public endFrame(): PerformanceTelemetry {
    // Save state & translate camera with zoom
    this.ctx.save();
    // Translate to center, apply nearest-neighbor zoom, then translate to camera
    this.ctx.translate(Math.round(this.virtualWidth / 2), Math.round(this.virtualHeight / 2));
    if (this.zoom !== 1.0) {
      this.ctx.scale(this.zoom, this.zoom);
    }
    this.ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

    // Flush depth sorted commands
    pixelDepthSorter.flush(this.ctx);

    this.ctx.restore();

    // Measure memory if available (Chrome / Android WebView)
    let memoryMB = 0;
    if (typeof window !== 'undefined' && (performance as any).memory) {
      memoryMB = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
    } else {
      // Estimated texture VRAM usage: ~18 PNG assets in memory (~12 MB)
      memoryMB = 12;
    }

    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    return {
      fps: this.currentFPS,
      frameTimeMs: Math.round(this.currentFrameTime * 10) / 10,
      drawCalls: spriteManager.getDrawCallCount(),
      visibleSprites: pixelDepthSorter.getVisibleSpriteCount(),
      vramMemoryMB: memoryMB,
      assetLoadTimeMs: pixelAssetLoader.getProgress().loadingTimeMs,
      isAndroid
    };
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}
