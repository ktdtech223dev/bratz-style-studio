import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, Lock } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { dateLabel } from '../lib/time';

export default function Capsules() {
  const capsules = useStore((s) => s.capsules);
  const refreshCapsules = useStore((s) => s.refreshCapsules);
  const me = useStore((s) => s.me);

  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [unlock, setUnlock] = useState('');
  const [reading, setReading] = useState(null);

  useEffect(() => {
    refreshCapsules();
  }, [refreshCapsules]);

  async function bury() {
    if (!body.trim() || !unlock) return;
    await api.post('/api/capsules', { title: title.trim(), body: body.trim(), unlock_at: unlock, userId: me.id });
    setTitle('');
    setBody('');
    setUnlock('');
    setWriting(false);
  }
  async function openCapsule(c) {
    if (!c.unlocked) return;
    if (!c.opened_at) await api.post(`/api/capsules/${c.id}/open`, { userId: me.id });
    setReading(c);
  }

  return (
    <div>
      <PageHeader
        title="Time capsules"
        sub="messages that unlock on a future date ⏳"
        right={
          <button
            onClick={() => setWriting(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--purple)] text-white"
          >
            <Plus size={22} />
          </button>
        }
      />
      <div className="space-y-3 px-5 pb-6">
        {capsules.length === 0 && (
          <p className="mt-16 text-center text-sm text-[var(--muted)]">bury your first capsule ⏳</p>
        )}
        {capsules.map((c) => (
          <button
            key={c.id}
            onClick={() => openCapsule(c)}
            disabled={!c.unlocked}
            className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] p-4 text-left shadow-soft"
            style={{ background: c.unlocked ? 'var(--card)' : 'linear-gradient(135deg,#c084fc18,#7dd3fc12)' }}
          >
            <span className="text-3xl">{c.unlocked ? '📜' : '⏳'}</span>
            <span className="flex-1">
              <span className="block font-extrabold">{c.title || 'a time capsule'}</span>
              <span className="block text-xs text-[var(--text2)]">
                {c.unlocked ? `unlocked · from ${c.written_name}` : `unlocks ${dateLabel(c.unlock_at)}`}
              </span>
            </span>
            {!c.unlocked ? (
              <Lock size={16} className="text-[var(--purple)]" />
            ) : (
              <Trash2
                size={15}
                className="text-[var(--muted)]"
                onClick={(e) => {
                  e.stopPropagation();
                  api.del(`/api/capsules/${c.id}`);
                }}
              />
            )}
          </button>
        ))}
      </div>

      <Sheet open={writing} onClose={() => setWriting(false)} title="Bury a capsule">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="title (optional)"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="a message for future us…"
          className="mb-3 w-full resize-none rounded-2xl bg-[var(--card)] p-4"
        />
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text2)]">Unlocks on</label>
        <input
          type="date"
          value={unlock}
          onChange={(e) => setUnlock(e.target.value)}
          className="mb-4 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <button
          onClick={bury}
          disabled={!body.trim() || !unlock}
          className="w-full rounded-2xl bg-[var(--purple)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
        >
          Seal it ⏳
        </button>
      </Sheet>

      <AnimatePresence>
        {reading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReading(null)}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
            style={{ background: 'rgba(10,12,30,0.78)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] rounded-3xl bg-[var(--card)] p-6 shadow-soft"
            >
              <div className="text-center text-3xl">📜</div>
              <div className="mt-2 text-center font-extrabold">{reading.title || 'a time capsule'}</div>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{reading.body}</p>
              <p className="mt-4 text-right text-xs text-[var(--muted)]">— {reading.written_name}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
