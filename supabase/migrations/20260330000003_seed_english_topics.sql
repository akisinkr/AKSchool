-- Seed English subject + 5 strand topics for Grade 4

-- ============================================================
-- English subject
-- ============================================================

INSERT INTO subjects (id, family_id, student_id, name, name_ko, grade_level, is_active, pedagogical_framework, color_theme, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000001',
   'c1000000-0000-0000-0000-000000000001',
   'English', '영어', 4, true,
   'Science of Reading (vocabulary before reading, text structure, scaffolded writing)',
   'calm teal + ivory + soft blue',
   2);

-- ============================================================
-- English curriculum setting
-- ============================================================

INSERT INTO curriculum_settings (student_id, subject_id, rotation_mode, subject_grade_level) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'auto', 4);

-- ============================================================
-- 5 English Grade 4 topic strands
-- ============================================================

INSERT INTO topics (id, subject_id, display_name, display_name_ko, grade_level, difficulty, cpa_anchor, sharon_analogy, kis_curriculum_aligned, tags) VALUES

-- 1. Reading Comprehension
('e2000000-0000-0000-0000-000000000001',
 'd1000000-0000-0000-0000-000000000002',
 'Reading Comprehension: Informational and Narrative',
 '독해: 정보 글과 이야기',
 4, 1,
 'Pre-reading: activate background knowledge. During: annotate and question. Post: summarize and connect.',
 'Imagine you''re reading a story about a girl who moves from Singapore to Seoul — just like you did! What clues does the author give about how she feels?',
 true,
 '["reading", "comprehension", "informational", "narrative", "main idea", "inference"]'::jsonb),

-- 2. Vocabulary in Context
('e2000000-0000-0000-0000-000000000002',
 'd1000000-0000-0000-0000-000000000002',
 'Vocabulary in Context: Tier 2 Academic Words',
 '문맥 속 어휘: 2단계 학술 단어',
 4, 2,
 'Introduce word before reading. Use context clues, word parts, and multiple exposures. Apply in writing.',
 'You know how some craft supplies have fancy names like "embellishment" or "adhesive"? Academic words are like that — grown-up versions of words you already know!',
 true,
 '["vocabulary", "tier 2", "academic words", "context clues", "word parts"]'::jsonb),

-- 3. Grammar in Use
('e2000000-0000-0000-0000-000000000003',
 'd1000000-0000-0000-0000-000000000002',
 'Grammar in Use: Embedded in Writing',
 '문법 활용: 글쓰기 속 문법',
 4, 2,
 'Notice pattern in mentor text. Name the grammar concept. Practice in own writing. Revise for effect.',
 'Think of grammar like the rules of a craft project — you can bend them once you know them, but first you need to know which glue holds what together!',
 true,
 '["grammar", "writing", "sentences", "punctuation", "parts of speech"]'::jsonb),

-- 4. Writing
('e2000000-0000-0000-0000-000000000004',
 'd1000000-0000-0000-0000-000000000002',
 'Writing: Sentence to Paragraph to Short Piece',
 '글쓰기: 문장에서 문단, 짧은 글까지',
 4, 2,
 'Scaffold: sentence starters → paragraph frames → independent writing. Use "First... Then... Finally..." structure.',
 'Writing is like building with LEGO — start with one brick (a sentence), stack a few together (a paragraph), and before you know it you''ve built something amazing!',
 true,
 '["writing", "paragraph", "scaffolding", "sentence starters", "organization"]'::jsonb),

-- 5. Spelling Patterns and Morphology
('e2000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000002',
 'Spelling Patterns and Morphology',
 '철자 패턴과 형태론',
 4, 1,
 'Sort words by pattern. Identify root words, prefixes, suffixes. Apply rules to decode unfamiliar words.',
 'Words are like Sanrio characters — they come in families! If you know "happy," you can figure out "unhappy," "happiness," and "happily" because they''re all related!',
 true,
 '["spelling", "morphology", "prefixes", "suffixes", "root words", "word families"]'::jsonb);

-- ============================================================
-- Set first English topic as current
-- ============================================================

UPDATE curriculum_settings
SET current_topic_id = 'e2000000-0000-0000-0000-000000000001'
WHERE student_id = 'c1000000-0000-0000-0000-000000000001'
  AND subject_id = 'd1000000-0000-0000-0000-000000000002';
