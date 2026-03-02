-- Migration: 014_learning_paths_enhancement.sql
-- Enhanced Learning Paths with Items, Custom Paths, and Recommendations

-- Path items table (modules, labs, quizzes in a learning path)
CREATE TABLE IF NOT EXISTS learning_path_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('module', 'lab', 'quiz', 'project', 'assessment')),
    item_id UUID NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    estimated_minutes INTEGER DEFAULT 60,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom paths table (paths created by users)
CREATE TABLE IF NOT EXISTS custom_learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    target_role TEXT,
    target_level TEXT,
    estimated_hours INTEGER DEFAULT 0,
    prerequisites TEXT[] DEFAULT '{}',
    outcomes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom path items table
CREATE TABLE IF NOT EXISTS custom_path_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID REFERENCES custom_learning_paths(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('module', 'lab', 'quiz', 'project', 'assessment')),
    item_id UUID NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    estimated_minutes INTEGER DEFAULT 60,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User custom path enrollments
CREATE TABLE IF NOT EXISTS user_custom_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    path_id UUID REFERENCES custom_learning_paths(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
    current_item_index INTEGER DEFAULT 0,
    total_progress INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, path_id)
);

-- Path recommendations table (AI-generated personalized recommendations)
CREATE TABLE IF NOT EXISTS path_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    custom_path_id UUID REFERENCES custom_learning_paths(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) DEFAULT 0,
    reason TEXT,
    missing_skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Enable RLS
ALTER TABLE learning_path_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_path_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_path_items
CREATE POLICY "Anyone can view path items" ON learning_path_items FOR SELECT USING (true);
CREATE POLICY "Admin can insert path items" ON learning_path_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update path items" ON learning_path_items FOR UPDATE USING (true);
CREATE POLICY "Admin can delete path items" ON learning_path_items FOR DELETE USING (true);

-- RLS Policies for custom_learning_paths
CREATE POLICY "Anyone can view public custom paths" ON custom_learning_paths FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create custom paths" ON custom_learning_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own paths" ON custom_learning_paths FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own paths" ON custom_learning_paths FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for custom_path_items
CREATE POLICY "Anyone can view custom path items" ON custom_path_items FOR SELECT USING (true);
CREATE POLICY "Users can insert path items" ON custom_path_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update path items" ON custom_path_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete path items" ON custom_path_items FOR DELETE USING (true);

-- RLS Policies for user_custom_paths
CREATE POLICY "Users can view their custom path progress" ON user_custom_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll in custom paths" ON user_custom_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their progress" ON user_custom_paths FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their enrollment" ON user_custom_paths FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for path_recommendations
CREATE POLICY "Users can view their recommendations" ON path_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert recommendations" ON path_recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their recommendations" ON path_recommendations FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_learning_path_items_path ON learning_path_items(path_id);
CREATE INDEX idx_custom_learning_paths_user ON custom_learning_paths(user_id);
CREATE INDEX idx_custom_path_items_path ON custom_path_items(path_id);
CREATE INDEX idx_user_custom_paths_user ON user_custom_paths(user_id);
CREATE INDEX idx_path_recommendations_user ON path_recommendations(user_id);

-- Seed default learning path items for existing templates
-- First add is_template column if not exists
ALTER TABLE learning_paths ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Note: These reference modules, labs, quizzes that should exist in the database
INSERT INTO learning_path_items (path_id, item_type, item_id, order_index, is_required, estimated_minutes)
SELECT 
    lp.id,
    'module',
    (SELECT id FROM modules LIMIT 1),
    1,
    true,
    90
FROM learning_paths lp
WHERE lp.id = (SELECT id FROM learning_paths WHERE name = 'Backend Fundamentals' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO learning_path_items (path_id, item_type, item_id, order_index, is_required, estimated_minutes)
SELECT 
    lp.id,
    'lab',
    (SELECT id FROM modules LIMIT 1),
    2,
    true,
    120
FROM learning_paths lp
WHERE lp.id = (SELECT id FROM learning_paths WHERE name = 'Backend Fundamentals' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO learning_path_items (path_id, item_type, item_id, order_index, is_required, estimated_minutes)
SELECT 
    lp.id,
    'quiz',
    (SELECT id FROM modules LIMIT 1),
    3,
    true,
    30
FROM learning_paths lp
WHERE lp.id = (SELECT id FROM learning_paths WHERE name = 'Backend Fundamentals' LIMIT 1)
ON CONFLICT DO NOTHING;

-- Mark existing learning_paths as templates
UPDATE learning_paths SET is_template = true WHERE is_template IS NULL OR is_template = false;
