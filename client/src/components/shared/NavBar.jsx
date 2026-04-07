import React from 'react';
import useGameStore from '../../store/gameStore';

const TABS = [
  { id: 'dressup', label: 'Dress Up', icon: '\uD83D\uDC57', screen: 'dressup' },
  { id: 'gacha', label: 'Gacha', icon: '\u2728', screen: 'gacha' },
  { id: 'challenges', label: 'Challenges', icon: '\uD83C\uDFAF', screen: 'challenges' },
  { id: 'collection', label: 'Collection', icon: '\uD83D\uDC51', screen: 'collection' },
  { id: 'profile', label: 'Profile', icon: '\uD83D\uDC96', screen: 'profile' },
];

export default function NavBar() {
  const currentScreen = useGameStore((s) => s.ui.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around"
      style={{
        background: 'rgba(13,0,16,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,45,120,0.15)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = currentScreen === tab.screen;
        return (
          <button
            key={tab.id}
            onClick={() => setScreen(tab.screen)}
            className="touch-target relative flex flex-col items-center justify-center pt-2 pb-1 px-1 transition-all duration-200"
            style={{ flex: 1, minHeight: 56, WebkitTapHighlightColor: 'transparent' }}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* active indicator bar */}
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                style={{
                  width: 28,
                  height: 3,
                  background: '#ff2d78',
                  boxShadow: '0 0 8px rgba(255,45,120,0.6)',
                }}
              />
            )}

            {/* icon */}
            <span
              className="transition-all duration-200"
              style={{
                fontSize: isActive ? 24 : 22,
                filter: isActive ? 'drop-shadow(0 0 6px rgba(255,45,120,0.5))' : 'none',
                opacity: isActive ? 1 : 0.45,
              }}
            >
              {tab.icon}
            </span>

            {/* label — only shown when active */}
            <span
              className="transition-all duration-200 overflow-hidden"
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isActive ? '#ff2d78' : 'transparent',
                maxHeight: isActive ? 16 : 0,
                opacity: isActive ? 1 : 0,
                fontFamily: "'Nunito', sans-serif",
                letterSpacing: '0.02em',
                marginTop: isActive ? 2 : 0,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
