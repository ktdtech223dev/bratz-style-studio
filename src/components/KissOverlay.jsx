import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';

// Floating kisses whenever the partner sends one (store.kissAt changes).
export default function KissOverlay() {
  const kissAt = useStore((s) => s.kissAt);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!kissAt) return;
    setShow(true);
    try {
      navigator.vibrate?.(80);
    } catch {}
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [kissAt]);

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[2000] mx-auto max-w-[520px] overflow-hidden">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, top: '100%', scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], top: '-12%', scale: 1.2 }}
              transition={{ duration: 2.4, delay: i * 0.1, ease: 'easeOut' }}
              className="absolute text-4xl"
              style={{ left: `${8 + i * 10}%` }}
            >
              💋
            </motion.span>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-1/3 text-center text-2xl font-extrabold text-white"
            style={{ textShadow: '0 2px 14px rgba(0,0,0,0.6)' }}
          >
            a kiss for you 😘
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
