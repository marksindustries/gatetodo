"use client";

interface SolutionPanelProps {
  solution: string;
  correctAnswer: string;
  isCorrect: boolean;
  onFeedback: (feedback: "easy" | "good" | "hard") => void;
  onNext: () => void;
  showFeedback: boolean;
}

export function SolutionPanel({
  solution,
  correctAnswer,
  isCorrect,
  onFeedback,
  onNext,
  showFeedback,
}: SolutionPanelProps) {
  return (
    <div
      className="mt-4 p-4 rounded"
      style={{
        background: isCorrect ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
        border: `1px solid ${isCorrect ? "#10b981" : "#ef4444"}`,
      }}
    >
      {/* Result badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{
            background: isCorrect ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
            color: isCorrect ? "#10b981" : "#ef4444",
            fontFamily: "var(--font-ibm-plex-mono)",
          }}
        >
          {isCorrect ? "CORRECT" : "INCORRECT"}
        </span>
        <span className="text-xs" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
          Correct answer: <strong style={{ color: "#f59e0b" }}>{correctAnswer}</strong>
        </span>
      </div>

      {/* Solution */}
      <div
        className="text-sm leading-relaxed mb-4"
        style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}
      >
        <span className="text-xs uppercase tracking-wider block mb-1" style={{ color: "#475569" }}>
          SOLUTION
        </span>
        {solution}
      </div>

      {/* SM-2 feedback buttons (only if correct) */}
      {isCorrect && showFeedback && (
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            How difficult was this?
          </p>
          <div className="flex gap-2">
            {(["hard", "good", "easy"] as const).map((fb) => (
              <button
                key={fb}
                onClick={() => onFeedback(fb)}
                className="px-4 py-1.5 rounded text-xs font-medium transition-all"
                style={{
                  background: fb === "easy" ? "rgba(16,185,129,0.1)" : fb === "good" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${fb === "easy" ? "#10b981" : fb === "good" ? "#f59e0b" : "#ef4444"}`,
                  color: fb === "easy" ? "#10b981" : fb === "good" ? "#f59e0b" : "#ef4444",
                  fontFamily: "var(--font-ibm-plex-mono)",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {fb}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full py-2 rounded text-sm font-medium"
        style={{
          background: "#f59e0b",
          color: "#0a0e1a",
          fontFamily: "var(--font-ibm-plex-mono)",
          cursor: "pointer",
        }}
      >
        Next Question →
      </button>
    </div>
  );
}
