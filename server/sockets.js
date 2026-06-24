// server/sockets.js
const { db } = require('./database');
const { markActive, awardStars } = require('./economy');
const { notifyUser } = require('./push');
const ARCADE = require('./arcade');
const INTER = require('./interactables');

function matchRow(id) {
  const m = db.prepare('SELECT * FROM matches WHERE id=?').get(id);
  if (!m) return null;
  return { ...m, state: JSON.parse(m.state) };
}

// Track connected sockets by userId
const online = {}; // userId -> Set(socketId)
const handsPressing = {}; // userId -> bool (live hold-hands state)
const lastHandsNotify = {}; // userId -> ms (throttle reach-out pushes)

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

    // ── PHOTO reactions (emoji reacts beyond a like) ──
    socket.on('photo:react', ({ photoId, emoji }) => {
      if (!photoId || !emoji) return;
      const e = String(emoji).slice(0, 8);
      const existing = db
        .prepare('SELECT emoji FROM photo_reactions WHERE photo_id=? AND user_id=?')
        .get(photoId, userId);
      const removing = existing && existing.emoji === e;
      if (removing) {
        db.prepare('DELETE FROM photo_reactions WHERE photo_id=? AND user_id=?').run(photoId, userId);
      } else {
        db.prepare(
          `INSERT INTO photo_reactions (photo_id,user_id,emoji) VALUES (?,?,?)
           ON CONFLICT(photo_id,user_id) DO UPDATE SET emoji=excluded.emoji, created_at=datetime('now')`,
        ).run(photoId, userId, e);
      }
      const reactions = db
        .prepare("SELECT group_concat(user_id || ':' || emoji) r FROM photo_reactions WHERE photo_id=?")
        .get(photoId).r;
      io.emit('photo:reacted', { photoId: Number(photoId), reactions });
      if (!removing) {
        const photo = db.prepare('SELECT posted_by FROM photos WHERE id=?').get(photoId);
        if (photo && photo.posted_by && photo.posted_by !== userId) {
          const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
          notifyUser(photo.posted_by, {
            title: `${e} ${u.display_name} reacted to your photo`,
            body: 'tap to see',
            url: '/photos',
          });
        }
      }
      markActive(io, userId);
    });

    // ── NOTE replies (threaded) ──
    socket.on('note:reply', ({ noteId, body }) => {
      if (!noteId || !body || !String(body).trim()) return;
      const r = db
        .prepare('INSERT INTO note_replies (note_id,from_user,body) VALUES (?,?,?)')
        .run(noteId, userId, String(body).slice(0, 1000));
      const reply = db
        .prepare(
          `SELECT r.*, u.display_name from_name, u.color from_color
           FROM note_replies r JOIN users u ON u.id=r.from_user WHERE r.id=?`,
        )
        .get(r.lastInsertRowid);
      io.emit('note:reply_new', { noteId: Number(noteId), reply });
      const note = db.prepare('SELECT from_user FROM notes WHERE id=?').get(noteId);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      const target = note && note.from_user && note.from_user !== userId ? note.from_user : partnerOf(userId);
      notifyUser(target, {
        title: `💬 ${u.display_name} replied to a note`,
        body: String(body).slice(0, 80),
        url: '/notes',
      });
      logActivity(io, userId, 'note', `${u.display_name} replied to a note 💬`, 'heart');
      markActive(io, userId);
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

    // ── TIMEZONE (for "their time") ──
    socket.on('tz:set', ({ tz }) => {
      if (!tz || typeof tz !== 'string') return;
      db.prepare('UPDATE users SET tz=? WHERE id=?').run(tz.slice(0, 60), userId);
      io.emit('tz:update', { userId, tz });
    });

    // ── GOODNIGHT KISS ──
    socket.on('kiss:send', () => {
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      io.emit('kiss:incoming', { from: userId });
      notifyUser(partnerOf(userId), { title: `😘 ${u.display_name} sent you a kiss`, body: 'mwah 💋', url: '/' });
      markActive(io, userId);
    });

    // ── HOLD HANDS LIVE (ephemeral presence relay) ──
    socket.on('hands:press', ({ pressing }) => {
      socket.broadcast.emit('hands:press', { userId, pressing: !!pressing });
      // When someone starts reaching out and their partner isn't already holding,
      // push a (throttled) "reaching for your hand" notification.
      if (pressing) {
        const pid = partnerOf(userId);
        const now = Date.now();
        if (!handsPressing[pid] && now - (lastHandsNotify[userId] || 0) > 90000) {
          lastHandsNotify[userId] = now;
          const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
          notifyUser(pid, {
            title: `🤚 ${u.display_name} is reaching for your hand`,
            body: 'open Us and hold hands across the miles 💞',
            url: '/holdhands',
          });
        }
      }
      handsPressing[userId] = !!pressing;
    });

    // ── GARDEN (collection of plants) ──
    socket.on('garden:plant', ({ species, name }) => {
      if (!GARDEN_SPECIES.includes(species)) return;
      db.prepare('INSERT INTO garden (species,name,planted_by) VALUES (?,?,?)').run(
        species,
        String(name || species).slice(0, 24),
        userId,
      );
      io.emit('garden:update', gardenList());
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      logActivity(io, userId, 'garden', `${u.display_name} planted a ${species} 🌱`, 'sprout');
      awardStars(io, 2);
      markActive(io, userId);
    });
    socket.on('garden:care', ({ plantId, action }) => {
      if (action === 'water')
        db.prepare("UPDATE garden SET watered_at=datetime('now'), growth=MIN(100,growth+12) WHERE id=?").run(plantId);
      else if (action === 'sun')
        db.prepare("UPDATE garden SET fertilized_at=datetime('now'), growth=MIN(100,growth+9) WHERE id=?").run(plantId);
      else return;
      recomputeGardenPlant(plantId);
      io.emit('garden:update', gardenList());
      awardStars(io, 2);
      markActive(io, userId);
    });
    socket.on('garden:rename', ({ plantId, name }) => {
      db.prepare('UPDATE garden SET name=? WHERE id=?').run(String(name).slice(0, 24), plantId);
      io.emit('garden:update', gardenList());
    });
    socket.on('garden:remove', ({ plantId }) => {
      db.prepare('DELETE FROM garden WHERE id=?').run(plantId);
      io.emit('garden:update', gardenList());
    });

    // ── CAMPFIRE ──
    socket.on('campfire:care', ({ action }) => {
      const next = INTER.applyCampfire(action);
      if (!next) return;
      io.emit('campfire:update', next);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      const verb = action === 'addlog' ? 'added a log to' : 'stoked';
      logActivity(io, userId, 'campfire', `${u.display_name} ${verb} the fire 🔥`, 'fire');
      awardStars(io, 2);
      markActive(io, userId);
    });

    // ── FISH TANK ──
    socket.on('aquarium:care', ({ action }) => {
      const res = INTER.applyAquarium(action);
      if (!res) return;
      io.emit('aquarium:update', res.state);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      const verb = action === 'clean' ? 'cleaned the tank' : 'fed the fish';
      logActivity(io, userId, 'aquarium', `${u.display_name} ${verb} 🐠`, 'fish');
      if (res.gained) logActivity(io, userId, 'aquarium', 'a new fish hatched! 🐟', 'fish');
      awardStars(io, 2);
      markActive(io, userId);
    });

    // ── ARCADE: real-time turn-based matches ──
    socket.on('match:new', ({ game }) => {
      if (!ARCADE.CATALOG.some((g) => g.id === game)) return;
      const state = ARCADE.newState(game);
      if (game === 'pictionary') state.drawer = userId;
      const firstTurn = game === 'pictionary' ? partnerOf(userId) : userId;
      const r = db
        .prepare(`INSERT INTO matches (game,state,turn,status,created_by) VALUES (?,?,?,?,?)`)
        .run(game, JSON.stringify(state), firstTurn, 'active', userId);
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
      // result.turnAgain lets a game keep the same player's turn (e.g. Memory match
      // pairs, Dots & boxes completed boxes). Defaults to alternating.
      const turn = result.done ? null : result.turnAgain ? userId : next;
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
      } else if (turn && turn !== userId) {
        notifyUser(turn, {
          title: `🎮 Your move in ${ARCADE.title(m.game)}`,
          body: `${u.display_name} just played — play them back!`,
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
      if (old.game === 'pictionary') state.drawer = userId;
      const firstTurn = old.game === 'pictionary' ? partnerOf(userId) : userId;
      const r = db
        .prepare(`INSERT INTO matches (game,state,turn,status,created_by) VALUES (?,?,?,?,?)`)
        .run(old.game, JSON.stringify(state), firstTurn, 'active', userId);
      const m = matchRow(r.lastInsertRowid);
      io.emit('match:update', m);
      const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
      notifyUser(partnerOf(userId), {
        title: `🎮 Rematch! ${ARCADE.title(old.game)}`,
        body: `${u.display_name} wants to play again`,
        url: `/match/${m.id}`,
      });
    });

    // ── PICTIONARY (draw & guess) ──
    socket.on('pictionary:stroke', ({ matchId, stroke }) => {
      const m = matchRow(matchId);
      if (!m || m.game !== 'pictionary' || m.status !== 'active') return;
      if (m.state.drawer !== userId || m.state.solved) return;
      const strokes = [...(m.state.strokes || []), stroke].slice(-500);
      db.prepare("UPDATE matches SET state=?, updated_at=datetime('now') WHERE id=?").run(
        JSON.stringify({ ...m.state, strokes }),
        matchId,
      );
      socket.broadcast.emit('pictionary:stroke', { matchId: Number(matchId), stroke });
    });
    socket.on('pictionary:clear', ({ matchId }) => {
      const m = matchRow(matchId);
      if (!m || m.game !== 'pictionary' || m.state.drawer !== userId) return;
      db.prepare("UPDATE matches SET state=? WHERE id=?").run(JSON.stringify({ ...m.state, strokes: [] }), matchId);
      socket.broadcast.emit('pictionary:clear', { matchId: Number(matchId) });
    });
    socket.on('pictionary:guess', ({ matchId, text }) => {
      const m = matchRow(matchId);
      if (!m || m.game !== 'pictionary' || m.status !== 'active' || m.state.solved) return;
      if (m.state.drawer === userId) return; // the drawer can't guess
      const correct = ARCADE.normGuess(text) === ARCADE.normGuess(m.state.word);
      const guess = { by: userId, text: String(text).slice(0, 40), correct };
      const guesses = [...(m.state.guesses || []), guess].slice(-40);
      const solved = correct;
      db.prepare(
        "UPDATE matches SET state=?, status=?, winner=?, turn=?, updated_at=datetime('now') WHERE id=?",
      ).run(
        JSON.stringify({ ...m.state, guesses, solved }),
        correct ? 'done' : 'active',
        correct ? userId : null,
        correct ? null : m.turn,
        matchId,
      );
      io.emit('pictionary:guess', { matchId: Number(matchId), guess });
      io.emit('match:update', matchRow(matchId));
      if (correct) {
        awardStars(io, 5);
        const u = db.prepare('SELECT display_name FROM users WHERE id=?').get(userId);
        logActivity(io, userId, 'game', `${u.display_name} guessed it in Pictionary 🎨`, 'gamepad');
        notifyUser(m.state.drawer, {
          title: '🎨 They guessed it!',
          body: `${u.display_name} guessed "${m.state.word}"`,
          url: `/match/${matchId}`,
        });
      }
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

const GARDEN_SPECIES = ['monstera', 'cactus', 'sunflower', 'bonsai', 'succulent', 'bamboo', 'rose', 'tulip'];
function gardenList() {
  return db.prepare('SELECT * FROM garden ORDER BY planted_at').all();
}
function recomputeGardenPlant(id) {
  const p = db.prepare('SELECT * FROM garden WHERE id=?').get(id);
  if (!p) return;
  let { growth, stage } = p;
  while (growth >= 100 && stage < 4) {
    growth -= 100;
    stage++;
  }
  if (stage >= 4) growth = 100;
  db.prepare('UPDATE garden SET growth=?, stage=? WHERE id=?').run(growth, stage, id);
}

module.exports = { register, logActivity, recomputePetMood, recomputePlantGrowth, online };
