-- Companies and Interview Sessions Schema
-- For AI Mock Interviewer

-- First create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  industry TEXT,
  founded_year INTEGER,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some default companies
INSERT INTO companies (name, slug, industry, size) VALUES
  ('Meta', 'meta', 'Technology', '10000+'),
  ('Amazon', 'amazon', 'E-commerce', '10000+'),
  ('Apple', 'apple', 'Technology', '10000+'),
  ('Netflix', 'netflix', 'Entertainment', '1000-5000'),
  ('Google', 'google', 'Technology', '10000+'),
  ('Microsoft', 'microsoft', 'Technology', '10000+'),
  ('Stripe', 'stripe', 'Fintech', '1000-5000'),
  ('Airbnb', 'airbnb', 'Travel', '5000-10000'),
  ('Uber', 'uber', 'Transportation', '10000+'),
  ('DoorDash', 'doordash', 'Food Delivery', '5000-10000')
ON CONFLICT (slug) DO NOTHING;

-- Table for interview sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  company_id UUID REFERENCES companies(id),
  interview_type TEXT NOT NULL, -- 'system_design', 'coding', 'behavioral'
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  questions_asked JSONB DEFAULT '[]',
  user_responses JSONB DEFAULT '[]',
  feedback JSONB,
  score INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for interview transcripts
CREATE TABLE IF NOT EXISTS interview_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id) NOT NULL,
  question TEXT NOT NULL,
  response TEXT,
  follow_up_questions JSONB DEFAULT '[]',
  feedback TEXT,
  score INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_transcripts ENABLE ROW LEVEL SECURITY;

-- Policies for companies (public read)
CREATE POLICY "Anyone can view companies"
  ON companies
  FOR SELECT
  USING (true);

-- Policies for interview sessions
CREATE POLICY "Users can view their own sessions"
  ON interview_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON interview_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON interview_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON interview_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for interview transcripts
CREATE POLICY "Users can view their own transcripts"
  ON interview_transcripts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = interview_transcripts.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transcripts for their sessions"
  ON interview_transcripts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = interview_transcripts.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_company_id ON interview_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_interview_transcripts_session_id ON interview_transcripts(session_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_interview_sessions_updated_at ON interview_sessions;
CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
