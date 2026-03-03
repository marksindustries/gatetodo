import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { groqQuery, generateEmbedding } from "@/lib/ai/groqRouter";
import { buildTutorPrompt } from "@/lib/ai/prompts/explanation";
import { incrementCounter } from "@/lib/cache/cacheManager";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription for rate limits — access expires when current_period_end passes
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", user.id)
    .single();

  const isPaid = sub?.current_period_end
    ? new Date(sub.current_period_end) > new Date()
    : false;
  const rateLimit = isPaid ? 100 : 30;

  // Rate limit per hour
  const count = await incrementCounter(`rl:tutor:${user.id}`, 3600);
  if (count > rateLimit) {
    return NextResponse.json(
      {
        error: isPaid
          ? "Rate limit: 100 messages/hour. Try again later."
          : "Free plan: 30 messages/hour. Upgrade for more.",
      },
      { status: 429 }
    );
  }

  // Daily message limit for free users (10/day)
  if (!isPaid) {
    const today = new Date().toISOString().split("T")[0];
    const dailyCount = await incrementCounter(`rl:tutor:daily:${user.id}:${today}`, 86400);
    if (dailyCount > 10) {
      return NextResponse.json(
        { error: "Free plan: 10 AI Tutor messages/day. Upgrade for more." },
        { status: 429 }
      );
    }
  }

  const body = await request.json();
  const {
    message,
    history = [],
    concept_id,
  }: {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
    concept_id?: string;
  } = body;

  if (!message || message.length > 300) {
    return NextResponse.json(
      { error: "Message must be 1–300 characters." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // ── Embed user message ──
  const embedding = await generateEmbedding(message);

  // ── RAG search ──
  let filterSubject: string | undefined;

  if (concept_id) {
    const { data: concept } = await admin
      .from("concepts")
      .select("subject")
      .eq("id", concept_id)
      .single();
    filterSubject = concept?.subject;
  }

  const { data: ragChunks } = await admin.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.6,
    match_count: 4,
    ...(filterSubject ? { filter_subject: filterSubject } : {}),
  });

  let ragContext = "";
  if (ragChunks && ragChunks.length > 0) {
    ragContext = ragChunks
      .map((c: { content: string; source: string }) => `[${c.source}]: ${c.content}`)
      .join("\n\n");
  } else {
    ragContext = "No specific documentation found. Answer based on GATE CS knowledge.";
  }

  // Limit history to last 6 messages (~1200 token budget)
  const limitedHistory = history.slice(-6);

  // ── Build prompt and call GROQ ──
  const prompt = buildTutorPrompt(message, limitedHistory, ragContext);

  const result = (await groqQuery(prompt, {
    taskType: "ai_tutor",
    model: "generation",
    embedding,
  })) as {
    answer: string;
    concept: string;
    exam_tip: string;
    subject: string;
  };

  return NextResponse.json(result);
}
