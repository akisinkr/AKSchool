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
  surprise: string | null
  streak: { currentStreak: number; freezeEarned: boolean; freezeUsed: boolean; dailyStreakBonus: boolean }
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

  // Check if both subjects completed today → daily streak bonus
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('subject_id, session_completed')
    .eq('student_id', studentId)
    .eq('date', today)
    .eq('session_completed', true)

  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('id')
    .eq('student_id', studentId)
    .eq('is_active', true)

  const completedSubjectIds = new Set((todaySessions || []).map((s) => s.subject_id))
  const allSubjectIds = (allSubjects || []).map((s) => s.id)
  const bothCompleted = allSubjectIds.length > 0 && allSubjectIds.every((id) => completedSubjectIds.has(id))

  // Check if daily streak bonus already awarded today
  const { data: todayBonuses } = await supabase
    .from('points_ledger')
    .select('id')
    .eq('student_id', studentId)
    .eq('action', 'daily_streak_bonus')
    .gte('created_at', `${today}T00:00:00`)
    .limit(1)

  if (bothCompleted && (!todayBonuses || todayBonuses.length === 0)) {
    const r = await awardPoints(studentId, sessionId, 'daily_streak_bonus')
    breakdown.push({ action: 'daily_streak_bonus', points: r.points })
    if (r.characterUnlocked) lastUnlocked = r.characterUnlocked
  }

  // Variable surprise reward (~1 in 5 sessions)
  const surprise = checkSurpriseReward()
  if (surprise) {
    const r = await awardPoints(studentId, sessionId, 'surprise_bonus', surprise.points)
    breakdown.push({ action: 'surprise_bonus', points: r.points })
    if (r.characterUnlocked) lastUnlocked = r.characterUnlocked
  }

  const totalAwarded = breakdown.reduce((sum, b) => sum + b.points, 0)

  const { data: ledgerSum } = await supabase
    .from('points_ledger')
    .select('points')
    .eq('student_id', studentId)
  const totalPoints = (ledgerSum || []).reduce((sum, row) => sum + row.points, 0)

  // Update streak
  const streakResult = await updateStreak(studentId, bothCompleted)

  return {
    breakdown,
    totalAwarded,
    totalPoints,
    characterUnlocked: lastUnlocked,
    surprise: surprise ? surprise.type : null,
    streak: streakResult,
  }
}

function checkSurpriseReward(): { type: string; points: number } | null {
  // ~1 in 5 chance
  if (Math.random() > 0.2) return null

  const surprises = [
    { type: 'double_points_day', points: 20 },
    { type: 'aria_secret_challenge', points: 15 },
    { type: 'rare_character_hint', points: 10 },
    { type: 'bonus_sparkle', points: 5 },
  ]
  return surprises[Math.floor(Math.random() * surprises.length)]
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
): Promise<{ currentStreak: number; freezeEarned: boolean; freezeUsed: boolean; dailyStreakBonus: boolean }> {
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

  let freezeUsed = false

  if (lastDate === today) {
    // Already counted today — but check if freeze should be earned now
    if (bothSubjectsCompleted && streak.freeze_count < 2) {
      freezeEarned = true
      await supabase
        .from('streaks')
        .update({ freeze_count: streak.freeze_count + 1 })
        .eq('student_id', studentId)
    }
    return { currentStreak: newStreak, freezeEarned, freezeUsed: false, dailyStreakBonus: false }
  } else if (lastDate === yesterdayStr || !lastDate) {
    // Consecutive day (or first ever session)
    newStreak = lastDate ? newStreak + 1 : 1
  } else if (streak.freeze_count > 0) {
    // Missed day(s) but have freeze — use it
    newStreak += 1
    freezeUsed = true
  } else {
    // Streak broken
    newStreak = 1
  }

  const longestStreak = Math.max(streak.longest_streak, newStreak)

  // Freeze earned when both subjects completed in one day
  if (bothSubjectsCompleted && streak.freeze_count < 2) {
    freezeEarned = true
  }

  const newFreezeCount = freezeUsed
    ? streak.freeze_count - 1 + (freezeEarned ? 1 : 0)
    : streak.freeze_count + (freezeEarned ? 1 : 0)

  await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_session_date: today,
      freeze_count: Math.min(Math.max(newFreezeCount, 0), 2),
    })
    .eq('student_id', studentId)

  return {
    currentStreak: newStreak,
    freezeEarned,
    freezeUsed,
    dailyStreakBonus: bothSubjectsCompleted,
  }
}
