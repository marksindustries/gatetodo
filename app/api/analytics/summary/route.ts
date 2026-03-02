import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { getAccuracy, getStudyStreak } from "@/lib/db/queries/attempts";
import {
  getMasteredConceptCount,
  getSubjectMastery,
  getWeakConcepts,
  getDueConceptsToday,
} from "@/lib/db/queries/performance";
import { predictRank } from "@/lib/algorithms/rankPredictor";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "30d";
  const days = period === "7d" ? 7 : period === "all" ? 36500 : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    accuracy,
    streak,
    masteredCount,
    subjectMastery,
    weakConcepts,
    dueToday,
    latestMock,
  ] = await Promise.all([
    getAccuracy(user.id, since),
    getStudyStreak(user.id),
    getMasteredConceptCount(user.id),
    getSubjectMastery(user.id),
    getWeakConcepts(user.id, 3),
    getDueConceptsToday(user.id),
    supabase
      .from("mock_sessions")
      .select("total_score, max_score, predicted_rank, started_at")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const mockData = latestMock.data;
  const predictedRank =
    mockData?.predicted_rank ??
    (mockData?.total_score && mockData?.max_score
      ? predictRank((mockData.total_score / mockData.max_score) * 100)
      : null);

  // Mock score trend
  const { data: mockHistory } = await supabase
    .from("mock_sessions")
    .select("total_score, max_score, started_at")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: true })
    .limit(20);

  const scoreTrend = (mockHistory ?? []).map((m) => ({
    date: new Date(m.started_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    score: m.max_score > 0 ? Math.round((m.total_score / m.max_score) * 100) : 0,
  }));

  return NextResponse.json({
    stats: {
      masteredCount,
      accuracy: accuracy.accuracy,
      streak,
      predictedRank,
    },
    subjectMastery,
    weakConcepts,
    dueToday,
    scoreTrend,
  });
}
