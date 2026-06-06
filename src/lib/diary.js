export const CATEGORY_META = {
  about_partner: { label: 'APPRECIATION', color: '#f5a3c7' },
  about_self: { label: 'REFLECTION', color: '#7dd3fc' },
  about_us: { label: 'CONNECTION', color: '#c084fc' },
};

export function catMeta(category) {
  return CATEGORY_META[category] || { label: 'PROMPT', color: '#b8a9e8' };
}
