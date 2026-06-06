import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Trophy, Heart, BookOpen, Image, Sprout, Music, Bell } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';
import { relTime } from '../lib/time';

const ICONS = {
  lightbulb: { I: Lightbulb, c: '#fde047' },
  trophy: { I: Trophy, c: '#fdba74' },
  heart: { I: Heart, c: '#ff6ba8' },
  book: { I: BookOpen, c: '#c084fc' },
  image: { I: Image, c: '#7dd3fc' },
  sprout: { I: Sprout, c: '#9be89b' },
  music: { I: Music, c: '#67e8f9' },
};

export default function Activity() {
  const activity = useStore((s) => s.activity);
  const refreshActivity = useStore((s) => s.refreshActivity);
  const me = useStore((s) => s.me);

  useEffect(() => {
    refreshActivity();
  }, [refreshActivity]);

  return (
    <div>
      <PageHeader title="Notifications" back={false} />
      <div className="px-5 pb-6">
        <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">Recent</h3>
        {activity.length === 0 && (
          <div className="mt-14 text-center text-[var(--text2)]">
            <Bell size={36} className="mx-auto text-[var(--muted)]" />
            <p className="mt-3 font-semibold">Nothing yet</p>
            <p className="text-sm text-[var(--muted)]">your shared moments will show up here</p>
          </div>
        )}
        <div className="space-y-2">
          {activity.map((a, i) => {
            const meta = ICONS[a.icon] || ICONS.heart;
            const I = meta.I;
            const mine = a.actor_id === me?.id;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: meta.c + '22' }}>
                  <I size={19} style={{ color: meta.c }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-snug">
                    {mine ? a.message.replace(a.actor_name, 'You') : a.message}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{relTime(a.created_at)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
