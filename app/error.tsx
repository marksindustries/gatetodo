"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      <div style={{ color: "#ef4444", fontSize: "2rem", marginBottom: "1rem" }}>⚠</div>
      <h1 style={{ color: "#f1f5f9", fontSize: "1.125rem", marginBottom: "0.5rem" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#475569", fontSize: "0.75rem", marginBottom: "2rem" }}>
        {error.digest ? `Error ID: ${error.digest}` : "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "0.5rem 1.5rem",
          background: "transparent",
          border: "1px solid #f59e0b",
          color: "#f59e0b",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.75rem",
          fontFamily: "var(--font-ibm-plex-mono), monospace",
        }}
      >
        Try again
      </button>
    </div>
  );
}
