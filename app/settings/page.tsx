'use client'

import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import UserSettings from '@/components/UserSettings'
import ExportButton from '@/components/ExportButton'
import { useAuth } from '@/components/AuthContext'
import { User } from 'lucide-react'

export default function SettingsPage() {
  const { isAdmin, isOwner } = useAuth()

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-3xl mx-auto w-full bg-white rounded-xl shadow p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-[#89ac44]/10 text-[#89ac44]">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">
                Manage your workroom and role to receive notifications about low performance scores.
              </p>
            </div>
          </div>

          {/* User Settings Section */}
          <div className="border rounded-lg">
            <UserSettings />
          </div>

          {/* Export PDF Section - Admin Only */}
          {(isAdmin || isOwner) && (
            <div className="border rounded-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Export Reports</h2>
                <p className="text-sm text-gray-600">
                  Export dashboard reports as PDF files for presentations and documentation.
                </p>
              </div>
              <ExportButton />
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}





