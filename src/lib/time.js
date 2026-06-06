// Relative time + countdown helpers.
export function relTime(iso) {
  if (!iso) return '';
  const then = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z').getTime();
  const diff = Math.max(0, Date.now() - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo === 1 ? '' : 's'} ago`;
}

export function shortRel(iso) {
  if (!iso) return '';
  const then = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z').getTime();
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Days since a timestamp (for "adopted X days ago").
export function daysSince(iso) {
  if (!iso) return 0;
  const then = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z').getTime();
  return Math.max(0, Math.floor((Date.now() - then) / 86400000));
}

// Format a countdown given remaining ms -> HH:MM:SS
export function fmtCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function dateLabel(d) {
  const dt = new Date((d.length === 10 ? d + 'T00:00:00' : d));
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Next occurrence of a date string (MM-DD recurring, or YYYY-MM-DD one-off).
export function nextOccurrence(dateStr) {
  const now = new Date();
  let target;
  if (dateStr.length === 5) {
    const [m, d] = dateStr.split('-').map(Number);
    target = new Date(now.getFullYear(), m - 1, d);
    if (target < new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      target = new Date(now.getFullYear() + 1, m - 1, d);
  } else {
    target = new Date(dateStr + 'T00:00:00');
  }
  return target;
}

// Relative countdown pill text for a date string.
export function relPill(dateStr) {
  const target = nextOccurrence(dateStr);
  const today = new Date();
  const days = Math.round(
    (new Date(target.getFullYear(), target.getMonth(), target.getDate()) -
      new Date(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  );
  if (days < 0) return 'PASSED';
  if (days === 0) return 'TODAY';
  if (days === 1) return 'TOMORROW';
  if (days < 14) return `IN ${days} DAYS`;
  if (days < 60) return `IN ${Math.round(days / 7)} WEEKS`;
  return `IN ${Math.round(days / 30)} MONTHS`;
}
