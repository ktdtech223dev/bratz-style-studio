import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { shortRel } from '../lib/time';

export default function MoodTrends() {
  const users = useStore((s) => s.users);
  const me = useStore((s) => s.me);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/api/mood/history?days=30').then(setRows).catch(() => {});
  }, []);

  function forUser(id) {
    return rows.filter((r) => r.user_id === id);
  }
  function topMoods(list) {
    const counts = {};
    list.forEach((r) => {
      counts[r.mood] = counts[r.mood] || { count: 0, emoji: r.emoji, color: r.color };
      counts[r.mood].count++;
    });
    return Object.entries(counts)
      .map(([mood, v]) => ({ mood, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  const ordered = [me, ...users.filter((u) => u.id !== me?.id)].filter(Boolean);

  return (
    <div>
      <PageHeader title="Mood trends" sub="last 30 days" />
      <div className="space-y-5 px-5 pb-6">
        {rows.length === 0 && (
          <Card className="p-8 text-center text-sm text-[var(--text2)]">
            No mood history yet — set some moods and they’ll show up here 🌈
          </Card>
        )}
        {ordered.map((u) => {
          const list = forUser(u.id);
          const top = topMoods(list);
          const max = Math.max(1, ...top.map((t) => t.count));
          const full = users.find((x) => x.id === u.id) || u;
          return (
            <Card key={u.id} className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: full.color }} />
                <span className="font-extrabold">{u.id === me?.id ? 'You' : full.display_name}</span>
                <span className="ml-auto text-xs text-[var(--muted)]">{list.length} updates</span>
              </div>
              {top.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">no moods logged yet</p>
              ) : (
                <div className="space-y-2">
                  {top.map((t) => (
                    <div key={t.mood} className="flex items-center gap-2">
                      <span className="w-7 text-center text-lg">{t.emoji}</span>
                      <span className="w-20 text-sm font-semibold">{t.mood}</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(t.count / max) * 100}%`, background: t.color }}
                        />
                      </div>
                      <span className="w-5 text-right text-xs font-bold text-[var(--text2)]">{t.count}</span>
                    </div>
                  ))}
                </div>
              )}
              {list.length > 0 && (
                <div className="mt-4 border-t border-white/5 pt-3">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Recent</div>
                  <div className="flex flex-wrap gap-2">
                    {list.slice(0, 8).map((r, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-full bg-[var(--bg2)] px-2.5 py-1 text-xs"
                        title={shortRel(r.created_at)}
                      >
                        {r.emoji} {r.mood}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
