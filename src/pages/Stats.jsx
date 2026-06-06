import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../lib/api';

export default function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => {
    api.get('/api/stats').then(setS).catch(() => {});
  }, []);

  const tiles = s
    ? [
        { emoji: '💞', value: s.daysTogether, label: 'days together', color: '#ff6ba8' },
        { emoji: '⭐', value: s.stars, label: 'stars earned', color: '#fde047' },
        { emoji: '⚡', value: s.ourStreak, label: 'day streak', color: '#67e8f9' },
        { emoji: '💌', value: s.notes, label: 'notes written', color: '#b8a9e8' },
        { emoji: '🫂', value: s.affection, label: 'affection sent', color: '#f5a3c7' },
        { emoji: '📸', value: s.photos, label: 'photos shared', color: '#7dd3fc' },
        { emoji: '🎮', value: s.gamesPlayed, label: 'games played', color: '#9be89b' },
        { emoji: '✅', value: s.bucketDone, label: 'bucket goals done', color: '#9be89b' },
        { emoji: '📍', value: s.places, label: 'places pinned', color: '#fdba74' },
        { emoji: '🌟', value: s.milestones, label: 'memories saved', color: '#c084fc' },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Our stats" sub="the story in numbers" />
      <div className="px-5 pb-6">
        {s && s.moodCompat != null && (
          <Card className="mb-4 p-5 text-center">
            <div className="text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
              Mood sync
            </div>
            <div className="mt-1 text-4xl font-extrabold text-[var(--pink-hot)]">{s.moodCompat}%</div>
            <div className="text-xs text-[var(--text2)]">of days you felt the same lately</div>
          </Card>
        )}
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center shadow-soft"
            >
              <div className="text-2xl">{t.emoji}</div>
              <div className="mt-1 text-2xl font-extrabold" style={{ color: t.color }}>
                {t.value}
              </div>
              <div className="text-[11px] font-semibold text-[var(--text2)]">{t.label}</div>
            </motion.div>
          ))}
        </div>
        {!s && <p className="mt-10 text-center text-sm text-[var(--muted)]">loading…</p>}
      </div>
    </div>
  );
}
