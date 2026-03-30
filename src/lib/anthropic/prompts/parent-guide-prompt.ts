export interface ParentGuideContent {
  sections: {
    what_is_this: { en: string; ko: string }
    why_it_matters: { en: string; ko: string }
    where_sharon_is: { en: string; ko: string }
    how_to_support: { en: string; ko: string }
    what_aria_is_teaching: { en: string; ko: string }
    conversation_starters: { en: string[]; ko: string[] }
    common_mistakes: { en: string; ko: string }
  }
}

interface PromptContext {
  topic: {
    display_name: string
    cpa_anchor: string | null
    sharon_analogy: string | null
    difficulty: number
  }
  subject: {
    name: string
    pedagogical_framework: string | null
  }
  profile: {
    strengths: unknown[]
    development_areas: unknown[]
    personal_context: Record<string, unknown>
    current_school_context: Record<string, unknown>
  }
}

export function buildParentGuidePrompt(ctx: PromptContext) {
  const system = `You are a bilingual (English + Korean) education content writer for a learning app. You generate Parent Guides that help parents understand and support their child's learning.

The student is Sharon, age 10, Grade 4 at KIS Seoul.
Parents: Andrew (English) and Yuri (Korean). Both read the guide in their preferred language.

Korean must feel naturally written — never machine-translated. Write as a warm, knowledgeable educator speaking directly to parents.

Generate ALL 7 sections in BOTH English and Korean in a single response.
Output ONLY valid JSON matching the ParentGuideContent interface. No markdown, no explanation.

The 7 sections:
1. What Is This? (개념 설명) — plain-language concept explanation
2. Why It Matters (왜 중요한가요?) — real-world relevance and curriculum context
3. Where Sharon Is Right Now (Sharon의 현재 수준) — personalized to actual performance
4. How to Support at Home (집에서 어떻게 도와줄까요?) — 3-5 concrete strategies, at least one Sharon-specific
5. What Miss Aria Is Teaching (Miss Aria가 가르치는 내용) — plain summary of session content
6. Conversation Starters (대화 시작하기) — 5 natural questions for dinner or car rides
7. Common Mistakes to Watch For (자주 하는 실수들) — 2-3 misconceptions, what to say/not say`

  const user = `Generate a bilingual Parent Guide for:

Topic: ${ctx.topic.display_name}
Subject: ${ctx.subject.name}
Framework: ${ctx.subject.pedagogical_framework || 'N/A'}
CPA Anchor: ${ctx.topic.cpa_anchor || 'N/A'}
Difficulty: ${ctx.topic.difficulty}/3

Sharon's Profile:
- Strengths: ${JSON.stringify(ctx.profile.strengths)}
- Development areas: ${JSON.stringify(ctx.profile.development_areas)}
- Personal context: ${JSON.stringify(ctx.profile.personal_context)}
- School context: ${JSON.stringify(ctx.profile.current_school_context)}

Generate all 7 sections in both English and Korean.`

  return { system, user }
}
