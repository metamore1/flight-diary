import { useState } from 'react'
import { todayISO } from '../lib/stats'

export default function AddForm({ onAdd }) {
  const [date, setDate] = useState(todayISO())
  const [minutes, setMinutes] = useState('')
  const [type, setType] = useState('day')
  const [note, setNote] = useState('')

  function submit(e) {
    e.preventDefault()
    const min = Number(minutes)
    if (!date || !Number.isFinite(min) || min <= 0) return
    onAdd({ date, minutes: Math.round(min), type, note: note.trim() || undefined })
    setMinutes('')
    setNote('')
  }

  return (
    <form className="add-form" onSubmit={submit}>
      <div className="section-title">Новий політ</div>
      <div className="add-row">
        <label>
          <span>Дата</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </label>
        <label>
          <span>Хвилин</span>
          <input
            type="number" min="1" step="1" placeholder="145"
            value={minutes} onChange={e => setMinutes(e.target.value)} required
          />
        </label>
        <label>
          <span>Тип</span>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="day">денний</option>
            <option value="night">нічний</option>
          </select>
        </label>
        <label className="grow">
          <span>Примітка</span>
          <input
            type="text" placeholder="необовʼязково"
            value={note} onChange={e => setNote(e.target.value)}
          />
        </label>
        <button type="submit" className="btn primary">+ Додати</button>
      </div>
    </form>
  )
}
