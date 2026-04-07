import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import DressUpCanvas from '../canvas/DressUpCanvas';
import WardrobePanel from '../wardrobe/WardrobePanel';

/**
 * Main dress-up screen - core gameplay.
 * Layout (mobile): top 55% = character canvas, bottom 45% = wardrobe panel.
 * Action buttons between canvas and wardrobe: save look, export/share, undo.
 */
export default function DressUpScreen() {
  const outfit = useGameStore((s) => s.outfit);
  const equipItem = useGameStore((s) => s.equipItem);
  const saveLook = useGameStore((s) => s.saveLook);
  const resetOutfit = useGameStore((s) => s.resetOutfit);
  const setScreen = useGameStore((s) => s.setScreen);
  const showToast = useGameStore((s) => s.showToast);

  const [saving, setSaving] = useState(false);

  // Undo = remove the last equipped item
  const handleUndo = useCallback(() => {
    const equipped = outfit.equipped || {};
    const slots = Object.keys(equipped);
    if (slots.length === 0) {
      showToast('Nothing to undo', 'info');
      return;
    }
    const lastSlot = slots[slots.length - 1];
    equipItem({ slot: lastSlot, id: equipped[lastSlot] }); // Toggle off
  }, [outfit.equipped, equipItem, showToast]);

  // Save look
  const handleSave = useCallback(async () => {
    setSaving(true);
    const name = `Look ${Date.now().toString(36).slice(-4).toUpperCase()}`;
    await saveLook(name);
    setSaving(false);
  }, [saveLook]);

  // Export/Share placeholder
  const handleExport = useCallback(() => {
    showToast('Export feature coming soon!', 'info');
  }, [showToast]);

  return (
    <div className="h-screen flex flex-col bg-[#0d0010] overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setScreen('characterselect')}
          className="text-white/40 hover:text-white/70 transition-colors text-sm"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {'\u2190'} Back
        </button>
        <h1
          className="text-[#ff2d78] text-lg"
          style={{ fontFamily: 'Pacifico, cursive' }}
        >
          Style Studio
        </h1>
        <button
          onClick={resetOutfit}
          className="text-white/40 hover:text-white/70 transition-colors text-xs"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          Reset
        </button>
      </div>

      {/* Canvas Area - 55% */}
      <div className="flex-shrink-0 relative flex items-center justify-center"
        style={{ height: '48%' }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0030] via-[#0d0010] to-transparent opacity-50" />

        {/* Runway floor effect */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{
            background: 'linear-gradient(to top, rgba(255,45,120,0.08), transparent)',
          }}
        />

        <DressUpCanvas />
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex items-center justify-center gap-3 py-1.5 px-4">
        <ActionButton
          icon={'\uD83D\uDCBE'}
          label="Save"
          onClick={handleSave}
          disabled={saving}
        />
        <ActionButton
          icon={'\uD83D\uDCE4'}
          label="Export"
          onClick={handleExport}
        />
        <ActionButton
          icon={'\u21A9'}
          label="Undo"
          onClick={handleUndo}
        />
      </div>

      {/* Wardrobe Panel - fills remaining space */}
      <div className="flex-1 min-h-0">
        <WardrobePanel />
      </div>
    </div>
  );
}

/**
 * Small action button used between canvas and wardrobe.
 */
function ActionButton({ icon, label, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
        text-xs font-semibold transition-all duration-200
        ${disabled
          ? 'bg-white/5 text-white/20 cursor-not-allowed'
          : 'bg-white/8 text-white/60 hover:bg-white/15 hover:text-white/90 active:scale-95'
        }
        border border-white/10`}
      style={{ fontFamily: 'Nunito, sans-serif' }}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
