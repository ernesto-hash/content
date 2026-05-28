import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Save, Settings } from "lucide-react";
import StudioLayout from "@/components/studio/StudioLayout";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  bio?: string | null;
};

export default function StudioSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getSession();
      const user = auth?.session?.user;
      if (!user) return;

      const { data, error } = await supabase.from("profiles").select("id,username,full_name,avatar_url,bio,website,location").eq("id", user.id).single();

      if (!isMounted) return;

      if (!error && data) {
        const p = data as unknown as Profile;
        setProfile(p);
        setUsername(p.username || "");
        setFullName(p.full_name || "");
        setBio((p as any).bio || "");
      } else {
        setProfile({
          id: user.id,
          username: user.email?.split("@")[0] || "Usuário",
          full_name: "",
          avatar_url: null,
          verified: false,
          bio: "",
        });
        setUsername(user.email?.split("@")[0] || "Usuário");
        setFullName("");
        setBio("");
      }

      setLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    // se tua tabela profiles não tiver "bio", remove essa coluna.
    const { error } = await supabase
      .from("profiles")
      .update({
        username: username || null,
        full_name: fullName || null,
        bio: bio || null,
      })
      .eq("id", profile.id);

    if (error) {
      setMessage(error.message || t("studio.settings.saveError"));
    } else {
      setMessage(t("studio.settings.saved"));
    }

    setSaving(false);
  };

  return (
    <StudioLayout subtitle={t("studio.settings.subtitle")}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-black text-foreground">{t("studio.settings.title")}</h1>
          <p className="text-sm text-foreground/50 mt-1">{t("studio.settings.desc")}</p>
        </div>

        <div className="glass border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Settings size={16} className="text-neon-pink" /> {t("studio.settings.channelProfile")}
          </div>

          {loading ? (
            <div className="mt-4 space-y-3">
              <div className="h-10 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
              <div className="h-10 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
              <div className="h-24 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-foreground/60">{t("studio.settings.usernameLabel")}</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-foreground/60">{t("studio.settings.fullNameLabel")}</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="text-xs text-foreground/60">{t("studio.settings.bioLabel")}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 w-full min-h-[120px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all"
                  placeholder={t("studio.settings.bioPlaceholder")}
                />
              </div>

              <div className="lg:col-span-2 flex items-center justify-between gap-3">
                <div className="text-xs text-foreground/40">
                  {message ? <span className="text-foreground/70">{message}</span> : t("studio.settings.tip")}
                </div>

                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? t("studio.settings.saving") : t("studio.settings.save")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudioLayout>
  );
}