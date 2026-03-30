'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PointsAnimation } from '@/components/shared/PointsAnimation'
import type { ApplyChallenge } from '@/lib/anthropic/prompts/apply-prompt'

type ApplyPhase = 'intro' | 'working' | 'celebration'

const ENVIRONMENT_GRADIENTS: Record<string, string> = {
  'craft studio': 'from-pink-50 to-amber-50',
  'art gallery': 'from-violet-50 to-rose-50',
  'character design desk': 'from-sky-50 to-pink-50',
  'Seoul market': 'from-orange-50 to-amber-50',
  'Singapore scene': 'from-teal-50 to-cyan-50',
}

function getGradient(environment: string): string {
  const key = Object.keys(ENVIRONMENT_GRADIENTS).find((k) =>
    environment.toLowerCase().includes(k)
  )
  return ENVIRONMENT_GRADIENTS[key || ''] || 'from-amber-50 to-orange-50'
}

interface ApplyStageProps {
  content: ApplyChallenge
  isAriaPlaying: boolean
  onComplete: () => void
}

export function ApplyStage({ content, isAriaPlaying, onComplete }: ApplyStageProps) {
  const [phase, setPhase] = useState<ApplyPhase>('intro')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [response, setResponse] = useState('')
  const [showPoints, setShowPoints] = useState(false)

  const gradient = getGradient(content.environment)

  function handleStart() {
    setPhase('working')
  }

  function handleRequestHint() {
    if (hintsUsed < 3) {
      setShowHint(true)
      setHintsUsed((prev) => prev + 1)
    }
  }

  function handleSubmit() {
    setShowPoints(true)
    setTimeout(() => setPhase('celebration'), 800)
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${gradient}`}>
      <AnimatePresence mode="wait">
        {/* ========== INTRO ========== */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
          >
            {/* Environment scene */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="w-72 h-48 mb-8 rounded-3xl bg-white/60 border-2 border-white/80 shadow-lg flex items-center justify-center"
            >
              <div className="text-center px-4">
                <p className="text-3xl mb-2">🎨</p>
                <p className="text-sm text-amber-600">{content.environment_description}</p>
              </div>
            </motion.div>

            {/* Environment label */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-medium text-amber-500 uppercase tracking-wide mb-4"
            >
              {content.environment}
            </motion.p>

            {/* Aria opening */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-amber-900 text-center font-medium max-w-md mb-8"
            >
              {content.aria_opening}
            </motion.p>

            {isAriaPlaying && (
              <motion.div className="mb-6 flex items-center gap-2 text-amber-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>🎤</motion.span>
                <span className="text-sm">Miss Aria is speaking...</span>
              </motion.div>
            )}

            {!isAriaPlaying && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleStart}
                className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white text-lg font-semibold rounded-full shadow-md transition-colors"
              >
                Let&apos;s go! →
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ========== WORKING ========== */}
        {phase === 'working' && (
          <motion.div
            key="working"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen flex flex-col items-center px-6 py-12 pt-16"
          >
            <PointsAnimation points={15} show={showPoints} />

            {/* Challenge description */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/70 rounded-2xl p-6 max-w-md w-full mb-6 shadow-sm border border-white/80"
            >
              <p className="text-lg text-amber-900 font-medium text-center">
                {content.challenge_description}
              </p>
            </motion.div>

            {/* Response area */}
            {(content.submission_type === 'text' || !['voice', 'drawing', 'choice'].includes(content.submission_type)) && (
              <motion.textarea
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your answer here..."
                rows={4}
                className="w-full max-w-md px-5 py-4 text-lg rounded-2xl border-2 border-amber-200 bg-white text-amber-900 placeholder-amber-300 focus:outline-none focus:border-amber-400 resize-none transition-colors mb-6"
              />
            )}

            {content.submission_type === 'voice' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-md bg-white/70 rounded-2xl p-8 flex flex-col items-center border border-white/80 mb-6"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-4xl mb-3"
                >
                  🎙️
                </motion.span>
                <p className="text-amber-600 text-sm">Speak your answer to Miss Aria</p>
              </motion.div>
            )}

            {content.submission_type === 'drawing' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-md aspect-square bg-white rounded-2xl border-2 border-dashed border-amber-200 flex items-center justify-center mb-6"
              >
                <p className="text-amber-300 text-lg">Drawing canvas</p>
              </motion.div>
            )}

            {content.submission_type === 'choice' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <p className="text-amber-500 text-sm text-center">Tap your choice or tell Miss Aria</p>
              </motion.div>
            )}

            {/* Hint button */}
            <div className="flex items-center gap-4 mb-6">
              {hintsUsed < 3 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleRequestHint}
                  className="px-5 py-2 text-amber-500 border border-amber-300 rounded-full text-sm hover:bg-amber-50 transition-colors"
                >
                  💡 Need a hint? ({3 - hintsUsed} left)
                </motion.button>
              )}
            </div>

            {/* Current hint */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-md w-full mb-6"
                >
                  <p className="text-sm text-amber-700">
                    💡 {content.hints[hintsUsed - 1]}
                  </p>
                  <button
                    onClick={() => setShowHint(false)}
                    className="mt-2 text-xs text-amber-400 hover:text-amber-500"
                  >
                    Got it ✓
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={handleSubmit}
              className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white text-lg font-semibold rounded-full shadow-md transition-colors"
            >
              I&apos;m done! ✨
            </motion.button>
          </motion.div>
        )}

        {/* ========== CELEBRATION ========== */}
        {phase === 'celebration' && (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
          >
            {/* Big celebration */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-7xl mb-6"
            >
              🎉
            </motion.div>

            {/* Sparkles */}
            <div className="relative w-48 h-12 mb-6">
              {[...Array(6)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                    x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 15)],
                    y: [0, -(10 + i * 8)],
                  }}
                  transition={{ duration: 1.2, delay: 0.1 * i, repeat: 1 }}
                  style={{ left: '50%', top: '50%' }}
                >
                  ✨
                </motion.span>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-amber-800 mb-2"
            >
              Amazing work!
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-amber-700 mb-3"
            >
              +15 pts
            </motion.p>

            {/* Aria closing */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/70 rounded-2xl p-6 max-w-md border border-white/80 shadow-sm mb-8"
            >
              <p className="text-amber-800 text-center italic">
                &ldquo;{content.aria_closing}&rdquo;
              </p>
              <p className="text-sm text-amber-500 text-center mt-2">— Miss Aria</p>
            </motion.div>

            {isAriaPlaying && (
              <motion.div className="mb-6 flex items-center gap-2 text-amber-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>🎤</motion.span>
                <span className="text-sm">Miss Aria...</span>
              </motion.div>
            )}

            {!isAriaPlaying && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                onClick={onComplete}
                className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white text-lg font-semibold rounded-full shadow-md transition-colors"
              >
                Finish ✨
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
