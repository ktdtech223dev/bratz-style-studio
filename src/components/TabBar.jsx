import { Hammer, Gift, Heart, User, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const TABS = [
  { to: '/', icon: Hammer, color: '#b8a9e8', match: (p) => p === '/' },
  { to: '/games', icon: Gift, color: '#9be89b', match: (p) => p.startsWith('/games') },
  { to: '/affection', icon: Heart, color: '#ff6ba8', match: (p) => p.startsWith('/affection') },
  { to: '/about', icon: User, color: '#7dd3fc', match: (p) => p.startsWith('/about') },
  { to: '/activity', icon: Bell, color: '#fde047', match: (p) => p.startsWith('/activity') },
];

export default function TabBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[520px] px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2">
      <div className="glass flex items-center justify-around rounded-[26px] border border-[var(--border)] py-2.5 shadow-soft">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <button
              key={t.to}
              onClick={() => nav(t.to)}
              className="relative flex h-11 w-11 items-center justify-center"
            >
              {active && (
                <motion.span
                  layoutId="tab-glow"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: t.color + '22', boxShadow: `0 0 18px ${t.color}66` }}
                />
              )}
              <Icon
                size={24}
                strokeWidth={2.4}
                className="relative z-10 transition-colors"
                style={{ color: active ? t.color : 'var(--muted)' }}
                fill={active ? t.color + '33' : 'none'}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
