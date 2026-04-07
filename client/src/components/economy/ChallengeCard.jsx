import React, { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

/* ─── Type badge colors ──────────────────────────────────────────── */

const TYPE_STYLES = {
  Daily: { bg: 'rgba(255,45,120,0.15)', color: '#ff2d78', border: 'rgba(255,45,120,0.3)' },
  Weekly: { bg: 'rgba(0,229,255,0.12)', color: '#00e5ff', border: 'rgba(0,229,255,0.25)' },
  Achievement: { bg: 'rgba(255,215,0,0.12)', color: '#ffd700', border: 'rgba(255,215,0,0.25)' },
};

/* ─── Coin particle ──────────────────────────────────────────────── */

function ClaimParticle({ type, x, delay }) {
  return (
    <span
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: '50%',
        fontSize: 14,
        animation: `challenge-particle 1s ease-out ${delay}ms forwards`,
        opacity: 0,
      }}
    >
      {type === 'coin' ? '\uD83E\uDE99' : '\uD83D\uDC8E'}
    </span>
  );
}

/* ═══ ChallengeCard ══════════════════════════════════════════════════ */

export default function ChallengeCard({
  challenge,
  type = 'Daily',
  status = 'active', // 'active' | 'completed' | 'claimed'
  progress = null, // { current, target } or null
  claimedAt = null,
  onClaim,
}) {
  const claimChallenge = useGameStore((s) => s.claimChallenge);
  const [showParticles, setShowParticles] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  const handleClaim = useCallback(async () => {
    if (localStatus !== 'completed') return;

    setShowParticles(true);
    const result = await claimChallenge(challenge.id);
    if (result) {
      setLocalStatus('claimed');
      if (onClaim) onClaim(challenge.id, result);
    }
    setTimeout(() => setShowParticles(false), 1200);
  }, [localStatus, claimChallenge, challenge.id, onClaim]);

  const typeStyle = TYPE_STYLES[type] || TYPE_STYLES.Daily;
  const isCompleted = localStatus === 'completed';
  const isClaimed = localStatus === 'claimed';

  // Particles
  const particles = [];
  if (showParticles) {
    for (let i = 0; i < 10; i++) {
      particles.push(
        <ClaimParticle
          key={`cp-${i}`}
          type={i % 3 === 0 && challenge.reward?.gems ? 'gem' : 'coin'}
          x={15 + Math.random() * 70}
          delay={i * 60}
        />
      );
    }
  }

  return (
    <>
      <style>{`
        @keyframes challenge-particle {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
        }
        @keyframes completed-pulse {
          0%, 100% { border-color: rgba(255,45,120,0.4); }
          50% { border-color: rgba(255,45,120,0.8); }
        }
        @keyframes glow-btn {
          0%, 100% { box-shadow: 0 0 8px rgba(255,45,120,0.4); }
          50% { box-shadow: 0 0 18px rgba(255,45,120,0.7); }
        }
      `}</style>

      <div
        className="relative rounded-xl p-3.5 overflow-hidden"
        style={{
          background: isClaimed
            ? 'rgba(255,255,255,0.03)'
            : 'linear-gradient(135deg, rgba(45,0,64,0.8) 0%, rgba(26,0,38,0.9) 100%)',
          border: isCompleted
            ? '2px solid #ff2d78'
            : '1px solid rgba(255,255,255,0.08)',
          opacity: isClaimed ? 0.55 : 1,
          animation: isCompleted ? 'completed-pulse 2s ease-in-out infinite' : 'none',
          touchAction: 'manipulation',
        }}
      >
        {/* Particles overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">{particles}</div>

        {/* Top row: type badge + reward */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-bold rounded-full px-2 py-0.5"
            style={{
              fontFamily: "'Nunito', sans-serif",
              background: typeStyle.bg,
              color: typeStyle.color,
              border: `1px solid ${typeStyle.border}`,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {type}
          </span>

          {/* Reward display */}
          <div className="flex items-center gap-2">
            {challenge.reward?.coins && (
              <div className="flex items-center gap-0.5">
                <span style={{ fontSize: 13 }}>{'\uD83E\uDE99'}</span>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#ffd700',
                  }}
                >
                  {challenge.reward.coins}
                </span>
              </div>
            )}
            {challenge.reward?.gems && (
              <div className="flex items-center gap-0.5">
                <span style={{ fontSize: 13 }}>{'\uD83D\uDC8E'}</span>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#00e5ff',
                  }}
                >
                  {challenge.reward.gems}
                </span>
              </div>
            )}
            {challenge.reward?.gachaTicket && (
              <div className="flex items-center gap-0.5">
                <span style={{ fontSize: 13 }}>{'\uD83C\uDFAB'}</span>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#ff69b4',
                  }}
                >
                  x{challenge.reward.gachaTicket}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p
          className="text-sm mb-2"
          style={{
            fontFamily: "'Nunito', sans-serif",
            color: isClaimed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)',
            lineHeight: 1.4,
          }}
        >
          {challenge.description}
          {challenge.name && (
            <span
              className="block text-xs mt-0.5"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {challenge.name}
            </span>
          )}
        </p>

        {/* Progress bar */}
        {progress && localStatus === 'active' && (
          <div className="mb-2.5">
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((progress.current / progress.target) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #ff2d78, #ff69b4)',
                }}
              />
            </div>
            <p
              className="text-xs mt-1 text-right"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: 'rgba(255,255,255,0.4)',
                fontSize: 10,
              }}
            >
              {progress.current}/{progress.target}
            </p>
          </div>
        )}

        {/* Bottom: claim button or status */}
        {isCompleted && (
          <button
            onClick={handleClaim}
            className="w-full py-2.5 rounded-lg text-white font-bold text-sm"
            style={{
              fontFamily: "'Nunito', sans-serif",
              background: 'linear-gradient(135deg, #ff2d78, #c2185b)',
              animation: 'glow-btn 1.5s ease-in-out infinite',
              minHeight: 44,
              touchAction: 'manipulation',
            }}
          >
            Claim Reward
          </button>
        )}

        {isCompleted && !isClaimed && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span style={{ color: '#4caf50', fontSize: 14 }}>{'\u2714'}</span>
            <span
              className="text-xs font-bold"
              style={{ fontFamily: "'Nunito', sans-serif", color: '#4caf50' }}
            >
              COMPLETE!
            </span>
          </div>
        )}

        {isClaimed && (
          <div className="flex items-center gap-1.5 mt-1">
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{'\u2714'}</span>
            <span
              className="text-xs"
              style={{
                fontFamily: "'Nunito', sans-serif",
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              Claimed{claimedAt ? ` ${claimedAt}` : ''}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
