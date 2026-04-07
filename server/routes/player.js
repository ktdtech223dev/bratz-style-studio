const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/player/init — create or fetch player by session_id
router.post('/init', async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id || typeof session_id !== 'string' || session_id.length > 64) {
      return res.status(400).json({ error: 'Valid session_id is required' });
    }

    // Try to find existing player
    let result = await pool.query(
      'SELECT * FROM players WHERE session_id = $1',
      [session_id]
    );

    if (result.rows.length > 0) {
      const player = result.rows[0];

      // Fetch collection count
      const collectionResult = await pool.query(
        'SELECT COUNT(*) as count FROM player_collection WHERE player_id = $1',
        [player.id]
      );

      return res.json({
        player,
        collection_count: parseInt(collectionResult.rows[0].count, 10),
        is_new: false,
      });
    }

    // Create new player
    result = await pool.query(
      `INSERT INTO players (session_id) VALUES ($1) RETURNING *`,
      [session_id]
    );

    res.status(201).json({
      player: result.rows[0],
      collection_count: 0,
      is_new: true,
    });
  } catch (err) {
    console.error('Player init error:', err);
    res.status(500).json({ error: 'Failed to initialize player' });
  }
});

// GET /api/player/:id — get player data
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const playerResult = await pool.query(
      'SELECT * FROM players WHERE id = $1',
      [id]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = playerResult.rows[0];

    // Fetch collection
    const collectionResult = await pool.query(
      'SELECT * FROM player_collection WHERE player_id = $1 ORDER BY unlocked_at DESC',
      [id]
    );

    res.json({
      player,
      collection: collectionResult.rows,
    });
  } catch (err) {
    console.error('Get player error:', err);
    res.status(500).json({ error: 'Failed to get player' });
  }
});

module.exports = router;
