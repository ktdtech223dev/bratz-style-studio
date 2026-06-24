import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import CareButton from '../components/CareButton';
import AquariumSprite from '../components/AquariumSprite';
import CareBurst from '../components/CareBurst';
import { useStore } from '../store/useStore';

export default function FishTank() {
  const aquarium = useStore((s) => s.aquarium);
  const emit = useStore((s) => s.emit);
  const [burst, setBurst] = useState(0);
  const [burstKind, setBurstKind] = useState('food');
  if (!aquarium) return <PageHeader title="Our fish tank" />;

  const care = (action, kind) => {
    setBurstKind(kind);
    setBurst((b) => b + 1);
    emit('aquarium:care', { action });
  };

  const clean = aquarium.cleanliness ?? 0;
  const fish = aquarium.fish ?? 0;
  const status =
    clean > 66 ? 'crystal clear 💎' : clean > 33 ? 'getting a little murky' : 'needs a clean! 🧽';

  return (
    <div>
      <PageHeader title="Our fish tank" sub="feed them, keep it clean 🐠" />
      <div className="px-5">
        <div className="relative mx-auto mt-2 w-fit overflow-visible rounded-3xl shadow-cardlg">
          <AquariumSprite cleanliness={clean} fish={fish} size={300} />
          <CareBurst trigger={burst} kind={burstKind} />
        </div>

        <div className="mt-3 text-center">
          <div className="text-lg font-extrabold">{status}</div>
          <div className="text-sm text-[var(--cyan)]">
            {fish} {fish === 1 ? 'fish' : 'fish'} swimming
          </div>
        </div>

        <div className="mx-auto mt-4 h-2.5 w-full max-w-[320px] overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-[var(--cyan)]" style={{ width: `${clean}%` }} />
        </div>

        <Card className="mt-5 p-5" delay={0.05}>
          <div className="flex items-start justify-around gap-3">
            <CareButton
              emoji="🐟"
              label="Feed"
              lastAt={aquarium.fed_at}
              cooldownHrs={6}
              color="#fdba74"
              onPress={() => care('feed', 'food')}
            />
            <CareButton
              emoji="🧽"
              label="Clean"
              lastAt={aquarium.cleaned_at}
              cooldownHrs={10}
              color="#67e8f9"
              onPress={() => care('clean', 'bubbles')}
            />
          </div>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            feed a clean tank often and new fish might just appear 🐟
          </p>
        </Card>
      </div>
    </div>
  );
}
