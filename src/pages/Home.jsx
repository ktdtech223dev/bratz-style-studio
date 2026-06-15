import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Map, Music, Smile, ListChecks, Hammer, MoreHorizontal, Moon, Sun, Sparkles, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import RoomScene from '../components/RoomScene';
import StatPill from '../components/StatPill';
import Sheet from '../components/Sheet';

function daysUntil(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
}

const QUICK = [
  { to: '/photos', label: 'Photos', icon: Image, color: '#f5a3c7' },
  { to: '/map', label: 'Map', icon: Map, color: '#7dd3fc' },
  { to: '/bucket', label: 'Bucket', icon: ListChecks, color: '#9be89b' },
  { to: '/decorate', label: 'Decorate', icon: Hammer, color: '#fdba74' },
  { to: '/music', label: 'Music', icon: Music, color: '#67e8f9' },
  { to: '/mood', label: 'Mood', icon: Smile, color: '#b8a9e8' },
  { to: '/more', label: 'More', icon: MoreHorizontal, color: '#c084fc' },
];

export default function Home() {
  const couple = useStore((s) => s.couple);
  const me = useStore((s) => s.me);
  const users = useStore((s) => s.users);
  const presence = useStore((s) => s.presence);
  const partner = useStore((s) => s.partner);
  const emit = useStore((s) => s.emit);
  const nav = useNavigate();

  const [onThisDay, setOnThisDay] = useState(null);
  const [otdDismissed, setOtdDismissed] = useState(false);
  const [checkedIn, setCheckedIn] = useState(true);
  const [reunionOpen, setReunionOpen] = useState(false);
  const [rDate, setRDate] = useState('');
  const [rLabel, setRLabel] = useState('');

  function openReunion() {
    setRDate(couple?.reunion_at || '');
    setRLabel(couple?.reunion_label || '');
    setReunionOpen(true);
  }
  async function saveReunion() {
    await api.post('/api/reunion', { at: rDate || null, label: rLabel });
    setReunionOpen(false);
  }
  async function clearReunion() {
    await api.post('/api/reunion', { at: null, label: '' });
    setReunionOpen(false);
  }

  useEffect(() => {
    api
      .get('/api/onthisday')
      .then((r) => {
        const total = (r.photos?.length || 0) + (r.milestones?.length || 0) + (r.notes?.length || 0);
        if (total > 0) setOnThisDay(r);
      })
      .catch(() => {});
    api
      .get('/api/checkin/today')
      .then((r) => setCheckedIn(r.entries.some((e) => e.user_id === me?.id)))
      .catch(() => {});
  }, [me?.id]);

  const myUser = users.find((u) => u.id === me?.id);
  const myStreak = myUser?.streak ?? 0;
  const ourStreak = couple?.our_streak ?? 0;
  const stars = couple?.stars ?? 0;
  const partnerOnline = partner && presence[partner.id];
  const asleep = myUser?.status === 'asleep';
  const partnerAsleep = partner?.status === 'asleep';

  const otdImg = onThisDay?.photos?.[0];

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
              onClick={() => emit('status:set', { status: asleep ? 'awake' : 'asleep' })}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20"
              aria-label="Goodnight"
            >
              {asleep ? <Sun size={18} className="text-[var(--yellow)]" /> : <Moon size={18} className="text-[var(--lavender)]" />}
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
              {partner.display_name} is{' '}
              {partnerAsleep ? 'asleep 🌙' : partnerOnline ? 'here with you' : 'away right now'}
            </span>
          ) : (
            <span>welcome home</span>
          )}
        </div>

        {/* reunion countdown */}
        {(() => {
          const days = couple?.reunion_at ? daysUntil(couple.reunion_at) : null;
          const label = couple?.reunion_label || 'we’re together';
          if (days !== null && days >= 0) {
            return (
              <button
                onClick={openReunion}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--pink-hot)]/30 bg-gradient-to-r from-[var(--pink-hot)]/15 to-[var(--purple)]/10 p-4 text-left shadow-soft"
              >
                <span className="text-3xl">{days === 0 ? '🎉' : '💜'}</span>
                <span className="flex-1">
                  <span className="block text-2xl font-extrabold leading-none">
                    {days === 0 ? 'Today!' : `${days} ${days === 1 ? 'day' : 'days'}`}
                  </span>
                  <span className="block text-sm text-[var(--text2)]">
                    {days === 0 ? `until ${label} 💕` : `until ${label}`}
                  </span>
                </span>
                <ChevronRight size={20} className="text-[var(--muted)]" />
              </button>
            );
          }
          return (
            <button
              onClick={openReunion}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] p-3 text-left text-[var(--text2)]"
            >
              <span className="text-2xl">💜</span>
              <span className="flex-1 text-sm font-semibold">set a countdown to your next reunion</span>
              <ChevronRight size={18} className="text-[var(--muted)]" />
            </button>
          );
        })()}

        {/* on this day */}
        <AnimatePresence>
          {onThisDay && !otdDismissed && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => nav(otdImg ? '/photos' : onThisDay.milestones?.length ? '/timeline' : '/notes')}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-left shadow-soft"
            >
              {otdImg ? (
                <img src={`/photos/${otdImg.filename}`} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--purple)]/20">
                  <Sparkles size={22} className="text-[var(--purple)]" />
                </span>
              )}
              <span className="flex-1">
                <span className="block text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
                  On this day
                </span>
                <span className="block text-sm text-[var(--text)]">a memory from a year like today 💜</span>
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setOtdDismissed(true);
                }}
                className="text-[var(--muted)]"
              >
                <X size={16} />
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* check-in nudge */}
        {!checkedIn && (
          <button
            onClick={() => nav('/checkin')}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-left shadow-soft"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--yellow)]/15">
              <Sun size={22} className="text-[var(--yellow)]" />
            </span>
            <span className="flex-1">
              <span className="block font-bold">How was your day?</span>
              <span className="block text-xs text-[var(--text2)]">tap to check in with {partner?.display_name || 'them'}</span>
            </span>
            <ChevronRight size={20} className="text-[var(--muted)]" />
          </button>
        )}

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

      <Sheet open={reunionOpen} onClose={() => setReunionOpen(false)} title="Next reunion 💜">
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text2)]">Date</label>
        <input
          type="date"
          value={rDate}
          onChange={(e) => setRDate(e.target.value)}
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text2)]">Label</label>
        <input
          value={rLabel}
          onChange={(e) => setRLabel(e.target.value)}
          placeholder="we’re together again"
          className="mb-4 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <button
          onClick={saveReunion}
          className="w-full rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95"
        >
          Save countdown
        </button>
        {couple?.reunion_at && (
          <button onClick={clearReunion} className="mt-2 w-full py-2 text-sm font-bold text-[var(--muted)]">
            clear
          </button>
        )}
      </Sheet>
    </motion.div>
  );
}
