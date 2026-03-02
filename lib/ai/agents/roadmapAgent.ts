/**
 * Agent 4 — Roadmap Generator
 *
 * Logic:
 *  1. Hash profile → archetype_hash
 *  2. Check roadmaps table for existing archetype
 *  3. Cache hit → return immediately (NO LLM)
 *  4. Cache miss → call GROQ 70b → store → return
 */
import crypto from "crypto";
import { createAdminClient } from "@/lib/db/supabase-server";
import { groqQuery } from "@/lib/ai/groqRouter";
import { buildRoadmapPrompt } from "@/lib/ai/prompts/roadmap";

interface UserProfile {
  user_id: string;
  branch: string;
  level: string;
  target_rank: number;
  exam_month: string;
  daily_hours: number;
  weak_subjects?: string[];
  strong_subjects?: string[];
}

interface RoadmapResult {
  phases: {
    phase: number;
    name: string;
    duration: string;
    daily_hours: number;
    focus: string[];
    key_topics: string[];
    milestone: string;
  }[];
  weekly_split: {
    concepts: number;
    practice: number;
    revision: number;
    mocks: number;
  };
  priority_subjects: {
    subject: string;
    reason: string;
    target_accuracy: number;
  }[];
}

function buildArchetypeHash(profile: UserProfile): string {
  const examDate = new Date(profile.exam_month);
  const now = new Date();
  const monthsLeft = Math.ceil(
    (examDate.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );

  const key = `${profile.branch}:${profile.level}:${profile.target_rank}:${monthsLeft}:${profile.daily_hours}`;
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function generateRoadmap(profile: UserProfile): Promise<RoadmapResult> {
  const supabase = createAdminClient();
  const archetypeHash = buildArchetypeHash(profile);

  // ── Check cache ──
  const { data: cached } = await supabase
    .from("roadmaps")
    .select("roadmap_json, used_count")
    .eq("archetype_hash", archetypeHash)
    .single();

  if (cached) {
    // Bump used_count
    await supabase
      .from("roadmaps")
      .update({ used_count: cached.used_count + 1 })
      .eq("archetype_hash", archetypeHash);

    return cached.roadmap_json as RoadmapResult;
  }

  // ── Cache miss → GROQ ──
  const examDate = new Date(profile.exam_month);
  const now = new Date();
  const months = Math.max(1, Math.ceil(
    (examDate.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)
  ));

  const prompt = buildRoadmapPrompt({
    branch: profile.branch,
    level: profile.level,
    target_rank: profile.target_rank,
    months,
    weak_subjects: profile.weak_subjects ?? [],
    strong_subjects: profile.strong_subjects ?? [],
    daily_hours: profile.daily_hours,
  });

  const result = (await groqQuery(prompt, {
    taskType: "roadmap_generation",
    model: "generation",
  })) as RoadmapResult;

  // ── Store in roadmaps table ──
  await supabase.from("roadmaps").insert({
    archetype_hash: archetypeHash,
    roadmap_json: result as any,
    used_count: 1,
  });

  return result;
}
