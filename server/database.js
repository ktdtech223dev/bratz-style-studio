// server/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Railway volume mount path, fallback local
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, 'photos'), { recursive: true });

const db = new Database(path.join(DATA_DIR, 'us.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    color        TEXT NOT NULL,
    pin_hash     TEXT NOT NULL,
    current_mood TEXT,
    mood_emoji   TEXT,
    mood_color   TEXT,
    mood_at      DATETIME,
    streak       INTEGER DEFAULT 0,
    last_active_day TEXT
  );

  /* Shared couple state — single row */
  CREATE TABLE IF NOT EXISTS couple (
    id            INTEGER PRIMARY KEY CHECK (id=1),
    stars         INTEGER DEFAULT 0,
    our_streak    INTEGER DEFAULT 0,
    last_streak_day TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── PET (shared, single row) ── */
  CREATE TABLE IF NOT EXISTS pet (
    id          INTEGER PRIMARY KEY CHECK (id=1),
    name        TEXT DEFAULT 'atlas',
    mood        TEXT DEFAULT 'Content',
    fed_at      DATETIME,
    played_at   DATETIME,
    petted_at   DATETIME,
    treats      INTEGER DEFAULT 2,
    adopted_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── PLANT (shared, single row) ── */
  CREATE TABLE IF NOT EXISTS plant (
    id          INTEGER PRIMARY KEY CHECK (id=1),
    name        TEXT DEFAULT 'richard',
    stage       INTEGER DEFAULT 0,
    growth      REAL DEFAULT 0,
    watered_at  DATETIME,
    fertilized_at DATETIME,
    fertilizer  INTEGER DEFAULT 1,
    planted_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── GAMES / QUIZ RESULTS ── */
  CREATE TABLE IF NOT EXISTS game_sessions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id      TEXT NOT NULL,
    started_by   INTEGER REFERENCES users(id),
    played_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed    INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS game_answers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   INTEGER REFERENCES game_sessions(id),
    question_id  TEXT NOT NULL,
    user_id      INTEGER REFERENCES users(id),
    answer       TEXT,
    answered_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── PHOTOS ── */
  CREATE TABLE IF NOT EXISTS photos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    filename    TEXT NOT NULL,
    caption     TEXT,
    posted_by   INTEGER REFERENCES users(id),
    posted_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS photo_likes (
    photo_id    INTEGER REFERENCES photos(id),
    user_id     INTEGER REFERENCES users(id),
    PRIMARY KEY (photo_id, user_id)
  );

  /* ── DIARY (daily server-clock prompt) ── */
  CREATE TABLE IF NOT EXISTS diary_days (
    date        TEXT PRIMARY KEY,
    prompt      TEXT NOT NULL,
    category    TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS diary_entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT REFERENCES diary_days(date),
    user_id     INTEGER REFERENCES users(id),
    response    TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, user_id)
  );

  /* ── NOTES ── */
  CREATE TABLE IF NOT EXISTS notes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user   INTEGER REFERENCES users(id),
    body        TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── ABOUT US ── */
  CREATE TABLE IF NOT EXISTS special_dates (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    label       TEXT NOT NULL,
    date        TEXT NOT NULL,
    icon        TEXT DEFAULT 'gift',
    recurring   INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS about_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    section     TEXT NOT NULL,
    user_id     INTEGER REFERENCES users(id),
    title       TEXT,
    body        TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── AFFECTION ── */
  CREATE TABLE IF NOT EXISTS affection (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,
    from_user   INTEGER REFERENCES users(id),
    seen        INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── ACTIVITY LOG / NOTIFICATIONS ── */
  CREATE TABLE IF NOT EXISTS activity (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id    INTEGER REFERENCES users(id),
    type        TEXT NOT NULL,
    message     TEXT NOT NULL,
    icon        TEXT,
    seen        INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── SEED ──
const crypto = require('crypto');
function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

function seed() {
  const n = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  if (n === 0) {
    const ins = db.prepare(`INSERT INTO users
      (username,display_name,color,pin_hash)
      VALUES (?,?,?,?)`);
    ins.run('keshawn', 'Keshawn', '#b8a9e8', hashPin(process.env.KESHAWN_PIN || '1111'));
    ins.run('mercury', 'Mercury', '#f5a3c7', hashPin(process.env.MERCURY_PIN || '2222'));
  }
  db.prepare(`INSERT OR IGNORE INTO couple (id,stars,our_streak) VALUES (1,0,0)`).run();
  db.prepare(`INSERT OR IGNORE INTO pet (id) VALUES (1)`).run();
  db.prepare(`INSERT OR IGNORE INTO plant (id) VALUES (1)`).run();

  // Seed a couple of sweet starter special dates if none exist
  const sd = db.prepare('SELECT COUNT(*) c FROM special_dates').get().c;
  if (sd === 0) {
    const insd = db.prepare(`INSERT INTO special_dates (label,date,icon,recurring) VALUES (?,?,?,?)`);
    insd.run('Our anniversary', '02-14', 'heart', 1);
    insd.run("Keshawn's birthday", '07-12', 'cake', 1);
    insd.run("Mercury's birthday", '11-03', 'cake', 1);
  }
}
seed();

module.exports = { db, hashPin, DATA_DIR };
