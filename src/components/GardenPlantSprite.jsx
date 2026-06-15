import { motion } from 'framer-motion';

// Shared species catalog (used by the sprite + the "add plant" sheet).
export const SPECIES = {
  monstera: { label: 'Monstera', emoji: '🌿' },
  cactus: { label: 'Cactus', emoji: '🌵' },
  sunflower: { label: 'Sunflower', emoji: '🌻' },
  bonsai: { label: 'Bonsai', emoji: '🎍' },
  succulent: { label: 'Succulent', emoji: '🪴' },
  bamboo: { label: 'Bamboo', emoji: '🎋' },
  rose: { label: 'Rose', emoji: '🌹' },
  tulip: { label: 'Tulip', emoji: '🌷' },
};

export default function GardenPlantSprite({ species, stage = 0, size = 104 }) {
  const sp = SPECIES[species] || SPECIES.monstera;
  const emoji = stage <= 0 ? '🌱' : stage < 2 ? '🌿' : sp.emoji;
  const plantSize = size * (0.4 + Math.min(stage, 4) * 0.1);
  return (
    <div style={{ width: size, height: size }} className="relative flex items-end justify-center">
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: size * 0.16,
          width: size * 0.55,
          height: size * 0.55,
          background: 'radial-gradient(circle, rgba(155,232,155,0.18), transparent 70%)',
        }}
      />
      <motion.span
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: plantSize, lineHeight: 1, marginBottom: size * 0.26, transformOrigin: 'bottom center' }}
        className="relative z-10"
      >
        {emoji}
      </motion.span>
      {/* pot */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: size * 0.44, height: size * 0.27 }}>
        <div
          className="h-full w-full"
          style={{
            background: 'linear-gradient(#cf935f,#9c6238)',
            clipPath: 'polygon(12% 0, 88% 0, 76% 100%, 24% 100%)',
          }}
        />
        <div
          className="absolute left-0 right-0 top-0 rounded-[3px]"
          style={{ height: size * 0.055, background: '#dca576' }}
        />
      </div>
    </div>
  );
}
