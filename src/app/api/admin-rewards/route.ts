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

  const [rewardsRes, messagesRes, earnedRes, pointsRes] = await Promise.all([
    supabase
      .from('rewards')
      .select('*')
      .eq('student_id', student.id)
      .order('milestone_pts'),
    supabase
      .from('parent_messages')
      .select('id, from_parent_id, message_text, message_language, queued_at, delivered_at, parent_profiles(name)')
      .eq('student_id', student.id)
      .order('queued_at', { ascending: false })
      .limit(20),
    supabase
      .from('characters_earned')
      .select('earned_at, earned_trigger, characters(id, name, name_ko, rarity, description_en, illustration_url)')
      .eq('student_id', student.id)
      .order('earned_at', { ascending: false }),
    supabase
      .from('points_ledger')
      .select('points')
      .eq('student_id', student.id),
  ])

  const totalPoints = (pointsRes.data || []).reduce((s, r) => s + r.points, 0)

  return NextResponse.json({
    studentId: student.id,
    totalPoints,
    rewards: rewardsRes.data || [],
    messages: messagesRes.data || [],
    charactersEarned: earnedRes.data || [],
  })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  const body = await request.json()
  const { type, studentId, ...data } = body

  if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

  if (type === 'reward') {
    const { error } = await supabase.from('rewards').insert({
      student_id: studentId,
      milestone_pts: data.milestonePts,
      description_en: data.descriptionEn || null,
      description_ko: data.descriptionKo || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (type === 'message') {
    const { error } = await supabase.from('parent_messages').insert({
      student_id: studentId,
      from_parent_id: data.fromParentId,
      message_text: data.messageText,
      message_language: data.language || 'en',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
