import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const REWARD_MILESTONES = [500, 1500, 3500]

export async function GET() {
  const today = new Date().toISOString().split('T')[0]

  // Get student (single student app for now)
  const { data: student } = await supabase
    .from('student_profiles')
    .select('id, name')
    .limit(1)
    .single()

  if (!student) {
    return NextResponse.json({ error: 'No student found' }, { status: 404 })
  }

  // Parallel queries
  const [streakResult, pointsResult, subjectsResult, rewardsResult, todaySessionsResult] = await Promise.all([
    supabase.from('streaks').select('*').eq('student_id', student.id).single(),
    supabase.from('points_ledger').select('points').eq('student_id', student.id),
    supabase
      .from('subjects')
      .select('id, name, color_theme, sort_order')
      .eq('student_id', student.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('rewards')
      .select('milestone_pts, description_en')
      .eq('student_id', student.id)
      .is('earned_at', null)
      .order('milestone_pts')
      .limit(1),
    supabase
      .from('sessions')
      .select('subject_id, session_completed')
      .eq('student_id', student.id)
      .eq('date', today)
      .eq('session_completed', true),
  ])

  const totalPoints = (pointsResult.data || []).reduce((sum, r) => sum + r.points, 0)
  const completedSubjectIds = new Set((todaySessionsResult.data || []).map((s) => s.subject_id))

  // Get current topics for each subject
  const subjectIds = (subjectsResult.data || []).map((s) => s.id)
  const { data: currSettings } = await supabase
    .from('curriculum_settings')
    .select('subject_id, current_topic_id')
    .eq('student_id', student.id)
    .in('subject_id', subjectIds.length > 0 ? subjectIds : ['none'])

  const topicIds = (currSettings || []).map((c) => c.current_topic_id).filter(Boolean)
  const { data: topics } = await supabase
    .from('topics')
    .select('id, display_name')
    .in('id', topicIds.length > 0 ? topicIds : ['none'])

  const topicMap = new Map((topics || []).map((t) => [t.id, t.display_name]))
  const settingsMap = new Map((currSettings || []).map((c) => [c.subject_id, c.current_topic_id]))

  const subjects = (subjectsResult.data || []).map((s) => ({
    id: s.id,
    name: s.name,
    colorTheme: s.name.toLowerCase() === 'math' ? 'math' : 'english',
    currentTopic: topicMap.get(settingsMap.get(s.id) || '') || 'Not set',
    mascotEmoji: s.name.toLowerCase() === 'math' ? '🔢' : '📖',
    accuracy: 0,
    isCompleteToday: completedSubjectIds.has(s.id),
  }))

  const nextMilestone = REWARD_MILESTONES.find((m) => m > totalPoints)
  const rewardData = rewardsResult.data?.[0]

  return NextResponse.json({
    studentName: student.name,
    streak: streakResult.data || { current_streak: 0, longest_streak: 0, freeze_count: 0 },
    totalPoints,
    subjects,
    nextReward: nextMilestone
      ? { milestone: nextMilestone, description: rewardData?.description_en || null }
      : null,
    ariaMessage: null,
  })
}
