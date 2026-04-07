import React, { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import gachaPools from '../../data/gachaPools';
import GachaMachine from '../gacha/GachaMachine';
import GachaPull from '../gacha/GachaPull';

/* ─── Banner tab definitions ────────────────────────────────────── */

const BANNER_TABS = [
  { id: 'main', label: 'Main' },
  { id: 'aesthetic', label: 'Aesthetic' },
  { id: 'hair', label: 'Hair' },
];

/* ─── Helpers ───────────────────────────────────────────────────── */

/** Returns the current aesthetic rotation entry (week-based). */
function getCurrentRotation(pool) {
  if (!pool?.rotationSchedule?.length) return null;
  const weekOfYear = Math.ceil(
    ((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
  );
  return pool.rotationSchedule[(weekOfYear - 1) % pool.rotationSchedule.length];
}

/** Currency display with icon + amount. */
function CurrencyBadge({ type, amount }) {
  const isCoins = type === 'coins';
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2.5 py-1"
      style={{
        background: isCoins ? 'rgba(255,215,0,0.12)' : 'rgba(0,229,255,0.1)',
        border: `1px solid ${isCoins ? 'rgba(255,215,0,0.25)' : 'rgba(0,229,255,0.2)'}`,
      }}
    >
      <span style={{ fontSize: 14 }}>{isCoins ? '\uD83E\uDE99' : '\uD83D\uDC8E'}</span>
      <span
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: isCoins ? '#ffd700' : '#00e5ff',
        }}
      >
        {amount.toLocaleString()}
      </span>
    </div>
  );
}

/* ═══ GachaScreen ═══════════════════════════════════════════════════ */

export default function GachaScreen() {
  const coins = useGameStore((s) => s.player.coins);
  const gems = useGameStore((s) => s.player.gems);
  const currentBanner = useGameStore((s) => s.gacha.currentBanner);
  const pulling = useGameStore((s) => s.gacha.pulling);
  const pullResults = useGameStore((s) => s.gacha.pullResults);
  const pity = useGameStore((s) => s.gacha.pity);
  const setCurrentBanner = useGameStore((s) => s.setCurrentBanner);
  const pullGacha = useGameStore((s) => s.pullGacha);
  const clearPullResults = useGameStore((s) => s.clearPullResults);
  const equipItem = useGameStore((s) => s.equipItem);
  const setScreen = useGameStore((s) => s.setScreen);
  const showToast = useGameStore((s) => s.showToast);

  const [showPullOverlay, setShowPullOverlay] = useState(false);
  const [lastPullMulti, setLastPullMulti] = useState(false);

  // Current pool info
  const pool = gachaPools[currentBanner] || gachaPools.main;
  const rotation = useMemo(() => getCurrentRotation(pool), [pool]);
  const pityCount = pity[currentBanner] || 0;
  const pityRemaining = Math.max(0, (pool.pityThreshold || 80) - pityCount);

  // Banner description
  const bannerDescription = useMemo(() => {
    if (currentBanner === 'aesthetic' && rotation) {
      return `${rotation.theme} -- ${rotation.description}`;
    }
    return pool.description;
  }, [currentBanner, pool, rotation]);

  const bannerName = useMemo(() => {
    if (currentBanner === 'aesthetic' && rotation) {
      return `${pool.name}: ${rotation.theme}`;
    }
    return pool.name;
  }, [currentBanner, pool, rotation]);

  // ── Pull handlers ──────────────────────────────────────────────

  const handleSinglePull = useCallback(async () => {
    if (pulling) return;
    if (coins < pool.costPerPull) {
      showToast('Not enough coins!', 'error');
      return;
    }
    setLastPullMulti(false);
    setShowPullOverlay(true);
    await pullGacha(currentBanner, 1);
  }, [pulling, coins, pool.costPerPull, currentBanner, pullGacha, showToast]);

  const handleMultiPull = useCallback(
    async (currency = 'coins') => {
      if (pulling) return;
      if (currency === 'coins' && coins < pool.costPer10Pull) {
        showToast('Not enough coins!', 'error');
        return;
      }
      if (currency === 'gems' && gems < 80) {
        showToast('Not enough gems!', 'error');
        return;
      }
      setLastPullMulti(true);
      setShowPullOverlay(true);
      await pullGacha(currentBanner, 10);
    },
    [pulling, coins, gems, pool.costPer10Pull, currentBanner, pullGacha, showToast]
  );

  const handleClosePull = useCallback(() => {
    setShowPullOverlay(false);
    clearPullResults();
  }, [clearPullResults]);

  const handleEquip = useCallback(
    (item) => {
      if (item?.slot && item?.id) {
        equipItem(item);
        showToast(`${item.name || 'Item'} equipped!`, 'success');
      }
      handleClosePull();
    },
    [equipItem, showToast, handleClosePull]
  );

  const handlePullAgain = useCallback(() => {
    handleClosePull();
    if (lastPullMulti) {
      handleMultiPull('coins');
    } else {
      handleSinglePull();
    }
  }, [handleClosePull, lastPullMulti, handleMultiPull, handleSinglePull]);

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-[#0d0010] overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setScreen('dressup')}
          className="text-white/40 hover:text-white/70 transition-colors text-sm"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          {'\u2190'} Back
        </button>
        <h1
          className="text-[#ff2d78] text-lg"
          style={{ fontFamily: "'Pacifico', cursive" }}
        >
          Gacha
        </h1>
        <div className="w-12" /> {/* spacer */}
      </div>

      {/* ── Currency display ────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-center gap-3 px-4 pb-2">
        <CurrencyBadge type="coins" amount={coins} />
        <CurrencyBadge type="gems" amount={gems} />
      </div>

      {/* ── Banner tabs ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-center gap-2 px-4 pb-2">
        {BANNER_TABS.map((tab) => {
          const active = currentBanner === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentBanner(tab.id)}
              className="relative px-4 py-1.5 rounded-full transition-all duration-200"
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontWeight: active ? 800 : 600,
                fontSize: 13,
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                background: active
                  ? 'linear-gradient(135deg, rgba(255,45,120,0.4), rgba(156,39,176,0.3))'
                  : 'rgba(255,255,255,0.05)',
                border: active
                  ? '1.5px solid rgba(255,45,120,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
                boxShadow: active ? '0 0 12px rgba(255,45,120,0.2)' : 'none',
              }}
            >
              {tab.label}
              {/* Rotating banner indicator */}
              {tab.id === 'aesthetic' && (
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                  style={{
                    background: '#00e5ff',
                    boxShadow: '0 0 6px rgba(0,229,255,0.6)',
                    animation: 'gacha-dot-pulse 2s ease-in-out infinite',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Banner info ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 text-center px-6 pb-1">
        <h2
          style={{
            fontFamily: "'Pacifico', cursive",
            fontSize: 'clamp(16px, 4vw, 22px)',
            color: '#ffd700',
            textShadow: '0 0 12px rgba(255,215,0,0.3)',
          }}
        >
          {bannerName}
        </h2>
        <p
          className="mt-0.5"
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.3,
          }}
        >
          {bannerDescription}
        </p>
      </div>

      {/* ── Machine visual ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative">
        {/* Runway floor glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background:
              'linear-gradient(to top, rgba(255,45,120,0.06), transparent)',
          }}
        />

        <GachaMachine />
      </div>

      {/* ── Pity counter ────────────────────────────────────────── */}
      <div className="flex-shrink-0 text-center pb-1">
        <p
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: pityRemaining <= 10 ? '#ffd700' : 'rgba(255,255,255,0.3)',
            textShadow:
              pityRemaining <= 10 ? '0 0 8px rgba(255,215,0,0.4)' : 'none',
          }}
        >
          {pool.guaranteedRarity
            ? `${pool.guaranteedRarity.charAt(0).toUpperCase() + pool.guaranteedRarity.slice(1)} guaranteed in `
            : 'Legendary guaranteed in '}
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              color: pityRemaining <= 10 ? '#ffd700' : 'rgba(255,255,255,0.5)',
            }}
          >
            {pityRemaining}
          </span>
          {' pulls'}
        </p>
      </div>

      {/* ── Pull buttons ────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2 px-4 pb-4 pt-2">
        {/* Single pull */}
        <button
          onClick={handleSinglePull}
          disabled={pulling || coins < pool.costPerPull}
          className="w-full max-w-xs py-3 rounded-2xl transition-all duration-200 active:scale-[0.97]"
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: 15,
            color: pulling || coins < pool.costPerPull ? 'rgba(255,255,255,0.25)' : '#fff',
            background:
              pulling || coins < pool.costPerPull
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #ff2d78, #9c27b0)',
            boxShadow:
              pulling || coins < pool.costPerPull
                ? 'none'
                : '0 0 20px rgba(255,45,120,0.35), 0 4px 16px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            letterSpacing: '0.03em',
            cursor: pulling || coins < pool.costPerPull ? 'not-allowed' : 'pointer',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <span>Single Pull</span>
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                background: 'rgba(0,0,0,0.25)',
                fontSize: 12,
              }}
            >
              <span>{'\uD83E\uDE99'}</span>
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                }}
              >
                {pool.costPerPull}
              </span>
            </span>
          </span>
        </button>

        {/* 10-Pull */}
        <div className="flex items-center gap-2 w-full max-w-xs">
          {/* Coins option */}
          <button
            onClick={() => handleMultiPull('coins')}
            disabled={pulling || coins < pool.costPer10Pull}
            className="flex-1 py-3 rounded-2xl transition-all duration-200 active:scale-[0.97]"
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color:
                pulling || coins < pool.costPer10Pull
                  ? 'rgba(255,255,255,0.25)'
                  : '#ffd700',
              background:
                pulling || coins < pool.costPer10Pull
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,170,0,0.08))',
              border:
                pulling || coins < pool.costPer10Pull
                  ? '1px solid rgba(255,255,255,0.06)'
                  : '1.5px solid rgba(255,215,0,0.35)',
              boxShadow:
                pulling || coins < pool.costPer10Pull
                  ? 'none'
                  : '0 0 12px rgba(255,215,0,0.15)',
              cursor: pulling || coins < pool.costPer10Pull ? 'not-allowed' : 'pointer',
            }}
          >
            <span className="flex flex-col items-center gap-0.5">
              <span>10-Pull</span>
              <span
                className="flex items-center gap-1"
                style={{ fontSize: 11 }}
              >
                <span>{'\uD83E\uDE99'}</span>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                  {pool.costPer10Pull}
                </span>
              </span>
            </span>
          </button>

          {/* Gems option */}
          <button
            onClick={() => handleMultiPull('gems')}
            disabled={pulling || gems < 80}
            className="flex-1 py-3 rounded-2xl transition-all duration-200 active:scale-[0.97]"
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color:
                pulling || gems < 80
                  ? 'rgba(255,255,255,0.25)'
                  : '#00e5ff',
              background:
                pulling || gems < 80
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(0,188,212,0.06))',
              border:
                pulling || gems < 80
                  ? '1px solid rgba(255,255,255,0.06)'
                  : '1.5px solid rgba(0,229,255,0.3)',
              boxShadow:
                pulling || gems < 80
                  ? 'none'
                  : '0 0 12px rgba(0,229,255,0.12)',
              cursor: pulling || gems < 80 ? 'not-allowed' : 'pointer',
            }}
          >
            <span className="flex flex-col items-center gap-0.5">
              <span>10-Pull</span>
              <span
                className="flex items-center gap-1"
                style={{ fontSize: 11 }}
              >
                <span>{'\uD83D\uDC8E'}</span>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
                  80
                </span>
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* ── Pull overlay ────────────────────────────────────────── */}
      {showPullOverlay && pullResults && pullResults.length > 0 && (
        <GachaPull
          results={pullResults}
          isMulti={lastPullMulti}
          onEquip={handleEquip}
          onPullAgain={handlePullAgain}
          onClose={handleClosePull}
        />
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes gacha-dot-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
