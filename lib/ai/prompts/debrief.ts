interface DebriefPromptArgs {
  score: number;
  maxScore: number;
  weakConcepts: string[];
  subjectBreakdown: Record<string, { accuracy: number; attempted: number }>;
  previousScore?: number;
}

export function buildDebriefPrompt(args: DebriefPromptArgs): string {
  const subjectLines = Object.entries(args.subjectBreakdown)
    .map(([s, d]) => `${s}: ${d.accuracy}% accuracy (${d.attempted} attempted)`)
    .join(", ");

  return `Analyze this GATE CS mock test result and provide personalized feedback. Return ONLY valid JSON.

Score: ${args.score.toFixed(2)} / ${args.maxScore}
${args.previousScore !== undefined ? `Previous score: ${args.previousScore.toFixed(2)} / ${args.maxScore}` : ""}
Subject performance: ${subjectLines}
Weak concepts this test: ${args.weakConcepts.join(", ") || "none identified"}

Return this exact JSON schema:
{
  "weak_areas": ["string — top 3 weak areas with specific advice"],
  "focus_this_week": ["string — 3 specific action items for next week"],
  "improvement": "string — compare to previous test or give baseline advice",
  "predicted_improvement": "string — realistic expected rank improvement with consistent effort"
}`;
}
