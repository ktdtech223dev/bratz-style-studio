import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getItemPreviewSvg } from '../../utils/itemPreview';
import { RARITY_COLORS, RARITY_GLOWS } from '../../utils/rarityColors';

/**
 * Individual clothing item card.
 *
 * @param {object} props
 * @param {object} props.item - Clothing item data
 * @param {function} [props.onLockedTap] - Callback when locked item is tapped
 */
export default function ClothingCard({ item, onLockedTap }) {
  const collection = useGameStore((s) => s.collection);
  const outfit = useGameStore((s) => s.outfit);
  const equipItem = useGameStore((s) => s.equipItem);
  const [animating, setAnimating] = useState(false);

  const isUnlocked = collection.has(item.id) || item.unlocked;
  const isEquipped = outfit.equipped?.[item.slot] === item.id;
  const rarityColor = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
  const rarityGlow = RARITY_GLOWS[item.rarity] || RARITY_GLOWS.common;
  const isLegendary = item.rarity === 'legendary';

  const previewSrc = getItemPreviewSvg(item);

  const handleTap = () => {
    if (!isUnlocked) {
      onLockedTap?.(item);
      return;
    }

    // Equip animation
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    equipItem(item);
  };

  return (
    <button
      onClick={handleTap}
      className={`relative rounded-xl overflow-hidden aspect-square
        transition-transform duration-200 ease-out
        ${animating ? 'scale-95' : 'scale-100'}
        focus:outline-none focus:ring-2 focus:ring-[#ff2d78]/50`}
      style={{
        border: `2px solid ${isEquipped ? '#ff2d78' : rarityColor}`,
        boxShadow: isEquipped
          ? '0 0 12px rgba(255,45,120,0.6), 0 0 24px rgba(255,45,120,0.3)'
          : isLegendary
          ? rarityGlow
          : 'none',
        background: 'rgba(255,255,255,0.05)',
      }}
    >
      {/* Legendary animated rainbow border */}
      {isLegendary && (
        <div className="absolute inset-0 rounded-xl pointer-events-none legendary-border-anim" />
      )}

      {/* Item preview */}
      <div className="w-full h-full flex items-center justify-center p-1.5">
        <img
          src={previewSrc}
          alt={item.name}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Equipped badge */}
      {isEquipped && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#ff2d78] flex items-center justify-center">
          <span className="text-white text-xs font-bold leading-none">{'\u2713'}</span>
        </div>
      )}

      {/* Locked overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-xl">
          <span className="text-2xl mb-0.5">?</span>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: rarityColor, boxShadow: rarityGlow }}
          />
        </div>
      )}

      {/* Item name */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center"
      >
        <span
          className="text-[8px] text-white/80 leading-tight line-clamp-1"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {item.name}
        </span>
      </div>

      {/* Legendary border animation */}
      <style>{`
        .legendary-border-anim {
          background: conic-gradient(from var(--angle, 0deg),
            #ff2d78, #ffd700, #9c27b0, #2196f3, #ff2d78);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          padding: 2px;
          animation: rotate-border 2s linear infinite;
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes rotate-border {
          to { --angle: 360deg; }
        }
      `}</style>
    </button>
  );
}
