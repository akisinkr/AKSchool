'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/admin/StatCard'
import { ActivityHeatmap } from '@/components/admin/ActivityHeatmap'
import { SubjectAccuracy } from '@/components/admin/SubjectAccuracy'
import { SessionHistory } from '@/components/admin/SessionHistory'
import { createClient } from '@/lib/supabase/client'

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

const REWARD_MILESTONES = [500, 1500, 3500]

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient()

      // Get student
      const { data: student } = await supabase
        .from('student_profiles')
        .select('id, name')
        .limit(1)
        .single()

      if (!student) { setLoading(false); return }

      // Parallel queries
      const [streakRes, pointsRes, sessionsRes, practiceRes] = await Promise.all([
        supabase.from('streaks').select('*').eq('student_id', student.id).single(),
        supabase.from('points_ledger').select('points, created_at').eq('student_id', student.id),
        supabase
          .from('sessions')
          .select('id, date, subject_id, points_earned, session_completed, aria_reengagement_triggers, hints_requested, subjects(name), topics(display_name)')
          .eq('student_id', student.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('practice_results')
          .select('correct, session_id, sessions(subject_id, subjects(name))')
          .eq('sessions.student_id', student.id),
      ])

      const streak = streakRes.data
      const totalPoints = (pointsRes.data || []).reduce((s, r) => s + r.points, 0)
      const sessions = sessionsRes.data || []

      // Calculate next reward
      const nextRewardAt = REWARD_MILESTONES.find((m) => m > totalPoints) || 3500

      // Avg points per session
      const completedSessions = sessions.filter((s) => s.session_completed)
      const avgPoints = completedSessions.length > 0
        ? Math.round(completedSessions.reduce((s, r) => s + r.points_earned, 0) / completedSessions.length)
        : 0

      // Focus score (avg re-engagement triggers)
      const triggers = completedSessions.map((s) => s.aria_reengagement_triggers)
      const avgTriggers = triggers.length > 0
        ? Math.round((triggers.reduce((a, b) => a + b, 0) / triggers.length) * 10) / 10
        : 0

      // Focus trend (compare last 5 vs previous 5)
      let focusTrend: 'improving' | 'stable' | 'declining' = 'stable'
      if (triggers.length >= 10) {
        const recent = triggers.slice(0, 5).reduce((a, b) => a + b, 0) / 5
        const previous = triggers.slice(5, 10).reduce((a, b) => a + b, 0) / 5
        if (recent < previous - 0.3) focusTrend = 'improving'
        else if (recent > previous + 0.3) focusTrend = 'declining'
      }

      // Activity heatmap (last 28 days)
      const today = new Date()
      const activityDays = []
      for (let i = 27; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const daySessions = sessions.filter((s) => s.date === dateStr)
        const dayPoints = daySessions.reduce((s, r) => s + r.points_earned, 0)
        activityDays.push({
          date: dateStr,
          completed: daySessions.some((s) => s.session_completed),
          points: dayPoints,
        })
      }

      // Subject accuracy
      const practiceData = practiceRes.data || []
      const subjectStats: Record<string, { correct: number; total: number }> = {}
      for (const pr of practiceData) {
        const subjectName = (pr as Record<string, unknown>).sessions
          ? ((pr as Record<string, unknown>).sessions as Record<string, unknown>).subjects
            ? (((pr as Record<string, unknown>).sessions as Record<string, unknown>).subjects as Record<string, string>).name
            : 'Unknown'
          : 'Unknown'
        if (!subjectStats[subjectName]) subjectStats[subjectName] = { correct: 0, total: 0 }
        subjectStats[subjectName].total++
        if (pr.correct) subjectStats[subjectName].correct++
      }

      const subjectAccuracy = Object.entries(subjectStats).map(([name, stats]) => ({
        name,
        colorTheme: (name.toLowerCase() === 'math' ? 'math' : 'english') as 'math' | 'english',
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
      }))

      // Recent sessions for table
      const recentSessions = sessions.slice(0, 10).map((s) => ({
        id: s.id,
        date: s.date,
        subjectName: ((s as Record<string, unknown>).subjects as Record<string, string>)?.name || 'Unknown',
        topicName: ((s as Record<string, unknown>).topics as Record<string, string>)?.display_name || 'Unknown',
        pointsEarned: s.points_earned,
        completed: s.session_completed,
        reengagementTriggers: s.aria_reengagement_triggers,
        hintsRequested: s.hints_requested,
      }))

      // Needs attention flags
      const needsAttention: string[] = []
      if ((streak?.current_streak || 0) === 0) needsAttention.push('Streak broken — encourage Sharon to start a new one')
      if (avgTriggers > 2) needsAttention.push('High re-engagement triggers — Sharon may need shorter sessions')
      if (focusTrend === 'declining') needsAttention.push('Focus trend declining over recent sessions')
      for (const [name, stats] of Object.entries(subjectStats)) {
        if (stats.total >= 10 && (stats.correct / stats.total) < 0.5) {
          needsAttention.push(`${name} accuracy below 50% — consider reviewing topic difficulty`)
        }
      }

      setData({
        streak: {
          current: streak?.current_streak || 0,
          longest: streak?.longest_streak || 0,
          freezes: streak?.freeze_count || 0,
        },
        totalPoints,
        nextRewardAt,
        pointsToNextReward: nextRewardAt - totalPoints,
        totalSessions: completedSessions.length,
        avgPointsPerSession: avgPoints,
        focusScore: { avgTriggers, trend: focusTrend },
        activityDays,
        subjectAccuracy,
        recentSessions,
        needsAttention,
      })
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
