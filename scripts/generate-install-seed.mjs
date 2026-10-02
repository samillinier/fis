// One-off: convert jobsExport (10).xlsx -> public/data/installJobsSeed.json
// Mirrors parseJobsWorkbook() in lib/jobsData.ts.
import * as XLSX from 'xlsx'
import { writeFileSync, readFileSync } from 'fs'

const src = '/Users/it/Downloads/jobsExport (10).xlsx'
const out = 'public/data/installJobsSeed.json'

function str(v) {
  return v == null ? '' : String(v).trim()
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

function parseAmount(value) {
  const n = parseFloat(str(value).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function parseDate(value) {
  const s = str(value)
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

const wb = XLSX.read(readFileSync(src), { type: 'buffer' })
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
const header = (rows[0] || []).map((h) => str(h))
const idx = {}
header.forEach((h, i) => {
  idx[h] = i
})
const has = (k) => idx[k] != null

const records = []
for (let i = 1; i < rows.length; i++) {
  const row = rows[i]
  if (!row || !str(row[idx.Id])) continue
  records.push({
    id: str(row[idx.Id]),
    jobType: has('JobType') ? str(row[idx.JobType]) : '',
    firstName: has('FirstName') ? str(row[idx.FirstName]) : '',
    lastName: has('LastName') ? str(row[idx.LastName]) : '',
    laborCategory: has('Labor Category') ? str(row[idx['Labor Category']]) : '',
    jobStatus: has('Job Status') ? str(row[idx['Job Status']]) : '',
    customerPhone: has('Customer Phone') ? str(row[idx['Customer Phone']]) : '',
    customerAddress: has('Customer Address') ? cleanAddress(row[idx['Customer Address']]) : '',
    store: has('Store') ? str(row[idx.Store]) : '',
    district: has('District') ? str(row[idx.District]) : '',
    createdOn: has('Created On') ? str(row[idx['Created On']]) : '',
    customerEmail: has('Customer Email') ? str(row[idx['Customer Email']]) : '',
    crewLead: has('Crew Lead') ? str(row[idx['Crew Lead']]) : '',
    storeLocation: has('Store Location') ? str(row[idx['Store Location']]) : '',
    laborAmount: has('Labor Amount') ? parseAmount(row[idx['Labor Amount']]) : 0,
    leadSafePractices: has('Lead Safe Practices') ? str(row[idx['Lead Safe Practices']]) : '',
  })
}
records.sort((a, b) => parseDate(b.createdOn) - parseDate(a.createdOn))
writeFileSync(out, JSON.stringify(records))
console.log('wrote', records.length, 'records to', out)
