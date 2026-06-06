import { motion } from 'framer-motion';
import { Moon, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import RoomScene from '../components/RoomScene';
import StatPill from '../components/StatPill';

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
              <Moon size={18} className="text-[var(--yellow)]" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-1">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] shadow-soft">
          <RoomScene />
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
        <p className="mt-1 text-center text-xs text-[var(--muted)]">tap around the room ✨</p>
      </div>
    </motion.div>
  );
}
