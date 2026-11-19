/**
 * PHASE 2.3 – ENVIRONMENT PIXEL ART RENDERER & TILEMAP ENGINE
 * Project: Phàm Trần Tiên Lộ (凡尘仙路)
 *
 * Features:
 *  - Deterministic Tilemap + 4-bit Autotile Transition Engine (32x32 base grid)
 *  - Tailored Biome Profiles for all 8 GAME_MAPS (Thanh Khê Thôn, Thanh Phong Sơn,
 *    Rừng Linh Vụ, Phường Thị Thanh Hà, Hắc Phong Sơn, Cổ Di Tích, Thanh Vân Tông, Bí Cảnh)
 *  - Android-optimized Offscreen Static Terrain Cache (1 blit per frame, <= 2048x2048)
 *  - Camera Viewport Frustum Culling for animated water tiles, scatter props & obstacles
 *  - 2-Pass Layer 2 (Base/Trunk/Wall) + Layer 3 (Canopy/Eaves Overhead) Y-Sorting Split
 *  - Strict Nearest-Neighbor (imageSmoothingEnabled = false) & Integer Pixel Snapping
 *  - Zero mutation of map obstacles, collision AABBs, NPCs, portals, resources, or spawners
 */

import { CollectibleResource, GameMap } from '../../types/game';
import { pixelAssetLoader } from './PixelAssetLoader';

export type MapObstacle = GameMap['obstacles'][number];

export const ENV_TILE_SIZE = 32;
export const ENV_ASSETS_BASE = '/assets/pixel-art/environment';

export const ENV_ASSET_URLS = {
  groundTiles: `${ENV_ASSETS_BASE}/tilesets/ground_tiles.png`,
  transitionTiles: `${ENV_ASSETS_BASE}/tilesets/transition_tiles.png`,
  animatedWater: `${ENV_ASSETS_BASE}/tilesets/animated_water_tiles.png`,
  floraSheet: `${ENV_ASSETS_BASE}/objects/flora_sheet.png`,
  rocksSheet: `${ENV_ASSETS_BASE}/objects/rocks_nature_sheet.png`,
  architectureSheet: `${ENV_ASSETS_BASE}/objects/architecture_props.png`,
  resourcesSheet: `${ENV_ASSETS_BASE}/objects/resources_sheet.png`,
} as const;

export const enum TileKind {
  GRASS = 0,
  DARK_GRASS = 1,
  DRY_GRASS = 2,
  DIRT = 3,
  DIRT_PATH = 4,
  STONE = 5,
  MOSSY_STONE = 6,
  SAND = 7,
  BASALT = 8,
  RUINS = 9,
  JADE_PLAZA = 10,
  FOREST_TRAIL = 11,
  WOOD_BRIDGE_H = 12,
  STONE_STEPS = 13,
  CLIFF_TOP = 14,
  CLIFF_FACE = 15,
  CLIFF_BASE = 16,
  WATER_CLEAR = 17,
  WATER_SHALLOW = 18,
  WATER_DEEP = 19,
  WATER_DARK = 20,
  WATER_BLOOD = 21,
  WATER_LOTUS = 22,
  WATERFALL = 23,
}

export interface SpriteRect {
  sheet: 'flora' | 'rocks' | 'arch' | 'resources';
  x: number;
  y: number;
  w: number;
  h: number;
  pivotX: number;
  pivotY: number;
  splitY?: number;
  frames?: number;
  fps?: number;
}

export interface ScatterProp {
  id: string;
  x: number;
  y: number;
  spriteKey: string;
  layer: 1 | 2;
  flipX?: boolean;
}

export interface MapEnvironmentLayout {
  mapId: string;
  cols: number;
  rows: number;
  tiles: Uint8Array; // length = cols * rows
  variants: Uint8Array; // deterministic tile visual variant per cell
  waterCells: Array<{ col: number; row: number; kind: TileKind }>;
  bridgeRects: Array<{ x: number; y: number; w: number; h: number }>;
  scatterProps: ScatterProp[];
}

export const ENV_SPRITE_RECTS: Record<string, SpriteRect> = {
  // Flora (flora_sheet.png)
  ancient_tree: { sheet: 'flora', x: 0, y: 0, w: 128, h: 160, pivotX: 0.5, pivotY: 0.92, splitY: 96 },
  pine_tree: { sheet: 'flora', x: 128, y: 0, w: 96, h: 128, pivotX: 0.5, pivotY: 0.92, splitY: 78 },
  spirit_tree: { sheet: 'flora', x: 224, y: 0, w: 128, h: 160, pivotX: 0.5, pivotY: 0.92, splitY: 94 },
  bamboo_cluster: { sheet: 'flora', x: 352, y: 0, w: 64, h: 128, pivotX: 0.5, pivotY: 0.92, splitY: 72 },
  dark_dead_tree: { sheet: 'flora', x: 416, y: 0, w: 96, h: 128, pivotX: 0.5, pivotY: 0.92, splitY: 76 },
  bush_green: { sheet: 'flora', x: 0, y: 160, w: 48, h: 48, pivotX: 0.5, pivotY: 0.85 },
  bush_pine: { sheet: 'flora', x: 48, y: 160, w: 48, h: 48, pivotX: 0.5, pivotY: 0.85 },
  bush_dry: { sheet: 'flora', x: 96, y: 160, w: 48, h: 48, pivotX: 0.5, pivotY: 0.85 },
  grass_tuft_0: { sheet: 'flora', x: 144, y: 160, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  grass_tuft_1: { sheet: 'flora', x: 176, y: 160, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  grass_tuft_2: { sheet: 'flora', x: 208, y: 160, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  grass_tuft_3: { sheet: 'flora', x: 240, y: 160, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  wild_flower_0: { sheet: 'flora', x: 272, y: 160, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  wild_flower_1: { sheet: 'flora', x: 304, y: 160, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  wild_flower_2: { sheet: 'flora', x: 336, y: 160, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  wild_flower_3: { sheet: 'flora', x: 368, y: 160, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  mushroom_red: { sheet: 'flora', x: 0, y: 224, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  mushroom_jade: { sheet: 'flora', x: 32, y: 224, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  mushroom_purple: { sheet: 'flora', x: 64, y: 224, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  tree_roots: { sheet: 'flora', x: 96, y: 224, w: 48, h: 32, pivotX: 0.5, pivotY: 0.8 },

  // Rocks & Nature (rocks_nature_sheet.png)
  small_rock_0: { sheet: 'rocks', x: 0, y: 0, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  small_rock_1: { sheet: 'rocks', x: 32, y: 0, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  small_rock_2: { sheet: 'rocks', x: 64, y: 0, w: 32, h: 32, pivotX: 0.5, pivotY: 0.85 },
  boulder: { sheet: 'rocks', x: 96, y: 0, w: 64, h: 48, pivotX: 0.5, pivotY: 0.85 },
  mossy_boulder: { sheet: 'rocks', x: 160, y: 0, w: 64, h: 48, pivotX: 0.5, pivotY: 0.85 },
  crystal_rock: { sheet: 'rocks', x: 224, y: 0, w: 64, h: 48, pivotX: 0.5, pivotY: 0.85 },
  beast_bones: { sheet: 'rocks', x: 288, y: 0, w: 64, h: 48, pivotX: 0.5, pivotY: 0.85 },
  crag: { sheet: 'rocks', x: 0, y: 64, w: 96, h: 80, pivotX: 0.5, pivotY: 0.88 },
  dark_crag: { sheet: 'rocks', x: 96, y: 64, w: 96, h: 80, pivotX: 0.5, pivotY: 0.88 },
  stone_pillar: { sheet: 'rocks', x: 192, y: 64, w: 48, h: 96, pivotX: 0.5, pivotY: 0.92, splitY: 48 },
  ruined_pillar: { sheet: 'rocks', x: 240, y: 64, w: 48, h: 96, pivotX: 0.5, pivotY: 0.92, splitY: 50 },

  // Architecture & Props (architecture_props.png)
  village_house: { sheet: 'arch', x: 0, y: 0, w: 144, h: 128, pivotX: 0.5, pivotY: 0.92, splitY: 64 },
  pavilion_hall: { sheet: 'arch', x: 144, y: 0, w: 160, h: 144, pivotX: 0.5, pivotY: 0.92, splitY: 72 },
  sect_grand_hall: { sheet: 'arch', x: 304, y: 0, w: 224, h: 160, pivotX: 0.5, pivotY: 0.92, splitY: 82 },
  small_shrine: { sheet: 'arch', x: 528, y: 0, w: 80, h: 96, pivotX: 0.5, pivotY: 0.92, splitY: 48 },
  ancient_ruins_wall: { sheet: 'arch', x: 0, y: 160, w: 96, h: 96, pivotX: 0.5, pivotY: 0.92, splitY: 36 },
  sect_wall: { sheet: 'arch', x: 96, y: 160, w: 96, h: 96, pivotX: 0.5, pivotY: 0.92, splitY: 34 },
  wood_gate: { sheet: 'arch', x: 192, y: 160, w: 96, h: 96, pivotX: 0.5, pivotY: 0.92, splitY: 32 },
  wooden_bridge: { sheet: 'arch', x: 288, y: 160, w: 160, h: 64, pivotX: 0.5, pivotY: 0.5 },
  ancient_stele: { sheet: 'arch', x: 448, y: 160, w: 48, h: 72, pivotX: 0.5, pivotY: 0.9 },
  statue_guardian: { sheet: 'arch', x: 496, y: 160, w: 48, h: 64, pivotX: 0.5, pivotY: 0.9 },
  sect_flag: { sheet: 'arch', x: 544, y: 160, w: 48, h: 80, pivotX: 0.35, pivotY: 0.92, splitY: 42 },
  stone_lantern: { sheet: 'arch', x: 0, y: 256, w: 32, h: 48, pivotX: 0.5, pivotY: 0.9, frames: 4, fps: 6 },
  hanging_lantern: { sheet: 'arch', x: 128, y: 256, w: 24, h: 32, pivotX: 0.5, pivotY: 0.2, frames: 4, fps: 6 },
  wood_fence_h: { sheet: 'arch', x: 224, y: 256, w: 64, h: 32, pivotX: 0.5, pivotY: 0.85 },
  stone_table: { sheet: 'arch', x: 288, y: 256, w: 48, h: 40, pivotX: 0.5, pivotY: 0.85 },
  wood_post: { sheet: 'arch', x: 336, y: 256, w: 24, h: 48, pivotX: 0.5, pivotY: 0.9 },
  stone_steps: { sheet: 'arch', x: 360, y: 256, w: 64, h: 48, pivotX: 0.5, pivotY: 0.5 },

  // Resources (resources_sheet.png)
  res_herb: { sheet: 'resources', x: 0, y: 0, w: 32, h: 64, pivotX: 0.5, pivotY: 0.88 },
  res_ore: { sheet: 'resources', x: 32, y: 0, w: 32, h: 64, pivotX: 0.5, pivotY: 0.88 },
  res_chest: { sheet: 'resources', x: 64, y: 0, w: 32, h: 64, pivotX: 0.5, pivotY: 0.88 },
  res_stele: { sheet: 'resources', x: 96, y: 0, w: 32, h: 64, pivotX: 0.5, pivotY: 0.88 },
  res_altar: { sheet: 'resources', x: 128, y: 0, w: 32, h: 64, pivotX: 0.5, pivotY: 0.88 },
};

function detHash(x: number, y: number, seed = 101): number {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
  n = (n ^ (n >>> 13)) | 0;
  n = Math.imul(n, 1274126177);
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 4294967296;
}

function smoothNoise2D(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = detHash(x0, y0, seed);
  const b = detHash(x0 + 1, y0, seed);
  const c = detHash(x0, y0 + 1, seed);
  const d = detHash(x0 + 1, y0 + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function isWaterTile(t: number): boolean {
  return (
    t === TileKind.WATER_CLEAR ||
    t === TileKind.WATER_SHALLOW ||
    t === TileKind.WATER_DEEP ||
    t === TileKind.WATER_DARK ||
    t === TileKind.WATER_BLOOD ||
    t === TileKind.WATER_LOTUS ||
    t === TileKind.WATERFALL
  );
}

function isCliffTile(t: number): boolean {
  return t === TileKind.CLIFF_TOP || t === TileKind.CLIFF_FACE || t === TileKind.CLIFF_BASE;
}

function isStoneLikeTile(t: number): boolean {
  return (
    t === TileKind.STONE ||
    t === TileKind.MOSSY_STONE ||
    t === TileKind.RUINS ||
    t === TileKind.JADE_PLAZA ||
    t === TileKind.STONE_STEPS
  );
}

function isDirtLikeTile(t: number): boolean {
  return (
    t === TileKind.DIRT ||
    t === TileKind.DIRT_PATH ||
    t === TileKind.FOREST_TRAIL ||
    t === TileKind.SAND ||
    t === TileKind.BASALT
  );
}

function isGreenGrassTile(t: number): boolean {
  return t === TileKind.GRASS || t === TileKind.DARK_GRASS;
}

/**
 * Compute tile coordinates inside ground_tiles.png (256x256, 8x8 grid of 32x32)
 */
export function getGroundTileAtlasCoord(kind: TileKind, variant: number, mapId: string): { sx: number; sy: number } {
  const darkTheme = mapId === 'map_hac_phong_son' || mapId === 'map_hac_phong_bi_canh' || mapId === 'map_ancient_ruins';
  switch (kind) {
    case TileKind.GRASS:
      return { sx: (variant % 4) * 32, sy: 0 };
    case TileKind.DARK_GRASS:
      return { sx: (4 + (variant % 3)) * 32, sy: 0 };
    case TileKind.DRY_GRASS: {
      const idx = variant % 3;
      return idx === 0 ? { sx: 7 * 32, sy: 0 } : { sx: (idx - 1) * 32, sy: 32 };
    }
    case TileKind.DIRT:
      return { sx: (2 + (variant % 3)) * 32, sy: 32 };
    case TileKind.DIRT_PATH:
      return { sx: (5 + (variant % 3)) * 32, sy: 32 };
    case TileKind.STONE:
      return { sx: (variant % 3) * 32, sy: 64 };
    case TileKind.MOSSY_STONE:
      return { sx: (3 + (variant % 3)) * 32, sy: 64 };
    case TileKind.SAND:
      return { sx: (6 + (variant % 2)) * 32, sy: 64 };
    case TileKind.BASALT:
      return { sx: (variant % 3) * 32, sy: 96 };
    case TileKind.RUINS:
      return { sx: (3 + (variant % 3)) * 32, sy: 96 };
    case TileKind.JADE_PLAZA:
      return { sx: (6 + (variant % 2)) * 32, sy: 96 };
    case TileKind.WOOD_BRIDGE_H:
      return { sx: 0, sy: 128 };
    case TileKind.STONE_STEPS:
      return { sx: (2 + (variant % 2)) * 32, sy: 128 };
    case TileKind.FOREST_TRAIL:
      return { sx: (variant % 3) * 32, sy: 160 };
    case TileKind.CLIFF_TOP:
      return { sx: (darkTheme ? 4 : 3) * 32, sy: 160 };
    case TileKind.CLIFF_FACE:
      return { sx: (darkTheme ? 7 : 5 + (variant % 2)) * 32, sy: 160 };
    case TileKind.CLIFF_BASE:
      return { sx: (darkTheme ? 1 : 0) * 32, sy: 192 };
    default:
      return { sx: 0, sy: 0 };
  }
}

/**
 * Pure deterministic layout builder for any GameMap.
 * Preserves 100% of NPCs, portals, resources, spawners, and collision AABBs.
 */
export function buildMapEnvironmentLayout(map: GameMap): MapEnvironmentLayout {
  const cols = Math.ceil(map.width / ENV_TILE_SIZE);
  const rows = Math.ceil(map.height / ENV_TILE_SIZE);
  const tiles = new Uint8Array(cols * rows);
  const variants = new Uint8Array(cols * rows);

  let baseTile: TileKind = TileKind.GRASS;
  let pathTile: TileKind = TileKind.DIRT_PATH;
  let plazaTile: TileKind = TileKind.STONE;

  if (map.id === 'map_linh_vu' || map.id === 'map_thanh_phong_son') {
    baseTile = TileKind.DARK_GRASS;
    pathTile = TileKind.FOREST_TRAIL;
    plazaTile = TileKind.MOSSY_STONE;
  } else if (map.id === 'map_phuong_thi') {
    baseTile = TileKind.STONE;
    pathTile = TileKind.DIRT_PATH;
    plazaTile = TileKind.JADE_PLAZA;
  } else if (map.id === 'map_hac_phong_son') {
    baseTile = TileKind.BASALT;
    pathTile = TileKind.DIRT;
    plazaTile = TileKind.BASALT;
  } else if (map.id === 'map_ancient_ruins') {
    baseTile = TileKind.RUINS;
    pathTile = TileKind.MOSSY_STONE;
    plazaTile = TileKind.RUINS;
  } else if (map.id === 'map_thanh_van_tong') {
    baseTile = TileKind.GRASS;
    pathTile = TileKind.STONE;
    plazaTile = TileKind.JADE_PLAZA;
  } else if (map.id === 'map_hac_phong_bi_canh') {
    baseTile = TileKind.BASALT;
    pathTile = TileKind.RUINS;
    plazaTile = TileKind.RUINS;
  }

  // 1. Base biome ground + smooth organic secondary regions (no harsh grid-box blotches)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const n =
        smoothNoise2D(c / 4.2, r / 4.2, map.id.length * 97 + 13) * 0.72 +
        smoothNoise2D(c / 1.9, r / 1.9, map.id.length * 41 + 7) * 0.28;
      variants[idx] = Math.floor(detHash(c, r, 311) * 16);
      let t: TileKind = baseTile;
      if (map.id === 'map_thanh_khe') {
        if (n > 0.62) t = TileKind.DARK_GRASS;
        else if (n < 0.22) t = TileKind.DARK_GRASS;
      } else if (map.id === 'map_linh_vu') {
        if (n > 0.62) t = TileKind.GRASS;
        else if (n < 0.24) t = TileKind.MOSSY_STONE;
      } else if (map.id === 'map_hac_phong_son') {
        if (n > 0.61) t = TileKind.DRY_GRASS;
        else if (n < 0.26) t = TileKind.DIRT;
      } else if (map.id === 'map_thanh_phong_son') {
        if (n > 0.65) t = TileKind.DRY_GRASS;
        else if (n < 0.24) t = TileKind.MOSSY_STONE;
      } else if (map.id === 'map_phuong_thi') {
        if (n > 0.68) t = TileKind.MOSSY_STONE;
      } else if (map.id === 'map_thanh_van_tong') {
        if (n > 0.72) t = TileKind.DARK_GRASS;
      } else if (map.id === 'map_ancient_ruins') {
        if (n > 0.68) t = TileKind.MOSSY_STONE;
      } else if (map.id === 'map_hac_phong_bi_canh') {
        if (n > 0.66) t = TileKind.RUINS;
      }
      tiles[idx] = t;
    }
  }

  const paintCircle = (wx: number, wy: number, radius: number, kind: TileKind) => {
    const minC = Math.max(0, Math.floor((wx - radius) / ENV_TILE_SIZE));
    const maxC = Math.min(cols - 1, Math.floor((wx + radius) / ENV_TILE_SIZE));
    const minR = Math.max(0, Math.floor((wy - radius) / ENV_TILE_SIZE));
    const maxR = Math.min(rows - 1, Math.floor((wy + radius) / ENV_TILE_SIZE));
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const cx = (c + 0.5) * ENV_TILE_SIZE;
        const cy = (r + 0.5) * ENV_TILE_SIZE;
        if (Math.hypot(cx - wx, cy - wy) <= radius) {
          tiles[r * cols + c] = kind;
        }
      }
    }
  };

  const paintPath = (x0: number, y0: number, x1: number, y1: number, radius: number, kind: TileKind) => {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(2, Math.ceil(dist / 24));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const sway = Math.sin(t * Math.PI * 2) * 18;
      const px = x0 + (x1 - x0) * t + sway * 0.4;
      const py = y0 + (y1 - y0) * t + sway * 0.35;
      paintCircle(px, py, radius, kind);
    }
  };

  // 2. Plazas under buildings, NPCs, & portals
  map.npcs.forEach((npc) => paintCircle(npc.x, npc.y + 10, 68, plazaTile));
  map.portals.forEach((portal) => paintCircle(portal.x, portal.y, 64, plazaTile));

  // Connect portals and NPCs cleanly via organic paths
  if (map.npcs.length > 0) {
    const hub = map.npcs[0];
    map.portals.forEach((portal) => {
      paintPath(hub.x, hub.y + 16, portal.x, portal.y, 38, pathTile);
    });
    for (let i = 1; i < map.npcs.length; i++) {
      paintPath(hub.x, hub.y + 16, map.npcs[i].x, map.npcs[i].y + 16, 36, pathTile);
    }
  } else if (map.portals.length > 0) {
    paintPath(map.portals[0].x, map.portals[0].y, map.width * 0.72, map.height * 0.55, 42, pathTile);
  }

  // 3. Mountain northern cliff edge on outdoor mountain/forest maps (strictly decorative along y < 48 away from north portals)
  if (map.id === 'map_hac_phong_son' || map.id === 'map_thanh_phong_son' || map.id === 'map_linh_vu') {
    for (let c = 0; c < cols; c++) {
      const nearNorthPortal = map.portals.some((p) => p.y < 140 && Math.abs(p.x - (c + 0.5) * 32) < 96);
      if (!nearNorthPortal) {
        tiles[0 * cols + c] = TileKind.CLIFF_TOP;
        if (rows > 1) tiles[1 * cols + c] = TileKind.CLIFF_FACE;
        if (rows > 2 && map.id === 'map_hac_phong_son') tiles[2 * cols + c] = TileKind.CLIFF_BASE;
      }
    }
  }

  const bridgeRects: Array<{ x: number; y: number; w: number; h: number }> = [];

  // 4. Special map signature features (preserving 100% of coordinates!)
  if (map.id === 'map_thanh_khe') {
    // Village main plaza
    paintCircle(380, 390, 120, TileKind.STONE);
    paintPath(260, 560, 1340, 450, 40, TileKind.DIRT_PATH);
    paintPath(420, 380, 1340, 180, 36, TileKind.DIRT_PATH);

    // Clear winding Thanh Khê stream (river centerline x ~ 690..770)
    for (let r = 0; r < rows; r++) {
      const wy = (r + 0.5) * ENV_TILE_SIZE;
      const riverCenter = 720 + Math.sin(wy / 170) * 44;
      for (let c = 0; c < cols; c++) {
        const wx = (c + 0.5) * ENV_TILE_SIZE;
        const d = Math.abs(wx - riverCenter);
        if (d < 40) {
          tiles[r * cols + c] = (r + c) % 7 === 0 && wy > 640 ? TileKind.WATER_LOTUS : TileKind.WATER_CLEAR;
        } else if (d < 64) {
          tiles[r * cols + c] = TileKind.SAND;
        }
      }
    }
    // Bridge spanning the stream at y ~ 544..608 (matching original bridgeY=560)
    const bridgeCenterX = Math.round(720 + Math.sin(560 / 170) * 44);
    for (let r = 17; r <= 18; r++) {
      for (let c = Math.floor((bridgeCenterX - 74) / 32); c <= Math.floor((bridgeCenterX + 74) / 32); c++) {
        if (c >= 0 && c < cols && r >= 0 && r < rows) {
          tiles[r * cols + c] = TileKind.WOOD_BRIDGE_H;
        }
      }
    }
    bridgeRects.push({ x: bridgeCenterX - 80, y: 544, w: 160, h: 64 });
  } else if (map.id === 'map_linh_vu') {
    // Spirit Forest stream pool below northern waterfall away from spawn/portals
    for (let r = 0; r < 2; r++) {
      for (let c = 14; c <= 16; c++) {
        tiles[r * cols + c] = r === 0 ? TileKind.WATER_SHALLOW : TileKind.WATERFALL;
      }
    }
    paintCircle(495, 120, 68, TileKind.WATER_SHALLOW);
    paintCircle(495, 120, 32, TileKind.WATER_LOTUS);
    // Rocky Boss clearing around Bạch Mao Viên Hầu (1330, 165)
    paintCircle(1330, 185, 110, TileKind.STONE);
    // Jade herbal garden clearing around Tố Vấn Tiên Cô (1080, 280)
    paintCircle(1080, 280, 96, TileKind.MOSSY_STONE);
  } else if (map.id === 'map_hac_phong_son') {
    // Dark cursed spring pool in south-west chasm (away from portals & spawners)
    paintCircle(420, 880, 62, TileKind.WATER_DARK);
    paintCircle(1380, 510, 90, TileKind.RUINS);
  } else if (map.id === 'map_phuong_thi') {
    // Central paved market street cross
    paintPath(60, 480, 1240, 400, 56, TileKind.STONE);
    paintPath(650, 60, 650, 740, 56, TileKind.JADE_PLAZA);
  } else if (map.id === 'map_thanh_van_tong') {
    // Grand Jade Sect courtyard & central stair avenue
    paintPath(650, 320, 650, 920, 72, TileKind.JADE_PLAZA);
    paintPath(240, 420, 1400, 500, 48, TileKind.STONE);
    for (let r = 21; r <= 23; r++) {
      for (let c = 19; c <= 21; c++) {
        tiles[r * cols + c] = TileKind.STONE_STEPS;
      }
    }
  } else if (map.id === 'map_hac_phong_bi_canh') {
    // Blood-spirit cavern pool near Hắc Huyết Viên Vương (1380, 460) at y~230..310
    paintCircle(1410, 260, 52, TileKind.WATER_BLOOD);
  }

  // 5. Render map `water` obstacles directly onto waterCells
  map.obstacles.forEach((obs) => {
    if (obs.type === 'water') {
      const c0 = Math.max(0, Math.floor(obs.x / ENV_TILE_SIZE));
      const c1 = Math.min(cols - 1, Math.floor((obs.x + obs.width - 1) / ENV_TILE_SIZE));
      const r0 = Math.max(0, Math.floor(obs.y / ENV_TILE_SIZE));
      const r1 = Math.min(rows - 1, Math.floor((obs.y + obs.height - 1) / ENV_TILE_SIZE));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          tiles[r * cols + c] = (r + c) % 3 === 0 ? TileKind.WATER_LOTUS : TileKind.WATER_SHALLOW;
        }
      }
    }
  });

  // Collect all animated water cells for fast frustum-culled animation pass
  const waterCells: Array<{ col: number; row: number; kind: TileKind }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const kind = tiles[r * cols + c] as TileKind;
      if (isWaterTile(kind)) {
        waterCells.push({ col: c, row: r, kind });
      }
    }
  }

  // 6. Generate deterministic non-blocking micro-prop scatter (grass tufts, wildflowers, pebbles, mushrooms, lanterns)
  const scatterProps: ScatterProp[] = [];
  const isClearForScatter = (wx: number, wy: number): boolean => {
    if (wx < 48 || wx > map.width - 48 || wy < 64 || wy > map.height - 48) return false;
    const col = Math.floor(wx / ENV_TILE_SIZE);
    const row = Math.floor(wy / ENV_TILE_SIZE);
    const tk = tiles[row * cols + col];
    if (isWaterTile(tk) || isCliffTile(tk) || tk === TileKind.WOOD_BRIDGE_H || tk === TileKind.DIRT_PATH || tk === TileKind.JADE_PLAZA) {
      return false;
    }
    for (const obs of map.obstacles) {
      if (wx >= obs.x - 24 && wx <= obs.x + obs.width + 24 && wy >= obs.y - 24 && wy <= obs.y + obs.height + 24) return false;
    }
    for (const npc of map.npcs) {
      if (Math.hypot(wx - npc.x, wy - npc.y) < 75) return false;
    }
    for (const portal of map.portals) {
      if (Math.hypot(wx - portal.x, wy - portal.y) < 85) return false;
    }
    for (const res of map.resources) {
      if (Math.hypot(wx - res.x, wy - res.y) < 55) return false;
    }
    return true;
  };

  const countTarget = Math.min(72, Math.floor((map.width * map.height) / 24000));
  for (let i = 0; i < countTarget * 2; i++) {
    if (scatterProps.length >= countTarget) break;
    const wx = Math.round(64 + detHash(i, 1, map.id.length * 37) * (map.width - 128));
    const wy = Math.round(72 + detHash(i, 2, map.id.length * 53) * (map.height - 136));
    if (!isClearForScatter(wx, wy)) continue;

    const r = detHash(i, 3, 919);
    let spriteKey = 'grass_tuft_0';
    let layer: 1 | 2 = 1;

    if (map.id === 'map_thanh_khe') {
      if (r < 0.45) spriteKey = `grass_tuft_${i % 2}`;
      else if (r < 0.78) spriteKey = `wild_flower_${i % 3}`;
      else if (r < 0.92) spriteKey = 'small_rock_1';
      else {
        spriteKey = 'bush_green';
        layer = 2;
      }
    } else if (map.id === 'map_linh_vu' || map.id === 'map_thanh_phong_son') {
      if (r < 0.36) spriteKey = 'grass_tuft_2';
      else if (r < 0.62) spriteKey = i % 2 === 0 ? 'mushroom_jade' : 'mushroom_red';
      else if (r < 0.82) spriteKey = 'wild_flower_3';
      else {
        spriteKey = 'bush_pine';
        layer = 2;
      }
    } else if (map.id === 'map_hac_phong_son' || map.id === 'map_hac_phong_bi_canh') {
      if (r < 0.38) spriteKey = 'grass_tuft_3';
      else if (r < 0.68) spriteKey = 'small_rock_2';
      else if (r < 0.86) spriteKey = 'beast_bones';
      else {
        spriteKey = 'bush_dry';
        layer = 2;
      }
    } else if (map.id === 'map_ancient_ruins') {
      if (r < 0.45) spriteKey = 'mushroom_purple';
      else if (r < 0.8) spriteKey = 'small_rock_2';
      else {
        spriteKey = 'tree_roots';
        layer = 1;
      }
    } else {
      if (r < 0.5) spriteKey = `wild_flower_${i % 4}`;
      else spriteKey = `grass_tuft_${i % 2}`;
    }

    scatterProps.push({
      id: `${map.id}_scatter_${i}`,
      x: wx,
      y: wy,
      spriteKey,
      layer,
      flipX: i % 2 === 1,
    });
  }

  return {
    mapId: map.id,
    cols,
    rows,
    tiles,
    variants,
    waterCells,
    bridgeRects,
    scatterProps,
  };
}

export class EnvironmentRenderer {
  private static instance: EnvironmentRenderer;
  private layouts: Map<string, MapEnvironmentLayout> = new Map();
  private terrainCache: Map<string, HTMLCanvasElement> = new Map();
  private preloadStarted = false;
  private allLoaded = false;
  private cacheBuiltWithTextures: Map<string, boolean> = new Map();

  private constructor() {}

  public static getInstance(): EnvironmentRenderer {
    if (!EnvironmentRenderer.instance) {
      EnvironmentRenderer.instance = new EnvironmentRenderer();
    }
    return EnvironmentRenderer.instance;
  }

  public preloadAll(): Promise<void> {
    if (this.preloadStarted && this.allLoaded) return Promise.resolve();
    this.preloadStarted = true;
    const urls = Object.values(ENV_ASSET_URLS);
    return pixelAssetLoader.loadAssetPack(urls).then(() => {
      this.allLoaded = true;
      // Invalidate placeholder terrain caches so next frame bakes crisp PNG tiles!
      this.terrainCache.clear();
      this.cacheBuiltWithTextures.clear();
    });
  }

  public isReady(): boolean {
    return Boolean(
      pixelAssetLoader.getImage(ENV_ASSET_URLS.groundTiles) &&
      pixelAssetLoader.getImage(ENV_ASSET_URLS.transitionTiles) &&
      pixelAssetLoader.getImage(ENV_ASSET_URLS.animatedWater) &&
      pixelAssetLoader.getImage(ENV_ASSET_URLS.floraSheet) &&
      pixelAssetLoader.getImage(ENV_ASSET_URLS.rocksSheet) &&
      pixelAssetLoader.getImage(ENV_ASSET_URLS.architectureSheet) &&
      pixelAssetLoader.getImage(ENV_ASSET_URLS.resourcesSheet)
    );
  }

  public getLayout(map: GameMap): MapEnvironmentLayout {
    let layout = this.layouts.get(map.id);
    if (!layout) {
      layout = buildMapEnvironmentLayout(map);
      this.layouts.set(map.id, layout);
    }
    return layout;
  }

  public clearCache(mapId?: string): void {
    if (mapId) {
      this.terrainCache.delete(mapId);
      this.cacheBuiltWithTextures.delete(mapId);
      this.layouts.delete(mapId);
    } else {
      this.terrainCache.clear();
      this.cacheBuiltWithTextures.clear();
      this.layouts.clear();
    }
  }

  private getSheetImage(sheet: SpriteRect['sheet']): HTMLImageElement | null {
    switch (sheet) {
      case 'flora':
        return pixelAssetLoader.getImage(ENV_ASSET_URLS.floraSheet);
      case 'rocks':
        return pixelAssetLoader.getImage(ENV_ASSET_URLS.rocksSheet);
      case 'arch':
        return pixelAssetLoader.getImage(ENV_ASSET_URLS.architectureSheet);
      case 'resources':
        return pixelAssetLoader.getImage(ENV_ASSET_URLS.resourcesSheet);
    }
  }

  private isImageUsable(img: HTMLImageElement | null): img is HTMLImageElement {
    return Boolean(img && img.complete && (img.naturalWidth || img.width) > 2);
  }

  private getOrBakeStaticTerrain(map: GameMap): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;

    const layout = this.getLayout(map);
    const groundImg = pixelAssetLoader.getImage(ENV_ASSET_URLS.groundTiles);
    const transImg = pixelAssetLoader.getImage(ENV_ASSET_URLS.transitionTiles);
    const archImg = pixelAssetLoader.getImage(ENV_ASSET_URLS.architectureSheet);
    const texturesReady = this.isImageUsable(groundImg) && this.isImageUsable(transImg);

    const cached = this.terrainCache.get(map.id);
    if (cached && (!texturesReady || this.cacheBuiltWithTextures.get(map.id))) {
      return cached;
    }

    const canvas = cached || document.createElement('canvas');
    canvas.width = Math.min(2048, map.width);
    canvas.height = Math.min(2048, map.height);
    const tctx = canvas.getContext('2d');
    if (!tctx) return null;
    tctx.imageSmoothingEnabled = false;

    const fallbackHex =
      map.id === 'map_hac_phong_son' || map.id === 'map_hac_phong_bi_canh'
        ? '#1f1d2b'
        : map.id === 'map_ancient_ruins'
        ? '#2b1e40'
        : map.id === 'map_linh_vu' || map.id === 'map_thanh_phong_son'
        ? '#16382b'
        : map.id === 'map_phuong_thi'
        ? '#383e52'
        : '#265c42';

    tctx.fillStyle = fallbackHex;
    tctx.fillRect(0, 0, canvas.width, canvas.height);

    if (texturesReady && groundImg && transImg) {
      const { cols, rows, tiles, variants } = layout;

      const tileAt = (c: number, r: number): number => {
        const cc = Math.max(0, Math.min(cols - 1, c));
        const rr = Math.max(0, Math.min(rows - 1, r));
        return tiles[rr * cols + cc];
      };

      // Pass A: Base 32x32 tiles (non-water cells)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const kind = tiles[r * cols + c] as TileKind;
          if (isWaterTile(kind)) continue;
          const { sx, sy } = getGroundTileAtlasCoord(kind, variants[r * cols + c], map.id);
          tctx.drawImage(groundImg, sx, sy, 32, 32, c * 32, r * 32, 32, 32);
        }
      }

      // Pass B: 4-bit Autotile Edge Transitions between neighboring terrains
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const kind = tiles[r * cols + c] as TileKind;
          const n = tileAt(c, r - 1);
          const e = tileAt(c + 1, r);
          const s = tileAt(c, r + 1);
          const w = tileAt(c - 1, r);

          // 1) Green grass edge spilling slightly onto adjacent dirt/stone (skip DRY_GRASS so Hắc Phong Sơn stays grim & withered)
          if (isDirtLikeTile(kind) || isStoneLikeTile(kind)) {
            let mask = 0;
            if (isGreenGrassTile(n)) mask |= 1;
            if (isGreenGrassTile(e)) mask |= 2;
            if (isGreenGrassTile(s)) mask |= 4;
            if (isGreenGrassTile(w)) mask |= 8;
            if (mask > 0) {
              const rowIdx = isDirtLikeTile(kind) ? 0 : 1;
              tctx.drawImage(transImg, mask * 32, rowIdx * 32, 32, 32, c * 32, r * 32, 32, 32);
            }
          }

          // 2) Dirt spilling onto stone
          if (isStoneLikeTile(kind)) {
            let mask = 0;
            if (isDirtLikeTile(n)) mask |= 1;
            if (isDirtLikeTile(e)) mask |= 2;
            if (isDirtLikeTile(s)) mask |= 4;
            if (isDirtLikeTile(w)) mask |= 8;
            if (mask > 0) {
              tctx.drawImage(transImg, mask * 32, 2 * 32, 32, 32, c * 32, r * 32, 32, 32);
            }
          }

          // 3) Shore edge along water cells (drawn on top of land or water rim)
          if (isWaterTile(kind)) {
            let mask = 0;
            if (!isWaterTile(n)) mask |= 1;
            if (!isWaterTile(e)) mask |= 2;
            if (!isWaterTile(s)) mask |= 4;
            if (!isWaterTile(w)) mask |= 8;
            if (mask > 0) {
              const rowIdx = map.id === 'map_hac_phong_son' || map.id === 'map_hac_phong_bi_canh' ? 4 : 3;
              tctx.drawImage(transImg, mask * 32, rowIdx * 32, 32, 32, c * 32, r * 32, 32, 32);
            }
          }
        }
      }

      // Pass C: Bake wooden bridges cleanly onto static ground layer (Layer 1)
      if (this.isImageUsable(archImg)) {
        const bridgeRect = ENV_SPRITE_RECTS.wooden_bridge;
        layout.bridgeRects.forEach((b) => {
          tctx.drawImage(archImg, bridgeRect.x, bridgeRect.y, bridgeRect.w, bridgeRect.h, b.x, b.y, b.w, b.h);
        });
      }

      // Pass D: Bake Layer 1 scatter props (tufts/flowers/pebbles) right into static offscreen buffer for zero per-frame draw calls!
      layout.scatterProps.forEach((sp) => {
        if (sp.layer !== 1) return;
        const rect = ENV_SPRITE_RECTS[sp.spriteKey];
        if (!rect) return;
        const img = this.getSheetImage(rect.sheet);
        if (!this.isImageUsable(img)) return;
        const dx = Math.round(sp.x - rect.w * rect.pivotX);
        const dy = Math.round(sp.y - rect.h * rect.pivotY);
        tctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, dx, dy, rect.w, rect.h);
      });
    }

    this.terrainCache.set(map.id, canvas);
    this.cacheBuiltWithTextures.set(map.id, texturesReady);
    return canvas;
  }

  /**
   * Layer 0 + Layer 1: Blit viewport slice of cached ground + animated frustum-culled water tiles
   */
  public renderGroundViewport(
    ctx: CanvasRenderingContext2D,
    map: GameMap,
    cameraX: number,
    cameraY: number,
    viewW: number,
    viewH: number,
    timeMs: number
  ): void {
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    const layout = this.getLayout(map);
    const bg = this.getOrBakeStaticTerrain(map);

    const sx = Math.max(0, Math.floor(cameraX - viewW / 2 - 32));
    const sy = Math.max(0, Math.floor(cameraY - viewH / 2 - 32));
    const sw = Math.min(map.width - sx, Math.ceil(viewW + 64));
    const sh = Math.min(map.height - sy, Math.ceil(viewH + 64));

    if (bg && sw > 0 && sh > 0) {
      ctx.drawImage(bg, sx, sy, sw, sh, sx, sy, sw, sh);
    }

    // Animated Water Tiles (only inside camera frustum!)
    const waterImg = pixelAssetLoader.getImage(ENV_ASSET_URLS.animatedWater);
    const transImg = pixelAssetLoader.getImage(ENV_ASSET_URLS.transitionTiles);
    if (this.isImageUsable(waterImg) && layout.waterCells.length > 0) {
      const frame = Math.floor((timeMs / 1000) * 6) % 4;
      const minC = Math.floor(sx / ENV_TILE_SIZE);
      const maxC = Math.ceil((sx + sw) / ENV_TILE_SIZE);
      const minR = Math.floor(sy / ENV_TILE_SIZE);
      const maxR = Math.ceil((sy + sh) / ENV_TILE_SIZE);

      const { cols, rows, tiles } = layout;
      const tileAt = (c: number, r: number): number => {
        const cc = Math.max(0, Math.min(cols - 1, c));
        const rr = Math.max(0, Math.min(rows - 1, r));
        return tiles[rr * cols + cc];
      };

      for (let i = 0; i < layout.waterCells.length; i++) {
        const cell = layout.waterCells[i];
        if (cell.col < minC || cell.col > maxC || cell.row < minR || cell.row > maxR) continue;

        let srcCol = frame;
        let srcRow = 0;
        switch (cell.kind) {
          case TileKind.WATER_SHALLOW:
            srcCol = 4 + frame;
            srcRow = 0;
            break;
          case TileKind.WATER_DEEP:
            srcCol = frame;
            srcRow = 1;
            break;
          case TileKind.WATER_DARK:
            srcCol = 4 + frame;
            srcRow = 1;
            break;
          case TileKind.WATERFALL:
            srcCol = frame;
            srcRow = 2;
            break;
          case TileKind.WATER_LOTUS:
            srcCol = frame;
            srcRow = 3;
            break;
          case TileKind.WATER_BLOOD:
            srcCol = 4 + frame;
            srcRow = 3;
            break;
          default:
            srcCol = frame;
            srcRow = 0;
        }

        const dx = cell.col * ENV_TILE_SIZE;
        const dy = cell.row * ENV_TILE_SIZE;
        ctx.drawImage(waterImg, srcCol * 32, srcRow * 32, 32, 32, dx, dy, 32, 32);

        // Re-overlay shoreline rim on edge water tiles so animation doesn't cover bank edge
        if (this.isImageUsable(transImg)) {
          let mask = 0;
          if (!isWaterTile(tileAt(cell.col, cell.row - 1))) mask |= 1;
          if (!isWaterTile(tileAt(cell.col + 1, cell.row))) mask |= 2;
          if (!isWaterTile(tileAt(cell.col, cell.row + 1))) mask |= 4;
          if (!isWaterTile(tileAt(cell.col - 1, cell.row))) mask |= 8;
          if (mask > 0) {
            const rowIdx = map.id === 'map_hac_phong_son' || map.id === 'map_hac_phong_bi_canh' ? 5 : 3;
            ctx.drawImage(transImg, mask * 32, rowIdx * 32, 32, 32, dx, dy, 32, 32);
          }
        }
      }

      // Draw bridge deck on top of river cells inside frustum
      const archImg = pixelAssetLoader.getImage(ENV_ASSET_URLS.architectureSheet);
      if (this.isImageUsable(archImg)) {
        const bRect = ENV_SPRITE_RECTS.wooden_bridge;
        for (const b of layout.bridgeRects) {
          if (b.x + b.w >= sx && b.x <= sx + sw && b.y + b.h >= sy && b.y <= sy + sh) {
            ctx.drawImage(archImg, bRect.x, bRect.y, bRect.w, bRect.h, b.x, b.y, b.w, b.h);
          }
        }
      }
    }

    ctx.imageSmoothingEnabled = prevSmooth;
  }

  /**
   * Resolve obstacle sprite & split configuration cleanly per map + obstacle dimensions
   */
  public resolveObstacleSprite(mapId: string, obs: MapObstacle): { key: string; rect: SpriteRect; tiled?: boolean } {
    if (obs.type === 'building') {
      if (mapId === 'map_thanh_van_tong') {
        const key = obs.width >= 240 ? 'sect_grand_hall' : obs.width >= 190 ? 'pavilion_hall' : 'small_shrine';
        return { key, rect: ENV_SPRITE_RECTS[key] };
      }
      if (mapId === 'map_phuong_thi') {
        const key = obs.width >= 155 ? 'pavilion_hall' : obs.width <= 115 ? 'small_shrine' : 'village_house';
        return { key, rect: ENV_SPRITE_RECTS[key] };
      }
      const key = obs.width >= 155 ? 'pavilion_hall' : 'village_house';
      return { key, rect: ENV_SPRITE_RECTS[key] };
    }

    if (obs.type === 'tree') {
      if (mapId === 'map_hac_phong_son' || mapId === 'map_hac_phong_bi_canh') {
        return { key: 'dark_dead_tree', rect: ENV_SPRITE_RECTS.dark_dead_tree };
      }
      if (mapId === 'map_thanh_van_tong') {
        return { key: 'spirit_tree', rect: ENV_SPRITE_RECTS.spirit_tree };
      }
      if (mapId === 'map_linh_vu') {
        const hash = Math.floor((obs.x + obs.y) / 50) % 3;
        const key = hash === 0 ? 'ancient_tree' : hash === 1 ? 'pine_tree' : 'bamboo_cluster';
        return { key, rect: ENV_SPRITE_RECTS[key] };
      }
      return { key: 'ancient_tree', rect: ENV_SPRITE_RECTS.ancient_tree };
    }

    if (obs.type === 'rock') {
      if (mapId === 'map_hac_phong_son' || mapId === 'map_hac_phong_bi_canh') {
        const key = obs.width >= 150 ? 'dark_crag' : 'crystal_rock';
        return { key, rect: ENV_SPRITE_RECTS[key] };
      }
      const key = obs.width >= 120 ? 'crag' : 'mossy_boulder';
      return { key, rect: ENV_SPRITE_RECTS[key] };
    }

    if (obs.type === 'wall') {
      const key = mapId === 'map_thanh_van_tong' ? 'sect_wall' : 'ancient_ruins_wall';
      return { key, rect: ENV_SPRITE_RECTS[key], tiled: true };
    }

    return { key: 'boulder', rect: ENV_SPRITE_RECTS.boulder };
  }

  private computeObstacleDrawBox(obs: MapObstacle, rect: SpriteRect) {
    // Anchor bottom-center of sprite onto obstacle's ground footprint bottom-center
    const footX = Math.round(obs.x + obs.width / 2);
    const footY = Math.round(obs.y + obs.height);
    const scaleX = Math.max(1, obs.width / Math.max(1, rect.w * 0.85));
    const drawW = Math.round(rect.w * (obs.type === 'building' ? Math.min(1.35, Math.max(0.85, scaleX)) : 1));
    const drawH = Math.round(rect.h * (obs.type === 'building' ? Math.min(1.35, Math.max(0.85, scaleX)) : 1));
    const dx = Math.round(footX - drawW * rect.pivotX);
    const dy = Math.round(footY - drawH * rect.pivotY);
    return { dx, dy, drawW, drawH };
  }

  /**
   * Layer 2 Obstacle Base / Trunk / Wall render
   */
  public renderObstacleBase(
    ctx: CanvasRenderingContext2D,
    mapId: string,
    obs: MapObstacle,
    timeMs: number,
    playerPos?: { x: number; y: number }
  ): boolean {
    if (obs.type === 'water') {
      // Already rendered cleanly inside renderGroundViewport with 4-bit autotiled shorelines & lotus ripples
      return true;
    }

    const { rect, tiled } = this.resolveObstacleSprite(mapId, obs);
    const img = this.getSheetImage(rect.sheet);
    if (!this.isImageUsable(img)) return false;

    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    if (tiled) {
      // Tile wall chunks across obs footprint cleanly
      const segW = Math.min(obs.width, 80);
      const segH = Math.min(obs.height, 80);
      for (let py = obs.y; py < obs.y + obs.height; py += segH) {
        for (let px = obs.x; px < obs.x + obs.width; px += segW) {
          const w = Math.min(segW, obs.x + obs.width - px);
          const h = Math.min(segH, obs.y + obs.height - py);
          ctx.drawImage(img, rect.x, rect.y + 18, rect.w, rect.h - 18, Math.round(px), Math.round(py), Math.round(w), Math.round(h));
        }
      }
      ctx.imageSmoothingEnabled = prevSmooth;
      return true;
    }

    const { dx, dy, drawW, drawH } = this.computeObstacleDrawBox(obs, rect);

    if (rect.splitY !== undefined) {
      const splitRatio = rect.splitY / rect.h;
      const srcBaseY = rect.y + rect.splitY;
      const srcBaseH = rect.h - rect.splitY;
      const dstBaseY = Math.round(dy + drawH * splitRatio);
      const dstBaseH = drawH - (dstBaseY - dy);
      ctx.drawImage(img, rect.x, srcBaseY, rect.w, srcBaseH, dx, dstBaseY, drawW, dstBaseH);
    } else {
      const occluded =
        playerPos &&
        playerPos.x >= obs.x - 16 &&
        playerPos.x <= obs.x + obs.width + 16 &&
        playerPos.y < obs.y + obs.height &&
        playerPos.y > obs.y - 36;
      if (occluded) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, dx, dy, drawW, drawH);
        ctx.restore();
      } else {
        ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, dx, dy, drawW, drawH);
      }
    }

    ctx.imageSmoothingEnabled = prevSmooth;
    return true;
  }

  /**
   * Layer 3 Obstacle Overhead Roof Eaves / Tree Canopy (drawn ABOVE player & entities)
   * Automatically fades gently when Lâm Mặc walks behind the roof or canopy.
   */
  public renderObstacleOverhead(
    ctx: CanvasRenderingContext2D,
    mapId: string,
    obs: MapObstacle,
    playerPos?: { x: number; y: number }
  ): void {
    if (obs.type === 'water' || obs.type === 'wall') return;
    const { rect } = this.resolveObstacleSprite(mapId, obs);
    if (rect.splitY === undefined) return;
    const img = this.getSheetImage(rect.sheet);
    if (!this.isImageUsable(img)) return;

    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    const { dx, dy, drawW, drawH } = this.computeObstacleDrawBox(obs, rect);
    const splitRatio = rect.splitY / rect.h;
    const dstOverheadH = Math.round(drawH * splitRatio);

    const isBehind =
      playerPos &&
      playerPos.x >= dx - 8 &&
      playerPos.x <= dx + drawW + 8 &&
      playerPos.y >= dy &&
      playerPos.y <= obs.y + obs.height - 6;

    if (isBehind) {
      ctx.save();
      ctx.globalAlpha = 0.48;
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.splitY, dx, dy, drawW, dstOverheadH);
      ctx.restore();
    } else {
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.splitY, dx, dy, drawW, dstOverheadH);
    }

    ctx.imageSmoothingEnabled = prevSmooth;
  }

  /**
   * Render a Layer 2 scatter prop (bushes etc.)
   */
  public renderScatterProp(ctx: CanvasRenderingContext2D, sp: ScatterProp): void {
    const rect = ENV_SPRITE_RECTS[sp.spriteKey];
    if (!rect) return;
    const img = this.getSheetImage(rect.sheet);
    if (!this.isImageUsable(img)) return;

    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const dx = Math.round(sp.x - rect.w * rect.pivotX);
    const dy = Math.round(sp.y - rect.h * rect.pivotY);
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, dx, dy, rect.w, rect.h);
    ctx.imageSmoothingEnabled = prevSmooth;
  }

  /**
   * Pixel Art Map Decoration (lamps, flowers, statues, flags, stones)
   */
  public renderDecorationPixel(ctx: CanvasRenderingContext2D, dec: { x: number; y: number; type: string }, timeMs: number): boolean {
    let key = 'wild_flower_0';
    if (dec.type === 'lamp') key = 'stone_lantern';
    else if (dec.type === 'flower') key = 'wild_flower_0';
    else if (dec.type === 'statue') key = 'statue_guardian';
    else if (dec.type === 'flag') key = 'sect_flag';
    else if (dec.type === 'stone') key = 'stone_table';

    const rect = ENV_SPRITE_RECTS[key];
    if (!rect) return false;
    const img = this.getSheetImage(rect.sheet);
    if (!this.isImageUsable(img)) return false;

    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    const frame = rect.frames ? Math.floor((timeMs / 1000) * (rect.fps || 6)) % rect.frames : 0;
    const sx = rect.x + frame * rect.w;
    const dx = Math.round(dec.x - rect.w * rect.pivotX);
    const dy = Math.round(dec.y - rect.h * rect.pivotY);
    ctx.drawImage(img, sx, rect.y, rect.w, rect.h, dx, dy, rect.w, rect.h);

    if (dec.type === 'lamp') {
      const flicker = Math.sin(timeMs / 160 + dec.x) * 3;
      const glow = ctx.createRadialGradient(dec.x, dec.y - 22, 2, dec.x, dec.y - 22, 42 + flicker);
      glow.addColorStop(0, 'rgba(250, 204, 21, 0.42)');
      glow.addColorStop(0.6, 'rgba(245, 158, 11, 0.14)');
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dec.x, dec.y - 22, 42 + flicker, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.imageSmoothingEnabled = prevSmooth;
    return true;
  }

  /**
   * Pixel Art Collectible Resource (herbs, ores, chests, steles, altars)
   */
  public renderResourcePixel(ctx: CanvasRenderingContext2D, res: CollectibleResource, timeMs: number): boolean {
    if (res.collected && res.currentRespawnTimer > 0) return true;
    const key =
      res.type === 'herb'
        ? 'res_herb'
        : res.type === 'ore'
        ? 'res_ore'
        : res.type === 'chest'
        ? 'res_chest'
        : res.type === 'stele'
        ? 'res_stele'
        : 'res_altar';
    const rect = ENV_SPRITE_RECTS[key];
    if (!rect) return false;
    const img = this.getSheetImage(rect.sheet);
    if (!this.isImageUsable(img)) return false;

    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const bob = res.type === 'herb' || res.type === 'altar' ? Math.round(Math.sin(timeMs / 300 + res.x) * 1.5) : 0;
    const dx = Math.round(res.x - rect.w * rect.pivotX);
    const dy = Math.round(res.y - rect.h * rect.pivotY + bob);
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, dx, dy, rect.w, rect.h);
    ctx.imageSmoothingEnabled = prevSmooth;
    return true;
  }
}

export const environmentRenderer = EnvironmentRenderer.getInstance();
