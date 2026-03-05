-- Atomic view counter increment for blog posts
CREATE OR REPLACE FUNCTION increment_blog_views(post_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE blog_posts SET views = views + 1 WHERE slug = post_slug;
$$;
