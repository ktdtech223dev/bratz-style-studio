import { create } from 'zustand';
import { connectSocket, getSocket } from '../lib/socket';
import { api } from '../lib/api';

const LS_KEY = 'us_auth_v1';
const THEME_KEY = 'us_theme_v1';

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  } catch {
    return null;
  }
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'lavender';
  } catch {
    return 'lavender';
  }
}

// Apply the theme as a data-attribute on <html> (default 'lavender' = :root, no attr).
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  if (!theme || theme === 'lavender') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}
applyTheme(loadTheme());

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
  arcade: [],
  matches: [],
  gamePending: {}, // gameId -> { status:'turn'|'ready', sessionId }
  garden: [],
  campfire: null,
  aquarium: null,
  loveJar: [],
  stars: [],
  letters: [],
  capsules: [],
  coupons: [],
  giftWishes: [],
  dedications: [],
  spinner: [],
  habits: { habits: [], logs: [], today: '' },
  kissAt: 0,
  affectionQueue: [],
  activity: [],
  notes: [],
  photos: [],
  recipes: [],
  today: null,
  diaryEntries: [],
  theme: loadTheme(),
  ready: false,

  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    applyTheme(theme);
    set({ theme });
  },

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
        arcade: st.arcade || [],
        matches: st.matches || [],
        garden: st.garden || [],
        campfire: st.campfire || null,
        aquarium: st.aquarium || null,
        moods,
        ready: true,
      });
      get().refreshPending();
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
    s.on('photo:reacted', ({ photoId, reactions }) =>
      set((st) => ({
        photos: st.photos.map((p) => (p.id === photoId ? { ...p, reactions } : p)),
      })),
    );
    s.on('note:reply_new', ({ noteId, reply }) =>
      set((st) => ({
        notes: st.notes.map((n) =>
          n.id === noteId ? { ...n, replies: [...(n.replies || []), reply] } : n,
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
    s.on('match:update', (m) =>
      set((st) => ({ matches: [m, ...st.matches.filter((x) => x.id !== m.id)] })),
    );
    s.on('garden:update', (garden) => set({ garden }));
    s.on('campfire:update', (campfire) => set({ campfire }));
    s.on('aquarium:update', (aquarium) => set({ aquarium }));
    s.on('lovejar:new', (j) => set((st) => ({ loveJar: [j, ...st.loveJar.filter((x) => x.id !== j.id)] })));
    s.on('lovejar:deleted', ({ id }) => set((st) => ({ loveJar: st.loveJar.filter((j) => j.id !== id) })));
    s.on('star:new', (s2) => set((st) => ({ stars: [...st.stars.filter((x) => x.id !== s2.id), s2] })));
    s.on('star:deleted', ({ id }) => set((st) => ({ stars: st.stars.filter((s2) => s2.id !== id) })));
    s.on('letters:changed', () => get().refreshLetters());
    s.on('capsules:changed', () => get().refreshCapsules());
    s.on('coupons:changed', () => get().refreshCoupons());
    s.on('giftwishes:changed', () => get().refreshGiftWishes());
    s.on('dedications:changed', () => get().refreshDedications());
    s.on('spinner:changed', () => get().refreshSpinner());
    s.on('recipes:changed', () => get().refreshRecipes());
    s.on('habits:changed', () => get().refreshHabits());
    s.on('kiss:incoming', () => set({ kissAt: Date.now() }));
    s.on('tz:update', ({ userId, tz }) =>
      set((st) => ({
        users: st.users.map((u) => (u.id === userId ? { ...u, tz } : u)),
        partner: st.partner && st.partner.id === userId ? { ...st.partner, tz } : st.partner,
      })),
    );
    // report our timezone for the "their time" feature (re-sends on reconnect)
    const sendTz = () => {
      try {
        s.emit('tz:set', { tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
      } catch {}
    };
    s.on('connect', sendTz);
    sendTz();
    s.on('game:started', () => get().refreshPending());
    s.on('game:seen', () => get().refreshPending());
    s.on('game:complete', () => get().refreshPending());
    s.on('game:answer_progress', () => get().refreshPending());
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
  refreshMatches: async () => {
    set({ matches: await api.get('/api/matches') });
  },
  refreshGarden: async () => {
    set({ garden: await api.get('/api/garden') });
  },
  refreshLoveJar: async () => {
    set({ loveJar: await api.get('/api/lovejar') });
  },
  refreshStars: async () => {
    set({ stars: await api.get('/api/stars') });
  },
  refreshLetters: async () => {
    set({ letters: await api.get('/api/letters') });
  },
  refreshCapsules: async () => {
    set({ capsules: await api.get('/api/capsules') });
  },
  refreshCoupons: async () => {
    set({ coupons: await api.get('/api/coupons') });
  },
  refreshGiftWishes: async () => {
    const me = get().me;
    if (!me) return;
    set({ giftWishes: await api.get(`/api/giftwishes?userId=${me.id}`) });
  },
  refreshDedications: async () => {
    set({ dedications: await api.get('/api/dedications') });
  },
  refreshSpinner: async () => {
    set({ spinner: await api.get('/api/spinner') });
  },
  refreshHabits: async () => {
    set({ habits: await api.get('/api/habits') });
  },
  refreshPending: async () => {
    const me = get().me;
    if (!me) return;
    try {
      set({ gamePending: await api.get(`/api/games/pending?userId=${me.id}`) });
    } catch {}
  },
  refreshNotes: async () => {
    const r = await api.get('/api/notes');
    set({ notes: r });
  },
  refreshActivity: async () => {
    const r = await api.get('/api/activity');
    set({ activity: r });
  },
  refreshRecipes: async () => {
    set({ recipes: await api.get('/api/recipes') });
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
