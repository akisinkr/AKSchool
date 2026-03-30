import crypto from 'crypto'
import { getAnthropicClient, MODEL } from './client'
import { buildLearnPrompt, type LearnContent } from './prompts/learn-prompt'
import { buildPracticePrompt, type PracticeQuestions } from './prompts/practice-prompt'
import { buildApplyPrompt, type ApplyChallenge } from './prompts/apply-prompt'
import { createClient } from '@/lib/supabase/server'

export interface SessionContent {
  learn_content: LearnContent
  practice_questions: PracticeQuestions
  apply_challenge: ApplyChallenge
  aria_scripts: Record<string, string>
}

async function callAnthropic(prompt: { system: string; user: string }): Promise<unknown> {
  const client = getAnthropicClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    return JSON.parse(text)
  } catch {
    // Retry once asking Claude to fix the JSON
    const retry = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: 'Fix the following to be valid JSON. Output ONLY the corrected JSON, nothing else.',
      messages: [{ role: 'user', content: text }],
    })
    const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
    return JSON.parse(retryText)
  }
}

function computeProfileHash(profile: Record<string, unknown>): string {
  return crypto
    .createHash('md5')
    .update(JSON.stringify(profile))
    .digest('hex')
}

function extractAriaScripts(
  learn: LearnContent,
  practice: PracticeQuestions,
  apply: ApplyChallenge
): Record<string, string> {
  const scripts: Record<string, string> = {}

  scripts['learn_hook'] = learn.hook.aria_script
  learn.explanation.chunks.forEach((chunk, i) => {
    scripts[`learn_explanation_${i}`] = chunk.aria_script
  })
  scripts['learn_check_in'] = learn.check_in.aria_script
  scripts['learn_check_in_correct'] = learn.check_in.warm_response_correct
  scripts['learn_check_in_incorrect'] = learn.check_in.warm_response_incorrect

  practice.questions.forEach((q, i) => {
    scripts[`practice_q${i}_intro`] = q.aria_intro
    scripts[`practice_q${i}_correct`] = q.warm_response_correct
    scripts[`practice_q${i}_incorrect`] = q.warm_response_incorrect
  })
  scripts['practice_perfect'] = practice.aria_perfect_score_response

  scripts['apply_opening'] = apply.aria_opening
  scripts['apply_closing'] = apply.aria_closing

  return scripts
}

export async function generateSessionContent(
  studentId: string,
  topicId: string
): Promise<SessionContent> {
  const supabase = createClient()

  // Fetch data in parallel
  const [profileResult, topicResult] = await Promise.all([
    supabase
      .from('learner_profile')
      .select('strengths, development_areas, focus_notes, personal_context, current_school_context')
      .eq('student_id', studentId)
      .single(),
    supabase
      .from('topics')
      .select('display_name, cpa_anchor, sharon_analogy, tags, difficulty, subject_id, subjects(name, pedagogical_framework)')
      .eq('id', topicId)
      .single(),
  ])

  if (profileResult.error) throw new Error(`Failed to load learner profile: ${profileResult.error.message}`)
  if (topicResult.error) throw new Error(`Failed to load topic: ${topicResult.error.message}`)

  const profile = profileResult.data
  const topic = topicResult.data
  const subject = (topic as Record<string, unknown>).subjects as { name: string; pedagogical_framework: string | null }

  const profileHash = computeProfileHash({
    strengths: profile.strengths,
    development_areas: profile.development_areas,
    focus_notes: profile.focus_notes,
    personal_context: profile.personal_context,
    current_school_context: profile.current_school_context,
  })

  // Check cache
  const { data: cached } = await supabase
    .from('session_content_cache')
    .select('*')
    .eq('student_id', studentId)
    .eq('topic_id', topicId)
    .eq('profile_hash', profileHash)
    .gt('expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  if (cached) {
    return {
      learn_content: cached.learn_content as LearnContent,
      practice_questions: cached.practice_questions as PracticeQuestions,
      apply_challenge: cached.apply_challenge as ApplyChallenge,
      aria_scripts: extractAriaScripts(
        cached.learn_content as LearnContent,
        cached.practice_questions as PracticeQuestions,
        cached.apply_challenge as ApplyChallenge
      ),
    }
  }

  // Generate content in parallel
  const promptCtx = {
    topic: {
      display_name: topic.display_name,
      cpa_anchor: topic.cpa_anchor,
      sharon_analogy: topic.sharon_analogy,
      tags: (topic.tags as string[]) || [],
      difficulty: topic.difficulty,
    },
    subject: {
      name: subject.name,
      pedagogical_framework: subject.pedagogical_framework,
    },
    profile: {
      strengths: (profile.strengths as unknown[]) || [],
      development_areas: (profile.development_areas as unknown[]) || [],
      focus_notes: (profile.focus_notes as Record<string, unknown>) || {},
      personal_context: (profile.personal_context as Record<string, unknown>) || {},
      current_school_context: (profile.current_school_context as Record<string, unknown>) || {},
    },
  }

  const [learnContent, practiceQuestions, applyChallenge] = await Promise.all([
    callAnthropic(buildLearnPrompt(promptCtx)) as Promise<LearnContent>,
    callAnthropic(buildPracticePrompt(promptCtx)) as Promise<PracticeQuestions>,
    callAnthropic(buildApplyPrompt(promptCtx)) as Promise<ApplyChallenge>,
  ])

  const ariaScripts = extractAriaScripts(learnContent, practiceQuestions, applyChallenge)

  // Cache the generated content (7-day TTL)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await supabase.from('session_content_cache').insert({
    student_id: studentId,
    topic_id: topicId,
    learn_content: learnContent,
    practice_questions: practiceQuestions,
    apply_challenge: applyChallenge,
    aria_scripts: ariaScripts,
    profile_hash: profileHash,
    expires_at: expiresAt.toISOString(),
  })

  return { learn_content: learnContent, practice_questions: practiceQuestions, apply_challenge: applyChallenge, aria_scripts: ariaScripts }
}
