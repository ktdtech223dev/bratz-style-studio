// server/sockets.js
const { db } = require('./database');
const { markActive, awardStars } = require('./economy');
const { notifyUser } = require('./push');
const ARCADE = require('./arcade');

function matchRow(id) {
  const m = db.prepare('SELECT * FROM matches WHERE id=?').get(id);
  if (!m) return null;
  return { ...m, state: JSON.parse(m.state) };
}

// Track connected sockets by userId
const online = {}; // userId -> Set(socketId)

function partnerOf(userId) {
  return userId === 1 ? 2 : 1;
}

function logActivity(io, actorId, type, message, icon) {
  const r = db
    .prepare(`INSERT INTO activity (actor_id,type,message,icon) VALUES (?,?,?,?)`)
    .run(actorId, type, message, icon);
  const row = db
    .prepare(
      `SELECT a.*, u.display_name actor_name FROM activity a JOIN users u ON u.id=a.actor_id WHERE a.id=?`,
    )
    .get(r.lastInsertRowid);
  io.emit('activity:new', row);
  return row;
}

function register(io) {
  io.on('connection', (socket) => {
    const userId = Number(socket.handshake.auth?.userId);
    if (userId) {
      online[userId] = online[userId] || new Set();
      online[userId].add(socket.id);
      io.emit('presence', { userId, online: true });
      // Tell the newcomer who is currently online
      Object.keys(online).forEach((uid) => {
        if (online[uid] && online[uid].size > 0) {
          socket.emit('presence', { userId: Number(uid), online: true });
        }
      });
    }

    // ── MOOD (real-time) ──
    socket.on('mood:set', ({ mood, emoji, color }) => {
      db.prepare(
        `UPDATE users SET current_mood=?, mood_emoji=?, mood_color=?, mood_at=datetime('now') WHERE id=?`,
      ).run(mood, emoji, color, userId);
      db.prepare(`INSERT INTO mood_log (user_id,mood,emoji,color) VALUES (?,?,?,?)`).run(
        userId,
        mood,
        emoji,
        color,
      );
      io.emit('mood:update', { userId, mood, emoji, color, at: new Date().toISOString() });
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      logActivity(io, userId, 'mood', `${u.display_name} updated their mood`, 'lightbulb');
      notifyUser(partnerOf(userId), {
        title: `${u.display_name} is feeling ${mood} ${emoji || ''}`.trim(),
        body: 'tap to see their mood',
        url: '/mood',
      });
      markActive(io, userId);
    });

    // ── AFFECTION (real-time popup) ──
    socket.on('affection:send', ({ type }) => {
      db.prepare(`INSERT INTO affection (type,from_user) VALUES (?,?)`).run(type, userId);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      const pid = partnerOf(userId);
      (online[pid] || []).forEach((sid) =>
        io.to(sid).emit('affection:receive', { type, from: u.display_name }),
      );
      logActivity(io, userId, 'affection', `${u.display_name} sent a ${prettyAffection(type)}`, 'heart');
      notifyUser(pid, {
        title: `${u.display_name} sent you a ${prettyAffection(type)} 💜`,
        body: 'open Us to feel the love',
        url: '/affection',
      });
      markActive(io, userId);
    });

    // ── PET care (real-time) ──
    socket.on('pet:care', ({ action }) => {
      const col = { feed: 'fed_at', play: 'played_at', pet: 'petted_at' }[action];
      if (col) {
        db.prepare(`UPDATE pet SET ${col}=datetime('now') WHERE id=1`).run();
      }
      if (action === 'treat') {
        db.prepare(
          `UPDATE pet SET treats=MAX(0,treats-1), fed_at=datetime('now'), played_at=datetime('now') WHERE id=1`,
        ).run();
      }
      const pet = recomputePetMood();
      io.emit('pet:update', pet);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      const verb = { feed: 'fed', play: 'played with', pet: 'petted', treat: 'gave a treat to' }[action] || 'cared for';
      logActivity(io, userId, 'pet', `${u.display_name} ${verb} ${pet.name}`, 'heart');
      awardStars(io, 2);
      markActive(io, userId);
    });

    // ── PLANT care (real-time) ──
    socket.on('plant:care', ({ action }) => {
      if (action === 'water')
        db.prepare(
          `UPDATE plant SET watered_at=datetime('now'), growth=MIN(100,growth+12) WHERE id=1`,
        ).run();
      if (action === 'fertilize')
        db.prepare(
          `UPDATE plant SET fertilized_at=datetime('now'), fertilizer=MAX(0,fertilizer-1), growth=MIN(100,growth+25) WHERE id=1`,
        ).run();
      const plant = recomputePlantGrowth();
      io.emit('plant:update', plant);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      const verb = action === 'water' ? 'watered' : 'fertilized';
      logActivity(io, userId, 'plant', `${u.display_name} ${verb} ${plant.name}`, 'sprout');
      awardStars(io, 2);
      markActive(io, userId);
    });

    // ── PET / PLANT rename ──
    socket.on('pet:rename', ({ name }) => {
      db.prepare('UPDATE pet SET name=? WHERE id=1').run(String(name).slice(0, 24));
      io.emit('pet:update', recomputePetMood());
    });
    socket.on('plant:rename', ({ name }) => {
      db.prepare('UPDATE plant SET name=? WHERE id=1').run(String(name).slice(0, 24));
      io.emit('plant:update', db.prepare('SELECT * FROM plant WHERE id=1').get());
    });

    // ── NOTES ──
    socket.on('note:send', ({ body }) => {
      const r = db.prepare(`INSERT INTO notes (from_user,body) VALUES (?,?)`).run(userId, body);
      const note = db
        .prepare(`SELECT n.*, u.display_name from_name FROM notes n JOIN users u ON u.id=n.from_user WHERE n.id=?`)
        .get(r.lastInsertRowid);
      io.emit('note:new', note);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      logActivity(io, userId, 'note', `${u.display_name} wrote you a note`, 'heart');
      notifyUser(partnerOf(userId), {
        title: `${u.display_name} wrote you a note 💌`,
        body: body.length > 80 ? body.slice(0, 80) + '…' : body,
        url: '/notes',
      });
      markActive(io, userId);
    });

    // ── PHOTO like (real-time) ──
    socket.on('photo:like', ({ photoId }) => {
      const existing = db
        .prepare('SELECT 1 FROM photo_likes WHERE photo_id=? AND user_id=?')
        .get(photoId, userId);
      if (existing) {
        db.prepare('DELETE FROM photo_likes WHERE photo_id=? AND user_id=?').run(photoId, userId);
      } else {
        db.prepare(`INSERT OR IGNORE INTO photo_likes (photo_id,user_id) VALUES (?,?)`).run(
          photoId,
          userId,
        );
      }
      const likes = db.prepare('SELECT COUNT(*) c FROM photo_likes WHERE photo_id=?').get(photoId).c;
      io.emit('photo:liked', { photoId, userId, likes, liked: !existing });
    });

    // ── AWAKE / ASLEEP STATUS ──
    socket.on('status:set', ({ status }) => {
      const st = status === 'asleep' ? 'asleep' : 'awake';
      db.prepare(`UPDATE users SET status=?, status_at=datetime('now') WHERE id=?`).run(st, userId);
      io.emit('status:update', { userId, status: st, at: new Date().toISOString() });
      if (st === 'asleep') {
        const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
        notifyUser(partnerOf(userId), {
          title: `${u.display_name} is heading to sleep 🌙`,
          body: 'goodnight 💜',
          url: '/',
        });
      }
    });

    // ── ARCADE: real-time turn-based matches ──
    socket.on('match:new', ({ game }) => {
      if (!ARCADE.CATALOG.some((g) => g.id === game)) return;
      const state = ARCADE.newState(game);
      const r = db
        .prepare(`INSERT INTO matches (game,state,turn,status,created_by) VALUES (?,?,?,?,?)`)
        .run(game, JSON.stringify(state), userId, 'active', userId);
      const m = matchRow(r.lastInsertRowid);
      io.emit('match:update', m);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      logActivity(io, userId, 'game', `${u.display_name} started ${ARCADE.title(game)}`, 'gamepad');
      notifyUser(partnerOf(userId), {
        title: `🎮 ${u.display_name} started ${ARCADE.title(game)}`,
        body: 'their move first — get ready to play back!',
        url: `/match/${m.id}`,
      });
      markActive(io, userId);
    });

    socket.on('match:move', ({ matchId, move }) => {
      const m = matchRow(matchId);
      if (!m || m.status !== 'active' || m.turn !== userId) return;
      let result;
      try {
        result = ARCADE.applyMove(m.game, m.state, move, userId);
      } catch (e) {
        return; // invalid move, ignore
      }
      const next = partnerOf(userId);
      const status = result.done ? 'done' : 'active';
      const turn = result.done ? null : next;
      db.prepare(
        `UPDATE matches SET state=?, turn=?, status=?, winner=?, updated_at=datetime('now') WHERE id=?`,
      ).run(JSON.stringify(result.state), turn, status, result.winner, matchId);
      const updated = matchRow(matchId);
      io.emit('match:update', updated);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      if (result.done) {
        if (result.winner && result.winner !== 0) awardStars(io, 5);
        const msg =
          result.winner === 0
            ? `${ARCADE.title(m.game)} ended in a draw`
            : `${u.display_name} won ${ARCADE.title(m.game)}`;
        logActivity(io, userId, 'game', msg, 'gamepad');
        notifyUser(next, {
          title: `🎮 ${ARCADE.title(m.game)} finished`,
          body: result.winner === 0 ? "it's a draw!" : `${u.display_name} won — rematch?`,
          url: `/match/${matchId}`,
        });
      } else {
        notifyUser(next, {
          title: `🎮 Your move in ${ARCADE.title(m.game)}`,
          body: `${u.display_name} just played — your turn!`,
          url: `/match/${matchId}`,
        });
      }
      markActive(io, userId);
    });

    socket.on('match:seen', ({ matchId }) => {
      const m = db.prepare('SELECT seen_by FROM matches WHERE id=?').get(matchId);
      if (!m) return;
      const seen = new Set((m.seen_by || '').split(',').filter(Boolean).map(Number));
      seen.add(userId);
      db.prepare('UPDATE matches SET seen_by=? WHERE id=?').run([...seen].join(','), matchId);
      io.emit('match:update', matchRow(matchId));
    });

    socket.on('match:rematch', ({ matchId }) => {
      const old = db.prepare('SELECT game FROM matches WHERE id=?').get(matchId);
      if (!old) return;
      const state = ARCADE.newState(old.game);
      const r = db
        .prepare(`INSERT INTO matches (game,state,turn,status,created_by) VALUES (?,?,?,?,?)`)
        .run(old.game, JSON.stringify(state), userId, 'active', userId);
      const m = matchRow(r.lastInsertRowid);
      io.emit('match:update', m);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      notifyUser(partnerOf(userId), {
        title: `🎮 Rematch! ${ARCADE.title(old.game)}`,
        body: `${u.display_name} wants to play again`,
        url: `/match/${m.id}`,
      });
    });

    // ── MUSIC station (shared, synced play state) ──
    socket.on('music:select', ({ stationId, playing }) => {
      io.emit('music:update', {
        stationId,
        playing: playing !== false,
        by: userId,
        at: new Date().toISOString(),
      });
      if (stationId && playing !== false) {
        const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
        logActivity(io, userId, 'music', `${u.display_name} put on some music`, 'music');
      }
    });

    socket.on('disconnect', () => {
      if (userId && online[userId]) {
        online[userId].delete(socket.id);
        if (online[userId].size === 0) io.emit('presence', { userId, online: false });
      }
    });
  });
}

function prettyAffection(type) {
  return (
    {
      hug: 'hug',
      kiss: 'kiss',
      wink: 'wink',
      nudge: 'nudge',
      high_five: 'high five',
      gratitude: 'moment of gratitude',
    }[type] || type
  );
}

// ── PET MOOD DECAY ──
function recomputePetMood() {
  const pet = db.prepare('SELECT * FROM pet WHERE id=1').get();
  const now = Date.now();
  const hrs = (ts) => (ts ? (now - new Date(ts.replace(' ', 'T') + 'Z').getTime()) / 3.6e6 : 999);
  const fedH = hrs(pet.fed_at);
  const playH = hrs(pet.played_at);
  const petH = hrs(pet.petted_at);
  const neglect = (fedH + playH + petH) / 3;
  let mood;
  if (neglect < 4) mood = 'Happy';
  else if (neglect < 10) mood = 'Content';
  else if (neglect < 18) mood = 'Pensive';
  else if (neglect < 28) mood = 'Lonely';
  else mood = 'Sad';
  db.prepare('UPDATE pet SET mood=? WHERE id=1').run(mood);
  return { ...pet, mood, timers: { feed: fedH, play: playH, pet: petH } };
}

// ── PLANT GROWTH ──
function recomputePlantGrowth() {
  const p = db.prepare('SELECT * FROM plant WHERE id=1').get();
  let { growth, stage } = p;
  while (growth >= 100 && stage < 4) {
    growth -= 100;
    stage++;
  }
  if (stage >= 4) growth = 100;
  db.prepare(`UPDATE plant SET growth=?, stage=? WHERE id=1`).run(growth, stage);
  return db.prepare('SELECT * FROM plant WHERE id=1').get();
}

module.exports = { register, logActivity, recomputePetMood, recomputePlantGrowth, online };
