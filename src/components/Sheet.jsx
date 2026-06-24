import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// Reusable bottom-sheet overlay with a spring-up motion + blurred backdrop.
export default function Sheet({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000] flex items-end justify-center"
          style={{ background: 'rgba(10,12,30,0.7)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ y: 420 }}
            animate={{ y: 0 }}
            exit={{ y: 420 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose && onClose();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[520px] rounded-t-3xl bg-grad-card p-5 pb-8 shadow-cardlg safe-bottom"
          >
            <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-white/15" />
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold">{title}</h3>
                <button onClick={onClose} className="text-[var(--muted)]">
                  <X size={22} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
