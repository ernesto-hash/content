import { useCallback, useEffect, useRef, useState, type ElementType } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  Film, Heart, Eye, Calendar, MapPin, Globe, CheckCircle2,
  Play, Lock, Link2, Loader2, Camera, X, Save, AlertTriangle,
  ImageIcon, User, Edit3, Share2, VolumeX,
} from "lucide-react";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/services/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileData = {
  id:         string;
  username:   string | null;
  full_name:  string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio:        string | null;
  location:   string | null;
  website:    string | null;
  verified:   boolean;
  created_at: string;
  role:       string;
};

type VideoItem = {
  id:            string;
  title:         string | null;
  thumbnail_url: string | null;
  video_url:     string | null;
  views:         number;
  duration:      number | null;
  created_at:    string;
  category:      string | null;
  status:        string | null;
  visibility:    string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
function fmtDuration(s: number | null) {
  if (!s) return "";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { year: "numeric", month: "long" });
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

function ProfileVideoCard({ video }: { video: VideoItem }) {
  const visIcon =
    video.visibility === "private"  ? <Lock  size={8} /> :
    video.visibility === "unlisted" ? <Link2 size={8} /> : null;

  const videoRef        = useRef<HTMLVideoElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const holdTimerRef    = useRef<ReturnType<typeof setTimeout>>();
  const wasHoldRef      = useRef(false);

  useEffect(() => () => {
    clearTimeout(previewTimerRef.current);
    clearTimeout(holdTimerRef.current);
    if (videoRef.current) videoRef.current.src = "";
  }, []);

  const startPreview = () => {
    const vid = videoRef.current;
    if (!vid || !video.video_url) return;
    clearTimeout(previewTimerRef.current);
    vid.src = video.video_url;
    vid.currentTime = 0;
    vid.play().catch(() => {});
    setIsPreviewing(true);
    previewTimerRef.current = setTimeout(() => vid.pause(), 10_000);
  };
  const stopPreview = () => {
    const vid = videoRef.current;
    if (!vid) return;
    clearTimeout(previewTimerRef.current);
    vid.pause();
    vid.src = "";
    setIsPreviewing(false);
  };
  const handleTouchStart = () => {
    wasHoldRef.current = false;
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => { wasHoldRef.current = true; startPreview(); }, 300);
  };
  const handleTouchEnd = () => { clearTimeout(holdTimerRef.current); if (wasHoldRef.current) stopPreview(); };
  const handleClick = (e: React.MouseEvent) => {
    if (wasHoldRef.current) { e.preventDefault(); wasHoldRef.current = false; }
  };

  return (
    <div className="group">
      <Link to={`/app/video/${video.id}`}
        className="block relative aspect-video rounded-xl overflow-hidden bg-black/30 mb-2"
        style={isPreviewing ? { boxShadow: "0 0 0 2px rgba(236,72,153,0.6)" } : undefined}
        onMouseEnter={() => { if (!isTouchDevice()) startPreview(); }}
        onMouseLeave={() => { if (!isTouchDevice()) stopPreview(); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}>
        {video.thumbnail_url
          ? <img src={video.thumbnail_url} alt={video.title ?? ""} loading="lazy"
              className="w-full h-full object-cover"
              style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }} />
          : <div className="w-full h-full flex items-center justify-center bg-white/5"
              style={{ opacity: isPreviewing ? 0 : 1, transition: "opacity 300ms" }}>
              <Film size={22} className="text-white/15" />
            </div>
        }
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isPreviewing ? 1 : 0, transition: "opacity 300ms" }}
          muted
          playsInline
          preload="none"
        />
        {!isPreviewing && (
          <>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/22 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-11 h-11 rounded-full bg-neon-pink flex items-center justify-center shadow-lg shadow-neon-pink/40 scale-90 group-hover:scale-100 transition-transform duration-300">
                <Play size={16} fill="white" className="text-white ml-0.5" />
              </div>
            </div>
          </>
        )}
        {video.duration != null && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/85 text-white text-[10px] font-mono rounded">
            {fmtDuration(video.duration)}
          </div>
        )}
        {visIcon && !isPreviewing && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/75 text-foreground/70 text-[9px] rounded border border-white/15 flex items-center gap-0.5">
            {visIcon} {video.visibility}
          </div>
        )}
        {isPreviewing && (
          <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 backdrop-blur-sm">
            <VolumeX size={12} className="text-white" />
          </div>
        )}
      </Link>
      <div className="space-y-0.5 px-0.5">
        <Link to={`/app/video/${video.id}`}>
          <h3 className="text-sm font-semibold text-foreground/80 line-clamp-2 group-hover:text-neon-pink transition-colors leading-snug">
            {video.title || "Sem título"}
          </h3>
        </Link>
        <div className="flex items-center gap-2 text-[10px] text-foreground/32 pt-0.5">
          <span className="flex items-center gap-0.5"><Eye size={9} />{fmtNum(video.views)}</span>
          <span className="ml-auto">{fmtDate(video.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

function VideoSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video rounded-xl bg-white/5 mb-2" />
      <div className="h-3 bg-white/5 rounded w-full mb-1" />
      <div className="h-3 bg-white/5 rounded w-2/3 mb-1" />
      <div className="h-2 bg-white/5 rounded w-1/2" />
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  profile,
  onClose,
  onSave,
}: {
  profile:  ProfileData;
  onClose:  () => void;
  onSave:   (updated: ProfileData) => void;
}) {
  const [fullName,  setFullName]  = useState(profile.full_name  ?? "");
  const [username,  setUsername]  = useState(profile.username   ?? "");
  const [bio,       setBio]       = useState(profile.bio        ?? "");
  const [location,  setLocation]  = useState(profile.location   ?? "");
  const [website,   setWebsite]   = useState(profile.website    ?? "");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile,    setBannerFile]    = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-neon-pink/40 focus:bg-white/7 transition-all";

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    if (!bannerFile) return;
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      let newAvatarUrl = profile.avatar_url;
      let newBannerUrl = profile.banner_url;

      if (avatarFile) {
        const ext  = avatarFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${profile.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, cacheControl: "3600" });
        if (upErr) throw new Error(`Erro ao carregar avatar: ${upErr.message}`);
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        newAvatarUrl = urlData.publicUrl;
      }

      if (bannerFile) {
        const ext  = bannerFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${profile.id}/banner.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, bannerFile, { upsert: true, cacheControl: "3600" });
        if (upErr) throw new Error(`Erro ao carregar banner: ${upErr.message}`);
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        newBannerUrl = urlData.publicUrl;
      }

      const { data, error: dbErr } = await supabase
        .from("profiles")
        .update({
          full_name:  fullName.trim()  || null,
          username:   username.trim()  || null,
          bio:        bio.trim()       || null,
          location:   location.trim()  || null,
          website:    website.trim()   || null,
          avatar_url: newAvatarUrl,
          banner_url: newBannerUrl,
        })
        .eq("id", profile.id)
        .select("id,username,full_name,avatar_url,banner_url,bio,location,website,verified,created_at,role")
        .single();

      if (dbErr) throw new Error(dbErr.message);
      onSave(data as ProfileData);
    } catch (e: any) {
      setError(e?.message ?? "Erro desconhecido.");
    } finally {
      setSaving(false);
    }
  };

  const displayInitial = (fullName || username || "?")[0].toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg glass border border-white/12 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-sm font-bold text-foreground">Editar Perfil</h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors">
            <X size={13} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">

          {/* Banner upload */}
          <div>
            <label className="text-[11px] font-semibold text-foreground/55 flex items-center gap-1.5 mb-2">
              <ImageIcon size={11} /> Banner
            </label>
            <label className="relative block rounded-xl overflow-hidden cursor-pointer border border-dashed border-white/15 hover:border-neon-pink/30 transition-colors group" style={{ aspectRatio: "3/1" }}>
              {(bannerPreview ?? profile.banner_url)
                ? <img src={bannerPreview ?? profile.banner_url!} alt=""
                    className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-white/3">
                    <ImageIcon size={20} className="text-foreground/20" />
                    <span className="text-[10px] text-foreground/30">Clicar para adicionar banner</span>
                  </div>
              }
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-black/50 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={14} className="text-white" />
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => setBannerFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <label className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer flex-shrink-0 border-2 border-white/10 hover:border-neon-pink/40 transition-colors group">
              {(avatarPreview ?? profile.avatar_url)
                ? <img src={avatarPreview ?? profile.avatar_url!} alt=""
                    className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-neon-pink/30 to-neon-purple/20 flex items-center justify-center">
                    <span className="text-xl font-black text-white">{displayInitial}</span>
                  </div>
              }
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors flex items-center justify-center">
                <Camera size={13} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => setAvatarFile(e.target.files?.[0] ?? null)} />
            </label>
            <div className="text-xs text-foreground/40">
              <p className="font-semibold text-foreground/60 mb-0.5">Foto de perfil</p>
              <p>JPG, PNG ou WebP</p>
            </div>
          </div>

          {/* Name + Username */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-foreground/55 mb-1.5 block">
                Nome completo
              </label>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="O teu nome" className={inp} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-foreground/55 mb-1.5 block">
                Username
              </label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="@username" className={inp} />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-[11px] font-semibold text-foreground/55 mb-1.5 block">
              Bio
            </label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              rows={3} maxLength={300}
              placeholder="Conta algo sobre ti..."
              className={`${inp} resize-none`} />
            <p className="text-[10px] text-foreground/25 mt-1 text-right">{bio.length}/300</p>
          </div>

          {/* Location + Website */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-foreground/55 mb-1.5 flex items-center gap-1">
                <MapPin size={10} /> Localização
              </label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                placeholder="País, cidade" className={inp} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-foreground/55 mb-1.5 flex items-center gap-1">
                <Globe size={10} /> Website
              </label>
              <input value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://..." className={inp} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-400">
              <AlertTriangle size={12} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground/60 hover:bg-white/10 transition-all">
              Cancelar
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
              {saving
                ? <><Loader2 size={13} className="animate-spin" />A guardar...</>
                : <><Save size={13} />Guardar</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate();

  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [userEmail,   setUserEmail]   = useState<string | null>(null);
  const [profile,     setProfile]     = useState<ProfileData | null>(null);
  const [videos,      setVideos]      = useState<VideoItem[]>([]);
  const [favorites,   setFavorites]   = useState<VideoItem[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [favsFetched, setFavsFetched] = useState(false);
  const [stats,       setStats]       = useState({ videos: 0, views: 0, likes: 0, followers: 0 });
  const [activeTab,   setActiveTab]   = useState<"videos" | "favoritos" | "sobre">("videos");
  const [editOpen,    setEditOpen]    = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        setUserId(user.id);
        setUserEmail(user.email ?? null);
        await fetchAll(user.id);
      } catch {
        navigate("/login");
      }
    };
    init();
  }, []);

  const fetchAll = async (uid: string) => {
    setLoading(true);

    const [profileRes, videosRes, followersRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,username,full_name,avatar_url,banner_url,bio,location,website,verified,created_at,role")
        .eq("id", uid)
        .maybeSingle(),
      supabase
        .from("videos")
        .select("id,title,thumbnail_url,video_url,views,duration,created_at,category,status,visibility")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", uid),
    ]);

    const vids = (videosRes.data ?? []) as VideoItem[];

    let totalLikes = 0;
    if (vids.length > 0) {
      const { count } = await supabase
        .from("interacoes")
        .select("id", { count: "exact", head: true })
        .eq("tipo", true)
        .in("video_id", vids.map(v => v.id));
      totalLikes = count ?? 0;
    }

    setProfile((profileRes.data as ProfileData) ?? {
      id: uid, username: null, full_name: null, avatar_url: null,
      banner_url: null, bio: null, location: null, website: null,
      verified: false, created_at: new Date().toISOString(), role: "user",
    });
    setVideos(vids);
    setStats({
      videos:    vids.length,
      views:     vids.reduce((s, v) => s + (v.views ?? 0), 0),
      likes:     totalLikes,
      followers: followersRes.count ?? 0,
    });
    setLoading(false);
  };

  const fetchFavorites = useCallback(async () => {
    if (!userId || favsFetched) return;
    setLoadingFavs(true);

    const { data: liked } = await supabase
      .from("interacoes")
      .select("video_id")
      .eq("user_id", userId)
      .eq("tipo", true);

    if (!liked || liked.length === 0) {
      setFavorites([]);
      setLoadingFavs(false);
      setFavsFetched(true);
      return;
    }

    const ids = liked.map((r: any) => r.video_id);
    const { data: favsData } = await supabase
      .from("videos")
      .select("id,title,thumbnail_url,video_url,views,duration,created_at,category,status,visibility")
      .in("id", ids)
      .eq("status", "published");

    setFavorites((favsData ?? []) as VideoItem[]);
    setLoadingFavs(false);
    setFavsFetched(true);
  }, [userId, favsFetched]);

  useEffect(() => {
    if (activeTab === "favoritos") fetchFavorites();
  }, [activeTab, fetchFavorites]);

  const emailPrefix   = userEmail?.split("@")[0] ?? null;
  const displayName   = profile?.full_name?.trim() || profile?.username?.trim() || emailPrefix || "Utilizador";
  const initial       = displayName[0].toUpperCase();

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: displayName, url });
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <LayoutAuthenticated>
        <div>
          <div className="w-full h-52 bg-white/5 animate-pulse" />
          <div className="max-container safe-area py-4">
            <div className="-mt-12 mb-4 flex items-end justify-between">
              <div className="w-24 h-24 rounded-full bg-white/10 animate-pulse border-4 border-background" />
              <div className="hidden sm:flex gap-2 pt-14">
                <div className="h-9 w-32 rounded-xl bg-white/5 animate-pulse" />
                <div className="h-9 w-24 rounded-xl bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="h-6 bg-white/5 rounded w-40 mb-2 animate-pulse" />
            <div className="h-4 bg-white/5 rounded w-24 mb-4 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass border border-white/10 rounded-2xl p-4 h-20 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
              {[...Array(10)].map((_, i) => <VideoSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </LayoutAuthenticated>
    );
  }

  // ── Page ─────────────────────────────────────────────────────────────────────
  return (
    <LayoutAuthenticated>

      {/* Banner */}
      <div className="relative w-full h-52 overflow-hidden">
        {profile?.banner_url
          ? <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-neon-pink/20 via-neon-purple/15 to-neon-blue/10" />
        }
        <button onClick={() => setEditOpen(true)}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 border border-white/15 text-white/70 hover:text-white hover:bg-black/70 flex items-center justify-center transition-all backdrop-blur-sm">
          <Camera size={14} />
        </button>
      </div>

      <div className="max-container safe-area">

        {/* Avatar + action buttons row */}
        <div className="flex items-end justify-between -mt-12 mb-4 gap-4">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background bg-gradient-to-br from-neon-pink/30 to-neon-purple/20">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl font-black text-white">{initial}</span>
                  </div>
              }
            </div>
            <button onClick={() => setEditOpen(true)}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-neon-pink border-2 border-background flex items-center justify-center">
              <Camera size={10} className="text-white" />
            </button>
          </div>

          {/* Desktop action buttons — pushed below avatar overlap */}
          <div className="hidden sm:flex items-center gap-2 pt-14">
            <button onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/12 text-sm font-semibold text-foreground/80 hover:bg-white/12 transition-all">
              <Edit3 size={14} /> Editar Perfil
            </button>
            <button onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-foreground/60 hover:bg-white/8 transition-all">
              <Share2 size={14} /> Partilhar
            </button>
          </div>
        </div>

        {/* Name + bio + meta */}
        <div className="mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-foreground">{displayName}</h1>
            {profile?.verified && (
              <CheckCircle2 size={18} className="text-neon-blue flex-shrink-0" />
            )}
          </div>
          {(profile?.username?.trim() || emailPrefix) && (
            <p className="text-sm text-foreground/40 mt-0.5">@{profile?.username?.trim() || emailPrefix}</p>
          )}
          {profile?.bio && (
            <p className="text-sm text-foreground/65 mt-3 max-w-xl leading-relaxed">{profile.bio}</p>
          )}
          <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-foreground/35">
            {profile?.location && (
              <span className="flex items-center gap-1"><MapPin size={11} />{profile.location}</span>
            )}
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-neon-pink hover:text-neon-pink/80 transition-colors">
                <Globe size={11} />{profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {profile?.created_at && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />Membro desde {fmtDate(profile.created_at)}
              </span>
            )}
          </div>

          {/* Mobile action buttons */}
          <div className="flex sm:hidden items-center gap-2 mt-4">
            <button onClick={() => setEditOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/12 text-sm font-semibold text-foreground/80 hover:bg-white/12 transition-all flex-1">
              <Edit3 size={14} /> Editar Perfil
            </button>
            <button onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-foreground/60 hover:bg-white/8 transition-all">
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Vídeos",     value: fmtNum(stats.videos),    icon: <Film  size={15} className="text-neon-pink"   /> },
            { label: "Vistas",     value: fmtNum(stats.views),     icon: <Eye   size={15} className="text-neon-purple" /> },
            { label: "Gostos",     value: fmtNum(stats.likes),     icon: <Heart size={15} className="text-red-400"     /> },
            { label: "Seguidores", value: fmtNum(stats.followers), icon: <User  size={15} className="text-neon-blue"   /> },
          ].map(stat => (
            <div key={stat.label}
              className="glass border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-1 text-center">
              {stat.icon}
              <p className="text-lg font-black text-foreground">{stat.value}</p>
              <p className="text-[11px] text-foreground/40">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          {([
            ["videos",    "Vídeos",    Film],
            ["favoritos", "Favoritos", Heart],
            ["sobre",     "Sobre",     User],
          ] as ["videos" | "favoritos" | "sobre", string, ElementType][]).map(([tab, label, Icon]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-all ${
                activeTab === tab
                  ? "border-neon-pink text-neon-pink"
                  : "border-transparent text-foreground/45 hover:text-foreground/70"
              }`}>
              <Icon size={13} />{label}
              {tab === "videos" && stats.videos > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab ? "bg-neon-pink/20 text-neon-pink" : "bg-white/8 text-foreground/35"
                }`}>{stats.videos}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Vídeos ────────────────────────────────────────────────── */}
        {activeTab === "videos" && (
          videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                <Film size={26} className="text-foreground/18" />
              </div>
              <div className="text-center">
                <p className="text-foreground/55 font-semibold">Ainda sem vídeos</p>
                <p className="text-foreground/30 text-sm mt-1">Os teus vídeos aparecerão aqui</p>
              </div>
              <Link to="/studio/upload"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold hover:opacity-90 transition-all">
                Enviar primeiro vídeo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6 pb-10">
              {videos.map(v => <ProfileVideoCard key={v.id} video={v} />)}
            </div>
          )
        )}

        {/* ── Tab: Favoritos ─────────────────────────────────────────────── */}
        {activeTab === "favoritos" && (
          loadingFavs ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6 pb-10">
              {[...Array(8)].map((_, i) => <VideoSkeleton key={i} />)}
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                <Heart size={26} className="text-foreground/18" />
              </div>
              <div className="text-center">
                <p className="text-foreground/55 font-semibold">Sem vídeos favoritos</p>
                <p className="text-foreground/30 text-sm mt-1">Os vídeos que gostar aparecerão aqui</p>
              </div>
              <Link to="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-foreground/60 hover:bg-white/10 transition-all">
                Descobrir vídeos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6 pb-10">
              {favorites.map(v => <ProfileVideoCard key={v.id} video={v} />)}
            </div>
          )
        )}

        {/* ── Tab: Sobre ─────────────────────────────────────────────────── */}
        {activeTab === "sobre" && (
          <div className="max-w-xl pb-10">
            <div className="glass border border-white/10 rounded-2xl p-5 space-y-4">
              {profile?.bio ? (
                <div>
                  <h3 className="text-[10px] font-bold text-foreground/35 uppercase tracking-widest mb-2">Sobre</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">{profile.bio}</p>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-foreground/35 text-sm">Sem bio</p>
                  <button onClick={() => setEditOpen(true)}
                    className="text-neon-pink text-sm mt-1 hover:text-neon-pink/80 transition-colors">
                    Adicionar bio →
                  </button>
                </div>
              )}

              {(profile?.location || profile?.website || profile?.created_at) && (
                <div className="space-y-2.5 pt-2 border-t border-white/8">
                  {profile?.location && (
                    <div className="flex items-center gap-2.5 text-sm text-foreground/55">
                      <MapPin size={14} className="text-foreground/30 flex-shrink-0" />
                      {profile.location}
                    </div>
                  )}
                  {profile?.website && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Globe size={14} className="text-foreground/30 flex-shrink-0" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer"
                        className="text-neon-pink hover:text-neon-pink/80 transition-colors truncate">
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {profile?.created_at && (
                    <div className="flex items-center gap-2.5 text-sm text-foreground/55">
                      <Calendar size={14} className="text-foreground/30 flex-shrink-0" />
                      Membro desde {fmtDate(profile.created_at)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {editOpen && profile && (
        <EditModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={updated => {
            setProfile(updated);
            setEditOpen(false);
          }}
        />
      )}

    </LayoutAuthenticated>
  );
}
