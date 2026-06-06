import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Headphones, CloudRain, Sunrise, TreePine, Moon, Volume2, VolumeX, Play, Pause, Square, Music as MusicIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { shortRel } from '../lib/time';

const ICONS = { heart: Heart, headphones: Headphones, 'cloud-rain': CloudRain, sunrise: Sunrise, 'tree-pine': TreePine, moon: Moon };

function Equalizer({ color, playing }) {
  return (
    <div className="flex h-7 items-end gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1.5 rounded-full"
          style={{
            height: '100%',
            background: color,
            transformOrigin: 'bottom',
            animation: playing ? `eq ${0.7 + i * 0.12}s ${i * 0.1}s infinite ease-in-out` : 'none',
            opacity: playing ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

export default function Music() {
  const radio = useStore((s) => s.radio);
  const emit = useStore((s) => s.emit);
  const currentStation = useStore((s) => s.currentStation);
  const stationMeta = useStore((s) => s.stationMeta);
  const users = useStore((s) => s.users);
  const me = useStore((s) => s.me);

  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);

  const current = radio.find((r) => r.id === currentStation);
  const updater = stationMeta ? users.find((u) => u.id === stationMeta.by) : null;

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // When the synced station changes from the partner, stop local playback (needs a tap to start on iOS)
  useEffect(() => {
    if (!current) {
      if (audioRef.current) audioRef.current.pause();
      setPlaying(false);
    }
  }, [currentStation]);

  async function selectStation(st) {
    emit('music:select', { stationId: st.id });
    if (audioRef.current) {
      audioRef.current.src = st.url;
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  }

  function togglePlay() {
    if (!audioRef.current || !current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      if (!audioRef.current.src) audioRef.current.src = current.url;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  function stop() {
    emit('music:select', { stationId: null });
    if (audioRef.current) audioRef.current.pause();
    setPlaying(false);
  }

  return (
    <div>
      <audio ref={audioRef} preload="none" />
      <PageHeader
        title="Music"
        right={
          <button
            onClick={() => setMuted((m) => !m)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-[var(--cyan)]"
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        }
      />

      <div className="px-5">
        {/* NOW PLAYING */}
        <Card className="overflow-hidden p-5" delay={0}>
          <div className="text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">Now playing</div>
          {current ? (
            <div className="mt-3 flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: current.color + '22' }}
              >
                {(() => {
                  const I = ICONS[current.icon] || MusicIcon;
                  return <I size={26} style={{ color: current.color }} />;
                })()}
              </div>
              <div className="flex-1">
                <div className="text-lg font-extrabold">{current.label}</div>
                {updater && (
                  <div className="text-xs text-[var(--muted)]">
                    {updater.id === me?.id ? 'You' : updater.display_name} · {shortRel(stationMeta?.at)}
                  </div>
                )}
              </div>
              <Equalizer color={current.color} playing={playing} />
            </div>
          ) : (
            <div className="mt-3 text-[var(--text2)]">nothing playing right now 🌙</div>
          )}

          {current && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl font-extrabold text-[#1a1f4a]"
                style={{ background: current.color }}
              >
                {playing ? <Pause size={18} fill="#1a1f4a" /> : <Play size={18} fill="#1a1f4a" />}
                {playing ? 'Pause' : 'Play'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-[var(--cyan)]"
              />
            </div>
          )}
        </Card>

        {/* STATION LIST */}
        <div className="mt-5 space-y-2.5">
          {radio.map((st, i) => {
            const I = ICONS[st.icon] || MusicIcon;
            const active = st.id === currentStation;
            return (
              <motion.button
                key={st.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => selectStation(st)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3.5 active:scale-[0.99]"
                style={active ? { boxShadow: `inset 0 0 0 1.5px ${st.color}` } : {}}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: st.color + '22' }}>
                  <I size={22} style={{ color: st.color }} />
                </div>
                <span className="flex-1 text-left font-bold">{st.label}</span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: active ? st.color : st.color + '22' }}
                >
                  <Play size={16} fill={active ? '#1a1f4a' : st.color} color={active ? '#1a1f4a' : st.color} />
                </span>
              </motion.button>
            );
          })}

          <button
            onClick={stop}
            className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-3.5 active:scale-[0.99]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5">
              <Square size={20} className="text-[var(--muted)]" />
            </div>
            <span className="flex-1 text-left font-bold text-[var(--text2)]">No music</span>
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          station choice is shared · audio plays on each device (tap play)
        </p>
      </div>
    </div>
  );
}
