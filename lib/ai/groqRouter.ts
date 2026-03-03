import Groq from "groq-sdk";
import { Redis } from "@upstash/redis";
import {
  hashPrompt,
  redisGet,
  redisSet,
  semanticCacheGet,
  semanticCacheSet,
} from "@/lib/cache/cacheManager";

// ─── Model cascade ───
// For "generation" tasks we try models in order until one succeeds.
// Llama 4 Scout: fast (2-4s), Llama 4 architecture, great JSON reliability.
// Falls back to 70B (proven), then 8B (last resort).
const MODEL_CASCADE: Record<"cheap" | "generation", string[]> = {
  cheap: ["llama-3.1-8b-instant"],
  generation: [
    "meta-llama/llama-4-scout-17b-16e-instruct", // Llama 4, 17B, fast
    "llama-3.3-70b-versatile",                    // proven fallback
    "llama-3.1-8b-instant",                       // last resort
  ],
};

// ─── Token caps per task type ───
export const TOKEN_CAPS: Record<string, { input: number; output: number }> = {
  question_generation: { input: 600, output: 600 },
  concept_explanation: { input: 300, output: 500 },
  roadmap_generation:  { input: 800, output: 1400 },
  mock_debrief:        { input: 500, output: 600 },
  ai_tutor:            { input: 400, output: 400 },
  difficulty_classify: { input: 100, output: 50 },
};

// For backwards-compat — keeps MODELS export working for any imports
export const MODELS = {
  cheap: "llama-3.1-8b-instant",
  generation: "meta-llama/llama-4-scout-17b-16e-instruct",
} as const;

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
  /** Pass embedding to enable semantic cache (Layer 2). */
  embedding?: number[];
  /** Skip cache layers entirely (useful for force-regeneration) */
  skipCache?: boolean;
  /** Override the system prompt for this specific task */
  systemPrompt?: string;
}

/**
 * 3-layer GROQ router:
 *   Layer 1 → Upstash Redis exact cache (prompt_hash → response, TTL 24h)
 *   Layer 2 → pgvector semantic cache (embedding similarity > 0.92)
 *   Layer 3 → GROQ API with round-robin key rotation + model cascade fallback
 *
 * All prompts must return ONLY valid JSON.
 */
export async function groqQuery(
  prompt: string,
  options: GroqRouterOptions
): Promise<unknown> {
  const { taskType, model = "generation", embedding, skipCache = false, systemPrompt } = options;
  const promptHash = hashPrompt(prompt);
  const caps = TOKEN_CAPS[taskType];

  // ── Layer 1: Redis exact cache ──
  if (!skipCache) {
    const cached = await redisGet(promptHash);
    if (cached) return JSON.parse(cached);
  }

  // ── Layer 2: pgvector semantic cache ──
  if (!skipCache && embedding) {
    const semanticHit = await semanticCacheGet(embedding);
    if (semanticHit) {
      await redisSet(promptHash, semanticHit);
      return JSON.parse(semanticHit);
    }
  }

  // ── Layer 3: GROQ API — model cascade + round-robin key rotation ──
  const keys = loadKeys();
  const startIndex = await getStartIndex(keys.length);
  const modelsToTry = MODEL_CASCADE[model];

  let response: Groq.Chat.Completions.ChatCompletion | undefined;
  let modelUsed = modelsToTry[0];
  let overallLastErr: unknown;

  for (const modelId of modelsToTry) {
    let modelSucceeded = false;
    let lastErr: unknown;

    for (let attempt = 0; attempt < Math.max(keys.length, 1); attempt++) {
      const keyIndex = (startIndex + attempt) % keys.length;
      try {
        const groq = new Groq({ apiKey: keys[keyIndex] });
        response = await groq.chat.completions.create({
          model: modelId,
          messages: [
            {
              role: "system",
              content: systemPrompt ??
                "You are a GATE CS exam question expert. Always return ONLY valid JSON. No preamble, no markdown, no explanation outside JSON.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: caps.output,
          temperature: 0.3,
          response_format: { type: "json_object" },
        });
        modelUsed = modelId;
        modelSucceeded = true;
        lastErr = undefined;
        break;
      } catch (err: any) {
        lastErr = err;
        if (err?.status === 429 || err?.status === 401) {
          continue; // rotate to next key
        }
        break; // model-level error (400, 404) — skip to next model
      }
    }

    if (modelSucceeded) break;
    overallLastErr = lastErr;
  }

  if (!response) throw overallLastErr ?? new Error("All GROQ models failed");

  const raw = response.choices[0]?.message?.content ?? "{}";
  const tokensUsed = response.usage?.total_tokens ?? 0;

  await redisSet(promptHash, raw);
  if (embedding) {
    await semanticCacheSet(promptHash, embedding, raw, modelUsed, tokensUsed);
  }

  return JSON.parse(raw);
}

/**
 * Embeddings stub — GROQ doesn't host embedding models.
 * Layer 2 (semantic cache) is gracefully disabled.
 */
export async function generateEmbedding(_text: string): Promise<number[]> {
  return new Array(768).fill(0);
}
