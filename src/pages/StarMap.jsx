import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import Button from '../components/Button';
import Card from '../components/Card';
import StarDome from '../components/starmap3d/StarDome';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

// A new star gets a fresh spot on the dome. We keep the legacy 0..100 x,y data
// shape (x -> azimuth, y -> elevation) and just pick a pleasant random point,
// biased toward the upper sky so memories float overhead rather than at the feet.
function randomSpot() {
  return {
    x: Math.round(Math.random() * 1000) / 10, // 0..100 azimuth
    y: Math.round((15 + Math.random() * 65) * 10) / 10, // 15..80 elevation band
  };
}

export default function StarMap() {
  const stars = useStore((s) => s.stars);
  const refreshStars = useStore((s) => s.refreshStars);
  const me = useStore((s) => s.me);

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    refreshStars();
  }, [refreshStars]);

  async function addStar() {
    if (busy) return;
    setBusy(true);
    try {
      const spot = randomSpot();
      // Preserve the EXACT existing add mechanism + data shape.
      await api.post('/api/stars', {
        label: label.trim(),
        x: spot.x,
        y: spot.y,
        userId: me?.id,
      });
      setAdding(false);
      setLabel('');
    } finally {
      setBusy(false);
    }
  }

  async function removeStar(id) {
    await api.del(`/api/stars/${id}`);
    setSelected(null);
  }

  return (
    <div className="pb-10">
      <PageHeader
        icon="⭐"
        title="Star map"
        sub="orbit your night sky — a star for every memory ✨"
        right={
          <button
            onClick={() => {
              setLabel('');
              setAdding(true);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-grad-accent text-white shadow-card active:scale-95"
            aria-label="Add a star"
          >
            <Plus size={20} strokeWidth={2.75} />
          </button>
        }
      />

      <div className="px-5">
        {/* 3D dome (lazy) — drag to look around the sky, pinch/scroll to zoom */}
        <div className="aspect-[3/4] w-full overflow-hidden rounded-3xl border border-[var(--border)] shadow-card">
          <StarDome
            stars={stars}
            selectedId={selected?.id}
            onSelect={(s) => setSelected(s)}
          />
        </div>

        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          {stars.length} star{stars.length === 1 ? '' : 's'} · drag to orbit the sky, tap a star to read it
        </p>

        {/* the list of memories under the dome */}
        {stars.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="px-1 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Every star
            </p>
            {stars.map((s, i) => (
              <Card
                key={s.id}
                delay={i * 0.03}
                onClick={() => setSelected(s)}
                className="flex items-center gap-3 p-3.5"
              >
                <span
                  className="block h-3.5 w-3.5 flex-shrink-0 rounded-full"
                  style={{
                    background: s.added_color || '#fde047',
                    boxShadow: `0 0 10px ${s.added_color || '#fde047'}`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--text)]">
                    {s.label || 'a little star'}
                  </p>
                  {s.added_name && (
                    <p className="truncate text-xs text-[var(--muted)]">— {s.added_name}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {stars.length === 0 && (
          <Card className="mt-5 p-5 text-center">
            <div className="text-3xl">✨</div>
            <p className="mt-2 text-sm text-[var(--text2)]">
              Light your first star — give a memory a home in the sky.
            </p>
            <Button className="mt-4" icon={<Plus size={18} />} onClick={() => setAdding(true)}>
              Add a star
            </Button>
          </Card>
        )}
      </div>

      {/* add-a-star sheet */}
      <Sheet open={adding} onClose={() => setAdding(false)} title="Name your star">
        <p className="mb-3 text-sm text-[var(--text2)]">
          It’ll float into a new spot on your sky.
        </p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addStar();
          }}
          placeholder="a memory, a wish, a moment…"
          className="mb-4 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--text)] outline-none focus:border-[var(--border-strong)]"
          autoFocus
        />
        <Button busy={busy} onClick={addStar}>
          Light it ✨
        </Button>
      </Sheet>

      {/* star detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
            style={{ background: 'rgba(10,12,30,0.75)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[320px] rounded-3xl bg-grad-card p-6 text-center shadow-cardlg"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 text-[var(--muted)]"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-3xl"
                style={{
                  boxShadow: `0 0 24px ${selected.added_color || '#fde047'}88`,
                }}
              >
                ⭐
              </div>
              <p className="mt-3 text-lg font-bold leading-snug text-[var(--text)]">
                {selected.label || 'a little star'}
              </p>
              {selected.added_name && (
                <p className="mt-2 text-xs text-[var(--muted)]">— {selected.added_name}</p>
              )}
              <button
                onClick={() => removeStar(selected.id)}
                className="mx-auto mt-5 flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] active:text-[var(--text)]"
              >
                <Trash2 size={13} /> remove
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
