import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 60; // extend Vercel timeout to 60s for LLM jobs
import { createAdminClient } from "@/lib/db/supabase-server";
import { verifyQStashSignature } from "@/lib/queue/qstash";
import { generateRoadmap } from "@/lib/ai/agents/roadmapAgent";
import { generateMockDebrief } from "@/lib/ai/agents/mockDebriefAgent";
import { runSRScheduler } from "@/lib/ai/agents/srScheduler";

export async function POST(request: NextRequest) {
  // Verify QStash signature in production
  if (process.env.NODE_ENV === "production") {
    const isValid = await verifyQStashSignature(request.clone());
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const body = await request.json();
  const { job_type, payload } = body;

  const supabase = createAdminClient();

  if (job_type === "roadmap_gen") {
    const { job_id, profile } = payload;

    await supabase
      .from("llm_jobs")
      .update({ status: "processing" })
      .eq("id", job_id);

    try {
      const roadmap = await generateRoadmap(profile);

      await supabase
        .from("llm_jobs")
        .update({
          status: "completed",
          output_payload: roadmap as any,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job_id);
    } catch (err) {
      console.error("[jobs/process] roadmap_gen failed:", err);
      await supabase
        .from("llm_jobs")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("id", job_id);
    }

    return NextResponse.json({ success: true });
  }

  if (job_type === "mock_debrief") {
    const { job_id, session_id } = payload;

    await supabase
      .from("llm_jobs")
      .update({ status: "processing" })
      .eq("id", job_id);

    try {
      const debrief = await generateMockDebrief(session_id);

      await supabase
        .from("mock_sessions")
        .update({ debrief_json: debrief as any })
        .eq("id", session_id);

      await supabase
        .from("llm_jobs")
        .update({
          status: "completed",
          output_payload: debrief as any,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job_id);
    } catch (err) {
      console.error("[jobs/process] mock_debrief failed:", err);
      await supabase
        .from("llm_jobs")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("id", job_id);
    }

    return NextResponse.json({ success: true });
  }

  if (job_type === "sr_scheduler") {
    const result = await runSRScheduler();
    return NextResponse.json({ success: true, ...result });
  }

  return NextResponse.json({ error: "Unknown job type" }, { status: 400 });
}
