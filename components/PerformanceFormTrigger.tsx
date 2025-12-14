'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useData } from '@/context/DataContext'
import { calculateWeightedPerformanceScore } from '@/lib/scoreCalculator'
import VendorDebitForm from './VendorDebitForm'

export default function PerformanceFormTrigger() {
  const { user } = useAuth()
  const { data } = useData()
  const [showVendorDebitForm, setShowVendorDebitForm] = useState(false)
  const [userWorkroom, setUserWorkroom] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user?.email || !data.workrooms.length) {
      setChecking(false)
      return
    }

    checkFormRequirement()
  }, [user?.email, data.workrooms])

  const checkFormRequirement = async () => {
    if (!user?.email) return

    setChecking(true)
    try {
      // Get user profile to find their workroom
      const authHeader = user.email
      const profileResponse = await fetch('/api/user-profile', {
        headers: {
          Authorization: `Bearer ${authHeader}`,
        },
      })

      if (!profileResponse.ok) {
        setChecking(false)
        return
      }

      const profile = await profileResponse.json()
      if (!profile.workroom) {
        setChecking(false)
        return
      }

      setUserWorkroom(profile.workroom)

      // Find workrooms matching user's workroom
      const userWorkrooms = data.workrooms.filter((w) => {
        const normalizedName = (w.name || '').trim()
        return normalizedName === profile.workroom.trim()
      })

      if (userWorkrooms.length === 0) {
        setChecking(false)
        return
      }

      // Check Vendor Debit score for each workroom
      let hasLowVendorDebit = false
      for (const workroom of userWorkrooms) {
        // Calculate vendor debit score specifically
        const vendorDebitScore = calculateVendorDebitScore(workroom, data.workrooms)
        
        if (vendorDebitScore < 70) {
          hasLowVendorDebit = true
          break
        }
      }

      if (hasLowVendorDebit) {
        // Check if form has been submitted for this week
        const formCheckResponse = await fetch(
          `/api/performance-forms?workroom=${encodeURIComponent(profile.workroom)}&metric_type=vendor_debit`,
          {
            headers: {
              Authorization: `Bearer ${authHeader}`,
            },
          }
        )

        if (formCheckResponse.ok) {
          const formCheck = await formCheckResponse.json()
          if (!formCheck.submitted) {
            setShowVendorDebitForm(true)
          } else {
            setHasSubmitted(true)
          }
        } else {
          // If check fails, show form to be safe
          setShowVendorDebitForm(true)
        }
      }
    } catch (error) {
      console.error('Error checking form requirement:', error)
    } finally {
      setChecking(false)
    }
  }

  const calculateVendorDebitScore = (workroom: any, allWorkrooms: any[]): number => {
    const workroomName = workroom.name || ''
    const workroomData = allWorkrooms.filter((w) => (w.name || '').trim() === workroomName.trim())
    
    if (workroomData.length === 0) return 100

    let totalSales = 0
    let totalLaborPO = 0
    let totalVendorDebit = 0

    workroomData.forEach((w) => {
      totalSales += w.sales || 0
      totalLaborPO += w.laborPO || 0
      totalVendorDebit += Math.abs(w.vendorDebit || 0)
    })

    const totalCost = totalLaborPO + totalVendorDebit
    let vendorDebitsScore = 100 // Default excellent

    if (totalCost > 0) {
      const vendorDebitRatio = totalVendorDebit / totalCost
      if (vendorDebitRatio <= 0.1) {
        vendorDebitsScore = 100 // Excellent (0-10%)
      } else if (vendorDebitRatio <= 0.2) {
        vendorDebitsScore = 80 // Good (10-20%)
      } else if (vendorDebitRatio <= 0.3) {
        vendorDebitsScore = 60 // Moderate (20-30%)
      } else if (vendorDebitRatio <= 0.4) {
        vendorDebitsScore = 40 // Poor (30-40%)
      } else {
        vendorDebitsScore = 20 // Critical (>40%)
      }
    }

    return vendorDebitsScore
  }

  const handleFormComplete = () => {
    setShowVendorDebitForm(false)
    setHasSubmitted(true)
    // Refresh the check after a delay
    setTimeout(() => {
      checkFormRequirement()
    }, 1000)
  }

  if (checking || !userWorkroom) {
    return null
  }

  if (showVendorDebitForm) {
    return (
      <VendorDebitForm
        workroom={userWorkroom}
        onComplete={handleFormComplete}
        canClose={false} // Cannot close - mandatory form
      />
    )
  }

  return null
}
