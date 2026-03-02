import Razorpay from "razorpay";
import crypto from "crypto";

let client: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

export const PLANS = {
  monthly: {
    name: "Monthly",
    amount: 29900, // ₹299 in paise
    currency: "INR",
    period: "monthly" as const,
  },
  annual: {
    name: "Annual",
    amount: 249900, // ₹2499 in paise
    currency: "INR",
    period: "yearly" as const,
  },
} as const;

export async function createSubscription(
  plan: "monthly" | "annual",
  userId: string
): Promise<{ subscription_id: string; key_id: string }> {
  const razorpay = getRazorpay();
  const planConfig = PLANS[plan];

  // Create or fetch Razorpay plan
  const rzPlan = await razorpay.plans.create({
    period: planConfig.period,
    interval: 1,
    item: {
      name: `GATEprep ${planConfig.name}`,
      amount: planConfig.amount,
      currency: planConfig.currency,
    },
    notes: { user_id: userId },
  });

  // Create subscription
  const subscription = await razorpay.subscriptions.create({
    plan_id: rzPlan.id,
    customer_notify: 1,
    total_count: plan === "monthly" ? 12 : 1,
    notes: { user_id: userId },
  });

  return {
    subscription_id: subscription.id,
    key_id: process.env.RAZORPAY_KEY_ID!,
  };
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
