import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { dateLabel, relPill } from '../lib/time';

export default function Calendar() {
  const events = useStore((s) => s.events);
  const refreshEvents = useStore((s) => s.refreshEvents);
  const me = useStore((s) => s.me);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', note: '' });

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  async function add() {
    if (!form.title.trim() || !form.date) return;
    await api.post('/api/events', { ...form, title: form.title.trim(), userId: me.id });
    setForm({ title: '', date: '', time: '', note: '' });
    setAdding(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today);

  return (
    <div>
      <PageHeader
        title="Calendar"
        sub="plans & countdowns"
        right={
          <button
            onClick={() => setAdding(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pink-hot)] text-white"
          >
            <Plus size={22} />
          </button>
        }
      />
      <div className="px-5 pb-6">
        {events.length === 0 && (
          <div className="mt-16 text-center text-[var(--text2)]">
            <CalendarDays size={40} className="mx-auto text-[var(--muted)]" />
            <p className="mt-3 font-semibold">Nothing planned</p>
            <p className="text-sm text-[var(--muted)]">tap + to plan a date or trip</p>
          </div>
        )}

        {upcoming.length > 0 && (
          <>
            <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">Upcoming</h3>
            <div className="space-y-2.5">
              {upcoming.map((e, i) => (
                <Row key={e.id} e={e} i={i} />
              ))}
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <h3 className="mb-2 mt-7 text-xs font-extrabold uppercase tracking-widest text-[var(--muted)]">Past</h3>
            <div className="space-y-2.5 opacity-60">
              {past.map((e, i) => (
                <Row key={e.id} e={e} i={i} />
              ))}
            </div>
          </>
        )}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="New plan">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="what's the plan?"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
          autoFocus
        />
        <div className="mb-3 flex gap-2">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="flex-1 rounded-2xl bg-[var(--card)] p-4 text-[var(--text)]"
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="w-32 rounded-2xl bg-[var(--card)] p-4 text-[var(--text)]"
          />
        </div>
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          rows={2}
          placeholder="details (optional)"
          className="mb-4 w-full resize-none rounded-2xl bg-[var(--card)] p-4"
        />
        <button
          onClick={add}
          disabled={!form.title.trim() || !form.date}
          className="w-full rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
        >
          Add plan
        </button>
      </Sheet>
    </div>
  );
}

function Row({ e, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.04, 0.3) }}
      className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
    >
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--pink-hot)]/15">
        <span className="text-sm font-extrabold leading-none text-[var(--pink-hot)]">
          {new Date(e.date + 'T00:00:00').getDate()}
        </span>
        <span className="text-[9px] font-bold uppercase text-[var(--pink-hot)]">
          {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
        </span>
      </div>
      <div className="flex-1">
        <div className="font-bold">{e.title}</div>
        <div className="text-xs text-[var(--muted)]">
          {dateLabel(e.date)}
          {e.time ? ` · ${e.time}` : ''}
          {e.note ? ` · ${e.note}` : ''}
        </div>
      </div>
      <span className="rounded-full bg-[var(--cyan)]/15 px-2.5 py-1 text-[11px] font-extrabold text-[var(--cyan)]">
        {relPill(e.date)}
      </span>
      <button onClick={async () => await api.del(`/api/events/${e.id}`)} className="text-[var(--muted)]">
        <Trash2 size={15} />
      </button>
    </motion.div>
  );
}
