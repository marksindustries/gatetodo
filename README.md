Build a full-stack GATE CS exam preparation platform called "GATEprep" — a React/Next.js 14 app 
with Supabase backend, Upstash Redis caching, and GROQ AI integration. NO PYQ (Previous Year 
Questions) anywhere in the app. The core product is AI-generated adaptive concept mastery.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:     Next.js 14 App Router + TailwindCSS + shadcn/ui
Auth:         Supabase Auth (email + Google OAuth)
Database:     Supabase Postgres + pgvector extension
Cache:        Upstash Redis (exact cache) + pgvector (semantic cache)
Queue:        Upstash QStash (async AI jobs)
Rate Limit:   Upstash Ratelimit
AI/LLM:       GROQ API — llama-3.1-8b for cheap tasks, llama-3.3-70b for generation
Embeddings:   GROQ llama-3.1-8b or nomic-embed-text
Payments:     Razorpay (monthly ₹299, annual ₹2499)
Deployment:   Vercel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Theme:        Dark. Background #0a0e1a. Cards #111827. Borders #1e293b.
Accent:       Amber #f59e0b (primary), Emerald #10b981 (success), 
              Indigo #818cf8 (info), Red #ef4444 (danger)
Typography:   Syne (headings, display numbers) + IBM Plex Mono (body, code, data)
Style:        Monospace-first, terminal-inspired, data-dense but clean.
              No purple gradients. No rounded bubbly cards. Sharp, technical, serious.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- User profiles
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  name text,
  branch text DEFAULT 'CS',
  level text,              -- 'beginner' | 'intermediate' | 'advanced'
  target_rank int,         -- e.g. 500
  exam_month date,
  daily_hours int,
  created_at timestamp
)

-- Concept tree (seeded once, never AI-generated)
concepts (
  id uuid PRIMARY KEY,
  subject text,            -- 'OS' | 'CN' | 'DBMS' | 'Algorithms' | 'COA' | 'TOC' | 'DS' | 'Maths'
  topic text,              -- 'Deadlock' | 'TCP/IP' | 'Normalization'
  subtopic text,           -- 'Banker Algorithm' | '3-Way Handshake'
  weightage_score float,   -- 1-10, manually set once based on GATE importance
  difficulty_base int,     -- 1-5 default difficulty
  description text,        -- brief concept description
  exam_tips text           -- one-line exam tip
)

-- AI-generated questions cache (reused across users)
generated_questions (
  id uuid PRIMARY KEY,
  concept_id uuid REFERENCES concepts,
  question_text text,
  options jsonb,           -- {A,B,C,D} or null for NAT
  answer text,
  solution text,
  question_type text,      -- 'MCQ' | 'NAT'
  difficulty int,          -- 1-5
  marks int,               -- 1 or 2
  reuse_count int DEFAULT 0,
  embedding vector(1536),
  generated_at timestamp
)

-- User spaced repetition state (per concept, not per question)
user_concept_state (
  user_id uuid,
  concept_id uuid,
  ease_factor float DEFAULT 2.5,   -- SM-2
  interval_days int DEFAULT 1,
  next_review date,
  repetitions int DEFAULT 0,
  mastery_score float DEFAULT 0,   -- 0-100
  last_attempted timestamp,
  PRIMARY KEY (user_id, concept_id)
)

-- User question attempts
user_attempts (
  id uuid PRIMARY KEY,
  user_id uuid,
  question_id uuid,
  concept_id uuid,
  is_correct boolean,
  time_taken_sec int,
  selected_answer text,
  attempted_at timestamp
)

-- RAG knowledge base (scraped + chunked content)
rag_documents (
  id uuid PRIMARY KEY,
  source text,             -- 'gfg' | 'nptel' | 'web'
  subject text,
  topic text,
  content text,
  url text,
  embedding vector(1536),
  created_at timestamp
)

-- LLM semantic cache
llm_cache (
  id uuid PRIMARY KEY,
  prompt_hash text UNIQUE,
  prompt_embedding vector(1536),
  response text,
  model_used text,
  tokens_used int,
  hit_count int DEFAULT 0,
  created_at timestamp
)

-- Async job queue tracking
llm_jobs (
  id uuid PRIMARY KEY,
  user_id uuid,
  job_type text,           -- 'roadmap_gen' | 'mock_debrief' | 'concept_explain'
  status text DEFAULT 'pending',
  input_payload jsonb,
  output_payload jsonb,
  created_at timestamp,
  completed_at timestamp
)

-- User roadmaps (cached per archetype)
roadmaps (
  id uuid PRIMARY KEY,
  archetype_hash text UNIQUE,   -- sha256(branch+level+target+months)
  roadmap_json jsonb,
  generated_at timestamp,
  used_count int DEFAULT 0
)

-- Mock test sessions
mock_sessions (
  id uuid PRIMARY KEY,
  user_id uuid,
  started_at timestamp,
  completed_at timestamp,
  total_score float,
  max_score float,
  time_taken_sec int,
  subject_breakdown jsonb,
  predicted_rank int,
  debrief_json jsonb
)

-- Subscription tracking
subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE,
  plan text,               -- 'free' | 'monthly' | 'annual'
  status text,             -- 'active' | 'cancelled' | 'expired'
  razorpay_subscription_id text,
  current_period_end timestamp
)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI ARCHITECTURE — TOKEN COST CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1: Every LLM call checks 3 layers before firing:
  Layer 1 → Upstash Redis exact cache (prompt_hash → response, TTL 24h)
  Layer 2 → pgvector semantic cache (embedding similarity > 0.92)
  Layer 3 → GROQ API call (last resort only)

RULE 2: Model selection by task:
  llama-3.1-8b  → classification, tag extraction, yes/no, embeddings
  llama-3.3-70b → question generation, explanations, roadmap, debrief

RULE 3: All prompts return ONLY valid JSON. No preamble. No markdown. No filler.

RULE 4: Max token caps per task:
  Question generation:  400 input / 350 output
  Concept explanation:  300 input / 400 output
  Roadmap generation:   600 input / 700 output
  Mock debrief:         500 input / 500 output
  AI tutor response:    400 input / 300 output
  Difficulty classify:  100 input / 50 output  (8b model)

RULE 5: Generated questions are cached in generated_questions table.
  All users at same difficulty+concept reuse the same question.
  New question generated only when reuse_count < 3 options available.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI AGENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AGENT 1 — Question Generator
  Input:  concept_id, difficulty (1-5), question_type (MCQ|NAT), user_id
  Logic:
    1. Check generated_questions for existing question at this concept+difficulty
    2. If 3+ cached options exist → return random cached question (NO LLM)
    3. If cache miss → call GROQ 70b with this prompt:
       "Generate a GATE CS exam question. Return ONLY JSON.
        Subject: {subject}, Topic: {topic}, Subtopic: {subtopic}
        Difficulty: {difficulty}/5, Type: {MCQ|NAT}, Marks: {1|2}
        Schema: {question, options{A,B,C,D} or null, answer, solution, marks, type}"
    4. Store in generated_questions with embedding
    5. Return question

AGENT 2 — Answer Evaluator
  Input:  question_id, user_answer, user_id
  Logic:
    MCQ → pure DB lookup, NO LLM
    NAT → rule-based number check, NO LLM
    After evaluation:
      Update user_attempts table
      Run SM-2 algorithm to update user_concept_state
      Return {correct, explanation, next_review_date}

AGENT 3 — Concept Explainer (RAG-powered)
  Input:  concept_id, user_question_text
  Logic:
    1. Embed user question
    2. Check llm_cache semantic layer
    3. Cache miss → RAG search on rag_documents (top 4 chunks)
    4. Build grounded prompt with retrieved context
    5. Call GROQ 70b, max 400 output tokens
    6. Cache result
    7. Return {explanation, source, exam_tip}

AGENT 4 — Roadmap Generator
  Input:  user profile (branch, level, target_rank, months, weak_subjects)
  Logic:
    1. Hash profile → archetype_hash
    2. Check roadmaps table for existing archetype
    3. Cache hit → return immediately (NO LLM)
    4. Cache miss → call GROQ 70b:
       "Generate GATE CS study roadmap. JSON only.
        Profile: {branch, level, target, months, weak[], strong[]}
        Schema: {phases[{phase,duration,daily_hours,focus[],key_topics[],milestone}],
                 weekly_split{concepts,practice,revision,mocks},
                 priority_subjects[{subject,reason,target_accuracy}]}"
    5. Store in roadmaps with archetype_hash
    6. Return roadmap (all future users with same archetype reuse this)

AGENT 5 — Mock Test Debrief (ASYNC via QStash)
  Input:  mock_session_id
  Logic:
    1. Pure math computation first (NO LLM):
       - Subject-wise accuracy %
       - Time distribution per subject
       - Predicted rank from score percentile table
       - Weak concept identification
    2. Hash weak_concepts_combo → check llm_cache
    3. Cache miss only → GROQ 70b for personalized insight
       Max 500 output tokens. JSON only.
    4. Store debrief in mock_sessions.debrief_json
    5. Notify client via Supabase Realtime

AGENT 6 — Spaced Repetition Scheduler (CRON — NO LLM)
  Runs nightly via QStash cron
  Pure SM-2 algorithm:
    For each user:
      Fetch concepts where next_review <= today
      Add to tomorrow's practice queue
      Store in Redis (key: queue:{user_id}:{date})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGES & FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAGE 1 — /onboarding
  Multi-step form (no page reload between steps):
    Step 1: Name + branch (CS only for v1)
    Step 2: Current level (Beginner / Intermediate / Advanced)
              Beginner   = starting fresh, < 1 month prep
              Intermediate = 1-4 months prep, some concepts known
              Advanced   = 4+ months, just needs gap filling
    Step 3: Target (Top 100 / Top 500 / Top 1000 / PSU Cutoff)
    Step 4: Exam month + daily hours available (slider 1-8hrs)
    Step 5: Self-rate each subject (drag slider 0-100 per subject)
              OS, CN, DBMS, Algorithms, COA, TOC, DS, Engineering Maths
  On submit:
    Create profile in DB
    Trigger roadmap generation job (async)
    Redirect to dashboard

PAGE 2 — /dashboard
  Header: "Good morning {name}" + streak badge + days until exam countdown
  
  Row 1 — 4 stat cards:
    Concepts Mastered (count from user_concept_state where mastery_score > 75)
    Overall Accuracy (from user_attempts)
    Study Streak (consecutive days with attempts)
    Predicted Rank (from latest mock_session)
  
  Row 2 — 2 charts side by side:
    Left:  Mastery Radar (subject-wise mastery_score average, recharts RadarChart)
    Right: Score Trend (mock scores over time, recharts LineChart)
  
  Row 3 — Today's Queue:
    List of concepts due for review today (from Redis queue:{user_id}:{today})
    Each card shows: Subject tag, Topic, Last mastery score, "Practice Now" CTA
    Max 8 concepts shown. "View all" expands.
  
  Row 4 — Weak Areas Alert:
    Top 3 concepts with mastery_score < 40
    Red-bordered cards with "Focus Today" button
  
  Row 5 — Subject Progress:
    Horizontal progress bars for all 8 subjects
    Shows avg mastery % per subject
    Color: red <40, amber 40-70, green >70

PAGE 3 — /practice
  Layout: Left panel (concept selector) + Right panel (question area)
  
  LEFT PANEL (280px):
    Subject accordion menu:
      OS > Process Management > Scheduling, Deadlock, Memory
      CN > Network Layer > IP, Routing, TCP, UDP
      DBMS > Relational > Normalization, Transactions, SQL
      Algorithms > Sorting > QuickSort, MergeSort, Heap
      COA > Pipelining, Cache, Number Systems
      TOC > DFA, NFA, PDA, Turing Machine
      DS > Trees, Graphs, Hashing, Dynamic Programming
      Maths > Probability, Linear Algebra, Calculus, Graph Theory
    
    Each leaf concept shows:
      Mastery score badge (color-coded)
      Next review date
      Click → loads that concept in right panel
    
    Bottom of left panel:
      Session stats (questions done today, accuracy today)
      "Surprise Me" button → picks weakest due concept
  
  RIGHT PANEL:
    Top bar: Subject > Topic > Subtopic breadcrumb + difficulty dots (1-5)
    
    Concept Quick Reference (collapsible):
      One-paragraph concept summary
      Key formula or rule
      Exam tip
      Source citation
    
    Question Card:
      Question text (dark code-style box)
      For MCQ: 4 option buttons (A/B/C/D)
        States: default → hover → selected → revealed(correct/wrong)
      For NAT: text input with number validation
      
      Bottom bar:
        [Check Answer] → reveals correct answer + solution
        [Next Question] → loads next question at adjusted difficulty
        [Explain Concept] → opens RAG-powered explanation panel
        [Skip] → moves on, marks as skipped
    
    After answer reveal:
      Solution box (shows step-by-step reasoning)
      SM-2 feedback buttons (only if answer was CORRECT):
        [Easy] [Good] [Hard] → updates ease_factor and interval
      If wrong: Auto-schedules concept for review tomorrow
    
    Right sidebar (200px):
      Mastery gauge for current concept (circular progress)
      Recent attempts on this concept (last 5, correct/wrong dots)
      "Concept Map" button → shows related concepts

PAGE 4 — /roadmap
  
  Top: Profile summary card (branch, level, target, months left)
       [Regenerate] button (rate-limited: 3/day)
  
  If roadmap exists:
    Phase timeline (horizontal stepper for desktop, vertical for mobile):
      Phase 1 card: Name, Duration, Daily hours, Focus subjects, Key topics, Milestone
      Phase 2 card: (same structure)
      Phase 3 card: (same structure)
    
    Weekly Time Split donut chart:
      Concepts / Practice / Revision / Mocks (recharts PieChart)
    
    Priority Subjects table:
      Subject | Reason | Target Accuracy | Current Mastery | Gap
    
    Subject Schedule grid:
      Week-by-week what to study (generated from roadmap phases)
      Color-coded by subject
  
  If generating (async job pending):
    Skeleton loader + "Personalizing your roadmap..." message
    Supabase Realtime listener updates UI when job completes

PAGE 5 — /mock
  
  Pre-test screen:
    Test configuration:
      Full Test (65 questions, 180 min) — PAID only
      Subject Test (20 questions, 60 min, pick subject) — FREE (2/day)
      Speed Round (10 questions, 15 min) — FREE (unlimited)
    
    Rules reminder: +1 or +2 for correct, -0.33 or -0.67 for wrong, 0 for skipped
    [Start Test] button
  
  Test screen (full page, no nav):
    Top bar: Timer (countdown) + Score estimate + Question counter
    
    Left panel: Question navigator grid (65 circles, color: unattempted/answered/marked)
    
    Main area: Current question (same UI as practice but no solution visible)
    
    Bottom: [Previous] [Mark for Review] [Next] [Submit Test]
    
    NAT questions: Virtual numpad (matches GATE interface exactly)
  
  Post-test / Debrief screen (async loaded):
    Score card: Score / Max + Percentile estimate + Predicted rank
    
    Subject breakdown table:
      Subject | Attempted | Correct | Wrong | Score | Accuracy
    
    Time analysis:
      Time spent per subject (bar chart)
      Questions that took longest (flagged for review)
    
    AI Debrief section (loads async, shows skeleton until QStash job completes):
      "Your weak areas this test"
      "What to focus on this week"
      "Improvement vs last mock"
    
    Action buttons:
      [Review Answers] → shows each question with your answer vs correct
      [Practice Weak Areas] → redirects to /practice with weak concepts filtered
      [Take Another Mock] → back to pre-test

PAGE 6 — /analytics
  
  Top: Date range filter (7 days / 30 days / All time)
  
  Section 1 — Overview:
    Total questions attempted, Total study hours (estimated), Tests taken,
    Best mock score, Current streak, Longest streak
  
  Section 2 — Mastery Radar:
    Recharts RadarChart — all 8 subjects, mastery_score 0-100
    Compare against "GATE Top 500 benchmark" (hardcoded benchmark line)
  
  Section 3 — Subject Deep Dive:
    Tab per subject
    Each tab shows:
      Topic-wise mastery heatmap (grid of topics, color by mastery)
      Accuracy trend over time
      Most missed concepts (ranked by wrong attempts)
      Time trend per concept
  
  Section 4 — Mock Performance:
    Score trend line chart across all mock sessions
    Rank trend chart
    Subject-wise improvement table (first mock vs latest mock)
  
  Section 5 — Spaced Repetition Health:
    Due today / Due this week / Overdue counts
    Concepts by mastery bucket: New / Learning / Reviewing / Mastered
    Forgetting risk alert (concepts not reviewed in 14+ days)

PAGE 7 — /tutor (AI Chat)
  
  Layout: Chat area (flex 1) + Sidebar (260px)
  
  SIDEBAR:
    Topic filter (select subject → filters quick prompts)
    Suggested questions list:
      "Explain Banker's algorithm"
      "What is Belady's anomaly?"
      "Diff between process and thread"
      "When is LL(1) applicable?"
      etc — 15-20 seeded questions
    Click → populates input
    
    Token saver widget:
      Live cache hit count today
      LLM calls today
      Estimated cost saved (₹)
      Model being used
  
  CHAT AREA:
    System behavior:
      - AI answers are RAG-grounded (pulls from rag_documents)
      - Response format always: explanation + concept name + exam tip
      - Pass last 6 messages as conversation history (token budget: last 1200 tokens of history)
      - If question matches a cached concept explanation, serve from cache
    
    Message bubbles:
      User: right-aligned, amber border
      AI: left-aligned with small "AI" avatar, includes:
        Main answer text
        Green tip box: "📌 Exam tip: ..."
        Subject tag badge
    
    Input area:
      Textarea (auto-expand, max 3 rows)
      [Send] button with icon
      Character counter (max 300 chars — enforced to limit token input)
      Keyboard shortcut: Enter to send, Shift+Enter for newline
    
    Loading state: Three pulsing dots

PAGE 8 — /settings
  Profile edit (name, target, exam month, daily hours)
  Notification preferences (daily reminder, streak alerts)
  Subscription status + upgrade/manage CTA
  Data: Export my progress (CSV download of user_attempts)
  Danger zone: Reset progress, Delete account

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONCEPT TREE — SEED DATA (hardcode this)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OS:
  Process Management: CPU Scheduling, Process Synchronization, 
                      Deadlock, Inter-process Communication
  Memory Management:  Paging, Segmentation, Virtual Memory, 
                      Page Replacement Algorithms
  Storage:            File Systems, Disk Scheduling, I/O Management

CN:
  Network Layer:      IPv4/IPv6, Routing Algorithms, Subnetting, NAT
  Transport Layer:    TCP, UDP, Congestion Control, Flow Control
  Application Layer:  DNS, HTTP, SMTP, FTP
  Data Link Layer:    MAC, CSMA/CD, CSMA/CA, Error Detection

DBMS:
  Relational Model:   ER Diagrams, Relational Algebra, SQL
  Normalization:      1NF-BCNF, Functional Dependencies, Candidate Keys
  Transactions:       ACID, Concurrency Control, 2PL, Serializability
  Indexing:           B-Trees, B+ Trees, Hashing

Algorithms:
  Sorting:            QuickSort, MergeSort, HeapSort, Counting Sort
  Graph:              BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Kruskal, Prim
  Dynamic Programming: LCS, LIS, Knapsack, Matrix Chain
  Complexity:         P vs NP, Time/Space Complexity, Recurrences

COA:
  Processing:         Pipelining, Hazards, Instruction Set
  Memory:             Cache Memory, Cache Mapping, Memory Hierarchy
  Number Systems:     Fixed/Floating Point, Overflow, Underflow

TOC:
  Automata:           DFA, NFA, ε-NFA, Regular Expressions
  Grammars:           CFG, CNF, GNF, Pushdown Automata
  Computability:      Turing Machines, Decidability, Halting Problem

DS:
  Trees:              Binary Trees, BST, AVL, Red-Black, Heaps
  Graphs:             Representations, Topological Sort, SCC
  Hashing:            Hash Functions, Collision Resolution
  Advanced:           Segment Trees, Tries, Disjoint Sets

Maths:
  Discrete:           Propositional Logic, Set Theory, Combinatorics, Graph Theory
  Linear Algebra:     Matrix Operations, Eigenvalues, Systems of Equations
  Probability:        Conditional Probability, Bayes Theorem, Distributions
  Calculus:           Limits, Derivatives, Integration (basics only)

Weightage scores (1-10 for each):
  Algorithms: 9, OS: 9, DBMS: 7, CN: 7, Maths: 10, COA: 6, TOC: 6, DS: 6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POST /api/questions/generate
  Body: { concept_id, difficulty, type }
  → Returns question (from cache or freshly generated)
  Rate limit: 60/hour per user

POST /api/questions/evaluate
  Body: { question_id, user_answer }
  → Returns { correct, solution, sm2_update, next_review }
  No LLM for MCQ/NAT

POST /api/roadmap/generate
  Body: { user_id } (reads profile from DB)
  → Pushes async job to QStash
  → Returns { job_id }
  Rate limit: 3/day per user

GET /api/roadmap/status?job_id=xxx
  → Returns { status, roadmap_json | null }

POST /api/mock/start
  Body: { type: 'full'|'subject'|'speed', subject? }
  → Creates mock_session, returns { session_id, questions[] }

POST /api/mock/submit
  Body: { session_id, answers: [{question_id, answer}] }
  → Scores immediately (pure math)
  → Pushes debrief job to QStash
  → Returns { score, breakdown, job_id }

POST /api/tutor/chat
  Body: { message, history: last_6_messages[] }
  → RAG search + GROQ call
  → Returns { answer, concept, tip, source }
  Rate limit: 30/hour (free), 100/hour (paid)

GET /api/analytics/summary?period=30d
  → Aggregated stats from user_attempts + mock_sessions

POST /api/jobs/process (QStash webhook, internal)
  → Processes roadmap_gen, mock_debrief jobs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FREE vs PAID FEATURE GATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FREE:
  - Practice: 20 questions/day (any subject)
  - AI Tutor: 10 messages/day
  - Mock: Subject tests only (2/day), Speed rounds (unlimited)
  - Roadmap: View only (no regenerate)
  - Analytics: 7-day history only

PAID (₹299/month or ₹2499/year):
  - Practice: Unlimited
  - AI Tutor: 100 messages/day
  - Mock: Full 65-question mock (3/day)
  - Roadmap: Regenerate anytime
  - Analytics: Full history + export
  - Priority support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOLDER STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app/
  (auth)/login/page.tsx
  (auth)/signup/page.tsx
  (app)/dashboard/page.tsx
  (app)/practice/page.tsx
  (app)/roadmap/page.tsx
  (app)/mock/page.tsx
  (app)/analytics/page.tsx
  (app)/tutor/page.tsx
  (app)/settings/page.tsx
  onboarding/page.tsx
  api/
    questions/generate/route.ts
    questions/evaluate/route.ts
    roadmap/generate/route.ts
    roadmap/status/route.ts
    mock/start/route.ts
    mock/submit/route.ts
    tutor/chat/route.ts
    analytics/summary/route.ts
    jobs/process/route.ts      ← QStash webhook
    webhooks/razorpay/route.ts

lib/
  ai/
    groqRouter.ts              ← 3-layer cache + model selector
    agents/
      questionGenerator.ts
      answerEvaluator.ts
      conceptExplainer.ts
      roadmapAgent.ts
      mockDebriefAgent.ts
      srScheduler.ts
    prompts/
      question.ts
      explanation.ts
      roadmap.ts
      debrief.ts
  cache/
    cacheManager.ts            ← Redis + pgvector cache
  db/
    supabase.ts
    queries/
      concepts.ts
      attempts.ts
      performance.ts
  queue/
    qstash.ts
  algorithms/
    sm2.ts                     ← Pure SM-2, no LLM
    rankPredictor.ts           ← Score → rank estimation
    scoring.ts                 ← GATE negative marking formula
  payments/
    razorpay.ts

components/
  ui/                          ← shadcn components
  practice/
    QuestionCard.tsx
    ConceptSidebar.tsx
    MasteryGauge.tsx
    SolutionPanel.tsx
  dashboard/
    StatCard.tsx
    TodayQueue.tsx
    WeakAlerts.tsx
  mock/
    QuestionNavigator.tsx
    VirtualKeypad.tsx
    DebriefCard.tsx
  charts/
    MasteryRadar.tsx
    ScoreTrend.tsx
    SubjectHeatmap.tsx
  layout/
    Sidebar.tsx
    TopBar.tsx
    StreakBadge.tsx

supabase/
  migrations/
    001_schema.sql
    002_functions.sql          ← match_documents, match_llm_cache
    003_seed_concepts.sql      ← concept tree data

scripts/
  seedConcepts.ts              ← one-time run
  warmCache.ts                 ← pre-generate common questions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPABASE VECTOR FUNCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- match_documents (RAG search)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.75,
  match_count int DEFAULT 5,
  filter_subject text DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, source text, subject text, similarity float)
AS $$
  SELECT id, content, source, subject,
    1 - (embedding <=> query_embedding) AS similarity
  FROM rag_documents
  WHERE (filter_subject IS NULL OR subject = filter_subject)
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE SQL STABLE;

-- match_llm_cache (semantic cache lookup)
CREATE OR REPLACE FUNCTION match_llm_cache(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.92,
  match_count int DEFAULT 1
)
RETURNS TABLE(id uuid, response text, similarity float)
AS $$
  SELECT id, response,
    1 - (prompt_embedding <=> query_embedding) AS similarity
  FROM llm_cache
  WHERE 1 - (prompt_embedding <=> query_embedding) > similarity_threshold
  ORDER BY prompt_embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE SQL STABLE;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SM-2 ALGORITHM (implement exactly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function sm2Update(state, quality) {
  // quality: 0=blackout, 1=wrong, 2=hard, 3=good, 4=easy, 5=perfect

  if (quality < 3) {
    // Failed — reset
    return { repetitions: 0, interval: 1, ease_factor: state.ease_factor }
  }

  const newEF = Math.max(1.3,
    state.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  let interval
  if (state.repetitions === 0) interval = 1
  else if (state.repetitions === 1) interval = 6
  else interval = Math.round(state.interval * newEF)

  const mastery = Math.min(100,
    state.mastery_score + (quality >= 4 ? 15 : quality >= 3 ? 8 : -10)
  )

  return {
    repetitions: state.repetitions + 1,
    interval,
    ease_factor: newEF,
    next_review: addDays(today, interval),
    mastery_score: mastery
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GATE SCORING FORMULA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1-mark question: +1 correct, -0.33 wrong, 0 skipped
2-mark question: +2 correct, -0.67 wrong, 0 skipped

Normalized score = (raw_score / 100) * 100
(GATE uses normalization across sessions — approximate as raw for mock)

Rank estimation: Use a lookup table based on GATE CS historical cutoffs:
  Score > 80: Rank ~100-300
  Score 70-80: Rank ~300-800
  Score 60-70: Rank ~800-2000
  Score 50-60: Rank ~2000-5000
  Score 40-50: Rank ~5000-10000
  Score < 40:  Rank > 10000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENV VARIABLES NEEDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
QSTASH_URL=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD ORDER (follow exactly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Supabase schema + vector functions + seed concepts
2. Auth (login, signup, onboarding flow)
3. GROQ router + 3-layer cache + SM-2 algorithm
4. Question generator agent + Practice page
5. Dashboard (real data from DB)
6. Roadmap agent + Roadmap page (async with QStash)
7. Mock test engine + Debrief agent
8. Analytics page
9. AI Tutor (RAG-powered)
10. Paywall + Razorpay integration
11. Settings page
12. Polish: loading states, error handling, mobile responsiveness