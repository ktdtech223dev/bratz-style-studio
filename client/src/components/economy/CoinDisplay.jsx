import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';

/* ─── Animated number counter ────────────────────────────────────── */

function useAnimatedNumber(value, duration = 600) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const diff = to - from;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return display;
}

/* ─── Floating "+X" popup ────────────────────────────────────────── */

function FloatingDelta({ amount, type, id, onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(id), 1200);
    return () => clearTimeout(timer);
  }, [id, onDone]);

  return (
    <span
      className="absolute pointer-events-none font-bold whitespace-nowrap"
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 14,
        fontWeight: 800,
        color: type === 'coins' ? '#ffd700' : '#00e5ff',
        right: 0,
        top: -4,
        textShadow: `0 0 6px ${type === 'coins' ? 'rgba(255,215,0,0.8)' : 'rgba(0,229,255,0.8)'}`,
        animation: 'coin-float-up 1.2s ease-out forwards',
      }}
    >
      +{amount}
    </span>
  );
}

/* ═══ CoinDisplay ════════════════════════════════════════════════════ */

export default function CoinDisplay({ compact = false }) {
  const coins = useGameStore((s) => s.player.coins);
  const gems = useGameStore((s) => s.player.gems);

  const animatedCoins = useAnimatedNumber(coins);
  const animatedGems = useAnimatedNumber(gems);

  const [deltas, setDeltas] = useState([]);
  const prevCoinsRef = useRef(coins);
  const prevGemsRef = useRef(gems);
  const deltaIdRef = useRef(0);

  const removeDelta = useCallback((id) => {
    setDeltas((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Detect changes and spawn floating deltas
  useEffect(() => {
    const coinDiff = coins - prevCoinsRef.current;
    const gemDiff = gems - prevGemsRef.current;

    const newDeltas = [];
    if (coinDiff > 0) {
      newDeltas.push({ id: ++deltaIdRef.current, amount: coinDiff, type: 'coins' });
    }
    if (gemDiff > 0) {
      newDeltas.push({ id: ++deltaIdRef.current, amount: gemDiff, type: 'gems' });
    }

    if (newDeltas.length) {
      setDeltas((prev) => [...prev, ...newDeltas]);
    }

    prevCoinsRef.current = coins;
    prevGemsRef.current = gems;
  }, [coins, gems]);

  return (
    <>
      <style>{`
        @keyframes coin-float-up {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-28px); }
        }
      `}</style>

      <div
        className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}
        style={{ fontFamily: "'Orbitron', sans-serif" }}
      >
        {/* Coins */}
        <div
          className="relative flex items-center gap-1 rounded-full"
          style={{
            padding: compact ? '4px 10px' : '6px 14px',
            background: 'rgba(255,215,0,0.1)',
            border: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <span style={{ fontSize: compact ? 14 : 18 }}>{'\uD83E\uDE99'}</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: compact ? 13 : 16,
              color: '#ffd700',
              minWidth: compact ? 36 : 48,
              textAlign: 'right',
            }}
          >
            {animatedCoins.toLocaleString()}
          </span>

          {/* Floating deltas for coins */}
          {deltas
            .filter((d) => d.type === 'coins')
            .map((d) => (
              <FloatingDelta
                key={d.id}
                id={d.id}
                amount={d.amount}
                type="coins"
                onDone={removeDelta}
              />
            ))}
        </div>

        {/* Gems */}
        <div
          className="relative flex items-center gap-1 rounded-full"
          style={{
            padding: compact ? '4px 10px' : '6px 14px',
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.18)',
          }}
        >
          <span style={{ fontSize: compact ? 14 : 18 }}>{'\uD83D\uDC8E'}</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: compact ? 13 : 16,
              color: '#00e5ff',
              minWidth: compact ? 28 : 36,
              textAlign: 'right',
            }}
          >
            {animatedGems.toLocaleString()}
          </span>

          {/* Floating deltas for gems */}
          {deltas
            .filter((d) => d.type === 'gems')
            .map((d) => (
              <FloatingDelta
                key={d.id}
                id={d.id}
                amount={d.amount}
                type="gems"
                onDone={removeDelta}
              />
            ))}
        </div>
      </div>
    </>
  );
}
