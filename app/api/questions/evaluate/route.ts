import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { evaluateAnswer } from "@/lib/ai/agents/answerEvaluator";
import type { SM2Quality } from "@/lib/algorithms/sm2";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { question_id, user_answer, time_taken_sec, sm2_quality, skip_attempt } = body;

  if (!question_id || user_answer === undefined) {
    return NextResponse.json(
      { error: "question_id and user_answer are required" },
      { status: 400 }
    );
  }

  const result = await evaluateAnswer({
    questionId: question_id,
    userAnswer: String(user_answer),
    userId: user.id,
    timeTakenSec: time_taken_sec,
    sm2Quality: sm2_quality as SM2Quality | undefined,
    skipAttemptInsert: skip_attempt === true,
  });

  return NextResponse.json(result);
}
