export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          branch: string | null;
          level: "beginner" | "intermediate" | "advanced" | null;
          target_rank: number | null;
          exam_month: string | null;
          daily_hours: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      concepts: {
        Row: {
          id: string;
          subject: string;
          topic: string;
          subtopic: string;
          weightage_score: number;
          difficulty_base: number;
          description: string | null;
          exam_tips: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["concepts"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["concepts"]["Insert"]>;
      };
      generated_questions: {
        Row: {
          id: string;
          concept_id: string;
          question_text: string;
          options: { A: string; B: string; C: string; D: string } | null;
          answer: string;
          solution: string;
          question_type: "MCQ" | "NAT";
          difficulty: number;
          marks: 1 | 2;
          reuse_count: number;
          embedding: number[] | null;
          generated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["generated_questions"]["Row"], "id" | "reuse_count" | "generated_at"> & {
          id?: string;
          reuse_count?: number;
          generated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["generated_questions"]["Insert"]>;
      };
      user_concept_state: {
        Row: {
          user_id: string;
          concept_id: string;
          ease_factor: number;
          interval_days: number;
          next_review: string;
          repetitions: number;
          mastery_score: number;
          last_attempted: string | null;
        };
        Insert: Database["public"]["Tables"]["user_concept_state"]["Row"];
        Update: Partial<Database["public"]["Tables"]["user_concept_state"]["Row"]>;
      };
      user_attempts: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          concept_id: string;
          is_correct: boolean;
          time_taken_sec: number | null;
          selected_answer: string | null;
          attempted_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_attempts"]["Row"], "id" | "attempted_at"> & {
          id?: string;
          attempted_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_attempts"]["Insert"]>;
      };
      rag_documents: {
        Row: {
          id: string;
          source: "gfg" | "nptel" | "web" | null;
          subject: string | null;
          topic: string | null;
          content: string;
          url: string | null;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["rag_documents"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rag_documents"]["Insert"]>;
      };
      llm_cache: {
        Row: {
          id: string;
          prompt_hash: string;
          prompt_embedding: number[] | null;
          response: string;
          model_used: string | null;
          tokens_used: number | null;
          hit_count: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["llm_cache"]["Row"], "id" | "hit_count" | "created_at"> & {
          id?: string;
          hit_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["llm_cache"]["Insert"]>;
      };
      llm_jobs: {
        Row: {
          id: string;
          user_id: string;
          job_type: "roadmap_gen" | "mock_debrief" | "concept_explain";
          status: "pending" | "processing" | "completed" | "failed";
          input_payload: Json | null;
          output_payload: Json | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["llm_jobs"]["Row"], "id" | "status" | "created_at"> & {
          id?: string;
          status?: "pending" | "processing" | "completed" | "failed";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["llm_jobs"]["Row"]>;
      };
      roadmaps: {
        Row: {
          id: string;
          archetype_hash: string;
          roadmap_json: Json;
          generated_at: string;
          used_count: number;
        };
        Insert: Omit<Database["public"]["Tables"]["roadmaps"]["Row"], "id" | "used_count" | "generated_at"> & {
          id?: string;
          used_count?: number;
          generated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["roadmaps"]["Insert"]>;
      };
      mock_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_type: "full" | "subject" | "speed";
          subject_filter: string | null;
          started_at: string;
          completed_at: string | null;
          total_score: number | null;
          max_score: number | null;
          time_taken_sec: number | null;
          subject_breakdown: Json | null;
          predicted_rank: number | null;
          debrief_json: Json | null;
        };
        Insert: Omit<Database["public"]["Tables"]["mock_sessions"]["Row"], "id" | "started_at"> & {
          id?: string;
          started_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mock_sessions"]["Row"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "free" | "monthly" | "annual";
          status: "active" | "cancelled" | "expired";
          razorpay_subscription_id: string | null;
          current_period_end: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
      };
    };
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_subject?: string;
        };
        Returns: {
          id: string;
          content: string;
          source: string;
          subject: string;
          similarity: number;
        }[];
      };
      match_llm_cache: {
        Args: {
          query_embedding: number[];
          similarity_threshold?: number;
          match_count?: number;
        };
        Returns: {
          id: string;
          response: string;
          similarity: number;
        }[];
      };
    };
  };
}

// ─── Convenience type aliases ───
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Concept = Database["public"]["Tables"]["concepts"]["Row"];
export type GeneratedQuestion = Database["public"]["Tables"]["generated_questions"]["Row"];
export type UserConceptState = Database["public"]["Tables"]["user_concept_state"]["Row"];
export type UserAttempt = Database["public"]["Tables"]["user_attempts"]["Row"];
export type MockSession = Database["public"]["Tables"]["mock_sessions"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type LlmJob = Database["public"]["Tables"]["llm_jobs"]["Row"];
export type Roadmap = Database["public"]["Tables"]["roadmaps"]["Row"];
