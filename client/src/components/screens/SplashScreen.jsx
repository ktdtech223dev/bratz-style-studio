import React, { useEffect, useState } from 'react';
import useGameStore from '../../store/gameStore';

/* Fixed sparkle positions to avoid re-randomizing on render */
const TITLE_SPARKLES = [
  { id: 0, char: '✦', color: '#FFD700', top: '12%', left: '8%',  size: 14, delay: 0,    dur: 2.4 },
  { id: 1, char: '★', color: '#FF1493', top: '18%', left: '85%', size: 10, delay: 0.5,  dur: 2.8 },
  { id: 2, char: '✦', color: '#FFD700', top: '28%', left: '92%', size: 12, delay: 1.0,  dur: 2.1 },
  { id: 3, char: '♥', color: '#FF69B4', top: '40%', left: '5%',  size: 10, delay: 0.3,  dur: 3.0 },
  { id: 4, char: '✦', color: '#FF1493', top: '55%', left: '90%', size: 16, delay: 0.8,  dur: 2.5 },
  { id: 5, char: '★', color: '#FFD700', top: '65%', left: '7%',  size: 11, delay: 1.5,  dur: 2.2 },
  { id: 6, char: '♥', color: '#FF1493', top: '72%', left: '88%', size: 9,  delay: 0.2,  dur: 2.9 },
  { id: 7, char: '✦', color: '#FFD700', top: '80%', left: '15%', size: 13, delay: 1.1,  dur: 2.3 },
  { id: 8, char: '★', color: '#FF69B4', top: '85%', left: '80%', size: 10, delay: 0.6,  dur: 2.7 },
  { id: 9, char: '♥', color: '#FFD700', top: '22%', left: '50%', size: 8,  delay: 1.8,  dur: 2.0 },
  { id:10, char: '✦', color: '#FF1493', top: '8%',  left: '35%', size: 12, delay: 0.4,  dur: 3.1 },
  { id:11, char: '★', color: '#FFD700', top: '90%', left: '45%', size: 10, delay: 0.9,  dur: 2.6 },
];

/* Small decorative pixel hearts scattered around edges */
const PIXEL_HEARTS = [
  { id: 0, top: '5%',  left: '3%'  },
  { id: 1, top: '5%',  left: '94%' },
  { id: 2, top: '45%', left: '1%'  },
  { id: 3, top: '45%', left: '96%' },
  { id: 4, top: '88%', left: '3%'  },
  { id: 5, top: '88%', left: '94%' },
];

export default function SplashScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const playerId = useGameStore((s) => s.player.id);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 200);
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
      className="relative flex flex-col items-center justify-center w-full h-full no-select pixel-noise"
      onClick={handleTap}
      style={{
        background: '#FFB6C1',
        cursor: 'pointer',
      }}
    >
      {/* Corner pixel heart decorations */}
      {PIXEL_HEARTS.map((h) => (
        <span
          key={h.id}
          className="absolute pointer-events-none"
          style={{
            top: h.top,
            left: h.left,
            fontSize: 20,
            color: '#FF1493',
            opacity: 0.5,
            fontFamily: 'monospace',
          }}
        >
          ♥
        </span>
      ))}

      {/* Floating sparkles */}
      {TITLE_SPARKLES.map((s) => (
        <span
          key={s.id}
          className="absolute pointer-events-none"
          style={{
            top: s.top,
            left: s.left,
            color: s.color,
            fontSize: s.size,
            animation: `splash-sparkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
            opacity: 0,
          }}
        >
          {s.char}
        </span>
      ))}

      {/* Pink glow panel behind title */}
      <div
        className="absolute"
        style={{
          width: '90vw',
          maxWidth: 420,
          height: 'auto',
          background: 'rgba(255,20,147,0.08)',
          borderRadius: 4,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -52%)',
          padding: '60px 30px 80px',
          border: '2px solid rgba(255,20,147,0.15)',
          pointerEvents: 'none',
        }}
      />

      {/* Main title — Press Start 2P, hot pink, pixel drop shadow */}
      <h1
        className="text-center relative z-10"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 'clamp(18px, 5vw, 26px)',
          lineHeight: 1.6,
          color: '#FF1493',
          textShadow: '3px 3px 0 #1a0010',
          letterSpacing: '0.02em',
          padding: '0 16px',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        BRATZ
        <br />
        STYLE
        <br />
        STUDIO
      </h1>

      {/* Subtitle */}
      <p
        className="text-center relative z-10 mt-4"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 'clamp(7px, 2vw, 9px)',
          color: '#C2185B',
          textShadow: '1px 1px 0 #1a0010',
          letterSpacing: '0.05em',
          padding: '0 20px',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s 0.2s ease, transform 0.5s 0.2s ease',
        }}
      >
        THE ULTIMATE FASHION GAME
      </p>

      {/* Decorative pixel divider */}
      <div
        className="relative z-10 mt-6 flex items-center gap-2"
        style={{
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s 0.4s ease',
        }}
      >
        <span style={{ color: '#FF69B4', fontSize: 10 }}>✦</span>
        <div style={{ width: 60, height: 2, background: '#FF1493', boxShadow: '0 0 6px #FF1493' }} />
        <span style={{ color: '#FFD700', fontSize: 10 }}>★</span>
        <div style={{ width: 60, height: 2, background: '#FF1493', boxShadow: '0 0 6px #FF1493' }} />
        <span style={{ color: '#FF69B4', fontSize: 10 }}>✦</span>
      </div>

      {/* PRESS START button — neon-sign style */}
      <button
        className="neon-sign touch-target relative z-10 mt-10 px-6 py-3"
        style={{
          fontSize: 'clamp(8px, 2.5vw, 11px)',
          letterSpacing: '0.08em',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s 0.6s ease, transform 0.5s 0.6s ease',
          animation: loaded ? 'press-start-pulse 2s ease-in-out infinite' : 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        PRESS START
      </button>

      {/* Version label */}
      <p
        className="absolute bottom-6 left-0 right-0 text-center"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 6,
          color: '#C2185B',
          opacity: 0.6,
          letterSpacing: '0.1em',
        }}
      >
        V 1.0 © BRATZ STYLE STUDIO
      </p>

      {/* Inline keyframes */}
      <style>{`
        @keyframes splash-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.6) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.3) rotate(180deg); }
        }
        @keyframes press-start-pulse {
          0%, 100% {
            box-shadow: 0 0 0 2px #FF69B4, 0 0 12px #FF1493, inset 0 0 15px rgba(255,20,147,0.2);
          }
          50% {
            box-shadow: 0 0 0 2px #FF69B4, 0 0 28px #FF1493, 0 0 48px rgba(255,105,180,0.4), inset 0 0 20px rgba(255,20,147,0.3);
          }
        }
      `}</style>
    </div>
  );
}
