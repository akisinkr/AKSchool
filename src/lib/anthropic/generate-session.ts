import crypto from 'crypto'
import { getAnthropicClient, MODEL } from './client'
import { buildLearnPrompt, type LearnContent } from './prompts/learn-prompt'
import { buildPracticePrompt, type PracticeQuestions } from './prompts/practice-prompt'
import { buildApplyPrompt, type ApplyChallenge } from './prompts/apply-prompt'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip markdown code fences if present
  const text = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '').trim()

  try {
    return JSON.parse(text)
  } catch {
    // Retry once asking Claude to fix the JSON
    const retry = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: 'Fix the following to be valid JSON. Output ONLY the corrected JSON, no markdown fences, no explanation.',
      messages: [{ role: 'user', content: rawText }],
    })
    const retryRaw = retry.content[0].type === 'text' ? retry.content[0].text : ''
    const retryText = retryRaw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '').trim()
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

  if (learn?.hook) scripts['learn_hook'] = learn.hook.aria_script || ''
  if (learn?.explanation?.chunks) {
    learn.explanation.chunks.forEach((chunk, i) => {
      scripts[`learn_explanation_${i}`] = chunk.aria_script || ''
    })
  }
  if (learn?.check_in) {
    scripts['learn_check_in'] = learn.check_in.aria_script || ''
    scripts['learn_check_in_correct'] = learn.check_in.warm_response_correct || ''
    scripts['learn_check_in_incorrect'] = learn.check_in.warm_response_incorrect || ''
  }

  ;(practice?.questions || []).forEach((q, i) => {
    scripts[`practice_q${i}_intro`] = q.aria_intro || ''
    scripts[`practice_q${i}_correct`] = q.warm_response_correct || ''
    scripts[`practice_q${i}_incorrect`] = q.warm_response_incorrect || ''
  })
  scripts['practice_perfect'] = practice?.aria_perfect_score_response || ''

  scripts['apply_opening'] = apply?.aria_opening || ''
  scripts['apply_closing'] = apply?.aria_closing || ''

  return scripts
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeLearn(raw: any): LearnContent {
  // Normalize hook
  const hook = raw.hook || {}
  const normalizedHook = {
    aria_script: hook.aria_script || hook.script || '',
    text_onscreen: hook.text_onscreen || hook.text || '',
    illustration_prompt: hook.illustration_prompt || hook.illustration || '',
  }

  // Normalize explanation — AI sometimes returns array instead of { chunks: [...] }
  let chunks: any[] = []
  if (Array.isArray(raw.explanation)) {
    chunks = raw.explanation
  } else if (raw.explanation?.chunks) {
    chunks = raw.explanation.chunks
  }
  const normalizedChunks = chunks.map((c: any) => ({
    aria_script: c.aria_script || c.script || '',
    text_onscreen: c.text_onscreen || c.text || '',
    visual_description: c.visual_description || c.visual || '',
  }))

  // Normalize check_in — AI uses various field names
  const ci = raw.check_in || {}
  let answerOptions: string[] = []
  let correctIndex = 0
  let warmCorrect = ''
  let warmIncorrect = ''

  if (Array.isArray(ci.answer_options)) {
    // Expected format: string[]
    answerOptions = ci.answer_options
    correctIndex = ci.correct_index ?? 0
    warmCorrect = ci.warm_response_correct || ''
    warmIncorrect = ci.warm_response_incorrect || ''
  } else if (Array.isArray(ci.options)) {
    if (typeof ci.options[0] === 'string') {
      answerOptions = ci.options
      correctIndex = ci.correct_index ?? 0
    } else {
      // Options are objects: { text, response, is_correct }
      answerOptions = ci.options.map((o: any) => o.text || o.label || '')
      correctIndex = ci.options.findIndex((o: any) => o.is_correct === true)
      if (correctIndex < 0) correctIndex = 0
      const correctOpt = ci.options.find((o: any) => o.is_correct)
      const incorrectOpt = ci.options.find((o: any) => !o.is_correct)
      warmCorrect = correctOpt?.response || ci.warm_response_correct || ''
      warmIncorrect = incorrectOpt?.response || ci.warm_response_incorrect || ''
    }
  }

  if (!warmCorrect) warmCorrect = ci.responses?.correct || 'Nice work!'
  if (!warmIncorrect) warmIncorrect = ci.responses?.incorrect || 'Not quite, but good thinking!'

  return {
    hook: normalizedHook,
    explanation: { chunks: normalizedChunks },
    check_in: {
      aria_script: ci.aria_script || ci.question || '',
      answer_options: answerOptions,
      correct_index: correctIndex,
      warm_response_correct: warmCorrect,
      warm_response_incorrect: warmIncorrect,
    },
  }
}

function normalizePractice(raw: any): PracticeQuestions {
  const questions = (raw.questions || []).map((q: any) => {
    // Normalize options — might be strings or objects with {text, id, ...}
    let options = q.options || []
    if (options.length > 0 && typeof options[0] === 'object') {
      options = options.map((o: any) => o.text || o.label || String(o))
    }

    // Normalize correct_index — might be an index or identified by is_correct
    let correctIndex = q.correct_index ?? q.correctIndex ?? q.correct_answer ?? 0
    if (Array.isArray(q.options) && q.options.length > 0 && typeof q.options[0] === 'object') {
      const correctIdx = q.options.findIndex((o: any) => o.is_correct === true || o.correct === true)
      if (correctIdx >= 0) correctIndex = correctIdx
    }

    // Normalize image_descriptions — might be objects
    let imageDescs = q.image_descriptions || q.imageDescriptions || []
    if (imageDescs.length > 0 && typeof imageDescs[0] === 'object') {
      imageDescs = imageDescs.map((d: any) => d.text || d.description || d.label || String(d))
    }

    // Normalize tiles — might be objects
    let tiles = q.tiles || []
    if (tiles.length > 0 && typeof tiles[0] === 'object') {
      tiles = tiles.map((t: any) => t.text || t.label || String(t))
    }

    return {
      type: q.type || 'multiple_choice',
      stem: q.stem || q.question || '',
      aria_intro: q.aria_intro || '',
      options,
      correct_index: correctIndex,
      tiles,
      blanks: q.blanks || [],
      correct_mapping: q.correct_mapping || q.correctMapping || {},
      image_descriptions: imageDescs,
      acceptable_answers: q.acceptable_answers || q.acceptableAnswers || [],
      warm_response_correct: q.warm_response_correct || q.warmResponseCorrect || q.feedback?.correct || 'Nice!',
      warm_response_incorrect: q.warm_response_incorrect || q.warmResponseIncorrect || q.feedback?.incorrect || 'Not quite — try again!',
    }
  })

  return {
    questions,
    aria_perfect_score_response: raw.aria_perfect_score_response || raw.perfectScoreResponse || 'Perfect score! Amazing work!',
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function generateSessionContent(
  studentId: string,
  topicId: string
): Promise<SessionContent> {
  const supabase = getSupabase()

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
  const { data: cachedRows } = await supabase
    .from('session_content_cache')
    .select('*')
    .eq('student_id', studentId)
    .eq('topic_id', topicId)
    .eq('profile_hash', profileHash)
    .gt('expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false })
    .limit(1)

  const cached = cachedRows?.[0] || null

  if (cached) {
    const normalizedLearn = normalizeLearn(cached.learn_content)
    const normalizedPractice = normalizePractice(cached.practice_questions)
    return {
      learn_content: normalizedLearn,
      practice_questions: normalizedPractice,
      apply_challenge: cached.apply_challenge as ApplyChallenge,
      aria_scripts: extractAriaScripts(
        normalizedLearn,
        normalizedPractice,
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

  const [rawLearn, rawPractice, rawApply] = await Promise.all([
    callAnthropic(buildLearnPrompt(promptCtx)),
    callAnthropic(buildPracticePrompt(promptCtx)),
    callAnthropic(buildApplyPrompt(promptCtx)),
  ])

  // Normalize AI responses to match expected interfaces
  const learnContent = normalizeLearn(rawLearn) as LearnContent
  const practiceQuestions = normalizePractice(rawPractice) as PracticeQuestions
  const applyChallenge = rawApply as ApplyChallenge

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
