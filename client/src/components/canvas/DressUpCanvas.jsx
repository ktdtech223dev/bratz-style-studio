import React, { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import clothing from '../../data/clothing';
import characters from '../../data/characters';

// Color name → hex
const COLOR_MAP = {
  pink: '#FF69B4', 'hot-pink': '#FF1493', magenta: '#E91E8C',
  black: '#1a1a2e', white: '#F8F8FF', red: '#DC143C',
  blue: '#4169E1', purple: '#9B59B6', green: '#2ECC71',
  gold: '#FFD700', silver: '#C0C0C0', orange: '#FF8C00',
  yellow: '#FFD700', brown: '#8B4513', beige: '#DEB887',
  denim: '#4682B4', multicolor: '#FF69B4', lavender: '#C9B1E8',
  coral: '#FF7F50', teal: '#008080', burgundy: '#800020',
  cream: '#FFFDD0', grey: '#A0A0A0', gray: '#A0A0A0',
  nude: '#E8C9A0', camel: '#C19A6B', sage: '#9CAF88',
  mint: '#98FF98', olive: '#808000', rust: '#B7410E',
  champagne: '#F7E7CE', ivory: '#FFFFF0', lime: '#32CD32',
};

function resolveColor(color) {
  if (!color) return '#FF69B4';
  if (color.startsWith('#')) return color;
  return COLOR_MAP[color.toLowerCase()] || '#FF69B4';
}

// Generate a clothing overlay SVG (300x560 canvas coords)
// Each slot draws the garment at the correct body position
function makeClothingOverlay(item) {
  const fill = resolveColor(item.color);
  // Slightly darker shade for details
  const dark = fill + 'CC';

  const shapes = {
    'tops-layer': `
      <!-- Torso fabric -->
      <path d="M118 195 Q115 190 100 188 Q85 190 82 195
               L78 250 Q85 258 100 260 Q115 258 122 250 Z"
            fill="${fill}" stroke="#111" stroke-width="2"/>
      <!-- Left sleeve -->
      <path d="M82 195 Q75 195 68 205 Q65 220 70 228 Q76 222 80 215 L82 205 Z"
            fill="${fill}" stroke="#111" stroke-width="2"/>
      <!-- Right sleeve -->
      <path d="M118 195 Q125 195 132 205 Q135 220 130 228 Q124 222 120 215 L118 205 Z"
            fill="${fill}" stroke="#111" stroke-width="2"/>`,

    'bottoms-layer': `
      <!-- Skirt/pants -->
      <path d="M82 258 Q85 258 100 260 Q115 258 118 258
               L122 330 Q110 340 100 340 Q90 340 78 330 Z"
            fill="${fill}" stroke="#111" stroke-width="2"/>
      <!-- Waistband -->
      <rect x="80" y="255" width="40" height="8" rx="3"
            fill="${dark}" stroke="#111" stroke-width="1.5"/>`,

    'shoes-layer': `
      <!-- Left shoe -->
      <ellipse cx="91" cy="456" rx="16" ry="8" fill="${fill}" stroke="#111" stroke-width="2"/>
      <rect x="82" y="442" width="12" height="16" rx="4" fill="${fill}" stroke="#111" stroke-width="2"/>
      <!-- Right shoe -->
      <ellipse cx="109" cy="456" rx="16" ry="8" fill="${fill}" stroke="#111" stroke-width="2"/>
      <rect x="106" y="442" width="12" height="16" rx="4" fill="${fill}" stroke="#111" stroke-width="2"/>`,

    'outerwear-layer': `
      <path d="M115 188 Q125 185 138 190 L145 250 Q130 260 118 258 L122 250 L120 195 Z"
            fill="${fill}" stroke="#111" stroke-width="2"/>
      <path d="M85 188 Q75 185 62 190 L55 250 Q70 260 82 258 L78 250 L80 195 Z"
            fill="${fill}" stroke="#111" stroke-width="2"/>
      <path d="M85 188 Q100 185 115 188 L118 258 Q100 265 82 258 Z"
            fill="${fill}" stroke="#111" stroke-width="2" opacity="0.9"/>`,

    'neck-layer': `
      <path d="M90 180 Q100 175 110 180 Q112 188 100 190 Q88 188 90 180 Z"
            fill="${fill}" stroke="#111" stroke-width="1.5"/>`,

    'headwear-layer': `
      <path d="M60 155 Q65 130 100 125 Q135 130 140 155 L142 165 L58 165 Z"
            fill="${fill}" stroke="#111" stroke-width="2"/>
      <rect x="56" y="162" width="88" height="10" rx="4" fill="${dark}" stroke="#111" stroke-width="1.5"/>`,

    'socks-tights-layer': `
      <rect x="82" y="400" width="16" height="50" rx="6" fill="${fill}" stroke="#111" stroke-width="1.5" opacity="0.9"/>
      <rect x="102" y="400" width="16" height="50" rx="6" fill="${fill}" stroke="#111" stroke-width="1.5" opacity="0.9"/>`,

    'makeup-layer': `
      <!-- Eyeshadow L -->
      <ellipse cx="88" cy="166" rx="11" ry="5" fill="${fill}" opacity="0.45"/>
      <!-- Eyeshadow R -->
      <ellipse cx="112" cy="166" rx="11" ry="5" fill="${fill}" opacity="0.45"/>
      <!-- Lip tint -->
      <path d="M92 182 Q100 186 108 182 Q104 190 100 191 Q96 190 92 182 Z"
            fill="${fill}" opacity="0.6"/>`,

    'ear-layer': `
      <!-- Left earring -->
      <circle cx="72" cy="175" r="5" fill="${fill}" stroke="#111" stroke-width="1.5"/>
      <!-- Right earring -->
      <circle cx="128" cy="175" r="5" fill="${fill}" stroke="#111" stroke-width="1.5"/>`,

    'wrist-layer': `
      <rect x="66" y="268" width="16" height="8" rx="3" fill="${fill}" stroke="#111" stroke-width="1.5"/>
      <rect x="118" y="268" width="16" height="8" rx="3" fill="${fill}" stroke="#111" stroke-width="1.5"/>`,

    'bag-layer': `
      <rect x="132" y="220" width="28" height="36" rx="6" fill="${fill}" stroke="#111" stroke-width="2"/>
      <path d="M138 220 Q138 208 146 208 Q154 208 154 220" fill="none" stroke="#111" stroke-width="2"/>
      <rect x="140" y="232" width="10" height="6" rx="2" fill="${dark}"/>`,
  };

  const body = shapes[item.slot] || shapes['tops-layer'];

  // Legendary shimmer overlay
  const legendaryFx = item.rarity === 'legendary' ? `
    <defs>
      <linearGradient id="holo_${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFD700" stop-opacity="0.3">
          <animate attributeName="stop-opacity" values="0.1;0.5;0.1" dur="2s" repeatCount="indefinite"/>
        </stop>
        <stop offset="100%" stop-color="#FF69B4" stop-opacity="0.2">
          <animate attributeName="stop-opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite"/>
        </stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="200" height="400" fill="url(#holo_${item.id})"/>` : '';

  return (
    `data:image/svg+xml,` +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 560">${legendaryFx}${body}</svg>`
    )
  );
}

export default function DressUpCanvas() {
  const outfit = useGameStore((s) => s.outfit);
  const [spinning, setSpinning] = useState(false);

  const charData = useMemo(
    () => characters.find((c) => c.id === outfit.character) || characters[0],
    [outfit.character]
  );

  // Build sorted list of equipped clothing overlays
  const clothingLayers = useMemo(() => {
    const SLOT_Z = {
      'socks-tights-layer': 1, 'shoes-layer': 2, 'bottoms-layer': 3,
      'tops-layer': 4, 'outerwear-layer': 5, 'neck-layer': 6,
      'wrist-layer': 7, 'bag-layer': 8, 'makeup-layer': 9,
      'ear-layer': 10, 'headwear-layer': 11,
    };

    return Object.entries(outfit.equipped || {})
      .map(([slot, itemId]) => {
        const item = clothing.find((c) => c.id === itemId);
        if (!item) return null;
        return { item, slot, z: SLOT_Z[slot] ?? 5 };
      })
      .filter(Boolean)
      .sort((a, b) => a.z - b.z);
  }, [outfit.equipped]);

  const equippedCount = clothingLayers.length;

  const handleTap = () => {
    if (equippedCount >= 3 && !spinning) {
      setSpinning(true);
      setTimeout(() => setSpinning(false), 700);
    }
  };

  const charSrc = `/assets/characters/${outfit.character}/body.svg`;

  return (
    <div
      className="relative select-none mx-auto"
      onClick={handleTap}
      style={{
        width: '100%',
        maxWidth: 300,
        aspectRatio: '300 / 560',
        border: '3px solid #FF1493',
        boxShadow: '4px 4px 0 #C2185B, 0 8px 32px rgba(255,20,147,0.3)',
        borderRadius: 6,
        overflow: 'hidden',
        background: '#FFF0F5',
        cursor: equippedCount >= 3 ? 'pointer' : 'default',
      }}
    >
      {/* Layer 0: Boutique background */}
      <img
        src="/assets/boutique-bg.svg"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center top',
          zIndex: 0, pointerEvents: 'none', display: 'block',
        }}
      />

      {/* Layer 1: Base character body SVG */}
      <img
        src={charSrc}
        alt={charData?.name || 'Character'}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'contain', objectPosition: 'center bottom',
          zIndex: 1, pointerEvents: 'none',
        }}
      />

      {/* Layers 2+: Clothing overlays */}
      <div
        className={spinning ? 'canvas-spin' : ''}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          zIndex: 2,
        }}
      >
        {clothingLayers.map(({ item, slot }) => (
          <img
            key={`${slot}-${item.id}`}
            src={makeClothingOverlay(item)}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'contain', objectPosition: 'center bottom',
              pointerEvents: 'none',
              animation: 'fadeIn 0.1s ease-out',
            }}
          />
        ))}
      </div>

      {/* Tap hint */}
      {equippedCount >= 3 && !spinning && (
        <div style={{
          position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,20,147,0.85)', color: '#fff',
          fontSize: 8, fontFamily: "'Nunito',sans-serif", fontWeight: 700,
          padding: '2px 8px', borderRadius: 8, pointerEvents: 'none',
          whiteSpace: 'nowrap', zIndex: 10,
        }}>
          TAP FOR RUNWAY! ✨
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes canvasSpin {
          0%   { transform: perspective(800px) rotateY(0deg) scale(1); }
          25%  { transform: perspective(800px) rotateY(12deg) scale(1.03); }
          50%  { transform: perspective(800px) rotateY(0deg) scale(1.05); }
          75%  { transform: perspective(800px) rotateY(-12deg) scale(1.03); }
          100% { transform: perspective(800px) rotateY(0deg) scale(1); }
        }
        .canvas-spin { animation: canvasSpin 0.7s ease-in-out; }
      `}</style>
    </div>
  );
}
