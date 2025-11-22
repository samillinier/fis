'use client'

import { useState } from 'react'
import { useData } from '@/context/DataContext'
import VisualBreakdown from '@/components/VisualBreakdown'
import SalesByWorkroom from '@/components/SalesByWorkroom'
import LaborVendorReport from '@/components/LaborVendorReport'
import PerformanceIndex from '@/components/PerformanceIndex'
import StoreOverview from '@/components/StoreOverview'
import FileUpload from '@/components/FileUpload'
import SummaryPanel from '@/components/SummaryPanel'
import KpiHeader from '@/components/KpiHeader'
import { Filter } from 'lucide-react'

export default function Dashboard() {
  const { data } = useData()
  const [selectedWorkroom, setSelectedWorkroom] = useState<string>('all')
  const [excludeCycleTime, setExcludeCycleTime] = useState(false)
      const [activeView, setActiveView] = useState<string>('breakdown')

  const uniqueWorkrooms = Array.from(new Set(data.workrooms.map((w) => w.name))).sort()

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
              Labor PO &amp; Vendor Debit
            </button>
            <button
              onClick={() => setActiveView('performance')}
              className={`sidebar-nav-button ${
                activeView === 'performance' ? 'sidebar-nav-button--active' : ''
              }`}
            >
              Performance Index
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

            {activeView === 'performance' && (
              <label className="sidebar-checkbox-row cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeCycleTime}
                  onChange={(e) => setExcludeCycleTime(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Exclude Cycle Time</span>
              </label>
            )}
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
          {activeView === 'performance' && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <PerformanceIndex
                selectedWorkroom={selectedWorkroom}
                excludeCycleTime={excludeCycleTime}
              />
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


