import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { awardSessionPoints, updateStreak } from '@/lib/points/points-service'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { studentId, sessionId, learnCompleted, practiceCorrectCount, perfectPractice, applySubmitted } = body

  if (!studentId || !sessionId) {
    return NextResponse.json({ error: 'Missing studentId or sessionId' }, { status: 400 })
  }

  // Verify parent owns student
  const { data: student } = await supabase
    .from('student_profiles')
    .select('family_id')
    .eq('id', studentId)
    .single()

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const { data: parent } = await supabase
    .from('parent_profiles')
    .select('family_id')
    .eq('id', user.id)
    .single()

  if (!parent || parent.family_id !== student.family_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const pointsResult = await awardSessionPoints(studentId, sessionId, {
      learnCompleted: learnCompleted ?? false,
      practiceCorrectCount: practiceCorrectCount ?? 0,
      perfectPractice: perfectPractice ?? false,
      applySubmitted: applySubmitted ?? false,
    })

    const streakResult = await updateStreak(studentId, false)

    return NextResponse.json({
      ...pointsResult,
      streak: streakResult,
    })
  } catch (error) {
    console.error('Award points failed:', error)
    return NextResponse.json({ error: 'Failed to award points' }, { status: 500 })
  }
}
