'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { WarmFeedback } from '@/components/shared/WarmFeedback'
import { PointsAnimation } from '@/components/shared/PointsAnimation'

interface TypedSpokenProps {
  stem: string
  acceptableAnswers: string[]
  warmResponseCorrect: string
  warmResponseIncorrect: string
  isAriaPlaying: boolean
  onComplete: (correct: boolean, retried: boolean, retryCorrect: boolean | null) => void
}

export function TypedSpoken({
  stem,
  acceptableAnswers,
  warmResponseCorrect,
  warmResponseIncorrect,
  isAriaPlaying,
  onComplete,
}: TypedSpokenProps) {
  const [answer, setAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [firstWasWrong, setFirstWasWrong] = useState(false)

  function checkAnswer() {
    if (!answer.trim() || showFeedback) return

    const normalized = answer.trim().toLowerCase()
    // If no acceptable answers defined, accept any non-empty response (open-ended question)
    const correct = acceptableAnswers.length === 0
      ? normalized.length > 0
      : acceptableAnswers.some(
          (a) => a.toLowerCase() === normalized || normalized.includes(a.toLowerCase())
        )

    setIsCorrect(correct)
    setShowFeedback(true)

    if (correct) {
      setShowPoints(true)
      setTimeout(() => onComplete(true, firstWasWrong, firstWasWrong ? true : null), 2000)
    } else if (attempt === 0) {
      setFirstWasWrong(true)
      setTimeout(() => {
        setShowFeedback(false)
        setAnswer('')
        setAttempt(1)
      }, 2500)
    } else {
      setTimeout(() => onComplete(false, true, false), 2000)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <PointsAnimation points={5} show={showPoints} />

      {attempt === 1 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 text-sm text-orange-400 font-medium">
          Have another go!
        </motion.p>
      )}

      {isAriaPlaying && (
        <motion.div className="mb-6 flex items-center gap-2 text-amber-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>🎤</motion.span>
          <span className="text-sm">Miss Aria...</span>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-amber-900 text-center font-medium mb-8 max-w-md"
      >
        {stem}
      </motion.p>

      {/* Text input */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm"
      >
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
          disabled={showFeedback}
          placeholder="Type your answer..."
          className="w-full px-5 py-4 text-lg rounded-2xl border-2 border-amber-200 bg-white text-amber-900 placeholder-amber-300 focus:outline-none focus:border-amber-400 transition-colors"
        />
      </motion.div>

      {/* Submit button */}
      {answer.trim() && !showFeedback && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={checkAnswer}
          className="mt-6 px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white text-lg font-semibold rounded-full shadow-md transition-colors"
        >
          Submit ✓
        </motion.button>
      )}

      <WarmFeedback
        type={isCorrect ? 'correct' : 'incorrect'}
        message={isCorrect ? warmResponseCorrect : warmResponseIncorrect}
        show={showFeedback}
      />
    </div>
  )
}
