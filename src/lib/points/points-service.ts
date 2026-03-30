import { createClient } from '@/lib/supabase/server'

type PointAction =
  | 'learn_complete'
  | 'practice_correct'
  | 'apply_submitted'
  | 'perfect_practice_bonus'
  | 'daily_streak_bonus'
  | 'surprise_bonus'

const POINT_VALUES: Record<PointAction, number> = {
  learn_complete: 10,
  practice_correct: 5,
  apply_submitted: 15,
  perfect_practice_bonus: 10,
  daily_streak_bonus: 10,
  surprise_bonus: 0, // variable, set at call time
}

export async function awardPoints(
  studentId: string,
  sessionId: string,
  action: PointAction,
  customPoints?: number
): Promise<{ points: number; totalPoints: number; characterUnlocked: string | null }> {
  const supabase = createClient()
  const points = customPoints ?? POINT_VALUES[action]

  // Insert ledger entry
  const { error: ledgerError } = await supabase.from('points_ledger').insert({
    student_id: studentId,
    session_id: sessionId,
    action,
    points,
  })
  if (ledgerError) throw new Error(`Failed to record points: ${ledgerError.message}`)

  // Get total points
  const { data: ledgerSum } = await supabase
    .from('points_ledger')
    .select('points')
    .eq('student_id', studentId)

  const totalPoints = (ledgerSum || []).reduce((sum, row) => sum + row.points, 0)

  // Check for character unlock at every 100 pts
  const characterUnlocked = await checkCharacterUnlock(studentId, totalPoints)

  return { points, totalPoints, characterUnlocked }
}

export async function awardSessionPoints(
  studentId: string,
  sessionId: string,
  results: {
    learnCompleted: boolean
    practiceCorrectCount: number
    perfectPractice: boolean
    applySubmitted: boolean
  }
): Promise<{
  breakdown: Array<{ action: PointAction; points: number }>
  totalAwarded: number
  totalPoints: number
  characterUnlocked: string | null
}> {
  const breakdown: Array<{ action: PointAction; points: number }> = []
  let lastUnlocked: string | null = null

  if (results.learnCompleted) {
    const r = await awardPoints(studentId, sessionId, 'learn_complete')
    breakdown.push({ action: 'learn_complete', points: r.points })
    if (r.characterUnlocked) lastUnlocked = r.characterUnlocked
  }

  for (let i = 0; i < results.practiceCorrectCount; i++) {
    const r = await awardPoints(studentId, sessionId, 'practice_correct')
    breakdown.push({ action: 'practice_correct', points: r.points })
    if (r.characterUnlocked) lastUnlocked = r.characterUnlocked
  }

  if (results.perfectPractice) {
    const r = await awardPoints(studentId, sessionId, 'perfect_practice_bonus')
    breakdown.push({ action: 'perfect_practice_bonus', points: r.points })
    if (r.characterUnlocked) lastUnlocked = r.characterUnlocked
  }

  if (results.applySubmitted) {
    const r = await awardPoints(studentId, sessionId, 'apply_submitted')
    breakdown.push({ action: 'apply_submitted', points: r.points })
    if (r.characterUnlocked) lastUnlocked = r.characterUnlocked
  }

  const totalAwarded = breakdown.reduce((sum, b) => sum + b.points, 0)

  // Get final total
  const supabase = createClient()
  const { data: ledgerSum } = await supabase
    .from('points_ledger')
    .select('points')
    .eq('student_id', studentId)
  const totalPoints = (ledgerSum || []).reduce((sum, row) => sum + row.points, 0)

  return { breakdown, totalAwarded, totalPoints, characterUnlocked: lastUnlocked }
}

async function checkCharacterUnlock(
  studentId: string,
  totalPoints: number
): Promise<string | null> {
  const supabase = createClient()

  // Every 100 pts = one character. How many should they have?
  const expectedCount = Math.floor(totalPoints / 100)

  // How many do they already have?
  const { count: earnedCount } = await supabase
    .from('characters_earned')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)

  if ((earnedCount || 0) >= expectedCount) return null

  // Find a character they haven't earned yet
  const { data: earned } = await supabase
    .from('characters_earned')
    .select('character_id')
    .eq('student_id', studentId)

  const earnedIds = (earned || []).map((e) => e.character_id)

  // Pick next character by rarity-weighted random
  // Common unlocks first, then uncommon, rare, legendary
  const rarityOrder = ['common', 'uncommon', 'rare', 'legendary']
  let nextCharacter = null

  for (const rarity of rarityOrder) {
    let query = supabase
      .from('characters')
      .select('id, name')
      .eq('rarity', rarity)
      .limit(1)

    if (earnedIds.length > 0) {
      query = query.not('id', 'in', `(${earnedIds.join(',')})`)
    }

    const { data } = await query
    if (data && data.length > 0) {
      nextCharacter = data[0]
      break
    }
  }

  if (!nextCharacter) return null

  // Award the character
  await supabase.from('characters_earned').insert({
    student_id: studentId,
    character_id: nextCharacter.id,
    earned_trigger: `${totalPoints}_points`,
  })

  return nextCharacter.name
}

export async function updateStreak(
  studentId: string,
  bothSubjectsCompleted: boolean
): Promise<{ currentStreak: number; freezeEarned: boolean }> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('student_id', studentId)
    .single()

  if (!streak) throw new Error('Streak record not found')

  const lastDate = streak.last_session_date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = streak.current_streak
  let freezeEarned = false

  if (lastDate === today) {
    // Already counted today
    return { currentStreak: newStreak, freezeEarned: false }
  } else if (lastDate === yesterdayStr) {
    // Consecutive day
    newStreak += 1
  } else if (lastDate && streak.freeze_count > 0) {
    // Missed a day but have freeze
    await supabase
      .from('streaks')
      .update({ freeze_count: streak.freeze_count - 1 })
      .eq('student_id', studentId)
    newStreak += 1
  } else {
    // Streak broken
    newStreak = 1
  }

  const longestStreak = Math.max(streak.longest_streak, newStreak)

  // Check if freeze earned (both subjects completed + perfect practice)
  if (bothSubjectsCompleted && streak.freeze_count < 2) {
    freezeEarned = true
  }

  await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_session_date: today,
      freeze_count: freezeEarned ? streak.freeze_count + 1 : streak.freeze_count,
    })
    .eq('student_id', studentId)

  return { currentStreak: newStreak, freezeEarned }
}
