const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/looks/:playerId — get all saved looks
router.get('/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const result = await pool.query(
      `SELECT * FROM saved_looks
       WHERE player_id = $1
       ORDER BY is_pinned DESC, created_at DESC`,
      [playerId]
    );

    res.json({ looks: result.rows });
  } catch (err) {
    console.error('Get looks error:', err);
    res.status(500).json({ error: 'Failed to get looks' });
  }
});

// POST /api/looks — save a look
router.post('/', async (req, res) => {
  try {
    const {
      player_id,
      look_name,
      character,
      skin_tone,
      hair_id,
      hair_color_primary,
      hair_color_secondary,
      hair_dye_mode,
      equipped_items,
      makeup_config,
      thumbnail,
    } = req.body;

    if (!player_id || !character || skin_tone === undefined || !equipped_items) {
      return res.status(400).json({ error: 'Missing required fields: player_id, character, skin_tone, equipped_items' });
    }

    const result = await pool.query(
      `INSERT INTO saved_looks
       (player_id, look_name, character, skin_tone, hair_id, hair_color_primary,
        hair_color_secondary, hair_dye_mode, equipped_items, makeup_config, thumbnail)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        player_id,
        look_name || 'My Look',
        character,
        skin_tone,
        hair_id || null,
        hair_color_primary || null,
        hair_color_secondary || null,
        hair_dye_mode || null,
        JSON.stringify(equipped_items),
        makeup_config ? JSON.stringify(makeup_config) : null,
        thumbnail || null,
      ]
    );

    res.status(201).json({ look: result.rows[0] });
  } catch (err) {
    console.error('Save look error:', err);
    res.status(500).json({ error: 'Failed to save look' });
  }
});

// PUT /api/looks/:id — update look (rename, pin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { look_name, is_pinned } = req.body;

    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (look_name !== undefined) {
      updates.push(`look_name = $${paramIdx++}`);
      values.push(look_name);
    }

    if (is_pinned !== undefined) {
      updates.push(`is_pinned = $${paramIdx++}`);
      values.push(is_pinned);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE saved_looks SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Look not found' });
    }

    res.json({ look: result.rows[0] });
  } catch (err) {
    console.error('Update look error:', err);
    res.status(500).json({ error: 'Failed to update look' });
  }
});

// DELETE /api/looks/:id — delete look
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM saved_looks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Look not found' });
    }

    res.json({ deleted: true, id });
  } catch (err) {
    console.error('Delete look error:', err);
    res.status(500).json({ error: 'Failed to delete look' });
  }
});

module.exports = router;
