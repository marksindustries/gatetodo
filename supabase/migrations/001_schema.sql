-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────
-- User profiles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  branch text DEFAULT 'CS',
  level text CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  target_rank int,
  exam_month date,
  daily_hours int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────
-- Concept tree (seeded once, never AI-generated)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  topic text NOT NULL,
  subtopic text NOT NULL,
  weightage_score float DEFAULT 5,
  difficulty_base int DEFAULT 3 CHECK (difficulty_base BETWEEN 1 AND 5),
  description text,
  exam_tips text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read concepts" ON concepts FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- AI-generated questions cache (shared across users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generated_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id uuid REFERENCES concepts ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb,
  answer text NOT NULL,
  solution text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('MCQ', 'NAT')),
  difficulty int NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  marks int NOT NULL CHECK (marks IN (1, 2)),
  reuse_count int DEFAULT 0,
  embedding vector(768),
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE generated_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read questions" ON generated_questions FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- User spaced repetition state (per concept)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_concept_state (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  concept_id uuid REFERENCES concepts ON DELETE CASCADE,
  ease_factor float DEFAULT 2.5,
  interval_days int DEFAULT 1,
  next_review date DEFAULT CURRENT_DATE,
  repetitions int DEFAULT 0,
  mastery_score float DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
  last_attempted timestamptz,
  PRIMARY KEY (user_id, concept_id)
);

ALTER TABLE user_concept_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own concept state" ON user_concept_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own concept state" ON user_concept_state FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- User question attempts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  question_id uuid REFERENCES generated_questions ON DELETE CASCADE,
  concept_id uuid REFERENCES concepts ON DELETE CASCADE,
  is_correct boolean NOT NULL,
  time_taken_sec int,
  selected_answer text,
  attempted_at timestamptz DEFAULT now()
);

ALTER TABLE user_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own attempts" ON user_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON user_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- RAG knowledge base
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rag_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text CHECK (source IN ('gfg', 'nptel', 'web')),
  subject text,
  topic text,
  content text NOT NULL,
  url text,
  embedding vector(768),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read rag documents" ON rag_documents FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- LLM semantic cache
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS llm_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text UNIQUE NOT NULL,
  prompt_embedding vector(768),
  response text NOT NULL,
  model_used text,
  tokens_used int,
  hit_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE llm_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage cache" ON llm_cache USING (true);

-- ─────────────────────────────────────────────
-- Async job queue tracking
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS llm_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  job_type text NOT NULL CHECK (job_type IN ('roadmap_gen', 'mock_debrief', 'concept_explain')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_payload jsonb,
  output_payload jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE llm_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own jobs" ON llm_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON llm_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- User roadmaps (cached per archetype)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype_hash text UNIQUE NOT NULL,
  roadmap_json jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  used_count int DEFAULT 0
);

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read roadmaps" ON roadmaps FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- Mock test sessions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mock_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  session_type text DEFAULT 'speed' CHECK (session_type IN ('full', 'subject', 'speed')),
  subject_filter text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  total_score float,
  max_score float,
  time_taken_sec int,
  subject_breakdown jsonb,
  predicted_rank int,
  debrief_json jsonb
);

ALTER TABLE mock_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own sessions" ON mock_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON mock_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON mock_sessions FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Subscriptions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'annual')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  razorpay_subscription_id text,
  current_period_end timestamptz
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_concepts_subject ON concepts (subject);
CREATE INDEX IF NOT EXISTS idx_generated_questions_concept ON generated_questions (concept_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_user_attempts_user ON user_attempts (user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_concept_state_review ON user_concept_state (user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_user ON mock_sessions (user_id, started_at DESC);
