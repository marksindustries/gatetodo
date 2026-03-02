/**
 * Agent 2 — Answer Evaluator
 *
 * Logic:
 *   MCQ → pure DB lookup (NO LLM)
 *   NAT → rule-based number check (NO LLM)
 *   After evaluation:
 *     - Update user_attempts table
 *     - Run SM-2 algorithm to update user_concept_state
 *     - Return { correct, solution, sm2_update, next_review_date }
 */
import { createAdminClient } from "@/lib/db/supabase-server";
import {
  sm2Update,
  wrongAnswerQuality,
  defaultSM2State,
  type SM2Quality,
  type SM2State,
} from "@/lib/algorithms/sm2";

interface EvaluateInput {
  questionId: string;
  userAnswer: string;
  userId: string;
  timeTakenSec?: number;
  /** SM-2 quality override for correct answers (from UI feedback buttons) */
  sm2Quality?: SM2Quality;
}

interface EvaluateResult {
  correct: boolean;
  correctAnswer: string;
  solution: string;
  sm2Update: SM2State;
  nextReviewDate: string;
}

export async function evaluateAnswer(input: EvaluateInput): Promise<EvaluateResult> {
  const supabase = createAdminClient();
  const { questionId, userAnswer, userId, timeTakenSec, sm2Quality } = input;

  // Fetch question from DB
  const { data: question, error: qErr } = await supabase
    .from("generated_questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (qErr || !question) throw new Error("Question not found");

  // ── Evaluate answer ──
  let isCorrect = false;

  if (question.question_type === "MCQ") {
    isCorrect = userAnswer.trim().toUpperCase() === question.answer.trim().toUpperCase();
  } else {
    // NAT: compare numbers with tolerance ε = 0.001
    const userNum = parseFloat(userAnswer);
    const correctNum = parseFloat(question.answer);
    if (!isNaN(userNum) && !isNaN(correctNum)) {
      isCorrect = Math.abs(userNum - correctNum) <= 0.001;
    }
  }

  // ── Save attempt ──
  await supabase.from("user_attempts").insert({
    user_id: userId,
    question_id: questionId,
    concept_id: question.concept_id,
    is_correct: isCorrect,
    time_taken_sec: timeTakenSec,
    selected_answer: userAnswer,
  });

  // ── Fetch or create SM-2 state ──
  const { data: existingState } = await supabase
    .from("user_concept_state")
    .select("*")
    .eq("user_id", userId)
    .eq("concept_id", question.concept_id)
    .single();

  const currentState: SM2State = existingState
    ? {
        repetitions: existingState.repetitions,
        interval_days: existingState.interval_days,
        ease_factor: existingState.ease_factor,
        mastery_score: existingState.mastery_score,
        next_review: existingState.next_review,
      }
    : {
        repetitions: 0,
        interval_days: 1,
        ease_factor: 2.5,
        mastery_score: 0,
        next_review: new Date().toISOString().split("T")[0],
      };

  // Determine quality: wrong=1, correct uses sm2Quality from UI (4=easy, 3=good, 2=hard)
  const quality: SM2Quality = isCorrect
    ? (sm2Quality ?? 4)
    : wrongAnswerQuality();

  const newState = sm2Update(currentState, quality);

  // ── Update user_concept_state ──
  await supabase.from("user_concept_state").upsert(
    {
      user_id: userId,
      concept_id: question.concept_id,
      ease_factor: newState.ease_factor,
      interval_days: newState.interval_days,
      next_review: newState.next_review,
      repetitions: newState.repetitions,
      mastery_score: newState.mastery_score,
      last_attempted: new Date().toISOString(),
    },
    { onConflict: "user_id,concept_id" }
  );

  return {
    correct: isCorrect,
    correctAnswer: question.answer,
    solution: question.solution,
    sm2Update: newState,
    nextReviewDate: newState.next_review,
  };
}
