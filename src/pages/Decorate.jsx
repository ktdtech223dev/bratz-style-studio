import { useEffect, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Star, Check, Lock } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import RoomScene from '../components/RoomScene';
import { hasWebGL } from '../components/room3d/useWebGL';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

// Lazy so three.js stays in its own chunk. Furniture slots get a rotating model.
const ShopPreview = lazy(() => import('../components/room3d/ShopPreview'));
const PREVIEW_SLOTS = ['sofa', 'bed', 'coffeetable', 'lamp', 'rug'];

export default function Decorate() {
  const couple = useStore((s) => s.couple);
  const [data, setData] = useState(null);
  const [slot, setSlot] = useState('wallpaper');
  const [busy, setBusy] = useState(null);
  const [selId, setSelId] = useState(null);

  async function load() {
    setData(await api.get('/api/decor'));
  }
  useEffect(() => {
    load();
  }, []);

  const stars = couple?.stars ?? data?.stars ?? 0;

  async function buy(item) {
    setBusy(item.id);
    try {
      await api.post('/api/decor/buy', { itemId: item.id });
      await load();
    } catch (e) {}
    setBusy(null);
  }
  async function equip(item) {
    setBusy(item.id);
    try {
      await api.post('/api/decor/equip', { slot: item.slot, itemId: item.id });
      await load();
    } catch (e) {}
    setBusy(null);
  }

  if (!data) return <PageHeader title="Decorate" />;

  const items = data.items.filter((i) => i.slot === slot);
  const owned = (id) => data.owned.includes(id) || data.defaults[slot] === id;
  const equipped = (id) => data.equipped[slot] === id;
  const selected = items.find((i) => i.id === selId) || items.find((i) => equipped(i.id)) || items[0];
  const showItemPreview = PREVIEW_SLOTS.includes(slot) && hasWebGL() && !!selected;

  return (
    <div>
      <PageHeader
        title="Decorate"
        sub="spend stars to make it yours"
        right={
          <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-2">
            <Star size={15} fill="#fde047" color="#fde047" />
            <span className="font-extrabold text-[var(--yellow)]">{stars}</span>
          </div>
        }
      />

      <div className="px-5">
        {/* live preview — the house, or a rotating model of the selected item */}
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] shadow-soft">
          {showItemPreview ? (
            <div className="relative" style={{ height: 230, background: '#20264f' }}>
              <Suspense fallback={<div className="h-full w-full" style={{ background: selected.swatch }} />}>
                <ShopPreview slot={slot} data={selected.data} />
              </Suspense>
              <span className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-xs font-bold text-white/80">
                {selected.name}
              </span>
            </div>
          ) : (
            <div className="pointer-events-none">
              <RoomScene />
            </div>
          )}
        </div>

        {/* slot tabs */}
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {data.slots.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSlot(s.id);
                setSelId(null);
              }}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors"
              style={{
                background: slot === s.id ? 'var(--lavender)' : 'var(--card)',
                color: slot === s.id ? '#1a1f4a' : 'var(--text2)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* items */}
        <div className="mt-4 grid grid-cols-2 gap-3 pb-4">
          {items.map((item, i) => {
            const isOwned = owned(item.id);
            const isEq = equipped(item.id);
            const canAfford = stars >= item.price;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="overflow-hidden rounded-2xl border bg-[var(--card)]"
                style={{ borderColor: isEq ? 'var(--lavender)' : selId === item.id ? 'var(--pink-hot)' : 'var(--border)' }}
              >
                <button
                  onClick={() => setSelId(item.id)}
                  className="block h-20 w-full"
                  style={{ background: item.swatch }}
                  aria-label={`Preview ${item.name}`}
                />
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{item.name}</span>
                    {isEq && <Check size={16} className="text-[var(--lavender)]" />}
                  </div>
                  {isEq ? (
                    <div className="mt-2 rounded-xl bg-[var(--lavender)]/15 py-2 text-center text-xs font-bold text-[var(--lavender)]">
                      equipped
                    </div>
                  ) : isOwned ? (
                    <button
                      onClick={() => equip(item)}
                      disabled={busy === item.id}
                      className="mt-2 w-full rounded-xl bg-[var(--card2)] py-2 text-xs font-bold text-[var(--text)] active:scale-95"
                    >
                      equip
                    </button>
                  ) : (
                    <button
                      onClick={() => buy(item)}
                      disabled={!canAfford || busy === item.id}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-extrabold active:scale-95 disabled:opacity-50"
                      style={{ background: canAfford ? 'var(--yellow)' : 'var(--card2)', color: canAfford ? '#1a1f4a' : 'var(--muted)' }}
                    >
                      {canAfford ? <Star size={12} fill="#1a1f4a" /> : <Lock size={12} />}
                      {item.price}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
