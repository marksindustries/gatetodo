import Link from "next/link";
import { createAdminClient } from "@/lib/db/supabase-server";

const C = {
  bg: "#0a0a0f",
  surface: "#111118",
  surface2: "#18181f",
  border: "#222230",
  accent: "#f5a623",
  accent2: "#e84545",
  text: "#e8e8f0",
  muted: "#7a7a8c",
  green: "#00d68f",
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
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  difficulty: string | null;
  gate_year: string | null;
  read_time_min: number | null;
  views: number;
  featured: boolean;
  published_at: string;
};

export const revalidate = 3600;

async function getPosts(): Promise<Post[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("slug, title, excerpt, category, difficulty, gate_year, read_time_min, views, featured, published_at")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

function CategoryBadge({ category }: { category: string | null }) {
  const cat = catColors[category ?? ""] ?? { color: C.muted, border: C.border, bg: "transparent", label: category ?? "" };
  return (
    <span style={{
      fontFamily: "var(--font-ibm-plex-mono), monospace",
      fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px",
      textTransform: "uppercase", display: "inline-block",
      padding: "4px 10px", borderLeft: `2px solid ${cat.border}`,
      color: cat.color, background: cat.bg, marginBottom: "16px",
    }}>
      {cat.label}
    </span>
  );
}

function DiffBadge({ difficulty }: { difficulty: string | null }) {
  const d = diffColors[difficulty ?? ""] ?? { color: C.muted, bg: "transparent" };
  return (
    <span style={{
      fontFamily: "var(--font-ibm-plex-mono), monospace",
      fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px",
      padding: "3px 8px", color: d.color, background: d.bg,
    }}>
      {(difficulty ?? "").toUpperCase()}
    </span>
  );
}

export default async function HomePage() {
  const posts = await getPosts();
  const featured = posts.find((p) => p.featured) ?? posts[0] ?? null;
  const gridPosts = posts.filter((p) => p.slug !== featured?.slug).slice(0, 6);
  const recentPosts = posts.slice(0, 5);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "16px", lineHeight: "1.6", overflowX: "hidden", minHeight: "100vh" }}>

      <style>{`
        /* ── Responsive layout classes ── */
        .hp-nav { padding: 0 48px; }
        .hp-nav-links { display: flex; gap: 32px; align-items: center; }
        .hp-hero-grid { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; padding-top: 64px; position: relative; overflow: hidden; }
        .hp-hero-left { padding: 80px 64px 80px 96px; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 2; }
        .hp-hero-right { padding: 80px 64px 80px 0; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; }
        .hp-hero-ctas { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        .hp-stats-row { display: flex; gap: 48px; margin-top: 64px; padding-top: 40px; border-top: 1px solid ${C.border}; flex-wrap: wrap; }
        .hp-section-pad { padding-left: 96px; padding-right: 96px; }
        .hp-blog-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 2px; background: ${C.border}; }
        .hp-featured-span { grid-column: span 2; grid-row: span 2; }
        .hp-concept-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .hp-newsletter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .hp-newsletter-pad { padding: 64px; }
        .hp-newsletter-input-row { display: flex; }
        .hp-newsletter-input-row input { border-right: none; }
        .hp-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
        .hp-footer-pad { padding: 64px 96px 32px; }
        .hp-recent-row { display: grid; grid-template-columns: 60px 1fr auto; gap: 24px; align-items: center; padding: 24px 28px; }
        .hp-recent-arrow { display: block; }

        @media (max-width: 1024px) {
          .hp-nav { padding: 0 32px; }
          .hp-hero-left { padding: 60px 40px 60px 48px; }
          .hp-hero-right { padding: 60px 32px 60px 0; }
          .hp-section-pad { padding-left: 48px; padding-right: 48px; }
          .hp-blog-grid { grid-template-columns: repeat(2,1fr); }
          .hp-concept-grid { gap: 48px; }
          .hp-newsletter-grid { gap: 40px; }
          .hp-newsletter-pad { padding: 48px; }
          .hp-footer-pad { padding: 48px 48px 32px; }
          .hp-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
        }

        @media (max-width: 768px) {
          .hp-nav { padding: 0 20px; }
          .hp-nav-links { display: none; }
          .hp-hero-grid { grid-template-columns: 1fr; min-height: auto; }
          .hp-hero-right { display: none; }
          .hp-hero-left { padding: 48px 20px 40px; }
          .hp-hero-ctas { flex-direction: column; align-items: flex-start; }
          .hp-stats-row { gap: 24px; margin-top: 40px; padding-top: 28px; }
          .hp-section-pad { padding-left: 20px; padding-right: 20px; }
          .hp-blog-grid { grid-template-columns: 1fr; }
          .hp-featured-span { grid-column: span 1; grid-row: span 1; }
          .hp-concept-grid { grid-template-columns: 1fr; gap: 32px; }
          .hp-newsletter-grid { grid-template-columns: 1fr; gap: 28px; }
          .hp-newsletter-pad { padding: 32px 20px; }
          .hp-newsletter-input-row { flex-direction: column; gap: 0; }
          .hp-newsletter-input-row input { border-right: 1px solid ${C.border} !important; border-bottom: none; }
          .hp-newsletter-input-row button { width: 100%; }
          .hp-footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
          .hp-footer-pad { padding: 40px 20px 24px; }
          .hp-recent-row { grid-template-columns: 40px 1fr; gap: 16px; padding: 16px 16px; }
          .hp-recent-arrow { display: none; }
        }

        @media (max-width: 480px) {
          .hp-footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav className="hp-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "64px",
        background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "32px", height: "32px", background: C.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-ibm-plex-mono), monospace", fontWeight: 600, fontSize: "14px", color: "#000",
            clipPath: "polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%)",
          }}>GP</div>
          <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "20px", fontWeight: 700, color: C.text, letterSpacing: "-0.3px" }}>
            GATE<span style={{ color: C.accent }}>prep</span>
          </span>
        </Link>
        <div className="hp-nav-links">
          {[
            { label: "Articles", href: "/blog" },
            { label: "Concepts", href: "/blog?category=algorithms" },
            { label: "PYQs", href: "/blog" },
            { label: "Mock Tests", href: "/login" },
          ].map((l) => (
            <Link key={l.label} href={l.href} style={{ color: C.muted, fontSize: "14px", fontWeight: 500, textDecoration: "none", letterSpacing: "0.3px" }}>
              {l.label}
            </Link>
          ))}
          <Link href="/login" style={{
            background: C.accent, color: "#000", padding: "8px 20px",
            fontWeight: 600, fontSize: "13px", textDecoration: "none", letterSpacing: "0.5px",
          }}>
            Start Free Trial
          </Link>
        </div>
        {/* Mobile CTA — always visible */}
        <Link href="/login" className="hp-nav-mobile-cta" style={{
          background: C.accent, color: "#000", padding: "7px 16px",
          fontWeight: 600, fontSize: "12px", textDecoration: "none",
        }}>
          Try Free
        </Link>
        <style>{`.hp-nav-mobile-cta { display: none; } @media (max-width: 768px) { .hp-nav-mobile-cta { display: block; } }`}</style>
      </nav>

      {/* HERO */}
      <div className="hp-hero-grid">
        {/* grid bg */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(245,166,35,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 30% 50%, black 30%, transparent 70%)",
        }} />

        {/* Left */}
        <div className="hp-hero-left">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)",
            color: C.accent, fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: "11px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase",
            padding: "6px 14px", width: "fit-content", marginBottom: "32px",
          }}>
            <span style={{ width: "6px", height: "6px", background: C.accent, borderRadius: "50%", display: "inline-block" }} />
            GATE 2026 Prep
          </div>

          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(40px,5vw,72px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-1.5px", marginBottom: "24px" }}>
            Master CS.<br />
            <span style={{ color: C.accent, fontStyle: "italic" }}>Crack GATE.</span>
          </h1>

          <p style={{ color: C.muted, fontSize: "17px", fontWeight: 300, maxWidth: "420px", lineHeight: 1.7, marginBottom: "40px" }}>
            Deep dives into every GATE CS topic — algorithms, OS, DBMS, networks, and more.
            Built for engineers who want to understand, not memorize.
          </p>

          <div className="hp-hero-ctas">
            <Link href="/blog" style={{ background: C.accent, color: "#000", padding: "14px 28px", fontWeight: 600, fontSize: "15px", textDecoration: "none", letterSpacing: "0.2px" }}>
              Read Latest Articles →
            </Link>
            <Link href="/login" style={{ color: C.muted, fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
              🎯 Take Free Mock Test
            </Link>
          </div>

          <div className="hp-stats-row">
            {[
              { num: "240", suffix: "+", label: "Articles Published" },
              { num: "18",  suffix: "k", label: "Monthly Readers" },
              { num: "94",  suffix: "%", label: "Concept Retention" },
            ].map((s) => (
              <div key={s.label}>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "28px", fontWeight: 600, color: C.text, display: "block" }}>
                  {s.num}<span style={{ color: C.accent }}>{s.suffix}</span>
                </span>
                <span style={{ fontSize: "12px", color: C.muted, letterSpacing: "0.5px" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — featured card */}
        <div className="hp-hero-right">
          {featured && (
            <Link href={`/blog/${featured.slug}`} style={{ textDecoration: "none", width: "100%", maxWidth: "480px" }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden", cursor: "pointer" }}>
                <div style={{ height: "240px", background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 30%, rgba(245,166,35,0.15) 0%, transparent 60%)" }} />
                  <pre style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "13px", lineHeight: 1.8, color: "rgba(255,255,255,0.7)", padding: "24px", position: "relative", zIndex: 1, margin: 0 }}>
                    <span style={{ color: "#546e7a" }}>{"// Dijkstra's — GATE 2024 Q.14\n"}</span>
                    <span style={{ color: "#c792ea" }}>{"function "}</span>
                    <span style={{ color: "#82aaff" }}>{"dijkstra"}</span>
                    {"(graph, src) {\n"}
                    {"  "}<span style={{ color: "#c792ea" }}>{"let"}</span>{" dist = "}<span style={{ color: "#82aaff" }}>{"Array"}</span>{"(n)."}<span style={{ color: "#82aaff" }}>{"fill"}</span>{"("}<span style={{ color: C.accent }}>{"Infinity"}</span>{");\n"}
                    {"  dist[src] = "}<span style={{ color: C.accent }}>{"0"}</span>{";\n"}
                    {"  "}<span style={{ color: "#546e7a" }}>{"// Time: O((V+E) log V)\n"}</span>
                    {"  "}<span style={{ color: "#c792ea" }}>{"return"}</span>{" dist;\n}"}
                  </pre>
                </div>
                <div style={{ padding: "28px" }}>
                  <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: C.accent, marginBottom: "12px", display: "block" }}>
                    🔥 Trending · {catColors[featured.category ?? ""]?.label ?? featured.category}
                  </span>
                  <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "22px", fontWeight: 700, lineHeight: 1.3, marginBottom: "12px", color: C.text }}>{featured.title}</h2>
                  <p style={{ color: C.muted, fontSize: "14px", lineHeight: 1.65, marginBottom: "20px" }}>{featured.excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "12px", color: C.muted }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "24px", height: "24px", background: `linear-gradient(135deg,${C.accent},${C.accent2})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#000", fontWeight: 700 }}>R</div>
                      <span>{featured.read_time_min} min read</span>
                    </div>
                    {featured.gate_year && (
                      <span style={{ background: "rgba(232,69,69,0.1)", border: "1px solid rgba(232,69,69,0.2)", color: C.accent2, padding: "3px 8px", fontSize: "10px" }}>
                        ★ {featured.gate_year}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* TOPICS BAR */}
      <div className="hp-section-pad" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { label: "All Topics", count: posts.length, href: "/blog" },
            { label: "Algorithms", count: null, href: "/blog?category=algorithms" },
            { label: "Operating Systems", count: null, href: "/blog?category=os" },
            { label: "DBMS", count: null, href: "/blog?category=dbms" },
            { label: "Networks", count: null, href: "/blog?category=networks" },
            { label: "TOC", count: null, href: "/blog?category=toc" },
            { label: "CO & Architecture", count: null, href: "/blog?category=co" },
          ].map((chip) => (
            <Link key={chip.label} href={chip.href} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", border: `1px solid ${C.border}`,
              background: C.surface, color: C.muted, fontSize: "13px", fontWeight: 500,
              textDecoration: "none",
            }}>
              {chip.label}
              {chip.count !== null && (
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "10px", background: C.border, padding: "2px 6px", color: C.muted, borderRadius: "2px" }}>
                  {chip.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* BLOG GRID */}
      <section className="hp-section-pad" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "80px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: C.accent, marginBottom: "10px", display: "block" }}>
              // Featured Articles
            </span>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px,3vw,36px)", fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.15 }}>
              Deep Dives Worth<br />Your Time
            </h2>
          </div>
          <Link href="/blog" style={{ color: C.muted, textDecoration: "none", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
            View all articles →
          </Link>
        </div>

        <div className="hp-blog-grid">
          {/* Featured big card */}
          {featured && (
            <Link href={`/blog/${featured.slug}`} className="hp-featured-span" style={{ textDecoration: "none" }}>
              <div style={{ background: C.surface, padding: "32px", display: "flex", flexDirection: "column", height: "100%", position: "relative", overflow: "hidden", cursor: "pointer" }}>
                <CategoryBadge category={featured.category} />
                <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 700, lineHeight: 1.2, marginBottom: "12px", color: C.text, flex: 1 }}>{featured.title}</h3>
                <p style={{ color: C.muted, fontSize: "15px", lineHeight: 1.6, marginBottom: "24px" }}>{featured.excerpt}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "20px", borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: C.muted }}>
                    {new Date(featured.published_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} · {featured.read_time_min} min read
                  </span>
                  {featured.difficulty && <DiffBadge difficulty={featured.difficulty} />}
                </div>
              </div>
            </Link>
          )}

          {/* Other cards */}
          {gridPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
              <div style={{ background: C.bg, padding: "28px", display: "flex", flexDirection: "column", height: "100%", position: "relative", overflow: "hidden", cursor: "pointer" }}>
                <CategoryBadge category={post.category} />
                <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "18px", fontWeight: 700, lineHeight: 1.35, marginBottom: "12px", color: C.text, flex: 1 }}>{post.title}</h3>
                {post.excerpt && <p style={{ color: C.muted, fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>{post.excerpt}</p>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "20px", borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: C.muted }}>
                    {new Date(post.published_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} · {post.read_time_min} min
                  </span>
                  {post.difficulty && <DiffBadge difficulty={post.difficulty} />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CONCEPT SECTION */}
      <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="hp-section-pad hp-concept-grid" style={{ maxWidth: "1280px", margin: "0 auto", paddingTop: "80px", paddingBottom: "80px" }}>
          <div>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: C.accent, marginBottom: "10px", display: "block" }}>
              // Why GATEprep Blog
            </span>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px,3vw,40px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.1, marginBottom: "20px" }}>
              Not <em style={{ color: C.accent, fontStyle: "italic" }}>notes.</em><br />Understanding.
            </h2>
            <p style={{ color: C.muted, fontSize: "16px", lineHeight: 1.75, marginBottom: "32px" }}>
              Every article is built around how GATE actually tests a concept — not how textbooks explain it.
              We reverse-engineer PYQs to find the exact mental model you need.
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "14px", marginBottom: "40px", paddingLeft: 0 }}>
              {[
                "Every concept mapped to its GATE weightage & frequency",
                "Step-by-step PYQ walkthroughs, not just answers",
                "Time complexity derivations, not just results",
                "Common traps and how the paper setters think",
                "Spaced repetition flashcards linked to every article",
              ].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "15px", color: C.text }}>
                  <span style={{ color: C.accent, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "13px", flexShrink: 0, marginTop: "3px" }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/login" style={{ background: C.accent, color: "#000", padding: "14px 28px", fontWeight: 600, fontSize: "15px", textDecoration: "none" }}>
              Start Reading Free →
            </Link>
          </div>

          <div style={{ background: C.bg, border: `1px solid ${C.border}`, padding: "32px", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "13px", lineHeight: 2, overflowX: "auto" }}>
            <div style={{ color: C.accent, fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>GATE CS Syllabus 2026/</div>
            {[
              { text: "├── Algorithms/", color: C.muted },
              { text: "│   ├── ✓ Sorting & Searching", color: C.green },
              { text: "│   ├── ✓ Graph Algorithms", color: C.green },
              { text: "│   └── ⟳ Dynamic Programming", color: "#82aaff" },
              { text: "├── Operating Systems/", color: C.muted },
              { text: "│   ├── ✓ Process Scheduling", color: C.green },
              { text: "│   ├── ✓ Memory Management", color: C.green },
              { text: "│   └── ⟳ Deadlock", color: "#82aaff" },
              { text: "├── DBMS/", color: C.muted },
              { text: "│   ├── ✓ Normalization", color: C.green },
              { text: "│   └── ○ Transactions & ACID", color: C.muted },
              { text: "├── Computer Networks/", color: C.muted },
              { text: "├── TOC/", color: C.muted },
              { text: "└── CO & Architecture/", color: C.muted },
            ].map((line, i) => (
              <div key={i} style={{ color: line.color, whiteSpace: "pre" }}>{line.text}</div>
            ))}
            <div style={{ marginTop: "8px", fontSize: "11px", color: C.muted }}>
              <span style={{ color: C.green }}>✓ done</span>&nbsp;&nbsp;
              <span style={{ color: "#82aaff" }}>⟳ in progress</span>&nbsp;&nbsp;
              <span style={{ color: C.muted }}>○ upcoming</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ARTICLES */}
      <section className="hp-section-pad" style={{ maxWidth: "1280px", margin: "0 auto", paddingTop: "80px", paddingBottom: "80px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: C.accent, marginBottom: "10px", display: "block" }}>
              // Latest Posts
            </span>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px,3vw,36px)", fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.15 }}>Fresh Off the Press</h2>
          </div>
          <Link href="/blog" style={{ color: C.muted, textDecoration: "none", fontSize: "13px", fontWeight: 500 }}>View archive →</Link>
        </div>

        <div style={{ border: `1px solid ${C.border}` }}>
          {recentPosts.map((post, i) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="hp-recent-row" style={{ textDecoration: "none", color: "inherit", borderBottom: i < recentPosts.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, color: C.border, lineHeight: 1 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 500, color: C.text, marginBottom: "4px", lineHeight: 1.4 }}>{post.title}</div>
                <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", color: C.muted, display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {post.category && (
                    <span style={{ color: catColors[post.category]?.color ?? C.muted, textTransform: "uppercase", fontSize: "11px" }}>
                      {catColors[post.category]?.label ?? post.category}
                    </span>
                  )}
                  <span>{new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  {post.read_time_min && <span>{post.read_time_min} min read</span>}
                  {post.difficulty && <DiffBadge difficulty={post.difficulty} />}
                </div>
              </div>
              <span className="hp-recent-arrow" style={{ color: C.muted, fontSize: "18px" }}>→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <div className="hp-section-pad" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "80px" }}>
        <div className="hp-newsletter-grid hp-newsletter-pad" style={{ background: C.surface, border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: C.accent, marginBottom: "16px", display: "block" }}>
              // Weekly Digest
            </span>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(26px,3vw,36px)", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
              One concept.<br />Every <span style={{ color: C.accent, fontStyle: "italic" }}>Sunday.</span>
            </h2>
            <p style={{ color: C.muted, fontSize: "15px", marginTop: "16px", lineHeight: 1.7 }}>
              Join 4,200+ GATE aspirants getting deep-dive concept breakdowns, PYQ of the week, and rank predictor updates every Sunday morning.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="hp-newsletter-input-row">
              <input type="email" placeholder="your@email.com" style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "15px", padding: "14px 20px", outline: "none" }} />
              <button style={{ background: C.accent, color: "#000", border: "none", padding: "14px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                Subscribe Free →
              </button>
            </div>
            <p style={{ fontSize: "12px", color: C.muted }}>
              <span style={{ color: C.green, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px" }}>✓ Free forever.</span> No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>
        <div className="hp-footer-pad" style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div className="hp-footer-grid">
            <div>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "16px" }}>
                <div style={{ width: "32px", height: "32px", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-ibm-plex-mono), monospace", fontWeight: 600, fontSize: "14px", color: "#000", clipPath: "polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%)" }}>GP</div>
                <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "20px", fontWeight: 700, color: C.text }}>GATE<span style={{ color: C.accent }}>prep</span></span>
              </Link>
              <p style={{ color: C.muted, fontSize: "14px", lineHeight: 1.7, maxWidth: "280px" }}>
                Deep CS concepts for GATE aspirants. Built by engineers who cracked GATE, for engineers who will.
              </p>
            </div>
            <div>
              <h4 style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: C.muted, marginBottom: "20px" }}>Topics</h4>
              {["Algorithms", "Operating Systems", "DBMS", "Networks", "TOC", "CO & Architecture"].map((t) => (
                <Link key={t} href={`/blog?category=${t.toLowerCase().replace(/ /g, "-")}`} style={{ display: "block", color: C.text, textDecoration: "none", fontSize: "14px", marginBottom: "10px" }}>{t}</Link>
              ))}
            </div>
            <div>
              <h4 style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: C.muted, marginBottom: "20px" }}>Resources</h4>
              {["PYQ Bank", "Mock Tests", "Formula Sheets", "GATE Syllabus"].map((t) => (
                <Link key={t} href="/login" style={{ display: "block", color: C.text, textDecoration: "none", fontSize: "14px", marginBottom: "10px" }}>{t}</Link>
              ))}
            </div>
            <div>
              <h4 style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: C.muted, marginBottom: "20px" }}>GATEprep App</h4>
              {["Adaptive Practice", "Spaced Repetition", "Progress Dashboard"].map((t) => (
                <Link key={t} href="/login" style={{ display: "block", color: C.text, textDecoration: "none", fontSize: "14px", marginBottom: "10px" }}>{t}</Link>
              ))}
              <Link href="/login" style={{ display: "block", color: C.muted, textDecoration: "none", fontSize: "14px", marginBottom: "10px" }}>₹299/month</Link>
              <Link href="/login" style={{ display: "block", color: C.accent, textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>Start Free Trial →</Link>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", paddingTop: "32px", borderTop: `1px solid ${C.border}`, fontSize: "13px", color: C.muted, fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
            <span>© 2026 GATEprep · Prefrontal Labs · Bangalore, India</span>
            <span>Built with obsession for GATE CS 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
