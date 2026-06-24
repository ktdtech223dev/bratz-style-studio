import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import CareButton from '../components/CareButton';
import CampfireSprite from '../components/CampfireSprite';
import CareBurst from '../components/CareBurst';
import { useStore } from '../store/useStore';

export default function Campfire() {
  const campfire = useStore((s) => s.campfire);
  const emit = useStore((s) => s.emit);
  const [burst, setBurst] = useState(0);
  if (!campfire) return <PageHeader title="Our campfire" />;

  const fuel = campfire.fuel ?? 0;
  const logs = campfire.logs ?? 0;
  const status =
    fuel <= 0 ? 'the fire went out — add a log 🪵' : fuel > 66 ? 'crackling warmly 🔥' : fuel > 33 ? 'burning steady' : 'burning low…';

  return (
    <div>
      <PageHeader title="Our campfire" sub="keep our flame alive 🔥" />
      <div className="px-5">
        <div
          className="relative mx-auto mt-2 flex h-72 items-center justify-center overflow-hidden rounded-3xl"
          style={{ background: 'radial-gradient(circle at 50% 70%, #3a2a1a, #1a1f4a 70%)' }}
        >
          <CampfireSprite fuel={fuel} size={210} burst={burst} />
          <CareBurst trigger={burst} kind="sparks" />
        </div>

        <div className="mt-3 text-center">
          <div className="text-lg font-extrabold">{status}</div>
        </div>

        <div className="mx-auto mt-4 h-2.5 w-full max-w-[320px] overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full"
            style={{ width: `${fuel}%`, background: 'linear-gradient(90deg,#fbbf24,#fb6a3c)' }}
          />
        </div>

        <Card className="mt-5 p-5" delay={0.05}>
          <div className="flex items-start justify-around gap-3">
            <CareButton
              emoji="🔥"
              label="Stoke"
              lastAt={campfire.stoked_at}
              cooldownHrs={2}
              color="#fb923c"
              onPress={() => {
                setBurst((b) => b + 1);
                emit('campfire:care', { action: 'stoke' });
              }}
            />
            <CareButton
              emoji="🪵"
              label="Add log"
              count={logs}
              color="#c98a5e"
              disabled={logs <= 0}
              onPress={() => {
                setBurst((b) => b + 1);
                emit('campfire:care', { action: 'addlog' });
              }}
            />
          </div>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            stoke it often to keep it burning · logs give a big boost
          </p>
        </Card>
      </div>
    </div>
  );
}
