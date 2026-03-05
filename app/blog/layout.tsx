import Link from "next/link";

const C = {
  bg: "#0a0a0f", surface: "#111118", border: "#222230",
  accent: "#f5a623", text: "#e8e8f0", muted: "#7a7a8c",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "var(--font-dm-sans), sans-serif", minHeight: "100vh" }}>
      <style>{`
        .bl-nav { padding: 0 48px; }
        .bl-nav-links { display: flex; gap: 32px; align-items: center; }
        .bl-nav-mobile-cta { display: none; }
        .bl-footer-inner { padding: 40px 96px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .bl-footer-cats { display: flex; gap: 32px; flex-wrap: wrap; }
        @media (max-width: 768px) {
          .bl-nav { padding: 0 20px; }
          .bl-nav-links { display: none; }
          .bl-nav-mobile-cta { display: block; }
          .bl-footer-inner { padding: 32px 20px; flex-direction: column; align-items: flex-start; gap: 20px; }
          .bl-footer-cats { gap: 16px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="bl-nav" style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "64px",
        background: "rgba(10,10,15,0.9)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "32px", height: "32px", background: C.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-ibm-plex-mono), monospace", fontWeight: 600, fontSize: "14px", color: "#000",
            clipPath: "polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%)",
          }}>GP</div>
          <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "20px", fontWeight: 700, color: C.text }}>
            GATE<span style={{ color: C.accent }}>prep</span>
          </span>
        </Link>
        <div className="bl-nav-links">
          <Link href="/blog" style={{ color: C.muted, fontSize: "14px", textDecoration: "none" }}>Articles</Link>
          <Link href="/blog?category=algorithms" style={{ color: C.muted, fontSize: "14px", textDecoration: "none" }}>Concepts</Link>
          <Link href="/dashboard" style={{ color: C.muted, fontSize: "14px", textDecoration: "none" }}>Practice App</Link>
          <Link href="/login" style={{
            background: C.accent, color: "#000", padding: "8px 20px",
            fontWeight: 600, fontSize: "13px", textDecoration: "none",
          }}>Start Free Trial</Link>
        </div>
        <Link href="/login" className="bl-nav-mobile-cta" style={{
          background: C.accent, color: "#000", padding: "7px 16px",
          fontWeight: 600, fontSize: "12px", textDecoration: "none",
        }}>Try Free</Link>
      </nav>

      {children}

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface, marginTop: "80px" }}>
        <div className="bl-footer-inner" style={{ maxWidth: "1280px", margin: "0 auto", fontSize: "13px", color: C.muted, fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "16px", fontWeight: 700, color: C.text }}>GATE<span style={{ color: C.accent }}>prep</span></span>
          </Link>
          <div className="bl-footer-cats">
            {["algorithms", "os", "dbms", "networks", "toc"].map((cat) => (
              <Link key={cat} href={`/blog?category=${cat}`} style={{ color: C.muted, textDecoration: "none", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px" }}>{cat}</Link>
            ))}
          </div>
          <span>© 2026 GATEprep</span>
        </div>
      </footer>
    </div>
  );
}
