-- Update foreign keys in community tables to point to public.profiles instead of auth.users
-- This is needed because the tables might have already been created with the old FKs

-- 1. shared_designs
ALTER TABLE public.shared_designs
  DROP CONSTRAINT IF EXISTS shared_designs_user_id_fkey;

ALTER TABLE public.shared_designs
  ADD CONSTRAINT shared_designs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. discussions
ALTER TABLE public.discussions
  DROP CONSTRAINT IF EXISTS discussions_user_id_fkey;

ALTER TABLE public.discussions
  ADD CONSTRAINT discussions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. discussion_replies
ALTER TABLE public.discussion_replies
  DROP CONSTRAINT IF EXISTS discussion_replies_user_id_fkey;

ALTER TABLE public.discussion_replies
  ADD CONSTRAINT discussion_replies_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. design_comments
ALTER TABLE public.design_comments
  DROP CONSTRAINT IF EXISTS design_comments_user_id_fkey;

ALTER TABLE public.design_comments
  ADD CONSTRAINT design_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. likes
ALTER TABLE public.likes
  DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

ALTER TABLE public.likes
  ADD CONSTRAINT likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Note: In PostgREST schemas, you often need to reload the schema cache
-- NOTIFY pgrst, 'reload schema' (often happens automatically in Supabase)
