'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { WarmFeedback } from '@/components/shared/WarmFeedback'
import { PointsAnimation } from '@/components/shared/PointsAnimation'

interface MultipleChoiceProps {
  stem: string
  options: string[]
  correctIndex: number
  ariaIntro: string
  warmResponseCorrect: string
  warmResponseIncorrect: string
  isAriaPlaying: boolean
  onComplete: (correct: boolean, retried: boolean, retryCorrect: boolean | null) => void
}

export function MultipleChoice({
  stem,
  options,
  correctIndex,
  warmResponseCorrect,
  warmResponseIncorrect,
  isAriaPlaying,
  onComplete,
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [attempt, setAttempt] = useState(0) // 0 = first, 1 = retry
  const [firstWasWrong, setFirstWasWrong] = useState(false)

  function handleSelect(index: number) {
    if (showFeedback) return
    setSelected(index)
    setShowFeedback(true)

    const isCorrect = index === correctIndex

    if (isCorrect) {
      setShowPoints(true)
      setTimeout(() => onComplete(true, firstWasWrong, firstWasWrong ? true : null), 2000)
    } else if (attempt === 0) {
      // First wrong — offer retry
      setFirstWasWrong(true)
      setTimeout(() => {
        setShowFeedback(false)
        setSelected(null)
        setAttempt(1)
      }, 2000)
    } else {
      // Second wrong — move forward
      setTimeout(() => onComplete(false, true, false), 2000)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <PointsAnimation points={5} show={showPoints} />

      {/* Question number / retry indicator */}
      {attempt === 1 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-2 text-sm text-orange-400 font-medium"
        >
          Give it another try!
        </motion.p>
      )}

      {/* Aria indicator */}
      {isAriaPlaying && (
        <motion.div
          className="mb-6 flex items-center gap-2 text-amber-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
            🎤
          </motion.span>
          <span className="text-sm">Miss Aria...</span>
        </motion.div>
      )}

      {/* Stem */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-amber-900 text-center font-medium mb-8 max-w-md"
      >
        {stem}
      </motion.p>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 max-w-sm w-full">
        {options.map((opt, i) => {
          let style = 'bg-white border-2 border-amber-200 text-amber-900'
          if (showFeedback && i === correctIndex) {
            style = 'bg-amber-100 border-2 border-amber-400 text-amber-900'
          } else if (showFeedback && i === selected && selected !== correctIndex) {
            style = 'bg-orange-50 border-2 border-orange-300 text-orange-700'
          }

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              whileHover={!showFeedback ? { scale: 1.04 } : {}}
              whileTap={!showFeedback ? { scale: 0.96 } : {}}
              onClick={() => handleSelect(i)}
              disabled={showFeedback}
              className={`p-4 rounded-2xl text-center text-lg font-medium shadow-sm transition-colors ${style}`}
            >
              {showFeedback && i === selected && selected !== correctIndex ? (
                <motion.span animate={{ x: [-3, 3, -3, 0] }} transition={{ duration: 0.4 }}>
                  {opt}
                </motion.span>
              ) : (
                opt
              )}
            </motion.button>
          )
        })}
      </div>

      <WarmFeedback
        type={selected === correctIndex ? 'correct' : 'incorrect'}
        message={selected === correctIndex ? warmResponseCorrect : warmResponseIncorrect}
        show={showFeedback}
      />
    </div>
  )
}
