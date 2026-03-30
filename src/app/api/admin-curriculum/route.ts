import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data: student } = await supabase
    .from('student_profiles')
    .select('id')
    .limit(1)
    .single()

  if (!student) {
    return NextResponse.json({ error: 'No student found' }, { status: 404 })
  }

  const { data: subjectsData } = await supabase
    .from('subjects')
    .select('id, name, sort_order')
    .eq('student_id', student.id)
    .eq('is_active', true)
    .order('sort_order')

  if (!subjectsData) {
    return NextResponse.json({ subjects: [] })
  }

  const result = []

  for (const subject of subjectsData) {
    const [settingsRes, topicsRes] = await Promise.all([
      supabase
        .from('curriculum_settings')
        .select('current_topic_id, rotation_mode')
        .eq('student_id', student.id)
        .eq('subject_id', subject.id)
        .single(),
      supabase
        .from('topics')
        .select('id, display_name, difficulty, cpa_anchor, sharon_analogy, tags, kis_curriculum_aligned, is_active')
        .eq('subject_id', subject.id)
        .order('difficulty'),
    ])

    const currentTopicId = settingsRes.data?.current_topic_id || null
    const topics = topicsRes.data || []
    const currentTopic = topics.find((t) => t.id === currentTopicId)

    result.push({
      id: subject.id,
      name: subject.name,
      currentTopicId,
      currentTopicName: currentTopic?.display_name || null,
      rotationMode: settingsRes.data?.rotation_mode || 'auto',
      topics,
    })
  }

  return NextResponse.json({ subjects: result, studentId: student.id })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { studentId, subjectId, topicId, rotationMode } = body

  if (!studentId || !subjectId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
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
