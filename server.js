import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'flights.json')
const SEED_FILE = path.join(__dirname, 'src', 'seed', 'flights.json')

if (!fs.existsSync(DATA_FILE)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.copyFileSync(SEED_FILE, DATA_FILE)
}

function validateDoc(doc) {
  if (!doc || typeof doc !== 'object') return 'документ не є обʼєктом'
  if (typeof doc.baselineMinutes !== 'number' || doc.baselineMinutes < 0) return 'некоректний baselineMinutes'
  if (!Array.isArray(doc.flights)) return 'flights має бути масивом'
  for (const f of doc.flights) {
    if (typeof f.id !== 'string' || !f.id) return 'у польота відсутній id'
    if (typeof f.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return `некоректна дата: ${f.date}`
    if (!Number.isFinite(f.minutes) || f.minutes <= 0) return `некоректні хвилини: ${f.minutes}`
    if (f.type !== 'day' && f.type !== 'night') return `некоректний тип: ${f.type}`
  }
  return null
}

const app = express()
app.use(express.json({ limit: '2mb' }))

app.get('/api/flights', (req, res) => {
  res.type('json').send(fs.readFileSync(DATA_FILE, 'utf8'))
})

app.put('/api/flights', (req, res) => {
  const err = validateDoc(req.body)
  if (err) return res.status(400).json({ error: err })
  const tmp = DATA_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(req.body, null, 2))
  fs.renameSync(tmp, DATA_FILE)
  res.json({ ok: true })
})

const dist = path.join(__dirname, 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
}

const port = process.env.PORT || 3210
app.listen(port, () => {
  console.log(`Furia dashboard: http://localhost:${port} (дані: ${DATA_FILE})`)
})
