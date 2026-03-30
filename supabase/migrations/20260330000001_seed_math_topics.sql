-- Seed data: Family, Sharon, Math subject, 8 Grade 4 topics

-- ============================================================
-- Family
-- ============================================================

INSERT INTO families (id, name) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'AK Family');

-- ============================================================
-- Parent profiles (Andrew + Yuri)
-- ============================================================

INSERT INTO parent_profiles (id, family_id, name, role, language_preference) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Andrew', 'dad', 'en'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Yuri', 'mom', 'ko');

-- ============================================================
-- Sharon
-- ============================================================

INSERT INTO student_profiles (id, family_id, name, birthdate, current_grade) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Sharon', '2015-04-04', 4);

-- ============================================================
-- Sharon's learner profile (initial)
-- ============================================================

INSERT INTO learner_profile (student_id, strengths, development_areas, focus_notes, personal_context, current_school_context) VALUES
  ('c1000000-0000-0000-0000-000000000001',
   '[]'::jsonb,
   '[]'::jsonb,
   '{
     "sustained_attention": "low threshold",
     "learning_style": "visual",
     "thinking_style": "creative and associative",
     "writing": "needs encouragement for extended writing",
     "engagement": "responds strongly to character and art analogies"
   }'::jsonb,
   '{
     "born": "Korea",
     "lived_singapore": "2017-2024",
     "schools_singapore": "Singapore International School (Korean + English)",
     "returned_seoul": 2024,
     "language_dominant": "English",
     "korean_level": "weaker",
     "loves": ["Sanrio characters", "kawaii style", "crafting", "making art", "creative projects"],
     "personality": "warm, kind, creative thinker"
   }'::jsonb,
   '{
     "grade": 4,
     "school": "KIS Seoul",
     "curriculum": "Standards-based American curriculum",
     "current_math_unit": null,
     "current_english_unit": null
   }'::jsonb
  );

-- ============================================================
-- Sharon's streak (initial)
-- ============================================================

INSERT INTO streaks (student_id, current_streak, longest_streak, freeze_count) VALUES
  ('c1000000-0000-0000-0000-000000000001', 0, 0, 0);

-- ============================================================
-- Math subject
-- ============================================================

INSERT INTO subjects (id, family_id, student_id, name, name_ko, grade_level, is_active, pedagogical_framework, color_theme, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   'c1000000-0000-0000-0000-000000000001',
   'Math', '수학', 4, true,
   'Singapore Math CPA (Concrete → Pictorial → Abstract)',
   'warm amber + cream + soft orange',
   1);

-- ============================================================
-- Math curriculum setting
-- ============================================================

INSERT INTO curriculum_settings (student_id, subject_id, rotation_mode, subject_grade_level) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'auto', 4);

-- ============================================================
-- 8 Math Grade 4 topics
-- ============================================================

INSERT INTO topics (id, subject_id, display_name, display_name_ko, grade_level, difficulty, cpa_anchor, sharon_analogy, kis_curriculum_aligned, tags) VALUES

-- 1. Multi-digit multiplication and division
('e1000000-0000-0000-0000-000000000001',
 'd1000000-0000-0000-0000-000000000001',
 'Multi-digit Multiplication and Division',
 '여러 자릿수 곱셈과 나눗셈',
 4, 1,
 'Concrete: grouping physical objects into equal sets. Pictorial: area models and arrays. Abstract: standard algorithm.',
 'Imagine you''re organizing your Sanrio sticker collection into equal pages of your album — how many stickers per page if you have 156 stickers and 12 pages?',
 true,
 '["multiplication", "division", "multi-digit", "arrays", "area model"]'::jsonb),

-- 2. Fractions
('e1000000-0000-0000-0000-000000000002',
 'd1000000-0000-0000-0000-000000000001',
 'Fractions: Equivalence, Comparing, Adding, Subtracting',
 '분수: 동치, 비교, 덧셈, 뺄셈',
 4, 2,
 'Concrete: folding paper strips, fraction tiles. Pictorial: bar models and number lines. Abstract: finding common denominators.',
 'You''re cutting washi tape for a craft project — if you use 3/8 of a roll for one card and 2/8 for another, how much tape did you use altogether?',
 true,
 '["fractions", "equivalence", "comparing", "adding", "subtracting", "bar model"]'::jsonb),

-- 3. Decimals
('e1000000-0000-0000-0000-000000000003',
 'd1000000-0000-0000-0000-000000000001',
 'Decimals: Place Value, Comparing, Adding, Subtracting',
 '소수: 자릿값, 비교, 덧셈, 뺄셈',
 4, 2,
 'Concrete: base-ten blocks, money. Pictorial: hundredths grids and number lines. Abstract: vertical addition with decimal alignment.',
 'You''re at the Seoul stationery shop — a pen costs ₩3.45 and a notebook costs ₩2.70. Can you figure out the total before you get to the counter?',
 true,
 '["decimals", "place value", "comparing", "adding", "subtracting", "money"]'::jsonb),

-- 4. Area and perimeter
('e1000000-0000-0000-0000-000000000004',
 'd1000000-0000-0000-0000-000000000001',
 'Area and Perimeter',
 '넓이와 둘레',
 4, 1,
 'Concrete: tiling a surface with unit squares, walking around the edge. Pictorial: drawing rectangles on grid paper. Abstract: formulas for area and perimeter.',
 'You''re designing a frame for your latest drawing — you need the perimeter for the frame border and the area to know how much glitter paper fits inside.',
 true,
 '["area", "perimeter", "rectangles", "measurement", "grid"]'::jsonb),

-- 5. Factors, multiples, prime and composite
('e1000000-0000-0000-0000-000000000005',
 'd1000000-0000-0000-0000-000000000001',
 'Factors, Multiples, Prime and Composite Numbers',
 '인수, 배수, 소수와 합성수',
 4, 2,
 'Concrete: arranging objects into rectangular arrays. Pictorial: factor rainbows and multiplication charts. Abstract: divisibility rules.',
 'You have 24 character cards to arrange in your display case — what are all the different rectangle arrangements you can make? Some numbers only make one boring row!',
 true,
 '["factors", "multiples", "prime", "composite", "divisibility"]'::jsonb),

-- 6. Angles
('e1000000-0000-0000-0000-000000000006',
 'd1000000-0000-0000-0000-000000000001',
 'Angles: Identifying, Measuring, Drawing',
 '각도: 식별, 측정, 그리기',
 4, 2,
 'Concrete: opening doors, clock hands, body movements. Pictorial: protractor diagrams. Abstract: measuring and classifying angles by degree.',
 'Think about opening your craft scissors — a tiny snip is a small angle, cutting a big piece of felt is a wide angle. Can you spot angles everywhere in your art supplies?',
 true,
 '["angles", "acute", "obtuse", "right angle", "protractor", "measuring"]'::jsonb),

-- 7. Data
('e1000000-0000-0000-0000-000000000007',
 'd1000000-0000-0000-0000-000000000001',
 'Data: Line Plots, Bar Graphs, Interpretation',
 '데이터: 선 도표, 막대 그래프, 해석',
 4, 1,
 'Concrete: collecting real data (e.g., measuring items). Pictorial: creating and reading graphs. Abstract: interpreting trends and answering questions from data.',
 'You surveyed your classmates about their favourite Sanrio characters — now let''s turn those tallies into a colourful bar graph and find out who''s the most popular!',
 true,
 '["data", "line plots", "bar graphs", "interpretation", "surveys"]'::jsonb),

-- 8. Multi-step word problems
('e1000000-0000-0000-0000-000000000008',
 'd1000000-0000-0000-0000-000000000001',
 'Multi-step Word Problems and Logical Reasoning',
 '다단계 문장제와 논리적 추론',
 4, 3,
 'Concrete: acting out the problem with objects. Pictorial: bar models to represent relationships. Abstract: writing and solving multi-step equations.',
 'You''re planning a craft party — 8 friends are coming, each needs 3 sheets of origami paper and 2 markers. But you already have 10 markers at home... how many do you need to buy?',
 true,
 '["word problems", "multi-step", "bar model", "logical reasoning", "problem solving"]'::jsonb);

-- ============================================================
-- Set first topic as current
-- ============================================================

UPDATE curriculum_settings
SET current_topic_id = 'e1000000-0000-0000-0000-000000000001'
WHERE student_id = 'c1000000-0000-0000-0000-000000000001'
  AND subject_id = 'd1000000-0000-0000-0000-000000000001';
