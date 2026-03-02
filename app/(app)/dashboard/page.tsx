"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db/supabase";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodayQueue } from "@/components/dashboard/TodayQueue";
import { WeakAlerts } from "@/components/dashboard/WeakAlerts";
import { MasteryRadar } from "@/components/charts/MasteryRadar";
import { ScoreTrend } from "@/components/charts/ScoreTrend";
import Link from "next/link";

interface DashboardData {
  stats: {
    masteredCount: number;
    accuracy: number;
    streak: number;
    predictedRank: number | null;
  };
  subjectMastery: Record<string, number>;
  weakConcepts: {
    concept_id: string;
    subject: string;
    topic: string;
    subtopic: string;
    mastery_score: number;
  }[];
  dueToday: {
    concept_id: string;
    subject: string;
    topic: string;
    subtopic: string;
    mastery_score: number;
  }[];
  scoreTrend: { date: string; score: number }[];
}

const SUBJECTS = ["OS", "CN", "DBMS", "Algorithms", "COA", "TOC", "DS", "Maths"];

function subjectColor(score: number) {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [userName, setUserName] = useState("there");
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile for name and exam date
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, exam_month")
        .eq("id", user.id)
        .single();

      if (profile?.name) setUserName(profile.name.split(" ")[0]);
      if (profile?.exam_month) setExamDate(new Date(profile.exam_month));

      // Fetch dashboard summary
      const res = await fetch("/api/analytics/summary?period=30d");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    }
    load();
  }, []);

  const daysUntilExam = examDate
    ? Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / 86400000))
    : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0a0e1a" }}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: "#f59e0b", animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" style={{ background: "#0a0e1a", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-syne" style={{ color: "#f1f5f9" }}>
            {greeting},{" "}
            <span style={{ color: "#f59e0b" }}>{userName}</span>
          </h1>
          <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Streak badge */}
          {data && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b" }}
            >
              <span style={{ fontSize: "13px" }}>🔥</span>
              <span className="text-xs font-bold" style={{ color: "#f59e0b", fontFamily: "var(--font-ibm-plex-mono)" }}>
                {data.stats.streak}d streak
              </span>
            </div>
          )}
          {/* Countdown */}
          {daysUntilExam !== null && (
            <div
              className="px-2.5 py-1 rounded"
              style={{ background: "rgba(129,140,248,0.1)", border: "1px solid #818cf8" }}
            >
              <span className="text-xs" style={{ color: "#818cf8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                {daysUntilExam}d to GATE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Row 1 — Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Concepts Mastered"
          value={data?.stats.masteredCount ?? 0}
          subtext="mastery score > 75"
          accent="emerald"
          icon="✓"
        />
        <StatCard
          label="Overall Accuracy"
          value={`${data?.stats.accuracy ?? 0}%`}
          subtext="last 30 days"
          accent="amber"
          icon="◎"
        />
        <StatCard
          label="Study Streak"
          value={`${data?.stats.streak ?? 0}d`}
          subtext="consecutive days"
          accent="indigo"
          icon="⚡"
        />
        <StatCard
          label="Predicted Rank"
          value={data?.stats.predictedRank ? `~${data.stats.predictedRank.toLocaleString()}` : "N/A"}
          subtext="based on last mock"
          accent="amber"
          icon="⬆"
        />
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        <div className="p-4 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
          <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            MASTERY RADAR
          </h3>
          <div style={{ height: "220px" }}>
            <MasteryRadar data={data?.subjectMastery ?? {}} />
          </div>
        </div>
        <div className="p-4 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
          <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            MOCK SCORE TREND
          </h3>
          <div style={{ height: "220px" }}>
            <ScoreTrend data={data?.scoreTrend ?? []} />
          </div>
        </div>
      </div>

      {/* Row 3 — Today's Queue */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            TODAY'S REVIEW QUEUE
          </h3>
          <Link
            href="/practice"
            className="text-xs"
            style={{ color: "#f59e0b", fontFamily: "var(--font-ibm-plex-mono)", textDecoration: "none" }}
          >
            View all →
          </Link>
        </div>
        <TodayQueue
          items={(data?.dueToday ?? []).map((c) => ({
            concept_id: c.concept_id,
            subject: c.subject,
            topic: c.topic,
            subtopic: c.subtopic,
            mastery_score: c.mastery_score ?? 0,
          }))}
        />
      </div>

      {/* Row 4 — Weak Areas */}
      {data?.weakConcepts && data.weakConcepts.length > 0 && (
        <div className="mb-6">
          <WeakAlerts
            concepts={data.weakConcepts.map((c) => ({
              concept_id: c.concept_id,
              subject: c.subject,
              topic: c.topic,
              subtopic: c.subtopic,
              mastery_score: c.mastery_score,
            }))}
          />
        </div>
      )}

      {/* Row 5 — Subject Progress */}
      <div className="p-4 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
          SUBJECT PROGRESS
        </h3>
        <div className="space-y-3">
          {SUBJECTS.map((subject) => {
            const score = data?.subjectMastery?.[subject] ?? 0;
            return (
              <div key={subject}>
                <div className="flex justify-between text-xs mb-1" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                  <span style={{ color: "#94a3b8" }}>{subject}</span>
                  <span style={{ color: subjectColor(score) }}>{score}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "#1e293b" }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${score}%`,
                      background: subjectColor(score),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
