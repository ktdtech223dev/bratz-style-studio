const express = require('express');
const router = express.Router();
const pool = require('../db');

// Daily login rewards by streak day
const STREAK_REWARDS = {
  1: { coins: 50 },
  2: { coins: 100 },
  3: { coins: 150, gems: 5 },
  4: { coins: 200 },
  5: { coins: 250, gems: 10 },
  6: { coins: 300 },
  7: { coins: 500, gems: 25, free_pull: true },
};

function getRewardForDay(day) {
  // Cycle through 1-7
  const cycleDay = ((day - 1) % 7) + 1;
  return STREAK_REWARDS[cycleDay];
}

function isYesterday(dateStr) {
  if (!dateStr) return false;
  const last = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    last.getFullYear() === yesterday.getFullYear() &&
    last.getMonth() === yesterday.getMonth() &&
    last.getDate() === yesterday.getDate()
  );
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const last = new Date(dateStr);
  const now = new Date();
  return (
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate()
  );
}

// POST /api/economy/daily — collect daily login reward
router.post('/daily', async (req, res) => {
  const client = await pool.connect();
  try {
    const { player_id } = req.body;
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

    // Check if already claimed today
    if (isToday(player.last_login)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Daily reward already claimed today',
        streak: player.login_streak,
        next_reward: getRewardForDay(player.login_streak + 1),
      });
    }

    // Calculate new streak
    let newStreak;
    if (isYesterday(player.last_login)) {
      newStreak = player.login_streak + 1;
    } else {
      newStreak = 1;
    }

    const reward = getRewardForDay(newStreak);
    const coinReward = reward.coins || 0;
    const gemReward = reward.gems || 0;

    // Apply rewards and update streak
    await client.query(
      `UPDATE players
       SET coins = coins + $1,
           gems = gems + $2,
           login_streak = $3,
           last_login = CURRENT_DATE
       WHERE id = $4`,
      [coinReward, gemReward, newStreak, player_id]
    );

    const updatedPlayer = await client.query('SELECT * FROM players WHERE id = $1', [player_id]);

    await client.query('COMMIT');

    res.json({
      reward,
      streak: newStreak,
      streak_day: ((newStreak - 1) % 7) + 1,
      player: updatedPlayer.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Daily reward error:', err);
    res.status(500).json({ error: 'Failed to claim daily reward' });
  } finally {
    client.release();
  }
});

// GET /api/economy/streak/:playerId — get streak info
router.get('/streak/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const result = await pool.query(
      'SELECT login_streak, last_login, coins, gems, style_shards FROM players WHERE id = $1',
      [playerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = result.rows[0];
    const claimedToday = isToday(player.last_login);
    const currentStreak = player.login_streak;
    const streakDay = ((currentStreak - 1) % 7) + 1;

    // Build full week preview
    const weekPreview = [];
    for (let i = 1; i <= 7; i++) {
      weekPreview.push({
        day: i,
        reward: STREAK_REWARDS[i],
        claimed: claimedToday ? i <= streakDay : i < streakDay,
        current: claimedToday ? i === streakDay : i === streakDay + 1,
      });
    }

    res.json({
      streak: currentStreak,
      streak_day: streakDay,
      claimed_today: claimedToday,
      next_reward: claimedToday ? getRewardForDay(currentStreak + 1) : getRewardForDay(currentStreak + 1),
      week_preview: weekPreview,
      coins: player.coins,
      gems: player.gems,
      style_shards: player.style_shards,
    });
  } catch (err) {
    console.error('Get streak error:', err);
    res.status(500).json({ error: 'Failed to get streak info' });
  }
});

module.exports = router;
