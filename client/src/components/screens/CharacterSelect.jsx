import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import characters from '../../data/characters';
import { getCharacterPreviewSvg } from '../../utils/itemPreview';

/**
 * Character selection screen with 2x2 grid of character cards.
 * Locked characters show overlay with unlock requirements.
 * Selected character enables "Let's Go!" button to proceed.
 */
export default function CharacterSelect() {
  const collection = useGameStore((s) => s.collection);
  const player = useGameStore((s) => s.player);
  const selectCharacter = useGameStore((s) => s.selectCharacter);
  const setScreen = useGameStore((s) => s.setScreen);
  const [selectedId, setSelectedId] = useState(null);

  const unlockStatus = useMemo(() => {
    const status = {};
    for (const char of characters) {
      if (!char.unlockRequirement) {
        status[char.id] = true;
        continue;
      }
      const req = char.unlockRequirement;
      switch (req.type) {
        case 'items_collected':
          status[char.id] = collection.size >= req.count;
          break;
        case 'challenges_completed':
          // Use a simplified check - in a real app this would track challenge completions
          status[char.id] = false; // Placeholder - needs challenge tracking
          break;
        case 'gacha_10pull':
          status[char.id] = player.totalPulls >= 10;
          break;
        default:
          status[char.id] = false;
      }
    }
    return status;
  }, [collection, player.totalPulls]);

  const handleSelect = (charId) => {
    if (!unlockStatus[charId]) return;
    setSelectedId(charId);
  };

  const handleGo = () => {
    if (!selectedId) return;
    selectCharacter(selectedId);
    setScreen('dressup');
  };

  return (
    <div className="min-h-screen bg-[#0d0010] flex flex-col items-center px-4 py-6">
      {/* Title */}
      <h1
        className="text-3xl text-[#ff2d78] mb-1 text-center"
        style={{ fontFamily: 'Pacifico, cursive' }}
      >
        Choose Your Girl
      </h1>
      <p
        className="text-white/40 text-xs mb-6 text-center"
        style={{ fontFamily: 'Nunito, sans-serif' }}
      >
        Pick a Bratz doll to style
      </p>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {characters.map((char) => {
          const isUnlocked = unlockStatus[char.id];
          const isSelected = selectedId === char.id;
          const previewSrc = getCharacterPreviewSvg(char.skinBase);

          return (
            <button
              key={char.id}
              onClick={() => handleSelect(char.id)}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300
                aspect-[3/4] flex flex-col items-center justify-end
                focus:outline-none
                ${isSelected ? 'scale-[1.03]' : 'hover:scale-[1.01]'}
                ${!isUnlocked ? 'cursor-not-allowed' : ''}`}
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                border: isSelected
                  ? '2px solid #ff2d78'
                  : '2px solid rgba(255,255,255,0.1)',
                boxShadow: isSelected
                  ? '0 0 20px rgba(255,45,120,0.5), 0 0 40px rgba(255,45,120,0.2)'
                  : 'none',
              }}
            >
              {/* Character Preview */}
              <div className="flex-1 flex items-center justify-center pt-3 pb-1">
                <img
                  src={previewSrc}
                  alt={char.name}
                  className="h-[70%] object-contain"
                  draggable={false}
                />
              </div>

              {/* Name & Title */}
              <div className="w-full px-3 pb-3 text-center">
                <h2
                  className="text-lg text-white leading-tight"
                  style={{ fontFamily: 'Pacifico, cursive' }}
                >
                  {char.name}
                </h2>
                <p
                  className="text-[10px] text-[#ffd700]/70 mt-0.5"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {char.title}
                </p>
              </div>

              {/* Locked Overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center rounded-2xl">
                  <span className="text-3xl mb-2">🔒</span>
                  <p
                    className="text-white/60 text-[10px] px-3 text-center leading-tight"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    {char.unlockRequirement?.description || 'Locked'}
                  </p>
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#ff2d78] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{'\u2713'}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Let's Go Button */}
      {selectedId && (
        <button
          onClick={handleGo}
          className="mt-6 px-10 py-3 bg-[#ff2d78] text-white rounded-full text-lg font-bold
            shadow-lg shadow-pink-500/40 hover:shadow-pink-500/60
            transition-all duration-300 hover:scale-105 active:scale-95"
          style={{ fontFamily: 'Pacifico, cursive' }}
        >
          Let's Go!
        </button>
      )}

      {/* Back hint */}
      <button
        onClick={() => setScreen('splash')}
        className="mt-4 text-white/30 text-xs hover:text-white/50 transition-colors"
        style={{ fontFamily: 'Nunito, sans-serif' }}
      >
        {'\u2190'} Back to menu
      </button>
    </div>
  );
}
