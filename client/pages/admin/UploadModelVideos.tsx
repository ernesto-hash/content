import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import { extractVideoFrames } from "@/utils/extractVideoFrames";
import {
  Crown, Shield, Loader2, Search, User,
  Upload, X, Check, AlertTriangle, CheckCircle2,
  Film, Plus, Edit2, Save, Sparkles, Wand2,
} from "lucide-react";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

type VideoStatus = "idle" | "generating" | "uploading" | "done" | "error";

type VideoItem = {
  localId:      string;
  file:         File;
  title:        string;
  description:  string;
  status:       VideoStatus;
  errorMsg:     string | null;
  editingTitle: boolean;
};

const MAX_VIDEOS = 30;
const CATEGORY   = "amador";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function sanitizeFileName(name: string): string {
  const ext  = name.match(/\.[^.]+$/)?.[0] ?? "";
  const base = name.slice(0, name.length - ext.length);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_") + ext;
}

function fileTitle(file: File): string {
  return file.name.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ").trim();
}

function makeItem(file: File): VideoItem {
  return {
    localId:      crypto.randomUUID(),
    file,
    title:        fileTitle(file),
    description:  "",
    status:       "idle",
    errorMsg:     null,
    editingTitle: false,
  };
}

/** Call the server-side proxy — never throws, returns null on failure */
async function generateText(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("/api/anthropic/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const { text } = await res.json() as { text: string };
    return text?.trim() || null;
  } catch {
    return null;
  }
}

function titlePrompt(modelName: string): string {
  return `Generate a short, attractive video title (max 80 chars) in Portuguese for an adult content platform. The model's name is ${modelName}. Make it enticing and descriptive. Return ONLY the title, nothing else.`;
}

function descriptionPrompt(modelName: string): string {
  return `Generate a short description (max 200 chars) in Portuguese for an adult content video featuring ${modelName}. Make it enticing. Return ONLY the description, nothing else.`;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-full rounded-full transition-all duration-300"
        style={{ width: `${value}%`, background: "linear-gradient(90deg,#ec4899,#9333ea)" }} />
    </div>
  );
}

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
      style={{
        background: done ? "rgba(52,211,153,0.20)" : "rgba(236,72,153,0.20)",
        color:      done ? "#34d399"                : "#ec4899",
      }}>
      {done ? <Check size={10} /> : n}
    </div>
  );
}

function Toggle({ value, onChange, label }: {
  value: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className="w-9 h-5 rounded-full transition-all relative flex-shrink-0"
        style={value
          ? { background: "linear-gradient(90deg,#ec4899,#9333ea)" }
          : { background: "rgba(255,255,255,0.10)" }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
          style={{ left: value ? "calc(100% - 18px)" : "2px" }} />
      </div>
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
    </label>
  );
}

// ─────────────────────────────────────────────
// Per-video row
// ─────────────────────────────────────────────
function VideoRow({
  item, autoGenerate, disabled,
  onEditStart, onEditSave, onEditChange, onRemove,
}: {
  item:         VideoItem;
  autoGenerate: boolean;
  disabled:     boolean;
  onEditStart:  (id: string) => void;
  onEditSave:   (id: string) => void;
  onEditChange: (id: string, v: string) => void;
  onRemove:     (id: string) => void;
}) {
  const isGenerating = item.status === "generating";
  const isUploading  = item.status === "uploading";
  const isDone       = item.status === "done";
  const isError      = item.status === "error";
  const isActive     = isGenerating || isUploading;

  const borderColor = isDone      ? "rgba(52,211,153,0.20)"
    : isError                     ? "rgba(239,68,68,0.20)"
    : isActive                    ? "rgba(236,72,153,0.15)"
    : "rgba(255,255,255,0.07)";

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${borderColor}` }}>

      <div className="flex items-center gap-3 px-4 py-3">

        {/* Status icon */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: isDone      ? "rgba(52,211,153,0.15)"
              : isError             ? "rgba(239,68,68,0.15)"
              : isActive            ? "rgba(236,72,153,0.15)"
              : "rgba(255,255,255,0.06)",
          }}>
          {isDone      ? <Check         size={12} style={{ color: "#34d399" }} />
          : isError    ? <AlertTriangle size={11} style={{ color: "#f87171" }} />
          : isActive   ? <Loader2       size={12} className="animate-spin" style={{ color: "#ec4899" }} />
          :               <Film         size={11} style={{ color: "rgba(255,255,255,0.30)" }} />}
        </div>

        {/* Filename */}
        <p className="text-[10px] hidden sm:block flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.25)", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.file.name}
        </p>

        {/* Title area */}
        <div className="flex-1 min-w-0">
          {isGenerating ? (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
              <Wand2 size={10} style={{ color: "#ec4899" }} /> A gerar título...
            </span>
          ) : item.editingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={item.title}
                onChange={e => onEditChange(item.localId, e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") onEditSave(item.localId); }}
                className="flex-1 px-2 py-1 rounded-lg text-white text-xs focus:outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(236,72,153,0.35)" }}
              />
              <button onClick={() => onEditSave(item.localId)}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(52,211,153,0.20)", color: "#34d399" }}>
                <Save size={9} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group/title min-w-0">
              {autoGenerate && item.status === "idle" ? (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  <Sparkles size={9} style={{ color: "#9333ea" }} /> Será gerado automaticamente
                </span>
              ) : (
                <>
                  <span className="text-xs truncate font-medium"
                    style={{ color: isDone ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.50)" }}>
                    {item.title || "—"}
                  </span>
                  {!isActive && !disabled && (
                    <button onClick={() => onEditStart(item.localId)}
                      className="opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0"
                      style={{ color: "rgba(255,255,255,0.30)" }}>
                      <Edit2 size={9} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Status badge */}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold flex-shrink-0"
          style={
            isDone      ? { background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.20)", color: "#34d399" }
            : isError   ? { background: "rgba(239,68,68,0.10)",  border: "1px solid rgba(239,68,68,0.20)",  color: "#f87171" }
            : isActive  ? { background: "rgba(236,72,153,0.10)", border: "1px solid rgba(236,72,153,0.20)", color: "#ec4899" }
            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)" }
          }>
          {isGenerating ? "A gerar..."
          : isUploading ? "A publicar..."
          : isDone      ? "Publicado"
          : isError     ? "Erro"
          :               "Aguarda"}
        </span>

        {/* Remove */}
        {!isActive && !isDone && !disabled && (
          <button onClick={() => onRemove(item.localId)}
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
            style={{ background: "rgba(239,68,68,0.10)", color: "rgba(239,68,68,0.55)" }}>
            <X size={10} />
          </button>
        )}
      </div>

      {/* Error message */}
      {isError && item.errorMsg && (
        <div className="px-4 pb-2.5 flex items-center gap-1.5 text-[10px]" style={{ color: "#f87171" }}>
          <AlertTriangle size={9} className="flex-shrink-0" /> {item.errorMsg}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function UploadModelVideos() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Step A
  const [profiles, setProfiles]               = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [search, setSearch]                   = useState("");
  const [selectedModel, setSelectedModel]     = useState<Profile | null>(null);
  const [modelName, setModelName]             = useState("");

  // Step B
  const [videos, setVideos]     = useState<VideoItem[]>([]);
  const fileInputRef             = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Step C
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [progress, setProgress]         = useState({ current: 0, total: 0 });
  const [done, setDone]                 = useState(false);

  // Keep a ref to always read latest video state inside async loop
  const videosRef = useRef<VideoItem[]>([]);
  useEffect(() => { videosRef.current = videos; }, [videos]);

  // ── Admin check ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) { setIsAdmin(false); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", uid).single();
      setIsAdmin(profile?.role === "admin");
    });
  }, []);

  // ── Load profiles ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, role")
      .or("role.eq.creator,role.eq.user")
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        setProfiles((data ?? []) as Profile[]);
        setLoadingProfiles(false);
      });
  }, [isAdmin]);

  const filteredProfiles = profiles.filter(p => {
    const q = search.toLowerCase();
    return (p.full_name ?? "").toLowerCase().includes(q)
      || (p.username ?? "").toLowerCase().includes(q);
  });

  // ── File handling ────────────────────────────────────────────────────────
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr   = Array.from(files).filter(f => f.type.startsWith("video/"));
    const space = MAX_VIDEOS - videos.length;
    if (space <= 0) return;
    setVideos(prev => [...prev, ...arr.slice(0, space).map(makeItem)]);
  }, [videos.length]);

  const removeVideo = (localId: string) =>
    setVideos(prev => prev.filter(v => v.localId !== localId));

  const updateVideo = useCallback((localId: string, patch: Partial<VideoItem>) =>
    setVideos(prev => prev.map(v => v.localId === localId ? { ...v, ...patch } : v)), []);

  // ── Title edit helpers ────────────────────────────────────────────────────
  const handleEditStart  = (id: string) => updateVideo(id, { editingTitle: true });
  const handleEditSave   = (id: string) => updateVideo(id, { editingTitle: false });
  const handleEditChange = (id: string, val: string) => updateVideo(id, { title: val });

  // ── Upload + generate loop ────────────────────────────────────────────────
  const uploadAll = async () => {
    if (!selectedModel) return;
    const toUpload = videosRef.current.filter(v => v.status === "idle");
    if (!toUpload.length) return;

    const name = modelName.trim() || selectedModel.full_name || selectedModel.username || "modelo";

    setUploading(true);
    setDone(false);
    setProgress({ current: 0, total: toUpload.length });

    for (let i = 0; i < toUpload.length; i++) {
      const item = toUpload[i];
      setProgress({ current: i + 1, total: toUpload.length });

      // Local vars — will hold the final values used in the DB insert
      let title       = videosRef.current.find(v => v.localId === item.localId)?.title ?? item.title;
      let description = "";

      try {
        // ── 1. Generate metadata ──────────────────────────────────────────
        if (autoGenerate) {
          updateVideo(item.localId, { status: "generating", errorMsg: null });

          const [genTitle, genDesc] = await Promise.all([
            generateText(titlePrompt(name)),
            generateText(descriptionPrompt(name)),
          ]);

          if (genTitle) title = genTitle;
          if (genDesc)  description = genDesc;

          // Show generated title in UI immediately
          updateVideo(item.localId, { title, description });
        }

        // ── 2. Upload video ───────────────────────────────────────────────
        updateVideo(item.localId, { status: "uploading", errorMsg: null });

        const videoId   = crypto.randomUUID();
        const safeFile  = sanitizeFileName(item.file.name);
        const videoPath = `${selectedModel.id}/${videoId}/${safeFile}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("video-uploads")
          .upload(videoPath, item.file, { cacheControl: "3600", upsert: true });
        if (uploadErr) throw new Error(uploadErr.message);

        // ── 3. Signed URL (~10 years) ─────────────────────────────────────
        const { data: signed, error: signErr } = await supabase.storage
          .from("video-uploads")
          .createSignedUrl(uploadData.path, 315_360_000);
        if (signErr || !signed?.signedUrl) throw new Error("Erro ao gerar URL do vídeo.");
        const videoUrl = signed.signedUrl;

        // ── 4. Extract thumbnail (frame at 50%) — never blocks ────────────
        let thumbnailUrl: string | null = null;
        try {
          const frames    = await extractVideoFrames(item.file);
          const thumbBlob = frames[1] ?? frames[0] ?? null;
          if (thumbBlob) {
            const thumbPath = `auto/${videoId}.jpg`;
            const { error: thumbErr } = await supabase.storage
              .from("thumbnails")
              .upload(thumbPath, thumbBlob, { contentType: "image/jpeg", upsert: true });
            if (!thumbErr) {
              const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(thumbPath);
              thumbnailUrl = urlData.publicUrl ?? null;
            }
          }
        } catch {
          thumbnailUrl = null;
        }

        // ── 5. INSERT into videos ─────────────────────────────────────────
        const { error: dbErr } = await supabase.from("videos").insert({
          id:             videoId,
          user_id:        selectedModel.id,
          model_username: selectedModel.username,
          title:          title.trim() || null,
          description:    description || null,
          category:       CATEGORY,
          video_url:      videoUrl,
          thumbnail_url:  thumbnailUrl,
          status:         "published",
          visibility:     "public",
          storage_path:   videoPath,
        });
        if (dbErr) throw new Error(dbErr.message);

        updateVideo(item.localId, { status: "done" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido.";
        console.error("[UploadModelVideos]", item.file.name, msg);
        updateVideo(item.localId, { status: "error", errorMsg: msg });
      }
    }

    setUploading(false);
    setDone(true);
  };

  const reset = () => {
    setVideos([]);
    setDone(false);
    setProgress({ current: 0, total: 0 });
  };

  // ── Access gate ───────────────────────────────────────────────────────────
  if (isAdmin === false) {
    return (
      <LayoutAuthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Shield size={28} style={{ color: "#f87171" }} />
          </div>
          <p className="text-white/50 text-sm">Acesso restrito a administradores.</p>
          <Link to="/dashboard" className="text-xs" style={{ color: "#ec4899" }}>← Voltar ao Dashboard</Link>
        </div>
      </LayoutAuthenticated>
    );
  }

  if (isAdmin === null) {
    return (
      <LayoutAuthenticated>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin" style={{ color: "#ec4899" }} />
        </div>
      </LayoutAuthenticated>
    );
  }

  const idleCount = videos.filter(v => v.status === "idle").length;
  const doneCount = videos.filter(v => v.status === "done").length;
  const errCount  = videos.filter(v => v.status === "error").length;

  // ─────────────────────────────────────────────
  // Layout
  // ─────────────────────────────────────────────
  return (
    <LayoutAuthenticated>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={18} style={{ color: "#ec4899" }} />
              <h1 className="text-xl font-black text-white">Upload de Vídeos para Modelo</h1>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              Selecciona o modelo, carrega até {MAX_VIDEOS} vídeos — títulos e descrições gerados automaticamente
            </p>
          </div>
          <Link
            to="/admin/galeria"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
          >
            ← Galeria Admin
          </Link>
        </div>

        <div className="space-y-5">

          {/* ── Step A: Seleccionar modelo ──────────────────────────────── */}
          <div className="rounded-2xl p-5 space-y-4"
            style={{ background: "linear-gradient(135deg,#0f0218,#1a0830)", border: "1px solid rgba(255,255,255,0.08)" }}>

            <div className="flex items-center gap-2">
              <StepBadge n={1} done={!!selectedModel} />
              <h2 className="text-sm font-black text-white">Seleccionar Modelo</h2>
            </div>

            {selectedModel ? (
              <div className="space-y-3">
                {/* Model card */}
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    {selectedModel.avatar_url
                      ? <img src={selectedModel.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <User size={16} style={{ color: "rgba(255,255,255,0.30)" }} />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">
                      {selectedModel.full_name ?? selectedModel.username ?? "—"}
                    </p>
                    {selectedModel.username && (
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.40)" }}>
                        @{selectedModel.username} · {selectedModel.role}
                      </p>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => { setSelectedModel(null); setModelName(""); setVideos([]); setDone(false); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.40)" }}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Model name override (used in prompts) */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    Nome da modelo <span style={{ color: "rgba(255,255,255,0.20)", fontWeight: "normal", textTransform: "none" }}>· usado para gerar títulos</span>
                  </label>
                  <input
                    value={modelName}
                    onChange={e => setModelName(e.target.value)}
                    disabled={uploading}
                    placeholder={selectedModel.full_name ?? selectedModel.username ?? "Nome da modelo..."}
                    className="w-full px-3 py-2 rounded-xl text-white text-sm focus:outline-none disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                  />
                </div>
              </div>
            ) : (
              /* Selector */
              <div className="space-y-3">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "rgba(255,255,255,0.30)" }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Pesquisar por nome ou username..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                  />
                </div>
                {loadingProfiles ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={18} className="animate-spin" style={{ color: "#ec4899" }} />
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                    {filteredProfiles.length === 0 ? (
                      <p className="text-center py-6 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {search ? "Sem resultados." : "Sem modelos disponíveis."}
                      </p>
                    ) : filteredProfiles.map(p => (
                      <button key={p.id}
                        onClick={() => {
                          setSelectedModel(p);
                          setModelName(p.full_name ?? p.username ?? "");
                          setSearch("");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-90"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                          style={{ background: "rgba(255,255,255,0.08)" }}>
                          {p.avatar_url
                            ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <User size={12} style={{ color: "rgba(255,255,255,0.30)" }} />
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: "rgba(255,255,255,0.80)" }}>
                            {p.full_name ?? p.username ?? "—"}
                          </p>
                          {p.username && (
                            <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                              @{p.username} · {p.role}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Step B: Seleccionar vídeos ──────────────────────────────── */}
          {selectedModel && (
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <StepBadge n={2} />
                  <h2 className="text-sm font-black text-white">Seleccionar Vídeos</h2>
                </div>
                <div className="flex items-center gap-4">
                  <Toggle
                    value={autoGenerate}
                    onChange={setAutoGenerate}
                    label="Gerar títulos automaticamente"
                  />
                  <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {videos.length} / {MAX_VIDEOS}
                  </span>
                </div>
              </div>

              {/* Drop zone */}
              {videos.length < MAX_VIDEOS && !done && (
                <label
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                  className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all py-8 px-6"
                  style={{
                    borderColor: dragging ? "rgba(236,72,153,0.60)" : "rgba(255,255,255,0.10)",
                    background:  dragging ? "rgba(236,72,153,0.05)" : "transparent",
                  }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ fontSize: 0 }}
                    onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                  />
                  <Upload size={22} style={{ color: dragging ? "#ec4899" : "rgba(255,255,255,0.18)" }} />
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {dragging ? "Larga aqui!" : "Arrasta vídeos ou clica para seleccionar"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      Até {MAX_VIDEOS - videos.length} vídeo{MAX_VIDEOS - videos.length !== 1 ? "s" : ""} · MP4, MOV, AVI
                    </p>
                  </div>
                </label>
              )}

              {/* Video list */}
              {videos.length > 0 && (
                <div className="space-y-2">
                  {videos.map(item => (
                    <VideoRow
                      key={item.localId}
                      item={item}
                      autoGenerate={autoGenerate}
                      disabled={uploading}
                      onEditStart={handleEditStart}
                      onEditSave={handleEditSave}
                      onEditChange={handleEditChange}
                      onRemove={removeVideo}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step C: Publicar ────────────────────────────────────────── */}
          {selectedModel && videos.length > 0 && !done && (
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>

              <div className="flex items-center gap-2">
                <StepBadge n={3} />
                <h2 className="text-sm font-black text-white">Publicar</h2>
              </div>

              {uploading && (
                <div className="space-y-1.5">
                  <ProgressBar value={progress.total > 0
                    ? Math.round((progress.current / progress.total) * 100) : 0} />
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                    A processar {progress.current} / {progress.total}...
                    {autoGenerate && <span style={{ color: "#9333ea" }}> (geração + upload)</span>}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
                  <span className="font-bold text-white">{idleCount}</span> vídeo{idleCount !== 1 ? "s" : ""} para publicar
                  {errCount > 0 && (
                    <span className="ml-2 text-xs" style={{ color: "#f87171" }}>· {errCount} com erro</span>
                  )}
                  {autoGenerate && idleCount > 0 && (
                    <span className="ml-2 text-xs flex items-center gap-1 inline-flex" style={{ color: "#9333ea" }}>
                      <Wand2 size={9} /> Títulos serão gerados automaticamente
                    </span>
                  )}
                </div>
                <button
                  onClick={uploadAll}
                  disabled={uploading || !idleCount}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black transition-all"
                  style={{
                    background: uploading || !idleCount
                      ? "rgba(255,255,255,0.06)"
                      : "linear-gradient(90deg,#ec4899,#9333ea)",
                    opacity: uploading || !idleCount ? 0.5 : 1,
                    cursor:  uploading || !idleCount ? "not-allowed" : "pointer",
                  }}
                >
                  {uploading
                    ? <><Loader2 size={14} className="animate-spin" /> A processar...</>
                    : <><Upload size={14} /> Publicar todos os vídeos</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Concluído ────────────────────────────────────────────────── */}
          {done && (
            <div className="rounded-2xl p-7 text-center space-y-4"
              style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.15)" }}>
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.25)" }}>
                <CheckCircle2 size={26} style={{ color: "#34d399" }} />
              </div>
              <div>
                <p className="text-lg font-black text-white">
                  {doneCount} vídeo{doneCount !== 1 ? "s" : ""} publicado{doneCount !== 1 ? "s" : ""}!
                </p>
                {errCount > 0 && (
                  <p className="text-sm mt-1" style={{ color: "#f87171" }}>
                    {errCount} vídeo{errCount !== 1 ? "s" : ""} falharam — ver erros acima.
                  </p>
                )}
                <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Publicados no perfil de{" "}
                  <span className="font-semibold" style={{ color: "rgba(255,255,255,0.70)" }}>
                    {selectedModel?.full_name ?? selectedModel?.username ?? "—"}
                  </span>
                </p>
              </div>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black transition-all hover:opacity-90"
                style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)" }}
              >
                <Plus size={13} /> Publicar mais vídeos
              </button>
            </div>
          )}

        </div>
      </div>
    </LayoutAuthenticated>
  );
}
