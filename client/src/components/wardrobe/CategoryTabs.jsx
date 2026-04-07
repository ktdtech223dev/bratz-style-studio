import React, { useRef, useEffect } from 'react';

const CATEGORIES = [
  { key: 'tops', label: 'Tops', emoji: '\uD83D\uDC5A' },
  { key: 'bottoms', label: 'Bottoms', emoji: '\uD83D\uDC56' },
  { key: 'shoes', label: 'Shoes', emoji: '\uD83D\uDC60' },
  { key: 'outerwear', label: 'Outer', emoji: '\uD83E\uDDE5' },
  { key: 'jewelry', label: 'Jewelry', emoji: '\uD83D\uDC8D' },
  { key: 'bags', label: 'Bags', emoji: '\uD83D\uDC5C' },
  { key: 'makeup', label: 'Makeup', emoji: '\uD83D\uDC84' },
  { key: 'socks', label: 'Socks', emoji: '\uD83E\uDDE6' },
  { key: 'sets', label: 'Sets', emoji: '\u2728' },
  { key: 'hair', label: 'Hair', emoji: '\uD83D\uDC87' },
];

/**
 * Horizontal scrollable category tabs.
 *
 * @param {object} props
 * @param {string} props.active - Currently active category key
 * @param {function} props.onChange - Callback when a tab is selected
 */
export default function CategoryTabs({ active, onChange }) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [active]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto py-2 px-1 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.key;
        return (
          <button
            key={cat.key}
            ref={isActive ? activeRef : null}
            onClick={() => onChange(cat.key)}
            className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-1.5 rounded-lg
              min-w-[44px] min-h-[44px] transition-all duration-200
              ${isActive
                ? 'text-white border-b-2 border-[#ff2d78] bg-white/10'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            style={isActive ? { borderBottomColor: '#ff2d78' } : {}}
          >
            <span className="text-lg leading-none">{cat.emoji}</span>
            <span
              className="text-[10px] mt-0.5 font-semibold whitespace-nowrap"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { CATEGORIES };
