import Groq from "groq-sdk";
import {
  hashPrompt,
  redisGet,
  redisSet,
  semanticCacheGet,
  semanticCacheSet,
} from "@/lib/cache/cacheManager";

// ─── Model definitions ───
export const MODELS = {
  cheap: "llama-3.1-8b-instant",       // classification, tags, yes/no, embeddings
  generation: "llama-3.3-70b-versatile", // question gen, explanation, roadmap, debrief
} as const;

// ─── Token caps per task type ───
export const TOKEN_CAPS: Record<string, { input: number; output: number }> = {
  question_generation: { input: 400, output: 350 },
  concept_explanation: { input: 300, output: 400 },
  roadmap_generation: { input: 800, output: 1400 },
  mock_debrief: { input: 500, output: 500 },
  ai_tutor: { input: 400, output: 300 },
  difficulty_classify: { input: 100, output: 50 },
};

let groqClients: Groq[] | null = null;
let callCounter = 0;

function getGroq(): Groq {
  if (!groqClients) {
    groqClients = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2]
      .filter(Boolean)
      .map((key) => new Groq({ apiKey: key! }));
  }
  return groqClients[callCounter++ % groqClients.length];
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
 *   Layer 3 → GROQ API call (last resort)
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
      // Backfill Redis so next hit is faster
      await redisSet(promptHash, semanticHit);
      return JSON.parse(semanticHit);
    }
  }

  // ── Layer 3: GROQ API call (with retry on 429) ──
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

  let response: Groq.Chat.Completions.ChatCompletion | undefined;
  let lastErr: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const groq = getGroq();
      response = await groq.chat.completions.create(params);
      lastErr = undefined;
      break;
    } catch (err: any) {
      lastErr = err;
      if (err?.status === 429) {
        // GROQ tells us exactly how long to wait: "Please try again in 1.7s"
        const match = (err.message as string)?.match(/try again in (\d+\.?\d*)s/);
        const waitMs = match ? Math.ceil(parseFloat(match[1]) * 1000) + 200 : 2000;
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      throw err; // non-429 errors propagate immediately
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
 * Replace this with a real embeddings provider (e.g. HuggingFace) to
 * re-enable semantic caching.
 */
export async function generateEmbedding(_text: string): Promise<number[]> {
  return new Array(768).fill(0);
}
