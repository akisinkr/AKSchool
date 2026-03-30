'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/admin/StatCard'
import { ActivityHeatmap } from '@/components/admin/ActivityHeatmap'
import { SubjectAccuracy } from '@/components/admin/SubjectAccuracy'
import { SessionHistory } from '@/components/admin/SessionHistory'
interface DashboardData {
  streak: { current: number; longest: number; freezes: number }
  totalPoints: number
  nextRewardAt: number
  pointsToNextReward: number
  totalSessions: number
  avgPointsPerSession: number
  focusScore: { avgTriggers: number; trend: 'improving' | 'stable' | 'declining' }
  activityDays: Array<{ date: string; completed: boolean; points: number }>
  subjectAccuracy: Array<{
    name: string
    colorTheme: 'math' | 'english'
    accuracy: number
    totalQuestions: number
    correctAnswers: number
  }>
  recentSessions: Array<{
    id: string
    date: string
    subjectName: string
    topicName: string
    pointsEarned: number
    completed: boolean
    reengagementTriggers: number
    hintsRequested: number
  }>
  needsAttention: string[]
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const res = await fetch('/api/admin-dashboard')
      if (!res.ok) { setLoading(false); return }
      setData(await res.json())
      setLoading(false)
    }

    loadDashboard()
  }, [])

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-400">No student data found.</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Sharon&apos;s Dashboard</h2>

      {/* Needs attention */}
      {data.needsAttention.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-orange-700 mb-2">⚠️ Needs Attention</h3>
          <ul className="space-y-1">
            {data.needsAttention.map((flag, i) => (
              <li key={i} className="text-sm text-orange-600">• {flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Streak"
          value={`${data.streak.current} days`}
          sublabel={`Best: ${data.streak.longest}`}
          icon="🔥"
        />
        <StatCard
          label="Total Points"
          value={data.totalPoints}
          sublabel={`${data.pointsToNextReward} to next reward`}
          icon="⭐"
        />
        <StatCard
          label="Sessions"
          value={data.totalSessions}
          sublabel={`Avg ${data.avgPointsPerSession} pts/session`}
          icon="📚"
        />
        <StatCard
          label="Focus Quality"
          value={`${data.focusScore.avgTriggers}/session`}
          sublabel={`Trend: ${data.focusScore.trend}`}
          icon={data.focusScore.trend === 'improving' ? '📈' : data.focusScore.trend === 'declining' ? '📉' : '➡️'}
        />
      </div>

      {/* Activity + Accuracy row */}
      <div className="grid md:grid-cols-2 gap-4">
        <ActivityHeatmap days={data.activityDays} />
        <SubjectAccuracy subjects={data.subjectAccuracy} />
      </div>

      {/* Session history */}
      <SessionHistory sessions={data.recentSessions} />
    </div>
  )
}
