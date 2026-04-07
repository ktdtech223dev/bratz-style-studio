const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getRandomItem, DUPE_SHARD_VALUES } = require('../db/items');

const SINGLE_PULL_COST = 100;
const MULTI_PULL_COIN_COST = 800;
const MULTI_PULL_GEM_COST = 80;
const DEFAULT_BANNER = 'standard';

function computeRarity(pityCount, softPityStart = 75, hardPity = 90) {
  if (pityCount >= hardPity) return 'legendary';
  if (pityCount >= softPityStart) {
    const softRate = 0.02 + ((pityCount - softPityStart) / (hardPity - softPityStart)) * 0.98;
    if (Math.random() < softRate) return 'legendary';
  }
  const roll = Math.random();
  if (roll < 0.02) return 'legendary';
  if (roll < 0.10) return 'epic';
  if (roll < 0.40) return 'rare';
  return 'common';
}

async function getOrCreatePity(client, playerId, bannerId) {
  let result = await client.query(
    'SELECT * FROM player_pity WHERE player_id = $1 AND banner_id = $2',
    [playerId, bannerId]
  );
  if (result.rows.length > 0) return result.rows[0];

  result = await client.query(
    `INSERT INTO player_pity (player_id, banner_id)
     VALUES ($1, $2) RETURNING *`,
    [playerId, bannerId]
  );
  return result.rows[0];
}

async function executePull(client, playerId, bannerId) {
  // Get pity data
  const pity = await getOrCreatePity(client, playerId, bannerId);
  const rarity = computeRarity(pity.pull_count);
  const item = getRandomItem(rarity);

  if (!item) {
    throw new Error(`No items found for rarity: ${rarity}`);
  }

  // Check for duplicate
  const dupeCheck = await client.query(
    'SELECT id FROM player_collection WHERE player_id = $1 AND item_id = $2',
    [playerId, item.id]
  );
  const isDuplicate = dupeCheck.rows.length > 0;
  let shardsEarned = 0;

  if (isDuplicate) {
    shardsEarned = DUPE_SHARD_VALUES[rarity] || 5;
    await client.query(
      'UPDATE players SET style_shards = style_shards + $1 WHERE id = $2',
      [shardsEarned, playerId]
    );
  } else {
    await client.query(
      `INSERT INTO player_collection (player_id, item_id, item_type, rarity)
       VALUES ($1, $2, $3, $4)`,
      [playerId, item.id, item.type, item.rarity]
    );
  }

  // Update pity: reset on legendary, increment otherwise
  if (rarity === 'legendary') {
    await client.query(
      'UPDATE player_pity SET pull_count = 0 WHERE player_id = $1 AND banner_id = $2',
      [playerId, bannerId]
    );
  } else {
    await client.query(
      'UPDATE player_pity SET pull_count = pull_count + 1 WHERE player_id = $1 AND banner_id = $2',
      [playerId, bannerId]
    );
  }

  // Record pull history
  await client.query(
    `INSERT INTO pull_history (player_id, banner_id, item_id, rarity)
     VALUES ($1, $2, $3, $4)`,
    [playerId, bannerId, item.id, rarity]
  );

  // Increment total pulls
  await client.query(
    'UPDATE players SET total_pulls = total_pulls + 1 WHERE id = $1',
    [playerId]
  );

  return { item, isDuplicate, shardsEarned };
}

// POST /api/gacha/pull — single pull (100 coins)
router.post('/pull', async (req, res) => {
  const client = await pool.connect();
  try {
    const { player_id, banner_id = DEFAULT_BANNER } = req.body;
    if (!player_id) {
      return res.status(400).json({ error: 'player_id is required' });
    }

    await client.query('BEGIN');

    // Lock player row and validate coins
    const playerResult = await client.query(
      'SELECT * FROM players WHERE id = $1 FOR UPDATE',
      [player_id]
    );
    if (playerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = playerResult.rows[0];
    if (player.coins < SINGLE_PULL_COST) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough coins', required: SINGLE_PULL_COST, current: player.coins });
    }

    // Deduct coins
    await client.query(
      'UPDATE players SET coins = coins - $1 WHERE id = $2',
      [SINGLE_PULL_COST, player_id]
    );

    const result = await executePull(client, player_id, banner_id);

    // Get updated player
    const updatedPlayer = await client.query('SELECT * FROM players WHERE id = $1', [player_id]);

    await client.query('COMMIT');

    res.json({
      pull: result.item,
      isDuplicate: result.isDuplicate,
      shardsEarned: result.shardsEarned,
      player: updatedPlayer.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Pull error:', err);
    res.status(500).json({ error: 'Pull failed' });
  } finally {
    client.release();
  }
});

// POST /api/gacha/pull10 — 10-pull (800 coins or 80 gems), guaranteed 1 rare+
router.post('/pull10', async (req, res) => {
  const client = await pool.connect();
  try {
    const { player_id, banner_id = DEFAULT_BANNER, use_gems = false } = req.body;
    if (!player_id) {
      return res.status(400).json({ error: 'player_id is required' });
    }

    await client.query('BEGIN');

    const playerResult = await client.query(
      'SELECT * FROM players WHERE id = $1 FOR UPDATE',
      [player_id]
    );
    if (playerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = playerResult.rows[0];

    if (use_gems) {
      if (player.gems < MULTI_PULL_GEM_COST) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Not enough gems', required: MULTI_PULL_GEM_COST, current: player.gems });
      }
      await client.query(
        'UPDATE players SET gems = gems - $1 WHERE id = $2',
        [MULTI_PULL_GEM_COST, player_id]
      );
    } else {
      if (player.coins < MULTI_PULL_COIN_COST) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Not enough coins', required: MULTI_PULL_COIN_COST, current: player.coins });
      }
      await client.query(
        'UPDATE players SET coins = coins - $1 WHERE id = $2',
        [MULTI_PULL_COIN_COST, player_id]
      );
    }

    // Execute 10 pulls
    const results = [];
    for (let i = 0; i < 10; i++) {
      const result = await executePull(client, player_id, banner_id);
      results.push(result);
    }

    // Guarantee at least 1 rare+ among the 10
    const hasRarePlus = results.some(
      (r) => r.item.rarity === 'rare' || r.item.rarity === 'epic' || r.item.rarity === 'legendary'
    );

    if (!hasRarePlus) {
      // Replace the last common pull with a guaranteed rare
      const lastCommonIdx = results.length - 1;
      const guaranteedItem = getRandomItem('rare');

      // Check if guaranteed item is a dupe
      const dupeCheck = await client.query(
        'SELECT id FROM player_collection WHERE player_id = $1 AND item_id = $2',
        [player_id, guaranteedItem.id]
      );
      const isDuplicate = dupeCheck.rows.length > 0;
      let shardsEarned = 0;

      if (isDuplicate) {
        shardsEarned = DUPE_SHARD_VALUES['rare'];
        await client.query(
          'UPDATE players SET style_shards = style_shards + $1 WHERE id = $2',
          [shardsEarned, player_id]
        );
      } else {
        // Remove the old common item from collection if it was added (and not a dupe)
        const oldItem = results[lastCommonIdx];
        if (!oldItem.isDuplicate) {
          await client.query(
            'DELETE FROM player_collection WHERE player_id = $1 AND item_id = $2',
            [player_id, oldItem.item.id]
          );
        } else {
          // Undo the shard bonus for the old dupe
          await client.query(
            'UPDATE players SET style_shards = style_shards - $1 WHERE id = $2',
            [oldItem.shardsEarned, player_id]
          );
        }
        await client.query(
          `INSERT INTO player_collection (player_id, item_id, item_type, rarity)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (player_id, item_id) DO NOTHING`,
          [player_id, guaranteedItem.id, guaranteedItem.type, guaranteedItem.rarity]
        );
      }

      // Update pull history for the replaced pull
      await client.query(
        `UPDATE pull_history SET item_id = $1, rarity = $2
         WHERE id = (
           SELECT id FROM pull_history
           WHERE player_id = $3 AND banner_id = $4
           ORDER BY pulled_at DESC LIMIT 1
         )`,
        [guaranteedItem.id, guaranteedItem.rarity, player_id, banner_id]
      );

      results[lastCommonIdx] = {
        item: guaranteedItem,
        isDuplicate,
        shardsEarned,
      };
    }

    const updatedPlayer = await client.query('SELECT * FROM players WHERE id = $1', [player_id]);

    await client.query('COMMIT');

    res.json({
      pulls: results.map((r) => ({
        item: r.item,
        isDuplicate: r.isDuplicate,
        shardsEarned: r.shardsEarned,
      })),
      player: updatedPlayer.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Pull10 error:', err);
    res.status(500).json({ error: '10-pull failed' });
  } finally {
    client.release();
  }
});

// GET /api/gacha/pity/:playerId/:bannerId — get pity counter
router.get('/pity/:playerId/:bannerId', async (req, res) => {
  try {
    const { playerId, bannerId } = req.params;

    const result = await pool.query(
      'SELECT pull_count, guaranteed_rare_count FROM player_pity WHERE player_id = $1 AND banner_id = $2',
      [playerId, bannerId]
    );

    if (result.rows.length === 0) {
      return res.json({ pull_count: 0, guaranteed_rare_count: 0 });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Pity check error:', err);
    res.status(500).json({ error: 'Failed to get pity data' });
  }
});

module.exports = router;
