import { useEffect, useMemo, useRef, useState } from 'react'
import { loadDoc, saveDoc, validateDoc } from './lib/api'
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
  const [mode, setMode] = useState('loading')
  const fileRef = useRef(null)

  useEffect(() => {
    loadDoc().then(({ doc, mode }) => {
      setDoc(doc)
      setMode(mode)
    })
  }, [])

  const stats = useMemo(() => (doc ? computeStats(doc) : null), [doc])

  async function persist(next) {
    setDoc(next)
    setMode(await saveDoc(next))
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
        <span className={`mode-badge ${mode}`}>
          {mode === 'server' ? '● дані: data/flights.json (сервер)' : '● локальний режим (браузер)'}
        </span>
        <span className="spacer" />
        <button className="btn" onClick={exportJson}>⤓ Експорт JSON</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>⤒ Імпорт JSON</button>
        <input
          ref={fileRef} type="file" accept="application/json,.json"
          style={{ display: 'none' }} onChange={importJson}
        />
      </div>

      {mode === 'local' && (
        <div className="notice">
          Сервер даних недоступний — зміни зберігаються лише в цьому браузері (localStorage).
          Робіть «Експорт JSON» для резервної копії.
        </div>
      )}

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
