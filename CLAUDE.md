# AK Learning Platform — Start Here
# Complete setup guide for Claude Code
# Read this first before writing any code

---

## WHAT THIS IS

AK Learning Platform is a personalized AI learning app for Sharon
(age 10, KIS Seoul, Grade 4). The voice teacher inside the app is
called Miss Aria. She teaches Sharon daily sessions in Math and English.

Platform name: AK Learning Platform
Voice teacher: Miss Aria (powered by Google Gemini Live API)
Builder: Andrew, solo founder, using Claude Code

---

## WHAT YOU BUILT IN PAPERCLIP TODAY

Paperclip is running at localhost:3100 when you start it.
All of this is already set up and saved:

Company: AK Learning Platform
Agents created:
- CEO (Project Lead) — orchestrates all agents
- CTO (Dev) — builds the app
- Ms. Kim (Educator) — validates curriculum content
- Alex (QA) — tests parent experience and Korean quality
- Mia (Sharon's Advocate) — tests everything as Sharon
- Seo-yeon (Research) — researches hagwons and EdTech

All Phase 1 issues are created and assigned.

To restart Paperclip tomorrow:
  Open Terminal and run: pnpm paperclipai run
  Then open: http://localhost:3100

---

## URGENT — DO THIS FIRST TOMORROW

1. Rotate your Anthropic API key immediately
   Go to: console.anthropic.com → API Keys
   Delete the old key (it was exposed in a screenshot)
   Create a new one
   In Terminal run:
   echo 'export ANTHROPIC_API_KEY=your-new-key' >> ~/.zshrc
   source ~/.zshrc

2. Find the Paperclip working directory
   Start Paperclip: pnpm paperclipai run
   Go to localhost:3100
   Click CEO → Runs tab → click any run
   The path shown is your working directory

3. Copy CLAUDE.md to that working directory
   cp ~/path/to/CLAUDE.md /path/to/ceo-working-directory/CLAUDE.md

4. Set all agents to use the same working directory
   This is the ak-learning-platform project folder
   All agents share one codebase

5. Click Run Heartbeat on CEO
   The CEO reads CLAUDE.md and delegates work to all agents

---

## THE AGENT TEAM — WHO DOES WHAT

### CEO — Project Lead
Reads CLAUDE.md every heartbeat.
Reviews Phase 1 status.
Delegates tasks to CTO, Ms. Kim, Alex, Mia, Seo-yeon.
Never writes application code.
Escalates board-level decisions to Andrew (you).

### CTO — Dev (Technical Architect)
Builds everything in the tech stack.
Owns Supabase schema, Gemini Live, Anthropic API pipeline.
Owns all Next.js/TypeScript application code.
Reports latency and cost per session.
Flags any API key exposed to client side — critical red line.

### Ms. Kim — Content and Curriculum
Validates all Grade 4 content against KIS curriculum.
Reviews every LEARN/PRACTICE/APPLY stage for quality.
Ensures Math follows CPA framework (Concrete→Pictorial→Abstract).
Ensures English follows Science of Reading framework.
Flags anything pedagogically wrong before it reaches Sharon.

### Alex — QA and Parent Experience
Tests all parent admin flows end-to-end.
Validates all Korean content — must feel naturally written, never
machine-translated.
Tests on mobile (parents check on phones).
Every core task must complete in 3 taps or under 3 minutes.

### Mia — Sharon's Advocate (Devil's Advocate)
Tests everything as Sharon — 10 years old, Sanrio fan, easily distracted.
If Mia flags WOULD QUIT on anything — it does not ship.
This is the highest priority flag in the system.
Tests Miss Aria scripts, animations, character designs, session flow.

### Seo-yeon — Research Analyst
Researches Seoul hagwon curricula (especially Daechi-dong).
Tracks global EdTech best practices (Duolingo, Khanmigo, BYJU'S).
Posts research briefs as comments on relevant issues.
Informs all other agents — does not block.

---

## AGENT ESCALATION RULES

Priority when agents conflict:
1. Mia's WOULD QUIT — always escalate, nothing ships without Andrew override
2. Ms. Kim's pedagogical red lines — wrong content is worse than no content
3. CTO's CRITICAL flags — broken systems destroy trust
4. Alex's BLOCKER flags — broken parent UX kills retention
5. Seo-yeon's findings — inform but never block

---

## WHO SHARON IS

Name: Sharon
Born: April 4, 2015 (age 10, turning 11 in April)
School: Korea International School (KIS), Seoul — Grade 4
Curriculum: Standards-based American curriculum

Life: Born Korea → Singapore 2017-2024 (Singapore International School,
taught in Korean and English) → returned Seoul 2024

Language: Strongly English-dominant. Much prefers English.
Korean is weaker. App is 100% English for Sharon. No Korean ever.

Loves: Sanrio characters, kawaii style, crafting, making art, creative projects
Personality: Warm, kind, creative thinker

CRITICAL: Low sustained attention threshold.
Loses focus fast if things feel slow or repetitive.
The entire UX is built around this — new micro-event every 2-3 minutes.
Miss Aria re-engages Sharon every 2 minutes if she goes silent.

---

## THE PARENTS

Andrew (Dad) — admin in English. Manages curriculum and school uploads.
Yuri (Mom) — admin in Korean. Feels much more comfortable in Korean.
Both have full admin access. Language stored per parent profile.
App shows Sharon: "아빠 메시지" for Dad, "엄마 메시지" for Mom.

---

## MISS ARIA — THE VOICE TEACHER

Real-time AI voice teacher powered by Google Gemini Live API.
Speech-to-speech. Not a chatbot. Sharon's favourite teacher.
Warm, funny, patient, genuinely excited. Cool older sister energy.

Technical setup:
- Model: gemini-2.5-flash-native-audio
- Voice: Aoede (warmest, most teacher-like)
- Architecture: Browser mic → Next.js backend → Gemini Live → Backend → Speaker
- NEVER expose API keys to client side
- First audio response must be under 2 seconds — hard requirement
- Enable affective dialog (adapts tone to Sharon's emotion)
- Barge-in enabled (Sharon can interrupt naturally)
- Auto-reconnect: max 3 retries, then fallback to pre-generated TTS

2-Minute Re-engagement Rule (REQUIRED):
If Sharon is silent for 2 minutes during any stage, Aria proactively
checks in. This is the app's built-in focus management system.
Dev must implement this. Non-negotiable.

Aria's rules (never break):
- Never give the answer — Socratic method always
- Never say "wrong," "incorrect," "mistake"
  Say: "not quite," "almost," "let's think about this differently"
- Always assume Sharon can do it
- Under 60 seconds per voice turn
- Reference Sharon's world in every analogy (crafting, characters, art,
  Singapore memories, Seoul life)
- Check in every 2 minutes if no interaction

---

## SHARON'S SESSION FLOW

Each session = 15-20 minutes per subject.
Feels like 5 minutes, six times.
Full-screen animated transition between every stage.

HOME SCREEN:
Subject cards with kawaii mascot characters.
Streak counter + total points + progress bar to next reward.
Miss Aria greeting message.

LEARN STAGE (5-7 min, 3 micro-bursts):
Burst 1 — Hook (0:00-2:00):
  Aria speaks 30-45 sec with Sharon-specific analogy.
  Single kawaii illustration. One sentence text. Nothing else.

Burst 2 — Explanation (2:00-4:30):
  3-4 concept chunks, one at a time.
  Aria narrates each (2-3 sentences max).
  Animated visuals respond to Aria's words.
  Mascot sidekick reacts on screen.

Burst 3 — Check-In (4:30-6:00):
  Aria asks ONE verbal question.
  Sharon answers by voice or tapping illustrated tiles.
  Warm response regardless.
  10 pts awarded with pop animation.

PRACTICE STAGE (5-7 min, 5 mini-games):
Q1: Multiple choice with illustrated options
Q2: Drag-and-drop tile to fill blank
Q3: Multiple choice (harder)
Q4: Tap correct image (visual matching)
Q5: Short typed or spoken response (1 sentence)

Wrong answer: amber glow — no red, no X, no buzzer. EVER.
One retry offered. Move forward regardless.
5 pts per correct answer. +10 bonus for perfect score.

APPLY STAGE (5-7 min):
Full-screen environment transition (craft studio / art gallery /
character design desk / Seoul market / Singapore scene).
Aria: "I'm genuinely curious what you'll do with this one."
3-level hint system — Aria offers, never forces.
15 pts on submission. Full-screen celebration.
Aria gives personal closing message.

---

## GAMIFICATION

Points never reset. Ever.

| Action                        | Points    |
|-------------------------------|-----------|
| LEARN complete                | 10 pts    |
| Each correct PRACTICE answer  | 5 pts     |
| APPLY submitted               | 15 pts    |
| Perfect PRACTICE (5/5)        | +10 bonus |
| Daily Streak (both subjects)  | +10 bonus |
| Typical good day              | ~80-100   |
| Perfect day                   | ~130-160  |

Reward Tiers:
500 pts  (~7-10 days)  = Small reward
1500 pts (~3-4 weeks) = Medium reward
3500 pts (~6-8 weeks) = Big reward

Parents set the actual reward description in admin (bilingual).
Sharon sees exactly what she's working toward.

Streak Freeze:
Earned when both subjects completed with perfect PRACTICE.
Protects streak on one missed day. Max 2 stored.

Variable Surprise (~1 in 5 sessions):
Double Points Day / rare character reveal /
Miss Aria's Secret Challenge.
Unpredictable timing = stronger engagement.

Character Collection:
Every 100 pts = one new kawaii character card unlocked.
Rarity: Common / Uncommon / Rare / Legendary.
Sharon's gallery = her art collection.
Mia must approve: are these cute enough for a Sanrio fan?

---

## TECH STACK

| Layer              | Technology                               |
|--------------------|------------------------------------------|
| Frontend           | Next.js 14 + TypeScript                  |
| Styling            | Tailwind CSS                             |
| i18n (admin)       | next-i18next (English + Korean)          |
| Database           | Supabase (PostgreSQL)                    |
| File Storage       | Supabase Storage                         |
| AI Content + Docs  | Anthropic API (claude-sonnet-4-20250514) |
| AI Voice Teacher   | Google Gemini Live API                   |
| Voice Connection   | WebSocket (server-to-server only)        |
| Animations         | Framer Motion                            |
| Auth               | Supabase Auth (parents) + PIN (Sharon)   |
| Audio              | Web Audio API                            |
| Push Notifications | Supabase Edge Functions + Web Push       |

---

## SUPABASE SCHEMA (build all tables day one)

-- Core
families (id, name, created_at)

parent_profiles (
  id, family_id, name, role,
  language_preference,   -- "en" | "ko"
  notification_prefs,
  created_at
)

student_profiles (
  id, family_id, name, birthdate,
  current_grade,         -- 4
  pin_hash,
  active_character_id,
  created_at
)

-- Subject system (extensible for future subjects)
subjects (
  id, family_id, student_id,
  name, name_ko,
  grade_level, is_active,
  pedagogical_framework,
  color_theme,
  mascot_character_id,
  aria_analogy_bank,
  content_generation_brief,
  sort_order, created_at
)

-- Topics
topics (
  id, subject_id,
  display_name, display_name_ko,
  grade_level, difficulty,
  cpa_anchor, sharon_analogy,
  prerequisite_topic_ids,
  kis_curriculum_aligned,
  tags, is_active, created_at
)

-- Curriculum settings
curriculum_settings (
  id, student_id, subject_id,
  current_topic_id,
  rotation_mode,         -- "auto" | "manual"
  subject_grade_level,
  last_changed_by, updated_at
)

-- Generated content (cached)
session_content_cache (
  id, student_id, topic_id,
  generated_at,
  learn_content,
  practice_questions,
  apply_challenge,
  aria_scripts,
  profile_hash,
  expires_at
)

parent_guides (
  id, topic_id, student_id,
  generated_at,
  content_en,
  content_ko,
  profile_hash
)

-- Learner intelligence
learner_profile (
  id, student_id,
  strengths,
  development_areas,
  focus_notes,
  personal_context,
  current_school_context,
  last_updated
)

teacher_notes (
  id, student_id, parent_id,
  subject, source, note_text,
  note_language, created_at
)

report_cards (
  id, student_id, uploaded_by,
  file_url, extracted_json,
  confirmed_at, grading_period,
  created_at
)

school_materials (
  id, student_id, uploaded_by,
  material_type, subject,
  week_of, file_url,
  extracted_json, notes, created_at
)

-- Sessions
sessions (
  id, student_id, subject_id, topic_id,
  grade_level, date, day_of_week, time_of_day,
  stage_completions,
  points_earned,
  time_per_stage,
  aria_reengagement_triggers,  -- count of 2-min check-ins
  hints_requested,
  session_completed,
  created_at
)

practice_results (
  id, session_id,
  question_index, question_type,
  topic_tag, correct, retried,
  retry_correct, response_time_secs,
  created_at
)

-- Analytics
analytics_weekly (
  id, student_id, week_of,
  generated_at, raw_data,
  summary_en, summary_ko,
  subject_highlights,
  focus_insight_en, focus_insight_ko,
  development_flags,
  recommendations,
  grade_readiness_signals
)

-- Gamification
points_ledger (
  id, student_id, session_id,
  action, points, created_at
)

streaks (
  id, student_id,
  current_streak, longest_streak,
  freeze_count,          -- max 2
  last_session_date, updated_at
)

characters (
  id, name, name_ko,
  subject_id,
  rarity,                -- "common"|"uncommon"|"rare"|"legendary"
  unlock_trigger,
  illustration_url,
  description_en, description_ko
)

characters_earned (
  id, student_id, character_id,
  earned_at, earned_trigger
)

rewards (
  id, student_id, milestone_pts,
  description_en, description_ko,
  earned_at, confirmed_at, confirmed_by
)

-- Parent features
parent_messages (
  id, student_id, from_parent_id,
  message_text, message_language,
  queued_at, delivered_session_id,
  delivered_at
)

---

## PHASE 1 BUILD CHECKLIST (build in this order)

- [ ] Full Supabase schema migration (all tables from day one)
- [ ] Seed Math Grade 4 topic library (8 topics)
- [ ] Seed Sharon's initial learner profile
- [ ] Anthropic API content generation pipeline
- [ ] Gemini Live WebSocket integration (Miss Aria voice)
- [ ] LEARN stage UI (3 micro-bursts, Framer Motion)
- [ ] PRACTICE stage UI (5 mini-games, wrong answer flow)
- [ ] APPLY stage UI (scene transition, submission, celebration)
- [ ] Points system + character unlock at every 100 pts
- [ ] Home screen (streak, points, progress bar, subject cards)
- [ ] Admin dashboard tab (English only)
- [ ] Admin curriculum tab (English only)

Agent reviews before Phase 1 ships:
- Ms. Kim validates first 5 generated Math sessions
- Mia completes full session test — would Sharon use this again?
- Alex QAs all admin flows on mobile — all tasks under 3 taps
- Dev confirms Aria latency under 2 seconds

---

## PHASE 2 CHECKLIST (after Phase 1 is working)

- [ ] English subject (full session + topic library)
- [ ] Both subjects on home screen + daily streak
- [ ] Full Miss Aria all stages + 2-min re-engagement trigger
- [ ] Streak Freeze + variable surprise rewards
- [ ] Admin School Input tab (teacher notes, report cards, materials)
- [ ] Learner profile auto-update pipeline
- [ ] Parent Guide (bilingual, 7 sections per topic)
- [ ] Growth Analytics Level 1 + Level 2
- [ ] Korean admin interface (next-i18next)
- [ ] Dual parent accounts (Andrew + Yuri)
- [ ] Parent messages (Dad/Mom → Aria reads at session start)
- [ ] Push notifications (bilingual)
- [ ] Full character collection gallery

---

## GRADE 4 CURRICULUM

Math topics (rotate weekly):
1. Multi-digit multiplication and division
2. Fractions: equivalence, comparing, adding, subtracting
3. Decimals: place value, comparing, adding, subtracting
4. Area and perimeter
5. Factors, multiples, prime and composite numbers
6. Angles: identifying, measuring, drawing
7. Data: line plots, bar graphs, interpretation
8. Multi-step word problems and logical reasoning

English strands (rotate weekly):
1. Reading comprehension (informational + narrative, 150-300 words)
2. Vocabulary in context (Tier 2 academic words)
3. Grammar in use (embedded in writing, not isolated)
4. Writing: sentence → paragraph → short piece
5. Spelling patterns and morphology

Math framework: Singapore Math CPA
  Concrete → Pictorial → Abstract
  Never open a Math LEARN with an equation
  Always start with a concrete real-world story
  Bar modeling for all word problems

English framework: Science of Reading
  Vocabulary BEFORE reading the passage
  Text structure awareness taught explicitly
  Writing scaffolded: 3-5 sentences max
  Structured prompts: "First... Then... Finally..."

---

## ADMIN SYSTEM — 4 TABS

Tab 1 — Dashboard:
  Sharon's streak, points, next reward progress
  Weekly activity heatmap
  Subject accuracy breakdown
  Focus quality indicator (Aria trigger trend)
  Needs-attention flags
  Recent session history
  Miss Aria's last session close message

Tab 2 — Curriculum:
  Current topic per subject (Change + Preview buttons)
  Auto / Manual rotation toggle
  Topic library (filterable)
  AI-suggested topics from performance data
  Parent Guide per active topic (7 sections, bilingual)

Tab 3 — School Input:
  Teacher feedback notes (Korean or English)
  Report card upload + Anthropic AI extraction
  School materials upload (vocab lists, worksheets, etc.)
  Sharon's learner profile (auto-generated, manual override)

Tab 4 — Rewards and Messages:
  Milestone tracker (500 / 1500 / 3500 pts)
  Custom reward descriptions (bilingual)
  Dad Message + Mom Message composers
  Aria reads message at next session start
  Notification settings per parent

---

## PARENT GUIDE — 7 SECTIONS PER TOPIC

Generated bilingually by Anthropic API when topic activates.
Both English and Korean in one API call.
Stored in Supabase. Never real-time translated.

1. What Is This? (개념 설명)
   Plain-language concept explanation for parents.

2. Why It Matters (왜 중요한가요?)
   Real-world relevance and curriculum context.

3. Where Sharon Is Right Now (Sharon의 현재 수준)
   Personalised to Sharon's actual performance data.

4. How to Support at Home (집에서 어떻게 도와줄까요?)
   3-5 concrete low-pressure strategies.
   At least one Sharon-specific tip per guide.

5. What Miss Aria Is Teaching (Miss Aria가 가르치는 내용)
   Plain summary of this week's session content.

6. Conversation Starters (대화 시작하기)
   5 natural questions for dinner or car rides.

7. Common Mistakes to Watch For (자주 하는 실수들)
   2-3 frequent misconceptions. What to say and not say.

---

## DESIGN RULES

Colors:
  Math: warm amber + cream + soft orange
  English: calm teal + ivory + soft blue
  App shell: soft lavender + white

Typography:
  Headers: rounded friendly display font (not corporate)
  Body: minimum 16px everywhere

Illustration style:
  Kawaii-adjacent, soft linework, pastel-leaning
  Every subject has its own mascot character
  LEARN background: cozy study room
  PRACTICE background: bright game arena
  APPLY background: creative studio / craft desk

Animations:
  Every stage transition: full-screen reset (0.5-0.8 sec)
  Correct answer: warm sparkles/stars
  Wrong answer: gentle amber wobble
  Stage completion: character mini-celebration (2-3 sec)
  Points: counter rolls up (game feel)
  Character unlock: reveal with rarity glow

Sound:
  Miss Aria voice: primary audio (Gemini Live)
  Correct: soft warm chime
  Wrong: gentle "hmm" — NEVER a buzzer. Ever.
  Points pop: satisfying gem sound
  Session complete: short upbeat jingle (3-5 sec)
  Background music: optional lo-fi, toggleable

What must NEVER appear in Sharon's experience:
  Red color for wrong answers
  X symbol for wrong answers
  Buzzer sound for wrong answers
  Words: "wrong," "incorrect," "mistake" from Aria
  Korean language anywhere in Sharon's screens
  Walls of text on any single screen
  More than one task visible at a time
  Generic praise like "Great job!" — always be specific

---

## SHARON'S INITIAL LEARNER PROFILE (seed data)

Strengths: []
Development areas: []

Focus and learning style:
  - Low sustained attention threshold
  - Visual learner
  - Creative and associative thinker
  - Needs encouragement for extended writing
  - Responds strongly to character and art analogies

Personal context:
  - Born Korea, grew up Singapore 2017-2024
  - Both cities are valid reference points for analogies
  - English-dominant, Korean weaker
  - Sanrio and kawaii aesthetic resonates deeply
  - Crafting and art are core interests

School context:
  Grade: 4
  School: KIS Seoul
  Current Math unit: [from uploads]
  Current English unit: [from uploads]

App performance (initial — all zeros):
  Math avg accuracy: 0%
  English avg accuracy: 0%
  Topics at mastery: []
  Topics needing review: []
  Streak: 0 days
  Focus trend: unknown

---

## NORTH STAR

Sharon sits down for 15 minutes and doesn't notice 20 have passed.
Yuri reads the Parent Guide in Korean and says "나도 이걸 몰랐네."
Andrew uploads a vocab list Monday and Aria teaches it Tuesday.
Sharon shows her mom her rarest character like it's a real prize.
One semester later Sharon asks: "Can Miss Aria teach me Chinese too?"

---

## HOW TO START BUILDING IN CLAUDE CODE

1. Open Terminal
2. Navigate to your project folder:
   cd ~/ak-learning-platform
3. Start Claude Code:
   claude
4. Say this to Claude Code:
   "Read this file completely. We are building the AK Learning Platform
   for Sharon. Start with Phase 1 item 1: create the full Supabase
   schema migration with all tables."

Claude Code will read this file and know everything it needs.
Work through the Phase 1 checklist in order.
Do not skip items — each one builds on the previous.

---

Version: 1.0
Project: AK Learning Platform
Voice teacher: Miss Aria
Student: Sharon, age 10, KIS Seoul
Builder: Andrew
