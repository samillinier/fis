// Utility functions for Lowe's team authentication and profile management

export interface LowesTeamMember {
  name: string
  email: string
  password: string
  createdAt: string
  profile: {
    photoUrl: string | null
    updatedAt: string
  }
}

export interface LowesTeamMemberSession {
  email: string
  name: string
  role: string
  loggedIn: boolean
  loggedInAt: string
  photoUrl: string | null
}

/**
 * Get all Lowe's team members from localStorage
 */
export function getAllLowesTeamMembers(): LowesTeamMember[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('lowes-team-members')
  return stored ? JSON.parse(stored) : []
}

/**
 * Get a specific Lowe's team member by email
 */
export function getLowesTeamMember(email: string): LowesTeamMember | null {
  const members = getAllLowesTeamMembers()
  return members.find(m => m.email === email) || null
}

/**
 * Update a Lowe's team member's profile
 */
export function updateLowesTeamMemberProfile(
  email: string,
  updates: Partial<LowesTeamMember['profile']>
): boolean {
  try {
    const members = getAllLowesTeamMembers()
    const memberIndex = members.findIndex(m => m.email === email)
    
    if (memberIndex === -1) {
      console.error('Member not found:', email)
      return false
    }

    // Update the member's profile
    members[memberIndex].profile = {
      ...members[memberIndex].profile,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Save back to localStorage
    localStorage.setItem('lowes-team-members', JSON.stringify(members))

    // Also update the current session if this user is logged in
    const currentSession = localStorage.getItem('lowes-team-member')
    if (currentSession) {
      const sessionData: LowesTeamMemberSession = JSON.parse(currentSession)
      if (sessionData.email === email) {
        sessionData.photoUrl = members[memberIndex].profile.photoUrl
        localStorage.setItem('lowes-team-member', JSON.stringify(sessionData))
      }
    }

    return true
  } catch (error) {
    console.error('Error updating team member profile:', error)
    return false
  }
}

/**
 * Get the current logged-in Lowe's team member session
 */
export function getCurrentLowesTeamMember(): LowesTeamMemberSession | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('lowes-team-member')
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}
