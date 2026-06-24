import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import StatPill from '../components/StatPill';

// states: idle | waiting (red, wait for green) | now (green, tap!) | tooSoon | result
export default function SoloReaction() {
  const [state, setState] = useState('idle');
  const [time, setTime] = useState(null);
  const [best, setBest] = useState(null);
  const [last3, setLast3] = useState([]);
  const greenAt = useRef(0);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function arm() {
    setState('waiting');
    setTime(null);
    const delay = 1200 + Math.random() * 2800; // 1.2s – 4s
    timer.current = setTimeout(() => {
      greenAt.current = performance.now();
      setState('now');
    }, delay);
  }

  function handleTap() {
    if (state === 'idle' || state === 'result' || state === 'tooSoon') {
      arm();
      return;
    }
    if (state === 'waiting') {
      // too early
      clearTimeout(timer.current);
      setState('tooSoon');
      return;
    }
    if (state === 'now') {
      const ms = Math.round(performance.now() - greenAt.current);
      setTime(ms);
      setBest((b) => (b == null ? ms : Math.min(b, ms)));
      setLast3((arr) => [ms, ...arr].slice(0, 3));
      setState('result');
    }
  }

  const view = {
    idle: {
      bg: 'var(--card2)',
      ring: 'var(--border)',
      title: 'Reaction test',
      sub: 'tap to start',
      emoji: '⚡',
    },
    waiting: {
      bg: '#f87171',
      ring: '#f8717155',
      title: 'Wait for green…',
      sub: 'don’t tap yet',
      emoji: '🔴',
    },
    now: {
      bg: '#34c759',
      ring: '#34c75955',
      title: 'TAP!',
      sub: 'now now now',
      emoji: '🟢',
    },
    tooSoon: {
      bg: '#fbbf24',
      ring: '#fbbf2455',
      title: 'Too soon! 😅',
      sub: 'tap to try again',
      emoji: '🟡',
    },
    result: {
      bg: 'var(--card2)',
      ring: 'var(--border)',
      title: time != null ? `${time} ms` : '',
      sub: 'tap to go again',
      emoji: '💫',
    },
  }[state];

  return (
    <div>
      <PageHeader title="Reaction time" sub="tap the instant it turns green ⚡" icon="⚡" />
      <div className="px-5 pb-8">
        {/* stats */}
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <StatPill emoji="🏆" value={best != null ? `${best}` : '—'} label="best ms" color="#fde047" />
          <StatPill emoji="⚡" value={time != null ? `${time}` : '—'} label="last ms" color="#7dd3fc" />
        </div>

        {/* tap zone */}
        <button
          onClick={handleTap}
          className="block w-full select-none"
          aria-label="reaction zone"
        >
          <motion.div
            animate={{ background: view.bg }}
            transition={{ duration: 0.12 }}
            className="flex h-72 w-full flex-col items-center justify-center rounded-4xl border-2 text-center shadow-cardlg"
            style={{ borderColor: view.ring }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={state}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.16 }}
                className="flex flex-col items-center px-6"
              >
                <span className="text-5xl">{view.emoji}</span>
                <div
                  className={`mt-3 text-3xl font-extrabold ${
                    state === 'now' || state === 'waiting' ? 'text-white' : 'text-[var(--text)]'
                  }`}
                >
                  {view.title}
                </div>
                <div
                  className={`mt-1 text-sm font-semibold ${
                    state === 'now' || state === 'waiting' ? 'text-white/90' : 'text-[var(--text2)]'
                  }`}
                >
                  {view.sub}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </button>

        {/* recent attempts */}
        {last3.length > 0 && (
          <Card variant="flat" className="mt-5 p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[var(--text2)]">
              <Zap size={13} /> recent
            </div>
            <div className="flex gap-2">
              {last3.map((ms, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 text-center text-sm font-extrabold"
                  style={{ color: ms === best ? 'var(--green)' : 'var(--text)' }}
                >
                  {ms}
                  <span className="text-[10px] font-bold text-[var(--muted)]"> ms</span>
                </span>
              ))}
            </div>
          </Card>
        )}

        <p className="mt-5 text-center text-xs text-[var(--muted)]">
          average human reaction is ~250 ms — how cozy-fast are you? 💜
        </p>
      </div>
    </div>
  );
}
