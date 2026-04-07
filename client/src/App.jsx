import React, { useEffect, useMemo, lazy, Suspense } from 'react';
import useGameStore from './store/gameStore';
import NavBar from './components/shared/NavBar';
import TopBar from './components/shared/TopBar';
import Toast from './components/shared/Toast';

const SplashScreen = lazy(() => import('./components/screens/SplashScreen'));
const CharacterSelect = lazy(() => import('./components/screens/CharacterSelect'));
const DressUpScreen = lazy(() => import('./components/screens/DressUpScreen'));
const GachaScreen = lazy(() => import('./components/screens/GachaScreen'));
const ChallengesScreen = lazy(() => import('./components/screens/ChallengesScreen'));
const CollectionScreen = lazy(() => import('./components/screens/CollectionScreen'));
const ProfileScreen = lazy(() => import('./components/screens/ProfileScreen'));
const DailyReward = lazy(() => import('./components/economy/DailyReward'));

/* ---------- sparkle helpers ---------- */
const SPARKLE_CHARS = ['\u2726', '\u2727', '\u2605'];
const SPARKLE_COLORS = ['#ff2d78', '#ffd700', '#00e5ff'];

function generateSparkles(count) {
  const sparkles = [];
  for (let i = 0; i < count; i++) {
    sparkles.push({
      id: i,
      char: SPARKLE_CHARS[i % SPARKLE_CHARS.length],
      color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
      left: `${Math.random() * 100}%`,
      size: 8 + Math.random() * 10,
      duration: 8 + Math.random() * 14,
      delay: Math.random() * -20,
      opacity: 0.2 + Math.random() * 0.4,
    });
  }
  return sparkles;
}

/* ---------- screen map ---------- */
const SCREEN_MAP = {
  splash: SplashScreen,
  'character-select': CharacterSelect,
  dressup: DressUpScreen,
  gacha: GachaScreen,
  challenges: ChallengesScreen,
  collection: CollectionScreen,
  profile: ProfileScreen,
};

const HIDE_NAV = new Set(['splash', 'character-select']);
const HIDE_TOP = new Set(['splash']);

/* ---------- App ---------- */
export default function App() {
  const currentScreen = useGameStore((s) => s.ui.currentScreen);
  const showDailyReward = useGameStore((s) => s.ui.showDailyReward);
  const showToast = useGameStore((s) => s.ui.showToast);
  const initPlayer = useGameStore((s) => s.initPlayer);

  const sparkles = useMemo(() => generateSparkles(30), []);

  /* session bootstrap */
  useEffect(() => {
    let sessionId = localStorage.getItem('bratz_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('bratz_session_id', sessionId);
    }
    initPlayer(sessionId);
  }, [initPlayer]);

  const ScreenComponent = SCREEN_MAP[currentScreen] || SCREEN_MAP.splash;

  return (
    <div className="relative w-full h-full overflow-hidden no-select" style={{ background: '#0d0010' }}>
      {/* sparkle particles */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sparkle-particle"
          style={{
            left: s.left,
            color: s.color,
            fontSize: `${s.size}px`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            opacity: s.opacity,
          }}
        >
          {s.char}
        </span>
      ))}

      {/* noise grain */}
      <div className="noise-overlay" />

      {/* top bar */}
      {!HIDE_TOP.has(currentScreen) && <TopBar />}

      {/* main screen */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-legendary text-2xl font-pacifico animate-pulse">Loading...</span>
          </div>
        }
      >
        <div className="screen-enter w-full h-full">
          <ScreenComponent />
        </div>
      </Suspense>

      {/* bottom nav */}
      {!HIDE_NAV.has(currentScreen) && <NavBar />}

      {/* daily reward modal */}
      {showDailyReward && (
        <Suspense fallback={null}>
          <DailyReward />
        </Suspense>
      )}

      {/* toast */}
      {showToast && <Toast message={showToast.message} type={showToast.type} />}
    </div>
  );
}
