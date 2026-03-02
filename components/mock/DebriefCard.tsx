"use client";

interface DebriefData {
  weak_areas: string[];
  focus_this_week: string[];
  improvement: string;
  predicted_improvement: string;
}

interface DebriefCardProps {
  data: DebriefData | null;
  loading: boolean;
}

export function DebriefCard({ data, loading }: DebriefCardProps) {
  if (loading) {
    return (
      <div
        className="p-4 rounded"
        style={{ background: "#111827", border: "1px solid #1e293b" }}
      >
        <p className="text-xs mb-3" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
          AI DEBRIEF
        </p>
        <div className="space-y-2">
          {[60, 80, 70].map((w, i) => (
            <div
              key={i}
              className="h-4 rounded animate-pulse"
              style={{ background: "#1e293b", width: `${w}%` }}
            />
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
          Analyzing your performance...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className="p-4 rounded"
      style={{ background: "#111827", border: "1px solid #1e293b" }}
    >
      <p className="text-xs mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
        AI DEBRIEF
      </p>

      <div className="space-y-4">
        {/* Weak areas */}
        <div>
          <p className="text-xs mb-2" style={{ color: "#ef4444", fontFamily: "var(--font-ibm-plex-mono)" }}>
            WEAK AREAS THIS TEST
          </p>
          <ul className="space-y-1">
            {data.weak_areas.map((area, i) => (
              <li
                key={i}
                className="text-xs flex gap-2"
                style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}
              >
                <span style={{ color: "#ef4444" }}>•</span> {area}
              </li>
            ))}
          </ul>
        </div>

        {/* Focus this week */}
        <div>
          <p className="text-xs mb-2" style={{ color: "#f59e0b", fontFamily: "var(--font-ibm-plex-mono)" }}>
            WHAT TO FOCUS ON THIS WEEK
          </p>
          <ul className="space-y-1">
            {data.focus_this_week.map((item, i) => (
              <li
                key={i}
                className="text-xs flex gap-2"
                style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}
              >
                <span style={{ color: "#f59e0b" }}>{i + 1}.</span> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Improvement */}
        <div
          className="p-3 rounded text-xs"
          style={{
            background: "rgba(16,185,129,0.05)",
            border: "1px solid #10b981",
            color: "#94a3b8",
            fontFamily: "var(--font-ibm-plex-mono)",
          }}
        >
          <span style={{ color: "#10b981" }}>IMPROVEMENT: </span>
          {data.improvement}
        </div>

        <p className="text-xs" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
          {data.predicted_improvement}
        </p>
      </div>
    </div>
  );
}
