import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, BarChart3, Sun, LineChart, Tv, CalendarDays, Dices, Sprout, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const ITEMS = [
  { to: '/garden', label: 'Our garden', sub: 'grow plants together', icon: Sprout, color: '#9be89b' },
  { to: '/checkin', label: 'Daily check-in', sub: 'how was your day?', icon: Sun, color: '#fde047' },
  { to: '/timeline', label: 'Timeline', sub: 'our story so far', icon: Clock, color: '#f5a3c7' },
  { to: '/stats', label: 'Our stats', sub: 'days together & more', icon: BarChart3, color: '#67e8f9' },
  { to: '/moodtrends', label: 'Mood trends', sub: 'moods over time', icon: LineChart, color: '#b8a9e8' },
  { to: '/watchlist', label: 'Watchlist', sub: 'what to watch together', icon: Tv, color: '#c084fc' },
  { to: '/calendar', label: 'Calendar', sub: 'plans & countdowns', icon: CalendarDays, color: '#9be89b' },
  { to: '/truthordare', label: 'Truth or Dare', sub: 'draw a card', icon: Dices, color: '#ff6ba8' },
];

export default function More() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader title="More" sub="everything else, in one place" />
      <div className="space-y-2.5 px-5 pb-6">
        {ITEMS.map((it, i) => {
          const I = it.icon;
          return (
            <motion.button
              key={it.to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => nav(it.to)}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left shadow-soft"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: it.color + '22' }}
              >
                <I size={22} style={{ color: it.color }} />
              </span>
              <span className="flex-1">
                <span className="block font-extrabold">{it.label}</span>
                <span className="block text-xs text-[var(--text2)]">{it.sub}</span>
              </span>
              <ChevronRight size={20} className="text-[var(--muted)]" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
