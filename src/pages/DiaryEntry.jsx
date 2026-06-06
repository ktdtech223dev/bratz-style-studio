import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Lock, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { catMeta } from '../lib/diary';
import { dateLabel } from '../lib/time';

export default function DiaryEntry() {
  const { date } = useParams();
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);
  const users = useStore((s) => s.users);
  const storeToday = useStore((s) => s.today);
  const liveEntries = useStore((s) => s.diaryEntries);

  const [day, setDay] = useState(null);
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  const isToday = date === 'today' || (storeToday && date === storeToday.date);

  async function load() {
    if (isToday) {
      const { day, entries } = await api.get('/api/diary/today');
      setDay(day);
      setEntries(entries);
      const mine = entries.find((e) => e.user_id === me?.id);
      if (mine) setDraft(mine.response);
    } else {
      const hist = await api.get('/api/diary/history');
      const d = hist.find((h) => h.date === date);
      if (d) {
        setDay(d);
        setEntries(d.entries);
      }
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, storeToday?.date]);

  // live update when partner answers today
  useEffect(() => {
    if (isToday && liveEntries && liveEntries.length) setEntries(liveEntries);
  }, [liveEntries, isToday]);

  const colorFor = (id) => users.find((u) => u.id === id)?.color || '#b8a9e8';
  const nameFor = (id) => users.find((u) => u.id === id)?.display_name || 'Them';
  const meta = day ? catMeta(day.category) : catMeta();

  const myEntry = entries.find((e) => e.user_id === me?.id);
  const partnerEntry = partner && entries.find((e) => e.user_id === partner.id);
  const bothAnswered = !!myEntry && !!partnerEntry;

  async function save() {
    await api.post('/api/diary', { userId: me.id, response: draft.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    load();
  }

  return (
    <div>
      <PageHeader title={day ? dateLabel(day.date) : 'Diary'} sub={isToday ? "today's prompt" : 'past entry'} />
      <div className="px-5">
        <Card className="p-5">
          <div
            className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-extrabold tracking-widest"
            style={{ background: meta.color + '22', color: meta.color }}
          >
            {meta.label}
          </div>
          <h2 className="text-xl font-extrabold leading-snug">{day?.prompt || 'Loading…'}</h2>
        </Card>

        {isToday && (
          <Card className="mt-4 p-5" delay={0.05}>
            <div className="mb-2 text-xs font-extrabold" style={{ color: colorFor(me?.id) }}>
              Your answer
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              placeholder="write from the heart…"
              className="w-full resize-none rounded-2xl bg-[var(--bg2)] p-4 text-[var(--text)] placeholder:text-[var(--muted)]"
            />
            <button
              onClick={save}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95"
            >
              {saved ? (
                <>
                  <Check size={18} /> Saved
                </>
              ) : myEntry ? (
                'Update my answer'
              ) : (
                'Save my answer'
              )}
            </button>
          </Card>
        )}

        {/* reveal */}
        <div className="mt-4 space-y-3 pb-4">
          {bothAnswered ? (
            <>
              <RevealCard name="You" color={colorFor(me?.id)} text={myEntry.response} delay={0.05} />
              <RevealCard name={nameFor(partner?.id)} color={colorFor(partner?.id)} text={partnerEntry.response} delay={0.1} />
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center"
            >
              <Lock size={28} className="text-[var(--muted)]" />
              <p className="mt-3 font-bold">
                {isToday ? 'Answers reveal once you both write' : 'You both never answered this one'}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {myEntry && !partnerEntry && `waiting for ${nameFor(partner?.id)}…`}
                {!myEntry && partnerEntry && `${nameFor(partner?.id)} answered — your turn 💜`}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function RevealCard({ name, color, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
      style={{ boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      <div className="mb-1.5 text-xs font-extrabold" style={{ color }}>
        {name}
      </div>
      <p className="whitespace-pre-wrap text-sm text-[var(--text)]">{text}</p>
    </motion.div>
  );
}
