'use client'

import { X, AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface RiskDialogProps {
  isOpen: boolean
  onClose: () => void
  workroom: {
    name: string
    financialRisk: string
    operationalRisks: string[]
    fixNowBullets: string[]
    storeMix: { count: number; rating: string }
    ltrPerformance: { value: number; rating: string }
    vendorDebitExposure: { ratio: number; rating: string }
    weightedPerformanceScore: number
    records: number
    cycleTime?: number
  } | null
}

export default function RiskDialog({ isOpen, onClose, workroom }: RiskDialogProps) {
  if (!isOpen || !workroom) return null

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Low':
        return <CheckCircle className="text-green-600" size={20} />
      case 'Moderate':
        return <AlertCircle className="text-yellow-600" size={20} />
      case 'High':
        return <AlertTriangle className="text-orange-600" size={20} />
      case 'Critical':
        return <XCircle className="text-red-600" size={20} />
      default:
        return <AlertCircle className="text-gray-600" size={20} />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'Moderate':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'High':
        return 'text-orange-700 bg-orange-50 border-orange-200'
      case 'Critical':
        return 'text-red-700 bg-red-50 border-red-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Dialog */}
        <div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{workroom.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Risk Assessment Details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close dialog"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Financial Risk */}
            <div className={`border-2 rounded-lg p-4 ${getRiskColor(workroom.financialRisk)}`}>
              <div className="flex items-center gap-3 mb-3">
                {getRiskIcon(workroom.financialRisk)}
                <h3 className="text-lg font-semibold">Financial Risk Rating</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{workroom.financialRisk}</span>
              </div>
            </div>

            {/* Performance Score */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">WPI Score:</span>
                  <span className="ml-2 font-semibold">{workroom.weightedPerformanceScore.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Stores:</span>
                  <span className="ml-2 font-semibold">{workroom.storeMix.count}</span>
                </div>
                <div>
                  <span className="text-gray-600">Records:</span>
                  <span className="ml-2 font-semibold">{workroom.records}</span>
                </div>
                {workroom.cycleTime && (
                  <div>
                    <span className="text-gray-600">Cycle Time:</span>
                    <span className="ml-2 font-semibold">{workroom.cycleTime.toFixed(1)} days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Operational Risks */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Operational Risks</h3>
              {workroom.operationalRisks.length > 0 ? (
                <ul className="space-y-2">
                  {workroom.operationalRisks.map((risk, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                  <CheckCircle size={18} />
                  <span className="font-medium">No operational risks identified</span>
                </div>
              )}
            </div>

            {/* Fix This Now */}
            {workroom.fixNowBullets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Issues to Fix ({workroom.fixNowBullets.length})
                </h3>
                <ul className="space-y-2">
                  {workroom.fixNowBullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700 bg-red-50 rounded-lg p-3">
                      <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <span className="text-sm text-gray-600">LTR Performance:</span>
                <div className="mt-1">
                  <span className="font-semibold">{workroom.ltrPerformance.value.toFixed(1)}%</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    workroom.ltrPerformance.rating === 'Excellent' ? 'bg-green-100 text-green-700' :
                    workroom.ltrPerformance.rating === 'Good' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {workroom.ltrPerformance.rating}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Vendor Debit Exposure:</span>
                <div className="mt-1">
                  <span className="font-semibold">{(workroom.vendorDebitExposure.ratio * 100).toFixed(1)}%</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    workroom.vendorDebitExposure.rating === 'Low' ? 'bg-green-100 text-green-700' :
                    workroom.vendorDebitExposure.rating === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {workroom.vendorDebitExposure.rating}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

