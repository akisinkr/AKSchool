'use client'

import { motion } from 'framer-motion'

interface SubjectCardProps {
  name: string
  colorTheme: 'math' | 'english'
  currentTopic: string
  mascotEmoji?: string
  accuracy?: number
  isCompleteToday: boolean
  onStart: () => void
  delay?: number
}

const THEME_STYLES = {
  math: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-200',
    accent: 'text-amber-700',
    button: 'bg-amber-400 hover:bg-amber-500',
    badge: 'bg-amber-100 text-amber-600',
  },
  english: {
    bg: 'bg-gradient-to-br from-teal-50 to-cyan-50',
    border: 'border-teal-200',
    accent: 'text-teal-700',
    button: 'bg-teal-400 hover:bg-teal-500',
    badge: 'bg-teal-100 text-teal-600',
  },
}

export function SubjectCard({
  name,
  colorTheme,
  currentTopic,
  mascotEmoji = '📚',
  accuracy,
  isCompleteToday,
  onStart,
  delay = 0,
}: SubjectCardProps) {
  const theme = THEME_STYLES[colorTheme]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className={`${theme.bg} rounded-3xl p-6 border ${theme.border} shadow-sm w-full`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.span
            className="text-3xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, delay }}
          >
            {mascotEmoji}
          </motion.span>
          <div>
            <h3 className={`text-xl font-bold ${theme.accent}`}>{name}</h3>
            <p className="text-sm text-gray-500">{currentTopic}</p>
          </div>
        </div>

        {isCompleteToday && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${theme.badge}`}>
            ✓ Done today
          </span>
        )}
      </div>

      {/* Accuracy bar (if available) */}
      {accuracy !== undefined && accuracy > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Accuracy</span>
            <span>{accuracy}%</span>
          </div>
          <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${colorTheme === 'math' ? 'bg-amber-300' : 'bg-teal-300'}`}
              initial={{ width: 0 }}
              animate={{ width: `${accuracy}%` }}
              transition={{ duration: 0.8, delay: delay + 0.3 }}
            />
          </div>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        disabled={isCompleteToday}
        className={`w-full py-3 text-white text-lg font-semibold rounded-2xl shadow-sm transition-colors ${
          isCompleteToday
            ? 'bg-gray-300 cursor-not-allowed'
            : theme.button
        }`}
      >
        {isCompleteToday ? 'Come back tomorrow!' : 'Start Session →'}
      </motion.button>
    </motion.div>
  )
}
