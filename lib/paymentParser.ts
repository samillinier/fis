import type { PaymentRecord } from '@/context/PaymentContext'

/** Excel columns A–T for payment debit details export */
export const PAYMENT_COLUMNS = [
  { key: 'checkNumber', label: 'Check Number', letter: 'A' },
  { key: 'paymentNumber', label: 'Payment Number', letter: 'B' },
  { key: 'checkAmount', label: 'Check Amount', letter: 'C', numeric: true as const },
  { key: 'invoiceNumber', label: 'Invoice Number', letter: 'D' },
  { key: 'associatedJobId', label: 'Associated Job Id', letter: 'E' },
  { key: 'customerName', label: 'Customer Name', letter: 'F' },
  { key: 'status', label: 'Status', letter: 'G' },
  { key: 'type', label: 'Type', letter: 'H' },
  { key: 'store', label: 'Store', letter: 'I' },
  { key: 'jobType', label: 'Job Type', letter: 'J' },
  { key: 'labourCategory', label: 'Labour Category', letter: 'K' },
  { key: 'installerName', label: 'Installer Name', letter: 'L' },
  { key: 'amount', label: 'Amount', letter: 'M', numeric: true as const },
  { key: 'checkDate', label: 'Check Date', letter: 'N' },
  { key: 'createdOn', label: 'Created On', letter: 'O' },
  { key: 'description', label: 'Description', letter: 'P' },
  { key: 'initiator', label: 'Initiator', letter: 'Q' },
  { key: 'rejectionReason', label: 'Rejection Reason', letter: 'R' },
  { key: 'installerInvoiceNumber', label: 'Installer Invoice Number', letter: 'S' },
  { key: 'purchaseOrder', label: 'Purchase Order', letter: 'T' },
]

export type PaymentFieldKey = (typeof PAYMENT_COLUMNS)[number]['key']

const HEADER_ALIASES: Record<string, PaymentFieldKey> = {
  'check number': 'checkNumber',
  'payment number': 'paymentNumber',
  'check amount': 'checkAmount',
  'invoice number': 'invoiceNumber',
  'associated job id': 'associatedJobId',
  'customer name': 'customerName',
  status: 'status',
  type: 'type',
  store: 'store',
  'job type': 'jobType',
  'labour category': 'labourCategory',
  'labor category': 'labourCategory',
  'installer name': 'installerName',
  amount: 'amount',
  'check date': 'checkDate',
  'created on': 'createdOn',
  description: 'description',
  initiator: 'initiator',
  'rejection reason': 'rejectionReason',
  'installer invoice number': 'installerInvoiceNumber',
  'purchase order': 'purchaseOrder',
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '').toLowerCase().trim()
}

function parseNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(num) ? num : undefined
}

function parseCellValue(key: PaymentFieldKey, value: unknown): string | number | undefined {
  if (value == null || value === '') return undefined
  const col = PAYMENT_COLUMNS.find(c => c.key === key)
  if (col?.numeric) {
    return parseNumber(value)
  }
  return String(value).trim()
}

function isHeaderRow(row: unknown[]): boolean {
  const first = normalizeHeader(row[0])
  return first === 'check number' || first.includes('check number')
}

export function parsePaymentRows(jsonData: unknown[][]): PaymentRecord[] {
  if (jsonData.length === 0) return []

  const records: PaymentRecord[] = []
  let headerMap: PaymentFieldKey[] | null = null
  let dataStartIdx = 0

  const firstRow = jsonData[0]
  if (Array.isArray(firstRow) && isHeaderRow(firstRow)) {
    headerMap = firstRow.map((cell, idx) => {
      const normalized = normalizeHeader(cell)
      return HEADER_ALIASES[normalized] ?? PAYMENT_COLUMNS[idx]?.key ?? 'checkNumber'
    })
    dataStartIdx = 1
  }

  for (let rowIdx = dataStartIdx; rowIdx < jsonData.length; rowIdx++) {
    const row = jsonData[rowIdx]
    if (!row || !Array.isArray(row) || row.every(cell => cell == null || cell === '')) continue

    const record: PaymentRecord = {
      id: `payment-${rowIdx}-${Date.now()}`,
    }

    for (let colIdx = 0; colIdx < 20; colIdx++) {
      const key = headerMap?.[colIdx] ?? PAYMENT_COLUMNS[colIdx]?.key
      if (!key) continue
      const parsed = parseCellValue(key, row[colIdx])
      if (parsed !== undefined) {
        record[key] = parsed
      }
    }

    records.push(record)
  }

  return records
}

export function getPaymentAmount(record: PaymentRecord): number {
  const amount = record.amount ?? record.checkAmount ?? 0
  return typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0
}

export function formatPaymentCurrency(value: unknown): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (!Number.isFinite(num)) return '—'
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatPaymentDate(value: unknown): string {
  if (value == null || value === '') return '—'
  const raw = String(value).split(' - ')[0].trim()
  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  return raw
}
