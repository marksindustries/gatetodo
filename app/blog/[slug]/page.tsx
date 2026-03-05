import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/db/supabase-server";
import { ViewCounter } from "@/components/blog/ViewCounter";
import type { Metadata } from "next";

export const revalidate = 3600;

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

async function getPost(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .lte("published_at", new Date().toISOString())
    .single();
  return data;
}

export async function generateStaticParams() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("slug")
    .lte("published_at", new Date().toISOString());
  return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} — GATEprep`,
    description: post.excerpt ?? `${post.title} — GATE CS article by GATEprep`,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? "",
      type: "article",
      publishedTime: post.published_at,
    },
  };
}

// Minimal markdown renderer — converts common markdown to HTML-like JSX
function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "24px", overflowX: "auto", margin: "24px 0", borderRadius: "2px" }}>
          <code style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "13px", lineHeight: 1.8, color: C.text }}>
            {codeLines.join("\n")}
          </code>
        </pre>
      );
      i++;
      continue;
    }

    // Table
    if (line.startsWith("|") && lines[i + 1]?.startsWith("|--")) {
      const headers = line.split("|").filter(Boolean).map((h) => h.trim());
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").filter(Boolean).map((c) => c.trim()));
        i++;
      }
      elements.push(
        <div key={i} style={{ overflowX: "auto", margin: "24px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.accent}` }}>
                {headers.map((h, j) => (
                  <th key={j} style={{ padding: "10px 16px", textAlign: "left", color: C.accent, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: `1px solid ${C.border}` }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: "10px 16px", color: C.text }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} style={{ fontFamily: "var(--font-playfair), serif", fontSize: "28px", fontWeight: 700, marginTop: "48px", marginBottom: "16px", color: C.text, letterSpacing: "-0.5px" }}>
          {line.slice(3)}
        </h2>
      );
    }
    // H3
    else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} style={{ fontFamily: "var(--font-playfair), serif", fontSize: "20px", fontWeight: 700, marginTop: "32px", marginBottom: "12px", color: C.text }}>
          {line.slice(4)}
        </h3>
      );
    }
    // HR
    else if (line.startsWith("---")) {
      elements.push(<hr key={i} style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "40px 0" }} />);
    }
    // List item
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "8px", fontSize: "16px", color: C.text }}>
          <span style={{ color: C.accent, fontFamily: "var(--font-ibm-plex-mono), monospace", flexShrink: 0 }}>→</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    }
    // Blank line
    else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "12px" }} />);
    }
    // Paragraph
    else {
      elements.push(
        <p key={i} style={{ color: C.muted, fontSize: "16px", lineHeight: 1.8, marginBottom: "16px" }}>
          {line}
        </p>
      );
    }

    i++;
  }

  return <>{elements}</>;
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const cat = catColors[post.category ?? ""];
  const diffColors: Record<string, { color: string; bg: string }> = {
    easy:   { color: C.green,   bg: "rgba(0,214,143,0.1)" },
    medium: { color: C.accent,  bg: "rgba(245,166,35,0.1)" },
    hard:   { color: C.accent2, bg: "rgba(232,69,69,0.1)" },
  };
  const diff = diffColors[post.difficulty ?? ""];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "64px 32px" }}>
      <ViewCounter slug={params.slug} />

      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "32px", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "12px", color: C.muted }}>
        <Link href="/" style={{ color: C.muted, textDecoration: "none" }}>Home</Link>
        <span>/</span>
        <Link href="/blog" style={{ color: C.muted, textDecoration: "none" }}>Blog</Link>
        {cat && (
          <>
            <span>/</span>
            <Link href={`/blog?category=${post.category}`} style={{ color: cat.color, textDecoration: "none" }}>{cat.label}</Link>
          </>
        )}
      </div>

      {/* Category + difficulty */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
        {cat && (
          <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px", borderLeft: `2px solid ${cat.border}`, color: cat.color, background: cat.bg }}>
            {cat.label}
          </span>
        )}
        {diff && (
          <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "10px", fontWeight: 600, padding: "3px 8px", color: diff.color, background: diff.bg }}>
            {(post.difficulty ?? "").toUpperCase()}
          </span>
        )}
        {post.gate_year && (
          <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "10px", fontWeight: 600, padding: "3px 8px", background: "rgba(232,69,69,0.1)", border: "1px solid rgba(232,69,69,0.2)", color: C.accent2 }}>
            ★ {post.gate_year}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1px", marginBottom: "20px", color: C.text }}>
        {post.title}
      </h1>

      {/* Meta */}
      <div style={{ display: "flex", gap: "24px", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "12px", color: C.muted, marginBottom: "40px", paddingBottom: "40px", borderBottom: `1px solid ${C.border}` }}>
        <span>{new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
        {post.read_time_min && <span>{post.read_time_min} min read</span>}
        {post.views > 0 && <span>{post.views.toLocaleString()} views</span>}
      </div>

      {/* Content */}
      <div>
        {post.content ? renderMarkdown(post.content) : (
          <p style={{ color: C.muted, fontStyle: "italic" }}>Content coming soon.</p>
        )}
      </div>

      {/* CTA */}
      <div style={{ marginTop: "64px", padding: "40px", background: C.surface, border: `1px solid ${C.border}`, textAlign: "center" }}>
        <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: C.accent, display: "block", marginBottom: "12px" }}>
          // Practice this concept
        </span>
        <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "24px", fontWeight: 700, marginBottom: "12px", color: C.text }}>
          Solidify this with adaptive practice
        </h3>
        <p style={{ color: C.muted, fontSize: "14px", marginBottom: "24px" }}>
          GATEprep generates personalized questions on {cat?.label ?? "this topic"} using spaced repetition.
        </p>
        <Link href="/signup" style={{ background: C.accent, color: "#000", padding: "14px 32px", fontWeight: 600, fontSize: "15px", textDecoration: "none", display: "inline-block" }}>
          Start Free Practice →
        </Link>
      </div>

      {/* Back */}
      <div style={{ marginTop: "40px" }}>
        <Link href="/blog" style={{ color: C.muted, textDecoration: "none", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "13px" }}>
          ← Back to all articles
        </Link>
      </div>
    </div>
  );
}
