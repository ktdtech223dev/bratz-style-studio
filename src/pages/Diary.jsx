import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { catMeta } from '../lib/diary';
import { dateLabel } from '../lib/time';

function CheckBadge({ done, color }) {
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all"
      style={{
        borderColor: color,
        background: done ? color : 'transparent',
      }}
    >
      {done && <Check size={15} strokeWidth={3.5} color="#1a1f4a" />}
    </div>
  );
}

export default function Diary() {
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);
  const users = useStore((s) => s.users);
  const today = useStore((s) => s.today);
  const setStore = useStore.setState;
  const nav = useNavigate();

  const [todayEntries, setTodayEntries] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/api/diary/today').then(({ day, entries }) => {
      setStore({ today: day });
      setTodayEntries(entries);
    });
    api.get('/api/diary/history').then(setHistory);
  }, []);

  // keep today's entries in sync with live updates
  const diaryEntries = useStore((s) => s.diaryEntries);
  useEffect(() => {
    if (diaryEntries && diaryEntries.length) setTodayEntries(diaryEntries);
  }, [diaryEntries]);

  const colorFor = (id) => users.find((u) => u.id === id)?.color || '#b8a9e8';
  const meDone = todayEntries.some((e) => e.user_id === me?.id);
  const partnerDone = partner && todayEntries.some((e) => e.user_id === partner.id);
  const meta = today ? catMeta(today.category) : catMeta();

  return (
    <div>
      <PageHeader title="Our diary" sub="one shared prompt a day" />
      <div className="px-5">
        <Card onClick={() => nav(`/diary/${today?.date || 'today'}`)} className="p-5">
          <div className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-extrabold tracking-widest" style={{ background: meta.color + '22', color: meta.color }}>
            {meta.label}
          </div>
          <h2 className="text-xl font-extrabold leading-snug">{today?.prompt || 'Loading…'}</h2>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <CheckBadge done={meDone} color={colorFor(me?.id)} />
                <span className="text-xs text-[var(--text2)]">you</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckBadge done={partnerDone} color={colorFor(partner?.id)} />
                <span className="text-xs text-[var(--text2)]">{partner?.display_name || 'them'}</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-[var(--muted)]" />
          </div>
        </Card>

        <h3 className="mb-2 mt-7 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
          Past days
        </h3>
        <div className="space-y-2 pb-4">
          {history
            .filter((d) => d.date !== today?.date)
            .map((d, i) => {
              const m = catMeta(d.category);
              const bothDone = d.entries.length >= 2;
              return (
                <motion.button
                  key={d.date}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => nav(`/diary/${d.date}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left active:scale-[0.99]"
                >
                  <div className="flex-1">
                    <div className="text-xs font-bold" style={{ color: m.color }}>
                      {dateLabel(d.date)}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-sm text-[var(--text)]">{d.prompt}</div>
                  </div>
                  {bothDone ? (
                    <span className="rounded-full bg-[var(--green)]/15 px-2.5 py-1 text-xs font-bold text-[var(--green)]">
                      both
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-[var(--muted)]">
                      {d.entries.length}/2
                    </span>
                  )}
                  <ChevronRight size={18} className="text-[var(--muted)]" />
                </motion.button>
              );
            })}
          {history.length <= 1 && (
            <p className="py-6 text-center text-sm text-[var(--muted)]">your past prompts will gather here 🌙</p>
          )}
        </div>
      </div>
    </div>
  );
}
