'use client'

import { useState, useCallback } from 'react'
import { StageTransition } from '@/components/shared/StageTransition'
import { Hook } from './Hook'
import { Explanation } from './Explanation'
import { CheckIn } from './CheckIn'
import type { LearnContent } from '@/lib/anthropic/prompts/learn-prompt'

type LearnPhase = 'hook' | 'explanation' | 'check_in'

interface LearnStageProps {
  content: LearnContent
  isAriaPlaying: boolean
  onComplete: (checkInCorrect: boolean) => void
  onPhaseChange?: (phase: LearnPhase) => void
}

export function LearnStage({ content, isAriaPlaying, onComplete, onPhaseChange }: LearnStageProps) {
  const [phase, setPhase] = useState<LearnPhase>('hook')

  const advanceTo = useCallback(
    (next: LearnPhase) => {
      setPhase(next)
      onPhaseChange?.(next)
    },
    [onPhaseChange]
  )

  return (
    <StageTransition stageKey={phase} backgroundColor="#FFF8F0">
      {phase === 'hook' && (
        <Hook
          ariaScript={content.hook.aria_script}
          textOnscreen={content.hook.text_onscreen}
          illustrationPrompt={content.hook.illustration_prompt}
          onComplete={() => advanceTo('explanation')}
          isAriaPlaying={isAriaPlaying}
        />
      )}

      {phase === 'explanation' && (
        <Explanation
          chunks={content.explanation.chunks}
          onComplete={() => advanceTo('check_in')}
          isAriaPlaying={isAriaPlaying}
        />
      )}

      {phase === 'check_in' && (
        <CheckIn
          ariaScript={content.check_in.aria_script}
          answerOptions={content.check_in.answer_options}
          correctIndex={content.check_in.correct_index}
          warmResponseCorrect={content.check_in.warm_response_correct}
          warmResponseIncorrect={content.check_in.warm_response_incorrect}
          onComplete={(wasCorrect) => onComplete(wasCorrect)}
          isAriaPlaying={isAriaPlaying}
        />
      )}
    </StageTransition>
  )
}
