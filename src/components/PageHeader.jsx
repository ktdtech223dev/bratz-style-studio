import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PageHeader({ title, sub, right, back = true, to }) {
  const nav = useNavigate();
  return (
    <div className="px-5 pt-2 pb-3 safe-top">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {back && (
            <button
              onClick={() => (to ? nav(to) : nav(-1))}
              className="mb-1 -ml-2 flex h-9 w-9 items-center justify-center rounded-full text-[var(--lav-text)] active:bg-white/5"
              aria-label="Back"
            >
              <ChevronLeft size={26} strokeWidth={2.5} />
            </button>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[2rem] font-extrabold leading-none tracking-tight text-[var(--text)]"
          >
            {title}
          </motion.h1>
          {sub && <p className="mt-1 text-sm text-[var(--text2)]">{sub}</p>}
        </div>
        {right && <div className="pt-1">{right}</div>}
      </div>
    </div>
  );
}
