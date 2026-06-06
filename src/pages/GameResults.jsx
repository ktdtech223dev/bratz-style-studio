import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

export default function GameResults() {
  const { gameId, sessionId } = useParams();
  const games = useStore((s) => s.games);
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);
  const users = useStore((s) => s.users);
  const game = games?.games.find((g) => g.id === gameId);

  const [answers, setAnswers] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    api.get(`/api/games/session/${sessionId}`).then(({ answers, session }) => {
      setAnswers(answers);
      setSession(session);
    });
  }, [sessionId]);

  if (!game) return <PageHeader title="Results" />;

  const nameFor = (id) => users.find((u) => u.id === id)?.display_name || (id === me?.id ? 'You' : 'Them');
  const colorFor = (id) => users.find((u) => u.id === id)?.color || '#b8a9e8';

  const ansFor = (qid, uid) => answers.find((a) => a.question_id === qid && a.user_id === uid)?.answer;
  const partnerId = partner?.id ?? (me?.id === 1 ? 2 : 1);
  const bothDone = game.questions.every((q) => ansFor(q.id, me?.id) && ansFor(q.id, partnerId));

  return (
    <div>
      <PageHeader title={game.title} sub={game.type === 'guess' ? 'Your guesses, revealed' : 'Side by side'} />
      <div className="space-y-4 px-5 pb-4">
        {!bothDone && (
          <Card className="p-4 text-center text-sm text-[var(--orange)]">
            Some answers are still missing — this shows everything answered so far.
          </Card>
        )}
        {game.questions.map((q, i) => {
          const mine = ansFor(q.id, me?.id);
          const theirs = ansFor(q.id, partnerId);
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5">
                <h3 className="text-base font-extrabold leading-snug">{q.q}</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[var(--bg2)] p-3" style={{ boxShadow: `inset 0 0 0 1px ${colorFor(me?.id)}33` }}>
                    <div className="mb-1 text-xs font-extrabold" style={{ color: colorFor(me?.id) }}>
                      You
                    </div>
                    <div className="text-sm text-[var(--text)]">{mine || <span className="text-[var(--muted)]">—</span>}</div>
                  </div>
                  <div className="rounded-2xl bg-[var(--bg2)] p-3" style={{ boxShadow: `inset 0 0 0 1px ${colorFor(partnerId)}33` }}>
                    <div className="mb-1 text-xs font-extrabold" style={{ color: colorFor(partnerId) }}>
                      {nameFor(partnerId)}
                    </div>
                    <div className="text-sm text-[var(--text)]">
                      {theirs || <span className="text-[var(--muted)]">waiting…</span>}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
