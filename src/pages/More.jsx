import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  BarChart3,
  Sun,
  LineChart,
  Tv,
  CalendarDays,
  Dices,
  Sprout,
  Flame,
  Fish,
  Heart,
  Sparkles,
  Mail,
  Hourglass,
  Ticket,
  Gift,
  Music,
  Hand,
  Disc3,
  CheckCheck,
  ChevronRight,
  CloudSun,
  Brain,
  Zap,
  MessageCircleHeart,
  Search,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

// Grouped into labeled sections. Every existing route/icon/label is preserved;
// only regrouped, plus a handful of new tiles under "More to explore".
const SECTIONS = [
  {
    id: 'cozy',
    emoji: '🏡',
    title: 'Cozy spaces',
    items: [
      { to: '/garden', label: 'Our garden', sub: 'grow plants together', icon: Sprout, color: '#9be89b' },
      { to: '/campfire', label: 'Our campfire', sub: 'keep the flame alive', icon: Flame, color: '#fb923c' },
      { to: '/fishtank', label: 'Our fish tank', sub: 'feed the fish', icon: Fish, color: '#67e8f9' },
    ],
  },
  {
    id: 'keepsakes',
    emoji: '💌',
    title: 'Keepsakes',
    items: [
      { to: '/lovejar', label: 'Love jar', sub: 'fill it with little loves', icon: Heart, color: '#ff6ba8' },
      { to: '/starmap', label: 'Star map', sub: 'a star for each memory', icon: Sparkles, color: '#fde047' },
      { to: '/letters', label: 'Open when…', sub: 'letters for the right moment', icon: Mail, color: '#f5a3c7' },
      { to: '/capsules', label: 'Time capsules', sub: 'unlock on a future date', icon: Hourglass, color: '#c084fc' },
      { to: '/coupons', label: 'Love coupons', sub: 'little promises to redeem', icon: Ticket, color: '#fdba74' },
      { to: '/wishlist', label: 'Gift wishlist', sub: 'ideas to surprise each other', icon: Gift, color: '#9be89b' },
      { to: '/dedications', label: 'Our songs', sub: 'dedicate a song', icon: Music, color: '#c084fc' },
    ],
  },
  {
    id: 'together',
    emoji: '🤝',
    title: 'Together now',
    items: [
      { to: '/holdhands', label: 'Hold hands', sub: 'press together, live', icon: Hand, color: '#ff6ba8' },
      { to: '/spinner', label: 'Date spinner', sub: 'pick your next date', icon: Disc3, color: '#7dd3fc' },
      { to: '/truthordare', label: 'Truth or Dare', sub: 'draw a card', icon: Dices, color: '#ff6ba8' },
    ],
  },
  {
    id: 'story',
    emoji: '📈',
    title: 'Our story',
    items: [
      { to: '/checkin', label: 'Daily check-in', sub: 'how was your day?', icon: Sun, color: '#fde047' },
      { to: '/habits', label: 'Shared habits', sub: 'build streaks together', icon: CheckCheck, color: '#9be89b' },
      { to: '/timeline', label: 'Timeline', sub: 'our story so far', icon: Clock, color: '#f5a3c7' },
      { to: '/stats', label: 'Our stats', sub: 'days together & more', icon: BarChart3, color: '#67e8f9' },
      { to: '/moodtrends', label: 'Mood trends', sub: 'moods over time', icon: LineChart, color: '#b8a9e8' },
      { to: '/watchlist', label: 'Watchlist', sub: 'what to watch together', icon: Tv, color: '#c084fc' },
      { to: '/calendar', label: 'Calendar', sub: 'plans & countdowns', icon: CalendarDays, color: '#9be89b' },
    ],
  },
  {
    id: 'explore',
    emoji: '🌦️',
    title: 'More to explore',
    items: [
      { to: '/weather', label: 'Weather', sub: 'sunshine for two', icon: CloudSun, color: '#7dd3fc' },
      { to: '/dailyduo', label: 'Daily duo', sub: 'a question for today', icon: MessageCircleHeart, color: '#ff6ba8' },
      { to: '/solo/memory', label: 'Solo: Memory', sub: 'match the pairs', icon: Brain, color: '#c084fc' },
      { to: '/solo/reaction', label: 'Solo: Reaction', sub: 'test your reflexes', icon: Zap, color: '#fde047' },
    ],
  },
];

function Row({ it, i, onClick }) {
  const I = it.icon;
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.03, 0.25) }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-[var(--border)] bg-grad-card p-4 text-left shadow-card transition-transform duration-150 ease-out"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-elev1"
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
}

export default function More() {
  const nav = useNavigate();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  // Filtered sections: when searching, keep only items whose label/sub matches,
  // and drop sections that become empty.
  const sections = useMemo(() => {
    if (!q) return SECTIONS;
    return SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (it) => it.label.toLowerCase().includes(q) || it.sub.toLowerCase().includes(q),
      ),
    })).filter((sec) => sec.items.length > 0);
  }, [q]);

  const empty = sections.length === 0;
  let rowIndex = 0;

  return (
    <div>
      <PageHeader title="More" sub="everything else, in one place" icon="✨" />
      <div className="px-5 pb-6">
        {/* Search */}
        <div className="relative mb-5">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] py-3 pl-10 pr-10 text-[15px] font-semibold text-[var(--text)] shadow-elev1 outline-none placeholder:text-[var(--muted)] focus:border-[var(--border-strong)]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] active:bg-white/5"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {empty ? (
          <div className="flex flex-col items-center py-16 text-center text-[var(--text2)]">
            <Search size={36} className="text-[var(--muted)]" />
            <p className="mt-3 text-sm">
              nothing for “<span className="font-bold">{query}</span>” 🔍
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((sec) => (
              <section key={sec.id}>
                <h2 className="mb-2.5 flex items-center gap-1.5 px-1 text-xs font-extrabold uppercase tracking-widest text-[var(--text2)]">
                  <span className="text-sm">{sec.emoji}</span>
                  {sec.title}
                </h2>
                <div className="space-y-2.5">
                  {sec.items.map((it) => (
                    <Row key={it.to} it={it} i={rowIndex++} onClick={() => nav(it.to)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
