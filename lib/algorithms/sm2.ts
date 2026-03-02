/**
 * SM-2 Spaced Repetition Algorithm
 * Exact implementation as specified in the README.
 *
 * Quality scale:
 *   0 = blackout (complete failure)
 *   1 = wrong (incorrect response)
 *   2 = hard (incorrect, but upon seeing the answer, it felt easy)
 *   3 = good (correct with significant difficulty)
 *   4 = easy (correct after hesitation)
 *   5 = perfect (perfect response)
 */

export interface SM2State {
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  mastery_score: number;
  next_review: string; // ISO date string YYYY-MM-DD
}

export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function sm2Update(state: SM2State, quality: SM2Quality): SM2State {
  if (quality < 3) {
    // Failed — reset repetitions and interval, keep ease_factor
    return {
      ...state,
      repetitions: 0,
      interval_days: 1,
      ease_factor: state.ease_factor,
      mastery_score: Math.max(0, state.mastery_score - 10),
      next_review: addDays(today(), 1),
    };
  }

  // Calculate new ease factor
  const newEF = Math.max(
    1.3,
    state.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  // Calculate new interval
  let interval: number;
  if (state.repetitions === 0) {
    interval = 1;
  } else if (state.repetitions === 1) {
    interval = 6;
  } else {
    interval = Math.round(state.interval_days * newEF);
  }

  // Update mastery score
  const masteryDelta = quality >= 4 ? 15 : quality >= 3 ? 8 : -10;
  const mastery = Math.min(100, Math.max(0, state.mastery_score + masteryDelta));

  return {
    repetitions: state.repetitions + 1,
    interval_days: interval,
    ease_factor: newEF,
    next_review: addDays(today(), interval),
    mastery_score: mastery,
  };
}

/**
 * Maps SM-2 feedback button presses to quality scores.
 * Called after revealing the answer.
 */
export function feedbackToQuality(feedback: "easy" | "good" | "hard"): SM2Quality {
  switch (feedback) {
    case "easy": return 5;
    case "good": return 4;
    case "hard": return 3;
  }
}

/**
 * Maps a wrong answer to quality score 1.
 */
export function wrongAnswerQuality(): SM2Quality {
  return 1;
}

/**
 * Returns a default SM-2 state for a brand-new concept.
 */
export function defaultSM2State(userId: string, conceptId: string): SM2State & { user_id: string; concept_id: string } {
  return {
    user_id: userId,
    concept_id: conceptId,
    repetitions: 0,
    interval_days: 1,
    ease_factor: 2.5,
    mastery_score: 0,
    next_review: today(),
  };
}
