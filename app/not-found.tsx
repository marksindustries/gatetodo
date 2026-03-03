import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#0a0e1a",
        fontFamily: "var(--font-ibm-plex-mono), monospace",
      }}
    >
      <div style={{ color: "#475569", fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>
        404
      </div>
      <h1 style={{ color: "#f1f5f9", fontSize: "1.125rem", marginBottom: "0.5rem" }}>
        Page not found
      </h1>
      <p style={{ color: "#475569", fontSize: "0.75rem", marginBottom: "2rem" }}>
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        style={{
          padding: "0.5rem 1.5rem",
          background: "transparent",
          border: "1px solid #f59e0b",
          color: "#f59e0b",
          borderRadius: "4px",
          fontSize: "0.75rem",
          textDecoration: "none",
        }}
      >
        Go to dashboard
      </Link>
    </div>
  );
}
