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
const INTER = require('./interactables');

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
        'SELECT id,username,display_name,color,current_mood,mood_emoji,mood_color,mood_at,streak,last_active_day,status,status_at,tz FROM users',
      )
      .all(),
    couple: db.prepare('SELECT * FROM couple WHERE id=1').get(),
    pet: db.prepare('SELECT * FROM pet WHERE id=1').get(),
    plant: db.prepare('SELECT * FROM plant WHERE id=1').get(),
    garden: db.prepare('SELECT * FROM garden ORDER BY planted_at').all(),
    campfire: INTER.campfireState(),
    aquarium: INTER.aquariumState(),
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

// ── LOVE JAR ──
app.get('/api/lovejar', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT j.*, u.display_name added_name, u.color added_color
         FROM love_jar j LEFT JOIN users u ON u.id=j.added_by ORDER BY j.created_at DESC`,
      )
      .all(),
  );
});
app.post('/api/lovejar', (req, res) => {
  const { kind, body, userId } = req.body;
  const k = kind === 'note' ? 'note' : 'heart';
  const r = db
    .prepare(`INSERT INTO love_jar (kind,body,added_by) VALUES (?,?,?)`)
    .run(k, (body || '').slice(0, 280), Number(userId));
  const item = db
    .prepare(
      `SELECT j.*, u.display_name added_name, u.color added_color
       FROM love_jar j LEFT JOIN users u ON u.id=j.added_by WHERE j.id=?`,
    )
    .get(r.lastInsertRowid);
  io.emit('lovejar:new', item);
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) logActivity(io, Number(userId), 'lovejar', `${u.display_name} added a ${k} to the love jar 🫙`, 'jar');
  markActive(io, Number(userId));
  res.json(item);
});
app.delete('/api/lovejar/:id', (req, res) => {
  db.prepare('DELETE FROM love_jar WHERE id=?').run(req.params.id);
  io.emit('lovejar:deleted', { id: Number(req.params.id) });
  res.json({ ok: true });
});

// ── STAR MAP ──
app.get('/api/stars', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT s.*, u.display_name added_name, u.color added_color
         FROM stars s LEFT JOIN users u ON u.id=s.added_by ORDER BY s.created_at ASC`,
      )
      .all(),
  );
});
app.post('/api/stars', (req, res) => {
  const { label, x, y, userId } = req.body;
  const r = db
    .prepare(`INSERT INTO stars (label,x,y,added_by) VALUES (?,?,?,?)`)
    .run((label || '').slice(0, 80), Number(x), Number(y), Number(userId));
  const item = db
    .prepare(
      `SELECT s.*, u.display_name added_name, u.color added_color
       FROM stars s LEFT JOIN users u ON u.id=s.added_by WHERE s.id=?`,
    )
    .get(r.lastInsertRowid);
  io.emit('star:new', item);
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) logActivity(io, Number(userId), 'star', `${u.display_name} added a star ✨`, 'star');
  markActive(io, Number(userId));
  res.json(item);
});
app.delete('/api/stars/:id', (req, res) => {
  db.prepare('DELETE FROM stars WHERE id=?').run(req.params.id);
  io.emit('star:deleted', { id: Number(req.params.id) });
  res.json({ ok: true });
});

// ── REUNION COUNTDOWN ──
app.post('/api/reunion', (req, res) => {
  const { at, label } = req.body;
  db.prepare('UPDATE couple SET reunion_at=?, reunion_label=? WHERE id=1').run(
    at || null,
    (label || '').slice(0, 60) || null,
  );
  const couple = db.prepare('SELECT * FROM couple WHERE id=1').get();
  io.emit('couple:update', couple);
  res.json(couple);
});

// ── "OPEN WHEN…" LETTERS ──
app.get('/api/letters', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT l.*, u.display_name written_name FROM letters l LEFT JOIN users u ON u.id=l.written_by ORDER BY l.created_at DESC`,
      )
      .all(),
  );
});
app.post('/api/letters', (req, res) => {
  const { occasion, body, userId } = req.body;
  const r = db
    .prepare(`INSERT INTO letters (occasion,body,written_by) VALUES (?,?,?)`)
    .run((occasion || '').slice(0, 60), (body || '').slice(0, 2000), Number(userId));
  io.emit('letters:changed');
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) {
    logActivity(io, Number(userId), 'letter', `${u.display_name} sealed a letter 💌`, 'mail');
    PUSH.notifyUser(partnerId(userId), {
      title: '💌 A new letter for you',
      body: `open when ${occasion}`,
      url: '/letters',
    });
  }
  res.json(db.prepare('SELECT * FROM letters WHERE id=?').get(r.lastInsertRowid));
});
app.post('/api/letters/:id/open', (req, res) => {
  const { userId } = req.body;
  db.prepare(`UPDATE letters SET opened_at=datetime('now') WHERE id=? AND opened_at IS NULL`).run(req.params.id);
  const l = db.prepare('SELECT * FROM letters WHERE id=?').get(req.params.id);
  io.emit('letters:changed');
  if (l && l.written_by !== Number(userId)) {
    const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
    PUSH.notifyUser(l.written_by, {
      title: '💌 They opened your letter',
      body: `${u?.display_name} read "${l.occasion}"`,
      url: '/letters',
    });
  }
  res.json(l);
});
app.delete('/api/letters/:id', (req, res) => {
  db.prepare('DELETE FROM letters WHERE id=?').run(req.params.id);
  io.emit('letters:changed');
  res.json({ ok: true });
});

// ── TIME CAPSULES (body hidden until unlock date) ──
app.get('/api/capsules', (req, res) => {
  const now = Date.now();
  const rows = db
    .prepare(
      `SELECT c.*, u.display_name written_name FROM capsules c LEFT JOIN users u ON u.id=c.written_by ORDER BY c.unlock_at ASC`,
    )
    .all();
  res.json(
    rows.map((c) => {
      const unlocked = c.unlock_at && Date.parse(c.unlock_at) <= now;
      return { ...c, unlocked, body: unlocked ? c.body : null };
    }),
  );
});
app.post('/api/capsules', (req, res) => {
  const { title, body, unlock_at, userId } = req.body;
  db.prepare(`INSERT INTO capsules (title,body,unlock_at,written_by) VALUES (?,?,?,?)`).run(
    (title || '').slice(0, 80),
    (body || '').slice(0, 2000),
    unlock_at || null,
    Number(userId),
  );
  io.emit('capsules:changed');
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) {
    logActivity(io, Number(userId), 'capsule', `${u.display_name} buried a time capsule ⏳`, 'capsule');
    PUSH.notifyUser(partnerId(userId), {
      title: '⏳ A time capsule was sealed',
      body: 'it unlocks on its special date',
      url: '/capsules',
    });
  }
  res.json({ ok: true });
});
app.post('/api/capsules/:id/open', (req, res) => {
  db.prepare(`UPDATE capsules SET opened_at=datetime('now') WHERE id=? AND opened_at IS NULL`).run(req.params.id);
  io.emit('capsules:changed');
  res.json({ ok: true });
});
app.delete('/api/capsules/:id', (req, res) => {
  db.prepare('DELETE FROM capsules WHERE id=?').run(req.params.id);
  io.emit('capsules:changed');
  res.json({ ok: true });
});

// ── LOVE COUPONS ──
app.get('/api/coupons', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT c.*, u.display_name created_name FROM coupons c LEFT JOIN users u ON u.id=c.created_by ORDER BY c.redeemed ASC, c.created_at DESC`,
      )
      .all(),
  );
});
app.post('/api/coupons', (req, res) => {
  const { title, note, userId } = req.body;
  db.prepare(`INSERT INTO coupons (title,note,created_by) VALUES (?,?,?)`).run(
    (title || '').slice(0, 80),
    (note || '').slice(0, 300),
    Number(userId),
  );
  io.emit('coupons:changed');
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) {
    logActivity(io, Number(userId), 'coupon', `${u.display_name} gave a love coupon 🎟️`, 'ticket');
    PUSH.notifyUser(partnerId(userId), { title: '🎟️ A new love coupon', body: title, url: '/coupons' });
  }
  res.json({ ok: true });
});
app.post('/api/coupons/:id/redeem', (req, res) => {
  const { userId } = req.body;
  db.prepare(`UPDATE coupons SET redeemed=1, redeemed_at=datetime('now') WHERE id=?`).run(req.params.id);
  const c = db.prepare('SELECT * FROM coupons WHERE id=?').get(req.params.id);
  io.emit('coupons:changed');
  if (c) {
    const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
    PUSH.notifyUser(c.created_by, {
      title: '🎟️ Coupon redeemed!',
      body: `${u?.display_name} redeemed "${c.title}"`,
      url: '/coupons',
    });
  }
  res.json({ ok: true });
});
app.delete('/api/coupons/:id', (req, res) => {
  db.prepare('DELETE FROM coupons WHERE id=?').run(req.params.id);
  io.emit('coupons:changed');
  res.json({ ok: true });
});

// ── GIFT WISHLIST (reserved/got hidden from the wish's owner) ──
app.get('/api/giftwishes', (req, res) => {
  const uid = Number(req.query.userId);
  const rows = db
    .prepare(
      `SELECT g.*, u.display_name added_name FROM gift_wishes g LEFT JOIN users u ON u.id=g.added_by ORDER BY g.got ASC, g.created_at DESC`,
    )
    .all();
  res.json(
    rows.map((g) => {
      const mine = g.added_by === uid;
      // owner never sees whether the partner reserved/got it (keep the surprise)
      return mine ? { ...g, reserved_by: null, got: 0, mine: true } : { ...g, mine: false };
    }),
  );
});
app.post('/api/giftwishes', (req, res) => {
  const { title, note, link, userId } = req.body;
  db.prepare(`INSERT INTO gift_wishes (title,note,link,added_by) VALUES (?,?,?,?)`).run(
    (title || '').slice(0, 100),
    (note || '').slice(0, 300),
    (link || '').slice(0, 400),
    Number(userId),
  );
  io.emit('giftwishes:changed');
  res.json({ ok: true });
});
app.post('/api/giftwishes/:id/reserve', (req, res) => {
  const { userId, got } = req.body;
  db.prepare(`UPDATE gift_wishes SET reserved_by=?, got=? WHERE id=?`).run(
    Number(userId),
    got ? 1 : 0,
    req.params.id,
  );
  io.emit('giftwishes:changed');
  res.json({ ok: true });
});
app.delete('/api/giftwishes/:id', (req, res) => {
  db.prepare('DELETE FROM gift_wishes WHERE id=?').run(req.params.id);
  io.emit('giftwishes:changed');
  res.json({ ok: true });
});

// ── SONG DEDICATIONS ──
app.get('/api/dedications', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT d.*, u.display_name dedicated_name, u.color dedicated_color FROM dedications d LEFT JOIN users u ON u.id=d.dedicated_by ORDER BY d.created_at DESC`,
      )
      .all(),
  );
});
app.post('/api/dedications', (req, res) => {
  const { song, artist, note, userId } = req.body;
  db.prepare(`INSERT INTO dedications (song,artist,note,dedicated_by) VALUES (?,?,?,?)`).run(
    (song || '').slice(0, 120),
    (artist || '').slice(0, 120),
    (note || '').slice(0, 300),
    Number(userId),
  );
  io.emit('dedications:changed');
  const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(Number(userId));
  if (u) {
    logActivity(io, Number(userId), 'dedication', `${u.display_name} dedicated "${song}" 🎶`, 'music');
    PUSH.notifyUser(partnerId(userId), { title: '🎶 A song for you', body: `${song} — ${artist}`, url: '/dedications' });
  }
  res.json({ ok: true });
});
app.delete('/api/dedications/:id', (req, res) => {
  db.prepare('DELETE FROM dedications WHERE id=?').run(req.params.id);
  io.emit('dedications:changed');
  res.json({ ok: true });
});

// ── DATE-NIGHT SPINNER ──
app.get('/api/spinner', (req, res) => {
  res.json(db.prepare('SELECT * FROM spinner_options ORDER BY id').all());
});
app.post('/api/spinner', (req, res) => {
  const { label, kind, userId } = req.body;
  db.prepare('INSERT INTO spinner_options (label,kind,created_by) VALUES (?,?,?)').run(
    (label || '').slice(0, 80),
    kind === 'irl' ? 'irl' : 'virtual',
    Number(userId),
  );
  io.emit('spinner:changed');
  res.json({ ok: true });
});
app.delete('/api/spinner/:id', (req, res) => {
  db.prepare('DELETE FROM spinner_options WHERE id=?').run(req.params.id);
  io.emit('spinner:changed');
  res.json({ ok: true });
});

// ── SHARED HABITS ──
function habitsPayload() {
  const habits = db
    .prepare(`SELECT h.*, u.display_name created_name FROM habits h LEFT JOIN users u ON u.id=h.created_by ORDER BY h.created_at`)
    .all();
  const logs = db.prepare('SELECT habit_id, user_id, date FROM habit_log').all();
  return { habits, logs, today: todayStr() };
}
app.get('/api/habits', (req, res) => res.json(habitsPayload()));
app.post('/api/habits', (req, res) => {
  const { title, icon, userId } = req.body;
  db.prepare('INSERT INTO habits (title,icon,created_by) VALUES (?,?,?)').run(
    (title || '').slice(0, 60),
    (icon || '✅').slice(0, 4),
    Number(userId),
  );
  io.emit('habits:changed');
  res.json({ ok: true });
});
app.post('/api/habits/:id/toggle', (req, res) => {
  const { userId, date } = req.body;
  const d = date || todayStr();
  const existing = db
    .prepare('SELECT id FROM habit_log WHERE habit_id=? AND user_id=? AND date=?')
    .get(req.params.id, Number(userId), d);
  if (existing) {
    db.prepare('DELETE FROM habit_log WHERE id=?').run(existing.id);
  } else {
    db.prepare('INSERT OR IGNORE INTO habit_log (habit_id,user_id,date) VALUES (?,?,?)').run(
      req.params.id,
      Number(userId),
      d,
    );
    awardStars(io, 1);
  }
  io.emit('habits:changed');
  res.json({ ok: true });
});
app.delete('/api/habits/:id', (req, res) => {
  db.prepare('DELETE FROM habit_log WHERE habit_id=?').run(req.params.id);
  db.prepare('DELETE FROM habits WHERE id=?').run(req.params.id);
  io.emit('habits:changed');
  res.json({ ok: true });
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
  if (game === 'pictionary') state.drawer = Number(userId);
  // For pictionary the "turn" (who must act) is the guesser; otherwise the creator moves first.
  const turn = game === 'pictionary' ? partnerId(userId) : Number(userId);
  const r = db
    .prepare(`INSERT INTO matches (game,state,turn,status,created_by) VALUES (?,?,?,?,?)`)
    .run(game, JSON.stringify(state), turn, 'active', Number(userId));
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
