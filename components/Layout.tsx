'use client'

import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import NotificationContainer from '@/components/NotificationContainer'
import { useFilters } from '@/components/FilterContext'
import { useAuth } from '@/components/AuthContext'
import { LogOut, User } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { selectedWorkroom, setSelectedWorkroom, excludeCycleTime, setExcludeCycleTime } = useFilters()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/signin')
  }

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
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
              <div className="user-menu-container">
                <div className="user-name-display" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#374151', fontSize: '1rem', cursor: 'pointer' }}>
                  {user.photoUrl ? (
                    <img 
                      src={user.photoUrl} 
                      alt={user.name || user.email}
                      className="user-profile-photo"
                    />
                  ) : (
                    <User size={28} />
                  )}
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{user.name || user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="logout-button-hover"
                  style={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
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

