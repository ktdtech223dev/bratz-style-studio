import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fmtCountdown } from '../lib/time';

// A rounded care action button with optional count badge + live countdown.
export default function CareButton({
  emoji,
  label,
  lastAt,
  cooldownHrs = 12,
  count,
  color = '#b8a9e8',
  onPress,
  disabled = false,
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const lastMs = lastAt ? new Date(lastAt.replace(' ', 'T') + 'Z').getTime() : 0;
  const readyAt = lastMs + cooldownHrs * 3600 * 1000;
  const remaining = lastMs ? readyAt - now : 0;
  const ready = remaining <= 0;
  const blocked = disabled;

  return (
    <button
      onClick={() => !blocked && onPress && onPress()}
      disabled={blocked}
      className="flex flex-1 flex-col items-center gap-1.5"
    >
      <motion.div
        whileTap={blocked ? {} : { scale: 0.9 }}
        className="relative flex h-[68px] w-[68px] items-center justify-center rounded-[22px] border"
        style={{
          background: blocked ? 'rgba(255,255,255,0.03)' : ready ? color + '22' : 'var(--card2)',
          borderColor: ready && !blocked ? color : 'var(--border)',
          boxShadow: ready && !blocked ? `0 0 22px ${color}55` : 'none',
          opacity: blocked ? 0.45 : 1,
        }}
      >
        <span className="text-[30px] leading-none">{emoji}</span>
        {count !== undefined && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-extrabold text-[#1a1f4a]"
            style={{ background: color }}
          >
            {count}
          </span>
        )}
      </motion.div>
      <span className="text-[13px] font-bold text-[var(--text)]">{label}</span>
      <span
        className="text-[11px] font-semibold tabular-nums"
        style={{ color: ready && !blocked ? color : 'var(--muted)' }}
      >
        {blocked ? '—' : ready ? 'ready' : fmtCountdown(remaining)}
      </span>
    </button>
  );
}
