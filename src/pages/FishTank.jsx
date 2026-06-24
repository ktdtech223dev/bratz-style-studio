import { lazy, Suspense, useRef, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import CareButton from '../components/CareButton';
import AquariumSprite from '../components/AquariumSprite';
import { hasWebGL } from '../components/room3d/useWebGL';
import { useStore } from '../store/useStore';

// Lazy-load the heavy three.js aquarium chunk only when WebGL is available.
const Aquarium3D = lazy(() => import('../components/aquarium3d/Aquarium3D'));

export default function FishTank() {
  const aquarium = useStore((s) => s.aquarium);
  const emit = useStore((s) => s.emit);

  // Shared feed-progress ref (0..1). The 3D scene reads it each frame so the
  // fish dart toward the food + pellets fall — driven here so it stays in sync
  // with the emit without re-rendering the canvas.
  const feedRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  if (!aquarium) return <PageHeader title="Our fish tank" icon="🐠" />;

  const clean = aquarium.cleanliness ?? 0;
  const fish = aquarium.fish ?? 0;
  const status =
    clean > 66 ? 'crystal clear 💎' : clean > 33 ? 'getting a little murky' : 'needs a clean! 🧽';

  // Animate a quick feeding dart: ramp feedRef 0 -> 1 (pellets fall, fish gather)
  // then ease back to idle.
  const runFeedAnim = () => {
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const ATTACK = 1100; // ms to reach the food
    const HOLD = 600;
    const RELEASE = 900;
    const total = ATTACK + HOLD + RELEASE;
    const tick = (now) => {
      const t = now - start;
      let v;
      if (t < ATTACK) v = t / ATTACK;
      else if (t < ATTACK + HOLD) v = 1;
      else v = Math.max(0, 1 - (t - ATTACK - HOLD) / RELEASE);
      feedRef.current = v;
      if (t < total) rafRef.current = requestAnimationFrame(tick);
      else feedRef.current = 0;
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const feed = () => {
    runFeedAnim();
    emit('aquarium:care', { action: 'feed' });
  };
  const cleanTank = () => {
    // Cleaning clears the algae tint instantly via the store update from the
    // emit (cleanliness -> high), which the Water material reads.
    emit('aquarium:care', { action: 'clean' });
  };

  const fallbackProps = { cleanliness: clean, fish, size: 320 };

  return (
    <div>
      <PageHeader title="Our fish tank" sub="feed them, keep it clean 🐠" icon="🐠" />
      <div className="px-5">
        <div className="relative mx-auto mt-2 w-full max-w-[360px] overflow-hidden rounded-4xl shadow-cardlg">
          {hasWebGL() ? (
            <Suspense fallback={<AquariumSprite {...fallbackProps} />}>
              <Aquarium3D
                cleanliness={clean}
                fish={fish}
                feedRef={feedRef}
                fallbackProps={fallbackProps}
              />
            </Suspense>
          ) : (
            <AquariumSprite {...fallbackProps} />
          )}
        </div>

        <div className="mt-3 text-center">
          <div className="text-lg font-extrabold">{status}</div>
          <div className="text-sm text-[var(--cyan)]">{fish} fish swimming</div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">drag to rotate · pinch to zoom</div>
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
              onPress={feed}
            />
            <CareButton
              emoji="🧽"
              label="Clean"
              lastAt={aquarium.cleaned_at}
              cooldownHrs={10}
              color="#67e8f9"
              onPress={cleanTank}
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
