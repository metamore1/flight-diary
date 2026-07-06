import { fmtDate, fmtDateShort } from '../lib/stats'

export default function Bars({ stats }) {
  if (!stats.groups.length) return null
  return (
    <>
      <div className="section-title">Динаміка польотів</div>
      {stats.groups.map(g => (
        <div key={g.date}>
          <div className="date-group">── {fmtDate(g.date)} ──────────────────────</div>
          {g.flights.map((f, i) => {
            const isRecord = f.id === stats.recordId
            const cls = isRecord ? 'bar-fill rec' : f.type === 'night' ? 'bar-fill night' : 'bar-fill'
            const width = stats.recordMin ? (f.minutes / stats.recordMin) * 100 : 0
            return (
              <div className="bar-row" key={f.id}>
                <div className="d">{fmtDateShort(f.date)} · #{i + 1}</div>
                <div className="bar-track">
                  <div className={cls} style={{ width: `${width.toFixed(1)}%` }} />
                </div>
                <div className="m">{f.minutes}{isRecord ? ' ★' : ''}</div>
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}
