-- AK Learning Platform — Initial Schema
-- All 21 tables for Phase 1

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE rarity_level AS ENUM ('common', 'uncommon', 'rare', 'legendary');
CREATE TYPE rotation_mode AS ENUM ('auto', 'manual');
CREATE TYPE language_preference AS ENUM ('en', 'ko');
CREATE TYPE material_type AS ENUM ('vocab_list', 'worksheet', 'test', 'other');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'drag_drop', 'image_match', 'typed_response', 'spoken_response');
CREATE TYPE point_action AS ENUM ('learn_complete', 'practice_correct', 'apply_submitted', 'perfect_practice_bonus', 'daily_streak_bonus', 'surprise_bonus');

-- ============================================================
-- HELPER: updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. families
-- ============================================================

CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. parent_profiles
-- ============================================================

CREATE TABLE parent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  language_preference language_preference NOT NULL DEFAULT 'en',
  notification_prefs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_parent_profiles_family ON parent_profiles(family_id);

ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own family" ON parent_profiles
  FOR ALL USING (
    family_id IN (
      SELECT pp.family_id FROM parent_profiles pp WHERE pp.id = auth.uid()
    )
  );

-- ============================================================
-- 3. student_profiles
-- ============================================================

CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birthdate DATE,
  current_grade INTEGER NOT NULL DEFAULT 4,
  pin_hash TEXT,
  active_character_id UUID, -- FK added later (circular dep with characters)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_profiles_family ON student_profiles(family_id);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own students" ON student_profiles
  FOR ALL USING (
    family_id IN (
      SELECT pp.family_id FROM parent_profiles pp WHERE pp.id = auth.uid()
    )
  );

-- ============================================================
-- 4. characters
-- ============================================================

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ko TEXT,
  subject_id UUID, -- FK added later (circular dep with subjects)
  rarity rarity_level NOT NULL DEFAULT 'common',
  unlock_trigger TEXT,
  illustration_url TEXT,
  description_en TEXT,
  description_ko TEXT
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Characters are readable by authenticated" ON characters
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 5. subjects
-- ============================================================

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ko TEXT,
  grade_level INTEGER NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true,
  pedagogical_framework TEXT,
  color_theme TEXT,
  mascot_character_id UUID REFERENCES characters(id),
  aria_analogy_bank JSONB DEFAULT '[]',
  content_generation_brief JSONB DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subjects_family ON subjects(family_id);
CREATE INDEX idx_subjects_student ON subjects(student_id);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own subjects" ON subjects
  FOR ALL USING (
    family_id IN (
      SELECT pp.family_id FROM parent_profiles pp WHERE pp.id = auth.uid()
    )
  );

-- ============================================================
-- 6. topics
-- ============================================================

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  display_name_ko TEXT,
  grade_level INTEGER NOT NULL DEFAULT 4,
  difficulty INTEGER NOT NULL DEFAULT 1,
  cpa_anchor TEXT,
  sharon_analogy TEXT,
  prerequisite_topic_ids JSONB DEFAULT '[]',
  kis_curriculum_aligned BOOLEAN NOT NULL DEFAULT false,
  tags JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_topics_subject ON topics(subject_id);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own topics" ON topics
  FOR ALL USING (
    subject_id IN (
      SELECT s.id FROM subjects s
      JOIN parent_profiles pp ON pp.family_id = s.family_id
      WHERE pp.id = auth.uid()
    )
  );

-- ============================================================
-- 7. curriculum_settings
-- ============================================================

CREATE TABLE curriculum_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  current_topic_id UUID REFERENCES topics(id),
  rotation_mode rotation_mode NOT NULL DEFAULT 'auto',
  subject_grade_level INTEGER NOT NULL DEFAULT 4,
  last_changed_by UUID REFERENCES parent_profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id)
);

ALTER TABLE curriculum_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own curriculum" ON curriculum_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = curriculum_settings.student_id
    )
  );

CREATE TRIGGER set_curriculum_settings_updated_at
  BEFORE UPDATE ON curriculum_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. session_content_cache
-- ============================================================

CREATE TABLE session_content_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  learn_content JSONB NOT NULL DEFAULT '{}',
  practice_questions JSONB NOT NULL DEFAULT '[]',
  apply_challenge JSONB NOT NULL DEFAULT '{}',
  aria_scripts JSONB NOT NULL DEFAULT '{}',
  profile_hash TEXT,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_session_content_cache_student_topic ON session_content_cache(student_id, topic_id);

ALTER TABLE session_content_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own cache" ON session_content_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = session_content_cache.student_id
    )
  );

-- ============================================================
-- 9. parent_guides
-- ============================================================

CREATE TABLE parent_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content_en TEXT,
  content_ko TEXT,
  profile_hash TEXT
);

CREATE INDEX idx_parent_guides_topic ON parent_guides(topic_id);
CREATE INDEX idx_parent_guides_student ON parent_guides(student_id);

ALTER TABLE parent_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own guides" ON parent_guides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = parent_guides.student_id
    )
  );

-- ============================================================
-- 10. learner_profile
-- ============================================================

CREATE TABLE learner_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE UNIQUE,
  strengths JSONB DEFAULT '[]',
  development_areas JSONB DEFAULT '[]',
  focus_notes JSONB DEFAULT '{}',
  personal_context JSONB DEFAULT '{}',
  current_school_context JSONB DEFAULT '{}',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE learner_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own learner profile" ON learner_profile
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = learner_profile.student_id
    )
  );

CREATE TRIGGER set_learner_profile_updated_at
  BEFORE UPDATE ON learner_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. teacher_notes
-- ============================================================

CREATE TABLE teacher_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parent_profiles(id),
  subject TEXT,
  source TEXT,
  note_text TEXT NOT NULL,
  note_language language_preference NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_teacher_notes_student ON teacher_notes(student_id);

ALTER TABLE teacher_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own teacher notes" ON teacher_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = teacher_notes.student_id
    )
  );

-- ============================================================
-- 12. report_cards
-- ============================================================

CREATE TABLE report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES parent_profiles(id),
  file_url TEXT,
  extracted_json JSONB,
  confirmed_at TIMESTAMPTZ,
  grading_period TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_cards_student ON report_cards(student_id);

ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own report cards" ON report_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = report_cards.student_id
    )
  );

-- ============================================================
-- 13. school_materials
-- ============================================================

CREATE TABLE school_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES parent_profiles(id),
  material_type material_type NOT NULL DEFAULT 'other',
  subject TEXT,
  week_of DATE,
  file_url TEXT,
  extracted_json JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_school_materials_student ON school_materials(student_id);

ALTER TABLE school_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own school materials" ON school_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = school_materials.student_id
    )
  );

-- ============================================================
-- 14. sessions
-- ============================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id),
  grade_level INTEGER NOT NULL DEFAULT 4,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_of_week INTEGER,
  time_of_day TEXT,
  stage_completions JSONB DEFAULT '{}',
  points_earned INTEGER NOT NULL DEFAULT 0,
  time_per_stage JSONB DEFAULT '{}',
  aria_reengagement_triggers INTEGER NOT NULL DEFAULT 0,
  hints_requested INTEGER NOT NULL DEFAULT 0,
  session_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_student_date ON sessions(student_id, date);
CREATE INDEX idx_sessions_subject ON sessions(subject_id);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own sessions" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = sessions.student_id
    )
  );

-- ============================================================
-- 15. practice_results
-- ============================================================

CREATE TABLE practice_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question_type question_type NOT NULL,
  topic_tag TEXT,
  correct BOOLEAN NOT NULL DEFAULT false,
  retried BOOLEAN NOT NULL DEFAULT false,
  retry_correct BOOLEAN,
  response_time_secs REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_practice_results_session ON practice_results(session_id);

ALTER TABLE practice_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own practice results" ON practice_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      JOIN sessions s ON s.student_id = sp.id
      WHERE pp.id = auth.uid() AND s.id = practice_results.session_id
    )
  );

-- ============================================================
-- 16. analytics_weekly
-- ============================================================

CREATE TABLE analytics_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_data JSONB DEFAULT '{}',
  summary_en TEXT,
  summary_ko TEXT,
  subject_highlights JSONB DEFAULT '[]',
  focus_insight_en TEXT,
  focus_insight_ko TEXT,
  development_flags JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  grade_readiness_signals JSONB DEFAULT '{}'
);

CREATE INDEX idx_analytics_weekly_student_week ON analytics_weekly(student_id, week_of);

ALTER TABLE analytics_weekly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own analytics" ON analytics_weekly
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = analytics_weekly.student_id
    )
  );

-- ============================================================
-- 17. points_ledger
-- ============================================================

CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  action point_action NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_points_ledger_student ON points_ledger(student_id);

ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own points" ON points_ledger
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = points_ledger.student_id
    )
  );

-- ============================================================
-- 18. streaks
-- ============================================================

CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  freeze_count INTEGER NOT NULL DEFAULT 0,
  last_session_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own streaks" ON streaks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = streaks.student_id
    )
  );

CREATE TRIGGER set_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 19. characters_earned
-- ============================================================

CREATE TABLE characters_earned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  earned_trigger TEXT
);

CREATE INDEX idx_characters_earned_student ON characters_earned(student_id);

ALTER TABLE characters_earned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own earned characters" ON characters_earned
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = characters_earned.student_id
    )
  );

-- ============================================================
-- 20. rewards
-- ============================================================

CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  milestone_pts INTEGER NOT NULL,
  description_en TEXT,
  description_ko TEXT,
  earned_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES parent_profiles(id)
);

CREATE INDEX idx_rewards_student ON rewards(student_id);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own rewards" ON rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = rewards.student_id
    )
  );

-- ============================================================
-- 21. parent_messages
-- ============================================================

CREATE TABLE parent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  from_parent_id UUID NOT NULL REFERENCES parent_profiles(id),
  message_text TEXT NOT NULL,
  message_language language_preference NOT NULL DEFAULT 'en',
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_session_id UUID REFERENCES sessions(id),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_parent_messages_student ON parent_messages(student_id);

ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents access own messages" ON parent_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parent_profiles pp
      JOIN student_profiles sp ON sp.family_id = pp.family_id
      WHERE pp.id = auth.uid() AND sp.id = parent_messages.student_id
    )
  );

-- ============================================================
-- DEFERRED FOREIGN KEYS (circular dependencies)
-- ============================================================

ALTER TABLE characters
  ADD CONSTRAINT fk_characters_subject
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL;

ALTER TABLE student_profiles
  ADD CONSTRAINT fk_student_active_character
  FOREIGN KEY (active_character_id) REFERENCES characters(id) ON DELETE SET NULL;

-- ============================================================
-- RLS policy for families (parent can access own family)
-- ============================================================

CREATE POLICY "Parents access own family" ON families
  FOR ALL USING (
    id IN (
      SELECT pp.family_id FROM parent_profiles pp WHERE pp.id = auth.uid()
    )
  );
