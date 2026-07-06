import { useEffect, useMemo, useRef, useState } from 'react'
import { loadDoc, saveDoc, validateDoc, getToken, setToken as storeToken } from './lib/api'
import { computeStats, fmtHM, fmtDate, fmtDateShort } from './lib/stats'
import Cards from './components/Cards'
import Bars from './components/Bars'
import LogTable from './components/LogTable'
import AddForm from './components/AddForm'

let idCounter = 0
function newId() {
  return `f-${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`
}

export default function App() {
  const [doc, setDoc] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState(getToken())
  const [tokenDraft, setTokenDraft] = useState('')
  const [tokenRejected, setTokenRejected] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    loadDoc()
      .then(({ doc, tokenRejected }) => {
        setDoc(doc)
        if (tokenRejected) {
          setTokenRejected(true)
          setError('Збережений токен недійсний або протермінований — дані завантажено лише для читання. Прибери токен і додай новий, щоб зберігати зміни.')
        }
      })
      .catch(e => setLoadError(e.message || 'Не вдалося завантажити журнал.'))
  }, [])

  const stats = useMemo(() => (doc ? computeStats(doc) : null), [doc])

  // Зберігаємо у репозиторій. Якщо не вдалося — показуємо помилку й НЕ змінюємо дані локально.
  async function persist(next) {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await saveDoc(next)
      setDoc(next)
    } catch (e) {
      setError(e.message || 'Не вдалося зберегти зміни.')
    } finally {
      setSaving(false)
    }
  }

  function applyToken() {
    const t = tokenDraft.trim()
    storeToken(t)
    setToken(t)
    setTokenDraft('')
    setTokenRejected(false)
    setError('')
  }

  function clearToken() {
    storeToken('')
    setToken('')
    setTokenRejected(false)
    setError('')
  }

  function addFlight(f) {
    persist({ ...doc, flights: [...doc.flights, { id: newId(), ...f }] })
  }

  function deleteFlight(f) {
    if (!confirm(`Видалити політ ${fmtDate(f.date)} · ${f.minutes} хв?`)) return
    persist({ ...doc, flights: doc.flights.filter(x => x.id !== f.id) })
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'furia-flights.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function importJson(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    file.text()
      .then(text => {
        const parsed = JSON.parse(text)
        if (!validateDoc(parsed)) throw new Error('invalid')
        if (!confirm(`Замінити журнал даними з файлу (${parsed.flights.length} польотів)?`)) return
        persist(parsed)
      })
      .catch(() => alert('Некоректний JSON-файл журналу'))
  }

  if (loadError) {
    return <div className="wrap loading">{loadError}</div>
  }
  if (!doc || !stats) {
    return <div className="wrap loading">Завантаження журналу…</div>
  }

  return (
    <div className="wrap">
      <header>
        <h1>Журнал нальоту · <span>{doc.name || 'Фурія'}</span></h1>
        <div className="sub">
          {doc.aircraft || 'БпАК А1-СМ'}
          {stats.lastDate ? ` · оновлено ${fmtDate(stats.lastDate)}` : ''}
        </div>
      </header>

      <div className="toolbar">
        <span className={`mode-badge ${token && !tokenRejected ? 'server' : 'local'}`}>
          {token && !tokenRejected
            ? (saving ? '● збереження у GitHub…' : '● запис у репозиторій')
            : '● тільки читання'}
        </span>
        <span className="spacer" />
        <button className="btn" onClick={exportJson}>⤓ Експорт JSON</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>⤒ Імпорт JSON</button>
        <input
          ref={fileRef} type="file" accept="application/json,.json"
          style={{ display: 'none' }} onChange={importJson}
        />
      </div>

      <div className="token-row">
        {token ? (
          <>
            <span className="token-status">🔑 токен збережено (лише в цьому браузері)</span>
            <span className="spacer" />
            <button className="btn" onClick={clearToken}>Прибрати токен</button>
          </>
        ) : (
          <>
            <input
              type="password" autoComplete="off"
              placeholder="GitHub-токен (Contents: write) — зберігається лише у вашому браузері"
              value={tokenDraft}
              onChange={e => setTokenDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyToken() }}
            />
            <button className="btn primary" onClick={applyToken}>Увімкнути запис</button>
          </>
        )}
      </div>

      {!token && (
        <div className="notice">
          Режим тільки для читання. Щоб зберігати зміни в репозиторій, додайте персональний
          GitHub-токен із правом Contents: write — він не потрапляє в код і зберігається лише тут.
        </div>
      )}

      {error && <div className="notice error">{error}</div>}

      <Cards stats={stats} />
      <AddForm onAdd={addFlight} />
      <Bars stats={stats} />
      <LogTable doc={doc} stats={stats} onDelete={deleteFlight} />

      <footer>
        {stats.weeks.map((w, i) => (
          <span key={w.start}>
            {i > 0 && <span> &nbsp;|&nbsp; </span>}
            Тиждень {fmtDateShort(w.start)}–{fmtDateShort(w.end)}: {w.minutes} хв · {fmtHM(w.minutes)} · {w.count} пол.
          </span>
        ))}
      </footer>
    </div>
  )
}
