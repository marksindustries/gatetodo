import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const admin = createAdminClient();
    await admin.rpc("increment_blog_views", { post_slug: slug });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
