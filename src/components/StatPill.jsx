export default function StatPill({ emoji, value, label, color }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 shadow-elev1"
      style={{ background: color ? `color-mix(in srgb, ${color} 14%, var(--card))` : 'rgba(0,0,0,0.2)' }}
    >
      <span className="text-base leading-none">{emoji}</span>
      <span className="text-sm font-extrabold" style={{ color: color || 'var(--text)' }}>
        {value}
      </span>
      {label && <span className="text-[11px] font-semibold text-[var(--text2)]">{label}</span>}
    </div>
  );
}
