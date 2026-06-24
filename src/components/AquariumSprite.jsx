import { motion } from 'framer-motion';

// A varied pool of swimmers — picked deterministically per index so the same
// fish count always looks lively & varied (no randomness needed).
const FISH = ['🐠', '🐟', '🐡', '🐬', '🦈', '🐙', '🦑', '🦐', '🦞', '🦀', '🐢', '🪼', '🐳', '🐚'];

export default function AquariumSprite({ cleanliness = 100, fish = 2, size = 280 }) {
  const murk = 1 - Math.max(0, Math.min(100, cleanliness)) / 100;
  const clean = 1 - murk;
  const h = size * 0.66;
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-3xl border-[5px] border-[#3a2e22]"
      style={{ width: size, height: h, background: 'linear-gradient(180deg,#9fe0fb 0%,#5bb6e8 45%,#2f6fae 100%)' }}
    >
      {/* sunlit god-ray shafts from the surface (brighter when clean) */}
      <motion.div
        className="pointer-events-none absolute -top-6 left-0 right-0"
        style={{
          height: h * 0.9,
          background:
            'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 45%, transparent 52%, transparent 66%, rgba(255,255,255,0.12) 74%, transparent 82%)',
          opacity: 0.35 + clean * 0.4,
        }}
        animate={{ x: [-10, 10, -10] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* caustics shimmer */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 40% at 30% 20%, rgba(255,255,255,0.16), transparent 60%), radial-gradient(50% 35% at 75% 15%, rgba(255,255,255,0.12), transparent 60%)',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* algae / murk */}
      <div className="absolute inset-0" style={{ background: '#4a5a2a', opacity: murk * 0.5 }} />

      {/* fish — varied species, some swimming the other way */}
      {Array.from({ length: Math.max(0, fish) }).map((_, i) => {
        const emoji = FISH[i % FISH.length];
        const flip = i % 3 === 0; // some face left
        const top = 12 + ((i * 37) % 60);
        const left = 6 + ((i * 27) % 72);
        const dur = 2.4 + (i % 5) * 0.6;
        const drift = 10 + (i % 4) * 6;
        return (
          <motion.span
            key={i}
            className="absolute"
            style={{
              fontSize: size * (0.1 + (i % 3) * 0.012),
              left: `${left}%`,
              top: `${top}%`,
              transform: flip ? 'scaleX(-1)' : 'none',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
            }}
            animate={{ x: flip ? [0, -drift, 0] : [0, drift, 0], y: [0, i % 2 ? -4 : 4, 0], rotate: [0, flip ? 3 : -3, 0] }}
            transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
          >
            {emoji}
          </motion.span>
        );
      })}

      {/* bubbles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={`b${i}`}
          className="absolute rounded-full bg-white/40"
          style={{ width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, left: `${14 + i * 17}%`, bottom: 10 }}
          animate={{ y: [0, -h * 0.82], opacity: [0.6, 0] }}
          transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.6, ease: 'easeIn' }}
        />
      ))}

      {/* glass-front reflection */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.22) 0%, transparent 22%, transparent 78%, rgba(255,255,255,0.08) 100%)' }}
      />

      {/* pebble substrate */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: size * 0.11, background: 'linear-gradient(180deg,#e7d29a,#cdb274)' }} />
      <div className="absolute inset-x-0 flex justify-around" style={{ bottom: size * 0.02 }}>
        {['#c9ad6e', '#b79a5c', '#d8c184', '#bfa463', '#cdb274', '#b7975a', '#d2bb7c'].map((c, i) => (
          <span key={i} className="rounded-full" style={{ width: size * (0.035 + (i % 3) * 0.01), height: size * 0.03, background: c }} />
        ))}
      </div>

      {/* bottom decorations */}
      <span className="absolute left-3 text-lg" style={{ bottom: size * 0.07 }}>🪸</span>
      <span className="absolute left-1/2 -translate-x-1/2 text-xl" style={{ bottom: size * 0.06 }}>🌿</span>
      <motion.span
        className="absolute text-base"
        style={{ right: '20%', bottom: size * 0.07, transformOrigin: 'bottom center' }}
        animate={{ rotate: [-4, 4, -4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        🌿
      </motion.span>
      <span className="absolute right-4 text-lg" style={{ bottom: size * 0.06 }}>🪨</span>
      <span className="absolute right-9 text-base" style={{ bottom: size * 0.07 }}>🐚</span>
    </div>
  );
}
