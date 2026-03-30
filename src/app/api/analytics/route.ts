export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')
  const weeks = parseInt(searchParams.get('weeks') || '4', 10)

  const supabase = getSupabase()

  const sid = studentId || (await supabase
    .from('student_profiles')
    .select('id')
    .limit(1)
    .single()).data?.id

  if (!sid) return NextResponse.json({ error: 'No student' }, { status: 404 })

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - weeks * 7)

  const [sessionsRes, practiceRes, pointsRes, streakRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, date, subject_id, points_earned, session_completed, aria_reengagement_triggers, hints_requested, time_per_stage, subjects(name)')
      .eq('student_id', sid)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date'),
    supabase
      .from('practice_results')
      .select('correct, retried, retry_correct, response_time_secs, topic_tag, question_type, session_id')
      .gte('created_at', startDate.toISOString())
      .limit(1000),
    supabase
      .from('points_ledger')
      .select('points, action, created_at')
      .eq('student_id', sid)
      .gte('created_at', startDate.toISOString()),
    supabase
      .from('streaks')
      .select('*')
      .eq('student_id', sid)
      .single(),
  ])

  const sessions = sessionsRes.data || []
  const practice = practiceRes.data || []
  const points = pointsRes.data || []
  const streak = streakRes.data

  // Session IDs for this student
  const sessionIds = new Set(sessions.map((s) => s.id))
  const studentPractice = practice.filter((p) => sessionIds.has(p.session_id))

  // === Level 1: Weekly Summary ===
  const weeklyData: Record<string, {
    sessions: number
    completedSessions: number
    totalPoints: number
    correctAnswers: number
    totalAnswers: number
    avgTriggers: number
    triggerCount: number
    sessionCount: number
  }> = {}

  for (const session of sessions) {
    const weekStart = getWeekStart(session.date)
    if (!weeklyData[weekStart]) {
      weeklyData[weekStart] = { sessions: 0, completedSessions: 0, totalPoints: 0, correctAnswers: 0, totalAnswers: 0, avgTriggers: 0, triggerCount: 0, sessionCount: 0 }
    }
    const w = weeklyData[weekStart]
    w.sessions++
    if (session.session_completed) w.completedSessions++
    w.totalPoints += session.points_earned
    w.triggerCount += session.aria_reengagement_triggers
    w.sessionCount++
  }

  for (const pr of studentPractice) {
    const session = sessions.find((s) => s.id === pr.session_id)
    if (!session) continue
    const weekStart = getWeekStart(session.date)
    if (weeklyData[weekStart]) {
      weeklyData[weekStart].totalAnswers++
      if (pr.correct) weeklyData[weekStart].correctAnswers++
    }
  }

  const weeklySummaries = Object.entries(weeklyData).map(([week, data]) => ({
    week,
    sessions: data.sessions,
    completedSessions: data.completedSessions,
    totalPoints: data.totalPoints,
    accuracy: data.totalAnswers > 0 ? Math.round((data.correctAnswers / data.totalAnswers) * 100) : 0,
    avgReengagement: data.sessionCount > 0 ? Math.round((data.triggerCount / data.sessionCount) * 10) / 10 : 0,
  }))

  // === Level 2: Subject Breakdown + Topic Mastery ===
  const subjectBreakdown: Record<string, { correct: number; total: number; sessions: number }> = {}
  for (const session of sessions) {
    const subjectName = ((session as Record<string, unknown>).subjects as Record<string, string>)?.name || 'Unknown'
    if (!subjectBreakdown[subjectName]) subjectBreakdown[subjectName] = { correct: 0, total: 0, sessions: 0 }
    subjectBreakdown[subjectName].sessions++
  }

  for (const pr of studentPractice) {
    const session = sessions.find((s) => s.id === pr.session_id)
    if (!session) continue
    const subjectName = ((session as Record<string, unknown>).subjects as Record<string, string>)?.name || 'Unknown'
    if (subjectBreakdown[subjectName]) {
      subjectBreakdown[subjectName].total++
      if (pr.correct) subjectBreakdown[subjectName].correct++
    }
  }

  // Topic mastery
  const topicStats: Record<string, { correct: number; total: number }> = {}
  for (const pr of studentPractice) {
    const tag = pr.topic_tag || 'general'
    if (!topicStats[tag]) topicStats[tag] = { correct: 0, total: 0 }
    topicStats[tag].total++
    if (pr.correct) topicStats[tag].correct++
  }

  const topicMastery = Object.entries(topicStats)
    .map(([tag, stats]) => ({
      topic: tag,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      attempts: stats.total,
      status: stats.total >= 3
        ? (stats.correct / stats.total >= 0.8 ? 'mastered' : stats.correct / stats.total >= 0.5 ? 'developing' : 'needs_review')
        : 'not_enough_data',
    }))
    .sort((a, b) => b.attempts - a.attempts)

  // Question type performance
  const questionTypeStats: Record<string, { correct: number; total: number }> = {}
  for (const pr of studentPractice) {
    const qt = pr.question_type
    if (!questionTypeStats[qt]) questionTypeStats[qt] = { correct: 0, total: 0 }
    questionTypeStats[qt].total++
    if (pr.correct) questionTypeStats[qt].correct++
  }

  // Response time trend
  const responseTimes = studentPractice
    .filter((p) => p.response_time_secs !== null)
    .map((p) => p.response_time_secs as number)
  const avgResponseTime = responseTimes.length > 0
    ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
    : 0

  return NextResponse.json({
    level1: {
      weeklySummaries,
      totalPoints: points.reduce((s, p) => s + p.points, 0),
      streak: streak ? { current: streak.current_streak, longest: streak.longest_streak, freezes: streak.freeze_count } : null,
    },
    level2: {
      subjectBreakdown: Object.entries(subjectBreakdown).map(([name, stats]) => ({
        name,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        sessions: stats.sessions,
      })),
      topicMastery,
      questionTypePerformance: Object.entries(questionTypeStats).map(([type, stats]) => ({
        type,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        attempts: stats.total,
      })),
      avgResponseTime,
    },
  })
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}
