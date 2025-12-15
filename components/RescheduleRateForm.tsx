'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'
import { AlertCircle, X, ArrowLeft } from 'lucide-react'

interface RescheduleRateFormProps {
  workroom: string
}

export default function RescheduleRateForm({ workroom }: RescheduleRateFormProps) {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  
  // Get current week ending date (Sunday)
  const getWeekEnding = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    const weekEnding = new Date(today)
    weekEnding.setDate(today.getDate() + daysUntilSunday)
    return weekEnding.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    // Workroom Information
    workroom: workroom || '',
    gmName: '',
    weekEnding: getWeekEnding(),
    currentRescheduleRate: '',
    totalReschedules: '',
    
    // Reschedule Category Breakdown
    customerNotHome: false,
    customerScheduleChange: false,
    customerUnprepared: false,
    customerRequestedDifferentDate: false,
    incorrectDetail: false,
    scopeMismatch: false,
    measurementIssue: false,
    communicationFailure: false,
    materialNotVerified: false,
    wrongInstallerAssigned: false,
    scheduleWithoutConfirmation: false,
    installerNoShow: false,
    installerLate: false,
    installerDeclined: false,
    installerDidNotReview: false,
    materialNotAvailable: false,
    materialIncorrect: false,
    storeDelay: false,
    other: false,
    otherDescription: '',
    
    // Top 3 Reschedule Cases
    case1Customer: '',
    case1Cause: '',
    case1Action: '',
    case2Customer: '',
    case2Cause: '',
    case2Action: '',
    case3Customer: '',
    case3Cause: '',
    case3Action: '',
    
    // Immediate Corrective Actions
    immediateActions: '',
    
    // Preventative Actions
    preventativeActions: '',
    
    // Installer Accountability Review
    installerIssues: 'no',
    installerDetails: '',
    
    // Store & Material Impact Review
    storeIssues: 'no',
    storeDetails: '',
    
    // Customer Impact
    customerImpact: 'no',
    customerImpactDetails: '',
    
    // GM Commitment Statement
    commitmentStatement: '',
    gmSignature: '',
    signatureDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (workroom) {
      setFormData(prev => ({ ...prev, workroom }))
    }
  }, [workroom])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.workroom || !formData.gmName || !formData.currentRescheduleRate || !formData.totalReschedules) {
      showNotification('Please fill in all required fields in Workroom Information section', 'error')
      return
    }

    if (!user?.email) {
      showNotification('User not authenticated', 'error')
      return
    }

    setSubmitting(true)
    try {
      const authHeader = user.email
      const response = await fetch('/api/performance-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authHeader}`,
        },
        body: JSON.stringify({
          workroom: formData.workroom,
          metric_type: 'reschedule_rate',
          form_data: formData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Reschedule Rate form submitted successfully:', result)
        showNotification('Reschedule Rate Accountability Report submitted successfully', 'success')
        router.push('/')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to submit form:', errorData)
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.error || 'Failed to submit form'
        showNotification(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      showNotification('Failed to submit form', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-green-100">
                <AlertCircle className="text-green-600" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  FIS – RESCHEDULE RATE ACCOUNTABILITY REPORT
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Required When Weekly Reschedule Rate Exceeds 20%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* WORKROOM INFORMATION */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              WORKROOM INFORMATION
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workroom: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="workroom"
                  value={formData.workroom}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GM Completing Report: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="gmName"
                  value={formData.gmName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Week Ending: <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="weekEnding"
                  value={formData.weekEnding}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Reschedule Rate: <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="currentRescheduleRate"
                    value={formData.currentRescheduleRate}
                    onChange={handleInputChange}
                    required
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-600">%</span>
                  <span className="text-sm text-gray-500">(Target: 20% or Lower)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Reschedules This Week: <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="totalReschedules"
                  value={formData.totalReschedules}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </section>

          {/* 1. RESCHEDULE CATEGORY BREAKDOWN */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              1. RESCHEDULE CATEGORY BREAKDOWN
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Identify the cause of each reschedule. Check all that apply.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Customer-Driven</h3>
                <div className="space-y-2 ml-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="customerNotHome"
                      checked={formData.customerNotHome}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Customer not home</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="customerScheduleChange"
                      checked={formData.customerScheduleChange}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Customer schedule change</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="customerUnprepared"
                      checked={formData.customerUnprepared}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Customer unprepared (furniture, demo, pets, access, etc.)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="customerRequestedDifferentDate"
                      checked={formData.customerRequestedDifferentDate}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Customer requested different installation date</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Workroom / Operational</h3>
                <div className="space-y-2 ml-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="incorrectDetail"
                      checked={formData.incorrectDetail}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Incorrect detail</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="scopeMismatch"
                      checked={formData.scopeMismatch}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Scope mismatch / missing scope</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="measurementIssue"
                      checked={formData.measurementIssue}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Measurement or POD issue</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="communicationFailure"
                      checked={formData.communicationFailure}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Communication failure with installer</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="materialNotVerified"
                      checked={formData.materialNotVerified}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Material not verified prior to scheduling</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="wrongInstallerAssigned"
                      checked={formData.wrongInstallerAssigned}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Wrong installer assigned</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="scheduleWithoutConfirmation"
                      checked={formData.scheduleWithoutConfirmation}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Schedule created without installer confirmation</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Installer-Driven</h3>
                <div className="space-y-2 ml-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="installerNoShow"
                      checked={formData.installerNoShow}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Installer no call/no show</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="installerLate"
                      checked={formData.installerLate}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Installer running late / unavailable</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="installerDeclined"
                      checked={formData.installerDeclined}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Installer declined job</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="installerDidNotReview"
                      checked={formData.installerDidNotReview}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Installer did not review scope prior to arrival</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Store / Inventory</h3>
                <div className="space-y-2 ml-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="materialNotAvailable"
                      checked={formData.materialNotAvailable}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Material not available</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="materialIncorrect"
                      checked={formData.materialIncorrect}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Material incorrect / damaged</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="storeDelay"
                      checked={formData.storeDelay}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Store delay (pickup, order, or staging issue)</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Other</h3>
                <div className="ml-4">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      name="other"
                      checked={formData.other}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Other</span>
                  </label>
                  {formData.other && (
                    <textarea
                      name="otherDescription"
                      value={formData.otherDescription}
                      onChange={handleInputChange}
                      placeholder="Please describe..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. TOP 3 RESCHEDULE CASES */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              2. TOP 3 RESCHEDULE CASES DRIVING THE RATE
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Provide detail on the reschedules with the largest customer or operational impact.
            </p>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Case 1:</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer / Job #:
                  </label>
                  <input
                    type="text"
                    name="case1Customer"
                    value={formData.case1Customer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cause of Reschedule:
                  </label>
                  <input
                    type="text"
                    name="case1Cause"
                    value={formData.case1Cause}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corrective Action Taken:
                  </label>
                  <textarea
                    name="case1Action"
                    value={formData.case1Action}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Case 2:</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer / Job #:
                  </label>
                  <input
                    type="text"
                    name="case2Customer"
                    value={formData.case2Customer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cause of Reschedule:
                  </label>
                  <input
                    type="text"
                    name="case2Cause"
                    value={formData.case2Cause}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corrective Action Taken:
                  </label>
                  <textarea
                    name="case2Action"
                    value={formData.case2Action}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Case 3:</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer / Job #:
                  </label>
                  <input
                    type="text"
                    name="case3Customer"
                    value={formData.case3Customer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cause of Reschedule:
                  </label>
                  <input
                    type="text"
                    name="case3Cause"
                    value={formData.case3Cause}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corrective Action Taken:
                  </label>
                  <textarea
                    name="case3Action"
                    value={formData.case3Action}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 3. IMMEDIATE CORRECTIVE ACTIONS */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              3. IMMEDIATE CORRECTIVE ACTIONS (Next 24 Hours)
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Actions to stabilize rescheduling and protect cycle times.
            </p>
            <textarea
              name="immediateActions"
              value={formData.immediateActions}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe immediate actions to be taken in the next 24 hours..."
            />
          </section>

          {/* 4. PREVENTATIVE ACTIONS */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              4. PREVENTATIVE ACTIONS (Next 72 Hours)
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Operational changes to prevent similar reschedules this week.
            </p>
            <textarea
              name="preventativeActions"
              value={formData.preventativeActions}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe preventative actions to be taken in the next 72 hours..."
            />
          </section>

          {/* 5. INSTALLER ACCOUNTABILITY REVIEW */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              5. INSTALLER ACCOUNTABILITY REVIEW
            </h2>
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-3">
                Did specific installers cause multiple reschedules?
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="installerIssues"
                    value="yes"
                    checked={formData.installerIssues === 'yes'}
                    onChange={() => handleRadioChange('installerIssues', 'yes')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="installerIssues"
                    value="no"
                    checked={formData.installerIssues === 'no'}
                    onChange={() => handleRadioChange('installerIssues', 'no')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
            {formData.installerIssues === 'yes' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  If yes, list installer(s) & action plan:
                </label>
                <textarea
                  name="installerDetails"
                  value={formData.installerDetails}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="List installers and action plan..."
                />
              </div>
            )}
          </section>

          {/* 6. STORE & MATERIAL IMPACT REVIEW */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              6. STORE & MATERIAL IMPACT REVIEW
            </h2>
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-3">
                Did store issues or material problems contribute?
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="storeIssues"
                    value="yes"
                    checked={formData.storeIssues === 'yes'}
                    onChange={() => handleRadioChange('storeIssues', 'yes')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="storeIssues"
                    value="no"
                    checked={formData.storeIssues === 'no'}
                    onChange={() => handleRadioChange('storeIssues', 'no')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
            {formData.storeIssues === 'yes' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  If yes, explain:
                </label>
                <textarea
                  name="storeDetails"
                  value={formData.storeDetails}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Explain store and material issues..."
                />
              </div>
            )}
          </section>

          {/* 7. CUSTOMER IMPACT */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              7. CUSTOMER IMPACT
            </h2>
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-3">
                Did these reschedules result in customer dissatisfaction or LTR drops?
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="customerImpact"
                    value="yes"
                    checked={formData.customerImpact === 'yes'}
                    onChange={() => handleRadioChange('customerImpact', 'yes')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="customerImpact"
                    value="no"
                    checked={formData.customerImpact === 'no'}
                    onChange={() => handleRadioChange('customerImpact', 'no')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
            {formData.customerImpact === 'yes' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  If yes, explain:
                </label>
                <textarea
                  name="customerImpactDetails"
                  value={formData.customerImpactDetails}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Explain customer impact..."
                />
              </div>
            )}
          </section>

          {/* 8. GM COMMITMENT STATEMENT */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              8. GM COMMITMENT STATEMENT
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              State the single biggest change you will implement immediately to reduce reschedules and return performance to target.
            </p>
            <textarea
              name="commitmentStatement"
              value={formData.commitmentStatement}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your commitment statement..."
            />
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GM Signature: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="gmSignature"
                  value={formData.gmSignature}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ 
                    fontFamily: "'Dancing Script', 'Brush Script MT', 'Lucida Handwriting', 'Kalam', cursive",
                    fontSize: '2rem',
                    letterSpacing: '0.05em',
                    fontWeight: '500'
                  }}
                  placeholder="Sign here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date: <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="signatureDate"
                  value={formData.signatureDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#80875d] text-white rounded-md hover:bg-[#6d7350] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



