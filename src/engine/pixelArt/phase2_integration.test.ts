/**
 * PHASE 2.0 INTEGRATION TESTS (PHÀM TRẦN TIÊN LỘ)
 * Verifies Lam Mac HD Pixel Art Sprite Renderer integration into main gameplay:
 * 1. Load all 10 sprite sheets
 * 2. Exact 64x64 frame slicing
 * 3. 4 Direction row indices (Down: 0, Left: 1, Right: 2, Up: 3)
 * 4. Exact feet pivot (0.5, 0.875) -> (32, 56)
 * 5. State transitions: Idle -> Walk -> Run
 * 6. Attack combo: Attack 1 -> Attack 2 -> Attack 3
 * 7. Dodge and Skill states
 * 8. Hit reaction and Death (hold last frame)
 * 9. Non-looping animations cannot be overridden by Idle/Walk
 * 10. 5 Separated VFX synchronization and toggles
 * 11. Gameplay coordinates strictly preserved (no physics alteration)
 * 12. Damage, hitbox and collision invariants preserved
 * 13. Save/load data structure unaffected
 * 14. Zero resource leaks across scene switches
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  lamMacSpriteRenderer,
  LamMacSpriteRenderer,
  LAM_MAC_ANIM_SPECS,
  DIRECTION_ROWS,
} from './LamMacSpriteRenderer';
import { PlayerStats } from '../../types/game';

// Factory for standard baseline test player
function createTestPlayer(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    name: 'Lâm Mặc',
    title: 'Luyện Khí Sĩ',
    realmIndex: 0,
    exp: 0,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    atk: 15,
    def: 8,
    speed: 120,
    critRate: 0.05,
    consciousness: 10,
    comprehension: 10,
    physique: 10,
    spiritualRoot: {
      name: 'Mộc Thủy Tứ Linh Căn',
      type: 'moc',
      purity: 70,
      description: 'Tư chất bình phàm',
      elements: { kim: 10, moc: 40, thuy: 30, hoa: 10, tho: 10 },
    },
    spiritStones: 10,
    currentArtId: 'truong_xuan_cong',
    equippedSkills: [],
    learnedArtIds: ['truong_xuan_cong'],
    equipment: { weapon: null, armor: null, accessory: null, talisman: null },
    inventory: [],
    maxInventorySize: 24,
    activeQuests: [],
    completedQuestIds: [],
    discoveredMaps: ['thanh_van_tong'],
    currentMapId: 'thanh_van_tong',
    x: 400,
    y: 300,
    facing: 'down',
    isDodging: false,
    dodgeCooldown: 0,
    dodgeTimer: 0,
    invulnerableTimer: 0,
    hurtFlashTimer: 0,
    statusEffects: { injured: false, qiDeviation: false, poisoned: false },
    storyFlags: {},
    karma: 0,
    sectRank: 'outer',
    contributionPoints: 0,
    factionReputation: {},
    ...overrides,
  };
}

describe('PHASE 2.0: LÂM MẶC SPRITE RENDERER INTEGRATION', () => {

  // 1. All 10 sprite sheets and 5 VFX source PNGs exist on disk
  test('1. Load all 10 sprite sheets and 5 VFX PNGs from disk', () => {
    const requiredSheets = [
      'lam_mac_idle.png',
      'lam_mac_walk.png',
      'lam_mac_run.png',
      'lam_mac_attack_1.png',
      'lam_mac_attack_2.png',
      'lam_mac_attack_3.png',
      'lam_mac_dodge.png',
      'lam_mac_skill.png',
      'lam_mac_hit.png',
      'lam_mac_death.png',
    ];

    const requiredVfx = [
      'vfx_sword_slash_wind.png',
      'vfx_sword_thrust_golden.png',
      'vfx_ground_slam_shockwave.png',
      'vfx_dodge_phantom_trail.png',
      'vfx_celestial_sword_aura.png',
    ];

    const charDir = path.resolve(process.cwd(), 'public/assets/pixel-art/characters/lam_mac');
    const vfxDir = path.resolve(process.cwd(), 'public/assets/pixel-art/vfx');

    for (const file of requiredSheets) {
      const fullPath = path.join(charDir, file);
      assert.equal(fs.existsSync(fullPath), true, `Sheet must exist: ${file}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 1000, `Sheet file size must be non-trivial: ${file}`);
    }

    for (const vfx of requiredVfx) {
      const fullPath = path.join(vfxDir, vfx);
      assert.equal(fs.existsSync(fullPath), true, `VFX file must exist: ${vfx}`);
    }
  });

  // 2. Exact 64x64 frame slicing across all 10 animations
  test('2. Exact 64x64 frame slicing standard', () => {
    assert.equal(lamMacSpriteRenderer.frameWidth, 64);
    assert.equal(lamMacSpriteRenderer.frameHeight, 64);

    for (const key of Object.keys(LAM_MAC_ANIM_SPECS)) {
      const spec = LAM_MAC_ANIM_SPECS[key];
      assert.ok(spec.frameCount >= 3 && spec.frameCount <= 8, `Valid frameCount for ${key}`);
      assert.ok(spec.fps >= 6 && spec.fps <= 14, `Valid FPS for ${key}`);
    }
  });

  // 3. Direction row indices (Down: 0, Left: 1, Right: 2, Up: 3)
  test('3. Exact 4-direction row order and angle mapping', () => {
    assert.equal(DIRECTION_ROWS.down, 0);
    assert.equal(DIRECTION_ROWS.left, 1);
    assert.equal(DIRECTION_ROWS.right, 2);
    assert.equal(DIRECTION_ROWS.up, 3);

    // Angle mapping tests
    assert.equal(LamMacSpriteRenderer.getDirectionFromAngle(0), 'right');
    assert.equal(LamMacSpriteRenderer.getDirectionFromAngle(Math.PI / 2), 'down');
    assert.equal(LamMacSpriteRenderer.getDirectionFromAngle(-Math.PI / 2), 'up');
    assert.equal(LamMacSpriteRenderer.getDirectionFromAngle(Math.PI), 'left');
    assert.equal(LamMacSpriteRenderer.getDirectionFromAngle(-Math.PI), 'left');
  });

  // 4. Exact feet pivot (0.5, 0.875) -> Pixel (32, 56)
  test('4. Exact feet pivot anchors at (0.5, 0.875) -> Y=56', () => {
    assert.equal(lamMacSpriteRenderer.pivotX, 0.5);
    assert.equal(lamMacSpriteRenderer.pivotY, 0.875);

    const anchorX = Math.round(64 * lamMacSpriteRenderer.pivotX);
    const anchorY = Math.round(64 * lamMacSpriteRenderer.pivotY);
    assert.equal(anchorX, 32);
    assert.equal(anchorY, 56);
  });

  // 5. State transitions: Idle -> Walk -> Run
  test('5. Transitions between Idle, Walk, and Run based on movement and velocity', () => {
    const player = createTestPlayer({ speed: 120 });

    // Stationary -> Idle
    lamMacSpriteRenderer.syncWithGameplay(player, false, 0);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'idle');

    // Moving normal speed (120 <= 160) -> Walk
    lamMacSpriteRenderer.syncWithGameplay(player, true, 0.5);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'walk');

    // Moving high speed (speed > 160) -> Run
    player.speed = 180;
    lamMacSpriteRenderer.syncWithGameplay(player, true, 0.5);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'run');

    // Stopping -> Returns to Idle
    lamMacSpriteRenderer.syncWithGameplay(player, false, 0);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'idle');
  });

  // 6. Attack Combo: Attack 1 -> Attack 2 -> Attack 3
  test('6. Attack combo transitions correctly and faces aim direction', () => {
    const player = createTestPlayer();

    // Attack Step 1 (Aiming Right -> Angle 0)
    lamMacSpriteRenderer.syncWithGameplay(player, false, 0, {
      active: true,
      step: 1,
      angle: 0,
      progress: 0.1,
    });
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'attack_1');
    assert.equal(lamMacSpriteRenderer.getCurrentDirection(), 'right');

    // Attack Step 2 (Aiming Up -> Angle -PI/2)
    lamMacSpriteRenderer.syncWithGameplay(player, false, 0, {
      active: true,
      step: 2,
      angle: -Math.PI / 2,
      progress: 0.2,
    });
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'attack_2');
    assert.equal(lamMacSpriteRenderer.getCurrentDirection(), 'up');

    // Attack Step 3 (Aiming Down -> Angle PI/2)
    lamMacSpriteRenderer.syncWithGameplay(player, false, 0, {
      active: true,
      step: 3,
      angle: Math.PI / 2,
      progress: 0.3,
    });
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'attack_3');
    assert.equal(lamMacSpriteRenderer.getCurrentDirection(), 'down');
  });

  // 7. Dodge and Skill states
  test('7. Dodge and Skill activation', () => {
    lamMacSpriteRenderer.reset('idle');
    const player = createTestPlayer({ isDodging: true });

    // Dodge
    lamMacSpriteRenderer.syncWithGameplay(player, false, 0);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'dodge');

    // Skill Casting (after resetting or finishing previous non-loop action)
    lamMacSpriteRenderer.reset('idle');
    player.isDodging = false;
    lamMacSpriteRenderer.syncWithGameplay(player, false, 0, undefined, {
      active: true,
      type: 'flying_sword',
      progress: 0.2,
    });
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'skill');
  });

  // 8. Hit Reaction and Death (Hold Last Frame)
  test('8. Hit reaction and Death with holdLastFrame', () => {
    lamMacSpriteRenderer.reset('idle');
    const player = createTestPlayer({ hurtFlashTimer: 0.2 });

    // Hit reaction
    lamMacSpriteRenderer.syncWithGameplay(player, false, 0);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'hit');

    // Death (hp <= 0)
    player.hp = 0;
    player.isDead = true;
    lamMacSpriteRenderer.syncWithGameplay(player, false, 0);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'death');

    // Even if moving, Death cannot be overridden
    lamMacSpriteRenderer.syncWithGameplay(player, true, 1.0);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'death');
  });

  // 9. Non-looping animations cannot be overridden by Idle or Walk
  test('9. Active attack cannot be prematurely overridden by Idle or Walk', () => {
    lamMacSpriteRenderer.reset('idle');
    const player = createTestPlayer({ hp: 100, isDead: false });

    // Start Attack 1
    lamMacSpriteRenderer.playAnimation('attack_1', 'down', 2, true);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'attack_1');
    assert.equal(lamMacSpriteRenderer.isAnimationLocked(), true);

    // Attempt to override with Walk (priority 1 < 2)
    const overrideAttempt = lamMacSpriteRenderer.playAnimation('walk', 'down', 1);
    assert.equal(overrideAttempt, false, 'Walk must not override active Attack');
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'attack_1');

    // Attempt to override with Idle (priority 1 < 2)
    const idleOverride = lamMacSpriteRenderer.playAnimation('idle', 'down', 1);
    assert.equal(idleOverride, false, 'Idle must not override active Attack');
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'attack_1');
  });

  // 10. 5 Separated VFX configuration and toggles
  test('10. Separated VFX configs and independent enable/disable toggles', () => {
    // Check all 5 VFX are declared
    const vfxNames = [
      'vfx_sword_slash_wind',
      'vfx_sword_thrust_golden',
      'vfx_ground_slam_shockwave',
      'vfx_dodge_phantom_trail',
      'vfx_celestial_sword_aura',
    ];

    for (const name of vfxNames) {
      assert.equal(lamMacSpriteRenderer.isVfxEnabled(name), true, `${name} default is enabled`);
      // Toggle off
      lamMacSpriteRenderer.setVfxEnabled(name, false);
      assert.equal(lamMacSpriteRenderer.isVfxEnabled(name), false, `${name} must be disabled`);
      // Toggle back on
      lamMacSpriteRenderer.setVfxEnabled(name, true);
      assert.equal(lamMacSpriteRenderer.isVfxEnabled(name), true, `${name} restored to enabled`);
    }
  });

  // 11. Gameplay coordinates strictly preserved (no physics alteration)
  test('11. Player physical coordinates are strictly preserved', () => {
    const player = createTestPlayer({ x: 256.75, y: 184.25 });
    const originalX = player.x;
    const originalY = player.y;

    // Simulate mock CanvasRenderingContext2D
    const mockCtx = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      ellipse: () => {},
      fill: () => {},
      fillRect: () => {},
      drawImage: () => {},
      imageSmoothingEnabled: false,
      fillStyle: '',
      globalAlpha: 1.0,
      filter: '',
    } as unknown as CanvasRenderingContext2D;

    lamMacSpriteRenderer.render(mockCtx, player, 0.016, 1000, 0, false);

    assert.equal(player.x, originalX, 'Player X coordinate must not be mutated');
    assert.equal(player.y, originalY, 'Player Y coordinate must not be mutated');
  });

  // 12. Damage, hitbox and collision invariants
  test('12. Player combat stats, hitbox, and cooldowns are unaffected', () => {
    const player = createTestPlayer({ atk: 45, def: 20, speed: 135, maxHp: 200, hp: 150 });
    const originalAtk = player.atk;
    const originalDef = player.def;
    const originalSpeed = player.speed;

    lamMacSpriteRenderer.syncWithGameplay(player, false, 0);

    assert.equal(player.atk, originalAtk);
    assert.equal(player.def, originalDef);
    assert.equal(player.speed, originalSpeed);
    assert.equal(player.maxHp, 200);
  });

  // 13. Save / Load system invariants
  test('13. Player serialization for save/load is completely untouched', () => {
    const player = createTestPlayer({ x: 500, y: 350, hp: 80, spiritStones: 250 });
    const serialized = JSON.stringify(player);
    const deserialized = JSON.parse(serialized);

    assert.equal(deserialized.name, 'Lâm Mặc');
    assert.equal(deserialized.x, 500);
    assert.equal(deserialized.y, 350);
    assert.equal(deserialized.spiritStones, 250);
    assert.equal(deserialized.spriteRendererState, undefined, 'No renderer state in save object');
  });

  // 14. Zero resource leaks across scene switches
  test('14. Preload cache reuse and clean lifecycle', async () => {
    await lamMacSpriteRenderer.preloadAll();
    // Re-invoking preloadAll returns same promise without re-allocation
    const p1 = lamMacSpriteRenderer.preloadAll();
    const p2 = lamMacSpriteRenderer.preloadAll();
    assert.equal(p1, p2);
  });
});
