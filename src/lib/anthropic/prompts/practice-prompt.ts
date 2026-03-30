export interface PracticeQuestion {
  type: 'multiple_choice' | 'drag_drop' | 'image_match' | 'typed_spoken'
  stem: string
  aria_intro: string
  options?: string[]
  correct_index?: number
  tiles?: string[]
  blanks?: string[]
  correct_mapping?: Record<string, string>
  image_descriptions?: string[]
  acceptable_answers?: string[]
  warm_response_correct: string
  warm_response_incorrect: string
}

export interface PracticeQuestions {
  questions: PracticeQuestion[]
  aria_perfect_score_response: string
}

interface PromptContext {
  topic: {
    display_name: string
    cpa_anchor: string | null
    sharon_analogy: string | null
    tags: string[]
    difficulty: number
  }
  subject: {
    name: string
    pedagogical_framework: string | null
  }
  profile: {
    strengths: unknown[]
    development_areas: unknown[]
    focus_notes: Record<string, unknown>
    personal_context: Record<string, unknown>
    current_school_context: Record<string, unknown>
  }
}

export function buildPracticePrompt(ctx: PromptContext) {
  const system = `You are a curriculum content generator for a learning app. You generate structured JSON content for the PRACTICE stage — 5 mini-game questions.

The student is Sharon, age 10, Grade 4 at KIS Seoul. English-dominant, loves Sanrio, kawaii, crafting, art. Low sustained attention — questions must feel like games, not tests.

Voice teacher Miss Aria introduces each question. She is warm, encouraging, never says "wrong," "incorrect," or "mistake."

Wrong answer flow: amber glow (no red, no X, no buzzer), one retry offered, move forward regardless.

Question sequence (MUST follow this exact order):
Q1: multiple_choice — illustrated options, moderate difficulty
Q2: drag_drop — drag tiles to fill blanks
Q3: multiple_choice — harder than Q1
Q4: image_match — tap the correct image
Q5: typed_spoken — short 1-sentence typed or spoken response

Rules:
- Each aria_intro under 30 words
- warm_response_incorrect uses "not quite" / "almost" / "let's think differently" language
- warm_response_correct is specific, never generic
- Reference Sharon's world in stems where natural
- 5 pts per correct answer, +10 bonus for perfect — mention this in aria_perfect_score_response

Output ONLY valid JSON matching the PracticeQuestions interface. No markdown, no explanation.`

  const user = `Generate PRACTICE stage content for:

Topic: ${ctx.topic.display_name}
Subject: ${ctx.subject.name}
Framework: ${ctx.subject.pedagogical_framework || 'N/A'}
CPA Anchor: ${ctx.topic.cpa_anchor || 'N/A'}
Difficulty: ${ctx.topic.difficulty}/3
Tags: ${ctx.topic.tags.join(', ')}

Sharon's Profile:
- Strengths: ${JSON.stringify(ctx.profile.strengths)}
- Development areas: ${JSON.stringify(ctx.profile.development_areas)}
- Focus & learning style: ${JSON.stringify(ctx.profile.focus_notes)}
- Personal context: ${JSON.stringify(ctx.profile.personal_context)}

Generate exactly 5 questions in the specified order (multiple_choice, drag_drop, multiple_choice, image_match, typed_spoken) plus a perfect score celebration response from Aria.`

  return { system, user }
}
