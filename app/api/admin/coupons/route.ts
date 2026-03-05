import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";

function isAdmin(email: string | undefined): boolean {
  return !!email && email === process.env.ADMIN_EMAIL;
}

// GET /api/admin/coupons — list all coupons
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email ?? undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: coupons, error } = await admin
    .from("coupon_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons });
}

// POST /api/admin/coupons — create a coupon
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email ?? undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    code: string;
    discount_percent: number;
    description?: string;
    max_uses?: number;
    expires_at?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { code, discount_percent, description, max_uses, expires_at } = body;

  if (!code || typeof discount_percent !== "number") {
    return NextResponse.json({ error: "code and discount_percent are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupon_codes")
    .insert({
      code: code.trim().toUpperCase(),
      discount_percent,
      description: description ?? null,
      max_uses: max_uses ?? null,
      expires_at: expires_at ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ coupon: data }, { status: 201 });
}
