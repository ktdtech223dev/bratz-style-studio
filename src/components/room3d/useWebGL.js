// Module-memoized WebGL capability probe. Creates a throwaway canvas once and
// caches the result so repeated renders never re-probe.
let _cached = null;

export function hasWebGL() {
  if (_cached !== null) return _cached;
  try {
    if (typeof document === 'undefined') {
      _cached = false;
      return _cached;
    }
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    _cached = !!gl;
  } catch {
    _cached = false;
  }
  return _cached;
}

export default hasWebGL;
