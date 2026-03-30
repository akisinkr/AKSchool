'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StreakCounter } from '@/components/home/StreakCounter'
import { PointsBar } from '@/components/home/PointsBar'
import { SubjectCard } from '@/components/home/SubjectCard'
import { AriaGreeting } from '@/components/home/AriaGreeting'
import { CharacterUnlock } from '@/components/gamification/CharacterUnlock'

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
      const res = await fetch('/api/home-data')
      if (!res.ok) {
        setLoading(false)
        return
      }
      setData(await res.json())
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
