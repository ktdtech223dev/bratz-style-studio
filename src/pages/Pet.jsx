import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import PetSprite from '../components/PetSprite';
import CareButton from '../components/CareButton';
import CareBurst from '../components/CareBurst';
import { useStore } from '../store/useStore';
import { daysSince } from '../lib/time';

const MOOD_EMOJI = {
  Happy: '😺',
  Content: '🙂',
  Pensive: '🤔',
  Lonely: '🥺',
  Sad: '😿',
};

export default function Pet() {
  const pet = useStore((s) => s.pet);
  const emit = useStore((s) => s.emit);
  const decor = useStore((s) => s.decor);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pet?.name || 'atlas');
  const [burst, setBurst] = useState(0);
  const [burstKind, setBurstKind] = useState('hearts');

  if (!pet) return <PageHeader title="Our pet" />;

  const treats = pet.treats ?? 0;

  const care = (action, kind) => {
    setBurstKind(kind);
    setBurst((b) => b + 1);
    emit('pet:care', { action });
  };

  return (
    <div>
      <PageHeader title="Our pet" />
      <div className="px-5">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mx-auto mt-2 flex h-64 w-64 items-center justify-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 35%, #313a73, #1a1f4a)',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4), 0 0 50px rgba(184,169,232,0.2)',
          }}
        >
          <PetSprite
            mood={pet.mood}
            size={210}
            colors={{ body: decor?.body, face: decor?.face, eye: decor?.eye }}
          />
          <CareBurst trigger={burst} kind={burstKind} />
        </motion.div>

        <div className="mt-2 text-center text-lg font-extrabold capitalize">
          {pet.name} {MOOD_EMOJI[pet.mood] || '🐾'}
        </div>

        {/* care actions */}
        <Card className="mt-5 p-5" delay={0.05}>
          <div className="flex items-start justify-between gap-2">
            <CareButton
              emoji="🍚"
              label="Feed"
              lastAt={pet.fed_at}
              cooldownHrs={12}
              color="#fdba74"
              onPress={() => care('feed', 'food')}
            />
            <CareButton
              emoji="🧶"
              label="Play"
              lastAt={pet.played_at}
              cooldownHrs={10}
              color="#67e8f9"
              onPress={() => care('play', 'sparks')}
            />
            <CareButton
              emoji="❤️"
              label="Pet"
              lastAt={pet.petted_at}
              cooldownHrs={8}
              color="#ff6ba8"
              onPress={() => care('pet', 'hearts')}
            />
            <CareButton
              emoji="🦴"
              label="Treat"
              count={treats}
              lastAt={null}
              cooldownHrs={0}
              color="#9be89b"
              disabled={treats <= 0}
              onPress={() => care('treat', 'hearts')}
            />
          </div>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            care resets the timer & lifts {pet.name}'s mood · earn treats by playing games
          </p>
        </Card>

        {/* info card */}
        <Card className="mt-4 divide-y divide-white/5" delay={0.1}>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-semibold text-[var(--text2)]">NAME</span>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-32 rounded-lg bg-[var(--bg2)] px-2 py-1 text-right font-bold capitalize"
                  autoFocus
                />
                <button
                  onClick={() => {
                    emit('pet:rename', { name });
                    setEditing(false);
                  }}
                  className="text-[var(--green)]"
                >
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 font-bold capitalize">
                {pet.name} <Pencil size={14} className="text-[var(--muted)]" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-semibold text-[var(--text2)]">MOOD</span>
            <span className="font-bold">📊 {pet.mood}</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-semibold text-[var(--text2)]">ADOPTED</span>
            <span className="font-bold">{daysSince(pet.adopted_at)} days ago</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
