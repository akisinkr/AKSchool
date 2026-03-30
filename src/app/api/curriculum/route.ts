import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { studentId, subjectId, topicId, rotationMode } = body

  if (!studentId || !subjectId) {
    return NextResponse.json({ error: 'Missing studentId or subjectId' }, { status: 400 })
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

  // Build update
  const updates: Record<string, unknown> = { last_changed_by: user.id }
  if (topicId) updates.current_topic_id = topicId
  if (rotationMode) updates.rotation_mode = rotationMode

  const { error } = await supabase
    .from('curriculum_settings')
    .update(updates)
    .eq('student_id', studentId)
    .eq('subject_id', subjectId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
