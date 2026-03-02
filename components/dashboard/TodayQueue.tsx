"use client";

import Link from "next/link";

interface QueueItem {
  concept_id: string;
  subject: string;
  topic: string;
  subtopic: string;
  mastery_score: number;
}

interface TodayQueueProps {
  items: QueueItem[];
}

function masteryColor(score: number) {
  if (score >= 75) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export function TodayQueue({ items }: TodayQueueProps) {
  if (items.length === 0) {
    return (
      <div
        className="p-8 rounded text-center"
        style={{ border: "1px dashed #1e293b" }}
      >
        <p className="text-sm" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
          No reviews due today. Great job staying on top of it!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.concept_id}
          href={`/practice?concept=${item.concept_id}`}
          className="block p-3 rounded transition-all hover:border-amber-500"
          style={{
            background: "#111827",
            border: "1px solid #1e293b",
            textDecoration: "none",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(245,158,11,0.1)",
                color: "#f59e0b",
                fontFamily: "var(--font-ibm-plex-mono)",
              }}
            >
              {item.subject}
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: masteryColor(item.mastery_score) }}
            >
              {item.mastery_score}
            </span>
          </div>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "#f1f5f9", fontFamily: "var(--font-ibm-plex-mono)" }}
          >
            {item.subtopic}
          </p>
          <p className="text-xs" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            {item.topic}
          </p>
          <button
            className="mt-2 w-full py-1 rounded text-xs"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid #f59e0b",
              color: "#f59e0b",
              fontFamily: "var(--font-ibm-plex-mono)",
              cursor: "pointer",
            }}
          >
            Practice Now →
          </button>
        </Link>
      ))}
    </div>
  );
}
