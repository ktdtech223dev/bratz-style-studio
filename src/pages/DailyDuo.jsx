import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

// Small in-file bank. Each item is a "this-or-that" / would-you-rather with two
// cute options. The day's item is picked deterministically from the date so
// both partners see the same question on the same day — no backend needed.
const BANK = [
  { q: 'Cozy night in or spontaneous night out?', a: { label: 'Night in', emoji: '🛋️' }, b: { label: 'Night out', emoji: '🌃' } },
  { q: 'Would you rather… sunrise hike or sunset picnic?', a: { label: 'Sunrise hike', emoji: '🌄' }, b: { label: 'Sunset picnic', emoji: '🧺' } },
  { q: 'Tea or coffee to start the day?', a: { label: 'Tea', emoji: '🍵' }, b: { label: 'Coffee', emoji: '☕' } },
  { q: 'Beach getaway or mountain cabin?', a: { label: 'Beach', emoji: '🏖️' }, b: { label: 'Cabin', emoji: '🏔️' } },
  { q: 'Movie marathon or board games?', a: { label: 'Movies', emoji: '🎬' }, b: { label: 'Board games', emoji: '🎲' } },
  { q: 'Breakfast in bed or a fancy dinner out?', a: { label: 'Breakfast in bed', emoji: '🥐' }, b: { label: 'Fancy dinner', emoji: '🍽️' } },
  { q: 'Slow dance in the kitchen or a road trip playlist?', a: { label: 'Kitchen dance', emoji: '💃' }, b: { label: 'Road trip', emoji: '🚗' } },
  { q: 'Stargazing or city lights?', a: { label: 'Stargazing', emoji: '✨' }, b: { label: 'City lights', emoji: '🌆' } },
  { q: 'Sweet or savory snacks?', a: { label: 'Sweet', emoji: '🍫' }, b: { label: 'Savory', emoji: '🥨' } },
  { q: 'Handwritten letter or a long voice note?', a: { label: 'Letter', emoji: '💌' }, b: { label: 'Voice note', emoji: '🎙️' } },
  { q: 'Rainy reading day or sunny park day?', a: { label: 'Rainy reads', emoji: '📚' }, b: { label: 'Sunny park', emoji: '🌳' } },
  { q: 'Plan everything or go with the flow?', a: { label: 'Plan it', emoji: '🗒️' }, b: { label: 'Go with flow', emoji: '🌊' } },
  { q: 'Cook together or order in?', a: { label: 'Cook together', emoji: '👩‍🍳' }, b: { label: 'Order in', emoji: '🥡' } },
  { q: 'Early bird or night owl date?', a: { label: 'Early bird', emoji: '🐦' }, b: { label: 'Night owl', emoji: '🦉' } },
];

// Deterministic day index — same question for everyone on the same calendar day.
function dayIndex(date) {
  const start = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor(start / 86400000);
  return days % BANK.length;
}

const COLORS = {
  a: { accent: '#ff6ba8', soft: '#ff6ba822' },
  b: { accent: '#7dd3fc', soft: '#7dd3fc22' },
};

export default function DailyDuo() {
  const today = useMemo(() => new Date(), []);
  const item = useMemo(() => BANK[dayIndex(today)], [today]);
  const [picked, setPicked] = useState(null); // 'a' | 'b' | null

  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  function Option({ side }) {
    const opt = item[side];
    const c = COLORS[side];
    const isPicked = picked === side;
    const dimmed = picked && !isPicked;
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => !picked && setPicked(side)}
        disabled={!!picked}
        className="relative flex-1 overflow-hidden rounded-4xl border p-6 text-center shadow-card transition-opacity"
        style={{
          borderColor: isPicked ? c.accent : 'var(--border)',
          background: isPicked ? c.soft : 'var(--grad-card)',
          opacity: dimmed ? 0.5 : 1,
          boxShadow: isPicked ? `0 0 26px ${c.accent}33` : undefined,
        }}
      >
        <div className="text-5xl">{opt.emoji}</div>
        <div className="mt-3 text-base font-extrabold" style={{ color: isPicked ? c.accent : 'var(--text)' }}>
          {opt.label}
        </div>
        {isPicked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold text-white"
            style={{ background: c.accent }}
          >
            ✓
          </motion.div>
        )}
      </motion.button>
    );
  }

  return (
    <div>
      <PageHeader title="Daily duo" sub="one little question, every day 💞" icon="💌" />
      <div className="px-5 pb-8">
        <div className="mb-4 flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[var(--text2)]">
          <Sparkles size={13} className="text-[var(--lavender)]" />
          {dateLabel}
        </div>

        {/* question */}
        <Card variant="accent" className="mb-5 p-6 text-center">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
            today’s question
          </div>
          <p className="mt-2 text-xl font-extrabold leading-snug">{item.q}</p>
        </Card>

        {/* options */}
        <div className="flex gap-3">
          <Option side="a" />
          <Option side="b" />
        </div>

        {/* reveal */}
        <AnimatePresence>
          {picked && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5"
            >
              <Card variant="flat" className="p-5 text-center">
                <p className="text-sm text-[var(--text2)]">you picked</p>
                <p className="mt-1 text-lg font-extrabold">
                  {item[picked].emoji} {item[picked].label}
                </p>
                <p className="mt-2 text-sm text-[var(--text2)]">
                  share your screen and see if your person agrees 💕
                </p>
                <button
                  onClick={() => setPicked(null)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--lav-text)]"
                >
                  <RefreshCw size={14} /> change my pick
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!picked && (
          <p className="mt-5 text-center text-xs text-[var(--muted)]">tap your answer — come back tomorrow for a new one 🌙</p>
        )}
      </div>
    </div>
  );
}
