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

  const subscriptionId = event?.payload?.subscription?.entity?.id;
  const userId = event?.payload?.subscription?.entity?.notes?.user_id;

  if (!userId || !subscriptionId) {
    return NextResponse.json({ received: true });
  }

  switch (event.event) {
    case "subscription.activated": {
      const plan =
        event.payload.subscription.entity.plan_id.includes("yearly")
          ? "annual"
          : "monthly";
      const periodEnd = new Date(
        event.payload.subscription.entity.current_end * 1000
      ).toISOString();

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan,
          status: "active",
          razorpay_subscription_id: subscriptionId,
          current_period_end: periodEnd,
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "subscription.cancelled":
    case "subscription.expired": {
      await supabase
        .from("subscriptions")
        .update({ status: event.event === "subscription.cancelled" ? "cancelled" : "expired" })
        .eq("razorpay_subscription_id", subscriptionId);
      break;
    }

    case "subscription.charged": {
      const periodEnd = new Date(
        event.payload.subscription.entity.current_end * 1000
      ).toISOString();
      await supabase
        .from("subscriptions")
        .update({ status: "active", current_period_end: periodEnd })
        .eq("razorpay_subscription_id", subscriptionId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
