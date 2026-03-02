/**
 * Warm the question cache by pre-generating common questions.
 * Run: npx tsx scripts/warmCache.ts
 *
 * This pre-generates questions for high-weightage concepts at common difficulties,
 * so the first users don't experience cold cache latency.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Top priority concepts (Maths, Algorithms, OS have highest weightage)
const PRIORITY_SUBJECTS = ["Maths", "Algorithms", "OS"];
const DIFFICULTIES = [2, 3, 4];

async function warmConceptCache(conceptId: string, difficulty: number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/questions/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Service role bypass — use internal token in production
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ concept_id: conceptId, difficulty, type: "MCQ" }),
  });

  if (res.ok) {
    console.log(`✓ Warmed concept ${conceptId} at difficulty ${difficulty}`);
  } else {
    console.error(`✗ Failed concept ${conceptId} at difficulty ${difficulty}`);
  }
}

async function main() {
  console.log("Warming question cache...");

  const { data: concepts } = await supabase
    .from("concepts")
    .select("id, subject, subtopic, weightage_score")
    .in("subject", PRIORITY_SUBJECTS)
    .order("weightage_score", { ascending: false })
    .limit(20);

  if (!concepts) {
    console.error("No concepts found. Run seed first.");
    process.exit(1);
  }

  for (const concept of concepts) {
    for (const difficulty of DIFFICULTIES) {
      await warmConceptCache(concept.id, difficulty);
      // Small delay to avoid overwhelming GROQ API
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n✓ Cache warming complete. Warmed ${concepts.length * DIFFICULTIES.length} question slots.`);
}

main().catch(console.error);
