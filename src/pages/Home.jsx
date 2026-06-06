import { motion } from 'framer-motion';
import { Image, Map, Music, Smile, ListChecks, Hammer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import RoomScene from '../components/RoomScene';
import StatPill from '../components/StatPill';

const QUICK = [
  { to: '/photos', label: 'Photos', icon: Image, color: '#f5a3c7' },
  { to: '/map', label: 'Map', icon: Map, color: '#7dd3fc' },
  { to: '/bucket', label: 'Bucket', icon: ListChecks, color: '#9be89b' },
  { to: '/decorate', label: 'Decorate', icon: Hammer, color: '#fdba74' },
  { to: '/music', label: 'Music', icon: Music, color: '#67e8f9' },
  { to: '/mood', label: 'Mood', icon: Smile, color: '#b8a9e8' },
];

export default function Home() {
  const couple = useStore((s) => s.couple);
  const me = useStore((s) => s.me);
  const users = useStore((s) => s.users);
  const presence = useStore((s) => s.presence);
  const partner = useStore((s) => s.partner);
  const nav = useNavigate();

  const myUser = users.find((u) => u.id === me?.id);
  const myStreak = myUser?.streak ?? 0;
  const ourStreak = couple?.our_streak ?? 0;
  const stars = couple?.stars ?? 0;
  const partnerOnline = partner && presence[partner.id];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[100dvh]">
      {/* stat bar */}
      <div className="safe-top sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
          <div className="flex gap-2">
            <StatPill emoji="⭐" value={stars} color="#fde047" />
            <StatPill emoji="🔥" value={myStreak} color="#fdba74" />
            <StatPill emoji="⚡" value={ourStreak} color="#67e8f9" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav('/mood')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20"
              aria-label="Mood"
            >
              <Smile size={18} className="text-[var(--lavender)]" />
            </button>
            <button
              onClick={() => nav('/photos')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20"
              aria-label="Photos"
            >
              <Image size={18} className="text-[var(--pink)]" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-1">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] shadow-soft">
          <RoomScene />
          <button
            onClick={() => nav('/decorate')}
            className="glass absolute right-3 top-3 flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-[var(--orange)] shadow-soft"
            aria-label="Decorate room"
          >
            <Hammer size={15} /> Decorate
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-[var(--text2)]">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: partnerOnline ? '#9be89b' : '#6b6896' }}
          />
          {partner ? (
            <span>
              {partner.display_name} is {partnerOnline ? 'here with you' : 'away right now'}
            </span>
          ) : (
            <span>welcome home</span>
          )}
        </div>

        {/* quick access — clear entry points for the menu features */}
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {QUICK.map((q, i) => {
            const I = q.icon;
            return (
              <motion.button
                key={q.to}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => nav(q.to)}
                className="flex w-[74px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] py-3"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: q.color + '22' }}
                >
                  <I size={20} style={{ color: q.color }} />
                </span>
                <span className="text-xs font-bold text-[var(--text)]">{q.label}</span>
              </motion.button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-xs text-[var(--muted)]">or tap around the room ✨</p>
      </div>
    </motion.div>
  );
}
