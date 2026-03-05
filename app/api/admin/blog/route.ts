import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";

async function isAdmin(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === process.env.ADMIN_EMAIL ? user : null;
}

// GET /api/admin/blog — list all posts (including unpublished)
export async function GET(request: NextRequest) {
  const user = await isAdmin(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .select("id, slug, title, category, difficulty, featured, published_at, views, read_time_min")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/blog — create a new blog post
// Body: { slug, title, excerpt?, content?, category?, difficulty?, gate_year?, read_time_min?, featured?, published_at? }
export async function POST(request: NextRequest) {
  const user = await isAdmin(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { slug, title, excerpt, content, category, difficulty, gate_year, read_time_min, featured, published_at } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("blog_posts").insert({
    slug: slug.toLowerCase().replace(/\s+/g, "-"),
    title,
    excerpt: excerpt ?? null,
    content: content ?? null,
    category: category ?? null,
    difficulty: difficulty ?? null,
    gate_year: gate_year ?? null,
    read_time_min: read_time_min ?? null,
    featured: featured ?? false,
    published_at: published_at ?? new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/blog — update a post by slug
// Body: { slug, ...fields to update }
export async function PATCH(request: NextRequest) {
  const user = await isAdmin(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { slug, ...updates } = body;

  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .update(updates)
    .eq("slug", slug)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
