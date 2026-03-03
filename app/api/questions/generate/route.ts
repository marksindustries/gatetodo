import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { generateQuestion } from "@/lib/ai/agents/questionGenerator";
import { incrementCounter } from "@/lib/cache/cacheManager";

// Rate limit: 60 requests per hour per user
const RATE_LIMIT = 60;
const WINDOW_SECONDS = 3600;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const count = await incrementCounter(
    `rl:qgen:${user.id}`,
    WINDOW_SECONDS
  );
  if (count > RATE_LIMIT) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in an hour." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { concept_id, difficulty = 3, type = "MCQ" } = body;

  if (!concept_id) {
    return NextResponse.json({ error: "concept_id is required" }, { status: 400 });
  }

  // Check free tier limit (20 questions/day) — access expires when current_period_end passes
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", user.id)
    .single();

  const isPaid = sub?.current_period_end
    ? new Date(sub.current_period_end) > new Date()
    : false;

  if (!isPaid) {
    const today = new Date().toISOString().split("T")[0];
    const { count: todayCount } = await supabase
      .from("user_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("attempted_at", today);

    if ((todayCount ?? 0) >= 20) {
      return NextResponse.json(
        { error: "Free plan limit: 20 questions/day. Upgrade to continue." },
        { status: 403 }
      );
    }
  }

  try {
    const question = await generateQuestion(concept_id, difficulty, type);
    return NextResponse.json({ question });
  } catch (err: any) {
    console.error("[questions/generate]", err);
    const msg =
      err?.status === 429
        ? "AI is busy — please wait a moment and try again."
        : "Failed to generate question. Please try again.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
