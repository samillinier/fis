'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { FileText, Calendar, User, Building2, Filter, Search, Download, X, Eye, AlertCircle, Target, TrendingDown, Users, Store, Package, CheckCircle2, ClipboardList, AlertTriangle, FileCheck, Clock, DollarSign, BarChart3, Shield, MessageSquare } from 'lucide-react'

interface FormSubmission {
  id: string
  workroom: string
  metric_type: string
  week_start_date: string
  form_data: any
  submitted_at: string
  created_at: string
  updated_at: string
}

const METRIC_TYPE_LABELS: Record<string, string> = {
  reschedule_rate: 'Reschedule Rate Accountability Report',
  ltr: 'LTR Workroom Performance Report',
  cycle_time: 'Work Cycle Time Corrective Report',
  vendor_debit: 'Vendor Debit Accountability Report',
  job_cycle_time: 'Job Cycle Time Report',
  details_cycle_time: 'Details Cycle Time Report',
}

const METRIC_TYPE_COLORS: Record<string, string> = {
  reschedule_rate: 'bg-red-100 text-red-700 border-red-200',
  ltr: 'bg-blue-100 text-blue-700 border-blue-200',
  cycle_time: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  vendor_debit: 'bg-purple-100 text-purple-700 border-purple-200',
  job_cycle_time: 'bg-orange-100 text-orange-700 border-orange-200',
  details_cycle_time: 'bg-amber-100 text-amber-700 border-amber-200',
}

export default function WorkroomReport() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterWorkroom, setFilterWorkroom] = useState<string>('all')
  const [filterMetricType, setFilterMetricType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    if (!user?.email) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const authHeader = user.email
      const response = await fetch('/api/performance-forms/list', {
        headers: {
          Authorization: `Bearer ${authHeader}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setSubmissions(result.submissions || [])
        console.log(`[WorkroomReport] Loaded ${result.submissions?.length || 0} submissions`)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch submissions' }))
        const errorMessage = errorData.error || 'Failed to fetch submissions'
        console.error('[WorkroomReport] Error fetching submissions:', errorMessage)
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('[WorkroomReport] Error fetching submissions:', err)
      setError(`Failed to fetch submissions: ${err?.message || 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Get unique workrooms and metric types for filters
  const uniqueWorkrooms = Array.from(new Set(submissions.map(s => s.workroom))).sort()
  const uniqueMetricTypes = Array.from(new Set(submissions.map(s => s.metric_type))).sort()

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesWorkroom = filterWorkroom === 'all' || submission.workroom === filterWorkroom
    const matchesMetricType = filterMetricType === 'all' || submission.metric_type === filterMetricType
    const matchesSearch = searchTerm === '' || 
      submission.workroom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      METRIC_TYPE_LABELS[submission.metric_type]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(submission.form_data).toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesWorkroom && matchesMetricType && matchesSearch
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatWeekStart = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    })
  }

  const exportToCSV = () => {
    const headers = ['Workroom', 'Report Type', 'Week Start', 'Submitted At', 'GM Name', 'Current Value']
    const rows = filteredSubmissions.map(sub => {
      const formData = sub.form_data || {}
      const gmName = formData.gmName || formData.gm_name || 'N/A'
      let currentValue = 'N/A'
      
      if (sub.metric_type === 'reschedule_rate') {
        currentValue = formData.currentRescheduleRate ? `${formData.currentRescheduleRate}%` : 'N/A'
      } else if (sub.metric_type === 'ltr') {
        currentValue = formData.currentLTR ? `${formData.currentLTR}%` : 'N/A'
      } else if (sub.metric_type === 'cycle_time') {
        currentValue = formData.currentCycleTime ? `${formData.currentCycleTime} days` : 'N/A'
      } else if (sub.metric_type === 'vendor_debit') {
        currentValue = formData.totalDebitAmount ? `$${formData.totalDebitAmount}` : 'N/A'
      }
      
      return [
        sub.workroom,
        METRIC_TYPE_LABELS[sub.metric_type] || sub.metric_type,
        formatWeekStart(sub.week_start_date),
        formatDate(sub.submitted_at),
        gmName,
        currentValue
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workroom-reports-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Workroom Report</h1>
              <p className="text-gray-600">View all submitted performance forms and accountability reports</p>
            </div>
            {filteredSubmissions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-[#80875d] text-white rounded-lg hover:bg-[#6d7350] transition-colors"
              >
                <Download size={18} />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search size={14} className="inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by workroom, report type, or content..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Workroom Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 size={14} className="inline mr-1" />
                Workroom
              </label>
              <select
                value={filterWorkroom}
                onChange={(e) => setFilterWorkroom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Workrooms</option>
                {uniqueWorkrooms.map(workroom => (
                  <option key={workroom} value={workroom}>{workroom}</option>
                ))}
              </select>
            </div>

            {/* Report Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter size={14} className="inline mr-1" />
                Report Type
              </label>
              <select
                value={filterMetricType}
                onChange={(e) => setFilterMetricType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Reports</option>
                {uniqueMetricTypes.map(metricType => (
                  <option key={metricType} value={metricType}>
                    {METRIC_TYPE_LABELS[metricType] || metricType}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total Submissions</div>
            <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Filtered Results</div>
            <div className="text-2xl font-bold text-gray-900">{filteredSubmissions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Unique Workrooms</div>
            <div className="text-2xl font-bold text-gray-900">{uniqueWorkrooms.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Report Types</div>
            <div className="text-2xl font-bold text-gray-900">{uniqueMetricTypes.length}</div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No submissions found</p>
              <p className="text-sm">
                {submissions.length === 0 
                  ? 'No forms have been submitted yet.' 
                  : 'Try adjusting your filters to see more results.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => {
                const formData = submission.form_data || {}
                const gmName = formData.gmName || formData.gm_name || 'Not provided'
                const weekEnding = formData.weekEnding || submission.week_start_date
                
                let currentValue = 'N/A'
                let currentValueLabel = 'Current Value'
                
                if (submission.metric_type === 'reschedule_rate') {
                  currentValue = formData.currentRescheduleRate ? `${formData.currentRescheduleRate}%` : 'N/A'
                  currentValueLabel = 'Reschedule Rate'
                } else if (submission.metric_type === 'ltr') {
                  currentValue = formData.currentLTR ? `${formData.currentLTR}%` : 'N/A'
                  currentValueLabel = 'LTR'
                } else if (submission.metric_type === 'cycle_time') {
                  currentValue = formData.currentCycleTime ? `${formData.currentCycleTime} days` : 'N/A'
                  currentValueLabel = 'Cycle Time'
                } else if (submission.metric_type === 'vendor_debit') {
                  currentValue = formData.totalDebitAmount ? `$${parseFloat(formData.totalDebitAmount).toLocaleString()}` : 'N/A'
                  currentValueLabel = 'Total Debit Amount'
                }

                return (
                  <div 
                    key={submission.id} 
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${METRIC_TYPE_COLORS[submission.metric_type] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                            {METRIC_TYPE_LABELS[submission.metric_type] || submission.metric_type}
                          </span>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Building2 size={14} />
                            {submission.workroom}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">GM Name</div>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              <User size={14} />
                              {gmName}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Week Ending</div>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              <Calendar size={14} />
                              {formatWeekStart(weekEnding)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">{currentValueLabel}</div>
                            <div className="text-sm font-medium text-gray-900">{currentValue}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Submitted</div>
                            <div className="text-sm font-medium text-gray-900">{formatDate(submission.submitted_at)}</div>
                          </div>
                        </div>

                        {/* Key Details Preview */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">Key Details:</div>
                          <div className="text-sm text-gray-700 space-y-1">
                            {submission.metric_type === 'reschedule_rate' && (
                              <>
                                {formData.totalReschedules && (
                                  <div>Total Reschedules: {formData.totalReschedules}</div>
                                )}
                                {formData.commitmentStatement && (
                                  <div className="italic">"{formData.commitmentStatement.substring(0, 100)}..."</div>
                                )}
                              </>
                            )}
                            {submission.metric_type === 'ltr' && (
                              <>
                                {formData.commitmentStatement && (
                                  <div className="italic">"{formData.commitmentStatement.substring(0, 100)}..."</div>
                                )}
                              </>
                            )}
                            {submission.metric_type === 'cycle_time' && (
                              <>
                                {formData.commitmentStatement && (
                                  <div className="italic">"{formData.commitmentStatement.substring(0, 100)}..."</div>
                                )}
                              </>
                            )}
                            {submission.metric_type === 'vendor_debit' && (
                              <>
                                {formData.numberOfDebits && (
                                  <div>Number of Debits: {formData.numberOfDebits}</div>
                                )}
                                {formData.commitmentStatement && (
                                  <div className="italic">"{formData.commitmentStatement.substring(0, 100)}..."</div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Report Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${
                    selectedSubmission.metric_type === 'reschedule_rate' ? 'bg-red-100' :
                    selectedSubmission.metric_type === 'ltr' ? 'bg-blue-100' :
                    selectedSubmission.metric_type === 'cycle_time' ? 'bg-yellow-100' :
                    selectedSubmission.metric_type === 'vendor_debit' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    {selectedSubmission.metric_type === 'reschedule_rate' && <AlertCircle className="text-red-600" size={24} />}
                    {selectedSubmission.metric_type === 'ltr' && <Target className="text-blue-600" size={24} />}
                    {selectedSubmission.metric_type === 'cycle_time' && <Clock className="text-yellow-600" size={24} />}
                    {selectedSubmission.metric_type === 'vendor_debit' && <DollarSign className="text-purple-600" size={24} />}
                    {!['reschedule_rate', 'ltr', 'cycle_time', 'vendor_debit'].includes(selectedSubmission.metric_type) && <FileText className="text-gray-600" size={24} />}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {METRIC_TYPE_LABELS[selectedSubmission.metric_type] || selectedSubmission.metric_type}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <Building2 size={14} />
                      {selectedSubmission.workroom} • <Calendar size={14} /> Submitted {formatDate(selectedSubmission.submitted_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-8">
                  <ReportDetailView submission={selectedSubmission} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Component to display full report details
function ReportDetailView({ submission }: { submission: FormSubmission }) {
  const formData = submission.form_data || {}

  const renderRescheduleRateReport = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
      {/* Workroom Information */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
          <Building2 size={20} className="text-gray-600" />
          WORKROOM INFORMATION
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workroom:</label>
            <div className="text-base font-semibold text-gray-900">{formData.workroom || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GM Completing Report:</label>
            <div className="text-base font-semibold text-gray-900">{formData.gmName || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Ending:</label>
            <div className="text-base font-semibold text-gray-900">{formData.weekEnding || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Reschedule Rate:</label>
            <div className="text-base font-semibold text-gray-900">
              {formData.currentRescheduleRate ? `${formData.currentRescheduleRate}%` : 'N/A'}
              {formData.currentRescheduleRate && <span className="text-sm text-gray-500 ml-2">(Target: 20% or Lower)</span>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Reschedules This Week:</label>
            <div className="text-base font-semibold text-gray-900">{formData.totalReschedules || 'N/A'}</div>
          </div>
        </div>
      </section>

      {/* Reschedule Category Breakdown */}
      {(formData.customerNotHome || formData.customerScheduleChange || formData.incorrectDetail || formData.installerNoCallNoShow) && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <BarChart3 size={20} className="text-gray-600" />
            1. RESCHEDULE CATEGORY BREAKDOWN
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Identify the cause of each reschedule. Check all that apply.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {(formData.customerNotHome || formData.customerScheduleChange || formData.customerUnprepared || formData.customerRequestedDifferentDate) && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Customer-Driven</h3>
                <div className="space-y-1 text-sm">
                  {formData.customerNotHome && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Customer not home</div>}
                  {formData.customerScheduleChange && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Customer schedule change</div>}
                  {formData.customerUnprepared && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Customer unprepared</div>}
                  {formData.customerRequestedDifferentDate && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Customer requested different installation date</div>}
                </div>
              </div>
            )}
            {(formData.incorrectDetail || formData.scopeMismatch || formData.measurementIssue || formData.communicationFailure) && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Workroom / Operational</h3>
                <div className="space-y-1 text-sm">
                  {formData.incorrectDetail && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Incorrect detail</div>}
                  {formData.scopeMismatch && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Scope mismatch / missing scope</div>}
                  {formData.measurementIssue && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Measurement or POD issue</div>}
                  {formData.communicationFailure && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Communication failure with installer</div>}
                </div>
              </div>
            )}
            {(formData.installerNoCallNoShow || formData.installerRunningLate || formData.installerDeclinedJob) && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Installer-Driven</h3>
                <div className="space-y-1 text-sm">
                  {formData.installerNoCallNoShow && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Installer no call/no show</div>}
                  {formData.installerRunningLate && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Installer running late / unavailable</div>}
                  {formData.installerDeclinedJob && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Installer declined job</div>}
                </div>
              </div>
            )}
            {(formData.materialNotAvailable || formData.materialIncorrect || formData.storeDelay) && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Store / Inventory</h3>
                <div className="space-y-1 text-sm">
                  {formData.materialNotAvailable && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Material not available</div>}
                  {formData.materialIncorrect && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Material incorrect / damaged</div>}
                  {formData.storeDelay && <div className="flex items-center gap-2"><span className="text-green-600">✓</span> Store delay (pickup, order, or staging issue)</div>}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Top 3 Reschedule Cases */}
      {(formData.case1Customer || formData.case2Customer || formData.case3Customer) && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            2. TOP 3 RESCHEDULE CASES DRIVING THE RATE
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Provide detail on the reschedules with the largest customer or operational impact.
          </p>
          <div className="space-y-6">
            {formData.case1Customer && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">1. Customer / Job #: {formData.case1Customer}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cause of Reschedule:</label>
                    <div className="text-sm text-gray-900">{formData.case1Cause || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.case1Action || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            {formData.case2Customer && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">2. Customer / Job #: {formData.case2Customer}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cause of Reschedule:</label>
                    <div className="text-sm text-gray-900">{formData.case2Cause || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.case2Action || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            {formData.case3Customer && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">3. Customer / Job #: {formData.case3Customer}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cause of Reschedule:</label>
                    <div className="text-sm text-gray-900">{formData.case3Cause || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.case3Action || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Installer Accountability Review */}
      {(formData.installerIssues === 'yes' || formData.installerDetails) && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Users size={20} className="text-purple-600" />
            5. INSTALLER ACCOUNTABILITY REVIEW
          </h2>
          <div className="mb-3">
            <div className="text-sm text-gray-700 mb-2">
              Did specific installers cause multiple reschedules?
              <span className="ml-2 font-semibold">{formData.installerIssues === 'yes' ? 'Yes' : formData.installerIssues === 'no' ? 'No' : 'N/A'}</span>
            </div>
            {formData.installerIssues === 'yes' && formData.installerDetails && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">If yes, list installer(s) & action plan:</label>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.installerDetails}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Store & Material Impact Review */}
      {(formData.storeIssues === 'yes' || formData.storeIssuesDescription) && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            6. STORE & MATERIAL IMPACT REVIEW
          </h2>
          <div className="mb-3">
            <div className="text-sm text-gray-700 mb-2">
              Did store issues or material problems contribute?
              <span className="ml-2 font-semibold">{formData.storeIssues === 'yes' ? 'Yes' : formData.storeIssues === 'no' ? 'No' : 'N/A'}</span>
            </div>
            {formData.storeIssues === 'yes' && formData.storeIssuesDescription && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">If yes, explain:</label>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.storeIssuesDescription}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Customer Impact */}
      {(formData.customerImpact === 'yes' || formData.customerImpactExplanation) && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <MessageSquare size={20} className="text-pink-600" />
            7. CUSTOMER IMPACT
          </h2>
          <div className="mb-3">
            <div className="text-sm text-gray-700 mb-2">
              Did these reschedules result in customer dissatisfaction or LTR drops?
              <span className="ml-2 font-semibold">{formData.customerImpact === 'yes' ? 'Yes' : formData.customerImpact === 'no' ? 'No' : 'N/A'}</span>
            </div>
            {formData.customerImpact === 'yes' && formData.customerImpactExplanation && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">If yes, explain:</label>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.customerImpactExplanation}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Immediate Corrective Actions */}
      {formData.immediateActions && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Clock size={20} className="text-orange-600" />
            3. IMMEDIATE CORRECTIVE ACTIONS (Next 24 Hours)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Actions to stabilize rescheduling and protect cycle times.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.immediateActions}</p>
          </div>
        </section>
      )}

      {/* Preventative Actions */}
      {formData.preventativeActions && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            4. PREVENTATIVE ACTIONS (Next 72 Hours)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Operational changes to prevent similar reschedules this week.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.preventativeActions}</p>
          </div>
        </section>
      )}

      {/* GM Commitment Statement */}
      {formData.commitmentStatement && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <FileCheck size={20} className="text-green-600" />
            8. GM COMMITMENT STATEMENT
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            State the single biggest change you will implement immediately to reduce reschedules and return performance to target.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.commitmentStatement}</p>
          </div>
          {formData.gmSignature && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GM Signature:</label>
                <div className="text-2xl font-signature text-gray-900" style={{ fontFamily: "'Dancing Script', 'Brush Script MT', 'Lucida Handwriting', 'Kalam', cursive", fontSize: '2rem', letterSpacing: '0.05em', fontWeight: '500' }}>
                  {formData.gmSignature}
                </div>
              </div>
              {formData.signatureDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                  <div className="text-base font-semibold text-gray-900">{formData.signatureDate}</div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )

  const renderLTRReport = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
      {/* Workroom Information */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
          <Building2 size={20} className="text-blue-600" />
          WORKROOM INFORMATION
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workroom:</label>
            <div className="text-base font-semibold text-gray-900">{formData.workroom || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GM Completing Report:</label>
            <div className="text-base font-semibold text-gray-900">{formData.gmName || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Ending:</label>
            <div className="text-base font-semibold text-gray-900">{formData.weekEnding || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current LTR:</label>
            <div className="text-base font-semibold text-gray-900">
              {formData.currentLTR ? `${formData.currentLTR}%` : 'N/A'}
              {formData.currentLTR && <span className="text-sm text-gray-500 ml-2">(Target: 85%)</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Top 3 Impact Jobs */}
      {(formData.job1Customer || formData.job2Customer || formData.job3Customer) && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600" />
            2. TOP 3 IMPACT JOBS
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Provide the three customer jobs that most negatively affected LTR.
          </p>
          <div className="space-y-6">
            {formData.job1Customer && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">1. Customer / Job #: {formData.job1Customer}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Summary:</label>
                    <div className="text-sm text-gray-900">{formData.job1Issue || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.job1Action || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            {formData.job2Customer && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">2. Customer / Job #: {formData.job2Customer}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Summary:</label>
                    <div className="text-sm text-gray-900">{formData.job2Issue || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.job2Action || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            {formData.job3Customer && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">3. Customer / Job #: {formData.job3Customer}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Summary:</label>
                    <div className="text-sm text-gray-900">{formData.job3Issue || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.job3Action || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Immediate Corrective Actions */}
      {formData.immediateActions && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            3. IMMEDIATE CORRECTIVE ACTIONS (Next 24 Hours)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            List the actions you will execute today.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.immediateActions}</p>
          </div>
        </section>
      )}

      {/* Preventative Actions */}
      {formData.preventativeActions && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            4. PREVENTATIVE ACTIONS (Next 72 Hours)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Steps to prevent repeat issues this week.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.preventativeActions}</p>
          </div>
        </section>
      )}

      {/* GM Commitment Statement - LTR */}
      {formData.commitmentStatement && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <FileCheck size={20} className="text-green-600" />
            7. GM COMMITMENT STATEMENT
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Identify one, and only one, operational change you will implement immediately to restore LTR to standard.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.commitmentStatement}</p>
          </div>
          {formData.gmSignature && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GM Signature:</label>
                <div className="text-2xl font-signature text-gray-900" style={{ fontFamily: "'Dancing Script', 'Brush Script MT', 'Lucida Handwriting', 'Kalam', cursive", fontSize: '2rem', letterSpacing: '0.05em', fontWeight: '500' }}>
                  {formData.gmSignature}
                </div>
              </div>
              {formData.signatureDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                  <div className="text-base font-semibold text-gray-900">{formData.signatureDate}</div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )

  const renderCycleTimeReport = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
      {/* Workroom Information */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
          <Building2 size={20} className="text-yellow-600" />
          WORKROOM INFORMATION
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workroom:</label>
            <div className="text-base font-semibold text-gray-900">{formData.workroom || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GM Completing Report:</label>
            <div className="text-base font-semibold text-gray-900">{formData.gmName || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Ending:</label>
            <div className="text-base font-semibold text-gray-900">{formData.weekEnding || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Overall Cycle Time:</label>
            <div className="text-base font-semibold text-gray-900">
              {formData.currentCycleTime ? `${formData.currentCycleTime} Days` : 'N/A'}
              {formData.currentCycleTime && <span className="text-sm text-gray-500 ml-2">(Target: 12 Days)</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Cycle Time by Category */}
      {(formData.carpetDays || formData.vinylDays || formData.laminateDays || formData.lvpDays || formData.hardwoodDays || formData.tileDays) && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            1. CYCLE TIME BY CATEGORY (Required)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Provide the current average cycle days for each category.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {formData.carpetDays && (
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Carpet:</div>
                <div className="text-base font-semibold text-gray-900">{formData.carpetDays} days</div>
              </div>
            )}
            {formData.vinylDays && (
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Vinyl / Sheet Goods:</div>
                <div className="text-base font-semibold text-gray-900">{formData.vinylDays} days</div>
              </div>
            )}
            {formData.laminateDays && (
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Laminate:</div>
                <div className="text-base font-semibold text-gray-900">{formData.laminateDays} days</div>
              </div>
            )}
            {formData.lvpDays && (
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">LVP:</div>
                <div className="text-base font-semibold text-gray-900">{formData.lvpDays} days</div>
              </div>
            )}
            {formData.hardwoodDays && (
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Hardwood:</div>
                <div className="text-base font-semibold text-gray-900">{formData.hardwoodDays} days</div>
              </div>
            )}
            {formData.tileDays && (
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Tile:</div>
                <div className="text-base font-semibold text-gray-900">{formData.tileDays} days</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Top 3 Jobs Impacting Cycle Time */}
      {(formData.job1Customer || formData.job2Customer || formData.job3Customer) && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <TrendingDown size={20} className="text-red-600" />
            3. TOP 3 JOBS IMPACTING CYCLE TIME
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            List the three jobs with the highest delays.
          </p>
          <div className="space-y-6">
            {formData.job1Customer && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">1. Customer / Job #: {formData.job1Customer}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cause of Delay:</label>
                    <div className="text-sm text-gray-900">{formData.job1Cause || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.job1Action || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            {formData.job2Customer && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">2. Customer / Job #: {formData.job2Customer}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cause of Delay:</label>
                    <div className="text-sm text-gray-900">{formData.job2Cause || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.job2Action || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            {formData.job3Customer && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">3. Customer / Job #: {formData.job3Customer}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cause of Delay:</label>
                    <div className="text-sm text-gray-900">{formData.job3Cause || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{formData.job3Action || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Immediate Corrective Actions */}
      {formData.immediateActions && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            4. IMMEDIATE CORRECTIVE ACTIONS (Next 24 Hours)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Actions to pull jobs forward and close delay gaps immediately.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.immediateActions}</p>
          </div>
        </section>
      )}

      {/* Preventative Actions - Cycle Time */}
      {formData.preventativeActions && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            5. PREVENTATIVE ACTIONS (Next 72 Hours)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Operational changes to stabilize cycle time moving forward.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.preventativeActions}</p>
          </div>
        </section>
      )}

      {/* GM Commitment Statement */}
      {formData.commitmentStatement && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            8. GM COMMITMENT STATEMENT
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            One operational change you will implement immediately to return cycle time to standard.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.commitmentStatement}</p>
          </div>
          {formData.gmSignature && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GM Signature:</label>
                <div className="text-2xl font-signature text-gray-900" style={{ fontFamily: "'Dancing Script', 'Brush Script MT', 'Lucida Handwriting', 'Kalam', cursive", fontSize: '2rem', letterSpacing: '0.05em', fontWeight: '500' }}>
                  {formData.gmSignature}
                </div>
              </div>
              {formData.signatureDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                  <div className="text-base font-semibold text-gray-900">{formData.signatureDate}</div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )

  const renderVendorDebitReport = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
      {/* Workroom Information */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
          <Building2 size={20} className="text-purple-600" />
          WORKROOM INFORMATION
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workroom:</label>
            <div className="text-base font-semibold text-gray-900">{formData.workroom || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GM Completing Report:</label>
            <div className="text-base font-semibold text-gray-900">{formData.gmName || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Ending:</label>
            <div className="text-base font-semibold text-gray-900">{formData.weekEnding || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Vendor Debit Amount:</label>
            <div className="text-base font-semibold text-gray-900">
              {formData.totalDebitAmount ? `$${parseFloat(formData.totalDebitAmount).toLocaleString()}` : 'N/A'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"># of Debits Received This Week:</label>
            <div className="text-base font-semibold text-gray-900">{formData.numberOfDebits || 'N/A'}</div>
          </div>
        </div>
      </section>

      {/* Vendor Debit Details */}
      {formData.debits && Array.isArray(formData.debits) && formData.debits.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <DollarSign size={20} className="text-purple-600" />
            1. VENDOR DEBIT DETAILS (Required for Each Debit)
          </h2>
          <div className="space-y-6">
            {formData.debits.map((debit: any, index: number) => (
              <div key={index} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">Debit #{index + 1}</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {debit.storeNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lowe's Store #:</label>
                      <div className="text-sm font-semibold text-gray-900">{debit.storeNumber}</div>
                    </div>
                  )}
                  {debit.customerJob && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer / Job #:</label>
                      <div className="text-sm font-semibold text-gray-900">{debit.customerJob}</div>
                    </div>
                  )}
                  {debit.debitAmount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Debit Amount:</label>
                      <div className="text-sm font-semibold text-gray-900">${parseFloat(debit.debitAmount).toLocaleString()}</div>
                    </div>
                  )}
                </div>
                {debit.summary && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Summary of What Happened:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap p-3 bg-white rounded border border-gray-200">{debit.summary}</div>
                  </div>
                )}
                {debit.correctiveAction && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap p-3 bg-white rounded border border-gray-200">{debit.correctiveAction}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GM Commitment Statement */}
      {formData.commitmentStatement && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            6. GM COMMITMENT STATEMENT
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            One operational change you will implement immediately to reduce vendor debits moving forward.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.commitmentStatement}</p>
          </div>
          {formData.gmSignature && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GM Signature:</label>
                <div className="text-2xl font-signature text-gray-900" style={{ fontFamily: "'Dancing Script', 'Brush Script MT', 'Lucida Handwriting', 'Kalam', cursive", fontSize: '2rem', letterSpacing: '0.05em', fontWeight: '500' }}>
                  {formData.gmSignature}
                </div>
              </div>
              {formData.signatureDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                  <div className="text-base font-semibold text-gray-900">{formData.signatureDate}</div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )

  // Render based on metric type
  switch (submission.metric_type) {
    case 'reschedule_rate':
      return renderRescheduleRateReport()
    case 'ltr':
      return renderLTRReport()
    case 'cycle_time':
      return renderCycleTimeReport()
    case 'vendor_debit':
      return renderVendorDebitReport()
    default:
      return (
        <div className="p-4">
          <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )
  }
}

