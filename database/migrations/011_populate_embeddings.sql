-- Populate content_embeddings table from existing lessons
-- This enables proper vector-based RAG for the AI Learning Assistant

-- First, check if we have lessons to process
DO $$
DECLARE
    lesson_record RECORD;
    content_text TEXT;
    metadata_json JSONB;
BEGIN
    -- Only proceed if content_embeddings is empty
    IF (SELECT COUNT(*) FROM content_embeddings) = 0 THEN
        -- Insert embeddings from lessons
        FOR lesson_record IN 
            SELECT l.id, l.title, l.content, l.module_id, m.title as module_title
            FROM lessons l
            JOIN modules m ON l.module_id = m.id
            WHERE l.content IS NOT NULL AND LENGTH(l.content) > 50
        LOOP
            content_text := lesson_record.title || '. ' || 
                           COALESCE(lesson_record.content, '');
            
            metadata_json := jsonb_build_object(
                'module_id', lesson_record.module_id,
                'lesson_id', lesson_record.id,
                'lesson_title', lesson_record.title,
                'module_title', lesson_record.module_title,
                'type', 'lesson'
            );
            
            -- Insert placeholder - embedding will be generated when needed
            INSERT INTO content_embeddings (content, metadata)
            VALUES (content_text, metadata_json);
        END LOOP;
        
        -- Also add content from modules
        FOR lesson_record IN 
            SELECT id, title, description, NULL as content
            FROM modules
            WHERE description IS NOT NULL AND LENGTH(description) > 50
        LOOP
            metadata_json := jsonb_build_object(
                'module_id', lesson_record.id,
                'module_title', lesson_record.title,
                'type', 'module'
            );
            
            INSERT INTO content_embeddings (content, metadata)
            VALUES (lesson_record.title || '. ' || COALESCE(lesson_record.description, ''), metadata_json);
        END LOOP;
        
        RAISE NOTICE 'Populated content_embeddings from lessons and modules';
    ELSE
        RAISE NOTICE 'content_embeddings already has data, skipping population';
    END IF;
END $$;

-- Create function to generate embeddings for existing content
CREATE OR REPLACE FUNCTION generate_embeddings_for_content()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    row_record RECORD;
    embedding_vector vector(1536);
BEGIN
    -- This would need to be called with actual embedding generation
    -- For now, just a placeholder that can be called from the API
    RAISE NOTICE 'Embedding generation would happen here with OpenAI API';
END $$;

-- Add index for faster searching by metadata
CREATE INDEX IF NOT EXISTS idx_content_embeddings_metadata 
ON content_embeddings USING gin(metadata);

-- Add index for content type searching
CREATE INDEX IF NOT EXISTS idx_content_embeddings_type
ON content_embeddings ((metadata->>'type'));
