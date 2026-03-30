'use client'

import { motion } from 'framer-motion'

interface AriaGreetingProps {
  studentName: string
  message?: string
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function AriaGreeting({ studentName, message }: AriaGreetingProps) {
  const greeting = getTimeGreeting()
  const defaultMessage = `Ready to learn something amazing today?`

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/80 rounded-2xl p-5 shadow-sm border border-lavender-100 w-full"
      style={{ borderColor: 'rgb(221, 214, 243)' }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-200 to-pink-200 flex items-center justify-center flex-shrink-0"
        >
          <span className="text-lg">🎵</span>
        </motion.div>
        <div>
          <p className="text-lg font-semibold text-gray-800">
            {greeting}, {studentName}!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {message || defaultMessage}
          </p>
          <p className="text-xs text-violet-400 mt-2">— Miss Aria</p>
        </div>
      </div>
    </motion.div>
  )
}
