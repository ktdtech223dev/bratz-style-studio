import React, { useEffect, useState, useMemo } from 'react';
import useGameStore from '../../store/gameStore';

/* sparkle config for the title area */
const TITLE_SPARKLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  char: ['\u2726', '\u2727', '\u2605'][i % 3],
  color: ['#ffd700', '#ff2d78', '#00e5ff'][i % 3],
  top: `${20 + Math.random() * 50}%`,
  left: `${10 + Math.random() * 80}%`,
  size: 10 + Math.random() * 16,
  delay: Math.random() * 3,
  duration: 2 + Math.random() * 2,
}));

export default function SplashScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const playerId = useGameStore((s) => s.player.id);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  function handleTap() {
    if (playerId) {
      setScreen('dressup');
    } else {
      setScreen('character-select');
    }
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-full"
      onClick={handleTap}
      style={{ cursor: 'pointer' }}
    >
      {/* radial glow behind title */}
      <div
        className="absolute"
        style={{
          width: '80vw',
          height: '80vw',
          maxWidth: 500,
          maxHeight: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,45,120,0.15) 0%, rgba(156,39,176,0.08) 40%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
          pointerEvents: 'none',
        }}
      />

      {/* animated sparkles around title */}
      {TITLE_SPARKLES.map((s) => (
        <span
          key={s.id}
          className="absolute pointer-events-none"
          style={{
            top: s.top,
            left: s.left,
            color: s.color,
            fontSize: s.size,
            animation: `splash-sparkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
            opacity: 0,
          }}
        >
          {s.char}
        </span>
      ))}

      {/* main title */}
      <h1
        className="text-legendary text-center relative"
        style={{
          fontFamily: "'Pacifico', cursive",
          fontSize: 'clamp(36px, 10vw, 64px)',
          lineHeight: 1.2,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.9)',
          transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          textShadow: '0 0 40px rgba(255,45,120,0.4), 0 0 80px rgba(156,39,176,0.2)',
          padding: '0 20px',
        }}
      >
        BRATZ
        <br />
        STYLE STUDIO
      </h1>

      {/* subtitle */}
      <p
        className="text-center mt-4"
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 'clamp(14px, 3.5vw, 18px)',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.8s 0.3s ease, transform 0.8s 0.3s ease',
        }}
      >
        The Ultimate Fashion Experience
      </p>

      {/* decorative line */}
      <div
        className="mt-6"
        style={{
          width: 60,
          height: 2,
          background: 'linear-gradient(90deg, transparent, #ff2d78, transparent)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.8s 0.5s ease',
        }}
      />

      {/* tap to start */}
      <button
        className="touch-target mt-12 px-8 py-3 rounded-full"
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#fff',
          background: 'linear-gradient(135deg, #ff2d78, #9c27b0)',
          boxShadow: '0 0 24px rgba(255,45,120,0.4), 0 4px 16px rgba(0,0,0,0.4)',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s 0.7s ease, transform 0.8s 0.7s ease',
          animation: loaded ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        }}
      >
        TAP TO START
      </button>

      {/* inline keyframes for splash-specific animations */}
      <style>{`
        @keyframes splash-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 0.8; transform: scale(1.2) rotate(180deg); }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 24px rgba(255,45,120,0.4), 0 4px 16px rgba(0,0,0,0.4);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 40px rgba(255,45,120,0.6), 0 4px 24px rgba(0,0,0,0.4);
            transform: scale(1.04);
          }
        }
      `}</style>
    </div>
  );
}
