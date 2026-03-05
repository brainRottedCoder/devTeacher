-- Gamification: XP, Levels, Streaks, Leaderboard
-- Adds experience points, leveling, server-side streaks, and opt-in leaderboard
-- Seeds XP from existing user activity (modules, quizzes, interviews, achievements)

-- ============================================================================
-- 1. Add gamification columns to profiles
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_date DATE,
  ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- ============================================================================
-- 2. Indexes for fast leaderboard queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard ON public.profiles(leaderboard_visible, xp DESC);

-- ============================================================================
-- 3. Set display_name from auth email (fallback) for all existing users
-- ============================================================================
UPDATE public.profiles p
SET display_name = COALESCE(
  p.display_name,
  split_part((SELECT email FROM auth.users WHERE id = p.id), '@', 1)
)
WHERE p.display_name IS NULL;

-- ============================================================================
-- 4. Compute initial XP from existing activity
--    XP formula:
--      +50  per completed module
--      +20  per quiz attempt (passed)
--      +10  per quiz attempt (failed, for trying)
--      +30  per interview session completed
--      +25  per achievement unlocked
--      +15  per learning path enrolled
-- ============================================================================

-- 4a. XP from module completions (user_progress)
UPDATE public.profiles p
SET xp = xp + COALESCE(progress_xp.total, 0)
FROM (
  SELECT user_id, 
         SUM(CASE 
           WHEN completed_at IS NOT NULL THEN 50
           ELSE 5  -- participation XP for in-progress modules
         END) AS total
  FROM public.user_progress
  GROUP BY user_id
) progress_xp
WHERE p.id = progress_xp.user_id;

-- 4b. XP from quiz attempts
UPDATE public.profiles p
SET xp = xp + COALESCE(quiz_xp.total, 0)
FROM (
  SELECT user_id,
         SUM(CASE 
           WHEN passed_at IS NOT NULL AND score >= 90 THEN 30   -- bonus for high scores
           WHEN passed_at IS NOT NULL THEN 20
           ELSE 10                                       -- participation XP
         END) AS total
  FROM public.quiz_attempts
  GROUP BY user_id
) quiz_xp
WHERE p.id = quiz_xp.user_id;

-- 4c. XP from interview sessions (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_sessions' AND table_schema = 'public') THEN
    EXECUTE '
      UPDATE public.profiles p
      SET xp = xp + COALESCE(interview_xp.total, 0)
      FROM (
        SELECT user_id,
               SUM(CASE 
                 WHEN score IS NOT NULL AND score >= 90 THEN 50
                 WHEN score IS NOT NULL AND score >= 70 THEN 30
                 ELSE 20
               END) AS total
        FROM public.interview_sessions
        WHERE status = ''completed''
        GROUP BY user_id
      ) interview_xp
      WHERE p.id = interview_xp.user_id
    ';
  END IF;
END $$;

-- 4d. XP from achievements
UPDATE public.profiles p
SET xp = xp + COALESCE(achievement_xp.total, 0)
FROM (
  SELECT user_id, COUNT(*) * 25 AS total
  FROM public.user_achievements
  GROUP BY user_id
) achievement_xp
WHERE p.id = achievement_xp.user_id;

-- 4e. XP from learning path enrollments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_learning_paths' AND table_schema = 'public') THEN
    EXECUTE '
      UPDATE public.profiles p
      SET xp = xp + COALESCE(path_xp.total, 0)
      FROM (
        SELECT user_id,
               SUM(CASE 
                 WHEN status = ''completed'' THEN 50
                 ELSE 15
               END) AS total
        FROM public.user_learning_paths
        GROUP BY user_id
      ) path_xp
      WHERE p.id = path_xp.user_id
    ';
  END IF;
END $$;

-- ============================================================================
-- 5. Compute level from XP  (every 100 XP = 1 level, min level 1)
-- ============================================================================
UPDATE public.profiles
SET level = GREATEST(1, 1 + (xp / 100))
WHERE xp > 0;

-- ============================================================================
-- 6. Make all existing users visible on the leaderboard by default
-- ============================================================================
UPDATE public.profiles
SET leaderboard_visible = true
WHERE leaderboard_visible IS NULL OR leaderboard_visible = false;

-- ============================================================================
-- 7. Seed additional achievements for gamification (from 007)
-- ============================================================================
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

-- ============================================================================
-- 8. RLS policies for leaderboard visibility
-- ============================================================================
-- Allow anyone to read leaderboard-visible profiles (for the leaderboard page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Leaderboard profiles are visible to all'
  ) THEN
    CREATE POLICY "Leaderboard profiles are visible to all" ON public.profiles
      FOR SELECT USING (leaderboard_visible = true);
  END IF;
END $$;

-- Allow users to update their own gamification fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own gamification data'
  ) THEN
    CREATE POLICY "Users can update their own gamification data" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;
