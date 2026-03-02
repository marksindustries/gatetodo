/**
 * Agent 5 — Mock Test Debrief (ASYNC via QStash)
 *
 * Logic:
 *  1. Pure math computation first (NO LLM):
 *     - Subject-wise accuracy %
 *     - Time distribution per subject
 *     - Predicted rank from score percentile table
 *     - Weak concept identification
 *  2. Hash weak_concepts_combo → check llm_cache
 *  3. Cache miss only → GROQ 70b for personalized insight
 *  4. Store debrief in mock_sessions.debrief_json
 */
import crypto from "crypto";
import { createAdminClient } from "@/lib/db/supabase-server";
import { groqQuery, generateEmbedding } from "@/lib/ai/groqRouter";
import { buildDebriefPrompt } from "@/lib/ai/prompts/debrief";
import { predictRank } from "@/lib/algorithms/rankPredictor";
import { subjectBreakdown } from "@/lib/algorithms/scoring";

interface DebriefResult {
  weak_areas: string[];
  focus_this_week: string[];
  improvement: string;
  predicted_improvement: string;
  subject_breakdown: Record<string, { accuracy: number; attempted: number; correct: number; wrong: number; score: number }>;
  predicted_rank: number;
  score: number;
  max_score: number;
}

export async function generateMockDebrief(sessionId: string): Promise<DebriefResult> {
  const supabase = createAdminClient();

  // Fetch session data
  const { data: session } = await supabase
    .from("mock_sessions")
    .select("*, user_id, total_score, max_score")
    .eq("id", sessionId)
    .single();

  if (!session) throw new Error(`Session ${sessionId} not found`);

  // Fetch all attempts for this session
  // We need to join with questions to get subject data
  // Mock sessions store question IDs in the session; for simplicity we fetch recent attempts
  const { data: attempts } = await supabase
    .from("user_attempts")
    .select("*, generated_questions!inner(marks, question_type, concept_id, concepts!inner(subject))")
    .eq("user_id", session.user_id)
    .gte("attempted_at", session.started_at)
    .lte("attempted_at", session.completed_at ?? new Date().toISOString());

  // ── Step 1: Pure math computation ──
  const scoredQuestions = (attempts ?? []).map((a: any) => ({
    question_id: a.question_id,
    marks: a.generated_questions.marks as 1 | 2,
    status: a.is_correct ? "correct" : "wrong",
    subject: a.generated_questions.concepts?.subject ?? "Unknown",
  }));

  const breakdown = subjectBreakdown(scoredQuestions as any);

  // Weak concepts (wrong answers grouped by concept)
  const wrongConceptIds = [...new Set(
    (attempts ?? [])
      .filter((a: any) => !a.is_correct)
      .map((a: any) => a.concept_id)
  )];

  const { data: weakConceptData } = await supabase
    .from("concepts")
    .select("subtopic")
    .in("id", wrongConceptIds.slice(0, 5));

  const weakConceptNames = (weakConceptData ?? []).map((c: { subtopic: string }) => c.subtopic);

  const predictedRank = predictRank(
    session.max_score > 0
      ? (session.total_score / session.max_score) * 100
      : 0
  );

  // ── Step 2 & 3: LLM debrief ──
  // Hash weak concept combo for cache
  const weakComboHash = crypto
    .createHash("sha256")
    .update(weakConceptNames.join(":"))
    .digest("hex");

  const debriefKey = `debrief:${weakComboHash}`;
  const embedding = await generateEmbedding(debriefKey);

  const breakdownForPrompt: Record<string, { accuracy: number; attempted: number }> = {};
  for (const [subject, data] of Object.entries(breakdown)) {
    breakdownForPrompt[subject] = { accuracy: data.accuracy, attempted: data.attempted };
  }

  const prompt = buildDebriefPrompt({
    score: session.total_score,
    maxScore: session.max_score,
    weakConcepts: weakConceptNames,
    subjectBreakdown: breakdownForPrompt,
  });

  const aiDebrief = (await groqQuery(prompt, {
    taskType: "mock_debrief",
    model: "generation",
    embedding,
  })) as {
    weak_areas: string[];
    focus_this_week: string[];
    improvement: string;
    predicted_improvement: string;
  };

  // Update session with predicted rank
  await supabase
    .from("mock_sessions")
    .update({ predicted_rank: predictedRank, subject_breakdown: breakdown as any })
    .eq("id", sessionId);

  return {
    ...aiDebrief,
    subject_breakdown: breakdown,
    predicted_rank: predictedRank,
    score: session.total_score,
    max_score: session.max_score,
  };
}
