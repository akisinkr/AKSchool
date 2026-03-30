'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { LearnStage } from '@/components/learn/LearnStage'
import { PracticeStage } from '@/components/practice/PracticeStage'
import { ApplyStage } from '@/components/apply/ApplyStage'
import { useVoiceSession } from '@/hooks/useVoiceSession'
import type { LearnContent } from '@/lib/anthropic/prompts/learn-prompt'
import type { PracticeQuestions } from '@/lib/anthropic/prompts/practice-prompt'
import type { ApplyChallenge } from '@/lib/anthropic/prompts/apply-prompt'

type SessionStage = 'loading' | 'learn' | 'practice' | 'apply' | 'complete'

interface SessionContent {
  learn_content: LearnContent
  practice_questions: PracticeQuestions
  apply_challenge: ApplyChallenge
  aria_scripts: Record<string, string>
}

// Student ID is hardcoded for single-student app
const STUDENT_ID = 'c1000000-0000-0000-0000-000000000001'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const subjectId = params.subjectId as string

  const [stage, setStage] = useState<SessionStage>('loading')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [content, setContent] = useState<SessionContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [practiceResults, setPracticeResults] = useState<{ correct: boolean; retried: boolean; retryCorrect: boolean | null }[]>([])

  const voice = useVoiceSession()

  // Initialize session
  useEffect(() => {
    async function initSession() {
      try {
        // Create session record
        const sessionRes = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: STUDENT_ID, subjectId }),
        })
        if (!sessionRes.ok) throw new Error('Failed to create session')
        const { sessionId: sid, topicId } = await sessionRes.json()
        setSessionId(sid)

        // Generate content
        const contentRes = await fetch('/api/generate-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: STUDENT_ID, topicId }),
        })

        if (!contentRes.ok) {
          // Content generation requires Anthropic API key
          // Show a friendly message
          setError('Content generation requires an Anthropic API key. Add ANTHROPIC_API_KEY to .env.local to enable sessions.')
          return
        }

        const sessionContent = await contentRes.json()
        setContent(sessionContent)
        setStage('learn')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start session')
      }
    }

    initSession()
  }, [subjectId])

  async function handleLearnComplete(wasCorrect: boolean) {
    // Update session
    if (sessionId) {
      await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          stage_completions: { learn: true, learn_check_in_correct: wasCorrect },
        }),
      })
    }

    // Move to practice
    setStage('practice')
    voice.updateScript(content?.aria_scripts?.practice_q0_intro || '')
  }

  async function handlePracticeComplete(results: typeof practiceResults, perfectScore: boolean) {
    setPracticeResults(results)

    if (sessionId) {
      await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          stage_completions: { learn: true, practice: true, perfect_practice: perfectScore },
        }),
      })
    }

    setStage('apply')
    voice.updateScript(content?.aria_scripts?.apply_opening || '')
  }

  async function handleApplyComplete() {
    if (sessionId) {
      const correctCount = practiceResults.filter((r) => r.correct).length
      const perfectPractice = practiceResults.every((r) => r.correct && !r.retried)

      await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          session_completed: true,
          points_earned: 10 + correctCount * 5 + (perfectPractice ? 10 : 0) + 15,
          stage_completions: { learn: true, practice: true, apply: true, perfect_practice: perfectPractice },
        }),
      })

      // Award points
      await fetch('/api/award-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: STUDENT_ID,
          sessionId,
          learnCompleted: true,
          practiceCorrectCount: correctCount,
          perfectPractice,
          applySubmitted: true,
        }),
      })
    }

    setStage('complete')
    voice.stop()
  }

  // Loading state
  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center">
        {error ? (
          <div className="max-w-md text-center px-6">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-medium rounded-full transition-colors"
            >
              Back Home
            </button>
          </div>
        ) : (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="text-4xl mb-4"
            >
              ✨
            </motion.div>
            <p className="text-amber-600">Preparing your session...</p>
          </>
        )}
      </div>
    )
  }

  // Session complete
  if (stage === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-amber-50 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          className="text-6xl mb-6"
        >
          🎉
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-800 mb-2"
        >
          Session Complete!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-500 mb-8"
        >
          Great work today!
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white text-lg font-semibold rounded-full shadow-md transition-colors"
        >
          Back Home ✨
        </motion.button>
      </div>
    )
  }

  if (!content) return null

  return (
    <div>
      {stage === 'learn' && (
        <LearnStage
          content={content.learn_content}
          isAriaPlaying={voice.status === 'active'}
          onComplete={handleLearnComplete}
        />
      )}
      {stage === 'practice' && (
        <PracticeStage
          content={content.practice_questions}
          isAriaPlaying={voice.status === 'active'}
          onComplete={handlePracticeComplete}
        />
      )}
      {stage === 'apply' && (
        <ApplyStage
          content={content.apply_challenge}
          isAriaPlaying={voice.status === 'active'}
          onComplete={handleApplyComplete}
        />
      )}
    </div>
  )
}
