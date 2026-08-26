// Generates public/data/jobsSeed.json from a jobs export (.xlsx).
// Usage: node scripts/generateJobsSeed.js "/path/to/jobsExport.xlsx"
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const INPUT = process.argv[2] || '/Users/it/Downloads/jobsExport (1).xlsx'
const OUTPUT = path.join(__dirname, '..', 'public', 'data', 'jobsSeed.json')

function str(v) {
  return (v == null ? '' : String(v)).trim()
}

function cleanAddress(raw) {
  const s = str(raw)
  if (!s) return ''
  const line = s.match(/firstLine=([^,]*)/)
  const city = s.match(/city=([^,]*)/)
  const state = s.match(/state=([^,]*)/)
  const zip = s.match(/postalCode=([^,]*)/)
  const lineV = line ? line[1].trim() : ''
  const cityV = city ? city[1].trim() : ''
  const stateV = state ? state[1].trim() : ''
  const zipV = zip ? zip[1].trim() : ''
  if (!lineV && !cityV && !stateV && !zipV) {
    return s.replace(/^Address\(/i, '').replace(/\)$/, '')
  }
  const cityStateZip = stateV ? `${stateV} ${zipV}`.trim() : zipV
  return [lineV, cityV, cityStateZip].filter(Boolean).join(', ')
}

function parseAmount(v) {
  const s = str(v)
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function parseDate(ts) {
  const s = str(ts)
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return 0
  let h = parseInt(m[4], 10)
  const isPM = /pm/i.test(m[6])
  if (isPM && h !== 12) h += 12
  if (!isPM && h === 12) h = 0
  return new Date(
    parseInt(m[3], 10),
    parseInt(m[1], 10) - 1,
    parseInt(m[2], 10),
    h,
    parseInt(m[5], 10)
  ).getTime()
}

const wb = XLSX.readFile(INPUT)
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
const header = rows[0].map((h) => str(h))

const idx = {}
header.forEach((h, i) => {
  idx[h] = i
})

const records = []
for (let i = 1; i < rows.length; i++) {
  const r = rows[i]
  if (!r || !str(r[idx.Id])) continue
  records.push({
    id: str(r[idx.Id]),
    jobType: str(r[idx.JobType]),
    firstName: str(r[idx.FirstName]),
    lastName: str(r[idx.LastName]),
    laborCategory: str(r[idx['Labor Category']]),
    jobStatus: str(r[idx['Job Status']]),
    customerPhone: str(r[idx['Customer Phone']]),
    customerAddress: cleanAddress(r[idx['Customer Address']]),
    store: str(r[idx.Store]),
    district: str(r[idx.District]),
    createdOn: str(r[idx['Created On']]),
    customerEmail: str(r[idx['Customer Email']]),
    crewLead: str(r[idx['Crew Lead']]),
    storeLocation: str(r[idx['Store Location']]),
    laborAmount: parseAmount(r[idx['Labor Amount']]),
    leadSafePractices: str(r[idx['Lead Safe Practices']]),
  })
}

records.sort((a, b) => parseDate(b.createdOn) - parseDate(a.createdOn))

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
fs.writeFileSync(OUTPUT, JSON.stringify(records))

console.log('Wrote', records.length, 'records to', OUTPUT)
