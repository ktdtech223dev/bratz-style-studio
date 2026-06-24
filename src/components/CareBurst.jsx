import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Reusable particle-burst overlay. Drop it inside a `relative` sprite container.
// Whenever `trigger` changes to a new value, it spawns a short-lived shower of
// themed particles that fly outward/upward and fade once.
//
//   <CareBurst trigger={counter} kind="sparks" />
//
// kinds: sparks | hearts | food | water | bubbles
// optional: count, size (base px), color (overrides glyph for div-style kinds)

const KINDS = {
  sparks: { glyphs: ['✨', '🔥', '⭐'], rise: -1, spread: 1.1 },
  hearts: { glyphs: ['💗', '💕', '💖'], rise: -1.25, spread: 0.8 },
  food: { glyphs: ['🍚', '🌾', '🍘'], rise: 0.4, spread: 1.2 }, // food sinks/scatters
  water: { glyphs: ['💧', '💦'], rise: 0.5, spread: 0.9 },
  bubbles: { glyphs: ['🫧', '⚪️', '○'], rise: -1.4, spread: 0.7 },
};

let _seq = 0;

export default function CareBurst({
  trigger,
  kind = 'sparks',
  count = 10,
  size = 22,
  color,
}) {
  const [bursts, setBursts] = useState([]); // each: { id, particles }
  const prev = useRef(trigger);

  useEffect(() => {
    // only fire on a real change to a new (defined) value — not initial mount
    if (trigger === undefined || trigger === null) return;
    if (prev.current === trigger) return;
    prev.current = trigger;

    const cfg = KINDS[kind] || KINDS.sparks;
    const id = ++_seq;
    const particles = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * (i / Math.max(1, count - 1))) - Math.PI / 2; // fan
      const jitter = (Math.random() - 0.5) * 0.9;
      const dist = 50 + Math.random() * 70;
      return {
        i,
        glyph: cfg.glyphs[i % cfg.glyphs.length],
        x: Math.sin(angle + jitter) * dist * cfg.spread,
        y: cfg.rise * (40 + Math.random() * 70) + Math.cos(angle) * 14,
        rot: (Math.random() - 0.5) * 160,
        scale: 0.7 + Math.random() * 0.7,
        delay: Math.random() * 0.12,
        dur: 0.85 + Math.random() * 0.55,
      };
    });

    setBursts((b) => [...b, { id, particles }]);
    const t = setTimeout(() => {
      setBursts((b) => b.filter((x) => x.id !== id));
    }, 1700);
    return () => clearTimeout(t);
  }, [trigger, kind, count]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
      <AnimatePresence>
        {bursts.map((burst) =>
          burst.particles.map((p) => (
            <motion.span
              key={`${burst.id}-${p.i}`}
              className="absolute left-1/2 top-1/2 select-none will-change-transform"
              style={{
                fontSize: size * p.scale,
                lineHeight: 1,
                color,
                filter:
                  kind === 'sparks'
                    ? 'drop-shadow(0 0 6px rgba(253,186,116,0.8))'
                    : kind === 'hearts'
                    ? 'drop-shadow(0 0 6px rgba(255,107,168,0.7))'
                    : 'none',
              }}
              initial={{ x: '-50%', y: '-50%', opacity: 0, scale: 0.2 }}
              animate={{
                x: `calc(-50% + ${p.x}px)`,
                y: `calc(-50% + ${p.y}px)`,
                opacity: [0, 1, 1, 0],
                scale: [0.2, p.scale * 1.15, p.scale, p.scale * 0.85],
                rotate: p.rot,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                ease: 'easeOut',
                opacity: { times: [0, 0.18, 0.7, 1], duration: p.dur, delay: p.delay },
              }}
            >
              {p.glyph}
            </motion.span>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
