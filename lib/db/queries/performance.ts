import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import type { UserConceptState } from "@/lib/db/types";

export async function getMasteryState(
  userId: string,
  conceptId: string
): Promise<UserConceptState | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_concept_state")
    .select("*")
    .eq("user_id", userId)
    .eq("concept_id", conceptId)
    .single();
  if (error) return null;
  return data;
}

export async function updateConceptState(
  userId: string,
  conceptId: string,
  update: Partial<UserConceptState>
): Promise<UserConceptState> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_concept_state")
    .upsert(
      {
        user_id: userId,
        concept_id: conceptId,
        ...update,
        last_attempted: new Date().toISOString(),
      },
      { onConflict: "user_id,concept_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getWeakConcepts(
  userId: string,
  limit = 3
): Promise<
  (UserConceptState & { subject: string; topic: string; subtopic: string })[]
> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_concept_state")
    .select(
      "*, concepts!inner(subject, topic, subtopic)"
    )
    .eq("user_id", userId)
    .lt("mastery_score", 40)
    .order("mastery_score", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data as any[]).map((row) => ({
    ...row,
    subject: row.concepts.subject,
    topic: row.concepts.topic,
    subtopic: row.concepts.subtopic,
  }));
}

export async function getDueConceptsToday(userId: string): Promise<
  (UserConceptState & {
    concept_id: string;
    subject: string;
    topic: string;
    subtopic: string;
  })[]
> {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("user_concept_state")
    .select("*, concepts!inner(subject, topic, subtopic)")
    .eq("user_id", userId)
    .lte("next_review", today)
    .order("mastery_score", { ascending: true })
    .limit(8);

  if (error) throw error;
  return (data as any[]).map((row) => ({
    ...row,
    subject: row.concepts.subject,
    topic: row.concepts.topic,
    subtopic: row.concepts.subtopic,
  }));
}

export async function getSubjectMastery(
  userId: string
): Promise<Record<string, number>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_concept_state")
    .select("mastery_score, concepts!inner(subject)")
    .eq("user_id", userId);

  if (error) throw error;

  const subjectTotals: Record<string, { total: number; count: number }> = {};
  for (const row of data as any[]) {
    const subject = row.concepts.subject;
    if (!subjectTotals[subject]) subjectTotals[subject] = { total: 0, count: 0 };
    subjectTotals[subject].total += row.mastery_score;
    subjectTotals[subject].count++;
  }

  const result: Record<string, number> = {};
  for (const [subject, { total, count }] of Object.entries(subjectTotals)) {
    result[subject] = count > 0 ? Math.round(total / count) : 0;
  }
  return result;
}

export async function getMasteredConceptCount(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from("user_concept_state")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("mastery_score", 75);
  if (error) throw error;
  return count ?? 0;
}
