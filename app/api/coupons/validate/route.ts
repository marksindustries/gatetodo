import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";

// GET /api/coupons/validate?code=XYZ
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ valid: false, error: "Unauthorized" }, { status: 401 });
  }

  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false, error: "No code provided" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: coupon, error } = await admin
    .from("coupon_codes")
    .select("discount_percent, description, max_uses, uses_count, expires_at")
    .eq("code", code)
    .single();

  if (error || !coupon) {
    return NextResponse.json({ valid: false, error: "Invalid code" });
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "Code has expired" });
  }

  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return NextResponse.json({ valid: false, error: "Code limit reached" });
  }

  return NextResponse.json({
    valid: true,
    discount_percent: coupon.discount_percent,
    description: coupon.description ?? "",
  });
}
