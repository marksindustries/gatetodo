/**
 * Agent 1 — Question Generator
 *
 * Logic:
 *  1. Check generated_questions for ≥3 cached questions at concept+difficulty
 *  2. If cache hit → return random cached question (NO LLM)
 *  3. If cache miss → call GROQ 70b → store in DB → return
 */
import { createAdminClient } from "@/lib/db/supabase-server";
import { getConceptById } from "@/lib/db/queries/concepts";
import { groqQuery, generateEmbedding } from "@/lib/ai/groqRouter";
import { buildQuestionPrompt } from "@/lib/ai/prompts/question";
import type { GeneratedQuestion } from "@/lib/db/types";

const REUSE_THRESHOLD = 3;

export async function generateQuestion(
  conceptId: string,
  difficulty: number,
  questionType: "MCQ" | "NAT" = "MCQ"
): Promise<GeneratedQuestion> {
  const supabase = createAdminClient();

  // ── Step 1: Check cache ──
  const { data: cached } = await supabase
    .from("generated_questions")
    .select("*")
    .eq("concept_id", conceptId)
    .eq("difficulty", difficulty)
    .eq("question_type", questionType)
    .gte("reuse_count", 0)
    .order("reuse_count", { ascending: true })
    .limit(10);

  if (cached && cached.length >= REUSE_THRESHOLD) {
    // Pick a random question from the cached pool
    const question = cached[Math.floor(Math.random() * cached.length)];

    // Bump reuse count
    await supabase.rpc("increment_question_reuse", { question_id: question.id });

    return question;
  }

  // ── Step 2: Cache miss → generate via GROQ ──
  const concept = await getConceptById(conceptId);
  if (!concept) throw new Error(`Concept ${conceptId} not found`);

  const prompt = buildQuestionPrompt(concept, difficulty, questionType);
  const result = (await groqQuery(prompt, {
    taskType: "question_generation",
    model: "cheap", // llama-3.1-8b-instant: ~1-2s, handles structured JSON reliably
    systemPrompt:
      "You are a GATE CS exam question generator. " +
      "Return ONLY a valid JSON object — no markdown, no code fences, no extra text. " +
      "Follow the exact JSON schema in the prompt precisely. " +
      "MCQ: provide 4 distinct plausible options with exactly one correct answer. " +
      "NAT: the answer must be an exact number (integer or up to 2 decimal places).",
  })) as {
    question: string;
    options: { A: string; B: string; C: string; D: string } | null;
    answer: string;
    solution: string;
    marks: 1 | 2;
    type: "MCQ" | "NAT";
  };

  // Generate embedding for the question text
  const embedding = await generateEmbedding(result.question);

  // ── Step 3: Store in DB ──
  const { data: newQuestion, error } = await supabase
    .from("generated_questions")
    .insert({
      concept_id: conceptId,
      question_text: result.question,
      options: result.options,
      answer: result.answer,
      solution: result.solution,
      question_type: questionType,
      difficulty,
      marks: result.marks,
      reuse_count: 1,
      embedding: embedding as any,
    })
    .select()
    .single();

  if (error) throw error;
  return newQuestion;
}
