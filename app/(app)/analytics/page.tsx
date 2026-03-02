"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/db/supabase";
import { MasteryRadar } from "@/components/charts/MasteryRadar";
import { ScoreTrend } from "@/components/charts/ScoreTrend";
import { SubjectHeatmap } from "@/components/charts/SubjectHeatmap";

type Period = "7d" | "30d" | "all";
const SUBJECTS = ["OS", "CN", "DBMS", "Algorithms", "COA", "TOC", "DS", "Maths"];

interface AnalyticsData {
  stats: {
    masteredCount: number;
    accuracy: number;
    streak: number;
    predictedRank: number | null;
  };
  subjectMastery: Record<string, number>;
  weakConcepts: { concept_id: string; subject: string; subtopic: string; mastery_score: number }[];
  scoreTrend: { date: string; score: number }[];
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState("OS");
  const [subjectData, setSubjectData] = useState<Record<string, { topic: string; mastery_score: number }[]>>({});
  const [srHealth, setSrHealth] = useState({ dueToday: 0, dueThisWeek: 0, overdue: 0 });
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/analytics/summary?period=${period}`);
      if (res.ok) setData(await res.json());

      // Load subject heatmap data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: states } = await supabase
        .from("user_concept_state")
        .select("mastery_score, next_review, concepts!inner(subject, topic, subtopic)")
        .eq("user_id", user.id);

      // Build subject heatmap
      const heatmap: Record<string, { topic: string; mastery_score: number }[]> = {};
      const today = new Date().toISOString().split("T")[0];
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      let dueToday = 0, dueThisWeek = 0, overdue = 0;

      for (const row of (states ?? []) as any[]) {
        const subject = row.concepts.subject;
        const topic = row.concepts.subtopic;
        if (!heatmap[subject]) heatmap[subject] = [];
        heatmap[subject].push({ topic, mastery_score: row.mastery_score ?? 0 });

        const reviewDate = row.next_review;
        if (reviewDate < today) overdue++;
        else if (reviewDate === today) dueToday++;
        else if (reviewDate <= weekFromNow.toISOString().split("T")[0]) dueThisWeek++;
      }

      setSubjectData(heatmap);
      setSrHealth({ dueToday, dueThisWeek, overdue });
      setLoading(false);
    }
    load();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0a0e1a" }}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{ background: "#f59e0b", animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" style={{ background: "#0a0e1a", minHeight: "100vh" }}>
      {/* Header + period filter */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-syne" style={{ color: "#f1f5f9" }}>Analytics</h1>
          <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            Deep dive into your performance
          </p>
        </div>
        <div className="flex gap-1">
          {(["7d", "30d", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded text-xs"
              style={{
                background: period === p ? "rgba(245,158,11,0.1)" : "#111827",
                border: `1px solid ${period === p ? "#f59e0b" : "#1e293b"}`,
                color: period === p ? "#f59e0b" : "#94a3b8",
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: "pointer",
              }}
            >
              {p === "all" ? "All Time" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1 — Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Mastered", value: data?.stats.masteredCount ?? 0, color: "#10b981" },
          { label: "Accuracy", value: `${data?.stats.accuracy ?? 0}%`, color: "#f59e0b" },
          { label: "Streak", value: `${data?.stats.streak ?? 0}d`, color: "#818cf8" },
          { label: "Pred. Rank", value: data?.stats.predictedRank ? `~${data.stats.predictedRank.toLocaleString()}` : "N/A", color: "#f59e0b" },
          { label: "Due Today", value: srHealth.dueToday, color: "#f59e0b" },
          { label: "Overdue", value: srHealth.overdue, color: srHealth.overdue > 0 ? "#ef4444" : "#10b981" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
            <p className="text-xs" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>{label}</p>
            <p className="text-xl font-bold font-syne mt-1" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Section 2 — Mastery Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
          <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            MASTERY RADAR
          </h3>
          <div style={{ height: "250px" }}>
            <MasteryRadar data={data?.subjectMastery ?? {}} />
          </div>
        </div>
        <div className="p-4 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
          <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            MOCK SCORE TREND
          </h3>
          <div style={{ height: "250px" }}>
            <ScoreTrend data={data?.scoreTrend ?? []} />
          </div>
        </div>
      </div>

      {/* Section 3 — Subject Deep Dive */}
      <div className="mb-6 p-4 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
          SUBJECT DEEP DIVE
        </h3>
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSubject(s)}
              className="flex-shrink-0 px-3 py-1 rounded text-xs"
              style={{
                background: activeSubject === s ? "rgba(245,158,11,0.1)" : "#0a0e1a",
                border: `1px solid ${activeSubject === s ? "#f59e0b" : "#1e293b"}`,
                color: activeSubject === s ? "#f59e0b" : "#94a3b8",
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <SubjectHeatmap
          subject={activeSubject}
          data={subjectData[activeSubject] ?? []}
        />
      </div>

      {/* Section 5 — SR Health */}
      <div className="p-4 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
          SPACED REPETITION HEALTH
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "Due Today", value: srHealth.dueToday, color: "#f59e0b" },
            { label: "Due This Week", value: srHealth.dueThisWeek, color: "#818cf8" },
            { label: "Overdue", value: srHealth.overdue, color: srHealth.overdue > 0 ? "#ef4444" : "#10b981" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-3 rounded" style={{ background: "#0a0e1a", border: "1px solid #1e293b" }}>
              <p className="text-2xl font-bold font-syne" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>{label}</p>
            </div>
          ))}
        </div>
        {srHealth.overdue > 0 && (
          <div
            className="p-3 rounded text-xs"
            style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid #ef4444",
              color: "#f87171",
              fontFamily: "var(--font-ibm-plex-mono)",
            }}
          >
            ⚠ You have {srHealth.overdue} overdue concepts. Review them now to prevent forgetting!
          </div>
        )}
      </div>
    </div>
  );
}
