"use client";

import { useState, useEffect, useRef } from "react";
import { QuestionNavigator } from "@/components/mock/QuestionNavigator";
import { VirtualKeypad } from "@/components/mock/VirtualKeypad";
import { DebriefCard } from "@/components/mock/DebriefCard";
import Link from "next/link";

type MockState = "pre-test" | "in-test" | "submitting" | "debrief";

interface MockQuestion {
  id: string;
  question_text: string;
  options: { A: string; B: string; C: string; D: string } | null;
  question_type: "MCQ" | "NAT";
  difficulty: number;
  marks: 1 | 2;
}

interface MockResult {
  score: number;
  max_score: number;
  normalized_score: number;
  predicted_rank: number;
  debrief_job_id: string;
  breakdown: { correct: number; wrong: number; skipped: number };
}

const SUBJECTS = ["OS", "CN", "DBMS", "Algorithms", "COA", "TOC", "DS", "Maths"];

export default function MockPage() {
  const [mockState, setMockState] = useState<MockState>("pre-test");
  const [testType, setTestType] = useState<"full" | "subject" | "speed">("speed");
  const [selectedSubject, setSelectedSubject] = useState("OS");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | null>>(new Map());
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<MockResult | null>(null);
  const [debriefData, setDebriefData] = useState<any | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [natValue, setNatValue] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) ?? null : null;

  // Timer
  useEffect(() => {
    if (mockState !== "in-test") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mockState]);

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;
  }

  async function startTest() {
    const res = await fetch("/api/mock/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: testType,
        subject: testType === "subject" ? selectedSubject : undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }

    const data = await res.json();
    setQuestions(data.questions);
    setSessionId(data.session_id);
    setTimeLeft(data.time_minutes * 60);
    setAnswers(new Map());
    setCurrentIndex(0);
    setStartTime(new Date());
    setMockState("in-test");
  }

  function setAnswer(questionId: string, answer: string | null) {
    setAnswers((prev) => new Map(prev).set(questionId, answer));
  }

  function toggleMark() {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  }

  async function handleSubmit() {
    if (!sessionId || !startTime) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setMockState("submitting");

    const timeTaken = Math.round((Date.now() - startTime.getTime()) / 1000);
    const submittedAnswers = questions.map((q) => ({
      question_id: q.id,
      answer: answers.get(q.id) ?? null,
    }));

    const res = await fetch("/api/mock/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        answers: submittedAnswers,
        time_taken_sec: timeTaken,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult(data);
      setMockState("debrief");

      // Poll for debrief
      if (data.debrief_job_id) {
        setDebriefLoading(true);
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch(`/api/roadmap/status?job_id=${data.debrief_job_id}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status === "completed" && statusData.roadmap_json) {
              setDebriefData(statusData.roadmap_json);
              setDebriefLoading(false);
              clearInterval(pollInterval);
            } else if (statusData.status === "failed") {
              setDebriefLoading(false);
              clearInterval(pollInterval);
            }
          }
        }, 3000);
      }
    }
  }

  function getQuestionStatus(idx: number): "unattempted" | "answered" | "marked" {
    if (markedForReview.has(idx)) return "marked";
    const q = questions[idx];
    if (q && answers.has(q.id) && answers.get(q.id) !== null) return "answered";
    return "unattempted";
  }

  const statuses = questions.map((_, i) => getQuestionStatus(i));

  // ── PRE-TEST ──
  if (mockState === "pre-test") {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center" style={{ background: "#0a0e1a" }}>
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-bold font-syne mb-1" style={{ color: "#f1f5f9" }}>Mock Test</h1>
          <p className="text-xs mb-6" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            Simulate the GATE CS exam experience
          </p>

          <div className="space-y-4 mb-6">
            {[
              { type: "speed" as const, label: "Speed Round", desc: "10 questions • 15 min", badge: "FREE", badgeColor: "#10b981" },
              { type: "subject" as const, label: "Subject Test", desc: "20 questions • 60 min (2/day)", badge: "FREE", badgeColor: "#10b981" },
              { type: "full" as const, label: "Full Mock Test", desc: "65 questions • 180 min (3/day)", badge: "PAID", badgeColor: "#818cf8" },
            ].map(({ type, label, desc, badge, badgeColor }) => (
              <button
                key={type}
                onClick={() => setTestType(type)}
                className="w-full p-4 rounded text-left transition-all"
                style={{
                  background: testType === type ? "rgba(245,158,11,0.08)" : "#111827",
                  border: `1px solid ${testType === type ? "#f59e0b" : "#1e293b"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold font-syne" style={{ color: "#f1f5f9" }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>{desc}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${badgeColor}20`, border: `1px solid ${badgeColor}`, color: badgeColor, fontFamily: "var(--font-ibm-plex-mono)" }}>
                    {badge}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {testType === "subject" && (
            <div className="mb-4">
              <label className="block text-xs mb-2" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                SELECT SUBJECT
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSubject(s)}
                    className="py-1.5 rounded text-xs"
                    style={{
                      background: selectedSubject === s ? "rgba(245,158,11,0.1)" : "#111827",
                      border: `1px solid ${selectedSubject === s ? "#f59e0b" : "#1e293b"}`,
                      color: selectedSubject === s ? "#f59e0b" : "#94a3b8",
                      fontFamily: "var(--font-ibm-plex-mono)",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          <div className="mb-6 p-3 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
            <p className="text-xs mb-2" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>MARKING SCHEME</p>
            <div className="flex gap-4 text-xs" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
              <span style={{ color: "#10b981" }}>+1 / +2 correct</span>
              <span style={{ color: "#ef4444" }}>-0.33 / -0.67 wrong</span>
              <span style={{ color: "#475569" }}>0 skipped</span>
            </div>
          </div>

          <button
            onClick={startTest}
            className="w-full py-3 rounded text-sm font-medium font-syne"
            style={{
              background: "#f59e0b",
              color: "#0a0e1a",
              cursor: "pointer",
            }}
          >
            Start Test →
          </button>
        </div>
      </div>
    );
  }

  // ── IN TEST ──
  if (mockState === "in-test" && currentQuestion) {
    return (
      <div className="flex flex-col h-screen" style={{ background: "#0a0e1a" }}>
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: "#111827", borderBottom: "1px solid #1e293b" }}
        >
          <div className="flex items-center gap-4">
            <span className="font-bold font-syne text-sm" style={{ color: "#f59e0b" }}>
              GATEprep
            </span>
            <span className="text-xs" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
              Q {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <div
            className="text-sm font-mono font-bold"
            style={{ color: timeLeft < 300 ? "#ef4444" : "#f59e0b" }}
          >
            {formatTime(timeLeft)}
          </div>

          <button
            onClick={() => { if (confirm("Submit the test now?")) handleSubmit(); }}
            className="px-3 py-1.5 rounded text-xs"
            style={{
              background: "#ef4444",
              color: "#fff",
              fontFamily: "var(--font-ibm-plex-mono)",
              cursor: "pointer",
            }}
          >
            Submit Test
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Question navigator */}
          <QuestionNavigator
            total={questions.length}
            currentIndex={currentIndex}
            statuses={statuses}
            onNavigate={setCurrentIndex}
          />

          {/* Main question area */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Question header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b", color: "#f59e0b", fontFamily: "var(--font-ibm-plex-mono)" }}>
                {currentQuestion.marks} mark{currentQuestion.marks > 1 ? "s" : ""}
              </span>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#1e293b", color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                {currentQuestion.question_type}
              </span>
            </div>

            {/* Question text */}
            <div
              className="p-4 rounded mb-5 text-sm leading-relaxed"
              style={{ background: "#111827", border: "1px solid #1e293b", color: "#f1f5f9", fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              {currentQuestion.question_text}
            </div>

            {/* MCQ Options */}
            {currentQuestion.question_type === "MCQ" && currentQuestion.options && (
              <div className="space-y-2">
                {(["A", "B", "C", "D"] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setAnswer(currentQuestion.id, key)}
                    className="w-full p-3 rounded text-sm text-left transition-all"
                    style={{
                      background: currentAnswer === key ? "rgba(245,158,11,0.1)" : "#111827",
                      border: `1px solid ${currentAnswer === key ? "#f59e0b" : "#1e293b"}`,
                      color: currentAnswer === key ? "#f59e0b" : "#f1f5f9",
                      fontFamily: "var(--font-ibm-plex-mono)",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ color: "#f59e0b", fontWeight: 600, marginRight: "8px" }}>{key}.</span>
                    {currentQuestion.options![key]}
                  </button>
                ))}
              </div>
            )}

            {/* NAT */}
            {currentQuestion.question_type === "NAT" && (
              <VirtualKeypad
                value={currentAnswer ?? ""}
                onChange={(v) => setAnswer(currentQuestion.id, v || null)}
              />
            )}

            {/* Bottom controls */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded text-xs"
                style={{
                  background: "transparent",
                  border: "1px solid #1e293b",
                  color: "#94a3b8",
                  fontFamily: "var(--font-ibm-plex-mono)",
                  cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                  opacity: currentIndex === 0 ? 0.4 : 1,
                }}
              >
                ← Prev
              </button>
              <button
                onClick={toggleMark}
                className="px-4 py-2 rounded text-xs"
                style={{
                  background: markedForReview.has(currentIndex) ? "rgba(245,158,11,0.1)" : "transparent",
                  border: `1px solid ${markedForReview.has(currentIndex) ? "#f59e0b" : "#1e293b"}`,
                  color: markedForReview.has(currentIndex) ? "#f59e0b" : "#94a3b8",
                  fontFamily: "var(--font-ibm-plex-mono)",
                  cursor: "pointer",
                }}
              >
                {markedForReview.has(currentIndex) ? "★ Marked" : "☆ Mark"}
              </button>
              <button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={currentIndex === questions.length - 1}
                className="flex-1 py-2 rounded text-xs"
                style={{
                  background: "#f59e0b",
                  color: "#0a0e1a",
                  fontFamily: "var(--font-ibm-plex-mono)",
                  cursor: currentIndex === questions.length - 1 ? "not-allowed" : "pointer",
                  opacity: currentIndex === questions.length - 1 ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SUBMITTING ──
  if (mockState === "submitting") {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0a0e1a" }}>
        <div className="text-center">
          <div className="flex gap-1 justify-center mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full"
                style={{ background: "#f59e0b", animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <p style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)", fontSize: "14px" }}>
            Calculating your score...
          </p>
        </div>
      </div>
    );
  }

  // ── DEBRIEF ──
  if (mockState === "debrief" && result) {
    const percentage = result.max_score > 0 ? (result.score / result.max_score) * 100 : 0;

    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto" style={{ background: "#0a0e1a", minHeight: "100vh" }}>
        <h1 className="text-2xl font-bold font-syne mb-6" style={{ color: "#f1f5f9" }}>Test Complete</h1>

        {/* Score card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="col-span-1 p-5 rounded" style={{ background: "#111827", border: "1px solid #f59e0b" }}>
            <p className="text-xs mb-1" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>SCORE</p>
            <p className="text-3xl font-bold font-syne" style={{ color: "#f59e0b" }}>
              {result.score.toFixed(2)}
            </p>
            <p className="text-xs mt-1" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
              out of {result.max_score.toFixed(0)} ({percentage.toFixed(1)}%)
            </p>
          </div>
          <div className="p-5 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
            <p className="text-xs mb-1" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>PREDICTED RANK</p>
            <p className="text-3xl font-bold font-syne" style={{ color: "#818cf8" }}>
              ~{result.predicted_rank.toLocaleString()}
            </p>
          </div>
          <div className="p-5 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
            <p className="text-xs mb-3" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>BREAKDOWN</p>
            <div className="space-y-1 text-xs" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
              <p style={{ color: "#10b981" }}>✓ {result.breakdown.correct ?? 0} correct</p>
              <p style={{ color: "#ef4444" }}>✗ {result.breakdown.wrong ?? 0} wrong</p>
              <p style={{ color: "#475569" }}>— {result.breakdown.skipped ?? 0} skipped</p>
            </div>
          </div>
        </div>

        {/* AI Debrief */}
        <div className="mb-6">
          <DebriefCard data={debriefData} loading={debriefLoading} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setMockState("pre-test");
              setResult(null);
              setDebriefData(null);
              setQuestions([]);
            }}
            className="px-5 py-2.5 rounded text-sm"
            style={{
              background: "#f59e0b",
              color: "#0a0e1a",
              fontFamily: "var(--font-ibm-plex-mono)",
              cursor: "pointer",
            }}
          >
            Take Another Mock
          </button>
          <Link
            href="/practice"
            className="px-5 py-2.5 rounded text-sm"
            style={{
              background: "transparent",
              border: "1px solid #1e293b",
              color: "#94a3b8",
              fontFamily: "var(--font-ibm-plex-mono)",
              textDecoration: "none",
            }}
          >
            Practice Weak Areas
          </Link>
          <Link
            href="/analytics"
            className="px-5 py-2.5 rounded text-sm"
            style={{
              background: "transparent",
              border: "1px solid #818cf8",
              color: "#818cf8",
              fontFamily: "var(--font-ibm-plex-mono)",
              textDecoration: "none",
            }}
          >
            View Analytics
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
