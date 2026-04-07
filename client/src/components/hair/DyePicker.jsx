import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import dyeColors from '../../data/dyeColors';

const PALETTES = [
  { key: 'naturals', label: 'Naturals' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'pastel', label: 'Pastel' },
  { key: 'dark', label: 'Dark' },
  { key: 'neon', label: 'Neon' },
  { key: 'metallic', label: 'Metallic' },
];

const DYE_MODES = [
  { key: 'single', label: 'Single' },
  { key: 'split', label: 'Split' },
  { key: 'ombre', label: 'Ombre' },
  { key: 'streak', label: 'Streak' },
  { key: 'rainbow', label: 'Rainbow' },
];

/**
 * Hair dye color picker with palette tabs, color grid, and dye mode selector.
 */
export default function DyePicker() {
  const outfit = useGameStore((s) => s.outfit);
  const setHairColor = useGameStore((s) => s.setHairColor);
  const collection = useGameStore((s) => s.collection);

  const [activePalette, setActivePalette] = useState('naturals');
  const [dyeMode, setDyeMode] = useState(outfit.hairDyeMode || 'single');
  const [selectingSlot, setSelectingSlot] = useState('primary'); // 'primary' or 'secondary'

  // Filter whether user has dye kit (check if any dye-related items are in collection)
  const hasDyeKit = useMemo(() => {
    return collection.size >= 5; // Simplified: unlock advanced dye after 5 items
  }, [collection]);

  const paletteColors = useMemo(() => {
    return dyeColors.filter((c) => c.palette === activePalette);
  }, [activePalette]);

  const selectedPrimary = outfit.hairColorPrimary || '#8B4513';
  const selectedSecondary = outfit.hairColorSecondary || '#E8D5B7';

  const handleColorSelect = (hex) => {
    if (dyeMode === 'single' || dyeMode === 'rainbow') {
      setHairColor(hex, null, dyeMode);
    } else {
      if (selectingSlot === 'primary') {
        setHairColor(hex, outfit.hairColorSecondary || selectedSecondary, dyeMode);
      } else {
        setHairColor(outfit.hairColorPrimary || selectedPrimary, hex, dyeMode);
      }
    }
  };

  const handleModeChange = (mode) => {
    if (mode !== 'single' && !hasDyeKit) return;
    setDyeMode(mode);
    if (mode === 'single' || mode === 'rainbow') {
      setHairColor(selectedPrimary, null, mode);
    } else {
      setHairColor(selectedPrimary, selectedSecondary, mode);
    }
  };

  const showDualPicker = dyeMode === 'split' || dyeMode === 'ombre' || dyeMode === 'streak';

  return (
    <div className="flex flex-col gap-2 px-2">
      {/* Dye Mode Selector */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
        {DYE_MODES.map((mode) => {
          const isActive = dyeMode === mode.key;
          const isLocked = mode.key !== 'single' && !hasDyeKit;
          return (
            <button
              key={mode.key}
              onClick={() => handleModeChange(mode.key)}
              disabled={isLocked}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all
                ${isActive
                  ? 'bg-[#ff2d78] text-white'
                  : isLocked
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white/10 text-white/50 hover:text-white/70'
                }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {isLocked ? `🔒 ${mode.label}` : mode.label}
            </button>
          );
        })}
      </div>

      {/* Dual color selector for split/ombre/streak */}
      {showDualPicker && (
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={() => setSelectingSlot('primary')}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectingSlot === 'primary' ? 'border-white scale-110' : 'border-white/30'
            }`}
            style={{ backgroundColor: selectedPrimary }}
          />
          <span className="text-white/40 text-xs" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {dyeMode === 'split' ? 'L / R' : dyeMode === 'ombre' ? 'Root / Tip' : 'Base / Streak'}
          </span>
          <button
            onClick={() => setSelectingSlot('secondary')}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectingSlot === 'secondary' ? 'border-white scale-110' : 'border-white/30'
            }`}
            style={{ backgroundColor: selectedSecondary }}
          />
        </div>
      )}

      {/* Palette tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {PALETTES.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePalette(p.key)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all
              ${activePalette === p.key
                ? 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40'
                : 'bg-white/5 text-white/40 hover:text-white/60'
              }`}
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Color grid */}
      <div className="grid grid-cols-6 gap-2 py-1">
        {paletteColors.map((color) => {
          const isSelected =
            (selectingSlot === 'primary' && selectedPrimary === color.hex) ||
            (selectingSlot === 'secondary' && selectedSecondary === color.hex);
          return (
            <button
              key={color.id}
              onClick={() => handleColorSelect(color.hex)}
              title={color.name}
              className={`w-9 h-9 rounded-full transition-all duration-200 mx-auto
                ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d0010] scale-110' : 'hover:scale-105'}`}
              style={{
                backgroundColor: color.hex,
                boxShadow: isSelected ? `0 0 12px ${color.hex}80` : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
