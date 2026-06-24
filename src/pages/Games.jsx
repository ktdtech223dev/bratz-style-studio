import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Rows3, Crown, Star, Check, ChevronRight, Brain, Zap, MessageCircleHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

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

// iOS-style notification badge: red "1" = your turn / in progress, green check = ready to view.
function Badge({ pending }) {
  if (!pending) return null;
  const ready = pending.status === 'ready';
  return (
    <span
      className="absolute -right-1.5 -top-1.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold text-white shadow-md ring-2 ring-[var(--bg)]"
      style={{ background: ready ? '#34c759' : '#ff3b30' }}
    >
      {ready ? <Check size={13} strokeWidth={3.5} /> : '1'}
    </span>
  );
}

function GameCard({ game, grid, accent, pending, onClick, delay }) {
  const qs = game.questions.length;
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`relative shrink-0 overflow-visible rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left shadow-soft ${
        grid ? 'w-full' : 'w-40'
      }`}
      style={{ boxShadow: `inset 0 2px 0 ${accent}55` }}
    >
      <Badge pending={pending} />
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
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-[var(--text2)]">{qs} Qs</span>
        <span className="ml-auto flex items-center gap-1 text-xs font-bold text-[var(--yellow)]">
          <Star size={12} fill="#fde047" /> {game.cost}
        </span>
      </div>
    </motion.button>
  );
}

const TABS = [
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'live', label: 'Play live' },
  { id: 'solo', label: 'Solo & daily' },
];

const SOLO_TILES = [
  {
    to: '/dailyduo',
    title: 'Daily duo',
    blurb: 'a fresh question every day',
    icon: MessageCircleHeart,
    accent: '#ff6ba8',
    badge: 'Daily',
  },
  {
    to: '/solo/memory',
    title: 'Memory match',
    blurb: 'flip & pair the cards',
    icon: Brain,
    accent: '#c084fc',
    badge: 'Solo',
  },
  {
    to: '/solo/reaction',
    title: 'Reaction time',
    blurb: 'tap the moment it turns green',
    icon: Zap,
    accent: '#fde047',
    badge: 'Solo',
  },
];

export default function Games() {
  const games = useStore((s) => s.games);
  const arcade = useStore((s) => s.arcade);
  const matches = useStore((s) => s.matches);
  const gamePending = useStore((s) => s.gamePending);
  const me = useStore((s) => s.me);
  const users = useStore((s) => s.users);
  const nav = useNavigate();
  const [grid, setGrid] = useState(false);
  const [tab, setTab] = useState('quizzes');

  useEffect(() => {
    useStore.getState().refreshMatches?.();
    useStore.getState().refreshPending?.();
  }, []);

  if (!games) return <PageHeader title="Games" back={false} />;

  const nameOf = (uid) => users.find((u) => u.id === uid)?.display_name || 'Them';

  async function newMatch(game) {
    const m = await api.post('/api/matches', { game, userId: me.id });
    nav(`/match/${m.id}`);
  }

  // in-progress / unseen-finished matches to surface
  const liveMatches = matches.filter(
    (m) => m.status === 'active' || (m.status === 'done' && !(m.seen_by || '').split(',').map(Number).includes(me?.id)),
  );

  return (
    <div>
      <PageHeader
        title="Games"
        sub="play together, then reveal 💞"
        back={false}
        right={
          tab === 'quizzes' ? (
            <button
              onClick={() => setGrid((g) => !g)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-[var(--lavender)]"
            >
              {grid ? <Rows3 size={20} /> : <LayoutGrid size={20} />}
            </button>
          ) : null
        }
      />

      {/* ── Segmented sub-nav ── */}
      <div className="px-5">
        <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-elev1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative flex-1 rounded-xl py-2 text-[13px] font-extrabold transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="gamesTab"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    className="absolute inset-0 rounded-xl bg-grad-accent shadow-card"
                  />
                )}
                <span className={`relative z-10 ${active ? 'text-white' : 'text-[var(--text2)]'}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6 px-5 pb-4 pt-5">
        {/* ── Play live ── */}
        {tab === 'live' &&
          (arcade.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#fbbf24' }} />
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-[var(--text)]">Play live 🎮</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {arcade.map((g, i) => {
                  const myTurn = matches.some((m) => m.game === g.id && m.status === 'active' && m.turn === me?.id);
                  return (
                    <motion.button
                      key={g.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => newMatch(g.id)}
                      className="relative overflow-visible rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left shadow-soft"
                      style={{ boxShadow: 'inset 0 2px 0 #fbbf2455' }}
                    >
                      {myTurn && <Badge pending={{ status: 'turn' }} />}
                      <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbbf24]/15 text-2xl">
                        {g.icon}
                      </div>
                      <div className="font-extrabold leading-tight">{g.title}</div>
                      <div className="mt-1 text-[11px] font-semibold text-[var(--text2)]">{g.blurb}</div>
                    </motion.button>
                  );
                })}
              </div>

              {/* ongoing matches */}
              {liveMatches.length > 0 && (
                <div className="mt-3 space-y-2">
                  {liveMatches.map((m) => {
                    const done = m.status === 'done';
                    const myTurn = m.turn === me?.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => nav(`/match/${m.id}`)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-left"
                      >
                        <span className="text-2xl">{arcade.find((a) => a.id === m.game)?.icon}</span>
                        <span className="flex-1">
                          <span className="block text-sm font-bold">{arcade.find((a) => a.id === m.game)?.title}</span>
                          <span className="block text-xs text-[var(--text2)]">
                            {done
                              ? m.winner === 0
                                ? 'Finished · draw'
                                : `Finished · ${m.winner === me?.id ? 'you won' : nameOf(m.winner) + ' won'}`
                              : myTurn
                                ? 'Your move'
                                : `Waiting on ${nameOf(m.turn)}`}
                          </span>
                        </span>
                        {!done && myTurn && <Badge pending={{ status: 'turn' }} />}
                        {done && <Badge pending={{ status: 'ready' }} />}
                        <ChevronRight size={18} className="text-[var(--muted)]" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center text-[var(--text2)]">
              <span className="text-4xl">🎮</span>
              <p className="mt-3 text-sm">no live games available right now</p>
            </div>
          ))}

        {/* ── Quiz categories ── */}
        {tab === 'quizzes' &&
          games.categories.map((cat) => {
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
                        pending={gamePending[g.id]}
                        onClick={() => nav(`/games/${g.id}`)}
                        delay={Math.min(i * 0.03, 0.3)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 pt-1">
                    {list.map((g, i) => (
                      <GameCard
                        key={g.id}
                        game={g}
                        accent={accent}
                        pending={gamePending[g.id]}
                        onClick={() => nav(`/games/${g.id}`)}
                        delay={Math.min(i * 0.03, 0.3)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {/* ── Solo & daily ── */}
        {tab === 'solo' && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#c084fc' }} />
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[var(--text)]">Solo & daily ✨</h2>
            </div>
            <div className="space-y-3">
              {SOLO_TILES.map((t, i) => {
                const I = t.icon;
                return (
                  <motion.button
                    key={t.to}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => nav(t.to)}
                    className="flex w-full items-center gap-3.5 rounded-2xl border border-[var(--border)] bg-grad-card p-4 text-left shadow-card"
                    style={{ boxShadow: `inset 0 2px 0 ${t.accent}55` }}
                  >
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-elev1"
                      style={{ background: t.accent + '22' }}
                    >
                      <I size={24} style={{ color: t.accent }} />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-extrabold">{t.title}</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide"
                          style={{ background: t.accent + '22', color: t.accent }}
                        >
                          {t.badge}
                        </span>
                      </span>
                      <span className="block text-xs text-[var(--text2)]">{t.blurb}</span>
                    </span>
                    <ChevronRight size={20} className="text-[var(--muted)]" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
