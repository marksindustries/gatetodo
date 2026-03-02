import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import type { Concept } from "@/lib/db/types";

export async function getAllConcepts(): Promise<Concept[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("concepts")
    .select("*")
    .order("subject", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getConceptById(id: string): Promise<Concept | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("concepts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getConceptsBySubject(subject: string): Promise<Concept[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("concepts")
    .select("*")
    .eq("subject", subject)
    .order("weightage_score", { ascending: false });
  if (error) throw error;
  return data;
}

/** Returns all concepts grouped by subject → topic → subtopic */
export async function getConceptTree(): Promise<
  Record<string, Record<string, Concept[]>>
> {
  const concepts = await getAllConcepts();
  const tree: Record<string, Record<string, Concept[]>> = {};

  for (const concept of concepts) {
    if (!tree[concept.subject]) tree[concept.subject] = {};
    if (!tree[concept.subject][concept.topic]) {
      tree[concept.subject][concept.topic] = [];
    }
    tree[concept.subject][concept.topic].push(concept);
  }

  return tree;
}
