/**
 * One-time script to seed concepts.
 * Run: npx tsx scripts/seedConcepts.ts
 *
 * Prerequisites:
 *   - SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL set in .env.local
 *   - Run supabase/migrations/001_schema.sql first via Supabase dashboard
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Seeding concepts...");

  // The seed data is in 003_seed_concepts.sql
  // Run that SQL directly in the Supabase dashboard, or use the Supabase CLI:
  // supabase db push

  const { data, error } = await supabase
    .from("concepts")
    .select("id", { count: "exact" });

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log(`✓ ${data?.length ?? 0} concepts already in database.`);
  console.log("To seed: Run supabase/migrations/003_seed_concepts.sql in your Supabase dashboard.");
}

main().catch(console.error);
