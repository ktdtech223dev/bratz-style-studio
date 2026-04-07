import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import clothing from '../../data/clothing';
import { achievements } from '../../data/challenges';
import CoinDisplay from '../economy/CoinDisplay';

/* ─── Stat card component ────────────────────────────────────────── */

function StatCard({ label, value, icon, color = '#ff2d78', sub = null, progressBar = null }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span
          className="text-xs"
          style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.5)' }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 800,
            fontSize: 20,
            color: color,
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {sub && (
          <span
            className="text-xs"
            style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.35)' }}
          >
            {sub}
          </span>
        )}
      </div>
      {progressBar && (
        <div
          className="w-full h-1.5 rounded-full mt-2 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(progressBar.percent, 100)}%`,
              background: `linear-gradient(90deg, ${color}, #ff69b4)`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Achievement badge ──────────────────────────────────────────── */

function AchievementBadge({ achievement, earned }) {
  return (
    <div
      className="flex flex-col items-center p-2 rounded-xl"
      style={{
        width: 80,
        background: earned
          ? 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,45,120,0.05) 100%)'
          : 'rgba(255,255,255,0.02)',
        border: earned
          ? '1.5px solid rgba(255,215,0,0.3)'
          : '1px solid rgba(255,255,255,0.05)',
        opacity: earned ? 1 : 0.4,
        boxShadow: earned ? '0 0 12px rgba(255,215,0,0.2)' : 'none',
      }}
    >
      <span className="text-xl mb-1">{earned ? '\u2B50' : '\uD83D\uDD12'}</span>
      <span
        className="text-center leading-tight"
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 9,
          fontWeight: 700,
          color: earned ? '#ffd700' : 'rgba(255,255,255,0.3)',
        }}
      >
        {achievement.name}
      </span>
      {earned && achievement.reward?.title && (
        <span
          className="mt-0.5 text-center"
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 7,
            color: '#ff69b4',
          }}
        >
          {achievement.reward.title}
        </span>
      )}
    </div>
  );
}

/* ═══ ProfileScreen ══════════════════════════════════════════════════ */

export default function ProfileScreen() {
  const player = useGameStore((s) => s.player);
  const outfit = useGameStore((s) => s.outfit);
  const collection = useGameStore((s) => s.collection);

  const [soundOn, setSoundOn] = useState(true);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'darker'

  const collectedCount = collection.size;

  // Calculate favorite aesthetic
  const favoriteAesthetic = useMemo(() => {
    const counts = {};
    for (const itemId of collection) {
      const item = clothing.find((c) => c.id === itemId);
      if (item?.aesthetics) {
        for (const a of item.aesthetics) {
          counts[a] = (counts[a] || 0) + 1;
        }
      }
    }
    let best = 'None yet';
    let bestCount = 0;
    for (const [aesthetic, count] of Object.entries(counts)) {
      if (count > bestCount) {
        best = aesthetic;
        bestCount = count;
      }
    }
    return best.charAt(0).toUpperCase() + best.slice(1);
  }, [collection]);

  // Placeholder for earned achievements (from server in real app)
  const [earnedAchievements] = useState(new Set());

  return (
    <div className="flex flex-col h-full" style={{ background: theme === 'darker' ? '#060008' : '#0d0010' }}>
      <style>{`
        @keyframes portrait-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,45,120,0.3), 0 0 40px rgba(255,45,120,0.1); }
          50% { box-shadow: 0 0 30px rgba(255,45,120,0.5), 0 0 60px rgba(255,45,120,0.2); }
        }
      `}</style>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Header with name + coins */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h1
            className="text-xl"
            style={{
              fontFamily: "'Pacifico', cursive",
              color: '#ffd700',
              textShadow: '0 0 12px rgba(255,215,0,0.3)',
            }}
          >
            My Profile
          </h1>
          <CoinDisplay compact />
        </div>

        {/* Character portrait */}
        <div className="flex justify-center py-4">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #2d0040 0%, #1a0026 100%)',
              border: '3px solid #ff2d78',
              animation: 'portrait-glow 3s ease-in-out infinite',
            }}
          >
            <div className="text-center">
              <span className="text-4xl block">
                {outfit.character === 'cloe'
                  ? '\uD83D\uDC71\u200D\u2640\uFE0F'
                  : outfit.character === 'yasmin'
                  ? '\uD83D\uDC69\u200D\uD83E\uDDB1'
                  : outfit.character === 'sasha'
                  ? '\uD83D\uDC69\u200D\uD83E\uDDB3'
                  : '\uD83D\uDC69'}
              </span>
              <span
                className="text-xs font-bold capitalize"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  color: '#ff69b4',
                }}
              >
                {outfit.character}
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          <StatCard
            label="Items Collected"
            value={collectedCount}
            icon={'\uD83D\uDC57'}
            color="#ff2d78"
            sub={`/ ${clothing.length}`}
            progressBar={{ percent: (collectedCount / clothing.length) * 100 }}
          />
          <StatCard
            label="Favorite Aesthetic"
            value={favoriteAesthetic}
            icon={'\u2728'}
            color="#ff69b4"
          />
          <StatCard
            label="Total Pulls"
            value={player.totalPulls}
            icon={'\uD83C\uDFB0'}
            color="#00e5ff"
          />
          <StatCard
            label="Login Streak"
            value={player.loginStreak}
            icon={'\uD83D\uDD25'}
            color="#ffd700"
            sub="days"
          />
        </div>

        {/* Currency display */}
        <div className="px-4 pb-4">
          <div
            className="rounded-xl p-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span
              className="text-xs block mb-2"
              style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.5)' }}
            >
              Wallet
            </span>
            <div className="flex items-center justify-around">
              {/* Coins */}
              <div className="flex flex-col items-center">
                <span style={{ fontSize: 20 }}>{'\uD83E\uDE99'}</span>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 800,
                    fontSize: 16,
                    color: '#ffd700',
                  }}
                >
                  {player.coins.toLocaleString()}
                </span>
                <span
                  className="text-xs"
                  style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                >
                  Coins
                </span>
              </div>

              {/* Divider */}
              <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* Gems */}
              <div className="flex flex-col items-center">
                <span style={{ fontSize: 20 }}>{'\uD83D\uDC8E'}</span>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 800,
                    fontSize: 16,
                    color: '#00e5ff',
                  }}
                >
                  {player.gems.toLocaleString()}
                </span>
                <span
                  className="text-xs"
                  style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                >
                  Gems
                </span>
              </div>

              {/* Divider */}
              <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* Shards */}
              <div className="flex flex-col items-center">
                <span style={{ fontSize: 20 }}>{'\uD83D\uDCA0'}</span>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 800,
                    fontSize: 16,
                    color: '#9c27b0',
                  }}
                >
                  {player.styleShards.toLocaleString()}
                </span>
                <span
                  className="text-xs"
                  style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                >
                  Shards
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement badges */}
        <div className="px-4 pb-4">
          <h2
            className="text-base mb-2"
            style={{
              fontFamily: "'Pacifico', cursive",
              color: '#ffd700',
              textShadow: '0 0 8px rgba(255,215,0,0.2)',
            }}
          >
            Achievements
          </h2>
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {achievements.map((a) => (
              <AchievementBadge
                key={a.id}
                achievement={a}
                earned={earnedAchievements.has(a.id)}
              />
            ))}
          </div>
        </div>

        {/* Best Look placeholder */}
        <div className="px-4 pb-4">
          <h2
            className="text-base mb-2"
            style={{
              fontFamily: "'Pacifico', cursive",
              color: '#ff69b4',
              textShadow: '0 0 8px rgba(255,105,180,0.2)',
            }}
          >
            Best Look
          </h2>
          <div
            className="rounded-xl p-6 flex flex-col items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.1)',
              minHeight: 100,
            }}
          >
            <span className="text-2xl mb-2">{'\uD83D\uDCF8'}</span>
            <span
              className="text-xs text-center"
              style={{
                fontFamily: "'Nunito', sans-serif",
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              Pin your favorite look to showcase it here!
            </span>
          </div>
        </div>

        {/* Settings */}
        <div className="px-4 pb-8">
          <h2
            className="text-base mb-2"
            style={{
              fontFamily: "'Pacifico', cursive",
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Settings
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Sound toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16 }}>{soundOn ? '\uD83D\uDD0A' : '\uD83D\uDD07'}</span>
                <span
                  className="text-sm"
                  style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.7)' }}
                >
                  Sound
                </span>
              </div>
              <button
                onClick={() => setSoundOn(!soundOn)}
                className="relative w-12 h-7 rounded-full transition-all duration-300"
                style={{
                  background: soundOn
                    ? 'linear-gradient(90deg, #ff2d78, #c2185b)'
                    : 'rgba(255,255,255,0.1)',
                  minHeight: 28,
                  touchAction: 'manipulation',
                }}
              >
                <div
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all duration-300"
                  style={{
                    left: soundOn ? 22 : 2,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-3" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Theme toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16 }}>{'\uD83C\uDF19'}</span>
                <span
                  className="text-sm"
                  style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.7)' }}
                >
                  Theme
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setTheme('dark')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: theme === 'dark' ? '#ff2d78' : 'rgba(255,255,255,0.06)',
                    color: theme === 'dark' ? '#fff' : 'rgba(255,255,255,0.4)',
                    minHeight: 32,
                    touchAction: 'manipulation',
                  }}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme('darker')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: theme === 'darker' ? '#ff2d78' : 'rgba(255,255,255,0.06)',
                    color: theme === 'darker' ? '#fff' : 'rgba(255,255,255,0.4)',
                    minHeight: 32,
                    touchAction: 'manipulation',
                  }}
                >
                  Darker
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
