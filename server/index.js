// server/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db, hashPin, DATA_DIR } = require('./database');
const { register, logActivity } = require('./sockets');
const { ensureTodayPrompt, scheduleMidnight, todayStr } = require('./clock');
const { awardStars, grantTreat, diaryGrants, markActive } = require('./economy');
const RADIO = require('./radio');
const GAMES = require('./games-data');
const DECOR = require('./decor-data');
const PUSH = require('./push');
const PARTY = require('./party-data');
const ARCADE = require('./arcade');

function partnerId(userId) {
  return Number(userId) === 1 ? 2 : 1;
}
function matchRow(id) {
  const m = db.prepare('SELECT * FROM matches WHERE id=?').get(id);
  return m ? { ...m, state: JSON.parse(m.state) } : null;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/photos', express.static(path.join(DATA_DIR, 'photos')));

const DIST = path.join(__dirname, '../dist');
app.use(express.static(DIST));

// Health (decoupled from DB so Railway healthcheck is robust)
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Photo upload
const storage = multer.diskStorage({
  destination: (req, f, cb) => cb(null, path.join(DATA_DIR, 'photos')),
  filename: (req, f, cb) => cb(null, Date.now() + '-' + f.originalname.replace(/\s/g, '_')),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// ── AUTH ──
app.post('/api/login', (req, res) => {
  const { username, pin } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!u || u.pin_hash !== hashPin(pin)) return res.status(401).json({ error: 'Wrong PIN' });
  res.json({ id: u.id, username: u.username, display_name: u.display_name, color: u.color });
});

app.get('/api/state', (req, res) => {
  res.json({
    users: db
      .prepare(
        'SELECT id,username,display_name,color,current_mood,mood_emoji,mood_color,mood_at,streak,last_active_day,status,status_at FROM users',
      )
      .all(),
    couple: db.prepare('SELECT * FROM couple WHERE id=1').get(),
    pet: db.prepare('SELECT * FROM pet WHERE id=1').get(),
    plant: db.prepare('SELECT * FROM plant WHERE id=1').get(),
    garden: db.prepare('SELECT * FROM garden ORDER BY planted_at').all(),
    radio: RADIO,
    games: GAMES,
    today: ensureTodayPrompt(),
    decor: DECOR.resolve(db.prepare('SELECT * FROM room_decor WHERE id=1').get()),
    pushKey: PUSH.publicKey(),
    truthordare: PARTY,
    arcade: ARCADE.CATALOG,
    matches: db
      .prepare(`SELECT * FROM matches ORDER BY updated_at DESC LIMIT 40`)
      .all()
      .map((m) => ({ ...m, state: JSON.parse(m.state) })),
  });
});

// ── SETTINGS ──
app.post('/api/settings/pin', (req, res) => {
  const { userId, pin } = req.body;
  if (!/^\d{4}$/.test(String(pin))) return res.status(400).json({ error: 'PIN must be 4 digits' });
  db.prepare('UPDATE users SET pin_hash=? WHERE id=?').run(hashPin(pin), Number(userId));
  res.json({ ok: true });
});
app.post('/api/settings/name', (req, res) => {
  const { userId, display_name } = req.body;
  db.prepare('UPDATE users SET display_name=? WHERE id=?').run(
    String(display_name).slice(0, 24),
    Number(userId),
  );
  io.emit('users:update', db.prepare('SELECT id,display_name,color FROM users').all());
  res.json({ ok: true });
});

// ── PHOTOS ──
app.get('/api/photos', (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*,
        (SELECT COUNT(*) FROM photo_likes WHERE photo_id=p.id) likes,
        (SELECT group_concat(user_id) FROM photo_likes WHERE photo_id=p.id) liked_by,
        u.display_name poster_name, u.color poster_color
      FROM photos p JOIN users u ON u.id=p.posted_by
      ORDER BY p.posted_at DESC`,
    )
    .all();
  res.json(rows);
});
app.post('/api/photos', upload.single('photo'), (req, res) => {
  const { caption, userId } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const r = db
    .prepare(`INSERT INTO photos (filename,caption,posted_by) VALUES (?,?,?)`)
    .run(req.file.filename, caption || '', Number(userId));
  const photo = db
    .prepare(
      `SELECT p.*, 0 likes, u.display_name poster_name, u.color poster_color
       FROM photos p JOIN users u ON u.id=p.posted_by WHERE p.id=?`,
    )
    .get(r.lastInsertRowid);
  io.emit('photo:new', photo);
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  logActivity(io, Number(userId), 'photo', `${u.display_name} added a photo`, 'image');
  markActive(io, Number(userId));
  res.json(photo);
});
app.delete('/api/photos/:id', (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id=?').get(req.params.id);
  if (photo) {
    try {
      fs.unlinkSync(path.join(DATA_DIR, 'photos', photo.filename));
    } catch (e) {}
    db.prepare('DELETE FROM photo_likes WHERE photo_id=?').run(photo.id);
    db.prepare('DELETE FROM photos WHERE id=?').run(photo.id);
    io.emit('photo:deleted', { id: photo.id });
  }
  res.json({ ok: true });
});

// ── PLACES (map) ──
app.get('/api/places', (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, u.display_name added_name, u.color added_color
       FROM places p LEFT JOIN users u ON u.id=p.added_by
       ORDER BY p.created_at DESC`,
    )
    .all();
  res.json(rows);
});
app.post('/api/places', upload.single('photo'), (req, res) => {
  const { name, note, lat, lng, userId } = req.body;
  if (!name || lat === undefined || lng === undefined)
    return res.status(400).json({ error: 'Missing fields' });
  const r = db
    .prepare(`INSERT INTO places (name,note,lat,lng,filename,added_by) VALUES (?,?,?,?,?,?)`)
    .run(name, note || '', Number(lat), Number(lng), req.file ? req.file.filename : null, Number(userId));
  const place = db
    .prepare(
      `SELECT p.*, u.display_name added_name, u.color added_color
       FROM places p LEFT JOIN users u ON u.id=p.added_by WHERE p.id=?`,
    )
    .get(r.lastInsertRowid);
  io.emit('place:new', place);
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) logActivity(io, Number(userId), 'place', `${u.display_name} pinned ${name}`, 'map');
  markActive(io, Number(userId));
  res.json(place);
});
app.delete('/api/places/:id', (req, res) => {
  const place = db.prepare('SELECT * FROM places WHERE id=?').get(req.params.id);
  if (place) {
    if (place.filename) {
      try {
        fs.unlinkSync(path.join(DATA_DIR, 'photos', place.filename));
      } catch (e) {}
    }
    db.prepare('DELETE FROM places WHERE id=?').run(place.id);
    io.emit('place:deleted', { id: place.id });
  }
  res.json({ ok: true });
});

// ── DIARY ──
app.get('/api/diary/today', (req, res) => {
  const day = ensureTodayPrompt();
  const entries = db.prepare('SELECT * FROM diary_entries WHERE date=?').all(day.date);
  res.json({ day, entries });
});
app.post('/api/diary', (req, res) => {
  const { userId, response } = req.body;
  const date = todayStr();
  ensureTodayPrompt();
  const isNew = !db
    .prepare('SELECT 1 FROM diary_entries WHERE date=? AND user_id=?')
    .get(date, Number(userId));
  db.prepare(
    `INSERT INTO diary_entries (date,user_id,response) VALUES (?,?,?)
     ON CONFLICT(date,user_id) DO UPDATE SET response=excluded.response, created_at=datetime('now')`,
  ).run(date, Number(userId), response);
  const entries = db.prepare('SELECT * FROM diary_entries WHERE date=?').all(date);
  io.emit('diary:update', { date, entries });
  if (isNew) {
    awardStars(io, 5);
    const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
    logActivity(io, Number(userId), 'diary', `${u.display_name} answered today's prompt`, 'book');
    diaryGrants(io, date);
  }
  markActive(io, Number(userId));
  res.json({ ok: true });
});
app.get('/api/diary/history', (req, res) => {
  const days = db.prepare(`SELECT * FROM diary_days ORDER BY date DESC LIMIT 60`).all();
  const out = days.map((d) => ({
    ...d,
    entries: db.prepare('SELECT * FROM diary_entries WHERE date=?').all(d.date),
  }));
  res.json(out);
});

// ── NOTES ──
app.get('/api/notes', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT n.*, u.display_name from_name, u.color from_color
         FROM notes n JOIN users u ON u.id=n.from_user ORDER BY n.created_at DESC`,
      )
      .all(),
  );
});

// ── GAMES ──
function gameById(id) {
  return GAMES.games.find((g) => g.id === id);
}
app.post('/api/games/start', (req, res) => {
  const { gameId, userId } = req.body;
  // Reuse the most recent incomplete session so both partners share one.
  const open = db
    .prepare(`SELECT * FROM game_sessions WHERE game_id=? AND completed=0 ORDER BY played_at DESC LIMIT 1`)
    .get(gameId);
  if (open) return res.json({ sessionId: open.id, joined: true });
  const r = db
    .prepare(`INSERT INTO game_sessions (game_id,started_by) VALUES (?,?)`)
    .run(gameId, Number(userId));
  io.emit('game:answer_progress', { sessionId: r.lastInsertRowid, userId: Number(userId) });
  io.emit('game:started', { gameId, by: Number(userId) });
  const game = gameById(gameId);
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (game && u) {
    PUSH.notifyUser(partnerId(userId), {
      title: `💞 ${u.display_name} started ${game.title}`,
      body: 'play it back to see how you match!',
      url: `/games/${gameId}`,
    });
  }
  res.json({ sessionId: r.lastInsertRowid });
});
app.post('/api/games/answer', (req, res) => {
  const { sessionId, questionId, userId, answer, kind } = req.body;
  const k = kind === 'guess' ? 'guess' : 'self';
  // Upsert-ish: replace any prior answer for this question+kind+user in the session.
  db.prepare(
    `DELETE FROM game_answers WHERE session_id=? AND question_id=? AND user_id=? AND kind=?`,
  ).run(sessionId, questionId, Number(userId), k);
  db.prepare(
    `INSERT INTO game_answers (session_id,question_id,user_id,answer,kind) VALUES (?,?,?,?,?)`,
  ).run(sessionId, questionId, Number(userId), answer, k);
  io.emit('game:answer_progress', { sessionId: Number(sessionId), userId: Number(userId) });

  // Complete when BOTH users have answered all questions for BOTH self and guess (2N each).
  const session = db.prepare('SELECT * FROM game_sessions WHERE id=?').get(sessionId);
  const game = session && gameById(session.game_id);
  if (game && !session.completed) {
    const need = game.questions.length * (game.format === 'party' ? 1 : 2);
    const counts = db
      .prepare('SELECT user_id, COUNT(*) c FROM game_answers WHERE session_id=? GROUP BY user_id')
      .all(sessionId);
    const myCount = counts.find((c) => c.user_id === Number(userId))?.c || 0;
    const partnerCount = counts.find((c) => c.user_id === partnerId(userId))?.c || 0;
    const bothDone = counts.length >= 2 && counts.every((c) => c.c >= need);
    const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
    if (bothDone) {
      db.prepare('UPDATE game_sessions SET completed=1 WHERE id=?').run(sessionId);
      awardStars(io, 15);
      grantTreat(io, 1);
      io.emit('game:complete', { sessionId: Number(sessionId), gameId: session.game_id });
      logActivity(io, Number(userId), 'game', `You both completed ${game.title}`, 'trophy');
      PUSH.notifyUser(partnerId(userId), {
        title: `✅ ${game.title} is ready`,
        body: 'you both finished — tap to see the reveal!',
        url: `/games/${session.game_id}/results/${sessionId}`,
      });
    } else if (myCount === need && partnerCount < need && u) {
      // I just finished my part; nudge my partner to play back.
      PUSH.notifyUser(partnerId(userId), {
        title: `💞 ${u.display_name} is waiting`,
        body: `${u.display_name} finished ${game.title} — your turn!`,
        url: `/games/${session.game_id}`,
      });
    }
  }
  markActive(io, Number(userId));
  res.json({ ok: true });
});
app.get('/api/games/session/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM game_sessions WHERE id=?').get(req.params.id);
  const answers = db.prepare('SELECT * FROM game_answers WHERE session_id=?').all(req.params.id);
  res.json({ session, answers });
});
app.get('/api/games/history/:gameId', (req, res) => {
  const sessions = db
    .prepare(`SELECT * FROM game_sessions WHERE game_id=? ORDER BY played_at DESC`)
    .all(req.params.gameId);
  res.json(sessions);
});
// Per-game badge state for a user: 'turn' (partner played, your move) | 'ready' (done, unseen).
app.get('/api/games/pending', (req, res) => {
  const uid = Number(req.query.userId);
  const sessions = db.prepare('SELECT * FROM game_sessions ORDER BY played_at DESC').all();
  const out = {};
  const processed = new Set();
  for (const s of sessions) {
    if (processed.has(s.game_id)) continue; // only the most recent session per game
    processed.add(s.game_id);
    const game = gameById(s.game_id);
    if (!game) continue;
    const need = game.questions.length * (game.format === 'party' ? 1 : 2);
    const counts = db
      .prepare('SELECT user_id, COUNT(*) c FROM game_answers WHERE session_id=? GROUP BY user_id')
      .all(s.id);
    const mine = counts.find((c) => c.user_id === uid)?.c || 0;
    const partner = counts.find((c) => c.user_id !== uid)?.c || 0;
    if (s.completed) {
      const seen = (s.seen_by || '').split(',').filter(Boolean).map(Number);
      if (!seen.includes(uid)) out[s.game_id] = { status: 'ready', sessionId: s.id };
    } else if (partner > 0 && mine < need) {
      out[s.game_id] = { status: 'turn', sessionId: s.id };
    }
  }
  res.json(out);
});
app.post('/api/games/seen', (req, res) => {
  const { sessionId, userId } = req.body;
  const s = db.prepare('SELECT seen_by FROM game_sessions WHERE id=?').get(sessionId);
  if (s) {
    const seen = new Set((s.seen_by || '').split(',').filter(Boolean).map(Number));
    seen.add(Number(userId));
    db.prepare('UPDATE game_sessions SET seen_by=? WHERE id=?').run([...seen].join(','), sessionId);
    io.emit('game:seen', { sessionId: Number(sessionId), userId: Number(userId) });
  }
  res.json({ ok: true });
});

// ── GARDEN ──
app.get('/api/garden', (req, res) => {
  res.json(db.prepare('SELECT * FROM garden ORDER BY planted_at').all());
});

// ── ARCADE MATCHES ──
app.get('/api/matches', (req, res) => {
  res.json(
    db
      .prepare('SELECT * FROM matches ORDER BY updated_at DESC LIMIT 40')
      .all()
      .map((m) => ({ ...m, state: JSON.parse(m.state) })),
  );
});
app.post('/api/matches', (req, res) => {
  const { game, userId } = req.body;
  if (!ARCADE.CATALOG.some((g) => g.id === game)) return res.status(400).json({ error: 'unknown game' });
  const state = ARCADE.newState(game);
  const r = db
    .prepare(`INSERT INTO matches (game,state,turn,status,created_by) VALUES (?,?,?,?,?)`)
    .run(game, JSON.stringify(state), Number(userId), 'active', Number(userId));
  const m = matchRow(r.lastInsertRowid);
  io.emit('match:update', m);
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) {
    logActivity(io, Number(userId), 'game', `${u.display_name} started ${ARCADE.title(game)}`, 'gamepad');
    PUSH.notifyUser(partnerId(userId), {
      title: `🎮 ${u.display_name} started ${ARCADE.title(game)}`,
      body: 'get ready to play back!',
      url: `/match/${m.id}`,
    });
  }
  markActive(io, Number(userId));
  res.json(m);
});

// ── ABOUT US ──
app.get('/api/about', (req, res) => {
  res.json({
    dates: db.prepare('SELECT * FROM special_dates ORDER BY date').all(),
    items: db.prepare('SELECT * FROM about_items ORDER BY created_at DESC').all(),
    couple: db.prepare('SELECT * FROM couple WHERE id=1').get(),
    users: db.prepare('SELECT id,display_name,color,streak FROM users').all(),
  });
});
app.post('/api/about/date', (req, res) => {
  const { label, date, icon } = req.body;
  const r = db
    .prepare(`INSERT INTO special_dates (label,date,icon) VALUES (?,?,?)`)
    .run(label, date, icon || 'gift');
  res.json({ id: r.lastInsertRowid });
});
app.delete('/api/about/date/:id', (req, res) => {
  db.prepare('DELETE FROM special_dates WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});
app.post('/api/about/item', (req, res) => {
  const { section, userId, title, body } = req.body;
  const r = db
    .prepare(`INSERT INTO about_items (section,user_id,title,body) VALUES (?,?,?,?)`)
    .run(section, userId ? Number(userId) : null, title, body);
  res.json({ id: r.lastInsertRowid });
});
app.delete('/api/about/item/:id', (req, res) => {
  db.prepare('DELETE FROM about_items WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── BUCKET LIST ──
app.get('/api/bucket', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT b.*, c.display_name created_name, c.color created_color, d.display_name completed_name
         FROM bucket_items b
         LEFT JOIN users c ON c.id=b.created_by
         LEFT JOIN users d ON d.id=b.completed_by
         ORDER BY b.done ASC, b.created_at DESC`,
      )
      .all(),
  );
});
app.post('/api/bucket', (req, res) => {
  const { title, note, userId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const r = db
    .prepare(`INSERT INTO bucket_items (title,note,created_by) VALUES (?,?,?)`)
    .run(title, note || '', Number(userId));
  const item = bucketItem(r.lastInsertRowid);
  io.emit('bucket:new', item);
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) logActivity(io, Number(userId), 'bucket', `${u.display_name} added "${title}" to the bucket list`, 'list');
  markActive(io, Number(userId));
  res.json(item);
});
app.post('/api/bucket/:id/done', upload.single('photo'), (req, res) => {
  const { userId, done } = req.body;
  const isDone = done === '1' || done === 'true' || done === true;
  const item0 = db.prepare('SELECT * FROM bucket_items WHERE id=?').get(req.params.id);
  if (!item0) return res.status(404).json({ error: 'Not found' });
  if (isDone) {
    db.prepare(
      `UPDATE bucket_items SET done=1, completed_by=?, done_at=datetime('now')${req.file ? ', filename=?' : ''} WHERE id=?`,
    ).run(...(req.file ? [Number(userId), req.file.filename, req.params.id] : [Number(userId), req.params.id]));
    awardStars(io, 10);
    const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
    if (u) logActivity(io, Number(userId), 'bucket', `${u.display_name} completed "${item0.title}" 🎉`, 'list');
  } else {
    db.prepare(`UPDATE bucket_items SET done=0, completed_by=NULL, done_at=NULL WHERE id=?`).run(req.params.id);
  }
  const item = bucketItem(req.params.id);
  io.emit('bucket:update', item);
  markActive(io, Number(userId));
  res.json(item);
});
app.delete('/api/bucket/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM bucket_items WHERE id=?').get(req.params.id);
  if (item) {
    if (item.filename) {
      try {
        fs.unlinkSync(path.join(DATA_DIR, 'photos', item.filename));
      } catch (e) {}
    }
    db.prepare('DELETE FROM bucket_items WHERE id=?').run(item.id);
    io.emit('bucket:deleted', { id: item.id });
  }
  res.json({ ok: true });
});
function bucketItem(id) {
  return db
    .prepare(
      `SELECT b.*, c.display_name created_name, c.color created_color, d.display_name completed_name
       FROM bucket_items b
       LEFT JOIN users c ON c.id=b.created_by
       LEFT JOIN users d ON d.id=b.completed_by WHERE b.id=?`,
    )
    .get(id);
}

// ── ROOM DECOR ──
app.get('/api/decor', (req, res) => {
  const equipped = db.prepare('SELECT * FROM room_decor WHERE id=1').get();
  const owned = db.prepare('SELECT item_id FROM owned_decor').all().map((r) => r.item_id);
  res.json({
    slots: DECOR.SLOTS,
    items: DECOR.ITEMS,
    defaults: DECOR.DEFAULTS,
    equipped,
    owned,
    stars: db.prepare('SELECT stars FROM couple WHERE id=1').get().stars,
  });
});
app.post('/api/decor/buy', (req, res) => {
  const { itemId } = req.body;
  const item = DECOR.itemById(itemId);
  if (!item) return res.status(404).json({ error: 'No such item' });
  const owned = db.prepare('SELECT 1 FROM owned_decor WHERE item_id=?').get(itemId);
  if (owned || item.price === 0) return res.json({ ok: true, alreadyOwned: true });
  const couple = db.prepare('SELECT stars FROM couple WHERE id=1').get();
  if (couple.stars < item.price) return res.status(400).json({ error: 'Not enough stars' });
  db.prepare('UPDATE couple SET stars = stars - ? WHERE id=1').run(item.price);
  db.prepare('INSERT OR IGNORE INTO owned_decor (item_id) VALUES (?)').run(itemId);
  io.emit('couple:update', db.prepare('SELECT * FROM couple WHERE id=1').get());
  res.json({ ok: true });
});
app.post('/api/decor/equip', (req, res) => {
  const { slot, itemId } = req.body;
  const item = DECOR.itemById(itemId);
  if (!item || item.slot !== slot) return res.status(400).json({ error: 'Bad item' });
  const isDefault = DECOR.DEFAULTS[slot] === itemId;
  const owned = db.prepare('SELECT 1 FROM owned_decor WHERE item_id=?').get(itemId);
  if (!owned && !isDefault) return res.status(400).json({ error: 'Not owned' });
  const col = ['wallpaper', 'floor', 'cat', 'pot'].includes(slot) ? slot : null;
  if (!col) return res.status(400).json({ error: 'Bad slot' });
  db.prepare(`UPDATE room_decor SET ${col}=? WHERE id=1`).run(itemId);
  const row = db.prepare('SELECT * FROM room_decor WHERE id=1').get();
  io.emit('decor:update', DECOR.resolve(row));
  res.json({ ok: true, equipped: row });
});

// ── PUSH ──
app.get('/api/push/key', (req, res) => res.json({ key: PUSH.publicKey() }));
app.post('/api/push/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  PUSH.saveSub(Number(userId), subscription);
  res.json({ ok: true });
});
app.post('/api/push/unsubscribe', (req, res) => {
  if (req.body.endpoint) PUSH.removeSub(req.body.endpoint);
  res.json({ ok: true });
});

// ── MILESTONES (timeline) ──
app.get('/api/milestones', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT m.*, u.display_name created_name, u.color created_color
         FROM milestones m LEFT JOIN users u ON u.id=m.created_by
         ORDER BY m.date DESC, m.id DESC`,
      )
      .all(),
  );
});
app.post('/api/milestones', upload.single('photo'), (req, res) => {
  const { title, note, date, userId } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Missing fields' });
  const r = db
    .prepare(`INSERT INTO milestones (title,note,date,filename,created_by) VALUES (?,?,?,?,?)`)
    .run(title, note || '', date, req.file ? req.file.filename : null, Number(userId));
  const m = db
    .prepare(
      `SELECT m.*, u.display_name created_name, u.color created_color
       FROM milestones m LEFT JOIN users u ON u.id=m.created_by WHERE m.id=?`,
    )
    .get(r.lastInsertRowid);
  io.emit('milestone:new', m);
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) logActivity(io, Number(userId), 'milestone', `${u.display_name} added a memory: ${title}`, 'star');
  markActive(io, Number(userId));
  res.json(m);
});
app.delete('/api/milestones/:id', (req, res) => {
  const m = db.prepare('SELECT * FROM milestones WHERE id=?').get(req.params.id);
  if (m) {
    if (m.filename) {
      try {
        fs.unlinkSync(path.join(DATA_DIR, 'photos', m.filename));
      } catch (e) {}
    }
    db.prepare('DELETE FROM milestones WHERE id=?').run(m.id);
    io.emit('milestone:deleted', { id: m.id });
  }
  res.json({ ok: true });
});

// ── ON THIS DAY ──
app.get('/api/onthisday', (req, res) => {
  const today = todayStr();
  const md = today.slice(5); // MM-DD
  const photos = db
    .prepare(
      `SELECT id, filename, caption, posted_at FROM photos
       WHERE strftime('%m-%d', posted_at)=? AND date(posted_at) < ? ORDER BY posted_at DESC`,
    )
    .all(md, today);
  const milestones = db
    .prepare(`SELECT id, title, note, date FROM milestones WHERE substr(date,6)=? AND date < ? ORDER BY date DESC`)
    .all(md, today);
  const notes = db
    .prepare(
      `SELECT id, body, created_at FROM notes WHERE strftime('%m-%d', created_at)=? AND date(created_at) < ? ORDER BY created_at DESC`,
    )
    .all(md, today);
  res.json({ photos, milestones, notes });
});

// ── STATS ──
app.get('/api/stats', (req, res) => {
  const couple = db.prepare('SELECT * FROM couple WHERE id=1').get();
  const count = (sql) => db.prepare(sql).get().c;
  const daysTogether = Math.max(
    0,
    Math.floor((Date.now() - new Date((couple.created_at || '').replace(' ', 'T') + 'Z').getTime()) / 86400000),
  );
  // simple mood compatibility: how often recent moods matched on the same day
  let compat = null;
  try {
    const rows = db
      .prepare(
        `SELECT date(created_at) d, user_id, mood FROM mood_log
         WHERE created_at > datetime('now','-30 days')`,
      )
      .all();
    const byDay = {};
    rows.forEach((r) => {
      byDay[r.d] = byDay[r.d] || {};
      byDay[r.d][r.user_id] = r.mood;
    });
    const days = Object.values(byDay).filter((d) => Object.keys(d).length >= 2);
    if (days.length) {
      const same = days.filter((d) => {
        const vals = Object.values(d);
        return vals[0] === vals[1];
      }).length;
      compat = Math.round((same / days.length) * 100);
    }
  } catch (e) {}
  res.json({
    daysTogether,
    stars: couple.stars,
    ourStreak: couple.our_streak,
    notes: count('SELECT COUNT(*) c FROM notes'),
    affection: count('SELECT COUNT(*) c FROM affection'),
    photos: count('SELECT COUNT(*) c FROM photos'),
    gamesPlayed: count('SELECT COUNT(*) c FROM game_sessions WHERE completed=1'),
    bucketDone: count('SELECT COUNT(*) c FROM bucket_items WHERE done=1'),
    places: count('SELECT COUNT(*) c FROM places'),
    milestones: count('SELECT COUNT(*) c FROM milestones'),
    moodCompat: compat,
  });
});

// ── DAILY CHECK-IN ──
app.get('/api/checkin/today', (req, res) => {
  const date = todayStr();
  res.json({ date, entries: db.prepare('SELECT * FROM checkins WHERE date=?').all(date) });
});
app.post('/api/checkin', (req, res) => {
  const { userId, rating, note } = req.body;
  const date = todayStr();
  const isNew = !db.prepare('SELECT 1 FROM checkins WHERE date=? AND user_id=?').get(date, Number(userId));
  db.prepare(
    `INSERT INTO checkins (date,user_id,rating,note) VALUES (?,?,?,?)
     ON CONFLICT(date,user_id) DO UPDATE SET rating=excluded.rating, note=excluded.note, created_at=datetime('now')`,
  ).run(date, Number(userId), Number(rating) || null, note || '');
  const entries = db.prepare('SELECT * FROM checkins WHERE date=?').all(date);
  io.emit('checkin:update', { date, entries });
  if (isNew) {
    awardStars(io, 5);
    const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
    if (u) {
      logActivity(io, Number(userId), 'checkin', `${u.display_name} checked in for today`, 'sun');
      PUSH.notifyUser(Number(userId) === 1 ? 2 : 1, {
        title: `${u.display_name} checked in ☀️`,
        body: 'see how their day is going',
        url: '/checkin',
      });
    }
  }
  markActive(io, Number(userId));
  res.json({ ok: true });
});
app.get('/api/checkin/history', (req, res) => {
  const days = db
    .prepare(`SELECT DISTINCT date FROM checkins ORDER BY date DESC LIMIT 30`)
    .all()
    .map((r) => r.date);
  res.json(
    days.map((d) => ({ date: d, entries: db.prepare('SELECT * FROM checkins WHERE date=?').all(d) })),
  );
});

// ── MOOD HISTORY ──
app.get('/api/mood/history', (req, res) => {
  const days = Math.min(90, Number(req.query.days) || 30);
  res.json(
    db
      .prepare(
        `SELECT user_id, mood, emoji, color, created_at FROM mood_log
         WHERE created_at > datetime('now', ?) ORDER BY created_at DESC`,
      )
      .all(`-${days} days`),
  );
});

// ── WATCHLIST ──
app.get('/api/watchlist', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT w.*, u.display_name added_name, u.color added_color
         FROM watchlist w LEFT JOIN users u ON u.id=w.added_by
         ORDER BY w.watched ASC, w.created_at DESC`,
      )
      .all(),
  );
});
app.post('/api/watchlist', (req, res) => {
  const { title, kind, note, userId } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const r = db
    .prepare(`INSERT INTO watchlist (title,kind,note,added_by) VALUES (?,?,?,?)`)
    .run(title, kind || 'movie', note || '', Number(userId));
  const item = watchItem(r.lastInsertRowid);
  io.emit('watchlist:new', item);
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) logActivity(io, Number(userId), 'watch', `${u.display_name} added "${title}" to the watchlist`, 'tv');
  markActive(io, Number(userId));
  res.json(item);
});
app.post('/api/watchlist/:id/watched', (req, res) => {
  const { watched, rating } = req.body;
  const isWatched = watched === '1' || watched === true || watched === 1;
  db.prepare(
    `UPDATE watchlist SET watched=?, rating=?, watched_at=${isWatched ? "datetime('now')" : 'NULL'} WHERE id=?`,
  ).run(isWatched ? 1 : 0, rating != null ? Number(rating) : null, req.params.id);
  const item = watchItem(req.params.id);
  io.emit('watchlist:update', item);
  res.json(item);
});
app.delete('/api/watchlist/:id', (req, res) => {
  db.prepare('DELETE FROM watchlist WHERE id=?').run(req.params.id);
  io.emit('watchlist:deleted', { id: Number(req.params.id) });
  res.json({ ok: true });
});
function watchItem(id) {
  return db
    .prepare(
      `SELECT w.*, u.display_name added_name, u.color added_color
       FROM watchlist w LEFT JOIN users u ON u.id=w.added_by WHERE w.id=?`,
    )
    .get(id);
}

// ── EVENTS (shared calendar) ──
app.get('/api/events', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT e.*, u.display_name created_name, u.color created_color
         FROM events e LEFT JOIN users u ON u.id=e.created_by
         ORDER BY e.date ASC, e.time ASC`,
      )
      .all(),
  );
});
app.post('/api/events', (req, res) => {
  const { title, date, time, note, userId } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Missing fields' });
  const r = db
    .prepare(`INSERT INTO events (title,date,time,note,created_by) VALUES (?,?,?,?,?)`)
    .run(title, date, time || '', note || '', Number(userId));
  const ev = db
    .prepare(
      `SELECT e.*, u.display_name created_name, u.color created_color
       FROM events e LEFT JOIN users u ON u.id=e.created_by WHERE e.id=?`,
    )
    .get(r.lastInsertRowid);
  io.emit('event:new', ev);
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) logActivity(io, Number(userId), 'event', `${u.display_name} planned "${title}"`, 'calendar');
  markActive(io, Number(userId));
  res.json(ev);
});
app.delete('/api/events/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id=?').run(req.params.id);
  io.emit('event:deleted', { id: Number(req.params.id) });
  res.json({ ok: true });
});

// ── ACTIVITY ──
app.get('/api/activity', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT a.*, u.display_name actor_name FROM activity a JOIN users u ON u.id=a.actor_id
         ORDER BY a.created_at DESC LIMIT 100`,
      )
      .all(),
  );
});

// SPA fallback
app.get('*', (req, res) => {
  const indexFile = path.join(DIST, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.status(200).send('Us 💜 — build the client with `npm run build`.');
});

register(io);
scheduleMidnight(io);
ensureTodayPrompt();

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Us 💜 on :${PORT}`));
