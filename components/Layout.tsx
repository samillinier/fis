'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import NotificationContainer from '@/components/NotificationContainer'
import NotificationDropdown from '@/components/NotificationDropdown'
import FirstTimeLoginModal from '@/components/FirstTimeLoginModal'
import { useFilters } from '@/components/FilterContext'
import { useAuth } from '@/components/AuthContext'
import { LogOut, User, UserCog, Menu, X } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { selectedWorkroom, setSelectedWorkroom, excludeCycleTime, setExcludeCycleTime } = useFilters()
  const { user, logout, isAdmin, accessRequests } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false) // Reset sidebar state when switching to desktop
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/signin')
  }

  const handleProfile = () => {
    if (isAdmin) {
      router.push('/profile')
    } else {
      router.push('/settings')
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-header-left">
            <button
              className="mobile-menu-button"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
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
              <>
                <NotificationDropdown />
                <div className="user-menu-container">
                  <div
                    className="user-name-display"
                    onClick={handleProfile}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: '#374151',
                      fontSize: '1rem',
                      cursor: 'pointer',
                    }}
                  >
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.name || user.email}
                        className="user-profile-photo"
                      />
                    ) : (
                      <User size={28} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 500 }}>
                        {user.name || user.email}
                      </span>
                      {user.jobTitle && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 400 }}>
                          {user.jobTitle}
                        </span>
                      )}
                    </div>
                    <svg
                      className="dropdown-arrow"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 4L6 8L10 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="logout-dropdown-menu">
                    <button
                      type="button"
                      onClick={handleProfile}
                      className="logout-button-hover profile-button"
                    >
                      <UserCog size={18} />
                      <span>{isAdmin === true ? 'Profile' : 'Settings'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="logout-button-hover"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile backdrop overlay */}
      {isSidebarOpen && (
        <div 
          className="mobile-sidebar-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="dashboard-layout">
        <Sidebar
          selectedWorkroom={selectedWorkroom}
          setSelectedWorkroom={setSelectedWorkroom}
          excludeCycleTime={excludeCycleTime}
          setExcludeCycleTime={setExcludeCycleTime}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          isMobile={isMobile}
        />

        <main className="dashboard-main">
          {isAdmin === true && accessRequests.length > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
              <div className="font-semibold">New access requests</div>
              <div className="text-sm">
                {accessRequests.length} pending request{accessRequests.length > 1 ? 's' : ''}. Open Profile to review.
              </div>
            </div>
          )}
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
      <FirstTimeLoginModal />
    </div>
  )
}
