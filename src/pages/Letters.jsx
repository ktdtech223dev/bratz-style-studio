import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, Mail, Lock } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

const OCCASIONS = [
  'you miss me',
  'you’re sad',
  'you can’t sleep',
  'you need a laugh',
  'you’re stressed',
  'you need a reminder',
];

export default function Letters() {
  const letters = useStore((s) => s.letters);
  const refreshLetters = useStore((s) => s.refreshLetters);
  const me = useStore((s) => s.me);

  const [writing, setWriting] = useState(false);
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [body, setBody] = useState('');
  const [reading, setReading] = useState(null);

  useEffect(() => {
    refreshLetters();
  }, [refreshLetters]);

  const forYou = letters.filter((l) => l.written_by !== me?.id);
  const fromYou = letters.filter((l) => l.written_by === me?.id);

  async function send() {
    if (!body.trim()) return;
    await api.post('/api/letters', { occasion, body: body.trim(), userId: me.id });
    setBody('');
    setWriting(false);
  }
  async function open(l) {
    if (!l.opened_at) await api.post(`/api/letters/${l.id}/open`, { userId: me.id });
    setReading({ ...l, opened_at: l.opened_at || new Date().toISOString() });
  }

  return (
    <div>
      <PageHeader
        title="Open when…"
        sub="letters to open at just the right moment 💌"
        right={
          <button
            onClick={() => setWriting(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pink-hot)] text-white"
          >
            <Plus size={22} />
          </button>
        }
      />
      <div className="space-y-5 px-5 pb-6">
        <section>
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">For you</h3>
          {forYou.length === 0 && <p className="text-sm text-[var(--muted)]">no letters waiting yet 💭</p>}
          <div className="grid grid-cols-2 gap-3">
            {forYou.map((l) => (
              <button
                key={l.id}
                onClick={() => open(l)}
                className="relative overflow-hidden rounded-2xl border border-[var(--border)] p-4 text-left shadow-soft"
                style={{
                  background: l.opened_at
                    ? 'var(--card)'
                    : 'linear-gradient(135deg, var(--pink-hot)22, var(--purple)15)',
                }}
              >
                <div className="mb-2 text-2xl">{l.opened_at ? '💌' : '✉️'}</div>
                <div className="text-xs font-bold text-[var(--text2)]">open when</div>
                <div className="font-extrabold leading-tight">{l.occasion}</div>
                {!l.opened_at && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--pink-hot)]">
                    <Lock size={11} /> sealed
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {fromYou.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">From you</h3>
            <div className="space-y-2">
              {fromYou.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3"
                >
                  <Mail size={18} className="text-[var(--pink)]" />
                  <span className="flex-1">
                    <span className="block text-sm font-bold">open when {l.occasion}</span>
                    <span className="block text-xs text-[var(--muted)]">{l.opened_at ? 'opened 💞' : 'sealed'}</span>
                  </span>
                  <button onClick={() => api.del(`/api/letters/${l.id}`)} className="text-[var(--muted)]">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Sheet open={writing} onClose={() => setWriting(false)} title="Write a letter">
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text2)]">Open when…</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              onClick={() => setOccasion(o)}
              className="rounded-full px-3 py-1.5 text-xs font-bold"
              style={{
                background: occasion === o ? 'var(--pink-hot)' : 'var(--card)',
                color: occasion === o ? '#fff' : 'var(--text2)',
              }}
            >
              {o}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="write something they’ll need to hear…"
          className="mb-3 w-full resize-none rounded-2xl bg-[var(--card)] p-4"
        />
        <button
          onClick={send}
          disabled={!body.trim()}
          className="w-full rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
        >
          Seal it 💌
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
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] rounded-3xl bg-[var(--card)] p-6 shadow-soft"
            >
              <div className="text-center text-3xl">💌</div>
              <div className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-[var(--lav-text)]">
                open when {reading.occasion}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{reading.body}</p>
              <p className="mt-4 text-right text-xs text-[var(--muted)]">— {reading.written_name}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
