import Link from "next/link";
import { createAdminClient } from "@/lib/db/supabase-server";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "GATE CS Blog — Deep Dives by GATEprep",
  description: "In-depth articles on algorithms, OS, DBMS, networks, TOC, and CO for GATE CS 2026. PYQ walkthroughs, concept explanations, and exam strategies.",
};

const C = {
  bg: "#0a0a0f", surface: "#111118", border: "#222230",
  accent: "#f5a623", accent2: "#e84545", text: "#e8e8f0", muted: "#7a7a8c", green: "#00d68f",
};

const catColors: Record<string, { color: string; border: string; bg: string; label: string }> = {
  algorithms: { color: C.accent,   border: C.accent,   bg: "rgba(245,166,35,0.08)",  label: "Algorithms" },
  os:         { color: "#82aaff",  border: "#82aaff",  bg: "rgba(130,170,255,0.08)", label: "Operating Systems" },
  dbms:       { color: C.green,    border: C.green,    bg: "rgba(0,214,143,0.08)",   label: "DBMS" },
  networks:   { color: "#c792ea",  border: "#c792ea",  bg: "rgba(199,146,234,0.08)", label: "Networks" },
  toc:        { color: C.accent2,  border: C.accent2,  bg: "rgba(232,69,69,0.08)",   label: "TOC" },
  co:         { color: "#89ddff",  border: "#89ddff",  bg: "rgba(137,221,255,0.08)", label: "CO & Architecture" },
};

const diffColors: Record<string, { color: string; bg: string }> = {
  easy:   { color: C.green,   bg: "rgba(0,214,143,0.1)" },
  medium: { color: C.accent,  bg: "rgba(245,166,35,0.1)" },
  hard:   { color: C.accent2, bg: "rgba(232,69,69,0.1)" },
};

type Post = {
  slug: string; title: string; excerpt: string | null;
  category: string | null; difficulty: string | null;
  gate_year: string | null; read_time_min: number | null;
  views: number; featured: boolean; published_at: string;
};

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const admin = createAdminClient();
  let query = admin
    .from("blog_posts")
    .select("slug, title, excerpt, category, difficulty, gate_year, read_time_min, views, featured, published_at")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }

  const { data: posts } = await query;
  const allPosts: Post[] = posts ?? [];

  const topics = [
    { label: "All Topics", key: null },
    { label: "Algorithms", key: "algorithms" },
    { label: "Operating Systems", key: "os" },
    { label: "DBMS", key: "dbms" },
    { label: "Computer Networks", key: "networks" },
    { label: "TOC", key: "toc" },
    { label: "CO & Architecture", key: "co" },
  ];

  const activeCategory = searchParams.category ?? null;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 96px" }}>

      {/* Header */}
      <div style={{ marginBottom: "48px" }}>
        <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: C.accent, marginBottom: "12px", display: "block" }}>
          // GATEprep Blog
        </span>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "48px", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.05, marginBottom: "16px" }}>
          CS Concepts,<br /><span style={{ color: C.accent, fontStyle: "italic" }}>Cracked.</span>
        </h1>
        <p style={{ color: C.muted, fontSize: "17px", maxWidth: "520px", lineHeight: 1.7 }}>
          Deep dives into every GATE CS topic. PYQ walkthroughs, time complexity proofs,
          and the mental models that actually stick.
        </p>
      </div>

      {/* Topic filter */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "48px" }}>
        {topics.map((topic) => {
          const isActive = topic.key === activeCategory;
          return (
            <Link
              key={topic.label}
              href={topic.key ? `/blog?category=${topic.key}` : "/blog"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 20px",
                border: `1px solid ${isActive ? C.accent : C.border}`,
                background: isActive ? "rgba(245,166,35,0.05)" : C.surface,
                color: isActive ? C.accent : C.muted,
                fontSize: "13px", fontWeight: 500, textDecoration: "none",
              }}
            >
              {topic.label}
            </Link>
          );
        })}
      </div>

      {allPosts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: C.muted }}>
          <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "14px" }}>
            No articles yet for this topic. Check back soon.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2px", background: C.border }}>
          {allPosts.map((post, i) => {
            const cat = catColors[post.category ?? ""];
            const diff = diffColors[post.difficulty ?? ""];
            const isFeatured = post.featured && i === 0;
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{
                  textDecoration: "none",
                  ...(isFeatured ? { gridColumn: "span 2", gridRow: "span 2" } : {}),
                }}
              >
                <div style={{
                  background: isFeatured ? C.surface : C.bg,
                  padding: "32px", display: "flex", flexDirection: "column", height: "100%",
                  cursor: "pointer",
                }}>
                  {cat && (
                    <span style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "10px", fontWeight: 600,
                      letterSpacing: "1.5px", textTransform: "uppercase", display: "inline-block",
                      padding: "4px 10px", borderLeft: `2px solid ${cat.border}`,
                      color: cat.color, background: cat.bg, marginBottom: "16px",
                    }}>{cat.label}</span>
                  )}
                  <h2 style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: isFeatured ? "28px" : "18px",
                    fontWeight: 700, lineHeight: isFeatured ? 1.2 : 1.35,
                    marginBottom: "12px", color: C.text, flex: 1,
                  }}>{post.title}</h2>
                  {post.excerpt && (
                    <p style={{ color: C.muted, fontSize: isFeatured ? "15px" : "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                      {post.excerpt}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "20px", borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: C.muted }}>
                      {new Date(post.published_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      {post.read_time_min ? ` · ${post.read_time_min} min` : ""}
                      {post.views > 0 ? ` · ${post.views.toLocaleString()} views` : ""}
                    </span>
                    {diff && (
                      <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "10px", fontWeight: 600, padding: "3px 8px", color: diff.color, background: diff.bg }}>
                        {(post.difficulty ?? "").toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
