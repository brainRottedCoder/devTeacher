-- Interview Preparation Hub Schema
-- Phase 4a: Interview Preparation Hub

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    focus_areas TEXT[] DEFAULT '{}',
    difficulty_level TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interview questions table
CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('system_design', 'coding', 'behavioral')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    hints TEXT[],
    sample_answer JSONB,
    topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study plans table
CREATE TABLE IF NOT EXISTS study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_company_id UUID REFERENCES companies(id),
    duration_weeks INT DEFAULT 4,
    questions_per_day INT DEFAULT 3,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study plan items (daily questions)
CREATE TABLE IF NOT EXISTS study_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
    question_id UUID REFERENCES interview_questions(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    completed_at TIMESTAMPTZ,
    user_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User question attempts (for tracking progress)
CREATE TABLE IF NOT EXISTS question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES interview_questions(id) ON DELETE CASCADE,
    attempt_number INT DEFAULT 1,
    user_answer TEXT,
    time_spent_seconds INT,
    was_correct BOOLEAN,
    feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interview_questions_company ON interview_questions(company_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_type ON interview_questions(type);
CREATE INDEX IF NOT EXISTS idx_interview_questions_difficulty ON interview_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_interview_questions_topics ON interview_questions USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_items_plan ON study_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON question_attempts(user_id);

-- Seed some initial companies
INSERT INTO companies (name, slug, logo_url, description, focus_areas, difficulty_level) VALUES
    ('Meta', 'meta', 'https://logo.clearbit.com/meta.com', 'FAANG company focusing on social media and VR', ARRAY['system_design', 'coding', 'behavioral'], 'hard'),
    ('Amazon', 'amazon', 'https://logo.clearbit.com/amazon.com', 'E-commerce and cloud computing giant', ARRAY['system_design', 'coding', 'leadership'], 'medium'),
    ('Apple', 'apple', 'https://logo.clearbit.com/apple.com', 'Consumer electronics and software company', ARRAY['system_design', 'coding', 'privacy'], 'hard'),
    ('Netflix', 'netflix', 'https://logo.clearbit.com/netflix.com', 'Streaming and content delivery', ARRAY['system_design', 'coding', 'culture'], 'medium'),
    ('Google', 'google', 'https://logo.clearbit.com/google.com', 'Search, cloud, and AI company', ARRAY['system_design', 'coding', 'behavioral'], 'hard'),
    ('Microsoft', 'microsoft', 'https://logo.clearbit.com/microsoft.com', 'Software and cloud services', ARRAY['system_design', 'coding', 'growth'], 'medium'),
    ('Stripe', 'stripe', 'https://logo.clearbit.com/stripe.com', 'Payment processing', ARRAY['system_design', 'coding', 'ownership'], 'medium'),
    ('Airbnb', 'airbnb', 'https://logo.clearbit.com/airbnb.com', 'Travel and hospitality platform', ARRAY['system_design', 'coding', 'customer_obsession'], 'medium')
ON CONFLICT (slug) DO NOTHING;

-- Seed some sample interview questions
INSERT INTO interview_questions (company_id, type, difficulty, title, content, hints, topics) 
SELECT 
    c.id,
    'system_design',
    'medium',
    'Design a URL Shortener',
    'Design a URL shortening service like bit.ly. Users should be able to input a long URL and get a shorter URL. The service should handle millions of users.',
    ARRAY['Consider the data model', 'Think about cache layer', 'Handle high traffic'],
    ARRAY['databases', 'caching', 'scalability', 'api_design']
FROM companies c WHERE c.slug = 'meta'

UNION ALL

SELECT c.id, 'system_design', 'hard', 'Design YouTube/Netflix', 
    'Design a video streaming service that can handle millions of users watching videos simultaneously. Consider video encoding, CDN, recommendation system.',
    ARRAY['Video processing pipeline', 'CDN strategy', 'Recommendation engine'],
    ARRAY['video_processing', 'cdn', 'microservices', 'storage']
FROM companies c WHERE c.slug = 'netflix'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Design a LRU Cache',
    'Implement an LRU (Least Recently Used) cache with O(1) time complexity for both get and put operations.',
    ARRAY['Use hash map and doubly linked list', 'Think about eviction policy'],
    ARRAY['data_structures', 'hash_tables', 'linked_lists', 'design']
FROM companies c WHERE c.slug = 'amazon'

UNION ALL

SELECT c.id, 'coding', 'hard', 'Merge K Sorted Lists',
    'Given an array of k sorted linked lists, merge them into one sorted linked list.',
    ARRAY['Priority queue approach', 'Divide and conquer'],
    ARRAY['algorithms', 'heap', 'linked_lists', 'divide_conquer']
FROM companies c WHERE c.slug = 'google'

UNION ALL

SELECT c.id, 'behavioral', 'easy', 'Tell Me About Yourself',
    'Walk me through your background and why you''re a good fit for this role.',
    ARRAY['Use STAR method', 'Focus on relevant experience', 'Show passion'],
    ARRAY['communication', 'storytelling', 'self_awareness']
FROM companies c WHERE c.slug = 'apple'

UNION ALL

SELECT c.id, 'system_design', 'medium', 'Design Twitter/X',
    'Design a social media platform like Twitter. Users can post tweets, follow others, and see a timeline.',
    ARRAY['Tweet storage', 'Timeline generation', 'Fan-out strategy'],
    ARRAY['databases', 'caching', 'real_time', 'social']
FROM companies c WHERE c.slug = 'twitter'

UNION ALL

SELECT c.id, 'coding', 'medium', 'Two Sum',
    'Given an array of integers and a target sum, return indices of two numbers that add up to the target.',
    ARRAY['Hash map solution', 'One-pass approach'],
    ARRAY['arrays', 'hash_tables', 'basic']
FROM companies c WHERE c.slug = 'meta'

UNION ALL

SELECT c.id, 'behavioral', 'medium', 'Tell Me About a Time You Failed',
    'Describe a situation where you failed. What did you learn from it?',
    ARRAY['Be honest about failure', 'Show learning', 'Demonstrate growth'],
    ARRAY['self_awareness', 'learning', 'growth_mindset']
FROM companies c WHERE c.slug = 'stripe';
