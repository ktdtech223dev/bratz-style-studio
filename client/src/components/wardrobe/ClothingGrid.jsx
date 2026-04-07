import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import clothing from '../../data/clothing';
import ClothingCard from './ClothingCard';

// Map category tab keys to clothing data category values
const CATEGORY_MAP = {
  tops: 'tops',
  bottoms: 'bottoms',
  shoes: 'shoes',
  outerwear: 'outerwear',
  jewelry: 'jewelry',
  bags: 'bags',
  makeup: 'makeup',
  socks: 'socks',
  sets: 'sets',
};

// Map aesthetic filter names to clothing aesthetic tag values
const AESTHETIC_MAP = {
  'Y2K': 'y2k',
  'Bratz': 'bratz',
  'Goth': 'goth',
  'Alt': 'grunge',
  'Pop Punk': 'punk',
  'Soft Girl': 'kawaii',
  'Cottagecore': 'cottagecore',
  'Fairycore': 'cottagecore',
  'Baddie': 'glam',
  'Streetwear': 'streetwear',
  'Cyber': 'streetwear',
  'Dark Academia': 'preppy',
  'Indie Sleaze': 'grunge',
  'Modern': 'minimalist',
  'E-Girl': 'goth',
  'Preppy': 'preppy',
};

const ITEMS_PER_PAGE = 24;

/**
 * Grid of clothing items, filtered by category and aesthetic.
 * Implements lazy loading with IntersectionObserver.
 *
 * @param {object} props
 * @param {string} props.category - Active category key
 * @param {string} props.aesthetic - Active aesthetic filter
 * @param {string} props.search - Search query
 * @param {function} [props.onLockedTap] - Callback for locked item taps
 */
export default function ClothingGrid({ category, aesthetic, search, onLockedTap }) {
  const collection = useGameStore((s) => s.collection);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const sentinelRef = useRef(null);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = clothing;

    // Category filter
    const catValue = CATEGORY_MAP[category];
    if (catValue) {
      items = items.filter((i) => i.category === catValue);
    }

    // Aesthetic filter
    if (aesthetic && aesthetic !== 'All') {
      const aesValue = AESTHETIC_MAP[aesthetic];
      if (aesValue) {
        items = items.filter(
          (i) => i.aesthetics && i.aesthetics.includes(aesValue)
        );
      }
    }

    // Search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
      );
    }

    // Sort: unlocked first, then by rarity (legendary > epic > rare > common)
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    items.sort((a, b) => {
      const aUnlocked = collection.has(a.id) || a.unlocked ? 0 : 1;
      const bUnlocked = collection.has(b.id) || b.unlocked ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return (rarityOrder[a.rarity] ?? 3) - (rarityOrder[b.rarity] ?? 3);
    });

    return items;
  }, [category, aesthetic, search, collection]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [category, aesthetic, search]);

  // IntersectionObserver for lazy loading
  const observerCallback = useCallback(
    (entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && visibleCount < filteredItems.length) {
        setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredItems.length));
      }
    },
    [visibleCount, filteredItems.length]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '100px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [observerCallback]);

  const visibleItems = filteredItems.slice(0, visibleCount);

  if (filteredItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-white/40 text-sm"
        style={{ fontFamily: 'Nunito, sans-serif' }}>
        No items found
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 pb-4">
      <div className="grid grid-cols-4 gap-2">
        {visibleItems.map((item) => (
          <ClothingCard key={item.id} item={item} onLockedTap={onLockedTap} />
        ))}
      </div>
      {visibleCount < filteredItems.length && (
        <div ref={sentinelRef} className="h-8 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
