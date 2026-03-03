import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/db/supabase-server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const supabase = createAdminClient();

  // Order-based payment flow
  if (event.event === "payment.captured") {
    const payment = event?.payload?.payment?.entity;
    const userId = payment?.notes?.user_id;
    const plan = payment?.notes?.plan;

    if (!userId || !plan || (plan !== "monthly" && plan !== "annual")) {
      return NextResponse.json({ received: true });
    }

    const periodEnd = plan === "monthly"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        status: "active",
        razorpay_subscription_id: payment.id,
        current_period_end: periodEnd,
      },
      { onConflict: "user_id" }
    );
  }

  return NextResponse.json({ received: true });
}
