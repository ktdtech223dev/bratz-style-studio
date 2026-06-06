import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

// A single <audio> mounted at the app root so music keeps playing across pages.
// Reacts to synced store state and works around iOS autoplay by retrying on the
// next user gesture when programmatic play() is blocked.
export default function GlobalAudio() {
  const radio = useStore((s) => s.radio);
  const currentStation = useStore((s) => s.currentStation);
  const musicPlaying = useStore((s) => s.musicPlaying);
  const volume = useStore((s) => s.musicVolume);
  const muted = useStore((s) => s.musicMuted);

  const audioRef = useRef(null);
  const retryRef = useRef(null);

  // volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const station = radio.find((r) => r.id === currentStation);

    // remove any pending gesture-retry listener
    const clearRetry = () => {
      if (retryRef.current) {
        document.removeEventListener('pointerdown', retryRef.current);
        document.removeEventListener('touchend', retryRef.current);
        retryRef.current = null;
      }
    };

    if (station && musicPlaying) {
      const url = station.url;
      if (audio.src !== url) audio.src = url;
      audio.volume = muted ? 0 : volume;
      const p = audio.play();
      if (p && p.catch) {
        p.catch(() => {
          // Autoplay blocked (e.g. partner's device). Retry on next tap.
          clearRetry();
          const retry = () => {
            audio.play().then(clearRetry).catch(() => {});
          };
          retryRef.current = retry;
          document.addEventListener('pointerdown', retry, { once: true });
          document.addEventListener('touchend', retry, { once: true });
        });
      }
    } else {
      clearRetry();
      audio.pause();
      if (!station) audio.removeAttribute('src');
    }

    return clearRetry;
  }, [currentStation, musicPlaying, radio, volume, muted]);

  return <audio ref={audioRef} preload="none" playsInline />;
}
