import React, { useState } from 'react';

/**
 * Single layer component for the dress-up canvas.
 * Renders an absolutely positioned image with transition effects.
 *
 * @param {object} props
 * @param {string} props.src - SVG URL or data URI
 * @param {number} props.zIndex - Layer z-index (0-19)
 * @param {boolean} [props.visible=true] - Whether the layer is visible
 * @param {boolean} [props.animated=false] - Whether to animate entry
 * @param {boolean} [props.isLegendary=false] - Whether to apply holo-shimmer
 * @param {string} [props.className] - Additional CSS classes
 */
export default function CanvasLayer({
  src,
  zIndex,
  visible = true,
  animated = false,
  isLegendary = false,
  className = '',
}) {
  const [loaded, setLoaded] = useState(false);

  if (!src || !visible) return null;

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      onLoad={() => setLoaded(true)}
      className={`absolute inset-0 w-full h-full object-contain pointer-events-none select-none
        ${animated ? 'transition-opacity duration-100 ease-in' : ''}
        ${animated && !loaded ? 'opacity-0' : 'opacity-100'}
        ${isLegendary ? 'holo-shimmer' : ''}
        ${className}`}
      style={{ zIndex }}
    />
  );
}
