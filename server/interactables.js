// server/interactables.js — time-decayed singleton care toys (campfire, aquarium).
const { db } = require('./database');

function hoursSince(ts) {
  return ts ? (Date.now() - Date.parse(ts.replace(' ', 'T') + 'Z')) / 3600000 : 9999;
}

// ── Campfire: fuel decays ~3/hour from the last stoke ──
function campfireState() {
  const f = db.prepare('SELECT * FROM campfire WHERE id=1').get();
  const base = f.stoked_at || f.lit_since;
  const fuel = Math.max(0, Math.round((f.fuel || 0) - hoursSince(base) * 3));
  return { ...f, fuel };
}
function applyCampfire(action) {
  const cur = campfireState();
  let { fuel, logs } = cur;
  if (action === 'stoke') fuel = Math.min(100, fuel + 10);
  else if (action === 'addlog') {
    if (logs <= 0) return null;
    fuel = Math.min(100, fuel + 30);
    logs -= 1;
  } else return null;
  db.prepare("UPDATE campfire SET fuel=?, logs=?, stoked_at=datetime('now') WHERE id=1").run(fuel, logs);
  return campfireState();
}

// ── Aquarium: cleanliness decays ~2.5/hour from the last clean; fish breed when cared for ──
function aquariumState() {
  const a = db.prepare('SELECT * FROM aquarium WHERE id=1').get();
  const cleanliness = Math.max(0, Math.round((a.cleanliness || 0) - hoursSince(a.cleaned_at || a.started_at) * 2.5));
  return { ...a, cleanliness };
}
function applyAquarium(action) {
  const cur = aquariumState();
  if (action === 'clean') {
    db.prepare("UPDATE aquarium SET cleanliness=100, cleaned_at=datetime('now') WHERE id=1").run();
    return { state: aquariumState(), gained: false };
  }
  if (action === 'feed') {
    let fish = cur.fish;
    let gained = false;
    if (cur.cleanliness > 40 && fish < 6 && Math.random() < 0.25) {
      fish += 1;
      gained = true;
    }
    db.prepare("UPDATE aquarium SET fed_at=datetime('now'), fish=? WHERE id=1").run(fish);
    return { state: aquariumState(), gained };
  }
  return null;
}

module.exports = { campfireState, applyCampfire, aquariumState, applyAquarium };
