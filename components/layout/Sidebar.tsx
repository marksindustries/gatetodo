"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/db/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ALL_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "◈", short: "Home" },
  { href: "/practice",  label: "Practice",  icon: "▷", short: "Practice" },
  { href: "/roadmap",   label: "Roadmap",   icon: "⊞", short: "Roadmap" },
  { href: "/mock",      label: "Mock Test", icon: "⊡", short: "Mock" },
  { href: "/analytics", label: "Analytics", icon: "⊕", short: "Analytics" },
  { href: "/tutor",     label: "AI Tutor",  icon: "⟨⟩", short: "Tutor" },
] as const;

// First 4 items appear in the mobile bottom bar; rest go in "More"
const BOTTOM_NAV = ALL_NAV.slice(0, 4);
const MORE_NAV   = ALL_NAV.slice(4);

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const [moreOpen, setMoreOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* ── Desktop Sidebar (md+) ── */}
      <aside
        className="hidden md:flex flex-col h-screen flex-shrink-0"
        style={{ width: "200px", background: "#111827", borderRight: "1px solid #1e293b" }}
      >
        {/* Logo */}
        <div className="px-4 py-4" style={{ borderBottom: "1px solid #1e293b" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <span className="text-lg font-bold font-syne" style={{ color: "#f59e0b" }}>
              GATE<span style={{ color: "#f1f5f9" }}>prep</span>
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {ALL_NAV.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 transition-all"
              style={{
                background: isActive(href) ? "rgba(245,158,11,0.08)" : "transparent",
                borderLeft: `2px solid ${isActive(href) ? "#f59e0b" : "transparent"}`,
                textDecoration: "none",
              }}
            >
              <span style={{ color: isActive(href) ? "#f59e0b" : "#475569", fontSize: "14px", fontFamily: "var(--font-ibm-plex-mono)" }}>
                {icon}
              </span>
              <span className="text-xs" style={{ color: isActive(href) ? "#f1f5f9" : "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                {label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid #1e293b" }}>
          <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5" style={{ textDecoration: "none" }}>
            <span style={{ color: "#475569", fontSize: "14px" }}>⚙</span>
            <span className="text-xs" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>Settings</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 w-full"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            <span style={{ color: "#475569", fontSize: "14px" }}>⏻</span>
            <span className="text-xs" style={{ color: "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav (<md) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: "#111827", borderTop: "1px solid #1e293b", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {BOTTOM_NAV.map(({ href, icon, short }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5"
            style={{ textDecoration: "none" }}
          >
            <span style={{ color: isActive(href) ? "#f59e0b" : "#475569", fontSize: "18px", lineHeight: 1, fontFamily: "var(--font-ibm-plex-mono)" }}>
              {icon}
            </span>
            <span className="text-[10px]" style={{ color: isActive(href) ? "#f59e0b" : "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>
              {short}
            </span>
          </Link>
        ))}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
        >
          <span style={{ color: "#475569", fontSize: "18px", lineHeight: 1, letterSpacing: "2px" }}>···</span>
          <span className="text-[10px]" style={{ color: "#475569", fontFamily: "var(--font-ibm-plex-mono)" }}>More</span>
        </button>
      </nav>

      {/* ── Mobile More Sheet ── */}
      {moreOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.65)" }}
            onClick={() => setMoreOpen(false)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl"
            style={{ background: "#111827", border: "1px solid #1e293b" }}
          >
            {/* Handle + title */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid #1e293b" }}>
              <span className="text-base font-bold font-syne" style={{ color: "#f59e0b" }}>
                GATE<span style={{ color: "#f1f5f9" }}>prep</span>
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <div className="py-1">
              {MORE_NAV.map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{
                    textDecoration: "none",
                    background: isActive(href) ? "rgba(245,158,11,0.08)" : "transparent",
                  }}
                >
                  <span style={{ color: isActive(href) ? "#f59e0b" : "#475569", fontSize: "16px", fontFamily: "var(--font-ibm-plex-mono)", width: "20px" }}>
                    {icon}
                  </span>
                  <span className="text-sm" style={{ color: isActive(href) ? "#f1f5f9" : "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                    {label}
                  </span>
                </Link>
              ))}

              <Link
                href="/settings"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{
                  textDecoration: "none",
                  background: isActive("/settings") ? "rgba(245,158,11,0.08)" : "transparent",
                }}
              >
                <span style={{ color: isActive("/settings") ? "#f59e0b" : "#475569", fontSize: "16px", width: "20px" }}>⚙</span>
                <span className="text-sm" style={{ color: isActive("/settings") ? "#f1f5f9" : "#94a3b8", fontFamily: "var(--font-ibm-plex-mono)" }}>
                  Settings
                </span>
              </Link>

              <div style={{ borderTop: "1px solid #1e293b", marginTop: "4px" }}>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-4 px-5 py-3.5 w-full"
                  style={{ background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <span style={{ color: "#ef4444", fontSize: "16px", width: "20px" }}>⏻</span>
                  <span className="text-sm" style={{ color: "#ef4444", fontFamily: "var(--font-ibm-plex-mono)" }}>Sign out</span>
                </button>
              </div>
            </div>

            <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      )}
    </>
  );
}
