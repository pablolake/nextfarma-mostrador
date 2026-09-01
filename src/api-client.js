const API_BASE_URL = () => (process.env.API_BASE_URL || '').replace(/\/$/, '');

async function request(path, { method = 'GET', body } = {}, _retries = 2) {
  const base = API_BASE_URL();
  if (!base) throw new Error('API_BASE_URL no configurada');
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.API_KEY) headers['X-API-Key'] = process.env.API_KEY;
  const timeout = parseInt(process.env.API_TIMEOUT_MS, 10) || 15000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(base + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    return res.json();
  } catch (err) {
    const isTransient = err.name === 'AbortError' || /HTTP 5\d\d/.test(err.message);
    if (_retries > 0 && isTransient) {
      await new Promise(r => setTimeout(r, 1000 * (3 - _retries)));
      return request(path, { method, body }, _retries - 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function status() { return request('/api/sync/status'); }

module.exports = { request, status };
