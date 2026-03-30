'use client'

import { motion } from 'framer-motion'

interface HookProps {
  ariaScript: string
  textOnscreen: string
  illustrationPrompt: string
  onComplete: () => void
  isAriaPlaying: boolean
}

export function Hook({ textOnscreen, illustrationPrompt, onComplete, isAriaPlaying }: HookProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Illustration placeholder */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-64 h-64 mb-8 rounded-3xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center"
      >
        <p className="text-sm text-amber-400 text-center px-4">{illustrationPrompt}</p>
      </motion.div>

      {/* Single sentence on screen */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-xl text-amber-900 text-center max-w-md font-medium"
      >
        {textOnscreen}
      </motion.p>

      {/* Aria speaking indicator */}
      {isAriaPlaying && (
        <motion.div
          className="mt-8 flex items-center gap-2 text-amber-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            🎤
          </motion.span>
          <span className="text-sm">Miss Aria is speaking...</span>
        </motion.div>
      )}

      {/* Continue button (shown after Aria finishes) */}
      {!isAriaPlaying && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onComplete}
          className="mt-10 px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white text-lg font-semibold rounded-full shadow-md transition-colors"
        >
          Next →
        </motion.button>
      )}
    </div>
  )
}
