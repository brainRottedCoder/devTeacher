-- Community Features Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Scores Table (for leaderboard)
CREATE TABLE IF NOT EXISTS user_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Badges Table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    criteria JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges (earned badges)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Shared Designs Table
CREATE TABLE IF NOT EXISTS shared_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    design_data JSONB NOT NULL DEFAULT '{}',
    preview_image TEXT,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Design Comments Table
CREATE TABLE IF NOT EXISTS design_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    design_id UUID NOT NULL REFERENCES shared_designs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES design_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussions Table
CREATE TABLE IF NOT EXISTS discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    replies_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_hot BOOLEAN DEFAULT FALSE,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion Replies Table
CREATE TABLE IF NOT EXISTS discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_accepted_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes Table (polymorphic)
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    likeable_type TEXT NOT NULL CHECK (likeable_type IN ('design', 'discussion', 'reply', 'comment')),
    likeable_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, likeable_type, likeable_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shared_designs_user_id ON shared_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_designs_created_at ON shared_designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_designs_likes_count ON shared_designs(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_shared_designs_is_featured ON shared_designs(is_featured);
CREATE INDEX IF NOT EXISTS idx_shared_designs_is_public ON shared_designs(is_public);

CREATE INDEX IF NOT EXISTS idx_design_comments_design_id ON design_comments(design_id);
CREATE INDEX IF NOT EXISTS idx_design_comments_user_id ON design_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON discussions(category);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_is_pinned ON discussions(is_pinned);
CREATE INDEX IF NOT EXISTS idx_discussions_is_hot ON discussions(is_hot);

CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_user_id ON discussion_replies(user_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_likeable ON likes(likeable_type, likeable_id);

CREATE INDEX IF NOT EXISTS idx_user_scores_score ON user_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_user_scores_streak ON user_scores(streak DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_shared_designs_updated_at
    BEFORE UPDATE ON shared_designs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_design_comments_updated_at
    BEFORE UPDATE ON design_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussions_updated_at
    BEFORE UPDATE ON discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_replies_updated_at
    BEFORE UPDATE ON discussion_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_design_views(design_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE shared_designs SET views_count = views_count + 1 WHERE id = design_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_discussion_views(discussion_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE discussions SET views_count = views_count + 1 WHERE id = discussion_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle like toggle
CREATE OR REPLACE FUNCTION toggle_like(
    p_user_id UUID,
    p_likeable_type TEXT,
    p_likeable_id UUID
)
RETURNS TABLE(liked BOOLEAN, count BIGINT) AS $$
DECLARE
    v_exists BOOLEAN;
    v_count_table TEXT;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM likes 
        WHERE user_id = p_user_id 
        AND likeable_type = p_likeable_type 
        AND likeable_id = p_likeable_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM likes 
        WHERE user_id = p_user_id 
        AND likeable_type = p_likeable_type 
        AND likeable_id = p_likeable_id;
        
        CASE p_likeable_type
            WHEN 'design' THEN UPDATE shared_designs SET likes_count = likes_count - 1 WHERE id = p_likeable_id;
            WHEN 'discussion' THEN UPDATE discussions SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_likeable_id;
            WHEN 'reply' THEN UPDATE discussion_replies SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_likeable_id;
            WHEN 'comment' THEN UPDATE design_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_likeable_id;
        END CASE;
        
        RETURN QUERY SELECT FALSE, get_like_count(p_likeable_type, p_likeable_id);
    ELSE
        INSERT INTO likes (user_id, likeable_type, likeable_id)
        VALUES (p_user_id, p_likeable_type, p_likeable_id);
        
        CASE p_likeable_type
            WHEN 'design' THEN UPDATE shared_designs SET likes_count = likes_count + 1 WHERE id = p_likeable_id;
            WHEN 'discussion' THEN UPDATE discussions SET likes_count = likes_count + 1 WHERE id = p_likeable_id;
            WHEN 'reply' THEN UPDATE discussion_replies SET likes_count = likes_count + 1 WHERE id = p_likeable_id;
            WHEN 'comment' THEN UPDATE design_comments SET likes_count = likes_count + 1 WHERE id = p_likeable_id;
        END CASE;
        
        RETURN QUERY SELECT TRUE, get_like_count(p_likeable_type, p_likeable_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_like_count(p_likeable_type TEXT, p_likeable_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM likes 
    WHERE likeable_type = p_likeable_type AND likeable_id = p_likeable_id;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default badges
INSERT INTO badges (name, description, icon, category, criteria) VALUES
    ('First Design', 'Share your first architecture design', '🏗️', 'design', '{"type": "designs_shared", "count": 1}'),
    ('Design Master', 'Share 10 architecture designs', ' Blueprint', 'design', '{"type": "designs_shared", "count": 10}'),
    ('Helpful Hand', 'Receive 10 likes on your designs', '👍', 'community', '{"type": "likes_received", "count": 10}'),
    ('Discussion Starter', 'Create your first discussion', '💬', 'community', '{"type": "discussions_created", "count": 1}'),
    ('Conversation Pro', 'Create 25 discussions', '🗣️', 'community', '{"type": "discussions_created", "count": 25}'),
    ('Top Contributor', 'Receive 50 likes across all content', '⭐', 'community', '{"type": "total_likes", "count": 50}'),
    ('Week Warrior', 'Maintain a 7-day streak', '🔥', 'streak', '{"type": "streak", "count": 7}'),
    ('Month Master', 'Maintain a 30-day streak', '💪', 'streak', '{"type": "streak", "count": 30}'),
    ('Century Club', 'Score 100 points', '💯', 'score', '{"type": "score", "count": 100}'),
    ('Rising Star', 'Score 1000 points', '🌟', 'score', '{"type": "score", "count": 1000}')
ON CONFLICT DO NOTHING;

-- Row Level Security Policies
ALTER TABLE shared_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Policies for shared_designs
CREATE POLICY "Public designs are viewable by everyone"
    ON shared_designs FOR SELECT
    USING (is_public = TRUE OR user_id = auth.uid());

CREATE POLICY "Users can create their own designs"
    ON shared_designs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs"
    ON shared_designs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designs"
    ON shared_designs FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for design_comments
CREATE POLICY "Comments are viewable by everyone"
    ON design_comments FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create comments"
    ON design_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON design_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON design_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for discussions
CREATE POLICY "Discussions are viewable by everyone"
    ON discussions FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create discussions"
    ON discussions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discussions"
    ON discussions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discussions"
    ON discussions FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for discussion_replies
CREATE POLICY "Replies are viewable by everyone"
    ON discussion_replies FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create replies"
    ON discussion_replies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies"
    ON discussion_replies FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
    ON discussion_replies FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for likes
CREATE POLICY "Likes are viewable by everyone"
    ON likes FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create likes"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for user_scores
CREATE POLICY "Scores are viewable by everyone"
    ON user_scores FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert their own scores"
    ON user_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
    ON user_scores FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies for badges
CREATE POLICY "Badges are viewable by everyone"
    ON badges FOR SELECT
    USING (TRUE);

-- Policies for user_badges
CREATE POLICY "User badges are viewable by everyone"
    ON user_badges FOR SELECT
    USING (TRUE);

CREATE POLICY "System can assign badges"
    ON user_badges FOR INSERT
    WITH CHECK (TRUE);
