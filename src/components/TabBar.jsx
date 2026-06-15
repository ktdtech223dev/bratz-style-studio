import { Hammer, Gift, Heart, User, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

const TABS = [
  { to: '/', label: 'Home', icon: Hammer, color: '#b8a9e8', match: (p) => p === '/' },
  { to: '/games', label: 'Games', icon: Gift, color: '#9be89b', match: (p) => p.startsWith('/games') || p.startsWith('/match') },
  { to: '/affection', label: 'Love', icon: Heart, color: '#ff6ba8', match: (p) => p.startsWith('/affection') },
  { to: '/about', label: 'Us', icon: User, color: '#7dd3fc', match: (p) => p.startsWith('/about') },
  { to: '/activity', label: 'Activity', icon: Bell, color: '#fde047', match: (p) => p.startsWith('/activity') },
];

export default function TabBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const gamePending = useStore((s) => s.gamePending);
  const matches = useStore((s) => s.matches);
  const me = useStore((s) => s.me);
  const gameAlert =
    Object.keys(gamePending || {}).length > 0 ||
    matches.some(
      (m) =>
        (m.status === 'active' && m.turn === me?.id) ||
        (m.status === 'done' && !(m.seen_by || '').split(',').map(Number).includes(me?.id)),
    );
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[520px] px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2">
      <div className="glass flex items-stretch justify-around rounded-[26px] border border-[var(--border)] py-2 shadow-soft">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <button
              key={t.to}
              onClick={() => nav(t.to)}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-1"
              aria-label={t.label}
            >
              <span className="relative flex h-9 w-12 items-center justify-center">
                {t.to === '/games' && gameAlert && (
                  <span className="absolute right-2.5 top-0 z-20 h-2.5 w-2.5 rounded-full bg-[#ff3b30] ring-2 ring-[var(--card)]" />
                )}
                {active && (
                  <motion.span
                    layoutId="tab-glow"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: t.color + '22', boxShadow: `0 0 18px ${t.color}55` }}
                  />
                )}
                <motion.span animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }} className="relative z-10">
                  <Icon
                    size={23}
                    strokeWidth={2.4}
                    style={{ color: active ? t.color : 'var(--muted)' }}
                    fill={active ? t.color + '33' : 'none'}
                  />
                </motion.span>
              </span>
              <span
                className="text-[10px] font-bold transition-colors"
                style={{ color: active ? t.color : 'var(--muted)' }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
