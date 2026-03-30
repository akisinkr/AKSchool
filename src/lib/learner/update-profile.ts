import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface TopicPerformance {
  topicTag: string
  correct: number
  total: number
  accuracy: number
}

export async function updateLearnerProfile(studentId: string) {
  const supabase = getSupabase()

  // Get last 30 days of practice results
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: results } = await supabase
    .from('practice_results')
    .select('correct, retried, retry_correct, response_time_secs, topic_tag, question_type, sessions(student_id, subject_id, subjects(name))')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .limit(500)

  // Filter to this student's results
  const studentResults = (results || []).filter((r) => {
    const session = r.sessions as unknown as Record<string, unknown> | null
    return session && (session as Record<string, string>).student_id === studentId
  })

  if (studentResults.length < 5) return // Not enough data to update

  // Analyze topic performance
  const topicStats: Record<string, { correct: number; total: number }> = {}
  for (const r of studentResults) {
    const tag = r.topic_tag || 'general'
    if (!topicStats[tag]) topicStats[tag] = { correct: 0, total: 0 }
    topicStats[tag].total++
    if (r.correct) topicStats[tag].correct++
  }

  const topicPerformance: TopicPerformance[] = Object.entries(topicStats).map(([tag, stats]) => ({
    topicTag: tag,
    correct: stats.correct,
    total: stats.total,
    accuracy: Math.round((stats.correct / stats.total) * 100),
  }))

  // Strengths: topics with >80% accuracy and at least 3 attempts
  const strengths = topicPerformance
    .filter((t) => t.accuracy >= 80 && t.total >= 3)
    .sort((a, b) => b.accuracy - a.accuracy)
    .map((t) => t.topicTag)

  // Development areas: topics with <60% accuracy and at least 3 attempts
  const developmentAreas = topicPerformance
    .filter((t) => t.accuracy < 60 && t.total >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((t) => t.topicTag)

  // Focus analysis from sessions
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('aria_reengagement_triggers, hints_requested, time_per_stage, points_earned')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(10)

  const sessions = recentSessions || []
  const avgTriggers = sessions.length > 0
    ? sessions.reduce((s, r) => s + r.aria_reengagement_triggers, 0) / sessions.length
    : 0
  const avgHints = sessions.length > 0
    ? sessions.reduce((s, r) => s + r.hints_requested, 0) / sessions.length
    : 0

  // Retry analysis
  const retryRate = studentResults.length > 0
    ? studentResults.filter((r) => r.retried).length / studentResults.length
    : 0

  // Average response time
  const responseTimes = studentResults
    .filter((r) => r.response_time_secs !== null)
    .map((r) => r.response_time_secs as number)
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0

  // Update focus notes
  const { data: existingProfile } = await supabase
    .from('learner_profile')
    .select('focus_notes')
    .eq('student_id', studentId)
    .single()

  const existingNotes = (existingProfile?.focus_notes as Record<string, unknown>) || {}

  const updatedFocusNotes = {
    ...existingNotes,
    avg_reengagement_triggers: Math.round(avgTriggers * 10) / 10,
    avg_hints_per_session: Math.round(avgHints * 10) / 10,
    retry_rate: `${Math.round(retryRate * 100)}%`,
    avg_response_time_secs: Math.round(avgResponseTime * 10) / 10,
    focus_trend: avgTriggers > 2 ? 'needs support' : avgTriggers > 1 ? 'moderate' : 'strong',
    last_auto_update: new Date().toISOString(),
  }

  // Update the profile
  await supabase
    .from('learner_profile')
    .update({
      strengths: strengths,
      development_areas: developmentAreas,
      focus_notes: updatedFocusNotes,
    })
    .eq('student_id', studentId)

  return {
    strengths,
    developmentAreas,
    focusNotes: updatedFocusNotes,
    topicPerformance,
  }
}
