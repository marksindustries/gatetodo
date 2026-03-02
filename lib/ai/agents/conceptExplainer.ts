/**
 * Agent 3 — Concept Explainer (RAG-powered)
 *
 * Logic:
 *  1. Embed user question
 *  2. Check llm_cache semantic layer
 *  3. Cache miss → RAG search on rag_documents (top 4 chunks)
 *  4. Build grounded prompt with retrieved context
 *  5. Call GROQ 70b, max 400 output tokens
 *  6. Cache result
 *  7. Return { explanation, source, exam_tip }
 */
import { createAdminClient } from "@/lib/db/supabase-server";
import { getConceptById } from "@/lib/db/queries/concepts";
import { groqQuery, generateEmbedding } from "@/lib/ai/groqRouter";
import { buildExplanationPrompt } from "@/lib/ai/prompts/explanation";

interface ExplainResult {
  explanation: string;
  concept: string;
  exam_tip: string;
  source: string;
}

export async function explainConcept(
  conceptId: string,
  userQuestion: string
): Promise<ExplainResult> {
  const supabase = createAdminClient();

  // ── Step 1 & 2: Embed and check semantic cache ──
  const embedding = await generateEmbedding(userQuestion);

  // ── Step 3: RAG search ──
  const concept = await getConceptById(conceptId);
  if (!concept) throw new Error(`Concept ${conceptId} not found`);

  const { data: ragChunks } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.6,
    match_count: 4,
    filter_subject: concept.subject,
  });

  let ragContext = "";
  if (ragChunks && ragChunks.length > 0) {
    ragContext = ragChunks
      .map((c: { content: string; source: string }) => `[${c.source}]: ${c.content}`)
      .join("\n\n");
  } else {
    // Fallback: use concept description as context
    ragContext = `[GATEprep]: ${concept.description ?? ""}\nExam tip: ${concept.exam_tips ?? ""}`;
  }

  // ── Step 4 & 5: Build prompt and call GROQ ──
  const prompt = buildExplanationPrompt(concept, userQuestion, ragContext);
  const result = (await groqQuery(prompt, {
    taskType: "concept_explanation",
    model: "generation",
    embedding,
  })) as ExplainResult;

  return result;
}
