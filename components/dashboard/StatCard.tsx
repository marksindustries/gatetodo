"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: "amber" | "emerald" | "indigo" | "danger";
  icon?: string;
}

const ACCENT_COLORS = {
  amber: "#f59e0b",
  emerald: "#10b981",
  indigo: "#818cf8",
  danger: "#ef4444",
};

export function StatCard({ label, value, subtext, accent = "amber", icon }: StatCardProps) {
  const color = ACCENT_COLORS[accent];

  return (
    <div
      className="p-4 rounded"
      style={{
        background: "#111827",
        border: "1px solid #1e293b",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}
        >
          {label}
        </p>
        {icon && <span style={{ fontSize: "16px", opacity: 0.6 }}>{icon}</span>}
      </div>
      <p
        className="text-3xl font-bold font-syne"
        style={{ color }}
      >
        {value}
      </p>
      {subtext && (
        <p
          className="text-xs mt-1"
          style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}
