import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import PlantSprite from '../components/PlantSprite';
import CareButton from '../components/CareButton';
import { useStore } from '../store/useStore';
import { daysSince } from '../lib/time';

const STAGE_NAMES = ['Sprout', 'Seedling', 'Baby Bonsai', 'Young Bonsai', 'Full Bonsai'];

export default function Plant() {
  const plant = useStore((s) => s.plant);
  const emit = useStore((s) => s.emit);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plant?.name || 'richard');

  if (!plant) return <PageHeader title="Our plant" />;

  const stage = plant.stage ?? 0;
  const growth = stage >= 4 ? 100 : plant.growth ?? 0;
  const R = 120;
  const C = 2 * Math.PI * R;
  const fert = plant.fertilizer ?? 0;

  return (
    <div>
      <PageHeader title="Our plant" />
      <div className="px-5">
        <div className="relative mx-auto mt-2 h-72 w-72">
          {/* growth ring */}
          <svg viewBox="0 0 280 280" className="absolute inset-0 -rotate-90">
            <circle cx="140" cy="140" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
            <motion.circle
              cx="140"
              cy="140"
              r={R}
              fill="none"
              stroke="#7dd87d"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C - (C * growth) / 100 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(125,216,125,0.6))' }}
            />
          </svg>
          <div
            className="absolute inset-6 flex items-center justify-center rounded-full"
            style={{ background: 'radial-gradient(circle at 50% 35%, #313a73, #1a1f4a)' }}
          >
            <PlantSprite stage={stage} size={190} />
          </div>
        </div>

        <div className="mt-1 text-center">
          <div className="text-lg font-extrabold capitalize">{plant.name} 🪴</div>
          <div className="text-sm text-[var(--green)]">
            {stage >= 4 ? 'fully grown' : `${Math.round(growth)}% to next stage`}
          </div>
        </div>

        <Card className="mt-5 p-5" delay={0.05}>
          <div className="flex items-start justify-around gap-3">
            <CareButton
              emoji="💧"
              label="Water"
              lastAt={plant.watered_at}
              cooldownHrs={12}
              color="#7dd3fc"
              onPress={() => emit('plant:care', { action: 'water' })}
            />
            <CareButton
              emoji="🌱"
              label="Fertilize"
              count={fert}
              lastAt={plant.fertilized_at}
              cooldownHrs={6}
              color="#9be89b"
              disabled={fert <= 0}
              onPress={() => emit('plant:care', { action: 'fertilize' })}
            />
          </div>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            water daily to grow · fertilizer gives a big boost · earn it from diary days
          </p>
        </Card>

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
                    emit('plant:rename', { name });
                    setEditing(false);
                  }}
                  className="text-[var(--green)]"
                >
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 font-bold capitalize">
                {plant.name} <Pencil size={14} className="text-[var(--muted)]" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-semibold text-[var(--text2)]">STAGE</span>
            <span className="font-bold">🌳 {STAGE_NAMES[stage]}</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-semibold text-[var(--text2)]">AGE</span>
            <span className="font-bold">{daysSince(plant.planted_at)} days old</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
