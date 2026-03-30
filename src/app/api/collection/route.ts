export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: student } = await supabase
    .from('student_profiles')
    .select('id')
    .limit(1)
    .single()

  if (!student) return NextResponse.json({ error: 'No student' }, { status: 404 })

  const [allCharsRes, earnedRes] = await Promise.all([
    supabase
      .from('characters')
      .select('id, name, name_ko, rarity, description_en, description_ko, illustration_url')
      .order('rarity'),
    supabase
      .from('characters_earned')
      .select('character_id, earned_at')
      .eq('student_id', student.id),
  ])

  const earnedIds = new Set((earnedRes.data || []).map((e) => e.character_id))
  const earnedMap = new Map((earnedRes.data || []).map((e) => [e.character_id, e.earned_at]))

  const characters = (allCharsRes.data || []).map((c) => ({
    ...c,
    earned: earnedIds.has(c.id),
    earned_at: earnedMap.get(c.id) || null,
  }))

  return NextResponse.json({
    characters,
    totalEarned: earnedIds.size,
    totalAvailable: allCharsRes.data?.length || 0,
  })
}
