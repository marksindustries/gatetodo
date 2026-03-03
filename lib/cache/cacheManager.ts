import { Redis } from "@upstash/redis";
import { createAdminClient } from "@/lib/db/supabase-server";
import crypto from "crypto";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

export function hashPrompt(prompt: string): string {
  return crypto.createHash("sha256").update(prompt).digest("hex");
}

// ─── Layer 1: Redis exact cache ───
export async function redisGet(promptHash: string): Promise<string | null> {
  try {
    const result = await getRedis().get(`llm:${promptHash}`);
    if (result === null || result === undefined) return null;
    // Upstash SDK auto-deserializes valid JSON on read — normalize back to string
    // so callers can always do JSON.parse(cached) safely.
    if (typeof result !== "string") return JSON.stringify(result);
    return result;
  } catch {
    return null;
  }
}

export async function redisSet(
  promptHash: string,
  response: string,
  ttlSeconds = 86400 // 24 hours
): Promise<void> {
  try {
    await getRedis().setex(`llm:${promptHash}`, ttlSeconds, response);
  } catch {
    // Cache write failure is non-fatal
  }
}

// ─── Layer 2: pgvector semantic cache ───
export async function semanticCacheGet(
  embedding: number[],
  threshold = 0.92
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_llm_cache", {
    query_embedding: embedding,
    similarity_threshold: threshold,
    match_count: 1,
  });

  if (error || !data || data.length === 0) return null;

  // Bump hit count
  await supabase.rpc("increment_cache_hit", { cache_id: data[0].id });
  return data[0].response;
}

export async function semanticCacheSet(
  promptHash: string,
  embedding: number[],
  response: string,
  modelUsed: string,
  tokensUsed: number
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("llm_cache").upsert(
    {
      prompt_hash: promptHash,
      prompt_embedding: embedding as any,
      response,
      model_used: modelUsed,
      tokens_used: tokensUsed,
    },
    { onConflict: "prompt_hash" }
  );
}

// ─── Redis queue helpers (spaced repetition) ───
export async function getReviewQueue(
  userId: string,
  date: string
): Promise<string[]> {
  try {
    const result = await getRedis().get<string[]>(`queue:${userId}:${date}`);
    return result ?? [];
  } catch {
    return [];
  }
}

export async function setReviewQueue(
  userId: string,
  date: string,
  conceptIds: string[]
): Promise<void> {
  try {
    // TTL = 2 days so stale queues auto-expire
    await getRedis().setex(`queue:${userId}:${date}`, 172800, JSON.stringify(conceptIds));
  } catch {}
}

// ─── Rate limiter helpers ───
export async function incrementCounter(
  key: string,
  windowSeconds: number
): Promise<number> {
  const r = getRedis();
  const count = await r.incr(key);
  if (count === 1) {
    await r.expire(key, windowSeconds);
  }
  return count;
}
