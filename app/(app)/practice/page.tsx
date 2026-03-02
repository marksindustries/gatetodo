"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/db/supabase";
import { ConceptSidebar } from "@/components/practice/ConceptSidebar";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { SolutionPanel } from "@/components/practice/SolutionPanel";
import { MasteryGauge } from "@/components/practice/MasteryGauge";
import type { Concept, GeneratedQuestion } from "@/lib/db/types";

interface ConceptWithMastery extends Concept {
  mastery_score?: number;
  next_review?: string;
}

type PracticeState =
  | "idle"
  | "loading"
  | "question"
  | "revealed"
  | "explaining";

export default function PracticePage() {
  const [conceptTree, setConceptTree] = useState<
    Record<string, Record<string, ConceptWithMastery[]>>
  >({});
  const [selectedConcept, setSelectedConcept] = useState<ConceptWithMastery | null>(null);
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [evaluationResult, setEvaluationResult] = useState<{
    correct: boolean;
    correctAnswer: string;
    solution: string;
  } | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [masteryScore, setMasteryScore] = useState(0);
  const [recentAttempts, setRecentAttempts] = useState<boolean[]>([]);
  const [difficulty, setDifficulty] = useState(3);
  const [sessionStats, setSessionStats] = useState({ questionsToday: 0, accuracyToday: 0 });
  const [questionType, setQuestionType] = useState<"MCQ" | "NAT">("MCQ");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showTopicDrawer, setShowTopicDrawer] = useState(false);

  const supabase = createClient();

  // Load concept tree with mastery data
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all concepts
      const { data: concepts } = await supabase
        .from("concepts")
        .select("*")
        .order("subject");

      if (!concepts) return;

      // Fetch user mastery states
      const { data: states } = await supabase
        .from("user_concept_state")
        .select("concept_id, mastery_score, next_review")
        .eq("user_id", user.id);

      const masteryMap = new Map(
        (states ?? []).map((s) => [s.concept_id, s])
      );

      // Build tree
      const tree: Record<string, Record<string, ConceptWithMastery[]>> = {};
      for (const concept of concepts) {
        const state = masteryMap.get(concept.id);
        const enriched: ConceptWithMastery = {
          ...concept,
          mastery_score: state?.mastery_score ?? 0,
          next_review: state?.next_review,
        };
        if (!tree[concept.subject]) tree[concept.subject] = {};
        if (!tree[concept.subject][concept.topic]) {
          tree[concept.subject][concept.topic] = [];
        }
        tree[concept.subject][concept.topic].push(enriched);
      }
      setConceptTree(tree);

      // Session stats
      const today = new Date().toISOString().split("T")[0];
      const { data: todayAttempts } = await supabase
        .from("user_attempts")
        .select("is_correct")
        .eq("user_id", user.id)
        .gte("attempted_at", today);

      const total = todayAttempts?.length ?? 0;
      const correct = todayAttempts?.filter((a) => a.is_correct).length ?? 0;
      setSessionStats({
        questionsToday: total,
        accuracyToday: total > 0 ? Math.round((correct / total) * 100) : 0,
      });
    }
    load();
  }, []);

  async function handleConceptSelect(concept: ConceptWithMastery) {
    setSelectedConcept(concept);
    setMasteryScore(concept.mastery_score ?? 0);
    setQuestion(null);
    setEvaluationResult(null);
    setExplanation(null);
    setFeedbackSubmitted(false);
    setPracticeState("loading");

    const res = await fetch("/api/questions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        concept_id: concept.id,
        difficulty,
        type: questionType,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setQuestion(data.question);
      setPracticeState("question");
    } else {
      setPracticeState("idle");
    }
  }

  async function handleSubmit(answer: string) {
    if (!question) return;
    setPracticeState("loading");

    const res = await fetch("/api/questions/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: question.id,
        user_answer: answer,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setEvaluationResult({
        correct: data.correct,
        correctAnswer: data.correctAnswer,
        solution: data.solution,
      });
      setMasteryScore(data.sm2Update.mastery_score);
      setRecentAttempts((prev) => [data.correct, ...prev].slice(0, 5));
      setPracticeState("revealed");

      // Update session stats
      setSessionStats((prev) => ({
        questionsToday: prev.questionsToday + 1,
        accuracyToday: data.correct
          ? Math.round(((prev.questionsToday * prev.accuracyToday / 100 + 1) / (prev.questionsToday + 1)) * 100)
          : Math.round(((prev.questionsToday * prev.accuracyToday / 100) / (prev.questionsToday + 1)) * 100),
      }));
    }
  }

  async function handleFeedback(feedback: "easy" | "good" | "hard") {
    if (!question || feedbackSubmitted) return;
    setFeedbackSubmitted(true);

    const qualityMap = { easy: 5, good: 4, hard: 3 };
    await fetch("/api/questions/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: question.id,
        user_answer: evaluationResult?.correctAnswer ?? "",
        sm2_quality: qualityMap[feedback],
      }),
    });
  }

  async function handleNext() {
    if (!selectedConcept) return;
    await handleConceptSelect(selectedConcept);
  }

  async function handleExplain() {
    if (!selectedConcept || !question) return;
    setPracticeState("explaining");

    const res = await fetch(`/api/tutor/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Explain: ${selectedConcept.subtopic}`,
        history: [],
        concept_id: selectedConcept.id,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setExplanation(data.answer);
    }
    setPracticeState(evaluationResult ? "revealed" : "question");
  }

  function handleSkip() {
    if (!selectedConcept) return;
    handleConceptSelect(selectedConcept);
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a0e1a" }}>
      {/* Left panel — concept selector (desktop: always visible, mobile: drawer overlay) */}
      <div
        className={`
          md:flex md:static md:z-auto
          ${showTopicDrawer
            ? "flex fixed inset-0 z-40"
            : "hidden"
          }
        `}
        style={{ background: "#0a0e1a" }}
      >
        {/* Backdrop for mobile */}
        <div
          className="absolute inset-0 bg-black/60 md:hidden"
          onClick={() => setShowTopicDrawer(false)}
        />
        <div className="relative z-10 flex-shrink-0">
          <ConceptSidebar
            conceptTree={conceptTree}
            selectedConceptId={selectedConcept?.id ?? null}
            onSelect={(concept) => {
              handleConceptSelect(concept);
              setShowTopicDrawer(false);
            }}
            sessionStats={sessionStats}
          />
        </div>
      </div>

      {/* Right panel — question area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main question area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {/* Mobile: Topics toggle button */}
          <div className="flex items-center gap-2 mb-3 md:hidden">
            <button
              onClick={() => setShowTopicDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid #f59e0b",
                color: "#f59e0b",
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: "pointer",
              }}
            >
              ☰ Topics
            </button>
            {selectedConcept && (
              <span className="text-xs truncate" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                {selectedConcept.subtopic}
              </span>
            )}
          </div>

          {/* Breadcrumb + controls */}
          {selectedConcept && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="hidden md:flex items-center gap-2 text-xs" style={{ fontFamily: "var(--font-ibm-plex-mono)", color: "#475569" }}>
                <span style={{ color: "#f59e0b" }}>{selectedConcept.subject}</span>
                <span>›</span>
                <span style={{ color: "#94a3b8" }}>{selectedConcept.topic}</span>
                <span>›</span>
                <span style={{ color: "#f1f5f9" }}>{selectedConcept.subtopic}</span>
              </div>

              {/* Difficulty + type controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  Diff:
                </span>
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className="w-6 h-6 rounded text-xs"
                    style={{
                      background: difficulty === d ? "#f59e0b" : "#1e293b",
                      color: difficulty === d ? "#0a0e1a" : "#94a3b8",
                      fontFamily: "var(--font-ibm-plex-mono)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={() => setQuestionType((t) => t === "MCQ" ? "NAT" : "MCQ")}
                  className="px-2 py-0.5 rounded text-xs ml-2"
                  style={{
                    background: "rgba(129,140,248,0.1)",
                    border: "1px solid #818cf8",
                    color: "#818cf8",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    cursor: "pointer",
                  }}
                >
                  {questionType}
                </button>
              </div>
            </div>
          )}

          {/* Concept quick reference */}
          {selectedConcept && (
            <details className="mb-4 rounded" style={{ border: "1px solid #1e293b" }}>
              <summary
                className="px-4 py-2.5 text-xs cursor-pointer"
                style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)", background: "#111827" }}
              >
                CONCEPT REFERENCE — {selectedConcept.subtopic}
              </summary>
              <div className="p-4" style={{ background: "#0a0e1a" }}>
                <p className="text-sm mb-2" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  {selectedConcept.description}
                </p>
                {selectedConcept.exam_tips && (
                  <div
                    className="mt-2 p-2 rounded text-xs"
                    style={{
                      background: "rgba(16,185,129,0.05)",
                      border: "1px solid #10b981",
                      color: "#10b981",
                      fontFamily: "var(--font-ibm-plex-mono)",
                    }}
                  >
                    Exam tip: {selectedConcept.exam_tips}
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Question area */}
          {practiceState === "idle" && (
            <div
              className="flex flex-col items-center justify-center h-96 rounded"
              style={{ border: "1px dashed #1e293b", color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              <div className="text-4xl mb-3" style={{ opacity: 0.3 }}>⟨/⟩</div>
              <p className="text-sm">Select a concept to start practicing</p>
            </div>
          )}

          {practiceState === "loading" && (
            <div
              className="flex flex-col items-center justify-center h-96 rounded"
              style={{ border: "1px solid #1e293b" }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "#f59e0b",
                      animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                Loading question...
              </p>
            </div>
          )}

          {(practiceState === "question" || practiceState === "revealed" || practiceState === "explaining") && question && (
            <QuestionCard
              questionText={question.question_text}
              questionType={question.question_type as "MCQ" | "NAT"}
              options={question.options as any}
              difficulty={question.difficulty}
              marks={question.marks as 1 | 2}
              revealed={practiceState === "revealed"}
              correctAnswer={evaluationResult?.correctAnswer}
              onSubmit={handleSubmit}
              onExplain={handleExplain}
              onSkip={handleSkip}
            />
          )}

          {/* Solution panel */}
          {practiceState === "revealed" && evaluationResult && (
            <SolutionPanel
              solution={evaluationResult.solution}
              correctAnswer={evaluationResult.correctAnswer}
              isCorrect={evaluationResult.correct}
              onFeedback={handleFeedback}
              onNext={handleNext}
              showFeedback={evaluationResult.correct && !feedbackSubmitted}
            />
          )}

          {/* Explanation panel */}
          {explanation && (
            <div
              className="mt-4 p-4 rounded"
              style={{ background: "rgba(129,140,248,0.05)", border: "1px solid #818cf8" }}
            >
              <p className="text-xs mb-2" style={{ color: "#818cf8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                AI EXPLANATION
              </p>
              <p className="text-sm" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                {explanation}
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div
          className="hidden md:block w-48 p-4 overflow-y-auto"
          style={{ borderLeft: "1px solid #1e293b", background: "#111827" }}
        >
          {selectedConcept && (
            <>
              <p className="text-xs mb-3" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                MASTERY
              </p>
              <div className="flex justify-center mb-4">
                <MasteryGauge score={masteryScore} size={80} label={selectedConcept.subtopic} />
              </div>

              {recentAttempts.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs mb-2" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                    RECENT
                  </p>
                  <div className="flex gap-1">
                    {recentAttempts.map((correct, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full"
                        style={{ background: correct ? "#10b981" : "#ef4444" }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
