import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wind, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import { useStore } from '../store/useStore';
import { getWeather, wmoToInfo } from '../lib/weather';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "Today" / "Tomorrow" / weekday label for a YYYY-MM-DD daily entry.
function dayLabel(dateStr, idx) {
  if (idx === 0) return 'Today';
  if (idx === 1) return 'Tmrw';
  try {
    const d = new Date(`${dateStr}T12:00:00`);
    return WEEKDAY[d.getDay()] || '';
  } catch {
    return '';
  }
}

// Local time string for an IANA timezone, or null if unavailable.
function localTime(tz) {
  if (!tz) return null;
  try {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: tz });
  } catch {
    return null;
  }
}

function Shimmer() {
  return (
    <Card className="overflow-hidden p-5">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded-full bg-white/10" />
          <div className="h-9 w-9 rounded-2xl bg-white/10" />
        </div>
        <div className="flex items-end gap-4">
          <div className="h-12 w-24 rounded-2xl bg-white/10" />
          <div className="h-4 w-20 rounded-full bg-white/10" />
        </div>
        <div className="flex gap-2">
          <div className="h-14 flex-1 rounded-2xl bg-white/10" />
          <div className="h-14 flex-1 rounded-2xl bg-white/10" />
          <div className="h-14 flex-1 rounded-2xl bg-white/10" />
        </div>
      </div>
    </Card>
  );
}

function MiniDay({ d, idx }) {
  const info = wmoToInfo(d.code, true);
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-[var(--border)] bg-black/10 py-2.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--text2)]">
        {dayLabel(d.date, idx)}
      </span>
      <span className="text-xl leading-none" title={info.label}>
        {info.emoji}
      </span>
      <span className="text-[12px] font-extrabold text-[var(--text)]">
        {d.max != null ? `${d.max}°` : '—'}
      </span>
      <span className="text-[11px] font-semibold text-[var(--muted)]">
        {d.min != null ? `${d.min}°` : '—'}
      </span>
    </div>
  );
}

function WeatherCard({ place, data, delay, partnerTz }) {
  if (data === undefined) return <Shimmer />;

  if (data === null) {
    return (
      <Card delay={delay} className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[var(--text)]">{place.name}</h3>
          <span className="text-2xl opacity-60">🛰️</span>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">couldn’t reach the skies right now — try again later</p>
      </Card>
    );
  }

  const info = wmoToInfo(data.code, data.isDay);
  // Show the partner's clock if their timezone matches this place's timezone.
  const clock = partnerTz && data.timezone === partnerTz ? localTime(partnerTz) : null;

  return (
    <Card delay={delay} className="overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <MapPin size={15} className="shrink-0 text-[var(--pink-hot)]" />
            <h3 className="truncate text-lg font-extrabold text-[var(--text)]">{place.name}</h3>
          </div>
          <p className="mt-0.5 text-sm font-semibold text-[var(--text2)]">{info.label}</p>
          {clock && (
            <p className="mt-0.5 text-[12px] text-[var(--muted)]">their local time · {clock}</p>
          )}
        </div>
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.05, type: 'spring', stiffness: 220, damping: 16 }}
          className="text-5xl leading-none"
          aria-hidden
        >
          {info.emoji}
        </motion.span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-end gap-2">
          <span className="text-[3.25rem] font-black leading-none tracking-tight text-[var(--text)]">
            {data.tempF != null ? data.tempF : '—'}°
          </span>
          <span className="pb-1 text-sm font-bold text-[var(--text2)]">
            F<span className="mx-1 text-[var(--muted)]">·</span>
            {data.tempC != null ? `${data.tempC}°C` : ''}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {(data.daily?.[0]?.max != null || data.daily?.[0]?.min != null) && (
            <span className="rounded-full border border-[var(--border)] bg-black/15 px-2.5 py-1 text-[12px] font-bold text-[var(--text)] shadow-elev1">
              H {data.daily[0].max != null ? `${data.daily[0].max}°` : '—'}{' '}
              <span className="text-[var(--muted)]">·</span> L{' '}
              {data.daily[0].min != null ? `${data.daily[0].min}°` : '—'}
            </span>
          )}
          {data.wind != null && (
            <span className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-black/15 px-2.5 py-1 text-[12px] font-bold text-[var(--text)] shadow-elev1">
              <Wind size={13} className="text-[var(--cyan)]" /> {data.wind} km/h
            </span>
          )}
        </div>
      </div>

      {data.daily?.length > 0 && (
        <div className="mt-4 flex gap-2">
          {data.daily.slice(0, 3).map((d, i) => (
            <MiniDay key={d.date || i} d={d} idx={i} />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function Weather() {
  const places = useStore((s) => s.places);
  const refreshPlaces = useStore((s) => s.refreshPlaces);
  const partner = useStore((s) => s.partner);

  // place.id -> undefined (loading) | null (failed) | normalized weather object
  const [weather, setWeather] = useState({});

  useEffect(() => {
    if (places.length === 0) refreshPlaces?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    places.forEach((p) => {
      if (p.lat == null || p.lng == null) return;
      // mark as loading if we don't have a result yet
      setWeather((w) => (p.id in w ? w : { ...w, [p.id]: undefined }));
      getWeather(p.lat, p.lng).then((data) => {
        if (!cancelled) setWeather((w) => ({ ...w, [p.id]: data }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [places]);

  return (
    <div>
      <PageHeader icon="🌦️" title="Weather" sub="the skies over our places" />

      <div className="space-y-3 px-5 pb-8">
        {places.length === 0 ? (
          <Card className="p-7 text-center">
            <div className="mb-2 text-4xl">🗺️</div>
            <h3 className="text-lg font-extrabold text-[var(--text)]">No places yet</h3>
            <p className="mx-auto mt-1 max-w-[16rem] text-sm text-[var(--muted)]">
              Pin the spots that matter to you both and we’ll show the weather over each one.
            </p>
            <Link to="/map" className="mt-4 block">
              <Button variant="primary" icon={<MapPin size={18} />}>
                Add a place
              </Button>
            </Link>
          </Card>
        ) : (
          places.map((p, i) => (
            <WeatherCard
              key={p.id}
              place={p}
              data={weather[p.id]}
              delay={Math.min(i * 0.05, 0.3)}
              partnerTz={partner?.tz}
            />
          ))
        )}
      </div>
    </div>
  );
}
