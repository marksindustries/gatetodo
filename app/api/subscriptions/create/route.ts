import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { createSubscription } from "@/lib/payments/razorpay";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await request.json();
  if (plan !== "monthly" && plan !== "annual") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const result = await createSubscription(plan, user.id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[subscriptions/create]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create subscription" },
      { status: 500 }
    );
  }
}
