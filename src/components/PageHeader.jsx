import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PageHeader({ title, sub, right, back = true, to, icon }) {
  const nav = useNavigate();
  return (
    <div className="relative px-5 pb-3 pt-2 safe-top">
      {/* soft accent wash behind the header for app-like chrome */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 opacity-70"
        style={{ background: 'var(--grad-accent-soft)', maskImage: 'linear-gradient(#000, transparent)', WebkitMaskImage: 'linear-gradient(#000, transparent)' }}
      />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {back && (
            <button
              onClick={() => (to ? nav(to) : nav(-1))}
              className="mb-1 -ml-2 flex h-9 w-9 items-center justify-center rounded-full text-[var(--lav-text)] transition-colors active:bg-white/5"
              aria-label="Back"
            >
              <ChevronLeft size={26} strokeWidth={2.5} />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-grad-accent-soft text-2xl shadow-elev1">
                {icon}
              </span>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[2rem] font-extrabold leading-none tracking-tight text-[var(--text)]"
            >
              {title}
            </motion.h1>
          </div>
          {sub && <p className="mt-1.5 text-sm text-[var(--text2)]">{sub}</p>}
        </div>
        {right && <div className="pt-1">{right}</div>}
      </div>
    </div>
  );
}
