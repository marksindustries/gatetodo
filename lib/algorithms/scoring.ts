/**
 * GATE Scoring Formula
 * 1-mark: +1 correct, -0.33 wrong, 0 skipped
 * 2-mark: +2 correct, -0.67 wrong, 0 skipped
 */

export type AnswerStatus = "correct" | "wrong" | "skipped";

export interface QuestionScore {
  question_id: string;
  marks: 1 | 2;
  status: AnswerStatus;
}

export function scoreQuestion(marks: 1 | 2, status: AnswerStatus): number {
  if (status === "skipped") return 0;
  if (status === "correct") return marks;
  // wrong
  return marks === 1 ? -1 / 3 : -2 / 3;
}

export function calculateTotalScore(questions: QuestionScore[]): {
  rawScore: number;
  maxScore: number;
  normalizedScore: number;
} {
  let rawScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    rawScore += scoreQuestion(q.marks, q.status);
    maxScore += q.marks;
  }

  // GATE normalized score (approximate as raw for mock)
  const normalizedScore = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;

  return { rawScore, maxScore, normalizedScore };
}

export function subjectBreakdown(
  questions: (QuestionScore & { subject: string })[]
): Record<
  string,
  { attempted: number; correct: number; wrong: number; score: number; accuracy: number }
> {
  const breakdown: Record<
    string,
    { attempted: number; correct: number; wrong: number; score: number; accuracy: number }
  > = {};

  for (const q of questions) {
    if (!breakdown[q.subject]) {
      breakdown[q.subject] = { attempted: 0, correct: 0, wrong: 0, score: 0, accuracy: 0 };
    }
    const b = breakdown[q.subject];
    if (q.status !== "skipped") b.attempted++;
    if (q.status === "correct") b.correct++;
    if (q.status === "wrong") b.wrong++;
    b.score += scoreQuestion(q.marks, q.status);
  }

  for (const subject in breakdown) {
    const b = breakdown[subject];
    b.accuracy = b.attempted > 0 ? Math.round((b.correct / b.attempted) * 100) : 0;
  }

  return breakdown;
}
