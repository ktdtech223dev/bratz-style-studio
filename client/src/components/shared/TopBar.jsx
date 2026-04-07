import React, { useEffect, useRef, useState } from 'react';
/* eslint-disable react/no-unknown-property */
import useGameStore from '../../store/gameStore';

const SCREEN_TITLES = {
  dressup: 'Dress Up',
  gacha: 'Gacha',
  challenges: 'Challenges',
  collection: 'Collection',
  profile: 'Profile',
  'character-select': 'Choose Your Bratz',
};

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
      className="transition-transform duration-150"
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 700,
        fontSize: 13,
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
    return <span style={{ fontSize: 14, color, lineHeight: 1 }}>{fallback}</span>;
  }

  return (
    <img
      src={src}
      alt=""
      width={16}
      height={16}
      onError={() => setUseFallback(true)}
      style={{ display: 'block' }}
    />
  );
}

export default function TopBar() {
  const currentScreen = useGameStore((s) => s.ui.currentScreen);
  const coins = useGameStore((s) => s.player.coins);
  const gems = useGameStore((s) => s.player.gems);
  const character = useGameStore((s) => s.outfit.character);
  const setScreen = useGameStore((s) => s.setScreen);

  const title = SCREEN_TITLES[currentScreen] || 'Style Studio';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3"
      style={{
        height: 52,
        background: 'rgba(13,0,16,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,45,120,0.1)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* left: character portrait */}
      <button
        onClick={() => setScreen('character-select')}
        className="touch-target flex items-center justify-center rounded-full overflow-hidden"
        style={{
          width: 36,
          height: 36,
          background: 'linear-gradient(135deg, #ff2d78, #9c27b0)',
          border: '2px solid rgba(255,255,255,0.2)',
          flexShrink: 0,
        }}
        aria-label="Change character"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>
          {character === 'cloe' && '\uD83D\uDC71\u200D\u2640\uFE0F'}
          {character === 'yasmin' && '\uD83D\uDC69'}
          {character === 'sasha' && '\uD83D\uDC69\u200D\uD83E\uDDB1'}
          {character === 'jade' && '\uD83D\uDC69\u200D\uD83E\uDDB3'}
          {!['cloe', 'yasmin', 'sasha', 'jade'].includes(character) && '\uD83D\uDC83'}
        </span>
      </button>

      {/* center: title */}
      <h1
        className="text-legendary text-center truncate mx-2"
        style={{
          fontFamily: "'Pacifico', cursive",
          fontSize: 16,
          flex: 1,
          lineHeight: 1.2,
        }}
      >
        {currentScreen === 'dressup' ? '\u2728 BRATZ STYLE STUDIO \u2728' : title}
      </h1>

      {/* right: currency display */}
      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
        {/* coins */}
        <div
          className="flex items-center gap-1 rounded-full px-2 py-1"
          style={{
            background: 'rgba(255,215,0,0.12)',
            border: '1px solid rgba(255,215,0,0.25)',
          }}
        >
          <CurrencyIcon src="/assets/icons/coin.svg" fallback={'\uD83E\uDE99'} color="#ffd700" />
          <AnimatedCount value={coins} />
        </div>

        {/* gems */}
        <div
          className="flex items-center gap-1 rounded-full px-2 py-1"
          style={{
            background: 'rgba(0,229,255,0.1)',
            border: '1px solid rgba(0,229,255,0.2)',
          }}
        >
          <CurrencyIcon src="/assets/icons/gem.svg" fallback={'\uD83D\uDC8E'} color="#00e5ff" />
          <AnimatedCount value={gems} />
        </div>
      </div>
    </header>
  );
}
