import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Film, Search, Trash2, Eye, Lock, Globe, Pencil, Upload,
  X, Save, ImageIcon, Tag, AlignLeft, Layers, BookOpen,
  CheckCircle2, AlertTriangle, Loader2, Link2, ChevronDown,
  Camera, Users, User, Gamepad2, Tv, Drama, Headphones,
  Monitor, Maximize2, Radio, Zap, Podcast,
} from "lucide-react";
import StudioLayout from "@/components/studio/StudioLayout";
import EmptyState from "@/components/studio/EmptyState";
import { supabase } from "@/lib/supabaseClient";

const THUMB_BUCKET = "thumbnails";

// ─── Types ────────────────────────────────────────────────────────────────────

type Video = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  status: string | null;
  visibility: string | null;
  created_at: string;
  thumbnail_url: string | null;
  views?: number | null;
  video_url?: string | null;
};

type EditState = {
  title: string;
  description: string;
  category: string;
  tags: string;
  visibility: string;
  thumbnailFile: File | null;
  thumbnailPreview: string | null;
  selectedFrameIndex: number | null;
};

// ─── Categorias — sincronizadas com Categorias.tsx ────────────────────────────

const CATEGORY_GROUPS: {
  group: string;
  accent: string;
  items: { id: string; label: string; icon: React.ReactNode }[];
}[] = [
  {
    group: "Tipo de Conteúdo",
    accent: "text-neon-purple",
    items: [
      { id: "amador",       label: "Amador",            icon: <Camera     size={14} /> },
      { id: "profissional", label: "Profissional",      icon: <Film       size={14} /> },
      { id: "casal",        label: "Casal",             icon: <Users      size={14} /> },
      { id: "solo",         label: "Solo",              icon: <User       size={14} /> },
      { id: "grupo",        label: "Grupo",             icon: <Users      size={14} /> },
      { id: "lesbico",      label: "Lésbico",           icon: <Users      size={14} /> },
      { id: "gay",          label: "Gay",               icon: <Users      size={14} /> },
      { id: "trans",        label: "Trans",             icon: <Users      size={14} /> },
      { id: "hentai",       label: "Hentai",            icon: <Gamepad2   size={14} /> },
      { id: "anime",        label: "Anime",             icon: <Tv         size={14} /> },
      { id: "cosplay",      label: "Cosplay",           icon: <Drama      size={14} /> },
      { id: "asmr",         label: "ASMR",              icon: <Headphones size={14} /> },
    ],
  },
  {
    group: "Formato",
    accent: "text-neon-blue",
    items: [
      { id: "vr",       label: "Realidade Virtual", icon: <Monitor   size={14} /> },
      { id: "4k",       label: "4K Ultra HD",       icon: <Maximize2 size={14} /> },
      { id: "fullhd",   label: "Full HD",           icon: <Film      size={14} /> },
      { id: "ao-vivo",  label: "Ao Vivo",           icon: <Radio     size={14} /> },
      { id: "shorties", label: "Shorties",          icon: <Zap       size={14} /> },
      { id: "podcasts", label: "Podcasts Eróticos", icon: <Podcast   size={14} /> },
    ],
  },
  {
    group: "País",
    accent: "text-yellow-400",
    items: [
      { id: "brasil",   label: "Brasil",          icon: <span className="text-sm leading-none">🇧🇷</span> },
      { id: "eua",      label: "Estados Unidos",  icon: <span className="text-sm leading-none">🇺🇸</span> },
      { id: "japao",    label: "Japão",           icon: <span className="text-sm leading-none">🇯🇵</span> },
      { id: "coreia",   label: "Coreia do Sul",   icon: <span className="text-sm leading-none">🇰🇷</span> },
      { id: "italia",   label: "Itália",          icon: <span className="text-sm leading-none">🇮🇹</span> },
      { id: "franca",   label: "França",          icon: <span className="text-sm leading-none">🇫🇷</span> },
      { id: "espanha",  label: "Espanha",         icon: <span className="text-sm leading-none">🇪🇸</span> },
      { id: "alemanha", label: "Alemanha",        icon: <span className="text-sm leading-none">🇩🇪</span> },
    ],
  },
];

const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap((g) => g.items);

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { id: "all",       label: "Todos"        },
  { id: "published", label: "Publicados"   },
  { id: "draft",     label: "Rascunhos"    },
  { id: "private",   label: "Privados"     },
  { id: "unlisted",  label: "Não listados" },
];

const VISIBILITY_OPTIONS = [
  { value: "public",   label: "Público",     icon: <Globe size={15} />, border: "border-neon-pink/50",   bg: "bg-neon-pink/8",   text: "text-neon-pink"     },
  { value: "unlisted", label: "Não listado", icon: <Link2 size={15} />, border: "border-neon-purple/50", bg: "bg-neon-purple/8", text: "text-neon-purple"   },
  { value: "private",  label: "Privado",     icon: <Lock  size={15} />, border: "border-white/25",       bg: "bg-white/8",       text: "text-foreground/70" },
];

const inputBase =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-neon-pink/40 focus:bg-white/8 transition-all duration-200 disabled:opacity-50";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTags(input: string): string[] {
  if (!input?.trim()) return [];
  return input.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── CategoryPicker (portal, scroll-safe) ─────────────────────────────────────

function CategoryPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen]           = useState(false);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
  const triggerRef                = useRef<HTMLButtonElement>(null);
  const dropdownRef               = useRef<HTMLDivElement>(null);
  const selected                  = ALL_CATEGORIES.find((c) => c.id === value);

  const openDropdown = () => {
    if (disabled) return;
    if (triggerRef.current) {
      const rect       = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow >= 200) {
        setDropStyle({ position: "fixed", top: rect.bottom + 6, left: rect.left, width: rect.width, zIndex: 9999 });
      } else {
        setDropStyle({ position: "fixed", bottom: window.innerHeight - rect.top + 6, left: rect.left, width: rect.width, zIndex: 9999 });
      }
    }
    setOpen(true);
  };

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current?.contains(e.target as Node) || triggerRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const dropdown = open
    ? createPortal(
        <div ref={dropdownRef} style={dropStyle} className="rounded-xl border border-white/12 bg-[#0e0e12] shadow-2xl">
          <div style={{ maxHeight: 280 }} className="overflow-y-auto" onScroll={(e) => e.stopPropagation()}>
            {value && (
              <button type="button" onMouseDown={(e) => e.stopPropagation()}
                onClick={() => { onChange(""); close(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/8 border-b border-white/8 transition-all sticky top-0 bg-[#0e0e12] z-10">
                <X size={12} /> Limpar selecção
              </button>
            )}
            {CATEGORY_GROUPS.map((group) => (
              <div key={group.group}>
                <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${group.accent} border-b border-white/6 sticky top-0 bg-[#0e0e12] z-10`}>
                  {group.group}
                </div>
                <div className="grid grid-cols-2 gap-px bg-white/5">
                  {group.items.map((item) => {
                    const isActive = value === item.id;
                    return (
                      <button key={item.id} type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => { onChange(item.id); close(); }}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-all
                          ${isActive ? "bg-neon-pink/12 text-neon-pink" : "bg-[#0e0e12] text-foreground/60 hover:bg-white/6 hover:text-foreground"}`}>
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-pink flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      <button ref={triggerRef} type="button" disabled={disabled}
        onClick={open ? close : openDropdown}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
          ${open ? "border-neon-pink/40 bg-white/8" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"}`}>
        <span className="flex items-center gap-2 min-w-0">
          {selected
            ? <><span className="flex-shrink-0 text-neon-pink">{selected.icon}</span><span className="truncate font-medium text-foreground">{selected.label}</span></>
            : <span className="text-foreground/30">Seleccionar categoria...</span>
          }
        </span>
        <ChevronDown size={14} className={`flex-shrink-0 text-foreground/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {dropdown}
    </div>
  );
}

// ─── StatusDropdown (portal, scroll-safe) ─────────────────────────────────────

function StatusDropdown({
  videoId,
  currentStatus,
  onUpdate,
}: {
  videoId: string;
  currentStatus: string | null;
  onUpdate: (id: string, status: string) => void;
}) {
  const [open, setOpen]           = useState(false);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
  const triggerRef                = useRef<HTMLButtonElement>(null);
  const dropdownRef               = useRef<HTMLDivElement>(null);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect       = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow >= 200) {
        setDropStyle({ position: "fixed", top: rect.bottom + 4, left: rect.left, width: 176, zIndex: 9999 });
      } else {
        setDropStyle({ position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: 176, zIndex: 9999 });
      }
    }
    setOpen(true);
  };

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current?.contains(e.target as Node) || triggerRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const STATUS_OPTIONS = [
    { s: "published", label: "Publicar",    icon: <Globe  size={13} />, cls: "text-neon-pink"     },
    { s: "draft",     label: "Rascunho",    icon: <Pencil size={13} />, cls: "text-foreground/60" },
    { s: "private",   label: "Privado",     icon: <Lock   size={13} />, cls: "text-foreground/60" },
    { s: "unlisted",  label: "Não listado", icon: <Eye    size={13} />, cls: "text-neon-purple"   },
  ];

  const dropdown = open
    ? createPortal(
        <div ref={dropdownRef} style={dropStyle}
          className="rounded-xl border border-white/12 bg-[#0e0e12] shadow-xl overflow-hidden">
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt.s} type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { onUpdate(videoId, opt.s); close(); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-white/8 transition-all ${opt.cls} ${currentStatus === opt.s ? "bg-white/5" : ""}`}>
              {opt.icon} {opt.label}
              {currentStatus === opt.s && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      <button ref={triggerRef} type="button"
        onClick={open ? close : openDropdown}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-foreground/60 hover:text-foreground hover:bg-white/10 transition-all">
        <Globe size={13} /> Status
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {dropdown}
    </div>
  );
}

// ─── Frame extraction from URL (for edit drawer) ─────────────────────────────

async function extractFramesFromUrl(videoUrl: string): Promise<Blob[]> {
  try {
    const res = await fetch(videoUrl, { headers: { Range: "bytes=0-3145728" } });
    if (!res.ok && res.status !== 206) return [];
    const buf    = await res.arrayBuffer();
    const objUrl = URL.createObjectURL(new Blob([buf], { type: "video/mp4" }));

    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload    = "metadata";
      video.muted      = true;
      video.playsInline = true;
      video.src        = objUrl;

      const cleanup = () => URL.revokeObjectURL(objUrl);
      const timeout = setTimeout(() => { cleanup(); resolve([]); }, 30000);

      video.addEventListener("loadedmetadata", () => {
        const dur = video.duration;
        if (!dur || !isFinite(dur)) { clearTimeout(timeout); cleanup(); resolve([]); return; }
        const timestamps = [dur * 0.25, dur * 0.50, dur * 0.75];
        const frames: Blob[] = [];
        let idx = 0;

        function captureNext() {
          if (idx >= timestamps.length) { clearTimeout(timeout); cleanup(); resolve(frames); return; }
          video.currentTime = timestamps[idx];
        }

        video.addEventListener("seeked", () => {
          const canvas = document.createElement("canvas");
          canvas.width  = video.videoWidth  || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((b) => { if (b) frames.push(b); idx++; captureNext(); }, "image/jpeg", 0.85);
        });

        video.addEventListener("error", () => { clearTimeout(timeout); cleanup(); resolve([]); });
        captureNext();
      });

      video.addEventListener("error", () => { clearTimeout(timeout); cleanup(); resolve([]); });
    });
  } catch {
    return [];
  }
}

// ─── Edit Drawer ──────────────────────────────────────────────────────────────

function EditDrawer({
  video,
  onClose,
  onSaved,
}: {
  video: Video;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const drawerRef                     = useRef<HTMLDivElement>(null);
  const [frameBlobs, setFrameBlobs]   = useState<Blob[]>([]);
  const [frameUrls, setFrameUrls]     = useState<string[]>([]);
  const [framesLoading, setFramesLoading] = useState(false);

  const [edit, setEdit] = useState<EditState>({
    title:              video.title       ?? "",
    description:        video.description ?? "",
    category:           video.category    ?? "",
    tags:               (video.tags ?? []).join(", "),
    visibility:         video.visibility  ?? "public",
    thumbnailFile:      null,
    thumbnailPreview:   video.thumbnail_url ?? null,
    selectedFrameIndex: null,
  });

  // Fechar ao clicar fora — mas só se não for dentro de um portal (dropdown)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Ignora cliques em portais (z-index 9999) que estejam fora do drawer
      const target = e.target as HTMLElement;
      if (target.closest("[data-portal]")) return;
      if (drawerRef.current && !drawerRef.current.contains(target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!video.video_url) return;
    setFramesLoading(true);
    extractFramesFromUrl(video.video_url).then((blobs) => {
      setFrameBlobs(blobs);
      setFramesLoading(false);
    });
  }, [video.video_url]);

  useEffect(() => {
    const urls = frameBlobs.map((b) => URL.createObjectURL(b));
    setFrameUrls(urls);
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [frameBlobs]);

  const handleThumbnail = (file: File | null) => {
    if (!file) {
      setEdit((p) => ({ ...p, thumbnailFile: null, thumbnailPreview: video.thumbnail_url ?? null, selectedFrameIndex: null }));
      return;
    }
    setEdit((p) => ({ ...p, thumbnailFile: file, thumbnailPreview: URL.createObjectURL(file), selectedFrameIndex: null }));
  };

  const save = async () => {
    try {
      setSaving(true);
      setMsg(null);

      let thumbnailUrl = video.thumbnail_url;

      if (edit.thumbnailFile) {
        const ext  = (edit.thumbnailFile.name.split(".").pop() || "jpg").toLowerCase();
        const path = `thumbs/${video.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(THUMB_BUCKET)
          .upload(path, edit.thumbnailFile, { upsert: true, contentType: edit.thumbnailFile.type });
        if (upErr) throw upErr;
        thumbnailUrl = supabase.storage.from(THUMB_BUCKET).getPublicUrl(path).data.publicUrl;
      } else if (edit.selectedFrameIndex !== null && frameBlobs[edit.selectedFrameIndex]) {
        const blob = frameBlobs[edit.selectedFrameIndex];
        const path = `auto/${video.id}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(THUMB_BUCKET)
          .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
        if (upErr) throw upErr;
        thumbnailUrl = supabase.storage.from(THUMB_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase
        .from("videos")
        .update({
          title:         edit.title.trim()       || null,
          description:   edit.description.trim() || null,
          category:      edit.category           || null,
          tags:          parseTags(edit.tags),
          visibility:    edit.visibility,
          thumbnail_url: thumbnailUrl,
        })
        .eq("id", video.id);

      if (error) throw error;

      setMsg({ type: "ok", text: "Alterações guardadas com sucesso." });
      setTimeout(() => { onSaved(); onClose(); }, 900);
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Erro ao guardar." });
    } finally {
      setSaving(false);
    }
  };

  const activeVis = VISIBILITY_OPTIONS.find((o) => o.value === edit.visibility)!;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={drawerRef}
        className="relative z-10 w-full max-w-xl h-full bg-[#0e0e12] border-l border-white/10 flex flex-col shadow-2xl"
        style={{ animation: "slideIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center flex-shrink-0">
              <Pencil size={16} className="text-neon-pink" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">Editar vídeo</p>
              <p className="text-xs text-foreground/40 truncate">{video.title || "Sem título"}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-white/10 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {msg && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
              msg.type === "ok"
                ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/8 border-red-500/20 text-red-400"
            }`}>
              {msg.type === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              {msg.text}
            </div>
          )}

          {/* Miniatura */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                <ImageIcon size={13} className="text-foreground/40" /> Miniatura
              </label>
              <span className="text-xs text-foreground/35">JPG, PNG, WEBP</span>
            </div>

            {/* Branch 1: manual file selected */}
            {edit.thumbnailFile ? (
              <div className="relative group aspect-video rounded-xl overflow-hidden bg-black/20 border border-white/10">
                <img src={edit.thumbnailPreview!} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 border border-white/20 text-xs text-white font-medium hover:bg-white/25 transition-all">
                    <ImageIcon size={13} /> Trocar
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => handleThumbnail(e.target.files?.[0] ?? null)} />
                  </label>
                  <button onClick={() => handleThumbnail(null)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-xs text-red-300 font-medium hover:bg-red-500/30 transition-all">
                    <X size={13} /> Remover
                  </button>
                </div>
              </div>

            ) : framesLoading ? (
              /* Branch 2: extracting frames */
              <div className="aspect-video rounded-xl bg-black/20 border border-white/10 flex flex-col items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin text-neon-pink/60" />
                <span className="text-xs text-foreground/35">A extrair frames do vídeo...</span>
              </div>

            ) : frameUrls.length > 0 ? (
              /* Branch 3: frame picker */
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {frameUrls.map((url, i) => {
                    const isSelected = edit.selectedFrameIndex === i;
                    return (
                      <button key={i} type="button"
                        onClick={() => setEdit((p) => ({ ...p, selectedFrameIndex: i, thumbnailFile: null, thumbnailPreview: url }))}
                        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                          isSelected ? "border-neon-pink shadow-lg shadow-neon-pink/20" : "border-white/10 hover:border-white/30"
                        }`}>
                        <img src={url} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-neon-pink/15 flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-neon-pink drop-shadow-lg" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <label className="flex items-center justify-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/60 cursor-pointer transition-colors py-1">
                  <Upload size={12} /> Carregar imagem personalizada
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => handleThumbnail(e.target.files?.[0] ?? null)} />
                </label>
              </div>

            ) : (
              /* Branch 4: fallback manual upload */
              <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl bg-black/20 border border-dashed border-white/15 gap-2 cursor-pointer hover:bg-white/5 hover:border-white/25 transition-all">
                <ImageIcon size={24} className="text-foreground/20" />
                <span className="text-xs text-foreground/35">Clique para adicionar miniatura</span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleThumbnail(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
              <BookOpen size={13} className="text-foreground/40" /> Título
            </label>
            <input type="text" className={inputBase} placeholder="Título do vídeo" maxLength={100}
              value={edit.title}
              onChange={(e) => setEdit((p) => ({ ...p, title: e.target.value }))} />
            <div className="flex justify-end">
              <span className="text-[10px] text-foreground/25">{edit.title.length}/100</span>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
              <AlignLeft size={13} className="text-foreground/40" /> Descrição
            </label>
            <textarea className={`${inputBase} resize-none leading-relaxed`}
              placeholder="Descreva o conteúdo do vídeo..." rows={5} maxLength={5000}
              value={edit.description}
              onChange={(e) => setEdit((p) => ({ ...p, description: e.target.value }))} />
            <div className="flex justify-end">
              <span className="text-[10px] text-foreground/25">{edit.description.length}/5000</span>
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
              <Layers size={13} className="text-foreground/40" /> Categoria
            </label>
            <CategoryPicker
              value={edit.category}
              onChange={(v) => setEdit((p) => ({ ...p, category: v }))}
            />
            {edit.category && (() => {
              const cat = ALL_CATEGORIES.find((c) => c.id === edit.category);
              return cat ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neon-pink/6 border border-neon-pink/15 text-xs text-neon-pink">
                  <span>{cat.icon}</span>
                  <span>Publicado em <strong>{cat.label}</strong></span>
                </div>
              ) : null;
            })()}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
              <Tag size={13} className="text-foreground/40" /> Tags
            </label>
            <input type="text" className={inputBase} placeholder="tag1, tag2..."
              value={edit.tags}
              onChange={(e) => setEdit((p) => ({ ...p, tags: e.target.value }))} />
            {edit.tags.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {parseTags(edit.tags).map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-[11px] font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Visibilidade */}
          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
              <Globe size={13} className="text-foreground/40" /> Visibilidade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITY_OPTIONS.map((opt) => {
                const isActive = edit.visibility === opt.value;
                return (
                  <button key={opt.value} type="button"
                    onClick={() => setEdit((p) => ({ ...p, visibility: opt.value }))}
                    className={`flex flex-col items-center gap-2 px-2 py-3.5 rounded-xl border text-center transition-all focus:outline-none relative
                      ${isActive ? `${opt.bg} ${opt.border}` : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"}`}>
                    <span className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 flex items-center justify-center ${isActive ? opt.border : "border-white/15"}`}>
                      {isActive && <span className={`w-1.5 h-1.5 rounded-full ${opt.value === "public" ? "bg-neon-pink" : opt.value === "unlisted" ? "bg-neon-purple" : "bg-foreground/50"}`} />}
                    </span>
                    <span className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isActive ? `${opt.bg} ${opt.border} ${opt.text}` : "bg-white/5 border-white/8 text-foreground/30"}`}>
                      {opt.icon}
                    </span>
                    <span className={`text-[11px] font-semibold ${isActive ? "text-foreground" : "text-foreground/45"}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs ${
              edit.visibility === "public"   ? "bg-neon-pink/5 border-neon-pink/15 text-neon-pink/70"
              : edit.visibility === "unlisted" ? "bg-neon-purple/5 border-neon-purple/15 text-neon-purple/70"
              : "bg-white/5 border-white/10 text-foreground/40"
            }`}>
              <span className="flex-shrink-0">{activeVis.icon}</span>
              {edit.visibility === "public"   && "Visível para todos e recomendado na plataforma."}
              {edit.visibility === "unlisted" && "Só acessível via link directo — não aparece em pesquisas."}
              {edit.visibility === "private"  && "Apenas você tem acesso a este vídeo."}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/8 flex-shrink-0 bg-[#0e0e12]">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground/60 hover:text-foreground hover:bg-white/10 transition-all font-medium">
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-neon-pink/15">
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
              : <><Save size={15} /> Guardar alterações</>
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function StudioVideos() {
  const [loading, setLoading]     = useState(true);
  const [list, setList]           = useState<Video[]>([]);
  const [query, setQuery]         = useState("");
  const [tab, setTab]             = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((v) => {
      const matchQ   = !q || (v.title || "").toLowerCase().includes(q);
      const matchTab = tab === "all" || (v.status || "") === tab;
      return matchQ && matchTab;
    });
  }, [list, query, tab]);

  const editingVideo = useMemo(
    () => list.find((v) => v.id === editingId) ?? null,
    [list, editingId]
  );

  const load = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getSession();
    const user = auth?.session?.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("videos")
      .select("id,title,description,category,tags,status,visibility,created_at,thumbnail_url,views,video_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setList(error ? [] : (data as unknown as Video[]));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, nextStatus: string) => {
    await supabase.from("videos").update({ status: nextStatus }).eq("id", id);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Tens a certeza que queres eliminar este vídeo? Esta acção é irreversível.")) return;
    await supabase.from("videos").delete().eq("id", id);
    await load();
  };

  return (
    <StudioLayout subtitle="Gerencie seus uploads, rascunhos e publicações">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-foreground">Meus vídeos</h1>
            <p className="text-sm text-foreground/50 mt-1">Edite, filtre, publique e organize os seus vídeos.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Search size={15} className="text-foreground/40 flex-shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30 w-52"
              placeholder="Buscar por título..." />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {STATUS_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setTab(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === f.id
                  ? "bg-neon-pink/15 border border-neon-pink/30 text-foreground"
                  : "text-foreground/55 hover:text-foreground/80 hover:bg-white/5 border border-transparent"
              }`}>
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-foreground/30 whitespace-nowrap pr-1">
            {filtered.length} vídeo{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* List */}
        <div className="glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {tab === "all" ? "Todos os vídeos" : STATUS_FILTERS.find((x) => x.id === tab)?.label}
            </span>
            <a href="/studio/upload"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground/70 hover:text-neon-pink hover:bg-white/10 transition-all">
              <Upload size={15} /> Novo upload
            </a>
          </div>

          <div className="p-4">
            {!loading && filtered.length === 0 ? (
              <EmptyState
                title="Nenhum resultado"
                description="Tente outro filtro ou envie o seu primeiro vídeo."
                icon={<Film size={22} />}
                actionLabel="Enviar vídeo"
                actionTo="/studio/upload"
              />
            ) : (
              <div className="space-y-2.5">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  : filtered.map((v) => (
                      <VideoRow key={v.id} video={v}
                        onEdit={() => setEditingId(v.id)}
                        onUpdateStatus={updateStatus}
                        onRemove={remove}
                      />
                    ))
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {editingVideo && (
        <EditDrawer
          video={editingVideo}
          onClose={() => setEditingId(null)}
          onSaved={load}
        />
      )}
    </StudioLayout>
  );
}

// ─── VideoRow ─────────────────────────────────────────────────────────────────

function VideoRow({
  video: v,
  onEdit,
  onUpdateStatus,
  onRemove,
}: {
  video: Video;
  onEdit: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-3.5 rounded-2xl bg-white/4 border border-white/8 hover:bg-white/7 hover:border-white/14 transition-all">

      {/* Thumbnail + info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-20 h-12 rounded-xl bg-black/20 border border-white/10 overflow-hidden flex items-center justify-center text-foreground/20 flex-shrink-0">
          {v.thumbnail_url
            ? <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
            : <Film size={16} />
          }
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate leading-snug">
            {v.title || "Sem título"}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <StatusPill status={v.status} />
            <span className="text-[11px] text-foreground/30">{fmtDate(v.created_at)}</span>
            {(v.views ?? 0) > 0 && (
              <span className="text-[11px] text-foreground/35 flex items-center gap-1">
                <Eye size={10} /> {v.views}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onEdit}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neon-pink/10 border border-neon-pink/25 text-neon-pink text-xs font-semibold hover:bg-neon-pink/18 transition-all">
          <Pencil size={13} /> Editar
        </button>

        <StatusDropdown
          videoId={v.id}
          currentStatus={v.status}
          onUpdate={onUpdateStatus}
        />

        <button onClick={() => onRemove(v.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/15 text-xs text-red-400 hover:bg-red-500/15 transition-all">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    published: { label: "Publicado",   cls: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" },
    draft:     { label: "Rascunho",    cls: "bg-white/5 border-white/12 text-foreground/45"            },
    private:   { label: "Privado",     cls: "bg-neon-purple/10 border-neon-purple/25 text-neon-purple" },
    unlisted:  { label: "Não listado", cls: "bg-yellow-500/10 border-yellow-500/25 text-yellow-400"    },
  };
  const item = map[status ?? "draft"] ?? map.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold ${item.cls}`}>
      {item.label}
    </span>
  );
}

// ─── SkeletonRow ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="p-3.5 rounded-2xl bg-white/4 border border-white/8 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-20 h-12 rounded-xl bg-white/8 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 bg-white/8 rounded" />
          <div className="h-2.5 w-1/3 bg-white/6 rounded" />
        </div>
        <div className="h-8 w-48 bg-white/8 rounded-xl" />
      </div>
    </div>
  );
}