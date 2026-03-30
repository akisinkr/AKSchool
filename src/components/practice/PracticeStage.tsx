'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { StageTransition } from '@/components/shared/StageTransition'
import { PointsAnimation } from '@/components/shared/PointsAnimation'
import { MultipleChoice } from './MultipleChoice'
import { DragDrop } from './DragDrop'
import { ImageMatch } from './ImageMatch'
import { TypedSpoken } from './TypedSpoken'
import type { PracticeQuestions, PracticeQuestion } from '@/lib/anthropic/prompts/practice-prompt'

interface QuestionResult {
  correct: boolean
  retried: boolean
  retryCorrect: boolean | null
}

interface PracticeStageProps {
  content: PracticeQuestions
  isAriaPlaying: boolean
  onComplete: (results: QuestionResult[], perfectScore: boolean) => void
  onQuestionChange?: (index: number) => void
}

export function PracticeStage({ content, isAriaPlaying, onComplete, onQuestionChange }: PracticeStageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [showPerfectBonus, setShowPerfectBonus] = useState(false)

  const questions = content.questions || []
  const question = questions[currentIndex]
  const skipRef = useRef(false)

  const handleQuestionComplete = useCallback(
    (correct: boolean, retried: boolean, retryCorrect: boolean | null) => {
      const newResults = [...results, { correct, retried, retryCorrect }]
      setResults(newResults)

      if (currentIndex < questions.length - 1) {
        const nextIndex = currentIndex + 1
        setTimeout(() => {
          setCurrentIndex(nextIndex)
          onQuestionChange?.(nextIndex)
        }, 500)
      } else {
        // All questions done
        const perfectScore = newResults.every((r) => r.correct && !r.retried)

        if (perfectScore) {
          setTimeout(() => {
            setShowPerfectBonus(true)
            setTimeout(() => onComplete(newResults, true), 2500)
          }, 500)
        } else {
          setTimeout(() => onComplete(newResults, false), 500)
        }
      }
    },
    [currentIndex, results, questions.length, onComplete, onQuestionChange]
  )

  // Auto-skip questions that lack enough data
  useEffect(() => {
    if (!question || skipRef.current) return

    const hasOptions = (question.options?.length ?? 0) >= 2
    const hasTiles = (question.tiles?.length ?? 0) >= 1 && (question.blanks?.length ?? 0) >= 1
    const hasImages = (question.image_descriptions?.length ?? 0) >= 2

    let shouldSkip = false
    if (question.type === 'multiple_choice' && !hasOptions) shouldSkip = true
    if (question.type === 'drag_drop' && !hasTiles) shouldSkip = true
    if (question.type === 'image_match' && !hasImages) shouldSkip = true
    if (question.type === 'typed_spoken' && !question.stem) shouldSkip = true

    if (shouldSkip) {
      skipRef.current = true
      const timer = setTimeout(() => {
        skipRef.current = false
        handleQuestionComplete(true, false, null)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, question, handleQuestionComplete])

  function renderQuestion(q: PracticeQuestion | undefined) {
    if (!q) return null
    const commonProps = {
      isAriaPlaying,
      warmResponseCorrect: q.warm_response_correct || 'Nice!',
      warmResponseIncorrect: q.warm_response_incorrect || 'Not quite — try again!',
      onComplete: handleQuestionComplete,
    }

    switch (q.type) {
      case 'multiple_choice':
        return (
          <MultipleChoice
            stem={q.stem}
            options={q.options || []}
            correctIndex={q.correct_index ?? 0}
            ariaIntro={q.aria_intro}
            {...commonProps}
          />
        )
      case 'drag_drop':
        return (
          <DragDrop
            stem={q.stem}
            tiles={q.tiles || []}
            blanks={q.blanks || []}
            correctMapping={q.correct_mapping || {}}
            {...commonProps}
          />
        )
      case 'image_match':
        return (
          <ImageMatch
            stem={q.stem}
            imageDescriptions={q.image_descriptions || []}
            correctIndex={q.correct_index ?? 0}
            {...commonProps}
          />
        )
      case 'typed_spoken':
        return (
          <TypedSpoken
            stem={q.stem}
            acceptableAnswers={q.acceptable_answers || []}
            {...commonProps}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 to-yellow-50">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-40 px-4 pt-4">
        <div className="flex gap-2 max-w-sm mx-auto">
          {questions.map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full overflow-hidden bg-amber-100">
              <motion.div
                className={`h-full rounded-full ${
                  i < currentIndex
                    ? results[i]?.correct
                      ? 'bg-amber-400'
                      : 'bg-orange-300'
                    : i === currentIndex
                      ? 'bg-amber-300'
                      : 'bg-transparent'
                }`}
                initial={{ width: i === currentIndex ? '0%' : i < currentIndex ? '100%' : '0%' }}
                animate={{ width: i <= currentIndex ? '100%' : '0%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-amber-500 mt-2">
          {currentIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Question */}
      <StageTransition stageKey={`q-${currentIndex}`} backgroundColor="transparent">
        {renderQuestion(question)}
      </StageTransition>

      {/* Perfect score celebration */}
      <PointsAnimation points={10} show={showPerfectBonus} />
      {showPerfectBonus && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-amber-50/90"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: 2, duration: 0.5 }}
              className="text-6xl mb-4"
            >
              🌟
            </motion.div>
            <p className="text-2xl font-bold text-amber-800 mb-2">Perfect Score!</p>
            <p className="text-lg text-amber-600 max-w-xs mx-auto">
              {content.aria_perfect_score_response}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
