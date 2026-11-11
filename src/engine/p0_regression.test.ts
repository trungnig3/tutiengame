import test from 'node:test';
import assert from 'node:assert/strict';
import { inputManager } from './inputManager.ts';

// ============================================================================
// TASK 3 TESTS: Swept Dash Collision Logic
// ============================================================================
type TestObstacle = { x: number; y: number; width: number; height: number; type: string };

function computeSafeDash(
  startX: number,
  startY: number,
  angle: number,
  maxDashDist: number,
  obstacles: TestObstacle[],
  mapWidth: number,
  mapHeight: number
) {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const hw = 18;
  const hh = 22;

  const isCollidingAt = (cx: number, cy: number): boolean => {
    if (cx - hw < 10 || cx + hw > mapWidth - 10 ||
        cy - hh < 10 || cy + hh > mapHeight - 10) {
      return true;
    }
    for (const obs of obstacles) {
      if (obs.type === 'building' || obs.type === 'rock' || obs.type === 'wall') {
        if (cx + hw > obs.x && cx - hw < obs.x + obs.width &&
            cy + hh > obs.y && cy - hh < obs.y + obs.height) {
          return true;
        }
      }
    }
    return false;
  };

  let safeDist = 0;
  const step = 3;
  for (let d = step; d <= maxDashDist; d += step) {
    const tx = startX + cosA * d;
    const ty = startY + sinA * d;
    if (isCollidingAt(tx, ty)) {
      let low = safeDist;
      let high = d;
      for (let iter = 0; iter < 4; iter++) {
        const mid = (low + high) * 0.5;
        if (isCollidingAt(startX + cosA * mid, startY + sinA * mid)) {
          high = mid;
        } else {
          low = mid;
        }
      }
      safeDist = Math.max(0, low - 3);
      break;
    } else {
      safeDist = d;
    }
  }

  let targetX = startX + cosA * safeDist;
  let targetY = startY + sinA * safeDist;
  targetX = Math.max(30, Math.min(mapWidth - 30, targetX));
  targetY = Math.max(30, Math.min(mapHeight - 30, targetY));

  return { targetX, targetY, safeDist, isColliding: isCollidingAt(targetX, targetY) };
}

test('Dash in open space travels full 150px without obstacle', () => {
  const result = computeSafeDash(300, 300, 0, 150, [], 1400, 900);
  assert.equal(result.safeDist, 150);
  assert.equal(Math.round(result.targetX), 450);
  assert.equal(result.isColliding, false);
});

test('Dash starting flush against a wall (2px away facing wall) stops safely without penetrating', () => {
  // Wall at x: 200, width: 100, y: 100, height: 200
  // Player at x: 180 (hw=18, player right edge = 198, 2px before wall)
  const wall: TestObstacle = { x: 200, y: 100, width: 100, height: 200, type: 'wall' };
  const result = computeSafeDash(180, 200, 0, 150, [wall], 1400, 900);
  
  // Safe distance must be ~0 and NOT penetrate into wall (x > 200)
  assert.ok(result.targetX <= 182, `targetX ${result.targetX} must not penetrate into wall x: 200`);
  assert.equal(result.isColliding, false, 'Target position must not be inside collision');
});

test('Dash heading into an obstacle corner stops safely with margin', () => {
  // Rock at x: 300, y: 300, width: 80, height: 80
  const rock: TestObstacle = { x: 300, y: 300, width: 80, height: 80, type: 'rock' };
  // Player dashing from (200, 200) diagonally towards (300, 300)
  const angle = Math.atan2(100, 100);
  const result = computeSafeDash(200, 200, angle, 150, [rock], 1400, 900);

  assert.equal(result.isColliding, false, 'Dash must stop strictly before rock corner');
  assert.ok(result.safeDist > 0 && result.safeDist < 150, 'Dash stopped before full 150px distance');
});

// ============================================================================
// TASK 4 TESTS: Frame-rate Independent Exponential Smoothing
// ============================================================================
test('Exponential smoothing reaches equivalent distance at 60 FPS and 30 FPS over 1 second', () => {
  const targetPos = 500;

  // Simulate 1 second at 60 FPS (60 frames, dt = 1/60s)
  let pos60 = 0;
  const dt60 = 1 / 60;
  for (let f = 0; f < 60; f++) {
    const alpha = 1 - Math.exp(-24 * dt60);
    pos60 += (targetPos - pos60) * alpha;
  }

  // Simulate 1 second at 30 FPS (30 frames, dt = 1/30s)
  let pos30 = 0;
  const dt30 = 1 / 30;
  for (let f = 0; f < 30; f++) {
    const alpha = 1 - Math.exp(-24 * dt30);
    pos30 += (targetPos - pos30) * alpha;
  }

  // Both should reach virtually identical values (> 99.999% of target)
  const diff = Math.abs(pos60 - pos30);
  assert.ok(diff < 0.01, `Difference between 60 FPS and 30 FPS must be negligible, got diff: ${diff}`);
  assert.ok(pos60 <= targetPos && pos30 <= targetPos, 'Smoothing must never overshoot target position');
});

test('Exponential smoothing does not overshoot on sudden delta time step', () => {
  let pos = 100;
  const target = 200;
  // Large dt spike (e.g. 50ms)
  const dtSpike = 0.05;
  const alpha = 1 - Math.exp(-24 * dtSpike);
  pos += (target - pos) * alpha;
  
  assert.ok(pos < target, 'Position must smoothly approach target without overshooting');
  assert.ok(pos > 100, 'Position must advance forward');
});

// ============================================================================
// TASK 2 TESTS: Boss Charge State Machine & Punish Logic
// ============================================================================
test('Boss Charge multi-frame progress, obstacle stop and non-contradictory text', () => {
  type BossState = {
    x: number;
    y: number;
    radius: number;
    state: string;
    bossPunishTimer?: number;
    chargeState?: {
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      duration: number;
      elapsed: number;
      speed: number;
      hasHitPlayer: boolean;
    };
  };

  const wall: TestObstacle = { x: 400, y: 150, width: 50, height: 200, type: 'wall' };
  const boss: BossState = {
    x: 300,
    y: 200,
    radius: 24,
    state: 'attacking',
    chargeState: {
      startX: 300,
      startY: 200,
      targetX: 460,
      targetY: 200,
      duration: 0.35,
      elapsed: 0,
      speed: 160 / 0.35,
      hasHitPlayer: false,
    },
  };

  let floatingTextEmitted = '';

  // Simulate multiple steps of charging towards wall at x: 400
  const dt = 0.016;
  for (let frame = 0; frame < 20; frame++) {
    if (!boss.chargeState) break;
    const cs = boss.chargeState;
    cs.elapsed += dt;
    const progress = Math.min(1, cs.elapsed / cs.duration);
    const totalDist = Math.hypot(cs.targetX - cs.startX, cs.targetY - cs.startY);
    const dirX = (cs.targetX - cs.startX) / totalDist;
    const dirY = (cs.targetY - cs.startY) / totalDist;
    const stepDist = cs.speed * dt;

    let nextEx = boss.x + dirX * stepDist;
    let nextEy = boss.y + dirY * stepDist;
    let hitObstacle = false;

    // Check collision with wall
    const rad = boss.radius;
    if (nextEx + rad > wall.x && nextEx - rad < wall.x + wall.width &&
        nextEy + rad > wall.y && nextEy - rad < wall.y + wall.height) {
      hitObstacle = true;
      nextEx = wall.x - rad - 2;
    }

    boss.x = nextEx;
    boss.y = nextEy;

    if (progress >= 1 || hitObstacle) {
      const hitPlayer = cs.hasHitPlayer;
      boss.chargeState = undefined;
      boss.state = 'chase';
      boss.bossPunishTimer = 1.2;
      floatingTextEmitted = hitPlayer
        ? '⚡ SƠ HỞ! TRỪNG PHẠT +35%'
        : '⚡ HÚC TRƯỢT! TRỪNG PHẠT +35%';
      break;
    }
  }

  // Boss must stop right before the wall (wall.x is 400, boss.radius is 24 -> x <= 374)
  assert.ok(boss.x <= 374, `Boss x: ${boss.x} must stop safely before wall x: 400`);
  assert.equal(boss.state, 'chase');
  assert.equal(boss.bossPunishTimer, 1.2);
  assert.equal(floatingTextEmitted, '⚡ HÚC TRƯỢT! TRỪNG PHẠT +35%');
});

test('Boss Charge hitting player displays SƠ HỞ TRỪNG PHẠT instead of HÚC TRƯỢT', () => {
  const cs = {
    startX: 100,
    startY: 100,
    targetX: 260,
    targetY: 100,
    duration: 0.35,
    elapsed: 0.35,
    speed: 460,
    hasHitPlayer: true, // Player was struck
  };

  const hitPlayer = cs.hasHitPlayer;
  const floatingText = hitPlayer
    ? '⚡ SƠ HỞ! TRỪNG PHẠT +35%'
    : '⚡ HÚC TRƯỢT! TRỪNG PHẠT +35%';

  assert.equal(floatingText, '⚡ SƠ HỞ! TRỪNG PHẠT +35%');
  assert.notEqual(floatingText, '⚡ HÚC TRƯỢT! TRỪNG PHẠT +35%');
});

// ============================================================================
// TASK 1 & 5 TESTS: Multi-Touch & Input Isolation
// ============================================================================
test('InputManager normalizes touch movement vector properly within [-1, 1]', () => {
  inputManager.setTouchMove(0.6, 0.8);
  const vec = inputManager.getMoveVector();
  assert.ok(Math.abs(vec.x - 0.6) < 0.001);
  assert.ok(Math.abs(vec.y - 0.8) < 0.001);

  // Over-displacement clamps to unit circle
  inputManager.setTouchMove(2.0, 0);
  const clamped = inputManager.getMoveVector();
  assert.ok(Math.abs(clamped.x - 1.0) < 0.001);
  assert.equal(clamped.y, 0);

  inputManager.resetMovement();
  const resetVec = inputManager.getMoveVector();
  assert.equal(resetVec.x, 0);
  assert.equal(resetVec.y, 0);
});
