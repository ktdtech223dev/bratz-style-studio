import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { dateLabel } from '../lib/time';

const FACES = [
  { v: 1, e: '😞', label: 'rough' },
  { v: 2, e: '😕', label: 'meh' },
  { v: 3, e: '😐', label: 'okay' },
  { v: 4, e: '🙂', label: 'good' },
  { v: 5, e: '😄', label: 'great' },
];

export default function CheckIn() {
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);
  const users = useStore((s) => s.users);

  const [today, setToday] = useState({ date: '', entries: [] });
  const [history, setHistory] = useState([]);
  const [rating, setRating] = useState(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  async function load() {
    const t = await api.get('/api/checkin/today');
    setToday(t);
    const mine = t.entries.find((e) => e.user_id === me?.id);
    if (mine) {
      setRating(mine.rating);
      setNote(mine.note || '');
    }
    setHistory(await api.get('/api/checkin/history'));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!rating) return;
    await api.post('/api/checkin', { userId: me.id, rating, note: note.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    load();
  }

  const nameFor = (id) => users.find((u) => u.id === id)?.display_name || 'Them';
  const colorFor = (id) => users.find((u) => u.id === id)?.color || '#b8a9e8';
  const faceFor = (r) => FACES.find((f) => f.v === r)?.e || '·';
  const partnerToday = partner && today.entries.find((e) => e.user_id === partner.id);

  return (
    <div>
      <PageHeader title="Daily check-in" sub="how was your day?" />
      <div className="px-5">
        <Card className="p-5">
          <div className="text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">Today</div>
          <div className="mt-3 flex justify-between gap-1">
            {FACES.map((f) => (
              <button
                key={f.v}
                onClick={() => setRating(f.v)}
                className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition-all"
                style={{
                  background: rating === f.v ? 'var(--card2)' : 'transparent',
                  boxShadow: rating === f.v ? 'inset 0 0 0 1.5px var(--lavender)' : 'none',
                }}
              >
                <span className="text-3xl">{f.e}</span>
                <span className="text-[10px] font-bold text-[var(--text2)]">{f.label}</span>
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="a line about your day… (optional)"
            className="mt-4 w-full resize-none rounded-2xl bg-[var(--bg2)] p-4 text-[var(--text)] placeholder:text-[var(--muted)]"
          />
          <button
            onClick={save}
            disabled={!rating}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check size={18} /> Saved
              </>
            ) : (
              'Check in'
            )}
          </button>
          {partnerToday && (
            <div className="mt-4 rounded-2xl bg-[var(--bg2)] p-3" style={{ boxShadow: `inset 0 0 0 1px ${colorFor(partner.id)}33` }}>
              <div className="text-xs font-extrabold" style={{ color: colorFor(partner.id) }}>
                {nameFor(partner.id)} today {faceFor(partnerToday.rating)}
              </div>
              {partnerToday.note && <p className="mt-1 text-sm">{partnerToday.note}</p>}
            </div>
          )}
        </Card>

        <h3 className="mb-2 mt-7 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
          Past days
        </h3>
        <div className="space-y-2 pb-4">
          {history
            .filter((d) => d.date !== today.date)
            .map((d) => (
              <div key={d.date} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                <span className="text-sm font-semibold text-[var(--text2)]">{dateLabel(d.date)}</span>
                <div className="ml-auto flex gap-3">
                  {users.map((u) => {
                    const e = d.entries.find((x) => x.user_id === u.id);
                    return (
                      <span key={u.id} className="flex items-center gap-1 text-lg">
                        {e ? faceFor(e.rating) : '–'}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          {history.filter((d) => d.date !== today.date).length === 0 && (
            <p className="py-6 text-center text-sm text-[var(--muted)]">your check-ins will gather here ☀️</p>
          )}
        </div>
      </div>
    </div>
  );
}
