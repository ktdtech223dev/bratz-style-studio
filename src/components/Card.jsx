import { motion } from 'framer-motion';

export default function Card({ children, className = '', onClick, delay = 0, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: 'easeOut' }}
      onClick={onClick}
      className={`rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-soft ${
        onClick ? 'cursor-pointer active:scale-[0.985] transition-transform' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
