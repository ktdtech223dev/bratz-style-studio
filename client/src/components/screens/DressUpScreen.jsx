import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import DressUpCanvas from '../canvas/DressUpCanvas';
import WardrobePanel from '../wardrobe/WardrobePanel';

/**
 * Main dress-up screen — Y2K boutique layout.
 * Top ~48%: canvas (boutique bg + character) in white-framed pink-bordered box.
 * Bottom ~52%: scrollable WardrobePanel (white bg).
 */
export default function DressUpScreen() {
  const outfit    = useGameStore((s) => s.outfit);
  const equipItem = useGameStore((s) => s.equipItem);
  const saveLook  = useGameStore((s) => s.saveLook);
  const resetOutfit = useGameStore((s) => s.resetOutfit);
  const showToast = useGameStore((s) => s.showToast);

  const [saving, setSaving] = useState(false);

  /* Undo = toggle off the last equipped item */
  const handleUndo = useCallback(() => {
    const equipped = outfit.equipped || {};
    const slots = Object.keys(equipped);
    if (slots.length === 0) {
      showToast('Nothing to undo', 'info');
      return;
    }
    const lastSlot = slots[slots.length - 1];
    equipItem({ slot: lastSlot, id: equipped[lastSlot] });
  }, [outfit.equipped, equipItem, showToast]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const name = `Look ${Date.now().toString(36).slice(-4).toUpperCase()}`;
    await saveLook(name);
    setSaving(false);
  }, [saveLook]);

  const handleExport = useCallback(() => {
    showToast('Export coming soon! 💖', 'info');
  }, [showToast]);

  return (
    <div
      className="flex flex-col overflow-hidden no-select"
      style={{
        height: '100%',
        background: '#FFB6C1',
      }}
    >
      {/* Canvas area — top 48% */}
      <div
        className="flex-shrink-0 flex items-center justify-center pixel-noise"
        style={{
          height: '48%',
          background: 'linear-gradient(180deg, #FFB6C1 0%, #FFC8D3 100%)',
          padding: '8px 16px 4px',
        }}
      >
        {/* Framed canvas */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 310,
            height: '100%',
          }}
        >
          {/* Canvas with boutique bg + character */}
          <div
            style={{
              flex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
            }}
          >
            <DressUpCanvas />
          </div>

          {/* Action pill buttons below canvas */}
          <div
            className="flex items-center justify-center gap-2"
            style={{ paddingTop: 6, paddingBottom: 2 }}
          >
            <PillButton
              icon="💾"
              label="Save"
              onClick={handleSave}
              disabled={saving}
            />
            <PillButton
              icon="📤"
              label="Export"
              onClick={handleExport}
            />
            <PillButton
              icon="↩"
              label="Undo"
              onClick={handleUndo}
            />
            <PillButton
              icon="🔄"
              label="Reset"
              onClick={resetOutfit}
            />
          </div>
        </div>
      </div>

      {/* Wardrobe Panel — bottom 52%, white bg, scrollable */}
      <div
        className="flex-1 min-h-0"
        style={{
          background: '#FFFFFF',
          borderTop: '3px solid #FF1493',
          boxShadow: 'inset 0 3px 0 #FF69B4',
        }}
      >
        <WardrobePanel />
      </div>
    </div>
  );
}

/**
 * Small pink pill button used in the action row below the canvas.
 */
function PillButton({ icon, label, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 rounded-full"
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: 10,
        fontWeight: 800,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5,
        background: disabled ? '#F5C6D0' : '#FFFFFF',
        color: disabled ? '#C2185B88' : '#FF1493',
        border: '2px solid #FF69B4',
        boxShadow: disabled ? 'none' : '2px 2px 0 #C2185B',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'box-shadow 0.1s, transform 0.1s',
        letterSpacing: '0.02em',
        minHeight: 30,
        minWidth: 44,
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'translate(1px,1px)';
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = '';
      }}
    >
      <span style={{ fontSize: 12, lineHeight: 1 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
