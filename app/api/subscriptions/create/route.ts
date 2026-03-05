import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { createOrder } from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await request.json();
  if (plan !== "monthly" && plan !== "annual") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Fetch user's coupon discount from profiles (admin client bypasses RLS)
  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("coupon_code, coupon_discount")
    .eq("id", user.id)
    .single();

  const discountPercent: number = prof?.coupon_discount ?? 0;
  const couponCode: string | null = prof?.coupon_code ?? null;

  try {
    const result = await createOrder(plan, user.id, discountPercent);

    // Increment coupon uses_count after successful order creation
    if (couponCode && discountPercent > 0) {
      const { data: coupon } = await admin
        .from("coupon_codes")
        .select("uses_count")
        .eq("code", couponCode)
        .single();
      if (coupon) {
        await admin
          .from("coupon_codes")
          .update({ uses_count: coupon.uses_count + 1 })
          .eq("code", couponCode);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[subscriptions/create]", err);
    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 }
    );
  }
}
