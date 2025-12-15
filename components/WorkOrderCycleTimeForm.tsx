'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'
import { AlertCircle, ArrowLeft } from 'lucide-react'

interface WorkOrderCycleTimeFormProps {
  workroom: string
}

export default function WorkOrderCycleTimeForm({ workroom }: WorkOrderCycleTimeFormProps) {
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
    currentCycleTime: '',
    
    // Cycle Time by Category
    carpetDays: '',
    vinylDays: '',
    laminateDays: '',
    lvpDays: '',
    hardwoodDays: '',
    tileDays: '',
    otherCategory: '',
    otherDays: '',
    
    // Root Cause Identification - Scheduling
    delayedCustomerContact: false,
    incorrectInstallerAssignment: false,
    installerAvailabilityIssues: false,
    poorArrivalCoordination: false,
    reschedulesImpactingFlow: false,
    
    // Root Cause Identification - Details & Admin Flow
    detailErrors: false,
    incorrectMeasurements: false,
    missingJobInformation: false,
    
    // Root Cause Identification - Inventory & Store Issues
    materialNotAvailable: false,
    incorrectMaterialDelivered: false,
    storeProcessingDelays: false,
    
    // Root Cause Identification - Installer-Related
    installerCancelNoShow: false,
    installersNotPullingJobsForward: false,
    slowJobCompletionPace: false,
    
    // Root Cause Identification - Other
    otherCause: false,
    otherCauseDescription: '',
    
    // Top 3 Jobs Impacting Cycle Time
    job1Customer: '',
    job1Cause: '',
    job1Action: '',
    job2Customer: '',
    job2Cause: '',
    job2Action: '',
    job3Customer: '',
    job3Cause: '',
    job3Action: '',
    
    // Immediate Corrective Actions
    immediateActions: '',
    
    // Preventative Actions
    preventativeActions: '',
    
    // Installer Accountability Review
    installerIssues: 'no',
    installerDetails: '',
    
    // Store & Inventory Issues
    storeIssues: 'no',
    storeIssuesDescription: '',
    
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
    
    if (!formData.workroom || !formData.gmName || !formData.currentCycleTime) {
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
          metric_type: 'work_order_cycle_time',
          form_data: formData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Work Order Cycle Time form submitted successfully:', result)
        showNotification('Work Order Cycle Time Corrective Report submitted successfully', 'success')
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
                  FIS – WORKROOM CYCLE TIME CORRECTIVE REPORT
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Required When Weekly Cycle Times Exceed 12 Days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          {/* WORKROOM INFORMATION */}
          <section>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Overall Cycle Time: <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="currentCycleTime"
                    value={formData.currentCycleTime}
                    onChange={handleInputChange}
                    required
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                  />
                  <span className="text-gray-600">Days</span>
                  <span className="text-sm text-gray-500">(Target: 12 Days)</span>
                </div>
              </div>
            </div>
          </section>

          {/* 1. CYCLE TIME BY CATEGORY */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              1. CYCLE TIME BY CATEGORY (Required)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Provide the current average cycle days for each category.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carpet:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="carpetDays"
                    value={formData.carpetDays}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                  />
                  <span className="text-gray-600 text-sm">days</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vinyl / Sheet Goods:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="vinylDays"
                    value={formData.vinylDays}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                  />
                  <span className="text-gray-600 text-sm">days</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Laminate:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="laminateDays"
                    value={formData.laminateDays}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                  />
                  <span className="text-gray-600 text-sm">days</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LVP:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="lvpDays"
                    value={formData.lvpDays}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                  />
                  <span className="text-gray-600 text-sm">days</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hardwood:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="hardwoodDays"
                    value={formData.hardwoodDays}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                  />
                  <span className="text-gray-600 text-sm">days</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tile:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="tileDays"
                    value={formData.tileDays}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                  />
                  <span className="text-gray-600 text-sm">days</span>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Other (Specify):</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="otherCategory"
                    value={formData.otherCategory}
                    onChange={handleInputChange}
                    placeholder="Category name"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="otherDays"
                      value={formData.otherDays}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      placeholder="Days"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                    />
                    <span className="text-gray-600 text-sm">days</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. ROOT CAUSE IDENTIFICATION */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              2. ROOT CAUSE IDENTIFICATION
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select all causes contributing to increased cycle times.
            </p>
            
            <div className="space-y-6">
              {/* Scheduling */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Scheduling</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="delayedCustomerContact"
                      checked={formData.delayedCustomerContact}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Delayed customer contact</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="incorrectInstallerAssignment"
                      checked={formData.incorrectInstallerAssignment}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Incorrect installer assignment</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="installerAvailabilityIssues"
                      checked={formData.installerAvailabilityIssues}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Installer availability issues</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="poorArrivalCoordination"
                      checked={formData.poorArrivalCoordination}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Poor arrival coordination</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="reschedulesImpactingFlow"
                      checked={formData.reschedulesImpactingFlow}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Reschedules impacting flow</span>
                  </label>
                </div>
              </div>

              {/* Details & Admin Flow */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Details & Admin Flow</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="detailErrors"
                      checked={formData.detailErrors}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Detail errors</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="incorrectMeasurements"
                      checked={formData.incorrectMeasurements}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Incorrect measurements</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="missingJobInformation"
                      checked={formData.missingJobInformation}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Missing job information</span>
                  </label>
                </div>
              </div>

              {/* Inventory & Store Issues */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Inventory & Store Issues</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="materialNotAvailable"
                      checked={formData.materialNotAvailable}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Material not available</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="incorrectMaterialDelivered"
                      checked={formData.incorrectMaterialDelivered}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Incorrect material delivered</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="storeProcessingDelays"
                      checked={formData.storeProcessingDelays}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Store processing delays</span>
                  </label>
                </div>
              </div>

              {/* Installer-Related */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Installer-Related</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="installerCancelNoShow"
                      checked={formData.installerCancelNoShow}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Installer cancel/no show</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="installersNotPullingJobsForward"
                      checked={formData.installersNotPullingJobsForward}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Installers not pulling jobs forward</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="slowJobCompletionPace"
                      checked={formData.slowJobCompletionPace}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                    />
                    <span className="text-sm text-gray-700">Slow job completion pace</span>
                  </label>
                </div>
              </div>

              {/* Other */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Other</h3>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    name="otherCause"
                    checked={formData.otherCause}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#80875d] border-gray-300 rounded focus:ring-[#80875d]"
                  />
                  <span className="text-sm text-gray-700">Other</span>
                </label>
                {formData.otherCause && (
                  <textarea
                    name="otherCauseDescription"
                    value={formData.otherCauseDescription}
                    onChange={handleInputChange}
                    placeholder="Please specify..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                  />
                )}
              </div>
            </div>
          </section>

          {/* 3. TOP 3 JOBS IMPACTING CYCLE TIME */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              3. TOP 3 JOBS IMPACTING CYCLE TIME
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              List the three jobs with the highest delays.
            </p>
            
            <div className="space-y-6">
              {[1, 2, 3].map((num) => (
                <div key={num} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-4">{num}. Customer / Job #:</h3>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        name={`job${num}Customer`}
                        value={formData[`job${num}Customer` as keyof typeof formData] as string}
                        onChange={handleInputChange}
                        placeholder="Customer / Job #"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cause of Delay:</label>
                      <input
                        type="text"
                        name={`job${num}Cause`}
                        value={formData[`job${num}Cause` as keyof typeof formData] as string}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action Taken:</label>
                      <textarea
                        name={`job${num}Action`}
                        value={formData[`job${num}Action` as keyof typeof formData] as string}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. IMMEDIATE CORRECTIVE ACTIONS */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              4. IMMEDIATE CORRECTIVE ACTIONS (Next 24 Hours)
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Actions to pull jobs forward and close delay gaps immediately.
            </p>
            <textarea
              name="immediateActions"
              value={formData.immediateActions}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
            />
          </section>

          {/* 5. PREVENTATIVE ACTIONS */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              5. PREVENTATIVE ACTIONS (Next 72 Hours)
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Operational changes to stabilize cycle time moving forward.
            </p>
            <textarea
              name="preventativeActions"
              value={formData.preventativeActions}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
            />
          </section>

          {/* 6. INSTALLER ACCOUNTABILITY REVIEW */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              6. INSTALLER ACCOUNTABILITY REVIEW
            </h2>
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-3">
                Did specific installers cause recurring scheduling delays?
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="installerIssues"
                    value="yes"
                    checked={formData.installerIssues === 'yes'}
                    onChange={(e) => handleRadioChange('installerIssues', e.target.value)}
                    className="w-4 h-4 text-[#80875d] border-gray-300 focus:ring-[#80875d]"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="installerIssues"
                    value="no"
                    checked={formData.installerIssues === 'no'}
                    onChange={(e) => handleRadioChange('installerIssues', e.target.value)}
                    className="w-4 h-4 text-[#80875d] border-gray-300 focus:ring-[#80875d]"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
            {formData.installerIssues === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  If yes, list installer & action plan:
                </label>
                <textarea
                  name="installerDetails"
                  value={formData.installerDetails}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                />
              </div>
            )}
          </section>

          {/* 7. STORE & INVENTORY ISSUES */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              7. STORE & INVENTORY ISSUES
            </h2>
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-3">
                Were store-originated delays a contributing factor?
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="storeIssues"
                    value="yes"
                    checked={formData.storeIssues === 'yes'}
                    onChange={(e) => handleRadioChange('storeIssues', e.target.value)}
                    className="w-4 h-4 text-[#80875d] border-gray-300 focus:ring-[#80875d]"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="storeIssues"
                    value="no"
                    checked={formData.storeIssues === 'no'}
                    onChange={(e) => handleRadioChange('storeIssues', e.target.value)}
                    className="w-4 h-4 text-[#80875d] border-gray-300 focus:ring-[#80875d]"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
            {formData.storeIssues === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  If yes, describe issue and store location(s):
                </label>
                <textarea
                  name="storeIssuesDescription"
                  value={formData.storeIssuesDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                />
              </div>
            )}
          </section>

          {/* 8. GM COMMITMENT STATEMENT */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              8. GM COMMITMENT STATEMENT
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              One operational change you will implement immediately to return cycle time to standard.
            </p>
            <textarea
              name="commitmentStatement"
              value={formData.commitmentStatement}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d] mb-4"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GM Signature:
                </label>
                <input
                  type="text"
                  name="gmSignature"
                  value={formData.gmSignature}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
                  style={{ fontFamily: "'Dancing Script', 'Brush Script MT', 'Lucida Handwriting', 'Kalam', cursive", fontSize: '1.5rem', letterSpacing: '0.05em' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date:
                </label>
                <input
                  type="date"
                  name="signatureDate"
                  value={formData.signatureDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#80875d]"
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

