"use client";

import { useState } from "react";
import { createClient } from "@/lib/db/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Auto-confirmed (e.g., email confirmation disabled)
      router.push("/onboarding");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  async function handleGoogleSignup() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    });
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0e1a" }}>
        <div
          className="max-w-md w-full p-8 rounded text-center"
          style={{ background: "#111827", border: "1px solid #1e293b" }}
        >
          <div className="text-3xl mb-4">✉️</div>
          <h2 className="text-xl font-semibold font-syne mb-2" style={{ color: "#f1f5f9" }}>
            Check your email
          </h2>
          <p className="text-sm" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
            We sent a confirmation link to <strong style={{ color: "#f59e0b" }}>{email}</strong>.
            Click it to activate your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0e1a" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold font-syne" style={{ color: "#f59e0b" }}>
              GATE<span className="text-white">prep</span>
            </span>
          </div>
          <p className="text-sm" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
            Adaptive GATE CS mastery
          </p>
        </div>

        <div
          className="p-8 rounded"
          style={{ background: "#111827", border: "1px solid #1e293b" }}
        >
          <h1 className="text-xl font-semibold mb-6 font-syne" style={{ color: "#f1f5f9" }}>
            Create account
          </h1>

          {error && (
            <div
              className="mb-4 p-3 rounded text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid #ef4444",
                color: "#f87171",
                fontFamily: "var(--font-ibm-plex-mono)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                FULL NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
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
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 characters"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded text-sm font-medium"
              style={{
                background: "#f59e0b",
                color: "#0a0e1a",
                fontFamily: "var(--font-ibm-plex-mono)",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "#1e293b" }} />
            <span className="text-xs" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
              OR
            </span>
            <div className="flex-1 h-px" style={{ background: "#1e293b" }} />
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-2.5 rounded text-sm font-medium flex items-center justify-center gap-2"
            style={{
              background: "transparent",
              border: "1px solid #1e293b",
              color: "#f1f5f9",
              fontFamily: "var(--font-ibm-plex-mono)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p
            className="mt-6 text-center text-xs"
            style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}
          >
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#f59e0b" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
