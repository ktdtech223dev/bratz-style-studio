import { motion } from 'framer-motion';

// 2D fallback for the 3D star dome: a flattened gradient sky with the saved
// stars positioned by their x,y percentages. Used when WebGL is unavailable
// (or while the heavy three.js chunk is still loading), and as the error
// boundary fallback. Same tap-to-select contract as the 3D scene.
export default function StarMapFallback({ stars = [], onSelect }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-3xl border border-[var(--border)]"
      style={{ background: 'radial-gradient(120% 90% at 50% 0%, #2a2150, #0c0d24 70%)' }}
    >
      {/* faint background twinkles */}
      {Array.from({ length: 48 }).map((_, i) => (
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

      {/* saved memory stars */}
      {stars.map((s) => {
        const color = s.added_color || '#fde047';
        return (
          <button
            key={s.id}
            onClick={() => onSelect && onSelect(s)}
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
                background: color,
                boxShadow: `0 0 12px ${color}, 0 0 24px ${color}88`,
              }}
            />
          </button>
        );
      })}

      {stars.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-white/50">
          add your first star ✨
        </div>
      )}
    </div>
  );
}
