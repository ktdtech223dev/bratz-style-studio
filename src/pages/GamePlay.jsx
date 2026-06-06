import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Play } from 'lucide-react';
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
  const [phase, setPhase] = useState('intro'); // intro | play | waiting
  const [sessionId, setSessionId] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (gameId) api.get(`/api/games/history/${gameId}`).then(setHistory).catch(() => {});
  }, [gameId]);

  // While waiting, listen for completion
  useEffect(() => {
    if (phase !== 'waiting' || !sessionId) return;
    const s = getSocket();
    const onComplete = ({ sessionId: sid }) => {
      if (Number(sid) === Number(sessionId)) nav(`/games/${gameId}/results/${sessionId}`);
    };
    s.on('game:complete', onComplete);
    // also poll once in case it's already done
    api.get(`/api/games/session/${sessionId}`).then(({ session, answers }) => {
      const need = game.questions.length;
      const byUser = {};
      answers.forEach((a) => (byUser[a.user_id] = (byUser[a.user_id] || 0) + 1));
      const both = Object.values(byUser).filter((c) => c >= need).length >= 2;
      if (both || session?.completed) nav(`/games/${gameId}/results/${sessionId}`);
    });
    return () => s.off('game:complete', onComplete);
  }, [phase, sessionId, gameId, game, nav]);

  if (!game) return <PageHeader title="Game" />;

  async function start() {
    const { sessionId: sid } = await api.post('/api/games/start', { gameId, userId: me.id });
    // resume: skip questions already answered by me in this session
    const { answers } = await api.get(`/api/games/session/${sid}`);
    const mine = new Set(answers.filter((a) => a.user_id === me.id).map((a) => a.question_id));
    const firstUnanswered = game.questions.findIndex((q) => !mine.has(q.id));
    setSessionId(sid);
    if (firstUnanswered === -1) {
      setPhase('waiting');
    } else {
      setIdx(firstUnanswered);
      setPhase('play');
      setAnswer('');
    }
  }

  async function submitAnswer() {
    const q = game.questions[idx];
    await api.post('/api/games/answer', {
      sessionId,
      questionId: q.id,
      userId: me.id,
      answer: answer.trim() || '—',
    });
    setAnswer('');
    if (idx + 1 < game.questions.length) {
      setIdx(idx + 1);
    } else {
      setPhase('waiting');
    }
  }

  const isGuess = game.type === 'guess';

  return (
    <div>
      <PageHeader title={game.title} sub={isGuess ? `Guess what ${partner?.display_name || 'they'}'d say` : 'Answer together, then compare'} />

      <div className="px-5">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="flex flex-col items-center p-7 text-center">
                <div className="text-6xl">{game.icon}</div>
                <h2 className="mt-3 text-xl font-extrabold">{game.title}</h2>
                <p className="mt-2 text-sm text-[var(--text2)]">
                  {game.questions.length} questions ·{' '}
                  {game.type === 'compare' ? 'compare your answers' : 'guess each other'}
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

          {phase === 'play' && (
            <motion.div key={`q${idx}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="mb-4 flex justify-center gap-2">
                {game.questions.map((_, i) => (
                  <div
                    key={i}
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: i === idx ? 24 : 8,
                      background: i <= idx ? 'var(--pink-hot)' : 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </div>
              <Card className="p-6">
                <div className="text-xs font-bold text-[var(--lav-text)]">
                  Question {idx + 1} of {game.questions.length}
                </div>
                <h2 className="mt-2 text-xl font-extrabold leading-snug">{game.questions[idx].q}</h2>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="type your answer…"
                  rows={4}
                  autoFocus
                  className="mt-4 w-full resize-none rounded-2xl bg-[var(--bg2)] p-4 text-[var(--text)] placeholder:text-[var(--muted)]"
                />
                <button
                  onClick={submitAnswer}
                  className="mt-4 w-full rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95"
                >
                  {idx + 1 < game.questions.length ? 'Next' : 'Finish'}
                </button>
              </Card>
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
                  Waiting for {partner?.display_name || 'your partner'} to finish… results unlock when you both
                  answer.
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
