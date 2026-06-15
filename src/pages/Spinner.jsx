import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

const SEG_COLORS = ['#ff6ba8', '#7dd3fc', '#9be89b', '#fde047', '#c084fc', '#fdba74', '#67e8f9', '#f5a3c7'];

export default function Spinner() {
  const spinner = useStore((s) => s.spinner);
  const refreshSpinner = useStore((s) => s.refreshSpinner);
  const me = useStore((s) => s.me);

  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [managing, setManaging] = useState(false);
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState('virtual');
  const timer = useRef(null);

  useEffect(() => {
    refreshSpinner();
    return () => clearTimeout(timer.current);
  }, [refreshSpinner]);

  const N = spinner.length;
  const gradient =
    N > 0
      ? `conic-gradient(${spinner
          .map((_, i) => `${SEG_COLORS[i % SEG_COLORS.length]} ${(i / N) * 360}deg ${((i + 1) / N) * 360}deg`)
          .join(',')})`
      : 'var(--card)';

  function spin() {
    if (spinning || N === 0) return;
    setSpinning(true);
    setResult(null);
    const i = Math.floor(Math.random() * N);
    const seg = 360 / N;
    const dest = 360 * 6 + (360 - (i * seg + seg / 2));
    setRot((r) => r - (r % 360) + dest);
    timer.current = setTimeout(() => {
      setSpinning(false);
      setResult(spinner[i]);
    }, 3300);
  }

  async function add() {
    if (!label.trim()) return;
    await api.post('/api/spinner', { label: label.trim(), kind, userId: me.id });
    setLabel('');
  }

  return (
    <div>
      <PageHeader
        title="Date-night spinner"
        sub="let fate pick your next date 🎡"
        right={
          <button
            onClick={() => setManaging(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] text-[var(--lavender)]"
          >
            <Plus size={22} />
          </button>
        }
      />
      <div className="flex flex-col items-center px-5 pt-4">
        <div className="relative h-72 w-72">
          {/* pointer */}
          <div
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
            style={{ width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '20px solid var(--pink-hot)' }}
          />
          <motion.div
            className="h-72 w-72 rounded-full border-4 border-[var(--bg2)] shadow-soft"
            style={{ background: gradient }}
            animate={{ rotate: rot }}
            transition={{ duration: 3.2, ease: [0.2, 0.8, 0.2, 1] }}
          />
          <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg2)] text-2xl">
            🎡
          </div>
        </div>

        <button
          onClick={spin}
          disabled={spinning || N === 0}
          className="mt-7 w-full max-w-xs rounded-2xl bg-[var(--pink-hot)] py-4 text-lg font-extrabold text-white active:scale-95 disabled:opacity-50"
        >
          {spinning ? 'spinning…' : 'Spin!'}
        </button>

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-5 w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--lav-text)]">tonight</div>
            <div className="mt-1 text-xl font-extrabold">{result.label}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">{result.kind === 'irl' ? 'in person 🤗' : 'virtual 💻'}</div>
          </motion.div>
        )}
        {N === 0 && <p className="mt-6 text-sm text-[var(--muted)]">add some date ideas to spin →</p>}
      </div>

      <Sheet open={managing} onClose={() => setManaging(false)} title="Date ideas">
        <div className="mb-3 flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="add a date idea…"
            className="flex-1 rounded-2xl bg-[var(--card)] p-3.5"
          />
          <button onClick={add} className="rounded-2xl bg-[var(--pink-hot)] px-4 font-extrabold text-white">
            Add
          </button>
        </div>
        <div className="mb-4 flex gap-2">
          {['virtual', 'irl'].map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className="rounded-full px-3 py-1.5 text-xs font-bold"
              style={{ background: kind === k ? 'var(--pink-hot)' : 'var(--card)', color: kind === k ? '#fff' : 'var(--text2)' }}
            >
              {k === 'irl' ? 'in person' : 'virtual'}
            </button>
          ))}
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {spinner.map((o) => (
            <div key={o.id} className="flex items-center gap-2 rounded-xl bg-[var(--card)] px-3 py-2">
              <span className="flex-1 text-sm font-semibold">{o.label}</span>
              <span className="text-[10px] text-[var(--muted)]">{o.kind === 'irl' ? '🤗' : '💻'}</span>
              <button onClick={() => api.del(`/api/spinner/${o.id}`)} className="text-[var(--muted)]">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
