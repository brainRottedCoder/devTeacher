-- Community tables migration
-- Creates tables for shared designs, discussions, comments, and likes

-- Create shared_designs table
CREATE TABLE IF NOT EXISTS public.shared_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    design_data JSONB NOT NULL,
    preview_image TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create discussions table
CREATE TABLE IF NOT EXISTS public.discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    replies_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_hot BOOLEAN DEFAULT false,
    last_reply_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create discussion_replies table
CREATE TABLE IF NOT EXISTS public.discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_accepted_answer BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create design_comments table
CREATE TABLE IF NOT EXISTS public.design_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID REFERENCES public.shared_designs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.design_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    likeable_type TEXT NOT NULL CHECK (likeable_type IN ('design', 'discussion', 'reply', 'comment')),
    likeable_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, likeable_type, likeable_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_designs_user_id ON public.shared_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_designs_created_at ON public.shared_designs(created_at);
CREATE INDEX IF NOT EXISTS idx_shared_designs_is_public ON public.shared_designs(is_public);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON public.discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON public.discussions(category);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON public.discussions(created_at);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON public.discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_user_id ON public.discussion_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_design_comments_design_id ON public.design_comments(design_id);
CREATE INDEX IF NOT EXISTS idx_design_comments_user_id ON public.design_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_likeable ON public.likes(likeable_type, likeable_id);

-- Enable Row Level Security
ALTER TABLE public.shared_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_designs
DROP POLICY IF EXISTS "Anyone can view public designs" ON public.shared_designs;
CREATE POLICY "Anyone can view public designs" ON public.shared_designs
    FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert own designs" ON public.shared_designs;
CREATE POLICY "Users can insert own designs" ON public.shared_designs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own designs" ON public.shared_designs;
CREATE POLICY "Users can update own designs" ON public.shared_designs
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own designs" ON public.shared_designs;
CREATE POLICY "Users can delete own designs" ON public.shared_designs
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for discussions
DROP POLICY IF EXISTS "Anyone can view discussions" ON public.discussions;
CREATE POLICY "Anyone can view discussions" ON public.discussions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert discussions" ON public.discussions;
CREATE POLICY "Users can insert discussions" ON public.discussions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own discussions" ON public.discussions;
CREATE POLICY "Users can update own discussions" ON public.discussions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own discussions" ON public.discussions;
CREATE POLICY "Users can delete own discussions" ON public.discussions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for discussion_replies
DROP POLICY IF EXISTS "Anyone can view replies" ON public.discussion_replies;
CREATE POLICY "Anyone can view replies" ON public.discussion_replies
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert replies" ON public.discussion_replies;
CREATE POLICY "Users can insert replies" ON public.discussion_replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own replies" ON public.discussion_replies;
CREATE POLICY "Users can update own replies" ON public.discussion_replies
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own replies" ON public.discussion_replies;
CREATE POLICY "Users can delete own replies" ON public.discussion_replies
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for design_comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.design_comments;
CREATE POLICY "Anyone can view comments" ON public.design_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert comments" ON public.design_comments;
CREATE POLICY "Users can insert comments" ON public.design_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.design_comments;
CREATE POLICY "Users can update own comments" ON public.design_comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.design_comments;
CREATE POLICY "Users can delete own comments" ON public.design_comments
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for likes
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
CREATE POLICY "Anyone can view likes" ON public.likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert likes" ON public.likes;
CREATE POLICY "Users can insert likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
CREATE POLICY "Users can delete own likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- Create helper function to increment design views
CREATE OR REPLACE FUNCTION increment_design_views(design_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.shared_designs 
    SET views_count = views_count + 1 
    WHERE id = design_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to increment discussion views
CREATE OR REPLACE FUNCTION increment_discussion_views(discussion_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.discussions 
    SET views_count = views_count + 1 
    WHERE id = discussion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to toggle like
CREATE OR REPLACE FUNCTION toggle_like(
    p_user_id UUID,
    p_likeable_type TEXT,
    p_likeable_id UUID
)
RETURNS JSONB AS $$
DECLARE
    existing_like_id UUID;
    liked BOOLEAN;
    new_count INTEGER;
BEGIN
    -- Check if like already exists
    SELECT id INTO existing_like_id
    FROM public.likes
    WHERE user_id = p_user_id 
      AND likeable_type = p_likeable_type 
      AND likeable_id = p_likeable_id;

    IF existing_like_id IS NOT NULL THEN
        -- Unlike: delete the existing like
        DELETE FROM public.likes WHERE id = existing_like_id;
        liked := false;
        
        -- Get the new count
        SELECT COUNT(*) INTO new_count
        FROM public.likes
        WHERE likeable_type = p_likeable_type AND likeable_id = p_likeable_id;
    ELSE
        -- Like: insert new like
        INSERT INTO public.likes (user_id, likeable_type, likeable_id)
        VALUES (p_user_id, p_likeable_type, p_likeable_id);
        liked := true;
        
        -- Get the new count
        SELECT COUNT(*) INTO new_count
        FROM public.likes
        WHERE likeable_type = p_likeable_type AND likeable_id = p_likeable_id;
    END IF;

    RETURN jsonb_build_object('liked', liked, 'count', new_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
