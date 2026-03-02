-- Create user token usage table
CREATE TABLE public.user_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_user_token_usage_user_id ON public.user_token_usage(user_id);
CREATE INDEX idx_user_token_usage_created_at ON public.user_token_usage(created_at);

-- Set up RLS policies
ALTER TABLE public.user_token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token usage" 
ON public.user_token_usage FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token usage" 
ON public.user_token_usage FOR INSERT 
WITH CHECK (auth.uid() = user_id);
