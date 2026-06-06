import { api } from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function pushPermission() {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

export async function enablePush(userId, key) {
  if (!pushSupported()) throw new Error('Notifications aren’t supported on this device');
  if (!key) throw new Error('Server push key unavailable');
  const reg = await navigator.serviceWorker.ready;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permission denied');
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  }
  await api.post('/api/push/subscribe', { userId, subscription: sub });
  return true;
}

export async function disablePush() {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await api.post('/api/push/unsubscribe', { endpoint: sub.endpoint });
    await sub.unsubscribe();
  }
}
