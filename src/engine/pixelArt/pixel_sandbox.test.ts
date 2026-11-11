/**
 * UNIT TESTS FOR PIXEL ART SANDBOX ENGINE (PHASE 1)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { AnimationController } from './AnimationController';
import { PixelDepthSorter } from './PixelDepthSorter';

test('AnimationController loops properly when loop=true', () => {
  const ctrl = new AnimationController('walk', {
    fps: 10, // 0.1s per frame
    loop: true,
    frameCount: 4,
    row: 1
  });

  assert.equal(ctrl.getCurrentFrame(), 0);
  assert.equal(ctrl.getRow(), 1);

  // Advance 0.15s -> frame 1
  ctrl.update(0.15);
  assert.equal(ctrl.getCurrentFrame(), 1);

  // Advance to 0.45s -> frame 0 (looped)
  ctrl.update(0.3);
  assert.equal(ctrl.getCurrentFrame(), 0);
  assert.equal(ctrl.isDone(), false);
});

test('AnimationController holds last frame on death when holdLastFrame=true', () => {
  const ctrl = new AnimationController('death', {
    fps: 10,
    loop: false,
    frameCount: 6,
    row: 9,
    holdLastFrame: true
  });

  // Advance 1.0s (past total duration 0.6s)
  ctrl.update(1.0);
  assert.equal(ctrl.getCurrentFrame(), 5);
  assert.equal(ctrl.isDone(), true);

  // Advancing more time should stay at last frame
  ctrl.update(0.5);
  assert.equal(ctrl.getCurrentFrame(), 5);
});

test('AnimationController triggers hit callback exactly on hitFrame', () => {
  let hitTriggered = false;
  const ctrl = new AnimationController('attack', {
    fps: 10,
    loop: false,
    frameCount: 5,
    row: 3,
    hitFrame: 2
  });

  ctrl.play(
    'attack',
    { fps: 10, loop: false, frameCount: 5, row: 3, hitFrame: 2 },
    undefined,
    () => { hitTriggered = true; }
  );

  ctrl.update(0.1); // frame 1
  assert.equal(hitTriggered, false);

  ctrl.update(0.15); // frame 2
  assert.equal(hitTriggered, true);
});

test('PixelDepthSorter strictly sorts Layer 2 entities by ascending feetY', () => {
  const sorter = new PixelDepthSorter();
  const renderLog: number[] = [];

  // Submit in scrambled order
  sorter.submit({ layer: 2, sortY: 300, render: () => renderLog.push(300) });
  sorter.submit({ layer: 2, sortY: 150, render: () => renderLog.push(150) });
  sorter.submit({ layer: 2, sortY: 220, render: () => renderLog.push(220) });
  sorter.submit({ layer: 2, sortY: 180, render: () => renderLog.push(180) });

  const fakeCtx = {} as any;
  sorter.flush(fakeCtx);

  assert.deepEqual(renderLog, [150, 180, 220, 300], 'Entities must be drawn in ascending feetY order');
});

test('PixelDepthSorter renders layers in strict chronological order 0 -> 1 -> 2 -> 3 -> 4', () => {
  const sorter = new PixelDepthSorter();
  const layerLog: number[] = [];

  sorter.submit({ layer: 4, sortY: 100, render: () => layerLog.push(4) }); // VFX
  sorter.submit({ layer: 0, sortY: 100, render: () => layerLog.push(0) }); // Ground
  sorter.submit({ layer: 3, sortY: 100, render: () => layerLog.push(3) }); // Roof canopy
  sorter.submit({ layer: 1, sortY: 100, render: () => layerLog.push(1) }); // Bridge
  sorter.submit({ layer: 2, sortY: 100, render: () => layerLog.push(2) }); // Entity

  const fakeCtx = {} as any;
  sorter.flush(fakeCtx);

  assert.deepEqual(layerLog, [0, 1, 2, 3, 4], 'Layers must execute in strict 0 to 4 sequence');
});
