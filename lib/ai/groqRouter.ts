import Groq from "groq-sdk";
import { Redis } from "@upstash/redis";
import {
  hashPrompt,
  redisGet,
  redisSet,
  semanticCacheGet,
  semanticCacheSet,
} from "@/lib/cache/cacheManager";

// ─── Model definitions ───
export const MODELS = {
  cheap: "llama-3.1-8b-instant",           // classification, tags, yes/no
  generation: "meta-llama/llama-4-scout-17b-16e-instruct", // Llama 4, 17B, fast + reliable JSON
} as const;

// ─── Token caps per task type ───
export const TOKEN_CAPS: Record<string, { input: number; output: number }> = {
  question_generation: { input: 600, output: 600 },
  concept_explanation: { input: 300, output: 500 },
  roadmap_generation:  { input: 800, output: 1400 },
  mock_debrief:        { input: 500, output: 600 },
  ai_tutor:            { input: 400, output: 400 },
  difficulty_classify: { input: 100, output: 50 },
};

// ─── Key loading: supports GROQ_API_KEY_1, GROQ_API_KEY_2, ... fallback to GROQ_API_KEY ───
function loadKeys(): string[] {
  const numbered = Array.from({ length: 10 }, (_, i) =>
    process.env[`GROQ_API_KEY_${i + 1}`]
  ).filter(Boolean) as string[];
  return numbered.length > 0
    ? numbered
    : [process.env.GROQ_API_KEY!].filter(Boolean);
}

// ─── Redis atomic counter — persists across serverless cold starts ───
// Each call to groqQuery picks the next key globally, giving true round-robin.
async function getStartIndex(numKeys: number): Promise<number> {
  if (numKeys <= 1) return 0;
  try {
    const r = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const counter = await r.incr("groq:key_counter");
    return Number(counter) % numKeys;
  } catch {
    return Math.floor(Math.random() * numKeys);
  }
}

interface GroqRouterOptions {
  taskType: keyof typeof TOKEN_CAPS;
  model?: "cheap" | "generation";
  /** Pass embedding to enable semantic cache (Layer 2). If omitted, only Redis cache is checked. */
  embedding?: number[];
  /** Skip cache layers entirely (useful for force-regeneration) */
  skipCache?: boolean;
}

/**
 * 3-layer GROQ router:
 *   Layer 1 → Upstash Redis exact cache (prompt_hash → response, TTL 24h)
 *   Layer 2 → pgvector semantic cache (embedding similarity > 0.92)
 *   Layer 3 → GROQ API call with Redis round-robin key rotation
 *
 * All prompts must return ONLY valid JSON.
 */
export async function groqQuery(
  prompt: string,
  options: GroqRouterOptions
): Promise<unknown> {
  const { taskType, model = "generation", embedding, skipCache = false } = options;
  const promptHash = hashPrompt(prompt);
  const modelId = MODELS[model];
  const caps = TOKEN_CAPS[taskType];

  // ── Layer 1: Redis exact cache ──
  if (!skipCache) {
    const cached = await redisGet(promptHash);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  // ── Layer 2: pgvector semantic cache ──
  if (!skipCache && embedding) {
    const semanticHit = await semanticCacheGet(embedding);
    if (semanticHit) {
      await redisSet(promptHash, semanticHit);
      return JSON.parse(semanticHit);
    }
  }

  // ── Layer 3: GROQ API call with round-robin key rotation ──
  const params = {
    model: modelId,
    messages: [
      {
        role: "system" as const,
        content:
          "You are a GATE CS exam question expert. Always return ONLY valid JSON. No preamble, no markdown, no explanation outside JSON.",
      },
      { role: "user" as const, content: prompt },
    ],
    max_tokens: caps.output,
    temperature: 0.3,
    response_format: { type: "json_object" as const },
  };

  const keys = loadKeys();
  const startIndex = await getStartIndex(keys.length);

  let response: Groq.Chat.Completions.ChatCompletion | undefined;
  let lastErr: unknown;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (startIndex + attempt) % keys.length;
    try {
      const groq = new Groq({ apiKey: keys[keyIndex] });
      response = await groq.chat.completions.create(params);
      lastErr = undefined;
      break;
    } catch (err: any) {
      lastErr = err;
      if (err?.status === 429 || err?.status === 401) {
        continue; // rotate to next key immediately
      }
      throw err; // non-rate-limit errors propagate immediately
    }
  }

  if (lastErr) throw lastErr;

  const raw = response!.choices[0]?.message?.content ?? "{}";
  const tokensUsed = response!.usage?.total_tokens ?? 0;

  // Store in Redis (Layer 1)
  await redisSet(promptHash, raw);

  // Store in pgvector semantic cache (Layer 2) if embedding provided
  if (embedding) {
    await semanticCacheSet(promptHash, embedding, raw, modelId, tokensUsed);
  }

  return JSON.parse(raw);
}

/**
 * Generate text embeddings.
 * GROQ does not host an embeddings model, so Layer 2 (semantic cache)
 * is gracefully disabled — Layer 1 (Redis exact cache) remains active.
 */
export async function generateEmbedding(_text: string): Promise<number[]> {
  return new Array(768).fill(0);
}
