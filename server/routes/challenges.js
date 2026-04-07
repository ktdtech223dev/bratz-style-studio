const express = require('express');
const router = express.Router();
const pool = require('../db');

// Daily challenge definitions — rotate based on day of year
const DAILY_CHALLENGES = [
  { id: 'daily_pull_3', description: 'Perform 3 gacha pulls', type: 'daily', target: 3, reward: { coins: 150 } },
  { id: 'daily_save_look', description: 'Save a new look', type: 'daily', target: 1, reward: { coins: 100 } },
  { id: 'daily_pull_5', description: 'Perform 5 gacha pulls', type: 'daily', target: 5, reward: { coins: 200, gems: 5 } },
  { id: 'daily_equip_5', description: 'Equip 5 different items', type: 'daily', target: 5, reward: { coins: 120 } },
  { id: 'daily_login', description: 'Log in today', type: 'daily', target: 1, reward: { coins: 50 } },
  { id: 'daily_collect_rare', description: 'Pull a rare or better item', type: 'daily', target: 1, reward: { coins: 200 } },
  { id: 'daily_save_2_looks', description: 'Save 2 new looks', type: 'daily', target: 2, reward: { coins: 150, gems: 3 } },
];

const WEEKLY_CHALLENGES = [
  { id: 'weekly_pull_20', description: 'Perform 20 gacha pulls this week', type: 'weekly', target: 20, reward: { coins: 500, gems: 15 } },
  { id: 'weekly_save_5_looks', description: 'Save 5 looks this week', type: 'weekly', target: 5, reward: { coins: 300, gems: 10 } },
  { id: 'weekly_collect_epic', description: 'Pull an epic or legendary item', type: 'weekly', target: 1, reward: { coins: 400, gems: 20 } },
  { id: 'weekly_login_5', description: 'Log in 5 days this week', type: 'weekly', target: 5, reward: { coins: 600, gems: 25 } },
];

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getWeekStartDate() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getDailyChallenges() {
  // Pick 3 daily challenges based on day of year
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const selected = [];
  for (let i = 0; i < 3; i++) {
    const idx = (dayOfYear + i) % DAILY_CHALLENGES.length;
    selected.push(DAILY_CHALLENGES[idx]);
  }
  return selected;
}

function getWeeklyChallenges() {
  // Pick 2 weekly challenges based on week number
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);

  const selected = [];
  for (let i = 0; i < 2; i++) {
    const idx = (weekNum + i) % WEEKLY_CHALLENGES.length;
    selected.push(WEEKLY_CHALLENGES[idx]);
  }
  return selected;
}

// GET /api/challenges/:playerId — get today's challenges + progress
router.get('/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const today = getTodayDate();
    const weekStart = getWeekStartDate();

    const dailyChallenges = getDailyChallenges();
    const weeklyChallenges = getWeeklyChallenges();

    // Fetch progress for daily challenges
    const dailyProgress = await pool.query(
      `SELECT * FROM challenge_progress
       WHERE player_id = $1 AND challenge_type = 'daily' AND reset_date = $2`,
      [playerId, today]
    );

    // Fetch progress for weekly challenges
    const weeklyProgress = await pool.query(
      `SELECT * FROM challenge_progress
       WHERE player_id = $1 AND challenge_type = 'weekly' AND reset_date = $2`,
      [playerId, weekStart]
    );

    const dailyMap = {};
    dailyProgress.rows.forEach((row) => {
      dailyMap[row.challenge_id] = row;
    });

    const weeklyMap = {};
    weeklyProgress.rows.forEach((row) => {
      weeklyMap[row.challenge_id] = row;
    });

    const challenges = [
      ...dailyChallenges.map((c) => ({
        ...c,
        reset_date: today,
        completed: dailyMap[c.id]?.completed || false,
        claimed: dailyMap[c.id]?.claimed || false,
        completed_at: dailyMap[c.id]?.completed_at || null,
      })),
      ...weeklyChallenges.map((c) => ({
        ...c,
        reset_date: weekStart,
        completed: weeklyMap[c.id]?.completed || false,
        claimed: weeklyMap[c.id]?.claimed || false,
        completed_at: weeklyMap[c.id]?.completed_at || null,
      })),
    ];

    res.json({ challenges });
  } catch (err) {
    console.error('Get challenges error:', err);
    res.status(500).json({ error: 'Failed to get challenges' });
  }
});

// POST /api/challenges/complete — mark challenge complete
router.post('/complete', async (req, res) => {
  try {
    const { player_id, challenge_id, challenge_type } = req.body;
    if (!player_id || !challenge_id || !challenge_type) {
      return res.status(400).json({ error: 'player_id, challenge_id, and challenge_type are required' });
    }

    const resetDate = challenge_type === 'daily' ? getTodayDate() : getWeekStartDate();

    const result = await pool.query(
      `INSERT INTO challenge_progress (player_id, challenge_id, challenge_type, completed, completed_at, reset_date)
       VALUES ($1, $2, $3, TRUE, NOW(), $4)
       ON CONFLICT (player_id, challenge_id, reset_date)
       DO UPDATE SET completed = TRUE, completed_at = NOW()
       WHERE challenge_progress.completed = FALSE
       RETURNING *`,
      [player_id, challenge_id, challenge_type, resetDate]
    );

    if (result.rows.length === 0) {
      // Either already completed or conflict; fetch current state
      const existing = await pool.query(
        `SELECT * FROM challenge_progress
         WHERE player_id = $1 AND challenge_id = $2 AND reset_date = $3`,
        [player_id, challenge_id, resetDate]
      );
      if (existing.rows.length > 0 && existing.rows[0].completed) {
        return res.json({ challenge: existing.rows[0], already_completed: true });
      }
    }

    res.json({ challenge: result.rows[0], already_completed: false });
  } catch (err) {
    console.error('Complete challenge error:', err);
    res.status(500).json({ error: 'Failed to complete challenge' });
  }
});

// POST /api/challenges/claim — claim reward
router.post('/claim', async (req, res) => {
  const client = await pool.connect();
  try {
    const { player_id, challenge_id, challenge_type } = req.body;
    if (!player_id || !challenge_id || !challenge_type) {
      return res.status(400).json({ error: 'player_id, challenge_id, and challenge_type are required' });
    }

    const resetDate = challenge_type === 'daily' ? getTodayDate() : getWeekStartDate();

    await client.query('BEGIN');

    // Check challenge is completed and not claimed
    const challengeResult = await client.query(
      `SELECT * FROM challenge_progress
       WHERE player_id = $1 AND challenge_id = $2 AND reset_date = $3
       FOR UPDATE`,
      [player_id, challenge_id, resetDate]
    );

    if (challengeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Challenge progress not found' });
    }

    const progress = challengeResult.rows[0];
    if (!progress.completed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Challenge not yet completed' });
    }
    if (progress.claimed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Reward already claimed' });
    }

    // Find the challenge definition to get reward
    const allChallenges = [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES];
    const challengeDef = allChallenges.find((c) => c.id === challenge_id);
    if (!challengeDef) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Challenge definition not found' });
    }

    const reward = challengeDef.reward;

    // Apply rewards
    const coinReward = reward.coins || 0;
    const gemReward = reward.gems || 0;

    await client.query(
      'UPDATE players SET coins = coins + $1, gems = gems + $2 WHERE id = $3',
      [coinReward, gemReward, player_id]
    );

    // Mark as claimed
    await client.query(
      `UPDATE challenge_progress SET claimed = TRUE
       WHERE player_id = $1 AND challenge_id = $2 AND reset_date = $3`,
      [player_id, challenge_id, resetDate]
    );

    const updatedPlayer = await client.query('SELECT * FROM players WHERE id = $1', [player_id]);

    await client.query('COMMIT');

    res.json({
      claimed: true,
      reward,
      player: updatedPlayer.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Claim reward error:', err);
    res.status(500).json({ error: 'Failed to claim reward' });
  } finally {
    client.release();
  }
});

module.exports = router;
