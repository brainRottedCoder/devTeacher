-- pgvector extension and content embeddings
-- Enables vector similarity search for RAG pipeline

-- Enable pgvector extension (requires Supabase to have it enabled in dashboard)
CREATE EXTENSION IF NOT EXISTS vector;

-- Content embeddings table for RAG vector search
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-ada-002 dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;

-- Content embeddings are readable by all authenticated users
CREATE POLICY "Authenticated users can read embeddings" ON content_embeddings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Index for faster vector similarity search
CREATE INDEX idx_content_embeddings_embedding ON content_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Match documents function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.content,
    ce.metadata,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM content_embeddings ce
  WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
