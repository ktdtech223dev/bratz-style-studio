import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import MoodBeam from '../components/MoodBeam';
import { useStore } from '../store/useStore';
import { shortRel } from '../lib/time';

// Big mood library, grouped for a nice scroll order (positive → calm → affectionate → low).
export const MOODS = [
  { mood: 'Relaxed', emoji: '😌', color: '#7dd3fc' },
  { mood: 'Calm', emoji: '😇', color: '#7dd3fc' },
  { mood: 'Amazing', emoji: '🤩', color: '#67e8f9' },
  { mood: 'Happy', emoji: '😊', color: '#fde047' },
  { mood: 'Excited', emoji: '🤗', color: '#9be89b' },
  { mood: 'Energetic', emoji: '⚡', color: '#67e8f9' },
  { mood: 'Silly', emoji: '😜', color: '#9be89b' },
  { mood: 'Playful', emoji: '🤪', color: '#9be89b' },
  { mood: 'Giddy', emoji: '😁', color: '#fde047' },
  { mood: 'Mischievous', emoji: '😏', color: '#c084fc' },
  { mood: 'Adventurous', emoji: '🤠', color: '#fdba74' },
  { mood: 'Curious', emoji: '🤔', color: '#67e8f9' },
  { mood: 'Inspired', emoji: '💡', color: '#fde047' },
  { mood: 'Proud', emoji: '🥲', color: '#f5a3c7' },
  { mood: 'Focused', emoji: '🧐', color: '#67e8f9' },
  { mood: 'Confident', emoji: '😎', color: '#818cf8' },
  { mood: 'Hopeful', emoji: '🌱', color: '#b8a9e8' },
  { mood: 'Grateful', emoji: '🥹', color: '#c084fc' },
  { mood: 'Content', emoji: '🙂', color: '#c084fc' },
  { mood: 'Romantic', emoji: '🌹', color: '#ff6ba8' },
  { mood: 'Flirtatious', emoji: '😘', color: '#ff6ba8' },
  { mood: 'Loving', emoji: '🥰', color: '#f472b6' },
  { mood: 'Cuddly', emoji: '🤗', color: '#f5a3c7' },
  { mood: 'Cute', emoji: '🥺', color: '#f5a3c7' },
  { mood: 'Smitten', emoji: '😍', color: '#ff6ba8' },
  { mood: 'Cozy', emoji: '🧸', color: '#f5a3c7' },
  { mood: 'Yearning', emoji: '🌙', color: '#818cf8' },
  { mood: 'Missing you', emoji: '🥺', color: '#8e8ad6' },
  { mood: 'Touch-starved', emoji: '🫂', color: '#cf8fb0' },
  { mood: 'Homesick', emoji: '🏠', color: '#b8a9e8' },
  { mood: 'Frisky', emoji: '😈', color: '#ff6ba8' },
  { mood: 'In the mood', emoji: '🔥', color: '#f87171' },
  { mood: 'Flustered', emoji: '😳', color: '#f5a3c7' },
  { mood: 'Sleepy', emoji: '😴', color: '#b8a9e8' },
  { mood: 'Okay', emoji: '🙂', color: '#9be89b' },
  { mood: 'Bored', emoji: '😑', color: '#9ca3af' },
  { mood: 'Lazy', emoji: '😪', color: '#cdc7a0' },
  { mood: 'Tired', emoji: '🥱', color: '#8ea3c9' },
  { mood: 'Hungry', emoji: '😋', color: '#fdba74' },
  { mood: 'Craving sweet', emoji: '🍰', color: '#f5a3c7' },
  { mood: 'Craving snacks', emoji: '🍫', color: '#c98a5e' },
  { mood: 'Grumpy', emoji: '😒', color: '#c2a878' },
  { mood: 'Unsure', emoji: '😕', color: '#c084fc' },
  { mood: 'Worried', emoji: '😟', color: '#b8a9e8' },
  { mood: 'Anxious', emoji: '😰', color: '#cf8fb0' },
  { mood: 'Stressed', emoji: '😣', color: '#fdba74' },
  { mood: 'Frustrated', emoji: '😤', color: '#fbbf24' },
  { mood: 'Angry', emoji: '😠', color: '#f87171' },
  { mood: 'Sad', emoji: '😢', color: '#8e8ad6' },
  { mood: 'Lonely', emoji: '🥺', color: '#818cf8' },
  { mood: 'Nostalgic', emoji: '🍂', color: '#c2a878' },
  { mood: 'Overwhelmed', emoji: '😵‍💫', color: '#fdba74' },
  { mood: 'Heartbroken', emoji: '💔', color: '#8e8ad6' },
  { mood: 'Shy', emoji: '☺️', color: '#f5a3c7' },
  { mood: 'Sick', emoji: '🤒', color: '#9bae6a' },
];

function MoodColumn({ name, mood, side, onTap, clickable }) {
  return (
    <button
      onClick={clickable ? onTap : undefined}
      className="flex flex-1 flex-col items-center pt-2"
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <div className="mb-3 text-sm font-bold text-[var(--text2)]">{name}</div>
      {mood ? (
        <>
          <MoodBeam color={mood.color} emoji={mood.emoji} delay={side === 'right' ? 0.12 : 0} />
          <div className="mt-3 text-lg font-extrabold" style={{ color: mood.color }}>
            {mood.mood}
          </div>
          <div className="text-xs text-[var(--muted)]">{shortRel(mood.at)}</div>
        </>
      ) : (
        <>
          <MoodBeam color="#3a3f73" emoji="💤" />
          <div className="mt-3 text-base font-bold text-[var(--muted)]">no mood yet</div>
        </>
      )}
      {clickable && <div className="mt-2 text-xs font-semibold text-[var(--lav-text)]">tap to set</div>}
    </button>
  );
}

export default function Mood() {
  const me = useStore((s) => s.me);
  const partner = useStore((s) => s.partner);
  const moods = useStore((s) => s.moods);
  const emit = useStore((s) => s.emit);
  const [picker, setPicker] = useState(false);

  const myMood = moods[me?.id];
  const partnerMood = partner ? moods[partner.id] : null;

  function pick(m) {
    emit('mood:set', { mood: m.mood, emoji: m.emoji, color: m.color });
    setPicker(false);
  }

  return (
    <div>
      <PageHeader title="Mood" />
      <div className="px-5">
        <div className="flex items-stretch">
          <MoodColumn name="You" mood={myMood} side="left" clickable onTap={() => setPicker(true)} />
          <div className="w-px self-stretch bg-white/5" />
          <MoodColumn name={partner?.display_name || 'Partner'} mood={partnerMood} side="right" />
        </div>
        <p className="mt-8 text-center text-sm text-[var(--text2)]">
          your light shines to {partner?.display_name || 'them'} in real time ✨
        </p>
      </div>

      <AnimatePresence>
        {picker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]"
          >
            {/* header */}
            <div className="safe-top sticky top-0 z-10 flex items-center justify-center border-b border-white/5 bg-[var(--bg)]/90 px-4 py-3 backdrop-blur">
              <button
                onClick={() => setPicker(false)}
                className="absolute left-3 flex items-center gap-1 text-[var(--lav-text)]"
              >
                <ChevronLeft size={24} /> Mood
              </button>
              <h2 className="text-lg font-extrabold">Update mood</h2>
            </div>
            {/* scrollable grid */}
            <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-5 safe-bottom">
              <div className="grid grid-cols-3 gap-3">
                {MOODS.map((m, i) => {
                  const active = myMood?.mood === m.mood;
                  return (
                    <motion.button
                      key={m.mood}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.012, 0.25) }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => pick(m)}
                      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border bg-[var(--card)]"
                      style={{
                        borderColor: active ? m.color : 'var(--border)',
                        boxShadow: active ? `0 0 20px ${m.color}55` : 'none',
                      }}
                    >
                      <Lightbulb
                        size={30}
                        fill={m.color}
                        color={m.color}
                        style={{ filter: `drop-shadow(0 0 8px ${m.color}aa)` }}
                      />
                      <span className="text-sm font-extrabold" style={{ color: m.color }}>
                        {m.mood}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
