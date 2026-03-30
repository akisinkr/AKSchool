export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAnthropicClient, MODEL } from '@/lib/anthropic/client'
import { buildParentGuidePrompt } from '@/lib/anthropic/prompts/parent-guide-prompt'
import crypto from 'crypto'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topicId')
  const studentId = searchParams.get('studentId')

  if (!topicId || !studentId) {
    return NextResponse.json({ error: 'Missing topicId or studentId' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Check cache
  const { data: cached } = await supabase
    .from('parent_guides')
    .select('*')
    .eq('topic_id', topicId)
    .eq('student_id', studentId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  // Load profile for hash comparison
  const { data: profile } = await supabase
    .from('learner_profile')
    .select('strengths, development_areas, personal_context, current_school_context')
    .eq('student_id', studentId)
    .single()

  const profileHash = crypto
    .createHash('md5')
    .update(JSON.stringify(profile || {}))
    .digest('hex')

  if (cached && cached.profile_hash === profileHash) {
    return NextResponse.json({
      content_en: cached.content_en,
      content_ko: cached.content_ko,
      generated_at: cached.generated_at,
      fromCache: true,
    })
  }

  // Generate new guide
  const { data: topic } = await supabase
    .from('topics')
    .select('display_name, cpa_anchor, sharon_analogy, difficulty, subjects(name, pedagogical_framework)')
    .eq('id', topicId)
    .single()

  if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

  const subject = (topic as Record<string, unknown>).subjects as { name: string; pedagogical_framework: string | null }

  const prompt = buildParentGuidePrompt({
    topic: {
      display_name: topic.display_name,
      cpa_anchor: topic.cpa_anchor,
      sharon_analogy: topic.sharon_analogy,
      difficulty: topic.difficulty,
    },
    subject: {
      name: subject.name,
      pedagogical_framework: subject.pedagogical_framework,
    },
    profile: {
      strengths: (profile?.strengths as unknown[]) || [],
      development_areas: (profile?.development_areas as unknown[]) || [],
      personal_context: (profile?.personal_context as Record<string, unknown>) || {},
      current_school_context: (profile?.current_school_context as Record<string, unknown>) || {},
    },
  })

  try {
    const client = getAnthropicClient()
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const guideContent = JSON.parse(text)

    // Format for storage
    const contentEn = formatGuideEnglish(guideContent.sections)
    const contentKo = formatGuideKorean(guideContent.sections)

    // Cache it
    await supabase.from('parent_guides').insert({
      topic_id: topicId,
      student_id: studentId,
      content_en: contentEn,
      content_ko: contentKo,
      profile_hash: profileHash,
    })

    return NextResponse.json({
      content_en: contentEn,
      content_ko: contentKo,
      generated_at: new Date().toISOString(),
      fromCache: false,
    })
  } catch (error) {
    console.error('Parent guide generation failed:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}

function formatGuideEnglish(sections: Record<string, Record<string, unknown>>): string {
  const s = sections
  let guide = ''
  guide += `## What Is This?\n${s.what_is_this.en}\n\n`
  guide += `## Why It Matters\n${s.why_it_matters.en}\n\n`
  guide += `## Where Sharon Is Right Now\n${s.where_sharon_is.en}\n\n`
  guide += `## How to Support at Home\n${s.how_to_support.en}\n\n`
  guide += `## What Miss Aria Is Teaching\n${s.what_aria_is_teaching.en}\n\n`
  guide += `## Conversation Starters\n${(s.conversation_starters.en as string[]).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n`
  guide += `## Common Mistakes to Watch For\n${s.common_mistakes.en}`
  return guide
}

function formatGuideKorean(sections: Record<string, Record<string, unknown>>): string {
  const s = sections
  let guide = ''
  guide += `## 개념 설명\n${s.what_is_this.ko}\n\n`
  guide += `## 왜 중요한가요?\n${s.why_it_matters.ko}\n\n`
  guide += `## Sharon의 현재 수준\n${s.where_sharon_is.ko}\n\n`
  guide += `## 집에서 어떻게 도와줄까요?\n${s.how_to_support.ko}\n\n`
  guide += `## Miss Aria가 가르치는 내용\n${s.what_aria_is_teaching.ko}\n\n`
  guide += `## 대화 시작하기\n${(s.conversation_starters.ko as string[]).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n`
  guide += `## 자주 하는 실수들\n${s.common_mistakes.ko}`
  return guide
}
