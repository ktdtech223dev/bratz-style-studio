import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useStore } from '../store/useStore';

const ITEMS = [
  { type: 'hug', emoji: '🫂', label: 'Hug', color: '#fdba74' },
  { type: 'kiss', emoji: '💋', label: 'Kiss', color: '#ff6ba8' },
  { type: 'wink', emoji: '😉', label: 'Wink', color: '#fde047' },
  { type: 'nudge', emoji: '👆', label: 'Nudge', color: '#7dd3fc' },
  { type: 'high_five', emoji: '🙌', label: 'High five', color: '#9be89b', premium: true },
  { type: 'gratitude', emoji: '🤲', label: 'Gratitude', color: '#c084fc', premium: true },
];

export default function Affection() {
  const emit = useStore((s) => s.emit);
  const partner = useStore((s) => s.partner);
  const presence = useStore((s) => s.presence);
  const [sent, setSent] = useState(null);

  function send(item) {
    emit('affection:send', { type: item.type });
    setSent(item.type);
    setTimeout(() => setSent(null), 1400);
  }

  const online = partner && presence[partner.id];

  return (
    <div>
      <PageHeader title="Affection" back={false} sub={`what would you like to send ${partner?.display_name || 'them'}?`} />
      <div className="px-5 pb-6">
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-[var(--text2)]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: online ? '#9be89b' : '#6b6896' }} />
          {online ? `${partner?.display_name} is online — they'll feel it instantly` : `${partner?.display_name || 'they'} are away — they'll see it later`}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ITEMS.map((item, i) => (
            <motion.button
              key={item.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => send(item)}
              className="relative flex flex-col items-center gap-2 rounded-3xl border border-[var(--border)] bg-[var(--card)] py-7 shadow-soft"
              style={{ boxShadow: `inset 0 0 0 1px ${item.color}22` }}
            >
              {item.premium && (
                <div className="absolute right-3 top-3 text-[var(--yellow)]">
                  <Crown size={16} fill="#fde047" />
                </div>
              )}
              <motion.span
                animate={sent === item.type ? { scale: [1, 1.5, 1], rotate: [0, 12, 0] } : {}}
                className="text-5xl"
              >
                {item.emoji}
              </motion.span>
              <span className="font-extrabold" style={{ color: item.color }}>
                {sent === item.type ? 'sent! 💜' : item.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
