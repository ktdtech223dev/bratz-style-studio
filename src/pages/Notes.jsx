import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';
import { dateLabel, relTime } from '../lib/time';

export default function Notes() {
  const notes = useStore((s) => s.notes);
  const refreshNotes = useStore((s) => s.refreshNotes);
  const partner = useStore((s) => s.partner);
  const me = useStore((s) => s.me);
  const nav = useNavigate();

  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  const groups = {};
  notes.forEach((n) => {
    const key = (n.created_at || '').slice(0, 10);
    (groups[key] = groups[key] || []).push(n);
  });

  return (
    <div>
      <PageHeader
        title="Notes"
        right={
          <button
            onClick={() => nav('/notes/new')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pink-hot)] text-white"
          >
            <Plus size={22} />
          </button>
        }
      />
      <div className="px-5 pb-6">
        {notes.length === 0 ? (
          <div className="mt-14 flex flex-col items-center text-center">
            <div className="text-5xl">💌</div>
            <p className="mt-4 font-bold">No notes yet</p>
            <p className="mt-1 text-sm text-[var(--text2)]">
              How about writing a note to {partner?.display_name || 'them'}?
            </p>
            <button
              onClick={() => nav('/notes/new')}
              className="mt-5 rounded-2xl bg-[var(--pink-hot)] px-6 py-3 font-extrabold text-white active:scale-95"
            >
              Tap to write a note
            </button>
          </div>
        ) : (
          Object.entries(groups).map(([date, items]) => (
            <div key={date} className="mb-6">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
                {dateLabel(items[0].created_at)}
              </div>
              <div className="space-y-3">
                {items.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-soft"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ background: (n.from_color || '#b8a9e8') + '33' }}
                    >
                      <Heart size={18} fill={n.from_color || '#b8a9e8'} color={n.from_color || '#b8a9e8'} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold" style={{ color: n.from_color }}>
                          From: {n.from_user === me?.id ? 'You' : n.from_name}
                        </span>
                        <span className="text-xs text-[var(--muted)]">{relTime(n.created_at)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text)]">{n.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
