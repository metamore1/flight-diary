export function fmtHM(min) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

// "2026-05-19" -> "19.05.2026"
export function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

// "2026-05-19" -> "19.05"
export function fmtDateShort(iso) {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function computeStats(doc) {
  const flights = [...doc.flights].sort((a, b) => a.date.localeCompare(b.date))
  const flightSum = flights.reduce((s, f) => s + f.minutes, 0)
  const totalMin = doc.baselineMinutes + flightSum
  const count = flights.length
  const nightCount = flights.filter(f => f.type === 'night').length
  const recordMin = count ? Math.max(...flights.map(f => f.minutes)) : 0
  const recordId = flights.find(f => f.minutes === recordMin)?.id ?? null
  const lastDate = count ? flights[count - 1].date : null
  const lastDayFlights = lastDate ? flights.filter(f => f.date === lastDate) : []
  const lastDayMin = lastDayFlights.reduce((s, f) => s + f.minutes, 0)
  const milestone = Math.floor(totalMin / 60 / 50) * 50

  // групування за датою, з номером польоту в межах дня
  const groups = []
  for (const f of flights) {
    const g = groups[groups.length - 1]
    if (!g || g.date !== f.date) groups.push({ date: f.date, flights: [f] })
    else g.flights.push(f)
  }

  // тижні з понеділка — для підсумку у футері
  const weekMap = new Map()
  for (const f of flights) {
    const d = new Date(f.date + 'T00:00:00')
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = localISO(d)
    const w = weekMap.get(key) || { start: key, minutes: 0, count: 0 }
    w.minutes += f.minutes
    w.count += 1
    weekMap.set(key, w)
  }
  const weeks = [...weekMap.values()]
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(-2)
    .map(w => {
      const end = new Date(w.start + 'T00:00:00')
      end.setDate(end.getDate() + 6)
      return { ...w, end: localISO(end) }
    })

  return {
    flights, groups, weeks,
    totalMin, flightSum, count, nightCount,
    recordMin, recordId,
    lastDate, lastDayFlights, lastDayMin,
    avgMin: count ? flightSum / count : 0,
    milestone,
  }
}
