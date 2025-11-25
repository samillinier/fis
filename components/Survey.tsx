'use client'

import { useData } from '@/context/DataContext'
import { useFilters } from '@/components/FilterContext'

const isValidWorkroomName = (name: string): boolean => {
  const normalizedName = (name || '').toLowerCase().trim()
  return (
    normalizedName !== 'location #' &&
    normalizedName !== 'location' &&
    normalizedName !== '' &&
    !normalizedName.includes('location #')
  )
}

export default function Survey() {
  const { data } = useData()
  const { selectedWorkroom } = useFilters()

  let filteredData = data.workrooms.filter((w) => isValidWorkroomName(w.name || ''))
  if (selectedWorkroom !== 'all') {
    filteredData = filteredData.filter((w) => w.name === selectedWorkroom)
  }

  // Extract survey data from workrooms
  const surveyData = filteredData
    .filter((w) => {
      // Include records that have survey-related data
      return (
        w.surveyDate ||
        w.surveyComment ||
        w.laborCategory ||
        (w as any).category ||
        w.reliableHomeImprovementScore ||
        w.timeTakenToComplete ||
        w.projectValueScore ||
        w.installerKnowledgeScore ||
        w.ltrScore ||
        w.craftScore ||
        w.profScore
      )
    })
    .map((w) => ({
      workroom: w.name || 'Unknown',
      surveyDate: w.surveyDate || (w as any).surveyDate || null,
      surveyComment: w.surveyComment || (w as any).surveyComment || null,
      laborCategory: w.laborCategory || (w as any).laborCategory || (w as any).category || 'N/A',
      reliableHomeImprovementScore: w.reliableHomeImprovementScore || w.reliableHomeImprovement || (w as any).reliableHomeImprovementScore || null,
      timeTakenToComplete: w.timeTakenToComplete || w.timeToComplete || (w as any).timeTakenToComplete || null,
      projectValueScore: w.projectValueScore || w.projectValue || (w as any).projectValueScore || null,
      installerKnowledgeScore: w.installerKnowledgeScore || w.installerKnowledge || (w as any).installerKnowledgeScore || null,
      ltrScore: w.ltrScore || (w as any).ltrScore || null,
      craftScore: w.craftScore || (w as any).craftScore || null,
      profScore: w.profScore || w.professionalScore || (w as any).profScore || (w as any).professionalScore || null,
      recordId: w.id || '',
    }))
    .sort((a, b) => {
      // Sort by survey date (most recent first), then by workroom
      if (a.surveyDate && b.surveyDate) {
        const dateA = new Date(a.surveyDate).getTime()
        const dateB = new Date(b.surveyDate).getTime()
        return dateB - dateA
      }
      if (a.surveyDate) return -1
      if (b.surveyDate) return 1
      return a.workroom.localeCompare(b.workroom)
    })

  const formatDate = (date: string | number | Date | null | undefined): string => {
    if (!date) return 'N/A'
    try {
      const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return 'N/A'
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return String(date)
    }
  }

  const hasData = surveyData.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Survey Data</h2>
          <p className="text-gray-600">Survey information by workroom and location</p>
        </div>
        {hasData && (
          <div className="bg-black text-white px-4 py-2 rounded-lg">
            <div className="text-sm text-gray-300">Total Surveys</div>
            <div className="text-2xl font-semibold">{surveyData.length}</div>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">No survey data available</p>
          <p className="text-gray-400 text-sm">
            Upload a file with survey information to see survey data.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: '800px', overflowY: 'auto' }}>
            <table className="professional-table professional-table-zebra" style={{ fontSize: '0.875rem', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Workroom</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Survey Date</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Labor Category</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>LTR</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Craft</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Prof</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>RHIS</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Time Taken</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>PRS</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>IKS</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Survey Comment</th>
                </tr>
              </thead>
              <tbody>
                {surveyData.map((survey, index) => {
                  const getScoreBadge = (score: number | null | undefined) => {
                    if (score === null || score === undefined) {
                      return 'badge-neutral'
                    }
                    // Green for scores above 9.0 (works for 0-10 scale: 9.1, 9.5, 10.0, etc.)
                    if (score > 9) return 'badge-positive'
                    // Also green for scores >= 80 on 0-100 scale
                    if (score >= 80) return 'badge-positive'
                    // Yellow/neutral for scores 60-79 (on 0-100 scale) or 6-9 (on 0-10 scale)
                    if (score >= 60) return 'badge-neutral'
                    // Orange/warning for scores below 60 (on 0-100 scale) or below 6 (on 0-10 scale)
                    return 'badge-warning'
                  }

                  const formatScore = (score: number | null | undefined): string => {
                    if (score === null || score === undefined) return 'N/A'
                    return score.toFixed(1)
                  }

                  const formatTime = (time: number | null | undefined): string => {
                    if (time === null || time === undefined) return 'N/A'
                    return `${time} days`
                  }

                  return (
                    <tr key={survey.recordId || index}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{survey.workroom}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{formatDate(survey.surveyDate)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="badge-pill badge-neutral" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          {survey.laborCategory}
                        </span>
                      </td>
                      <td align="right" style={{ padding: '0.75rem 1rem' }}>
                        {survey.ltrScore !== null && survey.ltrScore !== undefined ? (
                          <span className={`badge-pill ${getScoreBadge(survey.ltrScore)}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                            {formatScore(survey.ltrScore)}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td align="right" style={{ padding: '0.75rem 1rem' }}>
                        {survey.craftScore !== null && survey.craftScore !== undefined ? (
                          <span className={`badge-pill ${getScoreBadge(survey.craftScore)}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                            {formatScore(survey.craftScore)}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td align="right" style={{ padding: '0.75rem 1rem' }}>
                        {survey.profScore !== null && survey.profScore !== undefined ? (
                          <span className={`badge-pill ${getScoreBadge(survey.profScore)}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                            {formatScore(survey.profScore)}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td align="right" style={{ padding: '0.75rem 1rem' }}>
                        {survey.reliableHomeImprovementScore !== null && survey.reliableHomeImprovementScore !== undefined ? (
                          <span className={`badge-pill ${getScoreBadge(survey.reliableHomeImprovementScore)}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                            {formatScore(survey.reliableHomeImprovementScore)}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td align="right" style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>
                        {formatTime(survey.timeTakenToComplete)}
                      </td>
                      <td align="right" style={{ padding: '0.75rem 1rem' }}>
                        {survey.projectValueScore !== null && survey.projectValueScore !== undefined ? (
                          <span className={`badge-pill ${getScoreBadge(survey.projectValueScore)}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                            {formatScore(survey.projectValueScore)}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td align="right" style={{ padding: '0.75rem 1rem' }}>
                        {survey.installerKnowledgeScore !== null && survey.installerKnowledgeScore !== undefined ? (
                          <span className={`badge-pill ${getScoreBadge(survey.installerKnowledgeScore)}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                            {formatScore(survey.installerKnowledgeScore)}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', maxWidth: '400px', wordBreak: 'break-word' }}>
                        {survey.surveyComment ? (
                          <span className="text-gray-700" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                            {survey.surveyComment}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">No comment</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

