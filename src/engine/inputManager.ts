/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InputVector, UnifiedAction, InputDeviceMode } from '../types/input';

type ActionListener = (action: UnifiedAction) => void;
type MenuActionListener = (menuKey: string) => void;

class InputManager {
  private keys: Record<string, boolean> = {};
  private touchMoveVector: InputVector = { x: 0, y: 0 };
  private mousePos = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 };
  private lastInputDevice: InputDeviceMode = 'desktop';
  private actionListeners: Set<ActionListener> = new Set();
  private menuActionListeners: Set<MenuActionListener> = new Set();
  private isListening = false;
  private isPaused = false;

  constructor() {
    this.detectDeviceInitial();
  }

  private detectDeviceInitial() {
    if (typeof window === 'undefined') return;
    const hasTouch = 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0);
    const isMobileWidth = window.innerWidth <= 768;
    if (hasTouch && isMobileWidth) {
      this.lastInputDevice = 'touch';
    } else {
      this.lastInputDevice = 'desktop';
    }
  }

  public getDeviceMode(): InputDeviceMode {
    return this.lastInputDevice;
  }

  public setDeviceMode(mode: InputDeviceMode) {
    this.lastInputDevice = mode;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.resetMovement();
    }
  }

  /**
   * Register global keyboard and window focus listeners
   */
  public attachListeners() {
    if (this.isListening || typeof window === 'undefined') return;
    this.isListening = true;

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Clean up all global listeners
   */
  public detachListeners() {
    if (!this.isListening || typeof window === 'undefined') return;
    this.isListening = false;

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.resetMovement();
  }

  public resetMovement() {
    this.keys = {};
    this.touchMoveVector = { x: 0, y: 0 };
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.lastInputDevice = 'desktop';

    // System menus hotkeys are always responsive regardless of game pause
    if (key === 'escape') {
      this.emitMenuAction('escape');
      return;
    }
    if (key === 'i') { this.emitMenuAction('inventory'); return; }
    if (key === 'c') { this.emitMenuAction('character'); return; }
    if (key === 'k') { this.emitMenuAction('cultivation'); return; }
    if (key === 'j') { this.emitMenuAction('quests'); return; }
    if (key === 'm') { this.emitMenuAction('map'); return; }
    if (key === 'p') { this.emitMenuAction('alchemy'); return; }
    if (key === 'l') { this.emitMenuAction('forging'); return; }
    if (key === 'o') { this.emitMenuAction('war_room'); return; }
    if (key === 'y') { this.emitMenuAction('achievements'); return; }

    // If paused, do not process gameplay actions
    if (this.isPaused) return;

    // Movement keys
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
      this.keys[key] = true;
      return;
    }

    // Ignore key repeat for single-trigger combat skills
    if (e.repeat) return;

    if (key === 'q') { this.triggerAction('skill_q'); return; }
    if (key === 'e') { this.triggerAction('skill_e'); return; }
    if (key === 'r') { this.triggerAction('skill_r'); return; }
    if (key === 'f') { this.triggerAction('skill_f'); return; }

    if (key === ' ') {
      e.preventDefault();
      this.triggerAction('interact');
      return;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keys[key] = false;
  };

  private handleBlur = () => {
    // Prevent stuck keys when window loses focus (e.g., Alt-Tab or notification)
    this.resetMovement();
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.resetMovement();
    }
  };

  // === TOUCH JOYSTICK & ACTION INTEGRATION ===
  public setTouchMove(x: number, y: number) {
    this.lastInputDevice = 'touch';
    // Clamp to unit circle
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      this.touchMoveVector = { x: x / mag, y: y / mag };
    } else {
      this.touchMoveVector = { x, y };
    }
  }

  public setMousePosition(screenX: number, screenY: number, worldX: number, worldY: number) {
    this.mousePos = { screenX, screenY, worldX, worldY };
  }

  public getMousePosition() {
    return this.mousePos;
  }

  /**
   * Returns composite movement vector normalized between [-1, 1]
   */
  public getMoveVector(): InputVector {
    let kx = 0;
    let ky = 0;

    if (this.keys['w'] || this.keys['arrowup']) ky -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) ky += 1;
    if (this.keys['a'] || this.keys['arrowleft']) kx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) kx += 1;

    if (kx !== 0 && ky !== 0) {
      kx *= 0.70710678;
      ky *= 0.70710678;
    }

    // Combine keyboard and touch joystick
    let totalX = kx + this.touchMoveVector.x;
    let totalY = ky + this.touchMoveVector.y;

    const mag = Math.hypot(totalX, totalY);
    if (mag > 1.0) {
      totalX /= mag;
      totalY /= mag;
    }

    return { x: totalX, y: totalY };
  }

  /**
   * Resolves aiming angle based on active input method
   */
  public getAimAngle(
    playerX: number,
    playerY: number,
    facing: 'left' | 'right' | 'up' | 'down',
    enemies?: Array<{ x: number; y: number; hp: number }>
  ): number {
    // If desktop mode, aim towards mouse cursor
    if (this.lastInputDevice === 'desktop') {
      return Math.atan2(this.mousePos.worldY - playerY, this.mousePos.worldX - playerX);
    }

    // If mobile touch mode and joystick is actively tilted, aim in movement direction
    if (Math.abs(this.touchMoveVector.x) > 0.1 || Math.abs(this.touchMoveVector.y) > 0.1) {
      return Math.atan2(this.touchMoveVector.y, this.touchMoveVector.x);
    }

    // If stationary on touch, auto-target closest living enemy in front within 240px
    if (enemies && enemies.length > 0) {
      let closestDist = 240;
      let targetEnemy: { x: number; y: number } | null = null;

      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const d = Math.hypot(enemy.x - playerX, enemy.y - playerY);
        if (d < closestDist) {
          closestDist = d;
          targetEnemy = enemy;
        }
      }

      if (targetEnemy) {
        return Math.atan2(targetEnemy.y - playerY, targetEnemy.x - playerX);
      }
    }

    // Default to player facing direction
    switch (facing) {
      case 'left': return Math.PI;
      case 'right': return 0;
      case 'up': return -Math.PI / 2;
      case 'down': return Math.PI / 2;
    }
  }

  public triggerAction(action: UnifiedAction) {
    this.actionListeners.forEach(listener => {
      try {
        listener(action);
      } catch (err) {
        console.error('Error invoking action listener:', err);
      }
    });
  }

  public addActionListener(listener: ActionListener): () => void {
    this.actionListeners.add(listener);
    return () => {
      this.actionListeners.delete(listener);
    };
  }

  public triggerMenuAction(menuKey: string) {
    this.emitMenuAction(menuKey);
  }

  private emitMenuAction(menuKey: string) {
    this.menuActionListeners.forEach(listener => {
      try {
        listener(menuKey);
      } catch (err) {
        console.error('Error invoking menu action listener:', err);
      }
    });
  }

  public addMenuActionListener(listener: MenuActionListener): () => void {
    this.menuActionListeners.add(listener);
    return () => {
      this.menuActionListeners.delete(listener);
    };
  }
}

export const inputManager = new InputManager();
