// AudioContext-based sound synthesis for Bratz Style Studio
// All sounds generated programmatically — no external audio files needed

let audioCtx = null;
let soundEnabled = true;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
}

export function isSoundEnabled() {
  return soundEnabled;
}

function playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0) {
  if (!soundEnabled) return;
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch (e) { /* ignore audio errors */ }
}

function playNoise(duration, volume = 0.1, delay = 0) {
  if (!soundEnabled) return;
  try {
    const ctx = getContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    source.start(ctx.currentTime + delay);
  } catch (e) { /* ignore */ }
}

// UI tap: short soft click (100ms)
export function playTap() {
  playTone(800, 0.08, 'sine', 0.15);
  playTone(1200, 0.05, 'sine', 0.08, 0.02);
}

// Item equip: satisfying pop/click (200ms)
export function playEquip() {
  playTone(600, 0.05, 'sine', 0.2);
  playTone(900, 0.1, 'sine', 0.25, 0.05);
  playTone(1100, 0.08, 'sine', 0.15, 0.1);
}

// Full outfit equip: sparkle chime (500ms)
export function playFullEquip() {
  playTone(800, 0.15, 'sine', 0.2);
  playTone(1000, 0.15, 'sine', 0.2, 0.1);
  playTone(1200, 0.15, 'sine', 0.2, 0.2);
  playTone(1500, 0.2, 'sine', 0.25, 0.3);
  playNoise(0.1, 0.05, 0.3);
}

// Gacha pull start: tension whoosh (1s)
export function playGachaStart() {
  playNoise(0.8, 0.15);
  playTone(200, 0.5, 'sawtooth', 0.1);
  playTone(400, 0.5, 'sawtooth', 0.08, 0.3);
  playTone(600, 0.3, 'sine', 0.1, 0.6);
}

// Gacha reveal common: soft ding (300ms)
export function playRevealCommon() {
  playTone(880, 0.2, 'sine', 0.2);
  playTone(1100, 0.15, 'sine', 0.1, 0.1);
}

// Gacha reveal rare: higher ding + sparkle (500ms)
export function playRevealRare() {
  playTone(880, 0.15, 'sine', 0.25);
  playTone(1320, 0.2, 'sine', 0.2, 0.1);
  playTone(1760, 0.15, 'triangle', 0.1, 0.25);
  playNoise(0.1, 0.03, 0.3);
}

// Gacha reveal epic: chord + burst (800ms)
export function playRevealEpic() {
  playTone(660, 0.3, 'sine', 0.2);
  playTone(880, 0.3, 'sine', 0.2);
  playTone(1320, 0.3, 'sine', 0.2, 0.1);
  playTone(1760, 0.2, 'triangle', 0.15, 0.3);
  playNoise(0.15, 0.08, 0.2);
  playTone(2200, 0.15, 'sine', 0.1, 0.5);
}

// Gacha reveal legendary: FULL fanfare (2s)
export function playRevealLegendary() {
  // Dramatic opening
  playTone(440, 0.3, 'sawtooth', 0.15);
  playNoise(0.2, 0.1);
  // Rising chord
  playTone(660, 0.3, 'sine', 0.25, 0.3);
  playTone(880, 0.3, 'sine', 0.25, 0.3);
  playTone(1100, 0.3, 'sine', 0.2, 0.3);
  // Sparkle cascade
  playTone(1320, 0.2, 'sine', 0.2, 0.6);
  playTone(1760, 0.2, 'sine', 0.2, 0.8);
  playTone(2200, 0.2, 'sine', 0.15, 1.0);
  playTone(2640, 0.15, 'sine', 0.12, 1.2);
  // Final triumphant chord
  playTone(880, 0.5, 'sine', 0.25, 1.4);
  playTone(1100, 0.5, 'sine', 0.2, 1.4);
  playTone(1320, 0.5, 'sine', 0.2, 1.4);
  playTone(1760, 0.5, 'triangle', 0.15, 1.4);
  playNoise(0.15, 0.05, 1.4);
}

// Coin earn: coin jingle (300ms)
export function playCoinEarn() {
  playTone(1200, 0.1, 'sine', 0.2);
  playTone(1500, 0.1, 'sine', 0.2, 0.08);
  playTone(1800, 0.12, 'sine', 0.15, 0.16);
}

// Gem earn: crystal chime (400ms)
export function playGemEarn() {
  playTone(2000, 0.15, 'sine', 0.15);
  playTone(2500, 0.15, 'sine', 0.12, 0.1);
  playTone(3000, 0.12, 'triangle', 0.1, 0.2);
  playTone(3500, 0.1, 'sine', 0.08, 0.3);
}

// Challenge complete: success jingle (600ms)
export function playChallengeComplete() {
  playTone(660, 0.15, 'sine', 0.2);
  playTone(880, 0.15, 'sine', 0.2, 0.12);
  playTone(1100, 0.15, 'sine', 0.2, 0.24);
  playTone(1320, 0.25, 'sine', 0.25, 0.36);
  playNoise(0.08, 0.03, 0.4);
}

// Daily login: cheerful chime sequence (1s)
export function playDailyLogin() {
  playTone(523, 0.15, 'sine', 0.2);
  playTone(659, 0.15, 'sine', 0.2, 0.15);
  playTone(784, 0.15, 'sine', 0.2, 0.3);
  playTone(1047, 0.3, 'sine', 0.25, 0.45);
  playTone(784, 0.15, 'triangle', 0.1, 0.6);
  playTone(1047, 0.3, 'sine', 0.2, 0.75);
  playNoise(0.1, 0.03, 0.8);
}

// Save look: soft confirmation chime (400ms)
export function playSave() {
  playTone(800, 0.15, 'sine', 0.15);
  playTone(1000, 0.15, 'sine', 0.15, 0.1);
  playTone(1200, 0.2, 'sine', 0.12, 0.2);
}

// Error/locked item: soft negative beep (200ms)
export function playError() {
  playTone(300, 0.15, 'square', 0.15);
  playTone(250, 0.1, 'square', 0.1, 0.08);
}

// Navigation tap
export function playNav() {
  playTone(700, 0.06, 'sine', 0.12);
  playTone(900, 0.04, 'sine', 0.08, 0.03);
}
