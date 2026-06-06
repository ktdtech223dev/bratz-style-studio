import { motion } from 'framer-motion';

// A downward light beam (gradient cone) with a glowing cap, like a spotlight.
export default function MoodBeam({ color = '#9be89b', emoji = '💡', delay = 0 }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* glowing bulb cap */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay, type: 'spring', stiffness: 200, damping: 14 }}
        className="z-10 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
        style={{ background: color + '33', boxShadow: `0 0 36px ${color}, inset 0 0 18px ${color}88` }}
      >
        {emoji}
      </motion.div>
      {/* beam cone */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0.4 }}
        animate={{ opacity: 0.9, scaleY: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.5 }}
        className="relative -mt-2 h-44 w-2"
        style={{ transformOrigin: 'top' }}
      >
        <div
          className="absolute left-1/2 top-0 h-full -translate-x-1/2"
          style={{
            width: 0,
            borderLeft: '46px solid transparent',
            borderRight: '46px solid transparent',
            borderTop: `176px solid ${color}`,
            opacity: 0.22,
            filter: 'blur(2px)',
            clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-full -translate-x-1/2"
          style={{
            width: 0,
            borderLeft: '22px solid transparent',
            borderRight: '22px solid transparent',
            borderTop: `176px solid ${color}`,
            opacity: 0.35,
          }}
        />
      </motion.div>
    </div>
  );
}
