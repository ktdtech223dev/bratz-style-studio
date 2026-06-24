import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Shared premium button. variant: 'primary' | 'soft' | 'ghost' | 'plain'
// size: 'md' (default) | 'sm' | 'lg'. Backward-compatible — pages can keep
// their hand-rolled buttons; adopt this where you want the upgraded look.
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  busy = false,
  disabled = false,
  className = '',
  icon,
  ...rest
}) {
  const sizes = {
    sm: 'py-2.5 px-4 text-sm rounded-xl',
    md: 'py-3.5 px-5 text-[15px] rounded-2xl',
    lg: 'py-4 px-6 text-base rounded-2xl',
  };
  const variants = {
    primary: 'bg-grad-accent text-white shadow-card',
    soft: 'bg-grad-accent-soft text-[var(--text)] border border-[var(--border-strong)]',
    ghost: 'bg-[var(--card)] text-[var(--text)] border border-[var(--border)]',
    plain: 'text-[var(--lav-text)]',
  };
  return (
    <motion.button
      whileTap={disabled || busy ? {} : { scale: 0.96 }}
      disabled={disabled || busy}
      className={`relative flex w-full items-center justify-center gap-2 font-extrabold transition-[transform,opacity] duration-150 ease-out disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {busy ? <Loader2 size={18} className="animate-spin" /> : icon}
      {children}
    </motion.button>
  );
}
