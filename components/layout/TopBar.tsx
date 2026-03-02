"use client";

import Link from "next/link";

interface TopBarProps {
  streak?: number;
  daysUntilExam?: number | null;
}

export function TopBar({ streak, daysUntilExam }: TopBarProps) {
  return (
    <div
      className="flex items-center justify-end px-5 py-2.5 gap-3"
      style={{ background: "#111827", borderBottom: "1px solid #1e293b" }}
    >
      {typeof streak === "number" && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b" }}
        >
          <span style={{ fontSize: "12px" }}>🔥</span>
          <span className="text-xs font-bold" style={{ color: "#f59e0b", fontFamily: "var(--font-ibm-plex-mono)" }}>
            {streak}d streak
          </span>
        </div>
      )}
      {daysUntilExam !== null && daysUntilExam !== undefined && (
        <div
          className="px-2.5 py-1 rounded"
          style={{ background: "rgba(129,140,248,0.1)", border: "1px solid #818cf8" }}
        >
          <span className="text-xs" style={{ color: "#818cf8", fontFamily: "var(--font-ibm-plex-mono)" }}>
            {daysUntilExam}d to GATE
          </span>
        </div>
      )}
    </div>
  );
}
