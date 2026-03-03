"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/db/supabase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface RoadmapPhase {
  phase: number;
  name: string;
  duration: string;
  daily_hours: number;
  focus: string[];
  key_topics: string[];
  milestone: string;
}

interface PrioritySubject {
  subject: string;
  reason: string;
  target_accuracy: number;
}

interface RoadmapData {
  phases: RoadmapPhase[];
  weekly_split: { concepts: number; practice: number; revision: number; mocks: number };
  priority_subjects: PrioritySubject[];
}

interface Profile {
  name: string | null;
  branch: string | null;
  level: string | null;
  target_rank: number | null;
  exam_month: string | null;
  daily_hours: number | null;
}

const PIE_COLORS = ["#f59e0b", "#10b981", "#818cf8", "#ef4444"];

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const supabase = createClient();

  const loadRoadmap = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("name, branch, level, target_rank, exam_month, daily_hours")
      .eq("id", user.id)
      .single();
    setProfile(prof);

    // Check for latest completed roadmap job
    const { data: job } = await supabase
      .from("llm_jobs")
      .select("id, status, output_payload")
      .eq("user_id", user.id)
      .eq("job_type", "roadmap_gen")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (job?.status === "completed" && job.output_payload) {
      setRoadmap(job.output_payload as RoadmapData);
    } else {
      // Any non-completed status (pending, processing, failed, or no job):
      // roadmapAgent has archetype_hash cache so returns instantly if profile unchanged
      await triggerGeneration();
    }
    setLoading(false);
  }, []);

  async function triggerGeneration() {
    setGenerating(true);
    const res = await fetch("/api/roadmap/generate", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
      }
    }
    setGenerating(false);
  }

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const examDate = profile?.exam_month ? new Date(profile.exam_month) : null;
  const monthsLeft = examDate
    ? Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)))
    : null;

  const pieData = roadmap
    ? [
        { name: "Concepts", value: roadmap.weekly_split.concepts },
        { name: "Practice", value: roadmap.weekly_split.practice },
        { name: "Revision", value: roadmap.weekly_split.revision },
        { name: "Mocks", value: roadmap.weekly_split.mocks },
      ]
    : [];

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
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-syne" style={{ color: "#f1f5f9" }}>Study Roadmap</h1>
          <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            Personalized for your level and goals
          </p>
        </div>
        <button
          onClick={triggerGeneration}
          disabled={generating}
          className="px-4 py-2 rounded text-sm"
          style={{
            background: "transparent",
            border: "1px solid #f59e0b",
            color: "#f59e0b",
            fontFamily: "var(--font-ibm-plex-mono)",
            cursor: generating ? "not-allowed" : "pointer",
            opacity: generating ? 0.5 : 1,
          }}
        >
          {generating ? "Generating..." : "Regenerate"}
        </button>
      </div>

      {/* Profile card */}
      {profile && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 rounded"
          style={{ background: "#111827", border: "1px solid #1e293b" }}
        >
          {[
            { label: "Branch", value: profile.branch ?? "CS" },
            { label: "Level", value: profile.level ?? "—" },
            { label: "Target", value: profile.target_rank ? `Top ${profile.target_rank}` : "—" },
            { label: "Time Left", value: monthsLeft !== null ? `${monthsLeft} months` : "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>{label}</p>
              <p className="text-sm font-semibold font-syne mt-0.5" style={{ color: "#f59e0b" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded"
          style={{ border: "1px dashed #1e293b" }}
        >
          <div className="flex gap-1 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full"
                style={{ background: "#f59e0b", animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <p className="text-sm" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
            Personalizing your roadmap...
          </p>
        </div>
      )}

      {/* Roadmap content */}
      {roadmap && !generating && (
        <>
          {/* Phase timeline */}
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
              STUDY PHASES
            </h2>

            {/* Phase tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {roadmap.phases.map((phase, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPhase(idx)}
                  className="flex-shrink-0 px-3 py-1.5 rounded text-xs"
                  style={{
                    background: currentPhase === idx ? "rgba(245,158,11,0.1)" : "#111827",
                    border: `1px solid ${currentPhase === idx ? "#f59e0b" : "#1e293b"}`,
                    color: currentPhase === idx ? "#f59e0b" : "#94a3b8",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    cursor: "pointer",
                  }}
                >
                  Phase {phase.phase}
                </button>
              ))}
            </div>

            {/* Active phase card */}
            {roadmap.phases[currentPhase] && (() => {
              const phase = roadmap.phases[currentPhase];
              return (
                <div className="p-5 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold font-syne" style={{ color: "#f1f5f9" }}>
                        Phase {phase.phase}: {phase.name}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                        {phase.duration} • {phase.daily_hours}h/day
                      </p>
                    </div>
                    <div
                      className="px-3 py-1 rounded text-xs"
                      style={{
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid #10b981",
                        color: "#10b981",
                        fontFamily: "var(--font-ibm-plex-mono)",
                      }}
                    >
                      {phase.milestone}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs mb-2" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                        FOCUS SUBJECTS
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {phase.focus.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded text-xs"
                            style={{
                              background: "rgba(245,158,11,0.1)",
                              border: "1px solid #f59e0b",
                              color: "#f59e0b",
                              fontFamily: "var(--font-ibm-plex-mono)",
                            }}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs mb-2" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                        KEY TOPICS
                      </p>
                      <ul className="space-y-0.5">
                        {phase.key_topics.map((t) => (
                          <li
                            key={t}
                            className="text-xs"
                            style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}
                          >
                            • {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottom row: pie chart + priority table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly split donut */}
            <div className="p-4 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
              <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                WEEKLY TIME SPLIT
              </h3>
              <div style={{ height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#111827",
                        border: "1px solid #1e293b",
                        fontFamily: "var(--font-ibm-plex-mono)",
                        fontSize: "12px",
                        color: "#f1f5f9",
                      }}
                      formatter={(v: number | undefined) => [`${v ?? 0}%`, ""]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)", fontSize: "11px" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority subjects table */}
            <div className="p-4 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
              <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                PRIORITY SUBJECTS
              </h3>
              <div className="space-y-3">
                {roadmap.priority_subjects.map((ps) => (
                  <div key={ps.subject} className="flex items-start gap-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs flex-shrink-0"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid #f59e0b",
                        color: "#f59e0b",
                        fontFamily: "var(--font-ibm-plex-mono)",
                      }}
                    >
                      {ps.subject}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                        {ps.reason}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#10b981", fontFamily: "var(--font-ibm-plex-mono)" }}>
                        Target: {ps.target_accuracy}% accuracy
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
