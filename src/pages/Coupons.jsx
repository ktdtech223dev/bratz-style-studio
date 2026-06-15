import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

export default function Coupons() {
  const coupons = useStore((s) => s.coupons);
  const refreshCoupons = useStore((s) => s.refreshCoupons);
  const me = useStore((s) => s.me);

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    refreshCoupons();
  }, [refreshCoupons]);

  const forMe = coupons.filter((c) => c.created_by !== me?.id);
  const fromMe = coupons.filter((c) => c.created_by === me?.id);

  async function give() {
    if (!title.trim()) return;
    await api.post('/api/coupons', { title: title.trim(), note: note.trim(), userId: me.id });
    setTitle('');
    setNote('');
    setAdding(false);
  }

  const Ticket = ({ c, mine }) => (
    <div
      className="relative overflow-hidden rounded-2xl border border-dashed border-[var(--border)] p-4"
      style={{ background: c.redeemed ? 'var(--card)' : 'linear-gradient(135deg,#fdba7420,#ff6ba818)', opacity: c.redeemed ? 0.6 : 1 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">🎟️</span>
        <div className="flex-1">
          <div className="font-extrabold leading-tight">{c.title}</div>
          {c.note && <div className="text-xs text-[var(--text2)]">{c.note}</div>}
          <div className="mt-1 text-[11px] text-[var(--muted)]">
            {mine ? `you gave this${c.redeemed ? ' · redeemed ✓' : ''}` : c.redeemed ? 'redeemed ✓' : 'tap to redeem'}
          </div>
        </div>
        {mine && (
          <button onClick={() => api.del(`/api/coupons/${c.id}`)} className="text-[var(--muted)]">
            <Trash2 size={15} />
          </button>
        )}
      </div>
      {!mine && !c.redeemed && (
        <button
          onClick={() => api.post(`/api/coupons/${c.id}/redeem`, { userId: me.id })}
          className="mt-3 w-full rounded-xl bg-[var(--pink-hot)] py-2 text-sm font-extrabold text-white active:scale-95"
        >
          Redeem
        </button>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Love coupons"
        sub="little promises to cash in 🎟️"
        right={
          <button
            onClick={() => setAdding(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--orange)] text-[#1a1f4a]"
          >
            <Plus size={22} />
          </button>
        }
      />
      <div className="space-y-5 px-5 pb-6">
        <section>
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">Yours to redeem</h3>
          {forMe.length === 0 && <p className="text-sm text-[var(--muted)]">none yet 💭</p>}
          <div className="space-y-2.5">
            {forMe.map((c) => (
              <Ticket key={c.id} c={c} mine={false} />
            ))}
          </div>
        </section>
        {fromMe.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">You gave</h3>
            <div className="space-y-2.5">
              {fromMe.map((c) => (
                <Ticket key={c.id} c={c} mine />
              ))}
            </div>
          </section>
        )}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Give a coupon">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="one free… (e.g. video-call date)"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="fine print (optional)"
          className="mb-4 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <button
          onClick={give}
          disabled={!title.trim()}
          className="w-full rounded-2xl bg-[var(--orange)] py-3.5 font-extrabold text-[#1a1f4a] active:scale-95 disabled:opacity-50"
        >
          Give it 🎟️
        </button>
      </Sheet>
    </div>
  );
}
