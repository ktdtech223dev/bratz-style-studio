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

  // Pick a prompt that has NEVER been used — no journal question ever repeats
  // (until the whole bank is exhausted, then it falls back to the full set).
  const used = new Set(db.prepare(`SELECT prompt FROM diary_days`).all().map((r) => r.prompt));
  const pool = PROMPTS.filter((p) => !used.has(p.text));
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
    try {
      eventReminders();
    } catch (e) {
      console.error('event reminder error', e);
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

// Milliseconds until the next occurrence of a target hour (server TZ).
function msUntilHour(targetHour) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const h = +parts.find((p) => p.type === 'hour').value % 24;
  const m = +parts.find((p) => p.type === 'minute').value;
  const s = +parts.find((p) => p.type === 'second').value;
  let secs = ((targetHour - h) * 3600 - m * 60 - s);
  if (secs <= 0) secs += 24 * 3600; // already passed today → tomorrow
  return secs * 1000;
}

// Evening nudge: remind whoever still hasn't answered today's prompt or checked in.
function sendDailyReminders() {
  const { notifyUser } = require('./push');
  const date = todayStr();
  const day = ensureTodayPrompt();
  const users = db.prepare('SELECT id FROM users').all();
  for (const u of users) {
    const didDiary = db.prepare('SELECT 1 FROM diary_entries WHERE date=? AND user_id=?').get(date, u.id);
    const didCheckin = db.prepare('SELECT 1 FROM checkins WHERE date=? AND user_id=?').get(date, u.id);
    if (!didDiary) {
      notifyUser(u.id, {
        title: '📔 Today’s prompt is waiting',
        body: day.prompt ? day.prompt.slice(0, 90) : 'share a little about your day',
        url: '/diary',
      });
    }
    if (!didCheckin) {
      notifyUser(u.id, {
        title: '☀️ Don’t forget to check in',
        body: 'how was your day? let them know 💜',
        url: '/checkin',
      });
    }
  }
}

// Schedule the evening reminder (default 20:00 server TZ), then reschedule daily.
function scheduleDailyReminders(io) {
  const hour = Number(process.env.REMINDER_HOUR || 20);
  const ms = msUntilHour(hour);
  setTimeout(() => {
    try {
      sendDailyReminders();
    } catch (e) {
      console.error('daily reminder error', e);
    }
    scheduleDailyReminders(io); // reschedule for the next day
  }, ms + 1000);
}

// Notify both partners about events happening today.
function eventReminders() {
  const today = todayStr();
  const events = db.prepare('SELECT * FROM events WHERE date=?').all(today);
  if (!events.length) return;
  // require lazily to avoid load-order surprises
  const { notifyUser } = require('./push');
  const users = db.prepare('SELECT id FROM users').all();
  for (const ev of events) {
    for (const u of users) {
      notifyUser(u.id, {
        title: `📅 Today: ${ev.title}`,
        body: ev.time ? `at ${ev.time}` : 'on your shared calendar',
        url: '/calendar',
      });
    }
  }
}

module.exports = {
  todayStr,
  ensureTodayPrompt,
  scheduleMidnight,
  scheduleDailyReminders,
  sendDailyReminders,
  msUntilMidnight,
  msUntilHour,
  rolloverStreaks,
  eventReminders,
  TZ,
};
