import { create } from 'zustand';
import { connectSocket, getSocket } from '../lib/socket';
import { api } from '../lib/api';

const LS_KEY = 'us_auth_v1';

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  } catch {
    return null;
  }
}

export const useStore = create((set, get) => ({
  me: loadAuth(), // { id, display_name, color, username }
  users: [],
  partner: null,
  couple: null,
  pet: null,
  plant: null,
  radio: [],
  games: null,
  moods: {}, // userId -> { userId, mood, emoji, color, at }
  presence: {}, // userId -> bool
  currentStation: null,
  stationMeta: null, // { stationId, by, at }
  musicPlaying: false,
  musicVolume: 0.7,
  musicMuted: false,
  places: [],
  bucket: [],
  decor: null,
  pushKey: null,
  milestones: [],
  watchlist: [],
  events: [],
  truthordare: null,
  affectionQueue: [],
  activity: [],
  notes: [],
  photos: [],
  today: null,
  diaryEntries: [],
  ready: false,

  setMe: (me) => {
    if (me) localStorage.setItem(LS_KEY, JSON.stringify(me));
    else localStorage.removeItem(LS_KEY);
    set({ me });
  },

  logout: () => {
    localStorage.removeItem(LS_KEY);
    const s = getSocket();
    if (s) s.disconnect();
    set({ me: null, ready: false });
  },

  // Pull bootstrap state and wire the socket. Call after login / on app load.
  init: async () => {
    const me = get().me;
    if (!me) return;
    connectSocket(me.id);
    get().bindSocket();
    try {
      const st = await api.state();
      const moods = {};
      st.users.forEach((u) => {
        if (u.current_mood)
          moods[u.id] = {
            userId: u.id,
            mood: u.current_mood,
            emoji: u.mood_emoji,
            color: u.mood_color,
            at: u.mood_at,
          };
      });
      const partner = st.users.find((u) => u.id !== me.id) || null;
      set({
        users: st.users,
        partner,
        couple: st.couple,
        pet: st.pet,
        plant: st.plant,
        radio: st.radio,
        games: st.games,
        today: st.today,
        decor: st.decor || null,
        pushKey: st.pushKey || null,
        truthordare: st.truthordare || null,
        moods,
        ready: true,
      });
    } catch (e) {
      set({ ready: true });
    }
  },

  partnerId: () => {
    const me = get().me;
    const p = get().partner;
    return p ? p.id : me && me.id === 1 ? 2 : 1;
  },

  bindSocket: () => {
    const s = getSocket();
    if (!s || s._usBound) return;
    s._usBound = true;
    s.on('mood:update', (m) => set((st) => ({ moods: { ...st.moods, [m.userId]: m } })));
    s.on('affection:receive', (a) => set((st) => ({ affectionQueue: [...st.affectionQueue, a] })));
    s.on('pet:update', (pet) => set({ pet }));
    s.on('plant:update', (plant) => set({ plant }));
    s.on('couple:update', (couple) => set({ couple }));
    s.on('users:streaks', (users) =>
      set((st) => ({ users: mergeUsers(st.users, users), partner: pickPartner(get(), users) })),
    );
    s.on('users:update', (users) =>
      set((st) => ({ users: mergeUsers(st.users, users), partner: pickPartner(get(), users) })),
    );
    s.on('note:new', (n) => set((st) => ({ notes: [n, ...st.notes] })));
    s.on('photo:new', (p) => set((st) => ({ photos: [{ ...p, likes: p.likes || 0, liked_by: '' }, ...st.photos] })));
    s.on('photo:deleted', ({ id }) => set((st) => ({ photos: st.photos.filter((p) => p.id !== id) })));
    s.on('photo:liked', ({ photoId, userId, likes }) =>
      set((st) => ({
        photos: st.photos.map((p) =>
          p.id === photoId ? { ...p, likes, liked_by: toggleLikedBy(p.liked_by, userId) } : p,
        ),
      })),
    );
    s.on('activity:new', (a) => set((st) => ({ activity: [a, ...st.activity] })));
    s.on('music:update', (m) =>
      set({ currentStation: m.stationId, musicPlaying: !!m.stationId && m.playing !== false, stationMeta: m }),
    );
    s.on('place:new', (p) => set((st) => ({ places: [p, ...st.places.filter((x) => x.id !== p.id)] })));
    s.on('place:deleted', ({ id }) => set((st) => ({ places: st.places.filter((p) => p.id !== id) })));
    s.on('bucket:new', (b) => set((st) => ({ bucket: [b, ...st.bucket.filter((x) => x.id !== b.id)] })));
    s.on('bucket:update', (b) => set((st) => ({ bucket: st.bucket.map((x) => (x.id === b.id ? b : x)) })));
    s.on('bucket:deleted', ({ id }) => set((st) => ({ bucket: st.bucket.filter((b) => b.id !== id) })));
    s.on('decor:update', (decor) => set({ decor }));
    s.on('milestone:new', (m) => set((st) => ({ milestones: [m, ...st.milestones.filter((x) => x.id !== m.id)] })));
    s.on('milestone:deleted', ({ id }) => set((st) => ({ milestones: st.milestones.filter((m) => m.id !== id) })));
    s.on('watchlist:new', (w) => set((st) => ({ watchlist: [w, ...st.watchlist.filter((x) => x.id !== w.id)] })));
    s.on('watchlist:update', (w) => set((st) => ({ watchlist: st.watchlist.map((x) => (x.id === w.id ? w : x)) })));
    s.on('watchlist:deleted', ({ id }) => set((st) => ({ watchlist: st.watchlist.filter((w) => w.id !== id) })));
    s.on('event:new', (e) => set((st) => ({ events: [...st.events.filter((x) => x.id !== e.id), e] })));
    s.on('event:deleted', ({ id }) => set((st) => ({ events: st.events.filter((e) => e.id !== id) })));
    s.on('status:update', ({ userId, status, at }) =>
      set((st) => ({
        users: st.users.map((u) => (u.id === userId ? { ...u, status, status_at: at } : u)),
        partner: st.partner && st.partner.id === userId ? { ...st.partner, status, status_at: at } : st.partner,
      })),
    );
    s.on('diary:new_day', (d) => set({ today: d, diaryEntries: [] }));
    s.on('diary:update', ({ entries }) => set({ diaryEntries: entries }));
    s.on('presence', ({ userId, online }) =>
      set((st) => ({ presence: { ...st.presence, [userId]: online } })),
    );
  },

  emit: (event, payload) => {
    const s = getSocket();
    if (s) s.emit(event, payload);
  },

  popAffection: () => set((st) => ({ affectionQueue: st.affectionQueue.slice(1) })),

  setMusicVolume: (v) => set({ musicVolume: v }),
  setMusicMuted: (m) => set({ musicMuted: m }),

  refreshPhotos: async () => {
    const r = await api.get('/api/photos');
    set({ photos: r });
  },
  refreshPlaces: async () => {
    const r = await api.get('/api/places');
    set({ places: r });
  },
  refreshBucket: async () => {
    const r = await api.get('/api/bucket');
    set({ bucket: r });
  },
  refreshMilestones: async () => {
    set({ milestones: await api.get('/api/milestones') });
  },
  refreshWatchlist: async () => {
    set({ watchlist: await api.get('/api/watchlist') });
  },
  refreshEvents: async () => {
    set({ events: await api.get('/api/events') });
  },
  refreshNotes: async () => {
    const r = await api.get('/api/notes');
    set({ notes: r });
  },
  refreshActivity: async () => {
    const r = await api.get('/api/activity');
    set({ activity: r });
  },
}));

function mergeUsers(prev, next) {
  const byId = {};
  prev.forEach((u) => (byId[u.id] = u));
  next.forEach((u) => (byId[u.id] = { ...byId[u.id], ...u }));
  return Object.values(byId);
}
function pickPartner(state, users) {
  const me = state.me;
  if (!me) return state.partner;
  const merged = mergeUsers(state.users, users);
  return merged.find((u) => u.id !== me.id) || state.partner;
}
function toggleLikedBy(csv, userId) {
  const set = new Set((csv || '').split(',').filter(Boolean).map(Number));
  if (set.has(userId)) set.delete(userId);
  else set.add(userId);
  return [...set].join(',');
}
