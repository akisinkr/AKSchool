export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { updateLearnerProfile } from '@/lib/learner/update-profile'

export async function POST(request: NextRequest) {
  const { studentId } = await request.json()

  if (!studentId) {
    return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })
  }

  try {
    const result = await updateLearnerProfile(studentId)
    return NextResponse.json(result || { message: 'Not enough data to update' })
  } catch (error) {
    console.error('Profile update failed:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
