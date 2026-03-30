export interface LearnContent {
  hook: {
    aria_script: string
    text_onscreen: string
    illustration_prompt: string
  }
  explanation: {
    chunks: Array<{
      aria_script: string
      text_onscreen: string
      visual_description: string
    }>
  }
  check_in: {
    aria_script: string
    answer_options: string[]
    correct_index: number
    warm_response_correct: string
    warm_response_incorrect: string
  }
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

export function buildLearnPrompt(ctx: PromptContext) {
  const system = `You are a curriculum content generator for a learning app. You generate structured JSON content for the LEARN stage of a lesson.

The student is Sharon, age 10, Grade 4 at KIS Seoul. She is English-dominant, loves Sanrio characters, kawaii style, crafting, and making art. She has a low sustained attention threshold — every piece of content must be engaging and concise.

The voice teacher is Miss Aria — warm, funny, patient, cool older sister energy. Aria NEVER says "wrong," "incorrect," or "mistake." She uses phrases like "not quite," "almost," "let's think about this differently."

Rules:
- Each aria_script must be under 150 words (under 60 seconds spoken)
- Hook aria_script: 75-110 words (30-45 sec)
- text_onscreen: always a single short sentence
- Never open Math with an equation — always start concrete (CPA framework)
- Reference Sharon's world: crafting, Sanrio, art, Singapore memories, Seoul life
- Be specific in praise, never generic "Great job!"

Output ONLY valid JSON matching the LearnContent interface. No markdown, no explanation.`

  const user = `Generate LEARN stage content for:

Topic: ${ctx.topic.display_name}
Subject: ${ctx.subject.name}
Framework: ${ctx.subject.pedagogical_framework || 'N/A'}
CPA Anchor: ${ctx.topic.cpa_anchor || 'N/A'}
Sharon's Analogy: ${ctx.topic.sharon_analogy || 'N/A'}
Difficulty: ${ctx.topic.difficulty}/3
Tags: ${ctx.topic.tags.join(', ')}

Sharon's Profile:
- Strengths: ${JSON.stringify(ctx.profile.strengths)}
- Development areas: ${JSON.stringify(ctx.profile.development_areas)}
- Focus & learning style: ${JSON.stringify(ctx.profile.focus_notes)}
- Personal context: ${JSON.stringify(ctx.profile.personal_context)}
- School context: ${JSON.stringify(ctx.profile.current_school_context)}

Generate:
1. hook — Sharon-specific analogy to introduce the concept (concrete first, never abstract)
2. explanation — 3-4 chunks building from concrete to abstract, Aria narrates each
3. check_in — ONE verbal question with 3-4 tap options, warm responses for correct and incorrect`

  return { system, user }
}
