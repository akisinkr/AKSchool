import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const REWARD_MILESTONES = [500, 1500, 3500]

export async function GET() {
  const { data: student } = await supabase
    .from('student_profiles')
    .select('id, name')
    .limit(1)
    .single()

  if (!student) {
    return NextResponse.json({ error: 'No student found' }, { status: 404 })
  }

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
      .select('correct, session_id')
      .limit(500),
  ])

  const streak = streakRes.data
  const totalPoints = (pointsRes.data || []).reduce((s, r) => s + r.points, 0)
  const sessions = sessionsRes.data || []
  const nextRewardAt = REWARD_MILESTONES.find((m) => m > totalPoints) || 3500

  const completedSessions = sessions.filter((s) => s.session_completed)
  const avgPoints = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((s, r) => s + r.points_earned, 0) / completedSessions.length)
    : 0

  const triggers = completedSessions.map((s) => s.aria_reengagement_triggers)
  const avgTriggers = triggers.length > 0
    ? Math.round((triggers.reduce((a, b) => a + b, 0) / triggers.length) * 10) / 10
    : 0

  let focusTrend: string = 'stable'
  if (triggers.length >= 10) {
    const recent = triggers.slice(0, 5).reduce((a, b) => a + b, 0) / 5
    const previous = triggers.slice(5, 10).reduce((a, b) => a + b, 0) / 5
    if (recent < previous - 0.3) focusTrend = 'improving'
    else if (recent > previous + 0.3) focusTrend = 'declining'
  }

  // Activity heatmap
  const today = new Date()
  const activityDays = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const daySessions = sessions.filter((s) => s.date === dateStr)
    activityDays.push({
      date: dateStr,
      completed: daySessions.some((s) => s.session_completed),
      points: daySessions.reduce((s, r) => s + r.points_earned, 0),
    })
  }

  // Subject accuracy from practice results
  const sessionMap = new Map(sessions.map((s) => [s.id, s]))
  const subjectStats: Record<string, { correct: number; total: number }> = {}
  for (const pr of (practiceRes.data || [])) {
    const session = sessionMap.get(pr.session_id)
    if (!session) continue
    const subjectName = ((session as Record<string, unknown>).subjects as Record<string, string>)?.name || 'Unknown'
    if (!subjectStats[subjectName]) subjectStats[subjectName] = { correct: 0, total: 0 }
    subjectStats[subjectName].total++
    if (pr.correct) subjectStats[subjectName].correct++
  }

  const subjectAccuracy = Object.entries(subjectStats).map(([name, stats]) => ({
    name,
    colorTheme: name.toLowerCase() === 'math' ? 'math' : 'english',
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    totalQuestions: stats.total,
    correctAnswers: stats.correct,
  }))

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

  const needsAttention: string[] = []
  if ((streak?.current_streak || 0) === 0) needsAttention.push('Streak broken — encourage Sharon to start a new one')
  if (avgTriggers > 2) needsAttention.push('High re-engagement triggers — Sharon may need shorter sessions')
  if (focusTrend === 'declining') needsAttention.push('Focus trend declining over recent sessions')

  return NextResponse.json({
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
}
