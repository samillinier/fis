'use client'

import { useState } from 'react'
import { useData } from '@/context/DataContext'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import ExportButton from '@/components/ExportButton'
import DualFileUpload from '@/components/DualFileUpload'
import { useAuth } from '@/components/AuthContext'
import { X } from 'lucide-react'

interface SidebarProps {
  selectedWorkroom: string
  setSelectedWorkroom: (value: string) => void
  excludeCycleTime?: boolean
  setExcludeCycleTime?: (value: boolean) => void
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

export default function Sidebar({
  selectedWorkroom,
  setSelectedWorkroom,
  excludeCycleTime = false,
  setExcludeCycleTime,
  isOpen = true,
  onClose,
  isMobile = false,
}: SidebarProps) {
  const { data } = useData()
  const pathname = usePathname()
  const { isAdmin } = useAuth()

  // Helper function to check if a workroom name is valid (not "Location #" or similar)
  const isValidWorkroomName = (name: string): boolean => {
    const normalizedName = (name || '').toLowerCase().trim()
    return (
      normalizedName !== 'location #' &&
      normalizedName !== 'location' &&
      normalizedName !== '' &&
      !normalizedName.includes('location #')
    )
  }

  const uniqueWorkrooms = Array.from(
    new Set(data.workrooms.filter((w) => isValidWorkroomName(w.name || '')).map((w) => w.name))
  ).sort()

  const isActive = (path: string) => pathname === path

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (isMobile && onClose) {
      onClose()
    }
  }

  // On desktop, sidebar is always "open" (visible)
  const sidebarIsOpen = isMobile ? isOpen : true

  return (
    <aside className={`dashboard-sidebar ${isMobile ? (sidebarIsOpen ? 'sidebar-open' : 'sidebar-closed') : ''}`}>
      {isMobile && (
        <div className="sidebar-mobile-header">
          <button
            className="sidebar-close-button"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
      )}
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <Link
            href="/"
            className={`sidebar-nav-button ${isActive('/') ? 'sidebar-nav-button--active' : ''}`}
            onClick={handleLinkClick}
          >
            Visual Breakdown
          </Link>
          <Link
            href="/survey-misc"
            className={`sidebar-nav-button ${
              isActive('/survey-misc') ? 'sidebar-nav-button--active' : ''
            }`}
            onClick={handleLinkClick}
          >
            Survey Misc
          </Link>
          {isAdmin && (
            <>
              <Link
                href="/analytics"
                className={`sidebar-nav-button ${
                  isActive('/analytics') ? 'sidebar-nav-button--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                Workroom Data
              </Link>
              <Link
                href="/store"
                className={`sidebar-nav-button ${
                  isActive('/store') ? 'sidebar-nav-button--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                Store Overview
              </Link>
              <Link
                href="/workroom-summary"
                className={`sidebar-nav-button ${
                  isActive('/workroom-summary') ? 'sidebar-nav-button--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                Workroom Summary
              </Link>
              <Link
                href="/workroom-report"
                className={`sidebar-nav-button ${
                  isActive('/workroom-report') ? 'sidebar-nav-button--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                Workroom Report
              </Link>
            </>
          )}
        </nav>

        {isAdmin && (
          <>
            <div className="sidebar-filters">
              {/* Export Button */}
              <ExportButton />
            </div>
          </>
        )}
      </div>

      {isAdmin && (
        <div className="sidebar-upload">
          <DualFileUpload />
        </div>
      )}
    </aside>
  )
}

