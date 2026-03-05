"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/db/supabase";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/payments/razorpay";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

interface Profile {
  name: string;
  target_rank: number | null;
  exam_month: string | null;
  daily_hours: number;
  coupon_code: string | null;
  coupon_discount: number;
  coupon_description: string | null;
}

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    name: "",
    target_rank: null,
    exam_month: "",
    daily_hours: 4,
    coupon_code: null,
    coupon_discount: 0,
    coupon_description: null,
  });
  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "valid" | "invalid" | "applying">("idle");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<"profile" | "subscription" | "danger">("profile");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("name, target_rank, exam_month, daily_hours, coupon_code, coupon_discount, coupon_description")
        .eq("id", user.id)
        .single();

      if (prof) {
        setProfile({
          name: prof.name ?? "",
          target_rank: prof.target_rank,
          exam_month: prof.exam_month ?? "",
          daily_hours: prof.daily_hours ?? 4,
          coupon_code: prof.coupon_code ?? null,
          coupon_discount: prof.coupon_discount ?? 0,
          coupon_description: prof.coupon_description ?? null,
        });
      }

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .single();

      setSubscription(sub ?? { plan: "free", status: "active", current_period_end: null });
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        name: profile.name,
        target_rank: profile.target_rank,
        exam_month: profile.exam_month,
        daily_hours: profile.daily_hours,
      })
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExportCSV() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: attempts } = await supabase
      .from("user_attempts")
      .select("*, generated_questions!inner(question_text, question_type), concepts!inner(subject, subtopic)")
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false })
      .limit(1000);

    if (!attempts) return;

    const csv = [
      "Date,Subject,Subtopic,Question Type,Correct,Time (sec)",
      ...(attempts as any[]).map((a) =>
        [
          new Date(a.attempted_at).toLocaleDateString(),
          a.concepts?.subject ?? "",
          a.concepts?.subtopic ?? "",
          a.generated_questions?.question_type ?? "",
          a.is_correct ? "Yes" : "No",
          a.time_taken_sec ?? "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gateprep_progress.csv";
    a.click();
  }

  async function handleResetProgress() {
    if (!confirm("This will delete ALL your practice history and mastery data. Are you sure?")) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_attempts").delete().eq("user_id", user.id);
    await supabase.from("user_concept_state").delete().eq("user_id", user.id);
    alert("Progress reset. Starting fresh!");
    router.push("/dashboard");
  }

  async function handleRemoveCoupon() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ coupon_code: null, coupon_discount: 0, coupon_description: null }).eq("id", user.id);
    setProfile((p) => ({ ...p, coupon_code: null, coupon_discount: 0, coupon_description: null }));
    setCouponInput("");
    setCouponStatus("idle");
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponStatus("applying");
    const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponInput.trim().toUpperCase())}`);
    const data = await res.json();
    if (data.valid) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("profiles").update({
        coupon_code: couponInput.trim().toUpperCase(),
        coupon_discount: data.discount_percent,
        coupon_description: data.description || null,
      }).eq("id", user.id);
      setProfile((p) => ({ ...p, coupon_code: couponInput.trim().toUpperCase(), coupon_discount: data.discount_percent, coupon_description: data.description || null }));
      setCouponStatus("valid");
    } else {
      setCouponStatus("invalid");
    }
  }

  async function handleUpgrade(plan: "monthly" | "annual") {
    // Load Razorpay checkout script if not already loaded
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay"));
        document.body.appendChild(script);
      });
    }

    const res = await fetch("/api/subscriptions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      alert(`Payment setup failed: ${error}`);
      return;
    }

    const { order_id, amount, currency, key_id } = await res.json();

    const rzp = new window.Razorpay({
      key: key_id,
      order_id,
      amount,
      currency,
      name: "GATEprep",
      description: plan === "monthly" ? "Monthly — ₹299/mo" : "Annual — ₹2499/yr",
      theme: { color: "#f59e0b" },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        // Verify payment server-side and activate subscription
        const verifyRes = await fetch("/api/subscriptions/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan,
          }),
        });

        if (verifyRes.ok) {
          setSubscription({ plan, status: "active", current_period_end: null });
          setSection("profile");
        } else {
          alert("Payment received but activation failed. Contact support.");
        }
      },
    });

    rzp.open();
  }

  async function handleDeleteAccount() {
    if (!confirm("This will permanently delete your account and all data. There is no undo.")) return;
    if (!confirm("Last chance — are you absolutely sure?")) return;

    const res = await fetch("/api/user/delete", { method: "DELETE" });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push("/login");
    } else {
      const { error } = await res.json();
      alert(`Failed to delete account: ${error}`);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto" style={{ background: "#0a0e1a", minHeight: "100vh" }}>
      <h1 className="text-2xl font-bold font-syne mb-6" style={{ color: "#f1f5f9" }}>Settings</h1>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6">
        {(["profile", "subscription", "danger"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className="px-4 py-1.5 rounded text-xs capitalize"
            style={{
              background: section === s ? "rgba(245,158,11,0.1)" : "#111827",
              border: `1px solid ${section === s ? "#f59e0b" : "#1e293b"}`,
              color: section === s ? "#f59e0b" : "#94a3b8",
              fontFamily: "var(--font-ibm-plex-mono)",
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Profile section */}
      {section === "profile" && (
        <div className="space-y-4">
          <div className="p-5 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
            <h2 className="text-sm font-semibold font-syne mb-4" style={{ color: "#f1f5f9" }}>
              Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  NAME
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded text-sm outline-none"
                  style={{
                    background: "#0a0e1a",
                    border: "1px solid #1e293b",
                    color: "#f1f5f9",
                    fontFamily: "var(--font-ibm-plex-mono)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                  onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  DAILY STUDY HOURS — <span style={{ color: "#f59e0b" }}>{profile.daily_hours}h</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={profile.daily_hours}
                  onChange={(e) => setProfile({ ...profile, daily_hours: parseInt(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: "#f59e0b" }}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded text-sm font-medium"
                style={{
                  background: saved ? "#10b981" : "#f59e0b",
                  color: "#0a0e1a",
                  fontFamily: "var(--font-ibm-plex-mono)",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Data export */}
          <div className="p-5 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
            <h2 className="text-sm font-semibold font-syne mb-2" style={{ color: "#f1f5f9" }}>
              Export Data
            </h2>
            <p className="text-xs mb-3" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
              Download your complete practice history as CSV
            </p>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded text-sm"
              style={{
                background: "transparent",
                border: "1px solid #1e293b",
                color: "#94a3b8",
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: "pointer",
              }}
            >
              ↓ Export Progress CSV
            </button>
          </div>
        </div>
      )}

      {/* Subscription section */}
      {section === "subscription" && (
        <div className="space-y-4">
          <div className="p-5 rounded" style={{ background: "#111827", border: "1px solid #1e293b" }}>
            <h2 className="text-sm font-semibold font-syne mb-4" style={{ color: "#f1f5f9" }}>
              Current Plan
            </h2>
            {(() => {
              const periodEnd = subscription?.current_period_end
                ? new Date(subscription.current_period_end)
                : null;
              const isActive = periodEnd ? periodEnd > new Date() : false;
              const isExpired = periodEnd ? periodEnd <= new Date() : false;

              return (
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="px-3 py-1 rounded text-sm font-bold uppercase"
                      style={{
                        background: isActive ? "rgba(16,185,129,0.15)" : "rgba(71,85,105,0.3)",
                        border: `1px solid ${isActive ? "#10b981" : "#475569"}`,
                        color: isActive ? "#10b981" : "#94a3b8",
                        fontFamily: "var(--font-ibm-plex-mono)",
                      }}
                    >
                      {isActive ? "PAID" : isExpired ? "EXPIRED" : "FREE"}
                    </span>
                    {isActive && periodEnd && (
                      <span className="text-xs" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                        {subscription?.plan === "monthly" ? "Monthly" : "Annual"} · Access until{" "}
                        <span style={{ color: "#f59e0b" }}>
                          {periodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </span>
                    )}
                    {isExpired && periodEnd && (
                      <span className="text-xs" style={{ color: "#ef4444", fontFamily: "var(--font-ibm-plex-mono)" }}>
                        Expired {periodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {(() => {
              const periodEnd = subscription?.current_period_end
                ? new Date(subscription.current_period_end)
                : null;
              const showUpgrade = !periodEnd || periodEnd <= new Date();
              const disc = profile.coupon_discount ?? 0;
              const monthlyFinal = disc > 0 ? Math.round(299 * (1 - disc / 100)) : 299;
              const annualFinal = disc > 0 ? Math.round(2499 * (1 - disc / 100)) : 2499;
              return showUpgrade ? (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  Upgrade to unlock unlimited practice, full mock tests, and advanced analytics.
                </p>

                {/* Institute/coupon badge if applied */}
                {disc > 0 && profile.coupon_code && (
                  <div className="px-3 py-2.5 rounded flex items-start justify-between gap-2" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid #10b981" }}>
                    <div>
                      <p style={{ color: "#10b981", fontFamily: "var(--font-ibm-plex-mono)", fontSize: "11px", marginBottom: profile.coupon_description ? "4px" : "0" }}>
                        ✓ {profile.coupon_code} — {disc}% off applied
                      </p>
                      {profile.coupon_description && (
                        <p style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)", fontSize: "10px" }}>
                          {profile.coupon_description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)", fontSize: "11px", background: "none", border: "none", cursor: "pointer", flexShrink: 0, paddingTop: "1px" }}
                    >
                      ✕ remove
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {(["monthly", "annual"] as const).map((plan) => {
                    const originalPrice = plan === "monthly" ? "₹299/mo" : "₹2499/yr";
                    const discountedPrice = plan === "monthly" ? `₹${monthlyFinal}/mo` : `₹${annualFinal}/yr`;
                    return (
                      <div
                        key={plan}
                        className="p-4 rounded"
                        style={{
                          background: "#0a0e1a",
                          border: plan === "annual" ? "1px solid #f59e0b" : "1px solid #1e293b",
                        }}
                      >
                        {disc > 0 ? (
                          <div className="mb-1">
                            <span className="text-xs line-through" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                              {originalPrice}
                            </span>
                            <p className="text-sm font-bold font-syne" style={{ color: "#10b981" }}>
                              {discountedPrice}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-bold font-syne mb-1" style={{ color: "#f59e0b" }}>
                            {originalPrice}
                          </p>
                        )}
                        <p className="text-xs mb-3" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          {plan === "annual" ? "Save ₹1,089 vs monthly" : "Pay monthly"}
                        </p>
                        <button
                          className="w-full py-1.5 rounded text-xs"
                          style={{
                            background: plan === "annual" ? "#f59e0b" : "transparent",
                            border: "1px solid #f59e0b",
                            color: plan === "annual" ? "#0a0e1a" : "#f59e0b",
                            fontFamily: "var(--font-ibm-plex-mono)",
                            cursor: "pointer",
                          }}
                          onClick={() => handleUpgrade(plan)}
                        >
                          Upgrade
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon entry — always visible so users can apply or change later */}
                <div className="pt-2">
                  <p className="text-xs mb-2" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                    {profile.coupon_code ? "Change coupon / institute code" : "Have a coupon or institute code?"}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponStatus("idle"); }}
                      placeholder={profile.coupon_code ?? "Enter code"}
                      className="flex-1 px-3 py-2 rounded text-xs outline-none"
                      style={{
                        background: "#0a0e1a",
                        border: `1px solid ${couponStatus === "valid" ? "#10b981" : couponStatus === "invalid" ? "#ef4444" : "#1e293b"}`,
                        color: "#f1f5f9",
                        fontFamily: "var(--font-ibm-plex-mono)",
                      }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponStatus === "applying" || !couponInput.trim()}
                      className="px-4 py-2 rounded text-xs"
                      style={{
                        background: "#f59e0b",
                        color: "#0a0e1a",
                        fontFamily: "var(--font-ibm-plex-mono)",
                        cursor: couponStatus === "applying" || !couponInput.trim() ? "not-allowed" : "pointer",
                        opacity: couponStatus === "applying" || !couponInput.trim() ? 0.5 : 1,
                      }}
                    >
                      {couponStatus === "applying" ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponStatus === "invalid" && (
                    <p className="text-xs mt-1" style={{ color: "#ef4444", fontFamily: "var(--font-ibm-plex-mono)" }}>
                      ✗ Invalid or expired code
                    </p>
                  )}
                </div>
              </div>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Danger zone */}
      {section === "danger" && (
        <div className="space-y-3">
          <div
            className="p-5 rounded"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid #ef4444" }}
          >
            <h2 className="text-sm font-semibold font-syne mb-4" style={{ color: "#ef4444" }}>
              Danger Zone
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium" style={{ color: "#f1f5f9", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  Reset Progress
                </p>
                <p className="text-xs mt-0.5 mb-2" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  Delete all practice history and mastery data. Your account remains.
                </p>
                <button
                  onClick={handleResetProgress}
                  className="px-4 py-1.5 rounded text-xs"
                  style={{
                    background: "transparent",
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    cursor: "pointer",
                  }}
                >
                  Reset Progress
                </button>
              </div>
              <div className="h-px" style={{ background: "#ef4444", opacity: 0.2 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "#f1f5f9", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  Delete Account
                </p>
                <p className="text-xs mt-0.5 mb-2" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  Permanently delete your account and all associated data.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-1.5 rounded text-xs"
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
