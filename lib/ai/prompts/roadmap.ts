interface RoadmapPromptArgs {
  branch: string;
  level: string;
  target_rank: number;
  months: number;
  weak_subjects: string[];
  strong_subjects: string[];
  daily_hours: number;
}

export function buildRoadmapPrompt(args: RoadmapPromptArgs): string {
  return `Generate a GATE CS study roadmap. Return ONLY valid JSON with no other text.

Profile:
- Branch: ${args.branch}
- Level: ${args.level}
- Target rank: ${args.target_rank}
- Months until exam: ${args.months}
- Daily hours available: ${args.daily_hours}
- Weak subjects: ${args.weak_subjects.join(", ") || "none identified"}
- Strong subjects: ${args.strong_subjects.join(", ") || "none identified"}

GATE CS subjects (with weightage): Maths(10), Algorithms(9), OS(9), CN(7), DBMS(7), COA(6), TOC(6), DS(6)

Create a realistic, phased study plan. Return this exact JSON schema:
{
  "phases": [
    {
      "phase": "number",
      "name": "string — phase name",
      "duration": "string — e.g., '3 weeks'",
      "daily_hours": number,
      "focus": ["subject1", "subject2"],
      "key_topics": ["topic1", "topic2", "topic3"],
      "milestone": "string — measurable milestone for this phase"
    }
  ],
  "weekly_split": {
    "concepts": number,
    "practice": number,
    "revision": number,
    "mocks": number
  },
  "priority_subjects": [
    {
      "subject": "string",
      "reason": "string — why this is priority",
      "target_accuracy": number
    }
  ]
}`;
}
