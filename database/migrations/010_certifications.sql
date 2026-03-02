-- Migration: 010_certifications.sql
-- Description: Creates tables for tracking certifications and exam attempts

-- Certifications Table (Catalog of available certs)
CREATE TABLE IF NOT EXISTS public.certifications (
    id TEXT PRIMARY KEY, -- e.g., 'k8s-admin-01'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    passing_score INTEGER NOT NULL DEFAULT 80, -- out of 100
    time_limit_minutes INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial certifications
INSERT INTO public.certifications (id, title, description, difficulty, passing_score, time_limit_minutes) VALUES
('k8s-fundamentals', 'Kubernetes Fundamentals', 'Demonstrate core understanding of Pods, Deployments, and Services.', 'Beginner', 80, 45),
('docker-expert', 'Docker Container Expert', 'Advanced containerization, multi-stage builds, and orchestration.', 'Intermediate', 80, 60),
('system-design-pro', 'System Design Professional', 'Architecting scalable, resilient, and highly available systems.', 'Advanced', 85, 90)
ON CONFLICT (id) DO NOTHING;

-- Certification Attempts (Tracks every time a user takes an exam)
CREATE TABLE IF NOT EXISTS public.certification_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cert_id TEXT NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
    score INTEGER, -- Null until completed
    passed BOOLEAN, -- Null until completed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User Certifications (The actual earned certificates)
CREATE TABLE IF NOT EXISTS public.user_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cert_id TEXT NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES public.certification_attempts(id),
    verification_hash TEXT NOT NULL UNIQUE, -- Unique hash for public verification URLs
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional
    UNIQUE(user_id, cert_id) -- User can only hold one active instance of a specific cert type
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;

-- Certifications Catalog: Anyone can read
CREATE POLICY "Anyone can read certifications catalog"
    ON public.certifications FOR SELECT
    USING (true);

-- Certification Attempts: Users can read their own, backend can insert/update
CREATE POLICY "Users can view their own attempts"
    ON public.certification_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can start an attempt"
    ON public.certification_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts (to finish)"
    ON public.certification_attempts FOR UPDATE
    USING (auth.uid() = user_id);

-- User Certifications: Users can read their own
CREATE POLICY "Users can view their own certifications"
    ON public.user_certifications FOR SELECT
    USING (auth.uid() = user_id);

-- System needs to insert User Certifications (we will rely on service role key for insertion in the API)
-- But we also need a policy for anyone to verify a hash
CREATE POLICY "Anyone can verify a certification by hash"
    ON public.user_certifications FOR SELECT
    USING (true); -- We will filter by hash in the application logic
