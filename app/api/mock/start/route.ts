import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { generateQuestion } from "@/lib/ai/agents/questionGenerator";

const SESSION_CONFIG = {
  full: { count: 65, timeMinutes: 180 },
  subject: { count: 20, timeMinutes: 60 },
  speed: { count: 10, timeMinutes: 15 },
} as const;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type = "speed", subject } = body as {
    type: "full" | "subject" | "speed";
    subject?: string;
  };

  // Check feature gates — access expires when current_period_end passes, no cron needed
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", user.id)
    .single();

  const isPaid = sub?.current_period_end
    ? new Date(sub.current_period_end) > new Date()
    : false;

  if (type === "full" && !isPaid) {
    return NextResponse.json(
      { error: "Full mock test requires a paid plan. Upgrade to access." },
      { status: 403 }
    );
  }

  if (type === "subject" && !isPaid) {
    // Check 2/day limit for free users
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("mock_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("session_type", "subject")
      .gte("started_at", today);

    if ((count ?? 0) >= 2) {
      return NextResponse.json(
        { error: "Free plan: 2 subject tests/day. Upgrade for unlimited." },
        { status: 403 }
      );
    }
  }

  const config = SESSION_CONFIG[type];

  // Fetch concepts for the test
  let conceptsQuery = supabase
    .from("concepts")
    .select("id, subject, weightage_score, difficulty_base");

  if (subject && type === "subject") {
    conceptsQuery = conceptsQuery.eq("subject", subject);
  }

  const { data: concepts } = await conceptsQuery;
  if (!concepts || concepts.length === 0) {
    return NextResponse.json({ error: "No concepts available" }, { status: 500 });
  }

  // Create mock session
  const admin = createAdminClient();
  const { data: session, error: sessionError } = await admin
    .from("mock_sessions")
    .insert({
      user_id: user.id,
      session_type: type,
      subject_filter: subject ?? null,
    })
    .select()
    .single();

  if (sessionError) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  // Generate questions (weighted sampling by concept importance)
  // Sort by weightage and sample proportionally
  const sortedConcepts = concepts.sort((a, b) => b.weightage_score - a.weightage_score);
  const selectedConcepts: typeof concepts = [];

  for (let i = 0; i < config.count; i++) {
    // Weighted random selection
    const totalWeight = sortedConcepts.reduce((s, c) => s + c.weightage_score, 0);
    let rand = Math.random() * totalWeight;
    for (const concept of sortedConcepts) {
      rand -= concept.weightage_score;
      if (rand <= 0) {
        selectedConcepts.push(concept);
        break;
      }
    }
    if (selectedConcepts.length < i + 1) {
      selectedConcepts.push(sortedConcepts[i % sortedConcepts.length]);
    }
  }

  // Generate questions concurrently (up to 5 at a time to avoid rate limits)
  const questions = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < selectedConcepts.length; i += BATCH_SIZE) {
    const batch = selectedConcepts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((c) =>
        generateQuestion(
          c.id,
          c.difficulty_base,
          Math.random() > 0.8 ? "NAT" : "MCQ" // ~20% NAT
        ).catch(() => null)
      )
    );
    questions.push(...batchResults.filter(Boolean));
  }

  return NextResponse.json({
    session_id: session.id,
    time_minutes: config.timeMinutes,
    questions: questions.map((q) => ({
      id: q!.id,
      concept_id: q!.concept_id,
      question_text: q!.question_text,
      options: q!.options,
      question_type: q!.question_type,
      difficulty: q!.difficulty,
      marks: q!.marks,
    })),
  });
}
