import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Trash2, Camera, ListChecks } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { dateLabel } from '../lib/time';

export default function BucketList() {
  const bucket = useStore((s) => s.bucket);
  const refreshBucket = useStore((s) => s.refreshBucket);
  const me = useStore((s) => s.me);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const photoForRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    refreshBucket();
  }, [refreshBucket]);

  async function add() {
    if (!title.trim()) return;
    await api.post('/api/bucket', { title: title.trim(), note: note.trim(), userId: me.id });
    setTitle('');
    setNote('');
    setAdding(false);
  }

  async function toggle(item, file) {
    const fd = new FormData();
    fd.append('userId', me.id);
    fd.append('done', item.done ? '0' : '1');
    if (file) fd.append('photo', file);
    await fetch(`/api/bucket/${item.id}/done`, { method: 'POST', body: fd });
  }

  function onPickPhoto(e) {
    const file = e.target.files?.[0];
    const item = photoForRef.current;
    if (file && item) toggle({ ...item, done: false }, file); // ensure marked done with photo
    e.target.value = '';
  }

  const todo = bucket.filter((b) => !b.done);
  const done = bucket.filter((b) => b.done);

  return (
    <div>
      <PageHeader
        title="Bucket list"
        sub="things to do together"
        right={
          <button
            onClick={() => setAdding(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pink-hot)] text-white"
          >
            <Plus size={22} />
          </button>
        }
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />

      <div className="px-5 pb-6">
        {bucket.length === 0 && (
          <div className="mt-16 text-center text-[var(--text2)]">
            <ListChecks size={40} className="mx-auto text-[var(--muted)]" />
            <p className="mt-3 font-semibold">No dreams yet</p>
            <p className="text-sm text-[var(--muted)]">tap + to add something you want to do together</p>
          </div>
        )}

        {todo.length > 0 && (
          <div className="space-y-2.5">
            {todo.map((item, i) => (
              <Row key={item.id} item={item} i={i} me={me} onToggle={() => toggle(item)} />
            ))}
          </div>
        )}

        {done.length > 0 && (
          <>
            <h3 className="mb-2 mt-7 text-xs font-extrabold uppercase tracking-widest text-[var(--green)]">
              Done together 🎉
            </h3>
            <div className="space-y-2.5">
              {done.map((item, i) => (
                <Row
                  key={item.id}
                  item={item}
                  i={i}
                  me={me}
                  onToggle={() => toggle(item)}
                  onAddPhoto={() => {
                    photoForRef.current = item;
                    fileRef.current?.click();
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAdding(false)}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(10,12,30,0.7)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ y: 360 }}
              animate={{ y: 0 }}
              exit={{ y: 360 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[520px] rounded-t-3xl bg-[var(--bg2)] p-5 pb-8 safe-bottom"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold">New bucket-list dream</h3>
                <button onClick={() => setAdding(false)} className="text-[var(--muted)]">
                  <X size={22} />
                </button>
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Watch the sunrise together"
                className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
                autoFocus
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="details (optional)"
                className="mb-4 w-full resize-none rounded-2xl bg-[var(--card)] p-4"
              />
              <button
                onClick={add}
                disabled={!title.trim()}
                className="w-full rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
              >
                Add to list
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ item, i, me, onToggle, onAddPhoto }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.04, 0.3) }}
    >
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all"
            style={{
              borderColor: item.done ? '#9be89b' : 'var(--muted)',
              background: item.done ? '#9be89b' : 'transparent',
            }}
          >
            {item.done && <Check size={16} strokeWidth={3.5} color="#1a1f4a" />}
          </button>
          <div className="flex-1">
            <div className={`font-bold ${item.done ? 'text-[var(--text2)] line-through' : ''}`}>{item.title}</div>
            {item.note && <div className="text-sm text-[var(--text2)]">{item.note}</div>}
            <div className="mt-0.5 text-xs text-[var(--muted)]">
              {item.done
                ? `done by ${item.completed_name || 'you'} · ${dateLabel(item.done_at)}`
                : `added by ${item.created_name || 'you'}`}
            </div>
            {item.filename && (
              <img src={`/photos/${item.filename}`} alt="" className="mt-2 max-h-44 w-full rounded-xl object-cover" />
            )}
            {item.done && !item.filename && onAddPhoto && (
              <button
                onClick={onAddPhoto}
                className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[var(--lav-text)]"
              >
                <Camera size={14} /> add a photo
              </button>
            )}
          </div>
          <button
            onClick={async () => {
              await api.del(`/api/bucket/${item.id}`);
            }}
            className="text-[var(--muted)]"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
