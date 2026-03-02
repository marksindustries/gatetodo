-- ─────────────────────────────────────────────
-- match_documents — RAG search
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.75,
  match_count int DEFAULT 5,
  filter_subject text DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, source text, subject text, similarity float)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    content,
    source,
    subject,
    1 - (embedding <=> query_embedding) AS similarity
  FROM rag_documents
  WHERE
    (filter_subject IS NULL OR subject = filter_subject)
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ─────────────────────────────────────────────
-- match_llm_cache — semantic cache lookup
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_llm_cache(
  query_embedding vector(768),
  similarity_threshold float DEFAULT 0.92,
  match_count int DEFAULT 1
)
RETURNS TABLE(id uuid, response text, similarity float)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    response,
    1 - (prompt_embedding <=> query_embedding) AS similarity
  FROM llm_cache
  WHERE 1 - (prompt_embedding <=> query_embedding) > similarity_threshold
  ORDER BY prompt_embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ─────────────────────────────────────────────
-- increment_cache_hit — bump hit counter atomically
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_cache_hit(cache_id uuid)
RETURNS void
LANGUAGE SQL
AS $$
  UPDATE llm_cache SET hit_count = hit_count + 1 WHERE id = cache_id;
$$;

-- ─────────────────────────────────────────────
-- increment_question_reuse — bump reuse counter
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_question_reuse(question_id uuid)
RETURNS void
LANGUAGE SQL
AS $$
  UPDATE generated_questions SET reuse_count = reuse_count + 1 WHERE id = question_id;
$$;
