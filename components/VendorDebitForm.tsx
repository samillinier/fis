'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'
import { AlertCircle, ArrowLeft, Plus, X } from 'lucide-react'

interface VendorDebitFormProps {
  workroom: string
  onComplete?: () => void
  canClose?: boolean
}

interface DebitDetails {
  storeNumber: string
  customerJob: string
  debitAmount: string
  categoryCarpet: boolean
  categoryLaminate: boolean
  categoryLVP: boolean
  categoryTile: boolean
  categoryHardwood: boolean
  categoryOther: boolean
  categoryOtherSpecify: string
  rootCauseIncorrectDetail: boolean
  rootCauseIncorrectLaborPricing: boolean
  rootCauseInstallerError: boolean
  rootCauseDamageByInstaller: boolean
  rootCauseMissedScope: boolean
  rootCauseFailureToFollowSOP: boolean
  rootCauseRescheduleDelay: boolean
  rootCauseMaterialMishandling: boolean
  rootCauseOther: boolean
  rootCauseOtherSpecify: string
  summary: string
  correctiveAction: string
}

export default function VendorDebitForm({ workroom, onComplete, canClose = true }: VendorDebitFormProps) {
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
    totalDebitAmount: '',
    numberOfDebits: '',
    
    // Debits (array of debit details)
    debits: [
      {
        storeNumber: '',
        customerJob: '',
        debitAmount: '',
        categoryCarpet: false,
        categoryLaminate: false,
        categoryLVP: false,
        categoryTile: false,
        categoryHardwood: false,
        categoryOther: false,
        categoryOtherSpecify: '',
        rootCauseIncorrectDetail: false,
        rootCauseIncorrectLaborPricing: false,
        rootCauseInstallerError: false,
        rootCauseDamageByInstaller: false,
        rootCauseMissedScope: false,
        rootCauseFailureToFollowSOP: false,
        rootCauseRescheduleDelay: false,
        rootCauseMaterialMishandling: false,
        rootCauseOther: false,
        rootCauseOtherSpecify: '',
        summary: '',
        correctiveAction: '',
      } as DebitDetails
    ],
    
    // Installer Accountability Review
    installerContributed: 'no',
    installerDetails: '',
    
    // GM Operational Review
    wrMissedDetailCheck: false,
    communicationGap: false,
    failureToVerifyMeasurements: false,
    missedPreInstallScope: false,
    schedulingError: false,
    qualityFailure: false,
    sopViolation: false,
    unapprovedWork: false,
    jobsiteBehavior: false,
    storeMeasurementIssue: false,
    storeIncorrectInfo: false,
    materialError: false,
    otherOperational: false,
    otherOperationalSpecify: '',
    
    // Prevention Plan
    preventionPlan: '',
    
    // Customer Impact Review
    customerImpact: 'no',
    customerImpactExplanation: '',
    
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

  const addDebit = () => {
    setFormData(prev => ({
      ...prev,
      debits: [
        ...prev.debits,
        {
          storeNumber: '',
          customerJob: '',
          debitAmount: '',
          categoryCarpet: false,
          categoryLaminate: false,
          categoryLVP: false,
          categoryTile: false,
          categoryHardwood: false,
          categoryOther: false,
          categoryOtherSpecify: '',
          rootCauseIncorrectDetail: false,
          rootCauseIncorrectLaborPricing: false,
          rootCauseInstallerError: false,
          rootCauseDamageByInstaller: false,
          rootCauseMissedScope: false,
          rootCauseFailureToFollowSOP: false,
          rootCauseRescheduleDelay: false,
          rootCauseMaterialMishandling: false,
          rootCauseOther: false,
          rootCauseOtherSpecify: '',
          summary: '',
          correctiveAction: '',
        } as DebitDetails
      ]
    }))
  }

  const removeDebit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      debits: prev.debits.filter((_, i) => i !== index)
    }))
  }

  const updateDebit = (index: number, field: keyof DebitDetails, value: any) => {
    setFormData(prev => ({
      ...prev,
      debits: prev.debits.map((debit, i) => 
        i === index ? { ...debit, [field]: value } : debit
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.workroom || !formData.gmName || !formData.totalDebitAmount || !formData.numberOfDebits) {
      showNotification('Please fill in all required fields in Workroom Information section', 'error')
      return
    }

    if (formData.debits.length === 0) {
      showNotification('Please add at least one debit detail', 'error')
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
          metric_type: 'vendor_debit',
          form_data: formData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Vendor Debit form submitted successfully:', result)
        showNotification('Vendor Debit Accountability Report submitted successfully', 'success')
        if (onComplete) {
          onComplete()
        } else {
          router.push('/')
        }
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
          {canClose && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
          )}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-green-100">
                <AlertCircle className="text-green-600" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  FIS – VENDOR DEBIT ACCOUNTABILITY REPORT
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Required for ANY Vendor Debit Received
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
                  Total Vendor Debit Amount: <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">$</span>
                  <input
                    type="number"
                    name="totalDebitAmount"
                    value={formData.totalDebitAmount}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  # of Debits Received This Week: <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="numberOfDebits"
                  value={formData.numberOfDebits}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </section>

          {/* 1. VENDOR DEBIT DETAILS */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 flex-1">
                1. VENDOR DEBIT DETAILS (Required for Each Debit)
              </h2>
              <button
                type="button"
                onClick={addDebit}
                className="ml-4 flex items-center gap-2 px-3 py-1.5 text-sm bg-[#80875d] text-white rounded-md hover:bg-[#6d7350] transition-colors"
              >
                <Plus size={16} />
                Add Debit
              </button>
            </div>
            
            {formData.debits.map((debit, index) => (
              <div key={index} className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Debit #{index + 1}</h3>
                  {formData.debits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDebit(index)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lowe's Store #:
                    </label>
                    <input
                      type="text"
                      value={debit.storeNumber}
                      onChange={(e) => updateDebit(index, 'storeNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer / Job #:
                    </label>
                    <input
                      type="text"
                      value={debit.customerJob}
                      onChange={(e) => updateDebit(index, 'customerJob', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Debit Amount:
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">$</span>
                      <input
                        type="number"
                        value={debit.debitAmount}
                        onChange={(e) => updateDebit(index, 'debitAmount', e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Impacted:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.categoryCarpet}
                        onChange={(e) => updateDebit(index, 'categoryCarpet', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Carpet</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.categoryLaminate}
                        onChange={(e) => updateDebit(index, 'categoryLaminate', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Laminate</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.categoryLVP}
                        onChange={(e) => updateDebit(index, 'categoryLVP', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">LVP</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.categoryTile}
                        onChange={(e) => updateDebit(index, 'categoryTile', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Tile</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.categoryHardwood}
                        onChange={(e) => updateDebit(index, 'categoryHardwood', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Hardwood</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.categoryOther}
                        onChange={(e) => updateDebit(index, 'categoryOther', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Other</span>
                    </label>
                  </div>
                  {debit.categoryOther && (
                    <input
                      type="text"
                      value={debit.categoryOtherSpecify}
                      onChange={(e) => updateDebit(index, 'categoryOtherSpecify', e.target.value)}
                      placeholder="Specify category"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Root Cause (Check All That Apply):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.rootCauseIncorrectDetail}
                        onChange={(e) => updateDebit(index, 'rootCauseIncorrectDetail', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Incorrect detail</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.rootCauseIncorrectLaborPricing}
                        onChange={(e) => updateDebit(index, 'rootCauseIncorrectLaborPricing', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Incorrect labor pricing</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.rootCauseInstallerError}
                        onChange={(e) => updateDebit(index, 'rootCauseInstallerError', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Installer error / workmanship</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.rootCauseDamageByInstaller}
                        onChange={(e) => updateDebit(index, 'rootCauseDamageByInstaller', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Damage caused by installer</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.rootCauseMissedScope}
                        onChange={(e) => updateDebit(index, 'rootCauseMissedScope', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Missed scope / missed measurement</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.rootCauseFailureToFollowSOP}
                        onChange={(e) => updateDebit(index, 'rootCauseFailureToFollowSOP', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Failure to follow SOP</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.rootCauseRescheduleDelay}
                        onChange={(e) => updateDebit(index, 'rootCauseRescheduleDelay', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Reschedule / delay impact</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.rootCauseMaterialMishandling}
                        onChange={(e) => updateDebit(index, 'rootCauseMaterialMishandling', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Material mishandling</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={debit.rootCauseOther}
                        onChange={(e) => updateDebit(index, 'rootCauseOther', e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Other</span>
                    </label>
                  </div>
                  {debit.rootCauseOther && (
                    <input
                      type="text"
                      value={debit.rootCauseOtherSpecify}
                      onChange={(e) => updateDebit(index, 'rootCauseOtherSpecify', e.target.value)}
                      placeholder="Specify other root cause"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Summary of What Happened:
                  </label>
                  <textarea
                    value={debit.summary}
                    onChange={(e) => updateDebit(index, 'summary', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe what happened..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corrective Action Taken:
                  </label>
                  <textarea
                    value={debit.correctiveAction}
                    onChange={(e) => updateDebit(index, 'correctiveAction', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe corrective action taken..."
                  />
                </div>
              </div>
            ))}
          </section>

          {/* 2. INSTALLER ACCOUNTABILITY REVIEW */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              2. INSTALLER ACCOUNTABILITY REVIEW
            </h2>
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-3">
                Did a specific installer contribute to this debit?
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="installerContributed"
                    value="yes"
                    checked={formData.installerContributed === 'yes'}
                    onChange={() => handleRadioChange('installerContributed', 'yes')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="installerContributed"
                    value="no"
                    checked={formData.installerContributed === 'no'}
                    onChange={() => handleRadioChange('installerContributed', 'no')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
            {formData.installerContributed === 'yes' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  If yes, list installer & action plan (including coaching or financial responsibility):
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

          {/* 3. GM OPERATIONAL REVIEW */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              3. GM OPERATIONAL REVIEW
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Where did the process fail? (Choose all that apply.)
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Workroom</h3>
                <div className="space-y-2 ml-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="wrMissedDetailCheck"
                      checked={formData.wrMissedDetailCheck}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">WR missed detail check</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="communicationGap"
                      checked={formData.communicationGap}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Communication gap with installer</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="failureToVerifyMeasurements"
                      checked={formData.failureToVerifyMeasurements}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Failure to verify measurements</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="missedPreInstallScope"
                      checked={formData.missedPreInstallScope}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Missed pre-install scope confirmation</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="schedulingError"
                      checked={formData.schedulingError}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Scheduling error</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Installer</h3>
                <div className="space-y-2 ml-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="qualityFailure"
                      checked={formData.qualityFailure}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Quality failure</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="sopViolation"
                      checked={formData.sopViolation}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">SOP violation</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="unapprovedWork"
                      checked={formData.unapprovedWork}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Unapproved work completed</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="jobsiteBehavior"
                      checked={formData.jobsiteBehavior}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Jobsite behavior</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Store / External</h3>
                <div className="space-y-2 ml-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="storeMeasurementIssue"
                      checked={formData.storeMeasurementIssue}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Store-provided measurement issue</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="storeIncorrectInfo"
                      checked={formData.storeIncorrectInfo}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Store gave incorrect info</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="materialError"
                      checked={formData.materialError}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Material error</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Other</h3>
                <div className="ml-4">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      name="otherOperational"
                      checked={formData.otherOperational}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Other</span>
                  </label>
                  {formData.otherOperational && (
                    <input
                      type="text"
                      name="otherOperationalSpecify"
                      value={formData.otherOperationalSpecify}
                      onChange={handleInputChange}
                      placeholder="Specify other operational issue"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 4. PREVENTION PLAN */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              4. PREVENTION PLAN (Next 72 Hours)
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              What specific actions will prevent this debit from happening again?
            </p>
            <textarea
              name="preventionPlan"
              value={formData.preventionPlan}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe prevention plan..."
            />
          </section>

          {/* 5. CUSTOMER IMPACT REVIEW */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              5. CUSTOMER IMPACT REVIEW
            </h2>
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-3">
                Did this debit affect customer experience or LTR?
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
                  name="customerImpactExplanation"
                  value={formData.customerImpactExplanation}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Explain customer impact..."
                />
              </div>
            )}
          </section>

          {/* 6. GM COMMITMENT STATEMENT */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              6. GM COMMITMENT STATEMENT
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              One operational change you will implement immediately to reduce vendor debits moving forward.
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
            {canClose && (
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
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
