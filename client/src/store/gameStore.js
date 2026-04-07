import { create } from 'zustand';

const DEFAULT_HAIRS = {
  cloe: 'hair_cloe_01',
  yasmin: 'hair_yasmin_01',
  sasha: 'hair_sasha_01',
  jade: 'hair_jade_01',
};

const INITIAL_PLAYER = {
  id: null,
  sessionId: null,
  coins: 500,
  gems: 10,
  styleShards: 0,
  loginStreak: 0,
  totalPulls: 0,
};

const INITIAL_OUTFIT = {
  character: 'cloe',
  skinTone: 0,
  hairId: 'hair_cloe_01',
  hairColorPrimary: '#8B4513',
  hairColorSecondary: null,
  hairDyeMode: 'single',
  equipped: {},
};

const INITIAL_UI = {
  currentScreen: 'splash',
  showDailyReward: false,
  showToast: null,
  isLoading: false,
};

const INITIAL_GACHA = {
  currentBanner: 'main',
  pulling: false,
  pullResults: null,
  pity: {},
};

// All API calls go through here — normalises camelCase from snake_case responses
async function apiFetch(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || `Request failed (${res.status})`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out — check your connection');
    throw err;
  }
}

// Server returns snake_case — map to camelCase player object
function mapPlayer(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    sessionId: raw.session_id,
    coins: raw.coins ?? 500,
    gems: raw.gems ?? 10,
    styleShards: raw.style_shards ?? 0,
    loginStreak: raw.login_streak ?? 0,
    totalPulls: raw.total_pulls ?? 0,
  };
}

// Map a server pull result item to frontend shape
function mapPullResult(r) {
  if (!r) return null;
  const item = r.item || r;
  return {
    item: {
      id: item.id,
      name: item.name,
      type: item.type,
      rarity: item.rarity,
    },
    isDuplicate: r.isDuplicate ?? r.is_duplicate ?? false,
    shardsEarned: r.shardsEarned ?? r.shards_earned ?? 0,
  };
}

const useGameStore = create((set, get) => ({
  // ── State slices ──────────────────────────────────────────────
  player: { ...INITIAL_PLAYER },
  outfit: { ...INITIAL_OUTFIT, equipped: {} },
  collection: new Set(),
  ui: { ...INITIAL_UI },
  gacha: { ...INITIAL_GACHA, pity: {} },

  // ── Player actions ────────────────────────────────────────────

  initPlayer: async (sessionId) => {
    set((s) => ({ ui: { ...s.ui, isLoading: true } }));
    try {
      // Server expects snake_case
      const data = await apiFetch('/api/player/init', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      });
      const player = mapPlayer(data.player || data);
      const collectionIds = (data.collection || []).map((c) => c.item_id || c.id || c);
      set({
        player: player || { ...INITIAL_PLAYER, sessionId },
        collection: new Set(collectionIds),
        ui: { ...get().ui, isLoading: false },
      });

      // Check if daily reward available
      if (data.dailyAvailable || data.daily_available) {
        set((s) => ({ ui: { ...s.ui, showDailyReward: true } }));
      }
    } catch (err) {
      // On network error, start with defaults so the game still loads
      set((s) => ({ ui: { ...s.ui, isLoading: false } }));
      console.warn('initPlayer failed, using defaults:', err.message);
    }
  },

  // ── UI actions ────────────────────────────────────────────────

  setScreen: (screen) => {
    set((s) => ({ ui: { ...s.ui, currentScreen: screen } }));
  },

  showToast: (message, type = 'info') => {
    set((s) => ({ ui: { ...s.ui, showToast: { message, type } } }));
    setTimeout(() => {
      set((s) => {
        if (s.ui.showToast?.message === message) {
          return { ui: { ...s.ui, showToast: null } };
        }
        return s;
      });
    }, 3000);
  },

  setShowDailyReward: (show) => {
    set((s) => ({ ui: { ...s.ui, showDailyReward: show } }));
  },

  // ── Outfit / Character actions ────────────────────────────────

  selectCharacter: (charId) => {
    set((s) => ({
      outfit: {
        ...s.outfit,
        character: charId,
        hairId: DEFAULT_HAIRS[charId] || `hair_${charId}_01`,
        equipped: {},
      },
    }));
  },

  equipItem: (item) => {
    if (!item || !item.slot || !item.id) return;
    set((s) => {
      const cur = s.outfit.equipped[item.slot];
      const next = { ...s.outfit.equipped };
      if (cur === item.id) delete next[item.slot];
      else next[item.slot] = item.id;
      return { outfit: { ...s.outfit, equipped: next } };
    });
  },

  equipSet: (setItem) => {
    if (!setItem || !Array.isArray(setItem.items)) return;
    set((s) => {
      const next = { ...s.outfit.equipped };
      for (const item of setItem.items) {
        if (item.slot && item.id) next[item.slot] = item.id;
      }
      return { outfit: { ...s.outfit, equipped: next } };
    });
  },

  setHair: (hairId) => set((s) => ({ outfit: { ...s.outfit, hairId } })),

  setHairColor: (primary, secondary = null, mode = 'single') => {
    set((s) => ({
      outfit: { ...s.outfit, hairColorPrimary: primary, hairColorSecondary: secondary, hairDyeMode: mode },
    }));
  },

  setSkinTone: (index) => set((s) => ({ outfit: { ...s.outfit, skinTone: index } })),

  // ── Gacha actions ─────────────────────────────────────────────

  pullGacha: async (banner = 'standard', count = 1) => {
    const state = get();
    if (state.gacha.pulling) return null;

    // Pre-flight coin check
    const cost = count >= 10 ? 800 : 100;
    if (state.player.coins < cost) {
      get().showToast(`Not enough coins 💸 (need ${cost})`, 'error');
      return null;
    }

    set((s) => ({ gacha: { ...s.gacha, pulling: true, pullResults: null } }));

    try {
      const endpoint = count >= 10 ? '/api/gacha/pull10' : '/api/gacha/pull';
      // Server expects snake_case
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          player_id: state.player.id,
          banner_id: banner,
        }),
      }, 10000);

      // Server returns { pull: {...}, isDuplicate, shardsEarned, player: {...} } for single
      // or { pulls: [{...}], player: {...} } for 10-pull
      let results;
      if (count >= 10) {
        results = (data.pulls || []).map(mapPullResult);
      } else {
        results = [mapPullResult(data)];
      }

      const serverPlayer = mapPlayer(data.player);
      const newCollection = new Set(state.collection);
      for (const r of results) {
        if (r?.item?.id && !r.isDuplicate) newCollection.add(r.item.id);
      }

      set((s) => ({
        player: serverPlayer ? {
          ...s.player,
          coins: serverPlayer.coins,
          gems: serverPlayer.gems,
          styleShards: serverPlayer.styleShards,
          totalPulls: serverPlayer.totalPulls,
        } : {
          ...s.player,
          coins: s.player.coins - cost,
        },
        collection: newCollection,
        gacha: {
          ...s.gacha,
          pulling: false,
          pullResults: results,
          pity: { ...s.gacha.pity, [banner]: 0 },
        },
      }));

      return results;
    } catch (err) {
      set((s) => ({ gacha: { ...s.gacha, pulling: false } }));
      get().showToast(err.message || 'Pull failed — try again', 'error');
      return null;
    }
  },

  setCurrentBanner: (banner) => {
    set((s) => ({ gacha: { ...s.gacha, currentBanner: banner } }));
  },

  clearPullResults: () => {
    set((s) => ({ gacha: { ...s.gacha, pullResults: null } }));
  },

  // ── Economy actions ───────────────────────────────────────────

  claimDailyReward: async () => {
    try {
      const data = await apiFetch('/api/economy/daily', {
        method: 'POST',
        body: JSON.stringify({ player_id: get().player.id }),
      });
      const serverPlayer = mapPlayer(data.player);
      set((s) => ({
        player: serverPlayer ? {
          ...s.player,
          coins: serverPlayer.coins,
          gems: serverPlayer.gems,
          loginStreak: serverPlayer.loginStreak,
        } : {
          ...s.player,
          coins: s.player.coins + (data.coins_awarded || data.coinsAwarded || 0),
          gems: s.player.gems + (data.gems_awarded || data.gemsAwarded || 0),
        },
        ui: { ...s.ui, showDailyReward: false },
      }));
      const coinsAwarded = data.coins_awarded || data.coinsAwarded || 0;
      const gemsAwarded = data.gems_awarded || data.gemsAwarded || 0;
      get().showToast(
        `Day ${data.day || data.streak || '?'} reward! +${coinsAwarded} coins${gemsAwarded ? ` +${gemsAwarded} gems` : ''} 🪙`,
        'reward'
      );
      return data;
    } catch (err) {
      get().showToast(err.message || 'Failed to claim daily reward', 'error');
      return null;
    }
  },

  addCoins: (amount) => {
    set((s) => ({ player: { ...s.player, coins: s.player.coins + amount } }));
  },

  addGems: (amount) => {
    set((s) => ({ player: { ...s.player, gems: s.player.gems + amount } }));
  },

  purchaseItem: async (itemId, cost, currency = 'coins') => {
    try {
      const data = await apiFetch('/api/collection/purchase', {
        method: 'POST',
        body: JSON.stringify({ player_id: get().player.id, item_id: itemId, cost, currency }),
      });
      const newCollection = new Set(get().collection);
      newCollection.add(itemId);
      const serverPlayer = mapPlayer(data.player);
      set((s) => ({
        player: serverPlayer ? { ...s.player, ...serverPlayer } : {
          ...s.player,
          coins: currency === 'coins' ? s.player.coins - cost : s.player.coins,
          styleShards: currency === 'shards' ? s.player.styleShards - cost : s.player.styleShards,
        },
        collection: newCollection,
      }));
      get().showToast('Item unlocked! ✨', 'success');
      return true;
    } catch (err) {
      get().showToast(err.message || 'Purchase failed', 'error');
      return false;
    }
  },

  // ── Looks ─────────────────────────────────────────────────────

  saveLook: async (name) => {
    try {
      const { outfit } = get();
      const data = await apiFetch('/api/looks', {
        method: 'POST',
        body: JSON.stringify({
          player_id: get().player.id,
          look_name: name || 'My Look',
          character: outfit.character,
          skin_tone: outfit.skinTone,
          hair_id: outfit.hairId,
          hair_color_primary: outfit.hairColorPrimary,
          hair_color_secondary: outfit.hairColorSecondary,
          hair_dye_mode: outfit.hairDyeMode,
          equipped_items: outfit.equipped,
        }),
      });
      get().showToast('Look saved! 💾', 'success');
      return data;
    } catch (err) {
      get().showToast(err.message || 'Failed to save look', 'error');
      return null;
    }
  },

  deleteLook: async (id) => {
    try {
      await apiFetch(`/api/looks/${id}`, { method: 'DELETE' });
      get().showToast('Look deleted', 'info');
      return true;
    } catch (err) {
      get().showToast(err.message || 'Failed to delete look', 'error');
      return false;
    }
  },

  loadLook: (look) => {
    if (!look) return;
    set((s) => ({
      outfit: {
        ...s.outfit,
        character: look.character || s.outfit.character,
        skinTone: look.skin_tone ?? s.outfit.skinTone,
        hairId: look.hair_id || s.outfit.hairId,
        hairColorPrimary: look.hair_color_primary || s.outfit.hairColorPrimary,
        hairColorSecondary: look.hair_color_secondary || null,
        hairDyeMode: look.hair_dye_mode || 'single',
        equipped: look.equipped_items || {},
      },
    }));
  },

  // ── Challenges ────────────────────────────────────────────────

  completeChallenge: async (id) => {
    try {
      const data = await apiFetch('/api/challenges/complete', {
        method: 'POST',
        body: JSON.stringify({ player_id: get().player.id, challenge_id: id }),
      });
      return data;
    } catch (err) {
      get().showToast(err.message || 'Failed to complete challenge', 'error');
      return null;
    }
  },

  claimChallenge: async (id) => {
    try {
      const data = await apiFetch('/api/challenges/claim', {
        method: 'POST',
        body: JSON.stringify({ player_id: get().player.id, challenge_id: id }),
      });
      const serverPlayer = mapPlayer(data.player);
      if (serverPlayer) {
        set((s) => ({
          player: { ...s.player, coins: serverPlayer.coins, gems: serverPlayer.gems },
        }));
      } else {
        const coins = data.coins_awarded || data.coinsAwarded || 0;
        const gems = data.gems_awarded || data.gemsAwarded || 0;
        set((s) => ({
          player: {
            ...s.player,
            coins: s.player.coins + coins,
            gems: s.player.gems + gems,
          },
        }));
      }
      return data;
    } catch (err) {
      get().showToast(err.message || 'Failed to claim reward', 'error');
      return null;
    }
  },

  // ── Collection helpers ────────────────────────────────────────

  hasItem: (itemId) => get().collection.has(itemId),

  addToCollection: (itemId) => {
    set((s) => {
      const next = new Set(s.collection);
      next.add(itemId);
      return { collection: next };
    });
  },

  // ── Reset ─────────────────────────────────────────────────────

  resetOutfit: () => {
    const char = get().outfit.character;
    set({
      outfit: {
        ...INITIAL_OUTFIT,
        character: char,
        hairId: DEFAULT_HAIRS[char] || `hair_${char}_01`,
        equipped: {},
      },
    });
  },

  resetAll: () => {
    set({
      player: { ...INITIAL_PLAYER },
      outfit: { ...INITIAL_OUTFIT, equipped: {} },
      collection: new Set(),
      ui: { ...INITIAL_UI },
      gacha: { ...INITIAL_GACHA, pity: {} },
    });
  },
}));

export { useGameStore };
export default useGameStore;
