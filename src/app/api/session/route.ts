export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST: create a new session
export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  const { studentId, subjectId } = await request.json()

  if (!studentId || !subjectId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // Get current topic for this subject
  const { data: settings } = await supabase
    .from('curriculum_settings')
    .select('current_topic_id')
    .eq('student_id', studentId)
    .eq('subject_id', subjectId)
    .single()

  if (!settings?.current_topic_id) {
    return NextResponse.json({ error: 'No topic set' }, { status: 400 })
  }

  // Create session record
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      student_id: studentId,
      subject_id: subjectId,
      topic_id: settings.current_topic_id,
      day_of_week: new Date().getDay(),
      time_of_day: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ sessionId: session.id, topicId: settings.current_topic_id })
}

// PATCH: update session (complete stage, add points, etc.)
export async function PATCH(request: NextRequest) {
  const supabase = getSupabase()
  const body = await request.json()
  const { sessionId, ...updates } = body

  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const { error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
