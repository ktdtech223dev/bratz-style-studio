import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Rows3, Crown, Star, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';

function GameCard({ game, grid, onClick, delay }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`relative shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left shadow-soft ${
        grid ? 'w-full' : 'w-36'
      }`}
    >
      {game.premium && (
        <div className="absolute right-3 top-3 text-[var(--yellow)]">
          <Crown size={16} fill="#fde047" />
        </div>
      )}
      <div className="mb-2 text-4xl">{game.icon}</div>
      <div className="font-extrabold leading-tight">{game.title}</div>
      <div className="mt-2 flex items-center gap-1 text-sm font-bold text-[var(--yellow)]">
        <Star size={13} fill="#fde047" /> {game.cost}
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-[var(--muted)]">
        <Lock size={11} /> unlocked
      </div>
    </motion.button>
  );
}

export default function Games() {
  const games = useStore((s) => s.games);
  const nav = useNavigate();
  const [grid, setGrid] = useState(false);

  if (!games) return <PageHeader title="Games" back={false} />;

  return (
    <div>
      <PageHeader
        title="Games"
        back={false}
        right={
          <button
            onClick={() => setGrid((g) => !g)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-[var(--lavender)]"
          >
            {grid ? <Rows3 size={20} /> : <LayoutGrid size={20} />}
          </button>
        }
      />
      <div className="space-y-6 px-5 pb-4">
        {games.categories.map((cat) => {
          const list = games.games.filter((g) => g.category === cat.id);
          return (
            <div key={cat.id}>
              <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
                {cat.label}
              </h2>
              {grid ? (
                <div className="grid grid-cols-2 gap-3">
                  {list.map((g, i) => (
                    <GameCard key={g.id} game={g} grid onClick={() => nav(`/games/${g.id}`)} delay={i * 0.04} />
                  ))}
                </div>
              ) : (
                <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
                  {list.map((g, i) => (
                    <GameCard key={g.id} game={g} onClick={() => nav(`/games/${g.id}`)} delay={i * 0.04} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
