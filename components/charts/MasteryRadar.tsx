"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MasteryRadarProps {
  data: Record<string, number>;
}

export function MasteryRadar({ data }: MasteryRadarProps) {
  const chartData = Object.entries(data).map(([subject, score]) => ({
    subject,
    score,
    fullMark: 100,
  }));

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)", fontSize: "12px" }}
      >
        No data yet — start practicing!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={chartData}>
        <PolarGrid stroke="#1e293b" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "var(--font-ibm-plex-mono)" }}
        />
        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #1e293b",
            borderRadius: "4px",
            fontFamily: "var(--font-ibm-plex-mono)",
            fontSize: "12px",
            color: "#f1f5f9",
          }}
          formatter={(value: number | undefined) => [`${value ?? 0}%`, "Mastery"]}
        />
        <Radar
          dataKey="score"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
