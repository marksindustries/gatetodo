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
  },
  annual: {
    name: "Annual",
    amount: 249900, // ₹2499 in paise
    currency: "INR",
  },
} as const;

/**
 * Create a Razorpay order for one-time payment.
 * Subscriptions API requires special account activation — Orders API works out of the box.
 */
export async function createOrder(
  plan: "monthly" | "annual",
  userId: string,
  discountPercent: number = 0
): Promise<{ order_id: string; amount: number; currency: string; key_id: string }> {
  const planConfig = PLANS[plan];
  const finalAmount = discountPercent > 0
    ? Math.round(planConfig.amount * (1 - discountPercent / 100))
    : planConfig.amount;

  const order = await getRazorpay().orders.create({
    amount: finalAmount,
    currency: planConfig.currency,
    receipt: `gatetodo_${userId}_${Date.now()}`.slice(0, 40),
    // expected_amount stored in notes so webhook can verify the correct amount
    notes: { user_id: userId, plan, expected_amount: String(finalAmount) },
  });

  return {
    order_id: order.id,
    amount: finalAmount,
    currency: planConfig.currency,
    key_id: process.env.RAZORPAY_KEY_ID!,
  };
}

/**
 * Verify the payment signature returned by Razorpay checkout.
 * Must be verified server-side before granting access.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function fetchOrder(orderId: string) {
  return getRazorpay().orders.fetch(orderId);
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}
