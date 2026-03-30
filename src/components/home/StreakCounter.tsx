'use client'

import { motion } from 'framer-motion'

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  freezeCount: number
}

export function StreakCounter({ currentStreak, longestStreak, freezeCount }: StreakCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4"
    >
      {/* Streak flame */}
      <div className="flex items-center gap-2 bg-white/80 rounded-2xl px-4 py-2 shadow-sm border border-amber-100">
        <motion.span
          className="text-2xl"
          animate={currentStreak > 0 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {currentStreak > 0 ? '🔥' : '💤'}
        </motion.span>
        <div>
          <p className="text-lg font-bold text-amber-800">{currentStreak}</p>
          <p className="text-xs text-amber-500">day streak</p>
        </div>
      </div>

      {/* Freeze shields */}
      {freezeCount > 0 && (
        <div className="flex items-center gap-1 bg-white/80 rounded-2xl px-3 py-2 shadow-sm border border-sky-100">
          {[...Array(freezeCount)].map((_, i) => (
            <span key={i} className="text-lg">🛡️</span>
          ))}
          <p className="text-xs text-sky-500 ml-1">freeze</p>
        </div>
      )}

      {/* Best streak (subtle) */}
      {longestStreak > currentStreak && (
        <p className="text-xs text-amber-400">Best: {longestStreak}</p>
      )}
    </motion.div>
  )
}
