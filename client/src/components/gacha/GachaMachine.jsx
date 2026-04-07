import React, { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Floating star particle that drifts upward around the machine.
 */
function FloatingParticle({ index }) {
  const chars = ['\u2726', '\u2727', '\u2605', '\u2736'];
  const colors = ['#ffd700', '#ff2d78', '#00e5ff', '#ff69b4', '#ffffff'];
  return (
    <span
      className="absolute pointer-events-none"
      style={{
        left: `${15 + Math.random() * 70}%`,
        bottom: `${-5 - Math.random() * 10}%`,
        color: colors[index % colors.length],
        fontSize: 8 + Math.random() * 12,
        opacity: 0,
        animation: `gacha-float ${3 + Math.random() * 3}s ${Math.random() * 4}s ease-in-out infinite`,
      }}
    >
      {chars[index % chars.length]}
    </span>
  );
}

/**
 * Capsule visible inside the machine dome.
 */
function DomeCapsule({ index, total }) {
  const capsuleColors = ['#9e9e9e', '#2196f3', '#9c27b0', '#ffd700', '#ff2d78'];
  const offset = (index / total) * 100;
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: 14,
        height: 18,
        background: `radial-gradient(circle at 40% 30%, ${capsuleColors[index % capsuleColors.length]}cc, ${capsuleColors[index % capsuleColors.length]}88)`,
        border: `1px solid ${capsuleColors[index % capsuleColors.length]}`,
        left: `${20 + (offset % 60)}%`,
        top: `${25 + ((index * 17) % 30)}%`,
        animation: `gacha-capsule-bob ${2 + (index % 3) * 0.5}s ${index * 0.3}s ease-in-out infinite`,
        boxShadow: `0 0 6px ${capsuleColors[index % capsuleColors.length]}44`,
      }}
    />
  );
}

/**
 * GachaMachine -- the visual gacha machine with idle and pull animations.
 *
 * @param {object}  props
 * @param {boolean} [props.pulling]   - true when a pull is in progress
 * @param {function} [props.onPullComplete] - called when the pull animation finishes
 */
export default function GachaMachine({ pulling = false, onPullComplete }) {
  const machineRef = useRef(null);
  const [flash, setFlash] = useState(false);
  const pullTimerRef = useRef(null);

  // Pull animation: shake + flash
  useEffect(() => {
    if (!pulling) {
      setFlash(false);
      return;
    }

    // Flash the internal light
    const flashInterval = setInterval(() => {
      setFlash((f) => !f);
    }, 150);

    // End pull animation after ~1.5s
    pullTimerRef.current = setTimeout(() => {
      clearInterval(flashInterval);
      setFlash(false);
      if (onPullComplete) onPullComplete();
    }, 1500);

    return () => {
      clearInterval(flashInterval);
      if (pullTimerRef.current) clearTimeout(pullTimerRef.current);
    };
  }, [pulling, onPullComplete]);

  return (
    <div
      ref={machineRef}
      className="relative flex items-center justify-center"
      style={{
        width: 260,
        height: 320,
        animation: pulling
          ? 'gacha-shake 0.15s ease-in-out infinite'
          : 'gacha-idle-pulse 3s ease-in-out infinite',
      }}
    >
      {/* Floating star particles around the machine */}
      {Array.from({ length: 8 }, (_, i) => (
        <FloatingParticle key={i} index={i} />
      ))}

      {/* Background glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: '110%',
          height: '110%',
          background: pulling
            ? 'radial-gradient(circle, rgba(255,215,0,0.25) 0%, rgba(255,45,120,0.12) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255,45,120,0.1) 0%, rgba(156,39,176,0.06) 40%, transparent 70%)',
          transition: 'background 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Machine body */}
      <div className="relative" style={{ width: 200, height: 280 }}>
        {/* Machine dome (top glass section) */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: 0,
            left: 20,
            width: 160,
            height: 150,
            borderRadius: '80px 80px 20px 20px',
            background: flash
              ? 'linear-gradient(180deg, rgba(255,215,0,0.5) 0%, rgba(255,45,120,0.3) 50%, rgba(13,0,16,0.6) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,45,120,0.04) 50%, rgba(13,0,16,0.6) 100%)',
            border: '3px solid rgba(255,45,120,0.3)',
            borderBottom: '3px solid rgba(255,45,120,0.5)',
            boxShadow: flash
              ? '0 0 30px rgba(255,215,0,0.4), inset 0 0 40px rgba(255,215,0,0.2)'
              : '0 0 20px rgba(255,45,120,0.15), inset 0 0 30px rgba(0,0,0,0.3)',
            transition: 'background 0.1s, box-shadow 0.1s',
          }}
        >
          {/* Glass shine */}
          <div
            className="absolute"
            style={{
              top: 10,
              left: 15,
              width: 40,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />

          {/* Capsules inside dome */}
          {Array.from({ length: 6 }, (_, i) => (
            <DomeCapsule key={i} index={i} total={6} />
          ))}
        </div>

        {/* Machine body section */}
        <div
          className="absolute"
          style={{
            top: 145,
            left: 10,
            width: 180,
            height: 100,
            borderRadius: '8px 8px 16px 16px',
            background: 'linear-gradient(180deg, #2a0040 0%, #1a0028 40%, #0d0010 100%)',
            border: '3px solid rgba(255,45,120,0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {/* Brand plate */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 28,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #ff2d78, #9c27b0)',
              boxShadow: '0 0 12px rgba(255,45,120,0.3)',
            }}
          >
            <span
              style={{
                fontFamily: "'Pacifico', cursive",
                fontSize: 12,
                color: '#fff',
                textShadow: '0 0 8px rgba(255,255,255,0.3)',
              }}
            >
              Style Capsule
            </span>
          </div>

          {/* Crank handle */}
          <div
            className="absolute"
            style={{
              right: -22,
              top: 30,
              width: 20,
              height: 8,
              borderRadius: 4,
              background: 'linear-gradient(90deg, #ffd700, #ffaa00)',
              boxShadow: '0 0 8px rgba(255,215,0,0.4)',
              animation: pulling ? 'gacha-crank 0.4s ease-in-out infinite' : 'none',
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                right: -8,
                top: -4,
                width: 16,
                height: 16,
                background: 'radial-gradient(circle at 40% 30%, #ffd700, #cc8800)',
                border: '2px solid #ffaa00',
                boxShadow: '0 0 10px rgba(255,215,0,0.5)',
              }}
            />
          </div>

          {/* Dispensing slot */}
          <div
            className="absolute"
            style={{
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 50,
              height: 24,
              borderRadius: '0 0 12px 12px',
              background: 'rgba(0,0,0,0.6)',
              border: '2px solid rgba(255,45,120,0.2)',
              borderTop: 'none',
              boxShadow: 'inset 0 -4px 10px rgba(0,0,0,0.5)',
            }}
          />
        </div>

        {/* Machine base/feet */}
        <div
          className="absolute"
          style={{
            bottom: 0,
            left: 5,
            width: 190,
            height: 20,
            borderRadius: '4px 4px 12px 12px',
            background: 'linear-gradient(180deg, #1a0028, #0d0010)',
            border: '2px solid rgba(255,45,120,0.15)',
          }}
        />
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes gacha-idle-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        @keyframes gacha-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-4px) rotate(-1deg); }
          75% { transform: translateX(4px) rotate(1deg); }
        }
        @keyframes gacha-float {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          20% { opacity: 0.7; }
          80% { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-120px) scale(1.2) rotate(180deg); }
        }
        @keyframes gacha-capsule-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes gacha-crank {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(45deg); }
        }
      `}</style>
    </div>
  );
}
