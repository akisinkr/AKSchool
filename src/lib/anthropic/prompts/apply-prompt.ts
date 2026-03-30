export interface ApplyChallenge {
  environment: string
  environment_description: string
  aria_opening: string
  challenge_description: string
  hints: [string, string, string]
  submission_type: 'drawing' | 'text' | 'voice' | 'choice'
  aria_closing: string
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

export function buildApplyPrompt(ctx: PromptContext) {
  const system = `You are a curriculum content generator for a learning app. You generate structured JSON content for the APPLY stage — a creative, open-ended challenge.

The student is Sharon, age 10, Grade 4 at KIS Seoul. English-dominant, loves Sanrio, kawaii, crafting, art. Creative thinker who thrives with open-ended projects.

Voice teacher Miss Aria introduces the challenge. She says something like "I'm genuinely curious what you'll do with this one." Warm, excited, cool older sister energy.

Environment options (pick the most fitting):
- craft studio, art gallery, character design desk, Seoul market, Singapore scene

Rules:
- Challenge must connect the topic to Sharon's creative world
- 3 hints: Level 1 = gentle nudge, Level 2 = more specific, Level 3 = nearly gives it away
- Hints are offered by Aria, never forced
- aria_opening: under 40 words, genuinely curious tone
- aria_closing: personal, specific praise for what Sharon created/did — under 50 words
- 15 pts awarded on submission — full-screen celebration
- submission_type should match the challenge (text for written, voice for spoken, etc.)

Output ONLY valid JSON matching the ApplyChallenge interface. No markdown, no explanation.`

  const user = `Generate APPLY stage content for:

Topic: ${ctx.topic.display_name}
Subject: ${ctx.subject.name}
Framework: ${ctx.subject.pedagogical_framework || 'N/A'}
Sharon's Analogy: ${ctx.topic.sharon_analogy || 'N/A'}
Difficulty: ${ctx.topic.difficulty}/3
Tags: ${ctx.topic.tags.join(', ')}

Sharon's Profile:
- Strengths: ${JSON.stringify(ctx.profile.strengths)}
- Development areas: ${JSON.stringify(ctx.profile.development_areas)}
- Personal context: ${JSON.stringify(ctx.profile.personal_context)}

Generate a creative challenge that lets Sharon apply what she learned in a way that feels like art or play, not a test.`

  return { system, user }
}
