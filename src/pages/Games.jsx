import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Rows3, Crown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';

const CAT_COLOR = {
  romance: '#ff6ba8',
  personality: '#c084fc',
  fun: '#67e8f9',
  occasions: '#fdba74',
  party: '#9be89b',
  deep: '#818cf8',
  longdistance: '#7dd3fc',
  spicy: '#f87171',
};

function formatTag(game) {
  if (game.format === 'party') return 'Quick play';
  if (game.questions.every((q) => q.open)) return 'Deep talk';
  return 'Quiz';
}

function GameCard({ game, grid, accent, onClick, delay }) {
  const qs = game.questions.length;
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`relative shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left shadow-soft ${
        grid ? 'w-full' : 'w-40'
      }`}
      style={{ boxShadow: `inset 0 2px 0 ${accent}55` }}
    >
      {game.premium && (
        <div className="absolute right-3 top-3 text-[var(--yellow)]">
          <Crown size={16} fill="#fde047" />
        </div>
      )}
      <div
        className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
        style={{ background: accent + '22' }}
      >
        {game.icon}
      </div>
      <div className="font-extrabold leading-tight">{game.title}</div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
          style={{ background: accent + '22', color: accent }}
        >
          {formatTag(game)}
        </span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-[var(--text2)]">
          {qs} Qs
        </span>
        <span className="ml-auto flex items-center gap-1 text-xs font-bold text-[var(--yellow)]">
          <Star size={12} fill="#fde047" /> {game.cost}
        </span>
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
        sub="play together, then reveal 💞"
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
          if (!list.length) return null;
          const accent = CAT_COLOR[cat.id] || 'var(--lavender)';
          return (
            <div key={cat.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-[var(--text)]">{cat.label}</h2>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                  {list.length}
                </span>
              </div>
              {grid ? (
                <div className="grid grid-cols-2 gap-3">
                  {list.map((g, i) => (
                    <GameCard
                      key={g.id}
                      game={g}
                      grid
                      accent={accent}
                      onClick={() => nav(`/games/${g.id}`)}
                      delay={Math.min(i * 0.03, 0.3)}
                    />
                  ))}
                </div>
              ) : (
                <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
                  {list.map((g, i) => (
                    <GameCard
                      key={g.id}
                      game={g}
                      accent={accent}
                      onClick={() => nav(`/games/${g.id}`)}
                      delay={Math.min(i * 0.03, 0.3)}
                    />
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
