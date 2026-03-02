-- Migration: 015_collaboration_comments_versions.sql
-- Real-time Design Collaboration Comments and Versions

-- Function to update updated_at timestamp (in case it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Collaboration Comments Table
CREATE TABLE IF NOT EXISTS collaboration_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    node_id VARCHAR(255),
    position JSONB,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration Comment Replies Table
CREATE TABLE IF NOT EXISTS collaboration_comment_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES collaboration_comments(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration Versions Table
CREATE TABLE IF NOT EXISTS collaboration_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    created_by VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_collab_comments_design_id ON collaboration_comments(design_id);
CREATE INDEX idx_collab_comment_replies_comment_id ON collaboration_comment_replies(comment_id);
CREATE INDEX idx_collab_versions_design_id ON collaboration_versions(design_id);

-- Enable RLS
ALTER TABLE collaboration_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_comments
CREATE POLICY "collaboration_comments_select" ON collaboration_comments
    FOR SELECT USING (true);

CREATE POLICY "collaboration_comments_insert" ON collaboration_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "collaboration_comments_update" ON collaboration_comments
    FOR UPDATE USING (true);

CREATE POLICY "collaboration_comments_delete" ON collaboration_comments
    FOR DELETE USING (true);

-- RLS Policies for collaboration_comment_replies
CREATE POLICY "collab_comment_replies_select" ON collaboration_comment_replies
    FOR SELECT USING (true);

CREATE POLICY "collab_comment_replies_insert" ON collaboration_comment_replies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "collab_comment_replies_update" ON collaboration_comment_replies
    FOR UPDATE USING (true);

CREATE POLICY "collab_comment_replies_delete" ON collaboration_comment_replies
    FOR DELETE USING (true);

-- RLS Policies for collaboration_versions
CREATE POLICY "collaboration_versions_select" ON collaboration_versions
    FOR SELECT USING (true);

CREATE POLICY "collaboration_versions_insert" ON collaboration_versions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "collaboration_versions_update" ON collaboration_versions
    FOR UPDATE USING (true);

CREATE POLICY "collaboration_versions_delete" ON collaboration_versions
    FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_collab_comments_updated_at
    BEFORE UPDATE ON collaboration_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collab_comment_replies_updated_at
    BEFORE UPDATE ON collaboration_comment_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
