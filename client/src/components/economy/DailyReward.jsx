import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

/* ─── Reward schedule ────────────────────────────────────────────── */

const REWARDS = [
  { day: 1, coins: 50 },
  { day: 2, coins: 100 },
  { day: 3, coins: 150, gems: 5 },
  { day: 4, coins: 200 },
  { day: 5, coins: 250, gems: 10 },
  { day: 6, coins: 300 },
  { day: 7, coins: 500, gems: 25, freePull: true },
];

/* ─── Particle component ─────────────────────────────────────────── */

function Particle({ type, x, delay }) {
  const emoji = type === 'coin' ? '\uD83E\uDE99' : '\uD83D\uDC8E';
  return (
    <span
      className="absolute pointer-events-none text-lg animate-bounce"
      style={{
        left: `${x}%`,
        top: '40%',
        animationDelay: `${delay}ms`,
        animationDuration: '1.2s',
        animation: `particle-fall 1.4s ease-out ${delay}ms forwards`,
        opacity: 0,
      }}
    >
      {emoji}
    </span>
  );
}

/* ─── Floating "+X" text ─────────────────────────────────────────── */

function FloatingAmount({ amount, type, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <span
      className="absolute pointer-events-none font-bold"
      style={{
        fontFamily: "'Orbitron', sans-serif",
        color: type === 'coins' ? '#ffd700' : '#00e5ff',
        fontSize: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '100%',
        animation: 'float-up 1.5s ease-out forwards',
        textShadow: `0 0 8px ${type === 'coins' ? 'rgba(255,215,0,0.8)' : 'rgba(0,229,255,0.8)'}`,
      }}
    >
      +{amount}
    </span>
  );
}

/* ═══ DailyReward ═══════════════════════════════════════════════════ */

export default function DailyReward() {
  const loginStreak = useGameStore((s) => s.player.loginStreak);
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);
  const setShowDailyReward = useGameStore((s) => s.setShowDailyReward);

  const [claimed, setClaimed] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [floats, setFloats] = useState([]);
  const containerRef = useRef(null);

  // Current day in the 7-day cycle (0-indexed for array, 1-indexed for display)
  const currentDayIndex = loginStreak % 7;
  const currentReward = REWARDS[currentDayIndex];
  const cycleCount = Math.floor(loginStreak / 7);
  const bonusMultiplier = 1 + cycleCount * 0.1;

  const handleClaim = useCallback(async () => {
    if (claimed) return;

    const result = await claimDailyReward();
    if (result) {
      setClaimed(true);
      setShowParticles(true);

      // Floating amounts
      const newFloats = [];
      if (currentReward.coins) {
        newFloats.push({
          id: 'coins',
          amount: Math.floor(currentReward.coins * bonusMultiplier),
          type: 'coins',
        });
      }
      if (currentReward.gems) {
        newFloats.push({
          id: 'gems',
          amount: Math.floor(currentReward.gems * bonusMultiplier),
          type: 'gems',
        });
      }
      setFloats(newFloats);

      setTimeout(() => setShowParticles(false), 2000);
    }
  }, [claimed, claimDailyReward, currentReward, bonusMultiplier]);

  const handleClose = useCallback(() => {
    setShowDailyReward(false);
  }, [setShowDailyReward]);

  // Generate particles
  const particles = [];
  if (showParticles) {
    for (let i = 0; i < 20; i++) {
      particles.push(
        <Particle
          key={`p-${i}`}
          type={i % 3 === 0 && currentReward.gems ? 'gem' : 'coin'}
          x={10 + Math.random() * 80}
          delay={i * 80}
        />
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={handleClose}
    >
      {/* Keyframe styles */}
      <style>{`
        @keyframes particle-fall {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          60% { opacity: 1; }
          100% { opacity: 0; transform: translateY(120px) scale(0.4) rotate(40deg); }
        }
        @keyframes float-up {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-48px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(255,45,120,0.5), 0 0 24px rgba(255,45,120,0.2); }
          50% { box-shadow: 0 0 20px rgba(255,45,120,0.8), 0 0 40px rgba(255,45,120,0.4); }
        }
        @keyframes claim-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>

      <div
        ref={containerRef}
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a0026 0%, #2d0040 50%, #1a0026 100%)',
          border: '2px solid rgba(255,45,120,0.3)',
          boxShadow: '0 0 40px rgba(255,45,120,0.15), 0 8px 32px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Particles overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles}
        </div>

        {/* Header */}
        <div className="text-center pt-5 pb-3 px-4">
          <h2
            className="text-2xl mb-1"
            style={{
              fontFamily: "'Pacifico', cursive",
              color: '#ffd700',
              textShadow: '0 0 16px rgba(255,215,0,0.4)',
            }}
          >
            Daily Reward!
          </h2>
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ fontSize: 16 }}>{'\uD83D\uDD25'}</span>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                color: '#ff2d78',
              }}
            >
              {loginStreak + (claimed ? 1 : 0)} Day Streak
            </span>
            {cycleCount > 0 && (
              <span
                className="ml-1 rounded-full px-2 py-0.5 text-xs font-bold"
                style={{
                  background: 'rgba(255,215,0,0.15)',
                  color: '#ffd700',
                  border: '1px solid rgba(255,215,0,0.3)',
                }}
              >
                +{Math.round(cycleCount * 10)}% bonus
              </span>
            )}
          </div>
        </div>

        {/* 7-day calendar row */}
        <div className="flex gap-2 px-3 pb-4 overflow-x-auto" style={{ scrollSnapType: 'x mandatory' }}>
          {REWARDS.map((reward, idx) => {
            const isPast = idx < currentDayIndex;
            const isToday = idx === currentDayIndex;
            const isFuture = idx > currentDayIndex;

            return (
              <div
                key={reward.day}
                className="relative flex-shrink-0 flex flex-col items-center rounded-xl p-2 min-w-[72px]"
                style={{
                  scrollSnapAlign: 'center',
                  background: isToday
                    ? 'linear-gradient(180deg, rgba(255,45,120,0.2) 0%, rgba(255,45,120,0.05) 100%)'
                    : isPast
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  border: isToday
                    ? '2px solid #ff2d78'
                    : '1px solid rgba(255,255,255,0.08)',
                  opacity: isFuture ? 0.4 : 1,
                  animation: isToday && !claimed ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                }}
              >
                {/* Day label */}
                <span
                  className="text-xs font-bold mb-1"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    color: isToday ? '#ff2d78' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  Day {reward.day}
                </span>

                {/* Reward icon */}
                <div className="relative text-xl mb-1">
                  {isPast && claimed ? (
                    <span style={{ color: '#4caf50' }}>{'\u2714'}</span>
                  ) : isPast ? (
                    <span style={{ color: '#4caf50' }}>{'\u2714'}</span>
                  ) : (
                    <span>{reward.freePull ? '\uD83C\uDF1F' : '\uD83E\uDE99'}</span>
                  )}
                  {/* Floating amount on claim */}
                  {isToday &&
                    floats.map((f) => (
                      <FloatingAmount
                        key={f.id}
                        amount={f.amount}
                        type={f.type}
                        onDone={() => setFloats((prev) => prev.filter((p) => p.id !== f.id))}
                      />
                    ))}
                </div>

                {/* Coin amount */}
                <span
                  className="text-xs font-bold"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#ffd700',
                    fontSize: 11,
                  }}
                >
                  {Math.floor(reward.coins * bonusMultiplier)}
                </span>

                {/* Gem amount */}
                {reward.gems && (
                  <span
                    className="text-xs font-bold"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      color: '#00e5ff',
                      fontSize: 10,
                    }}
                  >
                    +{Math.floor(reward.gems * bonusMultiplier)}{'\uD83D\uDC8E'}
                  </span>
                )}

                {/* Free pull badge */}
                {reward.freePull && (
                  <span
                    className="text-xs font-bold mt-0.5 rounded-full px-1.5 py-0.5"
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 8,
                      background: 'linear-gradient(90deg, #ffd700, #ff2d78)',
                      color: '#fff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Free Pull
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim button or message */}
        <div className="px-4 pb-5 text-center">
          {!claimed ? (
            <button
              onClick={handleClaim}
              className="w-full py-3.5 rounded-xl text-white font-bold text-lg"
              style={{
                fontFamily: "'Nunito', sans-serif",
                background: 'linear-gradient(135deg, #ff2d78 0%, #c2185b 100%)',
                boxShadow: '0 0 20px rgba(255,45,120,0.5), 0 4px 12px rgba(0,0,0,0.4)',
                animation: 'claim-pulse 1.8s ease-in-out infinite',
                minHeight: 48,
                touchAction: 'manipulation',
              }}
            >
              Claim!
            </button>
          ) : (
            <div>
              <p
                className="text-sm mb-2"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                {currentDayIndex < 6
                  ? `Come back tomorrow for Day ${currentDayIndex + 2}!`
                  : 'Streak complete! Resets with +10% bonus next cycle!'}
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl text-white font-bold"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  minHeight: 44,
                  touchAction: 'manipulation',
                }}
              >
                Awesome!
              </button>
            </div>
          )}
        </div>

        {/* Streak bonus note */}
        {cycleCount === 0 && !claimed && (
          <p
            className="text-center text-xs pb-3 px-4"
            style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Nunito', sans-serif" }}
          >
            After Day 7, streak resets with +10% bonus!
          </p>
        )}
      </div>
    </div>
  );
}
