import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

export default function StarMap() {
  const stars = useStore((s) => s.stars);
  const refreshStars = useStore((s) => s.refreshStars);
  const me = useStore((s) => s.me);
  const skyRef = useRef(null);

  const [placing, setPlacing] = useState(null); // {x,y}
  const [label, setLabel] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    refreshStars();
  }, [refreshStars]);

  function onSkyClick(e) {
    const rect = skyRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPlacing({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    setLabel('');
  }

  async function addStar() {
    await api.post('/api/stars', { label: label.trim(), x: placing.x, y: placing.y, userId: me.id });
    setPlacing(null);
    setLabel('');
  }

  return (
    <div>
      <PageHeader title="Our star map" sub="light a star for every memory ✨" />
      <div className="px-5">
        <div
          ref={skyRef}
          onClick={onSkyClick}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-white/10"
          style={{ background: 'radial-gradient(120% 90% at 50% 0%, #2a2150, #0c0d24 70%)' }}
        >
          {/* faint background twinkles */}
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={`bg${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width: 2,
                height: 2,
                left: `${(i * 53) % 100}%`,
                top: `${(i * 29) % 100}%`,
                opacity: 0.18,
              }}
            />
          ))}

          {/* constellation lines */}
          <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
            {stars.slice(1).map((s, i) => {
              const prev = stars[i];
              return (
                <line
                  key={s.id}
                  x1={`${prev.x}%`}
                  y1={`${prev.y}%`}
                  x2={`${s.x}%`}
                  y2={`${s.y}%`}
                  stroke="rgba(184,169,232,0.35)"
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          {/* stars */}
          {stars.map((s) => (
            <motion.button
              key={s.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(s);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            >
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="block rounded-full"
                style={{
                  width: 12,
                  height: 12,
                  background: s.added_color || '#fde047',
                  boxShadow: `0 0 12px ${s.added_color || '#fde047'}, 0 0 24px ${s.added_color || '#fde047'}88`,
                }}
              />
            </motion.button>
          ))}

          {stars.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-white/50">
              tap the sky to light your first star ✨
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          {stars.length} star{stars.length === 1 ? '' : 's'} · tap the sky to add one, tap a star to read it
        </p>
      </div>

      {/* place-a-star sheet */}
      <Sheet open={!!placing} onClose={() => setPlacing(null)} title="Name your star">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="a memory, a wish, a moment…"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
          autoFocus
        />
        <button
          onClick={addStar}
          className="w-full rounded-2xl bg-[var(--yellow)] py-3.5 font-extrabold text-[#1a1f4a] active:scale-95"
        >
          Light it ✨
        </button>
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
              className="relative w-full max-w-[320px] rounded-3xl bg-[var(--card)] p-6 text-center shadow-soft"
            >
              <button onClick={() => setSelected(null)} className="absolute right-4 top-4 text-[var(--muted)]">
                <X size={20} />
              </button>
              <div className="text-4xl">⭐</div>
              <p className="mt-3 text-lg font-bold leading-snug">{selected.label || 'a little star'}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">— {selected.added_name}</p>
              <button
                onClick={async () => {
                  await api.del(`/api/stars/${selected.id}`);
                  setSelected(null);
                }}
                className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-bold text-[var(--muted)]"
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
