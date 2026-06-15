import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Sheet from '../components/Sheet';
import CareButton from '../components/CareButton';
import GardenPlantSprite, { SPECIES } from '../components/GardenPlantSprite';
import { useStore } from '../store/useStore';

const STAGE_NAMES = ['Sprout', 'Seedling', 'Growing', 'Thriving', 'Full bloom'];

export default function Garden() {
  const garden = useStore((s) => s.garden);
  const emit = useStore((s) => s.emit);
  const [adding, setAdding] = useState(false);
  const [species, setSpecies] = useState('monstera');
  const [name, setName] = useState('');

  useEffect(() => {
    useStore.getState().refreshGarden?.();
  }, []);

  function plant() {
    emit('garden:plant', { species, name: name.trim() || SPECIES[species].label.toLowerCase() });
    setAdding(false);
    setName('');
    setSpecies('monstera');
  }

  return (
    <div>
      <PageHeader
        title="Our garden"
        sub="grow a little jungle together 🌿"
        right={
          <button
            onClick={() => setAdding(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--green)] text-[#1a1f4a]"
          >
            <Plus size={22} />
          </button>
        }
      />
      <div className="space-y-3 px-5 pb-6">
        {garden.length === 0 && (
          <p className="mt-16 text-center text-sm text-[var(--muted)]">plant your first seed 🌱</p>
        )}
        {garden.map((p) => (
          <PlantCard key={p.id} p={p} emit={emit} />
        ))}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Plant something">
        <div className="mb-4 grid grid-cols-4 gap-2">
          {Object.entries(SPECIES).map(([id, sp]) => (
            <button
              key={id}
              onClick={() => setSpecies(id)}
              className="flex flex-col items-center gap-1 rounded-2xl py-3"
              style={{
                background: species === id ? 'var(--card2)' : 'var(--card)',
                boxShadow: species === id ? 'inset 0 0 0 1.5px var(--green)' : 'none',
              }}
            >
              <span className="text-2xl">{sp.emoji}</span>
              <span className="text-[10px] font-bold text-[var(--text2)]">{sp.label}</span>
            </button>
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`name your ${SPECIES[species].label.toLowerCase()} (optional)`}
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <button
          onClick={plant}
          className="w-full rounded-2xl bg-[var(--green)] py-3.5 font-extrabold text-[#1a1f4a] active:scale-95"
        >
          Plant it 🌱
        </button>
      </Sheet>
    </div>
  );
}

function PlantCard({ p, emit }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(p.name || '');
  const stage = p.stage ?? 0;
  const growth = stage >= 4 ? 100 : p.growth ?? 0;

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <GardenPlantSprite species={p.species} stage={stage} size={96} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            {editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-28 rounded-lg bg-[var(--bg2)] px-2 py-1 font-bold capitalize"
                  autoFocus
                />
                <button
                  onClick={() => {
                    emit('garden:rename', { plantId: p.id, name });
                    setEditing(false);
                  }}
                  className="text-[var(--green)]"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 font-extrabold capitalize">
                {p.name} <Pencil size={12} className="text-[var(--muted)]" />
              </button>
            )}
            <button onClick={() => emit('garden:remove', { plantId: p.id })} className="text-[var(--muted)]">
              <Trash2 size={15} />
            </button>
          </div>
          <div className="text-xs text-[var(--green)]">
            {SPECIES[p.species]?.label} · {stage >= 4 ? 'fully grown 🌳' : STAGE_NAMES[stage]}
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-[var(--green)]" style={{ width: `${growth}%` }} />
          </div>
          <div className="mt-2 flex gap-2">
            <CareButton
              emoji="💧"
              label="Water"
              lastAt={p.watered_at}
              cooldownHrs={12}
              color="#7dd3fc"
              onPress={() => emit('garden:care', { plantId: p.id, action: 'water' })}
            />
            <CareButton
              emoji="☀️"
              label="Sun"
              lastAt={p.fertilized_at}
              cooldownHrs={8}
              color="#fde047"
              onPress={() => emit('garden:care', { plantId: p.id, action: 'sun' })}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
