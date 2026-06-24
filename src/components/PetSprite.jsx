import { motion } from 'framer-motion';

// SVG cat, sitting/curled. Eyes + posture shift by mood.
// colors: { body, face, eye } — purchased cat skins flow in here (with fallbacks).
export default function PetSprite({ mood = 'Content', size = 200, colors }) {
  const happy = mood === 'Happy';
  const sad = mood === 'Sad' || mood === 'Lonely';
  const pensive = mood === 'Pensive';

  const body = colors?.body || '#1c1830';
  const face = colors?.face || '#3a3550';
  // ear inner + paw shades derive from the skin so every cat reads as one creature
  const earInner = mix(face, '#ffb3c6', 0.4);
  const pawShade = mix(body, '#000000', 0.18);

  // eye shape per mood; the purchased eye color tints, mood still nudges it
  const eyeRy = happy ? 7 : sad ? 2.5 : pensive ? 3.5 : 6;
  const moodEye = happy ? '#9be89b' : sad ? '#7dd3fc' : '#c084fc';
  const eyeColor = colors?.eye || moodEye;
  const blush = happy;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      animate={{ scale: [1, 1.03, 1], y: [0, -2, 0] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="catBody" cx="50%" cy="32%" r="72%">
          <stop offset="0%" stopColor={face} />
          <stop offset="70%" stopColor={mix(body, face, 0.35)} />
          <stop offset="100%" stopColor={body} />
        </radialGradient>
        <radialGradient id="catBelly" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor={mix(face, '#ffffff', 0.5)} stopOpacity="0.5" />
          <stop offset="100%" stopColor={face} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="catEye" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={mix(eyeColor, '#ffffff', 0.45)} />
          <stop offset="100%" stopColor={eyeColor} />
        </radialGradient>
      </defs>

      {/* soft ground shadow */}
      <ellipse cx="100" cy="180" rx="48" ry="9" fill="#000" opacity="0.22" />

      {/* tail curling around */}
      <motion.path
        d="M150 150 q40 -10 28 -45 q-8 -22 -30 -16"
        fill="none"
        stroke={body}
        strokeWidth="16"
        strokeLinecap="round"
        animate={{ rotate: happy ? [0, 5, 0] : [0, 1.5, 0] }}
        transition={{ duration: happy ? 1.4 : 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '160px 130px' }}
      />

      {/* body */}
      <path d="M58 168 q-14 -70 42 -78 q56 8 42 78 z" fill="url(#catBody)" />
      {/* belly highlight */}
      <ellipse cx="100" cy="150" rx="30" ry="24" fill="url(#catBelly)" />

      {/* head */}
      <g>
        {/* ears */}
        <path d="M64 78 L58 44 L88 66 Z" fill={body} />
        <path d="M136 78 L142 44 L112 66 Z" fill={body} />
        <path d="M68 70 L66 54 L80 66 Z" fill={earInner} />
        <path d="M132 70 L134 54 L120 66 Z" fill={earInner} />
        {/* face */}
        <ellipse cx="100" cy="92" rx="46" ry="40" fill="url(#catBody)" />
        {/* forehead sheen */}
        <ellipse cx="92" cy="74" rx="20" ry="10" fill="#fff" opacity="0.07" />

        {/* eyes */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 4 }}
          style={{ transformOrigin: '100px 88px' }}
        >
          <ellipse cx="82" cy="88" rx="6.5" ry={eyeRy} fill="url(#catEye)" />
          <ellipse cx="118" cy="88" rx="6.5" ry={eyeRy} fill="url(#catEye)" />
          {/* pupils (slit when not happy) */}
          {!happy && (
            <>
              <ellipse cx="82" cy="88" rx="1.8" ry={Math.max(1, eyeRy - 1)} fill="#1a1326" opacity="0.7" />
              <ellipse cx="118" cy="88" rx="1.8" ry={Math.max(1, eyeRy - 1)} fill="#1a1326" opacity="0.7" />
            </>
          )}
          <circle cx="83.5" cy={86} r="1.8" fill="#fff" opacity="0.95" />
          <circle cx="119.5" cy={86} r="1.8" fill="#fff" opacity="0.95" />
        </motion.g>

        {/* nose + mouth */}
        <path d="M97 100 L103 100 L100 104 Z" fill="#f5a3c7" />
        {happy ? (
          <path d="M92 106 q8 7 16 0" fill="none" stroke="#5b4a78" strokeWidth="2.5" strokeLinecap="round" />
        ) : sad ? (
          <path d="M92 110 q8 -6 16 0" fill="none" stroke="#5b4a78" strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          <path d="M100 104 L100 108 M94 110 q6 3 12 0 M106 110 q-6 3 -12 0" fill="none" stroke="#5b4a78" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* whiskers */}
        <g stroke="#cfc9e8" strokeWidth="1.5" strokeLinecap="round" opacity="0.55">
          <line x1="58" y1="98" x2="38" y2="94" />
          <line x1="58" y1="104" x2="38" y2="106" />
          <line x1="142" y1="98" x2="162" y2="94" />
          <line x1="142" y1="104" x2="162" y2="106" />
        </g>

        {blush && (
          <>
            <ellipse cx="74" cy="102" rx="7" ry="4" fill="#ff6ba8" opacity="0.35" />
            <ellipse cx="126" cy="102" rx="7" ry="4" fill="#ff6ba8" opacity="0.35" />
          </>
        )}
      </g>

      {/* paws */}
      <ellipse cx="84" cy="168" rx="13" ry="9" fill={pawShade} />
      <ellipse cx="116" cy="168" rx="13" ry="9" fill={pawShade} />
      {/* toe lines */}
      <g stroke={mix(pawShade, '#000', 0.3)} strokeWidth="1" opacity="0.5">
        <line x1="84" y1="161" x2="84" y2="170" />
        <line x1="116" y1="161" x2="116" y2="170" />
      </g>
    </motion.svg>
  );
}

// Blend two hex colors. Tolerates undefined / short hex by falling back gracefully.
function mix(a, b, t) {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a || b || '#000000';
  const ch = (i) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
}
function parseHex(h) {
  if (typeof h !== 'string') return null;
  let s = h.trim().replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  if (s.length !== 6) return null;
  const n = parseInt(s, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
