import React from 'react';
import useGameStore from '../../store/gameStore';

const TABS = [
  { id: 'dressup',    label: 'Dress Up',   icon: '👗', screen: 'dressup'    },
  { id: 'gacha',      label: 'Gacha',       icon: '✨', screen: 'gacha'      },
  { id: 'challenges', label: 'Challenges',  icon: '🎯', screen: 'challenges' },
  { id: 'collection', label: 'Collection',  icon: '👑', screen: 'collection' },
  { id: 'profile',    label: 'Profile',     icon: '💖', screen: 'profile'    },
];

export default function NavBar() {
  const currentScreen = useGameStore((s) => s.ui.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around no-select"
      style={{
        background: '#FFFFFF',
        borderTop: '3px solid #FF1493',
        boxShadow: '0 -2px 0 #FF69B4, 0 -6px 16px rgba(255,20,147,0.12)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = currentScreen === tab.screen;
        return (
          <button
            key={tab.id}
            onClick={() => setScreen(tab.screen)}
            className="touch-target relative flex flex-col items-center justify-center pt-2 pb-2 px-1"
            style={{
              flex: 1,
              minHeight: 56,
              minWidth: 44,
              WebkitTapHighlightColor: 'transparent',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active top border highlight */}
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2"
                style={{
                  width: 32,
                  height: 3,
                  background: '#FF1493',
                  boxShadow: '0 0 8px #FF1493',
                  borderRadius: '0 0 4px 4px',
                }}
              />
            )}

            {/* Icon */}
            <span
              style={{
                fontSize: isActive ? 24 : 20,
                lineHeight: 1,
                filter: isActive
                  ? 'drop-shadow(0 0 4px rgba(255,20,147,0.6))'
                  : 'grayscale(0.3) opacity(0.55)',
                transition: 'font-size 0.15s ease, filter 0.15s ease',
              }}
            >
              {tab.icon}
            </span>

            {/* Label — always visible, styled by active state */}
            <span
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 9,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#FF1493' : '#C2185B',
                opacity: isActive ? 1 : 0.55,
                marginTop: 2,
                letterSpacing: '0.01em',
                transition: 'color 0.15s ease, opacity 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </span>

            {/* Active pink dot underline */}
            {isActive && (
              <span
                style={{
                  display: 'block',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#FF1493',
                  boxShadow: '0 0 6px #FF1493',
                  marginTop: 2,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
