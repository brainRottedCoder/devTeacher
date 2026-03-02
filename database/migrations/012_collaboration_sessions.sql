-- Migration: 012_collaboration_sessions.sql
-- Real-time Design Collaboration Tables

-- Collaboration sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id VARCHAR(255) NOT NULL,
    owner_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration participants table
CREATE TABLE IF NOT EXISTS collaboration_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_color VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    cursor_position JSONB DEFAULT null,
    selected_nodes JSONB DEFAULT null,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_collaboration_sessions_design_id ON collaboration_sessions(design_id);
CREATE INDEX idx_collaboration_sessions_status ON collaboration_sessions(status);
CREATE INDEX idx_collaboration_participants_session_id ON collaboration_participants(session_id);
CREATE INDEX idx_collaboration_participants_user_id ON collaboration_participants(user_id);

-- Enable RLS
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_sessions
CREATE POLICY "collaboration_sessions_select" ON collaboration_sessions
    FOR SELECT USING (true);

CREATE POLICY "collaboration_sessions_insert" ON collaboration_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "collaboration_sessions_update" ON collaboration_sessions
    FOR UPDATE USING (true);

CREATE POLICY "collaboration_sessions_delete" ON collaboration_sessions
    FOR DELETE USING (true);

-- RLS Policies for collaboration_participants
CREATE POLICY "collaboration_participants_select" ON collaboration_participants
    FOR SELECT USING (true);

CREATE POLICY "collaboration_participants_insert" ON collaboration_participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "collaboration_participants_update" ON collaboration_participants
    FOR UPDATE USING (true);

CREATE POLICY "collaboration_participants_delete" ON collaboration_participants
    FOR DELETE USING (true);
