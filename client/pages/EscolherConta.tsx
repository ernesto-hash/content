// client/pages/EscolherConta.tsx
//
// Account-type gate for Google OAuth users.
//
// Email/password users choose their role during signup (Signup.tsx) and always
// have a profiles row before reaching any protected page. Google OAuth users
// skip that form entirely — Supabase creates their auth.users entry directly
// and never calls createProfile(). This page fills that gap.
//
// Flow:
//   loginWithGoogle() → Google → /escolher-conta
//   On mount:
//     1. Confirm session (getUser).
//     2. Check if profiles row already exists.
//        - Exists  → role was already chosen (returning user) → /dashboard.
//        - Missing → new OAuth user → show account-type cards.
//     3. On "Continuar" → createProfile() with chosen role → /dashboard.
//
// The profiles.insert RLS policy only checks auth.uid() = id,
// and the prevent_role_escalation trigger is BEFORE UPDATE only,
// so INSERT with any valid role is fully permitted here.

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { MonitorPlay, Video } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { createProfile } from "@/services/profiles";

type AccountType = "user" | "creator";
type PageStatus  = "checking" | "ready" | "saving";

export default function EscolherConta() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [status,       setStatus]       = useState<PageStatus>("checking");
  const [selectedRole, setSelectedRole] = useState<AccountType | null>(null);
  const [userId,       setUserId]       = useState("");
  const [userName,     setUserName]     = useState("");
  const [userEmail,    setUserEmail]    = useState("");
  const [error,        setError]        = useState("");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Step 1 — confirm session (server-side, not cached)
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (cancelled) return;

        if (authError || !authData.user) {
          navigate("/login", { replace: true });
          return;
        }

        const user = authData.user;

        // Step 2 — check if this user already has a profiles row
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (existing) {
          // Returning user — role already set. Skip setup.
          navigate("/dashboard", { replace: true });
          return;
        }

        // New OAuth user — no profiles row yet. Show the cards.
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name     as string | undefined) ?? "";

        setUserId(user.id);
        setUserName(fullName);
        setUserEmail(user.email ?? "");
        setStatus("ready");
      } catch {
        if (!cancelled) navigate("/login", { replace: true });
      }
    }

    check();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleContinue = async () => {
    if (!selectedRole || !userId) return;
    setError("");
    setStatus("saving");

    try {
      const baseName = userName || userEmail.split("@")[0] || "user";
      const username =
        baseName.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") +
        Math.floor(Math.random() * 9000 + 1000);

      const profile = await createProfile({
        userId,
        username,
        full_name: userName || baseName,
        role:      selectedRole,
      });

      if (!profile) {
        // The INSERT might have succeeded despite returning null (e.g. RLS
        // returned no rows). Re-check before showing an error.
        const { data: recheck } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (recheck) {
          navigate("/dashboard", { replace: true });
          return;
        }

        setError(t("escolherConta.errorSave"));
        setStatus("ready");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch {
      setError(t("escolherConta.errorSaveFallback"));
      setStatus("ready");
    }
  };

  // Full-screen spinner while checking auth / profile
  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-purple" />
      </div>
    );
  }

  const firstName = userName.split(" ")[0];

  return (
    <div className="min-h-screen flex items-center justify-center safe-area py-8 bg-background">
      <div className="fixed top-20 left-10 w-72 h-72 bg-neon-purple/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-72 h-72 bg-neon-pink/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-2xl blur-xl opacity-50 pointer-events-none" />

        <div className="relative glass p-6 md:p-8 rounded-2xl">

          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">suck</span>
                <span className="text-foreground/40 mx-1">or</span>
                <span className="bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">sex</span>
              </h1>
            </Link>
            <p className="text-foreground/60 text-sm mt-1">
              {firstName ? t("escolherConta.welcomeWithName", { name: firstName }) : t("escolherConta.welcome")}
            </p>
          </div>

          <p className="text-center text-foreground/60 text-sm mb-5">
            {t("escolherConta.question")}
          </p>

          {/* Role cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">

            {/* Viewer card */}
            <button
              type="button"
              onClick={() => setSelectedRole("user")}
              disabled={status === "saving"}
              className={[
                "w-full text-left rounded-xl border-2 p-4 transition-all duration-200",
                status === "saving" ? "opacity-50 cursor-not-allowed" : "",
                selectedRole === "user"
                  ? "border-neon-purple bg-neon-purple/10 shadow-[0_0_18px_rgba(139,92,246,0.25)]"
                  : "border-white/15 hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.05]",
              ].join(" ")}
            >
              <MonitorPlay
                className={`w-7 h-7 mb-3 transition-colors ${
                  selectedRole === "user" ? "text-neon-purple" : "text-foreground/40"
                }`}
              />
              <p className="font-bold text-sm text-foreground leading-tight">
                {t("escolherConta.viewerTitle")}
              </p>
              <p className="text-[10px] text-foreground/45 mt-1.5 leading-snug">
                {t("escolherConta.viewerDesc")}
              </p>
              {selectedRole === "user" && (
                <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-neon-purple bg-neon-purple/15 px-2 py-0.5 rounded-full">
                  {t("escolherConta.selected")}
                </span>
              )}
            </button>

            {/* Creator card */}
            <button
              type="button"
              onClick={() => setSelectedRole("creator")}
              disabled={status === "saving"}
              className={[
                "w-full text-left rounded-xl border-2 p-4 transition-all duration-200",
                status === "saving" ? "opacity-50 cursor-not-allowed" : "",
                selectedRole === "creator"
                  ? "border-neon-pink bg-neon-pink/10 shadow-[0_0_18px_rgba(236,72,153,0.25)]"
                  : "border-white/15 hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.05]",
              ].join(" ")}
            >
              <Video
                className={`w-7 h-7 mb-3 transition-colors ${
                  selectedRole === "creator" ? "text-neon-pink" : "text-foreground/40"
                }`}
              />
              <p className="font-bold text-sm text-foreground leading-tight">
                {t("escolherConta.creatorTitle")}
              </p>
              <p className="text-[10px] text-foreground/45 mt-1.5 leading-snug">
                {t("escolherConta.creatorDesc")}
              </p>
              {selectedRole === "creator" && (
                <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-neon-pink bg-neon-pink/15 px-2 py-0.5 rounded-full">
                  {t("escolherConta.selected")}
                </span>
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center mb-3">{error}</p>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedRole || status === "saving"}
            className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white py-2.5 rounded-lg text-sm font-semibold hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === "saving" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t("escolherConta.saving")}
              </span>
            ) : t("escolherConta.continue")}
          </button>

          <p className="text-center text-foreground/40 text-[10px] mt-4">
            {t("escolherConta.footerNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
