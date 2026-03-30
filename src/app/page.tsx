'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StreakCounter } from '@/components/home/StreakCounter'
import { PointsBar } from '@/components/home/PointsBar'
import { SubjectCard } from '@/components/home/SubjectCard'
import { AriaGreeting } from '@/components/home/AriaGreeting'
import { CharacterUnlock } from '@/components/gamification/CharacterUnlock'
import { createClient } from '@/lib/supabase/client'

const REWARD_MILESTONES = [500, 1500, 3500]

interface HomeData {
  studentName: string
  streak: { current_streak: number; longest_streak: number; freeze_count: number }
  totalPoints: number
  subjects: Array<{
    id: string
    name: string
    colorTheme: 'math' | 'english'
    currentTopic: string
    mascotEmoji: string
    accuracy: number
    isCompleteToday: boolean
  }>
  nextReward: { milestone: number; description: string | null } | null
  ariaMessage: string | null
}

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlockedCharacter, setUnlockedCharacter] = useState<string | null>(null)

  useEffect(() => {
    async function loadHomeData() {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      // For now, load Sharon's data directly (single student app)
      const { data: student } = await supabase
        .from('student_profiles')
        .select('id, name')
        .limit(1)
        .single()

      if (!student) {
        setLoading(false)
        return
      }

      // Parallel queries
      const [streakResult, pointsResult, subjectsResult, rewardsResult] = await Promise.all([
        supabase.from('streaks').select('*').eq('student_id', student.id).single(),
        supabase.from('points_ledger').select('points').eq('student_id', student.id),
        supabase
          .from('subjects')
          .select('id, name, color_theme, sort_order, curriculum_settings(current_topic_id, topics(display_name))')
          .eq('student_id', student.id)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('rewards')
          .select('milestone_pts, description_en')
          .eq('student_id', student.id)
          .is('earned_at', null)
          .order('milestone_pts')
          .limit(1),
      ])

      const totalPoints = (pointsResult.data || []).reduce((sum, r) => sum + r.points, 0)

      // Check today's sessions
      const { data: todaySessions } = await supabase
        .from('sessions')
        .select('subject_id, session_completed')
        .eq('student_id', student.id)
        .eq('date', today)
        .eq('session_completed', true)

      const completedSubjectIds = new Set((todaySessions || []).map((s) => s.subject_id))

      // Find next milestone
      const nextMilestone = REWARD_MILESTONES.find((m) => m > totalPoints)
      const rewardData = rewardsResult.data?.[0]

      const subjects = (subjectsResult.data || []).map((s) => {
        const cs = (s as Record<string, unknown>).curriculum_settings as
          | Array<{ current_topic_id: string; topics: { display_name: string } | null }>
          | undefined
        const currentTopic = cs?.[0]?.topics?.display_name || 'Not set'

        return {
          id: s.id,
          name: s.name,
          colorTheme: (s.name.toLowerCase() === 'math' ? 'math' : 'english') as 'math' | 'english',
          currentTopic,
          mascotEmoji: s.name.toLowerCase() === 'math' ? '🔢' : '📖',
          accuracy: 0,
          isCompleteToday: completedSubjectIds.has(s.id),
        }
      })

      setData({
        studentName: student.name,
        streak: streakResult.data || { current_streak: 0, longest_streak: 0, freeze_count: 0 },
        totalPoints,
        subjects,
        nextReward: nextMilestone
          ? { milestone: nextMilestone, description: rewardData?.description_en || null }
          : null,
        ariaMessage: null,
      })
      setLoading(false)
    }

    loadHomeData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-4xl"
        >
          ✨
        </motion.div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex items-center justify-center">
        <p className="text-gray-500">No student profile found. Please set up your account.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-amber-50/30">
      <CharacterUnlock
        characterName={unlockedCharacter}
        show={!!unlockedCharacter}
        onDismiss={() => setUnlockedCharacter(null)}
      />

      <div className="max-w-md mx-auto px-5 py-8 space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-2xl font-bold text-gray-800">
            Hi, {data.studentName}!
          </h1>
          <StreakCounter
            currentStreak={data.streak.current_streak}
            longestStreak={data.streak.longest_streak}
            freezeCount={data.streak.freeze_count}
          />
        </motion.div>

        {/* Aria greeting */}
        <AriaGreeting
          studentName={data.studentName}
          message={data.ariaMessage || undefined}
        />

        {/* Points + progress to next reward */}
        <PointsBar
          totalPoints={data.totalPoints}
          nextRewardAt={data.nextReward?.milestone || 500}
          nextRewardDescription={data.nextReward?.description || undefined}
        />

        {/* Subject cards */}
        <div className="space-y-4">
          {data.subjects.map((subject, i) => (
            <SubjectCard
              key={subject.id}
              name={subject.name}
              colorTheme={subject.colorTheme}
              currentTopic={subject.currentTopic}
              mascotEmoji={subject.mascotEmoji}
              accuracy={subject.accuracy}
              isCompleteToday={subject.isCompleteToday}
              onStart={() => {
                // Navigate to session — will be wired in session page
                window.location.href = `/session/${subject.id}`
              }}
              delay={0.2 + i * 0.15}
            />
          ))}
        </div>

        {/* Character collection teaser */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/60 rounded-2xl p-4 border border-gray-100 text-center"
        >
          <p className="text-sm text-gray-400">
            🎨 {Math.floor(data.totalPoints / 100)} characters collected
          </p>
        </motion.div>
      </div>
    </div>
  )
}
