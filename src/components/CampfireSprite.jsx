import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Bespoke hand-crafted campfire — no emoji.
// A stacked log pile, a glowing ember bed, layered flame tongues that flicker &
// sway, rising sparks and a soft radial glow. Everything scales with `fuel`.
//
// Props:
//   fuel  (0-100)  flame size/width/glow scale with it; <=0 => dim embers + smoke
//   size  (px)
//   burst (number) increments on stoke -> flame LEAPS + extra spark shower
export default function CampfireSprite({ fuel = 50, size = 200, burst }) {
  const out = fuel <= 0;
  // normalised fire strength (kept off the floor so a low fire still reads as fire)
  const f = Math.max(0.32, Math.min(1, fuel / 100));

  // ── stoke reaction ──────────────────────────────────────────────
  const [leap, setLeap] = useState(0); // 0..1 extra height during a stoke
  const [sparkBursts, setSparkBursts] = useState([]); // transient ember showers
  useEffect(() => {
    if (burst === undefined || burst === null) return;
    let raf;
    setLeap(1);
    const start = performance.now();
    const dur = 700;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      // quick punch up, slow settle
      setLeap(t < 0.25 ? 1 : 1 - (t - 0.25) / 0.75);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setLeap(0);
    };
    raf = requestAnimationFrame(tick);

    const id = burst;
    const embers = Array.from({ length: 12 }, (_, i) => ({
      i,
      x: (Math.random() - 0.5) * size * 0.5,
      rise: size * (0.35 + Math.random() * 0.45),
      r: 1.4 + Math.random() * 2.6,
      delay: Math.random() * 0.12,
      dur: 0.6 + Math.random() * 0.6,
      hue: Math.random() > 0.5 ? '#fde047' : '#fb923c',
    }));
    setSparkBursts((b) => [...b, { id, embers }]);
    const to = setTimeout(() => setSparkBursts((b) => b.filter((x) => x.id !== id)), 1400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(to);
    };
  }, [burst, size]);

  const cx = 100;
  const baseY = 158; // top of the log pile / base of the flames
  // flame vertical reach grows with fuel and during a leap
  const reach = (0.55 + f * 0.85 + leap * 0.5);
  const glowR = size * (0.34 + f * 0.36 + leap * 0.12);
  const glowA = out ? 0.06 : 0.18 + f * 0.34 + leap * 0.2;

  return (
    <div
      style={{ width: size, height: size }}
      className="relative mx-auto flex items-end justify-center overflow-visible"
    >
      {/* soft radial heat glow */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: size * 0.1,
          width: glowR * 2,
          height: glowR * 2,
          background: `radial-gradient(circle, rgba(251,146,60,${glowA}) 0%, rgba(251,146,60,${glowA * 0.5}) 35%, transparent 68%)`,
          transition: 'all .25s ease-out',
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="relative z-10 overflow-visible"
      >
        <defs>
          <radialGradient id="cf-glow" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#fff1b8" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#fdba74" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fdba74" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cf-flame-out" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#fb6a3c" />
            <stop offset="55%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#fdba74" />
          </linearGradient>
          <linearGradient id="cf-flame-mid" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="60%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
          <linearGradient id="cf-flame-core" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="70%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fffbeb" />
          </linearGradient>
          <linearGradient id="cf-log" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7a5230" />
            <stop offset="50%" stopColor="#a06b3c" />
            <stop offset="100%" stopColor="#5e3f24" />
          </linearGradient>
          <radialGradient id="cf-log-end" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c98a5e" />
            <stop offset="60%" stopColor="#8a5a34" />
            <stop offset="100%" stopColor="#5e3f24" />
          </radialGradient>
        </defs>

        {/* ───────── ember bed (glowing coals under the logs) ───────── */}
        <g>
          <ellipse cx={cx} cy={166} rx={42} ry={11} fill="#1a0f08" opacity="0.6" />
          {[
            [80, 165, 6],
            [100, 168, 7],
            [120, 165, 6],
            [92, 163, 4],
            [110, 163, 4],
          ].map(([ex, ey, er], k) => (
            <motion.circle
              key={k}
              cx={ex}
              cy={ey}
              r={er}
              fill={out ? '#5e2b18' : '#ff7a2e'}
              animate={
                out
                  ? { opacity: [0.3, 0.5, 0.3] }
                  : { opacity: [0.55, 1, 0.7], fill: ['#ff7a2e', '#ffd166', '#ff7a2e'] }
              }
              transition={{ duration: 1.4 + k * 0.3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ filter: out ? 'none' : 'drop-shadow(0 0 5px #ff7a2e)' }}
            />
          ))}
        </g>

        {/* ───────── stacked log pile ───────── */}
        <g>
          {/* back log */}
          <g transform={`rotate(-14 ${cx} ${baseY})`}>
            <rect x="62" y={baseY + 2} width="76" height="15" rx="7.5" fill="url(#cf-log)" />
            <ellipse cx="62" cy={baseY + 9.5} rx="5" ry="7.5" fill="url(#cf-log-end)" />
            <path d="M62 168 q3 -2 0 -4" stroke="#3f2a18" strokeWidth="1" fill="none" opacity="0.4" />
          </g>
          {/* front log */}
          <g transform={`rotate(13 ${cx} ${baseY})`}>
            <rect x="60" y={baseY + 6} width="80" height="16" rx="8" fill="url(#cf-log)" />
            <ellipse cx="140" cy={baseY + 14} rx="5.2" ry="8" fill="url(#cf-log-end)" />
            {/* bark grooves */}
            <line x1="74" y1={baseY + 10} x2="128" y2={baseY + 10} stroke="#5e3f24" strokeWidth="1.2" opacity="0.5" />
            <line x1="74" y1={baseY + 18} x2="128" y2={baseY + 18} stroke="#5e3f24" strokeWidth="1.2" opacity="0.5" />
          </g>
        </g>

        {/* ───────── flame tongues (only when lit) ───────── */}
        {!out && (
          <g style={{ transformOrigin: `${cx}px ${baseY}px` }}>
            {/* outer tongue — broad, slow sway */}
            <motion.path
              fill="url(#cf-flame-out)"
              style={{ transformOrigin: `${cx}px ${baseY}px` }}
              animate={{
                d: [
                  flamePath(cx, baseY, 30 * f, 80 * reach, -4),
                  flamePath(cx, baseY, 33 * f, 92 * reach, 6),
                  flamePath(cx, baseY, 28 * f, 84 * reach, -3),
                  flamePath(cx, baseY, 30 * f, 80 * reach, -4),
                ],
                x: [-2, 3, -1, -2],
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              opacity={0.92}
            />
            {/* mid tongue */}
            <motion.path
              fill="url(#cf-flame-mid)"
              style={{ transformOrigin: `${cx}px ${baseY}px` }}
              animate={{
                d: [
                  flamePath(cx, baseY, 20 * f, 60 * reach, 5),
                  flamePath(cx, baseY, 22 * f, 70 * reach, -6),
                  flamePath(cx, baseY, 18 * f, 64 * reach, 4),
                  flamePath(cx, baseY, 20 * f, 60 * reach, 5),
                ],
                x: [2, -3, 1, 2],
              }}
              transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* inner hot core */}
            <motion.path
              fill="url(#cf-flame-core)"
              style={{ transformOrigin: `${cx}px ${baseY}px` }}
              animate={{
                d: [
                  flamePath(cx, baseY, 11 * f, 38 * reach, -3),
                  flamePath(cx, baseY, 13 * f, 46 * reach, 4),
                  flamePath(cx, baseY, 10 * f, 40 * reach, -2),
                  flamePath(cx, baseY, 11 * f, 38 * reach, -3),
                ],
              }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* tiny detached flicker tongue */}
            <motion.path
              fill="url(#cf-flame-mid)"
              animate={{
                d: [
                  flamePath(cx - 14, baseY - 6, 7 * f, 24 * reach, 0),
                  flamePath(cx - 12, baseY - 14, 6 * f, 30 * reach, 6),
                  flamePath(cx - 16, baseY - 4, 7 * f, 22 * reach, -4),
                  flamePath(cx - 14, baseY - 6, 7 * f, 24 * reach, 0),
                ],
                opacity: [0.8, 0.4, 0.9, 0.8],
              }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}

        {/* ───────── continuous rising sparks (when lit) ───────── */}
        {!out &&
          [0, 1, 2, 3].map((i) => (
            <motion.circle
              key={i}
              cx={cx + (i - 1.5) * 12}
              r={1.6 + (i % 2)}
              fill={i % 2 ? '#fde047' : '#fb923c'}
              initial={{ cy: baseY - 4, opacity: 0 }}
              animate={{
                cy: [baseY - 4, baseY - 40 - 50 * reach],
                cx: [cx + (i - 1.5) * 12, cx + (i - 1.5) * 12 + (i % 2 ? 10 : -8)],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.6 + i * 0.3,
                repeat: Infinity,
                ease: 'easeOut',
                delay: i * 0.4,
              }}
              style={{ filter: 'drop-shadow(0 0 3px #fb923c)' }}
            />
          ))}

        {/* ───────── smoke wisps (when out) ───────── */}
        {out &&
          [0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d={`M${cx + (i - 1) * 10} 160 q${i % 2 ? 14 : -14} -22 ${i % 2 ? 4 : -4} -44 q${i % 2 ? -12 : 12} -18 0 -36`}
              fill="none"
              stroke="#8a86a8"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: [0, 0.35, 0], y: [0, -10, -22] }}
              transition={{ duration: 3.2 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
            />
          ))}

        {/* ───────── transient stoke ember shower ───────── */}
        <AnimatePresence>
          {sparkBursts.map((b) =>
            b.embers.map((e) => (
              <motion.circle
                key={`${b.id}-${e.i}`}
                cx={cx + e.x}
                r={e.r}
                fill={e.hue}
                initial={{ cy: baseY - 8, opacity: 0 }}
                animate={{
                  cy: baseY - 8 - e.rise,
                  cx: cx + e.x * 1.6,
                  opacity: [0, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: e.dur, delay: e.delay, ease: 'easeOut' }}
                style={{ filter: 'drop-shadow(0 0 4px #fde047)' }}
              />
            ))
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}

// Build a teardrop/tongue flame path rooted at (x,baseY), `w` wide, `h` tall,
// with `lean` px of horizontal lean at the tip for a swaying look.
function flamePath(x, baseY, w, h, lean) {
  const tipX = x + lean;
  const tipY = baseY - h;
  const midY = baseY - h * 0.45;
  return [
    `M${x - w} ${baseY}`,
    // left edge up to tip
    `C${x - w * 0.7} ${midY} ${tipX - w * 0.35} ${tipY + h * 0.18} ${tipX} ${tipY}`,
    // tip down right edge
    `C${tipX + w * 0.35} ${tipY + h * 0.18} ${x + w * 0.7} ${midY} ${x + w} ${baseY}`,
    // base curl
    `Q${x} ${baseY + 8} ${x - w} ${baseY}`,
    'Z',
  ].join(' ');
}
