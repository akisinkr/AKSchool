'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { WarmFeedback } from '@/components/shared/WarmFeedback'
import { PointsAnimation } from '@/components/shared/PointsAnimation'

interface CheckInProps {
  ariaScript: string
  answerOptions: string[]
  correctIndex: number
  warmResponseCorrect: string
  warmResponseIncorrect: string
  onComplete: (wasCorrect: boolean) => void
  isAriaPlaying: boolean
}

export function CheckIn({
  ariaScript,
  answerOptions,
  correctIndex,
  warmResponseCorrect,
  warmResponseIncorrect,
  onComplete,
  isAriaPlaying,
}: CheckInProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [answered, setAnswered] = useState(false)

  const isCorrect = selectedIndex === correctIndex

  function handleSelect(index: number) {
    if (answered) return
    setSelectedIndex(index)
    setShowFeedback(true)
    setAnswered(true)

    if (index === correctIndex) {
      setShowPoints(true)
      setTimeout(() => onComplete(true), 2000)
    } else {
      setTimeout(() => onComplete(false), 2500)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-b from-amber-50 to-orange-50">
      <PointsAnimation points={10} show={showPoints} />

      {/* Question indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 text-sm text-amber-500 font-medium"
      >
        Quick Check-In
      </motion.div>

      {/* Question text */}
      {ariaScript && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl text-amber-900 text-center font-medium mb-8 max-w-md"
        >
          {ariaScript}
        </motion.p>
      )}

      {/* Aria speaking indicator */}
      {isAriaPlaying && (
        <motion.div
          className="mb-8 flex items-center gap-2 text-amber-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            🎤
          </motion.span>
          <span className="text-sm">Miss Aria is asking...</span>
        </motion.div>
      )}

      {/* Answer tiles */}
      <div className="grid grid-cols-2 gap-4 max-w-sm w-full">
        {answerOptions.map((option, i) => {
          let tileStyle = 'bg-white border-2 border-amber-200 text-amber-900'
          if (answered && i === correctIndex) {
            tileStyle = 'bg-amber-100 border-2 border-amber-400 text-amber-900'
          } else if (answered && i === selectedIndex && !isCorrect) {
            tileStyle = 'bg-orange-50 border-2 border-orange-300 text-orange-700'
          }

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={!answered ? { scale: 1.05 } : {}}
              whileTap={!answered ? { scale: 0.95 } : {}}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`p-4 rounded-2xl text-center text-lg font-medium shadow-sm transition-colors ${tileStyle}`}
            >
              {/* Gentle amber wobble for wrong answer — no red, no X */}
              {answered && i === selectedIndex && !isCorrect ? (
                <motion.span
                  animate={{ x: [-3, 3, -3, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  {option}
                </motion.span>
              ) : (
                option
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Warm feedback */}
      <WarmFeedback
        type={isCorrect ? 'correct' : 'incorrect'}
        message={isCorrect ? warmResponseCorrect : warmResponseIncorrect}
        show={showFeedback}
      />
    </div>
  )
}
