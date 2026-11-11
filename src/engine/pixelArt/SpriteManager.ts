/**
 * SPRITE MANAGER (PHÀM TRẦN TIÊN LỘ)
 * Manages Sprite Sheets, frame slicing, pivot normalization, and blitting.
 * Guarantees zero-blur integer rasterization and tracks draw call counts.
 */

import { pixelAssetLoader } from './PixelAssetLoader';

export interface SpriteFrameConfig {
  src: string;
  frameWidth: number;
  frameHeight: number;
  logicalWidth?: number;
  logicalHeight?: number;
  pivot: { x: number; y: number };
}

export class SpriteManager {
  private static instance: SpriteManager;
  private drawCallCount = 0;

  private constructor() {}

  public static getInstance(): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager();
    }
    return SpriteManager.instance;
  }

  public resetDrawCallCount(): void {
    this.drawCallCount = 0;
  }

  public getDrawCallCount(): number {
    return this.drawCallCount;
  }

  /**
   * Draw an animated frame from a sprite sheet with pivot alignment and optional flipX
   */
  public drawSpriteFrame(
    ctx: CanvasRenderingContext2D,
    src: string,
    worldX: number,
    worldY: number,
    frameIndex: number,
    rowIndex: number,
    frameWidth: number,
    frameHeight: number,
    pivot: { x: number; y: number } = { x: 0.5, y: 0.875 },
    flipX: boolean = false,
    scale: number = 1
  ): boolean {
    const image = pixelAssetLoader.getImage(src);
    if (!image || !image.complete) {
      return false;
    }

    const sx = frameIndex * frameWidth;
    const sy = rowIndex * frameHeight;
    const sw = frameWidth;
    const sh = frameHeight;

    const dw = frameWidth * scale;
    const dh = frameHeight * scale;

    // Integer rounded drawing coordinates to prevent subpixel blur
    const anchorX = Math.round(worldX - dw * pivot.x);
    const anchorY = Math.round(worldY - dh * pivot.y);

    ctx.save();

    if (flipX) {
      // Flip around the worldX pivot
      ctx.translate(Math.round(worldX), Math.round(worldY));
      ctx.scale(-1, 1);
      ctx.drawImage(
        image,
        sx,
        sy,
        sw,
        sh,
        Math.round(-dw * (1 - pivot.x)),
        Math.round(-dh * pivot.y),
        dw,
        dh
      );
    } else {
      ctx.drawImage(image, sx, sy, sw, sh, anchorX, anchorY, dw, dh);
    }

    ctx.restore();
    this.drawCallCount++;
    return true;
  }

  /**
   * Draw a static single sprite prop (like a tree, building, or bridge)
   */
  public drawProp(
    ctx: CanvasRenderingContext2D,
    src: string,
    worldX: number,
    worldY: number,
    pivot: { x: number; y: number } = { x: 0.5, y: 0.9 },
    scale: number = 1
  ): boolean {
    const image = pixelAssetLoader.getImage(src);
    if (!image || !image.complete) {
      return false;
    }

    const dw = image.width * scale;
    const dh = image.height * scale;

    const dx = Math.round(worldX - dw * pivot.x);
    const dy = Math.round(worldY - dh * pivot.y);

    ctx.drawImage(image, dx, dy, dw, dh);
    this.drawCallCount++;
    return true;
  }

  /**
   * Draw a 32x32 tile from a tileset
   */
  public drawTile(
    ctx: CanvasRenderingContext2D,
    tilesetSrc: string,
    tileX: number,
    tileY: number,
    destX: number,
    destY: number,
    tileSize: number = 32
  ): boolean {
    const image = pixelAssetLoader.getImage(tilesetSrc);
    if (!image || !image.complete) {
      return false;
    }

    ctx.drawImage(
      image,
      tileX,
      tileY,
      tileSize,
      tileSize,
      Math.round(destX),
      Math.round(destY),
      tileSize,
      tileSize
    );
    this.drawCallCount++;
    return true;
  }
}

export const spriteManager = SpriteManager.getInstance();
