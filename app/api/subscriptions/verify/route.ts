import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await request.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  // Verify the signature Razorpay sent — prevents fake activations
  const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Activate subscription in DB
  const admin = createAdminClient();
  const periodEnd = plan === "monthly"
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      plan,
      status: "active",
      razorpay_subscription_id: razorpay_payment_id,
      current_period_end: periodEnd,
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ success: true });
}
