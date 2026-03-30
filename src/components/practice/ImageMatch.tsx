'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { WarmFeedback } from '@/components/shared/WarmFeedback'
import { PointsAnimation } from '@/components/shared/PointsAnimation'

interface ImageMatchProps {
  stem: string
  imageDescriptions: string[]
  correctIndex: number
  warmResponseCorrect: string
  warmResponseIncorrect: string
  isAriaPlaying: boolean
  onComplete: (correct: boolean, retried: boolean, retryCorrect: boolean | null) => void
}

export function ImageMatch({
  stem,
  imageDescriptions,
  correctIndex,
  warmResponseCorrect,
  warmResponseIncorrect,
  isAriaPlaying,
  onComplete,
}: ImageMatchProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [firstWasWrong, setFirstWasWrong] = useState(false)
  const [readyToAdvance, setReadyToAdvance] = useState(false)
  const [readyToRetry, setReadyToRetry] = useState(false)

  const isCorrect = selected === correctIndex

  function handleSelect(index: number) {
    if (showFeedback) return
    setSelected(index)
    setShowFeedback(true)

    if (index === correctIndex) {
      setShowPoints(true)
      setReadyToAdvance(true)
    } else if (attempt === 0) {
      setFirstWasWrong(true)
      setReadyToRetry(true)
    } else {
      setReadyToAdvance(true)
    }
  }

  function handleRetry() {
    setShowFeedback(false)
    setSelected(null)
    setAttempt(1)
    setReadyToRetry(false)
  }

  function handleNext() {
    onComplete(isCorrect, firstWasWrong, firstWasWrong && isCorrect ? true : firstWasWrong ? false : null)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <PointsAnimation points={5} show={showPoints} />

      {attempt === 1 && !showFeedback && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 text-sm text-orange-400 font-medium">
          One more try!
        </motion.p>
      )}

      {isAriaPlaying && (
        <motion.div className="mb-6 flex items-center gap-2 text-amber-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>🎤</motion.span>
          <span className="text-sm">Miss Aria...</span>
        </motion.div>
      )}

      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xl text-amber-900 text-center font-medium mb-8 max-w-md">
        {stem}
      </motion.p>

      <div className="grid grid-cols-2 gap-4 max-w-md w-full">
        {imageDescriptions.map((desc, i) => {
          let cardStyle = 'bg-white border-2 border-amber-200'
          if (showFeedback && i === correctIndex) cardStyle = 'bg-amber-100 border-2 border-amber-400'
          else if (showFeedback && i === selected && !isCorrect) cardStyle = 'bg-orange-50 border-2 border-orange-300'

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              whileHover={!showFeedback ? { scale: 1.04 } : {}}
              whileTap={!showFeedback ? { scale: 0.96 } : {}}
              onClick={() => handleSelect(i)}
              disabled={showFeedback}
              className={`aspect-square rounded-2xl p-4 flex items-center justify-center shadow-sm transition-colors ${cardStyle}`}
            >
              <p className="text-sm text-center text-amber-800">{desc}</p>
            </motion.button>
          )
        })}
      </div>

      <WarmFeedback type={isCorrect ? 'correct' : 'incorrect'} message={isCorrect ? warmResponseCorrect : warmResponseIncorrect} show={showFeedback} />

      {readyToRetry && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleRetry}
          className="mt-6 px-8 py-3 bg-orange-300 hover:bg-orange-400 text-white text-lg font-semibold rounded-full shadow-md transition-colors">
          Try Again
        </motion.button>
      )}

      {readyToAdvance && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleNext}
          className="mt-6 px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white text-lg font-semibold rounded-full shadow-md transition-colors">
          Next →
        </motion.button>
      )}
    </div>
  )
}
