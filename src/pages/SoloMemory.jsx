import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Trophy } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import StatPill from '../components/StatPill';

const EMOJIS = ['💖', '🌸', '⭐', '🐱', '🌙', '🍓', '🦋', '🌈'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeck() {
  // 8 pairs -> 16 cards for a 4x4 grid
  return shuffle([...EMOJIS, ...EMOJIS]).map((emoji, i) => ({
    id: i,
    emoji,
    matched: false,
  }));
}

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function SoloMemory() {
  const [deck, setDeck] = useState(makeDeck);
  const [flipped, setFlipped] = useState([]); // indices currently face-up (unmatched)
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  const startRef = useRef(null);
  const tickRef = useRef(null);

  const matchedCount = deck.filter((c) => c.matched).length;
  const won = matchedCount === deck.length;

  // timer
  useEffect(() => {
    if (started && !won) {
      tickRef.current = setInterval(() => {
        setElapsed(Date.now() - startRef.current);
      }, 250);
      return () => clearInterval(tickRef.current);
    }
  }, [started, won]);

  function newGame() {
    clearInterval(tickRef.current);
    setDeck(makeDeck());
    setFlipped([]);
    setMoves(0);
    setElapsed(0);
    setStarted(false);
    setLocked(false);
    startRef.current = null;
  }

  function tap(i) {
    if (locked || won) return;
    const card = deck[i];
    if (card.matched || flipped.includes(i)) return;

    if (!started) {
      setStarted(true);
      startRef.current = Date.now();
    }

    const next = [...flipped, i];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (deck[a].emoji === deck[b].emoji) {
        // match
        setLocked(true);
        setTimeout(() => {
          setDeck((d) => d.map((c, idx) => (idx === a || idx === b ? { ...c, matched: true } : c)));
          setFlipped([]);
          setLocked(false);
        }, 380);
      } else {
        // miss — flip back
        setLocked(true);
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 760);
      }
    }
  }

  // stop the clock when won
  useEffect(() => {
    if (won) clearInterval(tickRef.current);
  }, [won]);

  const isUp = (i) => flipped.includes(i) || deck[i].matched;

  return (
    <div>
      <PageHeader title="Memory match" sub="flip the cards, find every pair 💖" icon="🧠" />
      <div className="px-5 pb-8">
        {/* stats */}
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <StatPill emoji="🃏" value={moves} label="moves" color="#c084fc" />
          <StatPill emoji="⏱️" value={fmt(elapsed)} label="time" color="#7dd3fc" />
          <StatPill emoji="✅" value={`${matchedCount / 2}/8`} label="pairs" color="#9be89b" />
        </div>

        {/* grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {deck.map((card, i) => {
            const up = isUp(i);
            return (
              <button
                key={card.id}
                onClick={() => tap(i)}
                className="relative aspect-square"
                style={{ perspective: 600 }}
                aria-label={up ? card.emoji : 'hidden card'}
              >
                <motion.div
                  className="relative h-full w-full"
                  animate={{ rotateY: up ? 180 : 0 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* back */}
                  <span
                    className="absolute inset-0 flex items-center justify-center rounded-2xl border border-[var(--border)] bg-grad-accent-soft text-xl shadow-card"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    💜
                  </span>
                  {/* front */}
                  <span
                    className={`absolute inset-0 flex items-center justify-center rounded-2xl border text-2xl shadow-card transition-opacity ${
                      card.matched
                        ? 'border-[var(--green)] bg-grad-card opacity-100'
                        : 'border-[var(--border-strong)] bg-grad-card'
                    }`}
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      boxShadow: card.matched ? '0 0 18px color-mix(in srgb, var(--green) 40%, transparent)' : undefined,
                    }}
                  >
                    {card.emoji}
                  </span>
                </motion.div>
              </button>
            );
          })}
        </div>

        {/* win message */}
        <AnimatePresence>
          {won && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mt-6"
            >
              <Card variant="accent" className="p-6 text-center">
                <div className="flex justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-grad-accent text-3xl shadow-card">
                    <Trophy size={28} className="text-white" />
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-extrabold">All matched! 🎉</h2>
                <p className="mt-1 text-sm text-[var(--text2)]">
                  {moves} moves · {fmt(elapsed)}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6">
          <Button onClick={newGame} variant={won ? 'primary' : 'soft'} icon={<RotateCcw size={18} />}>
            New game
          </Button>
        </div>
      </div>
    </div>
  );
}
