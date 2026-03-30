'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ExplanationChunk {
  aria_script: string
  text_onscreen: string
  visual_description: string
}

interface ExplanationProps {
  chunks: ExplanationChunk[]
  onComplete: () => void
  isAriaPlaying: boolean
  currentChunkFromAria?: number
}

export function Explanation({ chunks, onComplete, isAriaPlaying, currentChunkFromAria }: ExplanationProps) {
  const [currentChunk, setCurrentChunk] = useState(currentChunkFromAria ?? 0)
  const chunk = chunks[currentChunk]
  const isLastChunk = currentChunk === chunks.length - 1

  function handleNext() {
    if (isLastChunk) {
      onComplete()
    } else {
      setCurrentChunk((prev) => prev + 1)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {chunks.map((_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i <= currentChunk ? 'bg-amber-400' : 'bg-amber-200'
            }`}
            animate={i === currentChunk ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>

      {/* Animated chunk content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentChunk}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center max-w-md"
        >
          {/* Visual placeholder */}
          <div className="w-56 h-56 mb-6 rounded-2xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center">
            <p className="text-sm text-amber-400 text-center px-4">{chunk.visual_description}</p>
          </div>

          {/* Text on screen */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-amber-900 text-center font-medium"
          >
            {chunk.text_onscreen}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Aria indicator */}
      {isAriaPlaying && (
        <motion.div
          className="mt-6 flex items-center gap-2 text-amber-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            🎤
          </motion.span>
          <span className="text-sm">Miss Aria is explaining...</span>
        </motion.div>
      )}

      {/* Next button */}
      {!isAriaPlaying && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleNext}
          className="mt-8 px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white text-lg font-semibold rounded-full shadow-md transition-colors"
        >
          {isLastChunk ? 'Ready for check-in! →' : 'Next →'}
        </motion.button>
      )}
    </div>
  )
}
