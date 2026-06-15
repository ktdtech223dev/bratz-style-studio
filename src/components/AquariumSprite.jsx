import { motion } from 'framer-motion';

export default function AquariumSprite({ cleanliness = 100, fish = 2, size = 280 }) {
  const murk = 1 - Math.max(0, Math.min(100, cleanliness)) / 100;
  const h = size * 0.66;
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-3xl border-[5px] border-[#3a2e22]"
      style={{ width: size, height: h, background: 'linear-gradient(#8fd6fb,#3b82c4)' }}
    >
      {/* algae / murk */}
      <div className="absolute inset-0" style={{ background: '#4a5a2a', opacity: murk * 0.5 }} />
      {/* fish */}
      {Array.from({ length: Math.max(0, fish) }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ fontSize: size * 0.11, left: `${8 + ((i * 27) % 70)}%`, top: `${15 + ((i * 37) % 55)}%` }}
          animate={{ x: [0, 14, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 2.2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          🐠
        </motion.span>
      ))}
      {/* bubbles */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={`b${i}`}
          className="absolute rounded-full bg-white/40"
          style={{ width: 6, height: 6, left: `${20 + i * 25}%`, bottom: 10 }}
          animate={{ y: [-0, -h * 0.8], opacity: [0.6, 0] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.7, ease: 'easeIn' }}
        />
      ))}
      {/* sand */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: size * 0.09, background: '#e0c98e' }} />
      <span className="absolute bottom-1 left-4 text-lg">🪸</span>
      <span className="absolute bottom-1 right-5 text-base">🌿</span>
    </div>
  );
}
