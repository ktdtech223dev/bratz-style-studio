import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Play, User, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { dateLabel } from '../lib/time';

export default function GamePlay() {
  const { gameId } = useParams();
  const nav = useNavigate();
  const games = useStore((s) => s.games);
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);
  const game = games?.games.find((g) => g.id === gameId);

  const [history, setHistory] = useState([]);
  const [phase, setPhase] = useState('intro'); // intro | self | guess | waiting
  const [sessionId, setSessionId] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');

  const N = game?.questions.length || 0;
  const pName = partner?.display_name || 'them';

  useEffect(() => {
    if (gameId) api.get(`/api/games/history/${gameId}`).then(setHistory).catch(() => {});
  }, [gameId]);

  useEffect(() => {
    if (phase !== 'waiting' || !sessionId) return;
    const s = getSocket();
    const onComplete = ({ sessionId: sid }) => {
      if (Number(sid) === Number(sessionId)) nav(`/games/${gameId}/results/${sessionId}`);
    };
    s.on('game:complete', onComplete);
    api.get(`/api/games/session/${sessionId}`).then(({ session, answers }) => {
      const byUser = {};
      answers.forEach((a) => (byUser[a.user_id] = (byUser[a.user_id] || 0) + 1));
      const both = Object.values(byUser).filter((c) => c >= N * 2).length >= 2;
      if (both || session?.completed) nav(`/games/${gameId}/results/${sessionId}`);
    });
    return () => s.off('game:complete', onComplete);
  }, [phase, sessionId, gameId, N, nav]);

  if (!game) return <PageHeader title="Game" />;

  async function start() {
    const { sessionId: sid } = await api.post('/api/games/start', { gameId, userId: me.id });
    const { answers } = await api.get(`/api/games/session/${sid}`);
    const mineSelf = new Set(answers.filter((a) => a.user_id === me.id && a.kind === 'self').map((a) => a.question_id));
    const mineGuess = new Set(answers.filter((a) => a.user_id === me.id && a.kind === 'guess').map((a) => a.question_id));
    setSessionId(sid);
    setAnswer('');
    const firstSelf = game.questions.findIndex((q) => !mineSelf.has(q.id));
    if (firstSelf !== -1) {
      setPhase('self');
      setIdx(firstSelf);
      return;
    }
    const firstGuess = game.questions.findIndex((q) => !mineGuess.has(q.id));
    if (firstGuess !== -1) {
      setPhase('guess');
      setIdx(firstGuess);
      return;
    }
    setPhase('waiting');
  }

  async function submit() {
    const q = game.questions[idx];
    await api.post('/api/games/answer', {
      sessionId,
      questionId: q.id,
      userId: me.id,
      answer: answer.trim() || '—',
      kind: phase, // 'self' or 'guess'
    });
    setAnswer('');
    if (idx + 1 < N) {
      setIdx(idx + 1);
    } else if (phase === 'self') {
      setPhase('guess');
      setIdx(0);
    } else {
      setPhase('waiting');
    }
  }

  const inPlay = phase === 'self' || phase === 'guess';
  const q = game.questions[idx];

  return (
    <div>
      <PageHeader
        title={game.title}
        sub={
          phase === 'self'
            ? 'Step 1 of 2 · About you'
            : phase === 'guess'
              ? `Step 2 of 2 · Guess ${pName}`
              : 'How well do you know each other?'
        }
      />

      <div className="px-5">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="flex flex-col items-center p-7 text-center">
                <div className="text-6xl">{game.icon}</div>
                <h2 className="mt-3 text-xl font-extrabold">{game.title}</h2>
                <p className="mt-2 text-sm text-[var(--text2)]">
                  First answer {N} about <b>you</b>, then guess what {pName} said about <b>themselves</b>. See how
                  well you really know each other.
                </p>
                <div className="mt-2 flex items-center gap-1 text-sm font-bold text-[var(--yellow)]">
                  <Star size={14} fill="#fde047" /> +15 stars · 🦴 +1 treat
                </div>
                <button
                  onClick={start}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95"
                >
                  <Play size={18} fill="#fff" /> Play together
                </button>
              </Card>

              {history.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
                    Past plays
                  </h3>
                  <div className="space-y-2">
                    {history.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => nav(`/games/${gameId}/results/${s.id}`)}
                        className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left active:scale-[0.99]"
                      >
                        <span className="text-sm font-semibold">{dateLabel(s.played_at)}</span>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{
                            background: s.completed ? '#9be89b22' : '#fdba7422',
                            color: s.completed ? '#9be89b' : '#fdba74',
                          }}
                        >
                          {s.completed ? 'completed' : 'in progress'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {inPlay && (
            <motion.div key={`${phase}${idx}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="mb-4 flex justify-center gap-2">
                {game.questions.map((_, i) => (
                  <div
                    key={i}
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: i === idx ? 24 : 8,
                      background:
                        i <= idx ? (phase === 'self' ? 'var(--lavender)' : 'var(--pink-hot)') : 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </div>
              <Card className="p-6">
                <div
                  className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold"
                  style={{
                    background: phase === 'self' ? 'var(--lavender)22' : 'var(--pink-hot)22',
                    color: phase === 'self' ? 'var(--lavender)' : 'var(--pink-hot)',
                  }}
                >
                  {phase === 'self' ? <User size={13} /> : <Search size={13} />}
                  {phase === 'self' ? 'About you' : `Guess ${pName}`}
                </div>
                <h2 className="text-xl font-extrabold leading-snug">
                  {phase === 'self' ? q.q : `${pName}: ${lower(q.q)}`}
                </h2>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={phase === 'self' ? 'your honest answer…' : `what would ${pName} say?`}
                  rows={4}
                  autoFocus
                  className="mt-4 w-full resize-none rounded-2xl bg-[var(--bg2)] p-4 text-[var(--text)] placeholder:text-[var(--muted)]"
                />
                <button
                  onClick={submit}
                  className="mt-4 w-full rounded-2xl py-3.5 font-extrabold text-white active:scale-95"
                  style={{ background: phase === 'self' ? 'var(--lavender)' : 'var(--pink-hot)' }}
                >
                  {idx + 1 < N ? 'Next' : phase === 'self' ? `Now guess ${pName} →` : 'Finish'}
                </button>
              </Card>
              <p className="mt-3 text-center text-xs text-[var(--muted)]">
                question {idx + 1} of {N}
              </p>
            </motion.div>
          )}

          {phase === 'waiting' && (
            <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="flex flex-col items-center p-10 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--lavender)]/15"
                >
                  <Clock size={30} className="text-[var(--lavender)]" />
                </motion.div>
                <h2 className="mt-5 text-lg font-extrabold">All done on your end! 💜</h2>
                <p className="mt-2 text-sm text-[var(--text2)]">
                  Waiting for {pName} to answer & guess too — the reveal unlocks when you’re both finished.
                </p>
                <button onClick={() => nav('/games')} className="mt-6 text-sm font-bold text-[var(--lav-text)]">
                  back to games
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function lower(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
