import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { generateMockDebrief } from "@/lib/ai/agents/mockDebriefAgent";
import { calculateTotalScore, scoreQuestion } from "@/lib/algorithms/scoring";
import { predictRank } from "@/lib/algorithms/rankPredictor";

export const maxDuration = 60; // allow GROQ time for debrief generation

interface SubmittedAnswer {
  question_id: string;
  answer: string | null; // null = skipped
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { session_id, answers, time_taken_sec } = body as {
    session_id: string;
    answers: SubmittedAnswer[];
    time_taken_sec: number;
  };

  // Fetch all question answers from DB
  const questionIds = answers.map((a) => a.question_id);
  const { data: questions } = await supabase
    .from("generated_questions")
    .select("id, answer, marks, concept_id")
    .in("id", questionIds);

  if (!questions) {
    return NextResponse.json({ error: "Questions not found" }, { status: 404 });
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Score each answer
  const scoredAnswers = answers.map((a) => {
    const q = questionMap.get(a.question_id);
    if (!q) return null;

    let status: "correct" | "wrong" | "skipped" = "skipped";
    if (a.answer !== null) {
      const isCorrect =
        q.marks === 1
          ? a.answer.trim().toUpperCase() === q.answer.trim().toUpperCase()
          : Math.abs(parseFloat(a.answer) - parseFloat(q.answer)) <= 0.001;
      status = isCorrect ? "correct" : "wrong";
    }

    return {
      question_id: a.question_id,
      marks: q.marks as 1 | 2,
      status,
      score: scoreQuestion(q.marks as 1 | 2, status),
      concept_id: q.concept_id,
    };
  }).filter(Boolean);

  // Calculate total score
  const { rawScore, maxScore, normalizedScore } = calculateTotalScore(
    scoredAnswers as { question_id: string; marks: 1 | 2; status: "correct" | "wrong" | "skipped" }[]
  );

  const predictedRank = predictRank(normalizedScore);

  // Save attempts to DB
  const admin = createAdminClient();
  const attemptInserts = scoredAnswers
    .filter((a) => a!.status !== "skipped")
    .map((a) => ({
      user_id: user.id,
      question_id: a!.question_id,
      concept_id: a!.concept_id,
      is_correct: a!.status === "correct",
      selected_answer: answers.find((ans) => ans.question_id === a!.question_id)?.answer ?? null,
    }));

  await admin.from("user_attempts").insert(attemptInserts);

  // Update mock session
  await admin
    .from("mock_sessions")
    .update({
      completed_at: new Date().toISOString(),
      total_score: rawScore,
      max_score: maxScore,
      time_taken_sec,
      predicted_rank: predictedRank,
    })
    .eq("id", session_id)
    .eq("user_id", user.id);

  // Generate debrief inline — no QStash needed
  let debrief: unknown = null;
  const { data: job } = await admin
    .from("llm_jobs")
    .insert({
      user_id: user.id,
      job_type: "mock_debrief",
      status: "processing",
      input_payload: { session_id } as any,
    })
    .select()
    .single();

  if (job) {
    try {
      debrief = await generateMockDebrief(session_id);
      await admin.from("mock_sessions").update({ debrief_json: debrief as any }).eq("id", session_id);
      await admin.from("llm_jobs").update({
        status: "completed",
        output_payload: debrief as any,
        completed_at: new Date().toISOString(),
      }).eq("id", job.id);
    } catch (err) {
      console.error("[mock/submit] debrief failed:", err);
      await admin.from("llm_jobs").update({
        status: "failed",
        completed_at: new Date().toISOString(),
      }).eq("id", job.id);
    }
  }

  return NextResponse.json({
    score: rawScore,
    max_score: maxScore,
    normalized_score: normalizedScore,
    predicted_rank: predictedRank,
    debrief,
    breakdown: scoredAnswers.reduce(
      (acc, a) => {
        if (!a) return acc;
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  });
}
