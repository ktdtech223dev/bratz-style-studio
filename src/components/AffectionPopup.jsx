import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';

const EMOJI = {
  hug: '🫂',
  kiss: '💋',
  wink: '😉',
  nudge: '👆',
  high_five: '🙌',
  gratitude: '🤲',
};
const LABEL = {
  hug: 'a hug',
  kiss: 'a kiss',
  wink: 'a wink',
  nudge: 'a nudge',
  high_five: 'a high five',
  gratitude: 'some gratitude',
};

export default function AffectionPopup() {
  const queue = useStore((s) => s.affectionQueue);
  const pop = useStore((s) => s.popAffection);
  const current = queue[0];

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(pop, 4000);
    return () => clearTimeout(t);
  }, [current, pop]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.from + current.type + queue.length}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={pop}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: 'rgba(10,12,30,0.78)', backdropFilter: 'blur(14px)' }}
        >
          <motion.div
            initial={{ scale: 0.2, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 12 }}
            className="text-[120px] leading-none drop-shadow-[0_0_30px_rgba(255,107,168,0.6)]"
          >
            {EMOJI[current.type] || '💜'}
          </motion.div>
          <motion.p
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mt-6 px-8 text-center text-xl font-extrabold text-white"
          >
            {current.from} sent you {LABEL[current.type] || 'love'}
          </motion.p>
          <p className="mt-2 text-sm text-white/50">tap to dismiss</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
