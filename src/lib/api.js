import seed from '../seed/flights.json'

// Дані зберігаються прямо в репозиторії (data/flights.json) через GitHub Contents API.
// Читання — публічне (репо відкритий). Запис — лише з персональним токеном,
// який користувач вводить у застосунку; токен живе тільки в цьому браузері.
const REPO = 'metamore1/flight-diary'
const BRANCH = 'main'
const FILE_PATH = 'data/flights.json'
const TOKEN_KEY = 'furia-gh-token'
const API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`

// sha поточної версії файлу — потрібен GitHub API, щоб оновити (а не перезаписати наосліп).
let currentSha = null

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  const t = (token || '').trim()
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

function authHeaders() {
  const headers = { Accept: 'application/vnd.github+json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

// GitHub повертає/очікує вміст у base64; коректно кодуємо UTF-8 (кирилиця тощо).
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}
function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ''))
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export async function loadDoc() {
  const url = `${API_URL}?ref=${BRANCH}`
  let res = await fetch(url, { headers: authHeaders(), cache: 'no-store' })

  // Недійсний/протермінований токен ламає навіть читання публічного репо (401/403).
  // Пробуємо ще раз без токена, щоб застосунок усе одно завантажився (тільки читання).
  let tokenRejected = false
  if ((res.status === 401 || res.status === 403) && getToken()) {
    tokenRejected = true
    res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' })
  }

  if (res.ok) {
    const data = await res.json()
    currentSha = data.sha
    return { doc: JSON.parse(base64ToUtf8(data.content)), source: 'github', tokenRejected }
  }

  // Файлу ще немає — стартуємо з seed; перший запис створить файл у репо.
  if (res.status === 404) {
    currentSha = null
    return { doc: seed, source: 'seed', tokenRejected }
  }

  throw new Error(`Не вдалося завантажити дані з GitHub (HTTP ${res.status}).`)
}

export async function saveDoc(doc) {
  if (!getToken()) {
    throw new Error('Немає GitHub-токена — редагування вимкнене. Додайте токен, щоб зберігати зміни.')
  }

  const body = {
    message: `data: журнал нальоту (${doc.flights.length} польотів)`,
    content: utf8ToBase64(JSON.stringify(doc, null, 2)),
    branch: BRANCH,
  }
  if (currentSha) body.sha = currentSha

  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (res.ok) {
    const data = await res.json()
    currentSha = data.content?.sha ?? currentSha
    return
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error('Токен GitHub недійсний або без права запису (потрібен доступ Contents: write).')
  }
  if (res.status === 409 || res.status === 422) {
    throw new Error('Дані в репозиторії змінилися. Перезавантажте сторінку й повторіть.')
  }

  let detail = `HTTP ${res.status}`
  try {
    const err = await res.json()
    if (err?.message) detail = err.message
  } catch { /* тіло не JSON — лишаємо код статусу */ }
  throw new Error(`Не вдалося зберегти у GitHub: ${detail}`)
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
