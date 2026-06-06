import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';

export default function TruthOrDare() {
  const deck = useStore((s) => s.truthordare) || { truths: [], dares: [] };
  const [card, setCard] = useState(null); // { type, text, key }

  function draw(type) {
    const pool = type === 'truth' ? deck.truths : deck.dares;
    if (!pool || !pool.length) return;
    const text = pool[Math.floor(Math.random() * pool.length)];
    setCard({ type, text, key: Date.now() });
  }

  const isTruth = card?.type === 'truth';
  const accent = isTruth ? '#7dd3fc' : '#ff6ba8';

  return (
    <div>
      <PageHeader title="Truth or Dare" sub="draw a card together" />
      <div className="flex flex-col items-center px-5">
        <div className="flex min-h-[220px] w-full items-center justify-center py-4">
          <AnimatePresence mode="wait">
            {card ? (
              <motion.div
                key={card.key}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full rounded-3xl border p-8 text-center shadow-soft"
                style={{ background: 'var(--card)', borderColor: accent, boxShadow: `0 0 30px ${accent}33` }}
              >
                <div className="text-xs font-extrabold uppercase tracking-widest" style={{ color: accent }}>
                  {isTruth ? 'Truth' : 'Dare'}
                </div>
                <p className="mt-3 text-xl font-extrabold leading-snug">{card.text}</p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-[var(--text2)]"
              >
                <Sparkles size={40} className="text-[var(--muted)]" />
                <p className="mt-3 text-sm">pick truth or dare to begin 💜</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-2 flex w-full gap-3">
          <button
            onClick={() => draw('truth')}
            className="flex-1 rounded-2xl bg-[var(--blue)] py-4 font-extrabold text-[#1a1f4a] active:scale-95"
          >
            Truth
          </button>
          <button
            onClick={() => draw('dare')}
            className="flex-1 rounded-2xl bg-[var(--pink-hot)] py-4 font-extrabold text-white active:scale-95"
          >
            Dare
          </button>
        </div>
        {card && (
          <button onClick={() => draw(card.type)} className="mt-4 text-sm font-bold text-[var(--lav-text)]">
            draw another {card.type} ↻
          </button>
        )}
      </div>
    </div>
  );
}
