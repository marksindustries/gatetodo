import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { publishJob } from "@/lib/queue/qstash";
import { incrementCounter } from "@/lib/cache/cacheManager";

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

  // Create a pending job in DB
  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("llm_jobs")
    .insert({
      user_id: user.id,
      job_type: "roadmap_gen",
      status: "pending",
      input_payload: { profile } as any,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Push async job to QStash
  await publishJob({
    job_type: "roadmap_gen",
    payload: { job_id: job.id, profile },
  });

  return NextResponse.json({ job_id: job.id });
}
