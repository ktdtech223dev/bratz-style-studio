import { useEffect, useState } from 'react';
import { Plus, Trash2, ExternalLink, Gift, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

export default function Wishlist() {
  const giftWishes = useStore((s) => s.giftWishes);
  const refreshGiftWishes = useStore((s) => s.refreshGiftWishes);
  const me = useStore((s) => s.me);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    refreshGiftWishes();
  }, [refreshGiftWishes]);

  const mine = giftWishes.filter((g) => g.mine);
  const theirs = giftWishes.filter((g) => !g.mine);

  async function add() {
    if (!title.trim()) return;
    await api.post('/api/giftwishes', { title: title.trim(), note: note.trim(), link: link.trim(), userId: me.id });
    setTitle('');
    setNote('');
    setLink('');
    setAdding(false);
  }

  return (
    <div>
      <PageHeader
        title="Gift wishlist"
        sub="ideas to surprise each other 🎁"
        right={
          <button
            onClick={() => setAdding(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--green)] text-[#1a1f4a]"
          >
            <Plus size={22} />
          </button>
        }
      />
      <div className="space-y-5 px-5 pb-6">
        <section>
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
            Their wishes
          </h3>
          {theirs.length === 0 && <p className="text-sm text-[var(--muted)]">no wishes from them yet 💭</p>}
          <div className="space-y-2.5">
            {theirs.map((g) => (
              <div key={g.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎁</span>
                  <div className="flex-1">
                    <div className="font-extrabold leading-tight">{g.title}</div>
                    {g.note && <div className="text-xs text-[var(--text2)]">{g.note}</div>}
                    {g.link && (
                      <a
                        href={g.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[var(--blue)]"
                      >
                        <ExternalLink size={12} /> link
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => api.post(`/api/giftwishes/${g.id}/reserve`, { userId: me.id, got: g.got ? 0 : 1 })}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-extrabold active:scale-95"
                  style={{
                    background: g.got ? 'var(--green)' : 'var(--card2)',
                    color: g.got ? '#1a1f4a' : 'var(--text)',
                  }}
                >
                  <Check size={15} /> {g.got ? "you're getting this" : "I'll get this"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">Your wishes</h3>
          <p className="mb-2 text-xs text-[var(--muted)]">they can secretly claim these — you won’t see which 🤫</p>
          {mine.length === 0 && <p className="text-sm text-[var(--muted)]">add something you’d love 🎁</p>}
          <div className="space-y-2">
            {mine.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3"
              >
                <Gift size={18} className="text-[var(--green)]" />
                <span className="flex-1">
                  <span className="block text-sm font-bold">{g.title}</span>
                  {g.note && <span className="block text-xs text-[var(--muted)]">{g.note}</span>}
                </span>
                <button onClick={() => api.del(`/api/giftwishes/${g.id}`)} className="text-[var(--muted)]">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a wish">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="what you’d love"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="note (size, color, why…)"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="link (optional)"
          className="mb-4 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <button
          onClick={add}
          disabled={!title.trim()}
          className="w-full rounded-2xl bg-[var(--green)] py-3.5 font-extrabold text-[#1a1f4a] active:scale-95 disabled:opacity-50"
        >
          Add wish 🎁
        </button>
      </Sheet>
    </div>
  );
}
