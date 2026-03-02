"use client";

import { useState } from "react";
import type { Concept } from "@/lib/db/types";
import { MasteryGauge } from "./MasteryGauge";

interface ConceptWithMastery extends Concept {
  mastery_score?: number;
  next_review?: string;
}

interface ConceptSidebarProps {
  conceptTree: Record<string, Record<string, ConceptWithMastery[]>>;
  selectedConceptId: string | null;
  onSelect: (concept: ConceptWithMastery) => void;
  sessionStats: { questionsToday: number; accuracyToday: number };
}

const SUBJECT_ORDER = ["Maths", "Algorithms", "OS", "CN", "DBMS", "COA", "TOC", "DS"];

export function ConceptSidebar({
  conceptTree,
  selectedConceptId,
  onSelect,
  sessionStats,
}: ConceptSidebarProps) {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>(
    Object.fromEntries(SUBJECT_ORDER.map((s) => [s, false]))
  );
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  function toggleSubject(subject: string) {
    setExpandedSubjects((prev) => ({ ...prev, [subject]: !prev[subject] }));
  }

  function toggleTopic(key: string) {
    setExpandedTopics((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function getMasteryColor(score?: number) {
    if (!score) return "#475569";
    if (score >= 75) return "#10b981";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  }

  // Find weakest due concept for "Surprise Me"
  function surpriseMe() {
    let weakest: ConceptWithMastery | null = null;
    let lowestScore = Infinity;

    for (const subject of Object.values(conceptTree)) {
      for (const concepts of Object.values(subject)) {
        for (const concept of concepts) {
          const score = concept.mastery_score ?? 50;
          if (score < lowestScore) {
            lowestScore = score;
            weakest = concept;
          }
        }
      }
    }

    if (weakest) onSelect(weakest);
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ width: "280px", borderRight: "1px solid #1e293b", background: "#111827" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid #1e293b" }}
      >
        <span className="text-sm font-semibold font-syne" style={{ color: "#f1f5f9" }}>
          Concepts
        </span>
        <button
          onClick={surpriseMe}
          className="text-xs px-2 py-1 rounded transition-all"
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid #f59e0b",
            color: "#f59e0b",
            fontFamily: "var(--font-ibm-plex-mono)",
            cursor: "pointer",
          }}
        >
          Surprise Me
        </button>
      </div>

      {/* Subject accordion */}
      <div className="flex-1 overflow-y-auto">
        {SUBJECT_ORDER.map((subject) => {
          if (!conceptTree[subject]) return null;
          const isOpen = expandedSubjects[subject];

          return (
            <div key={subject}>
              <button
                onClick={() => toggleSubject(subject)}
                className="w-full px-4 py-2.5 flex items-center justify-between transition-colors"
                style={{
                  background: isOpen ? "rgba(245,158,11,0.05)" : "transparent",
                  borderBottom: "1px solid #1e293b",
                  cursor: "pointer",
                }}
              >
                <span
                  className="text-xs font-medium"
                  style={{
                    color: isOpen ? "#f59e0b" : "#94a3b8",
                    fontFamily: "var(--font-ibm-plex-mono)",
                  }}
                >
                  {subject}
                </span>
                <span style={{ color: "#475569", fontSize: "10px" }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {isOpen &&
                Object.entries(conceptTree[subject]).map(([topic, concepts]) => {
                  const topicKey = `${subject}:${topic}`;
                  const isTopicOpen = expandedTopics[topicKey];

                  return (
                    <div key={topic}>
                      <button
                        onClick={() => toggleTopic(topicKey)}
                        className="w-full px-6 py-2 flex items-center justify-between"
                        style={{
                          background: "transparent",
                          borderBottom: "1px solid #1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          className="text-xs"
                          style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}
                        >
                          {topic}
                        </span>
                        <span style={{ color: "#475569", fontSize: "10px" }}>
                          {isTopicOpen ? "▲" : "▼"}
                        </span>
                      </button>

                      {isTopicOpen &&
                        concepts.map((concept) => (
                          <button
                            key={concept.id}
                            onClick={() => onSelect(concept)}
                            className="w-full px-8 py-2.5 flex items-center justify-between transition-all"
                            style={{
                              background:
                                selectedConceptId === concept.id
                                  ? "rgba(245,158,11,0.08)"
                                  : "transparent",
                              borderBottom: "1px solid #1e293b",
                              borderLeft:
                                selectedConceptId === concept.id
                                  ? "2px solid #f59e0b"
                                  : "2px solid transparent",
                              cursor: "pointer",
                            }}
                          >
                            <span
                              className="text-xs text-left flex-1 mr-2"
                              style={{ color: "#f1f5f9", fontFamily: "var(--font-ibm-plex-mono)" }}
                            >
                              {concept.subtopic}
                            </span>
                            <span
                              className="text-xs font-mono"
                              style={{ color: getMasteryColor(concept.mastery_score) }}
                            >
                              {concept.mastery_score ?? 0}
                            </span>
                          </button>
                        ))}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Session stats */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid #1e293b" }}
      >
        <div className="flex justify-between text-xs" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
          <span style={{ color: "#475569" }}>Today</span>
          <span style={{ color: "#94a3b8" }}>
            {sessionStats.questionsToday}q •{" "}
            <span
              style={{
                color:
                  sessionStats.accuracyToday >= 70
                    ? "#10b981"
                    : sessionStats.accuracyToday >= 40
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            >
              {sessionStats.accuracyToday}%
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
