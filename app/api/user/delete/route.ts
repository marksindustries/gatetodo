import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/db/supabase-server";

export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Delete user data (FK cascades handle most, but explicit for safety)
  await Promise.all([
    admin.from("user_attempts").delete().eq("user_id", user.id),
    admin.from("user_concept_state").delete().eq("user_id", user.id),
    admin.from("subscriptions").delete().eq("user_id", user.id),
    admin.from("llm_jobs").delete().eq("user_id", user.id),
    admin.from("mock_sessions").delete().eq("user_id", user.id),
  ]);

  await admin.from("profiles").delete().eq("id", user.id);

  // Delete from Supabase Auth — irreversible
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
