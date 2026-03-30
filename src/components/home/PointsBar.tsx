'use client'

import { motion } from 'framer-motion'

interface PointsBarProps {
  totalPoints: number
  nextRewardAt: number
  nextRewardDescription?: string
}

const REWARD_MILESTONES = [500, 1500, 3500]

export function PointsBar({ totalPoints, nextRewardAt, nextRewardDescription }: PointsBarProps) {
  const prevMilestone = REWARD_MILESTONES.filter((m) => m < nextRewardAt).pop() || 0
  const range = nextRewardAt - prevMilestone
  const progress = Math.min(((totalPoints - prevMilestone) / range) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/80 rounded-2xl px-5 py-4 shadow-sm border border-amber-100 w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <p className="text-lg font-bold text-amber-800">{totalPoints} pts</p>
        </div>
        <p className="text-sm text-amber-500">{nextRewardAt - totalPoints} to go</p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-300 to-amber-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Reward description */}
      {nextRewardDescription && (
        <p className="text-xs text-amber-500 text-center">
          🎁 Next reward: {nextRewardDescription}
        </p>
      )}
    </motion.div>
  )
}
