'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'
import { AlertCircle, ArrowLeft } from 'lucide-react'

interface LTRFormProps {
  workroom: string
}

export default function LTRForm({ workroom }: LTRFormProps) {
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
    currentLTR: '',
    
    // Root Cause Identification
    poorCommunication: false,
    arrivalWindowMissed: false,
    lackOfFollowUp: false,
    expectationsNotSet: false,
    professionalismConcerns: false,
    installQualityIssue: false,
    scopeMisunderstanding: false,
    noCallNoShow: false,
    reschedule: false,
    inventoryIssue: false,
    detailError: false,
    cycleTimeDelay: false,
    incorrectInstallerAssignment: false,
    workroomCoverageIssue: false,
    other: false,
    otherDescription: '',
    
    // Top 3 Impact Jobs
    job1Customer: '',
    job1Issue: '',
    job1Action: '',
    job2Customer: '',
    job2Issue: '',
    job2Action: '',
    job3Customer: '',
    job3Issue: '',
    job3Action: '',
    
    // Immediate Corrective Actions
    immediateActions: '',
    
    // Preventative Actions
    preventativeActions: '',
    
    // Installer Accountability Review
    installerIssues: 'no',
    installerDetails: '',
    
    // Customer Follow-Up Status
    customersContacted: 'no',
    followUpExplanation: '',
    followUpSummary: '',
    
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
    
    if (!formData.workroom || !formData.gmName || !formData.currentLTR) {
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
          metric_type: 'ltr',
          form_data: formData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('LTR form submitted successfully:', result)
        showNotification('LTR Workroom Performance Report submitted successfully', 'success')
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
                  FIS – LTR WORKROOM PERFORMANCE REPORT
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Required When Weekly LTR Falls Below 85%
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
                  Current LTR: <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="currentLTR"
                    value={formData.currentLTR}
                    onChange={handleInputChange}
                    required
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-600">%</span>
                  <span className="text-sm text-gray-500">(Target: 85%)</span>
                </div>
              </div>
            </div>
          </section>

          {/* 1. ROOT CAUSE IDENTIFICATION */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              1. ROOT CAUSE IDENTIFICATION
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select all areas contributing to reduced LTR performance.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Customer Experience</h3>
                <div className="space-y-2 ml-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="poorCommunication"
                      checked={formData.poorCommunication}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Poor communication</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="arrivalWindowMissed"
                      checked={formData.arrivalWindowMissed}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Arrival window missed</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="lackOfFollowUp"
                      checked={formData.lackOfFollowUp}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Lack of follow-up</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="expectationsNotSet"
                      checked={formData.expectationsNotSet}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Expectations not set properly</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Installer-Related</h3>
                <div className="space-y-2 ml-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="professionalismConcerns"
                      checked={formData.professionalismConcerns}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Professionalism concerns</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="installQualityIssue"
                      checked={formData.installQualityIssue}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Install quality issue</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="scopeMisunderstanding"
                      checked={formData.scopeMisunderstanding}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Scope misunderstanding</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="noCallNoShow"
                      checked={formData.noCallNoShow}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">No call / No show</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Operational</h3>
                <div className="space-y-2 ml-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="reschedule"
                      checked={formData.reschedule}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Reschedule</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="inventoryIssue"
                      checked={formData.inventoryIssue}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Inventory issue</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="detailError"
                      checked={formData.detailError}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Detail error</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="cycleTimeDelay"
                      checked={formData.cycleTimeDelay}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Cycle time delay</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="incorrectInstallerAssignment"
                      checked={formData.incorrectInstallerAssignment}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Incorrect installer assignment</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="workroomCoverageIssue"
                      checked={formData.workroomCoverageIssue}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Workroom coverage issue</span>
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

          {/* 2. TOP 3 IMPACT JOBS */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              2. TOP 3 IMPACT JOBS
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Provide the three customer jobs that most negatively affected LTR.
            </p>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Job 1:</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer / Job #:
                  </label>
                  <input
                    type="text"
                    name="job1Customer"
                    value={formData.job1Customer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Summary:
                  </label>
                  <input
                    type="text"
                    name="job1Issue"
                    value={formData.job1Issue}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corrective Action Taken:
                  </label>
                  <textarea
                    name="job1Action"
                    value={formData.job1Action}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Job 2:</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer / Job #:
                  </label>
                  <input
                    type="text"
                    name="job2Customer"
                    value={formData.job2Customer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Summary:
                  </label>
                  <input
                    type="text"
                    name="job2Issue"
                    value={formData.job2Issue}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corrective Action Taken:
                  </label>
                  <textarea
                    name="job2Action"
                    value={formData.job2Action}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Job 3:</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer / Job #:
                  </label>
                  <input
                    type="text"
                    name="job3Customer"
                    value={formData.job3Customer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Summary:
                  </label>
                  <input
                    type="text"
                    name="job3Issue"
                    value={formData.job3Issue}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corrective Action Taken:
                  </label>
                  <textarea
                    name="job3Action"
                    value={formData.job3Action}
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
              List the actions you will execute today.
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
              Steps to prevent repeat issues this week.
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
                Did a specific installer contribute to multiple issues?
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
                  If yes, list installer & action plan:
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

          {/* 6. CUSTOMER FOLLOW-UP STATUS */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              6. CUSTOMER FOLLOW-UP STATUS
            </h2>
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-3">
                Have all low-score or dissatisfied customers been contacted?
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="customersContacted"
                    value="yes"
                    checked={formData.customersContacted === 'yes'}
                    onChange={() => handleRadioChange('customersContacted', 'yes')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="customersContacted"
                    value="no"
                    checked={formData.customersContacted === 'no'}
                    onChange={() => handleRadioChange('customersContacted', 'no')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
            {formData.customersContacted === 'no' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explain:
                </label>
                <input
                  type="text"
                  name="followUpExplanation"
                  value={formData.followUpExplanation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  placeholder="Explain why customers were not contacted..."
                />
              </div>
            )}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Follow-Up Summary:
              </label>
              <textarea
                name="followUpSummary"
                value={formData.followUpSummary}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Summarize customer follow-up actions..."
              />
            </div>
          </section>

          {/* 7. GM COMMITMENT STATEMENT */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              7. GM COMMITMENT STATEMENT
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Identify one, and only one, operational change you will implement immediately to restore LTR to standard.
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

