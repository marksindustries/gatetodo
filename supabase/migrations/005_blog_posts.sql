-- ── Blog Posts ───────────────────────────────────────────────────────────────
-- Public-facing GATE CS articles for SEO and organic traffic.

CREATE TABLE IF NOT EXISTS blog_posts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        UNIQUE NOT NULL,
  title         text        NOT NULL,
  excerpt       text,
  content       text,                   -- markdown body
  category      text,                   -- 'algorithms' | 'os' | 'dbms' | 'networks' | 'toc' | 'co'
  difficulty    text,                   -- 'easy' | 'medium' | 'hard'
  gate_year     text,                   -- e.g. 'GATE 2024', nullable
  read_time_min int,
  views         int         NOT NULL DEFAULT 0,
  featured      boolean     NOT NULL DEFAULT false,
  published_at  timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read published posts (no auth required — SEO friendly)
CREATE POLICY "public_read" ON blog_posts
  FOR SELECT USING (published_at <= now());
