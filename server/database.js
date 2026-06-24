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

  /* ── PLACES (map of special locations) ── */
  CREATE TABLE IF NOT EXISTS places (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    note        TEXT,
    lat         REAL NOT NULL,
    lng         REAL NOT NULL,
    filename    TEXT,
    added_by    INTEGER REFERENCES users(id),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
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

  /* ── BUCKET LIST (shared) ── */
  CREATE TABLE IF NOT EXISTS bucket_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    note         TEXT,
    done         INTEGER DEFAULT 0,
    filename     TEXT,
    created_by   INTEGER REFERENCES users(id),
    completed_by INTEGER REFERENCES users(id),
    done_at      DATETIME,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── ROOM DECOR ── */
  CREATE TABLE IF NOT EXISTS owned_decor (
    item_id    TEXT PRIMARY KEY,
    bought_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS room_decor (
    id         INTEGER PRIMARY KEY CHECK (id=1),
    wallpaper  TEXT DEFAULT 'wall_dusk',
    floor      TEXT DEFAULT 'floor_plum',
    cat        TEXT DEFAULT 'cat_black',
    pot        TEXT DEFAULT 'pot_pink'
  );

  /* ── PUSH SUBSCRIPTIONS ── */
  CREATE TABLE IF NOT EXISTS push_subs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id),
    endpoint   TEXT UNIQUE NOT NULL,
    sub        TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── MILESTONES (relationship timeline) ── */
  CREATE TABLE IF NOT EXISTS milestones (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    note       TEXT,
    date       TEXT NOT NULL,
    filename   TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── DAILY CHECK-INS ── */
  CREATE TABLE IF NOT EXISTS checkins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    date       TEXT NOT NULL,
    user_id    INTEGER REFERENCES users(id),
    rating     INTEGER,
    note       TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, user_id)
  );

  /* ── MOOD LOG (history for trends) ── */
  CREATE TABLE IF NOT EXISTS mood_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id),
    mood       TEXT,
    emoji      TEXT,
    color      TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── WATCHLIST ── */
  CREATE TABLE IF NOT EXISTS watchlist (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    kind       TEXT DEFAULT 'movie',
    note       TEXT,
    added_by   INTEGER REFERENCES users(id),
    watched    INTEGER DEFAULT 0,
    rating     INTEGER,
    watched_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── GARDEN (collection of plants, multiple species) ── */
  CREATE TABLE IF NOT EXISTS garden (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    species       TEXT NOT NULL,
    name          TEXT,
    growth        REAL DEFAULT 0,
    stage         INTEGER DEFAULT 0,
    watered_at    DATETIME,
    fertilized_at DATETIME,
    planted_by    INTEGER REFERENCES users(id),
    planted_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── CAMPFIRE (keep-our-flame-alive singleton) ── */
  CREATE TABLE IF NOT EXISTS campfire (
    id        INTEGER PRIMARY KEY CHECK (id=1),
    fuel      REAL DEFAULT 55,
    logs      INTEGER DEFAULT 3,
    stoked_at DATETIME,
    lit_since DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── AQUARIUM (fish tank singleton) ── */
  CREATE TABLE IF NOT EXISTS aquarium (
    id          INTEGER PRIMARY KEY CHECK (id=1),
    cleanliness REAL DEFAULT 100,
    food        INTEGER DEFAULT 3,
    fish        INTEGER DEFAULT 2,
    fed_at      DATETIME,
    cleaned_at  DATETIME,
    started_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── LOVE JAR (collection of hearts/notes) ── */
  CREATE TABLE IF NOT EXISTS love_jar (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    kind       TEXT DEFAULT 'heart',
    body       TEXT,
    added_by   INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── STAR MAP (collection of stars) ── */
  CREATE TABLE IF NOT EXISTS stars (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    label      TEXT,
    x          REAL,
    y          REAL,
    added_by   INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── DATE-NIGHT SPINNER OPTIONS ── */
  CREATE TABLE IF NOT EXISTS spinner_options (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    label      TEXT,
    kind       TEXT DEFAULT 'virtual',
    created_by INTEGER REFERENCES users(id)
  );

  /* ── SHARED HABITS ── */
  CREATE TABLE IF NOT EXISTS habits (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT,
    icon       TEXT DEFAULT '✅',
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS habit_log (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER REFERENCES habits(id),
    user_id  INTEGER REFERENCES users(id),
    date     TEXT,
    UNIQUE(habit_id, user_id, date)
  );

  /* ── "OPEN WHEN…" LETTERS ── */
  CREATE TABLE IF NOT EXISTS letters (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    occasion   TEXT,
    body       TEXT,
    written_by INTEGER REFERENCES users(id),
    opened_at  DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── TIME CAPSULES (unlock on a date) ── */
  CREATE TABLE IF NOT EXISTS capsules (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT,
    body       TEXT,
    written_by INTEGER REFERENCES users(id),
    unlock_at  TEXT,
    opened_at  DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── LOVE COUPONS ── */
  CREATE TABLE IF NOT EXISTS coupons (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT,
    note        TEXT,
    created_by  INTEGER REFERENCES users(id),
    redeemed    INTEGER DEFAULT 0,
    redeemed_at DATETIME,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── GIFT WISHLIST ── */
  CREATE TABLE IF NOT EXISTS gift_wishes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT,
    note        TEXT,
    link        TEXT,
    added_by    INTEGER REFERENCES users(id),
    reserved_by INTEGER,
    got         INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── SONG DEDICATIONS ── */
  CREATE TABLE IF NOT EXISTS dedications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    song         TEXT,
    artist       TEXT,
    note         TEXT,
    dedicated_by INTEGER REFERENCES users(id),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── REAL-TIME MATCHES (tic-tac-toe, connect 4, …) ── */
  CREATE TABLE IF NOT EXISTS matches (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    game       TEXT NOT NULL,
    state      TEXT NOT NULL,
    turn       INTEGER,
    status     TEXT DEFAULT 'active',
    winner     INTEGER,
    created_by INTEGER REFERENCES users(id),
    seen_by    TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  /* ── SHARED CALENDAR EVENTS ── */
  CREATE TABLE IF NOT EXISTS events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    date       TEXT NOT NULL,
    time       TEXT,
    note       TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// ── ADDITIVE FEATURE TABLES (photo reactions, note replies, recipes) ──
db.exec(`
  CREATE TABLE IF NOT EXISTS photo_reactions (
    photo_id   INTEGER REFERENCES photos(id),
    user_id    INTEGER REFERENCES users(id),
    emoji      TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (photo_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS note_replies (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id    INTEGER REFERENCES notes(id),
    from_user  INTEGER REFERENCES users(id),
    body       TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS recipes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    ingredients TEXT,
    steps       TEXT,
    added_by    INTEGER REFERENCES users(id),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// New room_decor furniture slots (guarded — additive, NULL falls back to DEFAULTS).
const rdCols = db.prepare('PRAGMA table_info(room_decor)').all();
for (const col of ['sofa', 'bed', 'coffeetable', 'lamp', 'rug', 'collar', 'gardenpot', 'theme']) {
  if (!rdCols.some((c) => c.name === col)) {
    db.exec(`ALTER TABLE room_decor ADD COLUMN ${col} TEXT`);
  }
}

// ── MIGRATIONS ──
// Add game_answers.kind for the self/guess format. If the column is missing we're
// upgrading from the old game format, so clear stale sessions for a clean reset.
const gaCols = db.prepare('PRAGMA table_info(game_answers)').all();
if (!gaCols.some((c) => c.name === 'kind')) {
  db.exec(`
    DELETE FROM game_answers;
    DELETE FROM game_sessions;
    ALTER TABLE game_answers ADD COLUMN kind TEXT DEFAULT 'self';
  `);
}

// Awake/asleep status on users.
const userCols = db.prepare('PRAGMA table_info(users)').all();
if (!userCols.some((c) => c.name === 'status')) {
  db.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'awake'`);
  db.exec(`ALTER TABLE users ADD COLUMN status_at DATETIME`);
}
if (!userCols.some((c) => c.name === 'tz')) {
  db.exec(`ALTER TABLE users ADD COLUMN tz TEXT`);
}

// "Seen" tracking on game sessions so completed-game badges clear after viewing.
const gsCols = db.prepare('PRAGMA table_info(game_sessions)').all();
if (!gsCols.some((c) => c.name === 'seen_by')) {
  db.exec(`ALTER TABLE game_sessions ADD COLUMN seen_by TEXT DEFAULT ''`);
}

// Reunion countdown fields on the couple row.
const coupleCols = db.prepare('PRAGMA table_info(couple)').all();
if (!coupleCols.some((c) => c.name === 'reunion_at')) {
  db.exec(`ALTER TABLE couple ADD COLUMN reunion_at TEXT`);
  db.exec(`ALTER TABLE couple ADD COLUMN reunion_label TEXT`);
}

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
  db.prepare(`INSERT OR IGNORE INTO room_decor (id) VALUES (1)`).run();
  db.prepare(`INSERT OR IGNORE INTO campfire (id) VALUES (1)`).run();
  db.prepare(`INSERT OR IGNORE INTO aquarium (id) VALUES (1)`).run();

  // Seed default date-night spinner options
  const sc = db.prepare('SELECT COUNT(*) c FROM spinner_options').get().c;
  if (sc === 0) {
    const seed = db.prepare('INSERT INTO spinner_options (label,kind) VALUES (?,?)');
    [
      ['Movie night (synced)', 'virtual'],
      ['Cook the same meal', 'virtual'],
      ['Play an online game', 'virtual'],
      ['Stargaze on a call', 'virtual'],
      ['Read to each other', 'virtual'],
      ['Fall asleep on call', 'virtual'],
      ['Try a new restaurant', 'irl'],
      ['Go for a walk', 'irl'],
      ['Picnic in the park', 'irl'],
      ['Board game night', 'irl'],
    ].forEach(([l, k]) => seed.run(l, k));
  }

  // Seed the garden with Mercury's monstera 🌿
  const gn = db.prepare('SELECT COUNT(*) c FROM garden').get().c;
  if (gn === 0) {
    const mercury = db.prepare("SELECT id FROM users WHERE username='mercury'").get();
    db.prepare(`INSERT INTO garden (species,name,planted_by) VALUES (?,?,?)`).run(
      'monstera',
      "mercury's monstera",
      mercury ? mercury.id : 2,
    );
  }

  // Seed a couple of sweet starter special dates if none exist
  const sd = db.prepare('SELECT COUNT(*) c FROM special_dates').get().c;
  if (sd === 0) {
    const insd = db.prepare(`INSERT INTO special_dates (label,date,icon,recurring) VALUES (?,?,?,?)`);
    insd.run('Our anniversary', '02-14', 'heart', 1);
    insd.run("Keshawn's birthday", '07-12', 'cake', 1);
    insd.run("Mercury's birthday", '11-03', 'cake', 1);
  }

  // Seed the first milestone from when the couple row was created.
  const ms = db.prepare('SELECT COUNT(*) c FROM milestones').get().c;
  if (ms === 0) {
    const created = db.prepare('SELECT created_at FROM couple WHERE id=1').get().created_at || '';
    const date = created.slice(0, 10) || new Date().toISOString().slice(0, 10);
    db.prepare(`INSERT INTO milestones (title,note,date) VALUES (?,?,?)`).run(
      'We started Us 💜',
      'the beginning of our little world',
      date,
    );
  }
}
seed();

module.exports = { db, hashPin, DATA_DIR };
