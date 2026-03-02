"use client";

interface QuestionNavigatorProps {
  total: number;
  currentIndex: number;
  statuses: ("unattempted" | "answered" | "marked")[];
  onNavigate: (index: number) => void;
}

const STATUS_COLORS = {
  unattempted: { bg: "#1e293b", text: "#475569", border: "#1e293b" },
  answered: { bg: "rgba(16,185,129,0.2)", text: "#10b981", border: "#10b981" },
  marked: { bg: "rgba(245,158,11,0.2)", text: "#f59e0b", border: "#f59e0b" },
};

export function QuestionNavigator({
  total,
  currentIndex,
  statuses,
  onNavigate,
}: QuestionNavigatorProps) {
  const counts = {
    answered: statuses.filter((s) => s === "answered").length,
    marked: statuses.filter((s) => s === "marked").length,
    unattempted: statuses.filter((s) => s === "unattempted").length,
  };

  return (
    <div className="hidden md:block p-3" style={{ width: "200px", background: "#111827", borderRight: "1px solid #1e293b" }}>
      {/* Legend */}
      <div className="mb-3 space-y-1">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between text-xs" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: STATUS_COLORS[status as keyof typeof STATUS_COLORS].bg }} />
              <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{status}</span>
            </div>
            <span style={{ color: STATUS_COLORS[status as keyof typeof STATUS_COLORS].text }}>{count}</span>
          </div>
        ))}
      </div>

      <div className="h-px mb-3" style={{ background: "#1e293b" }} />

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: total }, (_, i) => {
          const status = statuses[i] ?? "unattempted";
          const colors = STATUS_COLORS[status];
          const isCurrent = i === currentIndex;

          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className="w-7 h-7 rounded text-xs flex items-center justify-center"
              style={{
                background: colors.bg,
                border: `1px solid ${isCurrent ? "#f1f5f9" : colors.border}`,
                color: colors.text,
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: "pointer",
                outline: isCurrent ? "2px solid #f1f5f9" : "none",
                outlineOffset: "1px",
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
