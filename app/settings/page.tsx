'use client'

import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import UserSettings from '@/components/UserSettings'
import { User } from 'lucide-react'

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-3xl mx-auto w-full bg-white rounded-xl shadow p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-[#80875d]/10 text-[#80875d]">
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
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

