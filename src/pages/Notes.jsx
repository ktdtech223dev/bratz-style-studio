import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Heart, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';
import { dateLabel, relTime } from '../lib/time';

function NoteCard({ n, i, me, emit }) {
  const [reply, setReply] = useState('');
  const replies = n.replies || [];

  function send() {
    const body = reply.trim();
    if (!body) return;
    emit('note:reply', { noteId: n.id, body });
    setReply('');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className="rounded-2xl border border-[var(--border)] bg-grad-card p-4 shadow-card"
    >
      <div className="flex gap-3">
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
      </div>

      {/* replies thread */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
          {replies.map((r) => (
            <div key={r.id} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-xs font-extrabold" style={{ color: r.from_color }}>
                {r.from_user === me?.id ? 'You' : r.from_name}
              </span>
              <p className="flex-1 whitespace-pre-wrap text-sm text-[var(--text2)]">{r.body}</p>
              <span className="shrink-0 text-[10px] text-[var(--muted)]">{relTime(r.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* reply composer */}
      <div className="mt-3 flex items-center gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="write a reply…"
          className="flex-1 rounded-full bg-[var(--bg2)] px-3.5 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
        />
        <button
          onClick={send}
          disabled={!reply.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pink-hot)] text-white transition-transform active:scale-90 disabled:opacity-40"
          aria-label="Send reply"
        >
          <Send size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Notes() {
  const notes = useStore((s) => s.notes);
  const refreshNotes = useStore((s) => s.refreshNotes);
  const partner = useStore((s) => s.partner);
  const me = useStore((s) => s.me);
  const emit = useStore((s) => s.emit);
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
                  <NoteCard key={n.id} n={n} i={i} me={me} emit={emit} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
