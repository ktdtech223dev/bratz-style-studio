import { motion } from 'framer-motion';

export default function CampfireSprite({ fuel = 50, size = 200 }) {
  const out = fuel <= 0;
  const flame = Math.max(0.3, fuel / 100);
  return (
    <div style={{ width: size, height: size }} className="relative mx-auto flex items-end justify-center">
      {!out && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: size * 0.12,
            width: size * 0.8,
            height: size * 0.8,
            background: `radial-gradient(circle, rgba(251,146,60,${0.12 + flame * 0.3}), transparent 65%)`,
          }}
        />
      )}
      {out ? (
        <motion.span
          animate={{ opacity: [0.4, 0.8, 0.4], y: [0, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          style={{ fontSize: size * 0.3, marginBottom: size * 0.2 }}
          className="relative z-10"
        >
          💨
        </motion.span>
      ) : (
        <motion.span
          animate={{ scale: [1, 1.09, 1], rotate: [-3, 3, -3] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontSize: size * (0.28 + flame * 0.4),
            marginBottom: size * 0.1,
            transformOrigin: 'bottom center',
            filter: 'drop-shadow(0 0 14px rgba(251,146,60,0.7))',
          }}
          className="relative z-10"
        >
          🔥
        </motion.span>
      )}
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ fontSize: size * 0.36 }}>
        🪵
      </span>
    </div>
  );
}
