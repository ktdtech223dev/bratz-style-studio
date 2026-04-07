import React, { useEffect, useRef, useState } from 'react';
import useGameStore from '../../store/gameStore';

/* Animated number that counts up/down to the target value */
function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;

    if (from === to) return;

    const diff = to - from;
    const steps = Math.min(Math.abs(diff), 20);
    const stepTime = Math.max(40, 600 / steps);
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setDisplay(Math.round(from + diff * progress));
      if (step >= steps) {
        clearInterval(timer);
        setDisplay(to);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: 12,
        color: '#1a0010',
      }}
    >
      {display.toLocaleString()}
    </span>
  );
}

/* Currency icon with SVG + emoji fallback */
function CurrencyIcon({ src, fallback, color }) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <span style={{ fontSize: 13, color, lineHeight: 1 }}>{fallback}</span>;
  }

  return (
    <img
      src={src}
      alt=""
      width={15}
      height={15}
      onError={() => setUseFallback(true)}
      style={{ display: 'block' }}
    />
  );
}

/* Currency pill badge — white with pink border */
function CurrencyPill({ icon, fallback, iconColor, value, src }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2 py-1"
      style={{
        background: '#FFFFFF',
        border: '2px solid #FF69B4',
        boxShadow: '1px 1px 0 #FF1493',
      }}
    >
      <CurrencyIcon src={src} fallback={fallback} color={iconColor} />
      <AnimatedCount value={value} />
    </div>
  );
}

export default function TopBar() {
  const currentScreen = useGameStore((s) => s.ui.currentScreen);
  const coins = useGameStore((s) => s.player.coins);
  const gems = useGameStore((s) => s.player.gems);
  const character = useGameStore((s) => s.outfit.character);
  const setScreen = useGameStore((s) => s.setScreen);

  /* Portrait emoji by character */
  const portraitEmoji = {
    cloe:   '👱‍♀️',
    yasmin: '👩',
    sasha:  '👩‍🦱',
    jade:   '👩‍🦳',
  }[character] || '💃';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 no-select"
      style={{
        height: 52,
        background: '#FFFFFF',
        borderBottom: '2px solid #FF69B4',
        boxShadow: '0 2px 0 rgba(255,20,147,0.1)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Left: character portrait circle */}
      <button
        onClick={() => setScreen('character-select')}
        className="touch-target flex items-center justify-center rounded-full overflow-hidden"
        style={{
          width: 36,
          height: 36,
          background: '#FFF0F5',
          border: '2px solid #FF1493',
          boxShadow: '2px 2px 0 #C2185B',
          flexShrink: 0,
          cursor: 'pointer',
        }}
        aria-label="Change character"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{portraitEmoji}</span>
      </button>

      {/* Center: title in Press Start 2P */}
      <h1
        className="text-center truncate mx-2"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7,
          color: '#FF1493',
          textShadow: '1px 1px 0 #1a0010',
          flex: 1,
          lineHeight: 1.4,
          letterSpacing: '0.02em',
        }}
      >
        ✨ BRATZ STYLE STUDIO ✨
      </h1>

      {/* Right: coin + gem displays */}
      <div className="flex items-center gap-1.5" style={{ flexShrink: 0 }}>
        <CurrencyPill
          src="/assets/icons/coin.svg"
          fallback="🪙"
          iconColor="#DAA520"
          value={coins}
        />
        <CurrencyPill
          src="/assets/icons/gem.svg"
          fallback="💎"
          iconColor="#9c27b0"
          value={gems}
        />
      </div>
    </header>
  );
}
