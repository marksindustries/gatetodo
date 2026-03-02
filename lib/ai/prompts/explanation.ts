import type { Concept } from "@/lib/db/types";

export function buildExplanationPrompt(
  concept: Concept,
  userQuestion: string,
  ragContext: string
): string {
  return `You are a GATE CS tutor. Answer the student's question using ONLY the provided context.
Return ONLY valid JSON with no other text.

Subject: ${concept.subject}
Topic: ${concept.topic}
Subtopic: ${concept.subtopic}
Exam tip: ${concept.exam_tips ?? ""}

Retrieved context:
${ragContext}

Student question: "${userQuestion}"

Return this exact JSON schema:
{
  "explanation": "string — clear, concise explanation (4-8 sentences), grounded in the context",
  "concept": "string — the core concept name being explained",
  "exam_tip": "string — one actionable exam tip for GATE",
  "source": "string — source name from context (e.g., 'GeeksForGeeks', 'NPTEL')"
}`;
}

export function buildTutorPrompt(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
  ragContext: string
): string {
  const historyStr = history
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n");

  return `You are a GATE CS expert tutor. Answer using the retrieved context.
Return ONLY valid JSON with no other text.

Retrieved context:
${ragContext}

Conversation history:
${historyStr}

Current question: "${userMessage}"

Return this exact JSON schema:
{
  "answer": "string — clear explanation (4-8 sentences)",
  "concept": "string — primary GATE CS concept addressed",
  "exam_tip": "string — one actionable GATE exam tip",
  "subject": "string — subject tag: OS|CN|DBMS|Algorithms|COA|TOC|DS|Maths"
}`;
}
