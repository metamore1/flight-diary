import { fmtHM, fmtDateShort } from '../lib/stats'

export default function Cards({ stats }) {
  const avg = stats.avgMin
  return (
    <div className="grid">
      <div className={`card ${stats.milestone >= 50 ? 'milestone' : ''}`}>
        <div className="label">Загальний наліт</div>
        <div className="val">{fmtHM(stats.totalMin)}</div>
        <div className="unit">
          {stats.totalMin} хв{stats.milestone >= 50 ? ` · ★ за ${stats.milestone} год` : ''}
        </div>
      </div>
      <div className="card">
        <div className="label">Польотів (датованих)</div>
        <div className="val">{stats.count}</div>
        <div className="unit">без урахування baseline</div>
      </div>
      <div className="card">
        <div className="label">Середній політ</div>
        <div className="val">{fmtHM(Math.round(avg))}</div>
        <div className="unit">{avg.toFixed(1)} хв</div>
      </div>
      <div className="card">
        <div className="label">Нічних</div>
        <div className="val">{stats.nightCount}</div>
        <div className="unit">з {stats.count} польотів</div>
      </div>
      <div className="card hl">
        <div className="label">Рекорд тривалості</div>
        <div className="val">{stats.recordMin}</div>
        <div className="unit">хв · {fmtHM(stats.recordMin)}</div>
      </div>
      {stats.lastDate && (
        <div className="card">
          <div className="label">Останній день ({fmtDateShort(stats.lastDate)})</div>
          <div className="val">{fmtHM(stats.lastDayMin)}</div>
          <div className="unit">{stats.lastDayMin} хв · {stats.lastDayFlights.length} політ(и)</div>
        </div>
      )}
    </div>
  )
}
