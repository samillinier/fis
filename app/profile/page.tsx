'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthContext'
import { useNotification } from '@/components/NotificationContext'
import UserSettings from '@/components/UserSettings'
import { Shield, Trash2, UserPlus, MessageSquare, Users, UserX, Plus, X, FolderOpen, Edit2, Save } from 'lucide-react'

export default function ProfilePage() {
  const {
    authorizedUsers,
    addAuthorizedUser,
    removeAuthorizedUser,
    isAdmin,
    isOwner,
    user,
    accessRequests,
    approveAccessRequest,
    rejectAccessRequest,
    setUserRole,
  } = useAuth()
  const { showNotification } = useNotification()
  const router = useRouter()
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [chatWidgetAccess, setChatWidgetAccess] = useState<Record<string, boolean>>({})
  const [isLoadingChatAccess, setIsLoadingChatAccess] = useState(false)
  const [lowesTeamMembers, setLowesTeamMembers] = useState<any[]>([])
  const [isLoadingLowesMembers, setIsLoadingLowesMembers] = useState(false)
  const [groups, setGroups] = useState<any[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [showNewGroupForm, setShowNewGroupForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [addingMemberToGroup, setAddingMemberToGroup] = useState<string | null>(null)
  const [memberEmailToAdd, setMemberEmailToAdd] = useState('')
  const [memberNameToAdd, setMemberNameToAdd] = useState('')
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupDescription, setEditGroupDescription] = useState('')
  const [editingMember, setEditingMember] = useState<any | null>(null)
  const [editMemberName, setEditMemberName] = useState('')
  const [editMemberRole, setEditMemberRole] = useState('')
  const [editMemberDistrict, setEditMemberDistrict] = useState('')
  const [editMemberStoreNumber, setEditMemberStoreNumber] = useState('')
  const [editMemberGroupId, setEditMemberGroupId] = useState('')
  const [editMemberPassword, setEditMemberPassword] = useState('')
  const [editMemberConfirmPassword, setEditMemberConfirmPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showCreateMemberForm, setShowCreateMemberForm] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('')
  const [newMemberDistrict, setNewMemberDistrict] = useState('')
  const [newMemberStoreNumber, setNewMemberStoreNumber] = useState('')
  const [newMemberPassword, setNewMemberPassword] = useState('')
  const [newMemberConfirmPassword, setNewMemberConfirmPassword] = useState('')
  const [newMemberGroupId, setNewMemberGroupId] = useState('')

  useEffect(() => {
    // Only load data when user is confirmed admin
    // Don't redirect - let ProtectedRoute handle auth
    if (isAdmin || isOwner) {
      loadChatWidgetAccess()
      loadLowesTeamMembers()
      loadGroups()
    }
  }, [isAdmin, isOwner, authorizedUsers])

  const canViewAdminAccess = isAdmin || isOwner
  const canEditAccess = isAdmin

  const sortedUsers = useMemo(
    () =>
      [...authorizedUsers].sort((a, b) => {
        const aAdmin = a.role === 'admin'
        const bAdmin = b.role === 'admin'
        if (aAdmin !== bAdmin) return aAdmin ? -1 : 1

        const aActive = a.isActive !== false
        const bActive = b.isActive !== false
        if (aActive !== bActive) return aActive ? -1 : 1

        return a.email.localeCompare(b.email)
      }),
    [authorizedUsers]
  )

  const handleAdd = async () => {
    if (!newEmail.trim()) {
      showNotification('Email is required', 'error')
      return
    }
    const success = await addAuthorizedUser(newEmail, newName)
    if (success) {
      showNotification('User added to allowlist', 'success')
      setNewEmail('')
      setNewName('')
    } else {
      showNotification('Could not add user (already allowed or not permitted)', 'error')
    }
  }

  const handleRemove = async (email: string) => {
    const success = await removeAuthorizedUser(email)
    if (success) {
      showNotification('User removed from allowlist', 'success')
    } else {
      showNotification('Unable to remove this user', 'error')
    }
  }

  const handleApproveRequest = async (email: string) => {
    const success = await approveAccessRequest(email)
    if (success) {
      showNotification('User approved and can now sign in.', 'success')
    } else {
      showNotification('Could not approve this user. They may already be allowed.', 'error')
    }
  }

  const handleRejectRequest = async (email: string) => {
    await rejectAccessRequest(email)
    showNotification('Request removed.', 'success')
  }

  const handleRoleChange = async (email: string, role: 'admin' | 'owner' | 'user' | 'accounting') => {
    const success = await setUserRole(email, role)
    if (success) {
      showNotification('Role updated.', 'success')
    } else {
      showNotification('Could not update role for this user.', 'error')
    }
  }

  const loadChatWidgetAccess = async () => {
    if (!user?.email) return
    
    setIsLoadingChatAccess(true)
    try {
      // Fetch users with chat widget access from API
      const response = await fetch('/api/chat-widget-access', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.email}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.users) {
          const accessMap: Record<string, boolean> = {}
          data.users.forEach((u: any) => {
            accessMap[u.email] = u.chatWidgetEnabled || false
          })
          setChatWidgetAccess(accessMap)
        }
      }
    } catch (error) {
      console.error('Error loading chat widget access:', error)
    } finally {
      setIsLoadingChatAccess(false)
    }
  }

  const handleChatWidgetAccessChange = async (email: string, enabled: boolean) => {
    if (!user?.email) return

    try {
      const response = await fetch('/api/chat-widget-access', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({ email, chatWidgetEnabled: enabled })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.users) {
          const accessMap: Record<string, boolean> = {}
          data.users.forEach((u: any) => {
            accessMap[u.email] = u.chatWidgetEnabled || false
          })
          setChatWidgetAccess(accessMap)
          showNotification(
            enabled 
              ? 'Chat widget access enabled for user' 
              : 'Chat widget access disabled for user',
            'success'
          )
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details 
          ? `${errorData.error}\n${errorData.details}` 
          : errorData.error || 'Failed to update chat widget access'
        showNotification(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error updating chat widget access:', error)
      showNotification('Failed to update chat widget access', 'error')
    }
  }

  const loadLowesTeamMembers = async () => {
    if (!user?.email) return
    
    setIsLoadingLowesMembers(true)
    try {
      const response = await fetch('/api/lowes-team-members', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.email}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLowesTeamMembers(data.members || [])
        if (data.warning) {
          console.warn('Lowe\'s team members warning:', data.warning)
          showNotification(data.warning, 'error')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details 
          ? `${errorData.error}\n${errorData.details}` 
          : errorData.error || 'Failed to load Lowe\'s team members'
        console.error('Error loading Lowe\'s team members:', errorMessage)
        showNotification(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error loading Lowe\'s team members:', error)
    } finally {
      setIsLoadingLowesMembers(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const loadGroups = async () => {
    if (!user?.email) return
    
    setIsLoadingGroups(true)
    try {
      const response = await fetch('/api/lowes-groups', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.email}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error loading groups:', errorData.error)
      }
    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!user?.email || !newGroupName.trim()) return

    try {
      const response = await fetch('/api/lowes-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription
        })
      })

      if (response.ok) {
        showNotification('Group created successfully', 'success')
        setNewGroupName('')
        setNewGroupDescription('')
        setShowNewGroupForm(false)
        loadGroups()
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details 
          ? `${errorData.error}\n${errorData.details}` 
          : errorData.error || 'Failed to create group'
        console.error('Create group error:', errorMessage)
        showNotification(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      showNotification('Failed to create group', 'error')
    }
  }

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!user?.email) return
    if (!confirm(`Are you sure you want to delete the group "${groupName}"? All members will be removed.`)) return

    try {
      const response = await fetch(`/api/lowes-groups?groupId=${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.email}`
        }
      })

      if (response.ok) {
        showNotification('Group deleted successfully', 'success')
        loadGroups()
      } else {
        const errorData = await response.json().catch(() => ({}))
        showNotification(errorData.error || 'Failed to delete group', 'error')
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      showNotification('Failed to delete group', 'error')
    }
  }

  const handleStartEditGroup = (group: any) => {
    setEditingGroupId(group.id)
    setEditGroupName(group.name)
    setEditGroupDescription(group.description || '')
  }

  const handleCancelEditGroup = () => {
    setEditingGroupId(null)
    setEditGroupName('')
    setEditGroupDescription('')
  }

  const handleSaveEditGroup = async (groupId: string) => {
    if (!user?.email || !editGroupName.trim()) return

    try {
      const response = await fetch('/api/lowes-groups', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          groupId,
          name: editGroupName,
          description: editGroupDescription
        })
      })

      if (response.ok) {
        showNotification('Group updated successfully', 'success')
        setEditingGroupId(null)
        setEditGroupName('')
        setEditGroupDescription('')
        loadGroups()
      } else {
        const errorData = await response.json().catch(() => ({}))
        showNotification(errorData.error || 'Failed to update group', 'error')
      }
    } catch (error) {
      console.error('Error updating group:', error)
      showNotification('Failed to update group', 'error')
    }
  }

  const handleRemoveLowesTeamMember = async (memberEmail: string) => {
    if (!user?.email) return
    if (!confirm(`Are you sure you want to remove ${memberEmail}? This will remove them from all groups.`)) return

    try {
      // Remove from all groups first
      const groupIds = groups.map(g => g.id)
      for (const groupId of groupIds) {
        await fetch(`/api/lowes-groups/members?groupId=${groupId}&memberEmail=${encodeURIComponent(memberEmail)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.email}`
          }
        })
      }
      
      showNotification('Lowe\'s team member removed from all groups', 'success')
      loadGroups()
      loadLowesTeamMembers()
    } catch (error) {
      console.error('Error removing Lowe\'s team member:', error)
      showNotification('Failed to remove Lowe\'s team member', 'error')
    }
  }

  const handleStartEditMember = async (member: any) => {
    setEditingMember(member)
    setEditMemberName(member.name || '')
    setEditMemberRole(member.role || '')
    setEditMemberDistrict(member.district || '')
    setEditMemberStoreNumber(member.storeNumber || '')
    setEditMemberGroupId('')
    setEditMemberPassword('')
    setEditMemberConfirmPassword('')
    setShowResetPassword(false)

    // Fetch user's current group from database
    try {
      const response = await fetch(`/api/lowes-groups/user-group?email=${encodeURIComponent(member.email)}`)
      const data = await response.json()
      if (data.groupName) {
        // Find the group ID by name
        const group = groups.find(g => g.name === data.groupName)
        if (group) {
          setEditMemberGroupId(group.id)
        }
      }
    } catch (err) {
      console.error('Error fetching member group:', err)
    }
  }

  const handleCancelEditMember = () => {
    setEditingMember(null)
    setEditMemberName('')
    setEditMemberRole('')
    setEditMemberDistrict('')
    setEditMemberStoreNumber('')
    setEditMemberGroupId('')
    setEditMemberPassword('')
    setEditMemberConfirmPassword('')
    setShowResetPassword(false)
  }

  const handleSaveEditMember = async () => {
    if (!user?.email || !editingMember) return

    // Validate password if resetting
    if (showResetPassword) {
      const trimmedPassword = editMemberPassword.trim()
      const trimmedConfirm = editMemberConfirmPassword.trim()
      
      if (!trimmedPassword || trimmedPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error')
        return
      }
      if (trimmedPassword !== trimmedConfirm) {
        showNotification('Passwords do not match', 'error')
        return
      }
    }

    try {
      // Update member in database via API (including password if provided)
      const updateResponse = await fetch('/api/lowes-team-members', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          memberEmail: editingMember.email,
          name: editMemberName.trim(),
          role: editMemberRole.trim(),
          district: editMemberDistrict.trim(),
          storeNumber: editMemberStoreNumber.trim(),
          groupId: editMemberGroupId || null,
          password: showResetPassword && editMemberPassword.trim() ? editMemberPassword.trim() : undefined
        })
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        showNotification(errorData.error || 'Failed to update member in database', 'error')
        return
      }

      console.log(`[Profile] Successfully updated member ${editingMember.email} in Supabase (password updated: ${showResetPassword})`)

      // Handle group assignment changes
      // First, remove member from all groups
      for (const group of groups) {
        const memberInGroup = group.members?.find((m: any) => 
          m.member_email.toLowerCase() === editingMember.email.toLowerCase()
        )
        if (memberInGroup) {
          await fetch('/api/lowes-groups/members', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.email}`
            },
            body: JSON.stringify({
              groupId: group.id,
              memberEmail: editingMember.email
            })
          })
        }
      }

      // Then, add member to the new group if one is selected
      if (editMemberGroupId) {
        await fetch('/api/lowes-groups/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.email}`
          },
          body: JSON.stringify({
            groupId: editMemberGroupId,
            memberEmail: editingMember.email,
            memberName: editMemberName.trim()
          })
        })
      }

      showNotification('Member profile updated successfully', 'success')
      handleCancelEditMember()
      loadLowesTeamMembers()
      loadGroups()
    } catch (error) {
      console.error('Error updating member:', error)
      showNotification('Failed to update member profile', 'error')
    }
  }

  const handleCancelCreateMember = () => {
    setShowCreateMemberForm(false)
    setNewMemberName('')
    setNewMemberEmail('')
    setNewMemberRole('')
    setNewMemberDistrict('')
    setNewMemberStoreNumber('')
    setNewMemberPassword('')
    setNewMemberConfirmPassword('')
    setNewMemberGroupId('')
  }

  const handleCreateMember = async () => {
    if (!user?.email) return

    // Validation
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberRole.trim() || 
        !newMemberDistrict.trim() || !newMemberStoreNumber.trim() || !newMemberPassword) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    if (newMemberPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error')
      return
    }

    if (newMemberPassword !== newMemberConfirmPassword) {
      showNotification('Passwords do not match', 'error')
      return
    }

    try {
      // Create member in Supabase via API
      const createResponse = await fetch('/api/lowes-team-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          name: newMemberName.trim(),
          role: newMemberRole.trim(),
          district: newMemberDistrict.trim(),
          storeNumber: newMemberStoreNumber.trim(),
          password: newMemberPassword,
          groupId: newMemberGroupId || null
        })
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Create member error:', errorData)
        showNotification(errorData.details || errorData.error || 'Failed to create member', 'error')
        return
      }

      // If group selected, add member to group
      if (newMemberGroupId) {
        await fetch('/api/lowes-groups/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.email}`
          },
          body: JSON.stringify({
            groupId: newMemberGroupId,
            memberEmail: newMemberEmail.trim(),
            memberName: newMemberName.trim()
          })
        })
      }

      showNotification('Lowe\'s team member created successfully', 'success')
      handleCancelCreateMember()
      loadLowesTeamMembers()
      loadGroups()
    } catch (error) {
      console.error('Error creating member:', error)
      showNotification('Failed to create member', 'error')
    }
  }

  const handleAddMemberToGroup = async (groupId: string) => {
    if (!user?.email || !memberEmailToAdd.trim()) return

    try {
      const response = await fetch('/api/lowes-groups/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          groupId,
          memberEmail: memberEmailToAdd,
          memberName: memberNameToAdd
        })
      })

      if (response.ok) {
        showNotification('Member added to group successfully', 'success')
        setMemberEmailToAdd('')
        setMemberNameToAdd('')
        setAddingMemberToGroup(null)
        loadGroups()
      } else {
        const errorData = await response.json().catch(() => ({}))
        showNotification(errorData.error || 'Failed to add member to group', 'error')
      }
    } catch (error) {
      console.error('Error adding member to group:', error)
      showNotification('Failed to add member to group', 'error')
    }
  }

  const handleRemoveMemberFromGroup = async (groupId: string, memberEmail: string) => {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/lowes-groups/members?groupId=${groupId}&memberEmail=${encodeURIComponent(memberEmail)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.email}`
        }
      })

      if (response.ok) {
        showNotification('Member removed from group successfully', 'success')
        loadGroups()
      } else {
        const errorData = await response.json().catch(() => ({}))
        showNotification(errorData.error || 'Failed to remove member from group', 'error')
      }
    } catch (error) {
      console.error('Error removing member from group:', error)
      showNotification('Failed to remove member from group', 'error')
    }
  }

  const toggleGroupExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  if (!canViewAdminAccess) {
    return null
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-3xl mx-auto w-full bg-white rounded-xl shadow p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-emerald-50 text-emerald-700">
              <Shield />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Profile & Access Control</h1>
              <p className="text-sm text-gray-600">
                Manage who is allowed to sign in. Owners can review this information, while only admins can make changes.
              </p>
            </div>
          </div>

          {!canEditAccess ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Owner mode is read-only. You can review all admin access data, but only admins can make changes.
            </div>
          ) : null}

          {/* User Settings Section */}
          <div className="border rounded-lg">
            <UserSettings />
          </div>

          {canEditAccess ? (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2"
                />
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center justify-center gap-2 bg-[#89ac44] text-white px-4 py-2 rounded-md hover:bg-[#6d8a35] transition-colors"
                >
                  <UserPlus size={18} />
                  Add User
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Allowed Users</h2>
              <div className="p-1.5 rounded-full bg-blue-50 text-blue-700">
                <MessageSquare size={14} />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Manage user roles and chat widget access
            </p>
            {isLoadingChatAccess ? (
              <p className="text-sm text-gray-500">Loading access settings...</p>
            ) : (
              <div className="border rounded-lg divide-y">
                {sortedUsers.map((entry) => {
                  const isSelf = user?.email?.toLowerCase() === entry.email.toLowerCase()
                  const isSuperAdmin = entry.email.toLowerCase() === 'sbiru@fiscorponline.com'
                  const hasChatAccess = chatWidgetAccess[entry.email] || false
                  return (
                    <div
                      key={entry.email}
                      className="flex items-center justify-between px-4 py-3 bg-white gap-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{entry.email}</p>
                        <p className="text-sm text-gray-500">
                          {entry.name ? `${entry.name} • ` : ''}
                          {entry.role === 'admin'
                            ? 'Admin'
                            : entry.role === 'owner'
                              ? 'Owner'
                            : entry.role === 'accounting'
                              ? 'Accounting'
                              : 'User'}
                        </p>
                        {entry.lastLoginAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Last login: {formatDate(entry.lastLoginAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={
                            entry.role === 'admin'
                              ? 'admin'
                              : entry.role === 'owner'
                                ? 'owner'
                                : entry.role === 'accounting'
                                  ? 'accounting'
                                  : 'user'
                          }
                          onChange={(e) =>
                            handleRoleChange(
                              entry.email,
                              e.target.value as 'admin' | 'owner' | 'user' | 'accounting'
                            )
                          }
                          disabled={isSuperAdmin || !canEditAccess}
                          className="border rounded-md px-2 py-1 text-sm"
                        >
                          <option value="user">User</option>
                          <option value="owner">Owner</option>
                          <option value="accounting">Accounting</option>
                          <option value="admin">Admin</option>
                        </select>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasChatAccess}
                            onChange={(e) =>
                              handleChatWidgetAccessChange(entry.email, e.target.checked)
                            }
                            disabled={!canEditAccess}
                            className="w-4 h-4 text-[#89ac44] border-gray-300 rounded focus:ring-[#89ac44]"
                            title="Chat Widget Access"
                          />
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            Chat
                          </span>
                        </label>
                        {isSelf && (
                          <span className="text-xs text-gray-500">You</span>
                        )}
                        {canEditAccess ? (
                          <button
                            onClick={() => handleRemove(entry.email)}
                            className="text-red-600 hover:text-red-700 inline-flex items-center gap-1 text-sm"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Lowe's Groups Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-purple-50 text-purple-700">
                  <FolderOpen size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Lowe's Groups</h2>
                  <p className="text-sm text-gray-600">
                    Manage groups and assign Lowe's team members
                  </p>
                </div>
              </div>
              {canEditAccess ? (
                <button
                  onClick={() => setShowNewGroupForm(!showNewGroupForm)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-[#89ac44] text-white rounded-md hover:bg-[#6d8a35] transition-colors text-sm"
                >
                  <Plus size={16} />
                  New Group
                </button>
              ) : null}
            </div>

            {canEditAccess && showNewGroupForm && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Flooring Validation Chat, Floor Store"
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Brief description of the group"
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateGroup}
                    className="px-4 py-2 bg-[#89ac44] text-white rounded-md hover:bg-[#6d8a35] transition-colors"
                  >
                    Create Group
                  </button>
                  <button
                    onClick={() => {
                      setShowNewGroupForm(false)
                      setNewGroupName('')
                      setNewGroupDescription('')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isLoadingGroups ? (
              <p className="text-sm text-gray-500">Loading groups...</p>
            ) : groups.length === 0 ? (
              <p className="text-sm text-gray-500">No groups found. Create a new group to get started.</p>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleGroupExpanded(group.id)}
                    >
                      <div className="flex-1">
                        {editingGroupId === group.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editGroupName}
                              onChange={(e) => setEditGroupName(e.target.value)}
                              className="w-full px-2 py-1 border rounded-md text-sm font-semibold"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <input
                              type="text"
                              value={editGroupDescription}
                              onChange={(e) => setEditGroupDescription(e.target.value)}
                              placeholder="Description (optional)"
                              className="w-full px-2 py-1 border rounded-md text-xs text-gray-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSaveEditGroup(group.id)
                                }}
                                className="px-2 py-1 bg-[#89ac44] text-white rounded text-xs hover:bg-[#6d8a35]"
                              >
                                <Save size={12} className="inline mr-1" />
                                Save
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelEditGroup()
                                }}
                                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900">{group.name}</h3>
                            {group.description && (
                              <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {canEditAccess && editingGroupId !== group.id && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartEditGroup(group)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Rename group"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setAddingMemberToGroup(group.id)
                              }}
                              className="p-2 text-[#89ac44] hover:bg-gray-100 rounded"
                              title="Add member"
                            >
                              <UserPlus size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteGroup(group.id, group.name)
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete group"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        <button className="p-1">
                          {expandedGroups.has(group.id) ? (
                            <X size={16} className="text-gray-400" />
                          ) : (
                            <Plus size={16} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {expandedGroups.has(group.id) && (
                      <div className="border-t bg-gray-50 p-4 space-y-3">
                        {canEditAccess && addingMemberToGroup === group.id && (
                          <div className="bg-white border rounded-lg p-3 space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Select Lowe's Team Member <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={memberEmailToAdd}
                                onChange={(e) => {
                                  const selectedEmail = e.target.value
                                  setMemberEmailToAdd(selectedEmail)
                                  // Auto-populate name if member is found
                                  const selectedMember = lowesTeamMembers.find(
                                    (m) => m.email.toLowerCase() === selectedEmail.toLowerCase()
                                  )
                                  if (selectedMember) {
                                    setMemberNameToAdd(selectedMember.name || '')
                                  }
                                }}
                                className="w-full border rounded-md px-2 py-1.5 text-sm"
                              >
                                <option value="">-- Select a member --</option>
                                {lowesTeamMembers
                                  .filter((member) => {
                                    // Filter out members already in this group
                                    return !group.members.some(
                                      (gm: any) => gm.member_email.toLowerCase() === member.email.toLowerCase()
                                    )
                                  })
                                  .map((member) => (
                                    <option key={member.email} value={member.email}>
                                      {member.name || member.email} {member.email && member.name && `(${member.email})`}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            {memberEmailToAdd && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Member Email
                                </label>
                                <input
                                  type="email"
                                  value={memberEmailToAdd}
                                  readOnly
                                  className="w-full border rounded-md px-2 py-1.5 text-sm bg-gray-50 text-gray-600"
                                />
                              </div>
                            )}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Member Name
                              </label>
                              <input
                                type="text"
                                value={memberNameToAdd}
                                onChange={(e) => setMemberNameToAdd(e.target.value)}
                                placeholder="John Doe"
                                className="w-full border rounded-md px-2 py-1.5 text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddMemberToGroup(group.id)
                                  }
                                }}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddMemberToGroup(group.id)}
                                disabled={!memberEmailToAdd}
                                className="px-3 py-1.5 bg-[#89ac44] text-white rounded-md hover:bg-[#6d8a35] text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setAddingMemberToGroup(null)
                                  setMemberEmailToAdd('')
                                  setMemberNameToAdd('')
                                }}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {group.members.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-2">
                            No members in this group yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {group.members.map((member: any) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-2 bg-white rounded border"
                              >
                                <div>
                                  <p className="font-medium text-sm text-gray-900">
                                    {member.member_email}
                                  </p>
                                  {member.member_name && (
                                    <p className="text-xs text-gray-500">{member.member_name}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoveMemberFromGroup(group.id, member.member_email)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Remove from group"
                                >
                                  <UserX size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lowe's Team Members Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-blue-50 text-blue-700">
                  <Users size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Lowe's Team Members</h2>
                  <p className="text-sm text-gray-600">
                    Active Lowe's Pro Connect accounts
                  </p>
                </div>
              </div>
              {canEditAccess ? (
                <button
                  onClick={() => setShowCreateMemberForm(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-[#89ac44] text-white rounded-md hover:bg-[#6d8a35] transition-colors text-sm"
                >
                  <UserPlus size={16} />
                  Add Member
                </button>
              ) : null}
            </div>
            {isLoadingLowesMembers ? (
              <p className="text-sm text-gray-500">Loading Lowe's team members...</p>
            ) : lowesTeamMembers.length === 0 ? (
              <p className="text-sm text-gray-500">No Lowe's team members found.</p>
            ) : (
              <div className="border rounded-lg divide-y">
                {lowesTeamMembers.map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center justify-between px-4 py-3 bg-white gap-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.email}</p>
                      <p className="text-sm text-gray-500">
                        {member.name || 'No name'} 
                        {member.role && ` • ${member.role}`}
                        {member.district && member.storeNumber && ` • ${member.district} / Store ${member.storeNumber}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {formatDate(member.createdAt)}
                        {member.lastActivity && ` • Last activity: ${formatDate(member.lastActivity)}`}
                        {member.conversationCount && ` • ${member.conversationCount} conversation${member.conversationCount !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.isActive === false && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                      {canEditAccess ? (
                        <>
                          <button
                            onClick={() => handleStartEditMember(member)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit member profile"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleRemoveLowesTeamMember(member.email)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Remove from all groups"
                          >
                            <UserX size={18} />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Access Requests</h2>
            {accessRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests.</p>
            ) : (
              <div className="border rounded-lg divide-y">
                {accessRequests
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.requestedAt).getTime() -
                      new Date(a.requestedAt).getTime()
                  )
                  .map((request) => (
                    <div
                      key={request.email}
                      className="flex items-center justify-between px-4 py-3 bg-white"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.name ? `${request.name} • ` : ''}
                          Requested via {request.source} on{' '}
                          {new Date(request.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      {canEditAccess ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveRequest(request.email)}
                            className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.email)}
                            className="text-red-600 hover:text-red-700 inline-flex items-center gap-1 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Edit Lowe's Team Member Modal */}
          {canEditAccess && editingMember && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Edit Team Member</h2>
                    <button
                      onClick={handleCancelEditMember}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleSaveEditMember(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (read-only)
                      </label>
                      <input
                        type="email"
                        value={editingMember.email}
                        disabled
                        className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editMemberName}
                        onChange={(e) => setEditMemberName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editMemberRole}
                        onChange={(e) => setEditMemberRole(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="e.g., Project Coordinator"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editMemberDistrict}
                        onChange={(e) => setEditMemberDistrict(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="District 123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Store Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editMemberStoreNumber}
                        onChange={(e) => setEditMemberStoreNumber(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Store 456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group
                      </label>
                      <select
                        value={editMemberGroupId}
                        onChange={(e) => setEditMemberGroupId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-white"
                      >
                        <option value="">No group assigned</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="border-t pt-4">
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        {showResetPassword ? 'Cancel Password Reset' : 'Reset Password'}
                      </button>

                      {showResetPassword && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              New Password <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              value={editMemberPassword}
                              onChange={(e) => setEditMemberPassword(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md"
                              placeholder="At least 6 characters"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              value={editMemberConfirmPassword}
                              onChange={(e) => setEditMemberConfirmPassword(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md"
                              placeholder="Confirm password"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-[#89ac44] text-white rounded-md hover:bg-[#6d8a35] transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditMember}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Create Lowe's Team Member Modal */}
          {canEditAccess && showCreateMemberForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Team Member</h2>
                    <button
                      onClick={handleCancelCreateMember}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleCreateMember(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="john.doe@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="e.g., Project Coordinator"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newMemberDistrict}
                        onChange={(e) => setNewMemberDistrict(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="District 123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Store Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newMemberStoreNumber}
                        onChange={(e) => setNewMemberStoreNumber(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Store 456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department/Group
                      </label>
                      <select
                        value={newMemberGroupId}
                        onChange={(e) => setNewMemberGroupId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">-- Select a group (optional) --</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="border-t pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={newMemberPassword}
                          onChange={(e) => setNewMemberPassword(e.target.value)}
                          required
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="At least 6 characters"
                        />
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={newMemberConfirmPassword}
                          onChange={(e) => setNewMemberConfirmPassword(e.target.value)}
                          required
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Confirm password"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-[#89ac44] text-white rounded-md hover:bg-[#6d8a35] transition-colors"
                      >
                        Create Account
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelCreateMember}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
