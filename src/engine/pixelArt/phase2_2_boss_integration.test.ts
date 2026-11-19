/**
 * PHASE 2.2 – BOSS BẠCH MAO VIÊN HẦU (白毛猿猴) VALIDATION & INTEGRATION TESTS
 * Project: Phàm Trần Tiên Lộ (凡尘仙路)
 *
 * Verifies:
 *  1. All 9 Boss PNG sprite sheets (128x128 frames, 4 rows) + 6 VFX sheets + preview.png + metadata.json exist on disk
 *  2. Exact PNG dimensions match BOSS_ANIM_SPECS, BOSS_VFX_SPECS, and metadata.json
 *  3. True transparent background, zero border pixel overflow across every cell, non-cloned motion frames
 *  4. Normalized feet pivot (0.5, 0.90) -> pixel (64, 115) & row order [down, left, right, up]
 *  5. Strict Boss routing (shape === 'ape_boss' / Bạch Mao Viên Hầu -> true; Dã Lang, Dã Trư, Ma Đồ, other bosses -> false)
 *  6. Full 9-state Boss AI synchronization (idle, walk, run, attack_1, attack_2, attack_3, skill, hit, death) & 4 directions
 *  7. Dedicated Skill VFX triggers, Phase 2 Enrage looping aura, Boss corpse hold window, Stun/Hit overrides
 *  8. Campaign placement in map_linh_vu, Boss Collection entry, zero coordinate/stat mutation, & Phase 2.0/2.1 non-interference
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import {
  bossSpriteRenderer,
  BossSpriteRenderer,
  BOSS_ANIM_SPECS,
  BOSS_VFX_SPECS,
  BossAnimKey,
  BossVfxKey,
} from './BossSpriteRenderer';
import { DIRECTION_ROWS, lamMacSpriteRenderer } from './LamMacSpriteRenderer';
import { monsterSpriteRenderer } from './MonsterSpriteRenderer';
import { GAME_MAPS } from '../../data/maps';
import { BOSS_COLLECTION } from '../../data/collection';
import { Enemy } from '../../types/game';

const BOSS_DIR = path.resolve(process.cwd(), 'public/assets/pixel-art/bosses/bach_mao_vien_hau');
const VFX_DIR = path.resolve(process.cwd(), 'public/assets/pixel-art/vfx/bach_mao_vien_hau');

function createApeBoss(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'test_bach_mao_01',
    name: 'Bạch Mao Viên Hầu',
    bossTitle: 'Linh Vụ Yêu Tôn (Lĩnh Chủ)',
    category: 'boss',
    realmName: 'Luyện Khí Tầng 5 (Lĩnh Chủ)',
    realmLevel: 6,
    isBoss: true,
    bossPhase: 1,
    hp: 2400,
    maxHp: 2400,
    atk: 88,
    def: 46,
    speed: 122,
    attackRange: 85,
    aggroRange: 270,
    leashRange: 500,
    attackCooldown: 1.9,
    expReward: 900,
    spiritStonesReward: 220,
    dropTable: [],
    tintColor: '#e2e8f0',
    shape: 'ape_boss',
    width: 84,
    height: 92,
    radius: 38,
    x: 1180,
    y: 200,
    state: 'idle',
    attackTimer: 1.5,
    windupTimer: 0,
    hurtTimer: 0,
    ...overrides,
  } as Enemy;
}

function createMockCtx(): CanvasRenderingContext2D {
  return {
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    ellipse: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    translate: () => {},
    rotate: () => {},
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

describe('PHASE 2.2: BOSS BẠCH MAO VIÊN HẦU VALIDATION & INTEGRATION', () => {
  test('1. All 9 Boss PNG sheets, 6 VFX sheets, preview.png, and metadata.json exist on disk', () => {
    assert.equal(fs.existsSync(BOSS_DIR), true, 'Boss directory missing');
    assert.equal(fs.existsSync(VFX_DIR), true, 'Boss VFX directory missing');
    assert.equal(fs.existsSync(path.join(BOSS_DIR, 'metadata.json')), true, 'Boss metadata.json missing');
    assert.equal(fs.existsSync(path.join(BOSS_DIR, 'preview.png')), true, 'Boss preview.png missing');

    for (const animKey of Object.keys(BOSS_ANIM_SPECS) as BossAnimKey[]) {
      const p = path.join(BOSS_DIR, BOSS_ANIM_SPECS[animKey].file);
      assert.equal(fs.existsSync(p), true, `Missing Boss sheet: ${animKey}`);
      assert.ok(fs.statSync(p).size > 5000, `Boss sheet too small: ${animKey}`);
    }

    for (const vfxKey of Object.keys(BOSS_VFX_SPECS) as BossVfxKey[]) {
      const p = path.join(VFX_DIR, BOSS_VFX_SPECS[vfxKey].file);
      assert.equal(fs.existsSync(p), true, `Missing Boss VFX sheet: ${vfxKey}`);
      assert.ok(fs.statSync(p).size > 2000, `Boss VFX sheet too small: ${vfxKey}`);
    }
  });

  test('2. Exact Boss & VFX PNG dimensions match BOSS_ANIM_SPECS, BOSS_VFX_SPECS, and metadata.json', async () => {
    const metadata = JSON.parse(fs.readFileSync(path.join(BOSS_DIR, 'metadata.json'), 'utf8'));
    assert.equal(metadata.standardFrameWidth, 128);
    assert.equal(metadata.standardFrameHeight, 128);
    assert.deepEqual(metadata.directionOrder, ['down', 'left', 'right', 'up']);
    assert.deepEqual(metadata.normalizedPivot, { x: 0.5, y: 0.90 });
    assert.deepEqual(metadata.pixelPivot, { x: 64, y: 115 });

    for (const animKey of Object.keys(BOSS_ANIM_SPECS) as BossAnimKey[]) {
      const spec = BOSS_ANIM_SPECS[animKey];
      const metaAnim = metadata.animations[animKey];
      assert.ok(metaAnim, `Missing metadata animation: ${animKey}`);
      assert.equal(metaAnim.frameCount, spec.frameCount);
      assert.equal(metaAnim.fps, spec.fps);
      assert.equal(metaAnim.loop, spec.loop);

      const pngMeta = await sharp(path.join(BOSS_DIR, spec.file)).metadata();
      assert.equal(pngMeta.width, spec.frameCount * 128, `${spec.file} width mismatch`);
      assert.equal(pngMeta.height, 4 * 128, `${spec.file} height mismatch`);
      assert.equal(metaAnim.imageWidth, pngMeta.width);
      assert.equal(metaAnim.imageHeight, pngMeta.height);
    }

    for (const vfxKey of Object.keys(BOSS_VFX_SPECS) as BossVfxKey[]) {
      const spec = BOSS_VFX_SPECS[vfxKey];
      const metaVfx = metadata.vfx[vfxKey];
      assert.ok(metaVfx, `Missing metadata VFX: ${vfxKey}`);
      const pngMeta = await sharp(path.join(VFX_DIR, spec.file)).metadata();
      assert.equal(pngMeta.width, spec.frameCount * spec.frameWidth, `${spec.file} width mismatch`);
      assert.equal(pngMeta.height, spec.frameHeight, `${spec.file} height mismatch`);
    }
  });

  test('3. Clean transparent alpha channel, zero border pixel overflow, and distinct animation frames', async () => {
    for (const animKey of Object.keys(BOSS_ANIM_SPECS) as BossAnimKey[]) {
      const spec = BOSS_ANIM_SPECS[animKey];
      const { data, info } = await sharp(path.join(BOSS_DIR, spec.file))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { width } = info;
      let transparentPixels = 0;
      let opaquePixels = 0;
      let borderOverflowCount = 0;

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < spec.frameCount; c++) {
          let cellOpaque = 0;
          for (let ly = 0; ly < 128; ly++) {
            for (let lx = 0; lx < 128; lx++) {
              const gx = c * 128 + lx;
              const gy = r * 128 + ly;
              const alpha = data[(gy * width + gx) * 4 + 3];
              if (alpha === 0) {
                transparentPixels++;
              } else {
                opaquePixels++;
                cellOpaque++;
                if (lx === 0 || lx === 127 || ly === 0 || ly === 127) {
                  borderOverflowCount++;
                }
              }
            }
          }
          assert.ok(cellOpaque > 100, `Empty cell at ${spec.file} row=${r} col=${c}`);
        }
      }

      assert.ok(transparentPixels > opaquePixels, `Background must be transparent in ${spec.file}`);
      assert.equal(borderOverflowCount, 0, `Border overflow pixels found in ${spec.file}`);

      // Ensure frames inside row 0 are genuinely animated (not static clones)
      let diff = 0;
      const compareCol = Math.min(2, spec.frameCount - 1);
      for (let ly = 0; ly < 128; ly++) {
        for (let lx = 0; lx < 128; lx++) {
          const i0 = (ly * width + lx) * 4;
          const iN = (ly * width + (compareCol * 128 + lx)) * 4;
          if (data[i0] !== data[iN] || data[i0 + 1] !== data[iN + 1] || data[i0 + 2] !== data[iN + 2] || data[i0 + 3] !== data[iN + 3]) {
            diff++;
          }
        }
      }
      assert.ok(diff > 40, `Boss frames appear statically cloned in ${spec.file} (diff=${diff})`);
    }

    for (const vfxKey of Object.keys(BOSS_VFX_SPECS) as BossVfxKey[]) {
      const spec = BOSS_VFX_SPECS[vfxKey];
      const { data, info } = await sharp(path.join(VFX_DIR, spec.file))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { width } = info;
      let diff = 0;
      for (let ly = 0; ly < spec.frameHeight; ly++) {
        for (let lx = 0; lx < spec.frameWidth; lx++) {
          const i0 = (ly * width + lx) * 4;
          const iN = (ly * width + (spec.frameWidth + lx)) * 4;
          if (data[i0] !== data[iN] || data[i0 + 1] !== data[iN + 1] || data[i0 + 2] !== data[iN + 2] || data[i0 + 3] !== data[iN + 3]) {
            diff++;
          }
        }
      }
      assert.ok(diff > 25, `Boss VFX frames appear cloned in ${spec.file} (diff=${diff})`);
    }
  });

  test('4. Normalized feet pivot (0.5, 0.90) -> (64, 115) & 4-direction row order', () => {
    assert.equal(DIRECTION_ROWS.down, 0);
    assert.equal(DIRECTION_ROWS.left, 1);
    assert.equal(DIRECTION_ROWS.right, 2);
    assert.equal(DIRECTION_ROWS.up, 3);
    assert.equal(bossSpriteRenderer.frameWidth, 128);
    assert.equal(bossSpriteRenderer.frameHeight, 128);
    assert.equal(bossSpriteRenderer.pivotX, 0.5);
    assert.equal(bossSpriteRenderer.pivotY, 0.90);
    assert.equal(Math.round(128 * bossSpriteRenderer.pivotX), 64);
    assert.equal(Math.round(128 * bossSpriteRenderer.pivotY), 115);
  });

  test('5. Strict routing: only Bạch Mao Viên Hầu / ape_boss uses BossSpriteRenderer', () => {
    assert.equal(BossSpriteRenderer.supportsEnemy(createApeBoss()), true);
    assert.equal(BossSpriteRenderer.supportsEnemy(createApeBoss({ shape: 'monkey', name: 'Bạch Mao Viên Hầu' })), true);

    // Other enemies & legacy bosses must stay cleanly separated
    assert.equal(BossSpriteRenderer.supportsEnemy(createApeBoss({ isBoss: false, shape: 'wolf', name: 'Dã Lang' })), false);
    assert.equal(BossSpriteRenderer.supportsEnemy(createApeBoss({ isBoss: false, shape: 'boar', name: 'Dã Trư' })), false);
    assert.equal(BossSpriteRenderer.supportsEnemy(createApeBoss({ isBoss: false, shape: 'cultist', name: 'Hắc Sát Ma Đồ' })), false);
    assert.equal(BossSpriteRenderer.supportsEnemy(createApeBoss({ shape: 'boar', name: 'Thiết Bì Trư Vương' })), false);
    assert.equal(BossSpriteRenderer.supportsEnemy(createApeBoss({ shape: 'scorpion_king', name: 'Ma Linh Hạt Vương' })), false);
  });

  test('6. Full 9-animation AI state sync across 4 directions, Phase 2 Enrage & VFX triggers', () => {
    bossSpriteRenderer.clearInstances();
    const boss = createApeBoss({ x: 1180, y: 200 });

    // Idle
    let inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, 1180, 340)!;
    assert.equal(inst.currentAnimKey, 'idle');

    // Walk patrol across 4 directions
    boss.state = 'patrol';
    boss.x -= 6;
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, 1180, 340)!;
    assert.equal(inst.currentAnimKey, 'walk');
    assert.equal(inst.currentDirection, 'left');

    boss.x += 8;
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, 1180, 340)!;
    assert.equal(inst.currentAnimKey, 'walk');
    assert.equal(inst.currentDirection, 'right');

    boss.y -= 8;
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, 1180, 340)!;
    assert.equal(inst.currentAnimKey, 'walk');
    assert.equal(inst.currentDirection, 'up');

    boss.y += 8;
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, 1180, 340)!;
    assert.equal(inst.currentAnimKey, 'walk');
    assert.equal(inst.currentDirection, 'down');

    // Run chase
    boss.state = 'chase';
    boss.x += 12;
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, boss.x + 120, boss.y)!;
    assert.equal(inst.currentAnimKey, 'run');
    assert.equal(inst.currentDirection, 'right');

    // Attack 1 (Thiết Chưởng)
    boss.state = 'attack_windup';
    boss.bossAttackPattern = 'melee';
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, boss.x, boss.y + 80)!;
    assert.equal(inst.currentAnimKey, 'attack_1');
    assert.equal(inst.currentDirection, 'down');
    assert.equal(inst.isLocked, true);

    // Attack 2 (Cuồng Nộ Liên Kích)
    boss.bossAttackPattern = 'combo';
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, boss.x - 80, boss.y)!;
    assert.equal(inst.currentAnimKey, 'attack_2');
    assert.equal(inst.currentDirection, 'left');

    // Attack 3 (Cuồng Bạo Xung Kích) + active charge VFX
    boss.bossAttackPattern = 'charge';
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, boss.x, boss.y - 100)!;
    assert.equal(inst.currentAnimKey, 'attack_3');
    assert.equal(inst.currentDirection, 'up');
    boss.state = 'attacking';
    boss.chargeState = {
      startX: boss.x,
      startY: boss.y,
      targetX: boss.x,
      targetY: boss.y - 160,
      duration: 0.35,
      elapsed: 0.05,
      speed: 450,
      hasHitPlayer: false,
    };
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, boss.x, boss.y - 100)!;
    assert.equal(inst.currentAnimKey, 'attack_3');
    assert.equal(inst.secondaryVfx.active, true);
    assert.equal(inst.secondaryVfx.key, 'vfx_dia_chan');
    boss.chargeState = undefined;

    // Skill (Bạch Viên Chấn Địa) + gather qi VFX
    boss.state = 'attack_windup';
    boss.bossAttackPattern = 'slam';
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, boss.x, boss.y + 80)!;
    assert.equal(inst.currentAnimKey, 'skill');
    assert.equal(inst.primaryVfx.active, true);
    assert.equal(inst.primaryVfx.key, 'vfx_yeu_khi_tu_luc');

    // Phase 2 Enrage tracking
    boss.bossPhase = 2;
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, boss.x, boss.y + 80)!;
    assert.equal(inst.isEnraged, true);

    // Hit / Stun priority override
    boss.state = 'hurt';
    boss.hurtTimer = 0.25;
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, boss.x, boss.y + 80)!;
    assert.equal(inst.currentAnimKey, 'hit');

    // Death priority override + vfx_boss_death + corpse hold expiry
    boss.hp = 0;
    inst = bossSpriteRenderer.syncWithBossAI(boss, 0.016, boss.x, boss.y + 80)!;
    assert.equal(inst.currentAnimKey, 'death');
    assert.equal(inst.primaryVfx.active, true);
    assert.equal(inst.primaryVfx.key, 'vfx_boss_death');
    assert.equal(bossSpriteRenderer.shouldRenderDead(boss), true);

    for (let i = 0; i < 25; i++) {
      bossSpriteRenderer.syncWithBossAI(boss, 0.08, boss.x, boss.y + 80);
    }
    assert.equal(bossSpriteRenderer.shouldRenderDead(boss), false);
  });

  test('7. Map placement in map_linh_vu, Boss collection lore, non-mutation & Phase 2.0/2.1 isolation', () => {
    const linhVu = GAME_MAPS.map_linh_vu;
    assert.ok(linhVu, 'map_linh_vu must exist');
    const apeSpawner = linhVu.enemySpawners.find(
      s => s.enemyPrototype.shape === 'ape_boss' && s.enemyPrototype.isBoss
    );
    assert.ok(apeSpawner, 'map_linh_vu must spawn Boss Bạch Mao Viên Hầu');
    assert.equal(apeSpawner.enemyPrototype.name, 'Bạch Mao Viên Hầu');
    assert.equal(apeSpawner.count, 1);

    const loreEntry = BOSS_COLLECTION.find(b => b.id === 'boss_bach_mao_vien_hau');
    assert.ok(loreEntry, 'BOSS_COLLECTION must include boss_bach_mao_vien_hau');

    // Non-mutation + Phase 2.0/2.1 isolation
    bossSpriteRenderer.clearInstances();
    lamMacSpriteRenderer.reset('idle', 'down');
    monsterSpriteRenderer.clearInstances();

    const boss = createApeBoss({ id: 'imm_boss', x: 1185.5, y: 205.25, atk: 88, speed: 122 });
    const ctx = createMockCtx();
    const ok = bossSpriteRenderer.render(ctx, boss, 0.016, 1000, 1185, 300);
    assert.equal(ok, true);
    assert.equal(boss.x, 1185.5);
    assert.equal(boss.y, 205.25);
    assert.equal(boss.atk, 88);
    assert.equal(boss.speed, 122);
    assert.equal(lamMacSpriteRenderer.getCurrentAnimKey(), 'idle');
  });

  test('8. Preload promise caching & clean instance cleanup', async () => {
    const p1 = bossSpriteRenderer.preloadAll();
    const p2 = bossSpriteRenderer.preloadAll();
    assert.equal(p1, p2);
    await p1;
    assert.equal(bossSpriteRenderer.hasPreloaded(), true);

    bossSpriteRenderer.clearInstances();
    assert.equal(bossSpriteRenderer.getInstanceState('test_bach_mao_01'), undefined);
  });
});
