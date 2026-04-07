import React, { useState } from 'react';
import CategoryTabs from './CategoryTabs';
import AestheticFilter from './AestheticFilter';
import ClothingGrid from './ClothingGrid';
import HairPicker from '../hair/HairPicker';

/**
 * Bottom wardrobe panel containing category tabs, filters, search, and item grid.
 * When "Hair" category is selected, shows HairPicker instead of ClothingGrid.
 */
export default function WardrobePanel() {
  const [category, setCategory] = useState('tops');
  const [aesthetic, setAesthetic] = useState('All');
  const [search, setSearch] = useState('');
  const [lockedPopup, setLockedPopup] = useState(null);

  const isHairMode = category === 'hair';

  const handleLockedTap = (item) => {
    setLockedPopup(item);
  };

  const closePopup = () => setLockedPopup(null);

  return (
    <div className="flex flex-col h-full bg-gradient-to-t from-[#0d0010] via-[#1a0025] to-[#1a0025]/90 border-t border-white/10">
      {/* Category Tabs */}
      <CategoryTabs active={category} onChange={setCategory} />

      {isHairMode ? (
        <HairPicker />
      ) : (
        <>
          {/* Aesthetic Filter */}
          <AestheticFilter active={aesthetic} onChange={setAesthetic} />

          {/* Search Bar */}
          <div className="px-3 py-1.5">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-1.5 pl-8
                  text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#ff2d78]/50
                  transition-colors"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs"
                >
                  {'\u2715'}
                </button>
              )}
            </div>
          </div>

          {/* Clothing Grid */}
          <ClothingGrid
            category={category}
            aesthetic={aesthetic}
            search={search}
            onLockedTap={handleLockedTap}
          />
        </>
      )}

      {/* Locked Item Popup */}
      {lockedPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={closePopup}
        >
          <div
            className="bg-[#1a0025] border border-white/20 rounded-2xl p-5 mx-6 max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-2">🔒</div>
            <h3
              className="text-white text-sm font-bold mb-1"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {lockedPopup.name}
            </h3>
            <p
              className="text-white/50 text-xs mb-3"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {lockedPopup.rarity === 'legendary'
                ? 'Get from Gacha pulls!'
                : lockedPopup.price
                ? `Purchase for ${lockedPopup.price} coins`
                : 'Unlock through gameplay'}
            </p>
            <button
              onClick={closePopup}
              className="px-6 py-2 bg-[#ff2d78] text-white text-xs rounded-full font-bold
                hover:bg-[#ff4d8e] transition-colors"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
