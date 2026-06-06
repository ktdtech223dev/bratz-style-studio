import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

// Tappable hotspot wrapper
function Spot({ to, children, label }) {
  const nav = useNavigate();
  return (
    <g
      onClick={() => nav(to)}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={label}
      className="room-spot"
    >
      {children}
    </g>
  );
}

// Full illustrated cozy night room with tappable furniture.
export default function RoomScene() {
  const pet = useStore((s) => s.pet);
  const plant = useStore((s) => s.plant);
  const stage = plant?.stage ?? 2;

  const decor = useStore((s) => s.decor) || {};
  const wall = decor.wall || ['#2c2f63', '#232a5c'];
  const floor = decor.floor || ['#3a2f5e', '#2a2348'];
  const pot = decor.pot || ['#ff9fc4', '#e76aa0'];
  const cat = decor.cat || { body: '#1c1830', face: '#231d38', eye: '#c084fc' };

  const stars = Array.from({ length: 22 }, (_, i) => ({
    x: 10 + ((i * 53) % 340),
    y: 8 + ((i * 37) % 120),
    r: (i % 3) * 0.5 + 0.8,
    d: (i % 5) * 0.4,
  }));

  return (
    <svg viewBox="0 0 360 520" className="w-full select-none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d3470" />
          <stop offset="55%" stopColor="#2a2a5e" />
          <stop offset="100%" stopColor="#1a1f4a" />
        </linearGradient>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wall[0]} />
          <stop offset="100%" stopColor={wall[1]} />
        </linearGradient>
        <radialGradient id="moonG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="100%" stopColor="#fde047" />
        </radialGradient>
        <linearGradient id="spot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde047" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={floor[0]} />
          <stop offset="100%" stopColor={floor[1]} />
        </linearGradient>
      </defs>

      {/* sky + window */}
      <rect x="0" y="0" width="360" height="170" fill="url(#sky)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" style={{ animation: `twinkle 3s ${s.d}s infinite` }} />
      ))}
      <circle cx="300" cy="46" r="26" fill="url(#moonG)" />
      <circle cx="291" cy="40" r="22" fill="url(#sky)" opacity="0.85" />

      {/* wall */}
      <rect x="0" y="150" width="360" height="300" fill="url(#wall)" />
      {/* roofline */}
      <path d="M0 150 L180 96 L360 150 Z" fill="#252a58" />
      <path d="M0 150 L180 96 L360 150" fill="none" stroke="#3a3f73" strokeWidth="3" />

      {/* floor */}
      <rect x="0" y="450" width="360" height="70" fill="url(#floor)" />
      <rect x="0" y="450" width="360" height="4" fill="#4a3f70" opacity="0.5" />

      {/* ── LEFT SHELF (bookshelf + bonsai) ── */}
      <polygon points="40,150 130,150 110,250 60,250" fill="url(#spot)" />
      <g>
        <rect x="48" y="196" width="78" height="58" rx="4" fill="#3a3160" stroke="#4a3f70" strokeWidth="2" />
        <rect x="48" y="222" width="78" height="3" fill="#4a3f70" />
        {/* books */}
        <rect x="54" y="200" width="6" height="20" fill="#f5a3c7" />
        <rect x="61" y="202" width="6" height="18" fill="#7dd3fc" />
        <rect x="68" y="199" width="6" height="21" fill="#9be89b" />
        <rect x="75" y="203" width="6" height="17" fill="#fde047" />
        {/* trophy */}
        <g transform="translate(104,202)">
          <path d="M0 0 h12 v5 a6 6 0 0 1 -12 0 z" fill="#fde047" />
          <rect x="4" y="9" width="4" height="5" fill="#fde047" />
          <rect x="1" y="14" width="10" height="3" rx="1" fill="#fdba74" />
        </g>
      </g>
      {/* bonsai on shelf -> /plant */}
      <Spot to="/plant" label="Our plant">
        <rect x="52" y="226" width="68" height="28" fill="transparent" />
        <g transform="translate(70,210) scale(0.9)">
          {stage >= 0 && <path d="M16 36 q-2 -14 1 -22" stroke="#6b4f33" strokeWidth="4" fill="none" />}
          <circle cx="17" cy="12" r="13" fill="#6bbf6b" />
          <circle cx="6" cy="22" r="8" fill="#7dd87d" />
          <circle cx="28" cy="20" r="8" fill="#7dd87d" />
          <path d="M6 36 L28 36 L25 48 q-9 4 -16 0 Z" fill={pot[0]} />
        </g>
      </Spot>

      {/* ── RIGHT SHELF (couple frame + map) ── */}
      <polygon points="230,150 320,150 300,250 250,250" fill="url(#spot)" />
      {/* couple frame -> /about */}
      <Spot to="/about" label="About us">
        <g transform="translate(244,196)">
          <rect x="0" y="0" width="40" height="34" rx="3" fill="#3a3160" stroke="#b8a9e8" strokeWidth="2.5" />
          <circle cx="14" cy="16" r="7" fill="#b8a9e8" />
          <circle cx="26" cy="16" r="7" fill="#f5a3c7" />
          <path d="M20 26 l-3 -4 a2 2 0 1 1 3 -1 a2 2 0 1 1 3 1 z" fill="#ff6ba8" />
        </g>
      </Spot>
      {/* world map -> /map */}
      <Spot to="/map" label="Our map">
        <g transform="translate(292,198)">
          <rect x="0" y="0" width="30" height="24" rx="2" fill="#2a3a5c" stroke="#4a3f70" strokeWidth="2" />
          <path d="M5 8 q6 -3 10 2 q5 4 11 1" stroke="#7dd3fc" strokeWidth="2" fill="none" />
          <circle cx="12" cy="14" r="1.5" fill="#ff6ba8" />
          <circle cx="22" cy="10" r="1.5" fill="#fde047" />
        </g>
      </Spot>

      {/* ── TV (decorative -> games) ── */}
      <Spot to="/games" label="Games">
        <g transform="translate(150,176)">
          <rect x="0" y="0" width="64" height="40" rx="5" fill="#15182f" stroke="#4a3f70" strokeWidth="2.5" />
          <rect x="5" y="5" width="54" height="30" rx="3" fill="#232a5c" />
          <circle cx="20" cy="20" r="6" fill="#c084fc" opacity="0.8" />
          <rect x="30" y="16" width="22" height="3" rx="1.5" fill="#7dd3fc" opacity="0.7" />
          <rect x="30" y="23" width="16" height="3" rx="1.5" fill="#9be89b" opacity="0.7" />
          <rect x="26" y="40" width="12" height="6" fill="#15182f" />
        </g>
      </Spot>

      {/* ── SPEAKER w/ music notes -> /music ── */}
      <Spot to="/music" label="Music">
        <g transform="translate(22,330)">
          <rect x="0" y="0" width="34" height="70" rx="8" fill="#2a2440" stroke="#4a3f70" strokeWidth="2" />
          <circle cx="17" cy="22" r="11" fill="#15182f" />
          <circle cx="17" cy="22" r="5" fill="#67e8f9" opacity="0.7" />
          <circle cx="17" cy="50" r="7" fill="#15182f" />
          <motion.text x="44" y="20" fontSize="18" fill="#67e8f9" animate={{ y: [20, 12, 20], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
            ♪
          </motion.text>
          <motion.text x="56" y="34" fontSize="14" fill="#c084fc" animate={{ y: [34, 26, 34], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.4, repeat: Infinity, delay: 0.4 }}>
            ♫
          </motion.text>
        </g>
      </Spot>

      {/* ── ARMCHAIR w/ CAT -> /pet ── */}
      <Spot to="/pet" label="Our pet">
        <g transform="translate(232,300)">
          {/* chair */}
          <rect x="0" y="40" width="96" height="70" rx="18" fill="#e76aa0" />
          <rect x="-8" y="46" width="22" height="56" rx="12" fill="#d75c90" />
          <rect x="82" y="46" width="22" height="56" rx="12" fill="#d75c90" />
          <rect x="6" y="20" width="84" height="44" rx="16" fill="#f5a3c7" />
          <rect x="14" y="96" width="14" height="20" rx="4" fill="#3a2f5e" />
          <rect x="68" y="96" width="14" height="20" rx="4" fill="#3a2f5e" />
          {/* cat */}
          <g transform="translate(30,6) scale(0.42)">
            <path d="M58 168 q-14 -70 42 -78 q56 8 42 78 z" fill={cat.body} />
            <path d="M64 78 L58 44 L88 66 Z" fill={cat.body} />
            <path d="M136 78 L142 44 L112 66 Z" fill={cat.body} />
            <ellipse cx="100" cy="92" rx="46" ry="40" fill={cat.face} />
            <ellipse cx="82" cy="90" rx="6" ry="6" fill={cat.eye} />
            <ellipse cx="118" cy="90" rx="6" ry="6" fill={cat.eye} />
            <path d="M97 100 L103 100 L100 104 Z" fill="#f5a3c7" />
          </g>
        </g>
      </Spot>

      {/* ── COFFEE TABLE w/ book + heart envelope ── */}
      <g transform="translate(120,420)">
        <rect x="0" y="14" width="120" height="14" rx="5" fill="#5e4630" />
        <rect x="8" y="28" width="8" height="22" fill="#4a3726" />
        <rect x="104" y="28" width="8" height="22" fill="#4a3726" />
        {/* open book -> /diary */}
        <Spot to="/diary" label="Diary">
          <g transform="translate(14,-2)">
            <path d="M0 12 q18 -8 36 0 v6 q-18 -6 -36 0 z" fill="#fef3e2" />
            <path d="M0 12 q-2 -2 0 0 M18 8 v10" stroke="#c9bfae" strokeWidth="1.5" fill="none" />
            <line x1="4" y1="14" x2="14" y2="13" stroke="#b8a9e8" strokeWidth="1" />
            <line x1="22" y1="13" x2="32" y2="14" stroke="#b8a9e8" strokeWidth="1" />
          </g>
        </Spot>
        {/* heart envelope -> /notes */}
        <Spot to="/notes" label="Notes">
          <g transform="translate(74,2)">
            <rect x="0" y="0" width="28" height="20" rx="3" fill="#fff" />
            <path d="M0 1 L14 12 L28 1" fill="none" stroke="#d9d3ea" strokeWidth="1.5" />
            <path d="M14 9 l-3 -3 a2 2 0 1 1 3 -1 a2 2 0 1 1 3 1 z" fill="#ff6ba8" />
          </g>
        </Spot>
      </g>

      {/* ── VASE / flowers (decorative) ── */}
      <g transform="translate(300,396)">
        <path d="M0 14 q8 22 16 0 q-2 -6 -8 -6 q-6 0 -8 6 z" fill="#b8a9e8" />
        <circle cx="2" cy="6" r="4" fill="#f5a3c7" />
        <circle cx="10" cy="2" r="4" fill="#fde047" />
        <circle cx="16" cy="8" r="4" fill="#9be89b" />
      </g>
    </svg>
  );
}
