import React, { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LAYER_ORDER, getLayerIndex } from '../../utils/layerOrder';
import { getItemPreviewSvg, getCharacterPreviewSvg } from '../../utils/itemPreview';
import characters from '../../data/characters';
import clothing from '../../data/clothing';
import hair from '../../data/hair';
import CanvasLayer from './CanvasLayer';

/**
 * Maps clothing slot names to their layer indices.
 */
const SLOT_TO_LAYER = {};
LAYER_ORDER.forEach((slot, i) => {
  SLOT_TO_LAYER[slot] = i;
});

/**
 * Returns a simple inline SVG data URI for base character parts.
 */
function makeBaseSvg(partType, skinColor) {
  const parts = {
    shadow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400"><ellipse cx="100" cy="380" rx="60" ry="12" fill="rgba(0,0,0,0.2)"/></svg>`,
    legs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
      <rect x="62" y="230" width="28" height="100" rx="10" fill="${skinColor}"/>
      <rect x="110" y="230" width="28" height="100" rx="10" fill="${skinColor}"/>
    </svg>`,
    'feet-base': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
      <ellipse cx="76" cy="335" rx="18" ry="8" fill="${skinColor}"/>
      <ellipse cx="124" cy="335" rx="18" ry="8" fill="${skinColor}"/>
    </svg>`,
    'body-torso': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
      <rect x="65" y="130" width="70" height="105" rx="18" fill="${skinColor}"/>
    </svg>`,
    arms: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
      <rect x="38" y="135" width="26" height="80" rx="10" fill="${skinColor}"/>
      <rect x="136" y="135" width="26" height="80" rx="10" fill="${skinColor}"/>
    </svg>`,
    'head-base': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
      <ellipse cx="100" cy="75" rx="42" ry="50" fill="${skinColor}"/>
      <rect x="88" y="110" width="24" height="25" rx="8" fill="${skinColor}"/>
    </svg>`,
    'face-features': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
      <ellipse cx="82" cy="65" rx="7" ry="5" fill="#333"/>
      <ellipse cx="118" cy="65" rx="7" ry="5" fill="#333"/>
      <path d="M90 85 Q100 92 110 85" fill="none" stroke="#e8838f" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="100" cy="76" rx="3" ry="2.5" fill="${skinColor}" stroke="#c4956e" stroke-width="0.5"/>
    </svg>`,
  };
  const raw = parts[partType];
  if (!raw) return null;
  return `data:image/svg+xml,${encodeURIComponent(raw)}`;
}

/**
 * Generates a hair SVG (back or front layer).
 */
function makeHairSvg(layer, color) {
  const c = color || '#8B4513';
  if (layer === 'back') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
      <ellipse cx="100" cy="80" rx="50" ry="55" fill="${c}" opacity="0.9"/>
      <path d="M55 80 Q50 160 60 200 Q70 220 80 200 Q60 160 65 100" fill="${c}" opacity="0.7"/>
      <path d="M145 80 Q150 160 140 200 Q130 220 120 200 Q140 160 135 100" fill="${c}" opacity="0.7"/>
    </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  // front - bangs
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">
    <path d="M60 40 Q70 25 100 22 Q130 25 140 40 L142 55 Q130 42 100 38 Q70 42 58 55 Z" fill="${c}"/>
    <path d="M60 40 Q55 55 58 70 Q62 55 68 45" fill="${c}" opacity="0.8"/>
    <path d="M140 40 Q145 55 142 70 Q138 55 132 45" fill="${c}" opacity="0.8"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * DressUpCanvas - Renders the character as stacked SVG layers.
 */
export default function DressUpCanvas() {
  const outfit = useGameStore((s) => s.outfit);
  const [spinning, setSpinning] = useState(false);

  const charData = useMemo(
    () => characters.find((c) => c.id === outfit.character) || characters[0],
    [outfit.character]
  );

  const skinColor = charData.skinTones?.[outfit.skinTone] || charData.skinBase;
  const hairColor = outfit.hairColorPrimary || '#8B4513';

  // Build layers array
  const layers = useMemo(() => {
    const result = [];
    const baseParts = ['shadow', 'legs', 'feet-base', 'body-torso', 'arms', 'head-base', 'face-features'];

    // Base character layers
    baseParts.forEach((part) => {
      const src = makeBaseSvg(part, skinColor);
      if (src) {
        result.push({
          key: part,
          src,
          zIndex: getLayerIndex(part),
          visible: true,
          animated: false,
          isLegendary: false,
        });
      }
    });

    // Hair back layer
    result.push({
      key: 'hair-back',
      src: makeHairSvg('back', hairColor),
      zIndex: getLayerIndex('hair-back-layer'),
      visible: true,
      animated: false,
      isLegendary: false,
    });

    // Hair front layer
    result.push({
      key: 'hair-front',
      src: makeHairSvg('front', hairColor),
      zIndex: getLayerIndex('hair-front-layer'),
      visible: true,
      animated: false,
      isLegendary: false,
    });

    // Equipped clothing items
    const equipped = outfit.equipped || {};
    Object.entries(equipped).forEach(([slot, itemId]) => {
      const item = clothing.find((c) => c.id === itemId);
      if (!item) return;

      const svgUri = getItemPreviewSvg(item);
      // Wrap the item preview in a positioned SVG for the correct body area
      const positionedSvg = makePositionedItemSvg(item, svgUri);

      result.push({
        key: `equip-${slot}`,
        src: positionedSvg,
        zIndex: getLayerIndex(slot),
        visible: true,
        animated: true,
        isLegendary: item.rarity === 'legendary',
      });
    });

    return result.sort((a, b) => a.zIndex - b.zIndex);
  }, [outfit, skinColor, hairColor]);

  // Check if full outfit (3+ items equipped)
  const equippedCount = Object.keys(outfit.equipped || {}).length;

  const triggerSpin = () => {
    if (equippedCount >= 3 && !spinning) {
      setSpinning(true);
      setTimeout(() => setSpinning(false), 600);
    }
  };

  return (
    <div
      className="relative w-full mx-auto select-none"
      style={{ maxWidth: '280px', aspectRatio: '1 / 2' }}
      onClick={triggerSpin}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ${
          spinning ? 'animate-runway-spin' : ''
        }`}
      >
        {layers.map((layer) => (
          <CanvasLayer
            key={layer.key}
            src={layer.src}
            zIndex={layer.zIndex}
            visible={layer.visible}
            animated={layer.animated}
            isLegendary={layer.isLegendary}
          />
        ))}
      </div>

      {/* Runway spin animation */}
      <style>{`
        @keyframes runway-spin {
          0% { transform: perspective(600px) rotateY(0deg) scale(1); }
          25% { transform: perspective(600px) rotateY(15deg) scale(1.02); }
          50% { transform: perspective(600px) rotateY(0deg) scale(1.05); }
          75% { transform: perspective(600px) rotateY(-15deg) scale(1.02); }
          100% { transform: perspective(600px) rotateY(0deg) scale(1); }
        }
        .animate-runway-spin {
          animation: runway-spin 0.6s ease-in-out;
        }
        .holo-shimmer {
          animation: holo 2s linear infinite;
        }
        @keyframes holo {
          0% { filter: hue-rotate(0deg) brightness(1); }
          50% { filter: hue-rotate(45deg) brightness(1.2); }
          100% { filter: hue-rotate(0deg) brightness(1); }
        }
      `}</style>
    </div>
  );
}

/**
 * Wraps an item preview SVG into a full-body-sized SVG positioned at the correct body area.
 */
function makePositionedItemSvg(item) {
  const fill = getResolvedColor(item.color);

  const positioned = {
    'tops-layer': `<rect x="60" y="130" width="80" height="60" rx="10" fill="${fill}" opacity="0.85"/>
      <rect x="42" y="130" width="20" height="40" rx="6" fill="${fill}" opacity="0.65"/>
      <rect x="138" y="130" width="20" height="40" rx="6" fill="${fill}" opacity="0.65"/>`,
    'bottoms-layer': `<path d="M62 230 L138 230 L135 320 L108 320 L100 270 L92 320 L65 320 Z" fill="${fill}" opacity="0.85"/>`,
    'shoes-layer': `<ellipse cx="76" cy="335" rx="20" ry="10" fill="${fill}"/>
      <ellipse cx="124" cy="335" rx="20" ry="10" fill="${fill}"/>
      <rect x="64" y="328" width="12" height="14" rx="3" fill="${fill}" opacity="0.8"/>
      <rect x="124" y="328" width="12" height="14" rx="3" fill="${fill}" opacity="0.8"/>`,
    'outerwear-layer': `<rect x="38" y="128" width="124" height="90" rx="8" fill="${fill}" opacity="0.75"/>
      <line x1="100" y1="128" x2="100" y2="218" stroke="${fill}" stroke-width="2" opacity="0.4"/>`,
    'neck-layer': `<ellipse cx="100" cy="125" rx="20" ry="8" fill="${fill}" opacity="0.9"/>
      <circle cx="100" cy="133" r="5" fill="${fill}"/>`,
    'wrist-layer': `<rect x="38" y="200" width="22" height="10" rx="4" fill="${fill}"/>
      <rect x="140" y="200" width="22" height="10" rx="4" fill="${fill}"/>`,
    'bag-layer': `<rect x="148" y="170" width="30" height="40" rx="6" fill="${fill}" opacity="0.9"/>
      <path d="M155 170 Q155 155 163 155 Q171 155 171 170" fill="none" stroke="${fill}" stroke-width="3"/>`,
    'socks-tights-layer': `<rect x="62" y="290" width="28" height="40" rx="8" fill="${fill}" opacity="0.8"/>
      <rect x="110" y="290" width="28" height="40" rx="8" fill="${fill}" opacity="0.8"/>`,
    'makeup-layer': `<ellipse cx="82" cy="65" rx="9" ry="6" fill="${fill}" opacity="0.3"/>
      <ellipse cx="118" cy="65" rx="9" ry="6" fill="${fill}" opacity="0.3"/>
      <path d="M88 85 Q100 94 112 85" fill="${fill}" opacity="0.6"/>`,
    'ear-layer': `<circle cx="55" cy="75" r="6" fill="${fill}"/>
      <circle cx="145" cy="75" r="6" fill="${fill}"/>`,
    'headwear-layer': `<path d="M58 45 Q60 15 100 10 Q140 15 142 45 L145 50 L55 50 Z" fill="${fill}" opacity="0.9"/>
      <ellipse cx="100" cy="50" rx="48" ry="8" fill="${fill}" opacity="0.7"/>`,
  };

  const shapes = positioned[item.slot] || positioned['tops-layer'] || '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400">${shapes}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getResolvedColor(color) {
  const map = {
    pink: '#FF69B4', black: '#1a1a2e', white: '#f0f0f0', red: '#DC143C',
    blue: '#4169E1', purple: '#9B59B6', green: '#2ECC71', gold: '#FFD700',
    silver: '#C0C0C0', orange: '#FF8C00', yellow: '#FFD700', brown: '#8B4513',
    beige: '#DEB887', denim: '#4682B4', multicolor: '#FF69B4', lavender: '#E6E6FA',
    coral: '#FF7F50', teal: '#008080', burgundy: '#800020', cream: '#FFFDD0',
  };
  if (!color) return '#FF69B4';
  if (color.startsWith('#')) return color;
  return map[color.toLowerCase()] || '#FF69B4';
}
