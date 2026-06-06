// server/push.js — Web Push (VAPID) helper.
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const { db, DATA_DIR } = require('./database');

// Load or generate a stable VAPID keypair (persisted on the data volume).
function loadKeys() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  const file = path.join(DATA_DIR, 'vapid.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    const keys = webpush.generateVAPIDKeys();
    try {
      fs.writeFileSync(file, JSON.stringify(keys));
    } catch (e) {}
    return keys;
  }
}

const KEYS = loadKeys();
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:us@example.com';
webpush.setVapidDetails(SUBJECT, KEYS.publicKey, KEYS.privateKey);

function publicKey() {
  return KEYS.publicKey;
}

function saveSub(userId, sub) {
  if (!sub || !sub.endpoint) return;
  db.prepare(
    `INSERT INTO push_subs (user_id, endpoint, sub) VALUES (?,?,?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, sub=excluded.sub`,
  ).run(userId, sub.endpoint, JSON.stringify(sub));
}

function removeSub(endpoint) {
  db.prepare('DELETE FROM push_subs WHERE endpoint=?').run(endpoint);
}

// Send a notification to every device of a user. Prunes dead subscriptions.
async function notifyUser(userId, payload) {
  const rows = db.prepare('SELECT * FROM push_subs WHERE user_id=?').all(userId);
  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(JSON.parse(row.sub), JSON.stringify(payload));
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) removeSub(row.endpoint);
      }
    }),
  );
}

module.exports = { publicKey, saveSub, removeSub, notifyUser };
