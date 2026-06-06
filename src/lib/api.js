// Thin fetch wrapper for the REST API.
async function j(method, url, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  if (!r.ok) {
    let err;
    try {
      err = await r.json();
    } catch {
      err = { error: r.statusText };
    }
    throw new Error(err.error || 'Request failed');
  }
  return r.json();
}

export const api = {
  get: (url) => j('GET', url),
  post: (url, body) => j('POST', url, body),
  del: (url) => j('DELETE', url),

  login: (username, pin) => j('POST', '/api/login', { username, pin }),
  state: () => j('GET', '/api/state'),

  uploadPhoto: async (file, caption, userId) => {
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('caption', caption || '');
    fd.append('userId', userId);
    const r = await fetch('/api/photos', { method: 'POST', body: fd });
    if (!r.ok) throw new Error('Upload failed');
    return r.json();
  },
};
