'use client'

import { useState } from 'react'
import { useData } from '@/context/DataContext'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import DualFileUpload from '@/components/DualFileUpload'
import YearlyDualFileUpload from '@/components/YearlyDualFileUpload'
import PaymentFileUpload from '@/components/PaymentFileUpload'
import YearlyPaymentFileUpload from '@/components/YearlyPaymentFileUpload'
import ScheduledJobFileUpload from '@/components/ScheduledJobFileUpload'
import { usePaymentShell } from '@/context/PaymentShellContext'
import { useAuth } from '@/components/AuthContext'
import { 
  X, 
  BarChart3, 
  ClipboardList, 
  Database, 
  Store, 
  FileText, 
  DollarSign, 
  Target, 
  Calculator,
  CreditCard,
  Clock,
  MapPin,
  Briefcase,
} from 'lucide-react'

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
  const { isAdmin, isOwner, isManager, isAccounting } = useAuth()
  const canViewAdminPages = isAdmin || isOwner
  const canViewManagerPages = canViewAdminPages || isManager

  // Helper function to check if a workroom name is valid (not "Location #" or similar)
  const isValidWorkroomName = (name: string): boolean => {
    const normalizedName = (name || '').toLowerCase().trim()
    return (
      normalizedName !== 'location #' &&
      normalizedName !== 'location' &&
      normalizedName !== '' &&
      !normalizedName.includes('location #') &&
      !/^\d+$/.test(normalizedName)
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
            <BarChart3 size={18} className="mr-2 flex-shrink-0" />
            Visual Breakdown
          </Link>
          <Link
            href="/survey-misc"
            className={`sidebar-nav-button ${
              isActive('/survey-misc') ? 'sidebar-nav-button--active' : ''
            }`}
            onClick={handleLinkClick}
          >
            <ClipboardList size={18} className="mr-2 flex-shrink-0" />
            Survey Misc
          </Link>
          <Link
            href="/yearly-breakdown"
            className={`sidebar-nav-button ${
              isActive('/yearly-breakdown') ? 'sidebar-nav-button--active' : ''
            }`}
            onClick={handleLinkClick}
          >
            <BarChart3 size={18} className="mr-2 flex-shrink-0" />
            Yearly Breakdown
          </Link>
          {canViewAdminPages && (
            <>
              <Link
                href="/cycle-time"
                className={`sidebar-nav-button ${
                  isActive('/cycle-time') ? 'sidebar-nav-button--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                <Clock size={18} className="mr-2 flex-shrink-0" />
                Cycle Time YTD
              </Link>
              <Link
                href="/cycle-time-ly"
                className={`sidebar-nav-button ${
                  isActive('/cycle-time-ly') ? 'sidebar-nav-button--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                <Clock size={18} className="mr-2 flex-shrink-0" />
                Cycle Time LY
              </Link>
              <Link
                href="/job"
                className={`sidebar-nav-button ${
                  isActive('/job') ? 'sidebar-nav-button--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                <Briefcase size={18} className="mr-2 flex-shrink-0" />
                Job
              </Link>
              <Link
                href="/heatmap"
                className={`sidebar-nav-button ${
                  isActive('/heatmap') ? 'sidebar-nav-button--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                <MapPin size={18} className="mr-2 flex-shrink-0" />
                Heatmap
              </Link>
            </>
          )}
          <Link
            href="/lowes-q2-tracker"
            className={`sidebar-nav-button ${
              isActive('/lowes-q2-tracker') || isActive('/lowes-q1-tracker') ? 'sidebar-nav-button--active' : ''
            }`}
            onClick={handleLinkClick}
          >
            <Target size={18} className="mr-2 flex-shrink-0" />
            Q2 Tracker
          </Link>
          {canViewAdminPages && (
            <Link
              href="/payment"
              className={`sidebar-nav-button ${
                isActive('/payment') ? 'sidebar-nav-button--active' : ''
              }`}
              onClick={handleLinkClick}
            >
              <CreditCard size={18} className="mr-2 flex-shrink-0" />
              Payment
            </Link>
          )}
          {(canViewAdminPages || canViewManagerPages || isAccounting) && (
            <>
              {/* HIDDEN: Finance Hub and Store Overview temporarily disabled */}
              {/*
              {canViewAdminPages && (
                <>
                  <Link
                    href="/finance-hub"
                    className={`sidebar-nav-button ${
                      isActive('/finance-hub') ? 'sidebar-nav-button--active' : ''
                    }`}
                    onClick={handleLinkClick}
                  >
                    <DollarSign size={18} className="mr-2 flex-shrink-0" />
                    Finance Hub
                  </Link>
                  <Link
                    href="/store"
                    className={`sidebar-nav-button ${
                      isActive('/store') ? 'sidebar-nav-button--active' : ''
                    }`}
                    onClick={handleLinkClick}
                  >
                    <Store size={18} className="mr-2 flex-shrink-0" />
                    Store Overview
                  </Link>
                </>
              )}
              */}
              {canViewManagerPages && (
                <>
                  <Link
                    href="/workroom-report"
                    className={`sidebar-nav-button ${
                      isActive('/workroom-report') ? 'sidebar-nav-button--active' : ''
                    }`}
                    onClick={handleLinkClick}
                  >
                    <FileText size={18} className="mr-2 flex-shrink-0" />
                    Workroom Report
                  </Link>
                  {/* HIDDEN: Calculator and Bonus pages temporarily disabled */}
                  {/*
                  <Link
                    href="/calculator"
                    className={`sidebar-nav-button ${
                      isActive('/calculator') ? 'sidebar-nav-button--active' : ''
                    }`}
                    onClick={handleLinkClick}
                  >
                    <Calculator size={18} className="mr-2 flex-shrink-0" />
                    Calculator
                  </Link>
                  */}
                </>
              )}
              {/*
              <Link
                href="/bonus"
                className={`sidebar-nav-button ${
                  isActive('/bonus') ? 'sidebar-nav-button--active' : ''
                }`}
                onClick={handleLinkClick}
              >
                <DollarSign size={18} className="mr-2 flex-shrink-0" />
                Bonus
              </Link>
              */}
            </>
          )}
        </nav>

      </div>

      {canViewAdminPages &&
        pathname !== '/cycle-time' &&
        pathname !== '/cycle-time-ly' &&
        pathname !== '/heatmap' &&
        pathname !== '/job' && (
        <div className="sidebar-upload">
          {pathname === '/payment' ? (
            <PaymentSidebarUpload />
          ) : pathname === '/yearly-breakdown' ? (
            <YearlyDualFileUpload />
          ) : (
            <DualFileUpload />
          )}
        </div>
      )}
    </aside>
  )
}

function PaymentSidebarUpload() {
  const { mode } = usePaymentShell()
  return (
    <div className="sidebar-upload-card">
      {mode === 'yearly' ? <YearlyPaymentFileUpload /> : <PaymentFileUpload />}
      <ScheduledJobFileUpload />
    </div>
  )
}

