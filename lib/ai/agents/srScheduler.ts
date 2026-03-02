/**
 * Agent 6 — Spaced Repetition Scheduler (CRON — NO LLM)
 *
 * Runs nightly via QStash cron.
 * Pure SM-2 algorithm — builds tomorrow's review queue for all users.
 */
import { createAdminClient } from "@/lib/db/supabase-server";
import { setReviewQueue } from "@/lib/cache/cacheManager";

export async function runSRScheduler(): Promise<{ usersProcessed: number }> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Get all distinct user IDs with concept state
  const { data: rawUserIds } = await supabase
    .from("user_concept_state")
    .select("user_id");

  const userIds = rawUserIds as { user_id: string }[] | null;
  if (!userIds) return { usersProcessed: 0 };

  const uniqueUserIds = [...new Set(userIds.map((r: { user_id: string }) => r.user_id))];
  let usersProcessed = 0;

  for (const userId of uniqueUserIds) {
    // Fetch concepts due for review on or before tomorrow
    const { data: rawDueConcepts } = await supabase
      .from("user_concept_state")
      .select("concept_id, mastery_score")
      .eq("user_id", userId)
      .lte("next_review", tomorrowStr)
      .order("mastery_score", { ascending: true })
      .limit(20);

    const dueConcepts = rawDueConcepts as { concept_id: string; mastery_score: number }[] | null;
    if (!dueConcepts || dueConcepts.length === 0) continue;

    const conceptIds = dueConcepts.map((c: { concept_id: string }) => c.concept_id);

    // Store in Redis queue for tomorrow
    await setReviewQueue(userId, tomorrowStr, conceptIds);

    // Also update today's queue with today's due concepts
    const { data: rawTodayConcepts } = await supabase
      .from("user_concept_state")
      .select("concept_id, mastery_score")
      .eq("user_id", userId)
      .lte("next_review", today)
      .order("mastery_score", { ascending: true })
      .limit(8);

    const todayConcepts = rawTodayConcepts as { concept_id: string; mastery_score: number }[] | null;
    if (todayConcepts && todayConcepts.length > 0) {
      await setReviewQueue(userId, today, todayConcepts.map((c: { concept_id: string }) => c.concept_id));
    }

    usersProcessed++;
  }

  return { usersProcessed };
}
