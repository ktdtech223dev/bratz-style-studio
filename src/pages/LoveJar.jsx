import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Pencil, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

const HEARTS = ['💗', '💖', '❤️', '💛', '💜', '💞'];

export default function LoveJar() {
  const loveJar = useStore((s) => s.loveJar);
  const refreshLoveJar = useStore((s) => s.refreshLoveJar);
  const me = useStore((s) => s.me);

  const [writing, setWriting] = useState(false);
  const [note, setNote] = useState('');
  const [shaken, setShaken] = useState(null);

  useEffect(() => {
    refreshLoveJar();
  }, [refreshLoveJar]);

  const count = loveJar.length;
  const notes = loveJar.filter((j) => j.kind === 'note' && j.body);

  async function addHeart() {
    await api.post('/api/lovejar', { kind: 'heart', userId: me.id });
  }
  async function addNote() {
    if (!note.trim()) return;
    await api.post('/api/lovejar', { kind: 'note', body: note.trim(), userId: me.id });
    setNote('');
    setWriting(false);
  }
  function shake() {
    if (!notes.length) return;
    setShaken(notes[Math.floor(Math.random() * notes.length)]);
  }

  return (
    <div>
      <PageHeader title="Love jar" sub="fill it up with little loves 🫙" />
      <div className="px-5">
        {/* jar */}
        <div className="relative mx-auto mt-2 h-72 w-56">
          <div
            className="absolute inset-x-6 top-0 h-5 rounded-t-xl border-2 border-b-0 border-white/15"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
          <div
            className="absolute inset-x-2 bottom-0 top-5 overflow-hidden rounded-b-[28px] rounded-t-lg border-2 border-white/15"
            style={{ background: 'linear-gradient(rgba(255,255,255,0.05), rgba(255,107,168,0.08))' }}
          >
            {loveJar.slice(0, 44).map((j, i) => (
              <motion.span
                key={j.id}
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                className="absolute"
                style={{
                  fontSize: 22,
                  left: `${8 + ((i * 53) % 78)}%`,
                  bottom: `${4 + ((i * 29) % 72)}%`,
                }}
              >
                {HEARTS[i % HEARTS.length]}
              </motion.span>
            ))}
            {count === 0 && (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[var(--muted)]">
                empty for now — add the first 💗
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 text-center text-sm font-bold text-[var(--pink-hot)]">
          {count} little {count === 1 ? 'love' : 'loves'} inside
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <button
            onClick={addHeart}
            className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95"
          >
            <Heart size={20} fill="#fff" /> Heart
          </button>
          <button
            onClick={() => setWriting(true)}
            className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--card)] py-3.5 font-extrabold active:scale-95"
          >
            <Pencil size={20} /> Note
          </button>
          <button
            onClick={shake}
            disabled={!notes.length}
            className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--card)] py-3.5 font-extrabold active:scale-95 disabled:opacity-40"
          >
            🫙 Shake
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          {notes.length} note{notes.length === 1 ? '' : 's'} hidden inside · shake to read a random one
        </p>
      </div>

      <Sheet open={writing} onClose={() => setWriting(false)} title="Drop in a note">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="a little love note…"
          className="mb-3 w-full resize-none rounded-2xl bg-[var(--card)] p-4"
          autoFocus
        />
        <button
          onClick={addNote}
          disabled={!note.trim()}
          className="w-full rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
        >
          Add to jar 🫙
        </button>
      </Sheet>

      <AnimatePresence>
        {shaken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShaken(null)}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
            style={{ background: 'rgba(10,12,30,0.75)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ scale: 0.7, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.7 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[340px] rounded-3xl bg-[var(--card)] p-6 text-center shadow-soft"
            >
              <button onClick={() => setShaken(null)} className="absolute right-4 top-4 text-[var(--muted)]">
                <X size={20} />
              </button>
              <div className="text-4xl">💌</div>
              <p className="mt-3 text-lg font-bold leading-snug">{shaken.body}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">— {shaken.added_name}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
