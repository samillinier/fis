'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import Layout from '@/components/Layout'
import { Calculator, Download, AlertTriangle, Filter, X } from 'lucide-react'

interface PricingRow {
  itemNumber: number | string
  itemDescription: string
  itemCost: number
  unit: string
  location: string
  category: string
  price30Margin: number
  price40Margin: number
  price50Margin: number
  installerCost: number
  installerCost40: number
  installerCost50: number
  installerProfiles?: { [installerName: string]: number }
  inconsistentPricing?: boolean
  primaryInstallerPay?: number
}

export default function CalculatorPage() {
  const { user } = useAuth()
  const [pricingData, setPricingData] = useState<PricingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string>('All')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [showInconsistentOnly, setShowInconsistentOnly] = useState(false)
  const [locations, setLocations] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchPricingData()
  }, [])

  const fetchPricingData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/pricing-data')
      if (!response.ok) {
        throw new Error('Failed to fetch pricing data')
      }
      const result = await response.json()
      setPricingData(result.data || [])
      setLocations(result.locations || [])
      setCategories(result.categories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing data')
      console.error('Error fetching pricing data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = pricingData.filter((row) => {
    if (selectedLocation !== 'All' && row.location !== selectedLocation) return false
    if (selectedCategory !== 'All' && row.category !== selectedCategory) return false
    if (showInconsistentOnly && !row.inconsistentPricing) return false
    return true
  })

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '$0.00'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const getLocationDisplayName = (location: string): string => {
    if (location === 'Tampa') return 'South'
    if (location === 'Ocala') return 'North'
    return location
  }

  const exportToCSV = () => {
    const allInstallerNames = new Set<string>()
    pricingData.forEach((row) => {
      if (row.installerProfiles) {
        Object.keys(row.installerProfiles).forEach((name) => allInstallerNames.add(name))
      }
    })

    const installerHeaders = Array.from(allInstallerNames)
    const headers = [
      'Item Number',
      'Item Description',
      'Location',
      'Category',
      'Unit',
      "Lowe's Cost",
      'Installer Cost (30%)',
      'Price for 30% Margin',
      'Installer Cost (40%)',
      'Price for 40% Margin',
      'Installer Cost (50%)',
      'Price for 50% Margin',
      'Primary Installer Pay',
      'Inconsistent Pricing',
      ...installerHeaders,
    ]

    const rows = filteredData.map((row) => {
      const installerValues = installerHeaders.map((name) => row.installerProfiles?.[name] || '')

      return [
        row.itemNumber,
        row.itemDescription,
        row.location,
        row.category,
        row.unit,
        row.itemCost,
        row.installerCost,
        row.price30Margin,
        row.installerCost40,
        row.price40Margin,
        row.installerCost50,
        row.price50Margin,
        row.primaryInstallerPay || '',
        row.inconsistentPricing ? 'Yes' : 'No',
        ...installerValues,
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `pricing-calculator-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const hasInstallerProfiles = pricingData.some((r) => r.installerProfiles && Object.keys(r.installerProfiles).length > 0)

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pricing data...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Error Loading Data</h2>
            </div>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={fetchPricingData}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Calculator className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Pricing Calculator</h1>
                  <p className="text-gray-600 mt-1">
                    Calculate margin prices and flag inconsistent installer pricing
                  </p>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {getLocationDisplayName(loc)}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {hasInstallerProfiles && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInconsistentOnly}
                    onChange={(e) => setShowInconsistentOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show inconsistent pricing only</span>
                </label>
              )}

              {(selectedLocation !== 'All' || selectedCategory !== 'All' || showInconsistentOnly) && (
                <button
                  onClick={() => {
                    setSelectedLocation('All')
                    setSelectedCategory('All')
                    setShowInconsistentOnly(false)
                  }}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  <X className="h-4 w-4" />
                  Clear filters
                </button>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredData.length}</span> of{' '}
              <span className="font-semibold">{pricingData.length}</span> items
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Item #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Lowe&apos;s Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Installer Cost (30%)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      30% Margin
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Installer Cost (40%)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      40% Margin
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Installer Cost (50%)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      50% Margin
                    </th>
                    {hasInstallerProfiles && (
                      <>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Primary Pay
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={hasInstallerProfiles ? 14 : 12} className="px-4 py-8 text-center text-gray-500">
                        No data found matching your filters
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr
                        key={`${row.itemNumber}-${row.location}-${row.category}-${idx}`}
                        className={`hover:bg-gray-50 ${
                          row.inconsistentPricing ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">{row.itemNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.itemDescription}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{getLocationDisplayName(row.location)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.unit}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(row.itemCost)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-orange-600 text-right">
                          {formatCurrency(row.installerCost)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-right">
                          {formatCurrency(row.price30Margin)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-orange-500 text-right">
                          {formatCurrency(row.installerCost40)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                          {formatCurrency(row.price40Margin)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-orange-400 text-right">
                          {formatCurrency(row.installerCost50)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-purple-600 text-right">
                          {formatCurrency(row.price50Margin)}
                        </td>
                        {hasInstallerProfiles && (
                          <>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {row.primaryInstallerPay
                                ? formatCurrency(row.primaryInstallerPay)
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.inconsistentPricing ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                                  <AlertTriangle className="h-3 w-3" />
                                  Inconsistent
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                                  OK
                                </span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>
                <strong>Margin Calculations:</strong> Shows the percentage amount to add to Lowe&apos;s cost.
              </li>
              <li>
                <strong>Formula:</strong> Margin Amount = Lowe&apos;s Cost × Margin %
                <br />
                Example: $54.00 × 30% = $16.20
              </li>
              {hasInstallerProfiles && (
                <li>
                  <strong>Inconsistent Pricing:</strong> When multiple installer profiles exist, items
                  are flagged if any installer pay doesn&apos;t match the primary number.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}
