import { motion } from 'framer-motion';

// variant: 'raised' (default, premium depth) | 'flat' (old look) | 'accent' (soft gradient tint)
export default function Card({ children, className = '', onClick, delay = 0, variant = 'raised', ...rest }) {
  const surface =
    variant === 'flat'
      ? 'bg-[var(--card)] shadow-soft'
      : variant === 'accent'
        ? 'bg-grad-accent-soft shadow-card'
        : 'bg-grad-card shadow-card';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: 'easeOut' }}
      onClick={onClick}
      className={`rounded-2xl border border-[var(--border)] ${surface} ${
        onClick ? 'cursor-pointer transition-transform duration-150 ease-out active:scale-[0.985]' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
