'use client'

import FileUpload from '@/components/FileUpload'
import Sidebar from '@/components/Sidebar'
import NotificationContainer from '@/components/NotificationContainer'
import { useFilters } from '@/components/FilterContext'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { selectedWorkroom, setSelectedWorkroom, excludeCycleTime, setExcludeCycleTime } = useFilters()

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-header-left">
            <div className="dashboard-logo-container">
              <img 
                src="/logo.png" 
                alt="FIS Logo" 
                className="dashboard-logo"
              />
              <span className="dashboard-logo-text">Floor Interior Service</span>
            </div>
          </div>
          <FileUpload />
        </div>
      </header>

      <div className="dashboard-layout">
        <Sidebar
          selectedWorkroom={selectedWorkroom}
          setSelectedWorkroom={setSelectedWorkroom}
          excludeCycleTime={excludeCycleTime}
          setExcludeCycleTime={setExcludeCycleTime}
        />

        <main className="dashboard-main">
          {children}
        </main>
      </div>
      <footer className="dashboard-footer">
        <div className="dashboard-footer-inner">
          <p className="dashboard-footer-text">
            © {new Date().getFullYear()} Floor Interior Service
          </p>
        </div>
      </footer>
      <NotificationContainer />
    </div>
  )
}

