import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import MoodBeam from '../components/MoodBeam';
import { useStore } from '../store/useStore';
import { shortRel } from '../lib/time';

export const MOODS = [
  { mood: 'Silly', emoji: '😜', color: '#9be89b' },
  { mood: 'Grateful', emoji: '🥹', color: '#c084fc' },
  { mood: 'Happy', emoji: '😊', color: '#fde047' },
  { mood: 'Calm', emoji: '😌', color: '#7dd3fc' },
  { mood: 'Pensive', emoji: '🤔', color: '#b8a9e8' },
  { mood: 'Loved', emoji: '🥰', color: '#f5a3c7' },
  { mood: 'Tired', emoji: '😴', color: '#8e8ad6' },
  { mood: 'Excited', emoji: '🤩', color: '#fdba74' },
  { mood: 'Anxious', emoji: '😰', color: '#67e8f9' },
  { mood: 'Content', emoji: '🙂', color: '#7dd87d' },
];

function MoodColumn({ name, mood, side, onTap, clickable }) {
  return (
    <button
      onClick={clickable ? onTap : undefined}
      className="flex flex-1 flex-col items-center pt-2"
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <div className="mb-3 text-sm font-bold text-[var(--text2)]">{name}</div>
      {mood ? (
        <>
          <MoodBeam color={mood.color} emoji={mood.emoji} delay={side === 'right' ? 0.12 : 0} />
          <div className="mt-3 text-lg font-extrabold" style={{ color: mood.color }}>
            {mood.mood}
          </div>
          <div className="text-xs text-[var(--muted)]">{shortRel(mood.at)}</div>
        </>
      ) : (
        <>
          <MoodBeam color="#3a3f73" emoji="💤" />
          <div className="mt-3 text-base font-bold text-[var(--muted)]">no mood yet</div>
        </>
      )}
      {clickable && <div className="mt-2 text-xs font-semibold text-[var(--lav-text)]">tap to set</div>}
    </button>
  );
}

export default function Mood() {
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);
  const moods = useStore((s) => s.moods);
  const emit = useStore((s) => s.emit);
  const [picker, setPicker] = useState(false);

  const myMood = moods[me?.id];
  const partnerMood = partner ? moods[partner.id] : null;

  function pick(m) {
    emit('mood:set', { mood: m.mood, emoji: m.emoji, color: m.color });
    setPicker(false);
  }

  return (
    <div>
      <PageHeader title="Mood" />
      <div className="px-5">
        <div className="flex items-stretch">
          <MoodColumn name="You" mood={myMood} side="left" clickable onTap={() => setPicker(true)} />
          <div className="w-px self-stretch bg-white/5" />
          <MoodColumn name={partner?.display_name || 'Partner'} mood={partnerMood} side="right" />
        </div>
        <p className="mt-8 text-center text-sm text-[var(--text2)]">
          your light shines to {partner?.display_name || 'them'} in real time ✨
        </p>
      </div>

      <AnimatePresence>
        {picker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPicker(false)}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(10,12,30,0.6)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[520px] rounded-t-3xl border-t border-[var(--border)] bg-[var(--bg2)] p-5 pb-8 safe-bottom"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15" />
              <h3 className="mb-4 text-center text-lg font-extrabold">How are you feeling?</h3>
              <div className="grid grid-cols-2 gap-3">
                {MOODS.map((m) => (
                  <button
                    key={m.mood}
                    onClick={() => pick(m)}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 active:scale-95"
                    style={{ boxShadow: `inset 0 0 0 1px ${m.color}22` }}
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                      style={{ background: m.color + '22' }}
                    >
                      {m.emoji}
                    </span>
                    <span className="font-bold" style={{ color: m.color }}>
                      {m.mood}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
