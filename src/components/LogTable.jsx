import { fmtDate } from '../lib/stats'

export default function LogTable({ doc, stats, onDelete }) {
  return (
    <>
      <div className="section-title" style={{ marginTop: 28 }}>Записи журналу</div>
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Примітка</th>
            <th style={{ textAlign: 'right' }}>Хвилин</th>
            <th aria-label="дії" />
          </tr>
        </thead>
        <tbody>
          <tr className="baseline">
            <td>BASELINE</td>
            <td className="note">{doc.baselineNote || 'попередній сумарний наліт'}</td>
            <td className="min">{doc.baselineMinutes}</td>
            <td />
          </tr>
          {stats.flights.map(f => {
            const isRecord = f.id === stats.recordId
            return (
              <tr key={f.id}>
                <td>{fmtDate(f.date)}</td>
                <td className="note">
                  {isRecord
                    ? <span className="tag rec">★ рекорд</span>
                    : f.type === 'night'
                      ? <span className="tag">нічний</span>
                      : <span className="tag day">денний</span>}
                  {f.note ? <span className="note-text"> {f.note}</span> : null}
                </td>
                <td className="min">{f.minutes}</td>
                <td className="actions">
                  <button
                    className="del"
                    title="Видалити запис"
                    onClick={() => onDelete(f)}
                  >×</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
