import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { RARITY_COLORS } from '../../utils/rarityColors';
import { getItemPreviewSvg } from '../../utils/itemPreview';
import Confetti from '../shared/Confetti';
import GachaMachine from './GachaMachine';
import GachaResult from './GachaResult';

/* ─── Constants ─────────────────────────────────────────────────── */

const CAPSULE_COLORS = {
  common: '#9e9e9e',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ffd700',
};

const PARTICLE_PRESETS = {
  common: { colors: ['#ffffff', '#e0e0e0', '#bdbdbd'], count: 12 },
  rare: { colors: ['#2196f3', '#64b5f6', '#90caf9', '#ffffff'], count: 20 },
  epic: { colors: ['#9c27b0', '#ce93d8', '#ff2d78', '#ffffff', '#ffd700'], count: 30 },
  legendary: { colors: ['#ffd700', '#ffaa00', '#ff2d78', '#ffffff', '#00e5ff', '#ff69b4'], count: 50 },
};

/* Animation phase enum */
const PHASE = {
  IDLE: 'idle',
  ZOOM: 'zoom',
  COIN_DROP: 'coin_drop',
  CRANK: 'crank',
  CAPSULE_OUT: 'capsule_out',
  CRACK_OPEN: 'crack_open',
  LEGENDARY_FLASH: 'legendary_flash',
  REVEAL: 'reveal',

  // 10-pull specific
  MULTI_CRANK: 'multi_crank',
  MULTI_LINEUP: 'multi_lineup',
  MULTI_CRACK: 'multi_crack',
  MULTI_LEGENDARY: 'multi_legendary',
  MULTI_GRID: 'multi_grid',
};

/* ─── Capsule Component ─────────────────────────────────────────── */

function Capsule({ rarity = 'common', size = 60, style = {}, cracking = false, className = '' }) {
  const color = CAPSULE_COLORS[rarity] || CAPSULE_COLORS.common;
  const halfH = size * 0.6;
  return (
    <div
      className={`relative ${className}`}
      style={{
        width: size,
        height: size * 1.2,
        ...style,
      }}
    >
      {/* Top half */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: halfH,
          borderRadius: `${size / 2}px ${size / 2}px 0 0`,
          background: `radial-gradient(ellipse at 35% 30%, ${color}ee, ${color}aa)`,
          boxShadow: `0 0 12px ${color}66`,
          transform: cracking ? 'translateY(-8px) rotate(-8deg)' : 'none',
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Shine */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '20%',
            width: '30%',
            height: '40%',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
          }}
        />
      </div>
      {/* Bottom half */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: size,
          height: halfH,
          borderRadius: `0 0 ${size / 2}px ${size / 2}px`,
          background: `radial-gradient(ellipse at 35% 70%, ${color}cc, ${color}88)`,
          boxShadow: `0 0 8px ${color}44`,
          transform: cracking ? 'translateY(8px) rotate(5deg)' : 'none',
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      />
      {/* Seam line */}
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '5%',
          width: '90%',
          height: 3,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: 0.6,
        }}
      />
    </div>
  );
}

/* ─── CoinDrop Animation ────────────────────────────────────────── */

function CoinDrop({ active }) {
  if (!active) return null;
  return (
    <div
      className="absolute"
      style={{
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        animation: 'pull-coin-drop 0.3s ease-in forwards',
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #ffd700, #cc8800)',
          border: '2px solid #ffaa00',
          boxShadow: '0 0 16px rgba(255,215,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          fontSize: 14,
          color: '#8B6914',
        }}
      >
        C
      </div>
    </div>
  );
}

/* ─── Particle Burst Canvas ─────────────────────────────────────── */

function ParticleBurst({ active, rarity = 'common', x, y }) {
  const preset = PARTICLE_PRESETS[rarity] || PARTICLE_PRESETS.common;
  return (
    <Confetti
      active={active}
      x={x}
      y={y}
      count={preset.count}
      colors={preset.colors}
      duration={rarity === 'legendary' ? 2500 : 1500}
    />
  );
}

/* ─── Legendary Flash Overlay ───────────────────────────────────── */

function LegendaryFlash({ active }) {
  if (!active) return null;
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 60,
        animation: 'pull-legendary-flash 1.2s ease-out forwards',
      }}
    >
      {/* Golden flash */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0.3) 40%, transparent 70%)',
          animation: 'pull-flash-expand 0.6s ease-out forwards',
        }}
      />
      {/* Rainbow shimmer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(45deg, rgba(255,0,100,0.2), rgba(255,215,0,0.2), rgba(0,229,255,0.2), rgba(156,39,176,0.2))',
          backgroundSize: '300% 300%',
          animation: 'pull-rainbow-shimmer 1s ease-in-out infinite',
          opacity: 0,
          animationDelay: '0.4s',
          animationFillMode: 'forwards',
        }}
      />
    </div>
  );
}

/* ─── Screen Shake Hook ─────────────────────────────────────────── */

function useScreenShake(active, intensity = 6, duration = 600) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const start = performance.now();

    function shake(now) {
      const elapsed = now - start;
      if (elapsed > duration) {
        setOffset({ x: 0, y: 0 });
        return;
      }
      const decay = 1 - elapsed / duration;
      const x = (Math.random() - 0.5) * 2 * intensity * decay;
      const y = (Math.random() - 0.5) * 2 * intensity * decay;
      setOffset({ x, y });
      frameRef.current = requestAnimationFrame(shake);
    }

    frameRef.current = requestAnimationFrame(shake);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, intensity, duration]);

  return offset;
}

/* ═══ Main GachaPull Component ══════════════════════════════════════ */

/**
 * GachaPull -- Full-screen pull animation overlay.
 *
 * @param {object}   props
 * @param {object[]} props.results  - Array of pulled items
 * @param {boolean}  props.isMulti  - true for 10-pull
 * @param {function} props.onEquip  - Equip callback (item)
 * @param {function} props.onPullAgain - Pull again callback
 * @param {function} props.onClose  - Close overlay callback
 */
export default function GachaPull({
  results = [],
  isMulti = false,
  onEquip,
  onPullAgain,
  onClose,
}) {
  const collection = useGameStore((s) => s.collection);
  const [phase, setPhase] = useState(PHASE.ZOOM);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [crackedIndices, setCrackedIndices] = useState(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [legendaryIdx, setLegendaryIdx] = useState(-1);

  const shakeActive = phase === PHASE.LEGENDARY_FLASH || phase === PHASE.MULTI_LEGENDARY;
  const shakeOffset = useScreenShake(shakeActive, 8, 800);

  const items = results || [];
  const currentItem = items[currentIdx] || null;
  const hasLegendary = items.some((it) => it?.rarity === 'legendary');

  // Detect legendary index for 10-pull
  useEffect(() => {
    if (isMulti) {
      const idx = items.findIndex((it) => it?.rarity === 'legendary');
      setLegendaryIdx(idx);
    }
  }, [items, isMulti]);

  // ── Single pull animation sequence ──────────────────────────────
  useEffect(() => {
    if (isMulti || items.length === 0) return;

    const timers = [];
    const t = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
    };

    // Phase 1: Zoom (500ms)
    t(() => setPhase(PHASE.COIN_DROP), 500);
    // Phase 2: Coin drop (300ms)
    t(() => setPhase(PHASE.CRANK), 800);
    // Phase 3: Machine crank (1000ms)
    t(() => setPhase(PHASE.CAPSULE_OUT), 1800);
    // Phase 4: Capsule pops out (500ms)
    t(() => {
      if (currentItem?.rarity === 'legendary') {
        setPhase(PHASE.LEGENDARY_FLASH);
      } else {
        setPhase(PHASE.CRACK_OPEN);
      }
    }, 2300);

    // Legendary gets an extra flash phase
    if (currentItem?.rarity === 'legendary') {
      t(() => {
        setPhase(PHASE.CRACK_OPEN);
        setShowConfetti(true);
      }, 3500);
    } else if (currentItem?.rarity === 'epic') {
      t(() => setShowConfetti(true), 2400);
    }

    // Reveal
    const revealTime = currentItem?.rarity === 'legendary' ? 4200 : 2800;
    t(() => setPhase(PHASE.REVEAL), revealTime);

    return () => timers.forEach(clearTimeout);
  }, [isMulti, items, currentItem]);

  // ── 10-pull animation sequence ──────────────────────────────────
  useEffect(() => {
    if (!isMulti || items.length === 0) return;

    const timers = [];
    const t = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
    };

    // Zoom + fast crank
    t(() => setPhase(PHASE.MULTI_CRANK), 400);
    t(() => setPhase(PHASE.MULTI_LINEUP), 1200);

    // Staggered crack: 0.2s each
    const crackStart = 1800;
    for (let i = 0; i < items.length; i++) {
      const isLeg = items[i]?.rarity === 'legendary';
      if (isLeg && legendaryIdx >= 0) continue; // skip legendary for now

      t(() => {
        setCrackedIndices((prev) => {
          const next = new Set(prev);
          next.add(i);
          return next;
        });
      }, crackStart + i * 200);
    }

    // Legendary reveal if present
    if (legendaryIdx >= 0) {
      const legTime = crackStart + items.length * 200 + 300;
      t(() => setPhase(PHASE.MULTI_LEGENDARY), legTime);
      t(() => {
        setCrackedIndices((prev) => {
          const next = new Set(prev);
          next.add(legendaryIdx);
          return next;
        });
        setShowConfetti(true);
      }, legTime + 1200);
      t(() => setPhase(PHASE.MULTI_GRID), legTime + 2000);
    } else {
      const gridTime = crackStart + items.length * 200 + 500;
      t(() => setPhase(PHASE.MULTI_GRID), gridTime);
    }

    return () => timers.forEach(clearTimeout);
  }, [isMulti, items, legendaryIdx]);

  // Is item new (not in collection before this pull)?
  const isItemNew = useCallback(
    (item) => item && !collection.has(item.id),
    [collection]
  );

  // Is item a duplicate?
  const isItemDuplicate = useCallback(
    (item) => item && collection.has(item.id),
    [collection]
  );

  const shardValue = (rarity) => {
    const vals = { common: 2, rare: 5, epic: 15, legendary: 50 };
    return vals[rarity] || 2;
  };

  /* ── Render helpers ─────────────────────────────────────────────── */

  // Single pull phases
  const renderSinglePull = () => {
    const isCranking = phase === PHASE.CRANK;
    const capsuleOut = [PHASE.CAPSULE_OUT, PHASE.CRACK_OPEN, PHASE.LEGENDARY_FLASH].includes(phase);
    const cracked = phase === PHASE.CRACK_OPEN || phase === PHASE.REVEAL;
    const isZooming = phase === PHASE.ZOOM || phase === PHASE.COIN_DROP;

    if (phase === PHASE.REVEAL) {
      return (
        <GachaResult
          item={currentItem}
          isNew={isItemNew(currentItem)}
          isDuplicate={isItemDuplicate(currentItem)}
          shardValue={shardValue(currentItem?.rarity)}
          onEquip={onEquip ? () => onEquip(currentItem) : undefined}
          onPullAgain={onPullAgain}
          onBack={onClose}
          animate
        />
      );
    }

    return (
      <div className="relative flex flex-col items-center justify-center h-full">
        {/* Machine -- zooms and shakes */}
        <div
          style={{
            transform: isZooming
              ? `scale(${1 + (phase === PHASE.ZOOM ? 0 : 0.15)})`
              : isCranking
                ? 'scale(1.3)'
                : 'scale(1.2)',
            transition: 'transform 0.5s ease',
          }}
        >
          <GachaMachine pulling={isCranking} />
        </div>

        {/* Coin drop */}
        <CoinDrop active={phase === PHASE.COIN_DROP} />

        {/* Capsule popping out */}
        {capsuleOut && (
          <div
            className="absolute"
            style={{
              bottom: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              animation: 'pull-capsule-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}
          >
            <Capsule
              rarity={currentItem?.rarity || 'common'}
              size={60}
              cracking={cracked}
            />
          </div>
        )}

        {/* Particle burst on crack */}
        <ParticleBurst
          active={cracked}
          rarity={currentItem?.rarity || 'common'}
          x={window.innerWidth / 2}
          y={window.innerHeight * 0.65}
        />
      </div>
    );
  };

  // 10-pull phases
  const renderMultiPull = () => {
    const isCranking = phase === PHASE.MULTI_CRANK;
    const showLineup = [PHASE.MULTI_LINEUP, PHASE.MULTI_CRACK, PHASE.MULTI_LEGENDARY].includes(phase);

    if (phase === PHASE.MULTI_GRID) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-4 gap-4">
          <h2
            style={{
              fontFamily: "'Pacifico', cursive",
              fontSize: 22,
              color: '#ffd700',
              textShadow: '0 0 16px rgba(255,215,0,0.4)',
            }}
          >
            Your Pulls!
          </h2>

          {/* 2x5 grid */}
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: 'repeat(5, 1fr)',
              maxWidth: 400,
              width: '100%',
            }}
          >
            {items.map((item, i) => {
              const rarity = (item?.rarity || 'common').toLowerCase();
              const color = RARITY_COLORS[rarity] || RARITY_COLORS.common;
              const isNew = isItemNew(item);
              const isDup = isItemDuplicate(item);

              return (
                <div
                  key={i}
                  className="relative flex flex-col items-center rounded-lg p-1.5"
                  style={{
                    background: `linear-gradient(135deg, ${color}22, ${color}11)`,
                    border: `1.5px solid ${color}44`,
                    animation: `pull-grid-item-in 0.3s ${i * 0.06}s ease forwards`,
                    opacity: 0,
                    transform: 'scale(0.8)',
                  }}
                >
                  {/* Mini preview */}
                  <div
                    className="flex items-center justify-center rounded"
                    style={{
                      width: 48,
                      height: 48,
                      background: `${color}15`,
                    }}
                  >
                    <img
                      src={getItemPreviewSvg(item)}
                      alt=""
                      style={{ width: 36, height: 36, objectFit: 'contain' }}
                    />
                  </div>

                  {/* Rarity dots */}
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: { common: 1, rare: 2, epic: 3, legendary: 4 }[rarity] || 1 }, (_, j) => (
                      <div
                        key={j}
                        className="rounded-full"
                        style={{
                          width: 4,
                          height: 4,
                          background: color,
                          boxShadow: `0 0 4px ${color}`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Name */}
                  <span
                    className="text-center mt-0.5 truncate w-full"
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 700,
                      fontSize: 8,
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {item?.name || '???'}
                  </span>

                  {/* NEW badge */}
                  {isNew && (
                    <div
                      className="absolute -top-1 -right-1 px-1 rounded-full"
                      style={{
                        background: '#00e5ff',
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 900,
                        fontSize: 7,
                        color: '#fff',
                      }}
                    >
                      NEW
                    </div>
                  )}

                  {/* Duplicate +1 badge */}
                  {isDup && (
                    <div
                      className="absolute -top-1 -right-1 px-1 rounded-full"
                      style={{
                        background: '#9c27b0',
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        fontSize: 7,
                        color: '#fff',
                      }}
                    >
                      +1
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary: duplicates converted */}
          {items.some((it) => isItemDuplicate(it)) && (
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                color: '#ce93d8',
              }}
            >
              Duplicates converted to Style Shards
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-2">
            {onPullAgain && (
              <button
                onClick={onPullAgain}
                className="px-5 py-2 rounded-full transition-all duration-200 active:scale-95"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 800,
                  fontSize: 13,
                  color: '#ffd700',
                  background: 'rgba(255,215,0,0.1)',
                  border: '1.5px solid rgba(255,215,0,0.35)',
                }}
              >
                Pull Again
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full transition-all duration-200 active:scale-95"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Back
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col items-center justify-center h-full">
        {/* Machine (crank phase) */}
        {isCranking && (
          <div style={{ transform: 'scale(0.8)' }}>
            <GachaMachine pulling />
          </div>
        )}

        {/* Capsule lineup */}
        {showLineup && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm">
            {items.map((item, i) => {
              const isLeg = legendaryIdx === i && phase === PHASE.MULTI_LEGENDARY;
              return (
                <div
                  key={i}
                  className="relative"
                  style={{
                    animation: `pull-capsule-lineup ${0.3}s ${i * 0.08}s ease forwards`,
                    opacity: 0,
                    filter: phase === PHASE.MULTI_LEGENDARY && legendaryIdx !== i
                      ? 'brightness(0.3)'
                      : 'none',
                    transition: 'filter 0.4s ease',
                    transform: isLeg ? 'scale(1.4)' : 'scale(1)',
                  }}
                >
                  <Capsule
                    rarity={item?.rarity || 'common'}
                    size={isLeg ? 50 : 36}
                    cracking={crackedIndices.has(i)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ── Main render ──────────────────────────────────────────────── */

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 50,
        background: 'rgba(13,0,16,0.95)',
        backdropFilter: 'blur(8px)',
        transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
      }}
    >
      {/* Legendary flash overlay */}
      <LegendaryFlash active={phase === PHASE.LEGENDARY_FLASH || phase === PHASE.MULTI_LEGENDARY} />

      {/* Confetti */}
      <ParticleBurst
        active={showConfetti}
        rarity={hasLegendary ? 'legendary' : 'epic'}
        x={window.innerWidth / 2}
        y={window.innerHeight / 2}
      />

      {/* Skip button (during animations) */}
      {phase !== PHASE.REVEAL && phase !== PHASE.MULTI_GRID && (
        <button
          onClick={() => {
            if (isMulti) {
              const allIdx = new Set(items.map((_, i) => i));
              setCrackedIndices(allIdx);
              setPhase(PHASE.MULTI_GRID);
            } else {
              setPhase(PHASE.REVEAL);
            }
          }}
          className="absolute top-4 right-4 px-3 py-1.5 rounded-full transition-opacity"
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            zIndex: 70,
          }}
        >
          Skip
        </button>
      )}

      {/* Content */}
      {isMulti ? renderMultiPull() : renderSinglePull()}

      {/* Keyframes */}
      <style>{`
        @keyframes pull-coin-drop {
          0% { transform: translateX(-50%) translateY(-40px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(80px); opacity: 1; }
        }
        @keyframes pull-capsule-pop {
          0% { transform: translateX(-50%) translateY(40px) scale(0.3); opacity: 0; }
          60% { transform: translateX(-50%) translateY(-10px) scale(1.15); opacity: 1; }
          100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        }
        @keyframes pull-legendary-flash {
          0% { opacity: 0; }
          15% { opacity: 1; }
          60% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes pull-flash-expand {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pull-rainbow-shimmer {
          0% { background-position: 0% 50%; opacity: 0; }
          20% { opacity: 0.6; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; opacity: 0; }
        }
        @keyframes pull-capsule-lineup {
          0% { opacity: 0; transform: translateY(20px) scale(0.6); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pull-grid-item-in {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
