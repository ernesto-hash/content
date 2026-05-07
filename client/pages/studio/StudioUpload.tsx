// src/pages/studio/StudioUpload.tsx
// Upload múltiplo — até 30 vídeos de uma vez
// Cada vídeo tem o seu próprio formulário: título, descrição, categoria, tags, visibilidade, miniatura

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, Loader2, RefreshCw,
  Globe, Link2, Lock, FileVideo, ImageIcon,
  Tag, AlignLeft, Layers, BookOpen, Send,
  Camera, Film, Users, User, Gamepad2, Tv, Drama,
  Headphones, Monitor, Maximize2, Radio, Zap, Podcast,
  ChevronDown, ChevronUp, X, Plus, Trash2, Check,
  PackageOpen, Sparkles,
} from "lucide-react";
import StudioLayout from "@/components/studio/StudioLayout";
import { VideoVisibility } from "@/components/studio/VideoForm";
import { getCurrentUser } from "@/services/auth";
import { supabase } from "@/lib/supabaseClient";
import { generateThumbnail } from "@/utils/generateThumbnail";

const MAX_VIDEOS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
type SlotStatus = "idle" | "uploading" | "done" | "error";

type VideoSlot = {
  id:            string;
  file:          File | null;
  thumbnailFile: File | null;
  title:         string;
  description:   string;
  category:      string;
  tags:          string;
  visibility:    VideoVisibility;
  status:        SlotStatus;
  progress:      number;
  errorMsg:      string | null;
  uploadMsg:     string | null;
  publishedId:   string | null;
  collapsed:     boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Categorias
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_GROUPS = [
  {
    group: "Tipo de Conteúdo", accent: "text-neon-purple",
    items: [
      { id: "amador",       label: "Amador",            icon: <Camera     size={13} /> },
      { id: "profissional", label: "Profissional",      icon: <Film       size={13} /> },
      { id: "casal",        label: "Casal",             icon: <Users      size={13} /> },
      { id: "solo",         label: "Solo",              icon: <User       size={13} /> },
      { id: "grupo",        label: "Grupo",             icon: <Users      size={13} /> },
      { id: "lesbico",      label: "Lésbico",           icon: <Users      size={13} /> },
      { id: "gay",          label: "Gay",               icon: <Users      size={13} /> },
      { id: "trans",        label: "Trans",             icon: <Users      size={13} /> },
      { id: "hentai",       label: "Hentai",            icon: <Gamepad2   size={13} /> },
      { id: "anime",        label: "Anime",             icon: <Tv         size={13} /> },
      { id: "cosplay",      label: "Cosplay",           icon: <Drama      size={13} /> },
      { id: "asmr",         label: "ASMR",              icon: <Headphones size={13} /> },
    ],
  },
  {
    group: "Formato", accent: "text-neon-blue",
    items: [
      { id: "vr",       label: "Realidade Virtual", icon: <Monitor   size={13} /> },
      { id: "4k",       label: "4K Ultra HD",       icon: <Maximize2 size={13} /> },
      { id: "fullhd",   label: "Full HD",           icon: <Film      size={13} /> },
      { id: "ao-vivo",  label: "Ao Vivo",           icon: <Radio     size={13} /> },
      { id: "shorties", label: "Shorties",          icon: <Zap       size={13} /> },
      { id: "podcasts", label: "Podcasts Eróticos", icon: <Podcast   size={13} /> },
    ],
  },
  {
    group: "País", accent: "text-yellow-400",
    items: [
      { id: "angola",   label: "Angola",         icon: <span className="text-xs">🇦🇴</span> },
      { id: "brasil",   label: "Brasil",         icon: <span className="text-xs">🇧🇷</span> },
      { id: "eua",      label: "Estados Unidos", icon: <span className="text-xs">🇺🇸</span> },
      { id: "japao",    label: "Japão",          icon: <span className="text-xs">🇯🇵</span> },
      { id: "italia",   label: "Itália",         icon: <span className="text-xs">🇮🇹</span> },
      { id: "franca",   label: "França",         icon: <span className="text-xs">🇫🇷</span> },
      { id: "espanha",  label: "Espanha",        icon: <span className="text-xs">🇪🇸</span> },
      { id: "alemanha", label: "Alemanha",       icon: <span className="text-xs">🇩🇪</span> },
    ],
  },
];

const ALL_CATS = CATEGORY_GROUPS.flatMap(g => g.items);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function parseTags(input: string): string[] {
  if (!input?.trim()) return [];
  return input.split(",").map(s => s.trim()).filter(Boolean); // ilimitadas
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function makeSlot(file?: File): VideoSlot {
  return {
    id:            crypto.randomUUID(),
    file:          file ?? null,
    thumbnailFile: null,
    title:         file ? file.name.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ") : "",
    description:   "",
    category:      "",
    tags:          "",
    visibility:    "public",
    status:        "idle",
    progress:      0,
    errorMsg:      null,
    uploadMsg:     null,
    publishedId:   null,
    collapsed:     false,
  };
}

// Sanitize file name: keep only safe characters to avoid broken storage paths
function sanitizeFileName(name: string): string {
  const ext = name.match(/\.[^.]+$/)?.[0] ?? "";
  const base = name.slice(0, name.length - ext.length);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_") + ext;
}

// Upload to "video-uploads" (private bucket with creator RLS policies).
// Path MUST start with userId — required by the storage INSERT policy.
// Returns a signed URL (10-year expiry) because getPublicUrl doesn't work on private buckets.
async function uploadToStorage(
  userId: string,
  path: string,
  file: File,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("video-uploads")
    .upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw new Error(error.message ?? "Erro no upload.");

  const { data: signed, error: signErr } = await supabase.storage
    .from("video-uploads")
    .createSignedUrl(data.path, 315_360_000); // ~10 years
  if (signErr || !signed?.signedUrl) throw new Error("Erro ao gerar URL do ficheiro.");
  return signed.signedUrl;
}

async function uploadVideo(userId: string, videoId: string, file: File): Promise<string> {
  const safe = sanitizeFileName(file.name);
  return uploadToStorage(userId, `${userId}/${videoId}/${safe}`, file);
}

async function uploadThumb(userId: string, videoId: string, file: File): Promise<string> {
  const safe = sanitizeFileName(file.name);
  return uploadToStorage(userId, `${userId}/thumbs/${videoId}/${safe}`, file);
}

// ─────────────────────────────────────────────────────────────────────────────
// CategoryPicker
// ─────────────────────────────────────────────────────────────────────────────
function CategoryPicker({ value, onChange, disabled, hasError }: {
  value: string; onChange: (v: string) => void;
  disabled?: boolean; hasError?: boolean;
}) {
  const [open, setOpen]             = useState(false);
  const [style, setStyle]           = useState<React.CSSProperties>({});
  const trigRef                     = useRef<HTMLButtonElement>(null);
  const dropRef                     = useRef<HTMLDivElement>(null);
  const sel                         = ALL_CATS.find(c => c.id === value);

  const openIt = () => {
    if (disabled) return;
    if (trigRef.current) {
      const r = trigRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      if (spaceBelow >= 220) setStyle({ position: "fixed", top: r.bottom + 6, left: r.left, width: r.width, zIndex: 9999 });
      else                   setStyle({ position: "fixed", bottom: window.innerHeight - r.top + 6, left: r.left, width: r.width, zIndex: 9999 });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (dropRef.current?.contains(e.target as Node) || trigRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const closeScroll = (e: Event) => {
      if (dropRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", closeScroll, true);
    window.addEventListener("resize", () => setOpen(false));
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", closeScroll, true);
    };
  }, [open]);

  const portal = open ? createPortal(
    <div ref={dropRef} style={style}
      className="rounded-xl border border-white/12 bg-[#0e0e12] shadow-2xl overflow-hidden"
      onScroll={e => e.stopPropagation()}>
      <div style={{ maxHeight: 280 }} className="overflow-y-auto">
        {value && (
          <button type="button" onMouseDown={e => e.stopPropagation()}
            onClick={() => { onChange(""); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/8 border-b border-white/8 sticky top-0 bg-[#0e0e12] z-10">
            <X size={10} /> Limpar selecção
          </button>
        )}
        {CATEGORY_GROUPS.map(g => (
          <div key={g.group}>
            <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${g.accent} border-b border-white/6 sticky top-0`}
              style={{ background: "#0e0e12" }}>
              {g.group}
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/5">
              {g.items.map(item => {
                const active = value === item.id;
                return (
                  <button key={item.id} type="button"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => { onChange(item.id); setOpen(false); }}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all ${
                      active ? "bg-neon-pink/12 text-neon-pink" : "bg-[#0e0e12] text-foreground/55 hover:bg-white/6 hover:text-foreground"
                    }`}>
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-pink" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button ref={trigRef} type="button" disabled={disabled}
        onClick={open ? () => setOpen(false) : openIt}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs transition-all focus:outline-none disabled:opacity-50 ${
          hasError && !value ? "border-red-500/40 bg-red-500/5"
          : open ? "border-neon-pink/40 bg-white/8"
          : "border-white/10 bg-white/5 hover:border-white/18"
        }`}>
        <span className="flex items-center gap-2 min-w-0">
          {sel
            ? <><span className="text-neon-pink flex-shrink-0">{sel.icon}</span><span className="truncate font-semibold text-foreground">{sel.label}</span></>
            : <span className={hasError && !value ? "text-red-400/70" : "text-foreground/30"}>Selecciona uma categoria...</span>
          }
        </span>
        <ChevronDown size={12} className={`flex-shrink-0 text-foreground/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {portal}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VisibilityPicker
// ─────────────────────────────────────────────────────────────────────────────
const VIS = [
  { value: "public"   as VideoVisibility, icon: <Globe size={12}/>, label: "Público",     cls: "border-neon-pink/40 bg-neon-pink/8 text-neon-pink"       },
  { value: "unlisted" as VideoVisibility, icon: <Link2 size={12}/>, label: "Não listado", cls: "border-neon-purple/40 bg-neon-purple/8 text-neon-purple" },
  { value: "private"  as VideoVisibility, icon: <Lock  size={12}/>, label: "Privado",     cls: "border-white/25 bg-white/8 text-foreground/65"           },
];

function VisibilityPicker({ value, onChange, disabled }: {
  value: VideoVisibility; onChange: (v: VideoVisibility) => void; disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {VIS.map(o => (
        <button key={o.value} type="button" disabled={disabled} onClick={() => onChange(o.value)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-semibold transition-all flex-1 justify-center ${
            value === o.value ? o.cls : "border-white/8 bg-white/3 text-foreground/35 hover:bg-white/6 hover:text-foreground/55"
          }`}>
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoSlotForm — formulário individual de cada vídeo
// ─────────────────────────────────────────────────────────────────────────────
function VideoSlotForm({ slot, index, onUpdate, onRemove, disabled }: {
  slot: VideoSlot; index: number;
  onUpdate: (id: string, p: Partial<VideoSlot>) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-neon-pink/40 focus:bg-white/7 transition-all disabled:opacity-50";

  const isUploading = slot.status === "uploading";
  const isDone      = slot.status === "done";
  const isError     = slot.status === "error";
  const isDisabled  = disabled || isUploading || isDone;

  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!slot.thumbnailFile) { setThumbPreview(null); return; }
    const url = URL.createObjectURL(slot.thumbnailFile);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [slot.thumbnailFile]);

  const badgeColor = isDone ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
    : isError     ? "bg-red-500/15 border-red-500/25 text-red-400"
    : isUploading ? "bg-neon-pink/15 border-neon-pink/25 text-neon-pink"
    : "bg-white/5 border-white/10 text-foreground/40";

  const badgeLabel = isDone ? "Publicado" : isError ? "Erro" : isUploading ? (slot.uploadMsg || "A publicar...") : "Aguarda";

  return (
    <div className={`glass border rounded-2xl overflow-hidden transition-all ${
      isDone ? "border-emerald-500/20" : isError ? "border-red-500/20" : "border-white/10"
    }`}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
          isDone ? "bg-emerald-500/20 text-emerald-400"
          : isError ? "bg-red-500/20 text-red-400"
          : "bg-neon-pink/15 text-neon-pink"
        }`}>
          {isDone ? <Check size={13} /> : isError ? <AlertTriangle size={11} /> : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{slot.file?.name || "Sem ficheiro"}</p>
          <p className="text-[11px] text-foreground/35">
            {slot.file ? fmtBytes(slot.file.size) : "—"}
            {slot.title ? ` · ${slot.title.slice(0, 35)}${slot.title.length > 35 ? "…" : ""}` : ""}
          </p>
        </div>

        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold flex-shrink-0 ${badgeColor}`}>
          {isUploading && <Loader2 size={9} className="animate-spin" />}
          {isDone && <Check size={9} />}
          {badgeLabel}
        </span>

        {!isDone && (
          <button type="button" onClick={() => onUpdate(slot.id, { collapsed: !slot.collapsed })}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-foreground/40 hover:text-foreground/70 transition-colors flex-shrink-0">
            {slot.collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        )}

        {!isUploading && !isDone && (
          <button type="button" onClick={() => onRemove(slot.id)}
            className="w-7 h-7 rounded-lg bg-red-500/8 border border-red-500/15 flex items-center justify-center text-red-400/55 hover:text-red-400 hover:bg-red-500/15 transition-all flex-shrink-0">
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Barra de progresso */}
      {(isUploading || isDone) && (
        <div className="h-0.5 bg-white/5">
          <div className={`h-full transition-all duration-700 ${isDone ? "bg-emerald-500" : "bg-gradient-to-r from-neon-pink to-neon-purple"}`}
            style={{ width: `${slot.progress}%` }} />
        </div>
      )}

      {/* Erro */}
      {isError && slot.errorMsg && (
        <div className="px-5 py-2.5 bg-red-500/5 border-b border-red-500/12 text-xs text-red-400 flex items-center gap-1.5">
          <AlertTriangle size={11} className="flex-shrink-0" />
          <span className="flex-1">{slot.errorMsg}</span>
          {!disabled && (
            <button type="button"
              onClick={() => onUpdate(slot.id, { status: "idle", progress: 0, errorMsg: null })}
              className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 hover:bg-red-500/25 transition-all font-semibold flex-shrink-0">
              <RefreshCw size={9} /> Tentar novamente
            </button>
          )}
        </div>
      )}

      {/* Formulário expandido */}
      {!slot.collapsed && !isDone && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-4">

            {/* Miniatura */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-foreground/55 flex items-center gap-1.5">
                <ImageIcon size={11} /> Miniatura
              </label>
              {thumbPreview ? (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black/20 border border-white/10">
                  <img src={thumbPreview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => onUpdate(slot.id, { thumbnailFile: null })}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/70 border border-white/20 text-white/70 hover:text-white flex items-center justify-center">
                    <X size={9} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1 aspect-video rounded-xl border border-dashed border-white/12 bg-white/3 hover:bg-white/5 hover:border-neon-pink/25 transition-all cursor-pointer">
                  <ImageIcon size={16} className="text-foreground/18" />
                  <span className="text-[10px] text-foreground/28">Adicionar</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => onUpdate(slot.id, { thumbnailFile: e.target.files?.[0] ?? null })} />
                </label>
              )}

              {/* Info do ficheiro */}
              {slot.file && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/4 border border-white/8">
                    <FileVideo size={11} className="text-neon-pink flex-shrink-0" />
                    <p className="text-[10px] text-foreground/50 truncate">{fmtBytes(slot.file.size)}</p>
                  </div>
                  {slot.file.size > 2 * 1024 * 1024 * 1024 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/20 text-amber-400 text-[10px]">
                      <AlertTriangle size={9} className="flex-shrink-0" /> Ficheiro grande (&gt;2 GB)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metadados */}
            <div className="space-y-3">

              {/* Título */}
              <div>
                <label className="text-[11px] font-semibold text-foreground/55 flex items-center gap-1 mb-1.5">
                  <BookOpen size={11} /> Título <span className="text-neon-pink">*</span>
                </label>
                <input type="text" disabled={isDisabled} value={slot.title} maxLength={100}
                  onChange={e => onUpdate(slot.id, { title: e.target.value })}
                  placeholder="Dê um nome ao vídeo"
                  className={inp} />
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[11px] font-semibold text-foreground/55 flex items-center gap-1 mb-1.5">
                  <AlignLeft size={11} /> Descrição
                </label>
                <textarea disabled={isDisabled} value={slot.description} maxLength={2000} rows={2}
                  onChange={e => onUpdate(slot.id, { description: e.target.value })}
                  placeholder="Descreve o conteúdo..."
                  className={`${inp} resize-none`} />
              </div>

              {/* Categoria + Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/55 flex items-center gap-1 mb-1.5">
                    <Layers size={11} /> Categoria <span className="text-neon-pink">*</span>
                  </label>
                  <CategoryPicker value={slot.category}
                    onChange={v => onUpdate(slot.id, { category: v })}
                    disabled={isDisabled} hasError={!slot.category} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-foreground/55 flex items-center gap-1 mb-1.5">
                    <Tag size={11} /> Tags
                    <span className="text-foreground/30 font-normal ml-1">(vírgula · ilimitadas)</span>
                  </label>
                  <input type="text" disabled={isDisabled} value={slot.tags}
                    onChange={e => onUpdate(slot.id, { tags: e.target.value })}
                    placeholder="ex: amador, hd, casal, angola, vazado"
                    className={inp} />
                  {/* Chips de preview das tags */}
                  {slot.tags.trim() && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {parseTags(slot.tags).map(tag => (
                        <span key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-[10px] font-medium">
                          #{tag}
                          <button type="button" onClick={() => {
                            const newTags = parseTags(slot.tags).filter(t => t !== tag).join(", ");
                            onUpdate(slot.id, { tags: newTags });
                          }} className="hover:text-white transition-colors ml-0.5">
                            <X size={8} />
                          </button>
                        </span>
                      ))}
                      <span className="text-[10px] text-foreground/30 self-center">
                        {parseTags(slot.tags).length} tag{parseTags(slot.tags).length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Visibilidade */}
              <div>
                <label className="text-[11px] font-semibold text-foreground/55 flex items-center gap-1 mb-1.5">
                  <Globe size={11} /> Visibilidade
                </label>
                <VisibilityPicker value={slot.visibility}
                  onChange={v => onUpdate(slot.id, { visibility: v })}
                  disabled={isDisabled} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo quando colapsado */}
      {slot.collapsed && !isDone && (
        <div className="px-5 py-2.5 flex items-center gap-4 text-[11px] text-foreground/35">
          {slot.category
            ? <span className="flex items-center gap-1"><Layers size={10} />{ALL_CATS.find(c => c.id === slot.category)?.label}</span>
            : <span className="flex items-center gap-1 text-red-400/55"><AlertTriangle size={10} />Sem categoria</span>
          }
          <span className="flex items-center gap-1">
            {slot.visibility === "public" ? <Globe size={10} /> : slot.visibility === "unlisted" ? <Link2 size={10} /> : <Lock size={10} />}
            {VIS.find(v => v.value === slot.visibility)?.label}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function StudioUpload() {
  const navigate  = useNavigate();
  const dropRef = useRef<HTMLDivElement>(null);

  const [slots, setSlots]         = useState<VideoSlot[]>([]);
  const [dragging, setDragging]   = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [globalMsg, setGlobalMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Contagens
  const total      = slots.length;
  const doneCount  = slots.filter(s => s.status === "done").length;
  const errCount   = slots.filter(s => s.status === "error").length;
  const readyCount = slots.filter(s => s.status === "idle" && s.file && s.title.trim() && s.category).length;
  const allDone    = total > 0 && doneCount === total;

  const updateSlot = useCallback((id: string, patch: Partial<VideoSlot>) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const removeSlot = useCallback((id: string) => {
    setSlots(prev => prev.filter(s => s.id !== id));
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr   = Array.from(files).filter(f => f.type.startsWith("video/"));
    const space = MAX_VIDEOS - slots.length;
    if (space <= 0) return;
    setSlots(prev => [...prev, ...arr.slice(0, space).map(f => makeSlot(f))]);
  }, [slots.length]);

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop      = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const publishAll = async () => {
    let userId = "";
    try {
      const user = await getCurrentUser();
      userId = user.id;
    } catch {
      setGlobalMsg({ type: "err", text: "Não autenticado." });
      return;
    }

    const toPublish = slots.filter(s => s.status === "idle" && s.file && s.title.trim() && s.category);
    if (!toPublish.length) {
      setGlobalMsg({ type: "err", text: "Nenhum vídeo pronto. Verifica título e categoria." });
      return;
    }

    setPublishing(true);
    setGlobalMsg(null);

    let localErrCount = 0;
    const CONCURRENCY = 3;
    const queue = [...toPublish];

    const worker = async () => {
      while (queue.length > 0) {
        const slot = queue.shift()!;
        updateSlot(slot.id, { status: "uploading", progress: 10, errorMsg: null });
        try {
          const tempId = crypto.randomUUID();
          updateSlot(slot.id, { progress: 20 });

          // Upload do vídeo para Supabase Storage
          const videoUrl = await uploadVideo(userId, tempId, slot.file!);
          updateSlot(slot.id, { progress: 60 });

          // Auto-generate thumbnail when none was manually provided
          if (!slot.thumbnailFile) {
            updateSlot(slot.id, { uploadMsg: "A gerar thumbnail automaticamente..." });
            const autoThumb = await generateThumbnail(slot.file!);
            if (autoThumb) {
              slot.thumbnailFile = autoThumb;
            } else {
              console.warn("[StudioUpload] Auto-thumbnail failed for:", slot.file!.name);
            }
            updateSlot(slot.id, { uploadMsg: null });
          }

          // Upload da thumbnail (se existir — manual ou auto-gerada)
          let thumbnailUrl: string | null = null;
          if (slot.thumbnailFile) {
            thumbnailUrl = await uploadThumb(userId, tempId, slot.thumbnailFile);
          }
          updateSlot(slot.id, { progress: 80 });

          // Criar registo na tabela "videos" do Supabase
          const statusVal = slot.visibility === "private" ? "private"
            : slot.visibility === "unlisted" ? "unlisted"
            : "published";

          const { data: videoRecord, error: dbError } = await supabase
            .from("videos")
            .insert({
              user_id: userId,
              title: slot.title || null,
              description: slot.description || null,
              category: slot.category || null,
              tags: parseTags(slot.tags),
              visibility: slot.visibility,
              status: statusVal,
              video_url: videoUrl,
              thumbnail_url: thumbnailUrl,
            })
            .select("id")
            .single();

          if (dbError) throw new Error(dbError.message ?? "Erro ao guardar vídeo.");

          updateSlot(slot.id, { status: "done", progress: 100, publishedId: videoRecord?.id ?? null, collapsed: true });
        } catch (err: any) {
          localErrCount++;
          updateSlot(slot.id, { status: "error", progress: 0, errorMsg: err?.message || "Erro desconhecido." });
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toPublish.length) }, worker));

    setPublishing(false);
    if (localErrCount === 0) {
      setGlobalMsg({ type: "ok", text: `${toPublish.length} vídeo${toPublish.length !== 1 ? "s" : ""} publicado${toPublish.length !== 1 ? "s" : ""} com sucesso!` });
    } else {
      setGlobalMsg({ type: "err", text: `${localErrCount} vídeo${localErrCount !== 1 ? "s" : ""} com erro. Os restantes foram publicados.` });
    }
  };

  return (
    <StudioLayout subtitle="Envie até 30 vídeos de uma vez">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Enviar vídeos</h1>
            <p className="text-sm text-foreground/45 mt-1">
              Selecciona até <strong className="text-foreground/70">30 vídeos</strong> de uma vez e preenche os detalhes de cada um antes de publicar.
            </p>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-neon-pink/8 border border-neon-pink/15 text-neon-pink font-bold">
                {total}/{MAX_VIDEOS} vídeos
              </span>
              {doneCount > 0 && <span className="px-2.5 py-1 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 font-bold">{doneCount} ✓</span>}
              {errCount  > 0 && <span className="px-2.5 py-1 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 font-bold">{errCount} ✗</span>}
            </div>
          )}
        </div>

        {/* Mensagem global */}
        {globalMsg && (
          <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
            globalMsg.type === "ok" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
          }`}>
            {globalMsg.type === "ok"
              ? <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
              : <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
            }
            <p className={`text-sm font-medium flex-1 ${globalMsg.type === "ok" ? "text-emerald-300" : "text-red-300"}`}>
              {globalMsg.text}
            </p>
            <button onClick={() => setGlobalMsg(null)} className="text-foreground/30 hover:text-foreground/60 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Zona de drop — usa <label> para compatibilidade total com mobile (iOS/Android) */}
        {total < MAX_VIDEOS && (
          <label
            ref={dropRef as any}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 py-12 px-6 ${
              dragging
                ? "border-neon-pink/60 bg-neon-pink/5 scale-[1.01]"
                : "border-white/12 bg-white/[0.02] hover:border-neon-pink/30 hover:bg-white/[0.04]"
            }`}>
            {/* input VISÍVEL para mobile — posicionado sobre o label mas transparente */}
            <input
              type="file"
              accept="video/*"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ fontSize: 0 }}
              onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
            />

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all ${
              dragging ? "bg-neon-pink/15 border-neon-pink/30" : "bg-white/5 border-white/10"
            }`}>
              {dragging
                ? <Sparkles size={26} className="text-neon-pink animate-pulse" />
                : <PackageOpen size={26} className="text-foreground/22" />
              }
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-base font-bold text-foreground/80">
                {dragging ? "Larga os ficheiros aqui!" : "Arrasta ou clica para seleccionar"}
              </p>
              <p className="text-sm text-foreground/40">
                Podes seleccionar até{" "}
                <span className="text-neon-pink font-bold">{MAX_VIDEOS - total} vídeo{MAX_VIDEOS - total !== 1 ? "s" : ""}</span>{" "}
                em simultâneo
              </p>
              <p className="text-xs text-foreground/25">MP4, MOV, AVI · Máx. 1 GB por ficheiro</p>
            </div>

            {total > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-foreground/45 relative z-10 pointer-events-none">
                <Plus size={11} /> Adicionar mais ({MAX_VIDEOS - total} disponíveis)
              </div>
            )}
          </label>
        )}

        {/* Lista de slots */}
        {slots.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground/55 flex items-center gap-2">
                <FileVideo size={13} className="text-neon-pink" /> Vídeos seleccionados
              </h2>
              <div className="flex items-center gap-3 text-[11px] text-foreground/35">
                <button type="button" onClick={() => setSlots(p => p.map(s => ({ ...s, collapsed: true })))}
                  className="hover:text-foreground/60 transition-colors flex items-center gap-1">
                  <ChevronUp size={10} /> Minimizar todos
                </button>
                <span className="text-foreground/15">·</span>
                <button type="button" onClick={() => setSlots(p => p.map(s => ({ ...s, collapsed: false })))}
                  className="hover:text-foreground/60 transition-colors flex items-center gap-1">
                  <ChevronDown size={10} /> Expandir todos
                </button>
              </div>
            </div>

            {slots.map((slot, i) => (
              <VideoSlotForm key={slot.id} slot={slot} index={i}
                onUpdate={updateSlot} onRemove={removeSlot}
                disabled={publishing} />
            ))}
          </div>
        )}

        {/* Botão publicar */}
        {slots.length > 0 && !allDone && (
          <div className="glass border border-white/10 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-sm text-foreground/50">
                <p><span className="text-foreground/80 font-semibold">{readyCount}</span> de {total} vídeo{total !== 1 ? "s" : ""} prontos para publicar</p>
                {total - readyCount - doneCount > 0 && (
                  <p className="text-xs text-foreground/30 mt-0.5">{total - readyCount - doneCount} ainda sem título ou categoria</p>
                )}
              </div>
              <button type="button" onClick={publishAll} disabled={!readyCount || publishing}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  readyCount && !publishing
                    ? "bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:opacity-90 shadow-lg shadow-neon-pink/20"
                    : "bg-white/5 border border-white/10 text-foreground/30 cursor-not-allowed"
                }`}>
                {publishing
                  ? <><Loader2 size={15} className="animate-spin" /> A publicar...</>
                  : <><Send size={15} /> Publicar {readyCount > 0 ? readyCount : ""} vídeo{readyCount !== 1 ? "s" : ""}</>
                }
              </button>
            </div>
            {!readyCount && !publishing && (
              <p className="mt-3 text-center text-xs text-foreground/28">
                Cada vídeo precisa de <strong>título</strong> e <strong>categoria</strong> para ser publicado.
              </p>
            )}
          </div>
        )}

        {/* Estado vazio */}
        {slots.length === 0 && (
          <p className="text-center py-6 text-foreground/25 text-sm">
            Ainda não seleccionaste nenhum vídeo. Arrasta ou clica na zona acima.
          </p>
        )}

        {/* Tudo publicado */}
        {allDone && (
          <div className="glass border border-emerald-500/20 rounded-2xl p-7 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle2 size={26} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-black text-foreground">
                {doneCount} vídeo{doneCount !== 1 ? "s" : ""} publicado{doneCount !== 1 ? "s" : ""}!
              </p>
              <p className="text-sm text-foreground/40 mt-1">Já estão disponíveis na plataforma.</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={() => { setSlots([]); setGlobalMsg(null); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-foreground/60 hover:bg-white/10 hover:text-foreground transition-all">
                <Plus size={13} /> Enviar mais
              </button>
              <button type="button" onClick={() => navigate("/studio/videos")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-bold hover:opacity-90 transition-all">
                <Film size={13} /> Ver os meus vídeos
              </button>
            </div>
          </div>
        )}

      </div>
    </StudioLayout>
  );
}