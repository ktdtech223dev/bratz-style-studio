import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, MapPin, Trash2, Camera, Check } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { dateLabel } from '../lib/time';

function heartIcon(color = '#ff6ba8') {
  return L.divIcon({
    className: 'us-pin',
    html: `<div style="transform:translate(-50%,-100%);filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))">
      <svg width="30" height="38" viewBox="0 0 30 38">
        <path d="M15 37C15 37 2 24 2 13.5C2 7 7 3 11 3C13.5 3 15 5 15 5C15 5 16.5 3 19 3C23 3 28 7 28 13.5C28 24 15 37 15 37Z"
          fill="${color}" stroke="#1a1f4a" stroke-width="2"/>
        <circle cx="15" cy="13" r="4.5" fill="#1a1f4a"/>
      </svg></div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
  });
}

export default function MapPage() {
  const nav = useNavigate();
  const places = useStore((s) => s.places);
  const refreshPlaces = useStore((s) => s.refreshPlaces);
  const me = useStore((s) => s.me);

  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const addingRef = useRef(false);

  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState(null); // { lat, lng }
  const [selected, setSelected] = useState(null); // place
  const [form, setForm] = useState({ name: '', note: '' });
  const [photo, setPhoto] = useState(null); // { file, url }
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    addingRef.current = adding;
  }, [adding]);

  useEffect(() => {
    refreshPlaces();
  }, [refreshPlaces]);

  // init map once
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return;
    const map = L.map(mapEl.current, { zoomControl: false }).setView([20, 0], 2);
    map.attributionControl.setPrefix(false);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '© OpenStreetMap, © CARTO',
    }).addTo(map);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    map.on('click', (e) => {
      if (addingRef.current) {
        setPending({ lat: e.latlng.lat, lng: e.latlng.lng });
        setAdding(false);
        setForm({ name: '', note: '' });
        setPhoto(null);
      }
    });
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // render markers when places change
  useEffect(() => {
    const layer = markersRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    places.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: heartIcon(p.added_color || '#ff6ba8') });
      m.on('click', () => setSelected(p));
      m.addTo(layer);
    });
    if (places.length && !mapRef.current._fittedOnce) {
      const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds.pad(0.4), { maxZoom: 6 });
      mapRef.current._fittedOnce = true;
    }
  }, [places]);

  function onPickPhoto(e) {
    const file = e.target.files?.[0];
    if (file) setPhoto({ file, url: URL.createObjectURL(file) });
  }

  async function savePlace() {
    if (!pending || !form.name.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('note', form.note.trim());
      fd.append('lat', pending.lat);
      fd.append('lng', pending.lng);
      fd.append('userId', me.id);
      if (photo) fd.append('photo', photo.file);
      const r = await fetch('/api/places', { method: 'POST', body: fd });
      const place = await r.json();
      setPending(null);
      setPhoto(null);
      setForm({ name: '', note: '' });
      if (mapRef.current && place?.lat) mapRef.current.flyTo([place.lat, place.lng], 8, { duration: 1 });
    } catch (e) {}
    setSaving(false);
  }

  async function deletePlace(p) {
    await api.del(`/api/places/${p.id}`);
    setSelected(null);
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[var(--bg-deep)]">
      <div ref={mapEl} className="absolute inset-0 z-0" />

      {/* header overlay */}
      <div className="safe-top pointer-events-none absolute inset-x-0 top-0 z-[500] p-4">
        <div className="pointer-events-auto flex items-center justify-between">
          <button
            onClick={() => nav('/')}
            className="glass flex h-10 items-center gap-1 rounded-full px-3 text-[var(--lav-text)] shadow-soft"
          >
            <ChevronLeft size={22} /> <span className="pr-1 font-bold">Our map</span>
          </button>
          <div className="glass rounded-full px-3 py-2 text-xs font-bold text-[var(--text2)] shadow-soft">
            {places.length} {places.length === 1 ? 'place' : 'places'} 💜
          </div>
        </div>
      </div>

      {/* adding hint */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="safe-top absolute inset-x-0 top-16 z-[500] flex justify-center px-4"
          >
            <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-soft">
              <MapPin size={16} className="text-[var(--pink-hot)]" /> tap the map where you want a pin
              <button onClick={() => setAdding(false)} className="ml-1 text-[var(--muted)]">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* add FAB */}
      <button
        onClick={() => setAdding((a) => !a)}
        className="absolute bottom-7 right-5 z-[500] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pink-hot)] text-white shadow-soft active:scale-95 safe-bottom"
        style={{ boxShadow: '0 6px 24px rgba(255,107,168,0.5)' }}
      >
        {adding ? <X size={26} /> : <Plus size={28} />}
      </button>

      {/* detail sheet */}
      <Sheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            {selected.filename && (
              <img
                src={`/photos/${selected.filename}`}
                alt={selected.name}
                className="mb-3 max-h-56 w-full rounded-2xl object-cover"
              />
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-extrabold">{selected.name}</h3>
                <p className="text-xs text-[var(--muted)]">
                  pinned by {selected.added_name || 'you'} · {dateLabel(selected.created_at)}
                </p>
              </div>
              <button onClick={() => deletePlace(selected)} className="text-[var(--muted)]">
                <Trash2 size={18} />
              </button>
            </div>
            {selected.note && <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--text)]">{selected.note}</p>}
            <button
              onClick={() => {
                mapRef.current?.flyTo([selected.lat, selected.lng], 9, { duration: 1 });
                setSelected(null);
              }}
              className="mt-4 w-full rounded-2xl bg-[var(--card)] py-3 font-bold text-[var(--lav-text)]"
            >
              center on map
            </button>
          </>
        )}
      </Sheet>

      {/* add sheet */}
      <Sheet open={!!pending} onClose={() => setPending(null)}>
        <h3 className="mb-1 text-lg font-extrabold">New place</h3>
        <p className="mb-4 text-xs text-[var(--muted)]">
          {pending && `${pending.lat.toFixed(3)}, ${pending.lng.toFixed(3)}`}
        </p>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="place name (e.g. our first date)"
          className="mb-3 w-full rounded-2xl bg-[var(--card)] p-4"
          autoFocus
        />
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          rows={2}
          placeholder="a memory from here… (optional)"
          className="mb-3 w-full resize-none rounded-2xl bg-[var(--card)] p-4"
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
        {photo ? (
          <div className="relative mb-3">
            <img src={photo.url} alt="" className="max-h-44 w-full rounded-2xl object-cover" />
            <button
              onClick={() => setPhoto(null)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] py-4 text-sm font-bold text-[var(--lav-text)]"
          >
            <Camera size={18} /> tag a photo
          </button>
        )}
        <button
          onClick={savePlace}
          disabled={saving || !form.name.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pink-hot)] py-3.5 font-extrabold text-white active:scale-95 disabled:opacity-50"
        >
          {saving ? 'saving…' : (<><Check size={18} /> Pin this place</>)}
        </button>
      </Sheet>
    </div>
  );
}

function Sheet({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000] flex items-end justify-center"
          style={{ background: 'rgba(10,12,30,0.7)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ y: 420 }}
            animate={{ y: 0 }}
            exit={{ y: 420 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[520px] rounded-t-3xl bg-[var(--bg2)] p-5 pb-8 safe-bottom"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
