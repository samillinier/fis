'use client'

import { useState, useEffect, useRef } from 'react'

interface CountUpNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  formatter?: (value: number) => string
}

export default function CountUpNumber({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  formatter,
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const animationRef = useRef<number | null>(null)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    // Reset for new value
    setDisplayValue(0)
    hasStartedRef.current = false

    // Clean up existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
    }

    // Simple delay to ensure component is rendered
    const timeoutId = setTimeout(() => {
      if (hasStartedRef.current) return
      
      hasStartedRef.current = true
      const startTime = Date.now()
      const startValue = 0
      const endValue = value

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function for smooth deceleration
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = startValue + (endValue - startValue) * easeOutQuart

        setDisplayValue(currentValue)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setDisplayValue(endValue)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration])

  const formatValue = (val: number): string => {
    if (formatter) {
      return formatter(val)
    }

    const rounded = decimals === 0 ? Math.round(val) : Number(val.toFixed(decimals))

    if (prefix || suffix) {
      return `${prefix}${rounded.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`
    }

    return rounded.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  return <span>{formatValue(displayValue)}</span>
}
