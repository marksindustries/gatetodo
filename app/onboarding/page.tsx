"use client";

import { useState } from "react";
import { createClient } from "@/lib/db/supabase";
import { useRouter } from "next/navigation";

const SUBJECTS = ["OS", "CN", "DBMS", "Algorithms", "COA", "TOC", "DS", "Maths"] as const;

const TARGET_OPTIONS = [
  { label: "Top 100", value: 100 },
  { label: "Top 500", value: 500 },
  { label: "Top 1000", value: 1000 },
  { label: "PSU Cutoff", value: 3000 },
];


interface FormData {
  name: string;
  branch: string;
  level: "beginner" | "intermediate" | "advanced" | "";
  target_rank: number | null;
  exam_month: string;
  daily_hours: number;
  subject_ratings: Record<string, number>;
  coupon_code: string;
  coupon_discount: number;
  coupon_description: string | null;
  coupon_status: "idle" | "valid" | "invalid";
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "",
    branch: "CS",
    level: "",
    target_rank: null,
    exam_month: "2026-02",
    daily_hours: 4,
    subject_ratings: Object.fromEntries(SUBJECTS.map((s) => [s, 50])),
    coupon_code: "",
    coupon_discount: 0,
    coupon_description: null,
    coupon_status: "idle",
  });
  const router = useRouter();
  const supabase = createClient();

  async function validateCoupon(code: string) {
    if (!code.trim()) return;
    const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code.trim().toUpperCase())}`);
    const data = await res.json();
    if (data.valid) {
      setForm((f) => ({ ...f, coupon_status: "valid", coupon_discount: data.discount_percent, coupon_description: data.description ?? null }));
    } else {
      setForm((f) => ({ ...f, coupon_status: "invalid", coupon_discount: 0, coupon_description: null }));
    }
  }

  function next() {
    setStep((s) => Math.min(s + 1, 5));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // exam_month is stored as "YYYY-MM" from the month input; persist as first day of that month
    const examDate = `${form.exam_month}-01`;

    await supabase.from("profiles").upsert({
      id: user.id,
      name: form.name,
      branch: form.branch,
      level: form.level as "beginner" | "intermediate" | "advanced",
      target_rank: form.target_rank,
      exam_month: examDate,
      daily_hours: form.daily_hours,
      coupon_code: form.coupon_status === "valid" ? form.coupon_code.trim().toUpperCase() : null,
      coupon_discount: form.coupon_status === "valid" ? form.coupon_discount : 0,
      coupon_description: form.coupon_status === "valid" ? form.coupon_description : null,
    });

    // Trigger roadmap generation (fire and forget)
    fetch("/api/roadmap/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    }).catch(() => {});

    router.push("/dashboard");
  }

  const progress = (step / 5) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0e1a" }}>
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="text-2xl font-bold font-syne" style={{ color: "#f59e0b" }}>
          GATE<span className="text-white">prep</span>
        </span>
        <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
          Step {step} of 5 — Setting up your personalized study plan
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg mb-6">
        <div className="h-1 rounded-full" style={{ background: "#1e293b" }}>
          <div
            className="h-1 rounded-full transition-all duration-300"
            style={{ background: "#f59e0b", width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-lg p-8 rounded"
        style={{ background: "#111827", border: "1px solid #1e293b" }}
      >
        {/* Step 1: Name + Branch */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold font-syne mb-1" style={{ color: "#f1f5f9" }}>
              Hello, let's get started
            </h2>
            <p className="text-xs mb-6" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
              Tell us a bit about yourself
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  YOUR NAME
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Arjun Sharma"
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
                  BRANCH
                </label>
                <div
                  className="w-full px-3 py-2.5 rounded text-sm"
                  style={{
                    background: "#0a0e1a",
                    border: "1px solid #1e293b",
                    color: "#94a3b8",
                    fontFamily: "var(--font-ibm-plex-mono)",
                  }}
                >
                  CS / CSE — only branch supported in v1
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  INSTITUTE / COUPON CODE{" "}
                  <span style={{ color: "#475569" }}>(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.coupon_code}
                    onChange={(e) =>
                      setForm({ ...form, coupon_code: e.target.value.toUpperCase(), coupon_status: "idle", coupon_discount: 0 })
                    }
                    onBlur={() => validateCoupon(form.coupon_code)}
                    placeholder="e.g. IIT2026"
                    className="w-full px-3 py-2.5 rounded text-sm outline-none"
                    style={{
                      background: "#0a0e1a",
                      border: `1px solid ${form.coupon_status === "valid" ? "#10b981" : form.coupon_status === "invalid" ? "#ef4444" : "#1e293b"}`,
                      color: "#f1f5f9",
                      fontFamily: "var(--font-ibm-plex-mono)",
                    }}
                  />
                </div>
                {form.coupon_status === "valid" && (
                  <p className="text-xs mt-1" style={{ color: "#10b981", fontFamily: "var(--font-ibm-plex-mono)" }}>
                    ✓ {form.coupon_discount}% off applied
                  </p>
                )}
                {form.coupon_status === "invalid" && (
                  <p className="text-xs mt-1" style={{ color: "#ef4444", fontFamily: "var(--font-ibm-plex-mono)" }}>
                    ✗ Invalid or expired code
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Level */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold font-syne mb-1" style={{ color: "#f1f5f9" }}>
              Current preparation level
            </h2>
            <p className="text-xs mb-6" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
              Be honest — this shapes your entire study roadmap
            </p>

            <div className="space-y-3">
              {[
                {
                  value: "beginner",
                  label: "Beginner",
                  desc: "Starting fresh, &lt;1 month of prep",
                },
                {
                  value: "intermediate",
                  label: "Intermediate",
                  desc: "1–4 months prep, some concepts known",
                },
                {
                  value: "advanced",
                  label: "Advanced",
                  desc: "4+ months, just needs gap filling",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, level: opt.value as any })}
                  className="w-full p-4 rounded text-left transition-all"
                  style={{
                    background: form.level === opt.value ? "rgba(245, 158, 11, 0.1)" : "#0a0e1a",
                    border: `1px solid ${form.level === opt.value ? "#f59e0b" : "#1e293b"}`,
                  }}
                >
                  <div className="font-medium text-sm font-syne" style={{ color: "#f1f5f9" }}>
                    {opt.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}
                    dangerouslySetInnerHTML={{ __html: opt.desc }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Target */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold font-syne mb-1" style={{ color: "#f1f5f9" }}>
              Your target rank
            </h2>
            <p className="text-xs mb-6" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
              Sets the difficulty and intensity of your practice
            </p>

            <div className="grid grid-cols-2 gap-3">
              {TARGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, target_rank: opt.value })}
                  className="p-4 rounded text-center transition-all"
                  style={{
                    background: form.target_rank === opt.value ? "rgba(245, 158, 11, 0.1)" : "#0a0e1a",
                    border: `1px solid ${form.target_rank === opt.value ? "#f59e0b" : "#1e293b"}`,
                  }}
                >
                  <div className="font-semibold font-syne" style={{ color: "#f59e0b" }}>
                    {opt.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Exam month + daily hours */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-semibold font-syne mb-1" style={{ color: "#f1f5f9" }}>
              Schedule details
            </h2>
            <p className="text-xs mb-6" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
              We'll build a realistic roadmap based on your timeline
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs mb-2" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  EXAM MONTH
                </label>
                <input
                  type="month"
                  value={form.exam_month}
                  min="2025-01"
                  onChange={(e) => setForm({ ...form, exam_month: e.target.value })}
                  className="px-3 py-2.5 rounded text-sm outline-none"
                  style={{
                    background: "#0a0e1a",
                    border: "1px solid #1e293b",
                    color: "#f59e0b",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    colorScheme: "dark",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                  onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
                />
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  DAILY STUDY HOURS —{" "}
                  <span style={{ color: "#f59e0b" }}>{form.daily_hours}h</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={form.daily_hours}
                  onChange={(e) => setForm({ ...form, daily_hours: parseInt(e.target.value) })}
                  className="w-full accent-amber-500"
                  style={{ accentColor: "#f59e0b" }}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  <span>1h</span>
                  <span>8h</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Subject self-rating */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-semibold font-syne mb-1" style={{ color: "#f1f5f9" }}>
              Rate your subjects
            </h2>
            <p className="text-xs mb-6" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
              0 = no idea, 100 = exam ready. Be honest.
            </p>

            <div className="space-y-4">
              {SUBJECTS.map((subject) => (
                <div key={subject}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: "#f1f5f9", fontFamily: "var(--font-ibm-plex-mono)" }}>
                      {subject}
                    </span>
                    <span
                      style={{
                        color:
                          form.subject_ratings[subject] < 40
                            ? "#ef4444"
                            : form.subject_ratings[subject] < 70
                            ? "#f59e0b"
                            : "#10b981",
                        fontFamily: "var(--font-ibm-plex-mono)",
                      }}
                    >
                      {form.subject_ratings[subject]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.subject_ratings[subject]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        subject_ratings: {
                          ...form.subject_ratings,
                          [subject]: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full"
                    style={{ accentColor: "#f59e0b" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={back}
              className="px-6 py-2.5 rounded text-sm"
              style={{
                background: "transparent",
                border: "1px solid #1e293b",
                color: "#94a3b8",
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={next}
              disabled={
                (step === 1 && !form.name) ||
                (step === 2 && !form.level) ||
                (step === 3 && !form.target_rank)
              }
              className="flex-1 py-2.5 rounded text-sm font-medium"
              style={{
                background: "#f59e0b",
                color: "#0a0e1a",
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: "pointer",
                opacity:
                  (step === 1 && !form.name) ||
                  (step === 2 && !form.level) ||
                  (step === 3 && !form.target_rank)
                    ? 0.4
                    : 1,
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 rounded text-sm font-medium"
              style={{
                background: "#f59e0b",
                color: "#0a0e1a",
                fontFamily: "var(--font-ibm-plex-mono)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Building your roadmap..." : "Start preparing →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
