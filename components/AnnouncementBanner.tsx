'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthContext'

type NoteColor = 'yellow' | 'green' | 'red'
type PodWeeklyNote = {
  enabled: boolean
  text: string
  color: NoteColor
  canManage?: boolean
}

const POD_NOTE_API = '/api/pod-banner'

const noteStyles: Record<NoteColor, string> = {
  yellow: 'border-yellow-300 bg-yellow-100 text-yellow-950',
  green: 'border-green-300 bg-green-100 text-green-950',
  red: 'border-red-300 bg-red-100 text-red-950',
}

export default function AnnouncementBanner() {
  const { user } = useAuth()
  const [note, setNote] = useState<PodWeeklyNote | null>(null)
  const [draftText, setDraftText] = useState('')
  const [draftColor, setDraftColor] = useState<NoteColor>('yellow')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const canManage = note?.canManage === true

  useEffect(() => {
    let isMounted = true

    const loadNote = async () => {
      try {
        const response = await fetch(`${POD_NOTE_API}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            ...(user?.email ? { Authorization: `Bearer ${user.email}` } : {}),
          },
        })
        if (!response.ok) return
        const data = (await response.json()) as PodWeeklyNote
        if (isMounted) {
          setNote(data)
          setDraftText(data.text || '')
          setDraftColor(data.color || 'yellow')
        }
      } catch (error) {
        console.error('Error loading POD note:', error)
      }
    }

    loadNote()
    const interval = window.setInterval(loadNote, 60_000)

    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [user?.email])

  const saveNote = async (enabled: boolean, textOverride = draftText) => {
    if (!user?.email) return
    const text = textOverride.trim()

    if (enabled && !text) {
      setErrorMessage('Add POD note text first.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    try {
      const response = await fetch(POD_NOTE_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.email}`,
        },
        body: JSON.stringify({
          enabled,
          text,
          color: draftColor,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        setErrorMessage(errorData.error || 'Could not save POD note.')
        return
      }

      const data = (await response.json()) as PodWeeklyNote
      setNote({ ...data, canManage })
      setDraftText(data.text || '')
      setDraftColor(data.color || 'yellow')
    } catch (error) {
      console.error('Error saving POD note:', error)
      setErrorMessage('Could not save POD note.')
    } finally {
      setIsSaving(false)
    }
  }

  const clearNote = () => {
    void saveNote(false, '')
  }

  const turnOffNote = () => {
    void saveNote(false)
  }

  if (canManage) {
    return (
      <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2">
          <textarea
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            className={`min-h-[72px] rounded-md border px-3 py-2 text-sm shadow-inner ${noteStyles[draftColor]}`}
            placeholder="Type POD note here..."
            disabled={isSaving}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              Background
              <select
                value={draftColor}
                onChange={(event) => setDraftColor(event.target.value as NoteColor)}
                disabled={isSaving}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"
              >
                <option value="yellow">Yellow</option>
                <option value="green">Green</option>
                <option value="red">Red</option>
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={turnOffNote}
                disabled={isSaving || !draftText.trim() || note?.enabled === false}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Off
              </button>
              <button
                onClick={clearNote}
                disabled={isSaving || !draftText.trim()}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Clear
              </button>
              <button
                onClick={() => saveNote(true)}
                disabled={isSaving}
                className="rounded-md bg-[#89ac44] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6d8a35] disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          {errorMessage ? <p className="text-xs font-semibold text-red-700">{errorMessage}</p> : null}
        </div>
      </div>
    )
  }

  if (!note?.enabled || !note.text.trim()) {
    return null
  }

  return (
    <div className={`mb-3 whitespace-pre-wrap rounded-lg border px-3 py-2 text-sm leading-5 shadow-sm ${noteStyles[note.color || 'yellow']}`}>
      {note.text}
    </div>
  )
}
