"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ScorePoint {
  date: string;
  score: number;
  rank?: number;
}

interface ScoreTrendProps {
  data: ScorePoint[];
}

export function ScoreTrend({ data }: ScoreTrendProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)", fontSize: "12px" }}
      >
        Take a mock test to see your score trend
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#475569", fontSize: 10, fontFamily: "var(--font-ibm-plex-mono)" }}
          axisLine={{ stroke: "#1e293b" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#475569", fontSize: 10, fontFamily: "var(--font-ibm-plex-mono)" }}
          axisLine={{ stroke: "#1e293b" }}
          tickLine={false}
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
          formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}`, "Score"]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#f59e0b" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
