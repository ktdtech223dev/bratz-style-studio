// Client-side weather helper using the free, no-key, CORS-enabled Open-Meteo API.
// Docs: https://open-meteo.com/en/docs

const cToF = (c) => Math.round((c * 9) / 5 + 32);

// Fetch + normalize current conditions and a 3-day forecast for a coordinate.
// Returns null on any failure so callers can render a graceful fallback.
export async function getWeather(lat, lng) {
  if (lat == null || lng == null) return null;
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code,is_day,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&forecast_days=3`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const cur = data.current || {};
    const d = data.daily || {};

    const daily = Array.isArray(d.time)
      ? d.time.map((date, i) => ({
          date,
          max: typeof d.temperature_2m_max?.[i] === 'number' ? Math.round(d.temperature_2m_max[i]) : null,
          min: typeof d.temperature_2m_min?.[i] === 'number' ? Math.round(d.temperature_2m_min[i]) : null,
          code: d.weather_code?.[i] ?? 0,
        }))
      : [];

    const tempC = typeof cur.temperature_2m === 'number' ? Math.round(cur.temperature_2m) : null;

    return {
      tempC,
      tempF: tempC == null ? null : cToF(cur.temperature_2m),
      code: cur.weather_code ?? 0,
      isDay: cur.is_day === 1 || cur.is_day === true,
      wind: typeof cur.wind_speed_10m === 'number' ? Math.round(cur.wind_speed_10m) : null,
      timezone: data.timezone || null,
      daily,
    };
  } catch {
    return null;
  }
}

// Map a WMO weather code to a friendly emoji + label.
// See: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
export function wmoToInfo(code, isDay = true) {
  const c = Number(code);
  if (c === 0) return { emoji: isDay ? '☀️' : '🌙', label: 'Clear sky' };
  if (c === 1) return { emoji: isDay ? '🌤️' : '🌙', label: 'Mostly clear' };
  if (c === 2) return { emoji: '⛅️', label: 'Partly cloudy' };
  if (c === 3) return { emoji: '☁️', label: 'Overcast' };
  if (c === 45 || c === 48) return { emoji: '🌫️', label: 'Foggy' };
  if (c >= 51 && c <= 57) return { emoji: '🌦️', label: 'Drizzle' };
  if (c >= 61 && c <= 67) return { emoji: '🌧️', label: 'Rain' };
  if (c >= 71 && c <= 77) return { emoji: '🌨️', label: 'Snow' };
  if (c >= 80 && c <= 82) return { emoji: '🌦️', label: 'Rain showers' };
  if (c === 85 || c === 86) return { emoji: '🌨️', label: 'Snow showers' };
  if (c >= 95 && c <= 99) return { emoji: '⛈️', label: 'Thunderstorm' };
  return { emoji: '🌡️', label: 'Unknown' };
}
