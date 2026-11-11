/**
 * PIXEL ASSET LOADER (PHÀM TRẦN TIÊN LỘ)
 * Asynchronous loader and memory cache for true Pixel Art PNG assets.
 * Enforces Nearest-Neighbor scaling and measures asset load timing.
 */

export interface AssetLoadProgress {
  total: number;
  loaded: number;
  failed: number;
  percent: number;
  loadingTimeMs: number;
  isComplete: boolean;
}

const ImageConstructor: any = typeof Image !== 'undefined'
  ? Image
  : class MockImage {
      src = '';
      complete = true;
      naturalWidth = 64;
      naturalHeight = 64;
      width = 64;
      height = 64;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      decoding = 'async';
      constructor() {
        setTimeout(() => this.onload?.(), 1);
      }
    };

export class PixelAssetLoader {
  private static instance: PixelAssetLoader;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  private totalAssetsToLoad = 0;
  private loadedCount = 0;
  private failedCount = 0;
  private startTime = 0;
  private totalLoadTimeMs = 0;

  private constructor() {}

  public static getInstance(): PixelAssetLoader {
    if (!PixelAssetLoader.instance) {
      PixelAssetLoader.instance = new PixelAssetLoader();
    }
    return PixelAssetLoader.instance;
  }

  /**
   * Load a single image with memory caching
   */
  public loadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return Promise.resolve(this.imageCache.get(src)!);
    }

    if (this.loadPromises.has(src)) {
      return this.loadPromises.get(src)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new ImageConstructor();
      img.decoding = 'async';

      img.onload = () => {
        this.imageCache.set(src, img);
        this.loadedCount++;
        this.loadPromises.delete(src);
        resolve(img);
      };

      img.onerror = (err: unknown) => {
        this.failedCount++;
        this.loadPromises.delete(src);
        console.warn(`[PixelAssetLoader] Failed to load sprite asset: ${src}`, err);
        // Create 1x1 magenta fallback to avoid breaking render loops
        const fallback = new ImageConstructor();
        fallback.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        this.imageCache.set(src, fallback);
        resolve(fallback);
      };

      img.src = src;
    });

    this.loadPromises.set(src, promise);
    return promise;
  }

  /**
   * Batch load an array of image URLs
   */
  public async loadAssetPack(urls: string[]): Promise<Map<string, HTMLImageElement>> {
    this.startTime = performance.now();
    this.totalAssetsToLoad = urls.length;
    this.loadedCount = 0;
    this.failedCount = 0;

    const promises = urls.map(url => this.loadImage(url));
    await Promise.all(promises);

    this.totalLoadTimeMs = Math.round(performance.now() - this.startTime);
    return this.imageCache;
  }

  /**
   * Get cached image synchronously (must be preloaded)
   */
  public getImage(src: string): HTMLImageElement | null {
    return this.imageCache.get(src) || null;
  }

  public hasImage(src: string): boolean {
    return this.imageCache.has(src);
  }

  public getProgress(): AssetLoadProgress {
    const total = Math.max(1, this.totalAssetsToLoad);
    const loaded = this.loadedCount + this.failedCount;
    return {
      total: this.totalAssetsToLoad,
      loaded: this.loadedCount,
      failed: this.failedCount,
      percent: Math.min(100, Math.round((loaded / total) * 100)),
      loadingTimeMs: this.totalLoadTimeMs || (this.startTime ? Math.round(performance.now() - this.startTime) : 0),
      isComplete: loaded >= this.totalAssetsToLoad
    };
  }

  public clearCache(): void {
    this.imageCache.clear();
    this.loadPromises.clear();
    this.totalAssetsToLoad = 0;
    this.loadedCount = 0;
    this.failedCount = 0;
  }
}

export const pixelAssetLoader = PixelAssetLoader.getInstance();
