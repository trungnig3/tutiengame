/**
 * PHASE 2.1 – NORMAL MONSTER PIXEL ART VALIDATION & INTEGRATION TESTS
 * Project: Phàm Trần Tiên Lộ (凡尘仙路)
 *
 * Verifies:
 *  1. All 15 PNG sprite sheets + 3 metadata.json + 3 preview.png exist on disk
 *  2. Exact dimensions (64x64 frame slicing, 4 rows) match metadata.json
 *  3. True transparent alpha channel, zero border pixel overflow across every cell, non-cloned motion frames
 *  4. Exact normalized feet pivot (0.5, 0.875) -> pixel (32, 56) & row order [down, left, right, up]
 *  5. Normal monster routing (wolf -> da_lang, boar -> da_tru, cultist -> ma_do) & boss/fallback preservation
 *  6. 4-direction AI synchronization (Idle, Walk, Attack windup->strike, Hit, Death + holdLastFrame)
 *  7. Priority hierarchy & non-looping animation lock
 *  8. Gameplay coordinates, combat stats, and Phase 2.0 Lâm Mặc non-interference
 *  9. Cache reuse and clean map-switch lifecycle (zero leaks)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import {
  monsterSpriteRenderer,
  MonsterSpriteRenderer,
  MONSTER_ANIM_SPECS,
  NORMAL_MONSTER_IDS,
  NormalMonsterId,
  MonsterAnimKey,
} from './MonsterSpriteRenderer';
import { DIRECTION_ROWS, lamMacSpriteRenderer } from './LamMacSpriteRenderer';
import { Enemy } from '../../types/game';

const MONSTERS_ROOT = path.resolve(process.cwd(), 'public/assets/pixel-art/monsters');

function createTestEnemy(
  shape: Enemy['shape'],
  overrides: Partial<Enemy> = {}
): Enemy {
  return {
    id: `test_${shape}_01`,
    name: shape === 'wolf' ? 'Dã Lang' : shape === 'boar' ? 'Dã Trư' : 'Hắc Sát Ma Đồ',
    realmName: 'Luyện Khí Tầng 1',
    realmLevel: 1,
    hp: 100,
    maxHp: 100,
    atk: 15,
    def: 5,
    speed: 90,
    expReward: 20,
    spiritStonesReward: 5,
    dropTable: [],
    tintColor: '#64748b',
    width: 48,
    height: 48,
    aggroRange: 250,
    attackRange: 50,
    attackCooldown: 1.5,
    element: 'tho',
    shape,
    x: 400,
    y: 300,
    state: 'idle',
    attackTimer: 1.0,
    windupTimer: 0,
    hurtTimer: 0,
    isBoss: false,
    ...overrides,
  };
}

function createMockCtx(): CanvasRenderingContext2D {
  return {
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    ellipse: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    fillText: () => {},
    setLineDash: () => {},
    drawImage: () => {},
    imageSmoothingEnabled: false,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'center',
    globalAlpha: 1,
    filter: '',
  } as unknown as CanvasRenderingContext2D;
}

describe('PHASE 2.1: NORMAL MONSTERS PIXEL ART VALIDATION & INTEGRATION', () => {
  test('1. All 15 sprite sheets, 3 previews, and 3 metadata.json exist on disk', () => {
    const animFiles: MonsterAnimKey[] = ['idle', 'walk', 'attack', 'hit', 'death'];

    for (const monsterId of NORMAL_MONSTER_IDS) {
      const dir = path.join(MONSTERS_ROOT, monsterId);
      assert.equal(fs.existsSync(dir), true, `Monster directory missing: ${monsterId}`);
      assert.equal(fs.existsSync(path.join(dir, 'metadata.json')), true, `metadata.json missing for ${monsterId}`);
      assert.equal(fs.existsSync(path.join(dir, 'preview.png')), true, `preview.png missing for ${monsterId}`);

      for (const anim of animFiles) {
        const pngPath = path.join(dir, `${anim}.png`);
        assert.equal(fs.existsSync(pngPath), true, `Sprite sheet missing: ${monsterId}/${anim}.png`);
        const stat = fs.statSync(pngPath);
        assert.ok(stat.size > 2000, `Sprite sheet too small / corrupt: ${monsterId}/${anim}.png`);
      }
    }
  });

  test('2. Exact PNG dimensions, 64x64 framing, 4 rows, and metadata.json consistency', async () => {
    for (const monsterId of NORMAL_MONSTER_IDS) {
      const dir = path.join(MONSTERS_ROOT, monsterId);
      const metadata = JSON.parse(fs.readFileSync(path.join(dir, 'metadata.json'), 'utf8'));

      assert.equal(metadata.standardFrameWidth, 64);
      assert.equal(metadata.standardFrameHeight, 64);
      assert.deepEqual(metadata.directionOrder, ['down', 'left', 'right', 'up']);
      assert.deepEqual(metadata.normalizedPivot, { x: 0.5, y: 0.875 });
      assert.deepEqual(metadata.pixelPivot, { x: 32, y: 56 });

      for (const animKey of Object.keys(MONSTER_ANIM_SPECS) as MonsterAnimKey[]) {
        const spec = MONSTER_ANIM_SPECS[animKey];
        const metaAnim = metadata.animations[animKey];
        assert.ok(metaAnim, `Missing animation metadata: ${monsterId}.${animKey}`);
        assert.equal(metaAnim.frameCount, spec.frameCount);
        assert.equal(metaAnim.fps, spec.fps);
        assert.equal(metaAnim.loop, spec.loop);

        const pngMeta = await sharp(path.join(dir, spec.file)).metadata();
        assert.equal(pngMeta.width, spec.frameCount * 64, `${monsterId}/${spec.file} width mismatch`);
        assert.equal(pngMeta.height, 4 * 64, `${monsterId}/${spec.file} height mismatch`);
        assert.equal(metaAnim.imageWidth, pngMeta.width);
        assert.equal(metaAnim.imageHeight, pngMeta.height);
      }
    }
  });

  test('3. Transparent alpha channel, zero border pixel overflow, and distinct motion frames', async () => {
    for (const monsterId of NORMAL_MONSTER_IDS) {
      const dir = path.join(MONSTERS_ROOT, monsterId);
      for (const animKey of Object.keys(MONSTER_ANIM_SPECS) as MonsterAnimKey[]) {
        const spec = MONSTER_ANIM_SPECS[animKey];
        const { data, info } = await sharp(path.join(dir, spec.file))
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        const { width, height } = info;
        let transparentPixels = 0;
        let opaquePixels = 0;
        let borderOverflowCount = 0;

        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < spec.frameCount; c++) {
            let cellOpaque = 0;
            for (let ly = 0; ly < 64; ly++) {
              for (let lx = 0; lx < 64; lx++) {
                const gx = c * 64 + lx;
                const gy = r * 64 + ly;
                const alpha = data[(gy * width + gx) * 4 + 3];
                if (alpha === 0) {
                  transparentPixels++;
                } else {
                  opaquePixels++;
                  cellOpaque++;
                  if (lx === 0 || lx === 63 || ly === 0 || ly === 63) {
                    borderOverflowCount++;
                  }
                }
              }
            }
            assert.ok(cellOpaque > 40, `Empty cell detected at ${monsterId}/${spec.file} row=${r} col=${c}`);
          }
        }

        assert.ok(transparentPixels > opaquePixels, `Background must be transparent in ${monsterId}/${spec.file}`);
        assert.equal(borderOverflowCount, 0, `Border overflow pixels detected in ${monsterId}/${spec.file}`);

        // Verify frames inside row 0 are not identical clones
        let diffPixelsBetweenF0AndF2 = 0;
        const compareCol = Math.min(2, spec.frameCount - 1);
        for (let ly = 0; ly < 64; ly++) {
          for (let lx = 0; lx < 64; lx++) {
            const idx0 = (ly * width + lx) * 4;
            const idxN = (ly * width + (compareCol * 64 + lx)) * 4;
            if (
              data[idx0] !== data[idxN] ||
              data[idx0 + 1] !== data[idxN + 1] ||
              data[idx0 + 2] !== data[idxN + 2] ||
              data[idx0 + 3] !== data[idxN + 3]
            ) {
              diffPixelsBetweenF0AndF2++;
            }
          }
        }
        assert.ok(
          diffPixelsBetweenF0AndF2 > 15,
          `Frames look statically cloned in ${monsterId}/${spec.file} (diff=${diffPixelsBetweenF0AndF2})`
        );
      }
    }
  });

  test('4. Direction row order and feet pivot standard match Phase 2.0', () => {
    assert.equal(DIRECTION_ROWS.down, 0);
    assert.equal(DIRECTION_ROWS.left, 1);
    assert.equal(DIRECTION_ROWS.right, 2);
    assert.equal(DIRECTION_ROWS.up, 3);
    assert.equal(monsterSpriteRenderer.frameWidth, 64);
    assert.equal(monsterSpriteRenderer.frameHeight, 64);
    assert.equal(monsterSpriteRenderer.pivotX, 0.5);
    assert.equal(monsterSpriteRenderer.pivotY, 0.875);
    assert.equal(Math.round(64 * monsterSpriteRenderer.pivotX), 32);
    assert.equal(Math.round(64 * monsterSpriteRenderer.pivotY), 56);
  });

  test('5. Shape routing covers 3 normal monsters and preserves fallback for Bosses & other shapes', () => {
    assert.equal(MonsterSpriteRenderer.resolveMonsterId(createTestEnemy('wolf')), 'da_lang');
    assert.equal(MonsterSpriteRenderer.resolveMonsterId(createTestEnemy('boar')), 'da_tru');
    assert.equal(MonsterSpriteRenderer.resolveMonsterId(createTestEnemy('cultist')), 'ma_do');

    // Bosses and non-Phase-2.1 monsters must fall through untouched
    assert.equal(MonsterSpriteRenderer.supportsEnemy(createTestEnemy('ape_boss', { isBoss: true })), false);
    assert.equal(MonsterSpriteRenderer.supportsEnemy(createTestEnemy('wolf', { isBoss: true })), false);
    assert.equal(MonsterSpriteRenderer.supportsEnemy(createTestEnemy('scorpion_king')), false);
    assert.equal(MonsterSpriteRenderer.supportsEnemy(createTestEnemy('ghost_wolf')), false);
  });

  test('6. Full AI state synchronization across 4 directions for Dã Lang, Dã Trư, and Ma Đồ', () => {
    monsterSpriteRenderer.clearInstances();
    const shapes: Array<{ shape: 'wolf' | 'boar' | 'cultist'; expectedId: NormalMonsterId }> = [
      { shape: 'wolf', expectedId: 'da_lang' },
      { shape: 'boar', expectedId: 'da_tru' },
      { shape: 'cultist', expectedId: 'ma_do' },
    ];

    for (const { shape, expectedId } of shapes) {
      const enemy = createTestEnemy(shape, { id: `ai_${shape}`, x: 300, y: 300 });

      // Initial idle
      let inst = monsterSpriteRenderer.syncWithEnemyAI(enemy, 0.016, 300, 400)!;
      assert.equal(inst.monsterId, expectedId);
      assert.equal(inst.currentAnimKey, 'idle');

      // Walk Left (-X)
      enemy.x -= 6;
      enemy.state = 'patrol';
      inst = monsterSpriteRenderer.syncWithEnemyAI(enemy, 0.016, 300, 400)!;
      assert.equal(inst.currentAnimKey, 'walk');
      assert.equal(inst.currentDirection, 'left');

      // Walk Right (+X)
      enemy.x += 8;
      inst = monsterSpriteRenderer.syncWithEnemyAI(enemy, 0.016, 300, 400)!;
      assert.equal(inst.currentAnimKey, 'walk');
      assert.equal(inst.currentDirection, 'right');

      // Walk Up (-Y)
      enemy.y -= 8;
      inst = monsterSpriteRenderer.syncWithEnemyAI(enemy, 0.016, 300, 400)!;
      assert.equal(inst.currentAnimKey, 'walk');
      assert.equal(inst.currentDirection, 'up');

      // Walk Down (+Y)
      enemy.y += 8;
      inst = monsterSpriteRenderer.syncWithEnemyAI(enemy, 0.016, 300, 400)!;
      assert.equal(inst.currentAnimKey, 'walk');
      assert.equal(inst.currentDirection, 'down');

      // Attack Windup -> locks Attack toward player (player to the right)
      enemy.state = 'attack_windup';
      enemy.windupTimer = 0.38;
      inst = monsterSpriteRenderer.syncWithEnemyAI(enemy, 0.016, enemy.x + 60, enemy.y)!;
      assert.equal(inst.currentAnimKey, 'attack');
      assert.equal(inst.currentDirection, 'right');
      assert.equal(inst.isLocked, true);

      // Even when AI flips back to 'chase' after windup expires, attack continues until its frames complete
      enemy.state = 'chase';
      inst = monsterSpriteRenderer.syncWithEnemyAI(enemy, 0.016, enemy.x + 60, enemy.y)!;
      assert.equal(inst.currentAnimKey, 'attack');

      // Hit Reaction (Priority 4 overrides Attack Priority 2)
      enemy.hurtTimer = 0.25;
      inst = monsterSpriteRenderer.syncWithEnemyAI(enemy, 0.016, enemy.x + 60, enemy.y)!;
      assert.equal(inst.currentAnimKey, 'hit');

      // Death (Priority 5 overrides Hit)
      enemy.hp = 0;
      inst = monsterSpriteRenderer.syncWithEnemyAI(enemy, 0.016, enemy.x + 60, enemy.y)!;
      assert.equal(inst.currentAnimKey, 'death');
      assert.equal(monsterSpriteRenderer.shouldRenderDead(enemy), true);

      // Advance past death hold visibility window -> hides corpse cleanly
      for (let t = 0; t < 20; t++) {
        monsterSpriteRenderer.syncWithEnemyAI(enemy, 0.08, enemy.x + 60, enemy.y);
      }
      assert.equal(monsterSpriteRenderer.shouldRenderDead(enemy), false);
    }
  });

  test('7. Zero mutation of enemy gameplay coordinates/stats and Phase 2.0 non-interference', () => {
    monsterSpriteRenderer.clearInstances();
    lamMacSpriteRenderer.reset('idle', 'down');

    const enemy = createTestEnemy('boar', { id: 'stat_boar', x: 512.5, y: 384.25, atk: 24, attackCooldown: 2.0 });
    const mockCtx = createMockCtx();

    const rendered = monsterSpriteRenderer.render(mockCtx, enemy, 0.016, 1000, 480, 380);
    assert.equal(rendered, true);
    assert.equal(enemy.x, 512.5);
    assert.equal(enemy.y, 384.25);
    assert.equal(enemy.atk, 24);
    assert.equal(enemy.attackCooldown, 2.0);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'idle');
  });

  test('8. Preload promise caching and clean instance lifecycle', async () => {
    const p1 = monsterSpriteRenderer.preloadAll();
    const p2 = monsterSpriteRenderer.preloadAll();
    assert.equal(p1, p2);
    await p1;
    assert.equal(monsterSpriteRenderer.hasPreloaded(), true);

    monsterSpriteRenderer.clearInstances();
    assert.equal(monsterSpriteRenderer.getInstanceState('ai_wolf'), undefined);
  });
});
