import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import { getSocket } from '../lib/socket';
import { useStore } from '../store/useStore';

export default function HoldHands() {
  const emit = useStore((s) => s.emit);
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);
  const [mine, setMine] = useState(false);
  const [theirs, setTheirs] = useState(false);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const on = ({ userId, pressing }) => {
      if (userId !== me?.id) setTheirs(pressing);
    };
    s.on('hands:press', on);
    return () => {
      s.off('hands:press', on);
      emit('hands:press', { pressing: false });
    };
  }, [me?.id, emit]);

  const both = mine && theirs;
  useEffect(() => {
    if (both) {
      try {
        navigator.vibrate?.([60, 40, 60]);
      } catch {}
    }
  }, [both]);

  function down() {
    setMine(true);
    emit('hands:press', { pressing: true });
  }
  function up() {
    setMine(false);
    emit('hands:press', { pressing: false });
  }

  return (
    <div>
      <PageHeader title="Hold hands" sub="press together, across the miles 🤝" />
      <div className="flex flex-col items-center px-5 pt-6">
        <div className="relative flex h-72 w-72 items-center justify-center">
          {/* blooming hearts when both are holding */}
          <AnimatePresence>
            {both &&
              Array.from({ length: 10 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: [0, 1, 0], scale: 1.4, x: Math.cos((i / 10) * 6.28) * 130, y: Math.sin((i / 10) * 6.28) * 130 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.08 }}
                  className="absolute text-2xl"
                >
                  💗
                </motion.span>
              ))}
          </AnimatePresence>

          <motion.button
            onPointerDown={down}
            onPointerUp={up}
            onPointerLeave={up}
            animate={{
              scale: mine ? 0.92 : 1,
              boxShadow: both
                ? '0 0 60px 12px rgba(255,107,168,0.6)'
                : mine
                  ? '0 0 40px 6px rgba(184,169,232,0.4)'
                  : '0 0 0 0 rgba(0,0,0,0)',
            }}
            className="flex h-52 w-52 select-none items-center justify-center rounded-full text-6xl"
            style={{
              background: both
                ? 'radial-gradient(circle at 50% 40%, #ff8fc4, #ff6ba8)'
                : 'radial-gradient(circle at 50% 40%, var(--card2), var(--card))',
              touchAction: 'none',
            }}
          >
            {both ? '💞' : '🤚'}
          </motion.button>
        </div>

        <div className="mt-8 text-center">
          <div className="text-lg font-extrabold">
            {both ? 'holding hands 💞' : mine ? 'reaching for them…' : 'press & hold'}
          </div>
          <div className="mt-1 text-sm text-[var(--text2)]">
            {theirs && !mine
              ? `${partner?.display_name || 'they'} is reaching for you 🥺`
              : both
                ? "you're connected"
                : `hold the circle when ${partner?.display_name || 'they'} is here too`}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-6">
          <Dot on={mine} label="you" />
          <Dot on={theirs} label={partner?.display_name || 'them'} />
        </div>
      </div>
    </div>
  );
}

function Dot({ on, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.span
        animate={{ scale: on ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 1, repeat: on ? Infinity : 0 }}
        className="h-4 w-4 rounded-full"
        style={{ background: on ? '#ff6ba8' : 'var(--muted)' }}
      />
      <span className="text-xs font-bold text-[var(--text2)]">{label}</span>
    </div>
  );
}
