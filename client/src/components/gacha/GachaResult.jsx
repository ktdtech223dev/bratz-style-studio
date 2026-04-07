import React, { useState, useEffect } from 'react';
import { getItemPreviewSvg } from '../../utils/itemPreview';
import {
  RARITY_COLORS,
  RARITY_GRADIENTS,
  getRarityLabel,
} from '../../utils/rarityColors';
import RarityBadge from './RarityBadge';

/**
 * GachaResult -- single pull result display.
 * Shows the pulled item large and centered with rarity glow,
 * preview image, name, rarity badge, aesthetic tags, and action buttons.
 *
 * @param {object}  props
 * @param {object}  props.item       - The pulled item { id, name, rarity, category, color, aesthetic, tags }
 * @param {boolean} props.isNew      - Whether this is the first time the player got this item
 * @param {boolean} props.isDuplicate - Whether this is a duplicate
 * @param {number}  [props.shardValue] - Style shard conversion amount for duplicates
 * @param {function} props.onEquip   - Called when "Equip Now" is pressed
 * @param {function} props.onPullAgain - Called when "Pull Again" is pressed
 * @param {function} props.onBack    - Called when "Back" is pressed
 * @param {boolean} [props.animate]  - Whether to animate the reveal
 */
export default function GachaResult({
  item,
  isNew = false,
  isDuplicate = false,
  shardValue = 5,
  onEquip,
  onPullAgain,
  onBack,
  animate = true,
}) {
  const [revealed, setRevealed] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setRevealed(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  if (!item) return null;

  const rarity = (item.rarity || 'common').toLowerCase();
  const color = RARITY_COLORS[rarity] || RARITY_COLORS.common;
  const previewSrc = getItemPreviewSvg(item);
  const tags = item.tags || (item.aesthetic ? [item.aesthetic] : []);

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-6 gap-4">
      {/* Rarity glow background */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${color}33 0%, ${color}11 40%, transparent 70%)`,
          animation: revealed ? 'result-glow-pulse 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Item preview image -- large, centered, gentle rotation */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 160,
          height: 160,
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-15deg)',
          transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Rotating background ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: 180,
            height: 180,
            border: `2px solid ${color}44`,
            animation: 'result-ring-spin 8s linear infinite',
          }}
        />

        {/* Inner glow card */}
        <div
          className="relative flex items-center justify-center rounded-2xl overflow-hidden"
          style={{
            width: 140,
            height: 140,
            background: RARITY_GRADIENTS[rarity] || RARITY_GRADIENTS.common,
            boxShadow: `0 0 30px ${color}55, 0 0 60px ${color}22`,
            animation: revealed ? 'result-item-float 3s ease-in-out infinite' : 'none',
          }}
        >
          {previewSrc && (
            <img
              src={previewSrc}
              alt={item.name || 'Item'}
              style={{
                width: 100,
                height: 100,
                objectFit: 'contain',
                filter: rarity === 'legendary' ? 'drop-shadow(0 0 8px gold)' : 'none',
              }}
            />
          )}
        </div>

        {/* NEW! badge */}
        {isNew && (
          <div
            className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #00e5ff, #00bcd4)',
              boxShadow: '0 0 12px rgba(0,229,255,0.6)',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: 11,
              color: '#fff',
              letterSpacing: '0.05em',
              animation: 'result-new-bounce 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}
          >
            NEW!
          </div>
        )}
      </div>

      {/* Rarity stars */}
      <div
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.5s 0.3s ease, transform 0.5s 0.3s ease',
        }}
      >
        <RarityBadge
          rarity={rarity}
          glow
          animate={animate}
          starSize={20}
          showLabel
        />
      </div>

      {/* Item name */}
      <h2
        style={{
          fontFamily: "'Pacifico', cursive",
          fontSize: 'clamp(20px, 5vw, 28px)',
          color: '#fff',
          textAlign: 'center',
          textShadow: `0 0 16px ${color}66`,
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s 0.4s ease, transform 0.5s 0.4s ease',
        }}
      >
        {item.name || 'Mystery Item'}
      </h2>

      {/* Aesthetic tags */}
      {tags.length > 0 && (
        <div
          className="flex flex-wrap items-center justify-center gap-1.5"
          style={{
            opacity: revealed ? 1 : 0,
            transition: 'opacity 0.5s 0.5s ease',
          }}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full"
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: 10,
                color: '#ff2d78',
                background: 'rgba(255,45,120,0.12)',
                border: '1px solid rgba(255,45,120,0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Duplicate shard conversion */}
      {isDuplicate && (
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{
            background: 'rgba(156,39,176,0.15)',
            border: '1px solid rgba(156,39,176,0.3)',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            color: '#ce93d8',
            opacity: revealed ? 1 : 0,
            transition: 'opacity 0.5s 0.55s ease',
          }}
        >
          <span>Duplicate</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{'\u2192'}</span>
          <span style={{ color: '#ffd700' }}>+{shardValue} Style Shards</span>
        </div>
      )}

      {/* Action buttons */}
      <div
        className="flex items-center gap-3 mt-2"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.5s 0.6s ease, transform 0.5s 0.6s ease',
        }}
      >
        {!isDuplicate && onEquip && (
          <button
            onClick={onEquip}
            className="px-5 py-2 rounded-full transition-all duration-200 active:scale-95"
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: '#fff',
              background: 'linear-gradient(135deg, #ff2d78, #9c27b0)',
              boxShadow: '0 0 16px rgba(255,45,120,0.4), 0 4px 12px rgba(0,0,0,0.3)',
              letterSpacing: '0.04em',
            }}
          >
            Equip Now
          </button>
        )}

        {onPullAgain && (
          <button
            onClick={onPullAgain}
            className="px-5 py-2 rounded-full transition-all duration-200 active:scale-95"
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: '#ffd700',
              background: 'rgba(255,215,0,0.1)',
              border: '1.5px solid rgba(255,215,0,0.35)',
              letterSpacing: '0.04em',
            }}
          >
            Pull Again
          </button>
        )}

        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-full transition-all duration-200 active:scale-95"
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            Back
          </button>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes result-glow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes result-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes result-item-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes result-new-bounce {
          0% { transform: scale(0) rotate(-20deg); }
          60% { transform: scale(1.3) rotate(5deg); }
          100% { transform: scale(1) rotate(-3deg); }
        }
      `}</style>
    </div>
  );
}
