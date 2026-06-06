// server/clock.js
const { db } = require('./database');
const PROMPTS = require('./diary-prompts');

// Server timezone — set via env, default America/Chicago (Cedar Park TX)
const TZ = process.env.APP_TZ || 'America/Chicago';

function todayStr() {
  // YYYY-MM-DD in server TZ
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function ensureTodayPrompt() {
  const date = todayStr();
  const existing = db.prepare('SELECT * FROM diary_days WHERE date=?').get(date);
  if (existing) return existing;

  // Pick a prompt not used recently
  const recent = db
    .prepare(`SELECT prompt FROM diary_days ORDER BY date DESC LIMIT 30`)
    .all()
    .map((r) => r.prompt);

  const pool = PROMPTS.filter((p) => !recent.includes(p.text));
  const src = pool.length ? pool : PROMPTS;
  const pick = src[Math.floor(Math.random() * src.length)];

  db.prepare(`INSERT OR IGNORE INTO diary_days (date,prompt,category) VALUES (?,?,?)`).run(
    date,
    pick.text,
    pick.category,
  );

  return db.prepare('SELECT * FROM diary_days WHERE date=?').get(date);
}

// Milliseconds until next server-midnight
function msUntilMidnight() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const h = +parts.find((p) => p.type === 'hour').value % 24;
  const m = +parts.find((p) => p.type === 'minute').value;
  const s = +parts.find((p) => p.type === 'second').value;
  return ((24 - h - 1) * 3600 + (60 - m - 1) * 60 + (60 - s)) * 1000;
}

// Schedule midnight rollover — emits via socket
function scheduleMidnight(io) {
  const ms = msUntilMidnight();
  setTimeout(() => {
    const day = ensureTodayPrompt();
    io.emit('diary:new_day', {
      date: day.date,
      prompt: day.prompt,
      category: day.category,
    });
    try {
      rolloverStreaks(io);
    } catch (e) {
      console.error('streak rollover error', e);
    }
    scheduleMidnight(io); // reschedule
  }, ms + 1000);
}

// At midnight, evaluate yesterday's shared streak.
// our_streak only continues if last_streak_day was yesterday.
function rolloverStreaks() {
  const couple = db.prepare('SELECT * FROM couple WHERE id=1').get();
  const today = todayStr();
  if (couple.last_streak_day && couple.last_streak_day !== today) {
    // If the most recent shared day isn't today (just rolled), nothing to add now.
    // Streak is incremented live when both partners are active (see sockets).
    // Here we only RESET if a full day was missed.
    const last = new Date(couple.last_streak_day + 'T00:00:00');
    const now = new Date(today + 'T00:00:00');
    const diffDays = Math.round((now - last) / 86400000);
    if (diffDays > 1) {
      db.prepare('UPDATE couple SET our_streak=0 WHERE id=1').run();
    }
  }
}

module.exports = { todayStr, ensureTodayPrompt, scheduleMidnight, msUntilMidnight, rolloverStreaks, TZ };
