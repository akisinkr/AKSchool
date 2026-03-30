export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { generateSessionContent } from '@/lib/anthropic/generate-session'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { studentId, topicId } = body

  if (!studentId || !topicId) {
    return NextResponse.json({ error: 'Missing studentId or topicId' }, { status: 400 })
  }

  try {
    const content = await generateSessionContent(studentId, topicId)
    return NextResponse.json(content)
  } catch (error) {
    console.error('Session generation failed:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
