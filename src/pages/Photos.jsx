import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, MoreHorizontal, Trash2, Download, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { dateLabel } from '../lib/time';

export default function Photos() {
  const photos = useStore((s) => s.photos);
  const refreshPhotos = useStore((s) => s.refreshPhotos);
  const emit = useStore((s) => s.emit);
  const me = useStore((s) => s.me);
  const fileRef = useRef(null);

  const [pending, setPending] = useState(null); // { file, url }
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [menuFor, setMenuFor] = useState(null);

  async function downloadPhoto(p) {
    try {
      const res = await fetch(`/photos/${p.filename}`);
      const blob = await res.blob();
      const ext = (p.filename.split('.').pop() || 'jpg').toLowerCase();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `us-photo-${p.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      // fallback: open in a new tab so the user can long-press to save
      window.open(`/photos/${p.filename}`, '_blank');
    }
  }

  useEffect(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending({ file, url: URL.createObjectURL(file) });
    setCaption('');
  }

  async function upload() {
    if (!pending) return;
    setUploading(true);
    try {
      await api.uploadPhoto(pending.file, caption, me.id);
      setPending(null);
      setCaption('');
    } catch (e) {
      // ignore
    }
    setUploading(false);
  }

  // group by date (local date of posted_at)
  const groups = {};
  photos.forEach((p) => {
    const key = (p.posted_at || '').slice(0, 10);
    (groups[key] = groups[key] || []).push(p);
  });

  function likedByMe(p) {
    return (p.liked_by || '').split(',').filter(Boolean).map(Number).includes(me.id);
  }

  return (
    <div>
      <PageHeader
        title="Our photos"
        right={
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pink-hot)] text-white"
          >
            <Plus size={22} />
          </button>
        }
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />

      <div className="px-5 pb-6">
        {photos.length === 0 && (
          <div className="mt-16 text-center text-[var(--text2)]">
            <div className="text-5xl">📸</div>
            <p className="mt-3 font-semibold">No photos yet</p>
            <p className="text-sm text-[var(--muted)]">tap + to add your first memory</p>
          </div>
        )}

        {Object.entries(groups).map(([date, items]) => (
          <div key={date} className="mb-6">
            <div className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
              {dateLabel(items[0].posted_at)} · {items[0].poster_name}
            </div>
            <div className="space-y-4">
              {items.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-soft"
                >
                  <div className="relative">
                    <img src={`/photos/${p.filename}`} alt={p.caption} className="w-full object-cover" />
                    <button
                      onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {menuFor === p.id && (
                      <div className="absolute right-3 top-12 overflow-hidden rounded-xl bg-[var(--bg2)] shadow-soft">
                        <button
                          onClick={() => {
                            downloadPhoto(p);
                            setMenuFor(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--text)]"
                        >
                          <Download size={15} /> Download
                        </button>
                        <button
                          onClick={async () => {
                            await api.del(`/api/photos/${p.id}`);
                            setMenuFor(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--pink-hot)]"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      {p.caption && <p className="text-sm font-medium">{p.caption}</p>}
                      <p className="text-xs text-[var(--muted)]">by {p.poster_name}</p>
                    </div>
                    <button onClick={() => emit('photo:like', { photoId: p.id })} className="flex items-center gap-1.5">
                      <Heart
                        size={22}
                        className="transition-transform active:scale-125"
                        fill={likedByMe(p) ? '#ff6ba8' : 'none'}
                        color={likedByMe(p) ? '#ff6ba8' : 'var(--muted)'}
                      />
                      {p.likes > 0 && <span className="text-sm font-bold text-[var(--pink-hot)]">{p.likes}</span>}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* upload sheet */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(10,12,30,0.7)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              className="w-full max-w-[520px] rounded-t-3xl bg-[var(--bg2)] p-5 pb-8 safe-bottom"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold">New photo</h3>
                <button onClick={() => setPending(null)} className="text-[var(--muted)]">
                  <X size={22} />
                </button>
              </div>
              <img src={pending.url} alt="" className="mb-4 max-h-64 w-full rounded-2xl object-cover" />
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="add a caption…"
                className="w-full rounded-2xl bg-[var(--card)] p-4 text-[var(--text)] placeholder:text-[var(--muted)]"
              />
              <button
                onClick={upload}
                disabled={uploading}
                className="mt-4 w-full rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-60"
              >
                {uploading ? 'uploading…' : 'Share'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
