import type { Concept } from "@/lib/db/types";

export function buildQuestionPrompt(
  concept: Concept,
  difficulty: number,
  questionType: "MCQ" | "NAT"
): string {
  const marks = difficulty >= 4 ? 2 : 1;

  return `Generate a GATE CS exam question. Return ONLY valid JSON with no other text.

Subject: ${concept.subject}
Topic: ${concept.topic}
Subtopic: ${concept.subtopic}
Difficulty: ${difficulty}/5
Type: ${questionType}
Marks: ${marks}
Exam tip context: ${concept.exam_tips ?? ""}

Rules:
- The question must test conceptual understanding, NOT memorization of facts.
- For NAT: the answer must be a specific number (integer or decimal).
- For MCQ: all 4 options must be plausible; exactly one must be correct.
- The solution must show step-by-step reasoning, not just the answer.
- NO PYQ (Previous Year Questions). Generate a fresh, original question.

Return this exact JSON schema:
{
  "question": "string — the question text",
  "options": ${questionType === "MCQ" ? '{"A": "string", "B": "string", "C": "string", "D": "string"}' : "null"},
  "answer": "string — for MCQ: 'A'|'B'|'C'|'D', for NAT: the numeric value as string",
  "solution": "string — step-by-step explanation, 3-6 sentences",
  "marks": ${marks},
  "type": "${questionType}"
}`;
}
