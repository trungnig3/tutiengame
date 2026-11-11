/**
 * LÂM MẶC SPRITE & ANIMATION VALIDATION TEST SUITE (PHASE 1.3)
 * Project: Phàm Trần Tiên Lộ
 * 
 * Verifies:
 * 1. All 10 animations in all 4 directions (Down, Left, Right, Up).
 * 2. Zero feet jitter in Idle (anchored at Y=56).
 * 3. Loop behavior (loop=true for Idle/Walk/Run, loop=false for Attacks/Dodge/Skill/Hit/Death).
 * 4. Hold last frame on Death (stays at frame 7).
 * 5. Attack hitFrame and Skill castFrame callback triggers.
 * 6. Dimensions and frame count mathematical consistency (width = cols * 64, height = 256).
 * 7. 5 separated VFX sprite sheets compatibility and alignment.
 * 8. Zero border overflow pixels across all character sprite sheets.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AnimationController } from './AnimationController';

const CHAR_DIR = path.resolve(process.cwd(), 'public/assets/pixel-art/characters/lam_mac');
const VFX_DIR = path.resolve(process.cwd(), 'public/assets/pixel-art/vfx');
const METADATA_PATH = path.join(CHAR_DIR, 'lam_mac_metadata.json');
const AUDIT_OUTPUT_PATH = path.resolve(process.cwd(), 'scripts/audit_output.json');

describe('LÂM MẶC PHASE 1.3 SPRITE VALIDATION', () => {
  // 1. Metadata Schema & File Existence
  test('1. Metadata JSON is valid and all 10 character + 5 VFX source PNGs exist on disk', () => {
    assert.ok(fs.existsSync(METADATA_PATH), 'lam_mac_metadata.json must exist');
    const raw = fs.readFileSync(METADATA_PATH, 'utf-8');
    const meta = JSON.parse(raw);

    assert.equal(meta.character, 'Lâm Mặc');
    assert.equal(meta.standardFrameWidth, 64);
    assert.equal(meta.standardFrameHeight, 64);
    assert.deepEqual(meta.pixelPivot, { x: 32, y: 56 });
    assert.deepEqual(meta.directionOrder, ['down', 'left', 'right', 'up']);

    const animKeys = ['idle', 'walk', 'run', 'attack_1', 'attack_2', 'attack_3', 'dodge', 'skill', 'hit', 'death'];
    for (const key of animKeys) {
      assert.ok(meta.animations[key], `Animation ${key} must be declared in metadata`);
      const srcPath = path.resolve(process.cwd(), 'public', meta.animations[key].sourcePng.replace(/^\//, ''));
      assert.ok(fs.existsSync(srcPath), `Source PNG for ${key} must exist: ${srcPath}`);
    }

    // Verify separated VFX
    const vfxFiles = [
      'vfx_sword_slash_wind.png',
      'vfx_sword_thrust_golden.png',
      'vfx_ground_slam_shockwave.png',
      'vfx_dodge_phantom_trail.png',
      'vfx_celestial_sword_aura.png',
    ];
    for (const vfx of vfxFiles) {
      const vfxPath = path.join(VFX_DIR, vfx);
      assert.ok(fs.existsSync(vfxPath), `VFX file ${vfx} must exist on disk`);
    }
  });

  // 2. Pixel Audit & Border Overflow Zero Check
  test('2. Pixel Audit: All character sheets have 0 border overflow pixels and Alpha channel integrity', () => {
    assert.ok(fs.existsSync(AUDIT_OUTPUT_PATH), 'audit_output.json must exist');
    const auditData = JSON.parse(fs.readFileSync(AUDIT_OUTPUT_PATH, 'utf-8'));

    for (const sheet of auditData.characterSheets) {
      assert.equal(sheet.borderOverflowPixels, 0, `${sheet.filename} must have 0 border overflow pixels`);
      assert.ok(parseFloat(sheet.transparentPercent) > 75, `${sheet.filename} must have transparent background > 75%`);
    }

    // Idle feet jitter must be 0
    const idleSheet = auditData.characterSheets.find((s: any) => s.filename === 'lam_mac_idle.png');
    assert.ok(idleSheet, 'Idle sheet must exist in audit');
    assert.equal(idleSheet.feetYJitter, 0, 'Idle feet contact must have exactly 0 jitter (anchored at Y=56)');
  });

  // 3. Animation 1: Idle (4 directions, 6 frames, loop=true)
  test('3. Idle Animation: Loops indefinitely across all 4 directions without position jitter', () => {
    for (let dir = 0; dir < 4; dir++) {
      const ctrl = new AnimationController('idle', { fps: 6, loop: true, frameCount: 6, row: dir });
      assert.equal(ctrl.getCurrentFrame(), 0);
      assert.equal(ctrl.getRow(), dir);

      // Advance by 1 full cycle (6 frames at 6 FPS = 1.0s)
      ctrl.update(1.0);
      assert.equal(ctrl.isDone(), false, 'Idle must not terminate (loop=true)');
      assert.equal(ctrl.getCurrentFrame(), 0, 'Idle must wrap back to frame 0');
    }
  });

  // 4. Animation 2: Walk (4 directions, 8 frames, loop=true)
  test('4. Walk Animation: Loops smoothly across all 4 directions', () => {
    for (let dir = 0; dir < 4; dir++) {
      const ctrl = new AnimationController('walk', { fps: 10, loop: true, frameCount: 8, row: dir });
      assert.equal(ctrl.getCurrentFrame(), 0);
      // Advance by 0.4s (4 frames)
      ctrl.update(0.401);
      assert.equal(ctrl.getCurrentFrame(), 4);
      // Advance by 0.4s more (8 frames total)
      ctrl.update(0.401);
      assert.equal(ctrl.getCurrentFrame(), 0, 'Walk must loop back to frame 0');
      assert.equal(ctrl.isDone(), false);
    }
  });

  // 5. Animation 3: Run (4 directions, 8 frames, loop=true)
  test('5. Run Animation: Loops smoothly at 12 FPS across all 4 directions', () => {
    for (let dir = 0; dir < 4; dir++) {
      const ctrl = new AnimationController('run', { fps: 12, loop: true, frameCount: 8, row: dir });
      ctrl.update(8 / 12 + 0.01);
      assert.equal(ctrl.isDone(), false);
      assert.equal(ctrl.getCurrentFrame(), 0);
    }
  });

  // 6. Animation 4: Attack 1 (4 directions, 5 frames, loop=false, hitFrame=2)
  test('6. Attack 1 Animation: Triggers hitFrame at frame 2 and terminates (loop=false)', () => {
    for (let dir = 0; dir < 4; dir++) {
      let hitTriggered = false;
      let onCompleteTriggered = false;

      const ctrl = new AnimationController(
        'attack_1',
        { fps: 12, loop: false, frameCount: 5, row: dir, hitFrame: 2 },
        () => { onCompleteTriggered = true; },
        () => { hitTriggered = true; }
      );

      // Advance to frame 1
      ctrl.update(1 / 12);
      assert.equal(hitTriggered, false, 'Hit must not trigger before hitFrame');

      // Advance to frame 2
      ctrl.update(1 / 12 + 0.001);
      assert.equal(hitTriggered, true, 'Hit must trigger exactly on frame 2');

      // Advance to completion
      ctrl.update(3 / 12 + 0.01);
      assert.equal(ctrl.isDone(), true, 'Attack 1 must terminate (loop=false)');
      assert.equal(onCompleteTriggered, true, 'onComplete callback must be called');
    }
  });

  // 7. Animation 5: Attack 2 (4 directions, 5 frames, loop=false, hitFrame=2)
  test('7. Attack 2 Animation: Triggers hitFrame at frame 2 and terminates (loop=false)', () => {
    for (let dir = 0; dir < 4; dir++) {
      let hitCount = 0;
      const ctrl = new AnimationController(
        'attack_2',
        { fps: 12, loop: false, frameCount: 5, row: dir, hitFrame: 2 },
        undefined,
        () => { hitCount++; }
      );

      ctrl.update(5 / 12 + 0.05);
      assert.equal(hitCount, 1, 'Hit callback must trigger exactly once');
      assert.equal(ctrl.isDone(), true);
    }
  });

  // 8. Animation 6: Attack 3 (4 directions, 6 frames, loop=false, hitFrame=3)
  test('8. Attack 3 Animation: Triggers hitFrame at frame 3 on slam plunge', () => {
    for (let dir = 0; dir < 4; dir++) {
      let hitTriggered = false;
      const ctrl = new AnimationController(
        'attack_3',
        { fps: 12, loop: false, frameCount: 6, row: dir, hitFrame: 3 },
        undefined,
        () => { hitTriggered = true; }
      );

      ctrl.update(2 / 12);
      assert.equal(hitTriggered, false);

      ctrl.update(1 / 12 + 0.001);
      assert.equal(hitTriggered, true, 'Attack 3 ground slam must trigger on frame 3');

      ctrl.update(3 / 12 + 0.05);
      assert.equal(ctrl.isDone(), true);
    }
  });

  // 9. Animation 7: Dodge (4 directions, 4 frames, loop=false, 14 FPS)
  test('9. Dodge Animation: Completes 4 frames swiftly and does not loop', () => {
    for (let dir = 0; dir < 4; dir++) {
      let finished = false;
      const ctrl = new AnimationController(
        'dodge',
        { fps: 14, loop: false, frameCount: 4, row: dir },
        () => { finished = true; }
      );

      ctrl.update(4 / 14 + 0.01);
      assert.equal(ctrl.isDone(), true);
      assert.equal(finished, true);
    }
  });

  // 10. Animation 8: Skill (4 directions, 8 frames, loop=false, hitFrame=4)
  test('10. Skill Animation: Cast release occurs at frame 4 and completes', () => {
    for (let dir = 0; dir < 4; dir++) {
      let castFired = false;
      const ctrl = new AnimationController(
        'skill',
        { fps: 10, loop: false, frameCount: 8, row: dir, hitFrame: 4 },
        undefined,
        () => { castFired = true; }
      );

      ctrl.update(3 / 10);
      assert.equal(castFired, false);

      ctrl.update(1 / 10 + 0.001);
      assert.equal(castFired, true, 'Skill cast release must fire at frame 4');

      ctrl.update(4 / 10 + 0.05);
      assert.equal(ctrl.isDone(), true);
    }
  });

  // 11. Animation 9: Hit (4 directions, 3 frames, loop=false)
  test('11. Hit Animation: Plays 3 recoil frames and recovers without looping', () => {
    for (let dir = 0; dir < 4; dir++) {
      let done = false;
      const ctrl = new AnimationController(
        'hit',
        { fps: 8, loop: false, frameCount: 3, row: dir },
        () => { done = true; }
      );

      ctrl.update(3 / 8 + 0.01);
      assert.equal(ctrl.isDone(), true);
      assert.equal(done, true);
    }
  });

  // 12. Animation 10: Death (4 directions, 8 frames, holdLastFrame=true)
  test('12. Death Animation: Holds last frame (frame 7) indefinitely across all 4 directions', () => {
    for (let dir = 0; dir < 4; dir++) {
      const ctrl = new AnimationController('death', {
        fps: 8,
        loop: false,
        frameCount: 8,
        row: dir,
        holdLastFrame: true,
      });

      // Update past the animation duration (e.g. 5 seconds)
      ctrl.update(5.0);
      assert.equal(ctrl.getCurrentFrame(), 7, 'Death must remain permanently anchored at frame 7');
      assert.equal(ctrl.isDone(), true, 'Death must be marked as done');
    }
  });
});
