'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '@/components/Layout'
import { useAuth } from '@/components/AuthContext'
import { workroomStoreData } from '@/data/workroomStoreData'
import { Calculator, Download, Plus, Send, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'

type BonusRow = {
  id: string
  fromDate: string
  toDate: string
  workroom: string
  revenue: string
  contractorCost: string
  financialLossAmount: string
  dumpsterCost: string
  ltr: string
  cycleTime: string
  rank: string
  paymentStatus: 'pending' | 'paid' | 'not_paid'
  accountingNote: string
}

type BonusTier = {
  id: string
  workroom: string
  label: string
  minScore: string
  amount: string
}

type ComputedRow = BonusRow & {
  contractorPercent: number
  financialLossPercent: number
  dumpsterPercent: number
  contractorScore: number
  financialLossScore: number
  dumpsterScore: number
  ltrScore: number
  totalScore: number
  bonusTier: string
  bonusAmount: number
  suggestions: string[]
}

type AccountingRequest = {
  id: number
  submitted_by_email: string
  summary_json: Array<{
    fromDate?: string
    toDate?: string
    date?: string
    workroom: string
    score: number
    rank: string
    bonusTier: string
    bonusAmount: number
    paymentStatus?: 'pending' | 'paid' | 'not_paid'
    accountingNote?: string
  }>
  created_at: string
}

const DEFAULT_TIERS: BonusTier[] = [
  { id: 'tier-3', workroom: '', label: 'Tier 3', minScore: '100', amount: '150' },
  { id: 'tier-2', workroom: '', label: 'Tier 2', minScore: '200', amount: '400' },
]

const LEGACY_BONUS_ROWS_STORAGE_KEY = 'fis-bonus-rows'
const LEGACY_BONUS_TIERS_STORAGE_KEY = 'fis-bonus-tiers'

const RUBRIC_ROWS = [
  { metric: 'LTR', target: '85+', points: '100', notes: 'Must be above 85 to earn points' },
  { metric: 'Contractor Pay', target: '45% or less', points: '75 / 25', notes: 'Lower is better' },
  { metric: 'Financial Losses', target: 'Under 1%', points: '75 / 60 / 45 / 25', notes: 'Execution control' },
  { metric: 'Dumpster/Waste', target: 'Under 2.3%', points: '50 / 10', notes: 'Operational discipline' },
  { metric: 'Cycle Time', target: 'Reference only', points: '0', notes: 'Captured but not included in total score' },
]

function makeRow(): BonusRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fromDate: '',
    toDate: '',
    workroom: '',
    revenue: '',
    contractorCost: '',
    financialLossAmount: '',
    dumpsterCost: '',
    ltr: '',
    cycleTime: '',
    rank: '',
    paymentStatus: 'pending',
    accountingNote: '',
  }
}

function parseNumber(value: string): number {
  if (!value.trim()) return 0
  const cleaned = value.replace(/[$,%\s,]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatInputNumber(value: string): string {
  if (!value.trim()) return ''
  const parsed = parseNumber(value)
  return Number.isFinite(parsed) ? String(parsed) : ''
}

function normalizeBonusWorkroomName(value: string): string {
  const raw = value.trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (lower === 'ocala' || lower === 'gainesville' || lower === 'ocala / gainesville') {
    return 'Ocala / Gainesville'
  }
  if (lower === 'dothan' || lower === 'panama city' || lower === 'dothan / panama city') {
    return 'Dothan / Panama City'
  }
  return raw
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function scoreContractor(contractorPercent: number): number {
  return contractorPercent <= 45 ? 75 : 25
}

function scoreFinancialLoss(lossPercent: number): number {
  if (lossPercent <= 1) return 75
  if (lossPercent <= 2) return 60
  if (lossPercent <= 3) return 45
  return 25
}

function scoreDumpster(dumpsterPercent: number): number {
  return dumpsterPercent <= 2.3 ? 50 : 10
}

function scoreLTR(ltr: number): number {
  return ltr >= 85 ? 100 : 0
}

function chooseTier(totalScore: number, workroom: string, tiers: BonusTier[]) {
  const normalized = normalizeBonusWorkroomName(workroom).toLowerCase()
  const applicable = tiers.filter((tier) => {
    if (!tier.workroom.trim()) return true
    return normalizeBonusWorkroomName(tier.workroom).toLowerCase() === normalized
  })
  const sorted = [...applicable].sort((a, b) => parseNumber(b.minScore) - parseNumber(a.minScore))
  return (
    sorted.find((tier) => totalScore >= parseNumber(tier.minScore)) || {
      id: 'unmatched',
      workroom: '',
      label: 'No Tier',
      minScore: '0',
      amount: '0',
    }
  )
}

function getApplicableTiers(workroom: string, tiers: BonusTier[]) {
  const normalized = normalizeBonusWorkroomName(workroom).toLowerCase()
  return tiers
    .filter((tier) => {
      if (!tier.workroom.trim()) return true
      return normalizeBonusWorkroomName(tier.workroom).toLowerCase() === normalized
    })
    .sort((a, b) => parseNumber(a.minScore) - parseNumber(b.minScore))
}

function hydrateBonusRows(value: unknown): BonusRow[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((row): row is Partial<BonusRow> => !!row && typeof row === 'object')
    .map((row, index) => ({
      id: typeof row.id === 'string' && row.id ? row.id : `row-restored-${index}`,
      fromDate:
        typeof (row as BonusRow & { date?: string }).fromDate === 'string'
          ? (row as BonusRow & { date?: string }).fromDate
          : typeof (row as BonusRow & { date?: string }).date === 'string'
            ? (row as BonusRow & { date?: string }).date || ''
            : '',
      toDate: typeof (row as BonusRow).toDate === 'string' ? (row as BonusRow).toDate : '',
      workroom: typeof row.workroom === 'string' ? normalizeBonusWorkroomName(row.workroom) : '',
      revenue: typeof row.revenue === 'string' ? row.revenue : '',
      contractorCost: typeof row.contractorCost === 'string' ? row.contractorCost : '',
      financialLossAmount: typeof row.financialLossAmount === 'string' ? row.financialLossAmount : '',
      dumpsterCost: typeof row.dumpsterCost === 'string' ? row.dumpsterCost : '',
      ltr: typeof row.ltr === 'string' ? row.ltr : '',
      cycleTime: typeof row.cycleTime === 'string' ? row.cycleTime : '',
      rank: typeof row.rank === 'string' ? row.rank : '',
      paymentStatus:
        row.paymentStatus === 'paid' || row.paymentStatus === 'not_paid' ? row.paymentStatus : 'pending',
      accountingNote: typeof row.accountingNote === 'string' ? row.accountingNote : '',
    }))
}

function hydrateBonusTiers(value: unknown): BonusTier[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((tier): tier is Partial<BonusTier> => !!tier && typeof tier === 'object')
    .map((tier, index) => ({
      id: typeof tier.id === 'string' && tier.id ? tier.id : `tier-restored-${index}`,
      workroom: typeof tier.workroom === 'string' ? normalizeBonusWorkroomName(tier.workroom) : '',
      label: typeof tier.label === 'string' ? tier.label : `Tier ${index + 1}`,
      minScore: typeof tier.minScore === 'string' ? tier.minScore : String(tier.minScore ?? '0'),
      amount: typeof tier.amount === 'string' ? tier.amount : String(tier.amount ?? '0'),
    }))
}

export default function BonusPage() {
  const { user, isAdmin, isOwner, isAccounting, isLoading } = useAuth()
  const canViewAdminBonus = isAdmin || isOwner
  const canViewBonus = canViewAdminBonus || isAccounting
  const canEditBonus = isAdmin
  const canEditPaymentStatus = isAdmin || isAccounting
  const [rows, setRows] = useState<BonusRow[]>([makeRow()])
  const [tiers, setTiers] = useState<BonusTier[]>(DEFAULT_TIERS)
  const [showBonusTiers, setShowBonusTiers] = useState(false)
  const [snapshotLoaded, setSnapshotLoaded] = useState(false)
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false)
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('idle')
  const [cloudMessage, setCloudMessage] = useState('Cloud sync ready.')
  const [accountingRequests, setAccountingRequests] = useState<AccountingRequest[]>([])
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [requestMessage, setRequestMessage] = useState('')
  const lastSyncedPayloadRef = useRef('')

  const workroomOptions = useMemo(() => {
    return Array.from(new Set(workroomStoreData.map((row) => normalizeBonusWorkroomName(row.workroom)))).sort(
      (a, b) => a.localeCompare(b)
    )
  }, [])

  useEffect(() => {
    if (!user?.email || !canViewBonus) return

    let cancelled = false

    const loadSnapshot = async () => {
      setCloudStatus('loading')
      setCloudMessage('Loading bonus data from cloud...')
      setCloudSyncEnabled(false)

      try {
        const response = await fetch('/api/bonus-cloud', {
          headers: {
            Authorization: `Bearer ${user.email}`,
          },
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load bonus data')
        }

        let nextRows = [makeRow()]
        let nextTiers = DEFAULT_TIERS
        let shouldMigrateLegacyData = false

        if (data?.snapshot) {
          const hydratedRows = hydrateBonusRows(data.snapshot.rows)
          const hydratedTiers = hydrateBonusTiers(data.snapshot.tiers)
          if (hydratedRows.length > 0) nextRows = hydratedRows
          if (hydratedTiers.length > 0) nextTiers = hydratedTiers
          lastSyncedPayloadRef.current = JSON.stringify({ rows: nextRows, tiers: nextTiers })
          setCloudMessage('Bonus data loaded from cloud.')
        } else {
          const legacyRows = hydrateBonusRows(
            JSON.parse(window.localStorage.getItem(LEGACY_BONUS_ROWS_STORAGE_KEY) || '[]')
          )
          const legacyTiers = hydrateBonusTiers(
            JSON.parse(window.localStorage.getItem(LEGACY_BONUS_TIERS_STORAGE_KEY) || '[]')
          )

          if (legacyRows.length > 0) {
            nextRows = legacyRows
            shouldMigrateLegacyData = true
          }
          if (legacyTiers.length > 0) {
            nextTiers = legacyTiers
            shouldMigrateLegacyData = true
          }

          lastSyncedPayloadRef.current = shouldMigrateLegacyData
            ? ''
            : JSON.stringify({ rows: nextRows, tiers: nextTiers })
          setCloudMessage(
            shouldMigrateLegacyData ? 'Migrating bonus data from local storage to cloud...' : 'Cloud sync ready.'
          )
        }

        if (!cancelled) {
          setRows(nextRows)
          setTiers(nextTiers)
          setSnapshotLoaded(true)
          setCloudSyncEnabled(true)
          setCloudStatus(shouldMigrateLegacyData ? 'saving' : 'saved')
        }
      } catch (error: any) {
        if (!cancelled) {
          setSnapshotLoaded(true)
          setCloudSyncEnabled(false)
          setCloudStatus('error')
          setCloudMessage(error?.message || 'Failed to load bonus data from cloud.')
        }
      }
    }

    loadSnapshot()

    return () => {
      cancelled = true
    }
  }, [user?.email, canViewBonus])

  useEffect(() => {
    if (!snapshotLoaded || !cloudSyncEnabled || !user?.email || !canEditPaymentStatus) return

    const serializedPayload = JSON.stringify({ rows, tiers })
    if (serializedPayload === lastSyncedPayloadRef.current) return

    let cancelled = false
    setCloudStatus('saving')
    setCloudMessage('Saving bonus data to cloud...')

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/bonus-cloud', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.email}`,
          },
          body: JSON.stringify({ rows, tiers }),
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to save bonus data')
        }

        if (!cancelled) {
          lastSyncedPayloadRef.current = serializedPayload
          setCloudStatus('saved')
          setCloudMessage(
            data?.updatedAt ? `Saved to cloud at ${new Date(data.updatedAt).toLocaleString()}.` : 'Saved to cloud.'
          )
        }
      } catch (error: any) {
        if (!cancelled) {
          setCloudStatus('error')
          setCloudMessage(error?.message || 'Failed to save bonus data to cloud.')
        }
      }
    }, 600)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [rows, tiers, snapshotLoaded, cloudSyncEnabled, user?.email, canEditPaymentStatus])

  useEffect(() => {
    if (!user?.email || !canViewBonus) return

    let cancelled = false

    const loadRequests = async () => {
      try {
        const response = await fetch('/api/bonus-accounting-requests', {
          headers: {
            Authorization: `Bearer ${user.email}`,
          },
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load accounting requests')
        }

        if (!cancelled) {
          setAccountingRequests(Array.isArray(data?.requests) ? data.requests : [])
        }
      } catch (error: any) {
        if (!cancelled) {
          setRequestStatus('error')
          setRequestMessage(error?.message || 'Failed to load accounting requests.')
        }
      }
    }

    loadRequests()
    const intervalId = window.setInterval(loadRequests, 5000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [user?.email, canViewBonus])

  const computedRows = useMemo<ComputedRow[]>(() => {
    return rows.map((row) => {
      const revenue = parseNumber(row.revenue)
      const contractorCost = parseNumber(row.contractorCost)
      const financialLossAmount = parseNumber(row.financialLossAmount)
      const contractorPercent = revenue > 0 ? (contractorCost / revenue) * 100 : 0
      const financialLossPercent = revenue > 0 ? (financialLossAmount / revenue) * 100 : 0
      const dumpsterCost = parseNumber(row.dumpsterCost)
      const dumpsterPercent = revenue > 0 ? (dumpsterCost / revenue) * 100 : 0
      const dumpsterScore = scoreDumpster(dumpsterPercent)
      const ltr = parseNumber(row.ltr)

      const contractorScore = scoreContractor(contractorPercent)
      const financialLossScore = scoreFinancialLoss(financialLossPercent)
      const ltrScore = scoreLTR(ltr)
      const totalScore = contractorScore + financialLossScore + dumpsterScore + ltrScore
      const tier = chooseTier(totalScore, row.workroom, tiers)
      const applicableTiers = getApplicableTiers(row.workroom, tiers)
      const nextTier = applicableTiers.find((candidate) => parseNumber(candidate.minScore) > totalScore)
      const suggestions: string[] = []

      if (ltr < 85) suggestions.push('Raise LTR above 85 to earn 100 points.')
      if (contractorPercent > 45) suggestions.push('Lower contractor pay to 45% or less.')
      if (financialLossPercent > 1) suggestions.push('Reduce financial losses under 1%.')
      if (dumpsterPercent > 2.3) suggestions.push('Reduce dumpster/waste under 2.3%.')
      if (nextTier) {
        suggestions.push(
          `Need ${parseNumber(nextTier.minScore) - totalScore} more points to reach ${nextTier.label}.`
        )
      }
      if (suggestions.length === 0) suggestions.push('All current score targets are being met.')

      return {
        ...row,
        workroom: normalizeBonusWorkroomName(row.workroom),
        contractorPercent,
        financialLossPercent,
        dumpsterPercent,
        contractorScore,
        financialLossScore,
        dumpsterScore,
        ltrScore,
        totalScore,
        bonusTier: tier.label,
        bonusAmount: parseNumber(tier.amount),
        suggestions,
      }
    })
  }, [rows, tiers])

  const summaryRows = useMemo(
    () => computedRows.filter((row) => row.workroom.trim().length > 0),
    [computedRows]
  )
  const accountingNote = rows[0]?.accountingNote || ''

  const getAccountingStatusForRow = (row: ComputedRow): BonusRow['paymentStatus'] => {
    for (const request of accountingRequests) {
      const match = request.summary_json.find((requestRow) => {
        const sameWorkroom =
          normalizeBonusWorkroomName(requestRow.workroom) === normalizeBonusWorkroomName(row.workroom)
        const sameFromDate = (requestRow.fromDate || requestRow.date || '') === (row.fromDate || '')
        const sameToDate = (requestRow.toDate || '') === (row.toDate || '')
        const sameRank = String(requestRow.rank || '') === String(row.rank || '')
        return sameWorkroom && sameFromDate && sameToDate && sameRank
      })

      if (match?.paymentStatus) {
        return match.paymentStatus
      }
    }

    return row.paymentStatus
  }

  const updateRow = (id: string, field: keyof BonusRow, value: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  const updateAccountingNote = (value: string) => {
    setRows((current) => current.map((row) => ({ ...row, accountingNote: value })))
  }

  const removeRow = (id: string) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)))
  }

  const updateTier = (id: string, field: keyof BonusTier, value: string) => {
    setTiers((current) =>
      current.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier))
    )
  }

  const addTier = () => {
    setTiers((current) => [
      ...current,
      {
        id: `tier-${Date.now()}`,
        workroom: '',
        label: `Tier ${current.length + 1}`,
        minScore: '0',
        amount: '0',
      },
    ])
  }

  const removeTier = (id: string) => {
    setTiers((current) => (current.length === 1 ? current : current.filter((tier) => tier.id !== id)))
  }

  const updateAccountingRequestStatus = async (
    requestId: number,
    rowIndex: number,
    paymentStatus: 'pending' | 'paid' | 'not_paid'
  ) => {
    if (!user?.email || !isAccounting) return
    const targetRequest = accountingRequests.find((request) => String(request.id) === String(requestId))
    const targetRow = targetRequest?.summary_json?.[rowIndex]

    if (targetRow) {
      setRows((current) =>
        current.map((row) => {
          const sameWorkroom =
            normalizeBonusWorkroomName(row.workroom) === normalizeBonusWorkroomName(targetRow.workroom)
          const sameFromDate = (row.fromDate || '') === (targetRow.fromDate || targetRow.date || '')
          const sameToDate = (row.toDate || '') === (targetRow.toDate || '')
          const sameRank = String(row.rank || '') === String(targetRow.rank || '')

          return sameWorkroom && sameFromDate && sameToDate && sameRank ? { ...row, paymentStatus } : row
        })
      )
    }

    const previousRequests = accountingRequests

    setAccountingRequests((current) =>
      current.map((request) =>
        String(request.id) !== String(requestId)
          ? request
          : {
              ...request,
              summary_json: request.summary_json.map((row, index) =>
                index === rowIndex ? { ...row, paymentStatus } : row
              ),
            }
      )
    )

    try {
      const response = await fetch('/api/bonus-accounting-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.email}`,
        },
        body: JSON.stringify({ requestId, rowIndex, paymentStatus }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update payment status')
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      setAccountingRequests(previousRequests)
    }
  }

  const deleteAccountingRequest = async (requestId: number) => {
    if (!user?.email || !isAdmin) return

    const previousRequests = accountingRequests
    setAccountingRequests((current) => current.filter((request) => String(request.id) !== String(requestId)))

    try {
      const response = await fetch(
        `/api/bonus-accounting-requests?requestId=${encodeURIComponent(String(requestId))}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user.email}`,
          },
        }
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete accounting request')
      }
    } catch (error) {
      console.error('Error deleting accounting request:', error)
      setAccountingRequests(previousRequests)
    }
  }

  const sendBonusRowToAccounting = async (row: ComputedRow) => {
    if (!user?.email || !canEditBonus) return

    setRequestStatus('sending')
    setRequestMessage(`Sending ${row.workroom || 'bonus row'} to Accounting...`)

    try {
      const response = await fetch('/api/bonus-accounting-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.email}`,
        },
        body: JSON.stringify({
          summaryRows: [{
            fromDate: row.fromDate,
            toDate: row.toDate,
            workroom: row.workroom,
            score: row.totalScore,
            rank: row.rank,
            bonusTier: row.bonusTier,
            bonusAmount: row.bonusAmount,
            paymentStatus: 'pending',
            accountingNote,
          }],
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send bonus summary')
      }

      setAccountingRequests((current) => [data.request, ...current])
      setRequestStatus('success')
      setRequestMessage(`${row.workroom || 'Bonus row'} sent to Accounting.`)
    } catch (error: any) {
      setRequestStatus('error')
      setRequestMessage(error?.message || 'Failed to send bonus row.')
    }
  }

  const exportWorkbook = () => {
    const breakdownRows = computedRows.map((row) => ({
      'From Date': row.fromDate,
      'To Date': row.toDate,
      Workroom: row.workroom,
      Revenue: row.revenue ? parseNumber(row.revenue) : '',
      'Contractor Cost': row.contractorCost ? parseNumber(row.contractorCost) : '',
      'Contractor %': row.revenue ? `${row.contractorPercent.toFixed(2)}%` : '',
      'Contractor Score': row.contractorScore,
      'Financial Losses': row.financialLossAmount ? parseNumber(row.financialLossAmount) : '',
      'Loss %': row.revenue ? `${row.financialLossPercent.toFixed(2)}%` : '',
      'Loss Score': row.financialLossScore,
      'Dumpster Cost': row.dumpsterCost ? parseNumber(row.dumpsterCost) : '',
      'Dumpster %': row.revenue ? `${row.dumpsterPercent.toFixed(2)}%` : '',
      'Dumpster Score': row.dumpsterScore,
      LTR: row.ltr ? parseNumber(row.ltr) : '',
      'LTR Score': row.ltrScore,
      'Cycle Time': row.cycleTime ? parseNumber(row.cycleTime) : '',
      'Total Score': row.totalScore,
      Rank: row.rank ? parseNumber(row.rank) : '',
      Status: row.paymentStatus === 'paid' ? 'Paid' : row.paymentStatus === 'not_paid' ? 'Not Paid' : 'Pending',
    }))

    const payoutRows = summaryRows.map((row) => ({
      'From Date': row.fromDate,
      'To Date': row.toDate,
      Workroom: row.workroom,
      Score: row.totalScore,
      Rank: row.rank ? parseNumber(row.rank) : '',
      'Bonus Tier': row.bonusTier,
      'Bonus Amount': row.bonusAmount,
      Status: row.paymentStatus === 'paid' ? 'Paid' : row.paymentStatus === 'not_paid' ? 'Not Paid' : 'Pending',
      Suggestions: row.suggestions.join(' | '),
    }))

    const rubricRows = RUBRIC_ROWS.map((row) => ({
      Metric: row.metric,
      Target: row.target,
      Points: row.points,
      Notes: row.notes,
    }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(breakdownRows), 'Breakdown')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payoutRows), 'Bonus Summary')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rubricRows), 'Rubric')
    XLSX.writeFile(workbook, `bonus-calculator-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </Layout>
    )
  }

  if (!canViewBonus) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900">Bonus</h1>
            <p className="text-gray-600 mt-2">Only admins and accounting can access bonus calculations.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calculator className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Bonus</h1>
                  <p className="text-gray-600 mt-1">
                    Build workroom bonus payouts and export a workbook for accounting.
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      cloudStatus === 'error'
                        ? 'text-red-600'
                        : cloudStatus === 'saving' || cloudStatus === 'loading'
                          ? 'text-amber-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {cloudMessage}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {canEditBonus ? (
                  <button
                    type="button"
                    onClick={() => setRows((current) => [...current, makeRow()])}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add Workroom
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={exportWorkbook}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Export Workbook
                </button>
              </div>
            </div>
          </div>

          {canViewAdminBonus ? (
            <div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Bonus Tiers</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBonusTiers((current) => !current)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {showBonusTiers ? 'Hide' : 'Show'}
                    </button>
                    {showBonusTiers && canEditBonus ? (
                      <button
                        type="button"
                        onClick={addTier}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                        Add Tier
                      </button>
                    ) : null}
                  </div>
                </div>
                {showBonusTiers ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                    {tiers.map((tier) => (
                      <div key={tier.id} className="border border-gray-200 rounded-md p-1.5">
                        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_36px] gap-2 items-end w-full">
                          <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Workroom</label>
                            <select
                              value={tier.workroom}
                              onChange={(e) => updateTier(tier.id, 'workroom', e.target.value)}
                              disabled={!canEditBonus}
                              className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm bg-white"
                            >
                              <option value="">All workrooms</option>
                              {workroomOptions.map((workroom) => (
                                <option key={workroom} value={workroom}>
                                  {workroom}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Label</label>
                            <input
                              value={tier.label}
                              onChange={(e) => updateTier(tier.id, 'label', e.target.value)}
                              disabled={!canEditBonus}
                              className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Min Score</label>
                            <input
                              type="number"
                              value={tier.minScore}
                              onChange={(e) => updateTier(tier.id, 'minScore', e.target.value)}
                              disabled={!canEditBonus}
                              className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Amount</label>
                            <input
                              type="number"
                              value={tier.amount}
                              onChange={(e) => updateTier(tier.id, 'amount', e.target.value)}
                              disabled={!canEditBonus}
                              className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm"
                            />
                          </div>
                          {canEditBonus ? (
                            <button
                              type="button"
                              onClick={() => removeTier(tier.id)}
                              className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                              title="Remove tier"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {!isAccounting ? (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/80 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Score Breakdown</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the workroom score inputs below. Each row is split across two clean lines for easier review.
                  </p>
                </div>
                {canEditBonus ? (
                  <button
                    type="button"
                    onClick={() => setRows((current) => [...current, makeRow()])}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
                    title="Add workroom row"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="space-y-4">
                {computedRows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-4 shadow-sm"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">From Date</label>
                        <input
                          type="date"
                          value={row.fromDate}
                          onChange={(e) => updateRow(row.id, 'fromDate', e.target.value)}
                          disabled={!canEditBonus}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">To Date</label>
                        <input
                          type="date"
                          value={row.toDate}
                          onChange={(e) => updateRow(row.id, 'toDate', e.target.value)}
                          disabled={!canEditBonus}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">Workroom</label>
                        <select
                          value={row.workroom}
                          onChange={(e) => updateRow(row.id, 'workroom', e.target.value)}
                          disabled={!canEditBonus}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
                        >
                          <option value="">Select workroom</option>
                          {workroomOptions.map((workroom) => (
                            <option key={workroom} value={workroom}>
                              {workroom}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">Revenue</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatInputNumber(row.revenue)}
                          onChange={(e) => updateRow(row.id, 'revenue', e.target.value)}
                          disabled={!canEditBonus}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-right shadow-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">Contractor Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatInputNumber(row.contractorCost)}
                          onChange={(e) => updateRow(row.id, 'contractorCost', e.target.value)}
                          disabled={!canEditBonus}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-right shadow-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">Financial Losses</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatInputNumber(row.financialLossAmount)}
                          onChange={(e) => updateRow(row.id, 'financialLossAmount', e.target.value)}
                          disabled={!canEditBonus}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-right shadow-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">Dumpster Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formatInputNumber(row.dumpsterCost)}
                          onChange={(e) => updateRow(row.id, 'dumpsterCost', e.target.value)}
                          disabled={!canEditBonus}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-right shadow-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">LTR</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formatInputNumber(row.ltr)}
                          onChange={(e) => updateRow(row.id, 'ltr', e.target.value)}
                          disabled={!canEditBonus}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-right shadow-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">Cycle Time</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formatInputNumber(row.cycleTime)}
                          onChange={(e) => updateRow(row.id, 'cycleTime', e.target.value)}
                          disabled={!canEditBonus}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-right shadow-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">Total Score</label>
                        <div className="h-[46px] flex items-center justify-end rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-900 shadow-sm">
                          {row.totalScore}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-1.5">Rank</label>
                        <input
                          type="number"
                          step="1"
                          value={formatInputNumber(row.rank)}
                          onChange={(e) => updateRow(row.id, 'rank', e.target.value)}
                          disabled={!canEditBonus}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-right shadow-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        {canEditBonus ? (
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 transition"
                            title="Remove workroom"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {canViewAdminBonus ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Bonus Summary</h2>
                </div>
                {requestMessage ? (
                  <p
                    className={`mb-3 text-sm ${
                      requestStatus === 'error'
                        ? 'text-red-600'
                        : requestStatus === 'success'
                          ? 'text-green-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {requestMessage}
                  </p>
                ) : null}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">From Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">To Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Workroom</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Score</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Rank</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Bonus Tier</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Bonus Amount</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Send</th>
                        {canEditBonus ? (
                          <th className="px-3 py-2 text-right font-semibold text-gray-700">Delete</th>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody>
                      {summaryRows.length === 0 ? (
                        <tr>
                          <td colSpan={canEditBonus ? 10 : 9} className="px-3 py-8 text-center text-gray-500">
                            Add at least one workroom to generate a bonus summary.
                          </td>
                        </tr>
                      ) : (
                        summaryRows.map((row) => (
                          <tr key={row.id} className="border-b border-gray-100">
                            <td className="px-3 py-2 text-gray-900">{row.fromDate || '-'}</td>
                            <td className="px-3 py-2 text-gray-900">{row.toDate || '-'}</td>
                            <td className="px-3 py-2 text-gray-900">{row.workroom}</td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">{row.totalScore}</td>
                            <td className="px-3 py-2 text-right text-gray-800">{row.rank}</td>
                            <td className="px-3 py-2 text-gray-800">{row.bonusTier}</td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-900">
                              {formatCurrency(row.bonusAmount)}
                            </td>
                            <td className="px-3 py-2 text-gray-800">
                              {getAccountingStatusForRow(row) === 'paid'
                                ? 'Paid'
                                : getAccountingStatusForRow(row) === 'not_paid'
                                  ? 'Not Paid'
                                  : 'Pending'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => sendBonusRowToAccounting(row)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 text-xs"
                                disabled={!canEditBonus || requestStatus === 'sending'}
                              >
                                <Send className="h-3.5 w-3.5" />
                                Send
                              </button>
                            </td>
                            {canEditBonus ? (
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeRow(row.id)}
                                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition"
                                  title="Delete summary row"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            ) : null}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes for Accounting</label>
                  <textarea
                    value={accountingNote}
                    onChange={(e) => updateAccountingNote(e.target.value)}
                    rows={3}
                    disabled={!canEditBonus}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Add a note for accounting to see with this bonus summary."
                  />
                </div>
              </div>

            </>
          ) : null}

          {(isAccounting || canViewAdminBonus) ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Accounting Requests</h2>
              <div className="space-y-4">
                {accountingRequests.length === 0 ? (
                  <p className="text-sm text-gray-500">No accounting requests have been sent yet.</p>
                ) : (
                  accountingRequests.map((request) => (
                    <div key={request.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Sent by {request.submitted_by_email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.created_at).toLocaleString()} • {request.summary_json.length} rows
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => deleteAccountingRequest(request.id)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                            title="Delete request"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">From Date</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">To Date</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Workroom</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-700">Score</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-700">Rank</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Bonus Tier</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-700">Bonus Amount</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {request.summary_json.map((item, index) => (
                              <tr key={`${request.id}-${index}`} className="border-b border-gray-100">
                                <td className="px-3 py-2 text-gray-900">{item.fromDate || item.date || '-'}</td>
                                <td className="px-3 py-2 text-gray-900">{item.toDate || '-'}</td>
                                <td className="px-3 py-2 text-gray-900">{item.workroom}</td>
                                <td className="px-3 py-2 text-right text-gray-900">{item.score}</td>
                                <td className="px-3 py-2 text-right text-gray-900">{item.rank || '-'}</td>
                                <td className="px-3 py-2 text-gray-800">{item.bonusTier}</td>
                                <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                  {formatCurrency(item.bonusAmount)}
                                </td>
                                <td className="px-3 py-2">
                                  {isAccounting ? (
                                    <select
                                      value={item.paymentStatus || 'pending'}
                                      onChange={(e) =>
                                        updateAccountingRequestStatus(
                                          request.id,
                                          index,
                                          e.target.value as 'pending' | 'paid' | 'not_paid'
                                        )
                                      }
                                      className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="paid">Paid</option>
                                      <option value="not_paid">Not Paid</option>
                                    </select>
                                  ) : item.paymentStatus === 'paid' ? (
                                    'Paid'
                                  ) : item.paymentStatus === 'not_paid' ? (
                                    'Not Paid'
                                  ) : (
                                    'Pending'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {(request.summary_json[0]?.accountingNote || '').trim() ? (
                        <div className="mt-3 rounded-md bg-gray-50 border border-gray-200 px-3 py-2">
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Note</div>
                          <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                            {request.summary_json[0]?.accountingNote}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  )
}
