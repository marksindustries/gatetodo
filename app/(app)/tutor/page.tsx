"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  concept?: string;
  exam_tip?: string;
  subject?: string;
}

const SUGGESTED_QUESTIONS = [
  "Explain Banker's algorithm",
  "What is Belady's anomaly?",
  "Difference between process and thread",
  "When is LL(1) applicable?",
  "Explain TCP 3-way handshake",
  "What is BCNF normalization?",
  "Explain Dijkstra's algorithm",
  "What is thrashing in OS?",
  "How does CSMA/CD work?",
  "Explain the Knapsack problem",
  "What is a Turing Machine?",
  "Difference between DFA and NFA",
  "What is cache associativity?",
  "Explain B+ Tree indexing",
  "What is 2-Phase Locking?",
];

const SUBJECTS = ["All", "OS", "CN", "DBMS", "Algorithms", "COA", "TOC", "DS", "Maths"];

const SUBJECT_QUESTIONS: Record<string, string[]> = {
  OS: ["Explain Banker's algorithm", "What is Belady's anomaly?", "Difference between process and thread", "What is thrashing in OS?"],
  CN: ["Explain TCP 3-way handshake", "How does CSMA/CD work?", "Difference between TCP and UDP"],
  DBMS: ["What is BCNF normalization?", "What is 2-Phase Locking?", "Explain B+ Tree indexing"],
  Algorithms: ["Explain Dijkstra's algorithm", "Explain the Knapsack problem", "What is Master Theorem?"],
  COA: ["What is cache associativity?", "Explain pipelining hazards", "What is RISC vs CISC?"],
  TOC: ["Difference between DFA and NFA", "What is a Turing Machine?", "When is LL(1) applicable?"],
  DS: ["Explain AVL tree rotations", "What is a B-tree?", "Explain Union-Find"],
  Maths: ["State Bayes' theorem", "What is eigenvalue?", "Explain pigeonhole principle"],
};

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [cacheStats, setCacheStats] = useState({ hits: 0, llmCalls: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions =
    subjectFilter === "All"
      ? SUGGESTED_QUESTIONS
      : SUBJECT_QUESTIONS[subjectFilter] ?? SUGGESTED_QUESTIONS;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await fetch("/api/tutor/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed, history }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          concept: data.concept,
          exam_tip: data.exam_tip,
          subject: data.subject,
        },
      ]);
      setCacheStats((prev) => ({ ...prev, llmCalls: prev.llmCalls + 1 }));
    } else {
      const err = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.error}` },
      ]);
    }

    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex h-screen" style={{ background: "#0a0e1a" }}>
      {/* Sidebar */}
      <div
        className="hidden md:flex flex-col p-4 overflow-y-auto"
        style={{ width: "260px", background: "#111827", borderRight: "1px solid #1e293b" }}
      >
        <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
          TOPIC FILTER
        </p>
        <div className="flex flex-wrap gap-1 mb-5">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s)}
              className="px-2 py-0.5 rounded text-xs"
              style={{
                background: subjectFilter === s ? "rgba(245,158,11,0.1)" : "#0a0e1a",
                border: `1px solid ${subjectFilter === s ? "#f59e0b" : "#1e293b"}`,
                color: subjectFilter === s ? "#f59e0b" : "#94a3b8",
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
          SUGGESTED
        </p>
        <div className="space-y-1.5 flex-1">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="w-full text-left text-xs px-2 py-2 rounded transition-colors"
              style={{
                background: "#0a0e1a",
                border: "1px solid #1e293b",
                color: "#94a3b8",
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: "pointer",
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Token saver widget */}
        <div className="mt-4 p-3 rounded" style={{ background: "#0a0e1a", border: "1px solid #1e293b" }}>
          <p className="text-xs mb-2" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            TOKEN SAVER
          </p>
          <div className="space-y-1 text-xs" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
            <div className="flex justify-between">
              <span style={{ color: "#475569" }}>LLM calls</span>
              <span style={{ color: "#94a3b8" }}>{cacheStats.llmCalls}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#475569" }}>Model</span>
              <span style={{ color: "#818cf8" }}>llama-70b</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div
              className="flex flex-col items-center justify-center h-full"
              style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              <div className="text-4xl mb-3" style={{ opacity: 0.3 }}>⟨AI⟩</div>
              <p className="text-sm">Ask any GATE CS question</p>
              <p className="text-xs mt-1">Powered by RAG + GROQ llama-3.3-70b</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-6 h-6 rounded-sm mr-2 flex-shrink-0 flex items-center justify-center text-xs mt-0.5"
                  style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b", fontFamily: "var(--font-ibm-plex-mono)" }}
                >
                  AI
                </div>
              )}

              <div style={{ maxWidth: "680px" }}>
                <div
                  className="px-4 py-3 rounded text-sm leading-relaxed"
                  style={{
                    background: msg.role === "user" ? "rgba(245,158,11,0.08)" : "#111827",
                    border: `1px solid ${msg.role === "user" ? "#f59e0b" : "#1e293b"}`,
                    color: "#f1f5f9",
                    fontFamily: "var(--font-ibm-plex-mono)",
                  }}
                >
                  {msg.content}
                </div>

                {/* Exam tip */}
                {msg.exam_tip && (
                  <div
                    className="mt-2 px-3 py-2 rounded text-xs"
                    style={{
                      background: "rgba(16,185,129,0.05)",
                      border: "1px solid #10b981",
                      color: "#10b981",
                      fontFamily: "var(--font-ibm-plex-mono)",
                    }}
                  >
                    Exam tip: {msg.exam_tip}
                  </div>
                )}

                {/* Subject tag */}
                {msg.subject && (
                  <div className="mt-1.5 flex gap-2">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(129,140,248,0.1)",
                        border: "1px solid #818cf8",
                        color: "#818cf8",
                        fontFamily: "var(--font-ibm-plex-mono)",
                      }}
                    >
                      {msg.subject}
                    </span>
                    {msg.concept && (
                      <span className="text-xs" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                        {msg.concept}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div
                className="w-6 h-6 rounded-sm mr-2 flex-shrink-0 flex items-center justify-center text-xs"
                style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b", fontFamily: "var(--font-ibm-plex-mono)" }}
              >
                AI
              </div>
              <div
                className="px-4 py-3 rounded flex items-center gap-1"
                style={{ background: "#111827", border: "1px solid #1e293b" }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#94a3b8", animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="p-4" style={{ borderTop: "1px solid #1e293b" }}>
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 300))}
                onKeyDown={handleKeyDown}
                placeholder="Ask any GATE CS question..."
                rows={1}
                className="w-full px-3 py-2.5 rounded text-sm resize-none outline-none"
                style={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  color: "#f1f5f9",
                  fontFamily: "var(--font-ibm-plex-mono)",
                  maxHeight: "72px",
                  overflowY: "auto",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
              />
              <span
                className="absolute bottom-2 right-2 text-xs"
                style={{ color: input.length > 250 ? "#ef4444" : "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}
              >
                {input.length}/300
              </span>
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded text-sm"
              style={{
                background: "#f59e0b",
                color: "#0a0e1a",
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                opacity: !input.trim() || loading ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>
          <p className="text-xs mt-1.5" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  );
}
