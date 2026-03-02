-- Chat Messages & Achievements Schema
-- For Chat Persistence, Gamification, and Learning Paths

-- Table for persisting chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL CHECK (category IN ('learning', 'streak', 'quiz', 'interview', 'design', 'community')),
  criteria JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for user achievements (junction)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  achievement_id UUID REFERENCES achievements(id) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Table for learning path definitions
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('backend', 'frontend', 'fullstack', 'devops', 'sre')),
  level TEXT NOT NULL CHECK (level IN ('junior', 'mid', 'senior', 'staff', 'principal')),
  module_ids UUID[] DEFAULT '{}',
  estimated_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for user learning path enrollments
CREATE TABLE IF NOT EXISTS user_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  path_id UUID REFERENCES learning_paths(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, path_id)
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_paths ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can view their own messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies (readable by all, only system can insert)
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can earn achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning paths policies (readable by all)
CREATE POLICY "Anyone can view learning paths" ON learning_paths FOR SELECT USING (true);

-- User learning paths policies
CREATE POLICY "Users can view their own paths" ON user_learning_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll in paths" ON user_learning_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own paths" ON user_learning_paths FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_learning_paths_user_id ON user_learning_paths(user_id);

-- Seed default achievements
INSERT INTO achievements (name, description, icon, category, criteria) VALUES
  ('First Steps', 'Complete your first lesson', '👶', 'learning', '{"type": "lessons_completed", "count": 1}'),
  ('Module Master', 'Complete 5 modules', '📚', 'learning', '{"type": "modules_completed", "count": 5}'),
  ('Bookworm', 'Complete 10 lessons', '🐛', 'learning', '{"type": "lessons_completed", "count": 10}'),
  ('On Fire', 'Maintain a 3-day streak', '🔥', 'streak', '{"type": "streak_days", "count": 3}'),
  ('Unstoppable', 'Maintain a 7-day streak', '⚡', 'streak', '{"type": "streak_days", "count": 7}'),
  ('Month Warrior', 'Maintain a 30-day streak', '🏆', 'streak', '{"type": "streak_days", "count": 30}'),
  ('Quiz Whiz', 'Pass your first quiz', '🎯', 'quiz', '{"type": "quizzes_passed", "count": 1}'),
  ('Perfect Score', 'Get 100% on a quiz', '💯', 'quiz', '{"type": "perfect_quiz", "count": 1}'),
  ('Interview Ready', 'Complete your first mock interview', '🎤', 'interview', '{"type": "interviews_completed", "count": 1}'),
  ('Interview Pro', 'Score 80+ on a mock interview', '⭐', 'interview', '{"type": "interview_score", "min_score": 80}'),
  ('Architect', 'Create your first architecture design', '🏗️', 'design', '{"type": "designs_created", "count": 1}'),
  ('System Designer', 'Create 5 architecture designs', '🌐', 'design', '{"type": "designs_created", "count": 5}')
ON CONFLICT (name) DO NOTHING;

-- Seed default learning paths
INSERT INTO learning_paths (name, description, role, level, estimated_hours) VALUES
  ('Backend Fundamentals', 'Master backend development from databases to APIs', 'backend', 'junior', 40),
  ('Frontend Mastery', 'Build modern, responsive web applications', 'frontend', 'junior', 35),
  ('Full-Stack Journey', 'Become a well-rounded full-stack developer', 'fullstack', 'mid', 60),
  ('DevOps Engineer Path', 'Learn CI/CD, containers, and infrastructure', 'devops', 'mid', 50),
  ('Site Reliability Engineer', 'Master monitoring, scaling, and incident response', 'sre', 'senior', 55),
  ('Senior Backend', 'Advanced system design and distributed systems', 'backend', 'senior', 45),
  ('Staff Engineer Path', 'Architecture, leadership, and cross-team impact', 'fullstack', 'staff', 70);
