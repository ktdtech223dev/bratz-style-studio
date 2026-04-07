import React from 'react';
import {
  RARITY_COLORS,
  RARITY_STARS,
  RARITY_GLOWS,
  getRarityLabel,
} from '../../utils/rarityColors';

/**
 * Star SVG -- filled or empty outline.
 */
function Star({ filled, color, size = 16, delay = 0, animate = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={1.5}
      style={{
        filter: filled ? `drop-shadow(0 0 4px ${color})` : 'none',
        opacity: animate ? 0 : 1,
        animation: animate
          ? `rarity-star-pop 0.4s ${delay}s cubic-bezier(0.34,1.56,0.64,1) forwards`
          : 'none',
      }}
    >
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

/**
 * RarityBadge -- shows filled/empty stars (1-4) and a rarity label.
 *
 * @param {object}  props
 * @param {string}  props.rarity    - common | rare | epic | legendary
 * @param {boolean} [props.glow]    - add outer glow effect
 * @param {boolean} [props.animate] - stagger-pop the stars in
 * @param {number}  [props.starSize] - pixel size of each star
 * @param {boolean} [props.showLabel] - show the rarity text label
 * @param {string}  [props.className] - extra class names
 */
export default function RarityBadge({
  rarity = 'common',
  glow = false,
  animate = false,
  starSize = 16,
  showLabel = true,
  className = '',
}) {
  const key = (rarity || 'common').toLowerCase();
  const color = RARITY_COLORS[key] || RARITY_COLORS.common;
  const totalFilled = RARITY_STARS[key] || 1;
  const maxStars = 4;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      style={{
        boxShadow: glow ? RARITY_GLOWS[key] || 'none' : 'none',
        borderRadius: glow ? 20 : 0,
        padding: glow ? '4px 10px' : 0,
        background: glow ? 'rgba(0,0,0,0.4)' : 'transparent',
      }}
    >
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => (
          <Star
            key={i}
            filled={i < totalFilled}
            color={color}
            size={starSize}
            delay={animate ? i * 0.12 : 0}
            animate={animate}
          />
        ))}
      </div>

      {/* Label */}
      {showLabel && (
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: Math.max(10, starSize * 0.75),
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            textShadow: glow ? `0 0 8px ${color}` : 'none',
          }}
        >
          {getRarityLabel(rarity)}
        </span>
      )}

      {/* Keyframes injected once */}
      {animate && (
        <style>{`
          @keyframes rarity-star-pop {
            0% { opacity: 0; transform: scale(0) rotate(-45deg); }
            60% { opacity: 1; transform: scale(1.3) rotate(5deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
          }
        `}</style>
      )}
    </div>
  );
}
