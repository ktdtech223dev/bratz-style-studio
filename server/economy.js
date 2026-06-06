// server/economy.js
// Shared currency / streak / inventory logic used by both REST and sockets.
const { db } = require('./database');
const { todayStr } = require('./clock');

// Track which user was active on which server-day (for streaks).
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_active (
    date    TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (date, user_id)
  );
  CREATE TABLE IF NOT EXISTS diary_grants (
    date TEXT PRIMARY KEY
  );
`);

function getCouple() {
  return db.prepare('SELECT * FROM couple WHERE id=1').get();
}

function awardStars(io, amount) {
  db.prepare('UPDATE couple SET stars = stars + ? WHERE id=1').run(amount);
  const couple = getCouple();
  if (io) io.emit('couple:update', couple);
  return couple;
}

function grantTreat(io, amount = 1) {
  db.prepare('UPDATE pet SET treats = treats + ? WHERE id=1').run(amount);
  const pet = db.prepare('SELECT * FROM pet WHERE id=1').get();
  if (io) io.emit('pet:update', pet);
  return pet;
}

function grantFertilizer(io, amount = 1) {
  db.prepare('UPDATE plant SET fertilizer = fertilizer + ? WHERE id=1').run(amount);
  const plant = db.prepare('SELECT * FROM plant WHERE id=1').get();
  if (io) io.emit('plant:update', plant);
  return plant;
}

// Mark a user active today. Updates personal streak and, when BOTH partners are
// active today, advances the shared (our) streak exactly once for the day.
function markActive(io, userId) {
  const today = todayStr();
  db.prepare('INSERT OR IGNORE INTO daily_active (date,user_id) VALUES (?,?)').run(today, userId);

  // Personal streak
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
  if (u.last_active_day !== today) {
    let streak = 1;
    if (u.last_active_day) {
      const diff = Math.round(
        (new Date(today + 'T00:00:00') - new Date(u.last_active_day + 'T00:00:00')) / 86400000,
      );
      if (diff === 1) streak = (u.streak || 0) + 1;
    }
    db.prepare('UPDATE users SET streak=?, last_active_day=? WHERE id=?').run(streak, today, userId);
  }

  // Shared streak — both active today?
  const activeCount = db.prepare('SELECT COUNT(*) c FROM daily_active WHERE date=?').get(today).c;
  if (activeCount >= 2) {
    const couple = getCouple();
    if (couple.last_streak_day !== today) {
      let our = 1;
      if (couple.last_streak_day) {
        const diff = Math.round(
          (new Date(today + 'T00:00:00') - new Date(couple.last_streak_day + 'T00:00:00')) / 86400000,
        );
        if (diff === 1) our = (couple.our_streak || 0) + 1;
      }
      db.prepare('UPDATE couple SET our_streak=?, last_streak_day=? WHERE id=1').run(our, today);
    }
  }

  const couple = getCouple();
  const users = db
    .prepare('SELECT id,display_name,color,streak,last_active_day FROM users')
    .all();
  if (io) io.emit('couple:update', couple);
  if (io) io.emit('users:streaks', users);
  return couple;
}

// Diary economy: +5 stars per answer; every 3rd answered day grants 1 fertilizer.
function diaryGrants(io, date) {
  const already = db.prepare('SELECT 1 FROM diary_grants WHERE date=?').get(date);
  if (already) return;
  db.prepare('INSERT OR IGNORE INTO diary_grants (date) VALUES (?)').run(date);
  const count = db.prepare('SELECT COUNT(*) c FROM diary_grants').get().c;
  if (count % 3 === 0) grantFertilizer(io, 1);
}

module.exports = { awardStars, grantTreat, grantFertilizer, markActive, diaryGrants, getCouple };
