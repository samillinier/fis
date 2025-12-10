'use client'

import { useState } from 'react'
import { useData } from '@/context/DataContext'
import VisualBreakdown from '@/components/VisualBreakdown'
import SalesByWorkroom from '@/components/SalesByWorkroom'
import LaborVendorReport from '@/components/LaborVendorReport'
import StoreOverview from '@/components/StoreOverview'
import FileUpload from '@/components/FileUpload'
import SummaryPanel from '@/components/SummaryPanel'
import { Filter } from 'lucide-react'

export default function Dashboard() {
  const { data } = useData()
  const [selectedWorkroom, setSelectedWorkroom] = useState<string>('all')
  const [activeView, setActiveView] = useState<string>('breakdown')

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

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <h1 className="dashboard-title">FIS Dashboard</h1>
          <FileUpload />
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar (fixed left column) */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
                <button
              onClick={() => setActiveView('breakdown')}
              className={`sidebar-nav-button ${
                activeView === 'breakdown' ? 'sidebar-nav-button--active' : ''
              }`}
            >
              Visual Breakdown
            </button>
            <button
              onClick={() => setActiveView('sales')}
              className={`sidebar-nav-button ${
                activeView === 'sales' ? 'sidebar-nav-button--active' : ''
              }`}
            >
              Sales by Workroom
            </button>
            <button
              onClick={() => setActiveView('labor')}
              className={`sidebar-nav-button ${
                activeView === 'labor' ? 'sidebar-nav-button--active' : ''
              }`}
            >
              Sales &amp; Vendor Debit
            </button>
                <button
                  onClick={() => setActiveView('store')}
                  className={`sidebar-nav-button ${
                    activeView === 'store' ? 'sidebar-nav-button--active' : ''
                  }`}
                >
                  Store Overview
                </button>
          </nav>

          <div className="space-y-4">
            <div>
              <label className="sidebar-filter-label">
                <Filter size={14} />
                Filter by Workroom
              </label>
              <select
                value={selectedWorkroom}
                onChange={(e) => setSelectedWorkroom(e.target.value)}
                className="sidebar-select"
              >
                <option value="all">All Workrooms</option>
                {uniqueWorkrooms.map((workroom) => (
                  <option key={workroom} value={workroom}>
                    {workroom}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </aside>

        {/* Main content */}
        <main className="dashboard-main">
          {/* Always show Visual Breakdown on main page */}
          <VisualBreakdown selectedWorkroom={selectedWorkroom} />

          {/* Other views as separate sections below */}
          {activeView === 'sales' && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <SalesByWorkroom selectedWorkroom={selectedWorkroom} />
            </div>
          )}
          {activeView === 'labor' && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <LaborVendorReport selectedWorkroom={selectedWorkroom} />
            </div>
          )}
          {activeView === 'store' && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <StoreOverview />
            </div>
          )}

          {/* Global summary below the main view */}
          {activeView === 'breakdown' && <SummaryPanel />}
        </main>
      </div>
    </div>
  )
}


