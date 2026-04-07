'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

interface LowesChatIntakeProps {
  onSubmit: (data: IntakeData) => Promise<void>
  initialValues?: {
    email?: string
    name?: string
    role?: string
    district?: string
    storeNumber?: string
    groupId?: string
    groupName?: string
  }
}

export interface IntakeData {
  lowesEmail: string
  name: string
  role: string
  district: string
  storeNumber: string
  groupId: string
  groupName: string
  quoteImsNumber: string
  flooringCategory: string
  questionTypes: string[]
}

const FLOORING_CATEGORIES = [
  'Carpet',
  'LVP (Luxury Vinyl Plank)',
  'Tile',
  'Hardwood',
  'Laminate',
  'Vinyl Sheet',
  'Other'
]

const QUESTION_TYPES = [
  'Scope',
  'SOW Line Item',
  'Pricing Delta',
  'Competitor Comparison'
]

const ROLE_OPTIONS = [
  'Project Coordinator',
  'General Manager',
  'President',
  'Executive Director',
  'Others'
]

export default function LowesChatIntake({ onSubmit, initialValues }: LowesChatIntakeProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<IntakeData>({
    lowesEmail: initialValues?.email || user?.email || '',
    name: initialValues?.name || user?.name || '',
    role: initialValues?.role || '',
    district: initialValues?.district || '',
    storeNumber: initialValues?.storeNumber || '',
    groupId: initialValues?.groupId || '',
    groupName: initialValues?.groupName || '',
    quoteImsNumber: '',
    flooringCategory: '',
    questionTypes: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update form data when initialValues change (e.g., when user profile is updated)
  useEffect(() => {
    if (initialValues) {
      setFormData(prev => ({
        ...prev,
        lowesEmail: initialValues.email || prev.lowesEmail,
        name: initialValues.name || prev.name,
        role: initialValues.role || prev.role,
        district: initialValues.district || prev.district,
        storeNumber: initialValues.storeNumber || prev.storeNumber,
        groupId: initialValues.groupId || prev.groupId,
        groupName: initialValues.groupName || prev.groupName
      }))
    }
  }, [initialValues])

  const handleChange = (field: keyof IntakeData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleQuestionTypeToggle = (type: string) => {
    setFormData(prev => {
      const current = prev.questionTypes || []
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type]
      return { ...prev, questionTypes: updated }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.lowesEmail || !formData.lowesEmail.includes('@')) {
      setError('Valid email is required')
      return
    }
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    if (!formData.role.trim()) {
      setError('Role is required')
      return
    }
    if (!formData.district.trim()) {
      setError('District is required')
      return
    }
    if (!formData.storeNumber.trim()) {
      setError('Store Number is required')
      return
    }
    if (!formData.quoteImsNumber.trim()) {
      setError('Quote or IMS reference number is required')
      return
    }
    if (!formData.flooringCategory) {
      setError('Flooring category is required')
      return
    }
    if (!formData.questionTypes || formData.questionTypes.length === 0) {
      setError('Please select at least one question type')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Conversation
          </h3>
          <p className="text-base text-gray-600">
            Fill out the form below to start a pricing validation chat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.lowesEmail}
              onChange={(e) => handleChange('lowesEmail', e.target.value)}
              className="w-full px-4 py-3 text-base border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm transition-all"
              placeholder="your.email@lowes.com"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 text-base border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm transition-all"
              placeholder="John Doe"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full px-4 py-3 text-base border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm transition-all"
              placeholder="e.g., Project Coordinator, General Manager, President"
              required
            />
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              District <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => handleChange('district', e.target.value)}
              className="w-full px-4 py-3 text-base border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm transition-all"
              placeholder="District 123"
              required
            />
          </div>

          {/* Store Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Store Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.storeNumber}
              onChange={(e) => handleChange('storeNumber', e.target.value)}
              className="w-full px-4 py-3 text-base border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm transition-all"
              placeholder="Store 456"
              required
            />
          </div>

          {/* Group */}
          {formData.groupName && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Group
              </label>
              <input
                type="text"
                value={formData.groupName}
                disabled
                className="w-full px-4 py-3 text-base border-0 rounded-xl bg-[#e6f0f8] text-gray-700 cursor-not-allowed shadow-sm"
              />
            </div>
          )}

          {/* Quote or IMS Reference Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Quote or IMS Reference Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.quoteImsNumber}
              onChange={(e) => handleChange('quoteImsNumber', e.target.value)}
              className="w-full px-4 py-3 text-base border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm transition-all"
              placeholder="QUOTE-12345 or IMS-67890"
              required
            />
          </div>

          {/* Flooring Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Flooring Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.flooringCategory}
              onChange={(e) => handleChange('flooringCategory', e.target.value)}
              className="w-full px-4 py-3 text-base border-0 rounded-xl bg-[#e6f0f8] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-opacity-50 shadow-sm font-semibold cursor-pointer appearance-none bg-no-repeat bg-right pr-10 transition-all"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23004990' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                backgroundPosition: "right 0.75rem center",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
              }}
              required
            >
              <option value="" style={{ fontFamily: 'inherit' }}>Select category...</option>
              {FLOORING_CATEGORIES.map(cat => (
                <option key={cat} value={cat} style={{ fontFamily: 'inherit' }}>{cat}</option>
              ))}
            </select>
          </div>

          {/* What they're questioning */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              What you're questioning: <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2.5 bg-[#e6f0f8] rounded-xl p-4">
              {QUESTION_TYPES.map(type => (
                <label key={type} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.questionTypes?.includes(type) || false}
                    onChange={() => handleQuestionTypeToggle(type)}
                    className="w-5 h-5 text-[#004990] border-gray-300 rounded focus:ring-[#004990] focus:ring-2"
                  />
                  <span className="text-gray-900 text-base font-medium">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm font-medium shadow-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#004990] to-[#003d73] text-white py-3.5 px-6 rounded-xl text-base font-bold hover:from-[#003d73] hover:to-[#002d5a] focus:outline-none focus:ring-2 focus:ring-[#004990] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Create Conversation'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
