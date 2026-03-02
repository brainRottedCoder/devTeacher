-- Migration: 013_knowledge_graph.sql
-- Knowledge Graph & Learning Path Progress Tables

-- Knowledge mastery tracking table
CREATE TABLE IF NOT EXISTS knowledge_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    path_id VARCHAR(100) NOT NULL,
    node_id VARCHAR(100) NOT NULL,
    mastery_score INTEGER DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
    time_spent_minutes INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, path_id, node_id)
);

-- Create user_learning_paths table if it doesn't exist (may already exist from migration 004)
CREATE TABLE IF NOT EXISTS user_learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    path_id UUID NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    progress JSONB DEFAULT '{}',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User learning paths table - add columns if not exist
ALTER TABLE user_learning_paths ADD COLUMN IF NOT EXISTS path_id VARCHAR(100);
ALTER TABLE user_learning_paths ADD COLUMN IF NOT EXISTS current_node_id VARCHAR(100);
ALTER TABLE user_learning_paths ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_mastery_user_path ON knowledge_mastery(user_id, path_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_mastery_user ON knowledge_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_mastery_path ON knowledge_mastery(path_id);

-- Enable RLS
ALTER TABLE knowledge_mastery ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_mastery
DROP POLICY IF EXISTS "knowledge_mastery_select" ON knowledge_mastery;
DROP POLICY IF EXISTS "knowledge_mastery_insert" ON knowledge_mastery;
DROP POLICY IF EXISTS "knowledge_mastery_update" ON knowledge_mastery;
DROP POLICY IF EXISTS "knowledge_mastery_delete" ON knowledge_mastery;

CREATE POLICY "knowledge_mastery_select" ON knowledge_mastery
    FOR SELECT USING (true);

CREATE POLICY "knowledge_mastery_insert" ON knowledge_mastery
    FOR INSERT WITH CHECK (true);

CREATE POLICY "knowledge_mastery_update" ON knowledge_mastery
    FOR UPDATE USING (true);

CREATE POLICY "knowledge_mastery_delete" ON knowledge_mastery
    FOR DELETE USING (true);
