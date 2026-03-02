"use client";

interface HeatmapCell {
  topic: string;
  mastery_score: number;
}

interface SubjectHeatmapProps {
  data: HeatmapCell[];
  subject: string;
}

function cellColor(score: number): string {
  if (score === 0) return "#1e293b";
  if (score < 40) return "#7f1d1d";
  if (score < 60) return "#92400e";
  if (score < 75) return "#78350f";
  return "#064e3b";
}

function textColor(score: number): string {
  if (score === 0) return "#475569";
  if (score < 40) return "#fca5a5";
  if (score < 75) return "#fcd34d";
  return "#6ee7b7";
}

export function SubjectHeatmap({ data, subject }: SubjectHeatmapProps) {
  if (data.length === 0) {
    return (
      <p className="text-xs text-center py-8" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
        No practice data for {subject} yet
      </p>
    );
  }

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
      {data.map((cell) => (
        <div
          key={cell.topic}
          className="p-3 rounded"
          style={{ background: cellColor(cell.mastery_score) }}
        >
          <p className="text-xs font-medium" style={{ color: textColor(cell.mastery_score), fontFamily: "var(--font-ibm-plex-mono)" }}>
            {cell.topic}
          </p>
          <p className="text-lg font-bold font-syne mt-1" style={{ color: textColor(cell.mastery_score) }}>
            {cell.mastery_score}
          </p>
        </div>
      ))}
    </div>
  );
}
