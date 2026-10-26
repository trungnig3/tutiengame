/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InputVector {
  x: number; // -1 to 1 (normalized)
  y: number; // -1 to 1 (normalized)
}

export type UnifiedAction =
  | 'attack'
  | 'dodge'
  | 'skill_q'
  | 'skill_e'
  | 'skill_r'
  | 'skill_f'
  | 'interact';

export type InputDeviceMode = 'auto' | 'desktop' | 'touch';

export interface TouchControlConfig {
  enabled: boolean;
  opacity: number; // 0.3 to 1.0
  scale: number; // 0.8 to 1.2
  hapticFeedback: boolean;
  fixedJoystick: boolean;
}

export interface InputAim {
  angle: number;
  worldX: number;
  worldY: number;
  hasTargetLock: boolean;
}
