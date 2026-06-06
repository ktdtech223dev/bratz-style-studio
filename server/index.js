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
        'SELECT id,username,display_name,color,current_mood,mood_emoji,mood_color,mood_at,streak,last_active_day FROM users',
      )
      .all(),
    couple: db.prepare('SELECT * FROM couple WHERE id=1').get(),
    pet: db.prepare('SELECT * FROM pet WHERE id=1').get(),
    plant: db.prepare('SELECT * FROM plant WHERE id=1').get(),
    radio: RADIO,
    games: GAMES,
    today: ensureTodayPrompt(),
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
    const need = game.questions.length * 2;
    const counts = db
      .prepare('SELECT user_id, COUNT(*) c FROM game_answers WHERE session_id=? GROUP BY user_id')
      .all(sessionId);
    const bothDone = counts.length >= 2 && counts.every((c) => c.c >= need);
    if (bothDone) {
      db.prepare('UPDATE game_sessions SET completed=1 WHERE id=?').run(sessionId);
      awardStars(io, 15);
      grantTreat(io, 1);
      io.emit('game:complete', { sessionId: Number(sessionId), gameId: session.game_id });
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
      logActivity(io, Number(userId), 'game', `You both completed ${game.title}`, 'trophy');
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
