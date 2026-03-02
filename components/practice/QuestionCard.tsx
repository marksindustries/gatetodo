"use client";

import { useState } from "react";

interface MCQOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

interface QuestionCardProps {
  questionText: string;
  questionType: "MCQ" | "NAT";
  options?: MCQOptions | null;
  difficulty: number;
  marks: 1 | 2;
  revealed: boolean;
  correctAnswer?: string;
  onSubmit: (answer: string) => void;
  onExplain: () => void;
  onSkip: () => void;
}

export function QuestionCard({
  questionText,
  questionType,
  options,
  difficulty,
  marks,
  revealed,
  correctAnswer,
  onSubmit,
  onExplain,
  onSkip,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [natValue, setNatValue] = useState("");

  function handleCheck() {
    if (questionType === "MCQ" && selected) {
      onSubmit(selected);
    } else if (questionType === "NAT" && natValue) {
      onSubmit(natValue);
    }
  }

  function getOptionStyle(key: string) {
    const base: React.CSSProperties = {
      background: "#0a0e1a",
      border: "1px solid #1e293b",
      color: "#f1f5f9",
      fontFamily: "var(--font-ibm-plex-mono)",
      cursor: revealed ? "default" : "pointer",
      borderRadius: "4px",
      padding: "12px",
      marginBottom: "8px",
      width: "100%",
      textAlign: "left",
      fontSize: "14px",
      transition: "all 0.15s",
    };

    if (!revealed) {
      if (selected === key) {
        return { ...base, background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b", color: "#f59e0b" };
      }
      return base;
    }

    // Revealed state
    if (key === correctAnswer) {
      return { ...base, background: "rgba(16,185,129,0.1)", border: "1px solid #10b981", color: "#10b981" };
    }
    if (key === selected && key !== correctAnswer) {
      return { ...base, background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#ef4444" };
    }
    return { ...base, opacity: 0.4 };
  }

  const difficultyDots = Array.from({ length: 5 }, (_, i) => i < difficulty);

  return (
    <div>
      {/* Meta bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1">
          {difficultyDots.map((active, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: active ? "#f59e0b" : "#1e293b" }}
            />
          ))}
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid #f59e0b",
            color: "#f59e0b",
            fontFamily: "var(--font-ibm-plex-mono)",
          }}
        >
          {marks} mark{marks > 1 ? "s" : ""}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: "#111827",
            border: "1px solid #1e293b",
            color: "#94a3b8",
            fontFamily: "var(--font-ibm-plex-mono)",
          }}
        >
          {questionType}
        </span>
      </div>

      {/* Question text */}
      <div
        className="p-4 rounded mb-4 text-sm leading-relaxed"
        style={{
          background: "#0a0e1a",
          border: "1px solid #1e293b",
          color: "#f1f5f9",
          fontFamily: "var(--font-ibm-plex-mono)",
          whiteSpace: "pre-wrap",
        }}
      >
        {questionText}
      </div>

      {/* Answer area */}
      {questionType === "MCQ" && options ? (
        <div>
          {(["A", "B", "C", "D"] as const).map((key) => (
            <button
              key={key}
              onClick={() => !revealed && setSelected(key)}
              style={getOptionStyle(key)}
            >
              <span style={{ color: "#f59e0b", marginRight: "8px", fontWeight: 600 }}>
                {key}.
              </span>
              {options[key]}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <label
            className="block text-xs mb-1.5"
            style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}
          >
            ENTER NUMERIC ANSWER
          </label>
          <input
            type="number"
            value={natValue}
            onChange={(e) => setNatValue(e.target.value)}
            disabled={revealed}
            placeholder="Enter number..."
            className="w-full px-3 py-2.5 rounded text-sm outline-none"
            style={{
              background: "#0a0e1a",
              border: `1px solid ${revealed ? "#1e293b" : "#f59e0b"}`,
              color: "#f1f5f9",
              fontFamily: "var(--font-ibm-plex-mono)",
            }}
          />
        </div>
      )}

      {/* Action bar */}
      {!revealed && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCheck}
            disabled={questionType === "MCQ" ? !selected : !natValue}
            className="flex-1 py-2.5 rounded text-sm font-medium"
            style={{
              background: "#f59e0b",
              color: "#0a0e1a",
              fontFamily: "var(--font-ibm-plex-mono)",
              cursor: "pointer",
              opacity: (questionType === "MCQ" ? !selected : !natValue) ? 0.4 : 1,
            }}
          >
            Check Answer
          </button>
          <button
            onClick={onExplain}
            className="px-4 py-2.5 rounded text-sm"
            style={{
              background: "transparent",
              border: "1px solid #818cf8",
              color: "#818cf8",
              fontFamily: "var(--font-ibm-plex-mono)",
              cursor: "pointer",
            }}
          >
            Explain
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2.5 rounded text-sm"
            style={{
              background: "transparent",
              border: "1px solid #1e293b",
              color: "#475569",
              fontFamily: "var(--font-ibm-plex-mono)",
              cursor: "pointer",
            }}
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
