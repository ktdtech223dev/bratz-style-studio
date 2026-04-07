import React, { useRef } from 'react';

const AESTHETICS = [
  'All', 'Y2K', 'Bratz', 'Goth', 'Alt', 'Pop Punk', 'Soft Girl',
  'Cottagecore', 'Fairycore', 'Baddie', 'Streetwear', 'Cyber',
  'Dark Academia', 'Indie Sleaze', 'Modern', 'E-Girl', 'Preppy',
];

/**
 * Horizontal scrollable aesthetic filter pills.
 *
 * @param {object} props
 * @param {string} props.active - Currently selected aesthetic (or 'All')
 * @param {function} props.onChange - Callback with selected aesthetic string
 */
export default function AestheticFilter({ active, onChange }) {
  const scrollRef = useRef(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 overflow-x-auto py-1.5 px-1 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
      {AESTHETICS.map((aes) => {
        const isActive = active === aes;
        return (
          <button
            key={aes}
            onClick={() => onChange(aes)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold
              transition-all duration-200 whitespace-nowrap
              ${isActive
                ? 'bg-[#ff2d78] text-white shadow-lg shadow-pink-500/30'
                : 'bg-transparent text-white/50 border border-white/20 hover:border-white/40 hover:text-white/70'
              }`}
            style={{ fontFamily: 'Nunito, sans-serif', minHeight: '28px' }}
          >
            {aes}
          </button>
        );
      })}
    </div>
  );
}

export { AESTHETICS };
