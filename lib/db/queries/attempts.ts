import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import type { UserAttempt } from "@/lib/db/types";

export async function saveAttempt(attempt: {
  user_id: string;
  question_id: string;
  concept_id: string;
  is_correct: boolean;
  time_taken_sec?: number;
  selected_answer?: string;
}): Promise<UserAttempt> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_attempts")
    .insert(attempt)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserAttempts(
  userId: string,
  limit = 100
): Promise<UserAttempt[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("attempted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getAccuracy(
  userId: string,
  since?: Date
): Promise<{ correct: number; total: number; accuracy: number }> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("user_attempts")
    .select("is_correct")
    .eq("user_id", userId);

  if (since) {
    query = query.gte("attempted_at", since.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  const total = data.length;
  const correct = data.filter((a) => a.is_correct).length;
  return {
    correct,
    total,
    accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
  };
}

export async function getStudyStreak(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_attempts")
    .select("attempted_at")
    .eq("user_id", userId)
    .order("attempted_at", { ascending: false });

  if (error || !data.length) return 0;

  const dates = [
    ...new Set(
      data.map((a) => new Date(a.attempted_at).toISOString().split("T")[0])
    ),
  ].sort((a, b) => (a > b ? -1 : 1));

  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let expected = today;

  for (const date of dates) {
    if (date === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  return streak;
}
