export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()

  const { data: student } = await supabase
    .from('student_profiles')
    .select('id')
    .limit(1)
    .single()

  if (!student) return NextResponse.json({ error: 'No student' }, { status: 404 })

  const [notesRes, cardsRes, materialsRes, profileRes] = await Promise.all([
    supabase
      .from('teacher_notes')
      .select('id, subject, source, note_text, note_language, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('report_cards')
      .select('id, file_url, grading_period, confirmed_at, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('school_materials')
      .select('id, material_type, subject, week_of, file_url, notes, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('learner_profile')
      .select('*')
      .eq('student_id', student.id)
      .single(),
  ])

  return NextResponse.json({
    studentId: student.id,
    teacherNotes: notesRes.data || [],
    reportCards: cardsRes.data || [],
    schoolMaterials: materialsRes.data || [],
    learnerProfile: profileRes.data || null,
  })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  const body = await request.json()
  const { type, studentId, ...data } = body

  if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

  if (type === 'teacher_note') {
    const { error } = await supabase.from('teacher_notes').insert({
      student_id: studentId,
      subject: data.subject,
      source: data.source,
      note_text: data.noteText,
      note_language: data.language || 'en',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (type === 'school_material') {
    const { error } = await supabase.from('school_materials').insert({
      student_id: studentId,
      material_type: data.materialType || 'other',
      subject: data.subject,
      week_of: data.weekOf || null,
      file_url: data.fileUrl || null,
      notes: data.notes || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (type === 'learner_profile_update') {
    const { error } = await supabase
      .from('learner_profile')
      .update({
        strengths: data.strengths,
        development_areas: data.developmentAreas,
        focus_notes: data.focusNotes,
        personal_context: data.personalContext,
        current_school_context: data.schoolContext,
      })
      .eq('student_id', studentId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
