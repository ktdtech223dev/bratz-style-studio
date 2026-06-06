import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

function norm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function isMatch(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb || na === '—' || nb === '—') return false;
  if (na === nb) return true;
  if (na.length > 2 && nb.length > 2 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}

export default function GameResults() {
  const { gameId, sessionId } = useParams();
  const games = useStore((s) => s.games);
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);
  const users = useStore((s) => s.users);
  const game = games?.games.find((g) => g.id === gameId);

  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    api.get(`/api/games/session/${sessionId}`).then(({ answers }) => setAnswers(answers || []));
  }, [sessionId]);

  if (!game) return <PageHeader title="Results" />;

  const partnerId = partner?.id ?? (me?.id === 1 ? 2 : 1);
  const pName = users.find((u) => u.id === partnerId)?.display_name || 'Them';
  const myColor = users.find((u) => u.id === me?.id)?.color || '#b8a9e8';
  const pColor = users.find((u) => u.id === partnerId)?.color || '#f5a3c7';

  const pick = (qid, uid, kind) =>
    answers.find((a) => a.question_id === qid && a.user_id === uid && a.kind === kind)?.answer;

  // scores
  let myScore = 0;
  let pScore = 0;
  game.questions.forEach((q) => {
    if (isMatch(pick(q.id, me?.id, 'guess'), pick(q.id, partnerId, 'self'))) myScore++;
    if (isMatch(pick(q.id, partnerId, 'guess'), pick(q.id, me?.id, 'self'))) pScore++;
  });
  const N = game.questions.length;
  const ready = answers.length >= N * 4;

  return (
    <div>
      <PageHeader title={game.title} sub="the big reveal" />
      <div className="space-y-4 px-5 pb-4">
        {!ready && (
          <Card className="p-4 text-center text-sm text-[var(--orange)]">
            Not everyone has finished yet — showing what’s in so far.
          </Card>
        )}

        {/* scoreboard */}
        <Card className="p-5">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-[var(--bg2)] p-4" style={{ boxShadow: `inset 0 0 0 1px ${myColor}33` }}>
              <div className="text-3xl font-extrabold" style={{ color: myColor }}>
                {myScore}/{N}
              </div>
              <div className="mt-1 text-xs font-semibold text-[var(--text2)]">you knew {pName}</div>
            </div>
            <div className="rounded-2xl bg-[var(--bg2)] p-4" style={{ boxShadow: `inset 0 0 0 1px ${pColor}33` }}>
              <div className="text-3xl font-extrabold" style={{ color: pColor }}>
                {pScore}/{N}
              </div>
              <div className="mt-1 text-xs font-semibold text-[var(--text2)]">{pName} knew you</div>
            </div>
          </div>
        </Card>

        {game.questions.map((q, i) => {
          const myReal = pick(q.id, me?.id, 'self');
          const myGuess = pick(q.id, me?.id, 'guess');
          const pReal = pick(q.id, partnerId, 'self');
          const pGuess = pick(q.id, partnerId, 'guess');
          const youGotThem = isMatch(myGuess, pReal);
          const theyGotYou = isMatch(pGuess, myReal);
          return (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-5">
                <h3 className="text-base font-extrabold leading-snug">{q.q}</h3>

                {/* you knew them */}
                <Block
                  label={`Your guess of ${pName}`}
                  guess={myGuess}
                  realLabel={`${pName} really said`}
                  real={pReal}
                  match={youGotThem}
                  color={pColor}
                />
                {/* they knew you */}
                <Block
                  label={`${pName}'s guess of you`}
                  guess={pGuess}
                  realLabel="you really said"
                  real={myReal}
                  match={theyGotYou}
                  color={myColor}
                />
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Block({ label, guess, realLabel, real, match, color }) {
  return (
    <div className="mt-4 rounded-2xl bg-[var(--bg2)] p-3" style={{ boxShadow: `inset 0 0 0 1px ${color}22` }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-extrabold" style={{ color }}>
          {label}
        </span>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: match ? '#9be89b22' : '#ffffff10' }}
        >
          {match ? <Check size={14} color="#9be89b" strokeWidth={3} /> : <X size={14} color="#6b6896" strokeWidth={3} />}
        </span>
      </div>
      <p className="text-sm text-[var(--text)]">{guess || <span className="text-[var(--muted)]">—</span>}</p>
      <div className="mt-2 border-t border-white/5 pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{realLabel}</span>
        <p className="text-sm text-[var(--text)]">{real || <span className="text-[var(--muted)]">waiting…</span>}</p>
      </div>
    </div>
  );
}
