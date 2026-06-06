import { motion } from 'framer-motion';

// SVG bonsai with 5 growth stages (0 sprout -> 4 full bonsai). Pink pot.
export default function PlantSprite({ stage = 0, size = 200, potColors }) {
  const s = Math.max(0, Math.min(4, stage));
  const potTop = potColors?.[0] || '#ff9fc4';
  const potBot = potColors?.[1] || '#e76aa0';

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      animate={{ rotate: [-1, 1, -1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '100px 180px' }}
    >
      <defs>
        <linearGradient id="pot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={potTop} />
          <stop offset="100%" stopColor={potBot} />
        </linearGradient>
        <radialGradient id="leaf" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#9be89b" />
          <stop offset="100%" stopColor="#5bbf6b" />
        </radialGradient>
      </defs>

      {/* soil */}
      <ellipse cx="100" cy="150" rx="38" ry="8" fill="#3a2e22" />

      {s === 0 && (
        <g>
          {/* sprout */}
          <path d="M100 150 q-2 -16 0 -24" stroke="#7dd87d" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M100 132 q-14 -6 -18 -18 q14 -2 18 12" fill="url(#leaf)" />
          <path d="M100 128 q14 -6 18 -18 q-14 -2 -18 12" fill="url(#leaf)" />
        </g>
      )}

      {s === 1 && (
        <g>
          <path d="M100 150 q-3 -28 1 -42" stroke="#6b4f33" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="100" cy="104" r="22" fill="url(#leaf)" />
          <circle cx="84" cy="116" r="13" fill="url(#leaf)" />
          <circle cx="116" cy="116" r="13" fill="url(#leaf)" />
        </g>
      )}

      {s === 2 && (
        <g>
          <path d="M100 150 q-6 -34 2 -52" stroke="#6b4f33" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M102 110 q-22 -4 -34 8" stroke="#6b4f33" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="102" cy="92" r="26" fill="url(#leaf)" />
          <circle cx="70" cy="112" r="16" fill="url(#leaf)" />
          <circle cx="128" cy="100" r="15" fill="url(#leaf)" />
        </g>
      )}

      {s === 3 && (
        <g>
          <path d="M100 150 q-8 -38 4 -60" stroke="#5e4630" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M103 104 q-26 -8 -40 6 M103 96 q26 -8 38 4" stroke="#5e4630" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="104" cy="78" r="28" fill="url(#leaf)" />
          <circle cx="62" cy="104" r="20" fill="url(#leaf)" />
          <circle cx="142" cy="92" r="19" fill="url(#leaf)" />
          <circle cx="104" cy="58" r="14" fill="url(#leaf)" />
        </g>
      )}

      {s === 4 && (
        <g>
          <path d="M100 150 q-10 -42 6 -66" stroke="#5e4630" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M106 96 q-30 -10 -46 8 M106 84 q30 -10 44 6 M104 70 q-16 -10 -28 -2" stroke="#5e4630" strokeWidth="7" fill="none" strokeLinecap="round" />
          <circle cx="106" cy="62" r="30" fill="url(#leaf)" />
          <circle cx="56" cy="96" r="23" fill="url(#leaf)" />
          <circle cx="150" cy="82" r="22" fill="url(#leaf)" />
          <circle cx="78" cy="50" r="18" fill="url(#leaf)" />
          <circle cx="134" cy="52" r="17" fill="url(#leaf)" />
          {/* tiny blossoms */}
          <circle cx="60" cy="92" r="4" fill="#f5a3c7" />
          <circle cx="148" cy="84" r="4" fill="#f5a3c7" />
          <circle cx="92" cy="46" r="4" fill="#f5a3c7" />
        </g>
      )}

      {/* pot */}
      <path d="M70 150 L130 150 L122 184 q-22 8 -44 0 Z" fill="url(#pot)" />
      <rect x="66" y="144" width="68" height="10" rx="5" fill={potTop} />
      <ellipse cx="100" cy="170" rx="22" ry="5" fill="#000" opacity="0.08" />
    </motion.svg>
  );
}
