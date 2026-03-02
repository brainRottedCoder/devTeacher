-- Gamification: XP, Levels, Streaks, Leaderboard
-- Adds experience points, leveling, server-side streaks, and opt-in leaderboard

-- 1. Extend profiles table with gamification columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_date DATE,
  ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_xp ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_leaderboard ON public.profiles(leaderboard_visible, xp DESC);

-- 3. Seed 20+ new achievements
INSERT INTO achievements (name, description, icon, category, criteria) VALUES
  -- Streak achievements
  ('14-Day Legend',      'Maintain a 14-day learning streak',        '🌟', 'streak',     '{"type": "streak_days", "count": 14}'),
  ('100-Day Diamond',    'Maintain a 100-day learning streak',       '💎', 'streak',     '{"type": "streak_days", "count": 100}'),
  -- Code achievements
  ('Hello World',        'Run your first code in the playground',    '🖥️', 'learning',   '{"type": "code_runs", "count": 1}'),
  ('Code Marathoner',    'Execute 50 code runs in the playground',   '🔁', 'learning',   '{"type": "code_runs", "count": 50}'),
  -- Quiz achievements
  ('Quiz Champion',      'Pass 10 quizzes',                          '🎖️', 'quiz',       '{"type": "quizzes_passed", "count": 10}'),
  ('Speed Runner',       'Pass 3 quizzes with perfect scores',       '⚡', 'quiz',       '{"type": "perfect_quiz", "count": 3}'),
  -- Interview achievements
  ('Persistent',         'Complete 5 mock interviews',               '🔄', 'interview',  '{"type": "interviews_completed", "count": 5}'),
  ('Interview Ace',      'Score 95+ on a mock interview',            '🏅', 'interview',  '{"type": "interview_score", "min_score": 95}'),
  ('Interview Legend',   'Complete 10 mock interviews',              '👑', 'interview',  '{"type": "interviews_completed", "count": 10}'),
  -- Learning achievements
  ('Graduate',           'Complete all available learning modules',  '🎓', 'learning',   '{"type": "modules_completed", "count": 10}'),
  ('Deep Reader',        'Complete 25 lessons',                      '📖', 'learning',   '{"type": "lessons_completed", "count": 25}'),
  ('Knowledge Seeker',   'Complete 50 lessons',                      '🔭', 'learning',   '{"type": "lessons_completed", "count": 50}'),
  -- Design achievements
  ('Creative Architect', 'Save 3 architecture designs',              '🎨', 'design',     '{"type": "designs_created", "count": 3}'),
  ('Design Guru',        'Save 10 architecture designs',             '🌐', 'design',     '{"type": "designs_created", "count": 10}'),
  -- Simulation achievements
  ('Traffic Controller', 'Run your first scalability simulation',    '⚙️', 'design',     '{"type": "simulations_run", "count": 1}'),
  ('Scale Master',       'Run 10 scalability simulations',           '📈', 'design',     '{"type": "simulations_run", "count": 10}'),
  -- Community achievements
  ('Rising Star',        'Reach the top 50 on the leaderboard',     '⭐', 'community',  '{"type": "leaderboard_rank", "max_rank": 50}'),
  ('Top 10',             'Reach the top 10 on the leaderboard',     '🏆', 'community',  '{"type": "leaderboard_rank", "max_rank": 10}'),
  ('XP Hunter',          'Earn 500 XP',                             '⚡', 'learning',   '{"type": "xp_earned", "count": 500}'),
  ('XP Legend',          'Earn 2000 XP',                            '💰', 'learning',   '{"type": "xp_earned", "count": 2000}')
ON CONFLICT (name) DO NOTHING;
