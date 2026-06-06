import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Camera, X, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { dateLabel } from '../lib/time';

export default function Timeline() {
  const milestones = useStore((s) => s.milestones);
  const refreshMilestones = useStore((s) => s.refreshMilestones);
  const me = useStore((s) => s.me);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', note: '', date: '' });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    refreshMilestones();
  }, [refreshMilestones]);

  function onPick(e) {
    const f = e.target.files?.[0];
    if (f) setPhoto({ file: f, url: URL.createObjectURL(f) });
  }

  async function save() {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('note', form.note.trim());
      fd.append('date', form.date);
      fd.append('userId', me.id);
      if (photo) fd.append('photo', photo.file);
      await fetch('/api/milestones', { method: 'POST', body: fd });
      setAdding(false);
      setForm({ title: '', note: '', date: '' });
      setPhoto(null);
    } catch (e) {}
    setSaving(false);
  }

  return (
    <div>
      <PageHeader
        title="Our timeline"
        sub="the story of us"
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
        <div className="relative ml-2 border-l-2 border-white/10 pl-6">
          {milestones.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              className="relative mb-6"
            >
              <span
                className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-[var(--bg)]"
                style={{ background: m.created_color || '#f5a3c7' }}
              />
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-soft">
                <div className="flex items-start justify-between">
                  <div className="text-xs font-bold text-[var(--lav-text)]">{dateLabel(m.date)}</div>
                  <button
                    onClick={async () => {
                      await api.del(`/api/milestones/${m.id}`);
                    }}
                    className="text-[var(--muted)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-1 text-lg font-extrabold">{m.title}</div>
                {m.note && <p className="mt-1 text-sm text-[var(--text2)]">{m.note}</p>}
                {m.filename && (
                  <img src={`/photos/${m.filename}`} alt="" className="mt-3 max-h-56 w-full rounded-xl object-cover" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
        {milestones.length === 0 && (
          <p className="mt-10 text-center text-sm text-[var(--muted)]">add your first memory ✨</p>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      <Sheet open={adding} onClose={() => setAdding(false)} title="New memory">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="title (e.g. Our first trip)"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
          autoFocus
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4 text-[var(--text)]"
        />
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          rows={2}
          placeholder="what happened? (optional)"
          className="mb-3 w-full resize-none rounded-2xl bg-[var(--card)] p-4"
        />
        {photo ? (
          <div className="relative mb-3">
            <img src={photo.url} alt="" className="max-h-44 w-full rounded-2xl object-cover" />
            <button
              onClick={() => setPhoto(null)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] py-4 text-sm font-bold text-[var(--lav-text)]"
          >
            <Camera size={18} /> add a photo
          </button>
        )}
        <button
          onClick={save}
          disabled={saving || !form.title.trim() || !form.date}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
        >
          {saving ? 'saving…' : (<><Check size={18} /> Add memory</>)}
        </button>
      </Sheet>
    </div>
  );
}
