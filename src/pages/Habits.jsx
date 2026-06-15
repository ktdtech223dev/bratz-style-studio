import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Check, Flame } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

const ICONS = ['✅', '💧', '🏃', '📓', '🧘', '📚', '🥗', '😴', '🎧', '💊'];

function streak(logs, habitId, userId, today) {
  const set = new Set(logs.filter((l) => l.habit_id === habitId && l.user_id === userId).map((l) => l.date));
  let s = 0;
  const d = new Date(today + 'T00:00:00');
  // if today's not done yet, start counting from yesterday so a streak still shows
  if (!set.has(today)) d.setDate(d.getDate() - 1);
  for (;;) {
    const ds = d.toISOString().slice(0, 10);
    if (set.has(ds)) {
      s++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return s;
}

export default function Habits() {
  const data = useStore((s) => s.habits);
  const refreshHabits = useStore((s) => s.refreshHabits);
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('✅');

  useEffect(() => {
    refreshHabits();
  }, [refreshHabits]);

  const { habits = [], logs = [], today = '' } = data || {};
  const doneToday = (hid, uid) => logs.some((l) => l.habit_id === hid && l.user_id === uid && l.date === today);

  async function add() {
    if (!title.trim()) return;
    await api.post('/api/habits', { title: title.trim(), icon, userId: me.id });
    setTitle('');
    setIcon('✅');
    setAdding(false);
  }

  return (
    <div>
      <PageHeader
        title="Shared habits"
        sub="build little streaks together ✅"
        right={
          <button
            onClick={() => setAdding(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--green)] text-[#1a1f4a]"
          >
            <Plus size={22} />
          </button>
        }
      />
      <div className="space-y-3 px-5 pb-6">
        {habits.length === 0 && (
          <p className="mt-16 text-center text-sm text-[var(--muted)]">add a habit to keep up together ✅</p>
        )}
        {habits.map((h) => {
          const myStreak = streak(logs, h.id, me?.id, today);
          const theirStreak = partner ? streak(logs, h.id, partner.id, today) : 0;
          const meDone = doneToday(h.id, me?.id);
          return (
            <div key={h.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{h.icon}</span>
                <div className="flex-1">
                  <div className="font-extrabold leading-tight">{h.title}</div>
                  <div className="flex gap-3 text-xs text-[var(--text2)]">
                    <span className="flex items-center gap-0.5">
                      <Flame size={12} className="text-[var(--orange)]" /> you {myStreak}
                    </span>
                    {partner && (
                      <span className="flex items-center gap-0.5">
                        <Flame size={12} className="text-[var(--orange)]" /> {partner.display_name} {theirStreak}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => api.del(`/api/habits/${h.id}`)} className="text-[var(--muted)]">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => api.post(`/api/habits/${h.id}/toggle`, { userId: me.id })}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-extrabold"
                  style={{
                    background: meDone ? 'var(--green)' : 'var(--card2)',
                    color: meDone ? '#1a1f4a' : 'var(--text)',
                  }}
                >
                  <Check size={16} /> {meDone ? 'done today' : 'mark done'}
                </motion.button>
                {partner && (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                    style={{
                      background: doneToday(h.id, partner.id) ? 'var(--green)' : 'var(--card2)',
                      color: doneToday(h.id, partner.id) ? '#1a1f4a' : 'var(--muted)',
                    }}
                    title={`${partner.display_name} today`}
                  >
                    {doneToday(h.id, partner.id) ? <Check size={16} /> : partner.display_name?.[0]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="New habit">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. drink water, journal…"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
              style={{ background: icon === ic ? 'var(--green)' : 'var(--card)' }}
            >
              {ic}
            </button>
          ))}
        </div>
        <button
          onClick={add}
          disabled={!title.trim()}
          className="w-full rounded-2xl bg-[var(--green)] py-3.5 font-extrabold text-[#1a1f4a] active:scale-95 disabled:opacity-50"
        >
          Add habit ✅
        </button>
      </Sheet>
    </div>
  );
}
