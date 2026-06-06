import { motion } from 'framer-motion';

// SVG black cat, sitting/curled. Eyes + posture shift by mood.
export default function PetSprite({ mood = 'Content', size = 200, colors }) {
  const happy = mood === 'Happy';
  const sad = mood === 'Sad' || mood === 'Lonely';
  const pensive = mood === 'Pensive';

  const body = colors?.body || '#1c1830';
  const face = colors?.face || '#3a3550';

  // eye shape per mood
  const eyeRy = happy ? 7 : sad ? 2.5 : pensive ? 3.5 : 6;
  const eyeColor = happy ? '#9be89b' : sad ? '#7dd3fc' : '#c084fc';
  const blush = happy;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="catBody" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={face} />
          <stop offset="100%" stopColor={body} />
        </radialGradient>
      </defs>

      {/* tail curling around */}
      <motion.path
        d="M150 150 q40 -10 28 -45 q-8 -22 -30 -16"
        fill="none"
        stroke={body}
        strokeWidth="16"
        strokeLinecap="round"
        animate={{ rotate: happy ? [0, 4, 0] : 0 }}
        transition={{ duration: 1.6, repeat: Infinity }}
        style={{ transformOrigin: '160px 130px' }}
      />

      {/* body */}
      <path d="M58 168 q-14 -70 42 -78 q56 8 42 78 z" fill="url(#catBody)" />

      {/* head */}
      <g>
        {/* ears */}
        <path d="M64 78 L58 44 L88 66 Z" fill={body} />
        <path d="M136 78 L142 44 L112 66 Z" fill={body} />
        <path d="M68 70 L66 54 L80 66 Z" fill="#5b4a78" />
        <path d="M132 70 L134 54 L120 66 Z" fill="#5b4a78" />
        {/* face */}
        <ellipse cx="100" cy="92" rx="46" ry="40" fill="url(#catBody)" />

        {/* eyes */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 4 }}
          style={{ transformOrigin: '100px 88px' }}
        >
          <ellipse cx="82" cy="88" rx="6.5" ry={eyeRy} fill={eyeColor} />
          <ellipse cx="118" cy="88" rx="6.5" ry={eyeRy} fill={eyeColor} />
          <circle cx="83.5" cy={86} r="1.8" fill="#fff" opacity="0.9" />
          <circle cx="119.5" cy={86} r="1.8" fill="#fff" opacity="0.9" />
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
        <g stroke="#6b6896" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
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
      <ellipse cx="84" cy="168" rx="13" ry="9" fill="#2a2440" />
      <ellipse cx="116" cy="168" rx="13" ry="9" fill="#2a2440" />
    </motion.svg>
  );
}
