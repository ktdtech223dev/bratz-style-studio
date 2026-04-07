import React, { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import hair from '../../data/hair';
import { RARITY_COLORS, RARITY_GLOWS } from '../../utils/rarityColors';
import DyePicker from './DyePicker';

/**
 * Hair selection panel, shown when the "Hair" category is selected.
 * Top section: dye color picker. Bottom section: hairstyle grid.
 */
export default function HairPicker() {
  const outfit = useGameStore((s) => s.outfit);
  const collection = useGameStore((s) => s.collection);
  const setHair = useGameStore((s) => s.setHair);
  const [animatingId, setAnimatingId] = useState(null);

  const characterHairs = useMemo(() => {
    return hair.filter((h) => h.character === outfit.character);
  }, [outfit.character]);

  const handleSelectHair = (hairItem) => {
    const isUnlocked = hairItem.unlocked || collection.has(hairItem.id);
    if (!isUnlocked) return;

    setAnimatingId(hairItem.id);
    setTimeout(() => setAnimatingId(null), 300);
    setHair(hairItem.id);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Dye Color Picker */}
      <div className="flex-shrink-0 border-b border-white/10 pb-2">
        <DyePicker />
      </div>

      {/* Hairstyle Grid */}
      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-4">
        <div className="grid grid-cols-4 gap-2">
          {characterHairs.map((h) => {
            const isUnlocked = h.unlocked || collection.has(h.id);
            const isSelected = outfit.hairId === h.id;
            const rarityColor = RARITY_COLORS[h.rarity] || RARITY_COLORS.common;
            const rarityGlow = RARITY_GLOWS[h.rarity] || RARITY_GLOWS.common;
            const isAnimating = animatingId === h.id;

            return (
              <button
                key={h.id}
                onClick={() => handleSelectHair(h)}
                className={`relative rounded-xl aspect-square overflow-hidden
                  transition-transform duration-200
                  ${isAnimating ? 'scale-95' : 'scale-100'}
                  focus:outline-none`}
                style={{
                  border: `2px solid ${isSelected ? '#ff2d78' : rarityColor}`,
                  boxShadow: isSelected
                    ? '0 0 12px rgba(255,45,120,0.6)'
                    : 'none',
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                {/* Hair preview - silhouette shape */}
                <div className="w-full h-full flex items-center justify-center p-2">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    {isUnlocked ? (
                      <>
                        <ellipse cx="30" cy="22" rx="20" ry="18"
                          fill={outfit.hairColorPrimary || '#8B4513'} opacity="0.9" />
                        <path d="M12 22 Q10 40 18 50 Q22 54 26 48 Q16 38 16 25"
                          fill={outfit.hairColorPrimary || '#8B4513'} opacity="0.7" />
                        <path d="M48 22 Q50 40 42 50 Q38 54 34 48 Q44 38 44 25"
                          fill={outfit.hairColorPrimary || '#8B4513'} opacity="0.7" />
                      </>
                    ) : (
                      <>
                        <ellipse cx="30" cy="22" rx="20" ry="18"
                          fill="#333" opacity="0.6" />
                        <path d="M12 22 Q10 40 18 50 Q22 54 26 48 Q16 38 16 25"
                          fill="#333" opacity="0.4" />
                        <path d="M48 22 Q50 40 42 50 Q38 54 34 48 Q44 38 44 25"
                          fill="#333" opacity="0.4" />
                      </>
                    )}
                  </svg>
                </div>

                {/* Selected badge */}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ff2d78] flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">{'\u2713'}</span>
                  </div>
                )}

                {/* Locked overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                    <span className="text-lg">🔒</span>
                  </div>
                )}

                {/* Name label */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                  <span
                    className="text-[7px] text-white/70 leading-tight line-clamp-1 block text-center"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    {h.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
