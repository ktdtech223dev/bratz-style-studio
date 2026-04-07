import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { dailyChallenges, weeklyChallenges, achievements } from '../../data/challenges';
import ChallengeCard from '../economy/ChallengeCard';
import CoinDisplay from '../economy/CoinDisplay';

/* ─── Tabs ───────────────────────────────────────────────────────── */

const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'achievements', label: 'Achievements' },
];

/* ─── Seeded random for daily selection ──────────────────────────── */

function seededShuffle(arr, seed) {
  const shuffled = [...arr];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getDaySeed() {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function getWeekSeed() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return now.getFullYear() * 100 + week;
}

/* ─── Timer helper ───────────────────────────────────────────────── */

function useCountdown(getTarget) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const target = getTarget();
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft('Resetting...');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [getTarget]);

  return timeLeft;
}

function getNextMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function getNextMonday() {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/* ═══ ChallengesScreen ═══════════════════════════════════════════════ */

export default function ChallengesScreen() {
  const [activeTab, setActiveTab] = useState('daily');
  const [claimedIds, setClaimedIds] = useState(new Set());
  const [completedIds] = useState(new Set()); // Populated from server in real app

  const dailyReset = useCountdown(getNextMidnight);
  const weeklyReset = useCountdown(getNextMonday);

  // Select 3 random daily and weekly challenges using seeded shuffle
  const todaysDailies = useMemo(() => {
    return seededShuffle(dailyChallenges, getDaySeed()).slice(0, 3);
  }, []);

  const thisWeeksWeeklies = useMemo(() => {
    return seededShuffle(weeklyChallenges, getWeekSeed()).slice(0, 3);
  }, []);

  // Sort achievements: completed first
  const sortedAchievements = useMemo(() => {
    return [...achievements].sort((a, b) => {
      const aComplete = completedIds.has(a.id) ? 0 : 1;
      const bComplete = completedIds.has(b.id) ? 0 : 1;
      return aComplete - bComplete;
    });
  }, [completedIds]);

  const handleClaim = (id) => {
    setClaimedIds((prev) => new Set([...prev, id]));
  };

  const getStatus = (id) => {
    if (claimedIds.has(id)) return 'claimed';
    if (completedIds.has(id)) return 'completed';
    return 'active';
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#0d0010' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1
          className="text-xl"
          style={{
            fontFamily: "'Pacifico', cursive",
            color: '#ffd700',
            textShadow: '0 0 12px rgba(255,215,0,0.3)',
          }}
        >
          Challenges
        </h1>
        <CoinDisplay compact />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 px-4 pb-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                fontFamily: "'Nunito', sans-serif",
                minHeight: 44,
                background: isActive
                  ? 'linear-gradient(135deg, #ff2d78, #c2185b)'
                  : 'rgba(255,255,255,0.06)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isActive ? '0 0 16px rgba(255,45,120,0.3)' : 'none',
                touchAction: 'manipulation',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Reset timer */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <span
          className="text-xs"
          style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.4)' }}
        >
          {activeTab === 'daily'
            ? 'Daily reset in:'
            : activeTab === 'weekly'
            ? 'Weekly reset in:'
            : 'Lifetime progress'}
        </span>
        {activeTab !== 'achievements' && (
          <span
            className="text-xs font-bold"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: '#ff2d78',
              fontSize: 11,
            }}
          >
            {activeTab === 'daily' ? dailyReset : weeklyReset}
          </span>
        )}
      </div>

      {/* Challenge list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex flex-col gap-3">
          {activeTab === 'daily' &&
            todaysDailies.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                type="Daily"
                status={getStatus(c.id)}
                onClaim={handleClaim}
              />
            ))}

          {activeTab === 'weekly' &&
            thisWeeksWeeklies.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                type="Weekly"
                status={getStatus(c.id)}
                onClaim={handleClaim}
              />
            ))}

          {activeTab === 'achievements' &&
            sortedAchievements.map((a) => {
              const isComplete = completedIds.has(a.id);
              return (
                <div key={a.id} className="relative">
                  {/* Achievement badge glow for completed */}
                  {isComplete && claimedIds.has(a.id) && (
                    <div
                      className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center z-10"
                      style={{
                        background: 'linear-gradient(135deg, #ffd700, #ff2d78)',
                        boxShadow: '0 0 10px rgba(255,215,0,0.6)',
                        fontSize: 14,
                      }}
                    >
                      {'\u2B50'}
                    </div>
                  )}
                  <ChallengeCard
                    challenge={a}
                    type="Achievement"
                    status={getStatus(a.id)}
                    onClaim={handleClaim}
                  />
                </div>
              );
            })}
        </div>

        {/* Earned today/this week counter */}
        <div
          className="mt-4 rounded-xl p-3 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span
            className="text-xs"
            style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.4)' }}
          >
            {activeTab === 'daily'
              ? 'Earned today'
              : activeTab === 'weekly'
              ? 'Earned this week'
              : 'Total achievement rewards'}
          </span>
          <div className="flex items-center justify-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 14 }}>{'\uD83E\uDE99'}</span>
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#ffd700',
                }}
              >
                {claimedIds.size * 100}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
