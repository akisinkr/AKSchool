'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface WarmFeedbackProps {
  type: 'correct' | 'incorrect'
  message: string
  show: boolean
}

export function WarmFeedback({ type, message, show }: WarmFeedbackProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`mt-4 px-6 py-3 rounded-2xl text-center text-lg ${
            type === 'correct'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-orange-50 text-orange-700 border border-orange-200'
          }`}
        >
          {type === 'correct' && (
            <motion.span
              className="inline-block mr-2"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              ⭐
            </motion.span>
          )}
          {type === 'incorrect' && (
            <motion.div
              className="inline-block mr-2"
              animate={{ x: [-2, 2, -2, 0] }}
              transition={{ duration: 0.3 }}
            >
              💭
            </motion.div>
          )}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
