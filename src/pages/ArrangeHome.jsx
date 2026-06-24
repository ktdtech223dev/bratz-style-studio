import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Trash2, Plus, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { hasWebGL } from '../components/room3d/useWebGL';

const ArrangeScene = lazy(() => import('../components/room3d/ArrangeScene'));

const ADD_KINDS = [
  ['sofa', '🛋'],
  ['bed', '🛏'],
  ['dresser', '🗄'],
  ['nightstand', '🪞'],
  ['bookshelf', '📚'],
  ['lamp', '💡'],
  ['rug', '🟫'],
  ['dining', '🍽'],
  ['toybox', '🧸'],
  ['crib', '👶'],
];

export default function ArrangeHome() {
  const nav = useNavigate();
  const setArrangeMode = useStore((s) => s.setArrangeMode);
  const setSel = useStore((s) => s.setArrangeSel);
  const sel = useStore((s) => s.arrangeSel);
  const placed = useStore((s) => s.placedFurniture);
  const avatarLayout = useStore((s) => s.avatarLayout);
  const refreshFurniture = useStore((s) => s.refreshFurniture);

  useEffect(() => {
    setArrangeMode(true);
    return () => setArrangeMode(false);
  }, [setArrangeMode]);

  const selFurn = sel && sel[0] === 'f' ? placed.find((p) => `f${p.id}` === sel) : null;
  const selAvatar = sel && sel[0] === 'a';

  async function addKind(kind) {
    await api.post('/api/furniture', { kind, x: 0, z: 0.6, rot: 0 }).catch(() => {});
    refreshFurniture();
  }
  async function rotateFurn() {
    if (!selFurn) return;
    await api.post(`/api/furniture/${selFurn.id}`, { x: selFurn.x, z: selFurn.z, rot: (selFurn.rot || 0) + Math.PI / 8 }).catch(() => {});
    refreshFurniture();
  }
  async function deleteFurn() {
    if (!selFurn) return;
    await api.del(`/api/furniture/${selFurn.id}`).catch(() => {});
    setSel(null);
    refreshFurniture();
  }
  async function rotateAvatar() {
    const uid = Number(sel.slice(1));
    const cur = avatarLayout?.[uid] || { x: 0, z: 0.6, rot: 0 };
    await api.post('/api/avatars/move', { userId: uid, x: cur.x, z: cur.z, rot: (cur.rot || 0) + Math.PI / 8 }).catch(() => {});
  }

  if (!hasWebGL()) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl">🪑</div>
        <p className="mt-3 font-bold">Arrange mode needs 3D</p>
        <p className="mt-1 text-sm text-[var(--text2)]">This device can’t render the 3D home editor.</p>
        <button onClick={() => nav('/')} className="mt-5 rounded-2xl bg-[var(--pink-hot)] px-6 py-3 font-extrabold text-white">
          Back home
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg)]">
      <div className="absolute inset-0">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-[var(--text2)]">loading your home…</div>}>
          <ArrangeScene />
        </Suspense>
      </div>

      {/* top bar */}
      <div className="safe-top absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3">
        <span className="glass rounded-full px-3 py-1.5 text-sm font-extrabold shadow-elev2">Design your home</span>
        <button
          onClick={() => nav('/')}
          className="flex items-center gap-1.5 rounded-full bg-[var(--pink-hot)] px-4 py-2 text-sm font-extrabold text-white shadow-elev2 active:scale-95"
        >
          <Check size={16} /> Done
        </button>
      </div>

      <p className="pointer-events-none absolute inset-x-0 top-16 text-center text-xs text-[var(--text2)]">
        drag a piece to move it · tap empty floor to deselect · drag to orbit
      </p>

      {/* selection action bar */}
      {selFurn && (
        <div className="safe-bottom absolute inset-x-0 bottom-[92px] flex items-center justify-center gap-3">
          <button onClick={rotateFurn} className="flex items-center gap-1.5 rounded-full bg-[var(--card2)] px-4 py-2.5 text-sm font-bold shadow-elev2 active:scale-95">
            <RotateCw size={16} /> Rotate
          </button>
          <button onClick={deleteFurn} className="flex items-center gap-1.5 rounded-full bg-[#e0584f] px-4 py-2.5 text-sm font-bold text-white shadow-elev2 active:scale-95">
            <Trash2 size={16} /> Remove
          </button>
        </div>
      )}
      {selAvatar && (
        <div className="safe-bottom absolute inset-x-0 bottom-[92px] flex items-center justify-center gap-3">
          <button onClick={rotateAvatar} className="flex items-center gap-1.5 rounded-full bg-[var(--card2)] px-4 py-2.5 text-sm font-bold shadow-elev2 active:scale-95">
            <RotateCw size={16} /> Turn
          </button>
          <span className="rounded-full bg-black/30 px-3 py-2 text-xs text-[var(--text2)]">drag to move your avatar</span>
        </div>
      )}

      {/* add tray */}
      <div className="safe-bottom absolute inset-x-0 bottom-0 px-3 pb-2 pt-2">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="flex shrink-0 items-center gap-1 pl-1 pr-1 text-xs font-bold text-[var(--lav-text)]">
            <Plus size={14} /> add
          </span>
          {ADD_KINDS.map(([kind, emoji]) => (
            <button
              key={kind}
              onClick={() => addKind(kind)}
              className="flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border border-[var(--border)] bg-grad-card px-3 py-2 shadow-elev1 active:scale-95"
            >
              <span className="text-lg leading-none">{emoji}</span>
              <span className="text-[10px] font-bold capitalize text-[var(--text2)]">{kind}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
