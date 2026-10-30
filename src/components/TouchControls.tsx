/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlayerStats } from '../types/game';
import { inputManager } from '../engine/inputManager';
import { Swords, Wind, Hand, Shield, Flame, Zap, Heart } from 'lucide-react';

interface TouchControlsProps {
  player: PlayerStats;
  isInteractionAvailable?: boolean;
  disabled?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  player,
  isInteractionAvailable = false,
  disabled = false,
}) => {
  // Joystick state
  const [joystickActive, setJoystickActive] = useState<boolean>(false);
  const [stickPos, setStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const joystickCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const attackIntervalRef = useRef<any>(null);

  const MAX_RADIUS = 50; // Maximum stick displacement in pixels

  // Helper to reset joystick position and stop movement
  const resetJoystick = useCallback(() => {
    if (activePointerId.current !== null && joystickBaseRef.current) {
      try {
        if (joystickBaseRef.current.hasPointerCapture(activePointerId.current)) {
          joystickBaseRef.current.releasePointerCapture(activePointerId.current);
        }
      } catch (err) {}
    }
    activePointerId.current = null;
    setJoystickActive(false);
    setStickPos({ x: 0, y: 0 });
    inputManager.setTouchMove(0, 0);
  }, []);

  // Stop attack loop
  const stopAttackLoop = useCallback(() => {
    if (attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current);
      attackIntervalRef.current = null;
    }
  }, []);

  // Global safety handlers: window blur, pointerup, pointercancel
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (activePointerId.current === e.pointerId) {
        resetJoystick();
      }
      stopAttackLoop();
    };

    const handleWindowBlur = () => {
      resetJoystick();
      stopAttackLoop();
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('blur', handleWindowBlur);
      resetJoystick();
      stopAttackLoop();
    };
  }, [resetJoystick, stopAttackLoop]);

  // Reset when disabled
  useEffect(() => {
    if (disabled) {
      resetJoystick();
      stopAttackLoop();
    }
  }, [disabled, resetJoystick, stopAttackLoop]);

  const updateStickPosition = (clientX: number, clientY: number) => {
    const center = joystickCenterRef.current;
    const dx = clientX - center.x;
    const dy = clientY - center.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= 0) {
      setStickPos({ x: 0, y: 0 });
      inputManager.setTouchMove(0, 0);
      return;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, MAX_RADIUS);
    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setStickPos({ x: stickX, y: stickY });
    // Normalize vector to [-1, 1]
    inputManager.setTouchMove(stickX / MAX_RADIUS, stickY / MAX_RADIUS);
  };

  const handleJoystickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerId.current !== null) return;
    e.preventDefault();
    e.stopPropagation();

    const base = joystickBaseRef.current;
    if (!base) return;

    activePointerId.current = e.pointerId;
    try {
      base.setPointerCapture(e.pointerId);
    } catch (err) {}

    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    joystickCenterRef.current = { x: centerX, y: centerY };

    updateStickPosition(e.clientX, e.clientY);
    setJoystickActive(true);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    updateStickPosition(e.clientX, e.clientY);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    resetJoystick();
  };

  // Continuous Attack Hold Support
  const handleAttackPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || player.hp <= 0) return;

    if (navigator.vibrate) {
      try { navigator.vibrate(10); } catch (err) {}
    }

    inputManager.triggerAction('attack');

    stopAttackLoop();
    attackIntervalRef.current = setInterval(() => {
      inputManager.triggerAction('attack');
    }, 320);
  };

  const handleAttackPointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopAttackLoop();
  };

  // Single action triggers (Dodge, Skills, Interact)
  const handleActionPress = useCallback((action: 'dodge' | 'skill_q' | 'skill_e' | 'skill_r' | 'skill_f' | 'interact', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || player.hp <= 0) return;

    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch (err) {}
    }

    inputManager.triggerAction(action);
  }, [disabled, player.hp]);

  // Skill lookup helper
  const skillQ = player.equippedSkills.find(s => s.key === 'q');
  const skillE = player.equippedSkills.find(s => s.key === 'e');
  const skillR = player.equippedSkills.find(s => s.key === 'r');
  const skillF = player.equippedSkills.find(s => s.key === 'f');

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 touch-none overflow-hidden">
      {/* === LEFT THUMB: VIRTUAL MOVEMENT JOYSTICK === */}
      <div 
        className="absolute left-[max(0.5rem,env(safe-area-inset-left,0.5rem))] bottom-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] pointer-events-auto scale-[0.78] xs:scale-[0.85] sm:scale-95 origin-bottom-left"
      >
        <div
          ref={joystickBaseRef}
          onPointerDown={handleJoystickPointerDown}
          onPointerMove={handleJoystickPointerMove}
          onPointerUp={handleJoystickPointerUp}
          onPointerCancel={handleJoystickPointerUp}
          onLostPointerCapture={resetJoystick}
          className={`relative w-36 h-36 rounded-full border-2 transition-colors touch-none flex items-center justify-center backdrop-blur-md shadow-2xl ${
            joystickActive
              ? 'border-amber-400 bg-stone-900/80 shadow-amber-500/25'
              : 'border-stone-700/80 bg-stone-950/60'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Outer Ring Cardinal Direction Indicators */}
          <div className="absolute top-1 text-stone-500 text-[10px] font-mono pointer-events-none">▲</div>
          <div className="absolute bottom-1 text-stone-500 text-[10px] font-mono pointer-events-none">▼</div>
          <div className="absolute left-1.5 text-stone-500 text-[10px] font-mono pointer-events-none">◀</div>
          <div className="absolute right-1.5 text-stone-500 text-[10px] font-mono pointer-events-none">▶</div>

          {/* Inner stick nub */}
          <div
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-transform duration-75 shadow-lg pointer-events-none ${
              joystickActive
                ? 'bg-gradient-to-br from-amber-500 to-yellow-600 border-amber-200 shadow-amber-600/40 text-stone-950 scale-105'
                : 'bg-stone-800 border-stone-600 text-stone-400'
            }`}
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              touchAction: 'none',
            }}
          >
            <span className="text-xs font-bold tracking-widest">☯</span>
          </div>
        </div>
      </div>

      {/* === RIGHT THUMB: ACTION CLUSTER (BÁT QUÁI TÁC CHIẾN CỤM) === */}
      <div 
        className="absolute right-[max(0.5rem,env(safe-area-inset-right,0.5rem))] bottom-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] pointer-events-auto flex items-end justify-end scale-[0.78] xs:scale-[0.85] sm:scale-95 origin-bottom-right"
      >
        <div className="relative w-64 h-64 touch-none" style={{ touchAction: 'none' }}>
          
          {/* 1. PRIMARY BASIC ATTACK (LMB) - Center-Right Hub with Hold-to-Attack */}
          <button
            onPointerDown={handleAttackPointerDown}
            onPointerUp={handleAttackPointerUp}
            onPointerCancel={handleAttackPointerUp}
            onPointerLeave={handleAttackPointerUp}
            className="absolute right-6 bottom-6 w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 active:from-amber-400 active:to-yellow-500 border-2 border-amber-300 text-stone-950 font-bold shadow-2xl active:scale-95 transition-transform flex flex-col items-center justify-center cursor-pointer select-none"
            style={{ touchAction: 'none' }}
            title="Đòn Đánh Thường [Nhấn hoặc Giữ để chém liên hoàn]"
          >
            <Swords className="w-7 h-7 text-stone-950" />
            <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">Trảm</span>
          </button>

          {/* 2. DODGE / DASH (RMB) - Bottom Left of Attack */}
          <button
            onPointerDown={e => handleActionPress('dodge', e)}
            disabled={player.dodgeCooldown > 0 || player.mp < 12}
            className={`absolute right-28 bottom-4 w-13 h-13 rounded-full border-2 flex flex-col items-center justify-center shadow-xl active:scale-92 transition-transform cursor-pointer select-none ${
              player.dodgeCooldown > 0
                ? 'bg-stone-900 border-stone-700 opacity-60 text-stone-500'
                : player.mp < 12
                ? 'bg-stone-900 border-sky-950 text-stone-600'
                : 'bg-stone-900/90 border-sky-400 text-sky-300 active:bg-sky-600 active:text-white'
            }`}
            style={{ touchAction: 'none' }}
            title="Thân Pháp Né Đòn [12 MP]"
          >
            {player.dodgeCooldown > 0 ? (
              <span className="text-xs font-bold text-sky-400 font-mono">
                {player.dodgeCooldown.toFixed(1)}s
              </span>
            ) : (
              <>
                <Wind className="w-5 h-5" />
                <span className="text-[9px] font-bold">Né</span>
              </>
            )}
          </button>

          {/* 3. INTERACTION BUTTON - Appears above dash / attack */}
          <button
            onPointerDown={e => handleActionPress('interact', e)}
            className={`absolute right-28 bottom-20 w-13 h-13 rounded-full border-2 flex flex-col items-center justify-center shadow-xl active:scale-92 transition-all cursor-pointer select-none ${
              isInteractionAvailable
                ? 'bg-emerald-600 border-emerald-300 text-white animate-pulse shadow-emerald-500/40 ring-2 ring-emerald-400/50'
                : 'bg-stone-900/80 border-stone-700 text-stone-400'
            }`}
            style={{ touchAction: 'none' }}
            title="Tương Tác / Thu Thập / Nói Chuyện"
          >
            <Hand className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase mt-0.5">Tác Động</span>
          </button>

          {/* 4. SKILL Q (Hỏa Kiếm Phi Đao) */}
          {skillQ && (
            <button
              onPointerDown={e => handleActionPress('skill_q', e)}
              disabled={skillQ.currentCooldown > 0 || player.mp < skillQ.mpCost}
              className={`absolute right-4 bottom-28 w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center shadow-lg active:scale-92 transition-transform cursor-pointer select-none ${
                skillQ.currentCooldown > 0
                  ? 'bg-stone-900/90 border-stone-700 text-stone-500'
                  : player.mp < skillQ.mpCost
                  ? 'bg-stone-950 border-stone-800 text-stone-600'
                  : 'bg-stone-900/95 border-orange-500 text-orange-400 active:bg-orange-600 active:text-white'
              }`}
              style={{ touchAction: 'none' }}
              title={`Q: ${skillQ.name} (${skillQ.mpCost} MP)`}
            >
              {skillQ.currentCooldown > 0 ? (
                <span className="text-[11px] font-bold text-amber-400 font-mono">
                  {skillQ.currentCooldown.toFixed(1)}s
                </span>
              ) : (
                <>
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-[8px] font-bold">Q</span>
                </>
              )}
            </button>
          )}

          {/* 5. SKILL E (Hộ Thể Kim Chung) */}
          {skillE && (
            <button
              onPointerDown={e => handleActionPress('skill_e', e)}
              disabled={skillE.currentCooldown > 0 || player.mp < skillE.mpCost}
              className={`absolute right-16 bottom-36 w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center shadow-lg active:scale-92 transition-transform cursor-pointer select-none ${
                skillE.currentCooldown > 0
                  ? 'bg-stone-900/90 border-stone-700 text-stone-500'
                  : player.mp < skillE.mpCost
                  ? 'bg-stone-950 border-stone-800 text-stone-600'
                  : 'bg-stone-900/95 border-amber-400 text-amber-300 active:bg-amber-600 active:text-white'
              }`}
              style={{ touchAction: 'none' }}
              title={`E: ${skillE.name} (${skillE.mpCost} MP)`}
            >
              {skillE.currentCooldown > 0 ? (
                <span className="text-[11px] font-bold text-amber-400 font-mono">
                  {skillE.currentCooldown.toFixed(1)}s
                </span>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-amber-300" />
                  <span className="text-[8px] font-bold">E</span>
                </>
              )}
            </button>
          )}

          {/* 6. SKILL R (Vạn Kiếm Quy Tông) */}
          {skillR && (
            <button
              onPointerDown={e => handleActionPress('skill_r', e)}
              disabled={skillR.currentCooldown > 0 || player.mp < skillR.mpCost}
              className={`absolute right-30 bottom-36 w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center shadow-lg active:scale-92 transition-transform cursor-pointer select-none ${
                skillR.currentCooldown > 0
                  ? 'bg-stone-900/90 border-stone-700 text-stone-500'
                  : player.mp < skillR.mpCost
                  ? 'bg-stone-950 border-stone-800 text-stone-600'
                  : 'bg-stone-900/95 border-cyan-400 text-cyan-300 active:bg-cyan-600 active:text-white'
              }`}
              style={{ touchAction: 'none' }}
              title={`R: ${skillR.name} (${skillR.mpCost} MP)`}
            >
              {skillR.currentCooldown > 0 ? (
                <span className="text-[11px] font-bold text-amber-400 font-mono">
                  {skillR.currentCooldown.toFixed(1)}s
                </span>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-300" />
                  <span className="text-[8px] font-bold">R</span>
                </>
              )}
            </button>
          )}

          {/* 7. SKILL F (Ất Mộc Hồi Xuân) */}
          {skillF && (
            <button
              onPointerDown={e => handleActionPress('skill_f', e)}
              disabled={skillF.currentCooldown > 0 || player.mp < skillF.mpCost}
              className={`absolute right-44 bottom-26 w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center shadow-lg active:scale-92 transition-transform cursor-pointer select-none ${
                skillF.currentCooldown > 0
                  ? 'bg-stone-900/90 border-stone-700 text-stone-500'
                  : player.mp < skillF.mpCost
                  ? 'bg-stone-950 border-stone-800 text-stone-600'
                  : 'bg-stone-900/95 border-emerald-400 text-emerald-300 active:bg-emerald-600 active:text-white'
              }`}
              style={{ touchAction: 'none' }}
              title={`F: ${skillF.name} (${skillF.mpCost} MP)`}
            >
              {skillF.currentCooldown > 0 ? (
                <span className="text-[11px] font-bold text-amber-400 font-mono">
                  {skillF.currentCooldown.toFixed(1)}s
                </span>
              ) : (
                <>
                  <Heart className="w-4 h-4 text-emerald-300" />
                  <span className="text-[8px] font-bold">F</span>
                </>
              )}
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
