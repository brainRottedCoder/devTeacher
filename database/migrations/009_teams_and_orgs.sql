-- Migration: 009_teams_and_orgs.sql
-- Description: Creates tables and RLS policies for Team Management and B2B features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Team Members Table
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role team_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(team_id, user_id)
);

-- Team Invitations Table
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    role team_role NOT NULL DEFAULT 'member',
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(team_id, email, status)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_modtime
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Team Policies
CREATE POLICY "Users can view teams they are members of"
    ON public.teams FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members 
            WHERE team_id = teams.id AND user_id = auth.uid()
        )
        OR owner_id = auth.uid()
    );

CREATE POLICY "Users can create teams"
    ON public.teams FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team admins and owners can update team"
    ON public.teams FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members 
            WHERE team_id = teams.id AND user_id = auth.uid() AND role IN ('owner', 'admin')
        )
        OR owner_id = auth.uid()
    );

CREATE POLICY "Only owners can delete team"
    ON public.teams FOR DELETE
    USING (owner_id = auth.uid());

-- Team Members Policies
CREATE POLICY "Users can view members of their teams"
    ON public.team_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm 
            WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins/owners can manage team members"
    ON public.team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm 
            WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Users should be able to insert themselves when creating a team (via trigger or backend logic)
CREATE POLICY "Users can insert themselves into a team they own"
    ON public.team_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE id = team_id AND owner_id = auth.uid()
        )
    );

-- Team Invitations Policies
CREATE POLICY "Admins/owners can manage invitations"
    ON public.team_invitations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm 
            WHERE tm.team_id = team_invitations.team_id AND tm.user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Allow anyone to read an invitation if they have the token (for validation)
CREATE POLICY "Anyone can read pending invitations"
    ON public.team_invitations FOR SELECT
    USING (status = 'pending');
