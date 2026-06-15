import { useEffect, useState } from 'react';
import { Plus, Trash2, Music } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';

export default function Dedications() {
  const dedications = useStore((s) => s.dedications);
  const refreshDedications = useStore((s) => s.refreshDedications);
  const me = useStore((s) => s.me);

  const [adding, setAdding] = useState(false);
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    refreshDedications();
  }, [refreshDedications]);

  async function add() {
    if (!song.trim()) return;
    await api.post('/api/dedications', { song: song.trim(), artist: artist.trim(), note: note.trim(), userId: me.id });
    setSong('');
    setArtist('');
    setNote('');
    setAdding(false);
  }

  return (
    <div>
      <PageHeader
        title="Our songs"
        sub="dedicate a song to each other 🎶"
        right={
          <button
            onClick={() => setAdding(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--purple)] text-white"
          >
            <Plus size={22} />
          </button>
        }
      />
      <div className="space-y-2.5 px-5 pb-6">
        {dedications.length === 0 && (
          <p className="mt-16 text-center text-sm text-[var(--muted)]">dedicate your first song 🎶</p>
        )}
        {dedications.map((d) => (
          <div key={d.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: (d.dedicated_color || '#c084fc') + '22' }}
            >
              <Music size={20} style={{ color: d.dedicated_color || '#c084fc' }} />
            </span>
            <div className="flex-1">
              <div className="font-extrabold leading-tight">{d.song}</div>
              {d.artist && <div className="text-xs text-[var(--text2)]">{d.artist}</div>}
              {d.note && <div className="mt-1 text-sm text-[var(--text)]">“{d.note}”</div>}
              <div className="mt-1 text-[11px] text-[var(--muted)]">— {d.dedicated_name}</div>
            </div>
            {d.dedicated_by === me?.id && (
              <button onClick={() => api.del(`/api/dedications/${d.id}`)} className="text-[var(--muted)]">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Dedicate a song">
        <input
          value={song}
          onChange={(e) => setSong(e.target.value)}
          placeholder="song title"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="artist"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="why this song reminds you of them…"
          className="mb-4 w-full resize-none rounded-2xl bg-[var(--card)] p-4"
        />
        <button
          onClick={add}
          disabled={!song.trim()}
          className="w-full rounded-2xl bg-[var(--purple)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
        >
          Dedicate 🎶
        </button>
      </Sheet>
    </div>
  );
}
