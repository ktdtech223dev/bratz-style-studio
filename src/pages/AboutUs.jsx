import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Gift,
  Heart,
  Cake,
  Star,
  Plus,
  X,
  Utensils,
  Camera,
  Sparkles,
  Trash2,
  LogOut,
  Bell,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { enablePush, disablePush, pushSupported, pushPermission } from '../lib/push';

const DATE_ICONS = { gift: Gift, heart: Heart, cake: Cake, star: Star };
const THEMES = [
  { id: 'lavender', label: 'Lavender', swatch: ['#b8a9e8', '#1a1f4a'] },
  { id: 'sunset', label: 'Sunset', swatch: ['#ff7a6b', '#2b1c3f'] },
  { id: 'midnight', label: 'Midnight', swatch: ['#38bdf8', '#0e1730'] },
  { id: 'forest', label: 'Forest', swatch: ['#9be89b', '#14241c'] },
  { id: 'cottoncandy', label: 'Candy', swatch: ['#ff7ab3', '#2a1f33'] },
];
const SECTIONS = [
  { id: 'favorite_spots', label: 'Favorite spots to eat', icon: Utensils, color: '#fdba74' },
  { id: 'memories', label: 'Favorite memories', icon: Camera, color: '#7dd3fc' },
  { id: 'facts', label: 'Fun facts', icon: Sparkles, color: '#c084fc' },
];

function nextOccurrence(dateStr) {
  // dateStr is MM-DD or YYYY-MM-DD
  const now = new Date();
  let target;
  if (dateStr.length === 5) {
    const [m, d] = dateStr.split('-').map(Number);
    target = new Date(now.getFullYear(), m - 1, d);
    if (target < new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      target = new Date(now.getFullYear() + 1, m - 1, d);
  } else {
    target = new Date(dateStr + 'T00:00:00');
  }
  return target;
}

function relPill(dateStr) {
  const target = nextOccurrence(dateStr);
  const today = new Date();
  const days = Math.round(
    (new Date(target.getFullYear(), target.getMonth(), target.getDate()) -
      new Date(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  );
  if (days < 0) return 'PASSED';
  if (days === 0) return 'TODAY';
  if (days === 1) return 'TOMORROW';
  if (days < 14) return `IN ${days} DAYS`;
  if (days < 60) return `IN ${Math.round(days / 7)} WEEKS`;
  return `IN ${Math.round(days / 30)} MONTHS`;
}

export default function AboutUs() {
  const me = useStore((s) => s.me);
  const setMe = useStore((s) => s.setMe);
  const logout = useStore((s) => s.logout);
  const couple = useStore((s) => s.couple);
  const storeUsers = useStore((s) => s.users);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const nav = useNavigate();

  const [about, setAbout] = useState({ dates: [], items: [], users: [] });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addDate, setAddDate] = useState(false);
  const [addItem, setAddItem] = useState(null); // section id

  async function load() {
    const a = await api.get('/api/about');
    setAbout(a);
  }
  useEffect(() => {
    load();
  }, []);

  const users = about.users.length ? about.users : storeUsers;
  const u1 = users[0];
  const u2 = users[1];
  const myUser = users.find((u) => u.id === me?.id);

  const sorted = [...about.dates].sort((a, b) => nextOccurrence(a.date) - nextOccurrence(b.date));

  return (
    <div>
      <PageHeader
        title="About us"
        back={false}
        right={
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-[var(--lavender)]"
          >
            <Settings size={20} />
          </button>
        }
      />

      <div className="px-5 pb-6">
        {/* avatars */}
        <div className="mb-7 flex items-center justify-center gap-4">
          {u1 && (
            <div className="flex flex-col items-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-extrabold text-[#1a1f4a] shadow-glow"
                style={{ background: u1.color }}
              >
                {u1.display_name[0]}
              </div>
              <div className="mt-2 font-bold">{u1.display_name}</div>
            </div>
          )}
          <div className="pb-7 text-3xl font-extrabold text-[var(--pink-hot)]">&amp;</div>
          {u2 && (
            <div className="flex flex-col items-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-extrabold text-[#1a1f4a] shadow-glow"
                style={{ background: u2.color }}
              >
                {u2.display_name[0]}
              </div>
              <div className="mt-2 font-bold">{u2.display_name}</div>
            </div>
          )}
        </div>

        {/* stats */}
        <Card className="p-5">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
            Our stats
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat emoji="⭐" value={couple?.stars ?? 0} label="OUR STARS" color="#fde047" />
            <Stat emoji="🔥" value={myUser?.streak ?? 0} label="MY STREAK" color="#fdba74" />
            <Stat emoji="⚡" value={couple?.our_streak ?? 0} label="OUR STREAK" color="#67e8f9" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => nav('/stats')}
              className="rounded-xl bg-[var(--bg2)] py-2.5 text-sm font-bold text-[var(--cyan)]"
            >
              Full stats
            </button>
            <button
              onClick={() => nav('/timeline')}
              className="rounded-xl bg-[var(--bg2)] py-2.5 text-sm font-bold text-[var(--pink)]"
            >
              Our timeline
            </button>
          </div>
        </Card>

        {/* appearance / themes */}
        <Card className="mt-4 p-5">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
            Appearance
          </div>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="flex flex-col items-center gap-1.5"
                aria-label={t.label}
              >
                <span
                  className="h-11 w-11 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${t.swatch[0]} 0%, ${t.swatch[1]} 100%)`,
                    boxShadow: theme === t.id ? '0 0 0 3px var(--pink-hot)' : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                  }}
                />
                <span className="text-[10px] font-bold text-[var(--text2)]">{t.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* special dates */}
        <div className="mb-2 mt-7 flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--lav-text)]">
            Special dates
          </h3>
          <button onClick={() => setAddDate(true)} className="text-[var(--lavender)]">
            <Plus size={20} />
          </button>
        </div>
        <div className="space-y-2">
          {sorted.map((d, i) => {
            const I = DATE_ICONS[d.icon] || Gift;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pink-hot)]/20">
                  <I size={20} className="text-[var(--pink-hot)]" />
                </div>
                <div className="flex-1">
                  <div className="font-bold">{d.label}</div>
                  <div className="text-xs text-[var(--muted)]">{d.date}</div>
                </div>
                <span className="rounded-full bg-[var(--cyan)]/15 px-2.5 py-1 text-[11px] font-extrabold text-[var(--cyan)]">
                  {relPill(d.date)}
                </span>
                <button
                  onClick={async () => {
                    await api.del(`/api/about/date/${d.id}`);
                    load();
                  }}
                  className="text-[var(--muted)]"
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            );
          })}
          {sorted.length === 0 && (
            <p className="py-4 text-center text-sm text-[var(--muted)]">add your special days 💝</p>
          )}
        </div>

        {/* editable sections */}
        {SECTIONS.map((sec) => {
          const items = about.items.filter((it) => it.section === sec.id);
          const I = sec.icon;
          return (
            <div key={sec.id} className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest" style={{ color: sec.color }}>
                  <I size={14} /> {sec.label}
                </h3>
                <button onClick={() => setAddItem(sec.id)} style={{ color: sec.color }}>
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <div className="flex-1">
                      {it.title && <div className="font-bold">{it.title}</div>}
                      {it.body && <div className="text-sm text-[var(--text2)]">{it.body}</div>}
                    </div>
                    <button
                      onClick={async () => {
                        await api.del(`/api/about/item/${it.id}`);
                        load();
                      }}
                      className="text-[var(--muted)]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="py-2 text-center text-xs text-[var(--muted)]">nothing here yet — tap + to add</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add date sheet */}
      <AddDateSheet open={addDate} onClose={() => setAddDate(false)} onSaved={load} />
      {/* Add item sheet */}
      <AddItemSheet
        section={addItem}
        sectionLabel={SECTIONS.find((s) => s.id === addItem)?.label}
        userId={me?.id}
        onClose={() => setAddItem(null)}
        onSaved={load}
      />
      {/* Settings sheet */}
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        me={me}
        setMe={setMe}
        logout={logout}
      />
    </div>
  );
}

function Stat({ emoji, value, label, color }) {
  return (
    <div className="rounded-2xl bg-[var(--bg2)] py-3">
      <div className="text-xl">{emoji}</div>
      <div className="text-xl font-extrabold" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] font-bold tracking-wide text-[var(--muted)]">{label}</div>
    </div>
  );
}

function Sheet({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(10,12,30,0.7)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ y: 420 }}
            animate={{ y: 0 }}
            exit={{ y: 420 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[520px] rounded-t-3xl bg-[var(--bg2)] p-5 pb-8 safe-bottom"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">{title}</h3>
              <button onClick={onClose} className="text-[var(--muted)]">
                <X size={22} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AddDateSheet({ open, onClose, onSaved }) {
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const [icon, setIcon] = useState('gift');
  async function save() {
    if (!label || !date) return;
    await api.post('/api/about/date', { label, date, icon });
    setLabel('');
    setDate('');
    onSaved();
    onClose();
  }
  return (
    <Sheet open={open} onClose={onClose} title="Add special date">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label (e.g. Anniversary)" className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4 text-[var(--text)]" />
      <div className="mb-4 flex gap-2">
        {Object.entries(DATE_ICONS).map(([k, I]) => (
          <button
            key={k}
            onClick={() => setIcon(k)}
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: icon === k ? 'var(--pink-hot)' : 'var(--card)' }}
          >
            <I size={20} color={icon === k ? '#fff' : 'var(--text2)'} />
          </button>
        ))}
      </div>
      <button onClick={save} className="w-full rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95">
        Save date
      </button>
    </Sheet>
  );
}

function AddItemSheet({ section, sectionLabel, userId, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  async function save() {
    if (!title && !body) return;
    await api.post('/api/about/item', { section, userId, title, body });
    setTitle('');
    setBody('');
    onSaved();
    onClose();
  }
  return (
    <Sheet open={!!section} onClose={onClose} title={`Add to ${sectionLabel || ''}`}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="details (optional)" className="mb-4 w-full resize-none rounded-2xl bg-[var(--card)] p-4" />
      <button onClick={save} className="w-full rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95">
        Add
      </button>
    </Sheet>
  );
}

function SettingsSheet({ open, onClose, me, setMe, logout }) {
  const pushKey = useStore((s) => s.pushKey);
  const [name, setName] = useState(me?.display_name || '');
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [notif, setNotif] = useState(pushPermission());

  async function toggleNotif() {
    try {
      if (notif === 'granted') {
        await disablePush();
        setNotif('default');
        setMsg('Notifications off');
      } else {
        await enablePush(me.id, pushKey);
        setNotif('granted');
        setMsg('Notifications on ✓');
      }
    } catch (e) {
      setMsg(e.message || 'Could not enable');
    }
    setTimeout(() => setMsg(''), 2500);
  }

  async function saveName() {
    await api.post('/api/settings/name', { userId: me.id, display_name: name });
    setMe({ ...me, display_name: name });
    setMsg('Saved ✓');
    setTimeout(() => setMsg(''), 1500);
  }
  async function savePin() {
    if (!/^\d{4}$/.test(pin)) {
      setMsg('PIN must be 4 digits');
      return;
    }
    await api.post('/api/settings/pin', { userId: me.id, pin });
    setPin('');
    setMsg('PIN updated ✓');
    setTimeout(() => setMsg(''), 1500);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <label className="mb-1 block text-xs font-bold text-[var(--text2)]">Display name</label>
      <div className="mb-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-2xl bg-[var(--card)] p-3.5" />
        <button onClick={saveName} className="rounded-2xl bg-[var(--lavender)] px-4 font-extrabold text-[#1a1f4a]">
          Save
        </button>
      </div>

      <label className="mb-1 block text-xs font-bold text-[var(--text2)]">Change PIN</label>
      <div className="mb-2 flex gap-2">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          placeholder="4 digits"
          className="flex-1 rounded-2xl bg-[var(--card)] p-3.5 tracking-[0.5em]"
        />
        <button onClick={savePin} className="rounded-2xl bg-[var(--lavender)] px-4 font-extrabold text-[#1a1f4a]">
          Set
        </button>
      </div>

      {pushSupported() && (
        <button
          onClick={toggleNotif}
          className="mb-2 flex w-full items-center justify-between rounded-2xl bg-[var(--card)] p-4"
        >
          <span className="flex items-center gap-2 font-bold">
            <Bell size={18} className="text-[var(--yellow)]" /> Notifications
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-extrabold"
            style={{
              background: notif === 'granted' ? 'var(--green)' : 'var(--card2)',
              color: notif === 'granted' ? '#1a1f4a' : 'var(--text2)',
            }}
          >
            {notif === 'granted' ? 'ON' : 'OFF'}
          </span>
        </button>
      )}

      {msg && <p className="mb-2 text-center text-sm text-[var(--green)]">{msg}</p>}

      <button
        onClick={logout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--card)] py-3.5 font-bold text-[var(--pink-hot)]"
      >
        <LogOut size={18} /> Sign out
      </button>
    </Sheet>
  );
}
