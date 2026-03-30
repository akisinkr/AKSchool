import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSessionContent } from '@/lib/anthropic/generate-session'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  const body = await request.json()
  const { studentId, topicId } = body

  if (!studentId || !topicId) {
    return NextResponse.json({ error: 'Missing studentId or topicId' }, { status: 400 })
  }

  // Verify parent owns this student
  const { data: student } = await supabase
    .from('student_profiles')
    .select('family_id')
    .eq('id', studentId)
    .single()

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { data: parent } = await supabase
    .from('parent_profiles')
    .select('family_id')
    .eq('id', user.id)
    .single()

  if (!parent || parent.family_id !== student.family_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const content = await generateSessionContent(studentId, topicId)
    return NextResponse.json(content)
  } catch (error) {
    console.error('Session generation failed:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
