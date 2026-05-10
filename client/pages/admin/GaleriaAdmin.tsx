// client/pages/admin/GaleriaAdmin.tsx
// Painel de gestão da galeria — apenas admins (role='admin')
//
// ESTRUTURA DE STORAGE:
//   Bucket galeria-thumbs (público):   {packId}/thumb.{ext}  → thumbnail_url guardado em galeria_packs
//   Bucket galeria-fotos (privado):    {packId}/{uuid}.{ext} → storage_path guardado em galeria_fotos
//
// FLUXO DE UPLOAD:
//   1. Criar / seleccionar pack
//   2. Upload de thumbnail → URL pública guardada em galeria_packs.thumbnail_url
//   3. Upload de fotos → storage_path em galeria_fotos + incrementa fotos_count
//   4. Editar legenda, ordem, is_preview por foto
//   5. Eliminar fotos (storage + DB)

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import {
  Plus, Upload, Trash2, ChevronLeft, ChevronRight,
  ImageIcon, Crown, Check, X, Eye, EyeOff,
  Flame, Sparkles, Edit2, Save, Loader2, RefreshCw,
  FolderOpen, Shield,
} from "lucide-react";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
type Pack = {
  id: string;
  titulo: string;
  descricao: string | null;
  thumbnail_url: string | null;
  categoria: string;
  etiqueta: string | null;
  is_premium: boolean;
  destaque: boolean;
  fotos_count: number;
  views: number;
  created_at: string;
};

type Foto = {
  id: string;
  storage_path: string;
  foto_url: string;
  ordem: number;
  is_preview: boolean;
  legenda: string | null;
};

type PackFormData = {
  titulo: string;
  descricao: string;
  categoria: string;
  etiqueta: string;
  is_premium: boolean;
  destaque: boolean;
};

const EMPTY_FORM: PackFormData = {
  titulo: "", descricao: "", categoria: "Geral",
  etiqueta: "Normal", is_premium: true, destaque: false,
};

const ETIQUETAS = ["Normal", "Exclusivo", "Raro", "Hot"];
const CATEGORIAS = ["Geral", "Modelos", "Influencers", "Amador", "Outros"];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

function thumbPublicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/galeria-thumbs/${path}`;
}

// ─────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────
function ext(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "jpg";
}

function uuid4() {
  return crypto.randomUUID();
}

// ─────────────────────────────────────────────
// Indicador de upload
// ─────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${value}%`, background: "linear-gradient(90deg,#ec4899,#9333ea)" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Card de pack na lista lateral
// ─────────────────────────────────────────────
function PackListItem({
  pack, selected, onClick,
}: { pack: Pack; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
      style={selected
        ? { background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.25)" }
        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.06)" }}>
        {pack.thumbnail_url
          ? <img src={pack.thumbnail_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={14} style={{ color: "rgba(255,255,255,0.20)" }} />
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black truncate"
          style={{ color: selected ? "#ec4899" : "rgba(255,255,255,0.75)" }}>
          {pack.titulo}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
          {pack.fotos_count} fotos · {pack.etiqueta ?? "—"}
        </p>
      </div>
      {pack.destaque && <Flame size={11} style={{ color: "#fbbf24", flexShrink: 0 }} />}
    </button>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function GaleriaAdmin() {
  // ── Estado ─────────────────────────────────────────────────────────
  const [isAdmin, setIsAdmin]     = useState<boolean | null>(null);
  const [packs, setPacks]         = useState<Pack[]>([]);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [fotos, setFotos]         = useState<Foto[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [loadingFotos, setLoadingFotos] = useState(false);

  // Formulário novo pack
  const [showNewPack, setShowNewPack] = useState(false);
  const [form, setForm]           = useState<PackFormData>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  // Upload de thumbnail
  const thumbInputRef             = useRef<HTMLInputElement>(null);
  const [thumbUploading, setThumbUploading] = useState(false);

  // Upload de fotos
  const photoInputRef             = useRef<HTMLInputElement>(null);
  const [photoProgress, setPhotoProgress] = useState<number>(0);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  // Edição inline de legenda/ordem
  const [editingFoto, setEditingFoto] = useState<string | null>(null);
  const [editLegenda, setEditLegenda] = useState("");

  // ── Verificar se é admin ────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) { setIsAdmin(false); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", uid).single();
      setIsAdmin(profile?.role === "admin");
    });
  }, []);

  // ── Carregar packs ──────────────────────────────────────────────────
  const fetchPacks = useCallback(async () => {
    setLoadingPacks(true);
    const { data } = await supabase
      .from("galeria_packs")
      .select("*")
      .order("created_at", { ascending: false });
    setPacks((data ?? []) as Pack[]);
    setLoadingPacks(false);
  }, []);

  useEffect(() => { if (isAdmin) fetchPacks(); }, [isAdmin, fetchPacks]);

  // ── Carregar fotos do pack seleccionado ─────────────────────────────
  const fetchFotos = useCallback(async (pack: Pack) => {
    setLoadingFotos(true);
    const { data } = await supabase
      .from("galeria_fotos")
      .select("id, storage_path, ordem, is_preview, legenda")
      .eq("pack_id", pack.id)
      .order("ordem", { ascending: true });

    const rawFotos = (data ?? []) as Omit<Foto, "foto_url">[];

    // Signed URLs para preview (30s)
    const paths = rawFotos.map(f => f.storage_path).filter(Boolean);
    const signedMap = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("galeria-fotos")
        .createSignedUrls(paths, 30);
      if (signed) {
        for (const item of signed) {
          if (item.signedUrl) signedMap.set(item.path, item.signedUrl);
        }
      }
    }

    setFotos(rawFotos.map(f => ({
      ...f,
      foto_url: signedMap.get(f.storage_path) ?? "",
    })));
    setLoadingFotos(false);
  }, []);

  useEffect(() => {
    if (selectedPack) fetchFotos(selectedPack);
  }, [selectedPack, fetchFotos]);

  // ── Criar pack ─────────────────────────────────────────────────────
  const handleCreatePack = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("galeria_packs")
      .insert({
        titulo:     form.titulo.trim(),
        descricao:  form.descricao.trim() || null,
        categoria:  form.categoria,
        etiqueta:   form.etiqueta,
        is_premium: form.is_premium,
        destaque:   form.destaque,
        fotos_count: 0,
        views:       0,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      await fetchPacks();
      setSelectedPack(data as Pack);
      setShowNewPack(false);
      setForm(EMPTY_FORM);
    }
  };

  // ── Upload thumbnail ────────────────────────────────────────────────
  const handleThumbUpload = async (file: File) => {
    if (!selectedPack) return;
    setThumbUploading(true);

    const path = `${selectedPack.id}/thumb.${ext(file)}`;
    const { error } = await supabase.storage
      .from("galeria-thumbs")
      .upload(path, file, { upsert: true });

    if (!error) {
      const url = thumbPublicUrl(path);
      await supabase.from("galeria_packs")
        .update({ thumbnail_url: url })
        .eq("id", selectedPack.id);
      setSelectedPack(prev => prev ? { ...prev, thumbnail_url: url } : null);
      setPacks(prev => prev.map(p => p.id === selectedPack.id ? { ...p, thumbnail_url: url } : p));
    }
    setThumbUploading(false);
  };

  // ── Upload fotos ────────────────────────────────────────────────────
  const handlePhotoUpload = async (files: FileList) => {
    if (!selectedPack) return;
    setPhotoUploading(true);
    setPhotoProgress(0);

    const fileArr = Array.from(files);
    let uploaded = 0;

    // Determinar próxima ordem
    const maxOrdem = fotos.length > 0 ? Math.max(...fotos.map(f => f.ordem)) : -1;

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      const id   = uuid4();
      const path = `${selectedPack.id}/${id}.${ext(file)}`;

      setUploadMsg(`A carregar ${i + 1}/${fileArr.length}: ${file.name}`);

      const { error: storageErr } = await supabase.storage
        .from("galeria-fotos")
        .upload(path, file, { upsert: false });

      if (!storageErr) {
        const { error: dbErr } = await supabase
          .from("galeria_fotos")
          .insert({
            pack_id:      selectedPack.id,
            foto_url:     "",
            storage_path: path,
            ordem:        maxOrdem + 1 + i,
            is_preview:   false,
            legenda:      null,
          });

        if (!dbErr) {
          await supabase
            .from("galeria_packs")
            .update({ fotos_count: fotos.length + uploaded + 1 })
            .eq("id", selectedPack.id);
          uploaded++;
        }
      }

      setPhotoProgress(Math.round(((i + 1) / fileArr.length) * 100));
    }

    setUploadMsg(`${uploaded} de ${fileArr.length} fotos carregadas.`);
    await fetchFotos(selectedPack);
    await fetchPacks();
    setPhotoUploading(false);
  };

  // ── Toggle is_preview ───────────────────────────────────────────────
  const togglePreview = async (foto: Foto) => {
    await supabase.from("galeria_fotos")
      .update({ is_preview: !foto.is_preview })
      .eq("id", foto.id);
    setFotos(prev => prev.map(f => f.id === foto.id ? { ...f, is_preview: !f.is_preview } : f));
  };

  // ── Guardar legenda ─────────────────────────────────────────────────
  const saveLegenda = async (fotoId: string) => {
    await supabase.from("galeria_fotos")
      .update({ legenda: editLegenda || null })
      .eq("id", fotoId);
    setFotos(prev => prev.map(f => f.id === fotoId ? { ...f, legenda: editLegenda || null } : f));
    setEditingFoto(null);
  };

  // ── Mover foto (ordem) ──────────────────────────────────────────────
  const movePhoto = async (foto: Foto, dir: "up" | "down") => {
    const idx = fotos.findIndex(f => f.id === foto.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= fotos.length) return;

    const other = fotos[swapIdx];
    const [newOrdemA, newOrdemB] = [other.ordem, foto.ordem];

    await Promise.all([
      supabase.from("galeria_fotos").update({ ordem: newOrdemA }).eq("id", foto.id),
      supabase.from("galeria_fotos").update({ ordem: newOrdemB }).eq("id", other.id),
    ]);

    const newFotos = [...fotos];
    newFotos[idx] = { ...foto, ordem: newOrdemA };
    newFotos[swapIdx] = { ...other, ordem: newOrdemB };
    newFotos.sort((a, b) => a.ordem - b.ordem);
    setFotos(newFotos);
  };

  // ── Eliminar foto ───────────────────────────────────────────────────
  const deleteFoto = async (foto: Foto) => {
    if (!selectedPack) return;
    if (!confirm(`Eliminar foto? Esta acção é irreversível.`)) return;

    await supabase.storage.from("galeria-fotos").remove([foto.storage_path]);
    await supabase.from("galeria_fotos").delete().eq("id", foto.id);
    await supabase.from("galeria_packs")
      .update({ fotos_count: Math.max(0, fotos.length - 1) })
      .eq("id", selectedPack.id);

    setFotos(prev => prev.filter(f => f.id !== foto.id));
    await fetchPacks();
  };

  // ── Toggle destaque do pack ─────────────────────────────────────────
  const toggleDestaque = async (pack: Pack) => {
    await supabase.from("galeria_packs")
      .update({ destaque: !pack.destaque })
      .eq("id", pack.id);
    const updated = { ...pack, destaque: !pack.destaque };
    setPacks(prev => prev.map(p => p.id === pack.id ? updated : p));
    if (selectedPack?.id === pack.id) setSelectedPack(updated);
  };

  // ── Eliminar pack ───────────────────────────────────────────────────
  const deletePack = async (pack: Pack) => {
    if (!confirm(`Eliminar pack "${pack.titulo}" e todas as suas fotos? Acção irreversível.`)) return;

    // Eliminar fotos do storage
    const { data: fotosData } = await supabase
      .from("galeria_fotos")
      .select("storage_path")
      .eq("pack_id", pack.id);

    if (fotosData && fotosData.length > 0) {
      await supabase.storage.from("galeria-fotos")
        .remove(fotosData.map((f: { storage_path: string }) => f.storage_path));
    }

    // Eliminar thumbnail
    if (pack.thumbnail_url) {
      const thumbPath = `${pack.id}/thumb`;
      await supabase.storage.from("galeria-thumbs").remove([thumbPath]);
    }

    await supabase.from("galeria_packs").delete().eq("id", pack.id);
    setPacks(prev => prev.filter(p => p.id !== pack.id));
    if (selectedPack?.id === pack.id) { setSelectedPack(null); setFotos([]); }
  };

  // ── Bloco de acesso negado ──────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // Layout principal
  // ─────────────────────────────────────────────
  return (
    <LayoutAuthenticated>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={18} style={{ color: "#ec4899" }} />
              <h1 className="text-xl font-black text-white">Gestão da Galeria</h1>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              {packs.length} packs · {packs.reduce((s, p) => s + p.fotos_count, 0)} fotos no total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/upload-videos"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              <Upload size={13} /> Upload de Vídeos
            </Link>
            <Link
              to="/admin/regenerar-thumbnails"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              <ImageIcon size={13} /> Regenerar Thumbnails
            </Link>
            <button
              onClick={() => setShowNewPack(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-black transition-all hover:opacity-90"
              style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)" }}
            >
              <Plus size={13} /> Novo Pack
            </button>
          </div>
        </div>

        <div className="flex gap-5" style={{ alignItems: "flex-start" }}>

          {/* ── Coluna esquerda: lista de packs ────────────────────── */}
          <div className="w-60 flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.25)" }}>Packs</p>
              <button onClick={fetchPacks} disabled={loadingPacks}
                className="text-white/25 hover:text-white/50 transition-colors">
                <RefreshCw size={11} className={loadingPacks ? "animate-spin" : ""} />
              </button>
            </div>

            {loadingPacks ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)" }} />
              ))
            ) : packs.length === 0 ? (
              <div className="py-8 text-center">
                <FolderOpen size={24} className="mx-auto mb-2" style={{ color: "rgba(255,255,255,0.12)" }} />
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>Sem packs.</p>
              </div>
            ) : (
              packs.map(pack => (
                <PackListItem
                  key={pack.id}
                  pack={pack}
                  selected={selectedPack?.id === pack.id}
                  onClick={() => setSelectedPack(pack)}
                />
              ))
            )}
          </div>

          {/* ── Área principal ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Nenhum pack seleccionado */}
            {!selectedPack && !showNewPack && (
              <div className="flex flex-col items-center justify-center py-32 rounded-2xl gap-4"
                style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                <ImageIcon size={36} style={{ color: "rgba(255,255,255,0.10)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Selecciona um pack ou cria um novo
                </p>
                <button onClick={() => setShowNewPack(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-black"
                  style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.20)" }}>
                  <Plus size={13} /> Criar Pack
                </button>
              </div>
            )}

            {/* ── Formulário novo pack ──────────────────────────────── */}
            {showNewPack && (
              <div className="rounded-2xl p-6 space-y-5"
                style={{ background: "linear-gradient(135deg,#0f0218,#1a0830)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-white">Novo Pack</h2>
                  <button onClick={() => setShowNewPack(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.30)" }}>
                    <X size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Título */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: "rgba(255,255,255,0.35)" }}>Título *</label>
                    <input
                      value={form.titulo}
                      onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                      placeholder="Nome do pack..."
                      className="w-full px-3 py-2 rounded-xl text-white text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                    />
                  </div>

                  {/* Descrição */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: "rgba(255,255,255,0.35)" }}>Descrição</label>
                    <textarea
                      value={form.descricao}
                      onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                      rows={2}
                      placeholder="Descrição opcional..."
                      className="w-full px-3 py-2 rounded-xl text-white text-sm focus:outline-none resize-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: "rgba(255,255,255,0.35)" }}>Categoria</label>
                    <select
                      value={form.categoria}
                      onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-white text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Etiqueta */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block"
                      style={{ color: "rgba(255,255,255,0.35)" }}>Etiqueta</label>
                    <select
                      value={form.etiqueta}
                      onChange={e => setForm(f => ({ ...f, etiqueta: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-white text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                      {ETIQUETAS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="sm:col-span-2 flex gap-4">
                    {[
                      { key: "is_premium" as const, label: "Premium (requer subscrição)" },
                      { key: "destaque"   as const, label: "Destaque (aparece em primeiro)" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                        <div
                          onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                          className="w-9 h-5 rounded-full transition-all relative flex-shrink-0"
                          style={form[key]
                            ? { background: "linear-gradient(90deg,#ec4899,#9333ea)" }
                            : { background: "rgba(255,255,255,0.10)" }}>
                          <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                            style={{ left: form[key] ? "calc(100% - 18px)" : "2px" }} />
                        </div>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNewPack(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.40)" }}>
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreatePack}
                    disabled={saving || !form.titulo.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-black transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)" }}>
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Criar Pack
                  </button>
                </div>
              </div>
            )}

            {/* ── Detalhe do pack seleccionado ─────────────────────── */}
            {selectedPack && (
              <div className="space-y-5">

                {/* Header do pack */}
                <div className="rounded-2xl p-5"
                  style={{ background: "linear-gradient(135deg,#0f0218,#1a0830)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start gap-4">

                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0 group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {selectedPack.thumbnail_url
                          ? <img src={selectedPack.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={20} style={{ color: "rgba(255,255,255,0.15)" }} />
                            </div>
                        }
                      </div>
                      <button
                        onClick={() => thumbInputRef.current?.click()}
                        disabled={thumbUploading}
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.60)" }}>
                        {thumbUploading
                          ? <Loader2 size={14} className="animate-spin text-white" />
                          : <Upload size={14} className="text-white" />
                        }
                      </button>
                      <input
                        ref={thumbInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleThumbUpload(e.target.files[0]); }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {selectedPack.etiqueta && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black"
                            style={{ background: "rgba(236,72,153,0.15)", color: "#ec4899", border: "1px solid rgba(236,72,153,0.25)" }}>
                            {selectedPack.etiqueta}
                          </span>
                        )}
                        {selectedPack.is_premium && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black"
                            style={{ background: "rgba(147,51,234,0.15)", color: "#a855f7", border: "1px solid rgba(147,51,234,0.25)" }}>
                            Premium
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-black text-white">{selectedPack.titulo}</h2>
                      {selectedPack.descricao && (
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {selectedPack.descricao}
                        </p>
                      )}
                      <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {fotos.length} fotos · {selectedPack.views} vistas
                      </p>
                    </div>

                    {/* Acções */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleDestaque(selectedPack)}
                        title={selectedPack.destaque ? "Remover destaque" : "Marcar destaque"}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={selectedPack.destaque
                          ? { background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.30)", color: "#fbbf24" }
                          : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }}>
                        <Flame size={13} />
                      </button>
                      <button
                        onClick={() => deletePack(selectedPack)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.50)" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload de fotos */}
                <div className="rounded-2xl p-5 space-y-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-white/60 uppercase tracking-widest">Upload de Fotos</p>
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-black transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)" }}>
                      {photoUploading
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Upload size={11} />
                      }
                      Adicionar fotos
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => { if (e.target.files?.length) handlePhotoUpload(e.target.files); }}
                    />
                  </div>

                  {photoUploading && (
                    <div className="space-y-1.5">
                      <ProgressBar value={photoProgress} />
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{uploadMsg}</p>
                    </div>
                  )}

                  {!photoUploading && uploadMsg && (
                    <p className="text-[10px] flex items-center gap-1.5" style={{ color: "#34d399" }}>
                      <Check size={10} /> {uploadMsg}
                    </p>
                  )}

                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                    Aceita múltiplos ficheiros. JPG, PNG, WebP recomendados.
                    Bucket: <code>galeria-fotos/{selectedPack.id}/</code>
                  </p>
                </div>

                {/* Grelha de fotos */}
                {loadingFotos ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="aspect-square rounded-xl animate-pulse"
                        style={{ background: "rgba(255,255,255,0.04)" }} />
                    ))}
                  </div>
                ) : fotos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 rounded-2xl gap-3"
                    style={{ border: "1px dashed rgba(255,255,255,0.06)" }}>
                    <ImageIcon size={32} style={{ color: "rgba(255,255,255,0.08)" }} />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.20)" }}>
                      Ainda sem fotos. Faz upload acima.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {fotos.map((foto, idx) => (
                      <div
                        key={foto.id}
                        className="group relative aspect-square rounded-xl overflow-hidden"
                        style={{ border: foto.is_preview ? "1px solid rgba(52,211,153,0.35)" : "1px solid rgba(255,255,255,0.06)" }}
                      >
                        {/* Imagem */}
                        {foto.foto_url
                          ? <img src={foto.foto_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center"
                              style={{ background: "rgba(255,255,255,0.03)" }}>
                              <ImageIcon size={16} style={{ color: "rgba(255,255,255,0.15)" }} />
                            </div>
                        }

                        {/* Overlay no hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col"
                          style={{ background: "rgba(0,0,0,0.75)" }}>

                          {/* Toolbar */}
                          <div className="flex items-center justify-between p-1.5 gap-1">
                            {/* Preview toggle */}
                            <button
                              onClick={() => togglePreview(foto)}
                              title={foto.is_preview ? "Remover preview" : "Marcar como preview"}
                              className="w-6 h-6 rounded flex items-center justify-center transition-all"
                              style={foto.is_preview
                                ? { background: "rgba(52,211,153,0.25)", color: "#34d399" }
                                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.40)" }}>
                              {foto.is_preview ? <Eye size={10} /> : <EyeOff size={10} />}
                            </button>

                            {/* Move up */}
                            <button
                              onClick={() => movePhoto(foto, "up")}
                              disabled={idx === 0}
                              className="w-6 h-6 rounded flex items-center justify-center transition-all disabled:opacity-20"
                              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.50)" }}>
                              <ChevronLeft size={10} />
                            </button>

                            {/* Move down */}
                            <button
                              onClick={() => movePhoto(foto, "down")}
                              disabled={idx === fotos.length - 1}
                              className="w-6 h-6 rounded flex items-center justify-center transition-all disabled:opacity-20"
                              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.50)" }}>
                              <ChevronRight size={10} />
                            </button>

                            {/* Eliminar */}
                            <button
                              onClick={() => deleteFoto(foto)}
                              className="w-6 h-6 rounded flex items-center justify-center transition-all"
                              style={{ background: "rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.70)" }}>
                              <Trash2 size={10} />
                            </button>
                          </div>

                          {/* Legenda */}
                          <div className="flex-1 flex items-end p-1.5">
                            {editingFoto === foto.id ? (
                              <div className="w-full flex gap-1">
                                <input
                                  autoFocus
                                  value={editLegenda}
                                  onChange={e => setEditLegenda(e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter") saveLegenda(foto.id); if (e.key === "Escape") setEditingFoto(null); }}
                                  placeholder="Legenda..."
                                  className="flex-1 px-1.5 py-1 rounded text-[9px] text-white focus:outline-none"
                                  style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}
                                />
                                <button onClick={() => saveLegenda(foto.id)}
                                  className="w-5 h-5 rounded flex items-center justify-center"
                                  style={{ background: "rgba(52,211,153,0.25)", color: "#34d399" }}>
                                  <Save size={8} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingFoto(foto.id); setEditLegenda(foto.legenda ?? ""); }}
                                className="w-full text-left px-1.5 py-1 rounded text-[9px] truncate"
                                style={{ background: "rgba(255,255,255,0.06)", color: foto.legenda ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.25)" }}>
                                <Edit2 size={7} className="inline mr-1" />
                                {foto.legenda ?? "Adicionar legenda..."}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Badge preview */}
                        {foto.is_preview && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black pointer-events-none"
                            style={{ background: "rgba(52,211,153,0.25)", color: "#34d399", border: "1px solid rgba(52,211,153,0.30)" }}>
                            preview
                          </div>
                        )}

                        {/* Número */}
                        <div className="absolute bottom-1 right-1 w-4 h-4 rounded flex items-center justify-center text-[8px] font-black pointer-events-none"
                          style={{ background: "rgba(0,0,0,0.50)", color: "rgba(255,255,255,0.30)" }}>
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Legenda de ícones */}
        <div className="mt-8 flex flex-wrap items-center gap-5 text-[10px]"
          style={{ color: "rgba(255,255,255,0.20)" }}>
          <span className="flex items-center gap-1.5">
            <Eye size={10} style={{ color: "#34d399" }} /> Foto marcada como preview (visível sem subscrição)
          </span>
          <span className="flex items-center gap-1.5">
            <Flame size={10} style={{ color: "#fbbf24" }} /> Pack em destaque
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles size={10} style={{ color: "#ec4899" }} /> Bucket: <code>galeria-fotos</code> (privado) · <code>galeria-thumbs</code> (público)
          </span>
        </div>
      </div>
    </LayoutAuthenticated>
  );
}
