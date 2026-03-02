import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { generateRoadmap } from "@/lib/ai/agents/roadmapAgent";
import { incrementCounter } from "@/lib/cache/cacheManager";

export const maxDuration = 60; // allow GROQ 70b time to respond

// Rate limit: 3 roadmap generations per day
const RATE_LIMIT = 3;
const WINDOW_SECONDS = 86400;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check paid plan for regeneration
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .single();

  const isPaid = sub?.plan !== "free" && sub?.status === "active";

  // Rate limit (paid users only for regeneration)
  if (isPaid) {
    const count = await incrementCounter(`rl:roadmap:${user.id}`, WINDOW_SECONDS);
    if (count > RATE_LIMIT) {
      return NextResponse.json(
        { error: "Roadmap generation limit: 3/day. Try again tomorrow." },
        { status: 429 }
      );
    }
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Create job record (start as processing since we run inline)
  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("llm_jobs")
    .insert({
      user_id: user.id,
      job_type: "roadmap_gen",
      status: "processing",
      input_payload: { profile } as any,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Process inline — no QStash needed
  try {
    const roadmap = await generateRoadmap(profile);

    await admin
      .from("llm_jobs")
      .update({
        status: "completed",
        output_payload: roadmap as any,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return NextResponse.json({ job_id: job.id, roadmap });
  } catch (err) {
    console.error("[roadmap/generate] generation failed:", err);
    await admin
      .from("llm_jobs")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("id", job.id);
    return NextResponse.json(
      { error: "Roadmap generation failed. Please try again." },
      { status: 500 }
    );
  }
}
