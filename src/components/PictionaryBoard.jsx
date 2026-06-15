import { useEffect, useRef, useState } from 'react';
import { Eraser, Send } from 'lucide-react';
import { getSocket } from '../lib/socket';

const W = 600;
const COLORS = ['#1a1f2e', '#ff6ba8', '#7dd3fc', '#9be89b', '#fde047', '#fb923c', '#c084fc', '#ffffff'];

export default function PictionaryBoard({ match, me, emit }) {
  const state = match.state || {};
  const amDrawer = state.drawer === me?.id;
  const solved = state.solved;
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(null); // current stroke being drawn
  const [color, setColor] = useState('#1a1f2e');
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState(state.guesses || []);

  // (re)draw a full set of strokes
  function drawStroke(ctx, st) {
    if (!st || !st.points || st.points.length === 0) return;
    ctx.strokeStyle = st.color || '#1a1f2e';
    ctx.lineWidth = st.width || 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    st.points.forEach(([x, y], i) => {
      const px = x * W;
      const py = y * W;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
  function redrawAll(strokes) {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, W, W);
    (strokes || []).forEach((st) => drawStroke(ctx, st));
  }

  useEffect(() => {
    const c = canvasRef.current;
    c.width = W;
    c.height = W;
    ctxRef.current = c.getContext('2d');
    redrawAll(state.strokes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // redraw when the persisted strokes change (e.g. refresh / first load)
  useEffect(() => {
    redrawAll(state.strokes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id, (state.strokes || []).length]);

  useEffect(() => {
    setGuesses(state.guesses || []);
  }, [match.id, (state.guesses || []).length]);

  // live socket events (strokes from the drawer, guesses)
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onStroke = ({ matchId, stroke }) => {
      if (matchId !== match.id) return;
      drawStroke(ctxRef.current, stroke);
    };
    const onClear = ({ matchId }) => {
      if (matchId !== match.id) return;
      ctxRef.current?.clearRect(0, 0, W, W);
    };
    const onGuess = ({ matchId, guess: g }) => {
      if (matchId !== match.id) return;
      setGuesses((prev) => [...prev, g]);
    };
    s.on('pictionary:stroke', onStroke);
    s.on('pictionary:clear', onClear);
    s.on('pictionary:guess', onGuess);
    return () => {
      s.off('pictionary:stroke', onStroke);
      s.off('pictionary:clear', onClear);
      s.off('pictionary:guess', onGuess);
    };
  }, [match.id]);

  function pos(e) {
    const r = canvasRef.current.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  }
  function down(e) {
    if (!amDrawer || solved) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = { points: [pos(e)], color, width: color === '#ffffff' ? 14 : 5 };
  }
  function move(e) {
    if (!amDrawer || solved || !drawingRef.current) return;
    const p = pos(e);
    const st = drawingRef.current;
    const prev = st.points[st.points.length - 1];
    st.points.push(p);
    const ctx = ctxRef.current;
    ctx.strokeStyle = st.color;
    ctx.lineWidth = st.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(prev[0] * W, prev[1] * W);
    ctx.lineTo(p[0] * W, p[1] * W);
    ctx.stroke();
  }
  function up() {
    if (!amDrawer || !drawingRef.current) return;
    const st = drawingRef.current;
    drawingRef.current = null;
    if (st.points.length > 0) emit('pictionary:stroke', { matchId: match.id, stroke: st });
  }
  function clear() {
    if (!amDrawer) return;
    ctxRef.current?.clearRect(0, 0, W, W);
    emit('pictionary:clear', { matchId: match.id });
  }
  function submitGuess() {
    if (!guess.trim()) return;
    emit('pictionary:guess', { matchId: match.id, text: guess.trim() });
    setGuess('');
  }

  return (
    <div>
      {/* word / prompt */}
      <div className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
        {amDrawer ? (
          <span className="text-base font-extrabold">
            Draw: <span className="uppercase tracking-wide text-[var(--green)]">{state.word}</span>
          </span>
        ) : solved ? (
          <span className="text-base font-extrabold">
            It was <span className="uppercase text-[var(--green)]">{state.word}</span> 🎉
          </span>
        ) : (
          <span className="text-base font-extrabold text-[var(--lav-text)]">guess what they're drawing 👀</span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full touch-none rounded-2xl bg-white"
        style={{ aspectRatio: '1 / 1', cursor: amDrawer ? 'crosshair' : 'default' }}
      />

      {/* drawer tools */}
      {amDrawer && !solved && (
        <div className="mt-3 flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full"
              style={{
                background: c,
                boxShadow: color === c ? '0 0 0 3px var(--pink-hot)' : 'inset 0 0 0 1px rgba(0,0,0,0.2)',
              }}
            />
          ))}
          <button
            onClick={clear}
            className="ml-auto flex items-center gap-1 rounded-xl bg-[var(--card)] px-3 py-1.5 text-xs font-bold"
          >
            <Eraser size={14} /> Clear
          </button>
        </div>
      )}

      {/* guesser input */}
      {!amDrawer && !solved && (
        <div className="mt-3 flex gap-2">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
            placeholder="type your guess…"
            className="flex-1 rounded-2xl bg-[var(--card)] px-4 py-3 font-semibold"
          />
          <button
            onClick={submitGuess}
            className="flex items-center justify-center rounded-2xl bg-[var(--pink-hot)] px-4 font-extrabold text-white active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      )}

      {/* guesses feed */}
      {guesses.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {guesses.slice(-6).map((g, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm"
              style={{ background: g.correct ? '#9be89b22' : 'var(--card)' }}
            >
              <span className="font-bold">{g.by === me?.id ? 'You' : 'Them'}:</span>
              <span className={g.correct ? 'font-bold text-[var(--green)]' : ''}>{g.text}</span>
              {g.correct && <span className="ml-auto">✅</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
