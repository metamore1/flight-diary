import seed from '../seed/flights.json'

const STORAGE_KEY = 'furia-flights'

// Дані живуть у data/flights.json на сервері (через API).
// Якщо API недоступне (статичний хостинг) — localStorage браузера + експорт JSON.
export async function loadDoc() {
  try {
    const res = await fetch('/api/flights')
    const ct = res.headers.get('content-type') || ''
    if (res.ok && ct.includes('json')) {
      return { doc: await res.json(), mode: 'server' }
    }
  } catch { /* API недоступне — переходимо в локальний режим */ }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try { return { doc: JSON.parse(stored), mode: 'local' } } catch { /* зіпсований запис — беремо seed */ }
  }
  return { doc: seed, mode: 'local' }
}

export async function saveDoc(doc) {
  try {
    const res = await fetch('/api/flights', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    })
    if (res.ok) return 'server'
  } catch { /* API недоступне — зберігаємо локально */ }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
  return 'local'
}

export function validateDoc(doc) {
  if (!doc || typeof doc !== 'object') return false
  if (typeof doc.baselineMinutes !== 'number') return false
  if (!Array.isArray(doc.flights)) return false
  return doc.flights.every(f =>
    typeof f.id === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(f.date || '') &&
    Number.isFinite(f.minutes) && f.minutes > 0 &&
    (f.type === 'day' || f.type === 'night')
  )
}
