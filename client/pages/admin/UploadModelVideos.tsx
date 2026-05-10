import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import { extractVideoFrames } from "@/utils/extractVideoFrames";
import {
  Crown, Shield, Loader2, Search, User,
  Upload, X, Check, AlertTriangle, CheckCircle2,
  Film, Plus,
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

type VideoStatus = "idle" | "uploading" | "done" | "error";

type VideoItem = {
  localId: string;
  file: File;
  title: string;
  category: string;
  status: VideoStatus;
  errorMsg: string | null;
};

// ─────────────────────────────────────────────
// Categorias (mesmas que StudioUpload)
// ─────────────────────────────────────────────
const CATEGORY_GROUPS = [
  {
    group: "Tipo de Conteúdo",
    items: [
      { id: "amador",       label: "Amador"           },
      { id: "profissional", label: "Profissional"      },
      { id: "casal",        label: "Casal"             },
      { id: "solo",         label: "Solo"              },
      { id: "grupo",        label: "Grupo"             },
      { id: "lesbico",      label: "Lésbico"           },
      { id: "gay",          label: "Gay"               },
      { id: "trans",        label: "Trans"             },
      { id: "hentai",       label: "Hentai"            },
      { id: "anime",        label: "Anime"             },
      { id: "cosplay",      label: "Cosplay"           },
      { id: "asmr",         label: "ASMR"              },
    ],
  },
  {
    group: "Formato",
    items: [
      { id: "vr",       label: "Realidade Virtual" },
      { id: "4k",       label: "4K Ultra HD"       },
      { id: "fullhd",   label: "Full HD"           },
      { id: "ao-vivo",  label: "Ao Vivo"           },
      { id: "shorties", label: "Shorties"          },
      { id: "podcasts", label: "Podcasts Eróticos" },
    ],
  },
  {
    group: "País",
    items: [
      { id: "angola",   label: "Angola"         },
      { id: "brasil",   label: "Brasil"         },
      { id: "eua",      label: "Estados Unidos" },
      { id: "japao",    label: "Japão"          },
      { id: "italia",   label: "Itália"         },
      { id: "franca",   label: "França"         },
      { id: "espanha",  label: "Espanha"        },
      { id: "alemanha", label: "Alemanha"       },
    ],
  },
];

const MAX_VIDEOS = 30;

// ─────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────
function sanitizeFileName(name: string): string {
  const ext = name.match(/\.[^.]+$/)?.[0] ?? "";
  const base = name.slice(0, name.length - ext.length);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_") + ext;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.08)" }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${value}%`, background: "linear-gradient(90deg,#ec4899,#9333ea)" }}
      />
    </div>
  );
}

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
      style={{
        background: done ? "rgba(52,211,153,0.20)" : "rgba(236,72,153,0.20)",
        color: done ? "#34d399" : "#ec4899",
      }}>
      {done ? <Check size={10} /> : n}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function UploadModelVideos() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Step A
  const [profiles, setProfiles]           = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [search, setSearch]               = useState("");
  const [selectedModel, setSelectedModel] = useState<Profile | null>(null);

  // Step B
  const [videos, setVideos]     = useState<VideoItem[]>([]);
  const fileInputRef             = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Step C
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState({ current: 0, total: 0 });
  const [done, setDone]           = useState(false);

  // ── Verificar admin ─────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) { setIsAdmin(false); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", uid).single();
      setIsAdmin(profile?.role === "admin");
    });
  }, []);

  // ── Carregar perfis de modelos ──────────────────────────────────────────
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

  // ── Adicionar ficheiros ─────────────────────────────────────────────────
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr   = Array.from(files).filter(f => f.type.startsWith("video/"));
    const space = MAX_VIDEOS - videos.length;
    if (space <= 0) return;
    const newItems: VideoItem[] = arr.slice(0, space).map(file => ({
      localId:  crypto.randomUUID(),
      file,
      title:    file.name.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " "),
      category: "",
      status:   "idle",
      errorMsg: null,
    }));
    setVideos(prev => [...prev, ...newItems]);
  }, [videos.length]);

  const removeVideo = (localId: string) =>
    setVideos(prev => prev.filter(v => v.localId !== localId));

  const updateVideo = (localId: string, patch: Partial<VideoItem>) =>
    setVideos(prev => prev.map(v => v.localId === localId ? { ...v, ...patch } : v));

  // ── Upload sequencial ───────────────────────────────────────────────────
  const uploadAll = async () => {
    if (!selectedModel) return;
    const toUpload = videos.filter(
      v => v.status === "idle" && v.title.trim() && v.category,
    );
    if (!toUpload.length) return;

    setUploading(true);
    setDone(false);
    setProgress({ current: 0, total: toUpload.length });

    for (let i = 0; i < toUpload.length; i++) {
      const item = toUpload[i];
      setProgress({ current: i + 1, total: toUpload.length });
      updateVideo(item.localId, { status: "uploading", errorMsg: null });

      try {
        // 1. Upload do vídeo
        const videoId   = crypto.randomUUID();
        const safeFile  = sanitizeFileName(item.file.name);
        const videoPath = `${selectedModel.id}/${videoId}/${safeFile}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("video-uploads")
          .upload(videoPath, item.file, { cacheControl: "3600", upsert: true });
        if (uploadErr) throw new Error(uploadErr.message);

        // 2. Signed URL (~10 anos)
        const { data: signed, error: signErr } = await supabase.storage
          .from("video-uploads")
          .createSignedUrl(uploadData.path, 315_360_000);
        if (signErr || !signed?.signedUrl) throw new Error("Erro ao gerar URL do vídeo.");
        const videoUrl = signed.signedUrl;

        // 3. Extrair thumbnail (frame a 50% = índice 1) — nunca bloqueia
        let thumbnailUrl: string | null = null;
        try {
          const frames    = await extractVideoFrames(item.file);
          const thumbBlob = frames[1] ?? frames[0] ?? null;
          if (thumbBlob) {
            // 4. Upload da thumbnail para bucket público 'thumbnails'
            const thumbPath = `auto/${videoId}.jpg`;
            const { error: thumbErr } = await supabase.storage
              .from("thumbnails")
              .upload(thumbPath, thumbBlob, { contentType: "image/jpeg", upsert: true });
            if (!thumbErr) {
              const { data: urlData } = supabase.storage
                .from("thumbnails")
                .getPublicUrl(thumbPath);
              thumbnailUrl = urlData.publicUrl ?? null;
            }
          }
        } catch {
          thumbnailUrl = null;
        }

        // 5. INSERT na tabela videos
        const { error: dbErr } = await supabase.from("videos").insert({
          id:             videoId,
          user_id:        selectedModel.id,
          model_username: selectedModel.username,
          title:          item.title.trim(),
          category:       item.category,
          video_url:      videoUrl,
          thumbnail_url:  thumbnailUrl,
          status:         "published",
          visibility:     "public",
          storage_path:   videoPath,
        });
        if (dbErr) throw new Error(dbErr.message);

        updateVideo(item.localId, { status: "done" });
      } catch (err: any) {
        console.error("[UploadModelVideos] failed:", item.file.name, err);
        updateVideo(item.localId, {
          status: "error",
          errorMsg: err?.message || "Erro desconhecido.",
        });
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

  // ── Acesso negado / loading ─────────────────────────────────────────────
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

  // Contagens
  const doneCount  = videos.filter(v => v.status === "done").length;
  const errCount   = videos.filter(v => v.status === "error").length;
  const readyCount = videos.filter(v => v.status === "idle" && v.title.trim() && v.category).length;

  // ─────────────────────────────────────────────
  // Layout principal
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
              Selecciona o modelo e publica até {MAX_VIDEOS} vídeos directamente no seu perfil
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
              /* Modelo seleccionado */
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
                    onClick={() => { setSelectedModel(null); setVideos([]); setDone(false); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.40)" }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            ) : (
              /* Selector de modelo */
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
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
                    {filteredProfiles.length === 0 ? (
                      <p className="text-center py-6 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {search ? "Sem resultados para essa pesquisa." : "Sem modelos disponíveis."}
                      </p>
                    ) : filteredProfiles.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedModel(p); setSearch(""); }}
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StepBadge n={2} />
                  <h2 className="text-sm font-black text-white">Seleccionar Vídeos</h2>
                </div>
                <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {videos.length} / {MAX_VIDEOS} vídeos seleccionados
                </span>
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
                      Até {MAX_VIDEOS - videos.length} vídeo{MAX_VIDEOS - videos.length !== 1 ? "s" : ""} em simultâneo · MP4, MOV, AVI
                    </p>
                  </div>
                </label>
              )}

              {/* Lista de vídeos */}
              {videos.length > 0 && (
                <div className="space-y-2">
                  {videos.map(item => {
                    const isUploading = item.status === "uploading";
                    const isDone      = item.status === "done";
                    const isError     = item.status === "error";

                    return (
                      <div key={item.localId} className="rounded-xl overflow-hidden"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: isDone  ? "1px solid rgba(52,211,153,0.20)"
                            : isError     ? "1px solid rgba(239,68,68,0.20)"
                            : isUploading ? "1px solid rgba(236,72,153,0.15)"
                            : "1px solid rgba(255,255,255,0.07)",
                        }}>

                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Status icon */}
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: isDone      ? "rgba(52,211,153,0.15)"
                                : isError     ? "rgba(239,68,68,0.15)"
                                : isUploading ? "rgba(236,72,153,0.15)"
                                : "rgba(255,255,255,0.06)",
                            }}>
                            {isDone
                              ? <Check         size={12} style={{ color: "#34d399" }} />
                              : isError
                              ? <AlertTriangle size={11} style={{ color: "#f87171" }} />
                              : isUploading
                              ? <Loader2       size={12} className="animate-spin" style={{ color: "#ec4899" }} />
                              : <Film          size={11} style={{ color: "rgba(255,255,255,0.30)" }} />
                            }
                          </div>

                          {/* Nome do ficheiro */}
                          <p className="text-[10px] truncate flex-shrink-0 hidden sm:block"
                            style={{ color: "rgba(255,255,255,0.30)", maxWidth: "120px" }}>
                            {item.file.name}
                          </p>

                          {/* Título */}
                          <input
                            value={item.title}
                            onChange={e => updateVideo(item.localId, { title: e.target.value })}
                            disabled={isUploading || isDone}
                            placeholder="Título do vídeo..."
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-white text-xs focus:outline-none disabled:opacity-50"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                          />

                          {/* Categoria */}
                          <div className="w-44 flex-shrink-0">
                            <select
                              value={item.category}
                              onChange={e => updateVideo(item.localId, { category: e.target.value })}
                              disabled={isUploading || isDone}
                              className="w-full px-2.5 py-1.5 rounded-lg text-white text-xs focus:outline-none disabled:opacity-50"
                              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                            >
                              <option value="">Categoria...</option>
                              {CATEGORY_GROUPS.map(g => (
                                <optgroup key={g.group} label={g.group}>
                                  {g.items.map(it => (
                                    <option key={it.id} value={it.id}>{it.label}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>

                          {/* Remover */}
                          {!isUploading && !isDone && (
                            <button
                              onClick={() => removeVideo(item.localId)}
                              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                              style={{ background: "rgba(239,68,68,0.10)", color: "rgba(239,68,68,0.55)" }}>
                              <X size={10} />
                            </button>
                          )}
                        </div>

                        {/* Mensagem de erro */}
                        {isError && item.errorMsg && (
                          <div className="px-4 pb-2.5 flex items-center gap-1.5 text-[10px]"
                            style={{ color: "#f87171" }}>
                            <AlertTriangle size={9} className="flex-shrink-0" />
                            {item.errorMsg}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    A publicar {progress.current} / {progress.total}...
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
                  <span className="font-bold text-white">{readyCount}</span> de {videos.length} vídeo{videos.length !== 1 ? "s" : ""} prontos para publicar
                  {errCount > 0 && (
                    <span className="ml-2 text-xs" style={{ color: "#f87171" }}>
                      · {errCount} com erro
                    </span>
                  )}
                </div>
                <button
                  onClick={uploadAll}
                  disabled={uploading || !readyCount}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black transition-all"
                  style={{
                    background: uploading || !readyCount
                      ? "rgba(255,255,255,0.06)"
                      : "linear-gradient(90deg,#ec4899,#9333ea)",
                    cursor: uploading || !readyCount ? "not-allowed" : "pointer",
                    opacity: uploading || !readyCount ? 0.5 : 1,
                  }}
                >
                  {uploading
                    ? <><Loader2 size={14} className="animate-spin" /> A publicar...</>
                    : <><Upload size={14} /> Publicar todos os vídeos</>
                  }
                </button>
              </div>

              {!readyCount && !uploading && (
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Cada vídeo precisa de <strong>título</strong> e <strong>categoria</strong> para ser publicado.
                </p>
              )}
            </div>
          )}

          {/* ── Concluído ───────────────────────────────────────────────── */}
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
                  <span className="text-white/70 font-semibold">
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
