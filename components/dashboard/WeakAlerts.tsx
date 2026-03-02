"use client";

import Link from "next/link";

interface WeakConcept {
  concept_id: string;
  subject: string;
  topic: string;
  subtopic: string;
  mastery_score: number;
}

interface WeakAlertsProps {
  concepts: WeakConcept[];
}

export function WeakAlerts({ concepts }: WeakAlertsProps) {
  if (concepts.length === 0) return null;

  return (
    <div>
      <h3
        className="text-xs uppercase tracking-wider mb-3 flex items-center gap-2"
        style={{ color: "#ef4444", fontFamily: "var(--font-ibm-plex-mono)" }}
      >
        <span>⚠</span> Weak Areas — Focus Today
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {concepts.map((concept) => (
          <div
            key={concept.concept_id}
            className="p-3 rounded"
            style={{
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid #ef4444",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs"
                style={{ color: "#ef4444", fontFamily: "var(--font-ibm-plex-mono)" }}
              >
                {concept.subject}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: "#ef4444", fontFamily: "var(--font-ibm-plex-mono)" }}
              >
                {concept.mastery_score}%
              </span>
            </div>
            <p
              className="text-sm font-medium mb-2"
              style={{ color: "#f1f5f9", fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              {concept.subtopic}
            </p>
            <Link
              href={`/practice?concept=${concept.concept_id}`}
              className="block w-full py-1 rounded text-xs text-center"
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                color: "#ef4444",
                fontFamily: "var(--font-ibm-plex-mono)",
                textDecoration: "none",
              }}
            >
              Focus Today
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
