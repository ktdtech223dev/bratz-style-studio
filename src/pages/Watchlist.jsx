import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Trash2, Star, Film, Tv } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

export default function Watchlist() {
  const watchlist = useStore((s) => s.watchlist);
  const refreshWatchlist = useStore((s) => s.refreshWatchlist);
  const me = useStore((s) => s.me);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', kind: 'movie', note: '' });

  useEffect(() => {
    refreshWatchlist();
  }, [refreshWatchlist]);

  async function add() {
    if (!form.title.trim()) return;
    await api.post('/api/watchlist', { ...form, title: form.title.trim(), userId: me.id });
    setForm({ title: '', kind: 'movie', note: '' });
    setAdding(false);
  }
  async function toggleWatched(item, rating) {
    await api.post(`/api/watchlist/${item.id}/watched`, {
      watched: item.watched ? '0' : '1',
      rating: rating ?? item.rating,
    });
  }
  async function rate(item, rating) {
    await api.post(`/api/watchlist/${item.id}/watched`, { watched: '1', rating });
  }

  const toWatch = watchlist.filter((w) => !w.watched);
  const watched = watchlist.filter((w) => w.watched);

  return (
    <div>
      <PageHeader
        title="Watchlist"
        sub="for movie nights"
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
        {watchlist.length === 0 && (
          <div className="mt-16 text-center text-[var(--text2)]">
            <Tv size={40} className="mx-auto text-[var(--muted)]" />
            <p className="mt-3 font-semibold">Nothing queued</p>
            <p className="text-sm text-[var(--muted)]">tap + to add a movie or show</p>
          </div>
        )}

        {toWatch.length > 0 && (
          <div className="space-y-2.5">
            {toWatch.map((item) => (
              <Row key={item.id} item={item} onToggle={() => toggleWatched(item)} />
            ))}
          </div>
        )}

        {watched.length > 0 && (
          <>
            <h3 className="mb-2 mt-7 text-xs font-extrabold uppercase tracking-widest text-[var(--green)]">
              Watched
            </h3>
            <div className="space-y-2.5">
              {watched.map((item) => (
                <Row key={item.id} item={item} onToggle={() => toggleWatched(item)} onRate={(r) => rate(item, r)} />
              ))}
            </div>
          </>
        )}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add to watchlist">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="title"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
          autoFocus
        />
        <div className="mb-3 flex gap-2">
          {[
            { k: 'movie', label: 'Movie', I: Film },
            { k: 'show', label: 'Show', I: Tv },
          ].map(({ k, label, I }) => (
            <button
              key={k}
              onClick={() => setForm({ ...form, kind: k })}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-bold"
              style={{
                background: form.kind === k ? 'var(--lavender)' : 'var(--card)',
                color: form.kind === k ? '#1a1f4a' : 'var(--text2)',
              }}
            >
              <I size={16} /> {label}
            </button>
          ))}
        </div>
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          rows={2}
          placeholder="why? (optional)"
          className="mb-4 w-full resize-none rounded-2xl bg-[var(--card)] p-4"
        />
        <button
          onClick={add}
          disabled={!form.title.trim()}
          className="w-full rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
        >
          Add
        </button>
      </Sheet>
    </div>
  );
}

function Row({ item, onToggle, onRate }) {
  const Icon = item.kind === 'show' ? Tv : Film;
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2"
          style={{ borderColor: item.watched ? '#9be89b' : 'var(--muted)', background: item.watched ? '#9be89b' : 'transparent' }}
        >
          {item.watched && <Check size={16} strokeWidth={3.5} color="#1a1f4a" />}
        </button>
        <div className="flex-1">
          <div className={`flex items-center gap-1.5 font-bold ${item.watched ? 'text-[var(--text2)]' : ''}`}>
            <Icon size={14} className="text-[var(--muted)]" /> {item.title}
          </div>
          {item.note && <div className="text-sm text-[var(--text2)]">{item.note}</div>}
          <div className="text-xs text-[var(--muted)]">added by {item.added_name || 'you'}</div>
          {item.watched && onRate && (
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => onRate(n)}>
                  <Star size={16} fill={n <= (item.rating || 0) ? '#fde047' : 'none'} color={n <= (item.rating || 0) ? '#fde047' : 'var(--muted)'} />
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={async () => await api.del(`/api/watchlist/${item.id}`)} className="text-[var(--muted)]">
          <Trash2 size={15} />
        </button>
      </div>
    </Card>
  );
}
