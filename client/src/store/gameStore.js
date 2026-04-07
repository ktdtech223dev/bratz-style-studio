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

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed (${res.status})`);
  }
  return res.json();
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
    set((state) => ({ ui: { ...state.ui, isLoading: true } }));
    try {
      const data = await apiFetch('/api/player/init', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      set({
        player: {
          id: data.player?.id ?? null,
          sessionId: data.player?.sessionId ?? sessionId,
          coins: data.player?.coins ?? 500,
          gems: data.player?.gems ?? 10,
          styleShards: data.player?.styleShards ?? 0,
          loginStreak: data.player?.loginStreak ?? 0,
          totalPulls: data.player?.totalPulls ?? 0,
        },
        collection: new Set(data.collection ?? []),
        ui: { ...get().ui, isLoading: false },
      });
    } catch (err) {
      set((state) => ({ ui: { ...state.ui, isLoading: false } }));
      get().showToast(err.message || 'Failed to initialize player', 'error');
    }
  },

  // ── UI actions ────────────────────────────────────────────────

  setScreen: (screen) => {
    set((state) => ({ ui: { ...state.ui, currentScreen: screen } }));
  },

  showToast: (message, type = 'info') => {
    set((state) => ({ ui: { ...state.ui, showToast: { message, type } } }));
    setTimeout(() => {
      set((state) => {
        if (state.ui.showToast?.message === message) {
          return { ui: { ...state.ui, showToast: null } };
        }
        return state;
      });
    }, 3000);
  },

  setLoading: (isLoading) => {
    set((state) => ({ ui: { ...state.ui, isLoading } }));
  },

  setShowDailyReward: (show) => {
    set((state) => ({ ui: { ...state.ui, showDailyReward: show } }));
  },

  // ── Outfit / Character actions ────────────────────────────────

  selectCharacter: (charId) => {
    const defaultHair = DEFAULT_HAIRS[charId] || `hair_${charId}_01`;
    set((state) => ({
      outfit: {
        ...state.outfit,
        character: charId,
        hairId: defaultHair,
        equipped: {},
      },
    }));
  },

  equipItem: (item) => {
    if (!item || !item.slot || !item.id) return;
    set((state) => {
      const currentEquipped = state.outfit.equipped[item.slot];
      const newEquipped = { ...state.outfit.equipped };
      if (currentEquipped === item.id) {
        delete newEquipped[item.slot];
      } else {
        newEquipped[item.slot] = item.id;
      }
      return { outfit: { ...state.outfit, equipped: newEquipped } };
    });
  },

  equipSet: (setItem) => {
    if (!setItem || !Array.isArray(setItem.items)) return;
    set((state) => {
      const newEquipped = { ...state.outfit.equipped };
      for (const item of setItem.items) {
        if (item.slot && item.id) {
          newEquipped[item.slot] = item.id;
        }
      }
      return { outfit: { ...state.outfit, equipped: newEquipped } };
    });
  },

  setHair: (hairId) => {
    set((state) => ({ outfit: { ...state.outfit, hairId } }));
  },

  setHairColor: (primary, secondary = null, mode = 'single') => {
    set((state) => ({
      outfit: {
        ...state.outfit,
        hairColorPrimary: primary,
        hairColorSecondary: secondary,
        hairDyeMode: mode,
      },
    }));
  },

  setSkinTone: (index) => {
    set((state) => ({ outfit: { ...state.outfit, skinTone: index } }));
  },

  // ── Gacha actions ─────────────────────────────────────────────

  pullGacha: async (banner, count = 1) => {
    const state = get();
    if (state.gacha.pulling) return null;

    set((s) => ({ gacha: { ...s.gacha, pulling: true, pullResults: null } }));

    try {
      const endpoint = count >= 10 ? '/api/gacha/pull10' : '/api/gacha/pull';
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          bannerId: banner,
          playerId: state.player.id,
        }),
      });

      const results = data.results ?? data.items ?? [];
      const newCollection = new Set(state.collection);
      for (const item of results) {
        if (item.id) newCollection.add(item.id);
      }

      set((s) => ({
        player: {
          ...s.player,
          coins: data.coins ?? s.player.coins,
          gems: data.gems ?? s.player.gems,
          styleShards: data.styleShards ?? s.player.styleShards,
          totalPulls: s.player.totalPulls + (results.length || count),
        },
        collection: newCollection,
        gacha: {
          ...s.gacha,
          pulling: false,
          pullResults: results,
          pity: {
            ...s.gacha.pity,
            [banner]: data.pity ?? (s.gacha.pity[banner] || 0) + count,
          },
        },
      }));

      return results;
    } catch (err) {
      set((s) => ({ gacha: { ...s.gacha, pulling: false } }));
      get().showToast(err.message || 'Gacha pull failed', 'error');
      return null;
    }
  },

  setCurrentBanner: (banner) => {
    set((state) => ({ gacha: { ...state.gacha, currentBanner: banner } }));
  },

  clearPullResults: () => {
    set((state) => ({ gacha: { ...state.gacha, pullResults: null } }));
  },

  // ── Economy actions ───────────────────────────────────────────

  claimDailyReward: async () => {
    try {
      const data = await apiFetch('/api/economy/daily', {
        method: 'POST',
        body: JSON.stringify({ playerId: get().player.id }),
      });
      set((state) => ({
        player: {
          ...state.player,
          coins: data.coins ?? state.player.coins,
          gems: data.gems ?? state.player.gems,
          loginStreak: data.loginStreak ?? state.player.loginStreak + 1,
        },
        ui: { ...state.ui, showDailyReward: false },
      }));
      get().showToast(
        `Daily reward claimed! +${data.coinsAwarded ?? 0} coins${data.gemsAwarded ? `, +${data.gemsAwarded} gems` : ''}`,
        'success'
      );
      return data;
    } catch (err) {
      get().showToast(err.message || 'Failed to claim daily reward', 'error');
      return null;
    }
  },

  addCoins: (amount) => {
    set((state) => ({
      player: { ...state.player, coins: state.player.coins + amount },
    }));
  },

  addGems: (amount) => {
    set((state) => ({
      player: { ...state.player, gems: state.player.gems + amount },
    }));
  },

  purchaseItem: async (itemId, cost, currency = 'coins') => {
    try {
      const data = await apiFetch('/api/collection/purchase', {
        method: 'POST',
        body: JSON.stringify({
          playerId: get().player.id,
          itemId,
          cost,
          currency,
        }),
      });

      const newCollection = new Set(get().collection);
      newCollection.add(itemId);

      const playerUpdate = { ...get().player };
      if (currency === 'coins') {
        playerUpdate.coins = data.coins ?? playerUpdate.coins - cost;
      } else if (currency === 'styleShards' || currency === 'shards') {
        playerUpdate.styleShards = data.styleShards ?? playerUpdate.styleShards - cost;
      } else if (currency === 'gems') {
        playerUpdate.gems = data.gems ?? playerUpdate.gems - cost;
      }

      set({ player: playerUpdate, collection: newCollection });
      get().showToast('Item purchased!', 'success');
      return true;
    } catch (err) {
      get().showToast(err.message || 'Purchase failed', 'error');
      return false;
    }
  },

  // ── Looks (saved outfits) ─────────────────────────────────────

  saveLook: async (name) => {
    try {
      const { outfit } = get();
      const data = await apiFetch('/api/looks', {
        method: 'POST',
        body: JSON.stringify({
          playerId: get().player.id,
          name,
          outfit,
        }),
      });
      get().showToast('Look saved!', 'success');
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
    if (!look || !look.outfit) return;
    set((state) => ({
      outfit: {
        ...state.outfit,
        ...look.outfit,
        equipped: { ...(look.outfit.equipped || {}) },
      },
    }));
  },

  // ── Challenges ────────────────────────────────────────────────

  completeChallenge: async (id) => {
    try {
      const data = await apiFetch('/api/challenges/complete', {
        method: 'POST',
        body: JSON.stringify({ playerId: get().player.id, challengeId: id }),
      });
      get().showToast('Challenge completed!', 'success');
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
        body: JSON.stringify({ playerId: get().player.id, challengeId: id }),
      });
      set((state) => ({
        player: {
          ...state.player,
          coins: data.coins ?? state.player.coins,
          gems: data.gems ?? state.player.gems,
        },
      }));
      get().showToast(
        `Reward claimed! +${data.coinsAwarded ?? 0} coins${data.gemsAwarded ? `, +${data.gemsAwarded} gems` : ''}`,
        'success'
      );
      return data;
    } catch (err) {
      get().showToast(err.message || 'Failed to claim reward', 'error');
      return null;
    }
  },

  // ── Collection helpers ────────────────────────────────────────

  hasItem: (itemId) => get().collection.has(itemId),

  addToCollection: (itemId) => {
    set((state) => {
      const newCollection = new Set(state.collection);
      newCollection.add(itemId);
      return { collection: newCollection };
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
