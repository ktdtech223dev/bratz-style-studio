import React, { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import clothing from '../../data/clothing';
import CoinDisplay from '../economy/CoinDisplay';

/* ─── Constants ──────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'tops', label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'makeup', label: 'Makeup' },
  { id: 'socks-tights', label: 'Socks' },
  { id: 'sets', label: 'Sets' },
];

const RARITIES = [
  { id: 'all', label: 'All' },
  { id: 'common', label: 'Common', color: '#9e9e9e' },
  { id: 'rare', label: 'Rare', color: '#2196f3' },
  { id: 'epic', label: 'Epic', color: '#9c27b0' },
  { id: 'legendary', label: 'Legendary', color: '#ffd700' },
];

const SORTS = [
  { id: 'rarity', label: 'By Rarity' },
  { id: 'category', label: 'By Category' },
  { id: 'recent', label: 'Recently Unlocked' },
  { id: 'aesthetic', label: 'By Aesthetic' },
];

const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };

const RARITY_GLOW = {
  common: '0 0 6px rgba(158,158,158,0.3)',
  rare: '0 0 10px rgba(33,150,243,0.5)',
  epic: '0 0 14px rgba(156,39,176,0.6)',
  legendary: '0 0 20px rgba(255,215,0,0.7), 0 0 40px rgba(255,105,180,0.3)',
};

const RARITY_BORDER = {
  common: 'rgba(158,158,158,0.3)',
  rare: 'rgba(33,150,243,0.4)',
  epic: 'rgba(156,39,176,0.5)',
  legendary: 'rgba(255,215,0,0.6)',
};

/* ─── Shard shop helpers ─────────────────────────────────────────── */

function getRotatingLegendaries(allItems) {
  const legendaries = allItems.filter((i) => i.rarity === 'legendary');
  const daySeed = new Date().getDate() + new Date().getMonth() * 31;
  const result = [];
  for (let i = 0; i < 3 && i < legendaries.length; i++) {
    const idx = (daySeed * (i + 7) + i * 13) % legendaries.length;
    result.push(legendaries[idx]);
  }
  return result;
}

/* ═══ CollectionScreen ═══════════════════════════════════════════════ */

export default function CollectionScreen() {
  const collection = useGameStore((s) => s.collection);
  const styleShards = useGameStore((s) => s.player.styleShards);
  const equipItem = useGameStore((s) => s.equipItem);
  const purchaseItem = useGameStore((s) => s.purchaseItem);

  const [category, setCategory] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [sort, setSort] = useState('rarity');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const collectedCount = collection.size;
  const totalCount = clothing.length;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...clothing];

    // Category filter
    if (category !== 'all') {
      items = items.filter((i) => i.category === category);
    }

    // Rarity filter
    if (rarity !== 'all') {
      items = items.filter((i) => i.rarity === rarity);
    }

    // Sort
    switch (sort) {
      case 'rarity':
        items.sort(
          (a, b) =>
            (RARITY_ORDER[a.rarity] ?? 99) - (RARITY_ORDER[b.rarity] ?? 99)
        );
        break;
      case 'category':
        items.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'recent':
        // Unlocked items first, then alphabetical
        items.sort((a, b) => {
          const aOwned = collection.has(a.id) ? 0 : 1;
          const bOwned = collection.has(b.id) ? 0 : 1;
          return aOwned - bOwned;
        });
        break;
      case 'aesthetic':
        items.sort((a, b) =>
          (a.aesthetics?.[0] || '').localeCompare(b.aesthetics?.[0] || '')
        );
        break;
    }

    return items;
  }, [category, rarity, sort, collection]);

  // Shard shop items
  const shopLegendaries = useMemo(() => getRotatingLegendaries(clothing), []);

  const handleEquip = useCallback(
    (item) => {
      if (collection.has(item.id)) {
        equipItem(item);
      }
    },
    [collection, equipItem]
  );

  const handleShardPurchase = useCallback(
    async (item, cost) => {
      if (styleShards < cost) return;
      await purchaseItem(item.id, cost, 'styleShards');
    },
    [styleShards, purchaseItem]
  );

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0010' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1
          className="text-xl"
          style={{
            fontFamily: "'Pacifico', cursive",
            color: '#ffd700',
            textShadow: '0 0 12px rgba(255,215,0,0.3)',
          }}
        >
          Collection
        </h1>
        <CoinDisplay compact />
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs"
            style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.5)' }}
          >
            Collected
          </span>
          <span
            className="text-xs font-bold"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: '#ff2d78',
              fontSize: 11,
            }}
          >
            {collectedCount} / {totalCount}+ items
          </span>
        </div>
        <div
          className="w-full h-3 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min((collectedCount / totalCount) * 100, 100)}%`,
              background: 'linear-gradient(90deg, #ff2d78, #ff69b4, #ffd700)',
              boxShadow: '0 0 8px rgba(255,45,120,0.5)',
            }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div
        className="flex gap-1.5 px-4 pb-2 overflow-x-auto"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                scrollSnapAlign: 'start',
                fontFamily: "'Nunito', sans-serif",
                minHeight: 32,
                background: isActive ? '#ff2d78' : 'rgba(255,255,255,0.06)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                touchAction: 'manipulation',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Rarity filter + sort */}
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex gap-1">
          {RARITIES.map((r) => {
            const isActive = rarity === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRarity(r.id)}
                className="px-2 py-1 rounded-md text-xs font-bold"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 10,
                  background: isActive
                    ? `${r.color || '#ff2d78'}22`
                    : 'transparent',
                  color: isActive ? r.color || '#ff2d78' : 'rgba(255,255,255,0.35)',
                  border: isActive
                    ? `1px solid ${r.color || '#ff2d78'}44`
                    : '1px solid transparent',
                  minHeight: 28,
                  touchAction: 'manipulation',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="px-2 py-1 rounded-md text-xs"
            style={{
              fontFamily: "'Nunito', sans-serif",
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 10,
              minHeight: 28,
              touchAction: 'manipulation',
            }}
          >
            {SORTS.find((s) => s.id === sort)?.label || 'Sort'}
          </button>
          {showSortMenu && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-20"
              style={{
                background: '#2d0040',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                minWidth: 140,
              }}
            >
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSort(s.id);
                    setShowSortMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    color: sort === s.id ? '#ff2d78' : 'rgba(255,255,255,0.6)',
                    background: sort === s.id ? 'rgba(255,45,120,0.1)' : 'transparent',
                    minHeight: 36,
                    touchAction: 'manipulation',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Items grid */}
      <div
        className="flex-1 overflow-y-auto px-4 pb-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="grid grid-cols-4 gap-2">
          {filteredItems.map((item) => {
            const owned = collection.has(item.id);
            const isLegendary = item.rarity === 'legendary';

            return (
              <button
                key={item.id}
                onClick={() => handleEquip(item)}
                className="relative rounded-xl aspect-square flex flex-col items-center justify-center p-1.5 transition-all duration-200"
                style={{
                  background: owned
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.3)',
                  border: `1.5px solid ${
                    owned
                      ? RARITY_BORDER[item.rarity] || 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.04)'
                  }`,
                  boxShadow: owned ? RARITY_GLOW[item.rarity] || 'none' : 'none',
                  opacity: owned ? 1 : 0.5,
                  minHeight: 44,
                  touchAction: 'manipulation',
                  animation:
                    !owned && isLegendary
                      ? 'legendary-silhouette 3s ease-in-out infinite'
                      : 'none',
                }}
              >
                {/* Item visual */}
                {owned ? (
                  <>
                    <span className="text-2xl mb-0.5">
                      {item.category === 'tops'
                        ? '\uD83D\uDC5A'
                        : item.category === 'bottoms'
                        ? '\uD83D\uDC56'
                        : item.category === 'shoes'
                        ? '\uD83D\uDC60'
                        : item.category === 'accessories'
                        ? '\uD83D\uDC5C'
                        : item.category === 'jewelry'
                        ? '\uD83D\uDC8D'
                        : item.category === 'makeup'
                        ? '\uD83D\uDC84'
                        : item.category === 'outerwear'
                        ? '\uD83E\uDDE5'
                        : item.category === 'sets'
                        ? '\u2728'
                        : '\uD83E\uDDE6'}
                    </span>
                    <span
                      className="text-center leading-tight"
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 8,
                        color: 'rgba(255,255,255,0.7)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.name}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl" style={{ filter: 'brightness(0)' }}>
                      {isLegendary ? '\u2728' : '?'}
                    </span>
                    {/* Rarity badge */}
                    <span
                      className="absolute bottom-1 text-center"
                      style={{
                        fontSize: 7,
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 700,
                        color: RARITY_BORDER[item.rarity] || 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {item.rarity}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Style Shard Shop */}
        <div className="mt-6 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-lg"
              style={{
                fontFamily: "'Pacifico', cursive",
                color: '#00e5ff',
                textShadow: '0 0 10px rgba(0,229,255,0.3)',
              }}
            >
              Shard Shop
            </h2>
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{
                background: 'rgba(0,229,255,0.1)',
                border: '1px solid rgba(0,229,255,0.2)',
              }}
            >
              <span style={{ fontSize: 14 }}>{'\uD83D\uDCA0'}</span>
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#00e5ff',
                }}
              >
                {styleShards}
              </span>
            </div>
          </div>

          {/* Legendary items */}
          <p
            className="text-xs mb-2"
            style={{
              fontFamily: "'Nunito', sans-serif",
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Featured Legendaries (rotates daily)
          </p>
          <div className="flex gap-2 mb-4 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            {shopLegendaries.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 rounded-xl p-3 flex flex-col items-center"
                style={{
                  width: 120,
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,105,180,0.05) 100%)',
                  border: '1.5px solid rgba(255,215,0,0.3)',
                  boxShadow: '0 0 16px rgba(255,215,0,0.15)',
                }}
              >
                <span className="text-3xl mb-1">{'\u2728'}</span>
                <span
                  className="text-center text-xs font-bold mb-2"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    color: '#ffd700',
                    lineHeight: 1.2,
                  }}
                >
                  {item.name}
                </span>
                <button
                  onClick={() => handleShardPurchase(item, 500)}
                  disabled={styleShards < 500 || collection.has(item.id)}
                  className="w-full py-1.5 rounded-lg text-xs font-bold"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background:
                      collection.has(item.id)
                        ? 'rgba(255,255,255,0.06)'
                        : styleShards >= 500
                        ? 'linear-gradient(135deg, #00e5ff, #0091ea)'
                        : 'rgba(255,255,255,0.06)',
                    color:
                      collection.has(item.id)
                        ? 'rgba(255,255,255,0.3)'
                        : styleShards >= 500
                        ? '#fff'
                        : 'rgba(255,255,255,0.3)',
                    minHeight: 32,
                    touchAction: 'manipulation',
                  }}
                >
                  {collection.has(item.id) ? 'Owned' : '\uD83D\uDCA0 500'}
                </button>
              </div>
            ))}
          </div>

          {/* Quick buy: Rare & Epic */}
          <div className="flex gap-2">
            <button
              onClick={() => handleShardPurchase({ id: 'random_rare' }, 50)}
              disabled={styleShards < 50}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{
                fontFamily: "'Nunito', sans-serif",
                background:
                  styleShards >= 50
                    ? 'rgba(33,150,243,0.15)'
                    : 'rgba(255,255,255,0.04)',
                color: styleShards >= 50 ? '#2196f3' : 'rgba(255,255,255,0.25)',
                border: `1px solid ${
                  styleShards >= 50 ? 'rgba(33,150,243,0.3)' : 'rgba(255,255,255,0.06)'
                }`,
                minHeight: 48,
                touchAction: 'manipulation',
              }}
            >
              Random Rare
              <br />
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11 }}>
                {'\uD83D\uDCA0'} 50
              </span>
            </button>
            <button
              onClick={() => handleShardPurchase({ id: 'random_epic' }, 150)}
              disabled={styleShards < 150}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{
                fontFamily: "'Nunito', sans-serif",
                background:
                  styleShards >= 150
                    ? 'rgba(156,39,176,0.15)'
                    : 'rgba(255,255,255,0.04)',
                color: styleShards >= 150 ? '#9c27b0' : 'rgba(255,255,255,0.25)',
                border: `1px solid ${
                  styleShards >= 150 ? 'rgba(156,39,176,0.3)' : 'rgba(255,255,255,0.06)'
                }`,
                minHeight: 48,
                touchAction: 'manipulation',
              }}
            >
              Random Epic
              <br />
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11 }}>
                {'\uD83D\uDCA0'} 150
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes legendary-silhouette {
          0%, 100% { box-shadow: 0 0 8px rgba(255,215,0,0.2); }
          50% { box-shadow: 0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,105,180,0.2); }
        }
      `}</style>
    </div>
  );
}
